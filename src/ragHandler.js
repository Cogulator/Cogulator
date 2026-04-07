/**
 * Cogulator RAG Query Handler — main process (main.js or a file it imports)
 *
 * Registers two IPC handlers:
 *   "rag-query"  — takes a user question, retrieves context, streams LLM tokens back
 *   "rag-cancel" — cancels an in-flight request
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js @xenova/transformers groq-sdk dotenv
 *
 * .env additions (same file as ingest.js):
 *   GROQ_API_KEY=gsk_...
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key   ← anon key is fine for read-only queries
 */

import 'dotenv/config';
import { ipcMain } from 'electron';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import Groq from 'groq-sdk';

// ─── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Embedder (singleton, lazy-loaded) ───────────────────────────────────────

let _embedder = null;

async function getEmbedder() {
  if (!_embedder) {
    _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _embedder;
}

async function embedQuery(text) {
  const fn = await getEmbedder();
  const out = await fn(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

const MATCH_COUNT = 6;
const SIMILARITY_THRESHOLD = 0.3;

/**
 * Returns the top-K chunks from Supabase most similar to the query.
 * Calls the match_cogulator_chunks SQL function created during setup.
 */
async function retrieve(queryText) {
  const embedding = await embedQuery(queryText);

  const { data, error } = await supabase.rpc('match_cogulator_chunks', {
    query_embedding:      embedding,
    match_count:          MATCH_COUNT,
    similarity_threshold: SIMILARITY_THRESHOLD,
  });

  if (error) throw new Error(`Retrieval error: ${error.message}`);
  return data ?? [];
}

// ─── Prompt assembly ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are a knowledgeable assistant embedded in Cogulator, a GOMS-based cognitive \
task modeling tool developed by MITRE. You generate Cogulator-compliant models \
from natural language task descriptions.

You have access to excerpts from the Cogulator primer, operator reference, and \
example .goms model files. Use them to give accurate, grounded answers.

STRICT RULES:
- Only use operators from the ALLOWED LIST below. Do not invent new operators.
- Do not use underscores, punctuation, or altered spelling in operator names.
- Use period-based indentation (each child line has one more period than its parent).
- When a domain action is described (e.g., "press power", "select band", "enter frequency"), \
  map it to allowed operators (e.g., Look, Touch, Verify; Hands; Turn; Type/Keystroke).

ALLOWED OPERATORS (canonical names):
Look, Search, Read, Hear, Say, Think, Verify, Recall, Store, Perceptual_processor, Cognitive_processor, Motor_processor, \
Point, Click, Drag, Grasp, Hands, Keystroke, Type, Swipe, Tap, Turn, Touch, Saccade, Attend, Initiate, Ignore, Write

MAPPING CHEAT-SHEET (examples):
- Press physical button → Look at <control>, Touch <control>, Verify outcome
- Select on touchscreen → Look at <control>, Touch <control>, Verify selection
- Tune via dial/knob → Hands to dial, Look at <dial>, Turn <dial>, Verify setting
- Enter via keypad → Hands to keyboard, Type <value> (or Keystroke <key>), Verify outcome

General guidance:
- Keep models concise. Prefer short method patterns (e.g., Point and Click; Turn and Verify).
- Use Hands when switching devices (mouse ↔ keyboard, touchscreen ↔ physical controls).
- Precede motor actions with Look and follow with Verify where appropriate.
- Use chunk brackets <> for memory when relevant, paired with allowed memory operators.

COMMENTS AND OUTPUT FORMAT:
- Any comments or descriptive notes must each be on their own line starting with '* ' (asterisk + space).
- Do not include parenthetical notes on operator lines; place notes in a preceding '* ' comment line.
- Do not output anything before the Goal line except optional '* ' comment lines.

Output shape:
* <optional comment>
Goal: <task>
. <Operator> ...
. <Operator> ...
`;

function buildUserMessage(question, chunks) {
  if (chunks.length === 0) {
    return `Question: ${question}\n\n(No relevant context was found in the knowledge base.)`;
  }

  const contextBlock = chunks
    .map((c, i) => {
      const label = c.source_type === 'goms_model' || c.source_type === 'goms_model_summary'
        ? `[${i + 1}] ${c.source} — ${c.goal_name ?? 'overview'} (similarity: ${c.similarity.toFixed(2)})`
        : `[${i + 1}] ${c.source} (similarity: ${c.similarity.toFixed(2)})`;
      return `${label}\n${c.text}`;
    })
    .join('\n\n---\n\n');

  return `Use the following excerpts to answer the question.\n\n${contextBlock}\n\n---\n\nQuestion: ${question}`;
}

// ─── Conversation history ─────────────────────────────────────────────────────

// Multi-turn: keep a short rolling window so the LLM has conversational context.
// Each entry: { role: 'user'|'assistant', content: string }
const MAX_HISTORY_TURNS = 6; // 6 pairs = 12 messages
const conversationHistory = [];

function pushHistory(role, content) {
  conversationHistory.push({ role, content });
  // Trim to the last N turns (each turn = 1 user + 1 assistant message)
  const maxMessages = MAX_HISTORY_TURNS * 2;
  while (conversationHistory.length > maxMessages) {
    conversationHistory.shift();
  }
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

let currentAbortController = null;

// ─── IPC handlers ─────────────────────────────────────────────────────────────

/**
 * Renderer calls:
 *   ipcRenderer.invoke('rag-query', { question, conversationId })
 *
 * Main process streams tokens back via:
 *   ipcRenderer.on('rag-token',  (_, token) => appendToChat(token))
 *   ipcRenderer.on('rag-done',   (_, { sources }) => showSources(sources))
 *   ipcRenderer.on('rag-error',  (_, message) => showError(message))
 */
export function registerRagHandlers(mainWindow) {

  // ── rag-query ──────────────────────────────────────────────────────────────
  //ipcMain.on('rag-query', async (event, { question }) => {
  ipcMain.on('rag-query', async (event, question) => {
    // Cancel any in-flight request
    console.log("🌂 RAG Handler:", question);

    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();
    const { signal } = currentAbortController;

    const send = (channel, payload) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
      }
    };

    try {
      // 1. Retrieve relevant chunks
      const baseChunks = await retrieve(question);

      // 2. Augment context with assembly rules and key operator references
      const extras = await fetchAugmentedContext(question);
      const combined = diversifyAndLimitContext(baseChunks, extras, MATCH_COUNT);

      // 3. Build messages array (system + history + new user turn)
      const userMessage = buildUserMessage(question, combined);
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];

      // 4. Stream from Groq (single call)
      const stream = await groq.chat.completions.create({
        model:       'llama-3.3-70b-versatile',
        messages,
        stream:      true,
        temperature: 0.2,   // lower temp for stricter adherence to rules
        max_tokens:  1024,
      }, { signal });

      // 4. Forward tokens to renderer as they arrive
      let fullResponse = '';
      for await (const chunk of stream) {
        if (signal.aborted) break;
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) {
          fullResponse += token;
          send('rag-token', token);
        }
      }

      // 5. Update conversation history
      pushHistory('user', question);           // store the raw question, not the context-padded one
      pushHistory('assistant', fullResponse);

      // 6. Signal completion and pass source attribution to the UI
      const sources = combined.map(c => ({
        source:      c.source,
        source_type: c.source_type,
        model_name:  c.model_name ?? null,
        goal_name:   c.goal_name  ?? null,
        similarity:  c.similarity,
      }));
      send('rag-done', { 
          fullResponse: fullResponse, 
          sources: sources
      });

    } catch (err) {
      if (err.name === 'AbortError' || signal.aborted) {
        send('rag-done', { sources: [], cancelled: true });
      } else {
        console.error('[RAG] Query error:', err);
        send('rag-error', err.message ?? 'Unknown error');
      }
    } finally {
      currentAbortController = null;
    }
  });

  // ── rag-cancel ─────────────────────────────────────────────────────────────
  ipcMain.handle('rag-cancel', async () => {
    if (currentAbortController) {
      currentAbortController.abort();
    }
  });

  // ── rag-clear-history ──────────────────────────────────────────────────────
  ipcMain.handle('rag-clear-history', async () => {
    conversationHistory.length = 0;
  });
}

// ─── Context augmentation helpers ────────────────────────────────────────────

function heuristicOperatorsForQuestion(q) {
  const lower = (q || '').toLowerCase();
  const ops = new Set(['Operator Reference: Look', 'Operator Reference: Verify', 'Operator Reference: Hands']);

  if (/(turn|dial|tune|rotate|knob)/.test(lower)) ops.add('Operator Reference: Turn');
  if (/(tap|touch|press|select|button)/.test(lower)) ops.add('Operator Reference: Touch');
  if (/(click|mouse)/.test(lower)) ops.add('Operator Reference: Click');
  if (/(type|enter|keyboard|keystroke)/.test(lower)) {
    ops.add('Operator Reference: Type');
    ops.add('Operator Reference: Keystroke');
  }
  return Array.from(ops);
}

async function fetchAugmentedContext(questionText) {
  const extras = [];

  // Assembly rules doc
  const { data: rulesRows, error: rulesErr } = await supabase
    .from('cogulator_chunks')
    .select('text, source, source_type, model_name, goal_name, chunk_index')
    .eq('source', 'Assembly_Rules.md')
    .limit(1);
  if (!rulesErr && rulesRows && rulesRows.length > 0) {
    const r = rulesRows[0];
    extras.push({ ...r, similarity: 0.95 });
  }

  // Operator references (heuristic selection)
  const wantedSources = heuristicOperatorsForQuestion(questionText);
  if (wantedSources.length > 0) {
    const { data: opRows, error: opErr } = await supabase
      .from('cogulator_chunks')
      .select('text, source, source_type, model_name, goal_name, chunk_index')
      .eq('source_type', 'operator_reference')
      .in('source', wantedSources)
      .limit(wantedSources.length);
    if (!opErr && opRows) {
      opRows.forEach(r => extras.push({ ...r, similarity: 0.9 }));
    }
  }

  return extras;
}

function diversifyAndLimitContext(baseChunks, extras, limit) {
  // Always include extras first (rules + 2–4 operator refs), then top base chunks
  const combined = [...extras, ...baseChunks];
  // Deduplicate by source + chunk_index to avoid repeats
  const seen = new Set();
  const unique = [];
  for (const c of combined) {
    const key = `${c.source}::${c.chunk_index ?? 'n'}`;
    if (!seen.has(key)) { seen.add(key); unique.push(c); }
    if (unique.length >= limit) break;
  }
  return unique;
}
