/**
 * Sync Service
 * Coordinates synchronization between localStorage and Supabase
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncLocalToCloud as syncProjects, syncCloudToLocal as syncProjectsFromCloud } from "./projectsService";
import { syncLocalToCloud as syncCharacters, syncCloudToLocal as syncCharactersFromCloud } from "./charactersService";
import { syncLocalToCloud as syncKnowledgeBase } from "./knowledgeBaseService";

export type DataSource = "supabase" | "localStorage";

export interface SyncResult {
  success: boolean;
  projectsSynced: number;
  charactersSynced: number;
  knowledgeBaseSynced: number;
  errors: string[];
  timestamp: string;
}

export interface SyncStatus {
  lastSync: string | null;
  inProgress: boolean;
  dataSource: DataSource;
  online: boolean;
}

// In-memory sync status
let syncStatus: SyncStatus = {
  lastSync: null,
  inProgress: false,
  dataSource: "localStorage",
  online: false,
};

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Determine which data source to use
 */
export async function getDataSource(): Promise<DataSource> {
  // If Supabase not configured, always use localStorage
  if (!isSupabaseConfigured()) {
    return "localStorage";
  }

  // If offline, use localStorage
  if (!isOnline()) {
    return "localStorage";
  }

  // If no auth, use localStorage
  if (!supabase) {
    return "localStorage";
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? "supabase" : "localStorage";
  } catch {
    return "localStorage";
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Update sync status
 */
function updateSyncStatus(updates: Partial<SyncStatus>): void {
  syncStatus = { ...syncStatus, ...updates };
}

/**
 * Sync all local data to Supabase
 */
export async function syncToCloud(): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  // Check prerequisites
  if (!isOnline()) {
    return {
      success: false,
      projectsSynced: 0,
      charactersSynced: 0,
      knowledgeBaseSynced: 0,
      errors: ["Device is offline"],
      timestamp,
    };
  }

  if (!supabase) {
    return {
      success: false,
      projectsSynced: 0,
      charactersSynced: 0,
      knowledgeBaseSynced: 0,
      errors: ["Supabase not configured"],
      timestamp,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      projectsSynced: 0,
      charactersSynced: 0,
      knowledgeBaseSynced: 0,
      errors: ["User not authenticated"],
      timestamp,
    };
  }

  updateSyncStatus({ inProgress: true });

  const errors: string[] = [];

  // Sync projects
  const projectsResult = await syncProjects();
  if (projectsResult.errors.length > 0) {
    errors.push(...projectsResult.errors.map(e => `[Projects] ${e}`));
  }

  // Sync characters
  const charactersResult = await syncCharacters();
  if (charactersResult.errors.length > 0) {
    errors.push(...charactersResult.errors.map(e => `[Characters] ${e}`));
  }

  // Sync knowledge base
  const kbResult = await syncKnowledgeBase();
  if (kbResult.errors.length > 0) {
    errors.push(...kbResult.errors.map(e => `[KB] ${e}`));
  }

  updateSyncStatus({
    inProgress: false,
    lastSync: timestamp,
    dataSource: "supabase",
    online: true,
  });

  return {
    success: errors.length === 0,
    projectsSynced: projectsResult.synced,
    charactersSynced: charactersResult.synced,
    knowledgeBaseSynced: kbResult.synced,
    errors,
    timestamp,
  };
}

/**
 * Sync all cloud data to localStorage
 */
export async function syncFromCloud(): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  // Check prerequisites
  if (!isOnline()) {
    return {
      success: false,
      projectsSynced: 0,
      charactersSynced: 0,
      knowledgeBaseSynced: 0,
      errors: ["Device is offline"],
      timestamp,
    };
  }

  if (!supabase) {
    return {
      success: false,
      projectsSynced: 0,
      charactersSynced: 0,
      knowledgeBaseSynced: 0,
      errors: ["Supabase not configured"],
      timestamp,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      projectsSynced: 0,
      charactersSynced: 0,
      knowledgeBaseSynced: 0,
      errors: ["User not authenticated"],
      timestamp,
    };
  }

  updateSyncStatus({ inProgress: true });

  const errors: string[] = [];

  // Sync projects from cloud
  const projectsResult = await syncProjectsFromCloud();
  if (projectsResult.errors.length > 0) {
    errors.push(...projectsResult.errors.map(e => `[Projects] ${e}`));
  }

  // Sync characters from cloud
  const charactersResult = await syncCharactersFromCloud();
  if (charactersResult.errors.length > 0) {
    errors.push(...charactersResult.errors.map(e => `[Characters] ${e}`));
  }

  // KB sync from cloud not implemented yet - would need to add to kbService
  const kbSynced = 0;

  updateSyncStatus({
    inProgress: false,
    lastSync: timestamp,
    dataSource: "supabase",
    online: true,
  });

  return {
    success: errors.length === 0,
    projectsSynced: projectsResult.synced,
    charactersSynced: charactersResult.synced,
    knowledgeBaseSynced: kbSynced,
    errors,
    timestamp,
  };
}

/**
 * Initialize sync service on app load
 */
export async function initSyncService(): Promise<void> {
  const dataSource = await getDataSource();
  const online = isOnline();

  updateSyncStatus({
    dataSource,
    online,
  });

  // Listen for online/offline events
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      updateSyncStatus({ online: true });
    });

    window.addEventListener("offline", () => {
      updateSyncStatus({ online: false, dataSource: "localStorage" });
    });
  }
}
