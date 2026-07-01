"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { generateStrategy } from "@/lib/actions";
import { useLoadingEffect } from "@/components/loading-overlay";

export function GenerateStrategyButton({
  caseId,
  hasDocuments,
}: {
  caseId: string;
  hasDocuments: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  useLoadingEffect(pending);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        await generateStrategy(caseId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={pending}>
        {pending ? "Generating strategy…" : "✨ Generate with AI"}
      </Button>
      {!hasDocuments && (
        <span className="text-xs text-amber-700">
          Upload documents first for a grounded strategy.
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
