import Link from "next/link";
import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-lg font-bold tracking-tight text-primary"
            >
              Lex<span className="text-accent">Board</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
              >
                Cases
              </Link>
              <Link
                href="/settings/billing"
                className="rounded-md px-3 py-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
              >
                Billing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
