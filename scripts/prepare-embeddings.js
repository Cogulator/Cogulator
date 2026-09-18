// Only these browser assets enter the release. Transformers and its native
// dependencies are devDependencies, removed by Electron Packager's pruning.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const transformers = path.join(root, 'node_modules/@xenova/transformers');
const destination = path.join(root, 'src/embeddings/assets');
const model = 'Xenova/all-MiniLM-L6-v2';
const revision = '751bff37182d3f1213fa05d7196b954e230abad9';
const modelFiles = {
  'config.json': '7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7',
  'tokenizer.json': 'da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0',
  'tokenizer_config.json': '9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3',
  'onnx/model_quantized.onnx': 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1',
};
const matches = (bytes, hash) => createHash('sha256').update(bytes).digest('hex') === hash;

async function main() {
  await fs.mkdir(destination, { recursive: true });
  for (const file of ['transformers.min.js', 'ort-wasm.wasm', 'ort-wasm-simd.wasm']) {
    await fs.copyFile(path.join(transformers, 'dist', file), path.join(destination, file));
  }
  await fs.copyFile(path.join(transformers, 'LICENSE'), path.join(destination, 'TRANSFORMERS-LICENSE'));
  for (const [file, hash] of Object.entries(modelFiles)) {
    const target = path.join(destination, 'models', model, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    let bytes;
    for (const cached of [target, path.join(transformers, '.cache', model, file)]) {
      try {
        const candidate = await fs.readFile(cached);
        if (matches(candidate, hash)) { bytes = candidate; break; }
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    if (!bytes) {
      const response = await fetch(`https://huggingface.co/${model}/resolve/${revision}/${file}`, {
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(`Unable to download ${file}: ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (!matches(bytes, hash)) throw new Error(`Unexpected model checksum: ${file}`);
    }
    await fs.writeFile(target, bytes);
  }
  console.log('Prepared browser embedding runtime and local MiniLM model.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
