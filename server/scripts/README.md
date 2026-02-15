# Database Migration Scripts

## Universe V2 Migration

This directory contains scripts for migrating NoorStudio to the Universe V2 architecture.

### Overview

The migration adds:
- **Documents table**: Account-level document library
- **Assets table**: Reusable assets (characters, illustrations, covers)
- **Universes table**: Story universes with shared DNA
- **Book Assets table**: Many-to-many links between books and assets
- **Outline Versions table**: Versioned outlines with section locking
- **Projects table updates**: Add universe_id, status, metadata

### Migration Files

#### SQL Migrations (in `../supabase/migrations/`)

Run in order:

1. `008_create_documents.sql` - Document library
2. `009_create_assets.sql` - Asset management
3. `010_create_universes.sql` - Universe system + foreign keys
4. `011_create_relational_links.sql` - Book-Asset links
5. `012_refactor_books.sql` - Update projects table
6. `013_create_outline_versions.sql` - Outline versioning

#### Data Migration Script

- `migrate-existing-data.ts` - Migrates existing books and characters

#### Rollback Script

- `rollback-migrations.sql` - Reverts all schema changes

---

## Running Migrations

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 1: Backup Database

**CRITICAL: Always backup before migrating**

```bash
# Using Supabase CLI
supabase db dump -f backup-before-universe-v2.sql

# Or using pg_dump directly
pg_dump DATABASE_URL > backup-before-universe-v2.sql
```

### Step 2: Run SQL Migrations

```bash
# Run all migrations
supabase db push

# Or run individually
supabase db execute --file supabase/migrations/008_create_documents.sql
supabase db execute --file supabase/migrations/009_create_assets.sql
supabase db execute --file supabase/migrations/010_create_universes.sql
supabase db execute --file supabase/migrations/011_create_relational_links.sql
supabase db execute --file supabase/migrations/012_refactor_books.sql
supabase db execute --file supabase/migrations/013_create_outline_versions.sql
```

### Step 3: Verify Schema

```sql
-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'documents',
    'assets',
    'universes',
    'book_assets',
    'outline_versions'
  );

-- Check projects table has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN (
    'universe_id',
    'document_id',
    'status',
    'metadata',
    'deleted_at'
  );
```

### Step 4: Run Data Migration

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Install dependencies
npm install @supabase/supabase-js

# Run migration script
npx ts-node server/scripts/migrate-existing-data.ts
```

The script will:
- ✅ Create default universe for each user
- ✅ Migrate characters to assets table
- ✅ Link books to universes
- ✅ Create book-asset relationships
- ✅ Create initial outline versions

**Migration is idempotent** - safe to run multiple times.

### Step 5: Verify Migration

```sql
-- Check universes created
SELECT account_id, name, book_count, character_count
FROM universes
WHERE deleted_at IS NULL;

-- Check assets migrated
SELECT account_id, type, COUNT(*) as count
FROM assets
WHERE deleted_at IS NULL
GROUP BY account_id, type;

-- Check books linked to universes
SELECT COUNT(*) as books_with_universe
FROM projects
WHERE universe_id IS NOT NULL
  AND deleted_at IS NULL;

-- Check book-asset links
SELECT role, COUNT(*) as count
FROM book_assets
GROUP BY role;

-- Check outline versions
SELECT book_id, version_number, is_current
FROM outline_versions
WHERE is_current = true;
```

---

## Rollback Procedure

If migration fails or you need to revert:

### Step 1: Backup Current State

```bash
pg_dump DATABASE_URL > backup-before-rollback.sql
```

### Step 2: Run Rollback Script

```bash
supabase db execute --file server/scripts/rollback-migrations.sql
```

### Step 3: Verify Rollback

```sql
-- Verify new tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'documents',
    'assets',
    'universes',
    'book_assets',
    'outline_versions'
  );
-- Should return 0 rows

-- Verify columns removed from projects
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN (
    'universe_id',
    'document_id',
    'status',
    'metadata',
    'deleted_at'
  );
-- Should return 0 rows
```

### Step 4: Restart Application

```bash
# Restart server to clear any cached schema
pm2 restart all  # or your process manager

# Or for development
npm run dev:server
```

---

## Testing Migrations

### Local Testing (Recommended)

1. **Use Supabase Local Development**

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Test with local database
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY="your-local-service-key"

npx ts-node server/scripts/migrate-existing-data.ts
```

2. **Create Test Data**

```sql
-- Insert test user
INSERT INTO auth.users (id, email)
VALUES ('test-user-id', 'test@example.com');

-- Insert test character
INSERT INTO characters (id, user_id, name, data)
VALUES (
  'test-char-id',
  'test-user-id',
  'Test Character',
  '{"role": "Protagonist", "ageRange": "8-10"}'::jsonb
);

-- Insert test project
INSERT INTO projects (id, user_id, title, data)
VALUES (
  'test-project-id',
  'test-user-id',
  'Test Book',
  '{"characterIds": ["test-char-id"]}'::jsonb
);
```

3. **Run Migration and Verify**

```bash
npx ts-node server/scripts/migrate-existing-data.ts

# Check results
supabase db shell
```

---

## Troubleshooting

### Migration Script Errors

**Error**: `Missing required environment variables`
- **Solution**: Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**Error**: `models/imagen-3.0-generate-001 is not found`
- **Solution**: This is unrelated to migration. Check AI provider configuration.

**Error**: `duplicate key value violates unique constraint`
- **Solution**: Migration is idempotent. This means data was already migrated. Safe to continue.

### SQL Migration Errors

**Error**: `relation "universes" does not exist`
- **Solution**: Run migrations in order (008 → 013)

**Error**: `column "universe_id" already exists`
- **Solution**: Migration already applied. Check with `\d projects` in psql.

### Data Issues After Migration

**Issue**: Characters not appearing in book creation
- **Solution**: Check `book_assets` table for links
- Run: `SELECT * FROM book_assets WHERE book_id = 'your-book-id'`

**Issue**: Books showing empty universe
- **Solution**: Run data migration script again (it's idempotent)

---

## Migration Checklist

- [ ] Backup production database
- [ ] Test migrations on local/staging environment
- [ ] Run SQL migrations (008-013)
- [ ] Verify schema changes
- [ ] Run data migration script
- [ ] Verify migrated data
- [ ] Update application code to use new models
- [ ] Test critical user flows
- [ ] Monitor application logs for errors
- [ ] Keep rollback script ready for 24 hours

---

## Support

If you encounter issues:

1. Check migration logs for specific errors
2. Verify database connection and permissions
3. Review this README's troubleshooting section
4. Restore from backup if necessary
5. Report issues at: https://github.com/anthropics/noorstudio/issues
