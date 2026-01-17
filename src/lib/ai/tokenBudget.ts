/**
 * AI Cost Control & Token Discipline Configuration
 */

export type AIStage = "outline" | "chapters" | "humanize" | "illustrations" | "cover" | "json_repair";

export interface StageBudget {
    maxOutputTokens: number;
    maxPromptTokens: number;
    creditCost: number;
}

export const AI_TOKEN_BUDGETS: Record<AIStage, StageBudget> = {
    outline: {
        maxOutputTokens: 1200,
        maxPromptTokens: 3000,
        creditCost: 1,
    },
    chapters: {
        maxOutputTokens: 2500, // Higher for full chapters
        maxPromptTokens: 4000,
        creditCost: 3,
    },
    humanize: {
        maxOutputTokens: 2500,
        maxPromptTokens: 5000,
        creditCost: 2,
    },
    illustrations: {
        maxOutputTokens: 0, // N/A for images
        maxPromptTokens: 1000,
        creditCost: 8,
    },
    cover: {
        maxOutputTokens: 0,
        maxPromptTokens: 1000,
        creditCost: 5,
    },
    json_repair: {
        maxOutputTokens: 2000,
        maxPromptTokens: 4000,
        creditCost: 0, // Repair is free (reuse original charge)
    }
};

export const GLOBAL_LIMITS = {
    totalBookMaxTokens: 200000, // Hard safety cap
    maxChaptersPerRun: 2,       // Disciplined batching
    maxIllustrationsPerRun: 4,
    maxRetriesPerStage: 1,
};

export const IMAGE_LIMITS = {
    illustrations: 4,
    cover: 2,
};

/**
 * Heuristic: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

export function isWithinBudget(stage: AIStage, prompt: string): { allowed: boolean; error?: string } {
    const budget = AI_TOKEN_BUDGETS[stage];
    if (!budget) return { allowed: true };

    const estimatedPrompt = estimateTokens(prompt);
    if (estimatedPrompt > budget.maxPromptTokens) {
        return {
            allowed: false,
            error: `Prompt is too large (${estimatedPrompt} tokens). Maximum allowed for ${stage} is ${budget.maxPromptTokens}.`
        };
    }

    return { allowed: true };
}

export class AIExecutionError extends Error {
    constructor(public code: string, message: string, public status: number = 400) {
        super(message);
        this.name = "AIExecutionError";
    }
}
