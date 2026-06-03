import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planFromPriceId } from "@/lib/stripe";
import { env, requireEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig ?? "",
      requireEnv(env.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET"),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();

  async function syncSubscription(sub: Stripe.Subscription) {
    const orgId = sub.metadata?.org_id;
    if (!orgId) return;
    const item = sub.items.data[0];
    const priceId = item?.price.id ?? null;
    const plan = planFromPriceId(priceId);
    // current_period_end lives on the subscription item in recent API versions,
    // and on the subscription in older ones — support both.
    const periodEnd =
      (item as unknown as { current_period_end?: number })?.current_period_end ??
      (sub as unknown as { current_period_end?: number }).current_period_end;

    await admin.from("subscriptions").upsert(
      {
        org_id: orgId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        status: sub.status,
        plan,
        seats: item?.quantity ?? 1,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

    const activePlan =
      sub.status === "active" || sub.status === "trialing" ? plan : "free";
    await admin
      .from("organizations")
      .update({ plan: activePlan ?? "free" })
      .eq("id", orgId);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        await syncSubscription(sub);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
