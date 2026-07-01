import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  getCase,
  listDocuments,
  listNotes,
  listDeadlines,
} from "@/lib/data";
import {
  getOrgRole,
  listOrgMembers,
  listCaseAccess,
  canManageCase,
} from "@/lib/access";
import { Badge, Card } from "@/components/ui";
import { Callout } from "@/components/callout";
import { CaseAccess } from "@/components/case-access";
import { CaseStatusSelect } from "@/components/case-status-select";
import { DeleteCaseDialog } from "@/components/delete-case-dialog";
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

  // Access management uses the case's own org (a member may belong to several).
  const role = await getOrgRole(user.id, c.org_id);
  const canManage = canManageCase(role, c.created_by, user.id);
  const [members, grants] = canManage
    ? await Promise.all([listOrgMembers(c.org_id), listCaseAccess(caseId)])
    : [[], []];

  const stats = [
    { label: "Documents", value: docs.length, href: `/cases/${caseId}/documents` },
    { label: "Notes", value: notes.length, href: `/cases/${caseId}/notes` },
    {
      label: "Open deadlines",
      value: deadlines.filter((d) => !d.done).length,
      href: `/cases/${caseId}/deadlines`,
    },
  ];

  const readyDocs = docs.filter((d) => d.status === "ready").length;
  const processingDocs = docs.some((d) => d.status === "processing");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {docs.length === 0 ? (
          <Callout
            variant="next"
            title="Next step: upload your documents"
            action={{ href: `/cases/${caseId}/documents`, label: "Upload documents" }}
          >
            Add this case&apos;s files (PDF, Word, or text). We read them so you
            can ask questions, draft documents, and plan strategy from them.
          </Callout>
        ) : readyDocs === 0 && processingDocs ? (
          <Callout variant="info" title="We&apos;re reading your files…">
            Your documents are being read. Chat and drafting will use them as
            soon as they&apos;re ready.
          </Callout>
        ) : null}

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
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd>
                {canManage ? (
                  <CaseStatusSelect caseId={caseId} status={c.status} />
                ) : (
                  <Badge status={c.status} />
                )}
              </dd>
            </div>
            <Detail label="Client" value={c.client_name} />
            <Detail label="Case number" value={c.case_number} />
            <Detail label="Court" value={c.court} />
            <Detail label="Jurisdiction" value={c.jurisdiction} />
            <Detail label="Opened" value={c.opened_at ? formatDate(c.opened_at) : null} />
            <Detail label="Created" value={formatDate(c.created_at)} />
            <Detail
              label="Access"
              value={c.visibility === "private" ? "Restricted" : "Whole firm"}
            />
          </dl>
        </Card>

        {canManage && (
          <CaseAccess
            caseId={caseId}
            visibility={c.visibility}
            members={members}
            grants={grants}
            creatorId={c.created_by}
          />
        )}

        <DeleteCaseDialog caseId={caseId} caseTitle={c.title} />
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
