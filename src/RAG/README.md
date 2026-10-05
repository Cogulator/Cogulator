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
- `supabase_setup.sql` and `supabase_hardening.sql` — legacy hosted retrieval setup.
- `env.example` — configuration template only; it contains no credentials.

## Update the bundled corpus

1. From this directory, install dependencies with `npm install`.
2. Edit the reference documents or example models in `corpus/`.
3. Run `npm run embed` to regenerate `../assist/corpus.json` without uploading anything.
4. Run the root project's `npm test` and `npm run test:embeddings` to validate retrieval.
5. Commit the regenerated JSON with the source changes.

The first generation downloads the local `Xenova/all-MiniLM-L6-v2` embedding
model. Keep that model and its 384-dimensional vectors to match the query
embedder bundled with Cogulator. No Supabase credentials are needed.

Search uses cosine similarity greater than 0.3 and returns at most six chunks.
The search corpus is loaded once when Assist first retrieves context. Reference
updates reach users through app releases. Groq generation still requires internet.

## Legacy Supabase ingestion

These tools remain available for maintaining an old hosted corpus; Cogulator
no longer calls Supabase.

1. Create a Supabase project and run `supabase_setup.sql` in its SQL Editor.
2. From this directory, install dependencies with `npm install`.
3. Copy `env.example` to `.env` and provide your own Supabase URL and
   **service-role** key. The service-role key is only for this local ingestion
   process; never commit or ship it with Cogulator.
4. Run `npm run ingest`.

The first ingestion downloads the local `Xenova/all-MiniLM-L6-v2` embedding
model. The schema uses 384-dimensional vectors for that model.

Use `npm run ingest:fresh` only when you intentionally want to delete all
previously ingested chunks before rebuilding them.

Groq keys are configured in the desktop app's Assist settings. Do not put the
service-role key or an ingestion `.env` in a packaged application.
