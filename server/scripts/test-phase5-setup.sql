-- Phase 5 Test Setup
-- Creates test universe with book presets for testing Book Builder integration

-- Get the first account_id from supabase.auth.users (assuming test user exists)
DO $$
DECLARE
  test_account_id UUID;
BEGIN
  -- Get first user's ID
  SELECT id INTO test_account_id FROM auth.users LIMIT 1;

  -- If no users exist, use a dummy UUID
  IF test_account_id IS NULL THEN
    test_account_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- Insert test universe with full book presets
  INSERT INTO universes (
    account_id,
    name,
    description,
    series_bible,
    book_presets,
    tags
  ) VALUES (
    test_account_id,
    'Test Adventure World',
    'A magical world for testing book creation with auto-populated presets',
    'This is a test universe created to verify Phase 5 functionality. Characters live in a world of wonder and discovery.',
    '{
      "defaultAgeRange": "8-12",
      "defaultTemplate": "adventure",
      "defaultLayoutStyle": "split-page",
      "defaultTrimSize": "8x10"
    }'::jsonb,
    ARRAY['test', 'adventure', 'phase5']
  )
  ON CONFLICT DO NOTHING;

  -- Insert second test universe without presets
  INSERT INTO universes (
    account_id,
    name,
    description,
    series_bible,
    tags
  ) VALUES (
    test_account_id,
    'Minimal Test World',
    'A universe without book presets to test fallback behavior',
    'Simple test world.',
    ARRAY['test', 'minimal']
  )
  ON CONFLICT DO NOTHING;

  -- Insert third universe with partial presets
  INSERT INTO universes (
    account_id,
    name,
    description,
    book_presets,
    tags
  ) VALUES (
    test_account_id,
    'Partial Presets World',
    'Universe with only some preset values to test selective auto-population',
    '{
      "defaultTemplate": "values",
      "defaultTrimSize": "A4"
    }'::jsonb,
    ARRAY['test', 'partial']
  )
  ON CONFLICT DO NOTHING;

END $$;

-- Verify created universes
SELECT
  id,
  name,
  description,
  book_presets,
  tags,
  created_at
FROM universes
WHERE 'test' = ANY(tags)
ORDER BY created_at DESC;
