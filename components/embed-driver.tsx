"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Progress {
  total: number;
  remaining: number;
  done: boolean;
}

/**
 * Drives resumable embedding for a document still being indexed. Repeatedly
 * calls /api/documents/embed (paced to respect the rate limit) until every
 * chunk is embedded, showing live progress. Mounted only for "processing"
 * documents, so revisiting a case automatically resumes an unfinished file.
 */
export function EmbedDriver({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (ms: number) => {
      if (!cancelled) timer = setTimeout(tick, ms);
    };

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/documents/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });
        if (res.status === 503) {
          schedule(30_000); // rate limited — back off and retry
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Indexing failed.");
          return;
        }
        if (!cancelled) setProgress(data);
        if (data.done) {
          router.refresh();
          return;
        }
        // ~2.7 slices/min keeps us under the free-tier per-minute limit.
        schedule(22_000);
      } catch {
        schedule(15_000);
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [documentId, router]);

  if (error) {
    return <span className="text-xs text-red-600">{error}</span>;
  }

  const pct =
    progress && progress.total > 0
      ? Math.round(((progress.total - progress.remaining) / progress.total) * 100)
      : null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted"
      title="We're reading this file so the AI can answer questions from it."
    >
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-foreground/20 border-t-primary" />
      Reading{pct !== null ? ` ${pct}%` : "…"}
    </span>
  );
}
