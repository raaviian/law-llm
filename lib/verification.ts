import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Mint a single-use verification token for a password account and email the
 * link. Old tokens for the user are cleared first so only the latest works.
 * Returns whether the email was actually sent (false when Resend isn't
 * configured — the caller can still surface a "check your inbox" message).
 */
export async function createAndSendVerification(
  userId: string,
  email: string,
  name?: string | null,
): Promise<boolean> {
  const admin = createAdminClient();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await admin.from("email_verification_tokens").delete().eq("user_id", userId);
  await admin.from("email_verification_tokens").insert({
    token,
    user_id: userId,
    email,
    expires_at: expiresAt,
  });

  const verifyUrl = `${env.appUrl}/api/verify-email?token=${token}`;
  return sendVerificationEmail({ to: email, verifyUrl, name });
}
