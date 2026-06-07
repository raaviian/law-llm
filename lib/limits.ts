import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlanKey = "free" | "solo" | "firm" | "enterprise";

export interface PlanLimit {
  cases: number; // max active cases (Infinity = unlimited)
  aiPerMonth: number; // chat/draft/strategy calls per calendar month
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimit> = {
  free: { cases: 1, aiPerMonth: 30 },
  solo: { cases: Infinity, aiPerMonth: 1500 },
  firm: { cases: Infinity, aiPerMonth: 6000 },
  enterprise: { cases: Infinity, aiPerMonth: Infinity },
};

// Audit actions that count as "AI usage" for gating.
const AI_ACTIONS = ["chat.query", "draft.create", "strategy.generate"];

function limitsFor(plan: string): PlanLimit {
  return PLAN_LIMITS[(plan as PlanKey)] ?? PLAN_LIMITS.free;
}

export async function getOrgPlan(orgId: string): Promise<PlanKey> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .maybeSingle();
  return ((data?.plan as PlanKey) ?? "free") as PlanKey;
}

async function countCases(orgId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  return count ?? 0;
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

async function countAiThisMonth(orgId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .in("action", AI_ACTIONS)
    .gte("created_at", startOfMonthISO());
  return count ?? 0;
}

export interface Usage {
  plan: PlanKey;
  cases: number;
  caseLimit: number;
  ai: number;
  aiLimit: number;
}

export async function getUsage(orgId: string): Promise<Usage> {
  const plan = await getOrgPlan(orgId);
  const limit = limitsFor(plan);
  const [cases, ai] = await Promise.all([
    countCases(orgId),
    countAiThisMonth(orgId),
  ]);
  return {
    plan,
    cases,
    caseLimit: limit.cases,
    ai,
    aiLimit: limit.aiPerMonth,
  };
}

/** True if the org can create another case under its plan. */
export async function canCreateCase(orgId: string): Promise<boolean> {
  const plan = await getOrgPlan(orgId);
  const limit = limitsFor(plan).cases;
  if (limit === Infinity) return true;
  return (await countCases(orgId)) < limit;
}

/** True if the org is under its monthly AI limit. */
export async function canUseAI(orgId: string): Promise<boolean> {
  const plan = await getOrgPlan(orgId);
  const limit = limitsFor(plan).aiPerMonth;
  if (limit === Infinity) return true;
  return (await countAiThisMonth(orgId)) < limit;
}

export const AI_LIMIT_MESSAGE =
  "You've reached this month's AI limit on your current plan. Upgrade in Settings → Billing to keep using the assistant.";
export const CASE_LIMIT_MESSAGE =
  "The Free plan is limited to 1 case. Upgrade in Settings → Billing to add more.";
