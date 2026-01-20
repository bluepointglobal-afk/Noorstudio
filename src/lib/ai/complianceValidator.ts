/**
 * Compliance Validator
 * Post-generation validation for covers and illustrations
 */

import {
  ComplianceCheck,
  ComplianceReport,
  ComplianceStatus,
  ValidationInput,
  ValidationOutput,
  CheckCategory,
  CheckSeverity,
  CHECK_WEIGHTS,
  SEVERITY_THRESHOLDS,
} from "./complianceTypes";
import { CoverComplianceRules, IllustrationComplianceRules, CharacterAnchor } from "./complianceGuard";

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createCheck(
  id: string,
  name: string,
  category: CheckCategory,
  passed: boolean,
  severity: CheckSeverity,
  message: string,
  suggestion?: string
): ComplianceCheck {
  return {
    id,
    name,
    category,
    passed,
    severity,
    message,
    suggestion,
    weight: CHECK_WEIGHTS[id] || 5,
  };
}

// ============================================
// Image Metadata Validation
// ============================================

/**
 * Load image and get its dimensions
 */
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = imageUrl;
  });
}

/**
 * Check if dimensions match expected (with tolerance)
 */
function checkDimensions(
  actual: { width: number; height: number },
  expected: { width: number; height: number; tolerance?: number }
): ComplianceCheck {
  const tolerance = expected.tolerance || 5; // 5% default tolerance
  const widthDiff = Math.abs(actual.width - expected.width) / expected.width * 100;
  const heightDiff = Math.abs(actual.height - expected.height) / expected.height * 100;

  const passed = widthDiff <= tolerance && heightDiff <= tolerance;

  return createCheck(
    "dimensions",
    "Image Dimensions",
    "technical",
    passed,
    passed ? "info" : "warning",
    passed
      ? `Dimensions match: ${actual.width}x${actual.height}`
      : `Dimension mismatch: got ${actual.width}x${actual.height}, expected ${expected.width}x${expected.height}`,
    passed ? undefined : "Consider regenerating with correct dimensions"
  );
}

/**
 * Check image orientation
 */
function checkOrientation(
  dimensions: { width: number; height: number },
  expectedPortrait: boolean
): ComplianceCheck {
  const isPortrait = dimensions.height > dimensions.width;
  const passed = isPortrait === expectedPortrait;

  return createCheck(
    "orientation",
    "Image Orientation",
    "technical",
    passed,
    passed ? "info" : "warning",
    passed
      ? `Correct orientation: ${isPortrait ? "portrait" : "landscape"}`
      : `Wrong orientation: got ${isPortrait ? "portrait" : "landscape"}, expected ${expectedPortrait ? "portrait" : "landscape"}`,
    passed ? undefined : "Regenerate with correct orientation specified"
  );
}

// ============================================
// Prompt Compliance Checks
// ============================================

/**
 * Check if compliance markers were present in enhanced prompt
 */
function checkPromptCompliance(
  enhancedPrompt: string | undefined,
  markers: string[]
): ComplianceCheck {
  if (!enhancedPrompt) {
    return createCheck(
      "prompt-applied",
      "Compliance Prompt Applied",
      "technical",
      false,
      "warning",
      "No enhanced prompt available - compliance markers may not have been applied",
      "Ensure compliance enforcement was run before generation"
    );
  }

  const missingMarkers = markers.filter(
    (marker) => !enhancedPrompt.toLowerCase().includes(marker.toLowerCase())
  );

  const passed = missingMarkers.length === 0;

  return createCheck(
    "prompt-applied",
    "Compliance Prompt Applied",
    "technical",
    passed,
    passed ? "info" : "warning",
    passed
      ? "All compliance markers present in prompt"
      : `Missing compliance markers: ${missingMarkers.join(", ")}`,
    passed ? undefined : "Re-run compliance enforcement on prompt"
  );
}

/**
 * Check that no-text requirement was specified
 */
function checkNoTextRequirement(enhancedPrompt: string | undefined): ComplianceCheck {
  const noTextMarkers = ["no text", "no words", "no letters", "leave blank space"];

  if (!enhancedPrompt) {
    return createCheck(
      "no-text",
      "No-Text Requirement",
      "content",
      false,
      "error",
      "Cannot verify no-text requirement - no enhanced prompt available",
      "Ensure compliance prompt includes no-text instructions"
    );
  }

  const hasNoTextInstruction = noTextMarkers.some(
    (marker) => enhancedPrompt.toLowerCase().includes(marker)
  );

  return createCheck(
    "no-text",
    "No-Text Requirement",
    "content",
    hasNoTextInstruction,
    hasNoTextInstruction ? "info" : "error",
    hasNoTextInstruction
      ? "No-text requirement was specified in prompt"
      : "No-text requirement may not have been properly specified",
    hasNoTextInstruction ? undefined : "Add explicit no-text instructions to prompt"
  );
}

// ============================================
// Character Consistency Checks
// ============================================

/**
 * Validate character consistency based on prompt and anchors
 */
export function validateCharacterConsistency(
  sceneCharacterIds: string[],
  anchors: CharacterAnchor[],
  enhancedPrompt?: string
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Check character count
  const expectedCount = sceneCharacterIds.length;
  const anchoredCount = anchors.filter((a) =>
    sceneCharacterIds.includes(a.characterId)
  ).length;

  checks.push(
    createCheck(
      "character-count",
      "Character Count",
      "character",
      anchoredCount === expectedCount,
      anchoredCount === expectedCount ? "info" : "warning",
      `${anchoredCount}/${expectedCount} characters have anchors defined`,
      anchoredCount < expectedCount
        ? "Add missing character references for consistency"
        : undefined
    )
  );

  // Check each character's identity was specified
  for (const charId of sceneCharacterIds) {
    const anchor = anchors.find((a) => a.characterId === charId);

    if (anchor) {
      // Check if character identity was in prompt
      const identityInPrompt = enhancedPrompt?.includes(anchor.characterName) || false;

      checks.push(
        createCheck(
          `character-identity-${charId}`,
          `Character Identity: ${anchor.characterName}`,
          "character",
          identityInPrompt,
          identityInPrompt ? "info" : "warning",
          identityInPrompt
            ? `Character "${anchor.characterName}" identity specified in prompt`
            : `Character "${anchor.characterName}" identity may not be properly specified`,
          identityInPrompt ? undefined : "Ensure character identity block was added to prompt"
        )
      );

      // Check modesty requirements
      if (anchor.hijabRequired) {
        const hijabInPrompt = enhancedPrompt?.toLowerCase().includes("hijab") || false;

        checks.push(
          createCheck(
            `modesty-hijab-${charId}`,
            `Hijab Requirement: ${anchor.characterName}`,
            "modesty",
            hijabInPrompt,
            hijabInPrompt ? "info" : "error",
            hijabInPrompt
              ? `Hijab requirement specified for "${anchor.characterName}"`
              : `CRITICAL: Hijab requirement may be missing for "${anchor.characterName}"`,
            hijabInPrompt ? undefined : "Add mandatory hijab instruction for this character"
          )
        );
      }
    }
  }

  // Check style consistency
  const styleInPrompt = enhancedPrompt?.toLowerCase().includes("style") || false;

  checks.push(
    createCheck(
      "style-consistency",
      "Style Consistency",
      "style",
      styleInPrompt,
      styleInPrompt ? "info" : "warning",
      styleInPrompt
        ? "Art style specification found in prompt"
        : "Art style may not be properly specified",
      styleInPrompt ? undefined : "Add explicit style lock to prompt"
    )
  );

  return checks;
}

// ============================================
// Cover Validation
// ============================================

/**
 * Validate a generated cover image
 */
export async function validateCoverImage(
  input: ValidationInput,
  rules: CoverComplianceRules
): Promise<ValidationOutput> {
  const checks: ComplianceCheck[] = [];

  // Get image dimensions
  const dimensions = await getImageDimensions(input.imageUrl);

  if (dimensions) {
    // Check dimensions if expected
    if (input.expectedDimensions) {
      checks.push(checkDimensions(dimensions, input.expectedDimensions));
    }

    // Covers should be portrait (2:3 ratio)
    checks.push(checkOrientation(dimensions, true));
  } else {
    checks.push(
      createCheck(
        "image-load",
        "Image Loading",
        "technical",
        false,
        "error",
        "Failed to load image for validation",
        "Verify image URL is accessible"
      )
    );
  }

  // Check prompt compliance
  const coverMarkers = ["NO TEXT", "CRITICAL COMPLIANCE", "LEAVE BLANK SPACE"];
  checks.push(checkPromptCompliance(input.enhancedPrompt, coverMarkers));
  checks.push(checkNoTextRequirement(input.enhancedPrompt));

  // Check style specification
  checks.push(
    createCheck(
      "style-lock",
      "Style Lock",
      "style",
      input.enhancedPrompt?.includes(rules.primaryStyleId) || false,
      input.enhancedPrompt?.includes(rules.primaryStyleId) ? "info" : "warning",
      input.enhancedPrompt?.includes(rules.primaryStyleId)
        ? `Style lock applied: ${rules.primaryStyleId}`
        : `Style lock may not be applied for ${rules.primaryStyleId}`,
      undefined
    )
  );

  // Generate report
  const report = generateComplianceReport(
    input.imageUrl,
    "cover",
    checks,
    input.originalPrompt,
    input.enhancedPrompt
  );

  return {
    report,
    shouldFlag: report.status === "failed" || report.status === "warning",
    shouldRegenerate: report.status === "failed",
    summary: generateSummary(report),
  };
}

// ============================================
// Illustration Validation
// ============================================

/**
 * Validate a generated illustration image
 */
export async function validateIllustrationImage(
  input: ValidationInput,
  rules: IllustrationComplianceRules
): Promise<ValidationOutput> {
  const checks: ComplianceCheck[] = [];

  // Get image dimensions
  const dimensions = await getImageDimensions(input.imageUrl);

  if (dimensions) {
    // Check dimensions if expected
    if (input.expectedDimensions) {
      checks.push(checkDimensions(dimensions, input.expectedDimensions));
    }
  } else {
    checks.push(
      createCheck(
        "image-load",
        "Image Loading",
        "technical",
        false,
        "error",
        "Failed to load image for validation",
        "Verify image URL is accessible"
      )
    );
  }

  // Check prompt compliance
  const illustrationMarkers = ["CHARACTER IDENTITY LOCK", "ILLUSTRATION QUALITY"];
  checks.push(checkPromptCompliance(input.enhancedPrompt, illustrationMarkers));
  checks.push(checkNoTextRequirement(input.enhancedPrompt));

  // Check character consistency
  if (input.expectedCharacterIds && input.expectedCharacterIds.length > 0) {
    const characterChecks = validateCharacterConsistency(
      input.expectedCharacterIds,
      rules.characterAnchors,
      input.enhancedPrompt
    );
    checks.push(...characterChecks);
  }

  // Generate report
  const report = generateComplianceReport(
    input.imageUrl,
    "illustration",
    checks,
    input.originalPrompt,
    input.enhancedPrompt
  );

  return {
    report,
    shouldFlag: report.status === "failed" || report.status === "warning",
    shouldRegenerate: report.status === "failed",
    summary: generateSummary(report),
  };
}

// ============================================
// Report Generation
// ============================================

/**
 * Generate a compliance report from checks
 */
export function generateComplianceReport(
  imageId: string,
  imageType: "illustration" | "cover",
  checks: ComplianceCheck[],
  originalPrompt?: string,
  enhancedPrompt?: string
): ComplianceReport {
  const now = new Date().toISOString();

  // Calculate score
  const { score, status } = calculateScore(checks);

  // Get flagged reasons
  const flaggedReasons = checks
    .filter((c) => !c.passed && c.severity === "error")
    .map((c) => c.message);

  return {
    id: generateId(),
    imageId,
    imageType,
    generatedAt: now,
    checkedAt: now,
    status,
    checks,
    overallScore: score,
    flaggedReasons,
    regenerationAttempts: 0,
    originalPrompt,
    enhancedPrompt,
  };
}

/**
 * Calculate compliance score from checks
 */
function calculateScore(checks: ComplianceCheck[]): { score: number; status: ComplianceStatus } {
  if (checks.length === 0) {
    return { score: 100, status: "passed" };
  }

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const check of checks) {
    const weight = check.weight || 5;
    totalWeight += weight;
    if (check.passed) {
      earnedWeight += weight;
    }
  }

  const score = Math.round((earnedWeight / totalWeight) * 100);

  let status: ComplianceStatus;
  if (score < SEVERITY_THRESHOLDS.failed) {
    status = "failed";
  } else if (score < SEVERITY_THRESHOLDS.warning) {
    status = "warning";
  } else {
    status = "passed";
  }

  // Override to failed if any critical error
  const hasCriticalError = checks.some(
    (c) => !c.passed && c.severity === "error" && (c.weight || 5) >= 10
  );
  if (hasCriticalError) {
    status = "failed";
  }

  return { score, status };
}

/**
 * Generate a quick summary for UI
 */
function generateSummary(report: ComplianceReport): string {
  const passedCount = report.checks.filter((c) => c.passed).length;
  const totalCount = report.checks.length;

  if (report.status === "passed") {
    return `✓ Passed (${report.overallScore}% - ${passedCount}/${totalCount} checks)`;
  } else if (report.status === "warning") {
    return `⚠ Warning (${report.overallScore}% - ${passedCount}/${totalCount} checks)`;
  } else if (report.status === "failed") {
    return `✗ Failed (${report.overallScore}% - ${report.flaggedReasons.length} issues)`;
  } else {
    return `⏳ Pending review`;
  }
}
