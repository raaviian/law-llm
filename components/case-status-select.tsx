"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCaseStatus } from "@/lib/actions";
import { useLoadingEffect } from "@/components/loading-overlay";

type Status = "open" | "active" | "closed";

/** Owner/admin control to change a case's status (Open / Active / Closed). */
export function CaseStatusSelect({
  caseId,
  status,
}: {
  caseId: string;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useLoadingEffect(pending);

  return (
    <select
      aria-label="Case status"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value as Status;
        startTransition(async () => {
          await setCaseStatus(caseId, value);
          router.refresh();
        });
      }}
      className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium capitalize text-foreground outline-none hover:bg-foreground/5 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    >
      <option value="open">Open</option>
      <option value="active">Active</option>
      <option value="closed">Closed</option>
    </select>
  );
}
