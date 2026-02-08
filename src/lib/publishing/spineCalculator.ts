/**
 * Spine Width Calculator
 * Calculate spine width for KDP and other print-on-demand services
 * Based on KDP's official formulas
 */

import {
  SpineCalculationInput,
  SpineCalculationResult,
  KDPCoverSpecs,
} from "./types";

// ============================================
// KDP Spine Width Constants
// ============================================

// Pages Per Inch (PPI) for different paper types
// Source: KDP Cover Calculator specifications
const PPI_TABLE = {
  white: {
    blackAndWhite: 442,  // B&W on white paper
    color: 220,          // Color on white paper
  },
  cream: {
    blackAndWhite: 476,  // B&W on cream paper
    color: 0,            // Cream doesn't support color
  },
};

// Minimum spine width requirements
const MIN_SPINE_WIDTH = 0.06; // inches (below this, spine is too thin for text)

// ============================================
// Spine Width Calculation
// ============================================

/**
 * Calculate spine width using KDP formula
 * Formula: Spine Width = (Page Count / PPI) + binding adjustment
 */
export function calculateSpineWidth(input: SpineCalculationInput): SpineCalculationResult {
  const { pageCount, paperType, bindingType, color } = input;
  
  // Get PPI based on paper type and color
  let ppi: number;
  
  if (paperType === "cream") {
    if (color) {
      throw new Error("Cream paper does not support color printing on KDP");
    }
    ppi = PPI_TABLE.cream.blackAndWhite;
  } else {
    ppi = color ? PPI_TABLE.white.color : PPI_TABLE.white.blackAndWhite;
  }
  
  // Calculate base spine width
  const bulkFactor = pageCount / ppi;
  
  // Add binding adjustment (perfect binding adds slight thickness)
  const bindingAdjustment = bindingType === "perfect" ? 0.0025 : 0;
  
  const spineWidth = bulkFactor + bindingAdjustment;
  
  // Round to 4 decimal places
  const roundedSpineWidth = Math.round(spineWidth * 10000) / 10000;
  
  // Generate notes
  const notes: string[] = [];
  
  if (roundedSpineWidth < MIN_SPINE_WIDTH) {
    notes.push(`Spine width (${roundedSpineWidth}") is below minimum (${MIN_SPINE_WIDTH}"). Consider increasing page count or avoid placing text on spine.`);
  }
  
  if (pageCount < 24) {
    notes.push("Page count is very low. KDP requires minimum 24 pages for paperback.");
  }
  
  if (pageCount > 828) {
    notes.push("Page count exceeds KDP's maximum of 828 pages for paperback.");
  }
  
  return {
    spineWidth: roundedSpineWidth,
    ppi,
    bulkFactor,
    notes: notes.join(" "),
  };
}

// ============================================
// KDP Cover Specifications Generator
// ============================================

/**
 * Generate complete KDP cover specifications with dimensions
 */
export function generateKDPCoverSpecs(
  trimWidth: number,
  trimHeight: number,
  pageCount: number,
  paperType: "white" | "cream" = "white",
  bindingType: "perfect" | "casewrap" = "perfect",
  color: boolean = false
): KDPCoverSpecs {
  // Calculate spine width
  const spineCalc = calculateSpineWidth({
    pageCount,
    paperType,
    bindingType,
    color,
  });
  
  const spineWidth = spineCalc.spineWidth;
  
  // KDP bleed size is always 0.125 inches
  const bleedSize = 0.125;
  
  // Safe zone (minimum distance from trim edge for important content)
  const safeZoneInset = 0.125;
  
  // Calculate total cover dimensions
  // Total Width = Bleed + Back Cover + Spine + Front Cover + Bleed
  const totalWidth = (bleedSize * 2) + (trimWidth * 2) + spineWidth;
  
  // Total Height = Bleed + Height + Bleed
  const totalHeight = (bleedSize * 2) + trimHeight;
  
  // Calculate positions (from left edge)
  const backCoverX = bleedSize;                          // Back cover starts after left bleed
  const spineX = bleedSize + trimWidth;                  // Spine starts after back cover
  const frontCoverX = bleedSize + trimWidth + spineWidth; // Front cover starts after spine
  
  return {
    trimWidth,
    trimHeight,
    pageCount,
    paperType,
    bindingType,
    spineWidth,
    bleedSize,
    totalWidth,
    totalHeight,
    frontCoverX,
    backCoverX,
    spineX,
    safeZoneInset,
  };
}

// ============================================
// Common Trim Sizes
// ============================================

export const KDP_TRIM_SIZES = {
  "6x9": { width: 6, height: 9 },
  "7x10": { width: 7, height: 10 },
  "8.5x11": { width: 8.5, height: 11 },
  "5x8": { width: 5, height: 8 },
  "5.5x8.5": { width: 5.5, height: 8.5 },
  "8x10": { width: 8, height: 10 },
  "6x9-landscape": { width: 9, height: 6 },
} as const;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate if page count is within KDP limits
 */
export function validatePageCount(pageCount: number): { valid: boolean; message?: string } {
  if (pageCount < 24) {
    return { valid: false, message: "KDP requires minimum 24 pages for paperback" };
  }
  
  if (pageCount > 828) {
    return { valid: false, message: "KDP's maximum page count is 828 pages for paperback" };
  }
  
  return { valid: true };
}

/**
 * Validate trim size
 */
export function validateTrimSize(width: number, height: number): { valid: boolean; message?: string } {
  // KDP supported trim sizes (comprehensive list)
  const supportedSizes = [
    [5, 8], [5.25, 8], [5.5, 8.5], [6, 9],
    [6.14, 9.21], [6.69, 9.61], [7, 10],
    [7.44, 9.69], [7.5, 9.25], [8, 10],
    [8.25, 11], [8.5, 11],
  ];
  
  const isSupported = supportedSizes.some(
    ([w, h]) => Math.abs(w - width) < 0.01 && Math.abs(h - height) < 0.01
  );
  
  if (!isSupported) {
    return { 
      valid: false, 
      message: `Trim size ${width}x${height}" is not a standard KDP size. Common sizes: 6x9", 7x10", 8.5x11"` 
    };
  }
  
  return { valid: true };
}

// ============================================
// Helper: Convert to DPI Pixels
// ============================================

/**
 * Convert inches to pixels at 300 DPI (standard for print)
 */
export function inchesToPixels(inches: number, dpi: number = 300): number {
  return Math.round(inches * dpi);
}

/**
 * Get KDP cover dimensions in pixels at 300 DPI
 */
export function getKDPCoverPixelDimensions(specs: KDPCoverSpecs, dpi: number = 300) {
  return {
    width: inchesToPixels(specs.totalWidth, dpi),
    height: inchesToPixels(specs.totalHeight, dpi),
    spine: {
      x: inchesToPixels(specs.spineX, dpi),
      width: inchesToPixels(specs.spineWidth, dpi),
    },
    frontCover: {
      x: inchesToPixels(specs.frontCoverX, dpi),
      width: inchesToPixels(specs.trimWidth, dpi),
    },
    backCover: {
      x: inchesToPixels(specs.backCoverX, dpi),
      width: inchesToPixels(specs.trimWidth, dpi),
    },
    bleed: inchesToPixels(specs.bleedSize, dpi),
    safeZone: inchesToPixels(specs.safeZoneInset, dpi),
  };
}

// ============================================
// Exports
// ============================================

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
};
