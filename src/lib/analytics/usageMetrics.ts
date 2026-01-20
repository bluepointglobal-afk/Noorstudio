/**
 * Usage Metrics
 * Track AI generation and credit usage
 */

import type {
  AnalyticsEvent,
  UsageMetrics,
  GenerationEventData,
  CreditEventData,
} from "./types";
import { queryEvents } from "./storage";

// ============================================
// Time Period Helpers
// ============================================

function getDateRange(period: "day" | "week" | "month" | "all"): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();

  let startDate: Date;
  switch (period) {
    case "day":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "all":
      startDate = new Date(0); // Beginning of time
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate,
  };
}

function groupEventsByDate(
  events: AnalyticsEvent[]
): Map<string, AnalyticsEvent[]> {
  const grouped = new Map<string, AnalyticsEvent[]>();

  for (const event of events) {
    const date = event.timestamp.split("T")[0];
    const existing = grouped.get(date) || [];
    existing.push(event);
    grouped.set(date, existing);
  }

  return grouped;
}

// ============================================
// Generation Metrics
// ============================================

/**
 * Extract generation stats from events
 */
function extractGenerationStats(events: AnalyticsEvent[]): {
  total: number;
  successful: number;
  failed: number;
  byType: {
    outline: number;
    chapter: number;
    illustration: number;
    cover: number;
  };
} {
  const stats = {
    total: 0,
    successful: 0,
    failed: 0,
    byType: {
      outline: 0,
      chapter: 0,
      illustration: 0,
      cover: 0,
    },
  };

  const generationTypes = [
    "outline_generated",
    "chapter_generated",
    "illustration_generated",
    "cover_generated",
    "generation_failed",
  ];

  for (const event of events) {
    if (!generationTypes.includes(event.eventType)) {
      continue;
    }

    stats.total++;

    if (event.eventType === "generation_failed") {
      stats.failed++;
      // Try to extract type from event data
      const data = event.eventData as GenerationEventData;
      if (data.generationType) {
        const type = data.generationType as keyof typeof stats.byType;
        if (type in stats.byType) {
          stats.byType[type]++;
        }
      }
    } else {
      stats.successful++;

      // Extract type from event name
      if (event.eventType === "outline_generated") {
        stats.byType.outline++;
      } else if (event.eventType === "chapter_generated") {
        stats.byType.chapter++;
      } else if (event.eventType === "illustration_generated") {
        stats.byType.illustration++;
      } else if (event.eventType === "cover_generated") {
        stats.byType.cover++;
      }
    }
  }

  return stats;
}

// ============================================
// Credit Metrics
// ============================================

/**
 * Extract credit usage from events
 */
function extractCreditStats(events: AnalyticsEvent[]): {
  character: number;
  book: number;
  total: number;
} {
  const stats = {
    character: 0,
    book: 0,
    total: 0,
  };

  for (const event of events) {
    if (event.eventType !== "credits_used") {
      continue;
    }

    const data = event.eventData as CreditEventData;
    const amount = data.amount || 0;

    if (data.creditType === "character") {
      stats.character += amount;
    } else if (data.creditType === "book") {
      stats.book += amount;
    }

    stats.total += amount;
  }

  return stats;
}

// ============================================
// Usage Metrics
// ============================================

/**
 * Get usage metrics for a user
 */
export async function getUserUsageMetrics(
  userId: string,
  period: "day" | "week" | "month" | "all" = "month"
): Promise<UsageMetrics> {
  const { startDate, endDate } = getDateRange(period);

  // Fetch relevant events
  const events = await queryEvents({
    userId,
    eventTypes: [
      "outline_generated",
      "chapter_generated",
      "illustration_generated",
      "cover_generated",
      "generation_failed",
      "credits_used",
    ],
    startDate,
    endDate,
    limit: 10000, // High limit to get all events in period
  });

  // Extract stats
  const generations = extractGenerationStats(events);
  const creditsUsed = extractCreditStats(events);

  // Build timeline
  const groupedByDate = groupEventsByDate(events);
  const timeline: UsageMetrics["timeline"] = [];

  for (const [date, dateEvents] of groupedByDate) {
    const dayGenerations = extractGenerationStats(dateEvents);
    const dayCredits = extractCreditStats(dateEvents);

    timeline.push({
      date,
      generations: dayGenerations.total,
      creditsUsed: dayCredits.total,
    });
  }

  // Sort timeline by date
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  return {
    userId,
    period,
    generations,
    creditsUsed,
    timeline,
  };
}

/**
 * Get generation success rate for a user
 */
export async function getGenerationSuccessRate(
  userId: string,
  period: "day" | "week" | "month" | "all" = "month"
): Promise<number> {
  const metrics = await getUserUsageMetrics(userId, period);

  if (metrics.generations.total === 0) {
    return 100; // No generations = 100% success
  }

  return Math.round(
    (metrics.generations.successful / metrics.generations.total) * 100
  );
}

/**
 * Get average credits used per day
 */
export async function getAverageDailyCredits(
  userId: string,
  period: "day" | "week" | "month" = "month"
): Promise<{ character: number; book: number }> {
  const metrics = await getUserUsageMetrics(userId, period);

  const days = metrics.timeline.length || 1;

  return {
    character: Math.round(metrics.creditsUsed.character / days),
    book: Math.round(metrics.creditsUsed.book / days),
  };
}

/**
 * Get most used generation type
 */
export async function getMostUsedGenerationType(
  userId: string,
  period: "day" | "week" | "month" | "all" = "month"
): Promise<"outline" | "chapter" | "illustration" | "cover" | null> {
  const metrics = await getUserUsageMetrics(userId, period);

  const byType = metrics.generations.byType;
  let maxType: "outline" | "chapter" | "illustration" | "cover" | null = null;
  let maxCount = 0;

  for (const [type, count] of Object.entries(byType)) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type as typeof maxType;
    }
  }

  return maxType;
}

// ============================================
// Credit Tracking Helpers
// ============================================

/**
 * Get remaining credits estimate based on usage rate
 */
export async function estimateCreditsRemaining(
  userId: string,
  currentCredits: { character: number; book: number }
): Promise<{
  character: { daysRemaining: number; ratePerDay: number };
  book: { daysRemaining: number; ratePerDay: number };
}> {
  const avgDaily = await getAverageDailyCredits(userId, "week");

  const characterDays =
    avgDaily.character > 0
      ? Math.round(currentCredits.character / avgDaily.character)
      : Infinity;

  const bookDays =
    avgDaily.book > 0
      ? Math.round(currentCredits.book / avgDaily.book)
      : Infinity;

  return {
    character: {
      daysRemaining: characterDays === Infinity ? -1 : characterDays,
      ratePerDay: avgDaily.character,
    },
    book: {
      daysRemaining: bookDays === Infinity ? -1 : bookDays,
      ratePerDay: avgDaily.book,
    },
  };
}

// ============================================
// Generation Timing
// ============================================

/**
 * Get average generation duration by type
 */
export async function getAverageGenerationDuration(
  userId: string,
  period: "day" | "week" | "month" | "all" = "month"
): Promise<Record<string, number>> {
  const { startDate, endDate } = getDateRange(period);

  const events = await queryEvents({
    userId,
    eventTypes: [
      "outline_generated",
      "chapter_generated",
      "illustration_generated",
      "cover_generated",
    ],
    startDate,
    endDate,
  });

  const durations: Record<string, number[]> = {
    outline: [],
    chapter: [],
    illustration: [],
    cover: [],
  };

  for (const event of events) {
    const data = event.eventData as GenerationEventData;
    if (data.durationMs) {
      let type: string;
      if (event.eventType === "outline_generated") type = "outline";
      else if (event.eventType === "chapter_generated") type = "chapter";
      else if (event.eventType === "illustration_generated") type = "illustration";
      else if (event.eventType === "cover_generated") type = "cover";
      else continue;

      durations[type].push(data.durationMs);
    }
  }

  const averages: Record<string, number> = {};
  for (const [type, times] of Object.entries(durations)) {
    if (times.length > 0) {
      const sum = times.reduce((a, b) => a + b, 0);
      averages[type] = Math.round(sum / times.length);
    } else {
      averages[type] = 0;
    }
  }

  return averages;
}
