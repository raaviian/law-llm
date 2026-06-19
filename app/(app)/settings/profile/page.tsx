import { requireUserAndOrg } from "@/lib/session";
import { getOrgMembership, getOrgName } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, RoleBadge, TitleBadge } from "@/components/ui";
import { ShieldIcon, CheckIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const { user, orgId } = await requireUserAndOrg();
  const [membership, orgName] = await Promise.all([
    getOrgMembership(user.id, orgId),
    getOrgName(orgId),
  ]);

  // Email-verified status: password accounts have a user_passwords row;
  // Google accounts don't (the provider already verified the address).
  const admin = createAdminClient();
  const { data: pw } = await admin
    .from("user_passwords")
    .select("email_verified_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const isPasswordAccount = Boolean(pw);
  const verified = isPasswordAccount
    ? Boolean(pw?.email_verified_at)
    : true;
  const verifiedLabel = isPasswordAccount
    ? verified
      ? "Email verified"
      : "Email not verified"
    : "Verified via Google";

  const label = user.name || user.email || "U";
  const initial = label.trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-base text-muted">
          Your account details and role at {orgName}.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
              {user.name || "Your name"}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {membership && <RoleBadge role={membership.role} />}
              {membership && <TitleBadge title={membership.title} />}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Email status
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
              {verified ? (
                <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              {verifiedLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Member since
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {membership ? formatDate(membership.created_at) : "—"}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs text-muted">
          Your professional title is set by a firm owner or admin on the{" "}
          <a href="/settings/team" className="font-medium text-primary hover:underline">
            Team
          </a>{" "}
          page.
        </p>
      </Card>
    </div>
  );
}
