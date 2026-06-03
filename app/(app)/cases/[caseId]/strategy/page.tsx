import { requireUser } from "@/lib/session";
import { getStrategy } from "@/lib/data";
import { addStrategyItem, removeStrategyItem } from "@/lib/actions";
import { Card } from "@/components/ui";
import type { StrategyItem } from "@/lib/types";

type Column = "objectives" | "arguments" | "risks" | "timeline";

const columns: { key: Column; title: string; hint: string }[] = [
  { key: "objectives", title: "Objectives", hint: "What does the client want to achieve?" },
  { key: "arguments", title: "Arguments", hint: "Key arguments to advance." },
  { key: "risks", title: "Risks", hint: "Weaknesses and counter-arguments." },
  { key: "timeline", title: "Timeline", hint: "Sequence of steps and dates." },
];

export default async function StrategyPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const strategy = await getStrategy(user.id, caseId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Court strategy</h2>
        <p className="text-sm text-muted">
          Plan your approach to the hearing across four pillars.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const items = (strategy?.[col.key] as StrategyItem[]) ?? [];
          return (
            <Card key={col.key} className="flex flex-col p-4">
              <h3 className="text-sm font-semibold text-foreground">
                {col.title}
              </h3>
              <p className="mb-3 text-xs text-muted">{col.hint}</p>

              <ul className="mb-3 flex-1 space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="whitespace-pre-wrap">{item.text}</span>
                    <form
                      action={async () => {
                        "use server";
                        await removeStrategyItem(caseId, col.key, item.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </form>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="text-xs text-muted">Nothing here yet.</li>
                )}
              </ul>

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await addStrategyItem(
                    caseId,
                    col.key,
                    String(formData.get("text") ?? ""),
                  );
                }}
                className="space-y-2"
              >
                <textarea
                  name="text"
                  rows={2}
                  required
                  placeholder={`Add to ${col.title.toLowerCase()}…`}
                  className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  Add
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
