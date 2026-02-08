/**
 * Lulu PDF Generator
 * Generate print-ready PDFs for Lulu with headers, footers, and proper formatting
 */

import { jsPDF } from "jspdf";
import {
  LayoutArtifactContent,
  CoverArtifactContent,
  ChaptersArtifactContent,
  ChapterArtifactItem,
  IllustrationArtifactContent,
} from "@/lib/types/artifacts";
import { LuluInteriorSpecs, LuluHeaderFooterConfig } from "./types";

// ============================================
// Types
// ============================================

export interface LuluPDFGeneratorInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  illustrations?: IllustrationArtifactContent;
  projectTitle: string;
  authorName?: string;
  trimSize: "6x9" | "7x10" | "8.5x11" | "5x8" | "5.5x8.5";
  bindingType?: "perfect" | "saddle-stitch" | "coil";
  paperWeight?: "60lb" | "70lb" | "80lb";
  color?: boolean;
  headerFooterConfig?: LuluHeaderFooterConfig;
}

export interface LuluPDFGeneratorResult {
  blob: Blob;
  specs: LuluInteriorSpecs;
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

// Lulu recommended margins
const LULU_MARGINS = {
  top: 0.75,
  bottom: 0.75,
  inside: 0.75,
  outside: 0.5,
};

// Header/Footer configuration
const DEFAULT_HEADER_FOOTER: LuluHeaderFooterConfig = {
  headerLeft: undefined,
  headerCenter: undefined,
  headerRight: undefined,
  footerLeft: undefined,
  footerCenter: "{page}",
  footerRight: undefined,
  font: "helvetica",
  fontSize: 9,
  alternateLeftRight: true,
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

function processHeaderFooterText(
  text: string | undefined,
  pageNum: number,
  chapterTitle: string,
  bookTitle: string,
  authorName: string
): string {
  if (!text) return "";
  
  return text
    .replace("{page}", String(pageNum))
    .replace("{chapter}", chapterTitle)
    .replace("{book}", bookTitle)
    .replace("{author}", authorName);
}

// ============================================
// Header/Footer Renderer
// ============================================

function renderHeaderFooter(
  doc: jsPDF,
  pageNum: number,
  isLeftPage: boolean,
  chapterTitle: string,
  config: LuluHeaderFooterConfig,
  bookTitle: string,
  authorName: string,
  dimensions: { width: number; height: number; margins: typeof LULU_MARGINS }
): void {
  const { width, height, margins } = dimensions;
  
  doc.setFontSize(config.fontSize);
  doc.setFont(config.font as any, "normal");
  
  // Determine which side's header/footer to use
  const useLeft = !config.alternateLeftRight || isLeftPage;
  
  // Header
  const headerY = margins.top - 0.3;
  
  if (config.headerLeft || config.headerCenter || config.headerRight) {
    const headerLeft = processHeaderFooterText(
      useLeft ? config.headerLeft : config.headerRight,
      pageNum,
      chapterTitle,
      bookTitle,
      authorName
    );
    const headerCenter = processHeaderFooterText(
      config.headerCenter,
      pageNum,
      chapterTitle,
      bookTitle,
      authorName
    );
    const headerRight = processHeaderFooterText(
      useLeft ? config.headerRight : config.headerLeft,
      pageNum,
      chapterTitle,
      bookTitle,
      authorName
    );
    
    if (headerLeft) {
      doc.text(headerLeft, margins.inside, headerY);
    }
    
    if (headerCenter) {
      const centerWidth = doc.getTextWidth(headerCenter);
      doc.text(headerCenter, (width - centerWidth) / 2, headerY);
    }
    
    if (headerRight) {
      const rightWidth = doc.getTextWidth(headerRight);
      doc.text(headerRight, width - margins.outside - rightWidth, headerY);
    }
  }
  
  // Footer
  const footerY = height - margins.bottom + 0.4;
  
  if (config.footerLeft || config.footerCenter || config.footerRight) {
    const footerLeft = processHeaderFooterText(
      useLeft ? config.footerLeft : config.footerRight,
      pageNum,
      chapterTitle,
      bookTitle,
      authorName
    );
    const footerCenter = processHeaderFooterText(
      config.footerCenter,
      pageNum,
      chapterTitle,
      bookTitle,
      authorName
    );
    const footerRight = processHeaderFooterText(
      useLeft ? config.footerRight : config.footerLeft,
      pageNum,
      chapterTitle,
      bookTitle,
      authorName
    );
    
    if (footerLeft) {
      doc.text(footerLeft, margins.inside, footerY);
    }
    
    if (footerCenter) {
      const centerWidth = doc.getTextWidth(footerCenter);
      doc.text(footerCenter, (width - centerWidth) / 2, footerY);
    }
    
    if (footerRight) {
      const rightWidth = doc.getTextWidth(footerRight);
      doc.text(footerRight, width - margins.outside - rightWidth, footerY);
    }
  }
}

// ============================================
// Main Generator
// ============================================

export async function generateLuluPDF(
  input: LuluPDFGeneratorInput
): Promise<LuluPDFGeneratorResult> {
  const {
    chapters,
    illustrations,
    projectTitle,
    authorName = "Anonymous",
    trimSize,
    bindingType = "perfect",
    paperWeight = "60lb",
    color = false,
    headerFooterConfig = DEFAULT_HEADER_FOOTER,
  } = input;
  
  const chapterList = Array.isArray(chapters) ? chapters : [];
  
  // Get trim dimensions
  const trim = TRIM_SIZES[trimSize];
  const width = trim.width;
  const height = trim.height;
  
  // Create PDF
  const doc = new jsPDF({
    orientation: height > width ? "portrait" : "landscape",
    unit: "in",
    format: [width, height],
  });
  
  let currentPage = 0;
  let currentChapterTitle = "";
  
  // ============================================
  // Title Page
  // ============================================
  currentPage++;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(projectTitle, width - 2);
  let yPos = height / 3;
  
  titleLines.forEach((line: string) => {
    const textWidth = doc.getTextWidth(line);
    doc.text(line, (width - textWidth) / 2, yPos);
    yPos += 0.5;
  });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  const authorWidth = doc.getTextWidth(authorName);
  doc.text(authorName, (width - authorWidth) / 2, yPos + 0.7);
  
  // ============================================
  // Copyright Page
  // ============================================
  doc.addPage([width, height]);
  currentPage++;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const copyrightText = [
    `© ${new Date().getFullYear()} ${authorName}`,
    "All rights reserved.",
    "",
    "No part of this book may be reproduced or transmitted",
    "in any form without written permission from the publisher.",
  ];
  
  yPos = height - 2;
  copyrightText.forEach(line => {
    doc.text(line, LULU_MARGINS.inside, yPos);
    yPos += 0.15;
  });
  
  // ============================================
  // Chapters
  // ============================================
  for (let i = 0; i < chapterList.length; i++) {
    const chapter = chapterList[i];
    const illustration = illustrations?.find(ill => ill.chapterNumber === chapter.chapterNumber);
    
    currentChapterTitle = chapter.title;
    
    // New page for chapter
    doc.addPage([width, height]);
    currentPage++;
    
    const isLeftPage = currentPage % 2 === 0;
    const leftMargin = isLeftPage ? LULU_MARGINS.inside : LULU_MARGINS.outside;
    const rightMargin = width - (isLeftPage ? LULU_MARGINS.outside : LULU_MARGINS.inside);
    const contentWidth = rightMargin - leftMargin;
    
    yPos = LULU_MARGINS.top + 0.5;
    
    // Chapter number and title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`Chapter ${chapter.chapterNumber}`, leftMargin, yPos);
    yPos += 0.35;
    
    doc.setFontSize(16);
    doc.text(chapter.title, leftMargin, yPos);
    yPos += 0.6;
    
    // Chapter illustration
    if (illustration?.imageUrl) {
      try {
        const imgData = await imageUrlToBase64(illustration.imageUrl);
        if (imgData) {
          const imgHeight = 3.5;
          const imgWidth = contentWidth;
          
          if (yPos + imgHeight > height - LULU_MARGINS.bottom - 0.5) {
            // Render header/footer for current page
            renderHeaderFooter(
              doc,
              currentPage,
              isLeftPage,
              currentChapterTitle,
              headerFooterConfig,
              projectTitle,
              authorName,
              { width, height, margins: LULU_MARGINS }
            );
            
            doc.addPage([width, height]);
            currentPage++;
            yPos = LULU_MARGINS.top + 0.5;
          }
          
          doc.addImage(imgData, "JPEG", leftMargin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 0.4;
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
        if (yPos + 0.2 > height - LULU_MARGINS.bottom - 0.5) {
          // Render header/footer before new page
          renderHeaderFooter(
            doc,
            currentPage,
            isLeftPage,
            currentChapterTitle,
            headerFooterConfig,
            projectTitle,
            authorName,
            { width, height, margins: LULU_MARGINS }
          );
          
          // New page
          doc.addPage([width, height]);
          currentPage++;
          
          const newIsLeftPage = currentPage % 2 === 0;
          const newLeftMargin = newIsLeftPage ? LULU_MARGINS.inside : LULU_MARGINS.outside;
          
          yPos = LULU_MARGINS.top + 0.5;
          doc.text(line, newLeftMargin, yPos);
        } else {
          doc.text(line, leftMargin, yPos);
        }
        
        yPos += 0.18;
      }
      
      yPos += 0.15; // paragraph spacing
    }
    
    // Render header/footer for last page of chapter
    renderHeaderFooter(
      doc,
      currentPage,
      isLeftPage,
      currentChapterTitle,
      headerFooterConfig,
      projectTitle,
      authorName,
      { width, height, margins: LULU_MARGINS }
    );
  }
  
  const blob = doc.output("blob");
  
  const specs: LuluInteriorSpecs = {
    trimWidth: width,
    trimHeight: height,
    margins: LULU_MARGINS,
    bindingType,
    paperWeight,
    color,
    headers: !!(headerFooterConfig.headerLeft || headerFooterConfig.headerCenter || headerFooterConfig.headerRight),
    footers: !!(headerFooterConfig.footerLeft || headerFooterConfig.footerCenter || headerFooterConfig.footerRight),
  };
  
  return {
    blob,
    specs,
    pageCount: currentPage,
  };
}

// ============================================
// Exports
// ============================================

export {
  generateLuluPDF,
  TRIM_SIZES,
  LULU_MARGINS,
  DEFAULT_HEADER_FOOTER,
};
