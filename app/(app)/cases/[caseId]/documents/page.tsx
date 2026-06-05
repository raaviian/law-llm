import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/data";
import { deleteDocument } from "@/lib/actions";
import { Badge, Card, EmptyState } from "@/components/ui";
import { DocumentUploader } from "@/components/document-uploader";
import { formatDate } from "@/lib/utils";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB"];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const docs = await listDocuments(user.id, caseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Documents</h2>
        <DocumentUploader caseId={caseId} />
      </div>

      {docs.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload case files (PDF, DOCX, TXT). They'll be analyzed so you can chat with them."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/cases/${caseId}/documents/${d.id}`}
                    className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {d.file_name}
                  </Link>
                  <p className="text-xs text-muted">
                    {formatBytes(d.size)}
                    {d.page_count ? ` · ${d.page_count} pages` : ""} ·{" "}
                    {formatDate(d.created_at)}
                  </p>
                  {d.summary && (
                    <p className="mt-0.5 line-clamp-2 max-w-xl text-xs text-muted">
                      {d.summary}
                    </p>
                  )}
                  {d.status === "failed" && d.error && (
                    <p className="mt-0.5 text-xs text-red-600">{d.error}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge status={d.status} />
                  <form
                    action={async () => {
                      "use server";
                      await deleteDocument(caseId, d.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-muted hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
