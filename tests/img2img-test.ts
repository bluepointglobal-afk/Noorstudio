#!/usr/bin/env tsx
/**
 * IMG2IMG Implementation Test
 * 
 * This script tests the img2img character consistency architecture by:
 * 1. Creating a test project with multiple chapters
 * 2. Generating illustrations with img2img reference
 * 3. Validating that subsequent chapters use the first chapter as reference
 * 4. Producing a diagnostic report
 * 
 * Usage:
 *   npx tsx tests/img2img-test.ts
 * 
 * Or from the test directory:
 *   chmod +x img2img-test.ts
 *   ./img2img-test.ts
 */

import {
  createProject,
  getProject,
  updateProject,
  type StoredProject,
} from "../src/lib/storage/projectsStore";
import {
  createCharacter,
  type StoredCharacter,
} from "../src/lib/storage/charactersStore";
import {
  runOutlineStage,
  runChaptersStage,
  runIllustrationsStage,
} from "../src/lib/ai/stageRunner";
import {
  getCharacterConsistencyReference,
  validateImg2ImgSetup,
  createDiagnosticReport,
  getIllustrationStats,
} from "../src/lib/ai/img2imgUtils";
import type { OutlineOutput, ChapterOutput } from "../src/lib/ai/prompts";
import type { IllustrationArtifactItem } from "../src/lib/types/artifacts";

// Test configuration
const TEST_CONFIG = {
  projectTitle: "IMG2IMG Test Book",
  numChapters: 3, // Small number for quick testing
  ageRange: "5-7",
  setting: "A peaceful Islamic school",
  learningObjective: "Learning about patience and kindness",
  authorName: "Test Author",
};

// Helper to create a test character
function createTestCharacter(name: string, role: string): StoredCharacter {
  const character = createCharacter({
    name,
    role,
    ageRange: TEST_CONFIG.ageRange,
    visualDNA: {
      skinTone: "medium brown",
      hairOrHijab: name.includes("Aisha") ? "navy blue hijab" : "short black hair",
      outfitRules: "modest school uniform, blue shirt and gray pants",
      accessories: name.includes("Aisha") ? "white hijab pin" : "none",
      style: "pixar-3d",
    },
    modestyRules: {
      hijabAlways: name.includes("Aisha"),
      longSleeves: true,
      looseClothing: true,
    },
    colorPalette: ["#4A5568", "#2B6CB0", "#FFFFFF"],
  });

  return character;
}

// Mock progress callback
function progressCallback(progress: any) {
  const progressBar = "█".repeat(Math.floor(progress.progress / 5));
  const emptyBar = "░".repeat(20 - Math.floor(progress.progress / 5));
  console.log(
    `[${progress.stage.toUpperCase()}] ${progressBar}${emptyBar} ${progress.progress}% - ${progress.message}`
  );
}

async function runTest() {
  console.log("=== IMG2IMG Implementation Test ===\n");
  console.log("Configuration:");
  console.log(`  Title: ${TEST_CONFIG.projectTitle}`);
  console.log(`  Chapters: ${TEST_CONFIG.numChapters}`);
  console.log(`  Age Range: ${TEST_CONFIG.ageRange}`);
  console.log("");

  // Step 1: Create test project
  console.log("Step 1: Creating test project...");
  const project = createProject({
    title: TEST_CONFIG.projectTitle,
    ageRange: TEST_CONFIG.ageRange,
    setting: TEST_CONFIG.setting,
    learningObjective: TEST_CONFIG.learningObjective,
    authorName: TEST_CONFIG.authorName,
    illustrationDimensions: { width: 1536, height: 1024 },
    coverDimensions: { width: 1024, height: 1536 },
  });
  console.log(`✓ Project created with ID: ${project.id}\n`);

  // Step 2: Create test characters
  console.log("Step 2: Creating test characters...");
  const characters: StoredCharacter[] = [
    createTestCharacter("Aisha", "protagonist"),
    createTestCharacter("Omar", "friend"),
  ];
  console.log(`✓ Created ${characters.length} characters`);
  characters.forEach((c) => console.log(`  - ${c.name} (${c.role})`));
  console.log("");

  // Step 3: Generate outline
  console.log("Step 3: Generating outline...");
  const outlineResult = await runOutlineStage(
    project,
    characters,
    null, // No KB summary for test
    progressCallback
  );

  if (!outlineResult.success || !outlineResult.data) {
    console.error("❌ Outline generation failed:", outlineResult.error);
    return;
  }

  const outline = outlineResult.data as OutlineOutput;
  
  // Trim outline to test configuration
  outline.chapters = outline.chapters.slice(0, TEST_CONFIG.numChapters);
  
  console.log(`✓ Outline generated with ${outline.chapters.length} chapters\n`);

  // Step 4: Generate chapters
  console.log("Step 4: Generating chapters...");
  const chaptersResult = await runChaptersStage(
    project,
    outline,
    characters,
    null,
    progressCallback
  );

  if (!chaptersResult.success || !chaptersResult.data) {
    console.error("❌ Chapters generation failed:", chaptersResult.error);
    return;
  }

  const chapters = chaptersResult.data.chapters as ChapterOutput[];
  console.log(`✓ Generated ${chapters.length} chapters\n`);

  // Step 5: Generate illustrations with img2img
  console.log("Step 5: Generating illustrations with img2img...");
  console.log("  This is where the magic happens! 🎨\n");
  
  const illustrationsResult = await runIllustrationsStage(
    project,
    chapters,
    characters,
    null,
    progressCallback,
    undefined, // No cancel token
    outline
  );

  if (!illustrationsResult.success || !illustrationsResult.data) {
    console.error("❌ Illustrations generation failed:", illustrationsResult.error);
    return;
  }

  const illustrations = illustrationsResult.data.illustrations as IllustrationArtifactItem[];
  console.log(`✓ Generated ${illustrations.length} illustrations\n`);

  // Step 6: Validate img2img setup
  console.log("Step 6: Validating img2img implementation...\n");
  
  const validation = validateImg2ImgSetup(illustrations);
  const stats = getIllustrationStats(illustrations);
  const characterRef = getCharacterConsistencyReference(illustrations);

  console.log("Validation Results:");
  if (validation.valid) {
    console.log("  ✅ PASSED - IMG2IMG architecture is correctly implemented");
  } else {
    console.log("  ❌ FAILED - Issues detected:");
    validation.issues.forEach((issue) => console.log(`    - ${issue}`));
  }

  if (validation.warnings.length > 0) {
    console.log("\n  ⚠️  Warnings:");
    validation.warnings.forEach((warning) => console.log(`    - ${warning}`));
  }

  console.log("\nStatistics:");
  console.log(`  Total Illustrations: ${stats.totalIllustrations}`);
  console.log(`  Using Character Reference: ${stats.illustrationsWithReference}`);
  console.log(`  Consistency Rate: ${stats.totalIllustrations > 1 ? 
    ((stats.illustrationsWithReference / (stats.totalIllustrations - 1)) * 100).toFixed(1) : 0}%`);
  console.log(`  Average Variants: ${stats.averageVariantsPerIllustration.toFixed(1)}`);
  console.log(`  Global Seed: ${stats.globalSeed || "Not set"}`);
  
  if (characterRef) {
    console.log(`  Character Reference: ${characterRef.substring(0, 60)}...`);
  } else {
    console.log(`  Character Reference: ❌ Not set`);
  }

  // Step 7: Generate full diagnostic report
  console.log("\n" + "=".repeat(60));
  console.log(createDiagnosticReport(illustrations));
  console.log("=".repeat(60));

  // Step 8: Detailed illustration analysis
  console.log("\nDetailed Illustration Analysis:");
  illustrations.forEach((ill, idx) => {
    const isFirst = idx === 0;
    const hasCharRef = characterRef ? ill.references?.includes(characterRef) : false;
    const expectedImg2Img = !isFirst;
    const correctSetup = expectedImg2Img === hasCharRef;

    console.log(`\nChapter ${ill.chapterNumber}:`);
    console.log(`  Scene: ${ill.scene.substring(0, 80)}...`);
    console.log(`  Variants: ${ill.variants?.length || 0}`);
    console.log(`  References: ${ill.references?.length || 0}`);
    console.log(`  Seed: ${ill.variants?.[0]?.seed || "N/A"}`);
    console.log(`  Expected IMG2IMG: ${expectedImg2Img ? "Yes" : "No (first chapter)"}`);
    console.log(`  Using IMG2IMG: ${hasCharRef ? "Yes ✓" : "No ✗"}`);
    console.log(`  Setup: ${correctSetup ? "✅ CORRECT" : "❌ INCORRECT"}`);
    
    if (ill.references && ill.references.length > 0) {
      console.log(`  Reference URLs:`);
      ill.references.forEach((ref, refIdx) => {
        const isCharRef = ref === characterRef;
        const label = isCharRef ? " (CHARACTER REFERENCE)" : " (pose sheet)";
        console.log(`    ${refIdx + 1}. ${ref.substring(0, 50)}...${label}`);
      });
    }
  });

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("Test Summary:");
  console.log(`  Project ID: ${project.id}`);
  console.log(`  Chapters Generated: ${chapters.length}`);
  console.log(`  Illustrations Generated: ${illustrations.length}`);
  console.log(`  IMG2IMG Validation: ${validation.valid ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`  Character Consistency: ${characterRef ? "✅ ENABLED" : "❌ DISABLED"}`);
  
  if (validation.valid && characterRef) {
    console.log("\n🎉 SUCCESS! IMG2IMG architecture is working correctly!");
    console.log("   Character consistency should be improved compared to seed-only approach.");
  } else {
    console.log("\n⚠️  Test completed with issues. Please review the diagnostic report above.");
  }
  
  console.log("=".repeat(60));
}

// Run the test
runTest().catch((error) => {
  console.error("\n❌ Test failed with error:", error);
  process.exit(1);
});
