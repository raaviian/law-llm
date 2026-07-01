"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchOrg } from "@/lib/actions";
import { useLoadingEffect } from "@/components/loading-overlay";

interface OrgOption {
  org_id: string;
  name: string;
  role: string;
}

/**
 * Lets a user who belongs to multiple organizations choose the active one.
 * The active org is where new cases are created and what the team/billing
 * pages manage. Hidden when the user only has one org.
 */
export function OrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgOption[];
  activeOrgId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useLoadingEffect(pending);

  if (orgs.length <= 1) return null;

  return (
    <select
      aria-label="Active organization"
      value={activeOrgId}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          await switchOrg(value);
          router.refresh();
        });
      }}
      className="max-w-[12rem] truncate rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none hover:bg-foreground/5 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    >
      {orgs.map((o) => (
        <option key={o.org_id} value={o.org_id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
