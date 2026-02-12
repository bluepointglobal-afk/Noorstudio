// Test what prompt is generated for a character
const character = {
  id: "test-1",
  name: "Layla",
  role: "Young Scholar",
  ageRange: "8-10",
  traits: ["curious", "thoughtful"],
  visualDNA: {
    style: "pixar-3d",
    skinTone: "olive skin",
    hairOrHijab: "pink hijab with floral pattern",
    outfitRules: "orange dress with long sleeves",
    accessories: "small backpack, glasses",
  },
  modestyRules: {
    hijabAlways: true,
    longSleeves: true,
    looseClothing: true,
  },
  colorPalette: ["#E91E63", "#FF9800"],
};

// Simulate buildCriticalAttributesBlock
console.log("=== CRITICAL ATTRIBUTES BLOCK ===");
console.log(`## CRITICAL CHARACTER ATTRIBUTES FOR "${character.name.toUpperCase()}" (MANDATORY COMPLIANCE)`);
console.log("");
console.log(`🔴 HAIR/HIJAB: ${character.visualDNA.hairOrHijab}`);
console.log(`   [MANDATORY - TOP PRIORITY - DO NOT DEVIATE]`);
console.log("");
console.log(`🔴 ACCESSORIES: ${character.visualDNA.accessories}`);
console.log(`   [MUST BE CLEARLY VISIBLE AND MATCH EXACTLY]`);
console.log("");
console.log(`🔴 SKIN TONE: ${character.visualDNA.skinTone}`);
console.log(`   [EXACT MATCH REQUIRED - NO VARIATION]`);
console.log("");
console.log(`🔴 OUTFIT: ${character.visualDNA.outfitRules}`);
console.log(`   [EXACT MATCH REQUIRED - ALL GARMENTS MUST BE PRESENT]`);
console.log("");
console.log("### MODESTY REQUIREMENTS (NON-NEGOTIABLE):");
console.log("- HIJAB MANDATORY: Must cover ALL hair completely, no strands visible");
console.log("- LONG SLEEVES: Arms covered to wrists, no short sleeves");
console.log("- LOOSE FIT: All garments loose-fitting, not form-revealing");
console.log("");
console.log("This is what should be sent to Replicate API");
