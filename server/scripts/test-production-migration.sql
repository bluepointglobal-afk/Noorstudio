-- ============================================================================
-- PRODUCTION DATA MIGRATION TEST SCRIPT
-- Universe V2 - Dry Run / Validation
-- ============================================================================
--
-- PURPOSE:
--   Test the production data migration WITHOUT making changes.
--   Validates what WOULD happen if migration runs.
--
-- SAFETY:
--   - Read-only queries - NO data modifications
--   - Safe to run on production
--   - Helps identify potential issues before migration
--
-- USAGE:
--   psql $DATABASE_URL -f server/scripts/test-production-migration.sql
--
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'PRODUCTION MIGRATION DRY RUN - READ ONLY VALIDATION'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- TEST 1: Identify Orphaned Data
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 1: ORPHANED DATA ANALYSIS'
\echo '============================================================================'
\echo ''

-- Count orphaned books
\echo 'Orphaned Books (books without universe_id):'
SELECT
  COUNT(*) AS total_orphaned_books,
  COUNT(DISTINCT user_id) AS users_affected,
  MIN(created_at) AS oldest_book,
  MAX(created_at) AS newest_book
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL;

-- Sample orphaned books
\echo ''
\echo 'Sample Orphaned Books (first 5):'
SELECT
  id,
  title,
  user_id,
  status,
  created_at
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- Count orphaned characters
\echo ''
\echo 'Orphaned Characters (characters without universe_id):'
SELECT
  COUNT(*) AS total_orphaned_characters,
  COUNT(DISTINCT user_id) AS users_affected
FROM characters
WHERE universe_id IS NULL
  AND deleted_at IS NULL;

-- ============================================================================
-- TEST 2: Identify Users Needing Default Universes
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 2: USERS REQUIRING DEFAULT UNIVERSE'
\echo '============================================================================'
\echo ''

-- Users who will get a "My Books" universe
\echo 'Users who will receive a "My Books" default universe:'
SELECT
  user_id,
  COUNT(*) AS orphaned_book_count,
  MIN(created_at) AS first_book_date,
  MAX(created_at) AS last_book_date
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL
GROUP BY user_id
ORDER BY orphaned_book_count DESC;

-- ============================================================================
-- TEST 3: Check for Existing "My Books" Universes
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 3: EXISTING "MY BOOKS" UNIVERSES'
\echo '============================================================================'
\echo ''

-- Check if any users already have "My Books" universes
\echo 'Existing "My Books" universes (migration will reuse these):'
SELECT
  u.id,
  u.account_id,
  u.book_count,
  u.created_at,
  COUNT(p.id) AS actual_book_count
FROM universes u
LEFT JOIN projects p ON p.universe_id = u.id AND p.deleted_at IS NULL
WHERE u.name = 'My Books'
  AND u.deleted_at IS NULL
GROUP BY u.id, u.account_id, u.book_count, u.created_at;

-- ============================================================================
-- TEST 4: Predict Migration Results
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 4: MIGRATION PREDICTION'
\echo '============================================================================'
\echo ''

\echo 'What will happen if migration runs:'

-- Predict new universes to be created
WITH users_needing_universe AS (
  SELECT DISTINCT user_id
  FROM projects
  WHERE universe_id IS NULL
    AND deleted_at IS NULL
),
existing_universes AS (
  SELECT account_id
  FROM universes
  WHERE name = 'My Books'
    AND deleted_at IS NULL
)
SELECT
  'New "My Books" universes to create' AS prediction,
  COUNT(*) AS count
FROM users_needing_universe u
LEFT JOIN existing_universes e ON e.account_id = u.user_id
WHERE e.account_id IS NULL;

-- Predict book migrations
SELECT
  'Books to be migrated' AS prediction,
  COUNT(*) AS count
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL;

-- Predict character migrations
SELECT
  'Characters to be migrated' AS prediction,
  COUNT(*) AS count
FROM characters
WHERE universe_id IS NULL
  AND deleted_at IS NULL;

-- ============================================================================
-- TEST 5: Data Integrity Checks
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 5: DATA INTEGRITY PRE-CHECKS'
\echo '============================================================================'
\echo ''

-- Check for invalid user_ids in projects
\echo 'Invalid user_ids in projects table:'
SELECT
  COUNT(*) AS invalid_user_count,
  COUNT(DISTINCT user_id) AS unique_invalid_users
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL
  AND user_id IS NULL;

-- Check for potential FK violations
\echo ''
\echo 'Potential foreign key issues:'
SELECT
  'Projects with NULL user_id' AS issue,
  COUNT(*) AS count
FROM projects
WHERE user_id IS NULL
  AND deleted_at IS NULL
UNION ALL
SELECT
  'Characters with NULL user_id' AS issue,
  COUNT(*) AS count
FROM characters
WHERE user_id IS NULL
  AND deleted_at IS NULL;

-- ============================================================================
-- TEST 6: Estimate Book Counts After Migration
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 6: PREDICTED BOOK COUNTS PER USER'
\echo '============================================================================'
\echo ''

-- Show how many books each "My Books" universe will have
\echo 'Predicted book counts for "My Books" universes after migration:'
SELECT
  user_id,
  COUNT(*) AS books_that_will_be_migrated,
  ARRAY_AGG(title ORDER BY created_at DESC) AS sample_book_titles
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL
GROUP BY user_id
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================================================
-- TEST 7: Check for Edge Cases
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 7: EDGE CASES AND WARNINGS'
\echo '============================================================================'
\echo ''

-- Books with unusual statuses
\echo 'Books with non-standard statuses:'
SELECT
  status,
  COUNT(*) AS count
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Very old orphaned books
\echo ''
\echo 'Very old orphaned books (created > 1 year ago):'
SELECT
  COUNT(*) AS old_book_count,
  MIN(created_at) AS oldest_date
FROM projects
WHERE universe_id IS NULL
  AND deleted_at IS NULL
  AND created_at < NOW() - INTERVAL '1 year';

-- Books with existing book_assets relationships
\echo ''
\echo 'Orphaned books that already have assets linked:'
SELECT
  COUNT(DISTINCT p.id) AS books_with_assets
FROM projects p
JOIN book_assets ba ON ba.book_id = p.id
WHERE p.universe_id IS NULL
  AND p.deleted_at IS NULL;

-- ============================================================================
-- TEST 8: Database Constraint Validation
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 8: DATABASE CONSTRAINTS'
\echo '============================================================================'
\echo ''

-- Verify universe_id column exists and allows NULL
\echo 'Verify projects.universe_id column configuration:'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'projects'
  AND column_name = 'universe_id';

-- Verify characters.universe_id column exists and allows NULL
\echo ''
\echo 'Verify characters.universe_id column configuration:'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'characters'
  AND column_name = 'universe_id';

-- Check for foreign key constraints
\echo ''
\echo 'Foreign key constraints that will be validated during migration:'
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('projects', 'characters')
  AND kcu.column_name = 'universe_id';

-- ============================================================================
-- TEST 9: Trigger Validation
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'TEST 9: TRIGGER VERIFICATION'
\echo '============================================================================'
\echo ''

-- Check that book_count trigger exists on universes
\echo 'Triggers that will auto-update book_count:'
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('projects', 'universes')
  AND trigger_name LIKE '%book_count%'
ORDER BY trigger_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'MIGRATION DRY RUN SUMMARY'
\echo '============================================================================'
\echo ''

-- Final summary
WITH migration_summary AS (
  SELECT
    (SELECT COUNT(*) FROM projects WHERE universe_id IS NULL AND deleted_at IS NULL) AS orphaned_books,
    (SELECT COUNT(*) FROM characters WHERE universe_id IS NULL AND deleted_at IS NULL) AS orphaned_characters,
    (SELECT COUNT(DISTINCT user_id) FROM projects WHERE universe_id IS NULL AND deleted_at IS NULL) AS users_affected,
    (SELECT COUNT(*) FROM universes WHERE name = 'My Books' AND deleted_at IS NULL) AS existing_my_books_universes
)
SELECT
  'Total orphaned books' AS metric,
  orphaned_books::text AS value
FROM migration_summary
UNION ALL
SELECT
  'Total orphaned characters',
  orphaned_characters::text
FROM migration_summary
UNION ALL
SELECT
  'Users requiring "My Books" universe',
  users_affected::text
FROM migration_summary
UNION ALL
SELECT
  'Existing "My Books" universes (will be reused)',
  existing_my_books_universes::text
FROM migration_summary
UNION ALL
SELECT
  'New "My Books" universes to create',
  (users_affected - existing_my_books_universes)::text
FROM migration_summary;

\echo ''
\echo '============================================================================'
\echo 'DRY RUN COMPLETE - NO DATA MODIFIED'
\echo '============================================================================'
\echo ''
\echo 'Review the output above before running the actual migration.'
\echo 'If everything looks correct, run: migrate-production-data.sql'
\echo ''
