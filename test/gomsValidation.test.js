'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateGeneratedGoms } = require('../src/gomsValidation');

test('normalizes deterministic CMN-GOMS formatting without changing labels', () => {
  const result = validateGeneratedGoms(`Here is the model:\n\n- Goal : Save <report-name>\n  - look at <save-button>\n  - cognitive processor verify <save-button>\n  - Click <save-button>`);

  assert.equal(result.valid, true);
  assert.equal(result.text, 'Goal: Save <report-name>\n.Look at <save-button>\n.Cognitive_processor verify <save-button>\n.Point to <save-button>\n.Click <save-button>');
  assert.deepEqual(result.droppedLines, [1]);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.suggestions.map((suggestion) => suggestion.type), ['missing_point']);
});

test('does not guess a repair for an unknown operator', () => {
  const result = validateGeneratedGoms('Goal: Save file\n. Press <save-button>');

  assert.equal(result.valid, false);
  assert.equal(result.hasGoal, true);
  assert.deepEqual(result.errors, [{ line: 2, message: 'No Cogulator operator was found at the start of this line.' }]);
  assert.match(result.text, /Press <save-button>/);
});

test('keeps a model comment that immediately precedes its Goal', () => {
  const result = validateGeneratedGoms('Explanation\n\n* Assumes the user knows the filename\nGoal: Save file\n. Type <filename>');

  assert.equal(result.valid, true);
  assert.equal(result.text, '* Assumes the user knows the filename\nGoal: Save file\n. Type <filename>');
  assert.deepEqual(result.droppedLines, [1]);
});

test('applies deterministic Cogulator suggestions before returning the model', () => {
  const result = validateGeneratedGoms('Goal: Save file\n. Type <filename>\n. Click <save-button>\n. Touch <confirm-button>');

  assert.equal(result.valid, true);
  assert.equal(result.text, 'Goal: Save file\n. Type <filename>\n. Hands to mouse\n. Point to <save-button>\n. Click <save-button>\n. Look at <confirm-button>\n. Touch <confirm-button>');
  assert.deepEqual(result.suggestions.map((suggestion) => suggestion.type), ['hands_to_mouse', 'missing_point', 'eyes_to_target']);
});

test('reports malformed chunks and a missing Goal instead of inventing a model', () => {
  const result = validateGeneratedGoms('. Look at <save-button');

  assert.equal(result.valid, false);
  assert.equal(result.hasGoal, false);
  assert.equal(result.errors[0].message, 'A generated model must include a Goal line.');
  assert.equal(result.errors[1].message, 'Chunk brackets are unbalanced.');
});
