import { env, pipeline } from './assets/transformers.min.js';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('./assets/models/', import.meta.url).href;
env.useBrowserCache = false;
env.backends.onnx.wasm.wasmPaths = new URL('./assets/', import.meta.url).href;
// A single WASM thread avoids SharedArrayBuffer/cross-origin isolation requirements.
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let embedder;
let queue = Promise.resolve();
self.onmessage = ({ data: { id, text } }) => {
  queue = queue.then(async () => {
    try {
      if (!embedder) {
        embedder = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2').catch(error => {
          embedder = null;
          throw error;
        });
      }
      const fn = await embedder;
      const result = await fn(text, { pooling: 'mean', normalize: true });
      self.postMessage({ id, embedding: Array.from(result.data) });
    } catch (error) {
      self.postMessage({ id, error: error.message });
    }
  });
};
