import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, requireEnv } from "@/lib/env";

/**
 * Service-role Supabase client. BYPASSES RLS — use only on the server for
 * trusted operations (ingestion workers, Stripe webhooks, the NextAuth adapter).
 * Never import this into client components.
 */
export function createAdminClient() {
  return createClient(
    requireEnv(env.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(env.supabaseServiceKey, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    },
  );
}
