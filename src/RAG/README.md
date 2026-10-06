# Cogulator RAG corpus and ingestion

This directory contains the public Cogulator reference corpus and a script for
chunking and embedding it. The Electron app searches the bundled
`../assist/corpus.json` locally before generating a CMN-GOMS model with Groq.
The raw corpus and development ingestion dependencies are excluded from releases;
the search-ready corpus is included separately.

## Contents

- `corpus/docs/` — primer excerpts, operator reference, assembly rules, and
  chunk-naming guidance.
- `corpus/models/` — public example `.goms` models.
- `ingest.js` — chunks corpus files and creates local embeddings.
- `../assist/corpus.json` — committed search corpus bundled with the app.

## Update the bundled corpus

1. From this directory, install dependencies with `npm install`.
2. Edit the reference documents or example models in `corpus/`.
3. Run `npm run embed` to regenerate `../assist/corpus.json` without uploading anything.
4. Run the root project's `npm test` and `npm run test:embeddings` to validate retrieval.
5. Commit the regenerated JSON with the source changes.

The first generation downloads the local `Xenova/all-MiniLM-L6-v2` embedding
model. Keep that model and its 384-dimensional vectors to match the query
embedder bundled with Cogulator. No hosted database credentials are needed.

Search uses cosine similarity greater than 0.3 and returns at most six chunks.
The search corpus is loaded once when Assist first retrieves context. Reference
updates reach users through app releases. Groq generation still requires internet.
