import { requireUser } from "@/lib/session";
import { listCases } from "@/lib/data";
import { LinkButton } from "@/components/ui";
import { CasesView } from "@/components/cases-view";

export default async function CasesPage() {
  const user = await requireUser();
  const cases = await listCases(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Cases
          </h1>
          <p className="text-sm text-muted">
            All cases for your firm — search, filter, and open.
          </p>
        </div>
        <LinkButton href="/cases/new">+ New case</LinkButton>
      </div>
      <CasesView cases={cases} />
    </div>
  );
}
