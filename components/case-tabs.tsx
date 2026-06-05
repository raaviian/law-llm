"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { slug: "", label: "Overview" },
  { slug: "documents", label: "Documents" },
  { slug: "chat", label: "Chat" },
  { slug: "draft", label: "Draft" },
  { slug: "notes", label: "Notes" },
  { slug: "strategy", label: "Strategy" },
  { slug: "deadlines", label: "Deadlines" },
];

export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const base = `/cases/${caseId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active =
          tab.slug === ""
            ? pathname === base
            : pathname.startsWith(href);
        return (
          <Link
            key={tab.slug}
            href={href}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
