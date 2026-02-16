#!/usr/bin/env node
/**
 * Migration Runner
 * Runs all migration files against the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationsDir = join(__dirname, 'supabase', 'migrations');

async function runMigration(filename) {
  console.log(`\n📄 Running migration: ${filename}`);

  const filepath = join(migrationsDir, filename);
  const sql = readFileSync(filepath, 'utf-8');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error(`❌ Migration failed: ${filename}`);
      console.error(error);
      return false;
    }

    console.log(`✅ Migration completed: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Migration failed: ${filename}`);
    console.error(err);
    return false;
  }
}

async function main() {
  console.log('🚀 Running Universe V2 Migrations...\n');

  // Get migration files 010-015 (Universe V2 migrations)
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.match(/^01[0-5]_.*\.sql$/))
    .sort();

  console.log(`Found ${migrationFiles.length} migrations to run:`);
  migrationFiles.forEach(f => console.log(`  - ${f}`));

  for (const file of migrationFiles) {
    const success = await runMigration(file);
    if (!success) {
      console.error('\n❌ Migration failed. Stopping.');
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations completed successfully!');
}

main().catch(err => {
  console.error('❌ Migration runner failed:', err);
  process.exit(1);
});
