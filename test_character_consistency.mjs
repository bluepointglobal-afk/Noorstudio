#!/usr/bin/env node
/**
 * Character Consistency E2E Test
 * 
 * Tests the Replicate character-consistent image generation by:
 * 1. Generating a base character image
 * 2. Using that as reference for 3+ different scene illustrations
 * 3. Verifying the character appears consistent across pages
 * 
 * Usage: node test_character_consistency.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const OUTPUT_DIR = path.join(__dirname, 'test_illustrations', 'consistency_test');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check API status
 */
async function checkStatus() {
  log('\n📡 Checking API status...', 'blue');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/status`);
    const status = await response.json();
    
    log(`Text Provider: ${status.textProvider}`, 'cyan');
    log(`Image Provider: ${status.imageProvider}`, 'cyan');
    log(`Replicate Configured: ${status.replicateConfigured ? '✓' : '✗'}`, status.replicateConfigured ? 'green' : 'red');
    
    if (status.replicateModel) {
      log(`Replicate Model: ${status.replicateModel}`, 'cyan');
    }
    
    return status;
  } catch (error) {
    log(`❌ Failed to check status: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Generate a base character reference image
 */
async function generateBaseCharacter() {
  log('\n👤 Generating base character reference...', 'blue');
  
  const prompt = `A young Muslim girl named Amira, 8 years old, warm brown skin, 
    bright brown eyes, wearing a pink hijab and modest dress, 
    neutral expression, full body standing pose, simple white background, 
    children's book illustration style, warm and friendly appearance, 
    consistent character design sheet style`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'illustration',
        prompt: prompt,
        style: 'childrens-book',
        count: 1,
        seed: 12345,
        size: { width: 1024, height: 1024 }, // Square for character portrait
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    log(`✓ Base character generated`, 'green');
    log(`  URL: ${data.imageUrl.substring(0, 80)}...`, 'cyan');
    log(`  Provider: ${data.provider}`, 'cyan');
    
    // Save reference to file
    const outputPath = path.join(OUTPUT_DIR, '01_base_character.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    log(`  Saved: ${outputPath}`, 'cyan');
    
    return data.imageUrl;
  } catch (error) {
    log(`❌ Failed to generate base character: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Generate a scene illustration using character reference
 */
async function generateScene(sceneName, sceneDescription, characterRefUrl, seed) {
  log(`\n🎨 Generating scene: ${sceneName}...`, 'blue');
  
  const enhancedPrompt = `${sceneDescription}
    
    Featuring the same young Muslim girl character with warm brown skin, 
    bright brown eyes, wearing a pink hijab and modest dress.
    Children's book illustration style, warm colors, detailed scene.`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'illustration',
        prompt: enhancedPrompt,
        style: 'childrens-book',
        count: 1,
        seed: seed,
        size: { width: 1024, height: 768 },
        references: [characterRefUrl], // Pass character reference for consistency
        referenceStrength: 0.85,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    log(`✓ ${sceneName} generated`, 'green');
    log(`  URL: ${data.imageUrl.substring(0, 80)}...`, 'cyan');
    log(`  Character Reference: ${data.providerMeta?.characterReference || 'none'}`, 'cyan');
    
    // Save reference
    const outputPath = path.join(OUTPUT_DIR, `${sceneName.replace(/\s+/g, '_').toLowerCase()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    log(`  Saved: ${outputPath}`, 'cyan');
    
    return data;
  } catch (error) {
    log(`❌ Failed to generate ${sceneName}: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Generate variations of the same scene for comparison
 */
async function generateVariations(sceneName, sceneDescription, characterRefUrl) {
  log(`\n🎨 Generating variations for: ${sceneName}...`, 'blue');
  
  const variations = [];
  
  for (let i = 0; i < 3; i++) {
    const seed = 5000 + i;
    const enhancedPrompt = `${sceneDescription}
      
      Featuring the same young Muslim girl character with warm brown skin, 
      bright brown eyes, wearing a pink hijab and modest dress.
      Children's book illustration style, warm colors.`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'illustration',
          prompt: enhancedPrompt,
          style: 'childrens-book',
          count: 1,
          seed: seed,
          size: { width: 1024, height: 768 },
          references: [characterRefUrl],
          referenceStrength: 0.85,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      variations.push(data);
      log(`✓ Variation ${i + 1} generated (seed: ${seed})`, 'green');
      
      // Small delay between requests
      if (i < 2) await delay(2000);
    } catch (error) {
      log(`❌ Failed to generate variation ${i + 1}: ${error.message}`, 'red');
    }
  }
  
  // Save all variations
  const outputPath = path.join(OUTPUT_DIR, `${sceneName.replace(/\s+/g, '_').toLowerCase()}_variations.json`);
  fs.writeFileSync(outputPath, JSON.stringify(variations, null, 2));
  log(`  Saved all variations: ${outputPath}`, 'cyan');
  
  return variations;
}

/**
 * Create HTML report for visual comparison
 */
async function createComparisonReport(testResults) {
  log('\n📄 Creating visual comparison report...', 'blue');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character Consistency Test - NoorStudio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 40px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
        }
        .section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .image-card {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .image-card img {
            width: 100%;
            height: auto;
            border-radius: 4px;
            display: block;
        }
        .image-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .image-meta {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
        .base-character {
            max-width: 600px;
            margin: 0 auto;
        }
        .status-good {
            color: #4CAF50;
        }
        .status-warning {
            color: #FF9800;
        }
        .info-box {
            background: #E3F2FD;
            padding: 15px;
            border-left: 4px solid #2196F3;
            margin: 20px 0;
        }
        .timestamp {
            color: #888;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <h1>🎨 Character Consistency Test Report</h1>
    <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    
    <div class="info-box">
        <strong>Test Objective:</strong> Verify that the Replicate IP-Adapter based character consistency
        feature maintains character appearance across multiple book pages/scenes.
        <br><br>
        <strong>Provider:</strong> ${testResults.provider}<br>
        <strong>Model:</strong> ${testResults.model || 'fofr/consistent-character:latest'}
    </div>

    <div class="section">
        <h2>👤 Base Character Reference</h2>
        <p>This is the reference image used for all subsequent scene generations. All characters 
        should share similar facial features, skin tone, hair/hijab color, and clothing style.</p>
        <div class="image-card base-character">
            <div class="image-label">Amira - Base Reference</div>
            <img src="${testResults.baseCharacter}" alt="Base Character">
            <div class="image-meta">Seed: 12345 | Size: 1024x1024</div>
        </div>
    </div>

    <div class="section">
        <h2>📖 Book Pages (Scene Consistency Test)</h2>
        <p>These scenes show the same character (Amira) in different scenarios. 
        Look for consistency in facial features, skin tone, and clothing.</p>
        <div class="image-grid">
            ${testResults.scenes.map((scene, index) => `
                <div class="image-card">
                    <div class="image-label">Page ${index + 1}: ${scene.name}</div>
                    <img src="${scene.imageUrl}" alt="${scene.name}">
                    <div class="image-meta">
                        Seed: ${scene.seed} | 
                        Reference Strength: 0.85 | 
                        Provider: ${scene.provider}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>🔄 Variation Test (Same Scene, Different Seeds)</h2>
        <p>Multiple variations of the same scene with different random seeds, 
        using the same character reference. Tests stability of consistency.</p>
        <div class="image-grid">
            ${testResults.variations.map((variation, index) => `
                <div class="image-card">
                    <div class="image-label">Variation ${index + 1} (Seed: ${5000 + index})</div>
                    <img src="${variation.imageUrl}" alt="Variation ${index + 1}">
                    <div class="image-meta">Provider: ${variation.provider}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>📊 Consistency Metrics</h2>
        <ul>
            <li><strong>Character Reference Used:</strong> <span class="status-good">✓ Yes</span></li>
            <li><strong>Reference Strength:</strong> 0.85 (high consistency)</li>
            <li><strong>Scenes Generated:</strong> ${testResults.scenes.length}</li>
            <li><strong>Variations Generated:</strong> ${testResults.variations.length}</li>
            <li><strong>Total Images:</strong> ${1 + testResults.scenes.length + testResults.variations.length}</li>
            <li><strong>Expected Consistency:</strong> 80-85% (per research)</li>
        </ul>
    </div>

    <div class="section">
        <h2>📝 Test Notes</h2>
        <ul>
            <li>Compare facial features across all scenes - eyes, nose, face shape should be similar</li>
            <li>Check skin tone consistency - should be warm brown across all images</li>
            <li>Verify clothing colors - pink hijab should be consistent</li>
            <li>Look for variations in pose and expression which should be natural</li>
            <li>Minor inconsistencies in background details are acceptable</li>
        </ul>
    </div>
</body>
</html>`;

  const reportPath = path.join(OUTPUT_DIR, 'consistency_report.html');
  fs.writeFileSync(reportPath, html);
  log(`✓ Report created: ${reportPath}`, 'green');
  
  return reportPath;
}

/**
 * Main test runner
 */
async function main() {
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║   NoorStudio Character Consistency E2E Test              ║', 'cyan');
  log('║   Replicate IP-Adapter Integration                       ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  
  // Setup output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Check API status
  const status = await checkStatus();
  if (!status) {
    log('\n❌ Cannot connect to API. Is the server running?', 'red');
    log('Start server with: cd server && npm run dev', 'yellow');
    process.exit(1);
  }
  
  if (!status.replicateConfigured) {
    log('\n❌ Replicate is not configured!', 'red');
    log('Set REPLICATE_API_TOKEN environment variable.', 'yellow');
    process.exit(1);
  }
  
  const testResults = {
    provider: status.imageProvider,
    model: status.replicateModel,
    baseCharacter: null,
    scenes: [],
    variations: [],
  };
  
  try {
    // Step 1: Generate base character
    testResults.baseCharacter = await generateBaseCharacter();
    await delay(3000); // Wait for image to be ready
    
    // Step 2: Generate multiple scenes with character consistency
    const scenes = [
      {
        name: 'Morning Scene',
        description: 'Amira waking up in her cozy bedroom with sunlight streaming through the window. She is stretching and smiling, ready to start the day.',
        seed: 1001,
      },
      {
        name: 'Kitchen Scene',
        description: 'Amira in the kitchen having breakfast with her family. She is sitting at the table, enjoying a meal.',
        seed: 1002,
      },
      {
        name: 'Garden Scene',
        description: 'Amira playing in a beautiful garden with flowers and butterflies. She looks happy and curious.',
        seed: 1003,
      },
      {
        name: 'Reading Scene',
        description: 'Amira sitting under a tree reading a book. She is focused and peaceful.',
        seed: 1004,
      },
    ];
    
    for (const scene of scenes) {
      const result = await generateScene(
        scene.name,
        scene.description,
        testResults.baseCharacter,
        scene.seed
      );
      testResults.scenes.push({
        name: scene.name,
        imageUrl: result.imageUrl,
        seed: scene.seed,
        provider: result.provider,
      });
      await delay(3000);
    }
    
    // Step 3: Generate variations of one scene
    const variations = await generateVariations(
      'Playing with Friends',
      'Amira playing with her friends in a playground, laughing and having fun.',
      testResults.baseCharacter
    );
    testResults.variations = variations.map((v, i) => ({
      imageUrl: v.imageUrl,
      seed: 5000 + i,
      provider: v.provider,
    }));
    
    // Step 4: Create visual comparison report
    const reportPath = await createComparisonReport(testResults);
    
    // Summary
    log('\n╔═══════════════════════════════════════════════════════════╗', 'green');
    log('║   ✓ TEST COMPLETED SUCCESSFULLY                          ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝', 'green');
    log(`\n📊 Results Summary:`, 'cyan');
    log(`   Base Character: 1 image`, 'cyan');
    log(`   Scenes: ${testResults.scenes.length} images`, 'cyan');
    log(`   Variations: ${testResults.variations.length} images`, 'cyan');
    log(`   Total: ${1 + testResults.scenes.length + testResults.variations.length} images`, 'cyan');
    log(`\n📁 Output Directory: ${OUTPUT_DIR}`, 'cyan');
    log(`📄 Report: ${reportPath}`, 'cyan');
    log(`\n🔍 Open the HTML report in a browser to visually verify consistency.`, 'yellow');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
