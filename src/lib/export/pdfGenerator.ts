/**
 * PDF Generator
 * Generates PDF files from book layout and cover artifacts using jsPDF
 */

import { jsPDF } from "jspdf";
import {
  LayoutArtifactContent,
  CoverArtifactContent,
  SpreadLayoutItem,
  PageLayoutItem,
  LayoutSettings,
} from "@/lib/types/artifacts";
import { ChaptersArtifactContent } from "@/lib/types/artifacts";

// ============================================
// Types
// ============================================

export interface PDFGeneratorInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  projectTitle: string;
  authorName?: string;
}

export interface PDFGeneratorResult {
  blob: Blob;
  pageCount: number;
  fileSize: number;
}

export interface PDFGeneratorProgress {
  current: number;
  total: number;
  message: string;
}

// ============================================
// Constants
// ============================================

// Trim size to PDF dimensions in points (72pt = 1 inch)
const TRIM_SIZES: Record<string, { width: number; height: number }> = {
  "6x9": { width: 432, height: 648 },
  "7x10": { width: 504, height: 720 },
  "8.5x11": { width: 612, height: 792 },
};

// Default margins in points
const DEFAULT_MARGINS = {
  top: 54,
  bottom: 54,
  inner: 72,
  outer: 54,
};

// Font settings
const FONTS = {
  title: { size: 24, style: "bold" as const },
  chapterTitle: { size: 18, style: "bold" as const },
  body: { size: 12, style: "normal" as const },
  pageNumber: { size: 10, style: "normal" as const },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Convert image URL to base64 data URL for embedding in PDF
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Failed to load image: ${url}`, error);
    return "";
  }
}

/**
 * Get margin for a page based on position (left/right)
 */
function getPageMargins(position: "left" | "right", settings: LayoutSettings) {
  const margins = {
    top: settings.marginTop || DEFAULT_MARGINS.top,
    bottom: settings.marginBottom || DEFAULT_MARGINS.bottom,
    left: position === "left" ? settings.marginInner : settings.marginOuter,
    right: position === "left" ? settings.marginOuter : settings.marginInner,
  };
  return margins;
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  doc: jsPDF,
  text: string,
  maxWidth: number
): string[] {
  const lines = doc.splitTextToSize(text, maxWidth);
  return lines;
}

// ============================================
// Page Renderers
// ============================================

/**
 * Render the front cover page
 */
async function renderCoverPage(
  doc: jsPDF,
  cover: CoverArtifactContent,
  projectTitle: string,
  dimensions: { width: number; height: number }
): Promise<void> {
  if (cover.frontCoverUrl) {
    try {
      const imageData = await imageUrlToBase64(cover.frontCoverUrl);
      if (imageData) {
        doc.addImage(imageData, "JPEG", 0, 0, dimensions.width, dimensions.height);
      }
    } catch (error) {
      console.warn("Failed to add front cover image", error);
      // Fallback: render title text
      doc.setFontSize(FONTS.title.size);
      doc.setFont("helvetica", FONTS.title.style);
      const titleLines = wrapText(doc, projectTitle, dimensions.width - 100);
      const yStart = dimensions.height / 2 - (titleLines.length * FONTS.title.size) / 2;
      titleLines.forEach((line, i) => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, (dimensions.width - textWidth) / 2, yStart + i * FONTS.title.size * 1.2);
      });
    }
  } else {
    // No cover image - render title centered
    doc.setFontSize(FONTS.title.size);
    doc.setFont("helvetica", FONTS.title.style);
    const titleLines = wrapText(doc, projectTitle, dimensions.width - 100);
    const yStart = dimensions.height / 2 - (titleLines.length * FONTS.title.size) / 2;
    titleLines.forEach((line, i) => {
      const textWidth = doc.getTextWidth(line);
      doc.text(line, (dimensions.width - textWidth) / 2, yStart + i * FONTS.title.size * 1.2);
    });
  }
}

/**
 * Render the back cover page
 */
async function renderBackCover(
  doc: jsPDF,
  cover: CoverArtifactContent,
  dimensions: { width: number; height: number }
): Promise<void> {
  if (cover.backCoverUrl) {
    try {
      const imageData = await imageUrlToBase64(cover.backCoverUrl);
      if (imageData) {
        doc.addImage(imageData, "JPEG", 0, 0, dimensions.width, dimensions.height);
      }
    } catch (error) {
      console.warn("Failed to add back cover image", error);
    }
  }
  // If no back cover, leave page blank
}

/**
 * Render a single content page
 */
async function renderContentPage(
  doc: jsPDF,
  page: PageLayoutItem,
  settings: LayoutSettings,
  dimensions: { width: number; height: number }
): Promise<void> {
  const margins = getPageMargins(page.position, settings);
  const contentWidth = dimensions.width - margins.left - margins.right;
  const contentHeight = dimensions.height - margins.top - margins.bottom;

  // Render based on page type
  switch (page.type) {
    case "title": {
      // Title page - center the title
      doc.setFontSize(FONTS.title.size);
      doc.setFont("helvetica", FONTS.title.style);
      const titleText = page.blocks[0]?.content || "Untitled";
      const titleLines = wrapText(doc, titleText, contentWidth);
      const yStart = dimensions.height / 3;
      titleLines.forEach((line, i) => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, (dimensions.width - textWidth) / 2, yStart + i * FONTS.title.size * 1.5);
      });
      break;
    }

    case "copyright": {
      // Copyright page - small text at bottom
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const copyrightText = page.blocks[0]?.content || "© All rights reserved";
      doc.text(copyrightText, margins.left, dimensions.height - margins.bottom - 50);
      break;
    }

    case "text": {
      // Text page - render chapter title if present, then text
      let yPos = margins.top;

      // Chapter title
      if (page.chapterTitle) {
        doc.setFontSize(FONTS.chapterTitle.size);
        doc.setFont("helvetica", FONTS.chapterTitle.style);
        doc.text(page.chapterTitle, margins.left, yPos + FONTS.chapterTitle.size);
        yPos += FONTS.chapterTitle.size * 2;
      }

      // Body text
      doc.setFontSize(FONTS.body.size);
      doc.setFont("helvetica", "normal");

      for (const block of page.blocks) {
        if (block.type === "text" && block.content) {
          const lines = wrapText(doc, block.content, contentWidth);
          const lineHeight = FONTS.body.size * (settings.lineHeight || 1.5);

          for (const line of lines) {
            if (yPos + lineHeight > dimensions.height - margins.bottom) {
              break; // Don't overflow page
            }
            doc.text(line, margins.left, yPos);
            yPos += lineHeight;
          }
        }
      }
      break;
    }

    case "image": {
      // Image page - render image centered or full
      for (const block of page.blocks) {
        if (block.type === "image" && block.imageUrl) {
          try {
            const imageData = await imageUrlToBase64(block.imageUrl);
            if (imageData) {
              if (block.position === "full") {
                // Full page image
                doc.addImage(imageData, "JPEG", 0, 0, dimensions.width, dimensions.height);
              } else {
                // Centered with margins
                const imgWidth = contentWidth;
                const imgHeight = contentHeight;
                doc.addImage(
                  imageData,
                  "JPEG",
                  margins.left,
                  margins.top,
                  imgWidth,
                  imgHeight
                );
              }
            }
          } catch (error) {
            console.warn("Failed to add image to page", error);
          }
        }
      }
      break;
    }

    case "mixed": {
      // Mixed page - text and image
      let yPos = margins.top;

      for (const block of page.blocks) {
        if (block.type === "image" && block.imageUrl) {
          try {
            const imageData = await imageUrlToBase64(block.imageUrl);
            if (imageData) {
              const imgHeight = contentHeight * 0.4; // 40% of content area
              const imgWidth = contentWidth;

              if (block.position === "top") {
                doc.addImage(imageData, "JPEG", margins.left, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 20;
              } else {
                // Bottom - will be rendered after text
              }
            }
          } catch (error) {
            console.warn("Failed to add mixed page image", error);
          }
        } else if (block.type === "text" && block.content) {
          doc.setFontSize(FONTS.body.size);
          doc.setFont("helvetica", "normal");
          const lines = wrapText(doc, block.content, contentWidth);
          const lineHeight = FONTS.body.size * (settings.lineHeight || 1.5);

          for (const line of lines) {
            if (yPos + lineHeight > dimensions.height - margins.bottom) {
              break;
            }
            doc.text(line, margins.left, yPos);
            yPos += lineHeight;
          }
        }
      }
      break;
    }

    case "blank":
    default:
      // Blank page - nothing to render
      break;
  }

  // Add page number (except for cover-type pages)
  if (page.type !== "title" && page.type !== "copyright" && page.pageNumber > 2) {
    doc.setFontSize(FONTS.pageNumber.size);
    doc.setFont("helvetica", "normal");
    const pageNumText = String(page.pageNumber);
    const textWidth = doc.getTextWidth(pageNumText);
    const xPos = page.position === "left"
      ? margins.left
      : dimensions.width - margins.right - textWidth;
    doc.text(pageNumText, xPos, dimensions.height - margins.bottom / 2);
  }
}

// ============================================
// Main Generator
// ============================================

/**
 * Generate a PDF from book layout and cover
 */
export async function generatePDF(
  input: PDFGeneratorInput,
  onProgress?: (progress: PDFGeneratorProgress) => void
): Promise<PDFGeneratorResult> {
  const { layout, cover, projectTitle } = input;
  const { settings, spreads } = layout;

  // Get dimensions based on trim size
  const dimensions = TRIM_SIZES[settings.trimSize] || TRIM_SIZES["6x9"];

  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [dimensions.width, dimensions.height],
  });

  const totalSteps = spreads.length + 2; // spreads + front cover + back cover
  let currentStep = 0;

  // 1. Front Cover
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Rendering front cover...",
  });
  await renderCoverPage(doc, cover, projectTitle, dimensions);

  // 2. Content Pages (spreads)
  for (const spread of spreads) {
    currentStep++;
    onProgress?.({
      current: currentStep,
      total: totalSteps,
      message: `Rendering spread ${spread.spreadNumber}...`,
    });

    // Left page
    doc.addPage([dimensions.width, dimensions.height]);
    await renderContentPage(doc, spread.leftPage, settings, dimensions);

    // Right page
    doc.addPage([dimensions.width, dimensions.height]);
    await renderContentPage(doc, spread.rightPage, settings, dimensions);
  }

  // 3. Back Cover
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Rendering back cover...",
  });
  doc.addPage([dimensions.width, dimensions.height]);
  await renderBackCover(doc, cover, dimensions);

  // Generate blob
  const blob = doc.output("blob");
  const pageCount = doc.getNumberOfPages();

  return {
    blob,
    pageCount,
    fileSize: blob.size,
  };
}

// ============================================
// Exports
// ============================================

export { TRIM_SIZES, DEFAULT_MARGINS, FONTS };
