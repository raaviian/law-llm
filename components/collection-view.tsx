"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";

export interface CollectionFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Return true to keep `item` for the chosen non-"all" `value`. */
  match: (item: T, value: string) => boolean;
}

export interface CollectionSort<T> {
  options: { value: string; label: string }[];
  defaultKey: string;
  compare: (a: T, b: T, key: string) => number;
}

export interface CollectionViewProps<T> {
  items: T[];
  storageKey: string;
  defaultView?: ViewMode;
  modes?: ViewMode[];
  searchPlaceholder?: string;
  /** Lower-cased haystack the search query is matched against. */
  searchFields: (item: T) => string;
  filters?: CollectionFilter<T>[];
  sort?: CollectionSort<T>;
  renderItem: (item: T, view: ViewMode) => ReactNode;
  itemKey: (item: T) => string;
  renderEmpty?: ReactNode;
  gridClassName?: string;
  listClassName?: string;
  /** Extra controls rendered on the right of the toolbar (e.g. a New button). */
  toolbarExtra?: ReactNode;
}

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * Generic searchable/filterable/sortable list with a grid|list (|kanban) toggle.
 * Filtering happens client-side over the already-fetched `items` — fine at the
 * per-case / small-firm scale these lists operate at.
 */
export function CollectionView<T>({
  items,
  storageKey,
  defaultView = "grid",
  modes = ["grid", "list"],
  searchPlaceholder = "Search…",
  searchFields,
  filters = [],
  sort,
  renderItem,
  itemKey,
  renderEmpty,
  gridClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  listClassName = "divide-y divide-border",
  toolbarExtra,
}: CollectionViewProps<T>) {
  const [view, setView] = useLocalStorage<ViewMode>(storageKey, defaultView);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState(sort?.defaultKey ?? "");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items.filter((item) => {
      if (q && !searchFields(item).toLowerCase().includes(q)) return false;
      for (const f of filters) {
        const v = filterValues[f.key];
        if (v && v !== "all" && !f.match(item, v)) return false;
      }
      return true;
    });
    if (sort && sortKey) {
      result = [...result].sort((a, b) => sort.compare(a, b, sortKey));
    }
    return result;
  }, [items, query, filterValues, sortKey, filters, sort, searchFields]);

  const effectiveView: ViewMode = modes.includes(view) ? view : defaultView;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {filters.map((f) => (
          <select
            key={f.key}
            aria-label={f.label}
            value={filterValues[f.key] ?? "all"}
            onChange={(e) =>
              setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
            className={selectClass}
          >
            <option value="all">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}

        {sort && (
          <select
            aria-label="Sort by"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className={selectClass}
          >
            {sort.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {toolbarExtra}
        {modes.length > 1 && (
          <ViewToggle value={effectiveView} onChange={setView} modes={modes} />
        )}
      </div>

      {visible.length === 0 ? (
        renderEmpty ?? (
          <p className="py-10 text-center text-sm text-muted">No matches.</p>
        )
      ) : effectiveView === "list" ? (
        <ul className={listClassName}>
          {visible.map((item) => (
            <li key={itemKey(item)}>{renderItem(item, "list")}</li>
          ))}
        </ul>
      ) : (
        <div className={gridClassName}>
          {visible.map((item) => (
            <div key={itemKey(item)}>{renderItem(item, effectiveView)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
