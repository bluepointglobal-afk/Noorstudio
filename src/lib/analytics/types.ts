/**
 * Analytics Types
 * Type definitions for analytics tracking system
 */

// ============================================
// Event Types
// ============================================

export type AnalyticsEventType =
  // Project events
  | "project_created"
  | "project_opened"
  | "project_updated"
  | "project_deleted"
  | "project_completed"
  | "project_exported"
  // Character events
  | "character_created"
  | "character_updated"
  | "character_deleted"
  // Generation events
  | "outline_generated"
  | "chapter_generated"
  | "chapter_humanized"
  | "illustration_generated"
  | "cover_generated"
  | "generation_failed"
  // Export events
  | "export_started"
  | "export_completed"
  | "export_failed"
  // Credit events
  | "credits_used"
  | "credits_purchased"
  | "credits_refunded"
  // User events
  | "user_signed_up"
  | "user_signed_in"
  | "user_signed_out"
  | "page_viewed"
  | "session_started"
  | "session_ended";

// ============================================
// Event Data Types
// ============================================

export interface ProjectEventData {
  projectId: string;
  projectName?: string;
  templateType?: string;
  status?: string;
}

export interface CharacterEventData {
  characterId: string;
  characterName?: string;
  projectId?: string;
}

export interface GenerationEventData {
  projectId: string;
  generationType: "outline" | "chapter" | "illustration" | "cover";
  chapterNumber?: number;
  variantIndex?: number;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  creditsUsed?: number;
}

export interface ExportEventData {
  projectId: string;
  exportFormat: "pdf" | "epub";
  pageCount?: number;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
}

export interface CreditEventData {
  amount: number;
  creditType: "character" | "book";
  action: "used" | "purchased" | "refunded";
  reason?: string;
  balanceAfter?: number;
}

export interface PageViewEventData {
  path: string;
  referrer?: string;
  title?: string;
}

export interface SessionEventData {
  sessionId: string;
  duration?: number;
  pageViews?: number;
}

export type EventData =
  | ProjectEventData
  | CharacterEventData
  | GenerationEventData
  | ExportEventData
  | CreditEventData
  | PageViewEventData
  | SessionEventData
  | Record<string, unknown>;

// ============================================
// Analytics Event
// ============================================

export interface AnalyticsEvent {
  /** Unique event ID */
  id: string;

  /** User who triggered the event */
  userId: string;

  /** Type of event */
  eventType: AnalyticsEventType;

  /** Event-specific data */
  eventData: EventData;

  /** When the event occurred */
  timestamp: string;

  /** Current session ID */
  sessionId?: string;

  /** Related project ID if applicable */
  projectId?: string;

  /** Client metadata */
  metadata?: {
    userAgent?: string;
    screenSize?: string;
    timezone?: string;
    locale?: string;
  };
}

// ============================================
// Stored Event (Database)
// ============================================

export interface StoredAnalyticsEvent {
  id: string;
  user_id: string;
  event_type: AnalyticsEventType;
  event_data: EventData;
  timestamp: string;
  session_id?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// Analytics Summary
// ============================================

export interface AnalyticsSummary {
  /** Time period for the summary */
  period: {
    start: string;
    end: string;
  };

  /** User metrics */
  users: {
    totalActive: number;
    newSignups: number;
    sessionsCount: number;
    avgSessionDuration: number;
  };

  /** Project metrics */
  projects: {
    totalCreated: number;
    totalCompleted: number;
    avgCompletionTime: number;
    byTemplate: Record<string, number>;
  };

  /** Generation metrics */
  generations: {
    totalRequests: number;
    successRate: number;
    byType: {
      outline: number;
      chapter: number;
      illustration: number;
      cover: number;
    };
    avgDuration: number;
  };

  /** Export metrics */
  exports: {
    totalExports: number;
    byFormat: {
      pdf: number;
      epub: number;
    };
    successRate: number;
  };

  /** Credit metrics */
  credits: {
    totalUsed: number;
    totalPurchased: number;
    byType: {
      character: number;
      book: number;
    };
  };
}

// ============================================
// Usage Metrics
// ============================================

export interface UsageMetrics {
  /** User ID */
  userId: string;

  /** Time period */
  period: "day" | "week" | "month" | "all";

  /** Generation usage */
  generations: {
    total: number;
    successful: number;
    failed: number;
    byType: {
      outline: number;
      chapter: number;
      illustration: number;
      cover: number;
    };
  };

  /** Credits used */
  creditsUsed: {
    character: number;
    book: number;
    total: number;
  };

  /** Time-based breakdown */
  timeline: Array<{
    date: string;
    generations: number;
    creditsUsed: number;
  }>;
}

// ============================================
// Project Metrics
// ============================================

export interface ProjectMetrics {
  /** Total projects */
  total: number;

  /** By status */
  byStatus: {
    draft: number;
    inProgress: number;
    completed: number;
  };

  /** Completion stats */
  completion: {
    avgTimeToComplete: number;
    completionRate: number;
  };

  /** Content stats */
  content: {
    avgChaptersPerProject: number;
    avgIllustrationsPerProject: number;
    avgCharactersPerProject: number;
  };

  /** Recent activity */
  recentProjects: Array<{
    projectId: string;
    projectName: string;
    status: string;
    lastUpdated: string;
  }>;
}

// ============================================
// Query Parameters
// ============================================

export interface AnalyticsQuery {
  /** User ID to filter by */
  userId?: string;

  /** Event types to include */
  eventTypes?: AnalyticsEventType[];

  /** Start date */
  startDate?: string;

  /** End date */
  endDate?: string;

  /** Project ID to filter by */
  projectId?: string;

  /** Limit results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Order by */
  orderBy?: "timestamp" | "event_type";

  /** Order direction */
  orderDirection?: "asc" | "desc";
}

// ============================================
// Aggregation Types
// ============================================

export interface EventCount {
  eventType: AnalyticsEventType;
  count: number;
}

export interface DailyStats {
  date: string;
  events: number;
  uniqueUsers: number;
  generations: number;
  exports: number;
}

export interface UserActivity {
  userId: string;
  totalEvents: number;
  lastActive: string;
  topEvents: EventCount[];
}
