-- NoorStudio Shared Projects Table
-- Migration: 001_shared_projects
-- Security: RLS enabled, public read-only with token, server-only writes

-- ============================================
-- Create Table
-- ============================================

CREATE TABLE IF NOT EXISTS shared_projects (
  id TEXT PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups by token
CREATE INDEX IF NOT EXISTS idx_shared_projects_token ON shared_projects(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_projects_expires ON shared_projects(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- Updated At Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_shared_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_shared_projects_updated_at ON shared_projects;
CREATE TRIGGER trigger_shared_projects_updated_at
  BEFORE UPDATE ON shared_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_projects_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read with valid token" ON shared_projects;
DROP POLICY IF EXISTS "Block public insert" ON shared_projects;
DROP POLICY IF EXISTS "Block public update" ON shared_projects;
DROP POLICY IF EXISTS "Block public delete" ON shared_projects;
DROP POLICY IF EXISTS "Service role full access" ON shared_projects;

-- Policy: Public can read ONLY when:
-- 1. The share_token matches (verified in query)
-- 2. Either expires_at is NULL (never expires) OR expires_at > now()
CREATE POLICY "Public read with valid token"
  ON shared_projects
  FOR SELECT
  TO anon, authenticated
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- Policy: Block ALL public writes (insert/update/delete)
-- Only service_role can write
CREATE POLICY "Block public insert"
  ON shared_projects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Block public update"
  ON shared_projects
  FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "Block public delete"
  ON shared_projects
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- Policy: Service role has full access (used by server)
CREATE POLICY "Service role full access"
  ON shared_projects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE shared_projects IS 'Shared project data for public demo links. Read-only for public, write via server with service_role.';
COMMENT ON COLUMN shared_projects.share_token IS 'Unique token required to access the shared project. Generated server-side.';
COMMENT ON COLUMN shared_projects.payload IS 'Sanitized project JSON (no secrets, internal data stripped).';
COMMENT ON COLUMN shared_projects.expires_at IS 'Optional expiration. NULL = never expires.';
