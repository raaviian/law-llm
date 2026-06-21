"use client";

import Link from "next/link";
import { CollectionView } from "@/components/collection-view";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type { Case } from "@/lib/types";

const STATUS_RANK: Record<string, number> = { open: 0, active: 1, closed: 2 };

export function CasesView({ cases }: { cases: Case[] }) {
  return (
    <CollectionView<Case>
      items={cases}
      storageKey="view:cases"
      defaultView="grid"
      searchPlaceholder="Search cases…"
      itemKey={(c) => c.id}
      searchFields={(c) =>
        [c.title, c.client_name, c.court, c.jurisdiction, c.case_number]
          .filter(Boolean)
          .join(" ")
      }
      filters={[
        {
          key: "status",
          label: "All statuses",
          options: [
            { value: "open", label: "Open" },
            { value: "active", label: "Active" },
            { value: "closed", label: "Closed" },
          ],
          match: (c, v) => c.status === v,
        },
      ]}
      sort={{
        defaultKey: "updated",
        options: [
          { value: "updated", label: "Recently updated" },
          { value: "title", label: "Title (A–Z)" },
          { value: "status", label: "Status" },
        ],
        compare: (a, b, key) => {
          if (key === "title") return a.title.localeCompare(b.title);
          if (key === "status")
            return (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
          return b.updated_at.localeCompare(a.updated_at);
        },
      }}
      renderEmpty={
        <EmptyState
          title="No cases found"
          description="Try a different search, or create a new matter."
          action={<LinkButton href="/cases/new">+ New case</LinkButton>}
        />
      }
      renderItem={(c, view) => {
        const meta =
          [c.client_name, c.court, c.jurisdiction].filter(Boolean).join(" · ") ||
          "No details";
        if (view === "list") {
          return (
            <Link
              href={`/cases/${c.id}`}
              className="group flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-foreground/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {c.title}
                </p>
                <p className="truncate text-xs text-muted">{meta}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-xs text-muted sm:inline">
                  {formatDate(c.updated_at)}
                </span>
                <Badge status={c.status} />
                <ArrowRightIcon className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          );
        }
        return (
          <Link href={`/cases/${c.id}`} className="group block h-full">
            <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/30 hover:bg-foreground/[0.03]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-foreground">{c.title}</h3>
                <Badge status={c.status} />
              </div>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{meta}</p>
              <p className="mt-3 text-xs text-muted">
                Updated {formatDate(c.updated_at)}
              </p>
            </Card>
          </Link>
        );
      }}
    />
  );
}
