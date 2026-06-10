import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import {
  streamGemini,
  generateGeminiJSON,
  type GeminiContent,
} from "@/lib/ai/gemini";
import {
  streamAnthropic,
  anthropicJSON,
  type ProviderMessage,
} from "@/lib/ai/providers/anthropic";
import { streamOpenAI, openaiJSON } from "@/lib/ai/providers/openai";

export type AiProvider = "gemini" | "anthropic" | "openai";
export type ChatMessage = ProviderMessage;

export interface OrgAiConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

export interface SafeAiSettings {
  provider: AiProvider;
  model: string;
  configured: boolean;
}

// Best-effort default model when a BYO config omits one.
const DEFAULT_MODEL: Record<AiProvider, string> = {
  gemini: "",
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o-mini",
};

/** Resolve an org's BYO AI config (decrypting the key), or null to use the
 *  shared Gemini free tier. Never expose the result to the client. */
export async function getOrgAiConfig(orgId: string): Promise<OrgAiConfig | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("org_ai_settings")
    .select("provider, model, api_key")
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data?.api_key) return null;
  const apiKey = decryptSecret(data.api_key as string);
  if (!apiKey) return null;
  const provider = (data.provider as AiProvider) ?? "gemini";
  return {
    provider,
    model: (data.model as string) || DEFAULT_MODEL[provider] || "",
    apiKey,
  };
}

/** Non-sensitive settings for display in the UI (no key). */
export async function getOrgAiSettingsSafe(
  orgId: string,
): Promise<SafeAiSettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("org_ai_settings")
    .select("provider, model, api_key")
    .eq("org_id", orgId)
    .maybeSingle();
  return {
    provider: (data?.provider as AiProvider) ?? "gemini",
    model: (data?.model as string) ?? "",
    configured: Boolean(data?.api_key),
  };
}

/** Stream chat text using the org's provider, or the shared Gemini default. */
export async function* streamChat(opts: {
  config: OrgAiConfig | null;
  system?: string;
  messages: ChatMessage[];
}): AsyncGenerator<string> {
  const c = opts.config;
  if (c?.provider === "anthropic") {
    yield* streamAnthropic({
      apiKey: c.apiKey,
      model: c.model,
      system: opts.system,
      messages: opts.messages,
    });
    return;
  }
  if (c?.provider === "openai") {
    yield* streamOpenAI({
      apiKey: c.apiKey,
      model: c.model,
      system: opts.system,
      messages: opts.messages,
    });
    return;
  }
  // Gemini: BYO key when configured, otherwise the shared free tier.
  const contents: GeminiContent[] = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  yield* streamGemini({
    apiKey: c?.apiKey,
    model: c?.model || undefined,
    system: opts.system,
    contents,
  });
}

/** One-shot JSON generation using the org's provider, or shared Gemini. */
export async function generateJSON<T>(opts: {
  config: OrgAiConfig | null;
  system?: string;
  prompt: string;
}): Promise<T | null> {
  const c = opts.config;
  if (c?.provider === "anthropic") {
    return anthropicJSON<T>({
      apiKey: c.apiKey,
      model: c.model,
      system: opts.system,
      prompt: opts.prompt,
    });
  }
  if (c?.provider === "openai") {
    return openaiJSON<T>({
      apiKey: c.apiKey,
      model: c.model,
      system: opts.system,
      prompt: opts.prompt,
    });
  }
  return generateGeminiJSON<T>({
    apiKey: c?.apiKey,
    model: c?.model || undefined,
    system: opts.system,
    prompt: opts.prompt,
  });
}
