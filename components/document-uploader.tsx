"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function DocumentUploader({ caseId }: { caseId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("caseId", caseId);
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Upload failed (${res.status})`);
        }
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Uploading & analyzing…" : "Upload documents"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        PDF, DOCX, TXT or MD · up to 25 MB each
      </p>
    </div>
  );
}
