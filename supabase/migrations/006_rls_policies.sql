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
