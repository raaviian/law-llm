"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { subscribeLoading, pushLoading, popLoading } from "@/lib/loading-bus";

/**
 * Drives the global overlay from a pending boolean: shows while `active` is
 * true, clears on change/unmount. Use in client mutations that aren't a plain
 * navigation or form submit (selects, onClick + useTransition, etc.).
 */
export function useLoadingEffect(active: boolean) {
  useEffect(() => {
    if (!active) return;
    pushLoading();
    return () => popLoading();
  }, [active]);
}

/**
 * App-wide loading overlay. Watches navigations (internal link clicks) and form
 * submissions, and shows a minimalist blurred popup until the action settles
 * (route change, DOM settle, or a safety timeout). Mounted once in the shell.
 */
export function GlobalLoading() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const armedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const obsRef = useRef<MutationObserver | null>(null);

  useEffect(() => subscribeLoading(setVisible), []);

  // Pop every event-driven push that's still in flight, and tear down watchers.
  const settle = useRef(() => {});
  settle.current = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (obsRef.current) {
      obsRef.current.disconnect();
      obsRef.current = null;
    }
    while (armedRef.current > 0) {
      armedRef.current -= 1;
      popLoading();
    }
  };

  useEffect(() => {
    function arm() {
      pushLoading();
      armedRef.current += 1;
      // Settle shortly after the DOM stops changing (covers in-place
      // revalidations and ?param-only navigations).
      if (!obsRef.current) {
        const target = document.querySelector("main") ?? document.body;
        obsRef.current = new MutationObserver(() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => settle.current(), 250);
        });
        obsRef.current.observe(target, { childList: true, subtree: true });
      }
      // Safety net so the overlay can never get stuck.
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => settle.current(), 6000);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      arm();
    }

    function onSubmit(e: SubmitEvent) {
      if (e.defaultPrevented) return;
      arm();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      settle.current();
    };
  }, []);

  // A completed navigation settles any armed event pushes.
  useEffect(() => {
    settle.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/40 backdrop-blur-sm animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/80 px-7 py-6 shadow-lg backdrop-blur">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-foreground/20 border-t-primary" />
        <span className="text-sm font-medium text-muted">Loading…</span>
      </div>
    </div>
  );
}
