-- Run only after rag-retrieve is deployed and its Upstash secrets are set.
-- The function will then be callable only by the Edge Function's secret key.

begin;

alter function public.match_cogulator_chunks(extensions.vector)
  security invoker;
revoke all on function public.match_cogulator_chunks(extensions.vector)
  from public, anon, authenticated;
grant execute on function public.match_cogulator_chunks(extensions.vector)
  to service_role;
grant select on table public.cogulator_chunks to service_role;

commit;
