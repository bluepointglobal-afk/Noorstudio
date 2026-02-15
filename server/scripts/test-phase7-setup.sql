-- Phase 7 Test Setup
-- Creates test illustration assets for testing Illustration Studio

DO $$
DECLARE
  test_account_id UUID;
  test_universe_id UUID;
  test_book_id UUID;
  illustration_1_id UUID;
  illustration_2_id UUID;
  ts_now TEXT;
BEGIN
  -- Get current timestamp as text
  ts_now := to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  -- Get the first account_id from supabase.auth.users
  SELECT id INTO test_account_id FROM auth.users LIMIT 1;

  -- If no users exist, use a dummy UUID
  IF test_account_id IS NULL THEN
    test_account_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- Get the "Test Adventure World" universe
  SELECT id INTO test_universe_id
  FROM universes
  WHERE name = 'Test Adventure World'
  LIMIT 1;

  -- If universe doesn't exist, get any universe
  IF test_universe_id IS NULL THEN
    SELECT id INTO test_universe_id FROM universes LIMIT 1;
  END IF;

  -- Get a test book for usage count demonstration
  SELECT id INTO test_book_id
  FROM projects
  WHERE user_id = test_account_id
  LIMIT 1;

  -- Create test illustration 1: Draft status
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    thumbnail_url,
    file_urls,
    metadata,
    tags
  ) VALUES (
    test_account_id,
    test_universe_id,
    'illustration',
    'Desert Sunset Landscape',
    'Beautiful sunset over the desert with golden sand dunes',
    jsonb_build_object(
      'prompt', 'Beautiful desert landscape at sunset, golden sand dunes, warm orange and pink sky, peaceful atmosphere',
      'scene', 'Chapter 3 - Journey Through the Desert',
      'status', 'draft',
      'variants', '[]'::jsonb
    ),
    'https://placehold.co/800x600/f4a261/ffffff?text=Desert+Sunset',
    '["https://placehold.co/800x600/f4a261/ffffff?text=Desert+Sunset"]'::jsonb,
    jsonb_build_object(
      'generatedAt', ts_now,
      'style', 'watercolor'
    ),
    ARRAY['illustration', 'landscape', 'desert', 'test']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO illustration_1_id;

  -- Create test illustration 2: Approved status, will be linked to book
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    thumbnail_url,
    file_urls,
    metadata,
    tags
  ) VALUES (
    test_account_id,
    test_universe_id,
    'illustration',
    'Ancient Temple Entrance',
    'Mysterious ancient temple with intricate carvings and glowing symbols',
    jsonb_build_object(
      'prompt', 'Ancient temple entrance with stone pillars, mystical glowing symbols, vines and vegetation, dramatic lighting',
      'scene', 'Chapter 4 - The Ancient Temple',
      'characterIds', '[]'::jsonb,
      'status', 'approved',
      'variants', '[
        {
          "id": "var1",
          "imageUrl": "https://placehold.co/800x600/2a9d8f/ffffff?text=Temple+v1",
          "selected": true,
          "seed": 42
        },
        {
          "id": "var2",
          "imageUrl": "https://placehold.co/800x600/264653/ffffff?text=Temple+v2",
          "selected": false,
          "seed": 43
        }
      ]'::jsonb
    ),
    'https://placehold.co/800x600/2a9d8f/ffffff?text=Temple+Entrance',
    '["https://placehold.co/800x600/2a9d8f/ffffff?text=Temple+v1","https://placehold.co/800x600/264653/ffffff?text=Temple+v2"]'::jsonb,
    jsonb_build_object(
      'generatedAt', ts_now,
      'approvedAt', ts_now,
      'style', 'digital painting'
    ),
    ARRAY['illustration', 'temple', 'architecture', 'test']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO illustration_2_id;

  -- Create test illustration 3: Pending status
  INSERT INTO assets (
    account_id,
    universe_id,
    type,
    name,
    description,
    data,
    thumbnail_url,
    file_urls,
    metadata,
    tags
  ) VALUES (
    test_account_id,
    test_universe_id,
    'illustration',
    'Character Action Scene',
    'Dynamic action scene with main character discovering the treasure',
    jsonb_build_object(
      'prompt', 'Young adventurer character discovering ancient treasure chest, dramatic lighting, sense of wonder and excitement',
      'scene', 'Chapter 5 - The Grand Discovery',
      'characterIds', '[]'::jsonb,
      'status', 'pending',
      'variants', '[]'::jsonb
    ),
    NULL,
    '[]'::jsonb,
    jsonb_build_object(
      'requestedAt', ts_now,
      'style', 'storybook illustration'
    ),
    ARRAY['illustration', 'character', 'action', 'test']
  )
  ON CONFLICT DO NOTHING;

  -- Link approved illustration to a book (if book exists)
  IF test_book_id IS NOT NULL AND illustration_2_id IS NOT NULL THEN
    INSERT INTO book_assets (book_id, asset_id, role, usage_context)
    VALUES (
      test_book_id,
      illustration_2_id,
      'illustration',
      jsonb_build_object(
        'chapter', 4,
        'scene', 'Temple entrance discovery',
        'pageNumber', 15
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- Verify created illustrations
SELECT
  a.id,
  u.name as universe_name,
  a.name as illustration_name,
  a.description,
  a.data->>'status' as status,
  a.usage_count,
  jsonb_array_length(a.file_urls) as variant_count,
  a.created_at
FROM assets a
LEFT JOIN universes u ON u.id = a.universe_id
WHERE a.type = 'illustration'
  AND 'test' = ANY(a.tags)
ORDER BY a.created_at DESC;

-- Show usage details for linked illustration
SELECT
  a.name as illustration_name,
  a.usage_count,
  p.title as used_in_book,
  ba.usage_context->>'chapter' as chapter,
  ba.usage_context->>'scene' as scene
FROM assets a
LEFT JOIN book_assets ba ON ba.asset_id = a.id
LEFT JOIN projects p ON p.id = ba.book_id
WHERE a.type = 'illustration'
  AND 'test' = ANY(a.tags)
  AND a.usage_count > 0;
