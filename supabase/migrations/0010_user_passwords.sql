-- Email/password credentials. Hashes are stored here (bcrypt), locked down to
-- the service role only (RLS on, no policies). The canonical user identity
-- still lives in next_auth.users; user_id links the two.
create table public.user_passwords (
  user_id       uuid primary key,
  email         text not null unique,
  name          text,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
alter table public.user_passwords enable row level security;
-- (no policies — service-role access only)
