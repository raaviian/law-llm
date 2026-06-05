/**
 * Centralized environment access. We intentionally do NOT throw at import time
 * (so the app can boot for pages that don't need every integration); instead use
 * `requireEnv` at the point of use to fail loudly with a helpful message.
 */
export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",

  authSecret: process.env.AUTH_SECRET ?? "",
  googleId: process.env.AUTH_GOOGLE_ID ?? "",
  googleSecret: process.env.AUTH_GOOGLE_SECRET ?? "",

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",

  geminiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  voyageKey: process.env.VOYAGE_API_KEY ?? "",
  voyageModel: process.env.VOYAGE_MODEL ?? "voyage-law-2",

  stripeSecret: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceSolo: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO ?? "",
  stripePriceFirm: process.env.NEXT_PUBLIC_STRIPE_PRICE_FIRM ?? "",
};

export function requireEnv(value: string, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export const isGoogleAuthConfigured = Boolean(env.googleId && env.googleSecret);
