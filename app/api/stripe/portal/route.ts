import { NextResponse } from "next/server";
import { requireUserAndOrg } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  let orgId: string;
  try {
    ({ orgId } = await requireUserAndOrg());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet. Subscribe to a plan first." },
      { status: 400 },
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${env.appUrl}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
