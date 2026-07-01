import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/data";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import {
  FolderIcon,
  ScaleIcon,
  CalendarIcon,
  DocCheckIcon,
  SparkIcon,
  ArrowRightIcon,
} from "@/components/icons";
import { GettingStarted } from "@/components/getting-started";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const { cases, deadlines, activity, docCount, threadCount, openDeadlineCount } =
    await getDashboardData(user.id);

  const active = cases.filter((c) => c.status === "active").length;
  const open = cases.filter((c) => c.status === "open").length;
  const closed = cases.filter((c) => c.status === "closed").length;
  const total = cases.length || 1;
  const firstName = (user.name || "there").split(" ")[0];

  const stats = [
    { icon: FolderIcon, label: "Total cases", value: cases.length, accent: false },
    { icon: ScaleIcon, label: "Active cases", value: active, accent: true },
    { icon: CalendarIcon, label: "Open deadlines", value: openDeadlineCount, accent: false },
    { icon: DocCheckIcon, label: "Documents", value: docCount, accent: false },
  ];

  const segments = [
    { label: "Open", count: open, color: "bg-blue-500" },
    { label: "Active", count: active, color: "bg-emerald-500" },
    { label: "Closed", count: closed, color: "bg-slate-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted">Your practice at a glance.</p>
        </div>
        <LinkButton href="/cases/new">+ New case</LinkButton>
      </div>

      <GettingStarted
        hasCase={cases.length > 0}
        hasDocument={docCount > 0}
        hasChat={threadCount > 0}
        firstCaseId={cases[0]?.id}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                s.accent
                  ? "bg-accent/15 text-accent"
                  : "bg-primary/10 text-primary",
              )}
            >
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-2xl font-semibold leading-none text-foreground">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {cases.length === 0 ? (
        <EmptyState
          title="No cases yet"
          description="Create your first case to start uploading documents and asking questions about your files."
          action={<LinkButton href="/cases/new">Create a case</LinkButton>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: status + matters */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status overview */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Cases by status
              </h2>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-foreground/10">
                {segments.map(
                  (seg) =>
                    seg.count > 0 && (
                      <div
                        key={seg.label}
                        className={seg.color}
                        style={{ width: `${(seg.count / total) * 100}%` }}
                      />
                    ),
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {segments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2 text-sm">
                    <span className={cn("h-2.5 w-2.5 rounded-full", seg.color)} />
                    <span className="text-muted">{seg.label}</span>
                    <span className="font-semibold text-foreground">{seg.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent matters */}
            <Card>
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent cases
                </h2>
                <span className="text-xs text-muted">{cases.length} total</span>
              </div>
              <ul className="divide-y divide-border">
                {cases.slice(0, 7).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.id}`}
                      className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-foreground/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.title}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {[c.client_name, c.court, c.jurisdiction]
                            .filter(Boolean)
                            .join(" · ") || "No details"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-muted sm:inline">
                          {formatDate(c.updated_at)}
                        </span>
                        <Badge status={c.status} />
                        <ArrowRightIcon className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Upcoming deadlines */}
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-foreground">
                  Upcoming deadlines
                </h2>
              </div>
              {deadlines.length === 0 ? (
                <p className="text-sm text-muted">Nothing due — you&apos;re clear.</p>
              ) : (
                <ul className="space-y-3">
                  {deadlines.map((d) => (
                    <li key={d.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{d.title}</p>
                        {d.case_title && (
                          <p className="truncate text-xs text-muted">{d.case_title}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDate(d.due_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Recent activity */}
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <SparkIcon className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-foreground">
                  Recent activity
                </h2>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-muted">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="text-foreground">{a.summary ?? a.action}</p>
                      <p className="text-xs text-muted">{formatDateTime(a.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
