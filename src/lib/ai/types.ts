// AI Pipeline Types

import { ProjectStage } from "@/lib/models";

export interface AIUsageStats {
    totalInputTokens: number;
    totalOutputTokens: number;
    callCount: number;
    lastRunAt: string;
    provider: string;
    stages: Record<string, {
        inputTokens: number;
        outputTokens: number;
        callCount: number;
    }>;
}

export interface StageRunnerProgress {
    stage: string;
    status: "running" | "completed" | "error" | "failed";
    progress: number;
    message: string;
    subProgress?: {
        current: number;
        total: number;
        label: string;
    };
}

export interface StageRunnerResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
    needsReview?: boolean;
    rawText?: string;
}

export interface AIContextCharacter {
    name: string;
    role: string;
    traits: string[];
    speakingStyle: string;
    visualDescription: string;
}

export interface AIContextKB {
    name: string;
    faithRules: string[];
    vocabularyRules: string[];
    illustrationRules: string[];
}

export interface AIContext {
    projectTitle: string;
    ageRange: string;
    learningObjective: string;
    setting: string;
    activeCharacters: AIContextCharacter[];
    kb: AIContextKB | null;
}
