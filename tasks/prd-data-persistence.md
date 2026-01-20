# PRD: Data Persistence (localStorage → Supabase)

**Feature:** #6 Data Persistence
**Priority:** P1 - Important
**Status:** In Progress

## Overview

Migrate NoorStudio from localStorage-only storage to Supabase PostgreSQL for data durability, multi-device access, and scalability. The client stores (projects, characters, knowledge base) will be backed by Supabase tables with Row-Level Security (RLS) policies.

## Current State

- All data stored in browser localStorage
- Data lost when cache is cleared
- No multi-device access
- Three main stores:
  - `projectsStore.ts` - Book projects with pipeline state and artifacts
  - `charactersStore.ts` - Characters with visual DNA, poses, versions
  - `knowledgeBaseStore.ts` - Knowledge base items with categories

## Goals

1. Persist projects, characters, and KB items to Supabase
2. Enable multi-device access with user authentication
3. Implement Row-Level Security for data isolation
4. Maintain localStorage as fallback for offline/demo mode
5. Provide seamless sync layer for existing code

## Non-Goals

- Real-time collaboration (future)
- Offline-first sync with conflict resolution (future)
- Data migration wizard UI (manual migration acceptable)

## Technical Approach

### Database Schema

**projects table:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  data JSONB NOT NULL, -- Full StoredProject object
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**characters table:**
```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL, -- Full StoredCharacter object
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**knowledge_base_items table:**
```sql
CREATE TABLE knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Sync Strategy

1. Check authentication status
2. If authenticated → use Supabase as primary, sync to localStorage as cache
3. If not authenticated → use localStorage only (demo mode)
4. Provide `syncToCloud()` function for manual sync trigger

## User Stories

### US-001: Projects Table & Service
Create Supabase table and service layer for projects.

**Acceptance Criteria:**
- Create `projects` table migration SQL
- Create `src/lib/storage/supabase/projectsService.ts`
- Implement CRUD: `list()`, `get()`, `save()`, `delete()`
- Return localStorage data when Supabase unavailable
- Typecheck passes

### US-002: Characters Table & Service
Create Supabase table and service layer for characters.

**Acceptance Criteria:**
- Create `characters` table migration SQL
- Create `src/lib/storage/supabase/charactersService.ts`
- Implement CRUD operations
- Handle pose and version data in JSONB
- Typecheck passes

### US-003: Knowledge Base Table & Service
Create Supabase table and service layer for KB items.

**Acceptance Criteria:**
- Create `knowledge_base_items` table migration SQL
- Create `src/lib/storage/supabase/knowledgeBaseService.ts`
- Implement CRUD operations
- Typecheck passes

### US-004: Sync Layer
Create unified sync service that coordinates between localStorage and Supabase.

**Acceptance Criteria:**
- Create `src/lib/storage/syncService.ts`
- Detect auth status and choose data source
- Implement `syncToCloud()` for one-time migration
- Implement `syncFromCloud()` for loading remote data
- Add sync status indicator type
- Typecheck passes

### US-005: Row-Level Security Policies
Add RLS policies to protect user data.

**Acceptance Criteria:**
- Enable RLS on all three tables
- Create policy: users can only see their own data
- Create policy: users can only modify their own data
- Document policies in migration SQL
- Typecheck passes

### US-006: Store Integration
Update existing stores to use new services.

**Acceptance Criteria:**
- Update `projectsStore.ts` to call service layer
- Update `charactersStore.ts` to call service layer
- Update `knowledgeBaseStore.ts` to call service layer
- Maintain backward compatibility with localStorage
- Typecheck passes

### US-007: Migration & Offline Fallback
Handle data migration and offline scenarios.

**Acceptance Criteria:**
- Create `src/lib/storage/migration.ts` with `migrateLocalToCloud()`
- Detect existing localStorage data on login
- Prompt or auto-migrate to Supabase
- Graceful fallback when offline
- Typecheck passes

## Success Metrics

- Projects persist across browser sessions
- Characters persist across devices
- No data loss on cache clear (for authenticated users)
- Demo mode continues to work without auth

## Dependencies

- Supabase project configured
- Auth already working (Feature complete)
- Service role key for server operations

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Keep localStorage as backup |
| Offline users blocked | Graceful fallback to localStorage |
| Large JSONB queries slow | Index commonly queried fields |
