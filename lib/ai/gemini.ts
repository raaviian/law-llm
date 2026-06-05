import "server-only";
import { env, requireEnv } from "@/lib/env";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const CHAT_MODEL = env.geminiModel;

export interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiStreamChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/**
 * Stream text deltas from Gemini via the REST API (alt=sse). No SDK dependency,
 * so it's stable across Google SDK churn. Yields incremental text strings.
 */
export async function* streamGemini(opts: {
  system?: string;
  contents: GeminiContent[];
  model?: string;
}): AsyncGenerator<string> {
  const key = requireEnv(env.geminiKey, "GEMINI_API_KEY");
  const model = opts.model ?? CHAT_MODEL;
  const url = `${BASE}/${model}:streamGenerateContent?alt=sse&key=${key}`;

  const body: {
    contents: GeminiContent[];
    system_instruction?: { parts: { text: string }[] };
  } = { contents: opts.contents };
  if (opts.system) body.system_instruction = { parts: [{ text: opts.system }] };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as GeminiStreamChunk;
        const parts = json.candidates?.[0]?.content?.parts;
        if (parts) for (const p of parts) if (p.text) yield p.text;
      } catch {
        // ignore partial/non-JSON keep-alive lines
      }
    }
  }
}

/**
 * One-shot JSON generation (uses responseMimeType: application/json so Gemini
 * returns parseable JSON). Returns null if the response can't be parsed.
 */
export async function generateGeminiJSON<T>(opts: {
  system?: string;
  prompt: string;
  model?: string;
}): Promise<T | null> {
  const key = requireEnv(env.geminiKey, "GEMINI_API_KEY");
  const model = opts.model ?? CHAT_MODEL;
  const url = `${BASE}/${model}:generateContent?key=${key}`;

  const body: {
    contents: GeminiContent[];
    system_instruction?: { parts: { text: string }[] };
    generationConfig: { responseMimeType: string; temperature: number };
  } = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  };
  if (opts.system) body.system_instruction = { parts: [{ text: opts.system }] };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Non-streaming convenience for summaries/drafting. */
export async function generateGemini(opts: {
  system?: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  let out = "";
  for await (const t of streamGemini({
    system: opts.system,
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    model: opts.model,
  })) {
    out += t;
  }
  return out;
}
