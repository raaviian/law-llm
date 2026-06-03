import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getCase } from "@/lib/data";
import { Badge } from "@/components/ui";
import { CaseTabs } from "@/components/case-tabs";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const c = await getCase(user.id, caseId);
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Back to cases
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{c.title}</h1>
          <Badge status={c.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {[c.client_name, c.court, c.jurisdiction, c.case_number]
            .filter(Boolean)
            .join(" · ") || "No details yet"}
        </p>
      </div>
      <CaseTabs caseId={caseId} />
      <div>{children}</div>
    </div>
  );
}
