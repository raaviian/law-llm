import Link from "next/link";
import type { ReactNode } from "react";
import { InfoIcon, ArrowRightIcon, CheckCircleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type Variant = "info" | "tip" | "next" | "success";

const STYLES: Record<Variant, { box: string; icon: string; Icon: typeof InfoIcon }> = {
  info: {
    box: "border-border bg-foreground/[0.03]",
    icon: "text-muted",
    Icon: InfoIcon,
  },
  tip: {
    box: "border-amber-500/30 bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: InfoIcon,
  },
  next: {
    box: "border-primary/30 bg-primary/10",
    icon: "text-primary",
    Icon: ArrowRightIcon,
  },
  success: {
    box: "border-emerald-500/30 bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircleIcon,
  },
};

/**
 * A minimalist inline guidance banner used for empty-state help and
 * "do this next" hints. Non-intrusive, dark-mode-safe, with an optional
 * action link so the user always has a clear next step.
 */
export function Callout({
  variant = "info",
  title,
  children,
  action,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  const s = STYLES[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm",
        s.box,
        className,
      )}
    >
      <s.Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children && <p className="mt-0.5 text-muted">{children}</p>}
        {action && (
          <Link
            href={action.href}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {action.label}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
