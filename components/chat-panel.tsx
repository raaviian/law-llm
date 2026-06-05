"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { ChatMessage, Citation } from "@/lib/types";

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  streaming?: boolean;
}

export function ChatPanel({
  caseId,
  threadId,
  initialMessages,
  hasDocuments,
}: {
  caseId: string;
  threadId?: string;
  initialMessages: ChatMessage[];
  hasDocuments: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<UIMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      citations: m.citations ?? [],
    })),
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);

    const userMsg: UIMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      citations: [],
    };
    const assistantId = `local-a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", citations: [], streaming: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, threadId, message: text }),
      });
      if (!res.ok || !res.body) {
        throw new Error(await res.text().catch(() => "Request failed"));
      }
      const newThreadId = res.headers.get("x-thread-id") ?? threadId;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }

      // Sync persisted state (citations + canonical ids). Navigate if a new
      // thread was created on the server.
      if (newThreadId && newThreadId !== threadId) {
        router.replace(`/cases/${caseId}/chat?thread=${newThreadId}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${msg}`, streaming: false }
            : m,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-border bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted">
            <p className="font-medium text-foreground">
              Chat with this case&apos;s documents
            </p>
            <p className="mt-1 max-w-sm">
              {hasDocuments
                ? "Ask anything about the uploaded files — summaries, key dates, arguments, risks. Answers cite their sources."
                : "Upload documents first, then ask questions about them here."}
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-foreground"
              }
            >
              <p className="whitespace-pre-wrap">
                {m.content || (m.streaming ? "…" : "")}
              </p>
              {m.role === "assistant" && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                  {m.citations.map((c) => (
                    <a
                      key={c.label}
                      href={`/cases/${caseId}/documents/${c.documentId}${c.page ? `?page=${c.page}` : ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-white px-1.5 py-0.5 text-xs text-muted ring-1 ring-slate-200 transition-colors hover:text-primary hover:ring-primary/40"
                      title={`Open ${c.documentName}${c.page ? ` at page ${c.page}` : ""}`}
                    >
                      [{c.label}] {c.documentName}
                      {c.page ? ` p.${c.page}` : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask about this case…"
            className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={send} disabled={busy || !input.trim()}>
            {busy ? "…" : "Send"}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-xs text-muted">
          AI can make mistakes. Verify against the source documents — this is not
          legal advice.
        </p>
      </div>
    </div>
  );
}
