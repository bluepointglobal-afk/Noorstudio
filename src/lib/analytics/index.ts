/**
 * Analytics Module - Unified API
 * Central export for all analytics functionality
 */

// ============================================
// Re-export Types
// ============================================

export type {
  AnalyticsEventType,
  EventData,
  ProjectEventData,
  CharacterEventData,
  GenerationEventData,
  ExportEventData,
  CreditEventData,
  PageViewEventData,
  SessionEventData,
  AnalyticsEvent,
  StoredAnalyticsEvent,
  AnalyticsSummary,
  UsageMetrics,
  ProjectMetrics,
  AnalyticsQuery,
  EventCount,
  DailyStats,
  UserActivity,
} from "./types";

// ============================================
// Re-export Tracker
// ============================================

export {
  initializeTracker,
  cleanupTracker,
  setUserId,
  setFlushHandler,
  getSessionId,
  trackEvent,
  trackPageView,
  trackSessionStart,
  trackSessionEnd,
  trackProjectCreated,
  trackGeneration,
  trackCreditsUsed,
  trackExport,
  flush,
  getQueueSize,
  getQueuedEvents,
} from "./tracker";

// ============================================
// Re-export Storage
// ============================================

export {
  saveEvents,
  saveEvent,
  queryEvents,
  getUserEvents,
  getProjectEvents,
  getEventCountsByType,
  getDailyStats,
  deleteOldEvents,
  isStorageAvailable,
} from "./storage";

// ============================================
// Re-export Usage Metrics
// ============================================

export {
  getUserUsageMetrics,
  getGenerationSuccessRate,
  getAverageDailyCredits,
  getMostUsedGenerationType,
  estimateCreditsRemaining,
  getAverageGenerationDuration,
} from "./usageMetrics";

// ============================================
// Re-export Project Metrics
// ============================================

export {
  getUserProjectMetrics,
  getCompletionRateByTemplate,
  getAverageCompletionDays,
  getContentProductionRate,
  getMostActiveProject,
} from "./projectMetrics";

// ============================================
// Re-export Hooks
// ============================================

export {
  useAnalyticsInit,
  useAnalytics,
  useTrackPageView,
  useTrackEvent,
  useTrackMountUnmount,
  useProjectAnalytics,
  useTrackDuration,
  useTrackError,
} from "./hooks";

// ============================================
// Analytics Summary
// ============================================

import type { AnalyticsSummary } from "./types";
import { queryEvents, getDailyStats } from "./storage";
import { getUserUsageMetrics } from "./usageMetrics";
import { getUserProjectMetrics } from "./projectMetrics";

/**
 * Get comprehensive analytics summary for admin dashboard
 */
export async function getAnalyticsSummary(
  userId: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<AnalyticsSummary> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = options?.startDate || thirtyDaysAgo.toISOString();
  const endDate = options?.endDate || now.toISOString();

  // Fetch data in parallel
  const [usageMetrics, projectMetrics, dailyStats, sessionEvents] =
    await Promise.all([
      getUserUsageMetrics(userId, "month"),
      getUserProjectMetrics(userId),
      getDailyStats({ startDate, endDate, limit: 30 }),
      queryEvents({
        userId,
        eventTypes: ["session_started", "session_ended"],
        startDate,
        endDate,
        limit: 1000,
      }),
    ]);

  // Calculate session metrics
  let totalSessions = 0;
  let totalSessionDuration = 0;

  const sessionStarts = new Map<string, number>();
  for (const event of sessionEvents) {
    if (event.eventType === "session_started" && event.sessionId) {
      sessionStarts.set(event.sessionId, new Date(event.timestamp).getTime());
      totalSessions++;
    } else if (event.eventType === "session_ended" && event.sessionId) {
      const startTime = sessionStarts.get(event.sessionId);
      if (startTime) {
        totalSessionDuration += new Date(event.timestamp).getTime() - startTime;
      }
    }
  }

  const avgSessionDuration =
    totalSessions > 0 ? Math.round(totalSessionDuration / totalSessions) : 0;

  // Calculate generation success rate
  const totalGenRequests = usageMetrics.generations.total;
  const successRate =
    totalGenRequests > 0
      ? Math.round(
          (usageMetrics.generations.successful / totalGenRequests) * 100
        )
      : 100;

  // Calculate average generation duration from daily stats
  let totalGenerations = 0;
  for (const day of dailyStats) {
    totalGenerations += day.generations;
  }

  // Get export events
  const exportEvents = await queryEvents({
    userId,
    eventTypes: ["export_completed", "export_failed"],
    startDate,
    endDate,
    limit: 1000,
  });

  let pdfExports = 0;
  let epubExports = 0;
  let exportSuccesses = 0;

  for (const event of exportEvents) {
    const data = event.eventData as { exportFormat?: string; success?: boolean };
    if (data.exportFormat === "pdf") pdfExports++;
    else if (data.exportFormat === "epub") epubExports++;
    if (data.success) exportSuccesses++;
  }

  const exportSuccessRate =
    exportEvents.length > 0
      ? Math.round((exportSuccesses / exportEvents.length) * 100)
      : 100;

  // Get unique users count (for admin view this would aggregate all users)
  const uniqueUserDays = new Set(dailyStats.map((d) => d.date)).size;

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    users: {
      totalActive: 1, // Single user for non-admin
      newSignups: 0, // Would need signup tracking
      sessionsCount: totalSessions,
      avgSessionDuration,
    },
    projects: {
      totalCreated: projectMetrics.total,
      totalCompleted: projectMetrics.byStatus.completed,
      avgCompletionTime: projectMetrics.completion.avgTimeToComplete,
      byTemplate: {}, // Would need template tracking
    },
    generations: {
      totalRequests: totalGenRequests,
      successRate,
      byType: usageMetrics.generations.byType,
      avgDuration: 0, // Would need duration tracking
    },
    exports: {
      totalExports: exportEvents.length,
      byFormat: {
        pdf: pdfExports,
        epub: epubExports,
      },
      successRate: exportSuccessRate,
    },
    credits: {
      totalUsed: usageMetrics.creditsUsed.total,
      totalPurchased: 0, // Would need purchase tracking
      byType: {
        character: usageMetrics.creditsUsed.character,
        book: usageMetrics.creditsUsed.book,
      },
    },
  };
}

/**
 * Quick health check for analytics system
 */
export async function getAnalyticsHealthCheck(): Promise<{
  storageAvailable: boolean;
  queueSize: number;
  lastEventAt?: string;
}> {
  const { isStorageAvailable } = await import("./storage");
  const { getQueueSize, getQueuedEvents } = await import("./tracker");

  const available = await isStorageAvailable();
  const queueSize = getQueueSize();
  const queuedEvents = getQueuedEvents();

  const lastEvent = queuedEvents[queuedEvents.length - 1];

  return {
    storageAvailable: available,
    queueSize,
    lastEventAt: lastEvent?.timestamp,
  };
}
