import "server-only";
import { env, requireEnv } from "@/lib/env";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

type InputType = "document" | "query";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
}

// Free-tier defaults (3 requests/min, 10K tokens/min). Override via env once a
// payment method is added to Voyage to unlock higher standard limits.
const RPM = Math.max(1, Number(process.env.VOYAGE_RPM ?? 3));
const TPM = Math.max(1000, Number(process.env.VOYAGE_TPM ?? 10000));
// Keep each request comfortably inside one minute's token budget.
const MAX_TOKENS_PER_REQUEST = Math.min(8000, TPM);
const MAX_TEXTS_PER_REQUEST = 128;
const MAX_RETRIES = 4;
// Stop before the inline upload function's hard timeout so ingestion fails
// cleanly (status "failed" with a helpful message) instead of being killed.
const SOFT_DEADLINE_MS = 50_000;

const RATE_LIMIT_HINT =
  "Voyage embedding rate limit reached (free tier: 3 requests/min, 10K tokens/min). " +
  "Add a payment method at https://dashboard.voyageai.com to raise the limits — " +
  "your free token allowance still applies — or upload a smaller file.";

// Rough token estimate (~4 chars/token), matching lib/ai/chunk.ts sizing.
const estTokens = (s: string) => Math.ceil(s.length / 4);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class RateLimitError extends Error {
  retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

// Rolling 60s window so we never burst past the per-minute request/token caps.
const reqTimes: number[] = [];
const tokTimes: { t: number; tok: number }[] = [];

async function reserve(tokens: number, deadline: number): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (reqTimes.length && now - reqTimes[0] >= 60_000) reqTimes.shift();
    while (tokTimes.length && now - tokTimes[0].t >= 60_000) tokTimes.shift();
    const tokSum = tokTimes.reduce((a, x) => a + x.tok, 0);
    if (reqTimes.length < RPM && tokSum + tokens <= TPM) break;

    const waits: number[] = [];
    if (reqTimes.length >= RPM) waits.push(60_000 - (now - reqTimes[0]));
    if (tokSum + tokens > TPM && tokTimes.length) {
      waits.push(60_000 - (now - tokTimes[0].t));
    }
    const wait = Math.max(250, Math.min(...waits));
    if (now + wait > deadline) {
      throw new RateLimitError(RATE_LIMIT_HINT);
    }
    await sleep(wait);
  }
  const now = Date.now();
  reqTimes.push(now);
  tokTimes.push({ t: now, tok: tokens });
}

async function embedOnce(
  texts: string[],
  inputType: InputType,
  key: string,
): Promise<number[][]> {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: env.voyageModel,
      input_type: inputType,
    }),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    throw new RateLimitError(
      RATE_LIMIT_HINT,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined,
    );
  }
  if (!res.ok) {
    throw new Error(`Voyage embeddings failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as VoyageResponse;
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function embedWithRetry(
  texts: string[],
  inputType: InputType,
  key: string,
  deadline: number,
): Promise<number[][]> {
  let attempt = 0;
  for (;;) {
    try {
      return await embedOnce(texts, inputType, key);
    } catch (err) {
      if (!(err instanceof RateLimitError) || attempt >= MAX_RETRIES) throw err;
      // Honour Retry-After when present, else exponential backoff (2s,4s,8s…).
      const backoff = err.retryAfterMs ?? 2000 * 2 ** attempt;
      if (Date.now() + backoff > deadline) {
        throw new RateLimitError(RATE_LIMIT_HINT);
      }
      await sleep(backoff);
      attempt += 1;
    }
  }
}

/**
 * Embed one or more texts with Voyage AI (voyage-law-2, 1024 dims). Splits the
 * input into token-bounded batches and paces them to respect the account's
 * rate limits, retrying with backoff on 429. Use input_type "document" when
 * indexing chunks and "query" when embedding a user question.
 */
export async function embedTexts(
  texts: string[],
  inputType: InputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = requireEnv(env.voyageKey, "VOYAGE_API_KEY");
  const deadline = Date.now() + SOFT_DEADLINE_MS;

  // Build batches bounded by a per-request token budget and text count.
  const batches: string[][] = [];
  let cur: string[] = [];
  let curTok = 0;
  for (const t of texts) {
    const tk = Math.min(estTokens(t), MAX_TOKENS_PER_REQUEST);
    if (cur.length && (curTok + tk > MAX_TOKENS_PER_REQUEST || cur.length >= MAX_TEXTS_PER_REQUEST)) {
      batches.push(cur);
      cur = [];
      curTok = 0;
    }
    cur.push(t);
    curTok += tk;
  }
  if (cur.length) batches.push(cur);

  const out: number[][] = [];
  for (const batch of batches) {
    const tok = batch.reduce((a, t) => a + estTokens(t), 0);
    await reserve(tok, deadline);
    const embeddings = await embedWithRetry(batch, inputType, key, deadline);
    out.push(...embeddings);
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text], "query");
  return embedding;
}
