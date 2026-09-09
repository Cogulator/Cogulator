'use strict';

const defaultOperatorText = require('./default-operators');

function parseOperators(operatorText = defaultOperatorText) {
  return String(operatorText).split(/\r?\n/).flatMap((line) => {
    const [resource, operator, time, description, timeModifier] = line.trim().split(/\s+/);
    if (!resource || !operator || !Number.isFinite(Number(time))) return [];
    // Cogulator's full operators.txt has a description before timeModifier.
    // Compact definitions are convenient for API callers, so accept the fourth
    // token as a modifier too; unrecognized descriptions are harmless here.
    return [{ resource, operator, time: Number(time), timeModifier: timeModifier || description || '' }];
  });
}

module.exports = { parseOperators };
