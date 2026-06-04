import "server-only";
import { createUserClient } from "@/lib/supabase/server";
import type {
  Case,
  CaseDocument,
  ChatMessage,
  ChatThread,
  Deadline,
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
