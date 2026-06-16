import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/env";
import { AuthShell, AuthDivider } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { callbackUrl } = await searchParams;
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start managing cases and chatting with your files in minutes."
    >
      <AuthForm mode="signup" callbackUrl={callbackUrl} />
      {isGoogleAuthConfigured && (
        <>
          <AuthDivider />
          <GoogleButton callbackUrl={callbackUrl} />
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
