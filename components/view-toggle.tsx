"use client";

import { GridIcon, ListIcon, KanbanIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "kanban";

const META: Record<ViewMode, { label: string; Icon: typeof GridIcon }> = {
  grid: { label: "Grid view", Icon: GridIcon },
  list: { label: "List view", Icon: ListIcon },
  kanban: { label: "Board view", Icon: KanbanIcon },
};

/** Controlled segmented control for switching how a collection is displayed. */
export function ViewToggle({
  value,
  onChange,
  modes = ["grid", "list"],
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border p-0.5">
      {modes.map((mode) => {
        const { label, Icon } = META[mode];
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-foreground/10 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
