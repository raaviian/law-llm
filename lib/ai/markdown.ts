import "server-only";
import type { ExtractedPage } from "@/lib/ai/extract";

/**
 * Clean raw extracted PDF/DOCX page text into compact markdown before chunking
 * and embedding. PDF text extraction carries a lot of noise that wastes embed
 * tokens and hurts retrieval quality: running headers/footers repeated on every
 * page, bare page numbers, words hyphenated across line breaks, and ragged
 * whitespace. Stripping these typically cuts 20–40% of tokens.
 *
 * The page structure is preserved (one entry per source page) so citation page
 * numbers stay accurate.
 */

// A line that is just a page marker, e.g. "12", "Page 3", "3 of 20", "3/20".
const PAGE_NUM_RE = /^(page\s+)?\d+(\s*(\/|of)\s*\d+)?$/i;
const BULLET_RE = /^[•·▪◦‣*‐-]\s+/;

export function pagesToMarkdown(pages: ExtractedPage[]): ExtractedPage[] {
  // 1. Find lines that recur across many pages — running headers/footers.
  const perPageLines = pages.map((p) =>
    p.text.split(/\r?\n/).map((l) => l.replace(/[ \t]+/g, " ").trim()),
  );
  const counts = new Map<string, number>();
  for (const lines of perPageLines) {
    const seen = new Set<string>();
    for (const l of lines) {
      if (!l || l.length > 80) continue; // only short lines are header/footer-ish
      if (seen.has(l)) continue;
      seen.add(l);
      counts.set(l, (counts.get(l) ?? 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.5));
  const boilerplate = new Set(
    pages.length >= 4
      ? [...counts].filter(([, n]) => n >= threshold).map(([l]) => l)
      : [],
  );

  // 2. Clean each page.
  return pages
    .map((p) => {
      const dehyphenated = p.text
        .replace(/­/g, "") // soft hyphens
        .replace(/([\p{L}])-\n([\p{L}])/gu, "$1$2"); // word split across lines

      const out: string[] = [];
      for (const raw of dehyphenated.split(/\r?\n/)) {
        const line = raw.replace(/[ \t]+/g, " ").trim();
        if (!line) {
          out.push("");
          continue;
        }
        if (PAGE_NUM_RE.test(line)) continue;
        if (boilerplate.has(line)) continue;
        out.push(line.replace(BULLET_RE, "- "));
      }

      const text = out
        .join("\n")
        .replace(/\n{3,}/g, "\n\n") // collapse blank runs
        .trim();
      return { page: p.page, text };
    })
    .filter((p) => p.text.length > 0);
}
