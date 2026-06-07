import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  expires_at: string;
}

export async function listInvitations(orgId: string): Promise<Invitation[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []) as Invitation[];
}

export async function createInvitation(
  orgId: string,
  email: string,
  role: string,
  invitedBy: string,
): Promise<Invitation> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  // Reuse an existing pending invite for this email if present.
  const { data: existing } = await admin
    .from("invitations")
    .select("*")
    .eq("org_id", orgId)
    .eq("email", normalized)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return existing as Invitation;

  const { data, error } = await admin
    .from("invitations")
    .insert({ org_id: orgId, email: normalized, role, invited_by: invitedBy })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create invite");
  return data as Invitation;
}

export async function revokeInvitation(orgId: string, inviteId: string) {
  const admin = createAdminClient();
  await admin
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("org_id", orgId);
}

export async function getInvitationByToken(
  token: string,
): Promise<(Invitation & { org_name: string }) | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("*, organizations(name)")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const org = data.organizations as { name?: string } | null;
  return { ...(data as Invitation), org_name: org?.name ?? "the firm" };
}

export type AcceptResult =
  | { ok: true; orgId: string }
  | { ok: false; reason: string };

/**
 * Accept an invitation for the signed-in user. Validates status/expiry and that
 * the user's verified email matches the invite, then adds the membership.
 */
export async function acceptInvitation(
  token: string,
  userId: string,
  userEmail: string | null,
): Promise<AcceptResult> {
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { ok: false, reason: "This invitation link is invalid." };
  if (invite.status === "revoked")
    return { ok: false, reason: "This invitation has been revoked." };
  if (invite.status === "accepted")
    return { ok: true, orgId: invite.org_id as string };
  if (new Date(invite.expires_at as string) < new Date())
    return { ok: false, reason: "This invitation has expired." };

  if (
    !userEmail ||
    userEmail.trim().toLowerCase() !== (invite.email as string).toLowerCase()
  ) {
    return {
      ok: false,
      reason: `This invitation is for ${invite.email}. Sign in with that Google account to accept.`,
    };
  }

  // Idempotent membership insert.
  await admin
    .from("memberships")
    .upsert(
      { org_id: invite.org_id, user_id: userId, role: invite.role },
      { onConflict: "org_id,user_id" },
    );
  await admin
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  return { ok: true, orgId: invite.org_id as string };
}

/** Remove a member, guarding against removing the last owner. */
export async function removeMember(
  orgId: string,
  targetUserId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", orgId);
  const rows = members ?? [];
  const target = rows.find((m) => m.user_id === targetUserId);
  if (!target) return { ok: false, reason: "Member not found." };
  const owners = rows.filter((m) => m.role === "owner");
  if (target.role === "owner" && owners.length <= 1) {
    return { ok: false, reason: "You can't remove the last owner." };
  }
  await admin
    .from("memberships")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", targetUserId);
  return { ok: true };
}
