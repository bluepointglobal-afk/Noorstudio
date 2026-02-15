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
