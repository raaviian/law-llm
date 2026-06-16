import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { env, isGoogleAuthConfigured } from "@/lib/env";
import { ensureOrgForUser } from "@/lib/orgs";
import { createAdminClient } from "@/lib/supabase/admin";

// Email + password. Hashes live in public.user_passwords (service-role only).
const credentials = Credentials({
  name: "credentials",
  credentials: { email: {}, password: {} },
  authorize: async (creds) => {
    const email = String(creds?.email ?? "").trim().toLowerCase();
    const password = String(creds?.password ?? "");
    if (!email || !password) return null;
    const admin = createAdminClient();
    const { data } = await admin
      .from("user_passwords")
      .select("user_id, name, password_hash")
      .eq("email", email)
      .maybeSingle();
    if (!data?.password_hash) return null;
    const bcrypt = (await import("bcryptjs")).default;
    const ok = await bcrypt.compare(password, data.password_hash as string);
    if (!ok) return null;
    return { id: data.user_id as string, email, name: (data.name as string) ?? null };
  },
});

const providers = [
  ...(isGoogleAuthConfigured
    ? [
        Google({
          clientId: env.googleId,
          clientSecret: env.googleSecret,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  credentials,
];

// Only construct the adapter when Supabase is configured — it creates a client
// eagerly and would throw on an empty url (e.g. during a credential-less build).
const adapter =
  env.supabaseUrl && env.supabaseServiceKey
    ? SupabaseAdapter({ url: env.supabaseUrl, secret: env.supabaseServiceKey })
    : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers,
  secret: env.authSecret,
  // Trust the deployment host (Vercel sets a dynamic URL); avoids UntrustedHost
  // errors in production. AUTH_URL/NEXTAUTH_URL still anchors OAuth redirects.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // Persist the user id on the JWT so the session and RLS token can use it.
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // Fired once when the adapter creates a brand-new user → bootstrap their org.
    async createUser({ user }) {
      if (user.id) {
        await ensureOrgForUser(user.id, user.name ?? user.email ?? "My Firm");
      }
    },
  },
});
