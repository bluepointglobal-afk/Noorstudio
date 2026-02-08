#!/usr/bin/env node

/**
 * Test Image Generation for NoorStudio
 * Generates test illustrations for book chapters using Replicate Flux model
 */

import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize clients
const claudeClient = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Book chapter data
const chapters = [
  {
    title: "Amira Finds a Toy",
    character: "Amira",
    description:
      "A young Muslim girl finds a lost toy and must decide whether to keep it or return it",
    key_scene:
      "Amira holding a beautiful toy, looking uncertain but noble, in her home with Islamic decoration",
  },
  {
    title: "The Broken Window",
    character: "Ahmed",
    description:
      "A boy accidentally breaks a neighbor's window and must find the courage to admit it",
    key_scene:
      "Ahmed standing nervously at a neighbor's door, looking worried but determined to be honest",
  },
  {
    title: "The Test at School",
    character: "Amira",
    description: "Amira faces a difficult test and must resist the temptation to cheat",
    key_scene:
      "Amira at her school desk, focused and thoughtful, with classmates studying around her",
  },
];

/**
 * Use Claude to generate detailed illustration prompts
 */
async function generateImagePrompt(chapterData) {
  console.log(`\n📝 Generating prompt for: ${chapterData.title}`);

  const response = await claudeClient.messages.create({
    model: "claude-opus-4-1-20250805",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a children's book illustrator specializing in Islamic-themed stories. Generate a detailed, vivid image prompt for the following chapter:

Title: ${chapterData.title}
Character: ${chapterData.character}
Description: ${chapterData.description}
Key Scene: ${chapterData.key_scene}

Generate a prompt that:
1. Is suitable for a children's book illustration
2. Features Islamic aesthetic (modest clothing, hijabs where appropriate, diverse Middle Eastern/South Asian/African features)
3. Is warm, inviting, and family-friendly
4. Specifically includes the character ${chapterData.character} with visually distinctive features for consistency
5. Includes the key scene details
6. Explicitly says "NO TEXT, NO WORDS, NO WATERMARKS"
7. Specifies 2D illustrated children's book style

Format: Just the detailed prompt, nothing else.`,
      },
    ],
  });

  const prompt = response.content[0].type === "text" ? response.content[0].text : "";
  return prompt;
}

/**
 * Generate image using Replicate's Flux model
 */
async function generateImage(prompt, chapter_num) {
  console.log(`🎨 Generating image for prompt (Chapter ${chapter_num})...`);
  console.log(`📋 Prompt: ${prompt.substring(0, 100)}...`);

  try {
    const output = await replicate.run("black-forest-labs/flux-1.1-pro-ultra", {
      prompt: prompt,
      aspect_ratio: "4:3",
      num_outputs: 1,
      output_format: "jpg",
      quality: 90,
    });

    if (Array.isArray(output) && output.length > 0) {
      return output[0]; // URL to the generated image
    }
    throw new Error("No output from Replicate");
  } catch (error) {
    console.error(`❌ Replicate error:`, error.message);
    // Fallback: return a placeholder message
    return null;
  }
}

/**
 * Download image from URL
 */
async function downloadImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(__dirname, "test-images", filename);

    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filepath);
    https
      .get(imageUrl, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`✅ Downloaded: ${filename}`);
          resolve(filepath);
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}); // Delete file on error
        reject(err);
      });
  });
}

/**
 * Main test function
 */
async function runImageGenerationTests() {
  console.log("🚀 NoorStudio Image Generation Test");
  console.log("=====================================\n");

  if (!process.env.CLAUDE_API_KEY) {
    console.error("❌ CLAUDE_API_KEY not set");
    process.exit(1);
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN not set");
    console.log("ℹ️  Get one at: https://replicate.com/account/api-tokens");
    process.exit(1);
  }

  const results = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    console.log(`\n📖 Chapter ${i + 1}: ${chapter.title}`);
    console.log("─".repeat(50));

    try {
      // Step 1: Generate prompt using Claude
      const prompt = await generateImagePrompt(chapter);
      console.log(`✅ Prompt generated (${prompt.length} chars)`);

      // Step 2: Generate image using Replicate
      const imageUrl = await generateImage(prompt, i + 1);

      if (!imageUrl) {
        console.log("⚠️  Skipped (no valid output)");
        results.push({
          chapter: chapter.title,
          status: "failed",
          error: "No valid image URL",
        });
        continue;
      }

      // Step 3: Download and save image
      const filename = `chapter-${i + 1}-${chapter.character.toLowerCase()}.jpg`;
      const filepath = await downloadImage(imageUrl, filename);

      results.push({
        chapter: chapter.title,
        character: chapter.character,
        status: "success",
        image_url: imageUrl,
        local_file: filepath,
        prompt: prompt.substring(0, 200),
      });

      console.log(`🎉 Image generated successfully!`);
    } catch (error) {
      console.error(`❌ Error:`, error.message);
      results.push({
        chapter: chapter.title,
        status: "error",
        error: error.message,
      });
    }

    // Rate limiting: wait between requests
    if (i < chapters.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log("\n\n📊 Test Results Summary");
  console.log("=====================================");
  console.log(JSON.stringify(results, null, 2));

  const successful = results.filter((r) => r.status === "success").length;
  console.log(
    `\n✅ Success: ${successful}/${chapters.length} images generated`
  );

  return successful > 0;
}

// Run the test
runImageGenerationTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
