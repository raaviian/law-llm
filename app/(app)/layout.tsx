import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listUserOrgs, getActiveOrgId } from "@/lib/orgs";
import { AppShell } from "@/components/app-shell";

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
    <AppShell
      user={{ name: user.name, email: user.email, image: user.image, initial }}
      orgs={orgs}
      activeOrgId={activeOrgId}
    >
      {children}
    </AppShell>
  );
}
