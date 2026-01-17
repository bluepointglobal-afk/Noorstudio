// Image Prompt Construction for NanoBanana
// Builds deterministic prompts for illustrations and covers
// NOW WITH COMPLIANCE GUARD INTEGRATION for reduced hallucinations

import { StoredProject } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import {
  buildCoverComplianceRules,
  buildIllustrationComplianceRules,
  enforceComplianceCoverPrompt,
  enforceComplianceIllustrationPrompt,
  buildCharacterIdentityBlock,
  buildCoverNegativePrompt,
  buildIllustrationNegativePrompt,
  preflightCoverGeneration,
  validateSceneCharacters,
} from "./complianceGuard";

// ============================================
// Types
// ============================================

export interface IllustrationPromptInput {
  project: StoredProject;
  chapterNumber: number;
  sceneDescription: string;
  characters: StoredCharacter[];
  kbSummary: KBRulesSummary | null;
}

const STYLE_PROMPTS: Record<string, string> = {
  "pixar-3d": "Pixar-style 3D children's book illustration with soft lighting, rounded features, expressive eyes, like Disney/Pixar films",
  "watercolor": "Soft, varying watercolor style children's book illustration with gentle color bleeding, organic textures, classic children's book art",
  "anime": "Vibrant Anime/Manga style children's book illustration with expressive large eyes, clean linework, Studio Ghibli inspired",
  "2d-vector": "Clean, modern 2D vector art children's book illustration with flat colors, bold outlines, contemporary aesthetic",
  "paper-cutout": "Textured paper cutout collage style children's book illustration with visible paper grain, Eric Carle inspired",
};

// Extended style descriptions for better consistency
const STYLE_TECHNICAL_DETAILS: Record<string, string> = {
  "pixar-3d": `
- 3D CGI rendering with subsurface scattering on skin
- Soft global illumination with warm fill lights
- Rounded, appealing character proportions
- Large expressive eyes with catchlights
- Smooth skin textures without pores
- Cloth simulation for natural fabric draping`,
  "watercolor": `
- Traditional wet-on-wet watercolor technique
- Visible paper texture beneath colors
- Soft color gradients with natural bleeding
- Delicate linework for details
- White of paper showing through in highlights
- Organic, hand-painted feel`,
  "anime": `
- Clean vector-like linework
- Cel-shaded coloring with defined shadows
- Large expressive eyes with detailed iris
- Dynamic hair with individual strand groups
- Simplified nose and mouth
- Bright, saturated colors`,
  "2d-vector": `
- Flat color fills without gradients
- Bold consistent outline weight
- Geometric shape simplification
- Limited color palette per element
- Clean edges without anti-aliasing artifacts
- Modern minimalist aesthetic`,
  "paper-cutout": `
- Visible paper texture and grain
- Layered cut-paper effect with shadows
- Hand-torn or scissors-cut edges
- Textured fills suggesting craft paper
- Collage-style composition
- Tactile, handmade appearance`,
};

export interface CoverPromptInput {
  project: StoredProject;
  characters: StoredCharacter[];
  kbSummary: KBRulesSummary | null;
  coverType: "front" | "back";
  moral?: string;
  authorName?: string;
}

export interface ImagePromptResult {
  prompt: string;
  references: string[];
  style: string;
  negativePrompt: string;
  complianceWarnings?: string[];
  complianceErrors?: string[];
}

// ============================================
// Character Description Builder (Enhanced)
// ============================================

/**
 * Build a detailed, immutable character description.
 * This description captures traits that MUST remain consistent.
 */
function buildCharacterDescription(
  char: StoredCharacter,
  index: number,
  total: number
): string {
  const parts: string[] = [];

  // Character identifier for multi-character scenes
  if (total > 1) {
    parts.push(`[CHARACTER ${index + 1}/${total}]`);
  }

  // Name and role
  parts.push(`${char.name} (${char.role})`);

  // Age appearance
  if (char.ageRange) {
    parts.push(`Age appearance: ${char.ageRange} years old`);
  }

  // IMMUTABLE Visual DNA - these traits are locked
  if (char.visualDNA) {
    if (char.visualDNA.skinTone) {
      parts.push(`SKIN: ${char.visualDNA.skinTone} (EXACT - do not change)`);
    }
    if (char.visualDNA.hairOrHijab) {
      parts.push(`HEAD/HAIR: ${char.visualDNA.hairOrHijab} (EXACT - do not change)`);
    }
    if (char.visualDNA.outfitRules) {
      parts.push(`OUTFIT: ${char.visualDNA.outfitRules}`);
    }
    if (char.visualDNA.accessories) {
      parts.push(`ACCESSORIES: ${char.visualDNA.accessories}`);
    }
  }

  // Modesty requirements - MANDATORY
  if (char.modestyRules) {
    const modestyParts: string[] = [];
    if (char.modestyRules.hijabAlways) {
      modestyParts.push("HIJAB MANDATORY - must cover all hair completely");
    }
    if (char.modestyRules.longSleeves) {
      modestyParts.push("long sleeves required");
    }
    if (char.modestyRules.looseClothing) {
      modestyParts.push("loose modest clothing only");
    }
    if (modestyParts.length > 0) {
      parts.push(`MODESTY: ${modestyParts.join(", ")}`);
    }
  }

  // Color palette
  if (char.colorPalette && char.colorPalette.length > 0) {
    parts.push(`Colors: ${char.colorPalette.slice(0, 3).join(", ")}`);
  }

  return parts.join("\n   ");
}

/**
 * Build a character differentiation guide for multi-character scenes.
 */
function buildMultiCharacterGuide(characters: StoredCharacter[]): string {
  if (characters.length <= 1) return "";

  const guide = [
    "\n## MULTI-CHARACTER DIFFERENTIATION GUIDE",
    "CRITICAL: Each character MUST be clearly distinguishable. Do NOT blend features.",
    "",
  ];

  // Create comparison table
  guide.push("| Character | Skin | Hair/Hijab | Distinguishing Feature |");
  guide.push("|-----------|------|------------|------------------------|");

  for (const char of characters) {
    const skin = char.visualDNA?.skinTone || "N/A";
    const hair = char.visualDNA?.hairOrHijab || "N/A";
    const feature = char.visualDNA?.accessories || char.role || "N/A";
    guide.push(`| ${char.name} | ${skin} | ${hair} | ${feature} |`);
  }

  guide.push("");
  guide.push("Relative positions: Older/taller characters should be proportionally larger.");
  guide.push("Each character must be recognizable from their reference images.");

  return guide.join("\n");
}

// ============================================
// Islamic Modesty Constraints (Enhanced)
// ============================================

function buildModestyConstraints(
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null
): string {
  const constraints: string[] = [
    "MANDATORY MODESTY GUIDELINES:",
    "- All clothing must be loose-fitting and non-revealing",
    "- No tight or form-fitting clothes on any character",
    "- Appropriate Islamic dress code for all characters",
  ];

  // Check if any character requires hijab
  const hijabRequired = characters.some((c) => c.modestyRules?.hijabAlways);
  if (hijabRequired) {
    constraints.push("- Characters with hijab: MUST have hijab visible covering ALL hair in EVERY frame");
  }

  // Add KB-specific rules
  if (kbSummary?.illustrationRules && kbSummary.illustrationRules.length > 0) {
    constraints.push("");
    constraints.push("KNOWLEDGE BASE ILLUSTRATION RULES:");
    constraints.push(...kbSummary.illustrationRules.map((r) => `- ${r}`));
  }

  return constraints.join("\n");
}

// ============================================
// Illustration Prompt Builder (Enhanced)
// ============================================

export function buildIllustrationPrompt(input: IllustrationPromptInput): ImagePromptResult {
  const { project, chapterNumber, sceneDescription, characters, kbSummary } = input;

  // Pre-validate scene characters
  const validation = validateSceneCharacters(characters, sceneDescription);

  // Build compliance rules
  const complianceRules = buildIllustrationComplianceRules({
    project,
    characters,
    kbSummary,
  });

  // Character descriptions with full detail
  const characterDescriptions = characters
    .map((char, idx) => buildCharacterDescription(char, idx, characters.length))
    .join("\n\n   ");

  // Determine style from characters (use first character's style or default)
  const primaryStyleId = characters[0]?.visualDNA?.style || "pixar-3d";
  const stylePrompt = STYLE_PROMPTS[primaryStyleId] || STYLE_PROMPTS["pixar-3d"];
  const styleTechnical = STYLE_TECHNICAL_DETAILS[primaryStyleId] || STYLE_TECHNICAL_DETAILS["pixar-3d"];

  // Build multi-character guide if needed
  const multiCharGuide = buildMultiCharacterGuide(characters);

  // Build the main prompt with compliance enhancement
  const basePrompt = `${stylePrompt}
Target audience: Ages ${project.ageRange}

## SCENE DESCRIPTION
Chapter ${chapterNumber}: "${sceneDescription}"

## CHARACTERS IN THIS SCENE
${characterDescriptions}
${multiCharGuide}

## ART STYLE TECHNICAL REQUIREMENTS
Style: ${primaryStyleId}
${styleTechnical}

## SCENE COMPOSITION
- Warm, inviting lighting with soft ambient fill
- Soft shadows that don't obscure faces
- Vibrant but harmonious colors
- Child-friendly, approachable expressions
- Clear focal point with all characters visible
- Appropriate setting that matches the story

## CULTURAL & MODESTY REQUIREMENTS
${buildModestyConstraints(characters, kbSummary)}

## TECHNICAL REQUIREMENTS
- High detail on character faces (eyes, expressions)
- Consistent character design matching reference images
- NO text, words, or letters anywhere in image
- Professional children's book quality
- 4:3 landscape orientation for spread layout`;

  // Apply compliance enforcement
  const complianceResult = enforceComplianceIllustrationPrompt(
    basePrompt,
    complianceRules,
    characters.map((c) => c.id)
  );

  // Gather pose sheet references (priority) and fallback to character images
  const references: string[] = [];
  for (const char of characters) {
    if (char.poseSheetUrl) {
      references.push(char.poseSheetUrl);
    } else if (char.imageUrl) {
      references.push(char.imageUrl);
    }
  }

  return {
    prompt: complianceResult.correctedPrompt || basePrompt,
    references,
    style: primaryStyleId,
    negativePrompt: buildIllustrationNegativePrompt(),
    complianceWarnings: [
      ...complianceResult.warnings,
      ...validation.issues,
    ],
    complianceErrors: complianceResult.errors,
  };
}

// ============================================
// Cover Prompt Builder (Enhanced with Compliance)
// ============================================

export function buildCoverPrompt(input: CoverPromptInput): ImagePromptResult {
  const { project, characters, kbSummary, coverType, moral, authorName } = input;

  // Run preflight check
  const preflight = preflightCoverGeneration(
    { project, characters, kbSummary },
    coverType
  );

  // Build compliance rules
  const complianceRules = buildCoverComplianceRules({
    project,
    characters,
    kbSummary,
  });

  // Character descriptions for main characters only (max 2 for cover clarity)
  const mainCharacters = characters.slice(0, 2);
  const characterDescriptions = mainCharacters
    .map((char, idx) => buildCharacterDescription(char, idx, mainCharacters.length))
    .join("\n\n   ");

  // Get style info
  const primaryStyleId = characters[0]?.visualDNA?.style || "pixar-3d";
  const stylePrompt = STYLE_PROMPTS[primaryStyleId] || STYLE_PROMPTS["pixar-3d"];
  const styleTechnical = STYLE_TECHNICAL_DETAILS[primaryStyleId] || STYLE_TECHNICAL_DETAILS["pixar-3d"];

  let basePrompt: string;

  if (coverType === "front") {
    basePrompt = `CHILDREN'S BOOK FRONT COVER ILLUSTRATION
${stylePrompt}
Target audience: Ages ${project.ageRange}

## COVER METADATA (FOR REFERENCE ONLY - DO NOT RENDER AS TEXT)
Title: "${project.title}" - DO NOT RENDER THIS TEXT
${authorName ? `Author: "${authorName}" - DO NOT RENDER THIS TEXT` : ""}
Age Range: ${project.ageRange} - DO NOT RENDER THIS TEXT

## MAIN CHARACTERS FOR COVER
${characterDescriptions}

## FRONT COVER COMPOSITION REQUIREMENTS
- Characters prominently featured in center/foreground
- Eye-catching, dynamic pose suggesting adventure/emotion
- Warm, inviting atmosphere with appealing colors
- BLANK SPACE at TOP (15-20% of image) for title - LEAVE EMPTY, DO NOT FILL
- BLANK SPACE at BOTTOM (10% of image) for author name - LEAVE EMPTY
- Vibrant, child-appealing color palette
- Setting hint: ${project.setting || "Islamic/Middle Eastern inspired environment"}

## ART STYLE (MUST MATCH EXACTLY)
Style: ${primaryStyleId}
${styleTechnical}

## CULTURAL & MODESTY REQUIREMENTS
${buildModestyConstraints(mainCharacters, kbSummary)}

## CRITICAL OUTPUT REQUIREMENTS
- Vertical PORTRAIT orientation (2:3 aspect ratio, e.g., 1024x1536)
- NO TEXT: Do not generate any text, letters, words, or symbols
- NO TITLE: Leave designated space blank for post-processing
- Professional children's book cover quality
- Characters MUST match their reference images exactly
- Background should complement but not overpower characters`;
  } else {
    // Back cover
    basePrompt = `CHILDREN'S BOOK BACK COVER ILLUSTRATION
${stylePrompt}
Target audience: Ages ${project.ageRange}

## BOOK THEME (FOR COMPOSITION REFERENCE ONLY - DO NOT RENDER AS TEXT)
Theme/Moral: "${moral || project.learningObjective || "Islamic values and kindness"}"

## BACK COVER COMPOSITION REQUIREMENTS
- Softer, complementary scene to front cover
- Can show secondary moment, setting, or atmospheric scene
- LARGE BLANK SPACE in CENTER (40-50% of image) for synopsis text - CRITICAL
- Cohesive visual style matching front cover exactly
- May include subtle environmental elements
- Calmer, more reflective mood than front

## ART STYLE (MUST MATCH FRONT COVER EXACTLY)
Style: ${primaryStyleId}
${styleTechnical}

## CULTURAL & MODESTY REQUIREMENTS
${buildModestyConstraints(mainCharacters, kbSummary)}

## CRITICAL OUTPUT REQUIREMENTS  
- Vertical PORTRAIT orientation (2:3 aspect ratio, e.g., 1024x1536)
- NO TEXT: Do not generate any text, letters, words, or symbols
- LARGE BLANK CENTER AREA: Leave space for synopsis overlay
- NO barcode placeholders - these are added in print prep
- Professional back cover quality
- Visual continuity with front cover`;
  }

  // Apply compliance enforcement
  const complianceResult = enforceComplianceCoverPrompt(
    basePrompt,
    complianceRules,
    coverType
  );

  // Gather references
  const references = mainCharacters
    .filter((c) => c.poseSheetUrl || c.imageUrl)
    .map((c) => c.poseSheetUrl || c.imageUrl)
    .filter((url): url is string => !!url);

  return {
    prompt: complianceResult.correctedPrompt || basePrompt,
    references,
    style: primaryStyleId,
    negativePrompt: buildCoverNegativePrompt(),
    complianceWarnings: [
      ...complianceResult.warnings,
      ...preflight.warnings,
    ],
    complianceErrors: [
      ...complianceResult.errors,
      ...preflight.blockers,
    ],
  };
}

// ============================================
// Character Pose Types & Templates
// ============================================

export type PoseType =
  | "front"
  | "side"
  | "three-quarter"
  | "walking"
  | "running"
  | "sitting"
  | "reading"
  | "praying"
  | "smiling"
  | "surprised"
  | "pointing"
  | "thinking";

export const ALL_POSE_TYPES: PoseType[] = [
  "front",
  "side",
  "three-quarter",
  "walking",
  "running",
  "sitting",
  "reading",
  "praying",
  "smiling",
  "surprised",
  "pointing",
  "thinking",
];

const POSE_DESCRIPTIONS: Record<PoseType, { name: string; description: string; bodyPosition: string }> = {
  front: {
    name: "Front View",
    description: "Character facing directly forward, neutral standing pose",
    bodyPosition: "Standing straight, arms relaxed at sides, facing camera directly, both eyes visible",
  },
  side: {
    name: "Side Profile",
    description: "Character in complete side profile view",
    bodyPosition: "Standing in full side profile, one arm visible, looking forward, profile of face",
  },
  "three-quarter": {
    name: "3/4 View",
    description: "Character at three-quarter angle, slight turn from front",
    bodyPosition: "Body turned 45 degrees from front, both eyes visible, slight head tilt, natural stance",
  },
  walking: {
    name: "Walking",
    description: "Character mid-stride in a natural walking motion",
    bodyPosition: "One leg forward, opposite arm forward, natural stride, looking ahead with purpose",
  },
  running: {
    name: "Running",
    description: "Character in dynamic running pose",
    bodyPosition: "Legs in mid-run stride, arms bent at elbows pumping, body leaning slightly forward, joyful expression",
  },
  sitting: {
    name: "Sitting",
    description: "Character seated in a comfortable position",
    bodyPosition: "Seated cross-legged or on knees (Islamic sitting), hands resting, relaxed posture, attentive expression",
  },
  reading: {
    name: "Reading",
    description: "Character engaged in reading a book or Quran",
    bodyPosition: "Holding an open book at comfortable reading distance, eyes focused on book, peaceful expression, proper posture",
  },
  praying: {
    name: "Praying",
    description: "Character in respectful prayer position",
    bodyPosition: "Hands raised in dua (supplication), eyes looking down or closed, peaceful serene expression, humble posture",
  },
  smiling: {
    name: "Smiling",
    description: "Character with warm, genuine smile",
    bodyPosition: "Front-facing or slight turn, warm genuine smile showing happiness, eyes crinkled with joy, welcoming posture",
  },
  surprised: {
    name: "Surprised",
    description: "Character showing pleasant surprise",
    bodyPosition: "Eyes wide with wonder, mouth slightly open, hands up near chest, body language showing delightful surprise",
  },
  pointing: {
    name: "Pointing",
    description: "Character pointing to indicate direction or object",
    bodyPosition: "One arm extended pointing forward/to side, other arm relaxed, looking in direction of pointing, helpful expression",
  },
  thinking: {
    name: "Thinking",
    description: "Character in thoughtful contemplation",
    bodyPosition: "Hand touching chin or temple, eyes looking up or to side, thoughtful expression, body in relaxed stance",
  },
};

export interface CharacterPosePromptInput {
  character: StoredCharacter;
  pose: PoseType;
  alternatives?: number; // Number of alternatives to suggest (default 3)
}

export interface CharacterPosePromptResult {
  prompt: string;
  negativePrompt: string;
  style: string;
  poseType: PoseType;
  poseName: string;
}

/**
 * Build a prompt for generating a specific character pose.
 * Used for creating the 12-pose reference sheet.
 */
export function buildCharacterPosePrompt(input: CharacterPosePromptInput): CharacterPosePromptResult {
  const { character, pose } = input;
  const poseInfo = POSE_DESCRIPTIONS[pose];

  // Get style info
  const styleId = character.visualDNA?.style || "pixar-3d";
  const stylePrompt = STYLE_PROMPTS[styleId] || STYLE_PROMPTS["pixar-3d"];
  const styleTechnical = STYLE_TECHNICAL_DETAILS[styleId] || STYLE_TECHNICAL_DETAILS["pixar-3d"];

  // Build character visual DNA block
  const visualDNABlock: string[] = [];
  if (character.visualDNA) {
    if (character.visualDNA.skinTone) {
      visualDNABlock.push(`SKIN TONE: ${character.visualDNA.skinTone} (EXACT - maintain consistency)`);
    }
    if (character.visualDNA.hairOrHijab) {
      visualDNABlock.push(`HEAD/HAIR: ${character.visualDNA.hairOrHijab} (EXACT - maintain consistency)`);
    }
    if (character.visualDNA.outfitRules) {
      visualDNABlock.push(`OUTFIT: ${character.visualDNA.outfitRules}`);
    }
    if (character.visualDNA.accessories) {
      visualDNABlock.push(`ACCESSORIES: ${character.visualDNA.accessories}`);
    }
  }

  // Build modesty rules block
  const modestyBlock: string[] = ["MANDATORY MODESTY RULES:"];
  if (character.modestyRules?.hijabAlways) {
    modestyBlock.push("- HIJAB REQUIRED: Must cover ALL hair completely, no hair strands visible");
  }
  if (character.modestyRules?.longSleeves) {
    modestyBlock.push("- LONG SLEEVES: Arms must be covered to wrists");
  }
  if (character.modestyRules?.looseClothing) {
    modestyBlock.push("- LOOSE CLOTHING: All garments must be loose-fitting, not form-revealing");
  }
  modestyBlock.push("- No tight or revealing clothing under any circumstances");

  // Build color palette block
  const colorBlock = character.colorPalette && character.colorPalette.length > 0
    ? `COLOR PALETTE: ${character.colorPalette.join(", ")}`
    : "";

  const prompt = `CHARACTER REFERENCE SHEET POSE: ${poseInfo.name}
${stylePrompt}

## CHARACTER IDENTITY
Name: ${character.name}
Role: ${character.role}
Age Appearance: ${character.ageRange || "child"} years old

## VISUAL DNA (MUST MATCH EXACTLY)
${visualDNABlock.join("\n")}
${colorBlock}

## POSE REQUIREMENTS
Pose: ${poseInfo.name}
Description: ${poseInfo.description}
Body Position: ${poseInfo.bodyPosition}

## ${modestyBlock.join("\n")}

## ART STYLE (CONSISTENT WITH CHARACTER)
Style: ${styleId}
${styleTechnical}

## TECHNICAL REQUIREMENTS
- Single character only, isolated on clean background
- Full body visible (head to feet)
- Clean, simple background (solid color or subtle gradient)
- High detail on face and clothing
- Consistent proportions for reference sheet use
- NO text, watermarks, or labels
- Professional character design quality
- Portrait orientation preferred (for reference sheet grid)

## CRITICAL CONSISTENCY RULES
- This pose must match the character's established visual identity
- Skin tone, hair/hijab style, and outfit must be EXACTLY as described
- This image will be used as reference for all future illustrations
- Maintain the exact same character design across all poses`;

  // Build negative prompt
  const negativePrompts = [
    "text", "watermark", "signature", "label", "multiple characters",
    "background elements", "props", "furniture", "scenery",
    "inconsistent features", "changed skin tone", "different hair style",
    "revealing clothing", "tight clothing", "short sleeves",
    "missing hijab", "visible hair under hijab",
    "poor anatomy", "distorted proportions", "extra limbs",
    "low quality", "blurry", "pixelated",
  ];

  if (character.modestyRules?.hijabAlways) {
    negativePrompts.push("exposed hair", "hair visible", "no hijab");
  }

  return {
    prompt,
    negativePrompt: negativePrompts.join(", "),
    style: styleId,
    poseType: pose,
    poseName: poseInfo.name,
  };
}

/**
 * Build prompts for all 12 poses of a character.
 * Returns an array of prompts, one for each pose type.
 */
export function buildCharacterReferenceSheetPrompts(
  character: StoredCharacter
): CharacterPosePromptResult[] {
  return ALL_POSE_TYPES.map((pose) =>
    buildCharacterPosePrompt({ character, pose })
  );
}

// ============================================
// Scene Description Generator (Enhanced)
// ============================================

export function generateSceneDescriptionFromChapter(
  chapterText: string,
  chapterTitle: string,
  keyScene?: string
): string {
  // If we have a key scene from the outline, use it
  if (keyScene) {
    return keyScene;
  }

  // Extract a meaningful scene from the chapter text
  // Look for action or descriptive sentences
  const sentences = chapterText.split(/[.!?]+/).filter((s) => s.trim().length > 20);

  // Prefer sentences with visual elements
  const visualKeywords = [
    "looked", "saw", "watched", "smiled", "walked", "ran", "sat", "stood",
    "held", "opened", "reached", "hugged", "pointed", "gazed", "glanced",
    "jumped", "played", "danced", "prayed", "reading"
  ];
  const visualSentences = sentences.filter((s) =>
    visualKeywords.some((kw) => s.toLowerCase().includes(kw))
  );

  if (visualSentences.length > 0) {
    // Return the most descriptive visual sentence
    return visualSentences
      .sort((a, b) => b.length - a.length)[0]
      .trim();
  }

  // Fall back to first substantial sentence
  if (sentences.length > 0) {
    return sentences[0].trim();
  }

  return `Scene from ${chapterTitle}`;
}

// ============================================
// Batch Generation Helpers
// ============================================

export interface IllustrationBatchInput {
  project: StoredProject;
  chapters: Array<{
    chapterNumber: number;
    title: string;
    keyScene?: string;
    text?: string;
  }>;
  characters: StoredCharacter[];
  kbSummary: KBRulesSummary | null;
}

/**
 * Generate prompts for all illustrations in a book.
 * Each chapter gets one illustration.
 */
export function buildIllustrationBatch(
  input: IllustrationBatchInput
): ImagePromptResult[] {
  const { project, chapters, characters, kbSummary } = input;

  return chapters.map((chapter) => {
    const sceneDescription = generateSceneDescriptionFromChapter(
      chapter.text || "",
      chapter.title,
      chapter.keyScene
    );

    return buildIllustrationPrompt({
      project,
      chapterNumber: chapter.chapterNumber,
      sceneDescription,
      characters,
      kbSummary,
    });
  });
}

/**
 * Generate prompts for both front and back covers.
 */
export function buildCoverBatch(
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null,
  moral?: string,
  authorName?: string
): { front: ImagePromptResult; back: ImagePromptResult } {
  return {
    front: buildCoverPrompt({
      project,
      characters,
      kbSummary,
      coverType: "front",
      moral,
      authorName,
    }),
    back: buildCoverPrompt({
      project,
      characters,
      kbSummary,
      coverType: "back",
      moral,
      authorName,
    }),
  };
}
