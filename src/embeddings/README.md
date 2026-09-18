# Local browser embeddings

Assist uses a sandboxed hidden Electron window to host a module Web Worker.
The worker runs Transformers.js 2.17.2 with single-threaded ONNX WebAssembly,
using the same quantized MiniLM model, mean pooling and L2 normalization as
the former Node pipeline. No image processing or native inference library is
loaded. Worker failures reject the Assist request, rather than crashing startup.
The hidden window is created on demand and destroyed when the main window closes.

`npm start`, `npm run package`, `npm run make`, and `npm run publish` prepare
the ignored `assets` directory first. The preparation script copies the browser
bundle and two WASM variants, and obtains checksum-verified model files from
the existing development cache or a pinned Hugging Face revision. Fresh builds
need network access for the model; end users do not. Model files are bundled
with the app (approximately 23 MB). Generated browser assets total approximately
43 MB. Transformers is a pinned dev dependency; release pruning removes it,
Sharp, and both ONNX npm packages. The independent RAG ingestion package is
unchanged.

Run `npm run test:embeddings` for an actual Electron worker test. To check
packaged assets, pass the packaged application directory containing `src`:
`npm run test:embeddings -- /absolute/path/to/Contents/Resources/app`.
Run this test on Apple Silicon, Intel macOS, and Windows before release.
`npm test` covers the existing application logic without launching Electron.

The model is Xenova/all-MiniLM-L6-v2 (Apache-2.0), revision
751bff37182d3f1213fa05d7196b954e230abad9. Transformers.js is Apache-2.0;
its license is copied alongside the generated assets. ONNX Runtime is MIT.
