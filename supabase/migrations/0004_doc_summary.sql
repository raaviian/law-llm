-- Auto-generated document analysis: a short summary plus structured key facts
-- (parties, key dates, obligations, amounts) produced during ingestion.
alter table public.documents
  add column if not exists summary text;
alter table public.documents
  add column if not exists key_facts jsonb not null default '{}'::jsonb;
