-- Documents Table Migration
-- Account-level document library for books, series bibles, notes, etc.

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
