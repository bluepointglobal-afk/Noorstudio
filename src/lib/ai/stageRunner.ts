// AI Stage Runner
// Executes AI-powered pipeline stages (Outline, Chapters, Humanize)

import { StoredProject, updateProject, getProject, getArtifactContent } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import { isTextMockMode, isImageMockMode } from "./config";
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
  buildIllustrationPrompt,
  buildCoverPrompt,
  generateSceneDescriptionFromChapter,
} from "./imagePrompts";
import {
  generateText,
  generateTextWithJSONRetry,
  CancelToken,
} from "./providers/textProvider";
import {
  generateImage,
  cancelImageGeneration,
  ImageGenerationRequest,
} from "./providers/imageProvider";
import { buildStageContext } from "./context";
import { GLOBAL_LIMITS } from "./tokenBudget";
import { AIUsageStats, StageRunnerProgress, StageRunnerResult } from "./types";
import {
  IllustrationArtifactItem,
  IllustrationVariant,
  CoverArtifactContent,
  LayoutArtifactContent,
  ChapterArtifactItem,
} from "@/lib/types/artifacts";
import { composeBookLayout, LayoutComposerInput } from "./layoutEngine";
import { generatePDF, generateEPUB } from "@/lib/export";
import type { ExportArtifactContent, ExportArtifactItem } from "@/lib/export/types";
import {
  createFrontCoverWithText,
  createBackCoverWithText,
  CoverTextConfig,
  BackCoverTextConfig,
} from "@/lib/utils/coverTextOverlay";

function generateAttemptId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

// ============================================
// Types
// ============================================

// Types are imported from ./types.ts

type ProgressCallback = (progress: StageRunnerProgress) => void;

// ============================================
// Usage Stats Management
// ============================================

export function getProjectAIUsage(project: StoredProject): AIUsageStats | null {
  const artifact = project.artifacts._aiUsage;
  if (artifact && 'content' in artifact) {
    return artifact.content as AIUsageStats;
  }
  return null;
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
    const attemptId = generateAttemptId();
    const context = buildStageContext("outline", project, characters, kbSummary);
    const { system, prompt } = buildOutlinePrompt(project, context.activeCharacters, context.kb);

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
        attemptId,
        projectId: project.id,
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

        if (!previousSummary && chapterNum > 1) {
          const prevText = existingChapterTextByNumber.get(chapterNum - 1);
          if (prevText) {
            previousSummary = `Chapter ${chapterNum - 1}: ${prevText.substring(0, 200)}...`;
          }
        }

        const generatedCountSoFar = generatedChapters.length;

        onProgress({
          stage: "chapters",
          status: "running",
          progress: Math.round(((generatedCountSoFar + 1) / Math.max(1, chaptersToGenerateCount)) * 90) + 5,
          message: `Generating Chapter ${chapterNum}/${totalChapters}...`,
          subProgress: {
            current: chapterNum,
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

        const attemptId = generateAttemptId();
        const context = buildStageContext("chapters", project, characters, kbSummary);

        const { system, prompt } = buildChapterPrompt(
          project,
          chapterContext,
          context.activeCharacters,
          context.kb
        );

        const result = await generateTextWithJSONRetry<ChapterOutput>(
          {
            system,
            prompt,
            maxOutputTokens: 2500,
            stage: "chapters",
            attemptId,
            projectId: project.id,
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
    const errorObj = error as { message?: string; cancelled?: boolean; rawText?: string };

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

      const attemptId = generateAttemptId();
      const context = buildStageContext("humanize", project, [], kbSummary);

      const { system, prompt } = buildHumanizePrompt(
        project,
        chapterNum,
        chapter.text,
        context.kb
      );

      const result = await generateTextWithJSONRetry<HumanizeOutput>(
        {
          system,
          prompt,
          maxOutputTokens: 2500,
          stage: "humanize",
          attemptId,
          projectId: project.id,
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
    const errorObj = error as { message?: string; rawText?: string };

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
// Illustrations Stage Runner
// ============================================

const VARIANTS_PER_ILLUSTRATION = 3;

export interface IllustrationsStageResult {
  illustrations: IllustrationArtifactItem[];
}

export async function runIllustrationsStage(
  project: StoredProject,
  chapters: ChapterOutput[],
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null,
  onProgress: ProgressCallback,
  cancelToken?: CancelToken,
  outline?: OutlineOutput
): Promise<StageRunnerResult<IllustrationsStageResult>> {
  const totalChapters = chapters.length;
  const totalGenerations = totalChapters * VARIANTS_PER_ILLUSTRATION;
  const generatedIllustrations: IllustrationArtifactItem[] = [];
  let completedGenerations = 0;

  // IMG2IMG Architecture: Store first chapter's illustration as character reference
  // This provides true image-to-image consistency instead of just seed reuse
  let characterConsistencyReference: string | undefined;
  
  // Consistency seed: we capture the first successful provider seed and reuse it
  // across subsequent img2img generations to reduce character drift.
  let globalConsistencySeed: number | undefined;

  onProgress({
    stage: "illustrations",
    status: "running",
    progress: 5,
    message: `Generating ${totalChapters} illustrations (${VARIANTS_PER_ILLUSTRATION} variants each) with img2img consistency...`,
  });

  try {
    for (let i = 0; i < chapters.length; i++) {
      if (cancelToken?.cancelled) {
        throw { message: "Generation cancelled", cancelled: true };
      }

      const chapter = chapters[i];
      const chapterNum = chapter.chapter_number;

      // Generate scene description from chapter
      // Use key_scene from outline if available (AI-generated scene suggestion)
      const outlineKeyScene = outline?.chapters?.[i]?.key_scene;
      const sceneDescription = generateSceneDescriptionFromChapter(
        chapter.text,
        chapter.chapter_title,
        outlineKeyScene
      );

      // Build prompt using imagePrompts
      const promptResult = buildIllustrationPrompt({
        project,
        chapterNumber: chapterNum,
        sceneDescription,
        characters,
        kbSummary,
      });

      // IMG2IMG Enhancement: Add first chapter's illustration as reference for consistency
      const enhancedReferences = [...promptResult.references];
      if (characterConsistencyReference && i > 0) {
        // Prepend the character reference so it has priority
        enhancedReferences.unshift(characterConsistencyReference);
        console.log(`[IMG2IMG] Chapter ${chapterNum}: Using first chapter illustration as character reference`);
      }

      const illustrationId = `ill-ch${chapterNum}-${generateAttemptId().substring(0, 8)}`;
      const variants: IllustrationVariant[] = [];

      // Generate 3 variants for this illustration
      for (let v = 0; v < VARIANTS_PER_ILLUSTRATION; v++) {
        if (cancelToken?.cancelled) {
          throw { message: "Generation cancelled", cancelled: true };
        }

        completedGenerations++;
        const overallProgress = Math.round((completedGenerations / totalGenerations) * 90) + 5;

        const progressMessage = i === 0 
          ? `Chapter ${chapterNum}: Generating base character reference (variant ${v + 1}/${VARIANTS_PER_ILLUSTRATION})...`
          : `Chapter ${chapterNum}: Generating with img2img reference (variant ${v + 1}/${VARIANTS_PER_ILLUSTRATION})...`;

        onProgress({
          stage: "illustrations",
          status: "running",
          progress: overallProgress,
          message: progressMessage,
          subProgress: {
            current: completedGenerations,
            total: totalGenerations,
            label: `${chapter.chapter_title} - Variant ${v + 1}`,
          },
        });

        try {
          const attemptId = generateAttemptId();
          // Use project dimensions or defaults (landscape for spreads)
          const illustrationWidth = project.illustrationDimensions?.width || 1536;
          const illustrationHeight = project.illustrationDimensions?.height || 1024;
          
          // Adjust reference strength based on whether we're using img2img
          // Higher strength for img2img to enforce character consistency
          const referenceStrength = characterConsistencyReference && i > 0 ? 0.95 : 0.85;
          
          const request: ImageGenerationRequest = {
            prompt: promptResult.prompt,
            references: enhancedReferences,
            style: promptResult.style,
            width: illustrationWidth,
            height: illustrationHeight,
            stage: "illustrations",
            attemptId,
            count: 1,

            // Enforce cross-chapter identity consistency with seed + img2img
            seed: globalConsistencySeed,
            referenceStrength,
          };

          const response = await generateImage(request);

          // Capture the first successful provider seed and reuse it for subsequent generations.
          const providerSeed = response.providerMeta?.seed;
          if (globalConsistencySeed === undefined && typeof providerSeed === "number") {
            globalConsistencySeed = providerSeed;
          }

          // Store first illustration as character reference for subsequent chapters
          if (i === 0 && v === 0 && !characterConsistencyReference) {
            characterConsistencyReference = response.imageUrl;
            console.log(`[IMG2IMG] Captured first chapter illustration as character reference: ${characterConsistencyReference.substring(0, 50)}...`);
          }

          variants.push({
            id: `${illustrationId}-v${v + 1}`,
            imageUrl: response.imageUrl,
            selected: v === 0, // First variant is selected by default
            generatedAt: new Date().toISOString(),
            seed: typeof providerSeed === "number" ? providerSeed : undefined,
            prompt: promptResult.prompt,
          });
        } catch (error) {
          // Log error but continue with other variants
          console.warn(`Failed to generate variant ${v + 1} for chapter ${chapterNum}:`, error);
        }
      }

      // Create illustration item with variants
      const nowIso = new Date().toISOString();

      const illustration: IllustrationArtifactItem = {
        id: illustrationId,
        chapterNumber: chapterNum,
        scene: sceneDescription,
        imageUrl: variants[0]?.imageUrl, // Default to first variant
        status: variants.length > 0 ? "draft" : "pending",
        variants,
        selectedVariantId: variants[0]?.id,
        characterIds: characters.map((c) => c.id),
        prompt: promptResult.prompt,
        references: enhancedReferences, // Store the enhanced references including img2img ref
        style: promptResult.style,
        regenerationCount: 0,
        history: variants.length
          ? variants.map((v) => ({
              at: v.generatedAt,
              action: "generated" as const,
              variantId: v.id,
              seed: v.seed,
              prompt: v.prompt,
            }))
          : [],
        generatedAt: nowIso,
      };

      generatedIllustrations.push(illustration);
    }

    const consistencyMethod = characterConsistencyReference 
      ? "img2img + seed" 
      : "seed-only (no multi-chapter)";
    
    onProgress({
      stage: "illustrations",
      status: "completed",
      progress: 100,
      message: `Generated ${generatedIllustrations.length} illustrations with ${VARIANTS_PER_ILLUSTRATION} variants each (${consistencyMethod})`,
    });

    // Track usage
    updateProjectAIUsage(
      project.id,
      "illustrations",
      0, // Image generation doesn't use text tokens
      0,
      isImageMockMode() ? "mock" : "nanobanana"
    );

    return {
      success: true,
      data: { illustrations: generatedIllustrations },
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; cancelled?: boolean };

    // If we have some illustrations, return partial success
    if (generatedIllustrations.length > 0) {
      onProgress({
        stage: "illustrations",
        status: "completed",
        progress: 100,
        message: `Partially generated ${generatedIllustrations.length}/${totalChapters} illustrations`,
      });

      return {
        success: true,
        data: { illustrations: generatedIllustrations },
        error: errorObj.message,
      };
    }

    onProgress({
      stage: "illustrations",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to generate illustrations",
    });

    return {
      success: false,
      error: errorObj.message || "Unknown error",
    };
  }
}

// ============================================
// Cover Stage Runner
// ============================================

export interface CoverStageResult {
  frontCoverUrl: string;
  backCoverUrl: string;
  frontCoverVariants?: string[];
  backCoverVariants?: string[];
}

export async function runCoverStage(
  project: StoredProject,
  characters: StoredCharacter[],
  kbSummary: KBRulesSummary | null,
  onProgress: ProgressCallback,
  cancelToken?: CancelToken
): Promise<StageRunnerResult<CoverStageResult>> {
  onProgress({
    stage: "cover",
    status: "running",
    progress: 5,
    message: "Preparing cover generation...",
  });

  try {
    // Get the moral/learning objective for cover theming
    const moral = project.learningObjective || "";

    // Generate front cover
    onProgress({
      stage: "cover",
      status: "running",
      progress: 20,
      message: "Generating front cover...",
      subProgress: {
        current: 1,
        total: 2,
        label: "Front Cover",
      },
    });

    if (cancelToken?.cancelled) {
      throw { message: "Generation cancelled", cancelled: true };
    }

    const frontPrompt = buildCoverPrompt({
      project,
      characters,
      kbSummary,
      coverType: "front",
      moral,
    });

    const frontAttemptId = generateAttemptId();
    // Use project cover dimensions or defaults (portrait)
    const coverWidth = project.coverDimensions?.width || 1024;
    const coverHeight = project.coverDimensions?.height || 1536;
    const frontRequest: ImageGenerationRequest = {
      prompt: frontPrompt.prompt,
      references: frontPrompt.references,
      style: frontPrompt.style,
      width: coverWidth,
      height: coverHeight,
      stage: "cover",
      attemptId: frontAttemptId,
      count: 1,
    };

    const frontResponse = await generateImage(frontRequest);

    // Generate back cover
    onProgress({
      stage: "cover",
      status: "running",
      progress: 60,
      message: "Generating back cover...",
      subProgress: {
        current: 2,
        total: 2,
        label: "Back Cover",
      },
    });

    if (cancelToken?.cancelled) {
      throw { message: "Generation cancelled", cancelled: true };
    }

    const backPrompt = buildCoverPrompt({
      project,
      characters,
      kbSummary,
      coverType: "back",
      moral,
    });

    const backAttemptId = generateAttemptId();
    const backRequest: ImageGenerationRequest = {
      prompt: backPrompt.prompt,
      references: backPrompt.references,
      style: backPrompt.style,
      width: coverWidth,
      height: coverHeight,
      stage: "cover",
      attemptId: backAttemptId,
      count: 1,
    };

    const backResponse = await generateImage(backRequest);

    // Apply text overlay to covers
    onProgress({
      stage: "cover",
      status: "running",
      progress: 80,
      message: "Adding text to covers...",
    });

    let finalFrontCoverUrl = frontResponse.imageUrl;
    let finalBackCoverUrl = backResponse.imageUrl;

    // Apply text overlay to front cover
    try {
      const frontTextConfig: CoverTextConfig = {
        title: project.title,
        authorName: project.authorName,
        ageRange: project.ageRange,
        titlePosition: "top",
        shadowEnabled: true,
      };
      const frontWithText = await createFrontCoverWithText(
        frontResponse.imageUrl,
        frontTextConfig
      );
      finalFrontCoverUrl = frontWithText.dataUrl;
    } catch (textError) {
      console.warn("Failed to apply text to front cover, using original:", textError);
      // Fall back to original image
    }

    // Apply text overlay to back cover (with synopsis if available)
    try {
      // Get synopsis from outline if available
      const outlineContent = getArtifactContent<{ _structured?: OutlineOutput }>(project, "outline");
      const synopsis = outlineContent?._structured?.moral_lesson || project.learningObjective || "";

      const backTextConfig: BackCoverTextConfig = {
        synopsis: synopsis ? `"${synopsis}"` : undefined,
        authorBio: project.authorName ? `Written by ${project.authorName}` : undefined,
        credits: "Created with NoorStudio",
      };
      const backWithText = await createBackCoverWithText(
        backResponse.imageUrl,
        backTextConfig
      );
      finalBackCoverUrl = backWithText.dataUrl;
    } catch (textError) {
      console.warn("Failed to apply text to back cover, using original:", textError);
      // Fall back to original image
    }

    onProgress({
      stage: "cover",
      status: "completed",
      progress: 100,
      message: "Cover generation complete!",
    });

    // Track usage
    updateProjectAIUsage(
      project.id,
      "cover",
      0,
      0,
      isImageMockMode() ? "mock" : "nanobanana"
    );

    return {
      success: true,
      data: {
        frontCoverUrl: finalFrontCoverUrl,
        backCoverUrl: finalBackCoverUrl,
      },
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; cancelled?: boolean };

    onProgress({
      stage: "cover",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to generate covers",
    });

    return {
      success: false,
      error: errorObj.message || "Unknown error",
    };
  }
}

// ============================================
// Layout Stage Runner
// ============================================

export interface LayoutStageResult {
  layout: LayoutArtifactContent;
}

export async function runLayoutStage(
  project: StoredProject,
  chapters: ChapterArtifactItem[],
  illustrations: IllustrationArtifactItem[],
  onProgress: ProgressCallback,
  cancelToken?: CancelToken
): Promise<StageRunnerResult<LayoutStageResult>> {
  onProgress({
    stage: "layout",
    status: "running",
    progress: 5,
    message: "Preparing layout composition...",
  });

  try {
    if (cancelToken?.cancelled) {
      throw { message: "Layout cancelled", cancelled: true };
    }

    // Compose the book layout
    const layoutInput: LayoutComposerInput = {
      chapters,
      illustrations,
      trimSize: project.trimSize || "6x9",
      projectTitle: project.title,
    };

    const layout = composeBookLayout(layoutInput, (composerProgress) => {
      const progress = Math.round(
        5 + (composerProgress.current / composerProgress.total) * 90
      );
      onProgress({
        stage: "layout",
        status: "running",
        progress,
        message: composerProgress.message,
        subProgress: {
          current: composerProgress.current,
          total: composerProgress.total,
          label: composerProgress.message,
        },
      });
    });

    onProgress({
      stage: "layout",
      status: "completed",
      progress: 100,
      message: `Layout complete: ${layout.pageCount} pages in ${layout.spreads.length} spreads`,
    });

    return {
      success: true,
      data: { layout },
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; cancelled?: boolean };

    onProgress({
      stage: "layout",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to generate layout",
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

export type AIStageType = "outline" | "chapters" | "humanize" | "illustrations" | "cover" | "layout" | "export";

export function isAIStage(stageId: string): stageId is AIStageType {
  return ["outline", "chapters", "humanize", "illustrations", "cover", "layout", "export"].includes(stageId);
}

export function getAIStageDescription(stageId: AIStageType): string {
  switch (stageId) {
    case "outline":
      return "Generates a structured book outline with chapter goals and Islamic content references";
    case "chapters":
      return "Writes full chapter content with dialogue, vocabulary notes, and adab checks";
    case "humanize":
      return "Polishes and humanizes AI-generated text for more natural reading";
    case "illustrations":
      return "Generates illustrations for each chapter with 3 variants for selection";
    case "cover":
      return "Generates front and back cover images at portrait dimensions (1024x1536)";
    case "layout":
      return "Composes book pages with text flow and illustration placement";
    case "export":
      return "Generates PDF and EPUB files for download";
    default:
      return "";
  }
}

// ============================================
// Export Stage Runner
// ============================================

export interface ExportStageInput {
  project: StoredProject;
}

export interface ExportStageResult {
  success: boolean;
  data?: {
    export: ExportArtifactContent;
    pdfBlob?: Blob;
    epubBlob?: Blob;
  };
  error?: string;
}

export async function runExportStage(
  input: ExportStageInput,
  onProgress: ProgressCallback = () => {}
): Promise<ExportStageResult> {
  const { project } = input;

  try {
    onProgress({
      stage: "export",
      status: "running",
      progress: 0,
      message: "Preparing export...",
    });

    // Get required artifacts
    const layout = getArtifactContent<LayoutArtifactContent>(project, "layout");
    const cover = getArtifactContent<CoverArtifactContent>(project, "cover");
    const chapters = getArtifactContent<ChapterArtifactItem[]>(project, "chapters");

    if (!layout || !chapters) {
      return {
        success: false,
        error: "Missing required artifacts. Please complete layout and chapters stages first.",
      };
    }

    const files: ExportArtifactItem[] = [];
    let pdfBlob: Blob | undefined;
    let epubBlob: Blob | undefined;

    // Generate PDF
    onProgress({
      stage: "export",
      status: "running",
      progress: 10,
      message: "Generating PDF...",
    });

    try {
      const pdfResult = await generatePDF(
        {
          layout,
          cover: cover || { frontCoverUrl: undefined, backCoverUrl: undefined },
          chapters: chapters as ChapterArtifactItem[] & { _needsReview?: boolean; _rawText?: string | null },
          projectTitle: project.title,
          authorName: project.authorName,
        },
        (progress) => {
          const pdfProgress = 10 + (progress.current / progress.total) * 40;
          onProgress({
            stage: "export",
            status: "running",
            progress: Math.round(pdfProgress),
            message: progress.message,
          });
        }
      );

      pdfBlob = pdfResult.blob;
      files.push({
        format: "pdf",
        fileSize: pdfResult.fileSize,
        pageCount: pdfResult.pageCount,
        generatedAt: new Date().toISOString(),
        cached: false,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      // Continue with EPUB even if PDF fails
    }

    // Generate EPUB
    onProgress({
      stage: "export",
      status: "running",
      progress: 50,
      message: "Generating EPUB...",
    });

    try {
      const illustrations = getArtifactContent<IllustrationArtifactItem[]>(project, "illustrations");

      const epubResult = await generateEPUB(
        {
          layout,
          cover: cover || { frontCoverUrl: undefined, backCoverUrl: undefined },
          chapters: chapters as ChapterArtifactItem[] & { _needsReview?: boolean; _rawText?: string | null },
          illustrations: illustrations || undefined,
          projectTitle: project.title,
          authorName: project.authorName,
          language: "en",
        },
        (progress) => {
          const epubProgress = 50 + (progress.current / progress.total) * 40;
          onProgress({
            stage: "export",
            status: "running",
            progress: Math.round(epubProgress),
            message: progress.message,
          });
        }
      );

      epubBlob = epubResult.blob;
      files.push({
        format: "epub",
        fileSize: epubResult.fileSize,
        pageCount: epubResult.pageCount,
        generatedAt: new Date().toISOString(),
        cached: false,
      });
    } catch (error) {
      console.error("EPUB generation failed:", error);
      // Continue even if EPUB fails
    }

    if (files.length === 0) {
      return {
        success: false,
        error: "Failed to generate any export files.",
      };
    }

    const exportArtifact: ExportArtifactContent = {
      files,
      generatedAt: new Date().toISOString(),
    };

    onProgress({
      stage: "export",
      status: "completed",
      progress: 100,
      message: `Export complete: ${files.length} file(s) generated`,
    });

    return {
      success: true,
      data: {
        export: exportArtifact,
        pdfBlob,
        epubBlob,
      },
    };
  } catch (error: unknown) {
    const errorObj = error as { message?: string };

    onProgress({
      stage: "export",
      status: "error",
      progress: 0,
      message: errorObj.message || "Failed to generate exports",
    });

    return {
      success: false,
      error: errorObj.message || "Unknown error",
    };
  }
}
