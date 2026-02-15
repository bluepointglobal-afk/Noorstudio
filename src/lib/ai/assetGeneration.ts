// Asset-Integrated AI Generation
// Connects AI generation to the asset management system

import { StoredProject } from "@/lib/storage/projectsStore";
import { StoredCharacter } from "@/lib/storage/charactersStore";
import { KBRulesSummary } from "@/lib/storage/knowledgeBaseStore";
import { createAsset, updateAsset, listAssets } from "@/lib/api/assetApi";
import { createBookAsset } from "@/lib/api/bookAssetApi";
import { getUniverse } from "@/lib/api/universeApi";
import {
  buildIllustrationPrompt,
  buildCoverPrompt,
  generateSceneDescriptionFromChapter,
} from "./imagePrompts";
import {
  generateImage,
  cancelImageGeneration,
  ImageGenerationRequest,
} from "./providers/imageProvider";
import { CancelToken } from "./providers/textProvider";
import type { ChapterOutput, OutlineOutput } from "./prompts";

// ============================================
// Types
// ============================================

export interface AssetGenerationProgress {
  stage: "illustrations" | "cover";
  status: "running" | "completed" | "error";
  progress: number; // 0-100
  message: string;
  currentAssetId?: string;
  totalAssets?: number;
  completedAssets?: number;
}

export interface IllustrationGenerationOptions {
  project: StoredProject;
  chapters: ChapterOutput[];
  characters: StoredCharacter[];
  kbSummary: KBRulesSummary | null;
  outline?: OutlineOutput;
  variantsPerIllustration?: number;
  reuseApproved?: boolean; // Reuse approved illustrations from universe
  onProgress?: (progress: AssetGenerationProgress) => void;
  cancelToken?: CancelToken;
}

export interface CoverGenerationOptions {
  project: StoredProject;
  title: string;
  subtitle?: string;
  authorName?: string;
  coverType?: "front" | "back" | "full";
  template?: "classic" | "modern" | "minimalist" | "ornate" | "custom";
  customPrompt?: string;
  variantsPerCover?: number;
  reuseApproved?: boolean;
  onProgress?: (progress: AssetGenerationProgress) => void;
  cancelToken?: CancelToken;
}

export interface GeneratedAsset {
  id: string;
  name: string;
  type: "illustration" | "cover";
  status: "pending" | "draft" | "approved";
  thumbnailUrl?: string;
  fileUrls: string[];
  usageCount: number;
}

export interface AssetGenerationResult {
  success: boolean;
  assets: GeneratedAsset[];
  linkedToBook: boolean;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get universe context for enhanced prompt generation
 */
async function getUniverseContext(universeId: string) {
  try {
    const universe = await getUniverse(universeId);
    return {
      name: universe.name,
      description: universe.description,
      seriesBible: universe.seriesBible,
      visualDNA: universe.visualDNA,
      writingDNA: universe.writingDNA,
    };
  } catch (error) {
    console.warn("Failed to load universe context:", error);
    return null;
  }
}

/**
 * Check if approved illustration already exists for this scene
 */
async function findApprovedIllustration(
  universeId: string,
  sceneDescription: string
): Promise<GeneratedAsset | null> {
  try {
    const assets = await listAssets(universeId, "illustration");
    const approved = assets.filter(
      (a) =>
        (a.data as any)?.status === "approved" &&
        (a.data as any)?.scene?.toLowerCase().includes(sceneDescription.toLowerCase())
    );

    if (approved.length > 0) {
      const asset = approved[0];
      return {
        id: asset.id,
        name: asset.name,
        type: "illustration",
        status: "approved",
        thumbnailUrl: asset.thumbnailUrl || undefined,
        fileUrls: asset.fileUrls || [],
        usageCount: asset.usageCount || 0,
      };
    }
    return null;
  } catch (error) {
    console.warn("Failed to search for approved illustrations:", error);
    return null;
  }
}

/**
 * Check if approved cover already exists
 */
async function findApprovedCover(
  universeId: string,
  title: string,
  coverType: string
): Promise<GeneratedAsset | null> {
  try {
    const assets = await listAssets(universeId, "cover");
    const approved = assets.filter(
      (a) =>
        (a.data as any)?.status === "approved" &&
        (a.data as any)?.coverType === coverType &&
        (a.data as any)?.title?.toLowerCase() === title.toLowerCase()
    );

    if (approved.length > 0) {
      const asset = approved[0];
      return {
        id: asset.id,
        name: asset.name,
        type: "cover",
        status: "approved",
        thumbnailUrl: asset.thumbnailUrl || undefined,
        fileUrls: asset.fileUrls || [],
        usageCount: asset.usageCount || 0,
      };
    }
    return null;
  } catch (error) {
    console.warn("Failed to search for approved covers:", error);
    return null;
  }
}

// ============================================
// Illustration Generation
// ============================================

/**
 * Generate illustrations and save as reusable assets
 */
export async function generateIllustrationsAsAssets(
  options: IllustrationGenerationOptions
): Promise<AssetGenerationResult> {
  const {
    project,
    chapters,
    characters,
    kbSummary,
    outline,
    variantsPerIllustration = 2,
    reuseApproved = true,
    onProgress,
    cancelToken,
  } = options;

  const generatedAssets: GeneratedAsset[] = [];
  const totalChapters = chapters.length;
  let completedChapters = 0;

  // Get universe context if available
  const universeContext = project.universeId
    ? await getUniverseContext(project.universeId)
    : null;

  onProgress?.({
    stage: "illustrations",
    status: "running",
    progress: 5,
    message: `Generating ${totalChapters} illustrations...`,
    totalAssets: totalChapters,
    completedAssets: 0,
  });

  try {
    for (let i = 0; i < chapters.length; i++) {
      if (cancelToken?.cancelled) {
        throw new Error("Generation cancelled");
      }

      const chapter = chapters[i];
      const chapterNum = chapter.chapter_number;

      // Generate scene description
      const outlineKeyScene = outline?.chapters?.[i]?.key_scene;
      const sceneDescription = generateSceneDescriptionFromChapter(
        chapter.text,
        chapter.chapter_title,
        outlineKeyScene
      );

      // Check for approved illustration if reuse enabled
      if (reuseApproved && project.universeId) {
        const existingAsset = await findApprovedIllustration(
          project.universeId,
          sceneDescription
        );

        if (existingAsset) {
          // Link existing asset to book
          await createBookAsset({
            bookId: project.id,
            assetId: existingAsset.id,
            role: "illustration",
            usageContext: {
              chapter: chapterNum,
              scene: sceneDescription,
            },
          });

          generatedAssets.push(existingAsset);
          completedChapters++;

          onProgress?.({
            stage: "illustrations",
            status: "running",
            progress: Math.round((completedChapters / totalChapters) * 90) + 5,
            message: `Reused approved illustration for Chapter ${chapterNum}`,
            currentAssetId: existingAsset.id,
            totalAssets: totalChapters,
            completedAssets: completedChapters,
          });

          continue;
        }
      }

      // Build enhanced prompt with universe context
      const basePrompt = buildIllustrationPrompt({
        project,
        chapterNumber: chapterNum,
        sceneDescription,
        characters,
        kbSummary,
      });

      // Enhance prompt with universe context
      let enhancedPrompt = basePrompt;
      if (universeContext) {
        enhancedPrompt = `${basePrompt}\n\nUniverse Context: ${universeContext.description}`;
        if (universeContext.visualDNA) {
          const visualStyle = (universeContext.visualDNA as any)?.style;
          if (visualStyle) {
            enhancedPrompt += `\nVisual Style: ${visualStyle}`;
          }
        }
      }

      // Create pending asset
      const assetName = `${project.title} - Chapter ${chapterNum}`;
      const asset = await createAsset({
        universeId: project.universeId || undefined,
        type: "illustration",
        name: assetName,
        description: sceneDescription,
        data: {
          prompt: enhancedPrompt,
          scene: sceneDescription,
          chapterNumber: chapterNum,
          status: "pending",
          variants: [],
        },
        tags: ["illustration", "chapter", `chapter-${chapterNum}`],
      });

      onProgress?.({
        stage: "illustrations",
        status: "running",
        progress: Math.round((completedChapters / totalChapters) * 90) + 5,
        message: `Generating illustration for Chapter ${chapterNum}...`,
        currentAssetId: asset.id,
        totalAssets: totalChapters,
        completedAssets: completedChapters,
      });

      // Generate image variants
      const variants: any[] = [];
      for (let v = 0; v < variantsPerIllustration; v++) {
        if (cancelToken?.cancelled) break;

        const imageRequest: ImageGenerationRequest = {
          prompt: enhancedPrompt,
          width: 1024,
          height: 1024,
          style: "children_book_illustration",
        };

        try {
          const imageResult = await generateImage(imageRequest);
          variants.push({
            id: `var-${v}`,
            imageUrl: imageResult.imageUrl,
            selected: v === 0,
            seed: imageResult.seed,
            generatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error(`Failed to generate variant ${v}:`, error);
        }
      }

      // Update asset with variants
      const thumbnailUrl = variants[0]?.imageUrl;
      const fileUrls = variants.map((v) => v.imageUrl);

      await updateAsset(asset.id, {
        data: {
          prompt: enhancedPrompt,
          scene: sceneDescription,
          chapterNumber: chapterNum,
          status: "draft",
          variants,
        },
        thumbnailUrl,
        fileUrls,
      });

      // Link asset to book
      await createBookAsset({
        bookId: project.id,
        assetId: asset.id,
        role: "illustration",
        usageContext: {
          chapter: chapterNum,
          scene: sceneDescription,
        },
      });

      generatedAssets.push({
        id: asset.id,
        name: assetName,
        type: "illustration",
        status: "draft",
        thumbnailUrl,
        fileUrls,
        usageCount: 1,
      });

      completedChapters++;
    }

    onProgress?.({
      stage: "illustrations",
      status: "completed",
      progress: 100,
      message: `Generated ${completedChapters} illustrations`,
      totalAssets: totalChapters,
      completedAssets: completedChapters,
    });

    return {
      success: true,
      assets: generatedAssets,
      linkedToBook: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    onProgress?.({
      stage: "illustrations",
      status: "error",
      progress: Math.round((completedChapters / totalChapters) * 100),
      message: `Error: ${errorMessage}`,
      totalAssets: totalChapters,
      completedAssets: completedChapters,
    });

    return {
      success: false,
      assets: generatedAssets,
      linkedToBook: false,
      error: errorMessage,
    };
  }
}

// ============================================
// Cover Generation
// ============================================

/**
 * Generate cover and save as reusable asset
 */
export async function generateCoverAsAsset(
  options: CoverGenerationOptions
): Promise<AssetGenerationResult> {
  const {
    project,
    title,
    subtitle,
    authorName,
    coverType = "front",
    template = "classic",
    customPrompt,
    variantsPerCover = 2,
    reuseApproved = true,
    onProgress,
    cancelToken,
  } = options;

  const generatedAssets: GeneratedAsset[] = [];

  // Get universe context if available
  const universeContext = project.universeId
    ? await getUniverseContext(project.universeId)
    : null;

  onProgress?.({
    stage: "cover",
    status: "running",
    progress: 10,
    message: `Generating ${coverType} cover...`,
    totalAssets: 1,
    completedAssets: 0,
  });

  try {
    // Check for approved cover if reuse enabled
    if (reuseApproved && project.universeId) {
      const existingAsset = await findApprovedCover(
        project.universeId,
        title,
        coverType
      );

      if (existingAsset) {
        // Link existing asset to book
        await createBookAsset({
          bookId: project.id,
          assetId: existingAsset.id,
          role: "cover",
          usageContext: {
            position: coverType,
            format: "print",
          },
        });

        onProgress?.({
          stage: "cover",
          status: "completed",
          progress: 100,
          message: `Reused approved ${coverType} cover`,
          currentAssetId: existingAsset.id,
          totalAssets: 1,
          completedAssets: 1,
        });

        return {
          success: true,
          assets: [existingAsset],
          linkedToBook: true,
        };
      }
    }

    // Build enhanced prompt
    const basePrompt =
      customPrompt ||
      buildCoverPrompt({
        project,
        title,
        subtitle,
        authorName,
        coverType,
        template,
      });

    let enhancedPrompt = basePrompt;
    if (universeContext) {
      enhancedPrompt = `${basePrompt}\n\nUniverse: ${universeContext.description}`;
      if (universeContext.visualDNA) {
        const visualStyle = (universeContext.visualDNA as any)?.style;
        if (visualStyle) {
          enhancedPrompt += `\nVisual Style: ${visualStyle}`;
        }
      }
    }

    // Create pending asset
    const assetName = `${title} - ${coverType} cover`;
    const asset = await createAsset({
      universeId: project.universeId || undefined,
      type: "cover",
      name: assetName,
      description: `${template} ${coverType} cover for ${title}`,
      data: {
        coverType,
        template,
        title,
        subtitle,
        authorName,
        prompt: enhancedPrompt,
        status: "pending",
        variants: [],
      },
      tags: ["cover", coverType, template],
    });

    onProgress?.({
      stage: "cover",
      status: "running",
      progress: 30,
      message: `Generating ${coverType} cover variants...`,
      currentAssetId: asset.id,
      totalAssets: 1,
      completedAssets: 0,
    });

    // Generate variants
    const variants: any[] = [];
    const dimensions = coverType === "full" ? { width: 1800, height: 900 } : { width: 600, height: 900 };

    for (let v = 0; v < variantsPerCover; v++) {
      if (cancelToken?.cancelled) break;

      const imageRequest: ImageGenerationRequest = {
        prompt: enhancedPrompt,
        width: dimensions.width,
        height: dimensions.height,
        style: "book_cover",
      };

      try {
        const imageResult = await generateImage(imageRequest);
        variants.push({
          id: `var-${v}`,
          imageUrl: imageResult.imageUrl,
          selected: v === 0,
          seed: imageResult.seed,
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to generate cover variant ${v}:`, error);
      }
    }

    // Update asset with variants
    const thumbnailUrl = variants[0]?.imageUrl;
    const fileUrls = variants.map((v) => v.imageUrl);

    await updateAsset(asset.id, {
      data: {
        coverType,
        template,
        title,
        subtitle,
        authorName,
        prompt: enhancedPrompt,
        status: "draft",
        variants,
      },
      thumbnailUrl,
      fileUrls,
    });

    // Link asset to book
    await createBookAsset({
      bookId: project.id,
      assetId: asset.id,
      role: "cover",
      usageContext: {
        position: coverType,
        format: "print",
      },
    });

    generatedAssets.push({
      id: asset.id,
      name: assetName,
      type: "cover",
      status: "draft",
      thumbnailUrl,
      fileUrls,
      usageCount: 1,
    });

    onProgress?.({
      stage: "cover",
      status: "completed",
      progress: 100,
      message: `Generated ${coverType} cover`,
      currentAssetId: asset.id,
      totalAssets: 1,
      completedAssets: 1,
    });

    return {
      success: true,
      assets: generatedAssets,
      linkedToBook: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    onProgress?.({
      stage: "cover",
      status: "error",
      progress: 50,
      message: `Error: ${errorMessage}`,
      totalAssets: 1,
      completedAssets: 0,
    });

    return {
      success: false,
      assets: generatedAssets,
      linkedToBook: false,
      error: errorMessage,
    };
  }
}
