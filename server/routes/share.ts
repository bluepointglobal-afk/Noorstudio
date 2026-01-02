// Share Routes
// Server-only endpoint for sharing projects to Supabase
// Uses service_role key for writes (client cannot write directly)

import { Router, Request, Response } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const router = Router();

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize Supabase client with service role (server-only)
let supabaseAdmin: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// Types
// ============================================

interface UpsertShareRequest {
  projectId: string;
  payload: string; // JSON string of sanitized project
  expiresInDays?: number; // Optional expiration (null = never)
}

interface UpsertShareResponse {
  success: boolean;
  projectId?: string;
  shareToken?: string;
  shareUrl?: string;
  error?: string;
}

// ============================================
// Helpers
// ============================================

function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && supabaseAdmin);
}

// ============================================
// Routes
// ============================================

/**
 * POST /api/share/upsert
 * Create or update a shared project
 *
 * Body:
 * - projectId: string (required)
 * - payload: string (JSON of sanitized project, required)
 * - expiresInDays: number (optional, null = never expires)
 *
 * Returns:
 * - projectId: string
 * - shareToken: string
 * - shareUrl: string
 */
router.post("/upsert", async (req: Request, res: Response) => {
  try {
    // Check Supabase is configured
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        success: false,
        error: "Sharing service not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      } as UpsertShareResponse);
      return;
    }

    const body = req.body as UpsertShareRequest;

    // Validate request
    if (!body.projectId || typeof body.projectId !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing required field: projectId",
      } as UpsertShareResponse);
      return;
    }

    if (!body.payload || typeof body.payload !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing required field: payload",
      } as UpsertShareResponse);
      return;
    }

    // Validate payload is valid JSON
    try {
      JSON.parse(body.payload);
    } catch {
      res.status(400).json({
        success: false,
        error: "Invalid payload: must be valid JSON string",
      } as UpsertShareResponse);
      return;
    }

    // Check if project already has a share token
    const { data: existing } = await supabaseAdmin!
      .from("shared_projects")
      .select("share_token")
      .eq("id", body.projectId)
      .single();

    // Use existing token or generate new one
    const shareToken = existing?.share_token || generateShareToken();

    // Calculate expiration if specified
    let expiresAt: string | null = null;
    if (body.expiresInDays && body.expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + body.expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Upsert the shared project
    const { error: upsertError } = await supabaseAdmin!
      .from("shared_projects")
      .upsert(
        {
          id: body.projectId,
          share_token: shareToken,
          payload: body.payload,
          expires_at: expiresAt,
          // updated_at is handled by trigger
        },
        {
          onConflict: "id",
        }
      );

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      res.status(500).json({
        success: false,
        error: "Failed to save shared project",
      } as UpsertShareResponse);
      return;
    }

    // Build share URL (client origin from request or env)
    const clientOrigin = req.headers.origin || process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const shareUrl = `${clientOrigin}/demo/${body.projectId}?t=${shareToken}`;

    res.json({
      success: true,
      projectId: body.projectId,
      shareToken,
      shareUrl,
    } as UpsertShareResponse);
  } catch (error) {
    console.error("Share upsert error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } as UpsertShareResponse);
  }
});

/**
 * GET /api/share/status
 * Check if sharing service is configured
 */
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    configured: isSupabaseConfigured(),
    supabaseUrl: SUPABASE_URL ? "set" : "missing",
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing",
  });
});

export { router as shareRoutes };
