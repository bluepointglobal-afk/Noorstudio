#!/usr/bin/env node
/**
 * Character Consistency Demo (Mock Mode)
 * 
 * Generates sample test data showing how the consistency system works.
 * Run without needing actual Replicate API.
 * 
 * Usage: node test_consistency_demo.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'test_illustrations', 'consistency_demo');

// Demo images (will be replaced with real URLs in production)
const DEMO_BASE_CHAR = 'https://placehold.co/1024x1024/e8c69f/3d2817?text=Amira+Base+Character\n(Pink+Hijab,+Warm+Skin)';

const SCENES = [
  { 
    name: 'Morning Scene', 
    desc: 'Amira waking up, stretching, morning light',
    seed: 1001,
    placeholder: 'https://placehold.co/1024x768/FFF8DC/8B4513?text=Scene+1:+Morning\nSame+character+features' 
  },
  { 
    name: 'Kitchen Scene', 
    desc: 'Amira having breakfast with family',
    seed: 1002,
    placeholder: 'https://placehold.co/1024x768/FFE4B5/8B4513?text=Scene+2:+Kitchen\nConsistent+appearance' 
  },
  { 
    name: 'Garden Scene', 
    desc: 'Amira playing with butterflies',
    seed: 1003,
    placeholder: 'https://placehold.co/1024x768/E0F7FA/00796B?text=Scene+3:+Garden\nPink+hijab+maintained' 
  },
  { 
    name: 'Reading Scene', 
    desc: 'Amira reading under a tree',
    seed: 1004,
    placeholder: 'https://placehold.co/1024x768/FCE4EC/C2185B?text=Scene+4:+Reading\nWarm+brown+skin+consistent' 
  },
];

const VARIATIONS = [
  { seed: 5001, placeholder: 'https://placehold.co/1024x768/FFF3E0/E65100?text=Var+1:+Same+scene\nDifferent+seed' },
  { seed: 5002, placeholder: 'https://placehold.co/1024x768/FFF3E0/E65100?text=Var+2:+Same+scene\nDifferent+seed' },
  { seed: 5003, placeholder: 'https://placehold.co/1024x768/FFF3E0/E65100?text=Var+3:+Same+scene\nDifferent+seed' },
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate mock results
const mockResults = {
  provider: 'replicate',
  model: 'fofr/consistent-character:latest',
  baseCharacter: DEMO_BASE_CHAR,
  scenes: SCENES.map(s => ({
    name: s.name,
    imageUrl: s.placeholder,
    seed: s.seed,
    provider: 'replicate',
  })),
  variations: VARIATIONS.map((v, i) => ({
    imageUrl: v.placeholder,
    seed: v.seed,
    provider: 'replicate',
  })),
};

// Save JSON
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'demo_results.json'),
  JSON.stringify(mockResults, null, 2)
);

// Create HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character Consistency Demo - NoorStudio</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .subtitle {
            color: rgba(255,255,255,0.9);
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            background: white;
            padding: 25px;
            margin: 25px 0;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        h2 {
            color: #333;
            margin-top: 0;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-top: 20px;
        }
        .image-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #e9ecef;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .image-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .image-card img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            display: block;
            background: #e9ecef;
        }
        .image-label {
            font-weight: 600;
            color: #333;
            margin: 12px 0 8px;
            font-size: 16px;
        }
        .image-meta {
            font-size: 13px;
            color: #666;
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 10px;
        }
        .base-character {
            max-width: 600px;
            margin: 0 auto;
            border: 3px solid #667eea;
        }
        .checklist {
            background: #e8f5e9;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
        .checklist ul {
            margin: 10px 0;
            padding-left: 25px;
        }
        .checklist li {
            margin: 8px 0;
            color: #2e7d32;
        }
        .code-block {
            background: #263238;
            color: #aed581;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.6;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .badge-success { background: #4CAF50; color: white; }
        .badge-info { background: #2196F3; color: white; }
        .info-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .info-box code {
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 4px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <h1>🎨 Character Consistency Implementation</h1>
    <p class="subtitle">Replicate IP-Adapter Integration Demo</p>
    
    <div class="info-box">
        <strong>What is this?</strong> This demonstrates the character consistency feature for NoorStudio,
        which uses Replicate's <code>consistent-character</code> model with IP-Adapter technology to maintain
        character appearance across multiple book pages.
        <br><br>
        <strong>Expected Consistency:</strong> 80-85% | <strong>Cost:</strong> ~$0.05/image
    </div>

    <div class="section">
        <h2>📊 Implementation Metrics <span class="badge badge-success">Complete</span></h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">1</div>
                <div class="metric-label">Replicate Provider</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">4</div>
                <div class="metric-label">Test Scenes</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">3</div>
                <div class="metric-label">Variations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$0.05</div>
                <div class="metric-label">Per Image</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>👤 Base Character Reference</h2>
        <p>This reference image is used for all scene generations. The character should appear consistent across all pages.</p>
        <div class="image-card base-character">
            <div class="image-label">Amira - Base Reference <span class="badge badge-info">Seed: 12345</span></div>
            <img src="${mockResults.baseCharacter}" alt="Base Character">
            <div class="image-meta">
                Character traits: Warm brown skin, bright eyes, pink hijab, modest dress<br>
                Model: ${mockResults.model}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📖 Multi-Page Book Scenes</h2>
        <p>Each scene uses the base character reference with <code>referenceStrength: 0.85</code> to maintain consistency.</p>
        <div class="image-grid">
            ${mockResults.scenes.map((scene, index) => `
                <div class="image-card">
                    <div class="image-label">Page ${index + 1}: ${scene.name} <span class="badge badge-info">Seed: ${scene.seed}</span></div>
                    <img src="${scene.imageUrl}" alt="${scene.name}">
                    <div class="image-meta">Provider: ${scene.provider} | Character Reference: Used</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>🔄 Variation Test</h2>
        <p>Multiple variations of the same scene with different seeds to test consistency stability.</p>
        <div class="image-grid">
            ${mockResults.variations.map((variation, index) => `
                <div class="image-card">
                    <div class="image-label">Variation ${index + 1} <span class="badge badge-info">Seed: ${variation.seed}</span></div>
                    <img src="${variation.imageUrl}" alt="Variation ${index + 1}">
                    <div class="image-meta">Provider: ${variation.provider}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>✅ Consistency Checklist</h2>
        <div class="checklist">
            <p><strong>What to verify in the generated images:</strong></p>
            <ul>
                <li>✓ Facial features match across all scenes (eyes, nose, face shape)</li>
                <li>✓ Skin tone is consistent (warm brown)</li>
                <li>✓ Hijab color matches (pink)</li>
                <li>✓ Clothing style is consistent</li>
                <li>✓ Expression varies naturally per scene (this is OK)</li>
                <li>✓ Background varies per scene (expected)</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>💻 Code Example</h2>
        <p>How to use the character consistency feature in your code:</p>
        <div class="code-block">// 1. Generate or load base character reference
const characterRef = "https://.../amira-base.png";

// 2. Generate scenes with consistency
const scene = await generateImage({
  prompt: "Amira playing in the garden with butterflies",
  stage: 'illustrations',
  characterReference: characterRef,  // ← Key for consistency
  referenceStrength: 0.85,           // ← 0.8-0.9 recommended
  seed: 12345,                       // ← For reproducibility
});

// Result: Character appearance maintained across pages!</div>
    </div>

    <div class="section">
        <h2>📚 Documentation</h2>
        <ul>
            <li><strong>Full Documentation:</strong> <code>CHARACTER_CONSISTENCY.md</code></li>
            <li><strong>Quick Reference:</strong> <code>docs/CHARACTER_CONSISTENCY_QUICKREF.md</code></li>
            <li><strong>Research Report:</strong> <code>05_RESEARCH/noorstudio-character-consistency.md</code></li>
            <li><strong>Test Script:</strong> <code>test_character_consistency.mjs</code></li>
        </ul>
    </div>

    <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.8);">
        <p>NoorStudio Character Consistency Implementation | Phase 1 Complete</p>
        <p style="font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'consistency_demo.html'), html);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║   Character Consistency Demo Generated                   ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`\n📁 Output: ${OUTPUT_DIR}`);
console.log(`📄 Report: ${path.join(OUTPUT_DIR, 'consistency_demo.html')}`);
console.log('\nOpen the HTML file in a browser to see the demo.');
console.log('\nTo run with real images:');
console.log('  1. Set REPLICATE_API_TOKEN in server/.env');
console.log('  2. Run: node test_character_consistency.mjs');
console.log('');
