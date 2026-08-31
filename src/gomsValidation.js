/**
 * Conservative validation and normalization for generated CMN-GOMS.
 *
 * This module deliberately fixes presentation errors only.  It never invents
 * task steps, labels, chunks, timing, or hierarchy; those require a modeller's
 * judgment.
 */
'use strict';

const CANONICAL_OPERATORS = [
  'Goal', 'Also', 'Look', 'Perceptual_processor', 'Proofread', 'Read', 'Search',
  'Saccade', 'Hear', 'Attend', 'Cognitive_processor', 'Initiate', 'Ignore',
  'Mental', 'Recall', 'Store', 'Think', 'Verify', 'Click', 'Drag', 'Grasp',
  'Hands', 'Keystroke', 'Motor_processor', 'Point', 'Swipe', 'Tap', 'Touch',
  'Turn', 'Type', 'Write', 'Say', 'Wait'
];

function normalizeOperatorName(value) {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

function findCanonicalOperator(line) {
  const prefix = line.match(/^(\.*\s*)/);
  const afterIndent = line.slice(prefix ? prefix[0].length : 0);
  for (const operator of [...CANONICAL_OPERATORS].sort((a, b) => b.length - a.length)) {
    const flexibleName = operator.replace(/_/g, '[\\s_-]+');
    if (new RegExp(`^${flexibleName}(?=\\s|:|$)`, 'i').test(afterIndent)) return operator;
  }
  return null;
}

function canonicalizeOperatorPrefix(line) {
  const indent = line.match(/^(\.*\s*)/)?.[0] ?? '';
  const canonical = findCanonicalOperator(line);
  if (!canonical) return { line, repaired: false };
  const flexibleName = canonical.replace(/_/g, '[\\s_-]+');
  const match = line.slice(indent.length).match(new RegExp(`^${flexibleName}(?=\\s|:|$)`, 'i'));
  if (!match) return { line, repaired: false };
  if (match[0] === canonical) return { line, repaired: false };

  return {
    line: `${indent}${canonical}${line.slice(indent.length + match[0].length)}`,
    repaired: true,
  };
}

function isComment(line) {
  return /^\s*\*/.test(line);
}

function isGoal(line) {
  return /^\s*(?:[-•]\s*)?(?:\d+[.)]\s*)?goal\s*:?[\s\S]*$/i.test(line);
}

function isCogulatorLine(line) {
  if (!line.trim() || isComment(line)) return true;
  return Boolean(findCanonicalOperator(line));
}

function normalizeLine(rawLine) {
  let line = rawLine.replace(/\r$/, '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  let repaired = false;

  // Markdown list markers are not part of CMN-GOMS and do not affect meaning.
  const withoutMarker = line.replace(/^(\s*)(?:[-•]\s+|\d+[.)]\s+)/, '$1');
  if (withoutMarker !== line) {
    line = withoutMarker;
    repaired = true;
  }

  // Cogulator uses periods for hierarchy. Convert conventional 2/4-space
  // indentation only; a single leading space is commonly cosmetic spacing.
  const spaceIndent = line.match(/^( {2,})(?=\S)/);
  if (spaceIndent && spaceIndent[1].length % 2 === 0) {
    line = `${'.'.repeat(spaceIndent[1].length / 2)}${line.slice(spaceIndent[1].length)}`;
    repaired = true;
  }

  const canonicalized = canonicalizeOperatorPrefix(line);
  line = canonicalized.line;
  repaired ||= canonicalized.repaired;

  // Keep the documented Goal form consistent while preserving its label.
  if (/^(\.*\s*Goal)\s*:\s*/i.test(line)) {
    const normalized = line.replace(/^(\.*\s*Goal)\s*:\s*/i, '$1: ');
    repaired ||= normalized !== line;
    line = normalized;
  } else if (/^(\.*\s*Goal)\s+\S/i.test(line)) {
    line = line.replace(/^(\.*\s*Goal)\s+/i, '$1: ');
    repaired = true;
  }

  return { line, repaired };
}

function parseGomsOperatorLine(line) {
  if (!line.trim() || isComment(line)) return null;
  const indent = line.match(/^(?:\.*\s*)/)?.[0] ?? '';
  const operator = findCanonicalOperator(line);
  if (!operator) return null;

  const flexibleName = operator.replace(/_/g, '[\\s_-]+');
  const match = line.slice(indent.length).match(new RegExp(`^${flexibleName}(?=\\s|:|$)`, 'i'));
  if (!match) return null;

  return {
    indent,
    operator: operator.toLowerCase(),
    label: line.slice(indent.length + match[0].length).trim(),
  };
}

function targetForSuggestion(label) {
  const namedChunk = label.match(/<[^>]+>/)?.[0];
  if (namedChunk) return namedChunk;
  const target = label.replace(/^(?:at|to|on)\s+/i, '').trim();
  return target || 'target';
}

/**
 * Applies the deterministic fixes suggested by Cogulator's TipManager. Newly
 * inserted suggestions do not trigger further inferred steps.
 */
function applyCogulatorSuggestions(lines) {
  const output = [];
  const suggestions = [];
  let lookNotTakenByPointOrTouch = false;
  let pointNotTakenByClick = false;
  let handsLocation = null;

  for (const line of lines) {
    const step = parseGomsOperatorLine(line);
    if (!step) {
      output.push(line);
      continue;
    }

    const isMouseAction = step.operator === 'point' || step.operator === 'click';
    const isKeyboardAction = step.operator === 'keystroke' || step.operator === 'type';
    const isHandAction = ['click', 'drag', 'grasp', 'hands', 'keystroke', 'motor_processor', 'point', 'swipe', 'tap', 'touch', 'turn', 'type', 'write'].includes(step.operator);

    if (isHandAction) {
      if (handsLocation === null && step.operator !== 'hands') {
        handsLocation = isMouseAction ? 'mouse' : 'keyboard';
      } else if (step.operator === 'hands') {
        handsLocation = null;
      } else if (isMouseAction && handsLocation === 'keyboard') {
        output.push(`${step.indent}Hands to mouse`);
        suggestions.push({ type: 'hands_to_mouse', line: output.length });
        handsLocation = 'mouse';
      } else if (isKeyboardAction && handsLocation === 'mouse') {
        output.push(`${step.indent}Hands to keyboard`);
        suggestions.push({ type: 'hands_to_keyboard', line: output.length });
        handsLocation = 'keyboard';
      }
    }

    if (step.operator === 'look' || step.operator === 'search') {
      lookNotTakenByPointOrTouch = true;
    } else if (step.operator === 'point' || step.operator === 'touch' || step.operator === 'drag') {
      if (lookNotTakenByPointOrTouch) {
        lookNotTakenByPointOrTouch = false;
      } else {
        output.push(`${step.indent}Look at ${targetForSuggestion(step.label)}`);
        suggestions.push({ type: 'eyes_to_target', line: output.length });
      }
      if (step.operator === 'point' || step.operator === 'drag') pointNotTakenByClick = true;
    } else if (step.operator === 'click') {
      if (pointNotTakenByClick) {
        pointNotTakenByClick = false;
      } else {
        output.push(`${step.indent}Point to ${targetForSuggestion(step.label)}`);
        suggestions.push({ type: 'missing_point', line: output.length });
      }
    }

    output.push(line);
  }

  return { lines: output, suggestions };
}

function validateGeneratedGoms(response) {
  const inputLines = String(response ?? '').replace(/^```(?:goms|text)?\s*$/gim, '').replace(/^```\s*$/gim, '').split('\n');
  const firstGoal = inputLines.findIndex(isGoal);
  let modelStart = firstGoal;
  while (modelStart > 0 && (!inputLines[modelStart - 1].trim() || isComment(inputLines[modelStart - 1]))) modelStart--;
  const droppedLines = [];
  const candidateLines = firstGoal === -1 ? inputLines : inputLines.slice(modelStart);

  if (modelStart > 0) {
    inputLines.slice(0, modelStart).forEach((line, index) => {
      if (line.trim() && !isComment(line)) droppedLines.push(index + 1);
    });
  }

  const fixes = [];
  const errors = [];
  const normalizedLines = [];
  let sawGoal = false;

  candidateLines.forEach((rawLine, index) => {
    const sourceLine = (firstGoal === -1 ? 0 : modelStart) + index + 1;
    const { line, repaired } = normalizeLine(rawLine);
    if (repaired) fixes.push(sourceLine);
    normalizedLines.push(line);

    if (isGoal(line)) sawGoal = true;
    if (line.trim() && !isCogulatorLine(line)) {
      errors.push({ line: sourceLine, message: 'No Cogulator operator was found at the start of this line.' });
    }
    if ((line.match(/</g) || []).length !== (line.match(/>/g) || []).length) {
      errors.push({ line: sourceLine, message: 'Chunk brackets are unbalanced.' });
    }
  });

  if (!sawGoal) errors.unshift({ line: 1, message: 'A generated model must include a Goal line.' });
  const suggested = applyCogulatorSuggestions(normalizedLines);

  return {
    text: suggested.lines.join('\n').replace(/^\n+|\n+$/g, ''),
    fixes,
    droppedLines,
    errors,
    suggestions: suggested.suggestions,
    hasGoal: sawGoal,
    valid: sawGoal && errors.length === 0,
  };
}

module.exports = { CANONICAL_OPERATORS, applyCogulatorSuggestions, validateGeneratedGoms };
