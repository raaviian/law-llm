"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrgForUser } from "@/lib/orgs";

export type AuthState = { error?: string } | undefined;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function redirectTo(formData: FormData): string {
  const v = String(formData.get("redirectTo") ?? "").trim();
  return v.startsWith("/") ? v : "/dashboard";
}

/** Email/password sign-in. Returns an error string for the form, or redirects. */
export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: redirectTo(formData),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password." };
    throw e; // NEXT_REDIRECT and anything else must propagate
  }
}

/** Create an email/password account, bootstrap the org, then sign in. */
export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .schema("next_auth")
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return { error: "An account with this email already exists — try signing in." };
  }

  const { data: created, error: createErr } = await admin
    .schema("next_auth")
    .from("users")
    .insert({ email, name })
    .select("id")
    .single();
  if (createErr || !created) {
    return { error: "Could not create your account. Please try again." };
  }
  const userId = created.id as string;

  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash(password, 10);
  const { error: pwErr } = await admin.from("user_passwords").insert({
    user_id: userId,
    email,
    name,
    password_hash: passwordHash,
  });
  if (pwErr) return { error: "Could not create your account. Please try again." };

  await ensureOrgForUser(userId, name || email);

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo(formData),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw e;
  }
}
