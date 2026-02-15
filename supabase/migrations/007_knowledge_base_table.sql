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
