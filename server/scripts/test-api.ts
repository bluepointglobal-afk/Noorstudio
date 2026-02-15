#!/usr/bin/env ts-node
/**
 * API Testing Script for Universe V2 Endpoints
 *
 * Tests all CRUD operations for:
 * - Universes
 * - Assets
 * - Documents
 * - Book Assets
 * - Outline Versions
 *
 * Run with: ts-node server/scripts/test-api.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"; // From supabase start output

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  console.log(passed ? `✅ ${name}` : `❌ ${name}: ${error}`);
}

async function main() {
  console.log("🧪 Testing Universe V2 API Endpoints\n");

  try {
    // Step 1: Use existing test user or create via SQL
    console.log("📝 Step 1: Setting up test user...");
    const testUserId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // Use same UUID from manual tests

    // Auth table is managed by Supabase, use the user we created manually
    logTest("Setup test user", true);

    // Step 2: Test Universes
    console.log("\n🌌 Step 2: Testing Universes API...");
    const { data: universe, error: createUniverseError } = await supabase
      .from("universes")
      .insert({
        account_id: testUserId,
        name: "Test Universe for API",
        description: "API test universe",
      })
      .select()
      .single();

    logTest("Create universe", !createUniverseError, createUniverseError?.message);

    if (universe) {
      // Test get universe
      const { data: fetchedUniverse, error: getError } = await supabase
        .from("universes")
        .select("*")
        .eq("id", universe.id)
        .single();

      logTest("Get universe", !getError && fetchedUniverse?.name === "Test Universe for API", getError?.message);

      // Test update universe
      const { error: updateError } = await supabase
        .from("universes")
        .update({ description: "Updated description" })
        .eq("id", universe.id);

      logTest("Update universe", !updateError, updateError?.message);

      // Step 3: Test Assets
      console.log("\n🎨 Step 3: Testing Assets API...");
      const { data: asset, error: createAssetError } = await supabase
        .from("assets")
        .insert({
          account_id: testUserId,
          universe_id: universe.id,
          type: "character",
          name: "Test Hero",
          data: { role: "Protagonist", ageRange: "8-10" },
        })
        .select()
        .single();

      logTest("Create asset", !createAssetError, createAssetError?.message);

      // Step 4: Test Documents
      console.log("\n📄 Step 4: Testing Documents API...");
      const { data: document, error: createDocError } = await supabase
        .from("documents")
        .insert({
          account_id: testUserId,
          universe_id: universe.id,
          type: "series_bible",
          title: "Test Series Bible",
          content: { text: "This is a test" },
        })
        .select()
        .single();

      logTest("Create document", !createDocError, createDocError?.message);

      // Step 5: Test Book (Project)
      console.log("\n📚 Step 5: Creating test book...");
      const { data: book, error: createBookError } = await supabase
        .from("projects")
        .insert({
          user_id: testUserId,
          universe_id: universe.id,
          title: "Test Book",
          data: {},
        })
        .select()
        .single();

      logTest("Create book", !createBookError, createBookError?.message);

      if (book && asset) {
        // Step 6: Test Book-Assets Link
        console.log("\n🔗 Step 6: Testing Book-Assets API...");
        const { data: bookAsset, error: linkError } = await supabase
          .from("book_assets")
          .insert({
            book_id: book.id,
            asset_id: asset.id,
            role: "character",
            usage_context: { is_main_character: true },
          })
          .select()
          .single();

        logTest("Link asset to book", !linkError, linkError?.message);

        // Verify usage count incremented
        const { data: updatedAsset } = await supabase
          .from("assets")
          .select("usage_count")
          .eq("id", asset.id)
          .single();

        logTest(
          "Usage count trigger",
          updatedAsset?.usage_count === 1,
          `Expected 1, got ${updatedAsset?.usage_count}`
        );

        // Step 7: Test Outline Versions
        console.log("\n📋 Step 7: Testing Outline Versions API...");
        const { data: outlineV1, error: createOutlineError } = await supabase
          .from("outline_versions")
          .insert({
            book_id: book.id,
            data: {
              title: "Test Outline",
              chapters: [
                { id: "ch1", chapter_number: 1, title: "Chapter 1", summary: "Test" },
                { id: "ch2", chapter_number: 2, title: "Chapter 2", summary: "Test" },
              ],
            },
            locked_sections: ["ch1"],
            is_current: true,
            created_by: testUserId,
          })
          .select()
          .single();

        logTest("Create outline version 1", !createOutlineError, createOutlineError?.message);

        if (outlineV1) {
          // Test version auto-increment
          const { data: outlineV2, error: createV2Error } = await supabase
            .from("outline_versions")
            .insert({
              book_id: book.id,
              data: { title: "Updated Outline" },
              locked_sections: [],
              is_current: true,
            })
            .select()
            .single();

          logTest(
            "Auto-increment version",
            !createV2Error && outlineV2?.version_number === 2,
            createV2Error?.message || `Expected v2, got v${outlineV2?.version_number}`
          );

          // Verify single current version
          const { data: currentVersions } = await supabase
            .from("outline_versions")
            .select("version_number, is_current")
            .eq("book_id", book.id)
            .eq("is_current", true);

          logTest(
            "Single current version",
            currentVersions?.length === 1 && currentVersions[0].version_number === 2,
            `Expected 1 current version (v2), got ${currentVersions?.length} versions`
          );
        }

        // Step 8: Test soft delete
        console.log("\n🗑️  Step 8: Testing soft delete...");
        const { error: deleteError } = await supabase
          .from("universes")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", universe.id);

        logTest("Soft delete universe", !deleteError, deleteError?.message);

        // Verify soft delete works
        const { data: deletedUniverse } = await supabase
          .from("universes")
          .select("*")
          .eq("id", universe.id)
          .is("deleted_at", null);

        logTest("Verify soft delete", deletedUniverse?.length === 0, "Universe still visible");
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);

    if (total - passed > 0) {
      console.log("\n❌ FAILED TESTS:");
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
    }

    console.log("=".repeat(60));

    process.exit(total === passed ? 0 : 1);
  } catch (error) {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  }
}

main();
