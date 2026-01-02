// Token & Cost Controls for AI Engine
// Provides budget estimation and enforcement

import { getAIConfig } from "./config";

// ============================================
// Token Estimation
// ============================================

/**
 * Rough token estimator (chars/4 is a common heuristic for English text)
 * Claude uses BPE tokenization, but this is good enough for budgeting
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for an array of texts
 */
export function estimateTotalTokens(texts: string[]): number {
  return texts.reduce((sum, text) => sum + estimateTokens(text), 0);
}

// ============================================
// Text Clamping
// ============================================

/**
 * Clamp text to a maximum character length
 * Tries to break at word boundaries
 */
export function clampTextLength(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text;

  // Find last space before maxChars to break at word boundary
  const truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxChars * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Clamp an array of texts proportionally to fit within total maxChars
 */
export function clampTextsProportionally(
  texts: string[],
  maxTotalChars: number
): string[] {
  const totalLength = texts.reduce((sum, t) => sum + t.length, 0);
  if (totalLength <= maxTotalChars) return texts;

  const ratio = maxTotalChars / totalLength;
  return texts.map((text) => clampTextLength(text, Math.floor(text.length * ratio)));
}

// ============================================
// Budget Enforcement
// ============================================

export type AIStage = "outline" | "chapters" | "humanize";

export interface BudgetConfig {
  maxOutputTokens: number;
  maxInputChars: number;
  maxChaptersPerRun?: number;
}

export interface BudgetResult {
  withinBudget: boolean;
  estimatedInputTokens: number;
  maxOutputTokens: number;
  warnings: string[];
  adjustedInput?: string;
}

const STAGE_BUDGETS: Record<AIStage, BudgetConfig> = {
  outline: {
    maxOutputTokens: 1200, // Will be overridden by env
    maxInputChars: 12000,
  },
  chapters: {
    maxOutputTokens: 1600, // Per chapter, will be overridden by env
    maxInputChars: 8000,
    maxChaptersPerRun: 3, // Will be overridden by env
  },
  humanize: {
    maxOutputTokens: 1200,
    maxInputChars: 6000,
  },
};

/**
 * Enforce budget for a given stage
 */
export function enforceBudget(
  stage: AIStage,
  inputText: string
): BudgetResult {
  const config = getAIConfig();
  const stageBudget = { ...STAGE_BUDGETS[stage] };

  // Override with env config
  if (stage === "outline") {
    stageBudget.maxOutputTokens = config.maxOutputTokensOutline;
  } else if (stage === "chapters") {
    stageBudget.maxOutputTokens = config.maxOutputTokensChapter;
    stageBudget.maxChaptersPerRun = config.maxChaptersPerRun;
  }

  const warnings: string[] = [];
  let adjustedInput = inputText;
  const inputLength = inputText.length;

  // Check and clamp input
  if (inputLength > stageBudget.maxInputChars) {
    adjustedInput = clampTextLength(inputText, stageBudget.maxInputChars);
    warnings.push(
      `Input truncated from ${inputLength} to ${stageBudget.maxInputChars} chars`
    );
  }

  const estimatedInputTokens = estimateTokens(adjustedInput);

  return {
    withinBudget: warnings.length === 0,
    estimatedInputTokens,
    maxOutputTokens: stageBudget.maxOutputTokens,
    warnings,
    adjustedInput: warnings.length > 0 ? adjustedInput : undefined,
  };
}

/**
 * Get the maximum chapters that can be generated per run
 */
export function getMaxChaptersPerRun(): number {
  return getAIConfig().maxChaptersPerRun;
}

/**
 * Calculate batch plan for chapter generation
 */
export function planChapterBatches(totalChapters: number): number[][] {
  const maxPerRun = getMaxChaptersPerRun();
  const batches: number[][] = [];

  for (let i = 0; i < totalChapters; i += maxPerRun) {
    const batchEnd = Math.min(i + maxPerRun, totalChapters);
    const batch: number[] = [];
    for (let j = i; j < batchEnd; j++) {
      batch.push(j);
    }
    batches.push(batch);
  }

  return batches;
}

// ============================================
// Cost Estimation (for UI display)
// ============================================

// Claude Sonnet pricing (as of 2024): $3/1M input, $15/1M output
const CLAUDE_INPUT_COST_PER_TOKEN = 0.000003;
const CLAUDE_OUTPUT_COST_PER_TOKEN = 0.000015;

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
}

export function estimateCost(
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const inputCost = inputTokens * CLAUDE_INPUT_COST_PER_TOKEN;
  const outputCost = outputTokens * CLAUDE_OUTPUT_COST_PER_TOKEN;

  return {
    inputTokens,
    outputTokens,
    estimatedCostUSD: inputCost + outputCost,
  };
}
