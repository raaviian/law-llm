import "server-only";
import { env } from "@/lib/env";

export const isEmailConfigured = Boolean(env.resendKey);

interface InviteEmailOpts {
  to: string;
  orgName: string;
  inviteUrl: string;
  inviterName?: string | null;
}

/**
 * Send an invitation email via Resend's REST API. Best-effort: returns false
 * (without throwing) when email isn't configured or the send fails, so the
 * copy-link flow always remains the source of truth.
 *
 * NOTE: the default from-address (onboarding@resend.dev) only delivers to your
 * own Resend account email in test mode. Set EMAIL_FROM to an address on a
 * verified domain to email real invitees. The HTML here is intentionally plain
 * and meant to be rebranded later.
 */
export async function sendInviteEmail(opts: InviteEmailOpts): Promise<boolean> {
  if (!env.resendKey) return false;
  const who = opts.inviterName ? `${opts.inviterName} invited you` : "You're invited";
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h1 style="font-size:18px;color:#1e3a8a;margin:0 0 8px">LexBoard</h1>
    <p style="font-size:15px;margin:0 0 16px">${who} to join <strong>${opts.orgName}</strong> on LexBoard.</p>
    <p style="margin:0 0 24px">
      <a href="${opts.inviteUrl}" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Accept invitation</a>
    </p>
    <p style="font-size:12px;color:#64748b;margin:0">Or paste this link into your browser:<br>${opts.inviteUrl}</p>
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0">Sign in with this email's Google account to accept. This invite expires in 14 days.</p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [opts.to],
        subject: `You're invited to ${opts.orgName} on LexBoard`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
