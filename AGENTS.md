# LexBoard

AI case-management SaaS for lawyers. Next.js 16 (App Router) · Auth.js v5 ·
Supabase (Postgres + Storage + pgvector) · Google Gemini (chat, `lib/ai/gemini.ts`) ·
Voyage AI embeddings · Stripe. Both AI providers run on free tiers. See
`README.md` for setup. Conventions:

- **Auth/tenancy**: `lib/auth.ts` (Auth.js + Supabase adapter). Every app row is
  org-scoped; reads/writes go through `createUserClient(userId)`
  (`lib/supabase/server.ts`) which signs a Supabase JWT so RLS applies. Use the
  service-role client (`lib/supabase/admin.ts`) ONLY for trusted server work
  (ingestion, Stripe webhooks, the adapter).
- **RAG**: `lib/ai/*` (embeddings, extract, chunk, rag, gemini) + `/api/chat`.
  `voyage-law-2` → `vector(1024)`; keep the column and `match_document_chunks` in
  sync if the model changes. Chat streams from Gemini via REST (`streamGemini`).
- **DB changes** go in `supabase/migrations/` as new numbered files.
- Always run `npm run build` (typecheck + lint + build) before declaring done.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
