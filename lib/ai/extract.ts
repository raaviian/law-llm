import "server-only";

export interface ExtractedPage {
  page: number;
  text: string;
}

/**
 * Extract text from an uploaded file as an array of pages. PDFs preserve real
 * page numbers (used for citations); other formats are returned as a single
 * "page". Supported: PDF, DOCX, and plain text / markdown.
 */
export async function extractPages(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractedPage[]> {
  const lower = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    // unpdf is serverless-safe (no DOM globals like DOMMatrix required) and
    // returns per-page text so citations keep accurate page numbers.
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];
    return pages
      .map((t, i) => ({ page: i + 1, text: (t ?? "").trim() }))
      .filter((p) => p.text.length > 0);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return [{ page: 1, text: value.trim() }];
  }

  // Fallback: treat as UTF-8 text.
  return [{ page: 1, text: buffer.toString("utf-8").trim() }];
}
