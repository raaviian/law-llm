import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OrgMember {
  user_id: string;
  role: string;
  title: string | null;
  email: string | null;
  name: string | null;
}

/** An organization's display name. */
export async function getOrgName(orgId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  return (data?.name as string) ?? "the firm";
}

/** The caller's role in an org, or null if not a member. */
export async function getOrgRole(
  userId: string,
  orgId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as string) ?? null;
}

/** All members of an org, enriched with email/name from the next_auth schema. */
export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const admin = createAdminClient();
  const { data: mems } = await admin
    .from("memberships")
    .select("user_id, role, title")
    .eq("org_id", orgId);
  const rows = mems ?? [];
  const ids = rows.map((m) => m.user_id as string);

  const info = new Map<string, { email: string | null; name: string | null }>();
  if (ids.length) {
    const { data: users } = await admin
      .schema("next_auth")
      .from("users")
      .select("id, email, name")
      .in("id", ids);
    for (const u of users ?? []) {
      info.set(u.id as string, {
        email: (u.email as string) ?? null,
        name: (u.name as string) ?? null,
      });
    }
  }

  return rows.map((m) => ({
    user_id: m.user_id as string,
    role: m.role as string,
    title: (m.title as string) ?? null,
    email: info.get(m.user_id as string)?.email ?? null,
    name: info.get(m.user_id as string)?.name ?? null,
  }));
}

/** The caller's membership in an org (role, title, joined date) — for profile. */
export async function getOrgMembership(
  userId: string,
  orgId: string,
): Promise<{ role: string; title: string | null; created_at: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships")
    .select("role, title, created_at")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    role: data.role as string,
    title: (data.title as string) ?? null,
    created_at: data.created_at as string,
  };
}

/** User ids explicitly granted access to a private case. */
export async function listCaseAccess(caseId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("case_access")
    .select("user_id")
    .eq("case_id", caseId);
  return (data ?? []).map((r) => r.user_id as string);
}

export function canManageCase(
  role: string | null,
  createdBy: string | null,
  userId: string,
): boolean {
  return role === "owner" || role === "admin" || createdBy === userId;
}
