// Share Store - Project sharing and permissions management
// Handles collaborative editing with view/edit permissions

import { StoredProject, ProjectPermission, ProjectShare, getProject, updateProject } from "@/lib/storage/projectsStore";
import { authenticatedFetch } from "@/lib/utils/api";

// ============================================
// Types
// ============================================

export interface ShareToken {
  token: string;
  permission: ProjectPermission;
  createdAt: string;
  expiresAt?: string;
}

export interface ShareInvitation {
  projectId: string;
  shareToken: string;
  permission: ProjectPermission;
  sharedBy?: string;
}

export interface ShareResult {
  success: boolean;
  share?: ProjectShare;
  shareToken?: string;
  shareUrl?: string;
  error?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  permission?: ProjectPermission;
  reason?: string;
}

// ============================================
// Share Token Generation
// ============================================

/**
 * Generate a unique share token (for MVP: stored in localStorage with Supabase fallback)
 */
export function generateShareToken(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

/**
 * Share project with a collaborator (email + permission)
 * For MVP: stores in project's sharedWith array
 * For production: stores in Supabase with token
 */
export async function shareProject(
  projectId: string,
  email: string,
  permission: ProjectPermission
): Promise<ShareResult> {
  try {
    const project = getProject(projectId);
    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Check if already shared with this email
    const existing = project.sharedWith?.find((s) => s.email === email);
    if (existing) {
      return {
        success: false,
        error: `Project already shared with ${email}`,
      };
    }

    // Create share record
    const now = new Date().toISOString();
    const share: ProjectShare = {
      email,
      permission,
      sharedAt: now,
    };

    // Generate share token for this collaboration
    const shareToken = generateShareToken();
    const shareTokens = project.shareTokens || {};
    shareTokens[shareToken] = {
      permission,
      createdAt: now,
    };

    // Update project with new share
    const sharedWith = project.sharedWith || [];
    sharedWith.push(share);

    const updated = updateProject(projectId, {
      sharedWith,
      shareTokens,
    });

    if (!updated) {
      return {
        success: false,
        error: "Failed to update project",
      };
    }

    // TODO: In production, store share token in Supabase for cross-device access
    // For MVP, generate a shareable link with token
    const shareUrl = generateShareLink(projectId, shareToken);

    return {
      success: true,
      share,
      shareToken,
      shareUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to share project",
    };
  }
}

/**
 * Generate a shareable link with token
 */
export function generateShareLink(projectId: string, shareToken: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${projectId}?token=${shareToken}`;
}

/**
 * Update share permission for a collaborator
 */
export function updateSharePermission(
  projectId: string,
  email: string,
  newPermission: ProjectPermission
): ShareResult {
  try {
    const project = getProject(projectId);
    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const sharedWith = project.sharedWith || [];
    const shareIndex = sharedWith.findIndex((s) => s.email === email);

    if (shareIndex === -1) {
      return {
        success: false,
        error: "Collaborator not found",
      };
    }

    // Update permission
    sharedWith[shareIndex] = {
      ...sharedWith[shareIndex],
      permission: newPermission,
    };

    const updated = updateProject(projectId, { sharedWith });

    if (!updated) {
      return {
        success: false,
        error: "Failed to update permission",
      };
    }

    return {
      success: true,
      share: sharedWith[shareIndex],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update permission",
    };
  }
}

/**
 * Remove a collaborator from the project
 */
export function removeShareAccess(projectId: string, email: string): ShareResult {
  try {
    const project = getProject(projectId);
    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const sharedWith = project.sharedWith || [];
    const filtered = sharedWith.filter((s) => s.email !== email);

    if (filtered.length === sharedWith.length) {
      return {
        success: false,
        error: "Collaborator not found",
      };
    }

    const updated = updateProject(projectId, { sharedWith: filtered });

    if (!updated) {
      return {
        success: false,
        error: "Failed to remove access",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove access",
    };
  }
}

/**
 * Check if a user has permission to perform an action on a project
 * For MVP: checks against sharedWith array (email-based)
 * For production: checks share token in Supabase
 */
export function checkProjectPermission(
  projectId: string,
  currentUserEmail: string,
  requiredPermission: ProjectPermission = "view"
): PermissionCheckResult {
  const project = getProject(projectId);
  if (!project) {
    return {
      allowed: false,
      reason: "Project not found",
    };
  }

  // Owner has full access
  // For MVP: we don't have user tracking, so assume current user is owner
  // In production, compare against project.ownerId
  // For now, we'll check if they're in sharedWith
  const sharedWith = project.sharedWith || [];

  // If not shared with anyone, only the owner (current user) can access
  // This is a simplification for MVP
  if (sharedWith.length === 0) {
    return {
      allowed: true,
      permission: "edit",
      reason: "Owner",
    };
  }

  // Check if user is in the shared list
  const share = sharedWith.find((s) => s.email === currentUserEmail);

  if (!share) {
    return {
      allowed: false,
      reason: "Not shared with this user",
    };
  }

  // Check if they have the required permission
  if (requiredPermission === "edit" && share.permission === "view") {
    return {
      allowed: false,
      permission: share.permission,
      reason: "Insufficient permissions (view-only access)",
    };
  }

  return {
    allowed: true,
    permission: share.permission,
    reason: `Has ${share.permission} access`,
  };
}

/**
 * Verify a share token and return the associated permission
 * For MVP: checks localStorage token
 * For production: verifies against Supabase
 */
export function verifyShareToken(
  projectId: string,
  token: string
): PermissionCheckResult {
  const project = getProject(projectId);
  if (!project) {
    return {
      allowed: false,
      reason: "Project not found",
    };
  }

  const shareTokens = project.shareTokens || {};
  const tokenRecord = shareTokens[token];

  if (!tokenRecord) {
    return {
      allowed: false,
      reason: "Invalid or expired share token",
    };
  }

  // Check if token is expired (if expiration is set)
  if (tokenRecord.createdAt) {
    const createdAt = new Date(tokenRecord.createdAt).getTime();
    const now = Date.now();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year for MVP

    if (now - createdAt > maxAge) {
      return {
        allowed: false,
        reason: "Share token has expired",
      };
    }
  }

  return {
    allowed: true,
    permission: tokenRecord.permission,
    reason: `Valid token with ${tokenRecord.permission} access`,
  };
}

/**
 * Get all collaborators for a project
 */
export function getProjectCollaborators(projectId: string): ProjectShare[] {
  const project = getProject(projectId);
  if (!project) return [];
  return project.sharedWith || [];
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(link: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to copy share link:", error);
    }
    return false;
  }
}
