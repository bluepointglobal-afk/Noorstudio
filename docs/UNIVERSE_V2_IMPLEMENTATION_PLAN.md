# Universe V2 Refactor - Implementation Plan

**Branch:** `universe-v2-refactor`
**Approach:** Component-by-component with testing gates
**Status:** 📋 PLANNING PHASE

---

## PHASE STRUCTURE

Each phase:
- ✅ Has clear acceptance criteria
- ✅ Includes rollback strategy
- ✅ Tested before proceeding
- ✅ Maintains backward compatibility until cutover

---

# PHASE 1: FOUNDATION - Database Schema & Models

**Duration:** 2-3 days
**Risk:** HIGH (data migration)
**Dependencies:** None

## 1.1 Create New Tables

### Priority Order:
1. `documents` - Account-level document library
2. `assets` - Reusable asset system
3. `characters` - Already exists, verify schema
4. `universes` - Core new entity
5. `universe_characters` - Relational link
6. `universe_documents` - Relational link
7. `books` - Refactored book schema
8. `book_documents` - Relational link
9. `outline_versions` - Versioning system
10. `asset_links` - Polymorphic asset relationships

### SQL Migrations

**File:** `server/migrations/001_create_documents.sql`
```sql
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  embedding_vector vector(1536),
  tags JSONB DEFAULT '[]'::jsonb,
  constraint_type TEXT CHECK (constraint_type IN ('hard', 'soft')) DEFAULT 'soft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_account ON documents(account_id);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
```

**File:** `server/migrations/002_create_assets.sql`
```sql
CREATE TYPE asset_type AS ENUM (
  'character_render',
  'illustration',
  'background',
  'cover_draft',
  'cover_template',
  'style_preset',
  'typography_template'
);

CREATE TYPE asset_status AS ENUM ('draft', 'approved', 'locked');

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  type asset_type NOT NULL,
  file_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status asset_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assets_account ON assets(account_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_status ON assets(status);
```

**File:** `server/migrations/003_create_universes.sql`
```sql
CREATE TABLE IF NOT EXISTS universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  series_bible TEXT,
  writing_dna JSONB DEFAULT '{}'::jsonb,
  default_style_id UUID REFERENCES assets(id),
  cover_template_id UUID REFERENCES assets(id),
  book_presets JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_universes_account ON universes(account_id);
```

**File:** `server/migrations/004_create_relational_links.sql`
```sql
CREATE TABLE IF NOT EXISTS universe_characters (
  universe_id UUID REFERENCES universes(id) ON DELETE CASCADE,
  character_id UUID NOT NULL,
  PRIMARY KEY (universe_id, character_id)
);

CREATE TABLE IF NOT EXISTS universe_documents (
  universe_id UUID REFERENCES universes(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (universe_id, document_id)
);

CREATE TABLE IF NOT EXISTS asset_links (
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  universe_id UUID REFERENCES universes(id) ON DELETE CASCADE,
  book_id UUID,
  PRIMARY KEY (asset_id, COALESCE(universe_id::text, ''), COALESCE(book_id::text, ''))
);
```

**File:** `server/migrations/005_refactor_books.sql`
```sql
-- Add new columns to existing books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS universe_id UUID REFERENCES universes(id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE books ADD COLUMN IF NOT EXISTS active_style_id UUID REFERENCES assets(id);

-- Create book_documents relational table
CREATE TABLE IF NOT EXISTS book_documents (
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, document_id)
);
```

**File:** `server/migrations/006_create_outline_versions.sql`
```sql
CREATE TABLE IF NOT EXISTS outline_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  locked_sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outline_versions_book ON outline_versions(book_id);
CREATE INDEX idx_outline_versions_created ON outline_versions(created_at DESC);
```

## 1.2 TypeScript Models

**File:** `server/models/document.ts`
```typescript
export interface Document {
  id: string;
  account_id: string;
  title: string;
  file_url: string;
  embedding_vector?: number[];
  tags: string[];
  constraint_type: 'hard' | 'soft';
  created_at: string;
  updated_at: string;
}
```

**File:** `server/models/asset.ts`
```typescript
export type AssetType =
  | 'character_render'
  | 'illustration'
  | 'background'
  | 'cover_draft'
  | 'cover_template'
  | 'style_preset'
  | 'typography_template';

export type AssetStatus = 'draft' | 'approved' | 'locked';

export interface Asset {
  id: string;
  account_id: string;
  type: AssetType;
  file_url: string;
  metadata: Record<string, any>;
  status: AssetStatus;
  version: number;
  created_at: string;
  updated_at: string;
}
```

**File:** `server/models/universe.ts`
```typescript
export interface WritingDNA {
  tone?: string;
  pacing?: string;
  vocabulary_level?: string;
  sentence_structure?: string;
  cultural_context?: string;
  themes?: string[];
}

export interface BookPresets {
  word_target?: number;
  chapter_target?: number;
  illustration_density?: number;
  trim_size?: string;
  reading_level?: string;
}

export interface Universe {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  series_bible?: string;
  writing_dna: WritingDNA;
  default_style_id?: string;
  cover_template_id?: string;
  book_presets: BookPresets;
  created_at: string;
  updated_at: string;
}
```

**File:** `server/models/outline.ts`
```typescript
export interface OutlineBeat {
  id: string;
  text: string;
  locked: boolean;
}

export interface OutlineChapter {
  id: string;
  title: string;
  beats: OutlineBeat[];
  locked: boolean;
  comments?: string[];
}

export interface OutlineData {
  chapters: OutlineChapter[];
}

export interface OutlineVersion {
  id: string;
  book_id: string;
  data: OutlineData;
  locked_sections: string[]; // Array of chapter IDs
  created_at: string;
}
```

## 1.3 Data Migration Scripts

**File:** `server/migrations/migrate_existing_data.ts`
```typescript
/**
 * Migrate existing books to Universe V2 architecture
 *
 * Strategy:
 * 1. Create default "Legacy Universe" for existing books
 * 2. Migrate KB documents to document library
 * 3. Link existing characters to legacy universe
 * 4. Preserve all existing book data
 */

export async function migrateToUniverseV2(db: Database) {
  // Create "Legacy Projects" universe for existing books
  const legacyUniverse = await db.query(`
    INSERT INTO universes (account_id, name, description, series_bible)
    VALUES ($1, 'Legacy Projects', 'Migrated from V1', '')
    RETURNING id
  `, [DEFAULT_ACCOUNT_ID]);

  // Migrate knowledge base documents to document library
  await db.query(`
    INSERT INTO documents (account_id, title, file_url, constraint_type)
    SELECT $1, name, content_url, 'soft'
    FROM knowledge_bases
  `, [DEFAULT_ACCOUNT_ID]);

  // Link all existing books to legacy universe
  await db.query(`
    UPDATE books
    SET universe_id = $1
    WHERE universe_id IS NULL
  `, [legacyUniverse.id]);

  // Link existing characters to legacy universe
  await db.query(`
    INSERT INTO universe_characters (universe_id, character_id)
    SELECT $1, id FROM characters
    ON CONFLICT DO NOTHING
  `, [legacyUniverse.id]);
}
```

## 1.4 Testing Checklist

- [ ] All migrations run successfully
- [ ] Foreign keys enforced correctly
- [ ] Indexes created for performance
- [ ] TypeScript models match DB schema
- [ ] Migration script preserves existing data
- [ ] Rollback script tested
- [ ] No data loss verified

## 1.5 Rollback Strategy

**File:** `server/migrations/rollback_001_to_006.sql`
```sql
-- Rollback in reverse order
DROP TABLE IF EXISTS outline_versions;
DROP TABLE IF EXISTS book_documents;
DROP TABLE IF EXISTS asset_links;
DROP TABLE IF EXISTS universe_documents;
DROP TABLE IF EXISTS universe_characters;
ALTER TABLE books DROP COLUMN IF EXISTS universe_id;
ALTER TABLE books DROP COLUMN IF EXISTS specs;
ALTER TABLE books DROP COLUMN IF EXISTS active_style_id;
DROP TABLE IF EXISTS universes;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS documents;
DROP TYPE IF EXISTS asset_status;
DROP TYPE IF EXISTS asset_type;
```

---

# PHASE 2: BACKEND API - Universe CRUD

**Duration:** 2-3 days
**Risk:** MEDIUM
**Dependencies:** Phase 1 complete

## 2.1 Universe Routes

**File:** `server/routes/universes.ts`

### Endpoints:

```typescript
POST   /api/universes              // Create universe
GET    /api/universes              // List all universes
GET    /api/universes/:id          // Get universe details
PUT    /api/universes/:id          // Update universe
DELETE /api/universes/:id          // Delete universe

POST   /api/universes/:id/characters    // Link character
DELETE /api/universes/:id/characters/:charId  // Unlink character

POST   /api/universes/:id/documents     // Link document
DELETE /api/universes/:id/documents/:docId    // Unlink document

GET    /api/universes/:id/full          // Get universe with all relations
```

### Implementation:

```typescript
import express from 'express';
import { db } from '../db';
import { Universe } from '../models/universe';

const router = express.Router();

// Create universe
router.post('/', async (req, res) => {
  const { name, description, series_bible, writing_dna, book_presets } = req.body;

  const result = await db.query(`
    INSERT INTO universes (account_id, name, description, series_bible, writing_dna, book_presets)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [req.account_id, name, description, series_bible, writing_dna, book_presets]);

  res.json(result.rows[0]);
});

// Get universe with full context
router.get('/:id/full', async (req, res) => {
  const universe = await db.query(`SELECT * FROM universes WHERE id = $1`, [req.params.id]);

  const characters = await db.query(`
    SELECT c.* FROM characters c
    JOIN universe_characters uc ON c.id = uc.character_id
    WHERE uc.universe_id = $1
  `, [req.params.id]);

  const documents = await db.query(`
    SELECT d.* FROM documents d
    JOIN universe_documents ud ON d.id = ud.document_id
    WHERE ud.universe_id = $1
  `, [req.params.id]);

  const assets = await db.query(`
    SELECT a.* FROM assets a
    JOIN asset_links al ON a.id = al.asset_id
    WHERE al.universe_id = $1
  `, [req.params.id]);

  res.json({
    ...universe.rows[0],
    characters: characters.rows,
    documents: documents.rows,
    assets: assets.rows
  });
});

export default router;
```

## 2.2 Document Routes

**File:** `server/routes/documents.ts`

```typescript
POST   /api/documents              // Upload document
GET    /api/documents              // List all documents
GET    /api/documents/:id          // Get document
PUT    /api/documents/:id          // Update metadata
DELETE /api/documents/:id          // Delete document
```

## 2.3 Asset Routes

**File:** `server/routes/assets.ts`

```typescript
POST   /api/assets                 // Create asset
GET    /api/assets                 // List assets (filtered by type)
GET    /api/assets/:id             // Get asset
PUT    /api/assets/:id             // Update asset
DELETE /api/assets/:id             // Delete asset
POST   /api/assets/:id/approve     // Approve asset
POST   /api/assets/:id/lock        // Lock asset
```

## 2.4 Testing Checklist

- [ ] All CRUD operations work
- [ ] Relational links created correctly
- [ ] Foreign key constraints enforced
- [ ] Proper error handling
- [ ] Validation on required fields
- [ ] Query performance acceptable
- [ ] API documented with OpenAPI/Swagger

---

# PHASE 3: FRONTEND MODELS - Universe Data Layer

**Duration:** 1-2 days
**Risk:** LOW
**Dependencies:** Phase 2 complete

## 3.1 Frontend TypeScript Models

**File:** `src/lib/models/universe.ts`

Match backend models exactly.

## 3.2 Universe Store (localStorage wrapper)

**File:** `src/lib/storage/universeStore.ts`

```typescript
import { Universe } from '@/lib/models/universe';

const STORAGE_KEY = 'noorstudio.universes.v2';

export function getUniverses(): Universe[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getUniverse(id: string): Universe | null {
  const universes = getUniverses();
  return universes.find(u => u.id === id) || null;
}

export function saveUniverse(universe: Universe): void {
  const universes = getUniverses();
  const existing = universes.findIndex(u => u.id === universe.id);

  if (existing >= 0) {
    universes[existing] = universe;
  } else {
    universes.push(universe);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(universes));
}

export function deleteUniverse(id: string): void {
  const universes = getUniverses().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(universes));
}
```

## 3.3 Universe API Client

**File:** `src/lib/api/universeApi.ts`

```typescript
import { Universe } from '@/lib/models/universe';

export async function createUniverse(data: Partial<Universe>): Promise<Universe> {
  const response = await fetch('/api/universes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function getUniverseFull(id: string): Promise<Universe> {
  const response = await fetch(`/api/universes/${id}/full`);
  return response.json();
}

export async function linkCharacterToUniverse(universeId: string, characterId: string): Promise<void> {
  await fetch(`/api/universes/${universeId}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character_id: characterId })
  });
}
```

## 3.4 Testing Checklist

- [ ] API calls work correctly
- [ ] localStorage persistence works
- [ ] Type safety enforced
- [ ] Error handling present

---

# PHASE 4: UNIVERSE STUDIO - UI Component

**Duration:** 3-4 days
**Risk:** MEDIUM
**Dependencies:** Phase 3 complete

## 4.1 Universe Studio Page

**File:** `src/pages/app/UniverseStudioPage.tsx`

### Features:
- Create new universe
- Edit series bible (rich text editor)
- Configure writing DNA
- Link characters (multi-select)
- Link documents (multi-select)
- Set default style preset
- Set cover template
- Configure book presets
- Save/update universe

### Layout:

```
┌─────────────────────────────────────┐
│ Universe Studio                     │
├─────────────────────────────────────┤
│                                     │
│ [Name Input]                        │
│ [Description Input]                 │
│                                     │
│ ┌─ Series Bible ──────────────┐    │
│ │ [Rich Text Editor]          │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─ Writing DNA ───────────────┐    │
│ │ Tone: [Select]              │    │
│ │ Pacing: [Select]            │    │
│ │ Vocabulary: [Select]        │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─ Characters ────────────────┐    │
│ │ [✓] Amira                   │    │
│ │ [✓] Yusuf                   │    │
│ │ [ ] Fatima                  │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─ Documents ─────────────────┐    │
│ │ [✓] Quranic Stories         │    │
│ │ [ ] Hadith Collection       │    │
│ └─────────────────────────────┘    │
│                                     │
│ [Save Universe] [Cancel]            │
└─────────────────────────────────────┘
```

## 4.2 Universe Selector Component

**File:** `src/components/universe/UniverseSelector.tsx`

Used in Book Creation to select Universe.

```tsx
<UniverseSelector
  value={selectedUniverseId}
  onChange={(id) => setSelectedUniverseId(id)}
  required
/>
```

## 4.3 Testing Checklist

- [ ] Can create universe
- [ ] Can edit universe
- [ ] Can link/unlink characters
- [ ] Can link/unlink documents
- [ ] Can set default style
- [ ] Changes save correctly
- [ ] UI responsive
- [ ] Validation works

---

# PHASE 5: BOOK CREATION REFACTOR

**Duration:** 2-3 days
**Risk:** HIGH (changes core flow)
**Dependencies:** Phase 4 complete

## 5.1 New Book Creation Flow

**File:** `src/pages/app/BookCreatePage.tsx`

### Steps:

1. **Choose Universe** (MANDATORY)
   - Display all universes
   - Show preview of characters/documents
   - Auto-load defaults when selected

2. **Book Specs**
   - Age band presets (inherit from universe book_presets)
   - Custom adjustments
   - Live calculations (page count, illustration count)

3. **Story Blueprint** (Outline)
   - Generate initial outline
   - Edit chapters/beats
   - Lock sections
   - Version history

4. **Generate Chapters**
   - Context-aware generation (universe + characters + documents)

5. **Illustrate**
   - Use universe default style or override

6. **Design Cover**
   - Use universe cover template

7. **Publish**

## 5.2 Remove Legacy Components

- [x] Remove StoryWorldSelector
- [x] Remove separate KB selector
- [x] Remove pipeline terminology

## 5.3 Universe Context Loading

When universe selected:

```typescript
const handleUniverseSelect = async (universeId: string) => {
  const universe = await getUniverseFull(universeId);

  // Auto-populate book defaults
  setBookSpecs({
    ...universe.book_presets,
    active_style_id: universe.default_style_id,
    cover_template_id: universe.cover_template_id
  });

  // Load linked entities
  setAvailableCharacters(universe.characters);
  setAvailableDocuments(universe.documents);
};
```

## 5.4 Testing Checklist

- [ ] Universe selection required
- [ ] Universe context loads correctly
- [ ] Book creation works end-to-end
- [ ] Characters from universe available
- [ ] Documents from universe available
- [ ] Style preset inherited
- [ ] Cover template inherited

---

# PHASE 6: OUTLINE SYSTEM - Full Implementation

**Duration:** 4-5 days
**Risk:** HIGH (complex state management)
**Dependencies:** Phase 5 complete

## 6.1 Outline Editor Component

**File:** `src/components/outline/OutlineEditor.tsx`

### Features:

- Editable chapter titles (inline)
- Editable beats (inline)
- Add/remove chapters
- Add/remove beats
- Lock/unlock chapters
- Lock/unlock individual beats
- Drag-and-drop reordering
- Inline comments
- Diff viewer (compare versions)

### State Management:

```typescript
interface OutlineState {
  current: OutlineData;
  versions: OutlineVersion[];
  activeVersion: string;
  lockedSections: string[];
  isDirty: boolean;
}

const useOutlineEditor = (bookId: string) => {
  const [state, setState] = useState<OutlineState>(...);

  const saveVersion = async () => {
    const version = await createOutlineVersion(bookId, state.current, state.lockedSections);
    setState(prev => ({
      ...prev,
      versions: [...prev.versions, version],
      isDirty: false
    }));
  };

  const regenerateChapter = async (chapterId: string) => {
    if (state.lockedSections.includes(chapterId)) {
      throw new Error('Cannot regenerate locked chapter');
    }
    // ... regeneration logic
  };

  return { state, saveVersion, regenerateChapter, ... };
};
```

## 6.2 Outline API Routes

**File:** `server/routes/outline.ts`

```typescript
POST   /api/books/:id/outline                    // Create initial outline
GET    /api/books/:id/outline                    // Get current outline
POST   /api/books/:id/outline/version            // Save new version
GET    /api/books/:id/outline/versions           // List versions
GET    /api/books/:id/outline/versions/:versionId  // Get specific version
POST   /api/books/:id/outline/regenerate         // Regenerate with lock respect
POST   /api/books/:id/outline/chapters/:chId/regenerate  // Regenerate single chapter
```

## 6.3 Outline Generation Logic

**File:** `server/lib/outline/generator.ts`

```typescript
export async function generateOutline(
  bookId: string,
  universeContext: Universe,
  lockedSections: string[] = []
): Promise<OutlineData> {

  const book = await getBook(bookId);
  const universe = universeContext;

  // Build AI context
  const context = {
    series_bible: universe.series_bible,
    writing_dna: universe.writing_dna,
    characters: universe.characters,
    documents: universe.documents.filter(d => d.constraint_type === 'hard'),
    book_specs: book.specs
  };

  // Generate outline via AI
  const outline = await aiGenerateOutline(context);

  // Preserve locked sections
  const currentOutline = await getCurrentOutline(bookId);
  if (currentOutline) {
    outline.chapters = outline.chapters.map(chapter => {
      if (lockedSections.includes(chapter.id)) {
        const locked = currentOutline.chapters.find(c => c.id === chapter.id);
        return locked || chapter;
      }
      return chapter;
    });
  }

  return outline;
}
```

## 6.4 Version Diff Viewer

**File:** `src/components/outline/OutlineDiffViewer.tsx`

Side-by-side comparison of two outline versions with highlighting.

## 6.5 Testing Checklist

- [ ] Can create initial outline
- [ ] Can edit chapters inline
- [ ] Can edit beats inline
- [ ] Can lock/unlock sections
- [ ] Locked sections preserved on regeneration
- [ ] Version history persists
- [ ] Diff viewer shows changes
- [ ] Can restore previous version

---

# PHASE 7: ILLUSTRATION STUDIO

**Duration:** 2-3 days
**Risk:** LOW
**Dependencies:** Phase 2 (Assets)

## 7.1 Style Preset Editor

**File:** `src/components/illustration/StylePresetEditor.tsx`

### Controls:

```typescript
interface StylePreset {
  name: string;
  rendering_type: 'watercolor' | 'oil' | 'digital' | 'pencil' | 'ink';
  palette: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  lighting: 'soft' | 'dramatic' | 'natural' | 'warm' | 'cool';
  camera_style: 'close-up' | 'medium' | 'wide' | 'overhead';
  background_density: number; // 0-100
  texture_intensity: number; // 0-100
}
```

### UI:

```
┌─────────────────────────────────────┐
│ Illustration Style                  │
├─────────────────────────────────────┤
│ Preset Name: [Input]                │
│                                     │
│ Rendering Type:                     │
│ ○ Watercolor  ○ Oil  ● Digital      │
│                                     │
│ Palette:                            │
│ Primary: [🎨][🎨][🎨]               │
│ Secondary: [🎨][🎨][🎨]             │
│ Accent: [🎨][🎨]                    │
│                                     │
│ Lighting: [Dropdown]                │
│ Camera Style: [Dropdown]            │
│                                     │
│ Background Density: [Slider] 70%    │
│ Texture Intensity: [Slider] 50%     │
│                                     │
│ [Preview] [Save as Preset]          │
└─────────────────────────────────────┘
```

## 7.2 Universe Style Assignment

In Universe Studio, allow selecting default style preset.

In Book Creation, allow overriding with different style.

## 7.3 Testing Checklist

- [ ] Can create style preset
- [ ] Can save as asset
- [ ] Can assign to universe
- [ ] Can override in book
- [ ] Preview renders correctly

---

# PHASE 8: COVER STUDIO

**Duration:** 2-3 days
**Risk:** LOW
**Dependencies:** Phase 7 complete

## 8.1 Cover Template Builder (Universe-level)

**File:** `src/components/cover/CoverTemplateBuilder.tsx`

### Features:
- Define title typography zone
- Define subtitle zone
- Define character grid zones
- Define spine layout
- Define back cover layout
- Save as cover_template asset

### Canvas UI:

```
┌───────────────────────────┐
│   [TITLE ZONE]            │
│   [SUBTITLE ZONE]         │
│                           │
│   ┌────┐ ┌────┐          │
│   │CH1 │ │CH2 │          │
│   └────┘ └────┘          │
│                           │
│   [AUTHOR ZONE]           │
└───────────────────────────┘
```

## 8.2 Cover Draft Generator (Book-level)

**File:** `src/components/cover/CoverDraftGenerator.tsx`

Uses universe cover template + book-specific data.

### Features:
- Auto-populate from template
- Select character poses
- Edit typography
- Thumbnail preview mode
- Save as cover_draft asset

## 8.3 Testing Checklist

- [ ] Can create cover template
- [ ] Can save template to universe
- [ ] Can generate cover draft from template
- [ ] Can customize book-specific elements
- [ ] Thumbnail preview works

---

# PHASE 9: UI/UX OVERHAUL

**Duration:** 5-7 days
**Risk:** MEDIUM (visual consistency)
**Dependencies:** All features complete

## 9.1 Terminology Updates

### Global Find & Replace:

| Old | New |
|-----|-----|
| Pipeline | Book Journey |
| Run | Generate |
| Error | Needs Review |
| Pending | Draft |
| Failed | Unable to Generate |
| Success | Ready |
| Knowledge Base | Document Library |
| Story World | Universe |

### Files to Update:
- All UI components
- All toast messages
- All error messages
- All status displays

## 9.2 Visual Design Updates

### Theme Updates:

**File:** `src/styles/theme.ts`

```typescript
export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',  // Soft blue
      100: '#e0f2fe',
      500: '#3b82f6',
      600: '#2563eb',
    },
    accent: {
      50: '#fdf4ff',  // Soft purple
      100: '#fae8ff',
      500: '#a855f7',
    },
    success: {
      50: '#f0fdf4',  // Soft green
      100: '#dcfce7',
      500: '#22c55e',
    },
    warning: {
      50: '#fffbeb',  // Soft amber
      100: '#fef3c7',
      500: '#f59e0b',
    }
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadows: {
    soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
  }
};
```

### Component Updates:
- Rounded corners on all cards
- Soft shadows instead of borders
- Pastel accent colors
- Friendly icons (Lucide)
- Progress bars with rounded ends

## 9.3 Advanced Studio Mode Toggle

**File:** `src/components/layout/AppLayout.tsx`

Add settings toggle:

```tsx
const [advancedMode, setAdvancedMode] = useState(false);

// In settings dropdown:
<Switch
  checked={advancedMode}
  onCheckedChange={setAdvancedMode}
  label="Advanced Studio Mode"
/>

// Conditionally render advanced panels:
{advancedMode && (
  <div className="advanced-panel">
    <h3>AI Settings</h3>
    <p>Provider: {provider}</p>
    <p>Model: {model}</p>
    <p>Tokens: {tokenCount}</p>
    <p>Estimated Cost: ${cost}</p>
  </div>
)}
```

## 9.4 Testing Checklist

- [ ] No "pipeline" terminology visible
- [ ] All components rounded
- [ ] Soft color palette applied
- [ ] Advanced mode toggleable
- [ ] Advanced panels hidden by default
- [ ] Progress indicators friendly
- [ ] Error messages parent-friendly

---

# PHASE 10: GENERATION LOGIC INTEGRATION

**Duration:** 3-4 days
**Risk:** HIGH (core functionality)
**Dependencies:** All phases complete

## 10.1 Universe Context Injection

**File:** `server/lib/generation/contextBuilder.ts`

```typescript
export async function buildGenerationContext(bookId: string) {
  const book = await getBook(bookId);
  const universe = await getUniverseFull(book.universe_id);

  // Build comprehensive context
  const context = {
    // Universe-level
    series_bible: universe.series_bible,
    writing_dna: universe.writing_dna,

    // Character context
    characters: universe.characters.map(c => ({
      name: c.name,
      narrative_dna: c.narrative_dna,
      visual_dna: c.visual_dna
    })),

    // Document context
    hard_documents: universe.documents.filter(d => d.constraint_type === 'hard'),
    soft_documents: universe.documents.filter(d => d.constraint_type === 'soft'),

    // Style context
    active_style: book.active_style_id
      ? await getAsset(book.active_style_id)
      : await getAsset(universe.default_style_id),

    // Book specs
    specs: book.specs
  };

  return context;
}
```

## 10.2 AI Prompt Construction

**File:** `server/lib/generation/promptBuilder.ts`

```typescript
export function buildChapterPrompt(context: GenerationContext, chapterOutline: OutlineChapter) {
  return `
You are writing a children's book chapter.

UNIVERSE CONTEXT:
${context.series_bible}

WRITING STYLE:
${JSON.stringify(context.writing_dna, null, 2)}

CHARACTERS:
${context.characters.map(c => `
  ${c.name}: ${c.narrative_dna.description}
  Traits: ${c.narrative_dna.traits.join(', ')}
`).join('\n')}

HARD CONSTRAINTS (MUST follow):
${context.hard_documents.map(d => d.title).join('\n')}

SOFT GUIDELINES (Reference):
${context.soft_documents.map(d => d.title).join('\n')}

CHAPTER OUTLINE:
Title: ${chapterOutline.title}
Beats:
${chapterOutline.beats.map((b, i) => `${i + 1}. ${b.text}`).join('\n')}

BOOK SPECS:
Target reading level: ${context.specs.reading_level}
Target word count per chapter: ${context.specs.word_target / context.specs.chapter_target}

Write the chapter following the outline and constraints above.
`;
}
```

## 10.3 Validation Rules

**File:** `server/lib/validation/universeValidation.ts`

```typescript
export function validateBookCreation(book: Partial<Book>) {
  if (!book.universe_id) {
    throw new Error('Books must be created within a Universe');
  }

  // Additional validations...
}

export function validateGeneration(bookId: string) {
  const book = await getBook(bookId);
  const universe = await getUniverse(book.universe_id);

  if (!universe) {
    throw new Error('Universe not found');
  }

  if (universe.characters.length === 0) {
    throw new Error('Universe must have at least one character');
  }

  // Additional validations...
}
```

## 10.4 Testing Checklist

- [ ] Generation uses universe context
- [ ] Hard documents enforced
- [ ] Soft documents referenced
- [ ] Character DNA injected
- [ ] Writing DNA applied
- [ ] Style preset used
- [ ] Validation rules enforced
- [ ] Cannot generate without universe

---

# PHASE 11: TESTING & VALIDATION

**Duration:** 3-5 days
**Risk:** CRITICAL
**Dependencies:** All phases complete

## 11.1 End-to-End Test Scenarios

### Scenario 1: Create New Universe & Book
1. Create universe "Khaled & Sumaya"
2. Add series bible
3. Link characters (Khaled, Sumaya)
4. Link documents (Islamic stories)
5. Create book in universe
6. Generate outline
7. Lock chapter 1
8. Regenerate outline → verify chapter 1 preserved
9. Generate chapters
10. Verify characters/documents used in generation

### Scenario 2: Migrate Legacy Book
1. Run migration script
2. Verify all books linked to "Legacy Universe"
3. Verify no data loss
4. Verify books still functional

### Scenario 3: Style Preset Workflow
1. Create style preset in Illustration Studio
2. Assign to universe as default
3. Create new book
4. Verify style inherited
5. Override style in book
6. Verify override applied

## 11.2 Performance Testing

- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] No N+1 query issues
- [ ] Large outline (50 chapters) performant

## 11.3 Data Integrity Testing

- [ ] Foreign keys enforced
- [ ] Cascade deletes work correctly
- [ ] No orphaned records
- [ ] Unique constraints respected
- [ ] Transactions handle errors

## 11.4 UI/UX Testing

- [ ] All flows intuitive
- [ ] No confusing terminology
- [ ] Error messages helpful
- [ ] Success feedback clear
- [ ] Loading states present
- [ ] Responsive on mobile

---

# PHASE 12: DEPLOYMENT & CUTOVER

**Duration:** 1-2 days
**Risk:** CRITICAL
**Dependencies:** All testing passed

## 12.1 Pre-Deployment Checklist

- [ ] All migrations tested on staging
- [ ] Rollback script prepared
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] Railway build successful
- [ ] No breaking changes to API

## 12.2 Deployment Steps

1. Create database backup
2. Deploy migrations
3. Run data migration script
4. Deploy backend (Railway)
5. Deploy frontend (Railway)
6. Verify health checks
7. Test critical paths
8. Monitor error logs

## 12.3 Rollback Plan

If critical issues detected:

```bash
# Rollback database
psql $DATABASE_URL < rollback_001_to_006.sql

# Revert Railway deployment
railway rollback --deployment <previous_id>
```

## 12.4 Post-Deployment Monitoring

- [ ] Monitor error rates (< 0.1%)
- [ ] Monitor API latency (< 500ms p95)
- [ ] Monitor database CPU (< 70%)
- [ ] Check user feedback
- [ ] Verify core flows working

---

# ACCEPTANCE CRITERIA (FINAL)

## Must Have (P0):
- [x] Universe is mandatory for book creation
- [x] Characters exist only once (canonical)
- [x] Documents at account level
- [x] Outline supports versioning + locking
- [x] Style presets reusable
- [x] Cover templates reusable
- [x] UI uses parent-friendly terminology
- [x] Advanced AI settings hidden by default
- [x] Generation uses universe context
- [x] Migration script preserves existing data

## Should Have (P1):
- [ ] Outline diff viewer
- [ ] Drag-and-drop reordering
- [ ] Inline comments on outline
- [ ] Cover thumbnail preview mode
- [ ] Style preset preview

## Nice to Have (P2):
- [ ] Outline collaboration (future)
- [ ] Version comparison analytics
- [ ] Style preset marketplace
- [ ] Cover template gallery

---

# TIMELINE ESTIMATE

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Database & Models | 2-3 days | 3 days |
| 2. Backend API | 2-3 days | 6 days |
| 3. Frontend Models | 1-2 days | 8 days |
| 4. Universe Studio | 3-4 days | 12 days |
| 5. Book Creation Refactor | 2-3 days | 15 days |
| 6. Outline System | 4-5 days | 20 days |
| 7. Illustration Studio | 2-3 days | 23 days |
| 8. Cover Studio | 2-3 days | 26 days |
| 9. UI/UX Overhaul | 5-7 days | 33 days |
| 10. Generation Logic | 3-4 days | 37 days |
| 11. Testing | 3-5 days | 42 days |
| 12. Deployment | 1-2 days | 44 days |

**Total: ~6-8 weeks (44 working days)**

---

# RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full backup + tested rollback script |
| Breaking existing books | Maintain backward compatibility |
| Performance degradation | Index optimization + query monitoring |
| UI confusion | User testing + clear onboarding |
| Generation quality drop | Comprehensive context injection |

---

# SUCCESS METRICS

- **Technical:**
  - 0% data loss
  - < 0.1% error rate
  - < 500ms API response time
  - 100% test coverage on critical paths

- **User Experience:**
  - Positive user feedback
  - Reduced support tickets
  - Faster book creation time
  - Improved content quality

---

**Plan Status:** 📋 READY FOR EXECUTION
**Next Step:** Begin Phase 1 - Database Schema & Models

