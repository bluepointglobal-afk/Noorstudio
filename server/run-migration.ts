/**
 * Migration Runner Script
 * Run this directly with: npx tsx server/run-migration.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment
dotenv.config({ path: join(__dirname, '.env') });

// Parse Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || '';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Invalid SUPABASE_URL');
  process.exit(1);
}

// Construct postgres connection string
// Note: You need to provide the database password
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD environment variable');
  console.error('Please add it to server/.env file');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

async function runMigrations() {
  const client = new pg.Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.match(/^01[0-5]_.*\.sql$/))
      .sort();

    console.log(`\n📋 Found ${migrationFiles.length} Universe V2 migrations:\n`);
    migrationFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

    console.log('\n🚀 Running migrations...\n');

    for (const file of migrationFiles) {
      console.log(`📄 ${file}...`);
      const filepath = join(migrationsDir, file);
      const sql = readFileSync(filepath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}\n`);
        throw error;
      }
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
