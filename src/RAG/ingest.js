/**
 * Cogulator RAG Ingestion Script
 *
 * Chunks and embeds Cogulator docs + .goms example models into Supabase pgvector.
 * Run once (or whenever your corpus changes): node ingest.js
 * To regenerate the bundled Assist corpus without uploading:
 *   npm run embed
 *   node ingest.js --output ../assist/corpus.json
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js @xenova/transformers glob dotenv
 *
 * .env file required:
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_KEY=your-service-role-key
 *   EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2   # free, runs locally
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";
import { glob } from "glob";

// ─── Config ──────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 400; // target tokens per chunk
const CHUNK_OVERLAP = 80; // token overlap between consecutive chunks
const WORDS_PER_TOKEN = 0.75; // rough approximation

const CORPUS_DIRS = {
  docs: "./corpus/docs", // .md or .txt files (primer, operator reference, etc.)
  models: "./corpus/models", // .goms example model files
};

const outputFlagIndex = process.argv.indexOf("--output");
const outputPath = outputFlagIndex === -1 ? null : process.argv[outputFlagIndex + 1];
if (outputFlagIndex !== -1 && (!outputPath || outputPath.startsWith("--"))) {
  throw new Error("--output requires a file path");
}
const offlineOutput = outputPath !== null;
const generatedRows = [];

// ─── Supabase setup ───────────────────────────────────────────────────────────

const supabase = offlineOutput
  ? null
  : createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );

// ─── Embedding ────────────────────────────────────────────────────────────────

let embedderPromise = null;

async function getEmbedder() {
  if (!embedderPromise) {
    const modelName = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
    console.log(
      `Loading embedding model "${modelName}" (first run downloads ~25 MB)...`,
    );
    embedderPromise = pipeline("feature-extraction", modelName).catch((error) => {
      embedderPromise = null;
      throw error;
    });
  }
  return embedderPromise;
}

async function embed(text) {
  const fn = await getEmbedder();
  const output = await fn(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

/**
 * Split plain text/markdown into overlapping word-window chunks.
 * Tries to break at paragraph/line boundaries before hard-splitting.
 */
function chunkText(text, filePath) {
  const approxChunkWords = Math.round(CHUNK_SIZE / WORDS_PER_TOKEN);
  const approxOverlapWords = Math.round(CHUNK_OVERLAP / WORDS_PER_TOKEN);

  // Normalize newlines and split into paragraphs first, then words
  const normalized = text.replace(/\r\n?|\r/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/);
  const chunks = [];
  let buffer = [];
  let bufferWordCount = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const chunkText = buffer.join("\n\n").trim();
    if (chunkText.length > 30) {
      chunks.push(chunkText);
    }
    // keep overlap: retain last N words for context continuity
    const words = chunkText.split(/\s+/);
    buffer = [words.slice(-approxOverlapWords).join(" ")];
    bufferWordCount = approxOverlapWords;
  };

  for (const para of paragraphs) {
    const wordCount = para.split(/\s+/).length;

    if (bufferWordCount + wordCount > approxChunkWords) {
      flush();
    }
    buffer.push(para);
    bufferWordCount += wordCount;
  }
  flush();

  return chunks.map((text, i) => ({
    text,
    metadata: {
      source: path.basename(filePath),
      source_type: inferSourceType(filePath),
      chunk_index: i,
      total_chunks: chunks.length,
    },
  }));
}

/**
 * .goms files have meaningful structure — goals, operators, comments.
 * Chunk them by goal block to keep semantically coherent units together.
 */
function chunkGomsModel(text, filePath) {
  const modelName = path.basename(filePath, ".goms");
  const lines = text.split("\n");
  const chunks = [];
  let currentGoalLines = [];
  let currentGoalName = "preamble";

  const flush = (goalName, goalLines) => {
    const content = goalLines.join("\n").trim();
    if (content.length < 10) return;

    // Prepend model name and goal name for retrieval context
    const prefixed = `# Model: ${modelName}\n## Goal: ${goalName}\n\n${content}`;
    chunks.push({
      text: prefixed,
      metadata: {
        source: path.basename(filePath),
        source_type: "goms_model",
        model_name: modelName,
        goal_name: goalName,
        chunk_index: chunks.length,
      },
    });
  };

  for (const line of lines) {
    // Goals may appear at any level in a CMN-GOMS hierarchy.  The previous
    // expression accepted only an optional single period, so nested goals such
    // as "..Goal: Select Item" were absorbed into their parent's chunk.
    // Accept both declarations and references (@Goal/@Also), with or without
    // the optional colon used by existing Cogulator models.
    const goalMatch = line.match(/^(?:\s*\.\s*)*\s*((?:@?Goal|@?Also):?)\s*(.+)/i);
    if (goalMatch) {
      flush(currentGoalName, currentGoalLines);
      currentGoalName = goalMatch[2].trim();
      currentGoalLines = [line];
    } else {
      currentGoalLines.push(line);
    }
  }
  flush(currentGoalName, currentGoalLines);

  // Also create a single "summary" chunk for the whole model
  // so users can find models by high-level description
  chunks.push({
    text: `# Model overview: ${modelName}\n\n${text.slice(0, 800)}`,
    metadata: {
      source: path.basename(filePath),
      source_type: "goms_model_summary",
      model_name: modelName,
      chunk_index: chunks.length,
    },
  });

  return chunks.map((c, i) => ({
    ...c,
    metadata: { ...c.metadata, total_chunks: chunks.length, chunk_index: i },
  }));
}

function inferSourceType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  if (ext === ".goms") return "goms_model";
  if (base.includes("primer")) return "primer";
  if (base.includes("operator")) return "operator_reference";
  return "documentation";
}

// ─── Operators CSV chunking (generation-oriented) ─────────────────────────────

/**
 * Create one compact chunk per operator from operators.txt, tuned for model generation.
 * Robustly handles commas inside definitions by using positions of first three commas
 * and the last comma.
 */
function chunkOperatorsFile(text, filePath) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // Drop header if present
  const header = lines[0].toLowerCase();
  const rows = header.startsWith("operator,") ? lines.slice(1) : lines;

  const modalityMap = {
    Look: ["visual"],
    Search: ["visual"],
    Read: ["visual"],
    Hear: ["speech", "audition"],
    Say: ["speech"],
    Think: ["cognition"],
    Verify: ["cognition"],
    Recall: ["memory"],
    Store: ["memory"],
    Point: ["mouse"],
    Click: ["mouse"],
    Keystroke: ["keyboard"],
    Type: ["keyboard"],
    Hands: ["handover"],
    Touch: ["touchscreen"],
    Swipe: ["touchscreen"],
    Drag: ["touchscreen"],
    Turn: ["physical"],
  };

  const synonymsMap = {
    Point: ["move cursor", "aim", "pointing"],
    Click: ["press mouse button", "mouse click"],
    Keystroke: ["press key", "keypress"],
    Type: ["type text", "enter text"],
    Touch: ["tap", "touch"],
    Swipe: ["swipe", "flick"],
    Turn: ["turn knob", "rotate dial"],
    Look: ["look at", "visually acquire"],
    Search: ["find", "scan"],
    Verify: ["confirm", "check"],
  };

  const parseRow = (row) => {
    const c1 = row.indexOf(",");
    if (c1 === -1) return null;
    const c2 = row.indexOf(",", c1 + 1);
    if (c2 === -1) return null;
    const c3 = row.indexOf(",", c2 + 1);
    if (c3 === -1) return null;
    const clast = row.lastIndexOf(",");

    const operator = row.slice(0, c1).trim();
    const timeStr = row.slice(c1 + 1, c2).trim();
    const labelReqStr = row.slice(c2 + 1, c3).trim();

    let def, modelType;
    if (clast > c3) {
      def = row.slice(c3 + 1, clast).trim();
      modelType = row.slice(clast + 1).trim();
    } else {
      def = row.slice(c3 + 1).trim();
      modelType = "";
    }

    const defaultTimeMs = parseInt(timeStr.replace(/[^0-9]/g, ""), 10);
    const labelRequired = /yes/i.test(labelReqStr);

    return {
      operator,
      defaultTimeMs: isNaN(defaultTimeMs) ? null : defaultTimeMs,
      labelRequired,
      def,
      modelType,
    };
  };

  const chunks = [];
  rows.forEach((row, idx) => {
    const p = parseRow(row);
    if (!p || !p.operator) return;

    const modality = modalityMap[p.operator] || [];
    const synonyms = synonymsMap[p.operator] || [];

    const exampleLines = [];
    if (p.labelRequired) {
      exampleLines.push(`. ${p.operator} <label>`);
    } else {
      // Show a minimal line; for motor actions, suggest a preceding Look
      if (
        ["Point", "Click", "Touch", "Swipe", "Turn", "Drag"].includes(
          p.operator,
        )
      ) {
        exampleLines.push(`. Look at <target>`);
        const labelPart = ["Point", "Touch", "Drag", "Swipe"].includes(
          p.operator,
        )
          ? " to <target>"
          : " <target>";
        exampleLines.push(`. ${p.operator}${labelPart}`);
      } else {
        exampleLines.push(`. ${p.operator}`);
      }
    }

    const lines = [
      `Operator: ${p.operator}`,
      p.defaultTimeMs != null
        ? `Time: ${p.defaultTimeMs} ms`
        : `Time: (unspecified)`,
      `Label required: ${p.labelRequired ? "yes" : "no"}`,
      p.def ? `Definition: ${p.def}` : null,
      p.modelType ? `Model types: ${p.modelType}` : null,
      modality.length ? `Modality: ${modality.join(", ")}` : null,
      synonyms.length ? `Synonyms: ${synonyms.join("; ")}` : null,
      "Example:",
      ...exampleLines,
    ].filter(Boolean);

    const textBlock = lines.join("\n");

    chunks.push({
      text: textBlock,
      metadata: {
        source: `Operator Reference: ${p.operator}`,
        source_type: "operator_reference",
        operator_name: p.operator,
        default_time_ms: p.defaultTimeMs,
        label_required: p.labelRequired,
        modality_tags: modality,
        synonyms,
        chunk_index: idx,
      },
    });
  });

  return chunks.map((c, i) => ({
    ...c,
    metadata: { ...c.metadata, total_chunks: chunks.length, chunk_index: i },
  }));
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function ensureTable() {
  // Run this SQL once in the Supabase SQL editor — included here for reference.
  const sql = `
    -- Enable pgvector
    create extension if not exists vector;

    -- Main chunks table
    create table if not exists cogulator_chunks (
      id          bigserial primary key,
      text        text        not null,
      embedding   vector(384),          -- 384 dims = all-MiniLM-L6-v2
      source      text,
      source_type text,
      model_name  text,
      goal_name   text,
      chunk_index int,
      inserted_at timestamptz default now()
    );

    -- HNSW index for fast cosine similarity search
    create index if not exists cogulator_chunks_embedding_idx
      on cogulator_chunks
      using hnsw (embedding vector_cosine_ops);
  `;
  console.log("\n⚠️  Make sure you have run the table setup SQL in Supabase.");
  console.log(
    "   (See the SQL comment at the top of ensureTable() in this script)\n",
  );
}

async function upsertChunks(chunks) {
  const rows = chunks.map((c) => ({
    text: c.text,
    embedding: c.embedding,
    source: c.metadata.source,
    source_type: c.metadata.source_type,
    model_name: c.metadata.model_name ?? null,
    goal_name: c.metadata.goal_name ?? null,
    chunk_index: c.metadata.chunk_index ?? null,
  }));

  if (offlineOutput) {
    generatedRows.push(...rows);
    return;
  }

  const { error } = await supabase.from("cogulator_chunks").insert(rows);

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
}

// ─── Main ingestion loop ──────────────────────────────────────────────────────

async function ingestFile(filePath) {
  const text = fs.readFileSync(filePath, "utf-8").trim();
  if (!text) return 0;

  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  const rawChunks =
    ext === ".goms"
      ? chunkGomsModel(text, filePath)
      : base.includes("operator")
        ? chunkOperatorsFile(text, filePath)
        : chunkText(text, filePath);

  console.log(`  ${path.basename(filePath)} → ${rawChunks.length} chunks`);

  // Embed in small batches to avoid memory spikes
  const BATCH = 16;
  const embeddedChunks = [];

  for (let i = 0; i < rawChunks.length; i += BATCH) {
    const batch = rawChunks.slice(i, i + BATCH);
    const embeddings = await Promise.all(batch.map((c) => embed(c.text)));
    embeddings.forEach((emb, j) => {
      embeddedChunks.push({ ...batch[j], embedding: emb });
    });
    process.stdout.write(
      `    embedded ${Math.min(i + BATCH, rawChunks.length)}/${rawChunks.length}\r`,
    );
  }
  console.log();

  await upsertChunks(embeddedChunks);
  return embeddedChunks.length;
}

async function main() {
  console.log("=== Cogulator RAG Ingestion ===\n");
  if (offlineOutput) {
    console.log(`Offline mode: writing embeddings to ${outputPath}\n`);
  } else {
    await ensureTable();
  }

  // Optionally wipe existing chunks before re-ingesting
  if (process.argv.includes("--fresh")) {
    if (offlineOutput) {
      throw new Error("--fresh cannot be used with --output because no database is being modified");
    }
    console.log("--fresh flag detected: deleting existing chunks...");
    await supabase.from("cogulator_chunks").delete().neq("id", 0);
    console.log("Done.\n");
  }

  let totalChunks = 0;

  // Ingest docs (.md, .txt)
  const docFiles = await glob(`${CORPUS_DIRS.docs}/**/*.{md,txt}`, {
    nodir: true,
  });
  if (docFiles.length > 0) {
    console.log(
      `📄 Ingesting ${docFiles.length} doc file(s) from ${CORPUS_DIRS.docs}:`,
    );
    for (const f of docFiles) totalChunks += await ingestFile(f);
  } else {
    console.log(`⚠️  No doc files found in ${CORPUS_DIRS.docs}`);
  }

  // Ingest .goms example models
  const gomsFiles = await glob(`${CORPUS_DIRS.models}/**/*.goms`, {
    nodir: true,
  });
  if (gomsFiles.length > 0) {
    console.log(
      `\n🧠 Ingesting ${gomsFiles.length} .goms model file(s) from ${CORPUS_DIRS.models}:`,
    );
    for (const f of gomsFiles) totalChunks += await ingestFile(f);
  } else {
    console.log(`⚠️  No .goms files found in ${CORPUS_DIRS.models}`);
  }

  if (offlineOutput) {
    const resolvedOutputPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    fs.writeFileSync(
      resolvedOutputPath,
      `${JSON.stringify({ embedding_model: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2", chunks: generatedRows })}\n`,
    );
    console.log(
      `\n✅ Embedding complete. ${totalChunks} chunks written to ${resolvedOutputPath}.\n`,
    );
  } else {
    console.log(
      `\n✅ Ingestion complete. ${totalChunks} total chunks stored in Supabase.\n`,
    );
  }
}

main().catch((err) => {
  console.error("\n❌ Ingestion failed:", err.message);
  process.exit(1);
});
