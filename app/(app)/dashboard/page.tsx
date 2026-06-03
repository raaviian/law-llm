import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listCases, getUpcomingDeadlines } from "@/lib/data";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [cases, deadlines] = await Promise.all([
    listCases(user.id),
    getUpcomingDeadlines(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cases</h1>
          <p className="text-sm text-muted">
            {cases.length} {cases.length === 1 ? "matter" : "matters"} in your workspace
          </p>
        </div>
        <LinkButton href="/cases/new">New case</LinkButton>
      </div>

      {deadlines.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Upcoming deadlines
          </h2>
          <ul className="divide-y divide-border">
            {deadlines.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{d.title}</span>
                  {d.case_title && (
                    <span className="text-muted"> · {d.case_title}</span>
                  )}
                </span>
                <span className="text-muted">{formatDateTime(d.due_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {cases.length === 0 ? (
        <EmptyState
          title="No cases yet"
          description="Create your first case to start uploading documents and chatting with your files."
          action={<LinkButton href="/cases/new">Create a case</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <Badge status={c.status} />
                </div>
                {c.client_name && (
                  <p className="mt-1 text-sm text-muted">{c.client_name}</p>
                )}
                <dl className="mt-4 space-y-1 text-xs text-muted">
                  {c.jurisdiction && (
                    <div className="flex gap-2">
                      <dt className="font-medium">Jurisdiction:</dt>
                      <dd>{c.jurisdiction}</dd>
                    </div>
                  )}
                  {c.court && (
                    <div className="flex gap-2">
                      <dt className="font-medium">Court:</dt>
                      <dd>{c.court}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="font-medium">Updated:</dt>
                    <dd>{formatDate(c.updated_at)}</dd>
                  </div>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
