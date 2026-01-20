# PRD: Analytics Dashboard

**Feature:** #8 Analytics
**Priority:** P2 - Nice to have
**Status:** In Progress (0% → 100%)

## Overview

Add analytics tracking to understand user behavior, content generation patterns, and system performance. Focus on actionable metrics that help improve the product and user experience.

## Goals

1. Track user engagement and project activity
2. Monitor AI generation usage and success rates
3. Measure export and conversion metrics
4. Provide admin dashboard for insights

## Non-Goals

- Third-party analytics integration (GA, Mixpanel)
- Real-time streaming dashboards
- Complex data warehousing
- User-facing analytics (admin only for MVP)

## Technical Approach

### Event Tracking
Track key events client-side and store in Supabase for analysis.

### Data Model

**AnalyticsEvent:**
```typescript
interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, unknown>;
  timestamp: string;
  sessionId?: string;
  projectId?: string;
}
```

**Event Types:**
- project_created, project_opened, project_completed
- character_created, character_updated
- outline_generated, chapter_generated
- illustration_generated, cover_generated
- export_started, export_completed
- credits_used, credits_purchased

## User Stories

### US-001: Analytics Types
Define TypeScript types for analytics events.

**Acceptance Criteria:**
- Create `src/lib/analytics/types.ts`
- Define AnalyticsEvent interface
- Define AnalyticsEventType union type
- Define EventData types per event
- Define AnalyticsSummary for aggregations
- Typecheck passes

### US-002: Event Tracker
Create client-side event tracking service.

**Acceptance Criteria:**
- Create `src/lib/analytics/tracker.ts`
- Implement trackEvent(type, data) function
- Generate unique session IDs
- Queue events for batch sending
- Implement flush() for immediate send
- Handle offline gracefully
- Typecheck passes

### US-003: Analytics Storage
Store analytics events in Supabase.

**Acceptance Criteria:**
- Create `supabase/migrations/007_analytics_table.sql`
- Create analytics_events table with proper indexes
- Add RLS policies (admin read, user write own)
- Create `src/lib/analytics/storage.ts`
- Implement saveEvents() batch insert
- Typecheck passes

### US-004: Usage Metrics
Track AI generation and credit usage.

**Acceptance Criteria:**
- Create `src/lib/analytics/usageMetrics.ts`
- Track generation requests (type, duration, success)
- Track credit consumption per action
- Calculate daily/weekly/monthly usage
- Return UsageMetrics summary object
- Typecheck passes

### US-005: Project Metrics
Track project lifecycle metrics.

**Acceptance Criteria:**
- Create `src/lib/analytics/projectMetrics.ts`
- Track projects by status (draft, in_progress, completed)
- Calculate average completion time
- Track chapters and illustrations per project
- Return ProjectMetrics summary object
- Typecheck passes

### US-006: Analytics Hooks
Create React hooks for easy tracking.

**Acceptance Criteria:**
- Create `src/lib/analytics/hooks.ts`
- Implement useAnalytics() hook
- Implement useTrackPageView() hook
- Implement useTrackEvent() hook
- Auto-track on component mount/unmount
- Typecheck passes

### US-007: Analytics Index
Export unified analytics API.

**Acceptance Criteria:**
- Create `src/lib/analytics/index.ts`
- Export all types and functions
- Export React hooks
- Add getAnalyticsSummary() for admin
- Typecheck passes

## Success Metrics

- All events tracked without performance impact
- Batch sending reduces API calls by 80%
- Analytics data queryable in Supabase

## Dependencies

- Supabase for storage
- Existing credit system
- Project management system

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance impact | Batch events, async processing |
| Storage costs | Aggregate old events, set retention |
| Privacy concerns | No PII in event data |
