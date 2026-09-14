'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const gomsValidation = require('../src/gomsValidation');

// Run the actual IPC handler with local service doubles; no API keys or network.
function harness() {
  const handlers = {}, sent = [], requests = [];
  let finishReason = 'length';
  const context = {
    console: { log() {}, error() {} }, AbortController,
    process: { env: {} }, dotenv: { config() {} },
    dirname: path.dirname, resolve: path.resolve, fileURLToPath: () => __filename,
    bundledSupabaseUrl: 'https://retrieval.invalid', gomsValidation,
    ipcMain: { on: (name, fn) => handlers[name] = fn, handle: (name, fn) => handlers[name] = fn },
    pipeline: async () => async () => ({ data: [0] }),
    fetch: async () => ({ ok: true, json: async () => [] }),
    Groq: class {
      constructor() {
        this.chat = { completions: { create: async options => {
          requests.push(options);
          return (async function* () {
            yield { choices: [{ delta: { content: 'Goal: Sample\n.Think' }, finish_reason: null }] };
            if (finishReason !== null) yield { choices: [{ delta: {}, finish_reason: finishReason }] };
          })();
        } } };
      }
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/ragHandler.js'), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace(/import\.meta\.url/g, "'file:///test/ragHandler.js'")
    .replace(/^export /gm, '');
  vm.createContext(context);
  vm.runInContext(source, context);
  context.registerRagHandlers({ isDestroyed: () => false, webContents: { send: (...args) => sent.push(args) } }, () => 'test-key');
  return { sent, requests, async query(reason, id) {
    finishReason = reason;
    await handlers['rag-query']({}, { question: 'Make a sample model', requestId: id });
  } };
}

test('length-limited Assist output reports an error and stays out of subsequent history', async () => {
  const h = harness();
  await h.query('length', 'short');
  assert.equal(h.sent.filter(event => event[0] === 'rag-done').length, 0);
  const error = h.sent.find(event => event[0] === 'rag-error');
  assert.match(error[1], /length limit.*not inserted/);
  assert.equal(error[2], 'short');
  await h.query('stop', 'complete');
  assert.equal(h.requests[1].messages.filter(message => message.role === 'assistant').length, 0);
  const done = h.sent.find(event => event[0] === 'rag-done');
  assert.equal(done[1].requestId, 'complete');
  assert.match(done[1].fullResponse, /Goal: Sample/);
});

test('a stream that ends without a completion reason is not accepted', async () => {
  const h = harness();
  await h.query(null, 'interrupted');
  assert.ok(h.sent.some(event => event[0] === 'rag-error' && /did not complete/.test(event[1])));
  assert.ok(!h.sent.some(event => event[0] === 'rag-done'));
});
