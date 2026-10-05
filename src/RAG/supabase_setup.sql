-- Cogulator RAG storage and retrieval setup.
-- Run this in the Supabase SQL Editor before running ingest.js.

create extension if not exists vector;

create table if not exists public.cogulator_chunks (
  id          bigserial primary key,
  text        text not null,
  embedding   vector(384) not null,
  source      text,
  source_type text,
  model_name  text,
  goal_name   text,
  chunk_index integer,
  inserted_at timestamptz not null default now()
);

create index if not exists cogulator_chunks_embedding_idx
  on public.cogulator_chunks using hnsw (embedding vector_cosine_ops);

-- The table is not exposed to the desktop app. It can only call the bounded
-- search function below through the public client role.
alter table public.cogulator_chunks enable row level security;

drop policy if exists "Public Cogulator corpus is readable" on public.cogulator_chunks;
revoke all on table public.cogulator_chunks from anon, authenticated;

create or replace function public.match_cogulator_chunks(
  query_embedding extensions.vector(384)
)
returns table (
  text text,
  source text,
  source_type text,
  model_name text,
  goal_name text,
  chunk_index integer,
  similarity double precision
)
language sql
stable
security definer
set search_path = pg_catalog, extensions
as $$
  select
    c.text,
    c.source,
    c.source_type,
    c.model_name,
    c.goal_name,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.cogulator_chunks as c
  where 1 - (c.embedding <=> query_embedding) > 0.3
  order by c.embedding <=> query_embedding
  limit 6;
$$;

revoke all on function public.match_cogulator_chunks(extensions.vector) from public, authenticated;
grant execute on function public.match_cogulator_chunks(extensions.vector) to anon;
