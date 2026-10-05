const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRetriever, findMatches } = require('../src/localRetrieval');
const corpus = require('../src/assist/corpus.json');

const vector = (x, y = 0) => [x, y, ...Array(382).fill(0)];
const chunk = (name, embedding) => ({
  text: name, source: `${name}.goms`, source_type: 'goms_model',
  model_name: name, goal_name: name, chunk_index: 0, embedding,
});
const fixture = chunks => ({ embedding_model: corpus.embedding_model, chunks });

test('cosine search ranks by angle, limits to six, and preserves source metadata', () => {
  const rows = Array.from({ length: 8 }, (_, i) => chunk(`sample-${i}`, vector(i + 1, 1)));
  const search = createRetriever(fixture(rows));
  const matches = search(vector(2));
  assert.deepEqual(matches.map(c => c.text), ['sample-7', 'sample-6', 'sample-5', 'sample-4', 'sample-3', 'sample-2']);
  assert.ok(Math.abs(matches[0].similarity - 8 / Math.sqrt(65)) < 1e-12);
  assert.equal(matches[0].source, 'sample-7.goms');
  assert.equal(matches[0].source_type, 'goms_model');
  assert.equal(matches[0].model_name, 'sample-7');
  assert.equal(matches[0].goal_name, 'sample-7');
  assert.equal(matches[0].chunk_index, 0);
  assert.equal(matches[0].embedding, undefined);
});

test('search filters weak or opposite matches and can return no context', () => {
  const search = createRetriever(fixture([
    chunk('weak', vector(0.29, Math.sqrt(1 - 0.29 ** 2))),
    chunk('relevant', vector(0.31, Math.sqrt(1 - 0.31 ** 2))),
    chunk('opposite', vector(-1)),
  ]));
  assert.deepEqual(search(vector(1)).map(c => c.text), ['relevant']);
  assert.deepEqual(createRetriever(fixture([chunk('opposite', vector(-1))]))(vector(1)), []);
});

test('incompatible corpora and invalid vectors fail clearly', () => {
  assert.throws(() => createRetriever({ ...corpus, embedding_model: 'other-model' }), /incompatible/);
  assert.throws(() => createRetriever(fixture([])), /missing or incompatible/);
  assert.throws(() => createRetriever(fixture([chunk('bad', [1])])), /384-dimensional/);
  assert.throws(() => createRetriever(fixture([chunk('bad', vector(0))])), /zero-length/);
  const search = createRetriever(fixture([chunk('valid', vector(1))]));
  assert.throws(() => search(vector(NaN)), /finite/);
  assert.throws(() => search(vector(0)), /zero-length/);
});

test('bundled corpus retrieves its own reference chunk with cosine similarity one', async () => {
  const reference = corpus.chunks.find(c => c.source_type === 'goms_model');
  const matches = await findMatches(reference.embedding);
  assert.ok(matches.length > 0 && matches.length <= 6);
  assert.equal(matches[0].text, reference.text);
  assert.ok(Math.abs(matches[0].similarity - 1) < 1e-12);
});

test('corpus loads when launched outside the application directory', () => {
  const modulePath = path.resolve(__dirname, '../src/localRetrieval.js');
  const output = execFileSync(process.execPath, ['-e', `
    const { findMatches } = require(${JSON.stringify(modulePath)});
    findMatches(${JSON.stringify(corpus.chunks[0].embedding)})
      .then(matches => console.log(matches.length))
      .catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: require('node:os').tmpdir(), encoding: 'utf8' });
  assert.ok(Number(output.trim()) > 0);
});
