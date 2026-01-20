/**
 * Projects Supabase Service
 * Provides CRUD operations for projects table with localStorage fallback
 */

import { supabase } from "@/lib/supabase/client";
import { StoredProject, listProjects as listLocalProjects, getProject as getLocalProject, saveProject as saveLocalProject, deleteProject as deleteLocalProject } from "../projectsStore";

export interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  data: StoredProject;
  created_at: string;
  updated_at: string;
}

/**
 * Check if Supabase is available and user is authenticated
 */
async function canUseSupabase(): Promise<{ available: boolean; userId: string | null }> {
  if (!supabase) {
    return { available: false, userId: null };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return { available: !!user, userId: user?.id || null };
  } catch {
    return { available: false, userId: null };
  }
}

/**
 * List all projects for the current user
 * Falls back to localStorage if Supabase unavailable
 */
export async function listProjects(): Promise<StoredProject[]> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return listLocalProjects();
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[ProjectsService] Supabase error, falling back to localStorage:", error.message);
      return listLocalProjects();
    }

    return (data as ProjectRow[]).map(row => ({
      ...row.data,
      id: row.id,
    }));
  } catch (err) {
    console.warn("[ProjectsService] Error fetching from Supabase:", err);
    return listLocalProjects();
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<StoredProject | null> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return getLocalProject(id);
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      // Try localStorage if not found in Supabase
      return getLocalProject(id);
    }

    const row = data as ProjectRow;
    return {
      ...row.data,
      id: row.id,
    };
  } catch {
    return getLocalProject(id);
  }
}

/**
 * Save a project (create or update)
 */
export async function saveProject(project: StoredProject): Promise<void> {
  // Always save to localStorage as cache
  saveLocalProject(project);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from("projects")
      .upsert({
        id: project.id,
        user_id: userId,
        title: project.title,
        data: project,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    if (error) {
      console.warn("[ProjectsService] Failed to save to Supabase:", error.message);
    }
  } catch (err) {
    console.warn("[ProjectsService] Error saving to Supabase:", err);
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  // Delete from localStorage
  const localResult = deleteLocalProject(id);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return localResult;
  }

  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.warn("[ProjectsService] Failed to delete from Supabase:", error.message);
    }

    return true;
  } catch (err) {
    console.warn("[ProjectsService] Error deleting from Supabase:", err);
    return localResult;
  }
}

/**
 * Sync all local projects to Supabase
 */
export async function syncLocalToCloud(): Promise<{ synced: number; errors: string[] }> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return { synced: 0, errors: ["Supabase not available or user not authenticated"] };
  }

  const localProjects = listLocalProjects();
  const errors: string[] = [];
  let synced = 0;

  for (const project of localProjects) {
    try {
      const { error } = await supabase
        .from("projects")
        .upsert({
          id: project.id,
          user_id: userId,
          title: project.title,
          data: project,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        }, {
          onConflict: "id",
        });

      if (error) {
        errors.push(`Project ${project.id}: ${error.message}`);
      } else {
        synced++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Project ${project.id}: ${message}`);
    }
  }

  return { synced, errors };
}

/**
 * Sync all cloud projects to localStorage
 */
export async function syncCloudToLocal(): Promise<{ synced: number; errors: string[] }> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return { synced: 0, errors: ["Supabase not available or user not authenticated"] };
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return { synced: 0, errors: [error.message] };
    }

    let synced = 0;
    for (const row of data as ProjectRow[]) {
      const project: StoredProject = {
        ...row.data,
        id: row.id,
      };
      saveLocalProject(project);
      synced++;
    }

    return { synced, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { synced: 0, errors: [message] };
  }
}
