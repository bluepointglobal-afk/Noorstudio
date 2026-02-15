-- Characters Table Migration
-- Stores characters with visual DNA, poses, and versions in JSONB

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);

-- Updated timestamp trigger (reuse function from projects)
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE characters IS 'Character studio with visual DNA, poses, and versions';
COMMENT ON COLUMN characters.data IS 'Full StoredCharacter object as JSONB including poses and versions';
