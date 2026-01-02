// Image Provider Client
// Interface for NanoBanana and mock image generation

import { getAIConfig, isImageMockMode } from "../config";

// ============================================
// Types
// ============================================

export interface ImageGenerationRequest {
  prompt: string;
  references?: string[]; // URLs to reference images (e.g., pose sheets)
  style?: "realistic" | "cartoon" | "watercolor" | "flat";
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  providerMeta?: {
    seed?: number;
    model?: string;
    processingTime?: number;
    [key: string]: unknown;
  };
  provider: string;
}

export interface ImageGenerationError {
  error: string;
  message: string;
  retryable: boolean;
}

// ============================================
// Demo Images Pool
// ============================================

const DEMO_SPREADS = [
  "/demo/spreads/spread-1.png",
  "/demo/spreads/spread-2.png",
  "/demo/spreads/spread-3.png",
];

const DEMO_ILLUSTRATIONS = [
  "/demo/illustrations/scene-1.png",
  "/demo/illustrations/scene-2.png",
  "/demo/illustrations/scene-3.png",
];

// ============================================
// Mock Provider
// ============================================

async function mockImageGeneration(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

  // Pick a random demo image
  const pool = request.style === "flat" ? DEMO_SPREADS : DEMO_ILLUSTRATIONS;
  const randomIndex = Math.floor(Math.random() * pool.length);

  return {
    imageUrl: pool[randomIndex],
    providerMeta: {
      mock: true,
      prompt: request.prompt.substring(0, 100),
      style: request.style || "default",
      processingTime: Math.floor(800 + Math.random() * 700),
    },
    provider: "mock",
  };
}

// ============================================
// NanoBanana Provider (Stub)
// ============================================

async function nanobananaImageGeneration(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const config = getAIConfig();

  // Make API call to server proxy
  const response = await fetch(config.imageProxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: request.prompt,
      references: request.references,
      style: request.style,
      width: request.width,
      height: request.height,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      error: "Image generation failed",
      message: errorData.message || `HTTP ${response.status}`,
      retryable: response.status >= 500,
    } as ImageGenerationError;
  }

  return await response.json();
}

// ============================================
// Main Generation Function
// ============================================

export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  if (isImageMockMode()) {
    return mockImageGeneration(request);
  }

  return nanobananaImageGeneration(request);
}

// ============================================
// Batch Generation
// ============================================

export interface BatchImageResult {
  index: number;
  success: boolean;
  response?: ImageGenerationResponse;
  error?: ImageGenerationError;
}

export async function generateImageBatch(
  requests: ImageGenerationRequest[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchImageResult[]> {
  const results: BatchImageResult[] = [];

  for (let i = 0; i < requests.length; i++) {
    try {
      const response = await generateImage(requests[i]);
      results.push({ index: i, success: true, response });
    } catch (error) {
      results.push({
        index: i,
        success: false,
        error: error as ImageGenerationError,
      });
    }

    onProgress?.(i + 1, requests.length);
  }

  return results;
}

// ============================================
// Character Pose Integration
// ============================================

export interface CharacterPoseRequest {
  characterName: string;
  poseSheetUrl: string;
  scene: string;
  style?: ImageGenerationRequest["style"];
}

export function buildIllustrationPrompt(
  sceneDescription: string,
  characterPoses: CharacterPoseRequest[],
  ageRange: string
): ImageGenerationRequest {
  const characterContext = characterPoses
    .map((cp) => `${cp.characterName} (see reference pose sheet)`)
    .join(", ");

  const prompt = `Children's book illustration for ages ${ageRange}:
Scene: ${sceneDescription}
Characters: ${characterContext}
Style: Warm, inviting, culturally appropriate Islamic children's illustration.
Important: Characters should be modestly dressed as shown in references.`;

  return {
    prompt,
    references: characterPoses.map((cp) => cp.poseSheetUrl),
    style: characterPoses[0]?.style || "watercolor",
  };
}
