-- ============================================================================
-- PRODUCTION DATA MIGRATION ROLLBACK SCRIPT
-- Universe V2 - Rollback Migration to Pre-Universe State
-- ============================================================================
--
-- PURPOSE:
--   Rollback the production data migration by unlinking books and characters
--   from default universes and optionally deleting the default universes.
--
-- WARNING:
--   This script should ONLY be run if the migration needs to be reversed.
--   It will unlink all books and characters from "My Books" universes.
--
-- STRATEGY:
--   1. Validate current state
--   2. Unlink books from "My Books" universes
--   3. Unlink characters from "My Books" universes
--   4. Optionally delete "My Books" universes
--   5. Validate rollback
--
-- USAGE:
--   psql $DATABASE_URL -f server/scripts/rollback-production-migration.sql
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Pre-Rollback Validation
-- ============================================================================

DO $$
DECLARE
  default_universes_count INTEGER;
  books_in_default_universe INTEGER;
  characters_in_default_universe INTEGER;
BEGIN
  -- Count default universes
  SELECT COUNT(*) INTO default_universes_count
  FROM universes
  WHERE name = 'My Books'
    AND deleted_at IS NULL;

  -- Count books in default universes
  SELECT COUNT(*) INTO books_in_default_universe
  FROM projects p
  JOIN universes u ON u.id = p.universe_id
  WHERE u.name = 'My Books'
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL;

  -- Count characters in default universes
  SELECT COUNT(*) INTO characters_in_default_universe
  FROM characters c
  JOIN universes u ON u.id = c.universe_id
  WHERE u.name = 'My Books'
    AND c.deleted_at IS NULL
    AND u.deleted_at IS NULL;

  -- Log pre-rollback counts
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'PRE-ROLLBACK VALIDATION';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Default universes ("My Books"): %', default_universes_count;
  RAISE NOTICE 'Books in default universes: %', books_in_default_universe;
  RAISE NOTICE 'Characters in default universes: %', characters_in_default_universe;
  RAISE NOTICE '============================================================================';

  -- Store counts in temporary table for post-rollback validation
  CREATE TEMP TABLE rollback_validation (
    metric TEXT,
    pre_count INTEGER,
    post_count INTEGER DEFAULT 0
  );

  INSERT INTO rollback_validation (metric, pre_count) VALUES
    ('default_universes', default_universes_count),
    ('books_in_default', books_in_default_universe),
    ('characters_in_default', characters_in_default_universe);
END $$;

-- ============================================================================
-- STEP 2: Unlink Books from Default Universes
-- ============================================================================

DO $$
DECLARE
  books_unlinked INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'UNLINKING BOOKS FROM DEFAULT UNIVERSES';
  RAISE NOTICE '============================================================================';

  -- Unlink all books from "My Books" universes
  UPDATE projects p
  SET universe_id = NULL,
      updated_at = NOW()
  FROM universes u
  WHERE p.universe_id = u.id
    AND u.name = 'My Books'
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL;

  GET DIAGNOSTICS books_unlinked = ROW_COUNT;

  RAISE NOTICE 'Total books unlinked: %', books_unlinked;
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 3: Unlink Characters from Default Universes
-- ============================================================================

DO $$
DECLARE
  characters_unlinked INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'UNLINKING CHARACTERS FROM DEFAULT UNIVERSES';
  RAISE NOTICE '============================================================================';

  -- Unlink all characters from "My Books" universes
  UPDATE characters c
  SET universe_id = NULL,
      updated_at = NOW()
  FROM universes u
  WHERE c.universe_id = u.id
    AND u.name = 'My Books'
    AND c.deleted_at IS NULL
    AND u.deleted_at IS NULL;

  GET DIAGNOSTICS characters_unlinked = ROW_COUNT;

  RAISE NOTICE 'Total characters unlinked: %', characters_unlinked;
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 4: Soft Delete Default Universes
-- ============================================================================

DO $$
DECLARE
  universes_deleted INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SOFT DELETING DEFAULT UNIVERSES';
  RAISE NOTICE '============================================================================';

  -- Soft delete all "My Books" universes that now have no books
  UPDATE universes
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE name = 'My Books'
    AND deleted_at IS NULL
    AND book_count = 0;  -- Only delete if no books remain

  GET DIAGNOSTICS universes_deleted = ROW_COUNT;

  RAISE NOTICE 'Total default universes deleted: %', universes_deleted;
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 5: Post-Rollback Validation
-- ============================================================================

DO $$
DECLARE
  remaining_books_linked INTEGER;
  remaining_characters_linked INTEGER;
  remaining_default_universes INTEGER;
  pre_books INTEGER;
  pre_characters INTEGER;
  pre_universes INTEGER;
  validation_passed BOOLEAN := TRUE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'POST-ROLLBACK VALIDATION';
  RAISE NOTICE '============================================================================';

  -- Get pre-rollback counts
  SELECT pre_count INTO pre_books FROM rollback_validation WHERE metric = 'books_in_default';
  SELECT pre_count INTO pre_characters FROM rollback_validation WHERE metric = 'characters_in_default';
  SELECT pre_count INTO pre_universes FROM rollback_validation WHERE metric = 'default_universes';

  -- Count remaining linked books
  SELECT COUNT(*) INTO remaining_books_linked
  FROM projects p
  JOIN universes u ON u.id = p.universe_id
  WHERE u.name = 'My Books'
    AND p.deleted_at IS NULL
    AND u.deleted_at IS NULL;

  -- Count remaining linked characters
  SELECT COUNT(*) INTO remaining_characters_linked
  FROM characters c
  JOIN universes u ON u.id = c.universe_id
  WHERE u.name = 'My Books'
    AND c.deleted_at IS NULL
    AND u.deleted_at IS NULL;

  -- Count remaining active default universes
  SELECT COUNT(*) INTO remaining_default_universes
  FROM universes
  WHERE name = 'My Books'
    AND deleted_at IS NULL;

  -- Update validation table
  UPDATE rollback_validation SET post_count = remaining_books_linked WHERE metric = 'books_in_default';
  UPDATE rollback_validation SET post_count = remaining_characters_linked WHERE metric = 'characters_in_default';
  UPDATE rollback_validation SET post_count = remaining_default_universes WHERE metric = 'default_universes';

  -- Display results
  RAISE NOTICE 'Before rollback:';
  RAISE NOTICE '  - Books in default universes: %', pre_books;
  RAISE NOTICE '  - Characters in default universes: %', pre_characters;
  RAISE NOTICE '  - Active default universes: %', pre_universes;
  RAISE NOTICE '';
  RAISE NOTICE 'After rollback:';
  RAISE NOTICE '  - Books in default universes: %', remaining_books_linked;
  RAISE NOTICE '  - Characters in default universes: %', remaining_characters_linked;
  RAISE NOTICE '  - Active default universes: %', remaining_default_universes;
  RAISE NOTICE '';

  -- Validate rollback success
  IF remaining_books_linked > 0 THEN
    RAISE WARNING 'Rollback incomplete: % books still linked to default universes', remaining_books_linked;
    validation_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ All books successfully unlinked';
  END IF;

  IF remaining_characters_linked > 0 THEN
    RAISE WARNING 'Rollback incomplete: % characters still linked to default universes', remaining_characters_linked;
    validation_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ All characters successfully unlinked';
  END IF;

  RAISE NOTICE '============================================================================';

  IF validation_passed THEN
    RAISE NOTICE '';
    RAISE NOTICE '✓✓✓ ROLLBACK COMPLETED SUCCESSFULLY ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'The database is now in pre-migration state:';
    RAISE NOTICE '  - Books have universe_id = NULL';
    RAISE NOTICE '  - Characters have universe_id = NULL';
    RAISE NOTICE '  - Default universes deleted or ready for cleanup';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '⚠⚠⚠ ROLLBACK COMPLETED WITH WARNINGS ⚠⚠⚠';
    RAISE WARNING 'Review warnings above and investigate remaining linked records';
    RAISE WARNING '';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK SUMMARY QUERY
-- ============================================================================

-- Show orphaned books after rollback
SELECT
  'Orphaned Books (should match pre-migration count)' AS summary,
  COUNT(*) AS count
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL;

-- Show orphaned characters after rollback
SELECT
  'Orphaned Characters (should match pre-migration count)' AS summary,
  COUNT(*) AS count
FROM characters
WHERE universe_id IS NULL
  AND deleted_at IS NULL;

-- Show remaining default universes
SELECT
  'Remaining Default Universes' AS summary,
  COUNT(*) AS active_count,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_count
FROM universes
WHERE name = 'My Books';
