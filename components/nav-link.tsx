"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Active-aware nav link shared by the marketing and in-app headers. Pass
 * `prefixes` to mark active for a section (e.g. ["/dashboard", "/cases"]).
 */
export function NavLink({
  href,
  children,
  prefixes,
}: {
  href: string;
  children: React.ReactNode;
  prefixes?: string[];
}) {
  const pathname = usePathname();
  const active = prefixes
    ? prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    : pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-base font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:bg-slate-100 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
