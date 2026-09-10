import { Ratelimit } from 'npm:@upstash/ratelimit@^2';
import { Redis } from 'npm:@upstash/redis@^1';

const MAX_REQUESTS = 10;
const WINDOW = '5 m';
const EMBEDDING_DIMENSIONS = 384;
const MAX_BODY_BYTES = 32_000;

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function getSecretKey() {
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  const key = keys.default;
  if (typeof key !== 'string' || !key.startsWith('sb_secret_')) {
    throw new Error('The Edge Function has no default Supabase secret key configured.');
  }
  return key;
}

function getRateLimiter() {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) throw new Error('Upstash Redis is not configured.');

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW),
    prefix: 'cogulator:rag-retrieve',
  });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ error: 'Request body is too large.' }, 413);
  }

  // Fail closed: an unavailable limiter must never allow a database query.
  try {
    const limit = await getRateLimiter().limit(clientIp(request));
    if (!limit.success) {
      return json(
        { error: 'Too many retrieval requests. Try again later.' },
        429,
        { 'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1_000)) },
      );
    }
  } catch (error) {
    console.error('Rate limiter unavailable:', error);
    return json({ error: 'Retrieval is temporarily unavailable.' }, 503);
  }

  let query_embedding: unknown;
  try {
    ({ query_embedding } = await request.json());
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (!Array.isArray(query_embedding)
      || query_embedding.length !== EMBEDDING_DIMENSIONS
      || !query_embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    return json({ error: 'query_embedding must contain 384 finite numbers.' }, 400);
  }

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/match_cogulator_chunks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: getSecretKey(),
      },
      body: JSON.stringify({ query_embedding }),
    });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('Database retrieval failed:', error);
    return json({ error: 'Retrieval is temporarily unavailable.' }, 503);
  }
});
