-- Email verification for password accounts.
-- Google sign-ins are pre-verified by the provider and never get a
-- user_passwords row, so this only gates the Credentials provider.

-- Track when a password account's email was confirmed.
alter table public.user_passwords
  add column if not exists email_verified_at timestamptz;

-- Grandfather any accounts that already exist so this change can't lock
-- current users out; only sign-ups created after this migration must verify.
update public.user_passwords
  set email_verified_at = coalesce(email_verified_at, created_at, now())
  where email_verified_at is null;

-- Single-use verification tokens (service-role only — no RLS policies).
create table if not exists public.email_verification_tokens (
  token       text primary key,
  user_id     uuid not null,
  email       text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists email_verification_tokens_user_id_idx
  on public.email_verification_tokens (user_id);

alter table public.email_verification_tokens enable row level security;
