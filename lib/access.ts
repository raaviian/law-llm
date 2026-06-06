import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OrgMember {
  user_id: string;
  role: string;
  email: string | null;
  name: string | null;
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
    .select("user_id, role")
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
    email: info.get(m.user_id as string)?.email ?? null,
    name: info.get(m.user_id as string)?.name ?? null,
  }));
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
