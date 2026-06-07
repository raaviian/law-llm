import { requireUserAndOrg } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { PLANS, isStripeConfigured } from "@/lib/stripe";
import {
  SubscribeButton,
  ManageBillingButton,
} from "@/components/billing-actions";
import { refreshBilling } from "@/lib/actions";
import { getUsage } from "@/lib/limits";
import { formatDate } from "@/lib/utils";

function fmtLimit(n: number): string {
  return n === Infinity ? "∞" : String(n);
}

export default async function BillingPage() {
  const { user, orgId } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  const usage = await getUsage(orgId);

  const [{ data: org }, { data: sub }, { count }] = await Promise.all([
    supabase.from("organizations").select("name, plan").eq("id", orgId).single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);

  const currentPlan = (org?.plan as string) ?? "free";
  const seats = count ?? 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted">{org?.name}</p>
      </div>

      {!isStripeConfigured && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Stripe is not configured. Add <code>STRIPE_SECRET_KEY</code> and price
          ids to enable subscriptions.
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Current plan</p>
            <p className="text-xl font-semibold capitalize text-foreground">
              {currentPlan}
            </p>
            <p className="mt-1 text-sm text-muted">
              {seats} {seats === 1 ? "seat" : "seats"}
              {sub?.current_period_end &&
                ` · renews ${formatDate(sub.current_period_end)}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {currentPlan !== "free" && <ManageBillingButton />}
            {isStripeConfigured && (
              <form action={refreshBilling}>
                <button
                  type="submit"
                  className="text-xs text-muted underline hover:text-foreground"
                >
                  Sync from Stripe
                </button>
              </form>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground">Usage this month</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <UsageBar label="Cases" used={usage.cases} limit={usage.caseLimit} />
          <UsageBar label="AI requests" used={usage.ai} limit={usage.aiLimit} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(PLANS) as ("solo" | "firm")[]).map((key) => {
          const plan = PLANS[key];
          const isCurrent = currentPlan === key;
          return (
            <Card key={key} className="flex flex-col p-6">
              <h3 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted">{plan.blurb}</p>
              <p className="mt-3 text-xl font-bold text-foreground">
                {plan.perSeat}
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <div className="rounded-lg border border-border px-3 py-2 text-center text-sm text-muted">
                    Current plan
                  </div>
                ) : (
                  <SubscribeButton plan={key} label={`Choose ${plan.name}`} />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const unlimited = limit === Infinity;
  const pct = unlimited
    ? 0
    : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const near = !unlimited && pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-foreground">
          {used} / {fmtLimit(limit)}
        </span>
      </div>
      {unlimited ? (
        <p className="mt-2 text-xs text-muted">Unlimited on your plan</p>
      ) : (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${near ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
