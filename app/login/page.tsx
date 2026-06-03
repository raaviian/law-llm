import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/env";
import { Button, Card } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary"
          >
            Lex<span className="text-accent">Board</span>
          </Link>
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            Sign in to your workspace
          </h1>
          <p className="mt-1 text-sm text-muted">
            Continue to manage your cases and chat with your files.
          </p>
        </div>

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
              Continue with Google
            </Button>
          </form>
        ) : (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Google sign-in is not configured yet. Add{" "}
            <code className="font-mono">AUTH_GOOGLE_ID</code> and{" "}
            <code className="font-mono">AUTH_GOOGLE_SECRET</code> to{" "}
            <code className="font-mono">.env.local</code> to enable login.
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree this tool does not provide legal advice.
        </p>
      </Card>
    </div>
  );
}
