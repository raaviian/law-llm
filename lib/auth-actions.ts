"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrgForUser } from "@/lib/orgs";
import { createAndSendVerification } from "@/lib/verification";

export type AuthState = { error?: string; notice?: string } | undefined;

/** Sign out and return to the marketing site. Usable from client components. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

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
    if (e instanceof AuthError) {
      if ((e as { code?: string }).code === "email_not_verified") {
        return {
          error:
            "Please verify your email first — check your inbox for the link, or sign up again to resend it.",
        };
      }
      return { error: "Invalid email or password." };
    }
    throw e; // NEXT_REDIRECT and anything else must propagate
  }
}

/**
 * Create an email/password account, bootstrap the org, send a verification
 * email, then redirect to the login page asking the user to confirm. The
 * account can't sign in until the email is verified.
 */
export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 16) {
    return { error: "Password must be at least 16 characters." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { error: "Password must include at least one symbol." };
  }
  if (!/[0-9]/.test(password) || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return {
      error: "Password must include upper- and lower-case letters and a number.",
    };
  }

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
  await createAndSendVerification(userId, email, name);

  // redirect() throws NEXT_REDIRECT, which the form action propagates.
  redirect(`/login?verify=sent&email=${encodeURIComponent(email)}`);
}

/** Re-send the verification link for an unverified password account. */
export async function resendVerification(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_passwords")
    .select("user_id, name, email_verified_at")
    .eq("email", email)
    .maybeSingle();

  // Only send for a real, still-unverified account, but always show the same
  // notice so we don't disclose which emails are registered.
  if (data?.user_id && !data.email_verified_at) {
    await createAndSendVerification(
      data.user_id as string,
      email,
      (data.name as string) ?? null,
    );
  }
  return {
    notice: "If that account needs verifying, we've sent a fresh link to your inbox.",
  };
}
