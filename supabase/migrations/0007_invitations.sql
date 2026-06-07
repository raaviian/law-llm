-- Team invitations. An owner/admin invites a teammate by email; the invitee
-- accepts via a tokenized link after signing in with that Google email.
create table public.invitations (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  email      text not null,
  role       text not null default 'member',   -- member | admin
  token      uuid not null default uuid_generate_v4(),
  status     text not null default 'pending',   -- pending | accepted | revoked
  invited_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);
create index invitations_token_idx on public.invitations(token);
create index invitations_org_idx   on public.invitations(org_id);

alter table public.invitations enable row level security;

-- Org members can see their org's invitations. Writes (create/revoke/accept)
-- go through the service-role client after app-level authorization, and the
-- invitee reads their invite by token via the service role (they aren't a
-- member yet), so no insert/accept policies are needed here.
create policy invitations_select on public.invitations
  for select using (public.is_org_member(org_id));
