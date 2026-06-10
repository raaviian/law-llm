-- Per-org "bring your own key" AI settings. The api_key is stored ENCRYPTED by
-- the app (AES-256-GCM) and is only ever read server-side via the service role.
-- RLS is enabled with NO policies, so it is unreadable through the user client
-- (RLS) — keys never reach the browser or a user-scoped query.
create table public.org_ai_settings (
  org_id     uuid primary key references public.organizations(id) on delete cascade,
  provider   text not null default 'gemini',  -- gemini | anthropic | openai
  model      text,
  api_key    text,                              -- encrypted at the app layer
  updated_at timestamptz not null default now()
);

alter table public.org_ai_settings enable row level security;
-- (intentionally no policies — service-role only)
