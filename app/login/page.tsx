import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/env";
import { AuthShell, AuthDivider } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { ResendVerification } from "@/components/auth/resend-verification";

type Verify = "sent" | "ok" | "expired" | "invalid";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; verify?: string; email?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { callbackUrl, verify, email } = await searchParams;
  const signupHref = callbackUrl
    ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/signup";

  const v = verify as Verify | undefined;
  const needsResend = v === "expired" || v === "invalid";

  return (
    <AuthShell
      title="Sign in to your workspace"
      subtitle="Continue to manage your cases and chat with your files."
    >
      {v === "sent" && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Check your inbox — we sent a verification link
          {email ? ` to ${email}` : ""}. Click it to activate your account, then
          sign in.
        </div>
      )}
      {v === "ok" && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Email verified — you can now sign in.
        </div>
      )}
      {needsResend && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {v === "expired"
            ? "That verification link has expired."
            : "That verification link is invalid or already used."}{" "}
          Enter your email below to get a fresh one.
        </div>
      )}

      {needsResend ? (
        <ResendVerification defaultEmail={email} />
      ) : (
        <AuthForm mode="login" callbackUrl={callbackUrl} />
      )}

      {isGoogleAuthConfigured && (
        <>
          <AuthDivider />
          <GoogleButton callbackUrl={callbackUrl} />
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
