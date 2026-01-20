/**
 * Analytics Event Tracker
 * Client-side event tracking with batching and offline support
 */

import type {
  AnalyticsEvent,
  AnalyticsEventType,
  EventData,
} from "./types";

// ============================================
// Constants
// ============================================

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const QUEUE_STORAGE_KEY = "noorstudio_analytics_queue";
const SESSION_STORAGE_KEY = "noorstudio_analytics_session";

// ============================================
// Session Management
// ============================================

interface SessionData {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  pageViews: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getOrCreateSession(): SessionData {
  if (typeof window === "undefined") {
    return {
      id: generateId(),
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      pageViews: 0,
    };
  }

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as SessionData;
      const lastActivity = new Date(session.lastActivityAt).getTime();
      const now = Date.now();

      // Check if session is still valid
      if (now - lastActivity < SESSION_TIMEOUT_MS) {
        session.lastActivityAt = new Date().toISOString();
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        return session;
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Create new session
  const newSession: SessionData = {
    id: generateId(),
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    pageViews: 0,
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  } catch {
    // Ignore storage errors
  }

  return newSession;
}

function updateSessionActivity(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as SessionData;
      session.lastActivityAt = new Date().toISOString();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

function incrementPageViews(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as SessionData;
      session.pageViews += 1;
      session.lastActivityAt = new Date().toISOString();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// Event Queue
// ============================================

let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

function loadQueueFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      const storedEvents = JSON.parse(stored) as AnalyticsEvent[];
      eventQueue = [...storedEvents, ...eventQueue];
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function saveQueueToStorage(): void {
  if (typeof window === "undefined" || eventQueue.length === 0) return;

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(eventQueue));
  } catch {
    // Ignore storage errors
  }
}

function getClientMetadata(): AnalyticsEvent["metadata"] {
  if (typeof window === "undefined") {
    return undefined;
  }

  return {
    userAgent: navigator.userAgent,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  };
}

// ============================================
// Flush Handler
// ============================================

type FlushHandler = (events: AnalyticsEvent[]) => Promise<boolean>;

let flushHandler: FlushHandler | null = null;

/**
 * Set the handler for flushing events to storage
 */
export function setFlushHandler(handler: FlushHandler): void {
  flushHandler = handler;
}

/**
 * Flush queued events to storage
 */
export async function flush(): Promise<boolean> {
  if (eventQueue.length === 0) {
    return true;
  }

  if (!flushHandler) {
    // No handler set, keep events in queue
    saveQueueToStorage();
    return false;
  }

  const eventsToFlush = [...eventQueue];
  eventQueue = [];

  try {
    const success = await flushHandler(eventsToFlush);
    if (!success) {
      // Failed to flush, put events back
      eventQueue = [...eventsToFlush, ...eventQueue];
      saveQueueToStorage();
    }
    return success;
  } catch {
    // Error flushing, put events back
    eventQueue = [...eventsToFlush, ...eventQueue];
    saveQueueToStorage();
    return false;
  }
}

function scheduleFlush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  flushTimer = setTimeout(() => {
    flush();
    flushTimer = null;
  }, FLUSH_INTERVAL_MS);
}

// ============================================
// Event Tracking
// ============================================

/**
 * Set the current user ID for tracking
 */
export function setUserId(userId: string | null): void {
  currentUserId = userId;
}

/**
 * Get the current session ID
 */
export function getSessionId(): string {
  return getOrCreateSession().id;
}

/**
 * Track an analytics event
 */
export function trackEvent(
  eventType: AnalyticsEventType,
  eventData: EventData,
  options?: {
    projectId?: string;
    immediate?: boolean;
  }
): void {
  const session = getOrCreateSession();
  updateSessionActivity();

  const event: AnalyticsEvent = {
    id: generateId(),
    userId: currentUserId || "anonymous",
    eventType,
    eventData,
    timestamp: new Date().toISOString(),
    sessionId: session.id,
    projectId: options?.projectId,
    metadata: getClientMetadata(),
  };

  eventQueue.push(event);

  // Flush immediately if requested or queue is full
  if (options?.immediate || eventQueue.length >= BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Track a page view
 */
export function trackPageView(
  path: string,
  options?: {
    referrer?: string;
    title?: string;
    projectId?: string;
  }
): void {
  incrementPageViews();

  trackEvent(
    "page_viewed",
    {
      path,
      referrer: options?.referrer || (typeof document !== "undefined" ? document.referrer : undefined),
      title: options?.title || (typeof document !== "undefined" ? document.title : undefined),
    },
    { projectId: options?.projectId }
  );
}

/**
 * Track session start
 */
export function trackSessionStart(): void {
  const session = getOrCreateSession();

  trackEvent(
    "session_started",
    {
      sessionId: session.id,
    },
    { immediate: true }
  );
}

/**
 * Track session end
 */
export function trackSessionEnd(): void {
  const session = getOrCreateSession();
  const startTime = new Date(session.startedAt).getTime();
  const duration = Date.now() - startTime;

  trackEvent(
    "session_ended",
    {
      sessionId: session.id,
      duration,
      pageViews: session.pageViews,
    },
    { immediate: true }
  );
}

// ============================================
// Convenience Tracking Functions
// ============================================

/**
 * Track project creation
 */
export function trackProjectCreated(
  projectId: string,
  projectName: string,
  templateType?: string
): void {
  trackEvent(
    "project_created",
    { projectId, projectName, templateType },
    { projectId }
  );
}

/**
 * Track generation event
 */
export function trackGeneration(
  projectId: string,
  generationType: "outline" | "chapter" | "illustration" | "cover",
  options: {
    success: boolean;
    durationMs?: number;
    chapterNumber?: number;
    variantIndex?: number;
    creditsUsed?: number;
    errorMessage?: string;
  }
): void {
  trackEvent(
    options.success ? `${generationType}_generated` as AnalyticsEventType : "generation_failed",
    {
      projectId,
      generationType,
      success: options.success,
      durationMs: options.durationMs,
      chapterNumber: options.chapterNumber,
      variantIndex: options.variantIndex,
      creditsUsed: options.creditsUsed,
      errorMessage: options.errorMessage,
    },
    { projectId }
  );
}

/**
 * Track credit usage
 */
export function trackCreditsUsed(
  amount: number,
  creditType: "character" | "book",
  reason?: string
): void {
  trackEvent("credits_used", {
    amount,
    creditType,
    action: "used",
    reason,
  });
}

/**
 * Track export
 */
export function trackExport(
  projectId: string,
  format: "pdf" | "epub",
  options: {
    success: boolean;
    pageCount?: number;
    durationMs?: number;
    errorMessage?: string;
  }
): void {
  trackEvent(
    options.success ? "export_completed" : "export_failed",
    {
      projectId,
      exportFormat: format,
      success: options.success,
      pageCount: options.pageCount,
      durationMs: options.durationMs,
      errorMessage: options.errorMessage,
    },
    { projectId }
  );
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the analytics tracker
 */
export function initializeTracker(userId?: string): void {
  if (userId) {
    setUserId(userId);
  }

  // Load any queued events from storage
  loadQueueFromStorage();

  // Set up beforeunload to save queue
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      saveQueueToStorage();
    });

    // Track session start
    trackSessionStart();
  }
}

/**
 * Cleanup the tracker
 */
export function cleanupTracker(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Try to flush remaining events
  flush();
}

// ============================================
// Debug Utilities
// ============================================

/**
 * Get current queue size (for debugging)
 */
export function getQueueSize(): number {
  return eventQueue.length;
}

/**
 * Get all queued events (for debugging)
 */
export function getQueuedEvents(): AnalyticsEvent[] {
  return [...eventQueue];
}
