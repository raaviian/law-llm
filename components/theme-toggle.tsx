"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Light/dark theme toggle. The initial theme is applied pre-paint by the inline
 * script in the root layout (reads localStorage / OS preference), so this only
 * mirrors the DOM state and flips it. Gated on `mounted` to avoid a hydration
 * mismatch between the server (no class) and the client (class already set).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {/* Render a stable icon until mounted to keep SSR/CSR markup identical. */}
      {mounted && isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
