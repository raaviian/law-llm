"use client";

import { useState, useTransition } from "react";
import { deleteCase } from "@/lib/actions";
import { Button, Card, Input } from "@/components/ui";
import { useLoadingEffect } from "@/components/loading-overlay";

/**
 * Sensitive case deletion: the Delete button stays disabled until the user
 * types the exact case title, then calls deleteCase (which re-checks the
 * title server-side).
 */
export function DeleteCaseDialog({
  caseId,
  caseTitle,
}: {
  caseId: string;
  caseTitle: string;
}) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useLoadingEffect(pending);
  const confirmed = typed.trim() === caseTitle.trim();

  return (
    <Card className="border-red-300 p-6 dark:border-red-500/40">
      <h2 className="text-sm font-semibold text-foreground">Danger zone</h2>
      <p className="mt-1 text-sm text-muted">
        Deleting this case permanently removes its documents, notes, chats,
        drafts, and strategy. This cannot be undone.
      </p>
      <p className="mt-3 text-sm text-foreground">
        Type{" "}
        <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-medium">
          {caseTitle}
        </span>{" "}
        to confirm.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setError(null);
          }}
          placeholder="Case title"
          aria-label="Type the case title to confirm deletion"
          className="sm:max-w-xs"
        />
        <Button
          type="button"
          variant="danger"
          disabled={!confirmed || pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteCase(caseId, typed);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not delete.");
              }
            })
          }
        >
          {pending ? "Deleting…" : "Delete case"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
