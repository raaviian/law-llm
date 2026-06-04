import { auth } from "@/lib/auth";
import { getCase } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropic, CHAT_MODEL } from "@/lib/ai/anthropic";
import { retrieveContext, buildContextBlock, SYSTEM_PROMPT } from "@/lib/ai/rag";
import type { Citation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  caseId: string;
  threadId?: string;
  message: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const body = (await req.json()) as ChatBody;
  const { caseId, message } = body;
  if (!caseId || !message?.trim()) {
    return new Response("Missing caseId or message", { status: 400 });
  }

  const caseRow = await getCase(userId, caseId);
  if (!caseRow) return new Response("Case not found", { status: 403 });

  const admin = createAdminClient();

  // Ensure a thread exists (create on first message).
  let threadId = body.threadId;
  if (!threadId) {
    const { data: thread, error } = await admin
      .from("chat_threads")
      .insert({
        case_id: caseId,
        org_id: caseRow.org_id,
        created_by: userId,
        title: message.slice(0, 60),
      })
      .select("id")
      .single();
    if (error || !thread) return new Response("Failed to create thread", { status: 500 });
    threadId = thread.id as string;
  }

  // Load prior turns for conversational context.
  const { data: history } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  // Persist the user message.
  await admin.from("chat_messages").insert({
    thread_id: threadId,
    org_id: caseRow.org_id,
    role: "user",
    content: message,
  });

  // Retrieve relevant document chunks for this case.
  const chunks = await retrieveContext(userId, caseId, message);
  const citations: Citation[] = chunks.map((c, i) => ({
    label: i + 1,
    documentId: c.documentId,
    documentName: c.documentName,
    page: c.page,
  }));
  const contextBlock = buildContextBlock(chunks);

  const priorMessages = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content as string,
  }));

  const anthropic = getAnthropic();
  const encoder = new TextEncoder();
  const finalThreadId = threadId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const llmStream = anthropic.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [
            ...priorMessages,
            {
              role: "user",
              content: `Context from this case's documents:\n\n${contextBlock}\n\n---\n\nQuestion: ${message}`,
            },
          ],
        });

        llmStream.on("text", (text) => {
          full += text;
          controller.enqueue(encoder.encode(text));
        });

        await llmStream.finalMessage();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "The assistant failed to respond.";
        if (!full) controller.enqueue(encoder.encode(`⚠️ ${msg}`));
        full = full || `⚠️ ${msg}`;
      } finally {
        await admin.from("chat_messages").insert({
          thread_id: finalThreadId,
          org_id: caseRow.org_id,
          role: "assistant",
          content: full,
          citations,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-thread-id": finalThreadId,
    },
  });
}
