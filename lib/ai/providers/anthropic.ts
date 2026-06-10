import "server-only";

export interface ProviderMessage {
  role: "user" | "assistant";
  content: string;
}

const URL = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

function headers(apiKey: string) {
  return {
    "x-api-key": apiKey,
    "anthropic-version": VERSION,
    "content-type": "application/json",
  };
}

/** Stream assistant text from Anthropic's Messages API (SSE). */
export async function* streamAnthropic(opts: {
  apiKey: string;
  model: string;
  system?: string;
  messages: ProviderMessage[];
}): AsyncGenerator<string> {
  const res = await fetch(URL, {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 2048,
      system: opts.system,
      messages: opts.messages,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${detail.slice(0, 200)}`);
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
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (json.type === "content_block_delta" && json.delta?.text) {
          yield json.delta.text;
        }
      } catch {
        // ignore non-JSON keep-alives
      }
    }
  }
}

/** One-shot JSON generation via Anthropic (parses the text content). */
export async function anthropicJSON<T>(opts: {
  apiKey: string;
  model: string;
  system?: string;
  prompt: string;
}): Promise<T | null> {
  const res = await fetch(URL, {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 2048,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { content?: { text?: string }[] };
  const text = json.content?.map((c) => c.text ?? "").join("") ?? "";
  return parseJsonLoose<T>(text);
}

/** Tolerant JSON parse — strips ```json fences models sometimes add. */
export function parseJsonLoose<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
