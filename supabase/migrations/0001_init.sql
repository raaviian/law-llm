-- =============================================================================
-- LexBoard initial schema
--   - next_auth schema: tables required by @auth/supabase-adapter (Auth.js v5)
--   - public schema:    application tables (orgs, cases, docs, chat, billing)
--   - pgvector:         document_chunks.embedding for RAG retrieval
--   - RLS:              every app row is scoped to an organization the caller
--                       is a member of. The caller is identified by a Supabase
--                       JWT we sign in the NextAuth session callback whose
--                       `sub` claim is the next_auth user id.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- -----------------------------------------------------------------------------
-- next_auth schema (managed by @auth/supabase-adapter)
-- -----------------------------------------------------------------------------
create schema if not exists next_auth;
grant usage on schema next_auth to service_role;
grant all on schema next_auth to postgres;

create table if not exists next_auth.users (
  id            uuid not null default uuid_generate_v4(),
  name          text,
  email         text,
  "emailVerified" timestamptz,
  image         text,
  constraint users_pkey primary key (id),
  constraint email_unique unique (email)
);
grant all on table next_auth.users to postgres, service_role;

create table if not exists next_auth.sessions (
  id            uuid not null default uuid_generate_v4(),
  expires       timestamptz not null,
  "sessionToken" text not null,
  "userId"      uuid,
  constraint sessions_pkey primary key (id),
  constraint sessions_sessiontoken_unique unique ("sessionToken"),
  constraint "sessions_userId_fkey" foreign key ("userId")
    references next_auth.users (id) on delete cascade
);
grant all on table next_auth.sessions to postgres, service_role;

create table if not exists next_auth.accounts (
  id                  uuid not null default uuid_generate_v4(),
  type                text not null,
  provider            text not null,
  "providerAccountId" text not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  oauth_token_secret  text,
  oauth_token         text,
  "userId"            uuid,
  constraint accounts_pkey primary key (id),
  constraint "accounts_userId_fkey" foreign key ("userId")
    references next_auth.users (id) on delete cascade
);
grant all on table next_auth.accounts to postgres, service_role;

create table if not exists next_auth.verification_tokens (
  identifier  text,
  token       text,
  expires     timestamptz not null,
  constraint verification_tokens_pkey primary key (token),
  constraint token_unique unique (token),
  constraint token_identifier_unique unique (token, identifier)
);
grant all on table next_auth.verification_tokens to postgres, service_role;

-- Helper used by the adapter; resolves the current user id from the JWT.
create or replace function next_auth.uid() returns uuid
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- public.auth_uid(): same resolution, usable from public RLS policies.
create or replace function public.auth_uid() returns uuid
  language sql stable
as $$ select next_auth.uid() $$;

-- =============================================================================
-- Application tables (public schema)
-- =============================================================================

-- Organizations (a law firm; a solo lawyer is an org of one) ------------------
create table public.organizations (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,
  plan               text not null default 'free',  -- free | solo | firm | enterprise
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

create table public.memberships (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null,  -- next_auth.users.id
  role       text not null default 'member',  -- owner | admin | member
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_user_idx on public.memberships(user_id);
create index memberships_org_idx  on public.memberships(org_id);

-- Cases -----------------------------------------------------------------------
create table public.cases (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  title         text not null,
  client_name   text,
  jurisdiction  text,           -- country / region, free text for global use
  court         text,
  case_number   text,
  parties       jsonb not null default '[]'::jsonb,
  status        text not null default 'open',  -- open | active | closed
  description   text,
  opened_at     date,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index cases_org_idx on public.cases(org_id);

-- Documents -------------------------------------------------------------------
create table public.documents (
  id           uuid primary key default uuid_generate_v4(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  file_name    text not null,
  storage_path text not null,
  mime_type    text,
  size         bigint,
  status       text not null default 'uploaded', -- uploaded | processing | ready | failed
  error        text,
  page_count   int,
  uploaded_by  uuid,
  created_at   timestamptz not null default now()
);
create index documents_case_idx on public.documents(case_id);

-- Document chunks (RAG) -------------------------------------------------------
-- voyage-law-2 returns 1024-dimensional embeddings.
create table public.document_chunks (
  id          uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  case_id     uuid not null references public.cases(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  content     text not null,
  page        int,
  chunk_index int not null,
  tokens      int,
  embedding   vector(1024),
  created_at  timestamptz not null default now()
);
create index document_chunks_case_idx on public.document_chunks(case_id);
create index document_chunks_embedding_idx
  on public.document_chunks using hnsw (embedding vector_cosine_ops);

-- Notes -----------------------------------------------------------------------
create table public.notes (
  id         uuid primary key default uuid_generate_v4(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  author_id  uuid,
  title      text,
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_case_idx on public.notes(case_id);

-- Court strategy board (one per case) -----------------------------------------
create table public.strategies (
  id          uuid primary key default uuid_generate_v4(),
  case_id     uuid not null unique references public.cases(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  objectives  jsonb not null default '[]'::jsonb,
  arguments   jsonb not null default '[]'::jsonb,
  risks       jsonb not null default '[]'::jsonb,
  timeline    jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Deadlines / calendar --------------------------------------------------------
create table public.deadlines (
  id         uuid primary key default uuid_generate_v4(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  title      text not null,
  type       text not null default 'reminder', -- hearing | filing | reminder
  due_at     timestamptz not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index deadlines_case_idx on public.deadlines(case_id);

-- Chat threads & messages (NotebookLLM) ---------------------------------------
create table public.chat_threads (
  id         uuid primary key default uuid_generate_v4(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  title      text not null default 'New chat',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index chat_threads_case_idx on public.chat_threads(case_id);

create table public.chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  thread_id  uuid not null references public.chat_threads(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  role       text not null, -- user | assistant
  content    text not null,
  citations  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index chat_messages_thread_idx on public.chat_messages(thread_id);

-- Subscriptions (Stripe) ------------------------------------------------------
create table public.subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  org_id                 uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  status                 text,        -- active | trialing | past_due | canceled ...
  plan                   text,        -- solo | firm | enterprise
  seats                  int not null default 1,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);
create index subscriptions_org_idx on public.subscriptions(org_id);

-- =============================================================================
-- RLS helper + vector search RPC
-- =============================================================================

-- True when the current JWT user is a member of org `org`.
create or replace function public.is_org_member(org uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = org and m.user_id = public.auth_uid()
  )
$$;

-- Cosine-similarity search over a single case's chunks.
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
    and public.is_org_member(dc.org_id)
  order by dc.embedding <=> query_embedding
  limit match_count
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.organizations  enable row level security;
alter table public.memberships    enable row level security;
alter table public.cases          enable row level security;
alter table public.documents      enable row level security;
alter table public.document_chunks enable row level security;
alter table public.notes          enable row level security;
alter table public.strategies     enable row level security;
alter table public.deadlines      enable row level security;
alter table public.chat_threads   enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.subscriptions  enable row level security;

-- organizations: members can read; updates handled server-side (service role).
create policy org_select on public.organizations
  for select using (public.is_org_member(id));

-- memberships: a user can see membership rows for orgs they belong to.
create policy membership_select on public.memberships
  for select using (public.is_org_member(org_id));

-- Generic org-scoped policy for the rest of the app tables.
create policy cases_all on public.cases
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy documents_all on public.documents
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy chunks_all on public.document_chunks
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy notes_all on public.notes
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy strategies_all on public.strategies
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy deadlines_all on public.deadlines
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy threads_all on public.chat_threads
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy messages_all on public.chat_messages
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy subscriptions_select on public.subscriptions
  for select using (public.is_org_member(org_id));
