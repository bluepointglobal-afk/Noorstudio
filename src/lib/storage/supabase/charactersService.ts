/**
 * Characters Supabase Service
 * Provides CRUD operations for characters table with localStorage fallback
 */

import { supabase } from "@/lib/supabase/client";
import { StoredCharacter, getCharacters as getLocalCharacters, getCharacter as getLocalCharacter, saveCharacter as saveLocalCharacter, deleteCharacter as deleteLocalCharacter } from "../charactersStore";

export interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  data: StoredCharacter;
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
 * List all characters for the current user
 * Falls back to localStorage if Supabase unavailable
 */
export async function listCharacters(): Promise<StoredCharacter[]> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return getLocalCharacters();
  }

  try {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[CharactersService] Supabase error, falling back to localStorage:", error.message);
      return getLocalCharacters();
    }

    return (data as CharacterRow[]).map(row => ({
      ...row.data,
      id: row.id,
    }));
  } catch (err) {
    console.warn("[CharactersService] Error fetching from Supabase:", err);
    return getLocalCharacters();
  }
}

/**
 * Get a single character by ID
 */
export async function getCharacter(id: string): Promise<StoredCharacter | null> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return getLocalCharacter(id);
  }

  try {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      // Try localStorage if not found in Supabase
      return getLocalCharacter(id);
    }

    const row = data as CharacterRow;
    return {
      ...row.data,
      id: row.id,
    };
  } catch {
    return getLocalCharacter(id);
  }
}

/**
 * Save a character (create or update)
 */
export async function saveCharacter(character: StoredCharacter): Promise<void> {
  // Always save to localStorage as cache
  saveLocalCharacter(character);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from("characters")
      .upsert({
        id: character.id,
        user_id: userId,
        name: character.name,
        data: character,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    if (error) {
      console.warn("[CharactersService] Failed to save to Supabase:", error.message);
    }
  } catch (err) {
    console.warn("[CharactersService] Error saving to Supabase:", err);
  }
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string): Promise<boolean> {
  // Delete from localStorage
  const localResult = deleteLocalCharacter(id);

  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return localResult;
  }

  try {
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.warn("[CharactersService] Failed to delete from Supabase:", error.message);
    }

    return true;
  } catch (err) {
    console.warn("[CharactersService] Error deleting from Supabase:", err);
    return localResult;
  }
}

/**
 * Sync all local characters to Supabase
 */
export async function syncLocalToCloud(): Promise<{ synced: number; errors: string[] }> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return { synced: 0, errors: ["Supabase not available or user not authenticated"] };
  }

  const localCharacters = getLocalCharacters();
  const errors: string[] = [];
  let synced = 0;

  for (const character of localCharacters) {
    try {
      const { error } = await supabase
        .from("characters")
        .upsert({
          id: character.id,
          user_id: userId,
          name: character.name,
          data: character,
          created_at: character.createdAt,
          updated_at: character.updatedAt,
        }, {
          onConflict: "id",
        });

      if (error) {
        errors.push(`Character ${character.id}: ${error.message}`);
      } else {
        synced++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Character ${character.id}: ${message}`);
    }
  }

  return { synced, errors };
}

/**
 * Sync all cloud characters to localStorage
 */
export async function syncCloudToLocal(): Promise<{ synced: number; errors: string[] }> {
  const { available, userId } = await canUseSupabase();

  if (!available || !userId || !supabase) {
    return { synced: 0, errors: ["Supabase not available or user not authenticated"] };
  }

  try {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return { synced: 0, errors: [error.message] };
    }

    let synced = 0;
    for (const row of data as CharacterRow[]) {
      const character: StoredCharacter = {
        ...row.data,
        id: row.id,
      };
      saveLocalCharacter(character);
      synced++;
    }

    return { synced, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { synced: 0, errors: [message] };
  }
}
