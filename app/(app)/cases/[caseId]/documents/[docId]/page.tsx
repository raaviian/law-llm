import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getDocument } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/audit";
import { Badge, Card, LinkButton } from "@/components/ui";

export default async function DocumentViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string; docId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { caseId, docId } = await params;
  const { page } = await searchParams;
  const user = await requireUser();

  // RLS-scoped read enforces that the user owns this document's case.
  const doc = await getDocument(user.id, docId);
  if (!doc || doc.case_id !== caseId) notFound();

  // Ownership verified above; sign a short-lived URL with the admin client.
  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from("case-files")
    .createSignedUrl(doc.storage_path, 60 * 30);
  const signedUrl = signed?.signedUrl;

  await recordAudit({
    orgId: doc.org_id,
    actorId: user.id,
    actorEmail: user.email,
    action: "document.view",
    targetType: "document",
    targetId: doc.id,
    caseId,
    summary: `Viewed “${doc.file_name}”`,
  });

  const isPdf =
    doc.mime_type === "application/pdf" ||
    doc.file_name.toLowerCase().endsWith(".pdf");
  const pageNum = page && /^\d+$/.test(page) ? Number(page) : null;
  const frameSrc =
    signedUrl && isPdf && pageNum ? `${signedUrl}#page=${pageNum}` : signedUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/cases/${caseId}/documents`}
            className="text-sm text-muted hover:text-foreground"
          >
            ← Back to documents
          </Link>
          <h2 className="mt-1 flex items-center gap-2 truncate text-lg font-semibold text-foreground">
            {doc.file_name}
            <Badge status={doc.status} />
          </h2>
          {pageNum && (
            <p className="text-sm text-muted">Jumped to page {pageNum}</p>
          )}
        </div>
        {signedUrl && (
          <LinkButton href={signedUrl} variant="secondary" size="sm">
            Download
          </LinkButton>
        )}
      </div>

      {!signedUrl ? (
        <Card className="p-8 text-center text-sm text-muted">
          Could not load this file. It may still be processing or was removed.
        </Card>
      ) : isPdf ? (
        <iframe
          src={frameSrc}
          title={doc.file_name}
          className="h-[80vh] w-full rounded-xl border border-border bg-card"
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted">
            In-browser preview isn&apos;t available for this file type.
          </p>
          <div className="mt-4">
            <LinkButton href={signedUrl}>Download to view</LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
