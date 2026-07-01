"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy link",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-foreground/5",
        className,
      )}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
