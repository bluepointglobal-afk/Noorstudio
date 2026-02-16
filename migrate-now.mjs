#!/usr/bin/env node
/**
 * Quick Migration Runner
 * Runs Universe V2 migrations using Supabase Management API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read combined migration file
const migrationFile = join(__dirname, 'supabase', 'migrations', 'COMBINED_UNIVERSE_V2.sql');
const sql = readFileSync(migrationFile, 'utf-8');

console.log('🚀 Running Universe V2 Migrations...\n');
console.log(`📄 Reading: ${migrationFile}`);
console.log(`📊 SQL Length: ${sql.length} characters\n`);

// Use Supabase REST API to execute SQL via a stored procedure
// We'll need to create a helper function first
const createHelperSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_string;
END;
$$;
`;

async function executeSql(sqlCode) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql_string: sqlCode })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${response.status} ${error}`);
  }

  return response;
}

async function main() {
  try {
    console.log('1️⃣  Creating exec_sql helper function...');
    await executeSql(createHelperSQL);
    console.log('   ✅ Helper function created\n');

    console.log('2️⃣  Running Universe V2 migrations...');
    await executeSql(sql);
    console.log('   ✅ Migrations completed!\n');

    console.log('✅ All done! The Universe V2 tables are now created.\n');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser at http://localhost:3009/app/universes');
    console.log('   2. You should see the Universe management page!');
    console.log('   3. Click "New Universe" to create your first universe\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run the SQL manually');
    console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Paste contents of: supabase/migrations/COMBINED_UNIVERSE_V2.sql');
    console.log('   4. Click "Run"\n');
    process.exit(1);
  }
}

main();
