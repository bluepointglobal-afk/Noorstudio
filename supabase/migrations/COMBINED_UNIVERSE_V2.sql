-- ============================================
-- Helper Function: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Documents Table Migration
-- Account-level document library for books, series bibles, notes, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  universe_id UUID, -- NULL allowed for account-level documents
  type TEXT NOT NULL CHECK (type IN ('book', 'series_bible', 'note', 'outline', 'other')),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1 NOT NULL,
  parent_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ -- Soft delete support
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_documents_account_id ON documents(account_id);
CREATE INDEX IF NOT EXISTS idx_documents_universe_id ON documents(universe_id) WHERE universe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id) WHERE parent_id IS NOT NULL;

-- Active documents (not soft-deleted)
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(account_id, type) WHERE deleted_at IS NULL;

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE documents IS 'Account-level document library with universe association';
COMMENT ON COLUMN documents.account_id IS 'Owner of the document';
COMMENT ON COLUMN documents.universe_id IS 'Optional universe association';
COMMENT ON COLUMN documents.type IS 'Document type: book, series_bible, note, outline, other';
COMMENT ON COLUMN documents.content IS 'Document content as JSONB (structure varies by type)';
COMMENT ON COLUMN documents.metadata IS 'Additional metadata like word count, status, etc.';
COMMENT ON COLUMN documents.tags IS 'User-defined tags for organization';
COMMENT ON COLUMN documents.version IS 'Version number for tracking changes';
COMMENT ON COLUMN documents.parent_id IS 'Parent document for version history or templates';
COMMENT ON COLUMN documents.deleted_at IS 'Soft delete timestamp (NULL = active)';
-- Assets Table Migration
-- Reusable assets (characters, illustrations, covers) shared across books

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  universe_id UUID, -- NULL allowed for account-level assets
  type TEXT NOT NULL CHECK (type IN ('character', 'illustration', 'cover', 'background', 'prop', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  file_urls JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assets_account_id ON assets(account_id);
CREATE INDEX IF NOT EXISTS idx_assets_universe_id ON assets(universe_id) WHERE universe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_usage_count ON assets(usage_count DESC);

-- Active assets (not soft-deleted)
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(account_id, type) WHERE deleted_at IS NULL;

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE assets IS 'Reusable assets library shared across books and universes';
COMMENT ON COLUMN assets.account_id IS 'Owner of the asset';
COMMENT ON COLUMN assets.universe_id IS 'Optional universe association for universe-specific assets';
COMMENT ON COLUMN assets.type IS 'Asset type: character, illustration, cover, background, prop, other';
COMMENT ON COLUMN assets.name IS 'Asset name for easy identification';
COMMENT ON COLUMN assets.description IS 'Optional description of the asset';
COMMENT ON COLUMN assets.data IS 'Asset-specific data as JSONB (poses, visual DNA, etc.)';
COMMENT ON COLUMN assets.thumbnail_url IS 'Preview image URL';
COMMENT ON COLUMN assets.file_urls IS 'Array of file URLs (pose sheets, variations, etc.)';
COMMENT ON COLUMN assets.metadata IS 'Additional metadata like dimensions, format, generation params';
COMMENT ON COLUMN assets.tags IS 'User-defined tags for organization';
COMMENT ON COLUMN assets.usage_count IS 'Number of times this asset has been used in books';
COMMENT ON COLUMN assets.deleted_at IS 'Soft delete timestamp (NULL = active)';
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
-- Relational Links Table Migration
-- Many-to-many relationships between books and assets

CREATE TABLE IF NOT EXISTS book_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL, -- Will add FK constraint after books refactor
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('character', 'illustration', 'cover', 'background', 'other')),
  usage_context JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Ensure unique asset per book per role context
  CONSTRAINT unique_book_asset_role UNIQUE (book_id, asset_id, role)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_book_assets_book_id ON book_assets(book_id);
CREATE INDEX IF NOT EXISTS idx_book_assets_asset_id ON book_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_book_assets_role ON book_assets(role);
CREATE INDEX IF NOT EXISTS idx_book_assets_order ON book_assets(book_id, order_index);

-- Function to increment asset usage count on link creation
CREATE OR REPLACE FUNCTION increment_asset_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assets
  SET usage_count = usage_count + 1
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement asset usage count on link deletion
CREATE OR REPLACE FUNCTION decrement_asset_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assets
  SET usage_count = GREATEST(0, usage_count - 1)
  WHERE id = OLD.asset_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain usage_count
DROP TRIGGER IF EXISTS trigger_increment_asset_usage ON book_assets;
CREATE TRIGGER trigger_increment_asset_usage
  AFTER INSERT ON book_assets
  FOR EACH ROW
  EXECUTE FUNCTION increment_asset_usage();

DROP TRIGGER IF EXISTS trigger_decrement_asset_usage ON book_assets;
CREATE TRIGGER trigger_decrement_asset_usage
  AFTER DELETE ON book_assets
  FOR EACH ROW
  EXECUTE FUNCTION decrement_asset_usage();

-- Comments
COMMENT ON TABLE book_assets IS 'Many-to-many links between books and reusable assets';
COMMENT ON COLUMN book_assets.book_id IS 'Reference to the book using this asset';
COMMENT ON COLUMN book_assets.asset_id IS 'Reference to the asset being used';
COMMENT ON COLUMN book_assets.role IS 'How this asset is used: character, illustration, cover, etc.';
COMMENT ON COLUMN book_assets.usage_context IS 'Context-specific data (which scenes, pages, etc.)';
COMMENT ON COLUMN book_assets.order_index IS 'Display order for assets in the same role';
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
