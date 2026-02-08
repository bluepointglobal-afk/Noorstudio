/**
 * Unified Publishing Function
 * Orchestrates the entire publishing pipeline
 */

import {
  LayoutArtifactContent,
  CoverArtifactContent,
  ChaptersArtifactContent,
  IllustrationArtifactContent,
} from "@/lib/types/artifacts";
import { generateEPUB33 } from "./epub33Generator";
import { generateKDPPDF } from "./kdpPDFGenerator";
import { generateLuluPDF } from "./luluPDFGenerator";
import { ISBNManagerImpl } from "./isbnManager";
import {
  PublishingConfig,
  PublishingExportResult,
  PublishingExportProgress,
} from "./types";

// ============================================
// Types
// ============================================

export interface PublishBookInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  illustrations?: IllustrationArtifactContent;
  projectTitle: string;
  authorName?: string;
  publisher?: string;
  language?: string;
  config: PublishingConfig;
  isbnManager?: ISBNManagerImpl;
}

// ============================================
// Main Publishing Function
// ============================================

export async function publishBook(
  input: PublishBookInput,
  onProgress?: (progress: PublishingExportProgress) => void
): Promise<PublishingExportResult[]> {
  const {
    layout,
    cover,
    chapters,
    illustrations,
    projectTitle,
    authorName = "Anonymous",
    publisher = "NoorStudio",
    language = "en",
    config,
    isbnManager,
  } = input;
  
  const results: PublishingExportResult[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Get ISBN if available
  const isbn = isbnManager?.getISBN(
    config.format === "epub" ? "ebook" : "paperback",
    config.platform
  )?.isbn13;
  
  // ============================================
  // EPUB Generation
  // ============================================
  if (config.format === "epub" || config.platform === "apple") {
    onProgress?.({
      stage: "epub",
      current: 1,
      total: 3,
      message: "Generating EPUB 3.3...",
    });
    
    try {
      const epubResult = await generateEPUB33({
        layout,
        cover,
        chapters,
        illustrations,
        projectTitle,
        authorName,
        language,
        publisher,
        isbn,
        metadata: config.apple ? {
          title: projectTitle,
          author: authorName,
          language,
          publisher,
          isbn,
          ibooks: {
            specifiedFonts: config.apple.specifiedFonts,
            version: "1.0.0",
          },
        } : undefined,
      });
      
      warnings.push(...epubResult.validation.warnings);
      
      results.push({
        blob: epubResult.blob,
        filename: `${sanitizeFilename(projectTitle)}.epub`,
        format: "epub",
        platform: config.platform,
        specs: {
          epubVersion: "3.3",
          appleCompatible: epubResult.validation.isAppleCompatible,
        } as any,
        metadata: {
          pageCount: epubResult.pageCount,
          fileSize: epubResult.blob.size,
          isbn,
          generatedAt: new Date().toISOString(),
        },
        validation: {
          passed: epubResult.validation.isEPUB33,
          warnings: epubResult.validation.warnings,
          errors: [],
        },
      });
    } catch (error) {
      errors.push(`EPUB generation failed: ${error}`);
    }
  }
  
  // ============================================
  // KDP PDF Generation
  // ============================================
  if (config.platform === "kdp" && config.format === "pdf") {
    onProgress?.({
      stage: "kdp-pdf",
      current: 2,
      total: 3,
      message: "Generating KDP print-ready PDF...",
    });
    
    try {
      const kdpResult = await generateKDPPDF({
        layout,
        cover,
        chapters,
        illustrations,
        projectTitle,
        authorName,
        trimSize: config.trimSize,
        paperType: config.kdp?.paperType || "white",
        includeBleed: config.includeBleed,
        colorMode: config.colorMode,
      });
      
      // Interior PDF
      results.push({
        blob: kdpResult.interiorBlob,
        filename: `${sanitizeFilename(projectTitle)}-KDP-Interior.pdf`,
        format: "pdf",
        platform: "kdp",
        specs: kdpResult.specs.interior,
        metadata: {
          pageCount: kdpResult.pageCount,
          fileSize: kdpResult.interiorBlob.size,
          isbn,
          generatedAt: new Date().toISOString(),
        },
        validation: {
          passed: true,
          warnings: kdpResult.pageCount < 24 
            ? ["Page count below KDP minimum (24 pages)"] 
            : [],
          errors: [],
        },
      });
      
      // Cover PDF
      if (kdpResult.coverBlob && kdpResult.specs.cover) {
        results.push({
          blob: kdpResult.coverBlob,
          filename: `${sanitizeFilename(projectTitle)}-KDP-Cover.pdf`,
          format: "pdf",
          platform: "kdp",
          specs: kdpResult.specs.cover,
          metadata: {
            pageCount: 1,
            fileSize: kdpResult.coverBlob.size,
            isbn,
            generatedAt: new Date().toISOString(),
          },
          validation: {
            passed: true,
            warnings: kdpResult.specs.cover.spineWidth < 0.06
              ? ["Spine width too narrow for text"]
              : [],
            errors: [],
          },
        });
      }
    } catch (error) {
      errors.push(`KDP PDF generation failed: ${error}`);
    }
  }
  
  // ============================================
  // Lulu PDF Generation
  // ============================================
  if (config.platform === "lulu" && config.format === "pdf") {
    onProgress?.({
      stage: "lulu-pdf",
      current: 3,
      total: 3,
      message: "Generating Lulu print-ready PDF...",
    });
    
    try {
      const luluResult = await generateLuluPDF({
        layout,
        cover,
        chapters,
        illustrations,
        projectTitle,
        authorName,
        trimSize: config.trimSize,
        bindingType: config.lulu?.bindingType || "perfect",
        paperWeight: config.lulu?.paperWeight || "60lb",
        color: config.colorMode === "color",
        headerFooterConfig: config.lulu?.headerFooter,
      });
      
      results.push({
        blob: luluResult.blob,
        filename: `${sanitizeFilename(projectTitle)}-Lulu.pdf`,
        format: "pdf",
        platform: "lulu",
        specs: luluResult.specs,
        metadata: {
          pageCount: luluResult.pageCount,
          fileSize: luluResult.blob.size,
          isbn,
          generatedAt: new Date().toISOString(),
        },
        validation: {
          passed: true,
          warnings: [],
          errors: [],
        },
      });
    } catch (error) {
      errors.push(`Lulu PDF generation failed: ${error}`);
    }
  }
  
  onProgress?.({
    stage: "complete",
    current: 3,
    total: 3,
    message: "Publishing complete!",
  });
  
  // Add global errors to first result
  if (results.length > 0 && errors.length > 0) {
    results[0].validation.errors.push(...errors);
  }
  
  return results;
}

// ============================================
// Helper Functions
// ============================================

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================
// Download Helper
// ============================================

export function downloadPublishingResult(result: PublishingExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAllResults(results: PublishingExportResult[]): void {
  results.forEach(result => {
    setTimeout(() => downloadPublishingResult(result), 100);
  });
}
