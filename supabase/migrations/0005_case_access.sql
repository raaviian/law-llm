-- =============================================================================
-- Per-matter access controls ("ethical walls").
--   - cases.visibility: 'org' (whole firm) | 'private' (restricted)
--   - case_access: explicit per-user grants for private cases
--   - can_access_case(): central access predicate used by RLS
-- A user can access a case when it is org-visible, OR they are owner/admin,
-- OR they created it, OR they have an explicit grant.
-- =============================================================================

alter table public.cases
  add column if not exists visibility text not null default 'org'; -- org | private

create table if not exists public.case_access (
  case_id    uuid not null references public.cases(id) on delete cascade,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (case_id, user_id)
);
alter table public.case_access enable row level security;

create or replace function public.can_access_case(c_id uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.cases c
    join public.memberships m
      on m.org_id = c.org_id and m.user_id = public.auth_uid()
    where c.id = c_id
      and (
        c.visibility = 'org'
        or m.role in ('owner', 'admin')
        or c.created_by = public.auth_uid()
        or exists (
          select 1 from public.case_access ca
          where ca.case_id = c.id and ca.user_id = public.auth_uid()
        )
      )
  )
$$;

-- case_access: readable by anyone who can access the case (writes via service role)
create policy case_access_select on public.case_access
  for select using (public.can_access_case(case_id));

-- -----------------------------------------------------------------------------
-- Replace the broad org-level policies with per-matter ones.
-- -----------------------------------------------------------------------------

-- cases
drop policy if exists cases_all on public.cases;
create policy cases_select on public.cases
  for select using (public.can_access_case(id));
create policy cases_insert on public.cases
  for insert with check (public.is_org_member(org_id));
create policy cases_update on public.cases
  for update using (public.can_access_case(id))
  with check (public.is_org_member(org_id));
create policy cases_delete on public.cases
  for delete using (public.can_access_case(id));

-- Helper to (re)create a uniform per-matter policy on a case-scoped table.
do $$
declare t text;
begin
  foreach t in array array[
    'documents','document_chunks','notes','strategies','deadlines','chat_threads'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id))',
      t || '_access', t);
  end loop;
end $$;

-- chat_messages has no case_id; resolve it through the thread.
drop policy if exists messages_all on public.chat_messages;
create policy messages_access on public.chat_messages
  for all
  using (
    exists (select 1 from public.chat_threads t
            where t.id = thread_id and public.can_access_case(t.case_id))
  )
  with check (
    exists (select 1 from public.chat_threads t
            where t.id = thread_id and public.can_access_case(t.case_id))
  );

-- audit log: hide entries that reference a case the member can't access.
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs
  for select using (
    public.is_org_member(org_id)
    and (case_id is null or public.can_access_case(case_id))
  );

-- Retrieval RPC: enforce per-matter access on vector search too.
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
    and public.can_access_case(p_case_id)
  order by dc.embedding <=> query_embedding
  limit match_count
$$;
