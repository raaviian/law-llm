import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui";
import { Logo } from "@/components/brand";
import { NavLink } from "@/components/nav-link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const label = user.name || user.email || "U";
  const initial = label.trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" />
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/dashboard" prefixes={["/dashboard", "/cases"]}>
                Cases
              </NavLink>
              <NavLink href="/settings/team" prefixes={["/settings/team"]}>
                Team
              </NavLink>
              <NavLink href="/settings/audit" prefixes={["/settings/audit"]}>
                Activity
              </NavLink>
              <NavLink href="/settings/billing" prefixes={["/settings/billing"]}>
                Billing
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initial}
                </span>
              )}
              <span className="max-w-[14rem] truncate text-sm text-muted">
                {user.email}
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 border-t border-border px-4 py-2 sm:hidden">
          <NavLink href="/dashboard" prefixes={["/dashboard", "/cases"]}>
            Cases
          </NavLink>
          <NavLink href="/settings/team" prefixes={["/settings/team"]}>
            Team
          </NavLink>
          <NavLink href="/settings/audit" prefixes={["/settings/audit"]}>
            Activity
          </NavLink>
          <NavLink href="/settings/billing" prefixes={["/settings/billing"]}>
            Billing
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
