'use strict';

const { parseOperators } = require('./operators');
const { profileWithNativeModules } = require('./native-runtime');

/**
 * Profile GOMS source without an editor, DOM, Electron, or global Cogulator
 * UI state. Result fields are JSON-safe so callers may use a worker process.
 *
 * The processor, memory, and workload modules run natively with injected
 * inputs. Cogulator's browser lifecycle remains a thin adapter around them.
 */
function profileModel({ source, operatorText } = {}) {
  if (typeof source !== 'string') throw new TypeError('profileModel requires GOMS source text.');
  return profileWithNativeModules({ source, operatorText });
}

module.exports = { profileModel, parseOperators };
