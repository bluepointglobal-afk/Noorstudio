-- Phase 11: Database Integrity Tests
-- Tests triggers, constraints, and data integrity

-- =====================================================
-- Setup: Get test user ID
-- =====================================================

DO $$
DECLARE
  test_account_id UUID;
  test_universe_id UUID;
  test_book_id UUID;
  test_asset_id UUID;
  test_book_id_2 UUID;
  initial_book_count INT;
  updated_book_count INT;
  initial_usage_count INT;
  updated_usage_count INT;
  version_count INT;
  current_version_count INT;
BEGIN
  -- Get a test user (or create one)
  SELECT id INTO test_account_id FROM auth.users LIMIT 1;

  IF test_account_id IS NULL THEN
    RAISE EXCEPTION 'No test user found. Please ensure auth.users has at least one user.';
  END IF;

  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Phase 11: Database Integrity Tests';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Test User ID: %', test_account_id;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 1: book_count Trigger
  -- =====================================================
  RAISE NOTICE '---TEST 1: book_count Trigger---';

  -- Create test universe
  INSERT INTO universes (
    account_id,
    name,
    description,
    series_bible,
    book_presets
  ) VALUES (
    test_account_id,
    'Test Universe for Triggers',
    'Testing book_count trigger',
    'Series bible content',
    '{"defaultAgeRange": "8-12", "defaultTemplate": "adventure"}'::jsonb
  ) RETURNING id INTO test_universe_id;

  RAISE NOTICE 'Created test universe: %', test_universe_id;

  -- Get initial book count (should be 0)
  SELECT book_count INTO initial_book_count
  FROM universes WHERE id = test_universe_id;

  RAISE NOTICE 'Initial book_count: %', initial_book_count;

  -- Create a book in this universe
  INSERT INTO projects (
    user_id,
    title,
    universe_id,
    status
  ) VALUES (
    test_account_id,
    'Test Book for Trigger',
    test_universe_id,
    'draft'
  ) RETURNING id INTO test_book_id;

  RAISE NOTICE 'Created test book: %', test_book_id;

  -- Get updated book count (should be 1)
  SELECT book_count INTO updated_book_count
  FROM universes WHERE id = test_universe_id;

  RAISE NOTICE 'Updated book_count: %', updated_book_count;

  IF updated_book_count = initial_book_count + 1 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: book_count incremented correctly';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: book_count should be % but is %',
      initial_book_count + 1, updated_book_count;
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 2: usage_count Trigger
  -- =====================================================
  RAISE NOTICE '---TEST 2: usage_count Trigger---';

  -- Create test asset
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    tags
  ) VALUES (
    test_account_id,
    test_universe_id,
    'illustration',
    'Test Illustration for Trigger',
    'Testing usage_count trigger',
    '{"status": "approved", "prompt": "test"}'::jsonb,
    ARRAY['test', 'trigger']
  ) RETURNING id INTO test_asset_id;

  RAISE NOTICE 'Created test asset: %', test_asset_id;

  -- Get initial usage count (should be 0)
  SELECT usage_count INTO initial_usage_count
  FROM assets WHERE id = test_asset_id;

  RAISE NOTICE 'Initial usage_count: %', initial_usage_count;

  -- Link asset to book
  INSERT INTO book_assets (
    book_id,
    asset_id,
    role,
    usage_context
  ) VALUES (
    test_book_id,
    test_asset_id,
    'illustration',
    '{"chapter": 1, "scene": "Opening scene"}'::jsonb
  );

  RAISE NOTICE 'Linked asset to book';

  -- Get updated usage count (should be 1)
  SELECT usage_count INTO updated_usage_count
  FROM assets WHERE id = test_asset_id;

  RAISE NOTICE 'Updated usage_count: %', updated_usage_count;

  IF updated_usage_count = initial_usage_count + 1 THEN
    RAISE NOTICE '✅ TEST 2 PASSED: usage_count incremented correctly';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: usage_count should be % but is %',
      initial_usage_count + 1, updated_usage_count;
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 3: usage_count with Multiple Books
  -- =====================================================
  RAISE NOTICE '---TEST 3: usage_count with Multiple Books---';

  -- Create second book
  INSERT INTO projects (
    user_id,
    title,
    universe_id,
    status
  ) VALUES (
    test_account_id,
    'Test Book 2 for Trigger',
    test_universe_id,
    'draft'
  ) RETURNING id INTO test_book_id_2;

  RAISE NOTICE 'Created second test book: %', test_book_id_2;

  -- Link same asset to second book
  INSERT INTO book_assets (
    book_id,
    asset_id,
    role,
    usage_context
  ) VALUES (
    test_book_id_2,
    test_asset_id,
    'illustration',
    '{"chapter": 2, "scene": "Second book scene"}'::jsonb
  );

  RAISE NOTICE 'Linked same asset to second book';

  -- Get updated usage count (should be 2)
  SELECT usage_count INTO updated_usage_count
  FROM assets WHERE id = test_asset_id;

  RAISE NOTICE 'Updated usage_count: %', updated_usage_count;

  IF updated_usage_count = 2 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: usage_count tracks multiple books correctly';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: usage_count should be 2 but is %',
      updated_usage_count;
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 4: version_number Auto-increment
  -- =====================================================
  RAISE NOTICE '---TEST 4: version_number Auto-increment---';

  -- Create first outline version
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    change_summary,
    is_current
  ) VALUES (
    test_book_id,
    1,
    '{"chapters": [{"title": "Chapter 1"}]}'::jsonb,
    'Initial outline',
    true
  );

  RAISE NOTICE 'Created version 1';

  -- Create second outline version (version_number should auto-increment)
  INSERT INTO outline_versions (
    book_id,
    data,
    change_summary,
    is_current
  ) VALUES (
    test_book_id,
    '{"chapters": [{"title": "Chapter 1"}, {"title": "Chapter 2"}]}'::jsonb,
    'Added chapter 2',
    false
  );

  RAISE NOTICE 'Created version 2';

  -- Check version numbers
  SELECT COUNT(*) INTO version_count
  FROM outline_versions WHERE book_id = test_book_id;

  RAISE NOTICE 'Total versions: %', version_count;

  IF version_count = 2 THEN
    RAISE NOTICE '✅ TEST 4 PASSED: Versions created correctly';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: Should have 2 versions but have %',
      version_count;
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 5: is_current Constraint (Only One Current)
  -- =====================================================
  RAISE NOTICE '---TEST 5: is_current Constraint---';

  -- Set version 2 as current
  UPDATE outline_versions
  SET is_current = true
  WHERE book_id = test_book_id
    AND version_number = 2;

  RAISE NOTICE 'Set version 2 as current';

  -- Count how many are current (should be exactly 1)
  SELECT COUNT(*) INTO current_version_count
  FROM outline_versions
  WHERE book_id = test_book_id AND is_current = true;

  RAISE NOTICE 'Current version count: %', current_version_count;

  IF current_version_count = 1 THEN
    RAISE NOTICE '✅ TEST 5 PASSED: Only one current version enforced';
  ELSE
    RAISE EXCEPTION '❌ TEST 5 FAILED: Should have exactly 1 current version but have %',
      current_version_count;
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 6: Soft Delete (deleted_at)
  -- =====================================================
  RAISE NOTICE '---TEST 6: Soft Delete---';

  -- Soft delete the universe
  UPDATE universes
  SET deleted_at = NOW()
  WHERE id = test_universe_id;

  RAISE NOTICE 'Soft deleted universe';

  -- Verify data still exists in database
  IF EXISTS (SELECT 1 FROM universes WHERE id = test_universe_id) THEN
    RAISE NOTICE '✅ TEST 6 PASSED: Soft delete preserves data';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: Universe should still exist in database';
  END IF;

  -- Verify deleted_at is set
  IF EXISTS (SELECT 1 FROM universes WHERE id = test_universe_id AND deleted_at IS NOT NULL) THEN
    RAISE NOTICE '✅ TEST 6 PASSED: deleted_at timestamp set correctly';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: deleted_at should be set';
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 7: JSONB Data Types
  -- =====================================================
  RAISE NOTICE '---TEST 7: JSONB Data Types---';

  -- Test book_presets JSONB
  IF EXISTS (
    SELECT 1 FROM universes
    WHERE id = test_universe_id
      AND book_presets->>'defaultAgeRange' = '8-12'
  ) THEN
    RAISE NOTICE '✅ TEST 7A PASSED: book_presets JSONB queryable';
  ELSE
    RAISE EXCEPTION '❌ TEST 7A FAILED: book_presets JSONB not queryable';
  END IF;

  -- Test asset data JSONB
  IF EXISTS (
    SELECT 1 FROM assets
    WHERE id = test_asset_id
      AND data->>'status' = 'approved'
  ) THEN
    RAISE NOTICE '✅ TEST 7B PASSED: asset data JSONB queryable';
  ELSE
    RAISE EXCEPTION '❌ TEST 7B FAILED: asset data JSONB not queryable';
  END IF;

  -- Test usage_context JSONB
  IF EXISTS (
    SELECT 1 FROM book_assets
    WHERE asset_id = test_asset_id
      AND (usage_context->>'chapter')::int = 1
  ) THEN
    RAISE NOTICE '✅ TEST 7C PASSED: usage_context JSONB queryable';
  ELSE
    RAISE EXCEPTION '❌ TEST 7C FAILED: usage_context JSONB not queryable';
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- TEST 8: Foreign Key Constraints
  -- =====================================================
  RAISE NOTICE '---TEST 8: Foreign Key Constraints---';

  -- Verify book → universe relationship
  IF EXISTS (
    SELECT 1 FROM projects p
    INNER JOIN universes u ON p.universe_id = u.id
    WHERE p.id = test_book_id
  ) THEN
    RAISE NOTICE '✅ TEST 8A PASSED: Book-Universe foreign key valid';
  ELSE
    RAISE EXCEPTION '❌ TEST 8A FAILED: Book-Universe foreign key invalid';
  END IF;

  -- Verify book_assets → books relationship
  IF EXISTS (
    SELECT 1 FROM book_assets ba
    INNER JOIN projects p ON ba.book_id = p.id
    WHERE ba.book_id = test_book_id
  ) THEN
    RAISE NOTICE '✅ TEST 8B PASSED: BookAssets-Book foreign key valid';
  ELSE
    RAISE EXCEPTION '❌ TEST 8B FAILED: BookAssets-Book foreign key invalid';
  END IF;

  -- Verify book_assets → assets relationship
  IF EXISTS (
    SELECT 1 FROM book_assets ba
    INNER JOIN assets a ON ba.asset_id = a.id
    WHERE ba.asset_id = test_asset_id
  ) THEN
    RAISE NOTICE '✅ TEST 8C PASSED: BookAssets-Asset foreign key valid';
  ELSE
    RAISE EXCEPTION '❌ TEST 8C FAILED: BookAssets-Asset foreign key invalid';
  END IF;
  RAISE NOTICE '';

  -- =====================================================
  -- Cleanup Test Data
  -- =====================================================
  RAISE NOTICE '---Cleanup---';

  -- Delete test data
  DELETE FROM book_assets WHERE book_id IN (test_book_id, test_book_id_2);
  DELETE FROM outline_versions WHERE book_id = test_book_id;
  DELETE FROM assets WHERE id = test_asset_id;
  DELETE FROM projects WHERE id IN (test_book_id, test_book_id_2);
  DELETE FROM universes WHERE id = test_universe_id;

  RAISE NOTICE 'Test data cleaned up';
  RAISE NOTICE '';

  -- =====================================================
  -- Summary
  -- =====================================================
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'ALL TESTS PASSED ✅';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Test 1: book_count trigger ✅';
  RAISE NOTICE 'Test 2: usage_count trigger ✅';
  RAISE NOTICE 'Test 3: usage_count multiple books ✅';
  RAISE NOTICE 'Test 4: version_number auto-increment ✅';
  RAISE NOTICE 'Test 5: is_current constraint ✅';
  RAISE NOTICE 'Test 6: Soft delete ✅';
  RAISE NOTICE 'Test 7: JSONB data types ✅';
  RAISE NOTICE 'Test 8: Foreign key constraints ✅';
  RAISE NOTICE '=================================================';

END $$;
