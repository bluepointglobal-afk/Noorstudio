/**
 * Supabase Storage Services
 * Unified exports for cloud-backed storage operations
 */

// Projects Service
export {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  syncLocalToCloud as syncProjectsToCloud,
  syncCloudToLocal as syncProjectsFromCloud,
} from "./projectsService";

// Characters Service
export {
  listCharacters,
  getCharacter,
  saveCharacter,
  deleteCharacter,
  syncLocalToCloud as syncCharactersToCloud,
  syncCloudToLocal as syncCharactersFromCloud,
} from "./charactersService";

// Knowledge Base Service
export {
  listKnowledgeBases,
  getKnowledgeBase,
  createKnowledgeBase,
  deleteKnowledgeBase,
  listItems,
  getItem,
  createItem,
  updateItemInKB,
  deleteItemFromKB,
  syncLocalToCloud as syncKBToCloud,
} from "./knowledgeBaseService";

// Sync Service
export {
  isOnline,
  getDataSource,
  getSyncStatus,
  syncToCloud,
  syncFromCloud,
  initSyncService,
} from "./syncService";

// Types
export type { ProjectRow } from "./projectsService";
export type { CharacterRow } from "./charactersService";
export type { KBRow, KBItemRow } from "./knowledgeBaseService";
export type { DataSource, SyncResult, SyncStatus } from "./syncService";
