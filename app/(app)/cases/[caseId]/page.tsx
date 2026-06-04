import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  getCase,
  listDocuments,
  listNotes,
  listDeadlines,
} from "@/lib/data";
import { deleteCase } from "@/lib/actions";
import { Button, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function CaseOverviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const [c, docs, notes, deadlines] = await Promise.all([
    getCase(user.id, caseId),
    listDocuments(user.id, caseId),
    listNotes(user.id, caseId),
    listDeadlines(user.id, caseId),
  ]);
  if (!c) return null;

  const stats = [
    { label: "Documents", value: docs.length, href: `/cases/${caseId}/documents` },
    { label: "Notes", value: notes.length, href: `/cases/${caseId}/notes` },
    {
      label: "Open deadlines",
      value: deadlines.filter((d) => !d.done).length,
      href: `/cases/${caseId}/deadlines`,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Summary</h2>
          <p className="mt-2 text-sm text-muted">
            {c.description || "No description added yet."}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="text-2xl font-semibold text-foreground">
                  {s.value}
                </div>
                <div className="text-sm text-muted">{s.label}</div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Ask your case files
            </h2>
            <Link
              href={`/cases/${caseId}/chat`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Open chat →
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            Upload documents, then chat with an AI that answers from this case&apos;s
            files with citations.
          </p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Details</h2>
          <dl className="space-y-2 text-sm">
            <Detail label="Client" value={c.client_name} />
            <Detail label="Case number" value={c.case_number} />
            <Detail label="Court" value={c.court} />
            <Detail label="Jurisdiction" value={c.jurisdiction} />
            <Detail label="Opened" value={c.opened_at ? formatDate(c.opened_at) : null} />
            <Detail label="Created" value={formatDate(c.created_at)} />
          </dl>
        </Card>

        <Card className="border-red-200 p-6">
          <h2 className="text-sm font-semibold text-foreground">Danger zone</h2>
          <p className="mt-1 text-sm text-muted">
            Deleting a case removes its documents, notes, and chats.
          </p>
          <form
            action={async () => {
              "use server";
              await deleteCase(caseId);
            }}
            className="mt-3"
          >
            <Button type="submit" variant="danger" size="sm">
              Delete case
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
