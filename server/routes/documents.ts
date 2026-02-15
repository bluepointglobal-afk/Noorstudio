// Documents API Routes
// CRUD operations for account-level document library

import { Router, Request, Response } from "express";
import { supabase } from "../index";
import { DocumentHelpers } from "../models";

const router = Router();

// ============================================
// GET /api/documents - List all documents
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

    const { universe_id, type, tags } = req.query;

    let query = supabase
      .from("documents")
      .select("*")
      .eq("account_id", user.id)
      .is("deleted_at", null);

    if (universe_id) {
      query = query.eq("universe_id", universe_id as string);
    }

    if (type) {
      query = query.eq("type", type as string);
    }

    if (tags && typeof tags === "string") {
      // Filter by tags (contains any of the provided tags)
      const tagArray = tags.split(",").map(t => t.trim());
      query = query.overlaps("tags", tagArray);
    }

    query = query.order("created_at", { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error("[DOCUMENTS] List error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = documents.map(DocumentHelpers.toApiResponse);
    return res.json({ documents: formatted });
  } catch (error) {
    console.error("[DOCUMENTS] List error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list documents" } });
  }
});

// ============================================
// GET /api/documents/:id - Get single document
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

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found" } });
      }
      console.error("[DOCUMENTS] Get error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = DocumentHelpers.toApiResponse(document);
    return res.json({ document: formatted });
  } catch (error) {
    console.error("[DOCUMENTS] Get error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get document" } });
  }
});

// ============================================
// POST /api/documents - Create new document
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

    const { universeId, type, title, content, metadata, tags, parentId } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Document type and title are required" } });
    }

    const validTypes = ["book", "series_bible", "note", "outline", "other"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Invalid type. Must be one of: ${validTypes.join(", ")}` } });
    }

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        account_id: user.id,
        universe_id: universeId || null,
        type,
        title: title.trim(),
        content: content || {},
        metadata: metadata || {},
        tags: tags || [],
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[DOCUMENTS] Create error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = DocumentHelpers.toApiResponse(document);
    return res.status(201).json({ document: formatted });
  } catch (error) {
    console.error("[DOCUMENTS] Create error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create document" } });
  }
});

// ============================================
// PATCH /api/documents/:id - Update document
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
    const { universeId, title, content, metadata, tags } = req.body;

    // Build update object with only provided fields
    const updates: any = { version: supabase.rpc("increment", { x: 1 }) }; // Auto-increment version
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content;
    if (metadata !== undefined) updates.metadata = metadata;
    if (tags !== undefined) updates.tags = tags;
    if (universeId !== undefined) updates.universe_id = universeId;

    const { data: document, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found" } });
      }
      console.error("[DOCUMENTS] Update error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = DocumentHelpers.toApiResponse(document);
    return res.json({ document: formatted });
  } catch (error) {
    console.error("[DOCUMENTS] Update error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update document" } });
  }
});

// ============================================
// DELETE /api/documents/:id - Soft delete document
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
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("account_id", user.id)
      .is("deleted_at", null);

    if (error) {
      console.error("[DOCUMENTS] Delete error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("[DOCUMENTS] Delete error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete document" } });
  }
});

export { router as documentsRoutes };
