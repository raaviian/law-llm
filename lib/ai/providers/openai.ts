import "server-only";
import { parseJsonLoose, type ProviderMessage } from "@/lib/ai/providers/anthropic";

const URL = "https://api.openai.com/v1/chat/completions";

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

/** Stream assistant text from OpenAI's Chat Completions API (SSE). */
export async function* streamOpenAI(opts: {
  apiKey: string;
  model: string;
  system?: string;
  messages: ProviderMessage[];
}): AsyncGenerator<string> {
  const messages = [
    ...(opts.system ? [{ role: "system", content: opts.system }] : []),
    ...opts.messages,
  ];
  const res = await fetch(URL, {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify({ model: opts.model, messages, stream: true }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 200)}`);
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
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore
      }
    }
  }
}

/** One-shot JSON via OpenAI (uses response_format json_object). */
export async function openaiJSON<T>(opts: {
  apiKey: string;
  model: string;
  system?: string;
  prompt: string;
}): Promise<T | null> {
  const messages = [
    ...(opts.system ? [{ role: "system", content: opts.system }] : []),
    { role: "user", content: opts.prompt },
  ];
  const res = await fetch(URL, {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      messages,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseJsonLoose<T>(json.choices?.[0]?.message?.content ?? "");
}
