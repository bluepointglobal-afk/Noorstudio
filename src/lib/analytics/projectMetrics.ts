/**
 * Project Metrics
 * Track project lifecycle and content metrics
 */

import type {
  AnalyticsEvent,
  ProjectMetrics,
  ProjectEventData,
} from "./types";
import { queryEvents } from "./storage";

// ============================================
// Project Status Tracking
// ============================================

interface ProjectState {
  projectId: string;
  projectName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  lastUpdated: string;
  chapterCount: number;
  illustrationCount: number;
  characterCount: number;
}

/**
 * Build project state from events
 */
function buildProjectStates(events: AnalyticsEvent[]): Map<string, ProjectState> {
  const projects = new Map<string, ProjectState>();

  // Sort events by timestamp
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const event of sortedEvents) {
    const data = event.eventData as ProjectEventData;
    const projectId = data.projectId || event.projectId;

    if (!projectId) continue;

    let project = projects.get(projectId);

    if (!project) {
      project = {
        projectId,
        projectName: data.projectName || "Untitled",
        status: "draft",
        createdAt: event.timestamp,
        lastUpdated: event.timestamp,
        chapterCount: 0,
        illustrationCount: 0,
        characterCount: 0,
      };
      projects.set(projectId, project);
    }

    // Update based on event type
    switch (event.eventType) {
      case "project_created":
        project.createdAt = event.timestamp;
        project.projectName = data.projectName || project.projectName;
        project.status = "draft";
        break;

      case "project_updated":
      case "project_opened":
        project.lastUpdated = event.timestamp;
        if (data.status) {
          project.status = data.status;
        }
        break;

      case "project_completed":
        project.status = "completed";
        project.completedAt = event.timestamp;
        project.lastUpdated = event.timestamp;
        break;

      case "chapter_generated":
        project.chapterCount++;
        project.status = "in_progress";
        project.lastUpdated = event.timestamp;
        break;

      case "illustration_generated":
        project.illustrationCount++;
        project.lastUpdated = event.timestamp;
        break;

      case "character_created":
        project.characterCount++;
        project.lastUpdated = event.timestamp;
        break;
    }
  }

  return projects;
}

// ============================================
// Project Metrics
// ============================================

/**
 * Get project metrics for a user
 */
export async function getUserProjectMetrics(
  userId: string
): Promise<ProjectMetrics> {
  // Fetch all project-related events
  const events = await queryEvents({
    userId,
    eventTypes: [
      "project_created",
      "project_opened",
      "project_updated",
      "project_completed",
      "project_deleted",
      "chapter_generated",
      "illustration_generated",
      "character_created",
    ],
    limit: 10000,
  });

  // Build project states
  const projectStates = buildProjectStates(events);
  const projects = Array.from(projectStates.values());

  // Calculate stats by status
  const byStatus = {
    draft: 0,
    inProgress: 0,
    completed: 0,
  };

  let totalCompletionTime = 0;
  let completedCount = 0;
  let totalChapters = 0;
  let totalIllustrations = 0;
  let totalCharacters = 0;

  for (const project of projects) {
    // Count by status
    if (project.status === "draft") {
      byStatus.draft++;
    } else if (project.status === "in_progress") {
      byStatus.inProgress++;
    } else if (project.status === "completed") {
      byStatus.completed++;
      completedCount++;

      // Calculate completion time
      if (project.completedAt) {
        const created = new Date(project.createdAt).getTime();
        const completed = new Date(project.completedAt).getTime();
        totalCompletionTime += completed - created;
      }
    }

    // Sum content
    totalChapters += project.chapterCount;
    totalIllustrations += project.illustrationCount;
    totalCharacters += project.characterCount;
  }

  // Calculate averages
  const avgTimeToComplete =
    completedCount > 0 ? Math.round(totalCompletionTime / completedCount) : 0;

  const completionRate =
    projects.length > 0
      ? Math.round((completedCount / projects.length) * 100)
      : 0;

  const avgChapters =
    projects.length > 0
      ? Math.round((totalChapters / projects.length) * 10) / 10
      : 0;

  const avgIllustrations =
    projects.length > 0
      ? Math.round((totalIllustrations / projects.length) * 10) / 10
      : 0;

  const avgCharacters =
    projects.length > 0
      ? Math.round((totalCharacters / projects.length) * 10) / 10
      : 0;

  // Get recent projects (last 10)
  const recentProjects = projects
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
    .slice(0, 10)
    .map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
      status: p.status,
      lastUpdated: p.lastUpdated,
    }));

  return {
    total: projects.length,
    byStatus,
    completion: {
      avgTimeToComplete,
      completionRate,
    },
    content: {
      avgChaptersPerProject: avgChapters,
      avgIllustrationsPerProject: avgIllustrations,
      avgCharactersPerProject: avgCharacters,
    },
    recentProjects,
  };
}

/**
 * Get project completion rate by template type
 */
export async function getCompletionRateByTemplate(
  userId: string
): Promise<Record<string, number>> {
  const events = await queryEvents({
    userId,
    eventTypes: ["project_created", "project_completed"],
    limit: 10000,
  });

  // Track created and completed by template
  const created: Record<string, number> = {};
  const completed: Record<string, Set<string>> = {};

  for (const event of events) {
    const data = event.eventData as ProjectEventData;
    const template = data.templateType || "unknown";
    const projectId = data.projectId;

    if (event.eventType === "project_created") {
      created[template] = (created[template] || 0) + 1;
    } else if (event.eventType === "project_completed" && projectId) {
      if (!completed[template]) {
        completed[template] = new Set();
      }
      completed[template].add(projectId);
    }
  }

  // Calculate rates
  const rates: Record<string, number> = {};
  for (const template of Object.keys(created)) {
    const createdCount = created[template];
    const completedCount = completed[template]?.size || 0;
    rates[template] =
      createdCount > 0 ? Math.round((completedCount / createdCount) * 100) : 0;
  }

  return rates;
}

/**
 * Get average time to complete a project (in days)
 */
export async function getAverageCompletionDays(
  userId: string
): Promise<number> {
  const events = await queryEvents({
    userId,
    eventTypes: ["project_created", "project_completed"],
    limit: 10000,
  });

  // Build project timelines
  const projectCreated = new Map<string, number>();
  const projectCompleted = new Map<string, number>();

  for (const event of events) {
    const data = event.eventData as ProjectEventData;
    const projectId = data.projectId;
    const timestamp = new Date(event.timestamp).getTime();

    if (!projectId) continue;

    if (event.eventType === "project_created") {
      projectCreated.set(projectId, timestamp);
    } else if (event.eventType === "project_completed") {
      projectCompleted.set(projectId, timestamp);
    }
  }

  // Calculate completion times
  let totalDays = 0;
  let count = 0;

  for (const [projectId, completedTime] of projectCompleted) {
    const createdTime = projectCreated.get(projectId);
    if (createdTime) {
      const days = (completedTime - createdTime) / (1000 * 60 * 60 * 24);
      totalDays += days;
      count++;
    }
  }

  return count > 0 ? Math.round(totalDays / count) : 0;
}

/**
 * Get content production rate (items per day)
 */
export async function getContentProductionRate(
  userId: string,
  days: number = 30
): Promise<{
  chaptersPerDay: number;
  illustrationsPerDay: number;
  coversPerDay: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await queryEvents({
    userId,
    eventTypes: [
      "chapter_generated",
      "illustration_generated",
      "cover_generated",
    ],
    startDate: startDate.toISOString(),
    limit: 10000,
  });

  let chapters = 0;
  let illustrations = 0;
  let covers = 0;

  for (const event of events) {
    if (event.eventType === "chapter_generated") chapters++;
    else if (event.eventType === "illustration_generated") illustrations++;
    else if (event.eventType === "cover_generated") covers++;
  }

  return {
    chaptersPerDay: Math.round((chapters / days) * 100) / 100,
    illustrationsPerDay: Math.round((illustrations / days) * 100) / 100,
    coversPerDay: Math.round((covers / days) * 100) / 100,
  };
}

/**
 * Get most active project (by recent events)
 */
export async function getMostActiveProject(
  userId: string,
  days: number = 7
): Promise<{ projectId: string; projectName: string; eventCount: number } | null> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await queryEvents({
    userId,
    startDate: startDate.toISOString(),
    limit: 10000,
  });

  // Count events by project
  const projectEvents = new Map<string, { name: string; count: number }>();

  for (const event of events) {
    const projectId = event.projectId;
    if (!projectId) continue;

    const data = event.eventData as ProjectEventData;
    const existing = projectEvents.get(projectId) || {
      name: data.projectName || "Untitled",
      count: 0,
    };

    existing.count++;
    if (data.projectName) {
      existing.name = data.projectName;
    }

    projectEvents.set(projectId, existing);
  }

  // Find most active
  let maxProjectId: string | null = null;
  let maxData: { name: string; count: number } | null = null;

  for (const [projectId, data] of projectEvents) {
    if (!maxData || data.count > maxData.count) {
      maxProjectId = projectId;
      maxData = data;
    }
  }

  if (maxProjectId && maxData) {
    return {
      projectId: maxProjectId,
      projectName: maxData.name,
      eventCount: maxData.count,
    };
  }

  return null;
}
