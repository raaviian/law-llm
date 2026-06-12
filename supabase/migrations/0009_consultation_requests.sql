-- Public "request a consultation" leads from the marketing site. Inserted by a
-- public server action via the service role; RLS on with no policies (the
-- table is never read through the user client).
create table public.consultation_requests (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  email          text not null,
  phone          text,
  practice_area  text,
  preferred_date date,
  message        text,
  created_at     timestamptz not null default now()
);
alter table public.consultation_requests enable row level security;
