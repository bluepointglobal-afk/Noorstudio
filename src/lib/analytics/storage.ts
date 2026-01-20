/**
 * Analytics Storage
 * Supabase storage layer for analytics events
 */

import { supabase } from "../supabase";
import type {
  AnalyticsEvent,
  StoredAnalyticsEvent,
  AnalyticsQuery,
  DailyStats,
} from "./types";

// ============================================
// Event Conversion
// ============================================

function toStoredEvent(event: AnalyticsEvent): StoredAnalyticsEvent {
  return {
    id: event.id,
    user_id: event.userId,
    event_type: event.eventType,
    event_data: event.eventData,
    timestamp: event.timestamp,
    session_id: event.sessionId,
    project_id: event.projectId,
    metadata: event.metadata,
    created_at: new Date().toISOString(),
  };
}

function fromStoredEvent(stored: StoredAnalyticsEvent): AnalyticsEvent {
  return {
    id: stored.id,
    userId: stored.user_id,
    eventType: stored.event_type,
    eventData: stored.event_data,
    timestamp: stored.timestamp,
    sessionId: stored.session_id,
    projectId: stored.project_id,
    metadata: stored.metadata as AnalyticsEvent["metadata"],
  };
}

// ============================================
// Save Events
// ============================================

/**
 * Save a batch of analytics events to Supabase
 */
export async function saveEvents(events: AnalyticsEvent[]): Promise<boolean> {
  if (!supabase || events.length === 0) {
    return false;
  }

  try {
    const storedEvents = events.map(toStoredEvent);

    const { error } = await supabase
      .from("analytics_events")
      .insert(storedEvents);

    if (error) {
      console.warn("Failed to save analytics events:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Error saving analytics events:", err);
    return false;
  }
}

/**
 * Save a single analytics event
 */
export async function saveEvent(event: AnalyticsEvent): Promise<boolean> {
  return saveEvents([event]);
}

// ============================================
// Query Events
// ============================================

/**
 * Query analytics events with filters
 */
export async function queryEvents(
  query: AnalyticsQuery
): Promise<AnalyticsEvent[]> {
  if (!supabase) {
    return [];
  }

  try {
    let queryBuilder = supabase
      .from("analytics_events")
      .select("*");

    // Apply filters
    if (query.userId) {
      queryBuilder = queryBuilder.eq("user_id", query.userId);
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      queryBuilder = queryBuilder.in("event_type", query.eventTypes);
    }

    if (query.startDate) {
      queryBuilder = queryBuilder.gte("timestamp", query.startDate);
    }

    if (query.endDate) {
      queryBuilder = queryBuilder.lte("timestamp", query.endDate);
    }

    if (query.projectId) {
      queryBuilder = queryBuilder.eq("project_id", query.projectId);
    }

    // Apply ordering
    const orderBy = query.orderBy || "timestamp";
    const orderDirection = query.orderDirection || "desc";
    queryBuilder = queryBuilder.order(orderBy, { ascending: orderDirection === "asc" });

    // Apply pagination
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(
        query.offset,
        query.offset + (query.limit || 100) - 1
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.warn("Failed to query analytics events:", error.message);
      return [];
    }

    return (data || []).map(fromStoredEvent);
  } catch (err) {
    console.warn("Error querying analytics events:", err);
    return [];
  }
}

/**
 * Get events for a specific user
 */
export async function getUserEvents(
  userId: string,
  options?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<AnalyticsEvent[]> {
  return queryEvents({
    userId,
    limit: options?.limit || 100,
    startDate: options?.startDate,
    endDate: options?.endDate,
  });
}

/**
 * Get events for a specific project
 */
export async function getProjectEvents(
  projectId: string,
  options?: {
    limit?: number;
  }
): Promise<AnalyticsEvent[]> {
  return queryEvents({
    projectId,
    limit: options?.limit || 100,
  });
}

// ============================================
// Aggregations
// ============================================

/**
 * Get event count by type for a user
 */
export async function getEventCountsByType(
  userId: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<Record<string, number>> {
  if (!supabase) {
    return {};
  }

  try {
    let queryBuilder = supabase
      .from("analytics_events")
      .select("event_type")
      .eq("user_id", userId);

    if (options?.startDate) {
      queryBuilder = queryBuilder.gte("timestamp", options.startDate);
    }

    if (options?.endDate) {
      queryBuilder = queryBuilder.lte("timestamp", options.endDate);
    }

    const { data, error } = await queryBuilder;

    if (error || !data) {
      return {};
    }

    // Count events by type
    const counts: Record<string, number> = {};
    for (const row of data) {
      const type = row.event_type as string;
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  } catch {
    return {};
  }
}

/**
 * Get daily stats from the view
 */
export async function getDailyStats(options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<DailyStats[]> {
  if (!supabase) {
    return [];
  }

  try {
    let queryBuilder = supabase
      .from("analytics_daily_summary")
      .select("*");

    if (options?.startDate) {
      queryBuilder = queryBuilder.gte("date", options.startDate);
    }

    if (options?.endDate) {
      queryBuilder = queryBuilder.lte("date", options.endDate);
    }

    queryBuilder = queryBuilder.order("date", { ascending: false });

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const { data, error } = await queryBuilder;

    if (error || !data) {
      return [];
    }

    // Aggregate by date
    const byDate = new Map<string, DailyStats>();

    for (const row of data) {
      const date = row.date as string;
      const eventType = row.event_type as string;
      const count = row.event_count as number;
      const uniqueUsers = row.unique_users as number;

      let stats = byDate.get(date);
      if (!stats) {
        stats = {
          date,
          events: 0,
          uniqueUsers: 0,
          generations: 0,
          exports: 0,
        };
        byDate.set(date, stats);
      }

      stats.events += count;
      stats.uniqueUsers = Math.max(stats.uniqueUsers, uniqueUsers);

      if (eventType.includes("generated")) {
        stats.generations += count;
      }
      if (eventType.includes("export")) {
        stats.exports += count;
      }
    }

    return Array.from(byDate.values());
  } catch {
    return [];
  }
}

// ============================================
// Cleanup
// ============================================

/**
 * Delete old analytics events (for data retention)
 */
export async function deleteOldEvents(
  olderThan: string
): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .delete()
      .lt("timestamp", olderThan)
      .select("id");

    if (error) {
      console.warn("Failed to delete old events:", error.message);
      return 0;
    }

    return data?.length || 0;
  } catch {
    return 0;
  }
}

// ============================================
// Connection Check
// ============================================

/**
 * Check if analytics storage is available
 */
export async function isStorageAvailable(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("analytics_events")
      .select("id")
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
