import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { DocumentUploader } from "@/components/document-uploader";
import { DocumentsView } from "@/components/documents-view";

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
          description="Upload your case files (PDF, Word, or text). We read them so you can ask questions about them and draft documents."
          action={<DocumentUploader caseId={caseId} />}
        />
      ) : (
        <DocumentsView caseId={caseId} docs={docs} />
      )}
    </div>
  );
}
