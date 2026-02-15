-- Books/Projects Table Refactor Migration
-- Add universe_id and new fields to existing projects table

-- Add new columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS universe_id UUID REFERENCES universes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'complete', 'archived')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add foreign key from book_assets to projects (deferred from previous migration)
ALTER TABLE book_assets
  ADD CONSTRAINT fk_book_assets_book
  FOREIGN KEY (book_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_universe_id ON projects(universe_id) WHERE universe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_document_id ON projects(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, status) WHERE deleted_at IS NULL;

-- Function to increment universe book count
CREATE OR REPLACE FUNCTION increment_universe_book_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.universe_id IS NOT NULL THEN
    UPDATE universes
    SET book_count = book_count + 1
    WHERE id = NEW.universe_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement universe book count
CREATE OR REPLACE FUNCTION decrement_universe_book_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.universe_id IS NOT NULL THEN
    UPDATE universes
    SET book_count = GREATEST(0, book_count - 1)
    WHERE id = OLD.universe_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to handle universe changes
CREATE OR REPLACE FUNCTION update_universe_book_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement old universe
  IF OLD.universe_id IS NOT NULL AND OLD.universe_id != COALESCE(NEW.universe_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    UPDATE universes
    SET book_count = GREATEST(0, book_count - 1)
    WHERE id = OLD.universe_id;
  END IF;

  -- Increment new universe
  IF NEW.universe_id IS NOT NULL AND NEW.universe_id != COALESCE(OLD.universe_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    UPDATE universes
    SET book_count = book_count + 1
    WHERE id = NEW.universe_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain universe book_count
DROP TRIGGER IF EXISTS trigger_increment_universe_book_count ON projects;
CREATE TRIGGER trigger_increment_universe_book_count
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION increment_universe_book_count();

DROP TRIGGER IF EXISTS trigger_decrement_universe_book_count ON projects;
CREATE TRIGGER trigger_decrement_universe_book_count
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION decrement_universe_book_count();

DROP TRIGGER IF EXISTS trigger_update_universe_book_count ON projects;
CREATE TRIGGER trigger_update_universe_book_count
  AFTER UPDATE OF universe_id ON projects
  FOR EACH ROW
  WHEN (OLD.universe_id IS DISTINCT FROM NEW.universe_id)
  EXECUTE FUNCTION update_universe_book_count();

-- Comments
COMMENT ON COLUMN projects.universe_id IS 'Parent universe for this book (REQUIRED for new books)';
COMMENT ON COLUMN projects.document_id IS 'Link to document library entry';
COMMENT ON COLUMN projects.status IS 'Book status: draft, generating, complete, archived';
COMMENT ON COLUMN projects.metadata IS 'Additional book metadata';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp (NULL = active)';
