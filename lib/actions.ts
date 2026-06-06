"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserAndOrg } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/audit";
import { getOrgRole, canManageCase } from "@/lib/access";
import { getCase } from "@/lib/data";
import { retrieveContext, buildContextBlock } from "@/lib/ai/rag";
import { generateCaseStrategy, type GeneratedStrategy } from "@/lib/ai/strategy";
import { syncOrgBillingFromStripe } from "@/lib/billing-sync";

// --- Cases -------------------------------------------------------------------
const caseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client_name: z.string().optional(),
  jurisdiction: z.string().optional(),
  court: z.string().optional(),
  case_number: z.string().optional(),
  status: z.enum(["open", "active", "closed"]).default("open"),
  description: z.string().optional(),
});

export async function createCase(formData: FormData) {
  const { user, orgId } = await requireUserAndOrg();
  const parsed = caseSchema.parse(Object.fromEntries(formData));
  const supabase = await createUserClient(user.id);

  const { data, error } = await supabase
    .from("cases")
    .insert({ ...parsed, org_id: orgId, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "case.create",
    targetType: "case",
    targetId: data.id,
    caseId: data.id,
    summary: `Created case “${parsed.title}”`,
  });

  revalidatePath("/dashboard");
  redirect(`/cases/${data.id}`);
}

export async function updateCase(caseId: string, formData: FormData) {
  const { user, orgId } = await requireUserAndOrg();
  const parsed = caseSchema.partial().parse(Object.fromEntries(formData));
  const supabase = await createUserClient(user.id);

  const { error } = await supabase
    .from("cases")
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq("id", caseId);
  if (error) throw new Error(error.message);

  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "case.update",
    targetType: "case",
    targetId: caseId,
    caseId,
    summary: "Updated case details",
  });

  revalidatePath(`/cases/${caseId}`);
}

export async function deleteCase(caseId: string) {
  const { user, orgId } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  const { error } = await supabase.from("cases").delete().eq("id", caseId);
  if (error) throw new Error(error.message);

  // case_id is set null here because the case row no longer exists.
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "case.delete",
    targetType: "case",
    targetId: caseId,
    summary: "Deleted a case",
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- Billing -----------------------------------------------------------------
export async function refreshBilling() {
  const { orgId } = await requireUserAndOrg();
  await syncOrgBillingFromStripe(orgId);
  revalidatePath("/settings/billing");
}

// --- Per-matter access -------------------------------------------------------
async function assertCaseManager(caseId: string) {
  const { user } = await requireUserAndOrg();
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("cases")
    .select("org_id, created_by")
    .eq("id", caseId)
    .maybeSingle();
  if (!c) throw new Error("Case not found");
  const role = await getOrgRole(user.id, c.org_id as string);
  if (!canManageCase(role, (c.created_by as string) ?? null, user.id)) {
    throw new Error("Not authorized to manage access for this case");
  }
  return { user, admin, orgId: c.org_id as string };
}

export async function setCaseVisibility(
  caseId: string,
  visibility: "org" | "private",
) {
  const { user, admin, orgId } = await assertCaseManager(caseId);
  await admin.from("cases").update({ visibility }).eq("id", caseId);
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "case.update",
    targetType: "case",
    targetId: caseId,
    caseId,
    summary: `Set access to ${visibility === "private" ? "restricted" : "whole firm"}`,
  });
  revalidatePath(`/cases/${caseId}`);
}

export async function grantCaseAccess(caseId: string, targetUserId: string) {
  const { user, admin, orgId } = await assertCaseManager(caseId);
  await admin
    .from("case_access")
    .upsert({ case_id: caseId, user_id: targetUserId }, { onConflict: "case_id,user_id" });
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "case.update",
    targetType: "case",
    targetId: caseId,
    caseId,
    summary: "Granted case access to a member",
  });
  revalidatePath(`/cases/${caseId}`);
}

export async function revokeCaseAccess(caseId: string, targetUserId: string) {
  const { user, admin, orgId } = await assertCaseManager(caseId);
  await admin
    .from("case_access")
    .delete()
    .eq("case_id", caseId)
    .eq("user_id", targetUserId);
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "case.update",
    targetType: "case",
    targetId: caseId,
    caseId,
    summary: "Revoked case access from a member",
  });
  revalidatePath(`/cases/${caseId}`);
}

// --- Notes -------------------------------------------------------------------
export async function createNote(caseId: string, formData: FormData) {
  const { user, orgId } = await requireUserAndOrg();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body && !title) return;
  const supabase = await createUserClient(user.id);
  const { error } = await supabase.from("notes").insert({
    case_id: caseId,
    org_id: orgId,
    author_id: user.id,
    title: title || null,
    body,
  });
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "note.create",
    targetType: "note",
    caseId,
    summary: title ? `Added note “${title}”` : "Added a note",
  });
  revalidatePath(`/cases/${caseId}/notes`);
}

export async function saveDraftNote(
  caseId: string,
  title: string,
  body: string,
) {
  const { user, orgId } = await requireUserAndOrg();
  if (!body.trim()) return;
  const supabase = await createUserClient(user.id);
  await supabase.from("notes").insert({
    case_id: caseId,
    org_id: orgId,
    author_id: user.id,
    title: title || "Draft",
    body,
  });
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "note.create",
    targetType: "note",
    caseId,
    summary: `Saved draft “${title || "Draft"}”`,
  });
  revalidatePath(`/cases/${caseId}/notes`);
}

export async function deleteNote(caseId: string, noteId: string) {
  const { user } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  await supabase.from("notes").delete().eq("id", noteId);
  revalidatePath(`/cases/${caseId}/notes`);
}

// --- Deadlines ---------------------------------------------------------------
export async function createDeadline(caseId: string, formData: FormData) {
  const { user, orgId } = await requireUserAndOrg();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "reminder");
  const due = String(formData.get("due_at") ?? "");
  if (!title || !due) return;
  const supabase = await createUserClient(user.id);
  const { error } = await supabase.from("deadlines").insert({
    case_id: caseId,
    org_id: orgId,
    title,
    type,
    due_at: new Date(due).toISOString(),
  });
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "deadline.create",
    targetType: "deadline",
    caseId,
    summary: `Added ${type} “${title}”`,
  });
  revalidatePath(`/cases/${caseId}/deadlines`);
}

export async function toggleDeadline(
  caseId: string,
  deadlineId: string,
  done: boolean,
) {
  const { user } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  await supabase.from("deadlines").update({ done }).eq("id", deadlineId);
  revalidatePath(`/cases/${caseId}/deadlines`);
}

// --- Strategy ----------------------------------------------------------------
type StrategyColumn = "objectives" | "arguments" | "risks" | "timeline";

export async function addStrategyItem(
  caseId: string,
  column: StrategyColumn,
  text: string,
) {
  const { user, orgId } = await requireUserAndOrg();
  if (!text.trim()) return;
  const supabase = await createUserClient(user.id);

  const { data: existing } = await supabase
    .from("strategies")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  const item = { id: crypto.randomUUID(), text: text.trim() };

  if (!existing) {
    await supabase.from("strategies").insert({
      case_id: caseId,
      org_id: orgId,
      [column]: [item],
    });
  } else {
    const current = (existing[column] as { id: string; text: string }[]) ?? [];
    await supabase
      .from("strategies")
      .update({ [column]: [...current, item], updated_at: new Date().toISOString() })
      .eq("case_id", caseId);
  }
  revalidatePath(`/cases/${caseId}/strategy`);
}

export async function generateStrategy(caseId: string) {
  const { user, orgId } = await requireUserAndOrg();
  const c = await getCase(user.id, caseId);
  if (!c) throw new Error("Case not found");

  const chunks = await retrieveContext(
    user.id,
    caseId,
    "main legal issues, client objectives, strongest arguments, risks and counter-arguments, and a timeline for the hearing",
    12,
  );
  const context = buildContextBlock(chunks);

  const gen = await generateCaseStrategy({
    caseTitle: c.title,
    court: c.court,
    jurisdiction: c.jurisdiction,
    context,
  });
  if (!gen) throw new Error("The AI could not generate a strategy. Try again.");

  const toItems = (arr?: string[]) =>
    (arr ?? [])
      .filter((t) => t && t.trim())
      .map((text) => ({ id: crypto.randomUUID(), text: text.trim() }));

  const supabase = await createUserClient(user.id);
  const { data: existing } = await supabase
    .from("strategies")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();
  const prev = (existing ?? {}) as Record<
    string,
    { id: string; text: string }[] | undefined
  >;

  // Append generated points to any existing (manual) ones.
  const merge = (col: keyof GeneratedStrategy) => [
    ...(prev[col] ?? []),
    ...toItems(gen[col]),
  ];
  const payload = {
    objectives: merge("objectives"),
    arguments: merge("arguments"),
    risks: merge("risks"),
    timeline: merge("timeline"),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("strategies").update(payload).eq("case_id", caseId);
  } else {
    await supabase
      .from("strategies")
      .insert({ case_id: caseId, org_id: orgId, ...payload });
  }

  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "strategy.generate",
    targetType: "case",
    targetId: caseId,
    caseId,
    summary: "Generated court strategy with AI",
  });
  revalidatePath(`/cases/${caseId}/strategy`);
}

export async function removeStrategyItem(
  caseId: string,
  column: StrategyColumn,
  itemId: string,
) {
  const { user } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  const { data: existing } = await supabase
    .from("strategies")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();
  if (!existing) return;
  const current = (existing[column] as { id: string; text: string }[]) ?? [];
  await supabase
    .from("strategies")
    .update({ [column]: current.filter((i) => i.id !== itemId) })
    .eq("case_id", caseId);
  revalidatePath(`/cases/${caseId}/strategy`);
}

// --- Chat threads ------------------------------------------------------------
export async function createThread(caseId: string): Promise<string> {
  const { user, orgId } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ case_id: caseId, org_id: orgId, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "thread.create",
    targetType: "chat",
    targetId: data.id,
    caseId,
    summary: "Started a new chat",
  });
  revalidatePath(`/cases/${caseId}/chat`);
  return data.id as string;
}

export async function deleteDocument(caseId: string, documentId: string) {
  const { user, orgId } = await requireUserAndOrg();
  const supabase = await createUserClient(user.id);
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, file_name")
    .eq("id", documentId)
    .maybeSingle();
  if (doc?.storage_path) {
    await supabase.storage.from("case-files").remove([doc.storage_path]);
  }
  await supabase.from("documents").delete().eq("id", documentId);
  await recordAudit({
    orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: "document.delete",
    targetType: "document",
    targetId: documentId,
    caseId,
    summary: doc?.file_name ? `Deleted “${doc.file_name}”` : "Deleted a document",
  });
  revalidatePath(`/cases/${caseId}/documents`);
}
