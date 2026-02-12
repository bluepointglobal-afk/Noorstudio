// Image Provider Client
// Interface for NanoBanana and mock image generation

import { getAIConfig, isImageMockMode } from "../config";
import { authenticatedFetch } from "@/lib/utils/api";

// ============================================
// Types
// ============================================

export interface ImageGenerationRequest {
  prompt: string;
  references?: string[]; // URLs to reference images (e.g., pose sheets, character refs)
  style?: string;
  width?: number;
  height?: number;
  stage: "illustrations" | "cover";
  attemptId?: string;
  count?: number;

  /**
   * Optional deterministic seed for consistency across generations.
   * When paired with reference images, helps lock identity.
   */
  seed?: number;

  /**
   * Optional reference/image consistency strength (provider-specific).
   * Higher values = stronger adherence to reference images.
   * Range: 0.0 - 1.0 (0.8-0.9 recommended for character consistency)
   */
  referenceStrength?: number;

  /**
   * Character reference URL for IP-Adapter based consistency.
   * This is the primary reference image that defines the character's appearance.
   */
  characterReference?: string;
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
];

// Use spreads as fallback for illustrations since illustrations folder doesn't exist
const DEMO_ILLUSTRATIONS = [
  "/demo/spreads/spread-1.png",
  "/demo/spreads/spread-2.png",
];

const DEMO_CHARACTERS = [
  "/demo/characters/amira.png",
  "/demo/characters/yusuf.png",
  "/demo/characters/fatima.png",
  "/demo/characters/omar.png",
  "/demo/characters/layla.png",
  "/demo/characters/zaid.png",
];

const DEMO_POSE_SHEETS = [
  "/demo/pose-sheets/amira-poses.png",
  "/demo/pose-sheets/yusuf-poses.png",
];

// ============================================
// Mock Provider
// ============================================

function hashToSeed(input: string): number {
  // Deterministic non-cryptographic hash → 32-bit unsigned int
  // (Good enough for stable mock seeds in tests/dev.)
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i); // hash * 33 ^ c
  }
  return hash >>> 0;
}

async function mockImageGeneration(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

  // Determine which pool to use based on request context
  let pool: string[];

  // Check if this is a character generation request (portrait, no references)
  const isCharacterGeneration =
    request.prompt.toLowerCase().includes("character reference sheet") ||
    request.prompt.toLowerCase().includes("character design brief") ||
    (request.height && request.width && request.height > request.width); // Portrait orientation

  // Check if this is a pose sheet request (landscape, 12 poses)
  const isPoseSheetGeneration =
    request.prompt.toLowerCase().includes("pose sheet") ||
    request.prompt.toLowerCase().includes("12 poses") ||
    request.prompt.toLowerCase().includes("4x3 grid");

  if (isCharacterGeneration) {
    pool = DEMO_CHARACTERS;
  } else if (isPoseSheetGeneration) {
    pool = DEMO_POSE_SHEETS;
  } else if (request.style === "flat") {
    pool = DEMO_SPREADS;
  } else {
    pool = DEMO_ILLUSTRATIONS;
  }

  // Deterministic seed behavior:
  // - If caller provided a seed, honor it.
  // - Otherwise derive a stable seed from the request payload.
  const derivedSeed = hashToSeed(
    JSON.stringify({
      prompt: request.prompt,
      references: request.references || [],
      style: request.style || "default",
      width: request.width,
      height: request.height,
      stage: request.stage,
    })
  );
  const effectiveSeed = typeof request.seed === "number" ? request.seed : derivedSeed;

  // Pick a deterministic image from the pool based on the effective seed.
  const index = pool.length ? effectiveSeed % pool.length : 0;

  return {
    imageUrl: pool[index],
    providerMeta: {
      mock: true,
      seed: effectiveSeed,
      prompt: request.prompt.substring(0, 100),
      style: request.style || "default",
      processingTime: Math.floor(800 + Math.random() * 700),
      imageType: isCharacterGeneration
        ? "character"
        : isPoseSheetGeneration
          ? "pose_sheet"
          : "illustration",
    },
    provider: "mock",
  };
}

// ============================================
// NanoBanana Provider with Retry & Fallback
// ============================================

// Client-side retry config (server also has retry logic)
const CLIENT_MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s exponential backoff

// Active abort controller for cancellation support
let _imageAbortController: AbortController | null = null;

/**
 * Cancel any in-progress image generation request
 */
export function cancelImageGeneration(): void {
  if (_imageAbortController) {
    _imageAbortController.abort();
    _imageAbortController = null;
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nanobananaImageGeneration(
  request: ImageGenerationRequest,
  retryCount = 0
): Promise<ImageGenerationResponse> {
  const config = getAIConfig();

  console.log("[FRONTEND] Image generation request:", {
    provider: config.imageProvider,
    proxyUrl: config.imageProxyUrl,
    prompt: request.prompt.substring(0, 100) + "...",
    stage: request.stage,
    retryCount
  });

  // Create new abort controller for this request
  _imageAbortController = new AbortController();

  // Build references array with character reference first (if provided)
  const references: string[] = [];
  if (request.characterReference) {
    references.push(request.characterReference);
  }
  if (request.references) {
    references.push(...request.references);
  }

  try {
    // Make API call to server proxy
    const response = await authenticatedFetch(config.imageProxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: request.prompt,
        references: references.length > 0 ? references : undefined,
        style: request.style,
        width: request.width,
        height: request.height,
        task: request.stage === "cover" ? "cover" : "illustration",
        attemptId: request.attemptId,
        count: request.count,
        seed: request.seed,
        referenceStrength: request.referenceStrength,
      }),
      signal: _imageAbortController.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[FRONTEND] Backend returned error:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      const error: ImageGenerationError = {
        error: "Image generation failed",
        message: errorData.message || `HTTP ${response.status}`,
        retryable: response.status >= 500,
      };

      // Retry on 5xx errors
      if (error.retryable && retryCount < CLIENT_MAX_RETRIES) {
        console.warn(`Image generation failed (attempt ${retryCount + 1}/${CLIENT_MAX_RETRIES}), retrying...`);
        await sleep(RETRY_DELAYS[retryCount] || 8000);
        return nanobananaImageGeneration(request, retryCount + 1);
      }

      throw error;
    }

    const result = await response.json();
    console.log("[FRONTEND] Image generation successful:", {
      provider: result.provider,
      imageUrl: typeof result.imageUrl === 'string' ? result.imageUrl.substring(0, 50) + "..." : result.imageUrl
    });
    return result;
  } catch (error) {
    // Handle abort
    if (error instanceof Error && error.name === "AbortError") {
      throw {
        error: "Cancelled",
        message: "Image generation was cancelled",
        retryable: false,
      } as ImageGenerationError;
    }

    // Handle network errors with retry
    if (error instanceof TypeError && retryCount < CLIENT_MAX_RETRIES) {
      console.warn(`Network error (attempt ${retryCount + 1}/${CLIENT_MAX_RETRIES}), retrying...`);
      await sleep(RETRY_DELAYS[retryCount] || 8000);
      return nanobananaImageGeneration(request, retryCount + 1);
    }

    // If already an ImageGenerationError, rethrow
    if ((error as ImageGenerationError).error) {
      throw error;
    }

    // Unknown error - wrap it
    throw {
      error: "Image generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
      retryable: false,
    } as ImageGenerationError;
  } finally {
    _imageAbortController = null;
  }
}

/**
 * Generate image with fallback to mock on failure
 */
async function nanobananaWithFallback(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    return await nanobananaImageGeneration(request);
  } catch (error) {
    const imgError = error as ImageGenerationError;

    // Don't fallback on user cancellation
    if (imgError.error === "Cancelled") {
      throw error;
    }

    // Log failure for debugging
    console.error("Image generation failed after retries, falling back to mock:", imgError);

    // Fallback to mock with placeholder flag
    const mockResponse = await mockImageGeneration(request);
    return {
      ...mockResponse,
      provider: "mock-fallback",
      providerMeta: {
        ...mockResponse.providerMeta,
        placeholder: true,
        fallbackReason: imgError.message,
        originalError: imgError.error,
      },
    };
  }
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

  // Use fallback wrapper for production resilience
  return nanobananaWithFallback(request);
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

/**
 * Build illustration prompt with character consistency enforcement.
 * This is a simplified version for quick access; full compliance
 * is handled in imagePrompts.ts with the compliance guard.
 */
export function buildIllustrationPrompt(
  sceneDescription: string,
  characterPoses: CharacterPoseRequest[],
  ageRange: string
): ImageGenerationRequest {
  // Build detailed character context with immutable traits
  const characterContext = characterPoses
    .map((cp, idx) => {
      const lines = [
        `${cp.characterName} (CHARACTER ${idx + 1})`,
        `- MUST match reference pose sheet exactly`,
        `- Maintain consistent appearance throughout`,
      ];
      return lines.join("\n");
    })
    .join("\n\n");

  // Build multi-character differentiation if needed
  let multiCharGuide = "";
  if (characterPoses.length > 1) {
    multiCharGuide = `
=== MULTI-CHARACTER REQUIREMENTS ===
${characterPoses.length} characters in scene - each MUST be clearly distinguishable:
${characterPoses.map((cp, i) => `- Character ${i + 1}: ${cp.characterName}`).join("\n")}
Do NOT blend or merge character features between characters.
`;
  }

  const prompt = `Islamic Children's Book Illustration
Target audience: Ages ${ageRange}

## SCENE
${sceneDescription}

## CHARACTERS (MUST MATCH REFERENCES EXACTLY)
${characterContext}
${multiCharGuide}

## STYLE REQUIREMENTS
- Warm, inviting children's book illustration
- Soft lighting with gentle shadows
- Vibrant but harmonious colors
- Child-friendly expressions
- Clear focal point

## MODESTY REQUIREMENTS (MANDATORY)
- All characters must be modestly dressed as shown in references
- Characters with hijab MUST have hijab visible in every frame
- No tight or revealing clothing

## CRITICAL REQUIREMENTS
- NO text, words, or letters in the image
- Characters MUST match their reference images
- Consistent art style throughout
- Professional children's book quality`;

  return {
    prompt,
    references: characterPoses.map((cp) => cp.poseSheetUrl),
    style: characterPoses[0]?.style || "watercolor",
    stage: "illustrations",
  };
}

