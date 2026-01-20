/**
 * Data Migration Utility
 * Handles migration from localStorage to Supabase cloud storage
 */

import { listProjects, clearAllProjects } from "./projectsStore";
import { getCharacters, clearAllCharacters } from "./charactersStore";
import { listKnowledgeBases, listItems, clearAllKnowledgeBases } from "./knowledgeBaseStore";
import { syncToCloud, syncFromCloud, getDataSource, isOnline } from "./supabase/syncService";

export interface MigrationResult {
  success: boolean;
  projectsMigrated: number;
  charactersMigrated: number;
  knowledgeBasesMigrated: number;
  errors: string[];
  timestamp: string;
}

export interface LocalDataSummary {
  hasData: boolean;
  projectCount: number;
  characterCount: number;
  knowledgeBaseCount: number;
  itemCount: number;
}

/**
 * Check if there is local data that could be migrated
 */
export function hasLocalData(): boolean {
  const projects = listProjects();
  const characters = getCharacters();
  const kbs = listKnowledgeBases();

  return projects.length > 0 || characters.length > 0 || kbs.length > 0;
}

/**
 * Get summary of local data
 */
export function getLocalDataSummary(): LocalDataSummary {
  const projects = listProjects();
  const characters = getCharacters();
  const kbs = listKnowledgeBases();

  let itemCount = 0;
  for (const kb of kbs) {
    itemCount += listItems(kb.id).length;
  }

  return {
    hasData: projects.length > 0 || characters.length > 0 || kbs.length > 0,
    projectCount: projects.length,
    characterCount: characters.length,
    knowledgeBaseCount: kbs.length,
    itemCount,
  };
}

/**
 * Migrate all local data to Supabase
 * This is typically called after user signs in
 */
export async function migrateLocalToCloud(): Promise<MigrationResult> {
  const timestamp = new Date().toISOString();

  // Check if online
  if (!isOnline()) {
    return {
      success: false,
      projectsMigrated: 0,
      charactersMigrated: 0,
      knowledgeBasesMigrated: 0,
      errors: ["Device is offline. Migration requires internet connection."],
      timestamp,
    };
  }

  // Check data source
  const dataSource = await getDataSource();
  if (dataSource !== "supabase") {
    return {
      success: false,
      projectsMigrated: 0,
      charactersMigrated: 0,
      knowledgeBasesMigrated: 0,
      errors: ["User not authenticated or Supabase not available."],
      timestamp,
    };
  }

  // Check if there's data to migrate
  if (!hasLocalData()) {
    return {
      success: true,
      projectsMigrated: 0,
      charactersMigrated: 0,
      knowledgeBasesMigrated: 0,
      errors: [],
      timestamp,
    };
  }

  // Perform sync
  const result = await syncToCloud();

  return {
    success: result.success,
    projectsMigrated: result.projectsSynced,
    charactersMigrated: result.charactersSynced,
    knowledgeBasesMigrated: result.knowledgeBaseSynced,
    errors: result.errors,
    timestamp,
  };
}

/**
 * Download cloud data to localStorage for offline use
 */
export async function downloadCloudToLocal(): Promise<MigrationResult> {
  const timestamp = new Date().toISOString();

  // Check if online
  if (!isOnline()) {
    return {
      success: false,
      projectsMigrated: 0,
      charactersMigrated: 0,
      knowledgeBasesMigrated: 0,
      errors: ["Device is offline."],
      timestamp,
    };
  }

  const result = await syncFromCloud();

  return {
    success: result.success,
    projectsMigrated: result.projectsSynced,
    charactersMigrated: result.charactersSynced,
    knowledgeBasesMigrated: result.knowledgeBaseSynced,
    errors: result.errors,
    timestamp,
  };
}

/**
 * Clear local data after successful migration
 * Only call this after confirming data is safely in Supabase
 */
export function clearLocalAfterMigration(): void {
  clearAllProjects();
  clearAllCharacters();
  clearAllKnowledgeBases();
}

/**
 * Check if migration is needed
 * Returns true if user is authenticated AND has local data
 */
export async function shouldPromptMigration(): Promise<boolean> {
  // If no local data, no migration needed
  if (!hasLocalData()) {
    return false;
  }

  // Check if using Supabase
  const dataSource = await getDataSource();
  if (dataSource !== "supabase") {
    return false;
  }

  return true;
}
