-- Fix: the cases SELECT/UPDATE/DELETE policies used can_access_case(id), which
-- re-queries the cases table. On INSERT ... RETURNING (what supabase-js does for
-- .insert().select()), that self-referential lookup can't see the new row, so
-- the policy rejected the insert (42501). Inline the predicate using the row's
-- own columns instead — identical access semantics, no self-reference.

create or replace function public.case_visible(
  p_org_id uuid, p_created_by uuid, p_visibility text, p_case_id uuid
) returns boolean
  language sql stable security definer set search_path = public
as $$
  select public.is_org_member(p_org_id) and (
    p_visibility = 'org'
    or p_created_by = public.auth_uid()
    or exists (
      select 1 from public.memberships m
      where m.org_id = p_org_id and m.user_id = public.auth_uid()
        and m.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.case_access ca
      where ca.case_id = p_case_id and ca.user_id = public.auth_uid()
    )
  )
$$;

drop policy if exists cases_select on public.cases;
drop policy if exists cases_update on public.cases;
drop policy if exists cases_delete on public.cases;

create policy cases_select on public.cases
  for select using (
    public.case_visible(org_id, created_by, visibility, id)
  );
create policy cases_update on public.cases
  for update using (
    public.case_visible(org_id, created_by, visibility, id)
  )
  with check (public.is_org_member(org_id));
create policy cases_delete on public.cases
  for delete using (
    public.case_visible(org_id, created_by, visibility, id)
  );
