"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/**
 * Submit button that reflects the enclosing form's pending state (works with
 * server actions). Disables itself and shows `pendingText` while submitting.
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
    >
      {pending ? (pendingText ?? "Working…") : children}
    </Button>
  );
}
