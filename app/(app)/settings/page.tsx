import Link from "next/link";
import { Card } from "@/components/ui";
import {
  UserIcon,
  UsersIcon,
  SparkIcon,
  ActivityIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from "@/components/icons";

const sections = [
  {
    href: "/settings/profile",
    icon: UserIcon,
    title: "Profile",
    desc: "Your account details, role, and professional title.",
  },
  {
    href: "/settings/team",
    icon: UsersIcon,
    title: "Team",
    desc: "Invite colleagues, manage roles and titles.",
  },
  {
    href: "/settings/ai",
    icon: SparkIcon,
    title: "AI",
    desc: "Use your own AI provider and model, or keep the free shared one.",
  },
  {
    href: "/settings/audit",
    icon: ActivityIcon,
    title: "Activity",
    desc: "Audit log of everything that happens in your firm.",
  },
  {
    href: "/settings/billing",
    icon: CreditCardIcon,
    title: "Billing",
    desc: "Plan, usage, and seats.",
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-base text-muted">
          Manage your account, team, and workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="flex h-full items-start gap-4 p-5 transition-colors hover:border-primary/30 hover:bg-foreground/[0.03]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-foreground">
                    {s.title}
                  </h2>
                  <ArrowRightIcon className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
