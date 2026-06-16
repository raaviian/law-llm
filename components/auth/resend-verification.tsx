"use client";

import { useActionState } from "react";
import { resendVerification, type AuthState } from "@/lib/auth-actions";
import { Button, Input, Label } from "@/components/ui";

/** Compact "resend the verification link" form, shown after a bad/expired link. */
export function ResendVerification({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resendVerification,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-2.5">
      <div>
        <Label htmlFor="resend-email">Email</Label>
        <Input
          id="resend-email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="you@email.com"
          autoComplete="email"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.notice && <p className="text-sm text-green-700">{state.notice}</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Resend verification link"}
      </Button>
    </form>
  );
}
