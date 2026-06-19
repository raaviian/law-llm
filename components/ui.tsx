import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MEMBER_TITLES } from "@/lib/titles";

// Button ----------------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-card text-foreground hover:bg-foreground/5",
  ghost: "text-muted hover:bg-foreground/10 hover:text-foreground",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-12 px-7 text-base",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

// Card ------------------------------------------------------------------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Form fields -----------------------------------------------------------------
export const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, props.className)} {...props} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(inputClass, "min-h-24 resize-y", props.className)}
    />
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-foreground"
    >
      {children}
    </label>
  );
}

// Badge -----------------------------------------------------------------------
// Tint pattern reads in both themes (the old `-50` backgrounds vanished on dark
// surfaces): translucent fill + ring, with a lighter text in dark mode.
const badgeBase =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset";
const slateTint =
  "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300";
const statusStyles: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300",
  active: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  closed: slateTint,
  ready: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  processing: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  uploaded: slateTint,
  failed: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={cn(badgeBase, statusStyles[status] ?? slateTint)}>
      {status}
    </span>
  );
}

// Permission-role badge (owner / admin / member).
const roleStyles: Record<string, string> = {
  owner: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  admin: "bg-primary/15 text-primary ring-primary/30",
  member: slateTint,
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(badgeBase, roleStyles[role] ?? slateTint)}>{role}</span>
  );
}

// Professional-title badge (Partner, Senior Lawyer, …). Neutral so it reads as
// an attribute rather than a status. Renders nothing when no title is set.
export function TitleBadge({ title }: { title: string | null | undefined }) {
  if (!title) return null;
  const label = MEMBER_TITLES[title as keyof typeof MEMBER_TITLES] ?? title;
  return (
    <span
      className={cn(
        badgeBase,
        "bg-foreground/5 text-foreground ring-border",
      )}
    >
      {label}
    </span>
  );
}

// Skeleton --------------------------------------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
      aria-hidden="true"
    />
  );
}

// Empty state -----------------------------------------------------------------
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
