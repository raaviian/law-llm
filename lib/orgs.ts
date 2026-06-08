import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const ACTIVE_ORG_COOKIE = "active_org";

export interface UserOrg {
  org_id: string;
  name: string;
  role: string;
}

/** All organizations the user belongs to, earliest first. */
export async function listUserOrgs(userId: string): Promise<UserOrg[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("org_id, role, organizations(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({
    org_id: m.org_id as string,
    role: m.role as string,
    name: (m.organizations as { name?: string } | null)?.name ?? "Firm",
  }));
}

/**
 * Resolve the user's *active* organization: the one selected via the org
 * switcher cookie (if they're still a member), otherwise their earliest org.
 */
export async function getActiveOrgId(userId: string): Promise<string> {
  const orgs = await listUserOrgs(userId);
  if (orgs.length === 0) return ensureOrgForUser(userId, "My Firm");
  const jar = await cookies();
  const selected = jar.get(ACTIVE_ORG_COOKIE)?.value;
  if (selected && orgs.some((o) => o.org_id === selected)) return selected;
  return orgs[0].org_id;
}

/**
 * Ensure a user has at least one organization + membership. Idempotent: safe to
 * call from the createUser event and as a fallback on first dashboard load.
 * Uses the admin client because it runs outside an RLS-authenticated context.
 */
export async function ensureOrgForUser(
  userId: string,
  displayName: string,
): Promise<string> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing?.org_id) return existing.org_id as string;

  const firmName = displayName.includes("@")
    ? `${displayName.split("@")[0]}'s Firm`
    : `${displayName}'s Firm`;

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: firmName })
    .select("id")
    .single();
  if (orgErr || !org) {
    throw new Error(`Failed to create organization: ${orgErr?.message}`);
  }

  const { error: memErr } = await admin.from("memberships").insert({
    org_id: org.id,
    user_id: userId,
    role: "owner",
  });
  if (memErr) {
    throw new Error(`Failed to create membership: ${memErr.message}`);
  }

  return org.id as string;
}

/** Return the user's primary org id (creating one if somehow missing). */
export async function getPrimaryOrgId(
  userId: string,
  fallbackName = "My Firm",
): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data?.org_id) return data.org_id as string;
  return ensureOrgForUser(userId, fallbackName);
}
