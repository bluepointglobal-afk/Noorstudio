// Book Assets API Routes
// Manage many-to-many relationships between books and assets

import { Router, Request, Response } from "express";
import { supabase } from "../index";
import { BookAssetHelpers } from "../models";

const router = Router();

// ============================================
// GET /api/book-assets - List book-asset links
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

    const { book_id, asset_id, role } = req.query;

    if (!book_id && !asset_id) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Either book_id or asset_id is required" } });
    }

    let query = supabase
      .from("book_assets")
      .select(`
        *,
        books:projects!book_assets_book_id_fkey(id, user_id, title),
        assets:assets!book_assets_asset_id_fkey(id, account_id, name, type)
      `);

    if (book_id) {
      query = query.eq("book_id", book_id as string);
    }

    if (asset_id) {
      query = query.eq("asset_id", asset_id as string);
    }

    if (role) {
      query = query.eq("role", role as string);
    }

    query = query.order("order_index");

    const { data: bookAssets, error } = await query;

    if (error) {
      console.error("[BOOK_ASSETS] List error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    // Verify user owns the book or asset
    const unauthorized = bookAssets.some(ba => {
      const book = ba.books as any;
      const asset = ba.assets as any;
      return (book && book.user_id !== user.id) || (asset && asset.account_id !== user.id);
    });

    if (unauthorized) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    const formatted = bookAssets.map(BookAssetHelpers.toApiResponse);
    return res.json({ bookAssets: formatted });
  } catch (error) {
    console.error("[BOOK_ASSETS] List error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list book assets" } });
  }
});

// ============================================
// POST /api/book-assets - Link asset to book
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

    const { bookId, assetId, role, usageContext, orderIndex } = req.body;

    if (!bookId || !assetId || !role) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "bookId, assetId, and role are required" } });
    }

    const validRoles = ["character", "illustration", "cover", "background", "other"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Invalid role. Must be one of: ${validRoles.join(", ")}` } });
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

    // Verify user owns the asset
    const { data: asset } = await supabase
      .from("assets")
      .select("id")
      .eq("id", assetId)
      .eq("account_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!asset) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Asset not found or access denied" } });
    }

    // Create link
    const { data: bookAsset, error } = await supabase
      .from("book_assets")
      .insert({
        book_id: bookId,
        asset_id: assetId,
        role,
        usage_context: usageContext || {},
        order_index: orderIndex ?? 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // unique violation
        return res.status(409).json({ error: { code: "ALREADY_LINKED", message: "Asset already linked to this book with this role" } });
      }
      console.error("[BOOK_ASSETS] Create error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = BookAssetHelpers.toApiResponse(bookAsset);
    return res.status(201).json({ bookAsset: formatted });
  } catch (error) {
    console.error("[BOOK_ASSETS] Create error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to link asset to book" } });
  }
});

// ============================================
// PATCH /api/book-assets/:id - Update book-asset link
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
    const { role, usageContext, orderIndex } = req.body;

    // Build update object
    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (usageContext !== undefined) updates.usage_context = usageContext;
    if (orderIndex !== undefined) updates.order_index = orderIndex;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "No fields to update" } });
    }

    // Get existing link to verify ownership
    const { data: existing } = await supabase
      .from("book_assets")
      .select(`
        *,
        books:projects!book_assets_book_id_fkey(id, user_id)
      `)
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Book-asset link not found" } });
    }

    const book = existing.books as any;
    if (book.user_id !== user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    const { data: bookAsset, error } = await supabase
      .from("book_assets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[BOOK_ASSETS] Update error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    const formatted = BookAssetHelpers.toApiResponse(bookAsset);
    return res.json({ bookAsset: formatted });
  } catch (error) {
    console.error("[BOOK_ASSETS] Update error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update book-asset link" } });
  }
});

// ============================================
// DELETE /api/book-assets/:id - Remove asset from book
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

    // Get existing link to verify ownership
    const { data: existing } = await supabase
      .from("book_assets")
      .select(`
        *,
        books:projects!book_assets_book_id_fkey(id, user_id)
      `)
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Book-asset link not found" } });
    }

    const book = existing.books as any;
    if (book.user_id !== user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    const { error } = await supabase
      .from("book_assets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[BOOK_ASSETS] Delete error:", error);
      return res.status(500).json({ error: { code: "DATABASE_ERROR", message: error.message } });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("[BOOK_ASSETS] Delete error:", error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to remove asset from book" } });
  }
});

export { router as bookAssetsRoutes };
