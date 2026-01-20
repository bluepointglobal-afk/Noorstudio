/**
 * Compliance Types
 * Type definitions for post-generation compliance checking
 */

// ============================================
// Compliance Status
// ============================================

export type ComplianceStatus = "passed" | "failed" | "warning" | "pending_review";

export type CheckCategory = "character" | "style" | "content" | "technical" | "modesty";

export type CheckSeverity = "error" | "warning" | "info";

// ============================================
// Compliance Check
// ============================================

export interface ComplianceCheck {
  /** Unique identifier for this check type */
  id: string;

  /** Human-readable name */
  name: string;

  /** Category of the check */
  category: CheckCategory;

  /** Whether the check passed */
  passed: boolean;

  /** Severity if failed */
  severity: CheckSeverity;

  /** Detailed message explaining the result */
  message: string;

  /** Suggested action if failed */
  suggestion?: string;

  /** Weight for scoring (1-10, default 5) */
  weight?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================
// Compliance Report
// ============================================

export interface ComplianceReport {
  /** Unique report ID */
  id: string;

  /** ID of the image being validated */
  imageId: string;

  /** Type of image */
  imageType: "illustration" | "cover";

  /** When the image was generated */
  generatedAt: string;

  /** When compliance check was run */
  checkedAt: string;

  /** Overall status */
  status: ComplianceStatus;

  /** All checks performed */
  checks: ComplianceCheck[];

  /** Overall compliance score (0-100) */
  overallScore: number;

  /** Summary of why image was flagged (if applicable) */
  flaggedReasons: string[];

  /** Number of regeneration attempts */
  regenerationAttempts: number;

  /** Notes from manual review */
  reviewNotes?: string;

  /** Who reviewed (if manually reviewed) */
  reviewedBy?: string;

  /** When reviewed */
  reviewedAt?: string;

  /** Original prompt used */
  originalPrompt?: string;

  /** Enhanced prompt after compliance enforcement */
  enhancedPrompt?: string;
}

// ============================================
// Review Queue
// ============================================

export interface ReviewQueueItem {
  /** Project ID */
  projectId: string;

  /** Image ID */
  imageId: string;

  /** Image type */
  imageType: "illustration" | "cover";

  /** Image URL for preview */
  imageUrl: string;

  /** Compliance report */
  report: ComplianceReport;

  /** When added to queue */
  addedAt: string;

  /** Priority (1-5, 1 is highest) */
  priority: number;

  /** Chapter number if illustration */
  chapterNumber?: number;

  /** Cover type if cover */
  coverType?: "front" | "back";
}

// ============================================
// Compliance Summary
// ============================================

export interface ProjectComplianceSummary {
  /** Project ID */
  projectId: string;

  /** Overall project compliance status */
  status: ComplianceStatus;

  /** Total images checked */
  totalImages: number;

  /** Images that passed */
  passedCount: number;

  /** Images with warnings */
  warningCount: number;

  /** Images that failed */
  failedCount: number;

  /** Images pending review */
  pendingReviewCount: number;

  /** Average compliance score */
  averageScore: number;

  /** Most common issues */
  commonIssues: Array<{
    checkId: string;
    checkName: string;
    occurrences: number;
  }>;

  /** Last check timestamp */
  lastCheckedAt: string;
}

// ============================================
// Validation Input/Output
// ============================================

export interface ValidationInput {
  /** Image URL to validate */
  imageUrl: string;

  /** Type of image */
  imageType: "illustration" | "cover";

  /** Expected dimensions */
  expectedDimensions?: {
    width: number;
    height: number;
    tolerance?: number; // percentage tolerance
  };

  /** Characters expected in scene */
  expectedCharacterIds?: string[];

  /** Style ID that should match */
  expectedStyleId?: string;

  /** Original prompt used */
  originalPrompt?: string;

  /** Enhanced prompt after compliance */
  enhancedPrompt?: string;

  /** Chapter number for illustrations */
  chapterNumber?: number;

  /** Cover type for covers */
  coverType?: "front" | "back";
}

export interface ValidationOutput {
  /** The compliance report */
  report: ComplianceReport;

  /** Whether image should be flagged for review */
  shouldFlag: boolean;

  /** Whether regeneration is recommended */
  shouldRegenerate: boolean;

  /** Quick summary for UI */
  summary: string;
}

// ============================================
// Regeneration Types
// ============================================

export interface RegenerationRequest {
  /** Project ID */
  projectId: string;

  /** Image ID to regenerate */
  imageId: string;

  /** Compliance report from failed validation */
  report: ComplianceReport;

  /** Specific checks to address */
  checksToAddress?: string[];

  /** Force regeneration even if max attempts reached */
  force?: boolean;
}

export interface RegenerationResult {
  /** Whether regeneration can proceed */
  canRegenerate: boolean;

  /** Reason if cannot regenerate */
  reason?: string;

  /** Enhanced prompt addressing failures */
  enhancedPrompt?: string;

  /** Additional negative prompt items */
  additionalNegatives?: string[];

  /** Current attempt number */
  attemptNumber: number;

  /** Max attempts allowed */
  maxAttempts: number;
}

// ============================================
// Constants
// ============================================

export const MAX_REGENERATION_ATTEMPTS = 3;

export const CHECK_WEIGHTS: Record<string, number> = {
  // Critical checks (weight 10)
  "character-identity": 10,
  "modesty-hijab": 10,
  "modesty-clothing": 10,

  // Important checks (weight 7)
  "style-consistency": 7,
  "no-text": 7,
  "character-count": 7,

  // Standard checks (weight 5)
  "dimensions": 5,
  "prompt-applied": 5,
  "quality": 5,

  // Minor checks (weight 3)
  "orientation": 3,
  "format": 3,
};

export const SEVERITY_THRESHOLDS = {
  /** Score below this = failed */
  failed: 60,
  /** Score below this = warning */
  warning: 80,
  /** Score at or above this = passed */
  passed: 80,
};
