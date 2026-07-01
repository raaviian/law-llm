"use client";

import { useState, useTransition } from "react";
import { Button, Card, Label, Textarea } from "@/components/ui";
import { CollectionView } from "@/components/collection-view";
import { useLoadingEffect } from "@/components/loading-overlay";
import { TrashIcon } from "@/components/icons";
import { saveDraft, deleteDraft } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import type { Draft } from "@/lib/types";

const DOC_TYPES: { value: string; label: string }[] = [
  { value: "client_update", label: "Client update email" },
  { value: "demand_letter", label: "Demand letter" },
  { value: "summary_memo", label: "Case summary memo" },
  { value: "argument_outline", label: "Argument outline" },
];

const typeLabelOf = (slug: string) =>
  DOC_TYPES.find((d) => d.value === slug)?.label ?? "Draft";

export function DraftPanel({
  caseId,
  hasDocuments,
  drafts,
}: {
  caseId: string;
  hasDocuments: boolean;
  drafts: Draft[];
}) {
  const router = useRouter();
  const [docType, setDocType] = useState("client_update");
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [selected, setSelected] = useState<Draft | null>(null);
  useLoadingEffect(busy || isSaving);

  const typeLabel = typeLabelOf(docType);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setOutput("");
    setCopied(false);
    setSaved(false);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, docType, instructions }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "Failed"));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
    } catch (e) {
      setOutput(`⚠️ ${e instanceof Error ? e.message : "Draft failed"}`);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    startSaving(async () => {
      await saveDraft(caseId, { docType, title: typeLabel, content: output, instructions });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit p-5">
          <h2 className="text-sm font-semibold text-foreground">Generate a draft</h2>
          <p className="mt-1 text-xs text-muted">
            Grounded in this case&apos;s documents. Always review before use.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="docType">Document type</Label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="instructions">Instructions (optional)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="e.g. Emphasize the missed filing deadline; keep it under 200 words."
              />
            </div>
            <Button onClick={generate} disabled={busy} className="w-full">
              {busy ? "Drafting…" : "Generate draft"}
            </Button>
            {!hasDocuments && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Tip: upload documents first so the draft can use case facts.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex min-h-[60vh] flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{typeLabel}</h2>
            {output && !busy && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={save}
                  disabled={isSaving || saved}
                >
                  {saved ? "Saved ✓" : isSaving ? "Saving…" : "Save draft"}
                </Button>
              </div>
            )}
          </div>
          {output ? (
            <pre className="flex-1 overflow-auto whitespace-pre-wrap font-sans text-sm text-foreground">
              {output}
              {busy && <span className="animate-pulse">▌</span>}
            </pre>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted">
              Choose a document type and click Generate to draft from this
              case&apos;s files.
            </div>
          )}
        </Card>
      </div>

      {/* Saved drafts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Saved drafts</h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-muted">
            Generate a draft above and click “Save draft” to keep it here.
          </p>
        ) : (
          <CollectionView<Draft>
            items={drafts}
            storageKey="view:drafts"
            defaultView="list"
            searchPlaceholder="Search drafts…"
            itemKey={(d) => d.id}
            searchFields={(d) => `${d.title} ${typeLabelOf(d.doc_type)}`}
            filters={[
              {
                key: "type",
                label: "All types",
                options: DOC_TYPES,
                match: (d, v) => d.doc_type === v,
              },
            ]}
            sort={{
              defaultKey: "newest",
              options: [
                { value: "newest", label: "Newest" },
                { value: "title", label: "Title (A–Z)" },
              ],
              compare: (a, b, key) =>
                key === "title"
                  ? a.title.localeCompare(b.title)
                  : b.updated_at.localeCompare(a.updated_at),
            }}
            renderItem={(d, view) => {
              const body = (
                <>
                  <p className="truncate text-sm font-medium text-foreground">
                    {d.title}
                  </p>
                  <p className="text-xs text-muted">
                    {typeLabelOf(d.doc_type)} · {formatDateTime(d.updated_at)}
                  </p>
                </>
              );
              return (
                <div
                  className={
                    view === "list"
                      ? "flex items-center justify-between gap-3 px-1 py-3"
                      : "flex h-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelected(d)}
                    className="min-w-0 flex-1 text-left"
                  >
                    {body}
                  </button>
                  <form action={deleteDraft.bind(null, caseId, d.id)}>
                    <button
                      type="submit"
                      aria-label="Delete draft"
                      className="shrink-0 text-muted hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Read-only viewer for a selected saved draft */}
      {selected && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {selected.title}
              </h3>
              <p className="text-xs text-muted">{typeLabelOf(selected.doc_type)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigator.clipboard.writeText(selected.content)}
              >
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap font-sans text-sm text-foreground">
            {selected.content}
          </pre>
        </Card>
      )}
    </div>
  );
}
