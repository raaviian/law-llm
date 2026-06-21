"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocalStorage } from "@/lib/use-local-storage";
import { signOutAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  FolderIcon,
  UsersIcon,
  SparkIcon,
  ActivityIcon,
  CreditCardIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  ChevronLeftIcon,
  LogOutIcon,
} from "@/components/icons";

interface OrgOption {
  org_id: string;
  name: string;
  role: string;
}
interface ShellUser {
  name: string | null;
  email: string | null;
  image: string | null;
  initial: string;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon, prefixes: ["/dashboard"] },
  { href: "/cases", label: "Cases", icon: FolderIcon, prefixes: ["/cases"] },
  { href: "/settings/team", label: "Team", icon: UsersIcon, prefixes: ["/settings/team"] },
  { href: "/settings/ai", label: "AI", icon: SparkIcon, prefixes: ["/settings/ai"] },
  { href: "/settings/audit", label: "Activity", icon: ActivityIcon, prefixes: ["/settings/audit"] },
  { href: "/settings/billing", label: "Billing", icon: CreditCardIcon, prefixes: ["/settings/billing"] },
  { href: "/settings", label: "Settings", icon: SettingsIcon, prefixes: undefined as string[] | undefined },
];

export function AppShell({
  user,
  orgs,
  activeOrgId,
  children,
}: {
  user: ShellUser;
  orgs: OrgOption[];
  activeOrgId: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useLocalStorage<"0" | "1">("nav:collapsed", "0");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCollapsed = collapsed === "1";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card lg:flex",
          isCollapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarContent
          user={user}
          orgs={orgs}
          activeOrgId={activeOrgId}
          collapsed={isCollapsed}
          onCollapse={() => setCollapsed(isCollapsed ? "0" : "1")}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card">
            <SidebarContent
              user={user}
              orgs={orgs}
              activeOrgId={activeOrgId}
              collapsed={false}
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/80 px-4 backdrop-blur">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-foreground/10 hover:text-foreground lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold tracking-tight text-primary lg:hidden"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              L
            </span>
            Lex<span className="-ml-1 text-accent">Board</span>
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted sm:flex-row">
            <span>© {new Date().getFullYear()} LexBoard</span>
            <span>AI output is not legal advice.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  orgs,
  activeOrgId,
  collapsed,
  onCollapse,
  onClose,
  onNavigate,
}: {
  user: ShellUser;
  orgs: OrgOption[];
  activeOrgId: string;
  collapsed: boolean;
  onCollapse?: () => void;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Brand row */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground">
              L
            </span>
            Lex<span className="-ml-1 text-accent">Board</span>
          </Link>
        )}
        {collapsed && (
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground">
            L
          </span>
        )}
        {onClose && (
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-foreground/10 hover:text-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Org switcher */}
      {!collapsed && orgs.length > 1 && (
        <div className="px-3 py-3">
          <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active = item.prefixes
            ? item.prefixes.some(
                (p) => pathname === p || pathname.startsWith(`${p}/`),
              )
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-foreground/10 hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: collapse toggle (desktop) + user + sign out */}
      <div className="border-t border-border p-2">
        {onCollapse && (
          <button
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mb-1 flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-foreground/10 hover:text-foreground",
              collapsed ? "justify-center px-0" : "gap-3",
            )}
          >
            <ChevronLeftIcon
              className={cn("h-5 w-5 shrink-0 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        )}

        <Link
          href="/settings/profile"
          onClick={onNavigate}
          title={collapsed ? user.name || user.email || "Profile" : undefined}
          className={cn(
            "flex items-center rounded-lg py-2 transition-colors hover:bg-foreground/5",
            collapsed ? "justify-center px-0" : "gap-2.5 px-2",
          )}
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user.initial}
            </span>
          )}
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {user.name || "Your profile"}
              </span>
              <span className="block truncate text-xs text-muted">{user.email}</span>
            </span>
          )}
        </Link>

        <form action={signOutAction} className={collapsed ? "" : "mt-1"}>
          <button
            type="submit"
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg py-2 text-sm font-medium text-muted transition-colors hover:bg-foreground/10 hover:text-foreground",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            <LogOutIcon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>
    </>
  );
}
