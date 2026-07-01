"use client";

import { CollectionView } from "@/components/collection-view";
import { Card, EmptyState } from "@/components/ui";
import { TrashIcon } from "@/components/icons";
import { deleteNote } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";
import type { Note } from "@/lib/types";

export function NotesView({
  caseId,
  notes,
}: {
  caseId: string;
  notes: Note[];
}) {
  return (
    <CollectionView<Note>
      items={notes}
      storageKey="view:notes"
      defaultView="grid"
      modes={["grid", "list"]}
      gridClassName="grid gap-4 sm:grid-cols-2"
      searchPlaceholder="Search notes…"
      itemKey={(n) => n.id}
      searchFields={(n) => [n.title, n.body].filter(Boolean).join(" ")}
      sort={{
        defaultKey: "newest",
        options: [
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "title", label: "Title (A–Z)" },
        ],
        compare: (a, b, key) => {
          if (key === "oldest") return a.created_at.localeCompare(b.created_at);
          if (key === "title")
            return (a.title ?? "").localeCompare(b.title ?? "");
          return b.created_at.localeCompare(a.created_at);
        },
      }}
      renderEmpty={
        <EmptyState
          title="No notes found"
          description="Try a different search, or add a note."
        />
      }
      renderItem={(n, view) => {
        const deleteForm = (
          <form action={deleteNote.bind(null, caseId, n.id)}>
            <button
              type="submit"
              aria-label="Delete note"
              className="shrink-0 text-muted hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </form>
        );
        if (view === "list") {
          return (
            <div className="flex items-start justify-between gap-3 px-1 py-3">
              <div className="min-w-0">
                {n.title && (
                  <h3 className="font-medium text-foreground">{n.title}</h3>
                )}
                <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
                  {n.body}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDateTime(n.created_at)}
                </p>
              </div>
              {deleteForm}
            </div>
          );
        }
        return (
          <Card className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {n.title && (
                  <h3 className="font-medium text-foreground">{n.title}</h3>
                )}
                <p className="mt-1 line-clamp-[8] whitespace-pre-wrap text-sm text-foreground">
                  {n.body}
                </p>
              </div>
              {deleteForm}
            </div>
            <p className="mt-3 text-xs text-muted">
              {formatDateTime(n.created_at)}
            </p>
          </Card>
        );
      }}
    />
  );
}
