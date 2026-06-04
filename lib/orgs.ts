import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

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
