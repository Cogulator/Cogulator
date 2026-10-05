const { readFile } = require('node:fs/promises');
const path = require('node:path');

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DIMENSIONS = 384;

function vectorNorm(vector) {
  if (!Array.isArray(vector) || vector.length !== DIMENSIONS || !vector.every(Number.isFinite)) {
    throw new Error('Assist requires a finite 384-dimensional embedding.');
  }
  const norm = Math.hypot(...vector);
  if (norm === 0) throw new Error('Assist cannot search a zero-length embedding.');
  return norm;
}

function createRetriever(corpus) {
  if (corpus.embedding_model !== EMBEDDING_MODEL || !Array.isArray(corpus.chunks) || !corpus.chunks.length) {
    throw new Error('The bundled Assist reference corpus is missing or incompatible.');
  }
  const entries = corpus.chunks.map(({ embedding, ...metadata }) => {
    if (typeof metadata.text !== 'string' || !metadata.text.trim()) {
      throw new Error('The bundled Assist reference corpus contains an empty chunk.');
    }
    return { embedding, metadata, norm: vectorNorm(embedding) };
  });

  return queryEmbedding => {
    const queryNorm = vectorNorm(queryEmbedding);
    const matches = [];
    for (const { embedding, metadata, norm } of entries) {
      let dot = 0;
      for (let i = 0; i < DIMENSIONS; i++) dot += queryEmbedding[i] * embedding[i];
      const similarity = Math.max(-1, Math.min(1, dot / (queryNorm * norm)));
      // Match the former pgvector RPC: cosine similarity > 0.3, best six.
      if (similarity > 0.3) matches.push({ ...metadata, similarity });
    }
    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 6);
  };
}

let retrieverPromise;
async function findMatches(queryEmbedding) {
  if (!retrieverPromise) {
    // Resolve against this module so packaged apps don't depend on the launch directory.
    retrieverPromise = readFile(path.join(__dirname, 'assist/corpus.json'), 'utf8')
      .then(raw => createRetriever(JSON.parse(raw)))
      .catch(error => {
        retrieverPromise = null;
        throw new Error('Unable to load the bundled Assist reference corpus.', { cause: error });
      });
  }
  const retrieve = await retrieverPromise;
  return retrieve(queryEmbedding);
}

module.exports = { createRetriever, findMatches };
