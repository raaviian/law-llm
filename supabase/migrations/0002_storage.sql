-- Private bucket for uploaded case files. Access is mediated by the server
-- (service role) after verifying the caller owns the case, so we keep the
-- bucket private and do not add public storage policies.
insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;
