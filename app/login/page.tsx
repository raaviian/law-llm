import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/env";
import { Button } from "@/components/ui";
import { Logo } from "@/components/brand";

const valueProps = [
  "A private workspace for every matter",
  "Chat with your case files — answers cite the source page",
  "Court strategy board, notes & deadlines",
  "Encrypted, and your files aren’t used to train AI",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { callbackUrl } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / value side */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-white/15 text-sm font-bold">
            L
          </span>
          Lex<span className="-ml-1 text-accent">Board</span>
        </Link>

        <div>
          <h2 className="font-serif text-4xl font-semibold leading-tight">
            The case workspace that reads your files.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {valueProps.map((v) => (
              <li
                key={v}
                className="flex items-start gap-3 text-lg text-primary-foreground/90"
              >
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-base text-primary-foreground/70">
          Built for solo lawyers and small firms.
        </p>
      </div>

      {/* Sign-in side */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-base text-muted">
            Continue to manage your cases and chat with your files.
          </p>

          {isGoogleAuthConfigured ? (
            <form
              className="mt-8"
              action={async () => {
                "use server";
                await signIn("google", {
                  redirectTo: callbackUrl || "/dashboard",
                });
              }}
            >
              <Button type="submit" variant="secondary" className="w-full">
                <GoogleIcon />
                Continue with Google
              </Button>
            </form>
          ) : (
            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Google sign-in isn&apos;t configured yet. Add{" "}
              <code className="font-mono">AUTH_GOOGLE_ID</code> and{" "}
              <code className="font-mono">AUTH_GOOGLE_SECRET</code> to{" "}
              <code className="font-mono">.env.local</code> to enable login.
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted">
            By continuing you agree this tool does not provide legal advice.
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            <Link href="/" className="hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
