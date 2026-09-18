const worker = new Worker('./worker.js', { type: 'module' });
window.embeddingHost.onRequest(request => worker.postMessage(request));
worker.onmessage = ({ data }) => window.embeddingHost.respond(data);
worker.onerror = event => window.embeddingHost.respond({ fatal: event.message || 'Embedding worker failed.' });
worker.onmessageerror = () => window.embeddingHost.respond({ fatal: 'Invalid embedding worker response.' });
window.embeddingHost.ready();
