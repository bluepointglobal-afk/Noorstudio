// Character Store - localStorage persistence for Character Studio
// Key: noorstudio.characters.v1

import { AssetStatus, CharacterStyle } from "@/lib/models";
import { generateImage, ImageGenerationRequest } from "@/lib/ai/providers/imageProvider";
import { CharacterSchema } from "@/lib/validation/schemas";
import { validateArrayAndRepair } from "./validation";
import { getNamespacedKey } from "./keys";

// ============================================
// Types (Extended for full Character Studio)
// ============================================

export interface PoseAlternative {
  id: number;
  imageUrl: string;
  selected: boolean;
  createdAt: string;
}

export interface CharacterPose {
  id: number;
  name: string;
  status: AssetStatus;
  imageUrl?: string;
  alternatives: PoseAlternative[]; // 3 alternatives per pose
  selectedAlternative: number; // Index of selected alternative (0, 1, or 2)
  updatedAt: string;
}

export interface CharacterVersion {
  version: number;
  createdAt: string;
  note: string;
  snapshotPoseSheetImageUrl?: string;
}

export interface VisualDNA {
  style: CharacterStyle;
  skinTone: string;
  hairOrHijab: string;
  outfitRules: string;
  accessories: string;
  paletteNotes: string;
}

export interface ModestyRules {
  hijabAlways: boolean;
  longSleeves: boolean;
  looseClothing: boolean;
  notes: string;
}

export interface StoredCharacter {
  id: string;
  name: string;
  role: string;
  ageRange: string;
  status: AssetStatus;
  version: number;
  imageUrl: string;

  // Persona
  traits: string[];
  speakingStyle: string;

  // Visual DNA
  visualDNA: VisualDNA;
  modestyRules: ModestyRules;
  colorPalette: string[];

  // Poses (12 items)
  poses: CharacterPose[];
  poseSheetGenerated: boolean;
  poseSheetUrl?: string; // Composite pose sheet image URL for illustration references

  // Versions
  versions: CharacterVersion[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  universeId?: string;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "noorstudio.characters.v1";

export const DEFAULT_POSE_NAMES = [
  "Front",
  "Side",
  "3/4 View",
  "Walking",
  "Running",
  "Sitting",
  "Reading",
  "Praying",
  "Smiling",
  "Surprised",
  "Pointing",
  "Thinking",
] as const;

// Demo character images available
const DEMO_CHARACTER_IMAGES = [
  "/demo/characters/amira.png",
  "/demo/characters/yusuf.png",
  "/demo/characters/fatima.png",
  "/demo/characters/omar.png",
  "/demo/characters/layla.png",
  "/demo/characters/zaid.png",
];

// Demo pose sheet images
const DEMO_POSE_SHEETS = [
  "/demo/pose-sheets/amira-poses.png",
  "/demo/pose-sheets/yusuf-poses.png",
];

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultPoses(): CharacterPose[] {
  const now = new Date().toISOString();
  return DEFAULT_POSE_NAMES.map((name, idx) => ({
    id: idx + 1,
    name,
    status: "draft" as AssetStatus,
    imageUrl: undefined,
    alternatives: [],
    selectedAlternative: 0,
    updatedAt: now,
  }));
}

function getRandomPoseSheetImage(): string {
  return DEMO_POSE_SHEETS[Math.floor(Math.random() * DEMO_POSE_SHEETS.length)];
}

function getRandomDemoImage(): string {
  return DEMO_CHARACTER_IMAGES[Math.floor(Math.random() * DEMO_CHARACTER_IMAGES.length)];
}

// ============================================
// Storage Functions
// ============================================

export function getCharacters(): StoredCharacter[] {
  try {
    const key = getNamespacedKey(STORAGE_KEY);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return validateArrayAndRepair(key, parsed, CharacterSchema);
  } catch {
    if (import.meta.env.DEV) {
      console.error("Failed to parse characters from localStorage");
    }
    return [];
  }
}

export function getCharacter(id: string): StoredCharacter | null {
  const characters = getCharacters();
  return characters.find((c) => c.id === id) || null;
}

export function saveCharacter(character: StoredCharacter): void {
  const characters = getCharacters();
  const existingIndex = characters.findIndex((c) => c.id === character.id);

  if (existingIndex >= 0) {
    characters[existingIndex] = { ...character, updatedAt: new Date().toISOString() };
  } else {
    characters.push(character);
  }

  localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(characters));
}

export function updateCharacter(id: string, partial: Partial<StoredCharacter>): StoredCharacter | null {
  const characters = getCharacters();
  const index = characters.findIndex((c) => c.id === id);

  if (index < 0) return null;

  const updated = {
    ...characters[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  characters[index] = updated;
  localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(characters));

  return updated;
}

export function deleteCharacter(id: string): boolean {
  const characters = getCharacters();
  const filtered = characters.filter((c) => c.id !== id);

  if (filtered.length === characters.length) return false;

  localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(filtered));
  return true;
}

// ============================================
// Character Creation
// ============================================

export interface CreateCharacterInput {
  name: string;
  role: string;
  ageRange: string;
  traits: string[];
  speakingStyle: string;
  visualDNA: VisualDNA;
  modestyRules: ModestyRules;
  colorPalette: string[];
  universeId?: string;
  style?: CharacterStyle; // Optional for backward compatibility in input
}

export function createCharacter(input: CreateCharacterInput): StoredCharacter {
  const now = new Date().toISOString();

  const character: StoredCharacter = {
    id: generateId(),
    name: input.name,
    role: input.role,
    ageRange: input.ageRange,
    status: "draft",
    version: 1,
    imageUrl: "", // Empty until AI generates the character image

    traits: input.traits,
    speakingStyle: input.speakingStyle,

    visualDNA: input.visualDNA,
    modestyRules: input.modestyRules,
    colorPalette: input.colorPalette,

    poses: createDefaultPoses(),
    poseSheetGenerated: false,

    versions: [],

    createdAt: now,
    updatedAt: now,
    universeId: input.universeId,
  };

  saveCharacter(character);
  return character;
}

// ============================================
// Art Style Descriptions for AI Prompts
// ============================================

const STYLE_DESCRIPTIONS: Record<string, string> = {
  "pixar-3d": "Pixar-style 3D CGI render with soft lighting, subsurface scattering on skin, rounded features, expressive eyes, high-quality render like Disney/Pixar animated films",
  "watercolor": "Soft traditional watercolor illustration with gentle color bleeding, organic textures, delicate brushstrokes, dreamy quality like classic children's book art",
  "anime": "Vibrant Japanese anime/manga style with expressive large eyes, dynamic poses, clean linework, cel-shaded coloring, inspired by Studio Ghibli",
  "2d-vector": "Clean modern 2D vector illustration with flat colors, bold outlines, geometric simplification, contemporary children's book aesthetic",
  "paper-cutout": "Textured paper collage style with visible paper grain, layered cut-paper shapes, handcrafted feel, Eric Carle inspired",
};

// ============================================
// Character Generation Prompt Builder
// ============================================

/**
 * Build prompt for initial character generation (front-facing hero image).
 * This creates the base reference that all poses will be based on.
 * ENHANCED with identity anchoring to establish immutable traits.
 */
export function buildCharacterPrompt(character: StoredCharacter | CreateCharacterInput & { name: string; role: string; ageRange: string; traits: string[]; colorPalette: string[] }): string {
  const { visualDNA, modestyRules, name, role, ageRange, traits, colorPalette } = character;

  const styleDescription = STYLE_DESCRIPTIONS[visualDNA.style] || STYLE_DESCRIPTIONS["pixar-3d"];

  // Build personality/expression guidance from traits
  const traitGuidance = traits.length > 0
    ? `Personality: ${traits.join(", ")} - reflect this in facial expression and posture.`
    : "";

  // Build color guidance
  const colorGuidance = colorPalette.length > 0
    ? `Primary color palette for clothing: ${colorPalette.slice(0, 3).join(", ")}`
    : "";

  // Build comprehensive modesty rules with strong enforcement language
  const modestyGuidelines = [
    modestyRules.hijabAlways
      ? "!!! HIJAB MANDATORY !!! - Must wear hijab covering ALL hair completely"
      : "",
    modestyRules.longSleeves ? "Long sleeves REQUIRED - no bare arms visible" : "",
    modestyRules.looseClothing ? "Loose-fitting modest clothing ONLY - no tight or form-fitting" : "",
    modestyRules.notes ? `Custom requirements: ${modestyRules.notes}` : "",
  ].filter(Boolean).join("\n- ");

  return `## CHARACTER DESIGN BRIEF: "${name}"
This is a REFERENCE IMAGE that will be used for all future illustrations.
The traits established here become LOCKED and IMMUTABLE.

=== ART STYLE (LOCKED) ===
${styleDescription}
Art Style ID: ${visualDNA.style}
This exact style will be used in all poses and illustrations.

=== CHARACTER IDENTITY DOCUMENT ===
| Trait | Value | Lock Status |
|-------|-------|-------------|
| Name | ${name} | 🔒 LOCKED |
| Role | ${role} | 🔒 LOCKED |
| Age | ${ageRange} years old | 🔒 LOCKED |
| Skin Tone | ${visualDNA.skinTone} | 🔒 LOCKED |
| Head/Hair | ${visualDNA.hairOrHijab} | 🔒 LOCKED |
| Outfit Style | ${visualDNA.outfitRules} | 🔒 LOCKED |
| Accessories | ${visualDNA.accessories || "None"} | 🔒 LOCKED |
${colorGuidance ? `| Color Palette | ${colorPalette.slice(0, 3).join(", ")} | 🔒 LOCKED |` : ""}

${traitGuidance}

=== MODESTY REQUIREMENTS (MANDATORY - NON-NEGOTIABLE) ===
${modestyGuidelines || "- Modest, culturally appropriate Islamic children's illustration style"}

=== OUTPUT SPECIFICATIONS ===
- FRONT-FACING full-body character portrait
- Clean solid color or simple gradient background
- Character centered in frame, well-lit from front
- Warm, friendly, approachable expression
- Professional children's book character quality
- High detail on face and distinguishing features

=== CRITICAL NO-TEXT RULE ===
!!! DO NOT add any text, labels, names, or words to the image !!!
The character's name is "${name}" but do NOT render it.
This is a VISUAL reference only.

=== QUALITY CHECKLIST ===
Before finalizing, verify:
□ Face is distinctive and memorable
□ Skin tone matches: ${visualDNA.skinTone}
□ Hair/hijab clearly shows: ${visualDNA.hairOrHijab}
${modestyRules.hijabAlways ? "□ Hijab is visible and covers all hair" : ""}
□ Clothing is modest and matches description
□ Art style is clearly ${visualDNA.style}
□ No text or labels anywhere
□ Character is appealing to young Muslim children`.trim();
}


// ============================================
// Pose Sheet Generation Prompt Builder
// ============================================

/**
 * Build prompt for pose sheet generation.
 * This generates all 12 poses in a SINGLE grid image, referencing the approved character.
 * ENHANCED with strict identity lock to prevent character drift across poses.
 */
export function buildPoseSheetPrompt(character: StoredCharacter): string {
  const { visualDNA, modestyRules, name, role, ageRange, traits, colorPalette } = character;

  const styleDescription = STYLE_DESCRIPTIONS[visualDNA.style] || STYLE_DESCRIPTIONS["pixar-3d"];

  // Build personality/expression guidance from traits
  const traitGuidance = traits.length > 0
    ? `Character personality: ${traits.join(", ")}`
    : "";

  // Build color guidance
  const colorGuidance = colorPalette.length > 0
    ? `Color palette for clothing: ${colorPalette.join(", ")}`
    : "";

  // Build comprehensive modesty rules with strong enforcement
  const modestyGuidelines = [
    modestyRules.hijabAlways
      ? "!!! HIJAB MANDATORY !!! - Must cover ALL hair completely in EVERY pose"
      : "",
    modestyRules.longSleeves ? "Long sleeves REQUIRED in every pose" : "",
    modestyRules.looseClothing ? "Loose modest clothing ONLY - no tight/form-fitting" : "",
    modestyRules.notes ? modestyRules.notes : "",
  ].filter(Boolean).join("\n- ");

  const poseList = DEFAULT_POSE_NAMES.map((pose, i) => `${i + 1}. ${pose}`).join("\n");

  return `## CRITICAL: CHARACTER IDENTITY LOCK
!!! THIS CHARACTER'S APPEARANCE IS LOCKED - DO NOT CHANGE ANY FEATURES !!!

Create a CHARACTER POSE SHEET with 12 poses for "${name}".

## IMMUTABLE CHARACTER TRAITS (CANNOT BE CHANGED)
The following traits are LOCKED and MUST appear IDENTICALLY in all 12 poses:
| Trait | Value | Notes |
|-------|-------|-------|
| Name | ${name} | This exact character |
| Age | ${ageRange} years old | Same proportions in all poses |
| Skin | ${visualDNA.skinTone} | EXACT skin tone - no variation |
| Head | ${visualDNA.hairOrHijab} | Same style in every pose |
| Outfit | ${visualDNA.outfitRules} | Consistent clothing design |
| Accessories | ${visualDNA.accessories || "None"} | Same items in every pose |
${colorGuidance ? `| Colors | ${colorPalette.slice(0, 3).join(", ")} | Use these exact colors |` : ""}

${traitGuidance}

## ART STYLE (LOCKED - MUST MATCH REFERENCE)
${styleDescription}

## MODESTY REQUIREMENTS (ENFORCED IN ALL POSES)
${modestyGuidelines || "- Modest Islamic children's illustration style"}

## 12 REQUIRED POSES (4x3 GRID)
${poseList}

## OUTPUT FORMAT SPECIFICATIONS
- SINGLE IMAGE output with 4 columns × 3 rows grid layout
- Each cell contains exactly one pose
- CHARACTER MUST BE IDENTICAL across all 12 poses:
  * Same face structure and features
  * Same body proportions  
  * Same skin tone (${visualDNA.skinTone})
  * Same hair/hijab style (${visualDNA.hairOrHijab})
  * Same clothing colors and design
- Clean white or light gray background in each cell
- Character centered and same scale in every cell
- Consistent lighting across all poses

## NO TEXT RULE
Do NOT add any text, labels, numbers, or words to the image.
Pose names are for your reference only - do not render them.

## QUALITY CHECKLIST (AI MUST VERIFY)
Before finalizing, verify each pose has:
□ Correct face matching reference (same ${name})
□ Correct skin tone (${visualDNA.skinTone})
□ Correct hair/hijab (${visualDNA.hairOrHijab})
□ Correct clothing style and colors
${modestyRules.hijabAlways ? "□ Hijab visible and covering all hair" : ""}
□ Consistent proportions
□ No text or labels`.trim();
}


// ============================================
// Pose Management
// ============================================

/**
 * Generate the initial character image (hero/reference image).
 * This is a SINGLE API call that creates the base character design.
 * User must approve this before generating poses.
 */
export async function generateCharacterImage(
  characterId: string,
  onProgress?: (status: string) => void
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  onProgress?.("Generating character...");

  try {
    const request: ImageGenerationRequest = {
      prompt: buildCharacterPrompt(character),
      style: character.visualDNA.style || "pixar-3d",
      width: 768,
      height: 1024, // Portrait orientation for character
      stage: "illustrations",
    };

    const response = await generateImage(request);

    onProgress?.("Character generated!");

    return updateCharacter(characterId, {
      imageUrl: response.imageUrl,
      status: "draft", // Still draft until user approves
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to generate character image:", error);
    }
    throw error;
  }
}

/**
 * Approve the character design.
 * This marks the character as ready for pose sheet generation.
 */
export function approveCharacterDesign(characterId: string): StoredCharacter | null {
  return updateCharacter(characterId, {
    status: "approved",
  });
}

/**
 * Generate pose sheet for an APPROVED character using AI image generation.
 * This is a SINGLE API call that generates all 12 poses in a grid image.
 * The character's approved image is used as reference for consistency.
 */
export async function generatePoseSheet(
  characterId: string,
  onProgress?: (status: string) => void
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  // Ensure character is approved before generating poses
  if (character.status !== "approved" && !character.imageUrl) {
    throw new Error("Character must have an approved image before generating pose sheet.");
  }

  onProgress?.("Generating 12-pose sheet...");

  try {
    // SINGLE API CALL for the entire pose sheet (12 poses in a grid)
    const request: ImageGenerationRequest = {
      prompt: buildPoseSheetPrompt(character),
      references: character.imageUrl ? [character.imageUrl] : undefined,
      style: character.visualDNA.style || "pixar-3d",
      width: 2048,  // 4 columns
      height: 1536, // 3 rows (4:3 aspect for 4x3 grid)
      stage: "illustrations",
    };

    const response = await generateImage(request);

    onProgress?.("Pose sheet complete!");

    const now = new Date().toISOString();

    // Create pose entries (all from the same grid image)
    const updatedPoses: CharacterPose[] = DEFAULT_POSE_NAMES.map((name, idx) => ({
      id: idx + 1,
      name,
      status: "draft" as AssetStatus,
      imageUrl: response.imageUrl, // All point to same grid image initially
      alternatives: [{
        id: 1,
        imageUrl: response.imageUrl,
        selected: true,
        createdAt: now,
      }],
      selectedAlternative: 0,
      updatedAt: now,
    }));

    return updateCharacter(characterId, {
      poses: updatedPoses,
      poseSheetGenerated: true,
      poseSheetUrl: response.imageUrl,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to generate pose sheet:", error);
    }
    throw error;
  }
}

/**
 * Select a different alternative for a pose.
 */
export function selectPoseAlternative(
  characterId: string,
  poseId: number,
  alternativeIndex: number
): StoredCharacter | null {
  const character = getCharacter(characterId);
  if (!character) return null;

  const now = new Date().toISOString();

  const updatedPoses = character.poses.map((pose) => {
    if (pose.id === poseId && pose.alternatives[alternativeIndex]) {
      // Update alternatives selection
      const updatedAlternatives = pose.alternatives.map((alt, idx) => ({
        ...alt,
        selected: idx === alternativeIndex,
      }));

      return {
        ...pose,
        imageUrl: pose.alternatives[alternativeIndex].imageUrl,
        alternatives: updatedAlternatives,
        selectedAlternative: alternativeIndex,
        status: "draft" as AssetStatus, // Reset to draft when changing
        updatedAt: now,
      };
    }
    return pose;
  });

  return updateCharacter(characterId, { poses: updatedPoses });
}

/**
 * Regenerate a single pose with 3 alternatives using AI.
 */
export async function regeneratePose(
  characterId: string,
  poseId: number,
  onProgress?: (completed: number, total: number) => void
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  const pose = character.poses.find((p) => p.id === poseId);
  if (!pose) return null;

  const now = new Date().toISOString();
  const alternatives: PoseAlternative[] = [];

  // Generate 3 alternatives
  for (let altIdx = 0; altIdx < ALTERNATIVES_PER_POSE; altIdx++) {
    onProgress?.(altIdx, ALTERNATIVES_PER_POSE);

    try {
      const request: ImageGenerationRequest = {
        prompt: buildPosePrompt(character, pose.name, altIdx),
        references: character.imageUrl ? [character.imageUrl] : undefined,
        style: character.visualDNA.style || "pixar-3d",
        width: 512,
        height: 512,
      };

      const response = await generateImage(request);

      alternatives.push({
        id: altIdx + 1,
        imageUrl: response.imageUrl,
        selected: altIdx === 0,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Failed to regenerate pose alternative ${altIdx + 1}:`, error);
      }
    }
  }

  onProgress?.(ALTERNATIVES_PER_POSE, ALTERNATIVES_PER_POSE);

  if (alternatives.length === 0) {
    if (import.meta.env.DEV) {
      console.error(`Failed to regenerate pose: no alternatives generated`);
    }
    return null;
  }

  const updatedPoses = character.poses.map((p) => {
    if (p.id === poseId) {
      return {
        ...p,
        status: "draft" as AssetStatus,
        imageUrl: alternatives[0]?.imageUrl,
        alternatives,
        selectedAlternative: 0,
        updatedAt: now,
      };
    }
    return p;
  });

  return updateCharacter(characterId, { poses: updatedPoses });
}

/**
 * Regenerate all poses with 3 alternatives each using AI.
 */
export async function regenerateAllPoses(
  characterId: string,
  onProgress?: (completed: number, total: number, poseName: string) => void
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  const now = new Date().toISOString();
  const updatedPoses: CharacterPose[] = [];
  const totalGenerations = DEFAULT_POSE_NAMES.length * ALTERNATIVES_PER_POSE;
  let completedGenerations = 0;

  // Generate each pose with 3 alternatives
  for (let idx = 0; idx < DEFAULT_POSE_NAMES.length; idx++) {
    const poseName = DEFAULT_POSE_NAMES[idx];
    const alternatives: PoseAlternative[] = [];

    for (let altIdx = 0; altIdx < ALTERNATIVES_PER_POSE; altIdx++) {
      onProgress?.(completedGenerations, totalGenerations, `${poseName} (${altIdx + 1}/${ALTERNATIVES_PER_POSE})`);

      try {
        const request: ImageGenerationRequest = {
          prompt: buildPosePrompt(character, poseName, altIdx),
          references: character.imageUrl ? [character.imageUrl] : undefined,
          style: character.visualDNA.style || "pixar-3d",
          width: 512,
          height: 512,
        };

        const response = await generateImage(request);

        alternatives.push({
          id: altIdx + 1,
          imageUrl: response.imageUrl,
          selected: altIdx === 0,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Failed to regenerate pose "${poseName}" alternative ${altIdx + 1}:`, error);
        }
      }

      completedGenerations++;
    }

    const selectedAlt = alternatives.find(a => a.selected) || alternatives[0];

    updatedPoses.push({
      id: idx + 1,
      name: poseName,
      status: "draft" as AssetStatus,
      imageUrl: selectedAlt?.imageUrl,
      alternatives,
      selectedAlternative: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  onProgress?.(totalGenerations, totalGenerations, "Complete");

  // Create new version
  const newVersion: CharacterVersion = {
    version: character.version + 1,
    createdAt: now,
    note: "Regenerated all poses",
    snapshotPoseSheetImageUrl: updatedPoses[0]?.imageUrl,
  };

  return updateCharacter(characterId, {
    poses: updatedPoses,
    poseSheetUrl: updatedPoses[0]?.imageUrl,
    version: character.version + 1,
    versions: [...character.versions, newVersion],
    status: "draft",
  });
}

export function approvePose(characterId: string, poseId: number): StoredCharacter | null {
  const character = getCharacter(characterId);
  if (!character) return null;

  const now = new Date().toISOString();

  const updatedPoses = character.poses.map((pose) => {
    if (pose.id === poseId) {
      return {
        ...pose,
        status: "approved" as AssetStatus,
        updatedAt: now,
      };
    }
    return pose;
  });

  // Check if character should auto-update status
  const approvedCount = updatedPoses.filter((p) => p.status === "approved" || p.status === "locked").length;
  let newStatus = character.status;
  if (approvedCount >= 10 && character.status === "draft") {
    newStatus = "approved";
  }

  return updateCharacter(characterId, {
    poses: updatedPoses,
    status: newStatus,
  });
}

export function unappprovePose(characterId: string, poseId: number): StoredCharacter | null {
  const character = getCharacter(characterId);
  if (!character) return null;

  const now = new Date().toISOString();

  const updatedPoses = character.poses.map((pose) => {
    if (pose.id === poseId && pose.status === "approved") {
      return {
        ...pose,
        status: "draft" as AssetStatus,
        updatedAt: now,
      };
    }
    return pose;
  });

  return updateCharacter(characterId, { poses: updatedPoses });
}

// ============================================
// Character Locking & Versioning
// ============================================

export function lockCharacter(characterId: string): StoredCharacter | null {
  const character = getCharacter(characterId);
  if (!character) return null;

  const approvedCount = character.poses.filter((p) => p.status === "approved" || p.status === "locked").length;
  if (approvedCount < 10) return null; // Can't lock without 10+ approved poses

  const now = new Date().toISOString();

  // Lock all poses
  const lockedPoses = character.poses.map((pose) => ({
    ...pose,
    status: pose.status === "approved" ? "locked" as AssetStatus : pose.status,
  }));

  // Create version entry
  const versionEntry: CharacterVersion = {
    version: character.version,
    createdAt: now,
    note: `Locked version ${character.version}`,
    snapshotPoseSheetImageUrl: character.poses[0]?.imageUrl,
  };

  return updateCharacter(characterId, {
    status: "locked",
    poses: lockedPoses,
    versions: [...character.versions, versionEntry],
  });
}

export function unlockCharacter(characterId: string): StoredCharacter | null {
  const character = getCharacter(characterId);
  if (!character || character.status !== "locked") return null;

  const now = new Date().toISOString();

  // Unlock all poses back to approved
  const unlockedPoses = character.poses.map((pose) => ({
    ...pose,
    status: pose.status === "locked" ? "approved" as AssetStatus : pose.status,
  }));

  return updateCharacter(characterId, {
    status: "approved",
    poses: unlockedPoses,
    updatedAt: now,
  });
}

export function createNewVersion(characterId: string): StoredCharacter | null {
  const character = getCharacter(characterId);
  if (!character) return null;

  const now = new Date().toISOString();
  const newVersion = character.version + 1;

  // Create version entry for previous version
  const versionEntry: CharacterVersion = {
    version: character.version,
    createdAt: now,
    note: `Archived before creating v${newVersion}`,
    snapshotPoseSheetImageUrl: character.poses[0]?.imageUrl,
  };

  // Reset poses to draft for new version
  const resetPoses = character.poses.map((pose) => ({
    ...pose,
    status: "draft" as AssetStatus,
    updatedAt: now,
  }));

  return updateCharacter(characterId, {
    version: newVersion,
    status: "draft",
    poses: resetPoses,
    versions: [...character.versions, versionEntry],
  });
}

// ============================================
// Demo Data Seeding
// ============================================

export function seedDemoCharactersIfEmpty(): void {
  const existing = getCharacters();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const demoCharacters: StoredCharacter[] = [
    {
      id: "char-demo-1",
      name: "Amira",
      role: "Curious Explorer",
      ageRange: "6-9",
      status: "approved",
      version: 2,
      imageUrl: "/demo/characters/amira.png",
      traits: ["curious", "brave", "kind"],
      speakingStyle: "Enthusiastic and questioning",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Warm olive",
        hairOrHijab: "Pink hijab with floral pattern",
        outfitRules: "Bright orange dress with modest neckline",
        accessories: "Small backpack, sparkly shoes",
        paletteNotes: "Warm pinks and oranges, playful colors",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Full coverage, bright colors allowed",
      },
      colorPalette: ["#E91E63", "#FF9800", "#FFF3E0"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: idx < 10 ? "approved" as AssetStatus : "draft" as AssetStatus,
        imageUrl: "/demo/pose-sheets/amira-poses.png",
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: true,
      versions: [
        { version: 1, createdAt: "2024-01-15", note: "Initial creation", snapshotPoseSheetImageUrl: "/demo/pose-sheets/amira-poses.png" },
      ],
      createdAt: "2024-01-15",
      updatedAt: now,
      universeId: "universe-1",
    },
    {
      id: "char-demo-2",
      name: "Yusuf",
      role: "Kind Helper",
      ageRange: "5-7",
      status: "locked",
      version: 1,
      imageUrl: "/demo/characters/yusuf.png",
      traits: ["helpful", "gentle", "patient"],
      speakingStyle: "Soft and encouraging",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Light brown",
        hairOrHijab: "Short dark hair with striped kufi cap",
        outfitRules: "Blue thobe, comfortable fit",
        accessories: "None",
        paletteNotes: "Cool blues and whites",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: true,
        looseClothing: true,
        notes: "Traditional modest attire for boys",
      },
      colorPalette: ["#2196F3", "#BBDEFB", "#FFFFFF"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: "locked" as AssetStatus,
        imageUrl: "/demo/pose-sheets/yusuf-poses.png",
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: true,
      versions: [
        { version: 1, createdAt: "2024-01-20", note: "Locked for production", snapshotPoseSheetImageUrl: "/demo/pose-sheets/yusuf-poses.png" },
      ],
      createdAt: "2024-01-20",
      updatedAt: now,
      universeId: "universe-2",
    },
    {
      id: "char-demo-3",
      name: "Fatima",
      role: "Wise Teacher",
      ageRange: "8-12",
      status: "approved",
      version: 3,
      imageUrl: "/demo/characters/fatima.png",
      traits: ["wise", "patient", "nurturing"],
      speakingStyle: "Calm and instructive",
      visualDNA: {
        style: "watercolor",
        skinTone: "Medium brown",
        hairOrHijab: "Gray hijab, professional style",
        outfitRules: "Professional modest dress, glasses",
        accessories: "Reading glasses, occasionally a book",
        paletteNotes: "Calm purples and grays",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Professional modest dress",
      },
      colorPalette: ["#607D8B", "#455A64", "#ECEFF1"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: idx < 11 ? "approved" as AssetStatus : "draft" as AssetStatus,
        imageUrl: "/demo/pose-sheets/amira-poses.png",
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: true,
      versions: [
        { version: 1, createdAt: "2024-02-01", note: "Initial creation" },
        { version: 2, createdAt: "2024-02-10", note: "Updated outfit colors" },
      ],
      createdAt: "2024-02-01",
      updatedAt: now,
    },
    {
      id: "char-demo-4",
      name: "Omar",
      role: "Brave Friend",
      ageRange: "6-9",
      status: "draft",
      version: 1,
      imageUrl: "/demo/characters/omar.png",
      traits: ["brave", "loyal", "confident"],
      speakingStyle: "Bold and supportive",
      visualDNA: {
        skinTone: "Dark brown",
        hairOrHijab: "Short curly hair",
        outfitRules: "Vest and scarf, athletic build",
        accessories: "Sports watch",
        paletteNotes: "Earth tones, brown and tan",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: false,
        looseClothing: true,
        notes: "Casual modest clothing",
      },
      colorPalette: ["#795548", "#BCAAA4", "#EFEBE9"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: idx < 5 ? "approved" as AssetStatus : "draft" as AssetStatus,
        imageUrl: "/demo/pose-sheets/yusuf-poses.png",
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: true,
      versions: [],
      createdAt: "2024-02-10",
      updatedAt: now,
    },
    {
      id: "char-demo-5",
      name: "Layla",
      role: "Creative Artist",
      ageRange: "7-10",
      status: "draft",
      version: 1,
      imageUrl: "/demo/characters/layla.png",
      traits: ["creative", "imaginative", "expressive"],
      speakingStyle: "Dreamy and descriptive",
      visualDNA: {
        skinTone: "Light olive",
        hairOrHijab: "Purple hijab with artistic patterns",
        outfitRules: "Colorful dress with paint splashes",
        accessories: "Paintbrush, art supplies",
        paletteNotes: "Vibrant purples and teals",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Colorful modest attire",
      },
      colorPalette: ["#9C27B0", "#26A69A", "#FFC107"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: "draft" as AssetStatus,
        imageUrl: undefined,
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: false,
      versions: [],
      createdAt: "2024-02-15",
      updatedAt: now,
    },
    {
      id: "char-demo-6",
      name: "Zaid",
      role: "Thoughtful Student",
      ageRange: "9-12",
      status: "draft",
      version: 1,
      imageUrl: "/demo/characters/zaid.png",
      traits: ["studious", "thoughtful", "curious"],
      speakingStyle: "Reflective and inquisitive",
      visualDNA: {
        skinTone: "Medium olive",
        hairOrHijab: "Dark hair, glasses",
        outfitRules: "Dark thobe, scholarly appearance",
        accessories: "Glasses, always holding a book",
        paletteNotes: "Dark blues and grays",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: true,
        looseClothing: true,
        notes: "Scholarly modest attire",
      },
      colorPalette: ["#37474F", "#263238", "#ECEFF1"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: "draft" as AssetStatus,
        imageUrl: undefined,
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: false,
      versions: [],
      createdAt: "2024-03-01",
      updatedAt: now,
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoCharacters));
}

// ============================================
// Utility Functions
// ============================================

export function getApprovedPoseCount(character: StoredCharacter): number {
  return character.poses.filter((p) => p.status === "approved" || p.status === "locked").length;
}

export function canLockCharacter(character: StoredCharacter): boolean {
  return getApprovedPoseCount(character) >= 10 && character.status !== "locked";
}

export function clearAllCharacters(): void {
  localStorage.removeItem(getNamespacedKey(STORAGE_KEY));
}
