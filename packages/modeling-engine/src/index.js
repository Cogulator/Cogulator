'use strict';

const path = require('path');
const { parseOperators, profileWithLegacyRuntime } = require('./legacy-runtime');

/**
 * Profile GOMS source without an editor, DOM, Electron, or global Cogulator
 * UI state. Result fields are JSON-safe so callers may use a worker process.
 *
 * This first API release deliberately uses a compatibility runtime over the
 * existing Cogulator algorithms. Moving those algorithms into native package
 * modules is the next extraction step; the public result contract stays fixed.
 */
function profileModel({ source, operatorText, sourceRoot } = {}) {
  if (typeof source !== 'string') throw new TypeError('profileModel requires GOMS source text.');
  return profileWithLegacyRuntime({
    source,
    operatorText,
    sourceRoot: sourceRoot || path.resolve(__dirname, '../../../src'),
  });
}

module.exports = { profileModel, parseOperators };
