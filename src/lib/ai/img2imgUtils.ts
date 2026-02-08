// IMG2IMG Utility Functions
// Helper functions for managing character consistency references across illustrations

import { IllustrationArtifactItem } from "@/lib/types/artifacts";
import { StoredProject } from "@/lib/storage/projectsStore";

/**
 * Extract the character consistency reference from a project's illustrations.
 * This is typically the first chapter's illustration.
 */
export function getCharacterConsistencyReference(
  illustrations: IllustrationArtifactItem[]
): string | undefined {
  // Find the first chapter illustration
  const firstChapter = illustrations.find((ill) => ill.chapterNumber === 1);
  
  if (!firstChapter) {
    return undefined;
  }

  // Get the selected variant's image URL
  const selectedVariant = firstChapter.variants?.find(
    (v) => v.id === firstChapter.selectedVariantId
  );

  return selectedVariant?.imageUrl || firstChapter.imageUrl;
}

/**
 * Check if a project has a valid character consistency reference.
 */
export function hasCharacterConsistencyReference(
  illustrations: IllustrationArtifactItem[]
): boolean {
  return !!getCharacterConsistencyReference(illustrations);
}

/**
 * Build enhanced references array with character consistency reference.
 * Prepends the first chapter illustration to the references for img2img.
 */
export function buildEnhancedReferences(
  baseReferences: string[],
  characterReference: string | undefined,
  isFirstChapter: boolean
): string[] {
  // Don't add character reference for the first chapter (it's being generated)
  if (isFirstChapter || !characterReference) {
    return baseReferences;
  }

  // Prepend character reference for priority
  return [characterReference, ...baseReferences];
}

/**
 * Calculate optimal reference strength based on chapter position and mode.
 */
export function calculateReferenceStrength(
  chapterNumber: number,
  hasCharacterReference: boolean
): number {
  // First chapter: Use standard strength with just pose sheets
  if (chapterNumber === 1) {
    return 0.85;
  }

  // Subsequent chapters with img2img: Use higher strength for consistency
  if (hasCharacterReference) {
    return 0.95;
  }

  // Fallback: Standard strength
  return 0.85;
}

/**
 * Get illustration statistics for debugging and monitoring.
 */
export interface IllustrationStats {
  totalIllustrations: number;
  illustrationsWithReference: number;
  averageVariantsPerIllustration: number;
  consistencyReferenceUrl?: string;
  globalSeed?: number;
}

export function getIllustrationStats(
  illustrations: IllustrationArtifactItem[]
): IllustrationStats {
  const totalIllustrations = illustrations.length;
  
  // Count illustrations that have the character reference in their references array
  const consistencyReference = getCharacterConsistencyReference(illustrations);
  const illustrationsWithReference = illustrations.filter(
    (ill) => ill.references?.includes(consistencyReference || "")
  ).length;

  // Calculate average variants
  const totalVariants = illustrations.reduce(
    (sum, ill) => sum + (ill.variants?.length || 0),
    0
  );
  const averageVariantsPerIllustration = totalIllustrations > 0 
    ? totalVariants / totalIllustrations 
    : 0;

  // Get the global seed from the first illustration
  const globalSeed = illustrations[0]?.variants?.[0]?.seed;

  return {
    totalIllustrations,
    illustrationsWithReference,
    averageVariantsPerIllustration,
    consistencyReferenceUrl: consistencyReference,
    globalSeed,
  };
}

/**
 * Validate that illustrations have proper img2img setup.
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export function validateImg2ImgSetup(
  illustrations: IllustrationArtifactItem[]
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (illustrations.length === 0) {
    issues.push("No illustrations found");
    return { valid: false, issues, warnings };
  }

  // Check if first chapter exists
  const firstChapter = illustrations.find((ill) => ill.chapterNumber === 1);
  if (!firstChapter) {
    issues.push("First chapter illustration is missing");
  }

  // Check if first chapter has a valid image
  const consistencyRef = getCharacterConsistencyReference(illustrations);
  if (!consistencyRef) {
    issues.push("Character consistency reference is missing or invalid");
  }

  // Check subsequent chapters for references
  const subsequentChapters = illustrations.filter((ill) => ill.chapterNumber > 1);
  for (const ill of subsequentChapters) {
    if (!ill.references || ill.references.length === 0) {
      warnings.push(`Chapter ${ill.chapterNumber} has no references`);
    } else if (consistencyRef && !ill.references.includes(consistencyRef)) {
      warnings.push(
        `Chapter ${ill.chapterNumber} doesn't include character consistency reference`
      );
    }
  }

  // Check for seed consistency
  const seeds = illustrations
    .flatMap((ill) => ill.variants || [])
    .map((v) => v.seed)
    .filter((s) => s !== undefined);
  
  const uniqueSeeds = new Set(seeds);
  if (uniqueSeeds.size > 1) {
    warnings.push(
      `Multiple seeds detected (${uniqueSeeds.size} unique seeds). This may reduce consistency.`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Create a diagnostic report for img2img implementation.
 */
export function createDiagnosticReport(
  illustrations: IllustrationArtifactItem[]
): string {
  const stats = getIllustrationStats(illustrations);
  const validation = validateImg2ImgSetup(illustrations);

  const lines: string[] = [
    "=== IMG2IMG Diagnostic Report ===",
    "",
    "Statistics:",
    `  Total Illustrations: ${stats.totalIllustrations}`,
    `  Using Character Reference: ${stats.illustrationsWithReference}`,
    `  Average Variants per Illustration: ${stats.averageVariantsPerIllustration.toFixed(1)}`,
    `  Global Seed: ${stats.globalSeed || "Not set"}`,
    `  Character Reference URL: ${stats.consistencyReferenceUrl ? stats.consistencyReferenceUrl.substring(0, 60) + "..." : "Not set"}`,
    "",
  ];

  if (validation.valid) {
    lines.push("✅ Validation: PASSED");
  } else {
    lines.push("❌ Validation: FAILED");
    lines.push("");
    lines.push("Issues:");
    validation.issues.forEach((issue) => lines.push(`  - ${issue}`));
  }

  if (validation.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    validation.warnings.forEach((warning) => lines.push(`  - ${warning}`));
  }

  lines.push("");
  lines.push("Per-Chapter Details:");
  illustrations.forEach((ill) => {
    const hasCharRef = stats.consistencyReferenceUrl 
      ? ill.references?.includes(stats.consistencyReferenceUrl)
      : false;
    const refCount = ill.references?.length || 0;
    const variantCount = ill.variants?.length || 0;
    const seed = ill.variants?.[0]?.seed || "N/A";
    
    lines.push(
      `  Chapter ${ill.chapterNumber}: ${variantCount} variants, ${refCount} refs, ` +
      `seed=${seed}, img2img=${hasCharRef ? "✓" : "✗"}`
    );
  });

  return lines.join("\n");
}
