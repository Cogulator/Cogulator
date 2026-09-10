-- Apply once, while the project is paused, to harden an existing database.
-- This migration makes cogulator_chunks inaccessible through the REST table
-- endpoint. Anonymous clients may call only the bounded search RPC.

begin;

drop policy if exists "Public Cogulator corpus is readable" on public.cogulator_chunks;
revoke all on table public.cogulator_chunks from anon, authenticated;

drop function if exists public.match_cogulator_chunks(extensions.vector, integer, double precision);

create or replace function public.match_cogulator_chunks(query_embedding extensions.vector(384))
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
-- The vector-distance operator lives in the Supabase extensions schema. Keep
-- this path fixed and omit public; every application object is schema-qualified.
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

commit;
