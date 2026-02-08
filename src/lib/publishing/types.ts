/**
 * Publishing Types
 * Types for KDP, Lulu, and other publishing platforms
 */

// ============================================
// ISBN Management
// ============================================

export interface ISBNRecord {
  isbn13: string;           // 13-digit ISBN
  isbn10?: string;          // 10-digit ISBN (optional)
  format: "ebook" | "paperback" | "hardcover" | "audiobook";
  platform?: "kdp" | "lulu" | "apple" | "universal";
  assignedDate: string;
  projectId: string;
  notes?: string;
}

export interface ISBNManager {
  records: ISBNRecord[];
  getISBN(format: ISBNRecord["format"], platform?: string): ISBNRecord | null;
  addISBN(record: ISBNRecord): void;
  validateISBN(isbn: string): boolean;
}

// ============================================
// KDP Types
// ============================================

export interface KDPCoverSpecs {
  trimWidth: number;        // inches
  trimHeight: number;       // inches
  pageCount: number;
  paperType: "white" | "cream";
  bindingType: "perfect" | "casewrap";
  spineWidth: number;       // inches (calculated)
  bleedSize: number;        // inches (0.125" for KDP)
  totalWidth: number;       // front + spine + back + bleed
  totalHeight: number;      // height + bleed
  frontCoverX: number;      // x position for front cover
  backCoverX: number;       // x position for back cover
  spineX: number;          // x position for spine
  safeZoneInset: number;   // 0.125" from trim edge
}

export interface KDPInteriorSpecs {
  trimWidth: number;
  trimHeight: number;
  margins: {
    top: number;
    bottom: number;
    inside: number;      // gutter margin
    outside: number;
  };
  bleed: boolean;
  paperType: "white" | "cream";
}

export interface KDPMetadata {
  title: string;
  subtitle?: string;
  author: string;
  contributors?: Array<{ name: string; role: string }>;
  description: string;
  keywords: string[];
  categories: string[];   // BISAC categories
  language: string;
  publicationDate?: string;
  isbn?: string;
  ageRange?: { min: number; max: number };
  gradeRange?: string;
}

// ============================================
// Lulu Types
// ============================================

export interface LuluInteriorSpecs {
  trimWidth: number;       // inches
  trimHeight: number;      // inches
  margins: {
    top: number;
    bottom: number;
    inside: number;
    outside: number;
  };
  bindingType: "perfect" | "saddle-stitch" | "coil";
  paperWeight: "60lb" | "70lb" | "80lb";
  color: boolean;          // true for color, false for B&W
  headers: boolean;
  footers: boolean;
}

export interface LuluHeaderFooterConfig {
  headerLeft?: string;     // e.g., "Chapter Title"
  headerCenter?: string;
  headerRight?: string;
  footerLeft?: string;     // e.g., "Author Name"
  footerCenter?: string;   // e.g., page number
  footerRight?: string;
  font: string;
  fontSize: number;
  alternateLeftRight: boolean;  // Different headers for left/right pages
}

// ============================================
// Apple Books Types
// ============================================

export interface AppleBooksMetadata {
  title: string;
  author: string;
  language: string;
  isbn?: string;
  publisher?: string;
  publicationDate?: string;
  subjects?: string[];     // Apple Books categories
  description?: string;
  coverImagePath?: string; // Must be RGB JPEG or PNG
  
  // Apple-specific requirements
  ibooks: {
    version?: string;
    specifiedFonts?: boolean;
    respectImageSizeClass?: boolean;
  };
}

// ============================================
// Publishing Export Configuration
// ============================================

export interface PublishingConfig {
  platform: "kdp" | "lulu" | "apple" | "universal";
  format: "epub" | "pdf";
  
  // Common settings
  trimSize: "6x9" | "7x10" | "8.5x11" | "5x8" | "5.5x8.5";
  includeBleed: boolean;
  colorMode: "color" | "grayscale";
  
  // KDP-specific
  kdp?: {
    paperType: "white" | "cream";
    bindingType: "perfect" | "casewrap";
    includeISBN: boolean;
  };
  
  // Lulu-specific
  lulu?: {
    bindingType: "perfect" | "saddle-stitch" | "coil";
    paperWeight: "60lb" | "70lb" | "80lb";
    headerFooter: LuluHeaderFooterConfig;
  };
  
  // Apple Books-specific
  apple?: {
    fixedLayout: boolean;
    specifiedFonts: boolean;
    coverAspectRatio: "square" | "portrait";
  };
}

// ============================================
// Export Results
// ============================================

export interface PublishingExportResult {
  blob: Blob;
  filename: string;
  format: "epub" | "pdf";
  platform: string;
  specs: KDPCoverSpecs | KDPInteriorSpecs | LuluInteriorSpecs;
  metadata: {
    pageCount: number;
    fileSize: number;
    isbn?: string;
    generatedAt: string;
  };
  validation: {
    passed: boolean;
    warnings: string[];
    errors: string[];
  };
}

export interface PublishingExportProgress {
  stage: string;
  current: number;
  total: number;
  message: string;
}

// ============================================
// Spine Width Calculation
// ============================================

export interface SpineCalculationInput {
  pageCount: number;
  paperType: "white" | "cream";
  bindingType: "perfect" | "casewrap";
  color: boolean;
}

export interface SpineCalculationResult {
  spineWidth: number;       // in inches
  ppi: number;              // pages per inch
  bulkFactor: number;
  notes: string;
}
