-- Audit log: an append-only record of who did what, per organization.
-- Writes happen via the service-role client (trusted server code), so there is
-- no INSERT policy; org members can read their own org's log.
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  actor_id    uuid,
  actor_email text,
  action      text not null,            -- e.g. case.create, document.view
  target_type text,                     -- case | document | note | deadline | chat
  target_id   uuid,
  case_id     uuid references public.cases(id) on delete set null,
  summary     text,                     -- human-readable description
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_org_idx  on public.audit_logs(org_id, created_at desc);
create index audit_logs_case_idx on public.audit_logs(case_id);

alter table public.audit_logs enable row level security;

create policy audit_select on public.audit_logs
  for select using (public.is_org_member(org_id));
