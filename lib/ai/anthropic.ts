import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, requireEnv } from "@/lib/env";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: requireEnv(env.anthropicKey, "ANTHROPIC_API_KEY"),
    });
  }
  return client;
}

export const CHAT_MODEL = env.anthropicModel;
