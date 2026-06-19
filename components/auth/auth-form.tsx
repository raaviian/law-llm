"use client";

import { useActionState, useState } from "react";
import {
  authenticate,
  signUpWithPassword,
  type AuthState,
} from "@/lib/auth-actions";
import { Button, Input, Label } from "@/components/ui";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";

export function AuthForm({
  mode,
  callbackUrl,
}: {
  mode: "login" | "signup";
  callbackUrl?: string;
}) {
  const action = mode === "signup" ? signUpWithPassword : authenticate;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="redirectTo" value={callbackUrl || "/dashboard"} />
      {mode === "signup" && (
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required placeholder="Jane Doe" autoComplete="name" />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={isSignup ? 16 : 8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignup ? "At least 16 characters" : "Your password"}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
        {isSignup && password.length > 0 && (
          <div className="mt-2">
            <PasswordStrengthMeter value={password} />
          </div>
        )}
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.notice && <p className="text-sm text-green-700">{state.notice}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? mode === "signup"
            ? "Creating account…"
            : "Signing in…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  );
}
