// Run with npm run test:embeddings. Optional argument: packaged Resources/app path.
const { app } = require('electron');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const service = require(path.join(root, 'src/embeddings/service'));
// Keep the test app alive while deliberately destroying/recreating its only window.
app.on('window-all-closed', () => {});

app.whenReady().then(async () => {
  try {
    // Reference values from the previous native pipeline, same quantized model.
    const samples = [
      ['Point to a button', [-0.0344812274, -0.0235073268, -0.1132786274, -0.0058732759]],
      ['Remember the code', [-0.0423948132, 0.0217997078, -0.1151448190, 0.0658083484]],
    ];
    const vectors = await Promise.all(samples.map(([text]) => service.embed(text)));
    vectors.forEach((vector, index) => {
      assert.equal(vector.length, 384);
      assert.ok(vector.every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-5);
      samples[index][1].forEach((expected, i) => assert.ok(Math.abs(vector[i] - expected) < 1e-5));
    });
    service.dispose();
    const restarted = await service.embed(samples[0][0]);
    assert.deepEqual(restarted, vectors[0]);
    console.log('Browser embeddings passed: concurrent requests, native compatibility, normalization, and restart.');
    service.dispose(); app.exit(0);
  } catch (error) {
    console.error(error); service.dispose(); app.exit(1);
  }
});
