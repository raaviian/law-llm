"use client";

import Link from "next/link";
import { CollectionView } from "@/components/collection-view";
import { Badge, Card } from "@/components/ui";
import { TrashIcon } from "@/components/icons";
import { deleteDocument } from "@/lib/actions";
import { formatDate, formatBytes, withinDays } from "@/lib/utils";
import type { CaseDocument } from "@/lib/types";

export function DocumentsView({
  caseId,
  docs,
}: {
  caseId: string;
  docs: CaseDocument[];
}) {
  return (
    <CollectionView<CaseDocument>
      items={docs}
      storageKey="view:documents"
      defaultView="list"
      searchPlaceholder="Search documents…"
      itemKey={(d) => d.id}
      searchFields={(d) => [d.file_name, d.summary].filter(Boolean).join(" ")}
      filters={[
        {
          key: "status",
          label: "All statuses",
          options: [
            { value: "ready", label: "Ready" },
            { value: "processing", label: "Processing" },
            { value: "uploaded", label: "Uploaded" },
            { value: "failed", label: "Failed" },
          ],
          match: (d, v) => d.status === v,
        },
        {
          key: "date",
          label: "Any time",
          options: [
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "365", label: "Last year" },
          ],
          match: (d, v) => withinDays(d.created_at, Number(v)),
        },
      ]}
      sort={{
        defaultKey: "newest",
        options: [
          { value: "newest", label: "Newest" },
          { value: "name", label: "Name (A–Z)" },
        ],
        compare: (a, b, key) =>
          key === "name"
            ? a.file_name.localeCompare(b.file_name)
            : b.created_at.localeCompare(a.created_at),
      }}
      renderItem={(d, view) => {
        const meta = `${formatBytes(d.size)}${d.page_count ? ` · ${d.page_count} pages` : ""} · ${formatDate(d.created_at)}`;
        const deleteForm = (
          <form action={deleteDocument.bind(null, caseId, d.id)}>
            <button
              type="submit"
              aria-label="Delete document"
              className="text-muted hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </form>
        );
        if (view === "list") {
          return (
            <div className="flex items-center justify-between gap-4 px-1 py-3">
              <div className="min-w-0">
                <Link
                  href={`/cases/${caseId}/documents/${d.id}`}
                  className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                >
                  {d.file_name}
                </Link>
                <p className="text-xs text-muted">{meta}</p>
                {d.summary && (
                  <p className="mt-0.5 line-clamp-2 max-w-xl text-xs text-muted">
                    {d.summary}
                  </p>
                )}
                {d.status === "failed" && d.error && (
                  <p className="mt-0.5 text-xs text-red-600">{d.error}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge status={d.status} />
                {deleteForm}
              </div>
            </div>
          );
        }
        return (
          <Card className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/cases/${caseId}/documents/${d.id}`}
                className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
              >
                {d.file_name}
              </Link>
              <Badge status={d.status} />
            </div>
            <p className="mt-1 text-xs text-muted">{meta}</p>
            {d.summary && (
              <p className="mt-2 line-clamp-3 flex-1 text-xs text-muted">
                {d.summary}
              </p>
            )}
            <div className="mt-3 flex justify-end">{deleteForm}</div>
          </Card>
        );
      }}
    />
  );
}
