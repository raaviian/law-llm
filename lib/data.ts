import "server-only";
import { createUserClient } from "@/lib/supabase/server";
import type {
  AuditLog,
  Case,
  CaseDocument,
  ChatMessage,
  ChatThread,
  Deadline,
  Draft,
  Note,
  Strategy,
} from "@/lib/types";

/**
 * Read helpers. All run under the caller's RLS identity, so they can only ever
 * return rows from organizations the user belongs to.
 */

export async function listCases(userId: string): Promise<Case[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Case[];
}

export async function getCase(
  userId: string,
  caseId: string,
): Promise<Case | null> {
  const supabase = await createUserClient(userId);
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle();
  return (data as Case) ?? null;
}

export async function listDocuments(
  userId: string,
  caseId: string,
): Promise<CaseDocument[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CaseDocument[];
}

export async function getDocument(
  userId: string,
  documentId: string,
): Promise<CaseDocument | null> {
  const supabase = await createUserClient(userId);
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  return (data as CaseDocument) ?? null;
}

export async function listNotes(
  userId: string,
  caseId: string,
): Promise<Note[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("case_id", caseId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Note[];
}

export async function listDrafts(
  userId: string,
  caseId: string,
): Promise<Draft[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("case_id", caseId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Draft[];
}

export async function getDraft(
  userId: string,
  draftId: string,
): Promise<Draft | null> {
  const supabase = await createUserClient(userId);
  const { data } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();
  return (data as Draft) ?? null;
}

export async function listDeadlines(
  userId: string,
  caseId: string,
): Promise<Deadline[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("deadlines")
    .select("*")
    .eq("case_id", caseId)
    .order("due_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Deadline[];
}

export async function getStrategy(
  userId: string,
  caseId: string,
): Promise<Strategy | null> {
  const supabase = await createUserClient(userId);
  const { data } = await supabase
    .from("strategies")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();
  return (data as Strategy) ?? null;
}

export async function listThreads(
  userId: string,
  caseId: string,
): Promise<ChatThread[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatThread[];
}

export async function listMessages(
  userId: string,
  threadId: string,
): Promise<ChatMessage[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatMessage[];
}

export async function listAuditLogs(
  userId: string,
  limit = 100,
): Promise<AuditLog[]> {
  const supabase = await createUserClient(userId);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_email, action, target_type, case_id, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}

export interface DashboardData {
  cases: Case[];
  deadlines: (Deadline & { case_title?: string })[];
  activity: AuditLog[];
  docCount: number;
  openDeadlineCount: number;
}

/** Everything the dashboard needs, in one round of parallel RLS-scoped reads. */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createUserClient(userId);
  const [casesRes, deadlinesRes, docsRes, deadlineCountRes, activityRes] =
    await Promise.all([
      supabase.from("cases").select("*").order("updated_at", { ascending: false }),
      supabase
        .from("deadlines")
        .select("*, cases(title)")
        .eq("done", false)
        .order("due_at", { ascending: true })
        .limit(6),
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase
        .from("deadlines")
        .select("id", { count: "exact", head: true })
        .eq("done", false),
      supabase
        .from("audit_logs")
        .select("id, actor_email, action, target_type, case_id, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  return {
    cases: (casesRes.data ?? []) as Case[],
    deadlines: (deadlinesRes.data ?? []).map((d: Record<string, unknown>) => ({
      ...(d as unknown as Deadline),
      case_title: (d.cases as { title?: string } | null)?.title,
    })),
    activity: (activityRes.data ?? []) as AuditLog[],
    docCount: docsRes.count ?? 0,
    openDeadlineCount: deadlineCountRes.count ?? 0,
  };
}

export async function getUpcomingDeadlines(
  userId: string,
  limit = 5,
): Promise<(Deadline & { case_title?: string })[]> {
  const supabase = await createUserClient(userId);
  const { data } = await supabase
    .from("deadlines")
    .select("*, cases(title)")
    .eq("done", false)
    .order("due_at", { ascending: true })
    .limit(limit);
  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...(d as unknown as Deadline),
    case_title: (d.cases as { title?: string } | null)?.title,
  }));
}
