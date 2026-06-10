import "server-only";
import { env, requireEnv } from "@/lib/env";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const CHAT_MODEL = env.geminiModel;

// Free-tier models are flaky (429 RESOURCE_EXHAUSTED / 503). Try the configured
// model first, then fall back across known-good free-tier models so a single
// model's quota/availability never breaks a request.
const FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];
function candidateModels(preferred?: string): string[] {
  return [...new Set([preferred ?? CHAT_MODEL, ...FALLBACKS])];
}
// Status codes that mean "try a different model".
const RETRYABLE = new Set([429, 500, 503, 404]);

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
  apiKey?: string;
}): AsyncGenerator<string> {
  const key = opts.apiKey || requireEnv(env.geminiKey, "GEMINI_API_KEY");

  const body: {
    contents: GeminiContent[];
    system_instruction?: { parts: { text: string }[] };
  } = { contents: opts.contents };
  if (opts.system) body.system_instruction = { parts: [{ text: opts.system }] };

  // Open a stream on the first model that responds OK.
  let res: Response | null = null;
  let lastDetail = "";
  const models = candidateModels(opts.model);
  for (const model of models) {
    const url = `${BASE}/${model}:streamGenerateContent?alt=sse&key=${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok && r.body) {
      res = r;
      break;
    }
    lastDetail = `${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`;
    if (!RETRYABLE.has(r.status)) break; // non-retryable (e.g. 400/401)
  }
  if (!res || !res.body) {
    throw new Error(`Gemini stream failed (${lastDetail || "no response"})`);
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
  apiKey?: string;
}): Promise<T | null> {
  const key = opts.apiKey || requireEnv(env.geminiKey, "GEMINI_API_KEY");

  const body: {
    contents: GeminiContent[];
    system_instruction?: { parts: { text: string }[] };
    generationConfig: { responseMimeType: string; temperature: number };
  } = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  };
  if (opts.system) body.system_instruction = { parts: [{ text: opts.system }] };

  let json: {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null = null;
  let lastDetail = "";
  for (const model of candidateModels(opts.model)) {
    const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      json = await res.json();
      break;
    }
    lastDetail = `${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`;
    if (!RETRYABLE.has(res.status)) break;
  }
  if (!json) throw new Error(`Gemini request failed (${lastDetail || "no response"})`);

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
