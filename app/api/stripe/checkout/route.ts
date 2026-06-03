import { NextResponse } from "next/server";
import { requireUserAndOrg } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, PLANS, type PlanKey } from "@/lib/stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user, orgId;
  try {
    ({ user, orgId } = await requireUserAndOrg());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: PlanKey };
  const planConfig = PLANS[plan];
  if (!planConfig?.priceId) {
    return NextResponse.json(
      { error: "This plan is not configured. Set its Stripe price id." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  // Reuse or create the org's Stripe customer.
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", orgId)
    .single();

  let customerId = org?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org?.name ?? undefined,
      email: user.email ?? undefined,
      metadata: { org_id: orgId },
    });
    customerId = customer.id;
    await admin
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", orgId);
  }

  // Per-seat pricing: quantity follows the org's member count.
  const { count } = await admin
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  const seats = Math.max(1, count ?? 1);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: planConfig.priceId, quantity: seats }],
    success_url: `${env.appUrl}/settings/billing?status=success`,
    cancel_url: `${env.appUrl}/settings/billing?status=cancelled`,
    metadata: { org_id: orgId, plan },
    subscription_data: { metadata: { org_id: orgId, plan } },
  });

  return NextResponse.json({ url: session.url });
}
