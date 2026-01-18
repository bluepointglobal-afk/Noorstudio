/**
 * Export Types
 * Type definitions for the export module
 */

import {
  LayoutArtifactContent,
  CoverArtifactContent,
  ChaptersArtifactContent,
  IllustrationArtifactContent,
} from "@/lib/types/artifacts";

// ============================================
// Export Format Types
// ============================================

export type ExportFormat = "pdf" | "epub" | "pdf-print";

// ============================================
// Export Options
// ============================================

export interface ExportOptions {
  formats: ExportFormat[];
  projectTitle: string;
  authorName?: string;
  language?: string;
  publisher?: string;
  includeTimestamp?: boolean;
}

// ============================================
// Export Input
// ============================================

export interface ExportInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  illustrations?: IllustrationArtifactContent;
  options: ExportOptions;
}

// ============================================
// Export Result
// ============================================

export interface ExportFileResult {
  format: ExportFormat;
  blob: Blob;
  filename: string;
  fileSize: number;
  pageCount: number;
  generatedAt: string;
}

export interface ExportResult {
  success: boolean;
  files: ExportFileResult[];
  errors?: string[];
  totalSize: number;
  generatedAt: string;
}

// ============================================
// Export Progress
// ============================================

export interface ExportProgress {
  stage: "pdf" | "epub" | "pdf-print" | "complete";
  status: "pending" | "running" | "completed" | "error";
  progress: number; // 0-100
  message: string;
  currentFormat?: ExportFormat;
}

// ============================================
// Export Cache
// ============================================

export interface CachedExport {
  format: ExportFormat;
  blob: Blob;
  fileSize: number;
  pageCount: number;
  generatedAt: string;
  sourceHash: string; // Hash of source artifacts to detect staleness
}

export interface ExportCache {
  projectId: string;
  exports: Map<ExportFormat, CachedExport>;
  lastModified: string;
}

// ============================================
// Export Artifact (for storage)
// ============================================

export interface ExportArtifactItem {
  format: ExportFormat;
  fileSize: number;
  pageCount: number;
  generatedAt: string;
  cached: boolean;
}

export interface ExportArtifactContent {
  files: ExportArtifactItem[];
  generatedAt: string;
}
