-- Saved AI drafts, so generated documents can be kept, reopened, and searched
-- (previously a draft was lost unless manually copied into notes).
create table if not exists public.drafts (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  doc_type     text not null,
  title        text not null,
  content      text not null,
  instructions text,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists drafts_case_id_idx on public.drafts(case_id);

alter table public.drafts enable row level security;

-- Per-matter access, mirroring the notes/strategies policy in 0005.
drop policy if exists drafts_access on public.drafts;
create policy drafts_access on public.drafts
  for all
  using (public.can_access_case(case_id))
  with check (public.can_access_case(case_id));
