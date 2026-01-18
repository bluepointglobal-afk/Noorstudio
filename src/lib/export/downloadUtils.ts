/**
 * Download Utilities
 * Helper functions for downloading generated files
 */

// ============================================
// Types
// ============================================

export type ExportFormat = "pdf" | "epub" | "pdf-print";

export interface DownloadOptions {
  filename: string;
  mimeType?: string;
}

// ============================================
// MIME Types
// ============================================

const MIME_TYPES: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  "pdf-print": "application/pdf",
};

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  pdf: ".pdf",
  epub: ".epub",
  "pdf-print": "-print.pdf",
};

// ============================================
// Helper Functions
// ============================================

/**
 * Sanitize a string for use as a filename
 * Removes special characters and replaces spaces with hyphens
 */
export function sanitizeFilename(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a filename from project title and format
 */
export function generateFilename(
  projectTitle: string,
  format: ExportFormat,
  includeTimestamp = false
): string {
  const sanitized = sanitizeFilename(projectTitle) || "book";
  const extension = FILE_EXTENSIONS[format];

  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split("T")[0];
    return `${sanitized}-${timestamp}${extension}`;
  }

  return `${sanitized}${extension}`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

// ============================================
// Download Functions
// ============================================

/**
 * Download a blob as a file
 * Creates a temporary URL, triggers download, and cleans up
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Create object URL
  const url = URL.createObjectURL(blob);

  // Create anchor element
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  // Append to body, click, and remove
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Clean up object URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Download a PDF file
 */
export function downloadPDF(blob: Blob, projectTitle: string): void {
  const filename = generateFilename(projectTitle, "pdf");
  downloadBlob(blob, filename);
}

/**
 * Download an EPUB file
 */
export function downloadEPUB(blob: Blob, projectTitle: string): void {
  const filename = generateFilename(projectTitle, "epub");
  downloadBlob(blob, filename);
}

/**
 * Download a print-ready PDF file
 */
export function downloadPrintPDF(blob: Blob, projectTitle: string): void {
  const filename = generateFilename(projectTitle, "pdf-print");
  downloadBlob(blob, filename);
}

// ============================================
// Exports
// ============================================

export { MIME_TYPES, FILE_EXTENSIONS };
