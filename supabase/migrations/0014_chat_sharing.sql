-- Role-gated chat sharing: a thread can be opened via a tokenized in-app link
-- by firm members whose role meets share_min_role (member|admin|owner).
-- null share_min_role = not shared. Authorization happens in the share route
-- (admin client), so no RLS change is needed here.
alter table public.chat_threads
  add column if not exists share_token text,
  add column if not exists share_min_role text;

create unique index if not exists chat_threads_share_token_key
  on public.chat_threads(share_token)
  where share_token is not null;
