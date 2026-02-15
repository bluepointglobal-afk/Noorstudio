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
