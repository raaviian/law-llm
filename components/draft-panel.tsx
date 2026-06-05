"use client";

import { useState, useTransition } from "react";
import { Button, Card, Label } from "@/components/ui";
import { saveDraftNote } from "@/lib/actions";

const DOC_TYPES: { value: string; label: string }[] = [
  { value: "client_update", label: "Client update email" },
  { value: "demand_letter", label: "Demand letter" },
  { value: "summary_memo", label: "Case summary memo" },
  { value: "argument_outline", label: "Argument outline" },
];

export function DraftPanel({
  caseId,
  hasDocuments,
}: {
  caseId: string;
  hasDocuments: boolean;
}) {
  const [docType, setDocType] = useState("client_update");
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const typeLabel =
    DOC_TYPES.find((d) => d.value === docType)?.label ?? "Draft";

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
      await saveDraftNote(caseId, typeLabel, output);
      setSaved(true);
    });
  }

  return (
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
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="e.g. Emphasize the missed filing deadline; keep it under 200 words."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? "Drafting…" : "Generate draft"}
          </Button>
          {!hasDocuments && (
            <p className="text-xs text-amber-700">
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
                {saved ? "Saved ✓" : isSaving ? "Saving…" : "Save to notes"}
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
  );
}
