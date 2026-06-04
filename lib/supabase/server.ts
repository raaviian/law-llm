import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { env, requireEnv } from "@/lib/env";

/**
 * Sign a short-lived Supabase-compatible JWT for `userId`. RLS policies read the
 * `sub` claim via auth_uid(), so this scopes all queries to that user's orgs.
 */
async function signSupabaseToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(
    requireEnv(env.supabaseJwtSecret, "SUPABASE_JWT_SECRET"),
  );
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

/**
 * Supabase client that runs under the given user's identity with RLS enforced.
 * Use this for all per-user reads/writes from server components and actions.
 */
export async function createUserClient(userId: string): Promise<SupabaseClient> {
  const token = await signSupabaseToken(userId);
  return createClient(
    requireEnv(env.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(env.supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    },
  );
}
