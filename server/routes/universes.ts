// Universe API Routes
// CRUD operations for universes

import { Router, Request, Response } from "express";
import { supabase } from "../index";
import { UniverseHelpers } from "../models";

const router = Router();

// ============================================
// GET /api/universes - List all universes
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

    const { data: universes, error } = await supabase
      .from("universes")
      .select("*")
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[UNIVERSES] List error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = universes.map(UniverseHelpers.toApiResponse);
    return res.json({ universes: formatted });
  } catch (error) {
    console.error("[UNIVERSES] List error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list universes" } });
  }
});

// ============================================
// GET /api/universes/:id - Get single universe
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

    const { data: universe, error } = await supabase
      .from("universes")
      .select("*")
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Universe not found" } });
      }
      console.error("[UNIVERSES] Get error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = UniverseHelpers.toApiResponse(universe);
    return res.json({ universe: formatted });
  } catch (error) {
    console.error("[UNIVERSES] Get error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get universe" } });
  }
});

// ============================================
// POST /api/universes - Create new universe
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

    const { name, description, seriesBible, writingDNA, visualDNA, defaultStyleId, bookPresets, tags } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Universe name is required" } });
    }

    const { data: universe, error } = await supabase
      .from("universes")
      .insert({
        account_id: user.id,
        name: name.trim(),
        description: description || null,
        series_bible: seriesBible || null,
        writing_dna: writingDNA || UniverseHelpers.createDefaultWritingDNA(),
        visual_dna: visualDNA || UniverseHelpers.createDefaultVisualDNA(),
        default_style_id: defaultStyleId || null,
        book_presets: bookPresets || UniverseHelpers.createDefaultBookPresets(),
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("[UNIVERSES] Create error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = UniverseHelpers.toApiResponse(universe);
    return res.status(201).json({ universe: formatted });
  } catch (error) {
    console.error("[UNIVERSES] Create error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create universe" } });
  }
});

// ============================================
// PATCH /api/universes/:id - Update universe
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
    const { name, description, seriesBible, writingDNA, visualDNA, defaultStyleId, bookPresets, tags } = req.body;

    // Build update object with only provided fields
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (seriesBible !== undefined) updates.series_bible = seriesBible;
    if (writingDNA !== undefined) updates.writing_dna = writingDNA;
    if (visualDNA !== undefined) updates.visual_dna = visualDNA;
    if (defaultStyleId !== undefined) updates.default_style_id = defaultStyleId;
    if (bookPresets !== undefined) updates.book_presets = bookPresets;
    if (tags !== undefined) updates.tags = tags;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "No fields to update" } });
    }

    const { data: universe, error } = await supabase
      .from("universes")
      .update(updates)
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Universe not found" } });
      }
      console.error("[UNIVERSES] Update error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = UniverseHelpers.toApiResponse(universe);
    return res.json({ universe: formatted });
  } catch (error) {
    console.error("[UNIVERSES] Update error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update universe" } });
  }
});

// ============================================
// DELETE /api/universes/:id - Soft delete universe
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
      .from("universes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null);

    if (error) {
      console.error("[UNIVERSES] Delete error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("[UNIVERSES] Delete error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete universe" } });
  }
});

export { router as universesRoutes };
