import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  generateIllustrationsAsAssets,
  generateCoverAsAsset,
  IllustrationGenerationOptions,
  CoverGenerationOptions,
  AssetGenerationProgress,
  AssetGenerationResult,
  GeneratedAsset,
} from "@/lib/ai/assetGeneration";

/**
 * Hook for generating illustrations as reusable assets
 */
export function useIllustrationGeneration() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<AssetGenerationProgress | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);

  const generate = useCallback(
    async (options: Omit<IllustrationGenerationOptions, "onProgress">) => {
      setIsGenerating(true);
      setProgress(null);
      setGeneratedAssets([]);

      try {
        const result = await generateIllustrationsAsAssets({
          ...options,
          onProgress: (p) => setProgress(p),
        });

        if (result.success) {
          setGeneratedAssets(result.assets);
          toast({
            title: "Illustrations Generated",
            description: `Created ${result.assets.length} illustration(s) and linked to book.`,
          });
        } else {
          toast({
            title: "Generation Failed",
            description: result.error || "Failed to generate illustrations",
            variant: "destructive",
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "Generation Error",
          description: errorMessage,
          variant: "destructive",
        });
        return {
          success: false,
          assets: [],
          linkedToBook: false,
          error: errorMessage,
        } as AssetGenerationResult;
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setProgress(null);
    setGeneratedAssets([]);
  }, []);

  return {
    generate,
    isGenerating,
    progress,
    generatedAssets,
    reset,
  };
}

/**
 * Hook for generating covers as reusable assets
 */
export function useCoverGeneration() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<AssetGenerationProgress | null>(null);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);

  const generate = useCallback(
    async (options: Omit<CoverGenerationOptions, "onProgress">) => {
      setIsGenerating(true);
      setProgress(null);
      setGeneratedAsset(null);

      try {
        const result = await generateCoverAsAsset({
          ...options,
          onProgress: (p) => setProgress(p),
        });

        if (result.success && result.assets.length > 0) {
          setGeneratedAsset(result.assets[0]);
          toast({
            title: "Cover Generated",
            description: `Created ${options.coverType || "front"} cover and linked to book.`,
          });
        } else {
          toast({
            title: "Generation Failed",
            description: result.error || "Failed to generate cover",
            variant: "destructive",
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "Generation Error",
          description: errorMessage,
          variant: "destructive",
        });
        return {
          success: false,
          assets: [],
          linkedToBook: false,
          error: errorMessage,
        } as AssetGenerationResult;
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setProgress(null);
    setGeneratedAsset(null);
  }, []);

  return {
    generate,
    isGenerating,
    progress,
    generatedAsset,
    reset,
  };
}

/**
 * Combined hook for both illustrations and covers
 */
export function useAssetGeneration() {
  const illustrations = useIllustrationGeneration();
  const cover = useCoverGeneration();

  return {
    illustrations,
    cover,
  };
}
