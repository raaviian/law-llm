import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function back(status: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?verify=${status}`, env.appUrl));
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return back("invalid");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("email_verification_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!row) return back("invalid");

  // Always consume the token so it can't be reused or brute-forced.
  await admin.from("email_verification_tokens").delete().eq("token", token);

  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return back("expired");
  }

  await admin
    .from("user_passwords")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("user_id", row.user_id as string);

  return back("ok");
}
