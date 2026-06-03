import "server-only";
import Stripe from "stripe";
import { env, requireEnv } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(requireEnv(env.stripeSecret, "STRIPE_SECRET_KEY"));
  }
  return stripe;
}

export const isStripeConfigured = Boolean(env.stripeSecret);

export type PlanKey = "solo" | "firm";

export const PLANS: Record<
  PlanKey,
  { name: string; priceId: string; perSeat: string; blurb: string; features: string[] }
> = {
  solo: {
    name: "Solo",
    priceId: env.stripePriceSolo,
    perSeat: "$39 / seat / mo",
    blurb: "For independent lawyers.",
    features: [
      "Unlimited cases",
      "Document chat with citations",
      "Notes, strategy & deadlines",
      "1 seat",
    ],
  },
  firm: {
    name: "Firm",
    priceId: env.stripePriceFirm,
    perSeat: "$69 / seat / mo",
    blurb: "For small & growing firms.",
    features: [
      "Everything in Solo",
      "Team seats & roles",
      "Higher AI usage limits",
      "Priority document processing",
    ],
  },
};

export function planFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  if (priceId === env.stripePriceSolo) return "solo";
  if (priceId === env.stripePriceFirm) return "firm";
  return null;
}
