-- Phase 11: End-to-End Test Data Setup
-- Creates comprehensive test data for E2E testing

DO $$
DECLARE
  test_account_id UUID;
  universe_full_id UUID;
  universe_partial_id UUID;
  universe_empty_id UUID;
  universe_large_id UUID;
  book1_id UUID;
  book2_id UUID;
  book3_id UUID;
  asset1_id UUID;
  asset2_id UUID;
  asset3_id UUID;
  cover1_id UUID;
  cover2_id UUID;
  ts_now TEXT;
BEGIN
  -- Get test user
  SELECT id INTO test_account_id FROM auth.users LIMIT 1;

  IF test_account_id IS NULL THEN
    RAISE EXCEPTION 'No test user found';
  END IF;

  ts_now := to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Phase 11: E2E Test Data Setup';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'User ID: %', test_account_id;
  RAISE NOTICE 'Timestamp: %', ts_now;
  RAISE NOTICE '';

  -- =====================================================
  -- Universe 1: Full Presets
  -- =====================================================
  RAISE NOTICE '--- Creating Universe 1: Full Presets ---';

  INSERT INTO universes (
    account_id,
    name,
    description,
    series_bible,
    visual_dna,
    writing_dna,
    book_presets,
    tags
  ) VALUES (
    test_account_id,
    'Fantasy Quest Series',
    'An epic fantasy series following young heroes on magical adventures',
    E'**Setting:** Medieval fantasy kingdom of Eldoria\n**Tone:** Adventurous, magical, hopeful\n**Themes:** Friendship, courage, discovery\n**Magic System:** Elemental magic (fire, water, earth, air)',
    jsonb_build_object(
      'style', 'vibrant watercolor with rich colors',
      'colorPalette', ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
      'artDirection', 'Whimsical and detailed illustrations',
      'characterDesign', 'Expressive faces, dynamic poses'
    ),
    jsonb_build_object(
      'tone', 'Warm and engaging',
      'vocabulary', 'Age-appropriate with occasional advanced words',
      'sentenceStructure', 'Mix of simple and complex sentences',
      'narrativeStyle', 'Third-person with occasional first-person passages'
    ),
    jsonb_build_object(
      'defaultAgeRange', '8-12',
      'defaultTemplate', 'adventure',
      'defaultLayoutStyle', 'split-page',
      'defaultTrimSize', '8x10',
      'defaultPageCount', 32
    ),
    ARRAY['fantasy', 'adventure', 'magic', 'quest', 'series']
  ) RETURNING id INTO universe_full_id;

  RAISE NOTICE 'Created Fantasy Quest Series: %', universe_full_id;

  -- =====================================================
  -- Universe 2: Partial Presets
  -- =====================================================
  RAISE NOTICE '--- Creating Universe 2: Partial Presets ---';

  INSERT INTO universes (
    account_id,
    name,
    description,
    series_bible,
    book_presets,
    tags
  ) VALUES (
    test_account_id,
    'Science Adventures',
    'Educational science-themed stories for curious minds',
    E'**Setting:** Modern world with science labs and experiments\n**Educational Goals:** STEM learning through stories',
    jsonb_build_object(
      'defaultAgeRange', '6-10',
      'defaultTemplate', 'educational'
    ),
    ARRAY['science', 'educational', 'STEM']
  ) RETURNING id INTO universe_partial_id;

  RAISE NOTICE 'Created Science Adventures: %', universe_partial_id;

  -- =====================================================
  -- Universe 3: No Presets (Empty)
  -- =====================================================
  RAISE NOTICE '--- Creating Universe 3: No Presets ---';

  INSERT INTO universes (
    account_id,
    name,
    description,
    book_presets,
    tags
  ) VALUES (
    test_account_id,
    'Mystery Stories',
    'Thrilling mystery tales for young detectives',
    '{}'::jsonb,
    ARRAY['mystery', 'detective', 'puzzle']
  ) RETURNING id INTO universe_empty_id;

  RAISE NOTICE 'Created Mystery Stories: %', universe_empty_id;

  -- =====================================================
  -- Universe 4: Large Dataset (for performance testing)
  -- =====================================================
  RAISE NOTICE '--- Creating Universe 4: Large Dataset ---';

  INSERT INTO universes (
    account_id,
    name,
    description,
    series_bible,
    book_presets,
    tags
  ) VALUES (
    test_account_id,
    'Animal Kingdom Chronicles',
    'A large series with many assets for performance testing',
    E'**Setting:** Magical animal kingdom\n**Characters:** Dozens of animal characters',
    jsonb_build_object(
      'defaultAgeRange', '5-8',
      'defaultTemplate', 'picture_book'
    ),
    ARRAY['animals', 'nature', 'adventure']
  ) RETURNING id INTO universe_large_id;

  RAISE NOTICE 'Created Animal Kingdom Chronicles: %', universe_large_id;
  RAISE NOTICE '';

  -- =====================================================
  -- Books
  -- =====================================================
  RAISE NOTICE '--- Creating Books ---';

  -- Book 1: In Fantasy Quest Series
  INSERT INTO projects (
    user_id,
    title,
    universe_id,
    status,
    data
  ) VALUES (
    test_account_id,
    'The Crystal of Light',
    universe_full_id,
    'generating',
    jsonb_build_object(
      'ageRange', '8-12',
      'template', 'adventure',
      'layoutStyle', 'split-page',
      'trimSize', '8x10'
    )
  ) RETURNING id INTO book1_id;

  RAISE NOTICE 'Created Book 1: The Crystal of Light (%)', book1_id;

  -- Book 2: In Fantasy Quest Series (for asset reuse testing)
  INSERT INTO projects (
    user_id,
    title,
    universe_id,
    status,
    data
  ) VALUES (
    test_account_id,
    'The Shadow Kingdom',
    universe_full_id,
    'draft',
    jsonb_build_object(
      'ageRange', '8-12',
      'template', 'adventure',
      'layoutStyle', 'split-page',
      'trimSize', '8x10'
    )
  ) RETURNING id INTO book2_id;

  RAISE NOTICE 'Created Book 2: The Shadow Kingdom (%)', book2_id;

  -- Book 3: No universe (orphaned book)
  INSERT INTO projects (
    user_id,
    title,
    status,
    data
  ) VALUES (
    test_account_id,
    'Standalone Story',
    'draft',
    jsonb_build_object(
      'ageRange', '6-9',
      'template', 'fairy_tale'
    )
  ) RETURNING id INTO book3_id;

  RAISE NOTICE 'Created Book 3: Standalone Story (%)', book3_id;
  RAISE NOTICE '';

  -- =====================================================
  -- Illustrations
  -- =====================================================
  RAISE NOTICE '--- Creating Illustrations ---';

  -- Illustration 1: Pending status
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    tags,
    file_urls,
    thumbnail_url
  ) VALUES (
    test_account_id,
    universe_full_id,
    'illustration',
    'Hero in Forest',
    'Young hero discovering magic in enchanted forest',
    jsonb_build_object(
      'status', 'pending',
      'prompt', 'A young hero with a glowing crystal standing in an enchanted forest with magical creatures',
      'scene', 'Forest discovery',
      'chapterNumber', 1,
      'variants', '[]'::jsonb
    ),
    ARRAY['forest', 'hero', 'magic'],
    '[]'::jsonb,
    NULL
  ) RETURNING id INTO asset1_id;

  RAISE NOTICE 'Created Illustration 1: Hero in Forest (pending) - %', asset1_id;

  -- Illustration 2: Draft status with variants
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    tags,
    file_urls,
    thumbnail_url
  ) VALUES (
    test_account_id,
    universe_full_id,
    'illustration',
    'Castle Approach',
    'Heroes approaching the crystal castle at sunset',
    jsonb_build_object(
      'status', 'draft',
      'prompt', 'A majestic crystal castle on a hill at sunset with two young heroes approaching',
      'scene', 'Castle approach',
      'chapterNumber', 3,
      'variants', jsonb_build_array(
        jsonb_build_object(
          'id', 'var-0',
          'imageUrl', 'https://placehold.co/1024x1024/FF6B6B/white?text=Castle+Variant+1',
          'selected', true,
          'generatedAt', ts_now
        ),
        jsonb_build_object(
          'id', 'var-1',
          'imageUrl', 'https://placehold.co/1024x1024/4ECDC4/white?text=Castle+Variant+2',
          'selected', false,
          'generatedAt', ts_now
        )
      )
    ),
    ARRAY['castle', 'heroes', 'sunset'],
    '["https://placehold.co/1024x1024/FF6B6B/white?text=Castle+Variant+1", "https://placehold.co/1024x1024/4ECDC4/white?text=Castle+Variant+2"]'::jsonb,
    'https://placehold.co/1024x1024/FF6B6B/white?text=Castle+Variant+1'
  ) RETURNING id INTO asset2_id;

  RAISE NOTICE 'Created Illustration 2: Castle Approach (draft, 2 variants) - %', asset2_id;

  -- Illustration 3: Approved status (for reuse testing)
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    tags,
    file_urls,
    thumbnail_url
  ) VALUES (
    test_account_id,
    universe_full_id,
    'illustration',
    'Magic Battle',
    'Epic magical battle with elemental powers',
    jsonb_build_object(
      'status', 'approved',
      'prompt', 'Dynamic magical battle scene with fire, water, earth, and air elements swirling',
      'scene', 'Final battle',
      'chapterNumber', 5,
      'variants', jsonb_build_array(
        jsonb_build_object(
          'id', 'var-0',
          'imageUrl', 'https://placehold.co/1024x1024/45B7D1/white?text=Battle+Scene',
          'selected', true,
          'generatedAt', ts_now
        )
      )
    ),
    ARRAY['battle', 'magic', 'elements'],
    '["https://placehold.co/1024x1024/45B7D1/white?text=Battle+Scene"]'::jsonb,
    'https://placehold.co/1024x1024/45B7D1/white?text=Battle+Scene'
  ) RETURNING id INTO asset3_id;

  RAISE NOTICE 'Created Illustration 3: Magic Battle (approved) - %', asset3_id;

  -- Link approved illustration to first book
  INSERT INTO book_assets (book_id, asset_id, role, usage_context)
  VALUES (
    book1_id,
    asset3_id,
    'illustration',
    jsonb_build_object('chapter', 5, 'scene', 'Final battle')
  );

  RAISE NOTICE 'Linked Magic Battle to Book 1';
  RAISE NOTICE '';

  -- =====================================================
  -- Covers
  -- =====================================================
  RAISE NOTICE '--- Creating Covers ---';

  -- Cover 1: Front cover, draft status
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    tags,
    file_urls,
    thumbnail_url
  ) VALUES (
    test_account_id,
    universe_full_id,
    'cover',
    'Crystal of Light - Front',
    'Classic front cover for The Crystal of Light',
    jsonb_build_object(
      'coverType', 'front',
      'template', 'classic',
      'title', 'The Crystal of Light',
      'subtitle', 'Book 1 of Fantasy Quest',
      'authorName', 'Test Author',
      'status', 'draft',
      'prompt', 'Magical crystal glowing in young hero''s hands with enchanted forest background',
      'variants', jsonb_build_array(
        jsonb_build_object(
          'id', 'var-0',
          'imageUrl', 'https://placehold.co/600x900/FF6B6B/white?text=Front+Cover',
          'selected', true,
          'generatedAt', ts_now
        )
      )
    ),
    ARRAY['cover', 'front', 'classic'],
    '["https://placehold.co/600x900/FF6B6B/white?text=Front+Cover"]'::jsonb,
    'https://placehold.co/600x900/FF6B6B/white?text=Front+Cover'
  ) RETURNING id INTO cover1_id;

  RAISE NOTICE 'Created Cover 1: Front cover (draft) - %', cover1_id;

  -- Cover 2: Full cover, approved status
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    tags,
    file_urls,
    thumbnail_url
  ) VALUES (
    test_account_id,
    universe_full_id,
    'cover',
    'Crystal of Light - Full',
    'Modern full wraparound cover',
    jsonb_build_object(
      'coverType', 'full',
      'template', 'modern',
      'title', 'The Crystal of Light',
      'subtitle', 'An Epic Quest Begins',
      'authorName', 'Test Author',
      'status', 'approved',
      'prompt', 'Full wraparound cover with hero, castle, and magical elements',
      'variants', jsonb_build_array(
        jsonb_build_object(
          'id', 'var-0',
          'imageUrl', 'https://placehold.co/1800x900/4ECDC4/white?text=Full+Cover',
          'selected', true,
          'generatedAt', ts_now
        )
      )
    ),
    ARRAY['cover', 'full', 'modern'],
    '["https://placehold.co/1800x900/4ECDC4/white?text=Full+Cover"]'::jsonb,
    'https://placehold.co/1800x900/4ECDC4/white?text=Full+Cover'
  ) RETURNING id INTO cover2_id;

  RAISE NOTICE 'Created Cover 2: Full cover (approved) - %', cover2_id;

  -- Link approved cover to first book
  INSERT INTO book_assets (book_id, asset_id, role, usage_context)
  VALUES (
    book1_id,
    cover2_id,
    'cover',
    jsonb_build_object('position', 'full', 'format', 'print')
  );

  RAISE NOTICE 'Linked Full Cover to Book 1';
  RAISE NOTICE '';

  -- =====================================================
  -- Outline Versions (for version control testing)
  -- =====================================================
  RAISE NOTICE '--- Creating Outline Versions ---';

  -- Version 1: Initial outline (5 chapters)
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    change_summary,
    is_current,
    locked_sections
  ) VALUES (
    book1_id,
    1,
    jsonb_build_object(
      'chapters', jsonb_build_array(
        jsonb_build_object('title', 'The Discovery', 'key_scene', 'Finding the crystal'),
        jsonb_build_object('title', 'The Journey Begins', 'key_scene', 'Leaving home'),
        jsonb_build_object('title', 'The Dark Forest', 'key_scene', 'Encountering danger'),
        jsonb_build_object('title', 'The Crystal Castle', 'key_scene', 'Reaching destination'),
        jsonb_build_object('title', 'The Final Test', 'key_scene', 'Proving worthy')
      )
    ),
    'Initial 5-chapter outline',
    false,
    '[]'::jsonb
  );

  RAISE NOTICE 'Created outline version 1 (5 chapters)';

  -- Version 2: Expanded outline (6 chapters, locked sections)
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    change_summary,
    is_current,
    locked_sections
  ) VALUES (
    book1_id,
    2,
    jsonb_build_object(
      'chapters', jsonb_build_array(
        jsonb_build_object('title', 'The Discovery', 'key_scene', 'Finding the crystal'),
        jsonb_build_object('title', 'The Journey Begins', 'key_scene', 'Leaving home'),
        jsonb_build_object('title', 'The Dark Forest', 'key_scene', 'Encountering danger'),
        jsonb_build_object('title', 'The Hidden Village', 'key_scene', 'Meeting allies'),
        jsonb_build_object('title', 'The Crystal Castle', 'key_scene', 'Reaching destination'),
        jsonb_build_object('title', 'The Final Test', 'key_scene', 'Proving worthy')
      )
    ),
    'Added chapter 4: The Hidden Village',
    false,
    jsonb_build_array(0, 2)  -- Locked chapters 1 and 3
  );

  RAISE NOTICE 'Created outline version 2 (6 chapters, 2 locked)';

  -- Version 3: Current version (refined)
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    change_summary,
    is_current,
    locked_sections
  ) VALUES (
    book1_id,
    3,
    jsonb_build_object(
      'chapters', jsonb_build_array(
        jsonb_build_object('title', 'The Discovery', 'key_scene', 'Finding the crystal in cave'),
        jsonb_build_object('title', 'The Journey Begins', 'key_scene', 'Leaving home with mentor'),
        jsonb_build_object('title', 'The Dark Forest', 'key_scene', 'Encountering shadow creatures'),
        jsonb_build_object('title', 'The Hidden Village', 'key_scene', 'Meeting allies and training'),
        jsonb_build_object('title', 'The Crystal Castle', 'key_scene', 'Reaching castle at sunset'),
        jsonb_build_object('title', 'The Final Battle', 'key_scene', 'Defeating shadow lord')
      )
    ),
    'Refined scenes and renamed final chapter to Battle',
    true,
    jsonb_build_array(0, 2, 3)  -- Locked chapters 1, 3, 4
  );

  RAISE NOTICE 'Created outline version 3 (current, 3 locked)';
  RAISE NOTICE '';

  -- =====================================================
  -- Large Dataset for Performance Testing
  -- =====================================================
  RAISE NOTICE '--- Creating Large Dataset (30 assets) ---';

  -- Create 30 illustrations in large universe
  FOR i IN 1..30 LOOP
    INSERT INTO assets (
      account_id,
      universe_id,
      type,
      name,
      description,
      data,
      tags,
      file_urls,
      thumbnail_url
    ) VALUES (
      test_account_id,
      universe_large_id,
      'illustration',
      'Animal Character ' || i,
      'Character illustration for performance testing',
      jsonb_build_object(
        'status', CASE
          WHEN i % 3 = 0 THEN 'approved'
          WHEN i % 3 = 1 THEN 'draft'
          ELSE 'pending'
        END,
        'prompt', 'Animal character number ' || i,
        'variants', '[]'::jsonb
      ),
      ARRAY['animal', 'character'],
      CASE
        WHEN i % 3 = 1 THEN jsonb_build_array('https://placehold.co/600x600?text=Character+' || i::text)
        ELSE '[]'::jsonb
      END,
      CASE
        WHEN i % 3 = 1 THEN 'https://placehold.co/600x600?text=Character+' || i::text
        ELSE NULL
      END
    );
  END LOOP;

  RAISE NOTICE 'Created 30 illustrations for performance testing';
  RAISE NOTICE '';

  -- =====================================================
  -- Summary
  -- =====================================================
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'E2E Test Data Created Successfully ✅';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Universes:';
  RAISE NOTICE '  - Fantasy Quest Series (full presets): %', universe_full_id;
  RAISE NOTICE '  - Science Adventures (partial presets): %', universe_partial_id;
  RAISE NOTICE '  - Mystery Stories (no presets): %', universe_empty_id;
  RAISE NOTICE '  - Animal Kingdom Chronicles (large dataset): %', universe_large_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Books:';
  RAISE NOTICE '  - The Crystal of Light: %', book1_id;
  RAISE NOTICE '  - The Shadow Kingdom: %', book2_id;
  RAISE NOTICE '  - Standalone Story: %', book3_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Illustrations:';
  RAISE NOTICE '  - Hero in Forest (pending): %', asset1_id;
  RAISE NOTICE '  - Castle Approach (draft, 2 variants): %', asset2_id;
  RAISE NOTICE '  - Magic Battle (approved, linked): %', asset3_id;
  RAISE NOTICE '  - 30 animal characters (performance test)';
  RAISE NOTICE '';
  RAISE NOTICE 'Covers:';
  RAISE NOTICE '  - Front cover (draft): %', cover1_id;
  RAISE NOTICE '  - Full cover (approved, linked): %', cover2_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Outline Versions:';
  RAISE NOTICE '  - Book 1 has 3 versions (v3 is current)';
  RAISE NOTICE '  - Locked sections demonstrate version control';
  RAISE NOTICE '=================================================';

END $$;
