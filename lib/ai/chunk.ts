import type { ExtractedPage } from "@/lib/ai/extract";

export interface Chunk {
  content: string;
  page: number;
  index: number;
  tokens: number;
}

// Rough token estimate (~4 chars/token) — good enough for sizing chunks.
const estimateTokens = (s: string) => Math.ceil(s.length / 4);

const TARGET_TOKENS = 900;
const OVERLAP_TOKENS = 150;
const TARGET_CHARS = TARGET_TOKENS * 4;
const OVERLAP_CHARS = OVERLAP_TOKENS * 4;

/**
 * Split extracted pages into overlapping chunks suitable for embedding. Chunks
 * never span pages, so each chunk keeps an accurate page number for citations.
 */
export function chunkPages(pages: ExtractedPage[]): Chunk[] {
  const chunks: Chunk[] = [];
  let index = 0;

  for (const { page, text } of pages) {
    const normalized = text.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ");
    if (normalized.length <= TARGET_CHARS) {
      if (normalized.trim()) {
        chunks.push({
          content: normalized.trim(),
          page,
          index: index++,
          tokens: estimateTokens(normalized),
        });
      }
      continue;
    }

    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(start + TARGET_CHARS, normalized.length);
      const slice = normalized.slice(start, end).trim();
      if (slice) {
        chunks.push({
          content: slice,
          page,
          index: index++,
          tokens: estimateTokens(slice),
        });
      }
      if (end >= normalized.length) break;
      start = end - OVERLAP_CHARS;
    }
  }

  return chunks;
}
