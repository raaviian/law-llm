"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Style-agnostic submit button that reflects the enclosing form's pending state.
 * Use when you need custom classes (the styled variant is SubmitButton).
 */
export function PendingButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(className, pending && "cursor-not-allowed opacity-60")}
    >
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
