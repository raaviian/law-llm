"use client";

import { useId, useState } from "react";
import { InfoIcon } from "@/components/icons";

/**
 * A tiny accessible term-explainer: an info icon that reveals a one-line
 * definition on hover or keyboard focus. Dependency-free.
 */
export function InfoTip({ label, text }: { label?: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label ?? "More information"}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-grid place-items-center rounded text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <InfoIcon className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-40 mb-1.5 w-56 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-normal normal-case text-muted shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
