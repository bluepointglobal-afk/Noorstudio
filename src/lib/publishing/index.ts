/**
 * Publishing Module
 * Complete publishing pipeline for KDP, Lulu, and Apple Books
 */

// Types
export * from "./types";

// ISBN Management
export {
  ISBNManagerImpl,
  validateISBN13,
  validateISBN10,
  isbn10ToISBN13,
  formatISBN,
  saveISBNs,
  loadISBNs,
} from "./isbnManager";
export type { ISBNRecord, ISBNManager } from "./types";

// Spine Calculator
export {
  calculateSpineWidth,
  generateKDPCoverSpecs,
  validatePageCount,
  validateTrimSize,
  inchesToPixels,
  getKDPCoverPixelDimensions,
  KDP_TRIM_SIZES,
  MIN_SPINE_WIDTH,
  PPI_TABLE,
} from "./spineCalculator";
export type {
  SpineCalculationInput,
  SpineCalculationResult,
  KDPCoverSpecs,
} from "./types";

// EPUB 3.3 Generator
export {
  generateEPUB33,
} from "./epub33Generator";
export type {
  EPUB33GeneratorInput,
  EPUB33GeneratorResult,
} from "./epub33Generator";

// KDP PDF Generator
export {
  generateKDPPDF,
  generateInteriorPDF,
  generateCoverPDF,
  KDP_BLEED,
  KDP_MARGINS,
} from "./kdpPDFGenerator";
export type {
  KDPPDFGeneratorInput,
  KDPPDFGeneratorResult,
} from "./kdpPDFGenerator";

// Lulu PDF Generator
export {
  generateLuluPDF,
  LULU_MARGINS,
  DEFAULT_HEADER_FOOTER,
} from "./luluPDFGenerator";
export type {
  LuluPDFGeneratorInput,
  LuluPDFGeneratorResult,
} from "./luluPDFGenerator";

// Export unified publishing function
export { publishBook } from "./publishBook";
