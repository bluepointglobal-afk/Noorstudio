// Prompt Assembly for AI Engine
// Builds deterministic prompts for each stage

import { StoredProject } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import { clampTextLength, clampTextsProportionally } from "./budget";

// ============================================
// Output Types (Structured JSON)
// ============================================

export interface OutlineChapter {
  title: string;
  goal: string;
  key_scene: string;
  dua_or_ayah_hint: string;
}

export interface OutlineOutput {
  book_title: string;
  one_liner: string;
  moral: string;
  chapters: OutlineChapter[];
}

export interface ChapterOutput {
  chapter_title: string;
  chapter_number: number;
  text: string;
  vocabulary_notes: string[];
  islamic_adab_checks: string[];
}

export interface HumanizeOutput {
  chapter_title: string;
  chapter_number: number;
  edited_text: string;
  changes_made: string[];
}

// ============================================
// Character Summary Builder
// ============================================

function buildCharacterSummary(characters: StoredCharacter[]): string {
  if (characters.length === 0) return "No characters provided.";

  return characters
    .map((char) => {
      const traits = char.traits?.join(", ") || "kind, curious";
      const speakingStyle = char.speakingStyle || "friendly and warm";
      return `- ${char.name} (${char.role}): ${traits}. Speaking style: ${speakingStyle}`;
    })
    .join("\n");
}

// ============================================
// KB Rules Summary Builder
// ============================================

function buildKBRulesSummary(kbSummary: KBRulesSummary | null): string {
  if (!kbSummary) return "No knowledge base rules provided.";

  const sections: string[] = [];

  if (kbSummary.faithRules.length > 0) {
    sections.push(
      "FAITH RULES (must follow):\n" +
        kbSummary.faithRules.map((r) => `- ${r}`).join("\n")
    );
  }

  if (kbSummary.vocabularyRules.length > 0) {
    sections.push(
      "VOCABULARY RULES (language guidelines):\n" +
        kbSummary.vocabularyRules.map((r) => `- ${r}`).join("\n")
    );
  }

  if (kbSummary.illustrationRules.length > 0) {
    sections.push(
      "ILLUSTRATION RULES (for scene descriptions):\n" +
        kbSummary.illustrationRules.map((r) => `- ${r}`).join("\n")
    );
  }

  return sections.length > 0 ? sections.join("\n\n") : "No specific rules.";
}

// ============================================
// Outline Prompt
// ============================================

export function buildOutlinePrompt(
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null
): { system: string; prompt: string } {
  const system = `You are an expert Islamic children's book author. You create engaging, age-appropriate stories that teach Islamic values through compelling narratives.

You MUST output valid JSON matching this exact schema:
{
  "book_title": "string",
  "one_liner": "string (one sentence summary)",
  "moral": "string (the Islamic teaching/moral)",
  "chapters": [
    {
      "title": "string",
      "goal": "string (what this chapter accomplishes)",
      "key_scene": "string (the main scene/event)",
      "dua_or_ayah_hint": "string (relevant dua or ayah reference, or 'None')"
    }
  ]
}

IMPORTANT RULES:
- Output ONLY the JSON, no markdown code blocks, no explanations
- Age range determines vocabulary complexity and scene intensity
- All content must align with Islamic values
- Characters should model good Islamic adab (manners)`;

  const characterSummary = buildCharacterSummary(characters);
  const kbRules = buildKBRulesSummary(kbSummary);

  const prompt = `Create a book outline for:

BOOK DETAILS:
- Title: ${project.title}
- Age Range: ${project.ageRange}
- Template Type: ${project.templateType}
- Setting: ${project.setting || "Not specified"}
- Learning Objective: ${project.learningObjective || "General Islamic values"}
- Synopsis: ${clampTextLength(project.synopsis || "", 500)}

CHARACTERS:
${characterSummary}

KNOWLEDGE BASE RULES:
${kbRules}

Generate a 4-chapter outline that:
1. Has a clear beginning, challenge, learning, and resolution
2. Features the characters appropriately for their roles
3. Incorporates at least one dua or ayah reference naturally
4. Is appropriate for the ${project.ageRange} age range
5. Teaches: ${project.learningObjective || "Islamic values and good character"}`;

  return { system, prompt };
}

// ============================================
// Chapter Prompt
// ============================================

export interface ChapterContext {
  chapterNumber: number;
  chapterTitle: string;
  chapterGoal: string;
  keyScene: string;
  duaOrAyahHint: string;
  previousChapterSummary?: string;
}

export function buildChapterPrompt(
  project: StoredProject,
  chapterContext: ChapterContext,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null
): { system: string; prompt: string } {
  const system = `You are an expert Islamic children's book author writing engaging chapter content.

You MUST output valid JSON matching this exact schema:
{
  "chapter_title": "string",
  "chapter_number": number,
  "text": "string (the full chapter text, 300-600 words)",
  "vocabulary_notes": ["string (Islamic terms used with brief explanations)"],
  "islamic_adab_checks": ["string (Islamic manners/values demonstrated)"]
}

IMPORTANT RULES:
- Output ONLY the JSON, no markdown code blocks
- Write age-appropriate content for the specified age range
- Use dialogue to make characters come alive
- Include sensory details for engaging storytelling
- Naturally incorporate Islamic concepts without being preachy
- If a dua or ayah is referenced, present it respectfully`;

  const characterSummary = buildCharacterSummary(characters);
  const kbRules = buildKBRulesSummary(kbSummary);

  const previousContext = chapterContext.previousChapterSummary
    ? `\nPREVIOUS CHAPTER SUMMARY:\n${clampTextLength(chapterContext.previousChapterSummary, 300)}`
    : "";

  const prompt = `Write Chapter ${chapterContext.chapterNumber} for:

BOOK: ${project.title}
AGE RANGE: ${project.ageRange}
LAYOUT STYLE: ${project.layoutStyle} (consider pacing for this format)

CHAPTER DETAILS:
- Title: ${chapterContext.chapterTitle}
- Goal: ${chapterContext.chapterGoal}
- Key Scene: ${chapterContext.keyScene}
- Dua/Ayah Reference: ${chapterContext.duaOrAyahHint}
${previousContext}

CHARACTERS:
${characterSummary}

KNOWLEDGE BASE RULES:
${kbRules}

Write this chapter with:
1. An engaging opening hook
2. Character dialogue that sounds natural for their age
3. The key scene as the centerpiece
4. If applicable, the dua/ayah woven naturally into the narrative
5. A transition that leads to the next chapter or resolution`;

  return { system, prompt };
}

// ============================================
// Humanize/Edit Prompt
// ============================================

export function buildHumanizePrompt(
  project: StoredProject,
  chapterNumber: number,
  chapterText: string,
  kbSummary: KBRulesSummary | null
): { system: string; prompt: string } {
  const system = `You are an expert editor specializing in Islamic children's literature. Your job is to humanize and polish AI-generated text while preserving its meaning and Islamic content.

You MUST output valid JSON matching this exact schema:
{
  "chapter_title": "string",
  "chapter_number": number,
  "edited_text": "string (the improved chapter text)",
  "changes_made": ["string (brief description of each change)"]
}

IMPORTANT RULES:
- Output ONLY the JSON, no markdown code blocks
- Preserve all Islamic content and references
- Make dialogue more natural and age-appropriate
- Improve flow and readability
- Fix any awkward phrasing
- Ensure proper adab in character interactions`;

  const kbRules = buildKBRulesSummary(kbSummary);

  const prompt = `Edit and humanize this chapter:

BOOK: ${project.title}
AGE RANGE: ${project.ageRange}
CHAPTER: ${chapterNumber}

KNOWLEDGE BASE RULES TO VERIFY:
${kbRules}

ORIGINAL TEXT:
${clampTextLength(chapterText, 4000)}

Please:
1. Make dialogue sound more natural for the age range
2. Improve sentence variety and flow
3. Ensure Islamic terms are used correctly
4. Add small sensory details if needed
5. Verify adab (manners) are modeled correctly
6. Keep the same story beats and length`;

  return { system, prompt };
}

// ============================================
// JSON Repair Prompt (for retry)
// ============================================

export function buildJsonRepairPrompt(
  originalOutput: string,
  expectedSchema: string
): { system: string; prompt: string } {
  const system = `You are a JSON repair assistant. Your only job is to fix malformed JSON to match the required schema.

RULES:
- Output ONLY valid JSON, nothing else
- Do not add explanations or markdown
- Preserve as much of the original content as possible
- If content is missing, use reasonable defaults`;

  const prompt = `The following output should be valid JSON but has errors. Fix it to match this schema:

EXPECTED SCHEMA:
${expectedSchema}

BROKEN OUTPUT:
${clampTextLength(originalOutput, 3000)}

Output the fixed JSON only:`;

  return { system, prompt };
}

// ============================================
// Schema Strings (for repair prompts)
// ============================================

export const OUTLINE_SCHEMA = `{
  "book_title": "string",
  "one_liner": "string",
  "moral": "string",
  "chapters": [{"title":"string","goal":"string","key_scene":"string","dua_or_ayah_hint":"string"}]
}`;

export const CHAPTER_SCHEMA = `{
  "chapter_title": "string",
  "chapter_number": number,
  "text": "string",
  "vocabulary_notes": ["string"],
  "islamic_adab_checks": ["string"]
}`;

export const HUMANIZE_SCHEMA = `{
  "chapter_title": "string",
  "chapter_number": number,
  "edited_text": "string",
  "changes_made": ["string"]
}`;
