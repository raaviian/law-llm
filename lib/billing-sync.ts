import "server-only";
import type Stripe from "stripe";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Upsert a Stripe subscription into our DB and reflect the plan on the org. */
export async function syncSubscriptionToDb(
  sub: Stripe.Subscription,
): Promise<void> {
  const orgId = sub.metadata?.org_id;
  if (!orgId) return;

  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const plan = planFromPriceId(priceId);
  // current_period_end is on the item in recent API versions, on the sub in older.
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;

  const admin = createAdminClient();
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

/**
 * Reconcile an org's plan directly from Stripe (no webhook needed). Used by the
 * "Sync from Stripe" action and as a self-heal if a webhook is ever missed.
 */
export async function syncOrgBillingFromStripe(orgId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", orgId)
    .maybeSingle();
  if (!org?.stripe_customer_id) return;

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: org.stripe_customer_id as string,
    status: "all",
    limit: 10,
  });
  const active =
    subs.data.find((s) => s.status === "active" || s.status === "trialing") ??
    subs.data[0];

  if (!active) {
    await admin.from("organizations").update({ plan: "free" }).eq("id", orgId);
    return;
  }
  await syncSubscriptionToDb(active);
}
