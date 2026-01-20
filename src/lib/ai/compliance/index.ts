/**
 * Compliance Module - Unified API
 * Central export for all compliance functionality
 */

// ============================================
// Re-export Types
// ============================================

export type {
  ComplianceStatus,
  CheckCategory,
  CheckSeverity,
  ComplianceCheck,
  ComplianceReport,
  ReviewQueueItem,
  ProjectComplianceSummary,
  ValidationInput,
  ValidationOutput,
  RegenerationRequest,
  RegenerationResult,
} from "../complianceTypes";

export {
  MAX_REGENERATION_ATTEMPTS,
  CHECK_WEIGHTS,
  SEVERITY_THRESHOLDS,
} from "../complianceTypes";

// ============================================
// Re-export Validators
// ============================================

export {
  validateCoverImage,
  validateIllustrationImage,
  validateCharacterConsistency,
  generateComplianceReport,
} from "../complianceValidator";

// ============================================
// Re-export Flagging
// ============================================

export {
  flagImage,
  unflagImage,
  getReviewQueue,
  clearReviewQueue,
  getReviewQueueCount,
  getItemsByPriority,
  getItemsByType,
  getCriticalItems,
  isImageFlagged,
  markAsReviewed,
  getQueueSummary,
} from "../complianceFlagging";

// ============================================
// Re-export Regeneration
// ============================================

export {
  triggerRegeneration,
  resetRegenerationAttempts,
  getRegenerationStatus,
  getFailureHistory,
} from "../complianceRegeneration";

// ============================================
// Re-export Guard (pre-generation)
// ============================================

export type {
  ComplianceContext,
  CoverComplianceRules,
  IllustrationComplianceRules,
  CharacterAnchor,
} from "../complianceGuard";

export {
  buildCoverComplianceRules,
  enforceComplianceCoverPrompt,
  buildIllustrationComplianceRules,
  enforceComplianceIllustrationPrompt,
  buildCharacterIdentityBlock,
  buildCoverNegativePrompt,
  buildIllustrationNegativePrompt,
  preflightCoverGeneration,
} from "../complianceGuard";

// ============================================
// Extended Artifact Types
// ============================================

import type { ComplianceReport, ComplianceStatus, ProjectComplianceSummary } from "../complianceTypes";
import { getQueueSummary, getReviewQueue } from "../complianceFlagging";

/**
 * Extended illustration artifact with compliance report
 */
export interface ComplianceIllustrationArtifact {
  id: string;
  chapterId: string;
  chapterNumber: number;
  imageUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  variantIndex: number;
  selected: boolean;
  generatedAt: string;
  complianceReport?: ComplianceReport;
}

/**
 * Extended cover artifact with compliance report
 */
export interface ComplianceCoverArtifact {
  id: string;
  type: "front" | "back";
  imageUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  variantIndex: number;
  selected: boolean;
  generatedAt: string;
  complianceReport?: ComplianceReport;
}

// ============================================
// Project Compliance Status
// ============================================

const COMPLIANCE_STATUS_KEY_PREFIX = "noorstudio_compliance_status_";

interface StoredComplianceStatus {
  projectId: string;
  illustrations: Map<string, ComplianceReport>;
  covers: Map<string, ComplianceReport>;
  lastUpdatedAt: string;
}

function getStatusKey(projectId: string): string {
  return `${COMPLIANCE_STATUS_KEY_PREFIX}${projectId}`;
}

function loadComplianceStatus(projectId: string): StoredComplianceStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(getStatusKey(projectId));
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      illustrations: new Map(Object.entries(parsed.illustrations || {})),
      covers: new Map(Object.entries(parsed.covers || {})),
    };
  } catch {
    return null;
  }
}

function saveComplianceStatus(status: StoredComplianceStatus): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const toStore = {
      ...status,
      illustrations: Object.fromEntries(status.illustrations),
      covers: Object.fromEntries(status.covers),
    };
    localStorage.setItem(getStatusKey(status.projectId), JSON.stringify(toStore));
  } catch {
    console.warn("Failed to save compliance status");
  }
}

/**
 * Store a compliance report for an image
 */
export function storeComplianceReport(
  projectId: string,
  imageId: string,
  imageType: "illustration" | "cover",
  report: ComplianceReport
): void {
  let status = loadComplianceStatus(projectId);

  if (!status) {
    status = {
      projectId,
      illustrations: new Map(),
      covers: new Map(),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  if (imageType === "illustration") {
    status.illustrations.set(imageId, report);
  } else {
    status.covers.set(imageId, report);
  }

  status.lastUpdatedAt = new Date().toISOString();
  saveComplianceStatus(status);
}

/**
 * Get compliance report for a specific image
 */
export function getComplianceReport(
  projectId: string,
  imageId: string,
  imageType: "illustration" | "cover"
): ComplianceReport | undefined {
  const status = loadComplianceStatus(projectId);
  if (!status) {
    return undefined;
  }

  if (imageType === "illustration") {
    return status.illustrations.get(imageId);
  }
  return status.covers.get(imageId);
}

/**
 * Get overall project compliance status summary
 */
export function getProjectComplianceStatus(projectId: string): ProjectComplianceSummary {
  const status = loadComplianceStatus(projectId);
  const queueSummary = getQueueSummary(projectId);

  const allReports: ComplianceReport[] = [];

  if (status) {
    allReports.push(...status.illustrations.values());
    allReports.push(...status.covers.values());
  }

  // Count by status
  let passedCount = 0;
  let warningCount = 0;
  let failedCount = 0;
  let pendingReviewCount = 0;
  let totalScore = 0;

  // Track common issues
  const issueCounter = new Map<string, { name: string; count: number }>();

  for (const report of allReports) {
    totalScore += report.overallScore;

    switch (report.status) {
      case "passed":
        passedCount++;
        break;
      case "warning":
        warningCount++;
        break;
      case "failed":
        failedCount++;
        break;
      case "pending_review":
        pendingReviewCount++;
        break;
    }

    // Track failed checks
    for (const check of report.checks) {
      if (!check.passed) {
        const existing = issueCounter.get(check.id) || {
          name: check.name,
          count: 0,
        };
        existing.count++;
        issueCounter.set(check.id, existing);
      }
    }
  }

  // Add queue pending count
  pendingReviewCount += queueSummary.total;

  // Calculate overall status
  let overallStatus: ComplianceStatus;
  if (failedCount > 0 || queueSummary.critical > 0) {
    overallStatus = "failed";
  } else if (warningCount > 0 || pendingReviewCount > 0) {
    overallStatus = "warning";
  } else if (allReports.length === 0) {
    overallStatus = "pending_review";
  } else {
    overallStatus = "passed";
  }

  // Get common issues (top 5)
  const commonIssues = Array.from(issueCounter.entries())
    .map(([checkId, data]) => ({
      checkId,
      checkName: data.name,
      occurrences: data.count,
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5);

  return {
    projectId,
    status: overallStatus,
    totalImages: allReports.length,
    passedCount,
    warningCount,
    failedCount,
    pendingReviewCount,
    averageScore:
      allReports.length > 0 ? Math.round(totalScore / allReports.length) : 0,
    commonIssues,
    lastCheckedAt: status?.lastUpdatedAt || new Date().toISOString(),
  };
}

/**
 * Clear all compliance data for a project
 */
export function clearProjectComplianceData(projectId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(getStatusKey(projectId));
  } catch {
    // Ignore
  }
}

// ============================================
// Unified Compliance API
// ============================================

import type { CoverComplianceRules, IllustrationComplianceRules } from "../complianceGuard";
import { validateCoverImage, validateIllustrationImage } from "../complianceValidator";
import { flagImage } from "../complianceFlagging";
import { triggerRegeneration } from "../complianceRegeneration";
import type { ValidationInput, ValidationOutput, RegenerationRequest, RegenerationResult } from "../complianceTypes";

/**
 * Validate an image and optionally flag/store results
 */
export async function validateAndProcess(
  projectId: string,
  input: ValidationInput,
  rules: CoverComplianceRules | IllustrationComplianceRules,
  options?: {
    autoFlag?: boolean;
    storeReport?: boolean;
    chapterNumber?: number;
    coverType?: "front" | "back";
  }
): Promise<ValidationOutput> {
  // Validate based on type
  let result: ValidationOutput;

  if (input.imageType === "cover") {
    result = await validateCoverImage(input, rules as CoverComplianceRules);
  } else {
    result = await validateIllustrationImage(
      input,
      rules as IllustrationComplianceRules
    );
  }

  // Store report if requested
  if (options?.storeReport !== false) {
    storeComplianceReport(
      projectId,
      result.report.imageId,
      input.imageType,
      result.report
    );
  }

  // Auto-flag if requested and validation failed/warned
  if (options?.autoFlag !== false && result.shouldFlag) {
    flagImage(
      projectId,
      result.report.imageId,
      input.imageUrl,
      input.imageType,
      result.report,
      {
        chapterNumber: options?.chapterNumber,
        coverType: options?.coverType,
      }
    );
  }

  return result;
}

/**
 * Attempt to regenerate a failed image
 */
export function attemptRegeneration(
  projectId: string,
  imageId: string,
  report: ComplianceReport,
  options?: {
    checksToAddress?: string[];
    force?: boolean;
  }
): RegenerationResult {
  const request: RegenerationRequest = {
    projectId,
    imageId,
    report,
    checksToAddress: options?.checksToAddress,
    force: options?.force,
  };

  return triggerRegeneration(request);
}

/**
 * Get a quick compliance health check for a project
 */
export function getComplianceHealthCheck(projectId: string): {
  healthy: boolean;
  score: number;
  criticalIssues: number;
  pendingReviews: number;
  message: string;
} {
  const summary = getProjectComplianceStatus(projectId);
  const queue = getReviewQueue(projectId);

  const criticalIssues = queue.filter((i) => i.priority <= 2).length;
  const healthy =
    summary.status === "passed" && criticalIssues === 0 && queue.length === 0;

  let message: string;
  if (healthy) {
    message = "All images pass compliance checks";
  } else if (criticalIssues > 0) {
    message = `${criticalIssues} critical issue(s) require immediate attention`;
  } else if (queue.length > 0) {
    message = `${queue.length} image(s) pending review`;
  } else if (summary.failedCount > 0) {
    message = `${summary.failedCount} image(s) failed compliance`;
  } else {
    message = `${summary.warningCount} warning(s) found`;
  }

  return {
    healthy,
    score: summary.averageScore,
    criticalIssues,
    pendingReviews: queue.length,
    message,
  };
}
