/**
 * Compliance Regeneration
 * Triggers re-generation for failed images with enhanced prompts
 */

import {
  ComplianceReport,
  RegenerationRequest,
  RegenerationResult,
  MAX_REGENERATION_ATTEMPTS,
  CheckCategory,
} from "./complianceTypes";

// ============================================
// Storage Keys
// ============================================

const REGEN_METADATA_KEY_PREFIX = "noorstudio_regen_metadata_";

interface RegenerationMetadata {
  imageId: string;
  attemptCount: number;
  previousFailures: string[];
  lastAttemptAt: string;
  originalPrompt?: string;
}

function getMetadataKey(projectId: string, imageId: string): string {
  return `${REGEN_METADATA_KEY_PREFIX}${projectId}_${imageId}`;
}

// ============================================
// Metadata Storage
// ============================================

function loadMetadata(
  projectId: string,
  imageId: string
): RegenerationMetadata | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(getMetadataKey(projectId, imageId));
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as RegenerationMetadata;
  } catch {
    return null;
  }
}

function saveMetadata(
  projectId: string,
  imageId: string,
  metadata: RegenerationMetadata
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      getMetadataKey(projectId, imageId),
      JSON.stringify(metadata)
    );
  } catch {
    console.warn("Failed to save regeneration metadata");
  }
}

function clearMetadata(projectId: string, imageId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(getMetadataKey(projectId, imageId));
  } catch {
    // Ignore errors
  }
}

// ============================================
// Prompt Enhancement
// ============================================

/**
 * Generate enhanced prompt based on compliance failures
 */
function generateEnhancedPrompt(
  originalPrompt: string,
  report: ComplianceReport,
  checksToAddress?: string[]
): string {
  const failedChecks = report.checks.filter((c) => {
    if (!c.passed) {
      if (checksToAddress && checksToAddress.length > 0) {
        return checksToAddress.includes(c.id);
      }
      return true;
    }
    return false;
  });

  if (failedChecks.length === 0) {
    return originalPrompt;
  }

  const enhancements: string[] = [];
  const negatives: string[] = [];

  // Group failures by category
  const byCategory = new Map<CheckCategory, typeof failedChecks>();
  for (const check of failedChecks) {
    const existing = byCategory.get(check.category) || [];
    existing.push(check);
    byCategory.set(check.category, existing);
  }

  // Handle character issues
  const characterIssues = byCategory.get("character");
  if (characterIssues && characterIssues.length > 0) {
    enhancements.push(
      "[CRITICAL CHARACTER FIX] Ensure exact character appearance as specified. Do not deviate from character description."
    );
    negatives.push("wrong character", "different appearance", "mixed features");
  }

  // Handle modesty issues
  const modestyIssues = byCategory.get("modesty");
  if (modestyIssues && modestyIssues.length > 0) {
    enhancements.push(
      "[MANDATORY MODESTY FIX] All female characters MUST wear hijab covering hair completely. Full modest clothing required."
    );
    negatives.push("exposed hair", "revealing clothing", "immodest");
  }

  // Handle style issues
  const styleIssues = byCategory.get("style");
  if (styleIssues && styleIssues.length > 0) {
    enhancements.push(
      "[STYLE CONSISTENCY FIX] Maintain exact art style. Match previous illustrations precisely."
    );
    negatives.push("inconsistent style", "different art style", "style drift");
  }

  // Handle content issues
  const contentIssues = byCategory.get("content");
  if (contentIssues && contentIssues.length > 0) {
    // Check for text-related issues
    const hasTextIssue = contentIssues.some((c) => c.id.includes("text"));
    if (hasTextIssue) {
      enhancements.push(
        "[NO TEXT FIX] Generate image with ABSOLUTELY NO TEXT, LETTERS, WORDS, or NUMBERS visible anywhere."
      );
      negatives.push(
        "text",
        "letters",
        "words",
        "numbers",
        "writing",
        "signage"
      );
    }
  }

  // Handle technical issues
  const technicalIssues = byCategory.get("technical");
  if (technicalIssues && technicalIssues.length > 0) {
    const dimensionIssue = technicalIssues.find((c) =>
      c.id.includes("dimension")
    );
    if (dimensionIssue) {
      enhancements.push("[DIMENSION FIX] Generate at correct aspect ratio.");
    }
  }

  // Build enhanced prompt
  let enhanced = originalPrompt;

  // Add enhancement block at the beginning
  if (enhancements.length > 0) {
    enhanced = `${enhancements.join("\n\n")}\n\n---\n\n${enhanced}`;
  }

  // Add negative prompt reinforcement at the end
  if (negatives.length > 0) {
    enhanced = `${enhanced}\n\n[NEGATIVE - MUST AVOID]: ${negatives.join(", ")}`;
  }

  // Add attempt marker
  enhanced = `[REGENERATION ATTEMPT - FIXING PREVIOUS ISSUES]\n\n${enhanced}`;

  return enhanced;
}

/**
 * Generate additional negative prompt items based on failures
 */
function generateAdditionalNegatives(report: ComplianceReport): string[] {
  const negatives: string[] = [];

  for (const check of report.checks) {
    if (!check.passed) {
      switch (check.category) {
        case "character":
          negatives.push(
            "wrong character",
            "different face",
            "wrong features"
          );
          break;
        case "modesty":
          negatives.push(
            "exposed hair",
            "no hijab",
            "revealing",
            "immodest clothing"
          );
          break;
        case "style":
          negatives.push(
            "inconsistent style",
            "wrong art style",
            "photorealistic"
          );
          break;
        case "content":
          if (check.id.includes("text")) {
            negatives.push(
              "text",
              "letters",
              "words",
              "writing",
              "typography"
            );
          }
          break;
      }
    }
  }

  // Deduplicate
  return [...new Set(negatives)];
}

// ============================================
// Regeneration Triggers
// ============================================

/**
 * Check if regeneration is possible and prepare enhanced prompt
 */
export function triggerRegeneration(
  request: RegenerationRequest
): RegenerationResult {
  const { projectId, imageId, report, checksToAddress, force } = request;

  // Load existing metadata
  let metadata = loadMetadata(projectId, imageId);

  if (!metadata) {
    metadata = {
      imageId,
      attemptCount: 0,
      previousFailures: [],
      lastAttemptAt: new Date().toISOString(),
      originalPrompt: report.originalPrompt,
    };
  }

  // Check attempt limit
  if (!force && metadata.attemptCount >= MAX_REGENERATION_ATTEMPTS) {
    return {
      canRegenerate: false,
      reason: `Maximum regeneration attempts (${MAX_REGENERATION_ATTEMPTS}) reached. Manual review required.`,
      attemptNumber: metadata.attemptCount,
      maxAttempts: MAX_REGENERATION_ATTEMPTS,
    };
  }

  // Record current failures
  const currentFailures = report.checks
    .filter((c) => !c.passed)
    .map((c) => `${c.id}: ${c.message}`);

  // Check if we're stuck in a loop (same failures repeated)
  if (!force && metadata.previousFailures.length > 0) {
    const sameFailures = currentFailures.every((f) =>
      metadata!.previousFailures.includes(f)
    );
    if (sameFailures && metadata.attemptCount >= 2) {
      return {
        canRegenerate: false,
        reason:
          "Same failures persist after multiple attempts. Different approach needed.",
        attemptNumber: metadata.attemptCount,
        maxAttempts: MAX_REGENERATION_ATTEMPTS,
      };
    }
  }

  // Generate enhanced prompt
  const originalPrompt = report.originalPrompt || metadata.originalPrompt || "";
  const enhancedPrompt = generateEnhancedPrompt(
    originalPrompt,
    report,
    checksToAddress
  );
  const additionalNegatives = generateAdditionalNegatives(report);

  // Update metadata
  metadata.attemptCount += 1;
  metadata.previousFailures = currentFailures;
  metadata.lastAttemptAt = new Date().toISOString();
  saveMetadata(projectId, imageId, metadata);

  return {
    canRegenerate: true,
    enhancedPrompt,
    additionalNegatives,
    attemptNumber: metadata.attemptCount,
    maxAttempts: MAX_REGENERATION_ATTEMPTS,
  };
}

/**
 * Reset regeneration attempts for an image
 */
export function resetRegenerationAttempts(
  projectId: string,
  imageId: string
): void {
  clearMetadata(projectId, imageId);
}

/**
 * Get current regeneration status for an image
 */
export function getRegenerationStatus(
  projectId: string,
  imageId: string
): {
  attemptCount: number;
  maxAttempts: number;
  canRegenerate: boolean;
  lastAttemptAt?: string;
} {
  const metadata = loadMetadata(projectId, imageId);

  if (!metadata) {
    return {
      attemptCount: 0,
      maxAttempts: MAX_REGENERATION_ATTEMPTS,
      canRegenerate: true,
    };
  }

  return {
    attemptCount: metadata.attemptCount,
    maxAttempts: MAX_REGENERATION_ATTEMPTS,
    canRegenerate: metadata.attemptCount < MAX_REGENERATION_ATTEMPTS,
    lastAttemptAt: metadata.lastAttemptAt,
  };
}

/**
 * Get detailed failure history for an image
 */
export function getFailureHistory(
  projectId: string,
  imageId: string
): string[] {
  const metadata = loadMetadata(projectId, imageId);
  return metadata?.previousFailures || [];
}
