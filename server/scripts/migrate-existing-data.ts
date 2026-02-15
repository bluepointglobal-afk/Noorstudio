#!/usr/bin/env ts-node
/**
 * Data Migration Script for Universe V2
 *
 * Migrates existing books and characters to new schema:
 * 1. Creates default universe for each account
 * 2. Migrates characters to assets table
 * 3. Links books to their universe
 * 4. Creates book_assets links
 * 5. Creates initial outline versions
 *
 * SAFETY: This script is idempotent and can be run multiple times
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MigrationStats {
  users_processed: number;
  universes_created: number;
  characters_migrated: number;
  books_migrated: number;
  book_assets_created: number;
  outline_versions_created: number;
  errors: string[];
}

const stats: MigrationStats = {
  users_processed: 0,
  universes_created: 0,
  characters_migrated: 0,
  books_migrated: 0,
  book_assets_created: 0,
  outline_versions_created: 0,
  errors: [],
};

async function main() {
  console.log('🚀 Starting Universe V2 Data Migration...\n');

  try {
    // Step 1: Get all users with books or characters
    console.log('📊 Step 1: Finding users with existing data...');
    const users = await getUsersWithData();
    console.log(`   Found ${users.length} users\n`);

    // Step 2: Process each user
    for (const userId of users) {
      try {
        await migrateUserData(userId);
        stats.users_processed++;
      } catch (error) {
        const errorMsg = `User ${userId}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    // Step 3: Print summary
    printSummary();

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Migration completed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

async function getUsersWithData(): Promise<string[]> {
  // Get users who have projects or characters
  const { data: projects } = await supabase
    .from('projects')
    .select('user_id')
    .is('deleted_at', null);

  const { data: characters } = await supabase
    .from('characters')
    .select('user_id');

  const userIds = new Set<string>();
  projects?.forEach((p) => userIds.add(p.user_id));
  characters?.forEach((c) => userIds.add(c.user_id));

  return Array.from(userIds);
}

async function migrateUserData(userId: string) {
  console.log(`👤 Processing user: ${userId}`);

  // 1. Create or get default universe
  const universe = await getOrCreateDefaultUniverse(userId);
  console.log(`   ✓ Universe: ${universe.id}`);

  // 2. Migrate characters to assets
  const characterMap = await migrateCharacters(userId, universe.id);
  console.log(`   ✓ Migrated ${characterMap.size} characters`);

  // 3. Migrate books
  const booksMigrated = await migrateBooks(userId, universe.id, characterMap);
  console.log(`   ✓ Migrated ${booksMigrated} books`);
}

async function getOrCreateDefaultUniverse(userId: string) {
  // Check if default universe already exists
  const { data: existing } = await supabase
    .from('universes')
    .select('*')
    .eq('account_id', userId)
    .is('deleted_at', null)
    .limit(1)
    .single();

  if (existing) {
    return existing;
  }

  // Create default universe
  const { data: universe, error } = await supabase
    .from('universes')
    .insert({
      account_id: userId,
      name: 'My Stories',
      description: 'Default universe for migrated content',
      writing_dna: {
        tone: 'warm and engaging',
        pacing: 'moderate',
        vocabulary_level: 'age-appropriate',
      },
      visual_dna: {
        art_style: 'pixar-3d',
        mood: 'bright and cheerful',
      },
      book_presets: {
        default_age_range: '6-8',
        default_chapter_count: 8,
      },
      metadata: {
        migrated: true,
        migration_date: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) throw error;
  stats.universes_created++;
  return universe;
}

async function migrateCharacters(
  userId: string,
  universeId: string
): Promise<Map<string, string>> {
  const characterMap = new Map<string, string>(); // old_id -> new_asset_id

  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId);

  if (!characters || characters.length === 0) {
    return characterMap;
  }

  for (const character of characters) {
    // Check if already migrated
    const { data: existing } = await supabase
      .from('assets')
      .select('id')
      .eq('account_id', userId)
      .eq('type', 'character')
      .eq('metadata->legacy_id', character.id)
      .single();

    if (existing) {
      characterMap.set(character.id, existing.id);
      continue;
    }

    // Create asset from character
    const characterData = character.data || {};
    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        account_id: userId,
        universe_id: universeId,
        type: 'character',
        name: character.name,
        description: `${characterData.role || 'Character'} - ${characterData.ageRange || 'All ages'}`,
        data: characterData,
        thumbnail_url: characterData.imageUrl || null,
        file_urls: characterData.poseSheetUrl ? [characterData.poseSheetUrl] : [],
        metadata: {
          legacy_id: character.id,
          migrated_at: new Date().toISOString(),
          version: characterData.version || 1,
        },
        tags: [],
      })
      .select()
      .single();

    if (error) {
      stats.errors.push(`Character ${character.id}: ${error.message}`);
      continue;
    }

    characterMap.set(character.id, asset.id);
    stats.characters_migrated++;
  }

  return characterMap;
}

async function migrateBooks(
  userId: string,
  universeId: string,
  characterMap: Map<string, string>
): Promise<number> {
  const { data: books } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (!books || books.length === 0) {
    return 0;
  }

  let migrated = 0;

  for (const book of books) {
    try {
      // Update book with universe_id if not already set
      if (!book.universe_id) {
        const { error } = await supabase
          .from('projects')
          .update({
            universe_id: universeId,
            status: 'draft',
            metadata: {
              ...(book.metadata || {}),
              migrated_at: new Date().toISOString(),
            },
          })
          .eq('id', book.id);

        if (error) throw error;
      }

      // Create book_assets links for characters
      const bookData = book.data || {};
      const characterIds = bookData.characterIds || [];

      for (const oldCharId of characterIds) {
        const newAssetId = characterMap.get(oldCharId);
        if (!newAssetId) continue;

        // Check if link already exists
        const { data: existing } = await supabase
          .from('book_assets')
          .select('id')
          .eq('book_id', book.id)
          .eq('asset_id', newAssetId)
          .single();

        if (existing) continue;

        // Create link
        const { error } = await supabase.from('book_assets').insert({
          book_id: book.id,
          asset_id: newAssetId,
          role: 'character',
          usage_context: {
            migrated: true,
          },
          order_index: 0,
        });

        if (!error) {
          stats.book_assets_created++;
        }
      }

      // Create initial outline version if outline exists
      if (bookData.outline) {
        await createInitialOutlineVersion(book.id, bookData.outline);
      }

      migrated++;
      stats.books_migrated++;
    } catch (error) {
      stats.errors.push(
        `Book ${book.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return migrated;
}

async function createInitialOutlineVersion(bookId: string, outlineData: any) {
  // Check if outline version already exists
  const { data: existing } = await supabase
    .from('outline_versions')
    .select('id')
    .eq('book_id', bookId)
    .limit(1)
    .single();

  if (existing) return;

  // Create initial version
  const { error } = await supabase.from('outline_versions').insert({
    book_id: bookId,
    version_number: 1,
    data: outlineData,
    locked_sections: [],
    change_summary: 'Initial outline from migration',
    is_current: true,
  });

  if (!error) {
    stats.outline_versions_created++;
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Users processed:         ${stats.users_processed}`);
  console.log(`Universes created:       ${stats.universes_created}`);
  console.log(`Characters migrated:     ${stats.characters_migrated}`);
  console.log(`Books migrated:          ${stats.books_migrated}`);
  console.log(`Book-Asset links:        ${stats.book_assets_created}`);
  console.log(`Outline versions:        ${stats.outline_versions_created}`);
  console.log(`Errors:                  ${stats.errors.length}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    stats.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }
}

// Run migration
main();
