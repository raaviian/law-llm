import Link from "next/link";
import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { listUserOrgs, getActiveOrgId } from "@/lib/orgs";
import { Button } from "@/components/ui";
import { Logo } from "@/components/brand";
import { NavLink } from "@/components/nav-link";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const label = user.name || user.email || "U";
  const initial = label.trim().charAt(0).toUpperCase();
  const [orgs, activeOrgId] = await Promise.all([
    listUserOrgs(user.id),
    getActiveOrgId(user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" />
            <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/dashboard" prefixes={["/dashboard", "/cases"]}>
                Cases
              </NavLink>
              <NavLink href="/settings/team" prefixes={["/settings/team"]}>
                Team
              </NavLink>
              <NavLink href="/settings/ai" prefixes={["/settings/ai"]}>
                AI
              </NavLink>
              <NavLink href="/settings/audit" prefixes={["/settings/audit"]}>
                Activity
              </NavLink>
              <NavLink href="/settings/billing" prefixes={["/settings/billing"]}>
                Billing
              </NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/settings/profile"
              aria-label="Your profile"
              className="hidden items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-foreground/5 sm:flex"
            >
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
              <span className="max-w-[12rem] truncate text-sm text-muted">
                {user.email}
              </span>
            </Link>
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
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
          <NavLink href="/dashboard" prefixes={["/dashboard", "/cases"]}>
            Cases
          </NavLink>
          <NavLink href="/settings/team" prefixes={["/settings/team"]}>
            Team
          </NavLink>
          <NavLink href="/settings/ai" prefixes={["/settings/ai"]}>
            AI
          </NavLink>
          <NavLink href="/settings/audit" prefixes={["/settings/audit"]}>
            Activity
          </NavLink>
          <NavLink href="/settings/billing" prefixes={["/settings/billing"]}>
            Billing
          </NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} LexBoard</span>
          <span>AI output is not legal advice.</span>
        </div>
      </footer>
    </div>
  );
}
