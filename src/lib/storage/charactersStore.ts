// Character Store - localStorage persistence for Character Studio
// Key: noorstudio.characters.v1

import { AssetStatus } from "@/lib/models";
import { generateImage, ImageGenerationRequest } from "@/lib/ai/providers/imageProvider";
import { CharacterSchema } from "@/lib/validation/schemas";
import { validateArrayAndRepair } from "./validation";

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return validateArrayAndRepair(STORAGE_KEY, parsed, CharacterSchema);
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));

  return updated;
}

export function deleteCharacter(id: string): boolean {
  const characters = getCharacters();
  const filtered = characters.filter((c) => c.id !== id);

  if (filtered.length === characters.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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
    imageUrl: getRandomDemoImage(), // Will be replaced when pose sheet generates

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
// Pose Generation Prompt Builder
// ============================================

const ALTERNATIVES_PER_POSE = 3;

function buildPosePrompt(character: StoredCharacter, poseName: string, variation: number = 0): string {
  const { visualDNA, modestyRules, name, ageRange, role } = character;

  // Add slight variation hints for different alternatives
  const variationHints = [
    "", // First alternative - standard
    " Add subtle expression variation.", // Second alternative
    " Slight angle or gesture variation.", // Third alternative
  ];

  return `Children's book character pose illustration:
Character: ${name}, ${role}, age ${ageRange}
Pose: ${poseName}
Visual details: ${visualDNA.skinTone} skin, ${visualDNA.hairOrHijab}, ${visualDNA.outfitRules}
Accessories: ${visualDNA.accessories}
Style notes: ${visualDNA.paletteNotes}
${modestyRules.hijabAlways ? "Always wears hijab." : ""}
${modestyRules.longSleeves ? "Long sleeves required." : ""}
${modestyRules.looseClothing ? "Loose, modest clothing." : ""}
Style: Warm, inviting Islamic children's illustration. Consistent character appearance.
IMPORTANT: Generate the SAME character shown in the reference image, in a ${poseName.toLowerCase()} pose.${variationHints[variation] || ""}`;
}

// ============================================
// Pose Management
// ============================================

/**
 * Generate pose sheet for a character using AI image generation.
 * Generates 3 alternatives per pose for user selection.
 * Uses the character's main image as a reference to maintain visual consistency.
 */
export async function generatePoseSheet(
  characterId: string,
  onProgress?: (completed: number, total: number, poseName: string) => void
): Promise<StoredCharacter | null> {
  const character = getCharacter(characterId);
  if (!character) return null;

  const updatedPoses: CharacterPose[] = [];
  const totalGenerations = DEFAULT_POSE_NAMES.length * ALTERNATIVES_PER_POSE;
  let completedGenerations = 0;

  // Generate each pose with 3 alternatives
  for (let idx = 0; idx < DEFAULT_POSE_NAMES.length; idx++) {
    const poseName = DEFAULT_POSE_NAMES[idx];
    const alternatives: PoseAlternative[] = [];

    // Generate 3 alternatives for each pose
    for (let altIdx = 0; altIdx < ALTERNATIVES_PER_POSE; altIdx++) {
      onProgress?.(completedGenerations, totalGenerations, `${poseName} (${altIdx + 1}/${ALTERNATIVES_PER_POSE})`);

      try {
        const request: ImageGenerationRequest = {
          prompt: buildPosePrompt(character, poseName, altIdx),
          references: character.imageUrl ? [character.imageUrl] : undefined,
          style: "watercolor",
          width: 512,
          height: 512,
        };

        const response = await generateImage(request);

        alternatives.push({
          id: altIdx + 1,
          imageUrl: response.imageUrl,
          selected: altIdx === 0, // First alternative is selected by default
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Failed to generate pose "${poseName}" alternative ${altIdx + 1}:`, error);
        }
        // Skip failed alternatives
      }

      completedGenerations++;
    }

    // Use first successful alternative as the main image
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

  return updateCharacter(characterId, {
    poses: updatedPoses,
    poseSheetGenerated: true,
    poseSheetUrl: updatedPoses[0]?.imageUrl,
  });
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
        style: "watercolor",
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
          style: "watercolor",
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
        skinTone: "Medium brown",
        hairOrHijab: "Gray hijab, professional style",
        outfitRules: "Professional modest dress, glasses",
        accessories: "Reading glasses, occasionally a book",
        paletteNotes: "Neutral grays and blues, professional",
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
  localStorage.removeItem(STORAGE_KEY);
}
