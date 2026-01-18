/**
 * Export Module
 * PDF and EPUB generation for NoorStudio books
 */

// Types
export * from "./types";

// PDF Generator
export {
  generatePDF,
  TRIM_SIZES,
  DEFAULT_MARGINS,
  FONTS,
} from "./pdfGenerator";
export type {
  PDFGeneratorInput,
  PDFGeneratorResult,
  PDFGeneratorProgress,
} from "./pdfGenerator";

// EPUB Generator
export {
  generateEPUB,
  MIMETYPE,
} from "./epubGenerator";
export type {
  EPUBGeneratorInput,
  EPUBGeneratorResult,
  EPUBGeneratorProgress,
} from "./epubGenerator";

// Download Utilities
export {
  downloadBlob,
  downloadPDF,
  downloadEPUB,
  downloadPrintPDF,
  sanitizeFilename,
  generateFilename,
  formatFileSize,
  MIME_TYPES,
  FILE_EXTENSIONS,
} from "./downloadUtils";
