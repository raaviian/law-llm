import "server-only";
import { env } from "@/lib/env";

export const isEmailConfigured = Boolean(env.resendKey);

interface InviteEmailOpts {
  to: string;
  orgName: string;
  inviteUrl: string;
  inviterName?: string | null;
  role?: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Branded, email-client-safe invitation HTML (table layout + inline styles). */
export function inviteEmailHtml(opts: InviteEmailOpts): string {
  const org = esc(opts.orgName);
  const url = esc(opts.inviteUrl);
  const inviter = opts.inviterName ? esc(opts.inviterName) : "";
  const roleLabel = opts.role ? esc(opts.role) : "";
  const lead = inviter
    ? `<strong>${inviter}</strong> has invited you to join`
    : "You've been invited to join";
  const roleLine = roleLabel
    ? ` as a${/^[aeiou]/i.test(roleLabel) ? "n" : ""} <strong style="text-transform:capitalize">${roleLabel}</strong>`
    : "";
  const year = new Date().getFullYear();
  const font =
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>You're invited to ${org}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${inviter ? inviter + " invited you" : "You're invited"} to join ${org} on LexBoard.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;${font}">
      <tr><td style="background:#1e3a8a;padding:22px 32px;">
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.2px;color:#ffffff;">Lex<span style="color:#c2a14d;">Board</span></span>
      </td></tr>
      <tr><td style="padding:36px 32px 8px;">
        <h1 style="margin:0 0 10px;font-size:23px;line-height:1.3;font-weight:600;color:#0f172a;">You're invited to ${org}</h1>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">${lead} <strong>${org}</strong> on LexBoard${roleLine} — the AI workspace for managing cases, planning strategy, and chatting with case files.</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td align="center" bgcolor="#1e3a8a" style="border-radius:10px;">
            <a href="${url}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Accept invitation</a>
          </td></tr>
        </table>
        <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Sign in with this email's Google account to accept. This invitation expires in 14 days.</p>
      </td></tr>
      <tr><td style="padding:20px 32px 30px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Button not working? Paste this link into your browser:<br>
          <a href="${url}" target="_blank" style="color:#1e3a8a;word-break:break-all;">${url}</a>
        </p>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 32px;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">LexBoard is a productivity tool, not a law firm, and its output is not legal advice. If you weren't expecting this invitation, you can safely ignore this email.</p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;${font}">© ${year} LexBoard</p>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Send an invitation email via Resend's REST API. Best-effort: returns false
 * (without throwing) when email isn't configured or the send fails, so the
 * copy-link flow always remains the source of truth.
 *
 * NOTE: the default from-address (onboarding@resend.dev) only delivers to your
 * own Resend account email in test mode. Set EMAIL_FROM to an address on a
 * verified domain to email real invitees.
 */
export async function sendInviteEmail(opts: InviteEmailOpts): Promise<boolean> {
  if (!env.resendKey) return false;
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
        html: inviteEmailHtml(opts),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface VerifyEmailOpts {
  to: string;
  verifyUrl: string;
  name?: string | null;
}

/** Branded, email-client-safe email-verification HTML (same shell as invites). */
export function verifyEmailHtml(opts: VerifyEmailOpts): string {
  const url = esc(opts.verifyUrl);
  const name = opts.name ? esc(opts.name) : "";
  const greeting = name ? `Hi ${name},` : "Welcome to LexBoard,";
  const year = new Date().getFullYear();
  const font =
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm your email to activate your LexBoard account.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;${font}">
      <tr><td style="background:#1e3a8a;padding:22px 32px;">
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.2px;color:#ffffff;">Lex<span style="color:#c2a14d;">Board</span></span>
      </td></tr>
      <tr><td style="padding:36px 32px 8px;">
        <h1 style="margin:0 0 10px;font-size:23px;line-height:1.3;font-weight:600;color:#0f172a;">Verify your email</h1>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">${greeting} confirm this email address to activate your account and start managing cases, planning strategy, and chatting with your files.</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td align="center" bgcolor="#1e3a8a" style="border-radius:10px;">
            <a href="${url}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Verify email</a>
          </td></tr>
        </table>
        <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#64748b;">This link expires in 24 hours. If you didn't create a LexBoard account, you can safely ignore this email.</p>
      </td></tr>
      <tr><td style="padding:20px 32px 30px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Button not working? Paste this link into your browser:<br>
          <a href="${url}" target="_blank" style="color:#1e3a8a;word-break:break-all;">${url}</a>
        </p>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 32px;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">LexBoard is a productivity tool, not a law firm, and its output is not legal advice.</p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;${font}">© ${year} LexBoard</p>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Send the email-verification link via Resend. Returns false (without throwing)
 * when email isn't configured or the send fails, so the caller can surface a
 * graceful message instead of crashing the sign-up flow.
 */
export async function sendVerificationEmail(opts: VerifyEmailOpts): Promise<boolean> {
  if (!env.resendKey) return false;
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
        subject: "Verify your email for LexBoard",
        html: verifyEmailHtml(opts),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
