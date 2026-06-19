"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberTitle } from "@/lib/actions";
import { MEMBER_TITLES } from "@/lib/titles";

/**
 * Owner/admin control to assign a member's professional title. Submits on
 * change (like OrgSwitcher) and refreshes so the badge updates immediately.
 */
export function MemberTitleSelect({
  userId,
  title,
}: {
  userId: string;
  title: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      aria-label="Member title"
      defaultValue={title ?? ""}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("title", value);
          await setMemberTitle(userId, fd);
          router.refresh();
        });
      }}
      className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground outline-none hover:bg-foreground/5 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    >
      <option value="">No title</option>
      {Object.entries(MEMBER_TITLES).map(([slug, label]) => (
        <option key={slug} value={slug}>
          {label}
        </option>
      ))}
    </select>
  );
}
