import Link from "next/link";
import { createCase } from "@/lib/actions";
import { requireUserAndOrg } from "@/lib/session";
import { canCreateCase } from "@/lib/limits";
import { Card, Input, Label, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function NewCasePage() {
  const { orgId } = await requireUserAndOrg();
  const allowed = await canCreateCase(orgId);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
        ← Back to cases
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">New case</h1>

      {!allowed ? (
        <Card className="mt-6 p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Case limit reached
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Your current plan is limited to 1 case. Upgrade to create unlimited
            cases for your firm.
          </p>
          <div className="mt-5">
            <LinkButton href="/settings/billing">View plans</LinkButton>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 p-6">
        <form action={createCase} className="space-y-4">
          <div>
            <Label htmlFor="title">Case title *</Label>
            <Input id="title" name="title" required placeholder="Acme Corp v. Smith" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="client_name">Client</Label>
              <Input id="client_name" name="client_name" placeholder="Acme Corp" />
            </div>
            <div>
              <Label htmlFor="case_number">Case number</Label>
              <Input id="case_number" name="case_number" placeholder="2026-CV-1234" />
            </div>
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                name="jurisdiction"
                placeholder="England & Wales"
              />
            </div>
            <div>
              <Label htmlFor="court">Court</Label>
              <Input id="court" name="court" placeholder="High Court" />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue="open"
            >
              <option value="open">Open</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Short summary of the matter…"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </Link>
            <SubmitButton pendingText="Creating case…">Create case</SubmitButton>
          </div>
        </form>
        </Card>
      )}
    </div>
  );
}
