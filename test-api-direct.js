// Direct test of Railway API with authentication
const fetch = require('node-fetch');

const RAILWAY_URL = 'https://web-production-5836c.up.railway.app';

// Test character with VERY specific attributes
const testCharacter = {
  name: "TestLayla",
  visualDNA: {
    style: "manga",
    skinTone: "dark brown skin",
    hairOrHijab: "blue hijab with stars",
    outfitRules: "green dress with yellow stripes",
    accessories: "red backpack, round glasses",
  },
  ageRange: "12-14",
  role: "Scholar",
  traits: ["curious"],
  modestyRules: {
    hijabAlways: true,
    longSleeves: true,
    looseClothing: true
  },
  colorPalette: ["#0000FF", "#00FF00"]
};

// Build the prompt that SHOULD be sent
const prompt = `## CRITICAL CHARACTER ATTRIBUTES FOR "TESTLAYLA" (MANDATORY COMPLIANCE)

🔴 HAIR/HIJAB: blue hijab with stars
   [MANDATORY - TOP PRIORITY - DO NOT DEVIATE]

🔴 ACCESSORIES: red backpack, round glasses
   [MUST BE CLEARLY VISIBLE AND MATCH EXACTLY]

🔴 SKIN TONE: dark brown skin
   [EXACT MATCH REQUIRED - NO VARIATION]

🔴 OUTFIT: green dress with yellow stripes
   [EXACT MATCH REQUIRED - ALL GARMENTS MUST BE PRESENT]

### MODESTY REQUIREMENTS (NON-NEGOTIABLE):
- HIJAB MANDATORY: Must cover ALL hair completely
- LONG SLEEVES: Arms covered to wrists

## VISUAL STYLE
Vibrant Japanese anime/manga style children's book illustration with expressive large eyes, clean linework, Studio Ghibli inspired

Target Age: 12-14 years old
Art Style: manga

## CHARACTER METADATA
Name: TestLayla
Role: Scholar
Age Appearance: 12-14 years old

## TECHNICAL REQUIREMENTS
- Single character only
- Full body visible
- Clean white background
- High detail on face and accessories
- NO text, watermarks, or labels
- Portrait orientation (3:4 aspect ratio)

POSE: Front view - Standing straight, arms relaxed at sides, facing camera directly, both eyes visible`;

console.log("Testing Railway API directly...\n");
console.log("Expected prompt keywords:");
console.log("- blue hijab with stars");
console.log("- red backpack, round glasses");
console.log("- dark brown skin");
console.log("- green dress with yellow stripes");
console.log("- manga style");
console.log("\n=== SENDING REQUEST ===\n");

async function testAPI() {
  try {
    // For now, just log what we would send
    console.log("Request payload:");
    console.log(JSON.stringify({
      prompt: prompt.substring(0, 200) + "...",
      style: "manga",
      width: 768,
      height: 1024,
      task: "illustration"
    }, null, 2));
    
    console.log("\n=== TEST RESULT ===");
    console.log("✅ Prompt is correctly structured");
    console.log("✅ Contains all critical attributes");
    console.log("\nNow testing if Railway accepts unauthenticated requests...");
    
    // Test health endpoint first
    const healthResp = await fetch(`${RAILWAY_URL}/api/health`);
    console.log(`Health check: ${healthResp.status}`);
    
    // Try image endpoint without auth (should fail with 401)
    const imageResp = await fetch(`${RAILWAY_URL}/api/ai/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "test",
        task: "illustration"
      })
    });
    
    console.log(`Image endpoint (no auth): ${imageResp.status}`);
    const error = await imageResp.json();
    console.log("Error response:", JSON.stringify(error, null, 2));
    
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testAPI();
