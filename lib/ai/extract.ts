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
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.pages
        .map((p) => ({ page: p.num, text: p.text.trim() }))
        .filter((p) => p.text.length > 0);
    } finally {
      await parser.destroy();
    }
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
