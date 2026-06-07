import { requireUserAndOrg } from "@/lib/session";
import { getOrgRole, listOrgMembers } from "@/lib/access";
import { listInvitations } from "@/lib/invites";
import { inviteMember, revokeInvite, removeTeamMember } from "@/lib/actions";
import { env } from "@/lib/env";
import { Card, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CopyButton } from "@/components/copy-button";
import { formatDate } from "@/lib/utils";

export default async function TeamPage() {
  const { user, orgId } = await requireUserAndOrg();
  const role = await getOrgRole(user.id, orgId);
  const canManage = role === "owner" || role === "admin";

  const [members, invites] = await Promise.all([
    listOrgMembers(orgId),
    canManage ? listInvitations(orgId) : Promise.resolve([]),
  ]);
  const ownerCount = members.filter((m) => m.role === "owner").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Team</h1>
        <p className="mt-1 text-base text-muted">
          Invite colleagues to your firm. Each member is a billable seat.
        </p>
      </div>

      {canManage && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Invite a teammate
          </h2>
          <form
            action={inviteMember}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="colleague@firm.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <SubmitButton pendingText="Inviting…">Send invite</SubmitButton>
          </form>
          <p className="mt-2 text-xs text-muted">
            They&apos;ll sign in with this Google email to join. You&apos;ll get a
            link to share.
          </p>
        </Card>
      )}

      {canManage && invites.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Pending invitations
          </h2>
          <ul className="divide-y divide-border">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {inv.email}
                  </p>
                  <p className="text-xs capitalize text-muted">
                    {inv.role} · expires {formatDate(inv.expires_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={`${env.appUrl}/invite/${inv.token}`} />
                  <form action={revokeInvite.bind(null, inv.id)}>
                    <button
                      type="submit"
                      className="text-xs text-muted hover:text-red-600"
                    >
                      Revoke
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Members ({members.length})
        </h2>
        <ul className="divide-y divide-border">
          {members.map((m) => {
            const isSelf = m.user_id === user.id;
            const isLastOwner = m.role === "owner" && ownerCount <= 1;
            return (
              <li
                key={m.user_id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(m.name || m.email || "U").trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.name || m.email}
                      {isSelf && (
                        <span className="ml-1 text-xs text-muted">(you)</span>
                      )}
                    </p>
                    <p className="text-xs capitalize text-muted">{m.role}</p>
                  </div>
                </div>
                {canManage && !isSelf && !isLastOwner && (
                  <form action={removeTeamMember.bind(null, m.user_id)}>
                    <button
                      type="submit"
                      className="text-xs text-muted hover:text-red-600"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
