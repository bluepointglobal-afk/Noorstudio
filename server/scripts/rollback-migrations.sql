-- Rollback Script for Universe V2 Migrations
-- Run this to revert database schema changes
-- WARNING: This will drop all new tables and remove added columns

-- ============================================
-- SAFETY CHECK: Backup before rollback!
-- ============================================
-- Run this command before executing rollback:
-- pg_dump DATABASE_URL > backup-before-rollback.sql

BEGIN;

-- ============================================
-- Step 1: Drop triggers and functions
-- ============================================

-- Outline version triggers
DROP TRIGGER IF EXISTS trigger_ensure_single_current_version ON outline_versions;
DROP TRIGGER IF EXISTS trigger_set_next_version_number ON outline_versions;

-- Book asset triggers
DROP TRIGGER IF EXISTS trigger_increment_asset_usage ON book_assets;
DROP TRIGGER IF EXISTS trigger_decrement_asset_usage ON book_assets;

-- Universe book count triggers
DROP TRIGGER IF EXISTS trigger_increment_universe_book_count ON projects;
DROP TRIGGER IF EXISTS trigger_decrement_universe_book_count ON projects;
DROP TRIGGER IF EXISTS trigger_update_universe_book_count ON projects;

-- Universe-related triggers on other tables
DROP TRIGGER IF EXISTS update_universes_updated_at ON universes;
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

-- Drop functions
DROP FUNCTION IF EXISTS ensure_single_current_version();
DROP FUNCTION IF EXISTS set_next_version_number();
DROP FUNCTION IF EXISTS increment_asset_usage();
DROP FUNCTION IF EXISTS decrement_asset_usage();
DROP FUNCTION IF EXISTS increment_universe_book_count();
DROP FUNCTION IF EXISTS decrement_universe_book_count();
DROP FUNCTION IF EXISTS update_universe_book_count();

-- ============================================
-- Step 2: Drop views
-- ============================================

DROP VIEW IF EXISTS current_outlines;

-- ============================================
-- Step 3: Drop foreign key constraints first
-- ============================================

-- Drop FK from projects to new tables
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_universe_id_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_document_id_fkey;

-- Drop FK from book_assets
ALTER TABLE book_assets DROP CONSTRAINT IF EXISTS fk_book_assets_book;

-- Drop FK from universes to assets
ALTER TABLE universes DROP CONSTRAINT IF EXISTS fk_universes_default_style;

-- Drop FK from assets/documents to universes
ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_universe;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_universe;

-- ============================================
-- Step 4: Drop new tables (in reverse dependency order)
-- ============================================

DROP TABLE IF EXISTS outline_versions;
DROP TABLE IF EXISTS book_assets;
DROP TABLE IF EXISTS universes;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS documents;

-- ============================================
-- Step 5: Remove new columns from projects table
-- ============================================

ALTER TABLE projects
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS document_id,
  DROP COLUMN IF EXISTS universe_id;

-- Drop indexes that were created for new columns
DROP INDEX IF EXISTS idx_projects_universe_id;
DROP INDEX IF EXISTS idx_projects_document_id;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_active;

-- ============================================
-- Verification queries
-- ============================================

-- Check that tables are gone
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'documents',
      'assets',
      'universes',
      'book_assets',
      'outline_versions'
    );

  IF table_count > 0 THEN
    RAISE EXCEPTION 'Rollback incomplete: Some new tables still exist';
  END IF;

  RAISE NOTICE 'Rollback verification passed: All new tables dropped';
END $$;

-- Check that columns are removed from projects
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name IN (
      'universe_id',
      'document_id',
      'status',
      'metadata',
      'deleted_at'
    );

  IF column_count > 0 THEN
    RAISE EXCEPTION 'Rollback incomplete: Some columns still exist in projects table';
  END IF;

  RAISE NOTICE 'Rollback verification passed: All new columns removed from projects';
END $$;

COMMIT;

-- ============================================
-- Post-rollback notes
-- ============================================

-- After rollback:
-- 1. Restart your application server
-- 2. Verify that old functionality still works
-- 3. You may need to restore data from backup if data was migrated
-- 4. Check for any application errors referencing the dropped tables
