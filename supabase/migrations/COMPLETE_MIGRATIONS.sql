-- ============================================
-- NoorStudio Complete Database Schema
-- All migrations combined (001-015)
-- ============================================

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
-- Migration 001: Shared Projects Table
-- Security: RLS enabled, public read-only with token, server-only writes
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
-- Create profiles table to hold user data and credits
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  character_credits INTEGER DEFAULT 30,
  book_credits INTEGER DEFAULT 50,
  plan TEXT DEFAULT 'author',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are readable by the owner
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Profiles are only updatable by service role or system functions (for credits)
-- But we allow users to update their own basic info if needed
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic credit deduction RPC
CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_id UUID,
  credit_type TEXT,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF credit_type = 'character_credits' THEN
    UPDATE public.profiles
    SET character_credits = character_credits - amount
    WHERE id = user_id AND character_credits >= amount;
  ELSIF credit_type = 'book_credits' THEN
    UPDATE public.profiles
    SET book_credits = book_credits - amount
    WHERE id = user_id AND book_credits >= amount;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- AI Usage Telemetry Table
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'claude', 'nanobanana', 'mock'
  stage TEXT NOT NULL,    -- 'outline', 'chapters', 'illustrations', etc.
  request_type TEXT NOT NULL, -- 'text', 'image'
  tokens_in INTEGER,
  tokens_out INTEGER,
  credits_charged INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  metadata JSONB,         -- Stores prompt hints, model used, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Usage data is readable by the owner
CREATE POLICY "Users can view own AI usage" 
  ON public.ai_usage FOR SELECT 
  USING (auth.uid() = user_id);

-- Only service role can insert (handled by server)
-- Note: In a real app, you might want more complex policies, 
-- but for hardening we trust the server-side service role.
-- Projects Table Migration
-- Stores book projects with full data in JSONB

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_projects_title ON projects(title);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE projects IS 'Book projects with pipeline state and artifacts';
COMMENT ON COLUMN projects.data IS 'Full StoredProject object as JSONB';
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
-- Credit Ledger Table
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'character', 'book'
  amount INTEGER NOT NULL, -- Negative for consumption, positive for addition
  reason TEXT NOT NULL,
  entity_type TEXT, -- 'project', 'character', 'system'
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Users can view own ledger
CREATE POLICY "Users can view own ledger" 
  ON public.credit_ledger FOR SELECT 
  USING (auth.uid() = user_id);

-- Update deductCredits RPC to also add ledger entry
CREATE OR REPLACE FUNCTION public.deduct_credits_v2(
  p_user_id UUID,
  p_credit_type TEXT,
  p_amount INTEGER,
  p_reason TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Deduct from profile
  IF p_credit_type = 'character_credits' THEN
    UPDATE public.profiles
    SET character_credits = character_credits - p_amount
    WHERE id = p_user_id AND character_credits >= p_amount;
  ELSIF p_credit_type = 'book_credits' THEN
    UPDATE public.profiles
    SET book_credits = book_credits - p_amount
    WHERE id = p_user_id AND book_credits >= p_amount;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Add ledger entry
  INSERT INTO public.credit_ledger (
    user_id, type, amount, reason, entity_type, entity_id, metadata
  ) VALUES (
    p_user_id, 
    REPLACE(p_credit_type, '_credits', ''), 
    -p_amount, 
    p_reason, 
    p_entity_type, 
    p_entity_id, 
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Knowledge Base Tables Migration
-- Stores knowledge bases and their items

-- Knowledge Bases (containers)
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Knowledge Base Items (content)
CREATE TABLE IF NOT EXISTS knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kb_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  body TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user_id ON knowledge_bases(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_user_id ON knowledge_base_items(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_kb_id ON knowledge_base_items(kb_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_category ON knowledge_base_items(category);

-- Updated timestamp triggers
DROP TRIGGER IF EXISTS update_knowledge_bases_updated_at ON knowledge_bases;
CREATE TRIGGER update_knowledge_bases_updated_at
  BEFORE UPDATE ON knowledge_bases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_items_updated_at ON knowledge_base_items;
CREATE TRIGGER update_knowledge_base_items_updated_at
  BEFORE UPDATE ON knowledge_base_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE knowledge_bases IS 'Knowledge base containers for organizing content';
COMMENT ON TABLE knowledge_base_items IS 'Individual knowledge base entries with categories';
-- Row-Level Security Policies
-- Users can only access their own data

-- ============================================
-- Projects Table RLS
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert projects for themselves
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own projects
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own projects
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Characters Table RLS
-- ============================================

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own characters
DROP POLICY IF EXISTS "Users can view own characters" ON characters;
CREATE POLICY "Users can view own characters" ON characters
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert characters for themselves
DROP POLICY IF EXISTS "Users can insert own characters" ON characters;
CREATE POLICY "Users can insert own characters" ON characters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own characters
DROP POLICY IF EXISTS "Users can update own characters" ON characters;
CREATE POLICY "Users can update own characters" ON characters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own characters
DROP POLICY IF EXISTS "Users can delete own characters" ON characters;
CREATE POLICY "Users can delete own characters" ON characters
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Knowledge Bases Table RLS
-- ============================================

ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own knowledge bases
DROP POLICY IF EXISTS "Users can view own knowledge_bases" ON knowledge_bases;
CREATE POLICY "Users can view own knowledge_bases" ON knowledge_bases
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert knowledge bases for themselves
DROP POLICY IF EXISTS "Users can insert own knowledge_bases" ON knowledge_bases;
CREATE POLICY "Users can insert own knowledge_bases" ON knowledge_bases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own knowledge bases
DROP POLICY IF EXISTS "Users can update own knowledge_bases" ON knowledge_bases;
CREATE POLICY "Users can update own knowledge_bases" ON knowledge_bases
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own knowledge bases
DROP POLICY IF EXISTS "Users can delete own knowledge_bases" ON knowledge_bases;
CREATE POLICY "Users can delete own knowledge_bases" ON knowledge_bases
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Knowledge Base Items Table RLS
-- ============================================

ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own KB items
DROP POLICY IF EXISTS "Users can view own kb_items" ON knowledge_base_items;
CREATE POLICY "Users can view own kb_items" ON knowledge_base_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert KB items for themselves
DROP POLICY IF EXISTS "Users can insert own kb_items" ON knowledge_base_items;
CREATE POLICY "Users can insert own kb_items" ON knowledge_base_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own KB items
DROP POLICY IF EXISTS "Users can update own kb_items" ON knowledge_base_items;
CREATE POLICY "Users can update own kb_items" ON knowledge_base_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own KB items
DROP POLICY IF EXISTS "Users can delete own kb_items" ON knowledge_base_items;
CREATE POLICY "Users can delete own kb_items" ON knowledge_base_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Comments
-- ============================================

COMMENT ON POLICY "Users can view own projects" ON projects IS 'RLS: Users can only SELECT their own projects';
COMMENT ON POLICY "Users can view own characters" ON characters IS 'RLS: Users can only SELECT their own characters';
COMMENT ON POLICY "Users can view own knowledge_bases" ON knowledge_bases IS 'RLS: Users can only SELECT their own KBs';
COMMENT ON POLICY "Users can view own kb_items" ON knowledge_base_items IS 'RLS: Users can only SELECT their own KB items';
-- Analytics Events Table
-- Stores all analytics events from client tracking

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT,
  project_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON analytics_events(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- Composite index for user + time queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);

-- Composite index for event type + time queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own events
CREATE POLICY "Users can view own events"
  ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all events (for dashboard)
-- Note: Requires an is_admin column or function in your auth setup
-- For now, we'll create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in metadata
  -- This can be customized based on your auth setup
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN,
      FALSE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all events"
  ON analytics_events
  FOR SELECT
  USING (is_admin());

-- Create a view for daily aggregations (useful for dashboards)
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, event_count DESC;

-- Grant permissions
GRANT SELECT ON analytics_daily_summary TO authenticated;

-- Add comment
COMMENT ON TABLE analytics_events IS 'Stores client-side analytics events for tracking user behavior and system usage';
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
