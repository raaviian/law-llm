-- Documents now embed incrementally (chunks are stored first with a null
-- embedding, then filled in over time). Make vector search skip chunks that
-- aren't embedded yet so a partially-indexed document still returns correct
-- (if incomplete) results instead of erroring on null vectors.
create or replace function public.match_document_chunks(
  p_case_id   uuid,
  query_embedding vector(1024),
  match_count int default 8
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  page        int,
  similarity  float
)
language sql stable security definer set search_path = public
as $$
  select dc.id, dc.document_id, dc.content, dc.page,
         1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.case_id = p_case_id
    and dc.embedding is not null
    and public.can_access_case(p_case_id)
  order by dc.embedding <=> query_embedding
  limit match_count
$$;
