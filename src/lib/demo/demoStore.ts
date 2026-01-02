// Demo Store - Safe read-only access to projects for public demo links
// This module provides access to project data for the demo viewer
// SECURITY: Client uses anon key for read-only. Writes go through server endpoint.

import { StoredProject, getProject } from "@/lib/storage/projectsStore";
import { StoredCharacter, getCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary, getKBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import { isSupabaseConfigured, getSharedProject } from "@/lib/supabase";

// ============================================
// Types
// ============================================

export interface DemoProjectData {
  project: StoredProject;
  characters: StoredCharacter[];
  kbSummary: KBRulesSummary | null;
}

export interface DemoLoadResult {
  success: boolean;
  data?: DemoProjectData;
  error?: string;
  errorType?: "not_found" | "invalid_id" | "parse_error" | "token_required" | "token_invalid";
}

export interface SanitizedProject {
  id: string;
  title: string;
  templateType: string;
  ageRange: string;
  layoutStyle: string;
  trimSize: string;
  synopsis?: string;
  learningObjective?: string;
  setting?: string;
  knowledgeBaseName?: string;
  createdAt: string;
  updatedAt: string;
  // Sanitized artifacts (no internal data)
  artifacts: Record<string, unknown>;
  exportPackage?: unknown;
  exportHistory?: unknown[];
  // Sanitized characters
  characters: Array<{
    id: string;
    name: string;
    role: string;
    thumbnailUrl?: string;
    traits?: string[];
  }>;
  // KB summary only (no full KB data)
  kbSummary?: {
    kbName: string;
    faithRules: string[];
    vocabularyRules: string[];
    illustrationRules: string[];
  };
}

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  error?: string;
  isCloudEnabled: boolean;
}

// ============================================
// Demo Data Access
// ============================================

/**
 * Sanitize a project for public sharing
 * Removes internal logs, prompts, secrets, and sensitive data
 */
export function sanitizeProjectForShare(
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null
): SanitizedProject {
  // Sanitize artifacts - remove internal fields like _structured, _rawText
  const sanitizedArtifacts: Record<string, unknown> = {};

  for (const [key, artifact] of Object.entries(project.artifacts)) {
    if (key === "_aiUsage") continue; // Skip internal usage tracking

    if (artifact?.content) {
      // Deep clone and remove internal fields
      const content = JSON.parse(JSON.stringify(artifact.content));

      // Remove internal fields from arrays
      if (Array.isArray(content)) {
        sanitizedArtifacts[key] = {
          ...artifact,
          content: content.map((item: Record<string, unknown>) => {
            const { _structured, _rawText, _needsReview, ...rest } = item;
            return rest;
          }),
        };
      } else if (typeof content === "object") {
        const { _structured, _rawText, _needsReview, ...rest } = content;
        sanitizedArtifacts[key] = { ...artifact, content: rest };
      } else {
        sanitizedArtifacts[key] = artifact;
      }
    }
  }

  // Sanitize characters - only public info
  const sanitizedCharacters = characters.map((char) => ({
    id: char.id,
    name: char.name,
    role: char.role,
    thumbnailUrl: char.thumbnailUrl,
    traits: char.traits,
  }));

  return {
    id: project.id,
    title: project.title,
    templateType: project.templateType,
    ageRange: project.ageRange,
    layoutStyle: project.layoutStyle,
    trimSize: project.trimSize,
    synopsis: project.synopsis,
    learningObjective: project.learningObjective,
    setting: project.setting,
    knowledgeBaseName: project.knowledgeBaseName,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    artifacts: sanitizedArtifacts,
    exportPackage: project.exportPackage,
    exportHistory: project.exportHistory,
    characters: sanitizedCharacters,
    kbSummary: kbSummary
      ? {
          kbName: kbSummary.kbName,
          faithRules: kbSummary.faithRules,
          vocabularyRules: kbSummary.vocabularyRules,
          illustrationRules: kbSummary.illustrationRules,
        }
      : undefined,
  };
}

/**
 * Load a project for demo viewing
 * First tries localStorage, then Supabase if token provided
 */
export async function loadProjectForDemo(
  projectId: string,
  shareToken?: string
): Promise<DemoLoadResult> {
  // Validate project ID format
  if (!projectId || typeof projectId !== "string" || projectId.length < 5) {
    return {
      success: false,
      error: "Invalid project ID format",
      errorType: "invalid_id",
    };
  }

  try {
    // First, try to load from localStorage
    const localProject = getProject(projectId);

    if (localProject) {
      // Load associated characters
      const characters = localProject.characterIds
        .map((charId) => getCharacter(charId))
        .filter((c): c is StoredCharacter => c !== null);

      // Load KB rules summary
      let kbSummary: KBRulesSummary | null = null;
      if (localProject.knowledgeBaseId) {
        kbSummary = getKBRulesSummary(localProject.knowledgeBaseId);
      }

      return {
        success: true,
        data: {
          project: localProject,
          characters,
          kbSummary,
        },
      };
    }

    // Project not found locally - need to fetch from cloud
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: "Project not found on this device. Cloud sharing is not configured.",
        errorType: "not_found",
      };
    }

    // Token is required for cross-device access
    if (!shareToken) {
      return {
        success: false,
        error: "This link requires a share token. The URL may be incomplete.",
        errorType: "token_required",
      };
    }

    // Try to fetch from Supabase with token
    const sharedProject = await getSharedProject(projectId, shareToken);

    if (!sharedProject) {
      return {
        success: false,
        error: "Link invalid or expired. The share token may be incorrect or the project may have been removed.",
        errorType: "token_invalid",
      };
    }

    // Parse and return the shared project
    try {
      const sanitized = JSON.parse(sharedProject.payload) as SanitizedProject;

      // Convert sanitized project back to expected format
      const project: StoredProject = {
        id: sanitized.id,
        title: sanitized.title,
        templateType: sanitized.templateType as StoredProject["templateType"],
        ageRange: sanitized.ageRange,
        layoutStyle: sanitized.layoutStyle as StoredProject["layoutStyle"],
        trimSize: sanitized.trimSize as StoredProject["trimSize"],
        synopsis: sanitized.synopsis,
        learningObjective: sanitized.learningObjective,
        setting: sanitized.setting,
        knowledgeBaseName: sanitized.knowledgeBaseName,
        createdAt: sanitized.createdAt,
        updatedAt: sanitized.updatedAt,
        artifacts: sanitized.artifacts as StoredProject["artifacts"],
        exportPackage: sanitized.exportPackage as StoredProject["exportPackage"],
        exportHistory: sanitized.exportHistory as StoredProject["exportHistory"],
        // These won't be available from shared data
        characterIds: sanitized.characters.map((c) => c.id),
        knowledgeBaseId: "",
        universeId: "",
        universeName: "",
        exportTargets: [],
        pipeline: [],
        currentStage: "outline",
      };

      // Convert sanitized characters
      const characters: StoredCharacter[] = sanitized.characters.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        thumbnailUrl: c.thumbnailUrl,
        traits: c.traits,
        status: "locked" as const,
        createdAt: "",
        updatedAt: "",
      }));

      const kbSummary: KBRulesSummary | null = sanitized.kbSummary || null;

      return {
        success: true,
        data: {
          project,
          characters,
          kbSummary,
        },
      };
    } catch (parseErr) {
      console.error("Error parsing shared project:", parseErr);
      return {
        success: false,
        error: "Failed to parse project data.",
        errorType: "parse_error",
      };
    }
  } catch (error) {
    console.error("Error loading demo project:", error);
    return {
      success: false,
      error: "Failed to load project data. Please try again.",
      errorType: "parse_error",
    };
  }
}

/**
 * Generate a shareable demo URL for a project
 */
export function getDemoUrl(projectId: string): string {
  return `${window.location.origin}/demo/${projectId}`;
}

/**
 * Copy demo URL to clipboard
 */
export async function copyDemoUrl(projectId: string): Promise<boolean> {
  try {
    const url = getDemoUrl(projectId);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy demo URL:", error);
    return false;
  }
}

// ============================================
// Demo Mode Detection
// ============================================

/**
 * Check if the current route is a demo route
 */
export function isDemoRoute(): boolean {
  return window.location.pathname.startsWith("/demo/");
}

/**
 * Extract project ID from demo URL
 */
export function getProjectIdFromDemoUrl(): string | null {
  const match = window.location.pathname.match(/^\/demo\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Extract share token from URL query params
 */
export function getShareTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("t");
}

// ============================================
// Cloud Sharing (via Server Endpoint)
// ============================================

// Server endpoint for sharing (writes require service_role key)
const SHARE_API_URL = "/api/share/upsert";

interface ServerShareResponse {
  success: boolean;
  projectId?: string;
  shareToken?: string;
  shareUrl?: string;
  error?: string;
}

/**
 * Check if sharing server is available
 */
async function isShareServerConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/share/status");
    if (!res.ok) return false;
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

/**
 * Share a project to the cloud for cross-device access
 * SECURITY: Writes go through server endpoint (not direct Supabase)
 * Returns a shareable URL with token
 */
export async function shareProjectToCloud(
  projectId: string,
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null
): Promise<ShareResult> {
  // Check if server sharing is available
  const serverConfigured = await isShareServerConfigured();

  if (!serverConfigured) {
    // Fall back to local-only sharing
    return {
      success: true,
      shareUrl: getDemoUrl(projectId),
      isCloudEnabled: false,
    };
  }

  try {
    // Sanitize project data for sharing
    const sanitized = sanitizeProjectForShare(project, characters, kbSummary);
    const payload = JSON.stringify(sanitized);

    // Call server endpoint (server uses service_role key)
    const response = await fetch(SHARE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        payload,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Server error: ${response.status}`,
        isCloudEnabled: true,
      };
    }

    const result: ServerShareResponse = await response.json();

    if (!result.success || !result.shareUrl) {
      return {
        success: false,
        error: result.error || "Failed to generate share link",
        isCloudEnabled: true,
      };
    }

    return {
      success: true,
      shareUrl: result.shareUrl,
      isCloudEnabled: true,
    };
  } catch (error) {
    console.error("Error sharing project to cloud:", error);
    return {
      success: false,
      error: "Failed to share project. Please try again.",
      isCloudEnabled: true,
    };
  }
}

/**
 * Copy share URL to clipboard
 * Uses cloud sharing if available, otherwise local
 */
export async function copyShareUrl(
  projectId: string,
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null
): Promise<ShareResult> {
  const shareResult = await shareProjectToCloud(
    projectId,
    project,
    characters,
    kbSummary
  );

  if (!shareResult.success || !shareResult.shareUrl) {
    return shareResult;
  }

  try {
    await navigator.clipboard.writeText(shareResult.shareUrl);
    return shareResult;
  } catch (error) {
    console.error("Failed to copy share URL:", error);
    return {
      ...shareResult,
      success: false,
      error: "Failed to copy URL to clipboard",
    };
  }
}
