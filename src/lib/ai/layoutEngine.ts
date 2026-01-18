// Layout Engine
// Composes book pages from text content and illustrations

import {
  LayoutArtifactContent,
  LayoutSettings,
  SpreadLayoutItem,
  PageLayoutItem,
  ContentBlock,
  PageType,
  PagePosition,
} from "@/lib/types/artifacts";
import { ChapterArtifactItem, IllustrationArtifactItem } from "@/lib/types/artifacts";

// ============================================
// Constants
// ============================================

// Words per page estimates based on trim size and age range
const WORDS_PER_PAGE: Record<string, number> = {
  "6x9": 100,      // Standard picture book
  "7x10": 150,     // Premium picture book
  "8.5x11": 200,   // Large format
};

// Default layout settings by trim size
const DEFAULT_SETTINGS: Record<string, LayoutSettings> = {
  "6x9": {
    trimSize: "6x9",
    marginTop: 54,      // 0.75 inch
    marginBottom: 54,
    marginInner: 72,    // 1 inch (gutter)
    marginOuter: 54,
    fontSize: 14,
    lineHeight: 1.5,
    wordsPerPage: 100,
  },
  "7x10": {
    trimSize: "7x10",
    marginTop: 54,
    marginBottom: 54,
    marginInner: 72,
    marginOuter: 54,
    fontSize: 14,
    lineHeight: 1.5,
    wordsPerPage: 150,
  },
  "8.5x11": {
    trimSize: "8.5x11",
    marginTop: 72,
    marginBottom: 72,
    marginInner: 90,
    marginOuter: 72,
    fontSize: 16,
    lineHeight: 1.6,
    wordsPerPage: 200,
  },
};

// ============================================
// Text Flow Functions (US-002)
// ============================================

interface TextFlowResult {
  pages: string[];
  totalWords: number;
}

/**
 * Split chapter text into pages based on words per page limit.
 * Tries to keep paragraphs together and avoid orphan lines.
 */
export function calculateTextPages(
  chapterText: string,
  wordsPerPage: number
): TextFlowResult {
  const paragraphs = chapterText.split(/\n\n+/).filter((p) => p.trim());
  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).length;

    // If this paragraph alone exceeds page limit, split it
    if (words > wordsPerPage) {
      // Flush current page if it has content
      if (currentPage.length > 0) {
        pages.push(currentPage.join("\n\n"));
        currentPage = [];
        currentWordCount = 0;
      }

      // Split large paragraph into chunks
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let chunk: string[] = [];
      let chunkWords = 0;

      for (const sentence of sentences) {
        const sentenceWords = sentence.trim().split(/\s+/).length;
        if (chunkWords + sentenceWords > wordsPerPage && chunk.length > 0) {
          pages.push(chunk.join(" "));
          chunk = [];
          chunkWords = 0;
        }
        chunk.push(sentence);
        chunkWords += sentenceWords;
      }

      if (chunk.length > 0) {
        currentPage.push(chunk.join(" "));
        currentWordCount = chunkWords;
      }
    } else if (currentWordCount + words > wordsPerPage) {
      // Start new page
      if (currentPage.length > 0) {
        pages.push(currentPage.join("\n\n"));
      }
      currentPage = [paragraph];
      currentWordCount = words;
    } else {
      // Add to current page
      currentPage.push(paragraph);
      currentWordCount += words;
    }
  }

  // Don't forget the last page
  if (currentPage.length > 0) {
    pages.push(currentPage.join("\n\n"));
  }

  const totalWords = paragraphs.reduce(
    (sum, p) => sum + p.trim().split(/\s+/).length,
    0
  );

  return { pages, totalWords };
}

/**
 * Estimate how many pages a chapter will need.
 */
export function estimateChapterPages(
  wordCount: number,
  wordsPerPage: number,
  hasIllustration: boolean
): number {
  const textPages = Math.ceil(wordCount / wordsPerPage);
  // Add 1 page for illustration spread
  return hasIllustration ? textPages + 1 : textPages;
}

// ============================================
// Illustration Placement (US-003)
// ============================================

interface IllustrationPlacement {
  chapterNumber: number;
  spreadNumber: number;
  position: "full-spread" | "half-page";
  imageUrl: string;
}

/**
 * Determine where illustrations should be placed.
 * Each chapter gets one illustration, placed at the chapter start.
 */
export function placeIllustrations(
  chapters: ChapterArtifactItem[],
  illustrations: IllustrationArtifactItem[]
): IllustrationPlacement[] {
  const placements: IllustrationPlacement[] = [];
  let currentSpread = 2; // Start after title page (spread 1)

  for (const chapter of chapters) {
    const illustration = illustrations.find(
      (ill) => ill.chapterNumber === chapter.chapterNumber && ill.imageUrl
    );

    if (illustration && illustration.imageUrl) {
      placements.push({
        chapterNumber: chapter.chapterNumber,
        spreadNumber: currentSpread,
        position: "full-spread", // Default to full spread for picture books
        imageUrl: illustration.imageUrl,
      });
    }

    // Estimate pages for this chapter
    const textPages = Math.ceil(chapter.wordCount / 100); // Default estimate
    const spreadsNeeded = Math.ceil((textPages + 1) / 2); // +1 for illustration
    currentSpread += spreadsNeeded;
  }

  return placements;
}

// ============================================
// Spread Composition (US-004)
// ============================================

/**
 * Create a blank page layout.
 */
function createBlankPage(pageNumber: number, position: PagePosition): PageLayoutItem {
  return {
    pageNumber,
    position,
    type: "blank",
    blocks: [],
  };
}

/**
 * Create a text page layout.
 */
function createTextPage(
  pageNumber: number,
  position: PagePosition,
  text: string,
  chapterNumber?: number,
  chapterTitle?: string
): PageLayoutItem {
  return {
    pageNumber,
    position,
    type: "text",
    blocks: [{ type: "text", content: text, position: "full" }],
    chapterNumber,
    chapterTitle,
  };
}

/**
 * Create an image page layout.
 */
function createImagePage(
  pageNumber: number,
  position: PagePosition,
  imageUrl: string,
  caption?: string
): PageLayoutItem {
  return {
    pageNumber,
    position,
    type: "image",
    blocks: [{ type: "image", imageUrl, position: "full", caption }],
  };
}

/**
 * Create a mixed page with both text and image.
 */
function createMixedPage(
  pageNumber: number,
  position: PagePosition,
  text: string,
  imageUrl: string,
  imagePosition: "top" | "bottom" = "top"
): PageLayoutItem {
  const blocks: ContentBlock[] = imagePosition === "top"
    ? [
        { type: "image", imageUrl, position: "top" },
        { type: "text", content: text, position: "bottom" },
      ]
    : [
        { type: "text", content: text, position: "top" },
        { type: "image", imageUrl, position: "bottom" },
      ];

  return {
    pageNumber,
    position,
    type: "mixed",
    blocks,
  };
}

/**
 * Create a spread from two pages.
 */
export function composeSpread(
  spreadNumber: number,
  leftPage: PageLayoutItem,
  rightPage: PageLayoutItem
): SpreadLayoutItem {
  return {
    spreadNumber,
    leftPage,
    rightPage,
  };
}

// ============================================
// Main Layout Composer
// ============================================

export interface LayoutComposerInput {
  chapters: ChapterArtifactItem[];
  illustrations: IllustrationArtifactItem[];
  trimSize: string;
  projectTitle: string;
}

export interface LayoutComposerProgress {
  current: number;
  total: number;
  message: string;
}

/**
 * Compose the complete book layout.
 */
export function composeBookLayout(
  input: LayoutComposerInput,
  onProgress?: (progress: LayoutComposerProgress) => void
): LayoutArtifactContent {
  const { chapters, illustrations, trimSize, projectTitle } = input;
  const settings = DEFAULT_SETTINGS[trimSize] || DEFAULT_SETTINGS["6x9"];
  const spreads: SpreadLayoutItem[] = [];
  let pageNumber = 0;
  let spreadNumber = 0;

  // Get illustration placements
  const illustrationPlacements = placeIllustrations(chapters, illustrations);

  const totalSteps = chapters.length + 2; // chapters + title + final
  let currentStep = 0;

  // --- Title Page Spread (Spread 1) ---
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Creating title page...",
  });

  spreadNumber++;
  pageNumber += 2;
  const titleSpread = composeSpread(
    spreadNumber,
    createBlankPage(pageNumber - 1, "left"),
    {
      pageNumber,
      position: "right",
      type: "title",
      blocks: [{ type: "text", content: projectTitle, position: "center" }],
    }
  );
  spreads.push(titleSpread);

  // --- Copyright Page Spread (Spread 2) ---
  spreadNumber++;
  pageNumber += 2;
  const copyrightSpread = composeSpread(
    spreadNumber,
    {
      pageNumber: pageNumber - 1,
      position: "left",
      type: "copyright",
      blocks: [
        { type: "text", content: "Copyright information...", position: "bottom" },
      ],
    },
    createBlankPage(pageNumber, "right")
  );
  spreads.push(copyrightSpread);

  // --- Chapter Spreads ---
  for (const chapter of chapters) {
    currentStep++;
    onProgress?.({
      current: currentStep,
      total: totalSteps,
      message: `Laying out Chapter ${chapter.chapterNumber}...`,
    });

    // Get illustration for this chapter
    const illustrationPlacement = illustrationPlacements.find(
      (p) => p.chapterNumber === chapter.chapterNumber
    );

    // Calculate text pages for this chapter
    const textFlow = calculateTextPages(chapter.content, settings.wordsPerPage);

    // Chapter start spread (illustration + first text)
    spreadNumber++;
    pageNumber += 2;

    if (illustrationPlacement) {
      // Illustration on left, chapter start text on right
      spreads.push(
        composeSpread(
          spreadNumber,
          createImagePage(pageNumber - 1, "left", illustrationPlacement.imageUrl),
          createTextPage(
            pageNumber,
            "right",
            textFlow.pages[0] || "",
            chapter.chapterNumber,
            chapter.title
          )
        )
      );
    } else {
      // No illustration - blank left, chapter start on right
      spreads.push(
        composeSpread(
          spreadNumber,
          createBlankPage(pageNumber - 1, "left"),
          createTextPage(
            pageNumber,
            "right",
            textFlow.pages[0] || "",
            chapter.chapterNumber,
            chapter.title
          )
        )
      );
    }

    // Remaining text pages
    const remainingPages = textFlow.pages.slice(1);
    for (let i = 0; i < remainingPages.length; i += 2) {
      spreadNumber++;
      pageNumber += 2;

      const leftText = remainingPages[i] || "";
      const rightText = remainingPages[i + 1] || "";

      spreads.push(
        composeSpread(
          spreadNumber,
          leftText
            ? createTextPage(pageNumber - 1, "left", leftText)
            : createBlankPage(pageNumber - 1, "left"),
          rightText
            ? createTextPage(pageNumber, "right", rightText)
            : createBlankPage(pageNumber, "right")
        )
      );
    }
  }

  // --- Final spread (back matter if needed) ---
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Finalizing layout...",
  });

  return {
    pageCount: pageNumber,
    spreads,
    settings,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// Exports
// ============================================

export { DEFAULT_SETTINGS, WORDS_PER_PAGE };
