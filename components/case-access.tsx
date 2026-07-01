import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  setCaseVisibility,
  grantCaseAccess,
  revokeCaseAccess,
} from "@/lib/actions";
import type { OrgMember } from "@/lib/access";

export function CaseAccess({
  caseId,
  visibility,
  members,
  grants,
  creatorId,
}: {
  caseId: string;
  visibility: "org" | "private";
  members: OrgMember[];
  grants: string[];
  creatorId: string | null;
}) {
  const isPrivate = visibility === "private";

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-foreground">Access</h2>
      <p className="mt-1 text-sm text-muted">
        Control who in your firm can see this case.
      </p>

      <div className="mt-3 inline-flex rounded-lg border border-border p-0.5">
        <form action={setCaseVisibility.bind(null, caseId, "org")}>
          <button
            type="submit"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              !isPrivate ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            Whole firm
          </button>
        </form>
        <form action={setCaseVisibility.bind(null, caseId, "private")}>
          <button
            type="submit"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              isPrivate ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            Restricted
          </button>
        </form>
      </div>

      {isPrivate && (
        <ul className="mt-4 space-y-2">
          {members.map((m) => {
            const always =
              m.role === "owner" ||
              m.role === "admin" ||
              m.user_id === creatorId;
            const granted = always || grants.includes(m.user_id);
            return (
              <li
                key={m.user_id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    {m.name || m.email || m.user_id}
                  </p>
                  <p className="text-xs capitalize text-muted">{m.role}</p>
                </div>
                {always ? (
                  <span className="text-xs text-muted">Full access</span>
                ) : granted ? (
                  <form action={revokeCaseAccess.bind(null, caseId, m.user_id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-slate-50"
                    >
                      Revoke
                    </button>
                  </form>
                ) : (
                  <form action={grantCaseAccess.bind(null, caseId, m.user_id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Grant
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
