/**
 * KDP PDF Generator
 * Generate print-ready PDFs for Amazon KDP with bleed, trim marks, and proper formatting
 */

import { jsPDF } from "jspdf";
import {
  LayoutArtifactContent,
  CoverArtifactContent,
  ChaptersArtifactContent,
  ChapterArtifactItem,
  IllustrationArtifactContent,
} from "@/lib/types/artifacts";
import { generateKDPCoverSpecs, inchesToPixels } from "./spineCalculator";
import { KDPCoverSpecs, KDPInteriorSpecs } from "./types";

// ============================================
// Types
// ============================================

export interface KDPPDFGeneratorInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  illustrations?: IllustrationArtifactContent;
  projectTitle: string;
  authorName?: string;
  trimSize: "6x9" | "7x10" | "8.5x11" | "5x8" | "5.5x8.5";
  paperType?: "white" | "cream";
  includeBleed?: boolean;
  colorMode?: "color" | "grayscale";
}

export interface KDPPDFGeneratorResult {
  interiorBlob: Blob;
  coverBlob?: Blob;
  specs: {
    interior: KDPInteriorSpecs;
    cover?: KDPCoverSpecs;
  };
  pageCount: number;
}

// ============================================
// Constants
// ============================================

const TRIM_SIZES = {
  "6x9": { width: 6, height: 9 },
  "7x10": { width: 7, height: 10 },
  "8.5x11": { width: 8.5, height: 11 },
  "5x8": { width: 5, height: 8 },
  "5.5x8.5": { width: 5.5, height: 8.5 },
};

const KDP_BLEED = 0.125; // inches

// KDP Interior margins (recommended)
const KDP_MARGINS = {
  top: 0.75,
  bottom: 0.75,
  inside: 0.875,  // gutter
  outside: 0.625,
};

// ============================================
// Helper Functions
// ============================================

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

function convertToGrayscale(doc: jsPDF): void {
  // Note: jsPDF doesn't have native grayscale conversion
  // This is a placeholder - in production, images should be pre-converted
  console.warn("Grayscale conversion should be done at the image level");
}

// ============================================
// Interior PDF Generator
// ============================================

async function generateInteriorPDF(
  input: KDPPDFGeneratorInput
): Promise<{ blob: Blob; pageCount: number; specs: KDPInteriorSpecs }> {
  const {
    chapters,
    illustrations,
    projectTitle,
    authorName = "Anonymous",
    trimSize,
    paperType = "white",
    includeBleed = false,
    colorMode = "color",
  } = input;
  
  const chapterList = Array.isArray(chapters) ? chapters : [];
  
  // Get trim dimensions
  const trim = TRIM_SIZES[trimSize];
  const width = trim.width;
  const height = trim.height;
  
  // Calculate page dimensions with bleed
  const pageWidth = includeBleed ? width + (KDP_BLEED * 2) : width;
  const pageHeight = includeBleed ? height + (KDP_BLEED * 2) : height;
  
  // Create PDF
  const doc = new jsPDF({
    orientation: height > width ? "portrait" : "landscape",
    unit: "in",
    format: [pageWidth, pageHeight],
  });
  
  // Set up color mode
  if (colorMode === "grayscale") {
    convertToGrayscale(doc);
  }
  
  let currentPage = 0;
  const bleedOffset = includeBleed ? KDP_BLEED : 0;
  
  // Title page
  currentPage++;
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(projectTitle, width - 2);
  let yPos = height / 3;
  titleLines.forEach((line: string) => {
    const textWidth = doc.getTextWidth(line);
    doc.text(line, bleedOffset + (width - textWidth) / 2, yPos);
    yPos += 0.4;
  });
  
  // Author
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  const authorWidth = doc.getTextWidth(authorName);
  doc.text(authorName, bleedOffset + (width - authorWidth) / 2, yPos + 0.5);
  
  // Copyright page
  doc.addPage([pageWidth, pageHeight]);
  currentPage++;
  doc.setFontSize(10);
  doc.text(`© ${new Date().getFullYear()} ${authorName}`, bleedOffset + KDP_MARGINS.inside, height - 1);
  doc.text("All rights reserved.", bleedOffset + KDP_MARGINS.inside, height - 0.8);
  
  // Chapters
  for (let i = 0; i < chapterList.length; i++) {
    const chapter = chapterList[i];
    const illustration = illustrations?.find(ill => ill.chapterNumber === chapter.chapterNumber);
    
    // New page for each chapter
    doc.addPage([pageWidth, pageHeight]);
    currentPage++;
    
    const isLeftPage = currentPage % 2 === 0;
    const leftMargin = bleedOffset + (isLeftPage ? KDP_MARGINS.inside : KDP_MARGINS.outside);
    const rightMargin = bleedOffset + width - (isLeftPage ? KDP_MARGINS.outside : KDP_MARGINS.inside);
    const contentWidth = rightMargin - leftMargin;
    
    yPos = bleedOffset + KDP_MARGINS.top;
    
    // Chapter title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Chapter ${chapter.chapterNumber}`, leftMargin, yPos);
    yPos += 0.3;
    
    doc.setFontSize(16);
    doc.text(chapter.title, leftMargin, yPos);
    yPos += 0.5;
    
    // Chapter illustration (if exists)
    if (illustration?.imageUrl) {
      try {
        const imgData = await imageUrlToBase64(illustration.imageUrl);
        if (imgData) {
          const imgHeight = 3; // inches
          const imgWidth = contentWidth;
          
          if (yPos + imgHeight > height - bleedOffset - KDP_MARGINS.bottom) {
            doc.addPage([pageWidth, pageHeight]);
            currentPage++;
            yPos = bleedOffset + KDP_MARGINS.top;
          }
          
          doc.addImage(imgData, "JPEG", leftMargin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 0.3;
        }
      } catch (error) {
        console.warn(`Failed to add illustration for chapter ${i + 1}`);
      }
    }
    
    // Chapter content
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const paragraphs = chapter.content.split(/\n\n+/).filter(p => p.trim());
    
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, contentWidth);
      
      for (const line of lines) {
        if (yPos + 0.2 > height - bleedOffset - KDP_MARGINS.bottom) {
          // New page needed
          doc.addPage([pageWidth, pageHeight]);
          currentPage++;
          const newIsLeftPage = currentPage % 2 === 0;
          const newLeftMargin = bleedOffset + (newIsLeftPage ? KDP_MARGINS.inside : KDP_MARGINS.outside);
          yPos = bleedOffset + KDP_MARGINS.top;
          doc.text(line, newLeftMargin, yPos);
        } else {
          doc.text(line, leftMargin, yPos);
        }
        yPos += 0.18; // line height
      }
      
      yPos += 0.15; // paragraph spacing
    }
    
    // Page number (footer)
    doc.setFontSize(9);
    const pageNumText = String(currentPage);
    const pageNumWidth = doc.getTextWidth(pageNumText);
    const pageNumX = isLeftPage 
      ? leftMargin 
      : rightMargin - pageNumWidth;
    doc.text(pageNumText, pageNumX, height - bleedOffset - 0.3);
  }
  
  const blob = doc.output("blob");
  
  const specs: KDPInteriorSpecs = {
    trimWidth: width,
    trimHeight: height,
    margins: KDP_MARGINS,
    bleed: includeBleed,
    paperType,
  };
  
  return { blob, pageCount: currentPage, specs };
}

// ============================================
// Cover PDF Generator
// ============================================

async function generateCoverPDF(
  input: KDPPDFGeneratorInput,
  pageCount: number
): Promise<{ blob: Blob; specs: KDPCoverSpecs } | null> {
  const { cover, trimSize, paperType = "white", colorMode = "color" } = input;
  
  if (!cover.frontCoverUrl) {
    return null;
  }
  
  const trim = TRIM_SIZES[trimSize];
  
  // Generate cover specs with spine calculation
  const specs = generateKDPCoverSpecs(
    trim.width,
    trim.height,
    pageCount,
    paperType,
    "perfect",
    colorMode === "color"
  );
  
  // Create PDF with full cover dimensions
  const doc = new jsPDF({
    orientation: specs.totalWidth > specs.totalHeight ? "landscape" : "portrait",
    unit: "in",
    format: [specs.totalWidth, specs.totalHeight],
  });
  
  // Add front cover image
  try {
    const frontCoverData = await imageUrlToBase64(cover.frontCoverUrl);
    if (frontCoverData) {
      // Front cover (with bleed)
      doc.addImage(
        frontCoverData,
        "JPEG",
        specs.frontCoverX - specs.bleedSize,
        0,
        specs.trimWidth + specs.bleedSize * 2,
        specs.totalHeight
      );
    }
  } catch (error) {
    console.warn("Failed to add front cover image");
  }
  
  // Add back cover if available
  if (cover.backCoverUrl) {
    try {
      const backCoverData = await imageUrlToBase64(cover.backCoverUrl);
      if (backCoverData) {
        doc.addImage(
          backCoverData,
          "JPEG",
          specs.backCoverX - specs.bleedSize,
          0,
          specs.trimWidth + specs.bleedSize * 2,
          specs.totalHeight
        );
      }
    } catch (error) {
      console.warn("Failed to add back cover image");
    }
  }
  
  // Add spine text if wide enough
  if (specs.spineWidth >= 0.06) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    // Rotate and draw spine text
    const spineText = input.projectTitle;
    doc.text(
      spineText,
      specs.spineX + specs.spineWidth / 2,
      specs.totalHeight / 2,
      { angle: 90, align: "center" }
    );
  }
  
  const blob = doc.output("blob");
  return { blob, specs };
}

// ============================================
// Main Generator
// ============================================

export async function generateKDPPDF(
  input: KDPPDFGeneratorInput
): Promise<KDPPDFGeneratorResult> {
  // Generate interior first to get page count
  const interior = await generateInteriorPDF(input);
  
  // Generate cover with calculated spine width
  const cover = await generateCoverPDF(input, interior.pageCount);
  
  return {
    interiorBlob: interior.blob,
    coverBlob: cover?.blob,
    specs: {
      interior: interior.specs,
      cover: cover?.specs,
    },
    pageCount: interior.pageCount,
  };
}

// ============================================
// Exports
// ============================================

export {
  generateKDPPDF,
  generateInteriorPDF,
  generateCoverPDF,
  TRIM_SIZES,
  KDP_BLEED,
  KDP_MARGINS,
};
