import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { env, isGoogleAuthConfigured } from "@/lib/env";
import { ensureOrgForUser } from "@/lib/orgs";

const providers = isGoogleAuthConfigured
  ? [
      Google({
        clientId: env.googleId,
        clientSecret: env.googleSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    ]
  : [];

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
