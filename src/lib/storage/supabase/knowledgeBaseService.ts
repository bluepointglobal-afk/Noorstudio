/**
 * Knowledge Base Supabase Service
 * Provides CRUD operations for knowledge bases and items with localStorage fallback
 */

import { supabase } from "@/lib/supabase/client";
import {
  KnowledgeBase,
  KnowledgeBaseItem,
  listKnowledgeBases as listLocalKBs,
  getKnowledgeBase as getLocalKB,
  createKnowledgeBase as createLocalKB,
  deleteKnowledgeBase as deleteLocalKB,
  listItems as listLocalItems,
  getItem as getLocalItem,
  createItem as createLocalItem,
  updateItem as updateLocalItem,
  deleteItem as deleteLocalItem,
} from "../knowledgeBaseStore";

export interface KBRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface KBItemRow {
  id: string;
  user_id: string;
  kb_id: string;
  title: string;
  category: string;
  body: string;
  tags: string[];
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

// ============================================
// Knowledge Base CRUD
// ============================================

/**
 * List all knowledge bases for the current user
 */
export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return listLocalKBs();
  }

  try {
    const { data, error } = await supabase
      .from("knowledge_bases")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[KBService] Supabase error, falling back to localStorage:", error.message);
      return listLocalKBs();
    }

    return (data as KBRow[]).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn("[KBService] Error fetching from Supabase:", err);
    return listLocalKBs();
  }
}

/**
 * Get a single knowledge base by ID
 */
export async function getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return getLocalKB(id);
  }

  try {
    const { data, error } = await supabase
      .from("knowledge_bases")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return getLocalKB(id);
    }

    const row = data as KBRow;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch {
    return getLocalKB(id);
  }
}

/**
 * Create a new knowledge base
 */
export async function createKnowledgeBase(name: string, description: string = ""): Promise<KnowledgeBase> {
  // Create locally first
  const localKB = createLocalKB(name, description);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return localKB;
  }

  try {
    const { data, error } = await supabase
      .from("knowledge_bases")
      .insert({
        id: localKB.id,
        user_id: userId,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      console.warn("[KBService] Failed to create in Supabase:", error.message);
      return localKB;
    }

    const row = data as KBRow;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.warn("[KBService] Error creating in Supabase:", err);
    return localKB;
  }
}

/**
 * Delete a knowledge base
 */
export async function deleteKnowledgeBase(id: string): Promise<boolean> {
  // Delete locally
  const localResult = deleteLocalKB(id);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return localResult;
  }

  try {
    const { error } = await supabase
      .from("knowledge_bases")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.warn("[KBService] Failed to delete from Supabase:", error.message);
    }

    return true;
  } catch (err) {
    console.warn("[KBService] Error deleting from Supabase:", err);
    return localResult;
  }
}

// ============================================
// Knowledge Base Items CRUD
// ============================================

/**
 * List all items in a knowledge base
 */
export async function listItems(kbId: string): Promise<KnowledgeBaseItem[]> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return listLocalItems(kbId);
  }

  try {
    const { data, error } = await supabase
      .from("knowledge_base_items")
      .select("*")
      .eq("kb_id", kbId)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[KBService] Supabase error, falling back to localStorage:", error.message);
      return listLocalItems(kbId);
    }

    return (data as KBItemRow[]).map(row => ({
      id: row.id,
      kbId: row.kb_id,
      title: row.title,
      category: row.category as KnowledgeBaseItem["category"],
      body: row.body,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn("[KBService] Error fetching items from Supabase:", err);
    return listLocalItems(kbId);
  }
}

/**
 * Get a single item by ID
 */
export async function getItem(kbId: string, itemId: string): Promise<KnowledgeBaseItem | null> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return getLocalItem(kbId, itemId);
  }

  try {
    const { data, error } = await supabase
      .from("knowledge_base_items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return getLocalItem(kbId, itemId);
    }

    const row = data as KBItemRow;
    return {
      id: row.id,
      kbId: row.kb_id,
      title: row.title,
      category: row.category as KnowledgeBaseItem["category"],
      body: row.body,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch {
    return getLocalItem(kbId, itemId);
  }
}

/**
 * Create a new item
 */
export async function createItem(
  kbId: string,
  title: string,
  category: KnowledgeBaseItem["category"],
  body: string = "",
  tags: string[] = []
): Promise<KnowledgeBaseItem> {
  // Create locally first
  const localItem = createLocalItem(kbId, title, category, body, tags);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return localItem;
  }

  try {
    const { error } = await supabase
      .from("knowledge_base_items")
      .insert({
        id: localItem.id,
        user_id: userId,
        kb_id: kbId,
        title,
        category,
        body,
        tags,
      });

    if (error) {
      console.warn("[KBService] Failed to create item in Supabase:", error.message);
    }

    return localItem;
  } catch (err) {
    console.warn("[KBService] Error creating item in Supabase:", err);
    return localItem;
  }
}

/**
 * Update an item
 */
export async function updateItemInKB(
  kbId: string,
  itemId: string,
  updates: Partial<Pick<KnowledgeBaseItem, "title" | "category" | "body" | "tags">>
): Promise<KnowledgeBaseItem | null> {
  // Update locally first
  const localItem = updateLocalItem(kbId, itemId, updates);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase || !localItem) {
    return localItem;
  }

  try {
    const { error } = await supabase
      .from("knowledge_base_items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      console.warn("[KBService] Failed to update item in Supabase:", error.message);
    }

    return localItem;
  } catch (err) {
    console.warn("[KBService] Error updating item in Supabase:", err);
    return localItem;
  }
}

/**
 * Delete an item
 */
export async function deleteItemFromKB(kbId: string, itemId: string): Promise<boolean> {
  // Delete locally
  const localResult = deleteLocalItem(kbId, itemId);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return localResult;
  }

  try {
    const { error } = await supabase
      .from("knowledge_base_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      console.warn("[KBService] Failed to delete item from Supabase:", error.message);
    }

    return true;
  } catch (err) {
    console.warn("[KBService] Error deleting item from Supabase:", err);
    return localResult;
  }
}

/**
 * Sync all local KBs and items to Supabase
 */
export async function syncLocalToCloud(): Promise<{ synced: number; errors: string[] }> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return { synced: 0, errors: ["Supabase not available or user not authenticated"] };
  }

  const errors: string[] = [];
  let synced = 0;

  // Sync knowledge bases
  const localKBs = listLocalKBs();
  for (const kb of localKBs) {
    try {
      const { error } = await supabase
        .from("knowledge_bases")
        .upsert({
          id: kb.id,
          user_id: userId,
          name: kb.name,
          description: kb.description,
          created_at: kb.createdAt,
          updated_at: kb.updatedAt,
        }, {
          onConflict: "id",
        });

      if (error) {
        errors.push(`KB ${kb.id}: ${error.message}`);
      } else {
        synced++;

        // Sync items for this KB
        const items = listLocalItems(kb.id);
        for (const item of items) {
          try {
            const { error: itemError } = await supabase
              .from("knowledge_base_items")
              .upsert({
                id: item.id,
                user_id: userId,
                kb_id: item.kbId,
                title: item.title,
                category: item.category,
                body: item.body,
                tags: item.tags,
                created_at: item.createdAt,
                updated_at: item.updatedAt,
              }, {
                onConflict: "id",
              });

            if (itemError) {
              errors.push(`Item ${item.id}: ${itemError.message}`);
            } else {
              synced++;
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            errors.push(`Item ${item.id}: ${message}`);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`KB ${kb.id}: ${message}`);
    }
  }

  return { synced, errors };
}
