// Supabase Client Configuration
// Used for cross-device demo sharing
// SECURITY: Client uses anon key for READ-ONLY access. Writes go through server.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Environment Variables
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ============================================
// Client Initialization
// ============================================

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (import.meta.env.DEV) {
      console.warn("Supabase not configured. Demo sharing will be local-only.");
    }
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true, // Enabled for auth support
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
}

export const supabase = getSupabaseClient();

// ============================================
// Configuration Check
// ============================================

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ============================================
// Database Types
// ============================================

export interface SharedProject {
  id: string;
  share_token: string;
  payload: string; // JSON string of sanitized project
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Shared Project Operations (READ-ONLY)
// ============================================

/**
 * Get a shared project by ID and token
 * READ-ONLY: Uses anon key with RLS policies
 * Returns null if token doesn't match or project expired
 */
export async function getSharedProject(
  projectId: string,
  shareToken: string
): Promise<SharedProject | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("shared_projects")
      .select("*")
      .eq("id", projectId)
      .eq("share_token", shareToken)
      .single();

    if (error) {
      // Not found or RLS blocked (expired, wrong token)
      if (import.meta.env.DEV) {
        console.warn("Shared project not found or access denied:", error.code);
      }
      return null;
    }

    return data as SharedProject;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("Error fetching shared project:", err);
    }
    return null;
  }
}

// NOTE: Write operations (upsert) are handled by server endpoint /api/share/upsert
// Client cannot write to shared_projects table due to RLS policies
