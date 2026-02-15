-- Universes Table Migration
-- Story universes containing characters, settings, and shared DNA

CREATE TABLE IF NOT EXISTS universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  series_bible TEXT,
  writing_dna JSONB DEFAULT '{}'::jsonb,
  visual_dna JSONB DEFAULT '{}'::jsonb,
  default_style_id UUID, -- Will add FK constraint after assets table exists
  book_presets JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  book_count INTEGER DEFAULT 0 NOT NULL,
  character_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Add foreign key to assets table (deferred because assets table was created in previous migration)
ALTER TABLE universes
  ADD CONSTRAINT fk_universes_default_style
  FOREIGN KEY (default_style_id)
  REFERENCES assets(id)
  ON DELETE SET NULL;

-- Add foreign key from documents to universes (deferred)
ALTER TABLE documents
  ADD CONSTRAINT fk_documents_universe
  FOREIGN KEY (universe_id)
  REFERENCES universes(id)
  ON DELETE SET NULL;

-- Add foreign key from assets to universes (deferred)
ALTER TABLE assets
  ADD CONSTRAINT fk_assets_universe
  FOREIGN KEY (universe_id)
  REFERENCES universes(id)
  ON DELETE SET NULL;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_universes_account_id ON universes(account_id);
CREATE INDEX IF NOT EXISTS idx_universes_name ON universes(name);
CREATE INDEX IF NOT EXISTS idx_universes_tags ON universes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_universes_book_count ON universes(book_count DESC);
CREATE INDEX IF NOT EXISTS idx_universes_created_at ON universes(created_at DESC);

-- Active universes (not soft-deleted)
CREATE INDEX IF NOT EXISTS idx_universes_active ON universes(account_id) WHERE deleted_at IS NULL;

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS update_universes_updated_at ON universes;
CREATE TRIGGER update_universes_updated_at
  BEFORE UPDATE ON universes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE universes IS 'Story universes containing shared characters, settings, and DNA';
COMMENT ON COLUMN universes.account_id IS 'Owner of the universe';
COMMENT ON COLUMN universes.name IS 'Universe name (e.g., "Adventures of Noor")';
COMMENT ON COLUMN universes.description IS 'Short description of the universe';
COMMENT ON COLUMN universes.series_bible IS 'Long-form series bible with world rules, lore, etc.';
COMMENT ON COLUMN universes.writing_dna IS 'Shared writing style DNA for all books in universe';
COMMENT ON COLUMN universes.visual_dna IS 'Shared visual style DNA for all books in universe';
COMMENT ON COLUMN universes.default_style_id IS 'Default art style asset reference';
COMMENT ON COLUMN universes.book_presets IS 'Default book settings (format, age group, etc.)';
COMMENT ON COLUMN universes.metadata IS 'Additional metadata';
COMMENT ON COLUMN universes.tags IS 'User-defined tags for organization';
COMMENT ON COLUMN universes.book_count IS 'Number of books in this universe';
COMMENT ON COLUMN universes.character_count IS 'Number of characters in this universe';
COMMENT ON COLUMN universes.deleted_at IS 'Soft delete timestamp (NULL = active)';
