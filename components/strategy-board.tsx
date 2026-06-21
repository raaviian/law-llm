"use client";

import { Card } from "@/components/ui";
import { PendingButton } from "@/components/pending-button";
import { ViewToggle } from "@/components/view-toggle";
import { useLocalStorage } from "@/lib/use-local-storage";
import { addStrategyItemForm, removeStrategyItemForm } from "@/lib/actions";
import type { StrategyItem } from "@/lib/types";

type Column = "objectives" | "arguments" | "risks" | "timeline";

const COLUMNS: { key: Column; title: string; hint: string }[] = [
  { key: "objectives", title: "Objectives", hint: "What does the client want to achieve?" },
  { key: "arguments", title: "Arguments", hint: "Key arguments to advance." },
  { key: "risks", title: "Risks", hint: "Weaknesses and counter-arguments." },
  { key: "timeline", title: "Timeline", hint: "Sequence of steps and dates." },
];

export type StrategyData = Record<Column, StrategyItem[]>;

export function StrategyBoard({
  caseId,
  strategy,
}: {
  caseId: string;
  strategy: StrategyData;
}) {
  const [view, setView] = useLocalStorage<"list" | "grid" | "kanban">(
    "view:strategy",
    "kanban",
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewToggle
          value={view}
          onChange={(v) => setView(v as "list" | "grid" | "kanban")}
          modes={["list", "grid", "kanban"]}
        />
      </div>

      {view === "list" ? (
        <div className="space-y-4">
          {COLUMNS.map((col) => (
            <Card key={col.key} className="p-4">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <p className="text-xs text-muted">{col.hint}</p>
              <ul className="mt-3 divide-y divide-border">
                {strategy[col.key].map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-start justify-between gap-2 py-2 text-sm"
                  >
                    <span className="whitespace-pre-wrap">{item.text}</span>
                    <RemoveButton caseId={caseId} column={col.key} id={item.id} />
                  </li>
                ))}
                {strategy[col.key].length === 0 && (
                  <li className="py-2 text-xs text-muted">Nothing here yet.</li>
                )}
              </ul>
              <AddForm caseId={caseId} column={col.key} title={col.title} />
            </Card>
          ))}
        </div>
      ) : (
        <div
          className={
            view === "kanban"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
              : "grid gap-4 sm:grid-cols-2"
          }
        >
          {COLUMNS.map((col) => (
            <Card key={col.key} className="flex flex-col p-4">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <p className="mb-3 text-xs text-muted">{col.hint}</p>
              <ul className="mb-3 flex-1 space-y-2">
                {strategy[col.key].map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-start justify-between gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-sm"
                  >
                    <span className="whitespace-pre-wrap">{item.text}</span>
                    <RemoveButton caseId={caseId} column={col.key} id={item.id} />
                  </li>
                ))}
                {strategy[col.key].length === 0 && (
                  <li className="text-xs text-muted">Nothing here yet.</li>
                )}
              </ul>
              <AddForm caseId={caseId} column={col.key} title={col.title} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RemoveButton({
  caseId,
  column,
  id,
}: {
  caseId: string;
  column: Column;
  id: string;
}) {
  return (
    <form action={removeStrategyItemForm.bind(null, caseId, column, id)}>
      <button
        type="submit"
        aria-label="Remove"
        className="text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
      >
        ×
      </button>
    </form>
  );
}

function AddForm({
  caseId,
  column,
  title,
}: {
  caseId: string;
  column: Column;
  title: string;
}) {
  return (
    <form action={addStrategyItemForm.bind(null, caseId, column)} className="space-y-2">
      <textarea
        name="text"
        rows={2}
        required
        placeholder={`Add to ${title.toLowerCase()}…`}
        className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <PendingButton
        pendingText="Adding…"
        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
      >
        Add
      </PendingButton>
    </form>
  );
}
