/**
 * Analytics React Hooks
 * Easy-to-use hooks for tracking in React components
 */

import { useEffect, useCallback, useRef } from "react";
import type { AnalyticsEventType, EventData } from "./types";
import {
  trackEvent,
  trackPageView,
  setUserId,
  initializeTracker,
  cleanupTracker,
  setFlushHandler,
} from "./tracker";
import { saveEvents } from "./storage";

// ============================================
// Analytics Provider Hook
// ============================================

/**
 * Initialize analytics tracking for the app
 * Call this once at the app root level
 */
export function useAnalyticsInit(userId?: string): void {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set up flush handler to save to Supabase
    setFlushHandler(saveEvents);

    // Initialize tracker
    initializeTracker(userId);

    // Cleanup on unmount
    return () => {
      cleanupTracker();
    };
  }, [userId]);

  // Update user ID if it changes
  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId]);
}

// ============================================
// Analytics Hook
// ============================================

interface UseAnalyticsReturn {
  /** Track a custom event */
  track: (
    eventType: AnalyticsEventType,
    eventData?: EventData,
    options?: { projectId?: string; immediate?: boolean }
  ) => void;

  /** Track a page view */
  trackPage: (path?: string, title?: string) => void;

  /** Set the current user */
  setUser: (userId: string | null) => void;
}

/**
 * Main analytics hook for tracking events
 */
export function useAnalytics(): UseAnalyticsReturn {
  const track = useCallback(
    (
      eventType: AnalyticsEventType,
      eventData: EventData = {},
      options?: { projectId?: string; immediate?: boolean }
    ) => {
      trackEvent(eventType, eventData, options);
    },
    []
  );

  const trackPage = useCallback((path?: string, title?: string) => {
    const currentPath =
      path || (typeof window !== "undefined" ? window.location.pathname : "/");
    const currentTitle =
      title || (typeof document !== "undefined" ? document.title : "");

    trackPageView(currentPath, { title: currentTitle });
  }, []);

  const setUser = useCallback((userId: string | null) => {
    setUserId(userId);
  }, []);

  return { track, trackPage, setUser };
}

// ============================================
// Page View Hook
// ============================================

/**
 * Track page view on component mount
 * Automatically tracks the current path
 */
export function useTrackPageView(options?: {
  path?: string;
  title?: string;
  projectId?: string;
}): void {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (tracked.current) return;
    tracked.current = true;

    const path =
      options?.path ||
      (typeof window !== "undefined" ? window.location.pathname : "/");
    const title =
      options?.title ||
      (typeof document !== "undefined" ? document.title : "");

    trackPageView(path, {
      title,
      projectId: options?.projectId,
    });

    // Reset on unmount to allow tracking again if component remounts
    return () => {
      tracked.current = false;
    };
  }, [options?.path, options?.title, options?.projectId]);
}

// ============================================
// Event Tracking Hook
// ============================================

/**
 * Returns a memoized function to track a specific event type
 */
export function useTrackEvent(
  eventType: AnalyticsEventType,
  defaultData?: Partial<EventData>,
  options?: { projectId?: string }
): (additionalData?: EventData) => void {
  return useCallback(
    (additionalData?: EventData) => {
      trackEvent(
        eventType,
        { ...defaultData, ...additionalData },
        { projectId: options?.projectId }
      );
    },
    [eventType, defaultData, options?.projectId]
  );
}

// ============================================
// Lifecycle Tracking Hooks
// ============================================

/**
 * Track when a component mounts and unmounts
 */
export function useTrackMountUnmount(
  componentName: string,
  options?: { projectId?: string }
): void {
  useEffect(() => {
    trackEvent(
      "page_viewed",
      { path: `component:${componentName}`, title: `Mounted: ${componentName}` },
      { projectId: options?.projectId }
    );

    return () => {
      trackEvent(
        "page_viewed",
        {
          path: `component:${componentName}`,
          title: `Unmounted: ${componentName}`,
        },
        { projectId: options?.projectId }
      );
    };
  }, [componentName, options?.projectId]);
}

// ============================================
// Project-Scoped Hooks
// ============================================

/**
 * Analytics hook scoped to a specific project
 */
export function useProjectAnalytics(projectId: string): {
  trackProjectEvent: (
    eventType: AnalyticsEventType,
    eventData?: EventData
  ) => void;
  trackGeneration: (
    type: "outline" | "chapter" | "illustration" | "cover",
    success: boolean,
    options?: { durationMs?: number; chapterNumber?: number; creditsUsed?: number }
  ) => void;
  trackExport: (
    format: "pdf" | "epub",
    success: boolean,
    options?: { pageCount?: number; durationMs?: number }
  ) => void;
} {
  const trackProjectEvent = useCallback(
    (eventType: AnalyticsEventType, eventData: EventData = {}) => {
      trackEvent(eventType, { ...eventData, projectId }, { projectId });
    },
    [projectId]
  );

  const trackGeneration = useCallback(
    (
      type: "outline" | "chapter" | "illustration" | "cover",
      success: boolean,
      options?: {
        durationMs?: number;
        chapterNumber?: number;
        creditsUsed?: number;
      }
    ) => {
      const eventType = success
        ? (`${type}_generated` as AnalyticsEventType)
        : "generation_failed";

      trackEvent(
        eventType,
        {
          projectId,
          generationType: type,
          success,
          durationMs: options?.durationMs,
          chapterNumber: options?.chapterNumber,
          creditsUsed: options?.creditsUsed,
        },
        { projectId }
      );
    },
    [projectId]
  );

  const trackExport = useCallback(
    (
      format: "pdf" | "epub",
      success: boolean,
      options?: { pageCount?: number; durationMs?: number }
    ) => {
      trackEvent(
        success ? "export_completed" : "export_failed",
        {
          projectId,
          exportFormat: format,
          success,
          pageCount: options?.pageCount,
          durationMs: options?.durationMs,
        },
        { projectId }
      );
    },
    [projectId]
  );

  return { trackProjectEvent, trackGeneration, trackExport };
}

// ============================================
// Timing Hooks
// ============================================

/**
 * Track duration of an operation
 */
export function useTrackDuration(): {
  startTimer: () => void;
  endTimer: (
    eventType: AnalyticsEventType,
    eventData?: EventData,
    options?: { projectId?: string }
  ) => void;
} {
  const startTime = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  const endTimer = useCallback(
    (
      eventType: AnalyticsEventType,
      eventData: EventData = {},
      options?: { projectId?: string }
    ) => {
      if (startTime.current === null) return;

      const durationMs = Date.now() - startTime.current;
      startTime.current = null;

      trackEvent(eventType, { ...eventData, durationMs }, options);
    },
    []
  );

  return { startTimer, endTimer };
}

// ============================================
// Error Tracking Hook
// ============================================

/**
 * Track errors in a component
 */
export function useTrackError(
  componentName: string,
  options?: { projectId?: string }
): (error: Error, context?: Record<string, unknown>) => void {
  return useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      trackEvent(
        "generation_failed",
        {
          errorMessage: error.message,
          errorName: error.name,
          component: componentName,
          ...context,
        },
        { projectId: options?.projectId, immediate: true }
      );
    },
    [componentName, options?.projectId]
  );
}
