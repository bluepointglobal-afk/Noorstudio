// Assets API Routes
// CRUD operations for reusable assets (characters, illustrations, covers)

import { Router, Request, Response } from "express";
import { supabase } from "../index";
import { AssetHelpers } from "../models";

const router = Router();

// ============================================
// GET /api/assets - List all assets
// ============================================

router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { universe_id, type } = req.query;

    let query = supabase
      .from("assets")
      .select("*")
      .eq("account_id", user.id)
      .is("deleted_at", null);

    if (universe_id) {
      query = query.eq("universe_id", universe_id as string);
    }

    if (type) {
      query = query.eq("type", type as string);
    }

    query = query.order("usage_count", { ascending: false }).order("created_at", { ascending: false });

    const { data: assets, error } = await query;

    if (error) {
      console.error("[ASSETS] List error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = assets.map(AssetHelpers.toApiResponse);
    return res.json({ assets: formatted });
  } catch (error) {
    console.error("[ASSETS] List error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list assets" } });
  }
});

// ============================================
// GET /api/assets/:id - Get single asset
// ============================================

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { id } = req.params;

    const { data: asset, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Asset not found" } });
      }
      console.error("[ASSETS] Get error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = AssetHelpers.toApiResponse(asset);
    return res.json({ asset: formatted });
  } catch (error) {
    console.error("[ASSETS] Get error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get asset" } });
  }
});

// ============================================
// POST /api/assets - Create new asset
// ============================================

router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { universeId, type, name, description, data, thumbnailUrl, fileUrls, metadata, tags } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Asset type and name are required" } });
    }

    const validTypes = ["character", "illustration", "cover", "background", "prop", "other"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Invalid type. Must be one of: ${validTypes.join(", ")}` } });
    }

    const { data: asset, error } = await supabase
      .from("assets")
      .insert({
        account_id: user.id,
        universe_id: universeId || null,
        type,
        name: name.trim(),
        description: description || null,
        data: data || {},
        thumbnail_url: thumbnailUrl || null,
        file_urls: fileUrls || [],
        metadata: metadata || {},
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("[ASSETS] Create error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = AssetHelpers.toApiResponse(asset);
    return res.status(201).json({ asset: formatted });
  } catch (error) {
    console.error("[ASSETS] Create error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create asset" } });
  }
});

// ============================================
// PATCH /api/assets/:id - Update asset
// ============================================

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { id } = req.params;
    const { universeId, name, description, data, thumbnailUrl, fileUrls, metadata, tags } = req.body;

    // Build update object with only provided fields
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (data !== undefined) updates.data = data;
    if (thumbnailUrl !== undefined) updates.thumbnail_url = thumbnailUrl;
    if (fileUrls !== undefined) updates.file_urls = fileUrls;
    if (metadata !== undefined) updates.metadata = metadata;
    if (tags !== undefined) updates.tags = tags;
    if (universeId !== undefined) updates.universe_id = universeId;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "No fields to update" } });
    }

    const { data: asset, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Asset not found" } });
      }
      console.error("[ASSETS] Update error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = AssetHelpers.toApiResponse(asset);
    return res.json({ asset: formatted });
  } catch (error) {
    console.error("[ASSETS] Update error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update asset" } });
  }
});

// ============================================
// DELETE /api/assets/:id - Soft delete asset
// ============================================

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { id } = req.params;

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from("assets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null);

    if (error) {
      console.error("[ASSETS] Delete error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("[ASSETS] Delete error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete asset" } });
  }
});

// ============================================
// POST /api/assets/migrate-character - Migrate legacy character
// ============================================

router.post("/migrate-character", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { characterId, universeId } = req.body;

    if (!characterId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Character ID is required" } });
    }

    // Get legacy character
    const { data: character, error: fetchError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !character) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Character not found" } });
    }

    // Check if already migrated
    const { data: existing } = await supabase
      .from("assets")
      .select("id")
      .eq("account_id", user.id)
      .eq("type", "character")
      .eq("metadata->legacy_id", characterId)
      .single();

    if (existing) {
      return res.status(409).json({ error: { code: "ALREADY_MIGRATED", message: "Character already migrated", assetId: existing.id } });
    }

    // Migrate character to asset
    const assetInput = AssetHelpers.fromLegacyCharacter(character, user.id, universeId);

    const { data: asset, error: createError } = await supabase
      .from("assets")
      .insert(assetInput)
      .select()
      .single();

    if (createError) {
      console.error("[ASSETS] Migration error:", createError);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: createError.message } });
    }

    const formatted = AssetHelpers.toApiResponse(asset);
    return res.status(201).json({ asset: formatted });
  } catch (error) {
    console.error("[ASSETS] Migration error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to migrate character" } });
  }
});

export { router as assetsRoutes };
