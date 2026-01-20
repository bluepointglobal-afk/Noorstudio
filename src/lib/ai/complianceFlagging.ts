/**
 * Compliance Flagging System
 * Manages review queue for non-compliant images
 */

import { ComplianceReport, ReviewQueueItem } from "./complianceTypes";

// ============================================
// Storage Keys
// ============================================

const REVIEW_QUEUE_KEY_PREFIX = "noorstudio_review_queue_";

function getQueueKey(projectId: string): string {
  return `${REVIEW_QUEUE_KEY_PREFIX}${projectId}`;
}

// ============================================
// Queue Storage Operations
// ============================================

/**
 * Get the review queue from storage
 */
function loadQueue(projectId: string): ReviewQueueItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(getQueueKey(projectId));
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as ReviewQueueItem[];
  } catch {
    console.warn("Failed to load review queue from storage");
    return [];
  }
}

/**
 * Save the review queue to storage
 */
function saveQueue(projectId: string, queue: ReviewQueueItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(getQueueKey(projectId), JSON.stringify(queue));
  } catch {
    console.warn("Failed to save review queue to storage");
  }
}

// ============================================
// Priority Calculation
// ============================================

/**
 * Calculate priority based on compliance report severity
 * 1 = highest priority, 5 = lowest
 */
function calculatePriority(report: ComplianceReport): number {
  // Critical failures get highest priority
  if (report.status === "failed") {
    // Check for critical issues (modesty, character identity)
    const hasCriticalIssue = report.checks.some(
      (c) =>
        !c.passed &&
        c.severity === "error" &&
        (c.category === "modesty" || c.category === "character")
    );
    return hasCriticalIssue ? 1 : 2;
  }

  // Warnings get medium priority
  if (report.status === "warning") {
    return 3;
  }

  // Pending review
  if (report.status === "pending_review") {
    return 4;
  }

  // Passed items shouldn't be in queue, but lowest priority if they are
  return 5;
}

// ============================================
// Flagging Operations
// ============================================

/**
 * Flag an image for review and add to queue
 */
export function flagImage(
  projectId: string,
  imageId: string,
  imageUrl: string,
  imageType: "illustration" | "cover",
  report: ComplianceReport,
  options?: {
    chapterNumber?: number;
    coverType?: "front" | "back";
  }
): void {
  const queue = loadQueue(projectId);

  // Check if already flagged
  const existingIndex = queue.findIndex((item) => item.imageId === imageId);

  const queueItem: ReviewQueueItem = {
    projectId,
    imageId,
    imageType,
    imageUrl,
    report,
    addedAt: new Date().toISOString(),
    priority: calculatePriority(report),
    chapterNumber: options?.chapterNumber,
    coverType: options?.coverType,
  };

  if (existingIndex >= 0) {
    // Update existing entry
    queue[existingIndex] = queueItem;
  } else {
    // Add new entry
    queue.push(queueItem);
  }

  // Sort by priority (1 first) then by addedAt (oldest first)
  queue.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
  });

  saveQueue(projectId, queue);
}

/**
 * Remove an image from the review queue
 */
export function unflagImage(projectId: string, imageId: string): void {
  const queue = loadQueue(projectId);
  const filtered = queue.filter((item) => item.imageId !== imageId);
  saveQueue(projectId, filtered);
}

/**
 * Get all items in the review queue for a project
 */
export function getReviewQueue(projectId: string): ReviewQueueItem[] {
  return loadQueue(projectId);
}

/**
 * Clear the entire review queue for a project
 */
export function clearReviewQueue(projectId: string): void {
  saveQueue(projectId, []);
}

// ============================================
// Queue Query Operations
// ============================================

/**
 * Get count of items in review queue
 */
export function getReviewQueueCount(projectId: string): number {
  return loadQueue(projectId).length;
}

/**
 * Get items by priority level
 */
export function getItemsByPriority(
  projectId: string,
  priority: number
): ReviewQueueItem[] {
  return loadQueue(projectId).filter((item) => item.priority === priority);
}

/**
 * Get items by image type
 */
export function getItemsByType(
  projectId: string,
  imageType: "illustration" | "cover"
): ReviewQueueItem[] {
  return loadQueue(projectId).filter((item) => item.imageType === imageType);
}

/**
 * Get critical items (priority 1-2)
 */
export function getCriticalItems(projectId: string): ReviewQueueItem[] {
  return loadQueue(projectId).filter(
    (item) => item.priority === 1 || item.priority === 2
  );
}

/**
 * Check if a specific image is flagged
 */
export function isImageFlagged(projectId: string, imageId: string): boolean {
  return loadQueue(projectId).some((item) => item.imageId === imageId);
}

// ============================================
// Review Operations
// ============================================

/**
 * Mark an item as reviewed (updates the report)
 */
export function markAsReviewed(
  projectId: string,
  imageId: string,
  reviewNotes: string,
  reviewedBy: string,
  approved: boolean
): void {
  const queue = loadQueue(projectId);
  const itemIndex = queue.findIndex((item) => item.imageId === imageId);

  if (itemIndex < 0) {
    return;
  }

  const item = queue[itemIndex];

  // Update the report with review info
  item.report = {
    ...item.report,
    reviewNotes,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    status: approved ? "passed" : item.report.status,
  };

  if (approved) {
    // Remove from queue if approved
    queue.splice(itemIndex, 1);
  } else {
    // Keep in queue with updated info
    queue[itemIndex] = item;
  }

  saveQueue(projectId, queue);
}

/**
 * Get review queue summary for a project
 */
export function getQueueSummary(projectId: string): {
  total: number;
  critical: number;
  warnings: number;
  pending: number;
  illustrations: number;
  covers: number;
} {
  const queue = loadQueue(projectId);

  return {
    total: queue.length,
    critical: queue.filter((i) => i.priority <= 2).length,
    warnings: queue.filter((i) => i.priority === 3).length,
    pending: queue.filter((i) => i.priority >= 4).length,
    illustrations: queue.filter((i) => i.imageType === "illustration").length,
    covers: queue.filter((i) => i.imageType === "cover").length,
  };
}
