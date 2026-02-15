-- Phase 8 Test Setup
-- Creates test cover assets for testing Cover Studio

DO $$
DECLARE
  test_account_id UUID;
  test_universe_id UUID;
  test_book_id UUID;
  cover_1_id UUID;
  cover_2_id UUID;
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

  -- Create test cover 1: Front cover, draft status
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
    'cover',
    'Classic Adventure Front Cover',
    'Traditional front cover with title and desert imagery',
    jsonb_build_object(
      'coverType', 'front',
      'template', 'classic',
      'title', 'The Lost Treasure',
      'subtitle', 'An Adventure Story',
      'authorName', 'Test Author',
      'prompt', 'Classic children''s book cover with desert theme, golden sand, treasure chest',
      'status', 'draft',
      'variants', '[]'::jsonb
    ),
    'https://placehold.co/600x900/e76f51/ffffff?text=The+Lost+Treasure',
    '["https://placehold.co/600x900/e76f51/ffffff?text=The+Lost+Treasure"]'::jsonb,
    jsonb_build_object(
      'generatedAt', ts_now,
      'dimensions', jsonb_build_object('width', 600, 'height', 900),
      'format', 'png'
    ),
    ARRAY['cover', 'front', 'classic', 'test']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO cover_1_id;

  -- Create test cover 2: Full cover, approved status, linked to book
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
    'cover',
    'Modern Full Cover Design',
    'Contemporary full cover with front, back, and spine',
    jsonb_build_object(
      'coverType', 'full',
      'template', 'modern',
      'title', 'Journey Through Time',
      'subtitle', 'Book 1 of the Chronicles Series',
      'authorName', 'Sarah Ahmed',
      'prompt', 'Modern minimalist cover design, clean typography, adventure theme',
      'status', 'approved',
      'variants', '[
        {
          "id": "var1",
          "imageUrl": "https://placehold.co/1800x900/2a9d8f/ffffff?text=Full+Cover+v1",
          "selected": true,
          "seed": 123,
          "parts": {
            "front": "https://placehold.co/600x900/2a9d8f/ffffff?text=Front",
            "back": "https://placehold.co/600x900/264653/ffffff?text=Back",
            "spine": "https://placehold.co/200x900/e76f51/ffffff?text=Spine"
          }
        },
        {
          "id": "var2",
          "imageUrl": "https://placehold.co/1800x900/f4a261/ffffff?text=Full+Cover+v2",
          "selected": false,
          "seed": 124
        }
      ]'::jsonb
    ),
    'https://placehold.co/1800x900/2a9d8f/ffffff?text=Full+Cover',
    '["https://placehold.co/1800x900/2a9d8f/ffffff?text=Full+Cover+v1","https://placehold.co/1800x900/f4a261/ffffff?text=Full+Cover+v2"]'::jsonb,
    jsonb_build_object(
      'generatedAt', ts_now,
      'approvedAt', ts_now,
      'dimensions', jsonb_build_object('width', 1800, 'height', 900),
      'format', 'png'
    ),
    ARRAY['cover', 'full', 'modern', 'test']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO cover_2_id;

  -- Create test cover 3: Back cover, pending status
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
    'cover',
    'Ornate Back Cover',
    'Decorative back cover with synopsis area',
    jsonb_build_object(
      'coverType', 'back',
      'template', 'ornate',
      'title', 'The Sacred Journey',
      'authorName', 'Muhammad Ali',
      'prompt', 'Ornate Islamic-inspired back cover design with decorative borders, space for synopsis',
      'status', 'pending',
      'variants', '[]'::jsonb
    ),
    NULL,
    '[]'::jsonb,
    jsonb_build_object(
      'requestedAt', ts_now,
      'dimensions', jsonb_build_object('width', 600, 'height', 900),
      'format', 'png'
    ),
    ARRAY['cover', 'back', 'ornate', 'test']
  )
  ON CONFLICT DO NOTHING;

  -- Create test cover 4: Minimalist front cover, draft status
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
    'cover',
    'Minimalist Series Cover',
    'Clean, simple design for series consistency',
    jsonb_build_object(
      'coverType', 'front',
      'template', 'minimalist',
      'title', 'Stories of Faith',
      'subtitle', 'Volume 3',
      'authorName', 'Fatima Hassan',
      'prompt', 'Minimalist cover with simple geometric shapes, muted colors, elegant typography',
      'status', 'draft',
      'variants', '[
        {
          "id": "var1",
          "imageUrl": "https://placehold.co/600x900/e9c46a/ffffff?text=Minimalist+v1",
          "selected": true,
          "seed": 200
        }
      ]'::jsonb
    ),
    'https://placehold.co/600x900/e9c46a/ffffff?text=Stories+of+Faith',
    '["https://placehold.co/600x900/e9c46a/ffffff?text=Minimalist+v1"]'::jsonb,
    jsonb_build_object(
      'generatedAt', ts_now,
      'dimensions', jsonb_build_object('width', 600, 'height', 900),
      'format', 'png'
    ),
    ARRAY['cover', 'front', 'minimalist', 'test']
  )
  ON CONFLICT DO NOTHING;

  -- Link approved cover to a book (if book exists)
  IF test_book_id IS NOT NULL AND cover_2_id IS NOT NULL THEN
    INSERT INTO book_assets (book_id, asset_id, role, usage_context)
    VALUES (
      test_book_id,
      cover_2_id,
      'cover',
      jsonb_build_object(
        'position', 'full',
        'edition', 'first',
        'format', 'print'
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- Verify created covers
SELECT
  a.id,
  u.name as universe_name,
  a.name as cover_name,
  a.description,
  a.data->>'coverType' as cover_type,
  a.data->>'template' as template,
  a.data->>'status' as status,
  a.usage_count,
  jsonb_array_length(a.file_urls) as variant_count,
  a.created_at
FROM assets a
LEFT JOIN universes u ON u.id = a.universe_id
WHERE a.type = 'cover'
  AND 'test' = ANY(a.tags)
ORDER BY a.created_at DESC;

-- Show usage details for linked cover
SELECT
  a.name as cover_name,
  a.data->>'title' as book_title,
  a.usage_count,
  p.title as used_in_book,
  ba.usage_context->>'position' as position,
  ba.usage_context->>'format' as format
FROM assets a
LEFT JOIN book_assets ba ON ba.asset_id = a.id
LEFT JOIN projects p ON p.id = ba.book_id
WHERE a.type = 'cover'
  AND 'test' = ANY(a.tags)
  AND a.usage_count > 0;
