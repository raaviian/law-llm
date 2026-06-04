# LexBoard — AI case management for lawyers

A SaaS web app where lawyers manage cases, plan court strategy, keep notes and
deadlines, and **chat with their own case files** through a private,
citation-backed "NotebookLLM".

Built with **Next.js 16 (App Router)**, **Auth.js v5 (NextAuth)**, **Supabase**
(Postgres + Storage + pgvector), **Anthropic Claude** for chat, and
**Voyage AI `voyage-law-2`** for legal-domain embeddings. Billing is per-seat via
**Stripe**.

> ⚖️ LexBoard is a productivity tool, not a law firm, and its AI output is not
> legal advice.

---

## Features

- **Cases** — CRUD with client, court, jurisdiction, case number, status.
- **Documents** — upload PDF/DOCX/TXT; text is extracted, chunked, and embedded.
- **NotebookLLM chat** — ask questions about a case; Claude answers only from the
  uploaded documents and cites the source document/page.
- **Notes**, **court strategy board** (objectives / arguments / risks / timeline),
  and **deadlines**.
- **Per-seat billing** (Solo / Firm) with Stripe Checkout, Customer Portal, and
  webhooks.
- **Multi-tenant + RLS** — every row is scoped to an organization the user
  belongs to.

## Architecture

```
Next.js (App Router, RSC + Route Handlers)
 ├─ Auth.js v5  ──────────────► Supabase (next_auth schema via adapter)
 ├─ Server actions / RSC  ────► Supabase (public schema, RLS via signed JWT)
 ├─ /api/documents/upload ────► Supabase Storage + ingestion pipeline
 │     extract (pdf-parse/mammoth) → chunk → embed (Voyage) → document_chunks
 └─ /api/chat ────────────────► retrieve (pgvector) → Claude (streamed, cited)
```

RLS works by signing a short-lived Supabase JWT (`sub` = user id) per request in
`lib/supabase/server.ts`; policies authorize via `public.is_org_member()`.

## Prerequisites

- **Node 18.18+** (this repo was built on Node 24). If you use nvm-windows:
  `nvm use 24`.
- A **Supabase** project, **Anthropic** API key, **Voyage AI** API key, and a
  **Google OAuth** client. Stripe is optional (billing).

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Database** — in the Supabase SQL editor, run the migrations in order:

   - `supabase/migrations/0001_init.sql` (schema, pgvector, RLS, RPCs)
   - `supabase/migrations/0002_storage.sql` (private `case-files` bucket)

   Then in **Project Settings → API → Exposed schemas**, add `next_auth` so the
   Auth.js adapter can read/write it.

3. **Environment** — copy `.env.example` to `.env.local` and fill in:

   - `AUTH_SECRET` — run `npx auth secret`.
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google Cloud OAuth client. Add
     redirect URI `http://localhost:3000/api/auth/callback/google`.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` — from Supabase settings.
   - `ANTHROPIC_API_KEY` (and optional `ANTHROPIC_MODEL`).
   - `VOYAGE_API_KEY` (model defaults to `voyage-law-2`).
   - Stripe (optional): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `NEXT_PUBLIC_STRIPE_PRICE_SOLO`, `NEXT_PUBLIC_STRIPE_PRICE_FIRM`.

4. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, sign in with Google, create a case, upload a
   document, and chat with it.

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the printed signing secret as `STRIPE_WEBHOOK_SECRET`.

## Notes & next steps

- **Ingestion is inline** in the upload route (simple for an MVP). For large
  files or high volume, move `ingestDocument` to a background queue
  (Inngest / Trigger.dev / Supabase Edge Function + pg-boss).
- **Embedding dimension** is `vector(1024)` to match `voyage-law-2`. If you swap
  the embedding model, update the column and `match_document_chunks`.
- Plan-based usage limits (free tier gating) are scaffolded via
  `organizations.plan` but not yet enforced — add checks in server actions.
