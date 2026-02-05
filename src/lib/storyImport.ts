// Story Import Helpers
// Supports Google Docs/plain text paste and chapter auto-detection.

export interface ImportedChapter {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
}

function normalizePastedText(input: string): string {
  return (input || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Google Docs sometimes uses non-breaking spaces
    .replace(/\u00A0/g, " ")
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string): number {
  const t = (text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

/**
 * Split story into chapters.
 * Priority:
 *  1) "Chapter X" headings (case-insensitive)
 *  2) fallback: split every N paragraphs
 */
export function importStoryToChapters(rawText: string, opts?: { fallbackParagraphsPerChapter?: number }): ImportedChapter[] {
  const text = normalizePastedText(rawText);
  if (!text) return [];

  // Detect explicit Chapter headings
  // Examples: "Chapter 1", "CHAPTER 2: The Surprise"
  const chapterHeading = /^\s*(chapter)\s+(\d+|[ivxlcdm]+)\s*[:\-–]?\s*(.*)\s*$/gim;

  const matches: Array<{ index: number; heading: string; title: string }> = [];
  {
    let m: RegExpExecArray | null;
    const re = new RegExp(chapterHeading);
    while ((m = re.exec(text)) !== null) {
      const idx = m.index ?? 0;
      const extraTitle = (m[3] || "").trim();
      const headingText = (m[0] || "").trim();
      matches.push({ index: idx, heading: headingText, title: extraTitle });
    }
  }

  if (matches.length >= 1) {
    const chapters: ImportedChapter[] = [];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const chunk = text.slice(start, end).trim();

      // Remove the heading line from the content
      const lines = chunk.split("\n");
      const headingLine = lines.shift() || "";
      const content = lines.join("\n").trim();

      const titleSuffix = matches[i].title ? `: ${matches[i].title}` : "";
      const title = (headingLine.replace(/\s+/g, " ").trim() || `Chapter ${i + 1}`) + titleSuffix;

      chapters.push({
        chapterNumber: i + 1,
        title,
        content,
        wordCount: countWords(content),
      });
    }

    // Filter out empty chapters
    return chapters.filter((c) => c.wordCount > 0);
  }

  // Fallback: split every N paragraphs
  const n = Math.max(2, opts?.fallbackParagraphsPerChapter || 4);
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const chapters: ImportedChapter[] = [];
  let chapterIdx = 0;
  for (let i = 0; i < paragraphs.length; i += n) {
    chapterIdx += 1;
    const content = paragraphs.slice(i, i + n).join("\n\n").trim();
    chapters.push({
      chapterNumber: chapterIdx,
      title: `Chapter ${chapterIdx}`,
      content,
      wordCount: countWords(content),
    });
  }

  return chapters.filter((c) => c.wordCount > 0);
}
