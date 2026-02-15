// Outline Versions API Routes
// Version control for book outlines with section locking

import { Router, Request, Response } from "express";
import { supabase } from "../index";
import { OutlineVersionHelpers } from "../models";

const router = Router();

// ============================================
// GET /api/outline-versions - List outline versions
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

    const { book_id, current_only } = req.query;

    if (!book_id) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "book_id is required" } });
    }

    // Verify user owns the book
    const { data: book } = await supabase
      .from("projects")
      .select("id")
      .eq("id", book_id as string)
      .eq("user_id", user.id)
      .single();

    if (!book) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Book not found or access denied" } });
    }

    let query = supabase
      .from("outline_versions")
      .select("*")
      .eq("book_id", book_id as string);

    if (current_only === "true") {
      query = query.eq("is_current", true);
    }

    query = query.order("version_number", { ascending: false });

    const { data: versions, error } = await query;

    if (error) {
      console.error("[OUTLINE_VERSIONS] List error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = versions.map(OutlineVersionHelpers.toApiResponse);
    return res.json({ outlineVersions: formatted });
  } catch (error) {
    console.error("[OUTLINE_VERSIONS] List error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list outline versions" } });
  }
});

// ============================================
// GET /api/outline-versions/current/:bookId - Get current outline
// ============================================

router.get("/current/:bookId", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { bookId } = req.params;

    // Verify user owns the book
    const { data: book } = await supabase
      .from("projects")
      .select("id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (!book) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Book not found or access denied" } });
    }

    const { data: version, error } = await supabase
      .from("outline_versions")
      .select("*")
      .eq("book_id", bookId)
      .eq("is_current", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "No current outline version found" } });
      }
      console.error("[OUTLINE_VERSIONS] Get current error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = OutlineVersionHelpers.toApiResponse(version);
    return res.json({ outlineVersion: formatted });
  } catch (error) {
    console.error("[OUTLINE_VERSIONS] Get current error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get current outline" } });
  }
});

// ============================================
// POST /api/outline-versions - Create new version
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

    const { bookId, data, lockedSections, changeSummary, isCurrent } = req.body;

    if (!bookId || !data) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "bookId and data are required" } });
    }

    // Verify user owns the book
    const { data: book } = await supabase
      .from("projects")
      .select("id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (!book) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Book not found or access denied" } });
    }

    const { data: version, error } = await supabase
      .from("outline_versions")
      .insert({
        book_id: bookId,
        data,
        locked_sections: lockedSections || [],
        change_summary: changeSummary || null,
        is_current: isCurrent ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[OUTLINE_VERSIONS] Create error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = OutlineVersionHelpers.toApiResponse(version);
    return res.status(201).json({ outlineVersion: formatted });
  } catch (error) {
    console.error("[OUTLINE_VERSIONS] Create error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create outline version" } });
  }
});

// ============================================
// PATCH /api/outline-versions/:id/set-current - Set as current version
// ============================================

router.patch("/:id/set-current", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { id } = req.params;

    // Get version and verify ownership
    const { data: version } = await supabase
      .from("outline_versions")
      .select(`
        *,
        books:projects!outline_versions_book_id_fkey(id, user_id)
      `)
      .eq("id", id)
      .single();

    if (!version) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Outline version not found" } });
    }

    const book = version.books as any;
    if (book.user_id !== user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    // Set this version as current (trigger will automatically set others to false)
    const { data: updated, error } = await supabase
      .from("outline_versions")
      .update({ is_current: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[OUTLINE_VERSIONS] Set current error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = OutlineVersionHelpers.toApiResponse(updated);
    return res.json({ outlineVersion: formatted });
  } catch (error) {
    console.error("[OUTLINE_VERSIONS] Set current error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to set current version" } });
  }
});

// ============================================
// PATCH /api/outline-versions/:id/lock-sections - Update locked sections
// ============================================

router.patch("/:id/lock-sections", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    if (!supabase) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database not configured" } });
    }

    const { id } = req.params;
    const { lockedSections } = req.body;

    if (!Array.isArray(lockedSections)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "lockedSections must be an array" } });
    }

    // Get version and verify ownership
    const { data: version } = await supabase
      .from("outline_versions")
      .select(`
        *,
        books:projects!outline_versions_book_id_fkey(id, user_id)
      `)
      .eq("id", id)
      .single();

    if (!version) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Outline version not found" } });
    }

    const book = version.books as any;
    if (book.user_id !== user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    const { data: updated, error } = await supabase
      .from("outline_versions")
      .update({ locked_sections: lockedSections })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[OUTLINE_VERSIONS] Lock sections error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = OutlineVersionHelpers.toApiResponse(updated);
    return res.json({ outlineVersion: formatted });
  } catch (error) {
    console.error("[OUTLINE_VERSIONS] Lock sections error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update locked sections" } });
  }
});

export { router as outlineVersionsRoutes };
