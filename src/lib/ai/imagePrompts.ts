// Image Prompt Construction for NanoBanana
// Builds deterministic prompts for illustrations and covers

import { StoredProject } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";

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

export interface CoverPromptInput {
  project: StoredProject;
  characters: StoredCharacter[];
  kbSummary: KBRulesSummary | null;
  coverType: "front" | "back";
  moral?: string;
}

export interface ImagePromptResult {
  prompt: string;
  references: string[];
  style: string;
  negativePrompt: string;
}

// ============================================
// Character Description Builder
// ============================================

function buildCharacterDescription(char: StoredCharacter): string {
  const parts: string[] = [];

  // Basic identity
  parts.push(`${char.name}`);

  // Age and appearance
  if (char.ageRange) {
    parts.push(`(${char.ageRange})`);
  }

  // Visual DNA
  if (char.visualDNA) {
    if (char.visualDNA.skinTone) {
      parts.push(`${char.visualDNA.skinTone} skin`);
    }
    if (char.visualDNA.hairOrHijab) {
      parts.push(char.visualDNA.hairOrHijab);
    }
  }

  // Modesty rules
  if (char.modestyRules) {
    if (char.modestyRules.hijabStyle && char.modestyRules.hijabStyle !== "none") {
      parts.push(`wearing ${char.modestyRules.hijabStyle} hijab`);
    }
    if (char.modestyRules.outfitLength) {
      parts.push(`${char.modestyRules.outfitLength} modest clothing`);
    }
  }

  return parts.join(", ");
}

// ============================================
// Islamic Modesty Constraints
// ============================================

function buildModestyConstraints(kbSummary: KBRulesSummary | null): string {
  const constraints: string[] = [
    "Islamic modesty standards",
    "appropriate dress for Muslim children's book",
    "no revealing clothing",
  ];

  if (kbSummary?.illustrationRules) {
    constraints.push(...kbSummary.illustrationRules);
  }

  return constraints.join(", ");
}

// ============================================
// Illustration Prompt Builder
// ============================================

export function buildIllustrationPrompt(input: IllustrationPromptInput): ImagePromptResult {
  const { project, chapterNumber, sceneDescription, characters, kbSummary } = input;

  // Character descriptions
  const characterDescriptions = characters
    .map(buildCharacterDescription)
    .join("; ");

  // Build the main prompt
  const promptParts: string[] = [
    "Pixar-style 3D children's book illustration",
    `for ages ${project.ageRange}`,
    "",
    `Scene: ${sceneDescription}`,
    "",
    `Characters: ${characterDescriptions}`,
    "",
    "Style requirements:",
    "- Warm, inviting lighting",
    "- Soft shadows",
    "- Vibrant but not harsh colors",
    "- Child-friendly expressions",
    "- Clear focal point",
    "",
    "Cultural requirements:",
    `- ${buildModestyConstraints(kbSummary)}`,
    "- Culturally appropriate Islamic setting",
    "",
    "Technical requirements:",
    "- High detail on character faces",
    "- Consistent character design with reference images",
    "- No text or words in the image",
    "- Professional children's book quality",
  ];

  // Gather pose sheet references
  const references = characters
    .filter(c => c.poseSheetUrl)
    .map(c => c.poseSheetUrl as string);

  return {
    prompt: promptParts.join("\n"),
    references,
    style: "pixar-3d",
    negativePrompt: "text, words, letters, watermark, signature, blurry, distorted, low quality, scary, violent, inappropriate, revealing clothing",
  };
}

// ============================================
// Cover Prompt Builder
// ============================================

export function buildCoverPrompt(input: CoverPromptInput): ImagePromptResult {
  const { project, characters, kbSummary, coverType, moral } = input;

  // Character descriptions for main characters only (max 2)
  const mainCharacters = characters.slice(0, 2);
  const characterDescriptions = mainCharacters
    .map(buildCharacterDescription)
    .join("; ");

  const promptParts: string[] = [];

  if (coverType === "front") {
    promptParts.push(
      "Pixar-style 3D children's book FRONT COVER illustration",
      `Title: "${project.title}"`,
      `for ages ${project.ageRange}`,
      "",
      `Main characters: ${characterDescriptions}`,
      "",
      "Cover composition:",
      "- Characters prominently featured",
      "- Eye-catching, dynamic pose",
      "- Warm, inviting atmosphere",
      "- Space at top for title text (leave blank)",
      "- Vibrant, appealing colors",
      "",
      `Setting hint: ${project.setting || "Islamic/Middle Eastern inspired"}`,
      "",
      "Requirements:",
      `- ${buildModestyConstraints(kbSummary)}`,
      "- Professional book cover quality",
      "- No text or words - title will be added separately",
      "- Vertical portrait orientation (2:3 ratio)",
    );
  } else {
    promptParts.push(
      "Pixar-style 3D children's book BACK COVER illustration",
      `for ages ${project.ageRange}`,
      "",
      "Back cover composition:",
      "- Softer, complementary scene",
      "- Can show secondary moment or setting",
      "- Space in center for synopsis text (leave blank)",
      "- Cohesive with front cover style",
      "",
      `Theme: ${moral || project.learningObjective || "Islamic values"}`,
      "",
      "Requirements:",
      `- ${buildModestyConstraints(kbSummary)}`,
      "- Professional book cover quality",
      "- No text or words",
      "- Vertical portrait orientation (2:3 ratio)",
    );
  }

  // Gather pose sheet references
  const references = mainCharacters
    .filter(c => c.poseSheetUrl)
    .map(c => c.poseSheetUrl as string);

  return {
    prompt: promptParts.join("\n"),
    references,
    style: "pixar-3d",
    negativePrompt: "text, words, letters, watermark, signature, blurry, distorted, low quality, scary, violent, inappropriate, revealing clothing, horizontal",
  };
}

// ============================================
// Scene Description Generator
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
  const sentences = chapterText.split(/[.!?]+/).filter(s => s.trim().length > 20);

  // Prefer sentences with visual elements
  const visualKeywords = ["looked", "saw", "watched", "smiled", "walked", "ran", "sat", "stood", "held", "opened"];
  const visualSentences = sentences.filter(s =>
    visualKeywords.some(kw => s.toLowerCase().includes(kw))
  );

  if (visualSentences.length > 0) {
    return visualSentences[0].trim();
  }

  // Fall back to first substantial sentence
  if (sentences.length > 0) {
    return sentences[0].trim();
  }

  return `Scene from ${chapterTitle}`;
}
