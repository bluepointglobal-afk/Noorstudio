import { StoredProject } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import { AIStage } from "./tokenBudget";
import { AIContext, AIContextCharacter, AIContextKB } from "./types";

/**
 * Build a trimmed context object for the AI prompt.
 * Prevents overfeeding the model with unnecessary data.
 */
export function buildStageContext(
    stage: AIStage,
    project: StoredProject,
    characters: StoredCharacter[],
    kbSummary: KBRulesSummary | null
): AIContext {
    // 1. Only include active characters (those selected for the project)
    const activeCharacters: AIContextCharacter[] = characters
        .filter(c => project.characterIds.includes(c.id))
        .map(c => ({
            name: c.name,
            role: c.role,
            traits: c.traits || [],
            speakingStyle: c.speakingStyle || "friendly and warm",
            visualDescription: c.visualPrompt?.substring(0, 200) || "", // Trim visual prompt
        }));

    // 2. Trim KB rules - only top 5 of each if they exist, or just general ones
    const kb: AIContextKB | null = kbSummary ? {
        name: kbSummary.kbName,
        faithRules: (kbSummary.faithRules || []).slice(0, 5),
        vocabularyRules: (kbSummary.vocabularyRules || []).slice(0, 5),
        illustrationRules: (kbSummary.illustrationRules || []).slice(0, 5),
    } : null;

    return {
        projectTitle: project.title,
        ageRange: project.ageRange,
        learningObjective: project.learningObjective,
        setting: project.setting,
        activeCharacters,
        kb,
    };
}
