"use client";

import { useEffect, useState } from "react";

/**
 * Persist small UI state (e.g. a list's grid/list view choice) to localStorage.
 * SSR-safe: starts from `initial` on both server and first client render, then
 * hydrates from storage in a post-mount effect to avoid a hydration mismatch.
 */
export function useLocalStorage<T extends string>(
  key: string,
  initial: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(stored as T);
    } catch {
      /* ignore (private mode, etc.) */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function set(next: T) {
    setValue(next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      /* ignore */
    }
  }

  return [value, set];
}
