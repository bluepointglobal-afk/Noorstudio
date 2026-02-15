-- Outline Versions Table Migration
-- Version history for book outlines with section locking support

CREATE TABLE IF NOT EXISTS outline_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  locked_sections JSONB DEFAULT '[]'::jsonb,
  change_summary TEXT,
  is_current BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Ensure unique version numbers per book
  CONSTRAINT unique_book_version UNIQUE (book_id, version_number)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_outline_versions_book_id ON outline_versions(book_id);
CREATE INDEX IF NOT EXISTS idx_outline_versions_current ON outline_versions(book_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_outline_versions_version ON outline_versions(book_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_outline_versions_created_at ON outline_versions(created_at DESC);

-- Function to ensure only one current version per book
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    -- Set all other versions for this book to not current
    UPDATE outline_versions
    SET is_current = false
    WHERE book_id = NEW.book_id
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single current version
DROP TRIGGER IF EXISTS trigger_ensure_single_current_version ON outline_versions;
CREATE TRIGGER trigger_ensure_single_current_version
  BEFORE INSERT OR UPDATE OF is_current ON outline_versions
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION ensure_single_current_version();

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION set_next_version_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number IS NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM outline_versions
    WHERE book_id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set version number if not provided
DROP TRIGGER IF EXISTS trigger_set_next_version_number ON outline_versions;
CREATE TRIGGER trigger_set_next_version_number
  BEFORE INSERT ON outline_versions
  FOR EACH ROW
  WHEN (NEW.version_number IS NULL)
  EXECUTE FUNCTION set_next_version_number();

-- View for easy access to current outline versions
CREATE OR REPLACE VIEW current_outlines AS
SELECT
  ov.id,
  ov.book_id,
  ov.version_number,
  ov.data,
  ov.locked_sections,
  ov.change_summary,
  ov.created_by,
  ov.created_at,
  p.title as book_title,
  p.user_id as book_owner
FROM outline_versions ov
JOIN projects p ON p.id = ov.book_id
WHERE ov.is_current = true;

-- Comments
COMMENT ON TABLE outline_versions IS 'Version history for book outlines with section locking';
COMMENT ON COLUMN outline_versions.book_id IS 'Reference to the book this outline belongs to';
COMMENT ON COLUMN outline_versions.version_number IS 'Sequential version number (1, 2, 3...)';
COMMENT ON COLUMN outline_versions.data IS 'Full outline data as JSONB';
COMMENT ON COLUMN outline_versions.locked_sections IS 'Array of section IDs that are locked from regeneration';
COMMENT ON COLUMN outline_versions.change_summary IS 'Optional summary of what changed in this version';
COMMENT ON COLUMN outline_versions.is_current IS 'Whether this is the active version for the book';
COMMENT ON COLUMN outline_versions.created_by IS 'User who created this version';

COMMENT ON VIEW current_outlines IS 'Easy access to current outline version for each book';
