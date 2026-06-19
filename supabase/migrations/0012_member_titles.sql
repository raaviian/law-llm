-- Professional title for a member, shown as a badge. Display-only and separate
-- from the permission role (owner/admin/member). Only owners/admins assign it.
alter table public.memberships add column if not exists title text;

-- Constrain to the known titles (kept in sync with lib/titles.ts).
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'memberships_title_check'
  ) then
    alter table public.memberships add constraint memberships_title_check
      check (title is null or title in
        ('partner','senior_lawyer','junior_lawyer','paralegal','admin_staff'));
  end if;
end $$;
