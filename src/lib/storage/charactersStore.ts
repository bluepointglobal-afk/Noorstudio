// Character Store - localStorage persistence for Character Studio
// Key: noorstudio.characters.v1

import { AssetStatus, CharacterStyle } from "@/lib/models";
import { generateImage, ImageGenerationRequest } from "@/lib/ai/providers/imageProvider";
import { CharacterSchema } from "@/lib/validation/schemas";
import { validateArrayAndRepair } from "./validation";
import { getNamespacedKey } from "./keys";
import {
  buildCharacterPosePrompt,
  PoseType,
  ALL_POSE_TYPES,
  STYLE_PROMPTS,
  STYLE_TECHNICAL_DETAILS,
} from "@/lib/ai/imagePrompts";
import { buildImprovedCharacterPrompt } from "@/lib/ai/improvedPrompts";
import { createLabeledPoseSheetGrid } from "@/lib/utils/imageGrid";

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

// Number of alternative images to generate per pose
export const ALTERNATIVES_PER_POSE = 3;

// Map pose names to PoseType for prompt building
const POSE_NAME_TO_TYPE: Record<string, PoseType> = {
  "Front": "front",
  "Side": "side",
  "3/4 View": "three-quarter",
  "Walking": "walking",
  "Running": "running",
  "Sitting": "sitting",
  "Reading": "reading",
  "Praying": "praying",
  "Smiling": "smiling",
  "Surprised": "surprised",
  "Pointing": "pointing",
  "Thinking": "thinking",
};

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
 * UPDATED: Now uses Phase 2 improved prompts with better AI compliance.
 */
export function buildCharacterPrompt(character: StoredCharacter | CreateCharacterInput & { name: string; role: string; ageRange: string; traits: string[]; colorPalette: string[] }): { prompt: string; negativePrompt: string } {
  const { visualDNA, name, role, ageRange, traits, colorPalette } = character;

  const stylePrompt = STYLE_PROMPTS[visualDNA.style] || STYLE_PROMPTS["pixar-3d"];
  const styleTechnical = STYLE_TECHNICAL_DETAILS[visualDNA.style] || STYLE_TECHNICAL_DETAILS["pixar-3d"];

  // Build personality/expression guidance from traits
  const traitGuidance = traits.length > 0
    ? `Personality traits: ${traits.join(", ")} - reflect this in facial expression and posture.`
    : "";

  const fullStylePrompt = `${stylePrompt}

${styleTechnical}

${traitGuidance}

This is a REFERENCE IMAGE that will be used for all future illustrations.
The traits established here become LOCKED and IMMUTABLE.

OUTPUT SPECIFICATIONS:
- FRONT-FACING full-body character portrait
- Clean solid color or simple gradient background
- Character centered in frame, well-lit from front
- Warm, friendly, approachable expression
- Professional children's book character quality
- High detail on face and distinguishing features`;

  // Use improved prompt builder that includes critical attributes block
  // and comprehensive negative prompts
  const characterAsStoredCharacter: StoredCharacter = {
    ...(character as any),
    id: (character as any).id || 'temp',
    status: 'draft' as AssetStatus,
    version: 1,
    imageUrl: '',
    poses: [],
    poseSheetGenerated: false,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return buildImprovedCharacterPrompt(
    characterAsStoredCharacter,
    fullStylePrompt,
    'front view, standing, friendly expression'
  );
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
// Pose Prompt Builder (uses imagePrompts.ts)
// ============================================

/**
 * Build a prompt for a specific pose using the imagePrompts module.
 * @param character - The character to generate pose for
 * @param poseName - The pose name (e.g., "Front", "Walking")
 * @param alternativeIndex - Which alternative (0, 1, 2) for seed variation
 */
function buildPosePrompt(
  character: StoredCharacter,
  poseName: string,
  alternativeIndex: number
): string {
  const poseType = POSE_NAME_TO_TYPE[poseName] || "front";

  const result = buildCharacterPosePrompt({
    character,
    pose: poseType,
    alternatives: alternativeIndex + 1, // Used for seed variation hint
  });

  // Add variation hint for different alternatives
  const variationHint = alternativeIndex > 0
    ? `\n\n## VARIATION NOTE\nThis is alternative ${alternativeIndex + 1} of 3. Add subtle variation in pose angle or expression while maintaining exact character identity.`
    : "";

  return result.prompt + variationHint;
}

/**
 * Generate a complete reference sheet with all 12 poses, 3 alternatives each.
 * This is the main function for US-005.
 * @param characterId - Character to generate sheet for
 * @param onProgress - Progress callback (completed, total, poseName)
 * @param seed - Optional seed for consistent generation
 */
export async function generateCharacterReferenceSheet(
  characterId: string,
  onProgress?: (completed: number, total: number, poseName?: string) => void,
  seed?: number
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  // Use character ID hash as default seed for consistency
  const baseSeed = seed ?? character.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const now = new Date().toISOString();
  const updatedPoses: CharacterPose[] = [];
  const totalGenerations = ALL_POSE_TYPES.length * ALTERNATIVES_PER_POSE; // 12 * 3 = 36
  let completedGenerations = 0;

  // Generate each of the 12 poses
  for (let poseIdx = 0; poseIdx < DEFAULT_POSE_NAMES.length; poseIdx++) {
    const poseName = DEFAULT_POSE_NAMES[poseIdx];
    const poseType = POSE_NAME_TO_TYPE[poseName] || "front";
    const alternatives: PoseAlternative[] = [];

    // Generate 3 alternatives for each pose
    for (let altIdx = 0; altIdx < ALTERNATIVES_PER_POSE; altIdx++) {
      onProgress?.(completedGenerations, totalGenerations, `${poseName} (${altIdx + 1}/${ALTERNATIVES_PER_POSE})`);

      try {
        // Get prompt from imagePrompts module
        const posePromptResult = buildCharacterPosePrompt({
          character,
          pose: poseType,
        });

        // Add variation hint for alternatives
        const variationHint = altIdx > 0
          ? `\n\nVARIATION ${altIdx + 1}: Subtle variation in pose angle or expression while maintaining exact character identity.`
          : "";

        const request: ImageGenerationRequest = {
          prompt: posePromptResult.prompt + variationHint,
          references: character.imageUrl ? [character.imageUrl] : undefined,
          style: character.visualDNA.style || "pixar-3d",
          width: 768,
          height: 1024, // Portrait for individual poses
          stage: "illustrations",
          attemptId: `pose-${poseIdx}-alt-${altIdx}-seed-${baseSeed + poseIdx * 10 + altIdx}`,
        };

        const response = await generateImage(request);

        alternatives.push({
          id: altIdx + 1,
          imageUrl: response.imageUrl,
          selected: altIdx === 0, // First alternative selected by default
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Failed to generate pose "${poseName}" alternative ${altIdx + 1}:`, error);
        }
        // Continue with other alternatives even if one fails
      }

      completedGenerations++;
    }

    // Create pose entry with alternatives
    const selectedAlt = alternatives.find(a => a.selected) || alternatives[0];
    updatedPoses.push({
      id: poseIdx + 1,
      name: poseName,
      status: alternatives.length > 0 ? "draft" as AssetStatus : "draft" as AssetStatus,
      imageUrl: selectedAlt?.imageUrl,
      alternatives,
      selectedAlternative: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  onProgress?.(totalGenerations, totalGenerations, "Creating pose sheet grid...");

  // Collect selected pose images for grid stitching
  const selectedPoseUrls = updatedPoses
    .map(pose => pose.imageUrl)
    .filter((url): url is string => !!url);

  const poseNames = updatedPoses.map(pose => pose.name);

  // Create composite 4x3 grid from individual poses
  let poseSheetGridUrl: string | undefined;
  try {
    if (selectedPoseUrls.length >= 6) { // Need at least half the poses for a useful grid
      const gridResult = await createLabeledPoseSheetGrid(selectedPoseUrls, poseNames);
      poseSheetGridUrl = gridResult.dataUrl;
      if (import.meta.env.DEV) {
        console.log(`Created pose sheet grid: ${gridResult.width}x${gridResult.height}`);
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to create pose sheet grid, using thumbnail fallback:", error);
    }
  }

  // Use grid if available, otherwise fall back to first pose thumbnail
  const poseSheetThumbnail = updatedPoses[0]?.alternatives[0]?.imageUrl;
  const finalPoseSheetUrl = poseSheetGridUrl || poseSheetThumbnail;

  onProgress?.(totalGenerations, totalGenerations, "Complete");

  // Create version entry
  const newVersion: CharacterVersion = {
    version: character.version + 1,
    createdAt: now,
    note: "Generated 12-pose reference sheet with 3 alternatives each",
    snapshotPoseSheetImageUrl: finalPoseSheetUrl,
  };

  return updateCharacter(characterId, {
    poses: updatedPoses,
    poseSheetGenerated: true,
    poseSheetUrl: finalPoseSheetUrl,
    version: character.version + 1,
    versions: [...character.versions, newVersion],
    status: "draft", // Reset to draft for review
  });
}

// ============================================
// Pose Management
// ============================================

/**
 * Generate the initial character image (hero/reference image).
 * This is a SINGLE API call that creates the base character design.
 * User must approve this before generating poses.
 * UPDATED: Now uses improved prompts with negative prompt support.
 */
export async function generateCharacterImage(
  characterId: string,
  onProgress?: (status: string) => void
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  onProgress?.("Generating character...");

  try {
    const { prompt, negativePrompt } = buildCharacterPrompt(character);
    
    const request: ImageGenerationRequest = {
      prompt,
      negativePrompt,
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
    // ========== ORIGINAL 3 TEMPLATES ==========
    {
      id: "char-01-amira",
      name: "Amira",
      role: "Curious Explorer",
      ageRange: "6-9",
      status: "approved",
      version: 1,
      imageUrl: "/demo/characters/amira.png",
      traits: ["curious", "brave", "kind", "loves learning"],
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
    },
    {
      id: "char-02-yusuf",
      name: "Yusuf",
      role: "Honest Student",
      ageRange: "10-12",
      status: "approved",
      version: 1,
      imageUrl: "/demo/characters/yusuf.png",
      traits: ["honest", "trustworthy", "loyal", "always tells truth"],
      speakingStyle: "Direct and sincere",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Light brown",
        hairOrHijab: "Short dark hair with striped kufi cap",
        outfitRules: "Blue thobe, comfortable fit",
        accessories: "Small prayer cap",
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
        status: idx < 10 ? "approved" as AssetStatus : "draft" as AssetStatus,
        imageUrl: "/demo/pose-sheets/yusuf-poses.png",
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: true,
      versions: [
        { version: 1, createdAt: "2024-01-20", note: "Initial creation", snapshotPoseSheetImageUrl: "/demo/pose-sheets/yusuf-poses.png" },
      ],
      createdAt: "2024-01-20",
      updatedAt: now,
    },
    {
      id: "char-03-fatima",
      name: "Fatima",
      role: "Creative Artist",
      ageRange: "6-8",
      status: "approved",
      version: 1,
      imageUrl: "/demo/characters/fatima.png",
      traits: ["creative", "artistic", "imaginative", "loves painting"],
      speakingStyle: "Expressive and colorful",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Medium brown",
        hairOrHijab: "Purple hijab with artistic patterns",
        outfitRules: "Colorful dress with modest neckline, paint-splattered sleeves",
        accessories: "Paintbrush, colorful art supplies",
        paletteNotes: "Vibrant purples, teals, and warm tones",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Colorful Islamic artistic style",
      },
      colorPalette: ["#9C27B0", "#26A69A", "#FFC107"],
      poses: DEFAULT_POSE_NAMES.map((name, idx) => ({
        id: idx + 1,
        name,
        status: idx < 10 ? "approved" as AssetStatus : "draft" as AssetStatus,
        imageUrl: "/demo/pose-sheets/fatima-poses.png",
        alternatives: [],
        selectedAlternative: 0,
        updatedAt: now,
      })),
      poseSheetGenerated: true,
      versions: [
        { version: 1, createdAt: "2024-02-01", note: "Initial creation", snapshotPoseSheetImageUrl: "/demo/pose-sheets/fatima-poses.png" },
      ],
      createdAt: "2024-02-01",
      updatedAt: now,
    },
    // ========== NEW 7 TEMPLATES (P2-1 EXPANSION) ==========
    {
      id: "char-04-zainab",
      name: "Zainab",
      role: "Curious Scientist",
      ageRange: "9-11",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["curious", "scientific", "analytical", "loves experiments"],
      speakingStyle: "Inquisitive and logical",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Golden brown",
        hairOrHijab: "Teal hijab with science motifs",
        outfitRules: "White lab coat over modest dress, safety goggles",
        accessories: "Safety goggles, laboratory tools, notebook",
        paletteNotes: "Cool teals and whites with science colors",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Lab-safe modest dress for scientific exploration",
      },
      colorPalette: ["#00897B", "#E0F2F1", "#FFFFFF"],
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "char-05-ibrahim",
      name: "Ibrahim",
      role: "Kind Helper",
      ageRange: "7-9",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["kind", "helpful", "compassionate", "assists elderly"],
      speakingStyle: "Gentle and respectful",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Medium brown",
        hairOrHijab: "Dark hair with green kufi cap",
        outfitRules: "Green tunic with long sleeves, modest fit",
        accessories: "Helping hands (care items for elderly)",
        paletteNotes: "Soft greens and earth tones",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: true,
        looseClothing: true,
        notes: "Simple modest attire for community service",
      },
      colorPalette: ["#4CAF50", "#A5D6A7", "#8D6E63"],
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "char-06-maryam",
      name: "Maryam",
      role: "Brave Adventurer",
      ageRange: "8-10",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["brave", "adventurous", "explorer", "loves nature"],
      speakingStyle: "Excited and confident",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Olive",
        hairOrHijab: "Orange hijab with nature patterns",
        outfitRules: "Hiking outfit with modest long sleeves and pants",
        accessories: "Compass, backpack, binoculars for nature exploration",
        paletteNotes: "Warm oranges and earth tones for adventure",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Adventure-safe modest clothing for outdoor exploration",
      },
      colorPalette: ["#FF6F00", "#FFB74D", "#8D6E63"],
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "char-07-omar",
      name: "Omar",
      role: "Patient Gardener",
      ageRange: "9-11",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["patient", "nurturing", "hardworking", "community-minded"],
      speakingStyle: "Calm and encouraging",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Dark brown",
        hairOrHijab: "Dark curly hair with brown cap",
        outfitRules: "Brown apron over long-sleeved shirt, gardening gloves",
        accessories: "Gardening tools, watering can, seed packets",
        paletteNotes: "Earth tones - browns, greens, natural colors",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: true,
        looseClothing: true,
        notes: "Garden-appropriate modest clothing",
      },
      colorPalette: ["#795548", "#4CAF50", "#D7CCC8"],
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "char-08-aisha",
      name: "Aisha",
      role: "Wise Storyteller",
      ageRange: "11-13",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["wise", "storyteller", "knowledgeable", "shares Islamic wisdom"],
      speakingStyle: "Warm and narrative, teaches through stories",
      visualDNA: {
        style: "watercolor",
        skinTone: "Rich brown",
        hairOrHijab: "Elegant burgundy hijab, mature style",
        outfitRules: "Modest traditional dress, professional appearance",
        accessories: "Book of stories, prayer beads, wise expression",
        paletteNotes: "Rich burgundy and gold tones",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Dignified scholarly modest dress",
      },
      colorPalette: ["#800000", "#D4AF37", "#F5DEB3"],
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "char-09-layla",
      name: "Layla",
      role: "Supportive Friend",
      ageRange: "7-9",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["kind", "supportive", "empathetic", "good listener"],
      speakingStyle: "Warm and understanding",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Light olive",
        hairOrHijab: "Soft pink hijab with gentle patterns",
        outfitRules: "Pastel pink dress with long sleeves",
        accessories: "Friendship bracelets, flower hairclip",
        paletteNotes: "Soft pinks and pastels for warmth",
      },
      modestyRules: {
        hijabAlways: true,
        longSleeves: true,
        looseClothing: true,
        notes: "Gentle modest style with pastel colors",
      },
      colorPalette: ["#F48FB1", "#F8BBD0", "#FFF9C4"],
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "char-10-zaid",
      name: "Zaid",
      role: "Thoughtful Scholar",
      ageRange: "10-12",
      status: "draft",
      version: 1,
      imageUrl: "",
      traits: ["thoughtful", "scholarly", "curious", "reflective"],
      speakingStyle: "Thoughtful and inquisitive",
      visualDNA: {
        style: "pixar-3d",
        skinTone: "Medium olive",
        hairOrHijab: "Dark hair with navy blue cap",
        outfitRules: "Dark blue thobe with modest cut, scholarly appearance",
        accessories: "Glasses, always carrying a book, writing tablet",
        paletteNotes: "Deep blues and grays for studious look",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: true,
        looseClothing: true,
        notes: "Scholarly modest traditional attire",
      },
      colorPalette: ["#1A237E", "#37474F", "#ECEFF1"],
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
      createdAt: now,
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
