// AI Stage Runner
// Executes AI-powered pipeline stages (Outline, Chapters, Humanize)

import { StoredProject, updateProject, getProject } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import { isTextMockMode } from "./config";
import { planChapterBatches, estimateTokens } from "./budget";
import {
  buildOutlinePrompt,
  buildChapterPrompt,
  buildHumanizePrompt,
  buildJsonRepairPrompt,
  OUTLINE_SCHEMA,
  CHAPTER_SCHEMA,
  HUMANIZE_SCHEMA,
  OutlineOutput,
  ChapterOutput,
  HumanizeOutput,
  ChapterContext,
} from "./prompts";
import {
  generateText,
  generateTextWithJSONRetry,
  CancelToken,
} from "./providers/textProvider";

// ============================================
// Types
// ============================================

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
  status: "running" | "completed" | "error";
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

type ProgressCallback = (progress: StageRunnerProgress) => void;

// ============================================
// Usage Stats Management
// ============================================

export function getProjectAIUsage(project: StoredProject): AIUsageStats | null {
  return (project.artifacts._aiUsage?.content as AIUsageStats) || null;
}

export function updateProjectAIUsage(
  projectId: string,
  stageName: string,
  inputTokens: number,
  outputTokens: number,
  provider: string
): void {
  const project = getProject(projectId);
  if (!project) return;

  const currentUsage = getProjectAIUsage(project) || {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    callCount: 0,
    lastRunAt: "",
    provider: "",
    stages: {},
  };

  // Update totals
  currentUsage.totalInputTokens += inputTokens;
  currentUsage.totalOutputTokens += outputTokens;
  currentUsage.callCount += 1;
  currentUsage.lastRunAt = new Date().toISOString();
  currentUsage.provider = provider;

  // Update per-stage stats
  if (!currentUsage.stages[stageName]) {
    currentUsage.stages[stageName] = { inputTokens: 0, outputTokens: 0, callCount: 0 };
  }
  currentUsage.stages[stageName].inputTokens += inputTokens;
  currentUsage.stages[stageName].outputTokens += outputTokens;
  currentUsage.stages[stageName].callCount += 1;

  // Store in artifacts
  const updatedArtifacts = {
    ...project.artifacts,
    _aiUsage: {
      type: "meta" as const,
      content: currentUsage,
      generatedAt: new Date().toISOString(),
    },
  };

  updateProject(projectId, { artifacts: updatedArtifacts });
}

// ============================================
// Outline Stage Runner
// ============================================

export async function runOutlineStage(
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null,
  onProgress: ProgressCallback,
  cancelToken?: CancelToken
): Promise<StageRunnerResult<OutlineOutput>> {
  onProgress({
    stage: "outline",
    status: "running",
    progress: 10,
    message: "Building outline prompt...",
  });

  try {
    const { system, prompt } = buildOutlinePrompt(project, characters, kbSummary);

    onProgress({
      stage: "outline",
      status: "running",
      progress: 30,
      message: isTextMockMode() ? "Generating mock outline..." : "Calling AI to generate outline...",
    });

    const result = await generateTextWithJSONRetry<OutlineOutput>(
      {
        system,
        prompt,
        maxOutputTokens: 1200,
        stage: "outline",
      },
      (rawText) => buildJsonRepairPrompt(rawText, OUTLINE_SCHEMA),
      cancelToken
    );

    onProgress({
      stage: "outline",
      status: "completed",
      progress: 100,
      message: "Outline generated successfully",
    });

    // Track usage
    if (result.usage) {
      updateProjectAIUsage(
        project.id,
        "outline",
        result.usage.inputTokens,
        result.usage.outputTokens,
        isTextMockMode() ? "mock" : "claude"
      );
    }

    return {
      success: true,
      data: result.data,
      usage: result.usage,
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; rawText?: string };
    onProgress({
      stage: "outline",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to generate outline",
    });

    // Check if this is a parse error with raw text
    if (errorObj.rawText) {
      return {
        success: false,
        error: errorObj.message,
        needsReview: true,
        rawText: errorObj.rawText,
      };
    }

    return {
      success: false,
      error: errorObj.message || "Unknown error",
    };
  }
}

// ============================================
// Chapters Stage Runner
// ============================================

export interface ChaptersStageResult {
  chapters: ChapterOutput[];
  partialSuccess?: boolean;
}

export async function runChaptersStage(
  project: StoredProject,
  outline: OutlineOutput,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null,
  onProgress: ProgressCallback,
  cancelToken?: CancelToken
): Promise<StageRunnerResult<ChaptersStageResult>> {
  const totalChapters = outline.chapters.length;
  const batches = planChapterBatches(totalChapters);
  const generatedChapters: ChapterOutput[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  onProgress({
    stage: "chapters",
    status: "running",
    progress: 5,
    message: `Generating ${totalChapters} chapters in ${batches.length} batch(es)...`,
  });

  try {
    let previousSummary = "";

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      for (const chapterIndex of batch) {
        if (cancelToken?.cancelled) {
          throw { message: "Generation cancelled", cancelled: true };
        }

        const outlineChapter = outline.chapters[chapterIndex];
        const chapterNum = chapterIndex + 1;

        onProgress({
          stage: "chapters",
          status: "running",
          progress: Math.round(((chapterIndex + 1) / totalChapters) * 90) + 5,
          message: `Generating Chapter ${chapterNum}...`,
          subProgress: {
            current: chapterIndex + 1,
            total: totalChapters,
            label: outlineChapter.title,
          },
        });

        const chapterContext: ChapterContext = {
          chapterNumber: chapterNum,
          chapterTitle: outlineChapter.title,
          chapterGoal: outlineChapter.goal,
          keyScene: outlineChapter.key_scene,
          duaOrAyahHint: outlineChapter.dua_or_ayah_hint,
          previousChapterSummary: previousSummary,
        };

        const { system, prompt } = buildChapterPrompt(
          project,
          chapterContext,
          characters,
          kbSummary
        );

        const result = await generateTextWithJSONRetry<ChapterOutput>(
          {
            system,
            prompt,
            maxOutputTokens: 1600,
            stage: "chapters",
          },
          (rawText) => buildJsonRepairPrompt(rawText, CHAPTER_SCHEMA),
          cancelToken
        );

        generatedChapters.push(result.data);

        if (result.usage) {
          totalInputTokens += result.usage.inputTokens;
          totalOutputTokens += result.usage.outputTokens;
        }

        // Build summary for next chapter context
        previousSummary = `Chapter ${chapterNum} (${result.data.chapter_title}): ${result.data.text.substring(0, 200)}...`;
      }
    }

    onProgress({
      stage: "chapters",
      status: "completed",
      progress: 100,
      message: `Generated ${generatedChapters.length} chapters successfully`,
    });

    // Track usage
    updateProjectAIUsage(
      project.id,
      "chapters",
      totalInputTokens,
      totalOutputTokens,
      isTextMockMode() ? "mock" : "claude"
    );

    return {
      success: true,
      data: { chapters: generatedChapters },
      usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; cancelled?: boolean };

    // If we have some chapters, return partial success
    if (generatedChapters.length > 0) {
      onProgress({
        stage: "chapters",
        status: "completed",
        progress: 100,
        message: `Partially generated ${generatedChapters.length}/${totalChapters} chapters`,
      });

      return {
        success: true,
        data: { chapters: generatedChapters, partialSuccess: true },
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        error: errorObj.message,
      };
    }

    onProgress({
      stage: "chapters",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to generate chapters",
    });

    return {
      success: false,
      error: errorObj.message || "Unknown error",
    };
  }
}

// ============================================
// Humanize Stage Runner
// ============================================

export interface HumanizeStageResult {
  chapters: HumanizeOutput[];
}

export async function runHumanizeStage(
  project: StoredProject,
  chapters: ChapterOutput[],
  kbSummary: KBRulesSummary | null,
  onProgress: ProgressCallback,
  cancelToken?: CancelToken
): Promise<StageRunnerResult<HumanizeStageResult>> {
  const totalChapters = chapters.length;
  const humanizedChapters: HumanizeOutput[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  onProgress({
    stage: "humanize",
    status: "running",
    progress: 5,
    message: `Humanizing ${totalChapters} chapters...`,
  });

  try {
    for (let i = 0; i < chapters.length; i++) {
      if (cancelToken?.cancelled) {
        throw { message: "Humanization cancelled", cancelled: true };
      }

      const chapter = chapters[i];
      const chapterNum = chapter.chapter_number;

      onProgress({
        stage: "humanize",
        status: "running",
        progress: Math.round(((i + 1) / totalChapters) * 90) + 5,
        message: `Humanizing Chapter ${chapterNum}...`,
        subProgress: {
          current: i + 1,
          total: totalChapters,
          label: chapter.chapter_title,
        },
      });

      const { system, prompt } = buildHumanizePrompt(
        project,
        chapterNum,
        chapter.text,
        kbSummary
      );

      const result = await generateTextWithJSONRetry<HumanizeOutput>(
        {
          system,
          prompt,
          maxOutputTokens: 1200,
          stage: "humanize",
        },
        (rawText) => buildJsonRepairPrompt(rawText, HUMANIZE_SCHEMA),
        cancelToken
      );

      humanizedChapters.push(result.data);

      if (result.usage) {
        totalInputTokens += result.usage.inputTokens;
        totalOutputTokens += result.usage.outputTokens;
      }
    }

    onProgress({
      stage: "humanize",
      status: "completed",
      progress: 100,
      message: `Humanized ${humanizedChapters.length} chapters successfully`,
    });

    // Track usage
    updateProjectAIUsage(
      project.id,
      "humanize",
      totalInputTokens,
      totalOutputTokens,
      isTextMockMode() ? "mock" : "claude"
    );

    return {
      success: true,
      data: { chapters: humanizedChapters },
      usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string };

    // If we have some chapters, return partial success
    if (humanizedChapters.length > 0) {
      return {
        success: true,
        data: { chapters: humanizedChapters },
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        error: `Partial: ${errorObj.message}`,
      };
    }

    onProgress({
      stage: "humanize",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to humanize chapters",
    });

    return {
      success: false,
      error: errorObj.message || "Unknown error",
    };
  }
}

// ============================================
// Stage Runner Factory
// ============================================

export type AIStageType = "outline" | "chapters" | "humanize";

export function isAIStage(stageId: string): stageId is AIStageType {
  return ["outline", "chapters", "humanize"].includes(stageId);
}

export function getAIStageDescription(stageId: AIStageType): string {
  switch (stageId) {
    case "outline":
      return "Generates a structured book outline with chapter goals and Islamic content references";
    case "chapters":
      return "Writes full chapter content with dialogue, vocabulary notes, and adab checks";
    case "humanize":
      return "Polishes and humanizes AI-generated text for more natural reading";
    default:
      return "";
  }
}
