-- Phase 6 Test Setup
-- Creates test outline versions for testing version history UI

DO $$
DECLARE
  test_account_id UUID;
  test_book_id UUID;
BEGIN
  -- Get the first account_id from supabase.auth.users
  SELECT id INTO test_account_id FROM auth.users LIMIT 1;

  -- If no users exist, use a dummy UUID
  IF test_account_id IS NULL THEN
    test_account_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- Create a test book if it doesn't exist
  INSERT INTO projects (
    user_id,
    title,
    data,
    status
  ) VALUES (
    test_account_id,
    'Test Book for Outline Versions',
    '{
      "synopsis": "A test book to demonstrate outline version control functionality",
      "ageRange": "8-12",
      "templateType": "adventure",
      "knowledgeBaseName": "Test Guidelines"
    }'::jsonb,
    'draft'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_book_id;

  -- If book already exists, get its ID
  IF test_book_id IS NULL THEN
    SELECT id INTO test_book_id
    FROM projects
    WHERE title = 'Test Book for Outline Versions'
    LIMIT 1;
  END IF;

  -- Create initial outline version (version 1, not current)
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    change_summary,
    is_current,
    created_by
  ) VALUES (
    test_book_id,
    1,
    '{
      "chapters": [
        "Chapter 1: The Lost Treasure",
        "Chapter 2: The Hidden Map",
        "Chapter 3: The Desert Journey",
        "Chapter 4: The Ancient Temple",
        "Chapter 5: The Final Discovery"
      ],
      "synopsis": "A young adventurer discovers a mysterious map leading to ancient treasure",
      "kbApplied": "Test Guidelines"
    }'::jsonb,
    'Initial outline with 5 chapters',
    false,
    test_account_id
  )
  ON CONFLICT (book_id, version_number) DO NOTHING;

  -- Create revised version (version 2, with locked sections)
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    locked_sections,
    change_summary,
    is_current,
    created_by
  ) VALUES (
    test_book_id,
    2,
    '{
      "chapters": [
        "Chapter 1: The Lost Treasure",
        "Chapter 2: The Mysterious Map",
        "Chapter 3: Journey Through the Desert",
        "Chapter 4: The Ancient Temple",
        "Chapter 5: The Grand Discovery"
      ],
      "synopsis": "A young adventurer discovers a mysterious map leading to ancient treasure",
      "kbApplied": "Test Guidelines"
    }'::jsonb,
    '["0", "3"]'::jsonb,
    'Revised chapter 2, 3, and 5 titles. Locked chapters 1 and 4.',
    false,
    test_account_id
  )
  ON CONFLICT (book_id, version_number) DO NOTHING;

  -- Create current version (version 3, current)
  INSERT INTO outline_versions (
    book_id,
    version_number,
    data,
    locked_sections,
    change_summary,
    is_current,
    created_by
  ) VALUES (
    test_book_id,
    3,
    '{
      "chapters": [
        "Chapter 1: The Lost Treasure",
        "Chapter 2: The Mysterious Map",
        "Chapter 3: Journey Through the Desert",
        "Chapter 4: The Ancient Temple",
        "Chapter 5: The Grand Discovery",
        "Chapter 6: The Return Home"
      ],
      "synopsis": "A young adventurer discovers a mysterious map leading to ancient treasure and learns valuable lessons on the journey",
      "kbApplied": "Test Guidelines"
    }'::jsonb,
    '["0", "3"]'::jsonb,
    'Added Chapter 6: The Return Home. Enhanced synopsis.',
    true,
    test_account_id
  )
  ON CONFLICT (book_id, version_number) DO NOTHING;

  -- Update project data with current outline information
  UPDATE projects
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{currentOutlineVersion}',
    '3'::jsonb
  )
  WHERE id = test_book_id;

END $$;

-- Verify created outline versions
SELECT
  ov.id,
  p.title as book_title,
  ov.version_number,
  ov.is_current,
  ov.change_summary,
  jsonb_array_length(ov.data->'chapters') as chapter_count,
  jsonb_array_length(COALESCE(ov.locked_sections, '[]'::jsonb)) as locked_count,
  ov.created_at
FROM outline_versions ov
JOIN projects p ON p.id = ov.book_id
WHERE p.title = 'Test Book for Outline Versions'
ORDER BY ov.version_number DESC;

-- Show the current version details
SELECT
  ov.version_number,
  ov.data->'chapters' as chapters,
  ov.locked_sections,
  ov.is_current
FROM outline_versions ov
JOIN projects p ON p.id = ov.book_id
WHERE p.title = 'Test Book for Outline Versions'
  AND ov.is_current = true;
