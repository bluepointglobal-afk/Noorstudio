// Replicate AI Provider for Character Consistency
// Uses IP-Adapter models for maintaining character appearance across scenes

import Replicate from "replicate";

export interface ReplicateImageRequest {
  prompt: string;
  subjectImageUrl?: string; // Character reference image for consistency
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  numOutputs?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  referenceStrength?: number; // 0.0-1.0, controls how strongly to match the reference
}

export interface ReplicateImageResponse {
  imageUrl: string;
  seed?: number;
  model?: string;
  processingTimeMs?: number;
}

/**
 * Replicate Provider for Character-Consistent Image Generation
 * 
 * Uses the consistent-character model with IP-Adapter technology
 * to maintain character appearance across multiple scenes.
 */
export class ReplicateProvider {
  private client: Replicate;
  private model: string;

  constructor(apiToken: string, model?: string) {
    this.client = new Replicate({ auth: apiToken });
    // Default to the consistent-character model (specific version for stability)
    this.model = model || "fofr/consistent-character:9c77a3c2f884193fcee4d89645f02a0b9def9434f9e03cb98460456b831c8772";
  }

  /**
   * Generate an image with optional character reference for consistency
   */
  async generateImage(
    request: ReplicateImageRequest,
    retryCount = 0,
    maxRetries = 2
  ): Promise<ReplicateImageResponse> {
    try {
      const startTime = Date.now();

      // Build input for the consistent-character model
      // IMPORTANT: Use exact parameter names from Replicate API schema
      const input: Record<string, unknown> = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || this.buildDefaultNegativePrompt(),
        number_of_outputs: request.numOutputs || 1,
        output_format: "webp",
        output_quality: 95,
        randomise_poses: false, // Keep poses consistent
      };

      // Add character reference if provided (IP-Adapter for consistency)
      if (request.subjectImageUrl) {
        input.subject = request.subjectImageUrl;
        // Note: prompt_strength is NOT a valid parameter for this model
        // Character consistency is controlled by the subject image itself
      }

      // Add seed for reproducibility
      if (request.seed !== undefined) {
        input.seed = request.seed;
      }

      console.log(`[Replicate] Generating image with model: ${this.model}`);
      console.log(`[Replicate] Character reference: ${request.subjectImageUrl ? 'Yes' : 'No'}`);

      // Run the model
      const output = await this.client.run(this.model, { input });

      const processingTimeMs = Date.now() - startTime;

      // Extract image URL from output (Replicate returns an array)
      let imageUrl: string;
      if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0] as string;
      } else if (typeof output === 'string') {
        imageUrl = output;
      } else {
        throw new Error(`Unexpected output format from Replicate: ${typeof output}`);
      }

      console.log(`[Replicate] Generation successful in ${processingTimeMs}ms`);

      return {
        imageUrl,
        seed: request.seed,
        model: this.model,
        processingTimeMs,
      };
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number } };
      console.error(`[Replicate] Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err.message);

      // Retry on transient errors
      if (retryCount < maxRetries && this.isRetryableError(err)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Replicate] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateImage(request, retryCount + 1, maxRetries);
      }

      throw new Error(`Replicate image generation failed: ${err.message}`);
    }
  }

  /**
   * Generate multiple variations with the same character reference
   */
  async generateVariations(
    prompt: string,
    characterRefUrl: string,
    count: number = 3,
    options?: Partial<ReplicateImageRequest>
  ): Promise<ReplicateImageResponse[]> {
    const results: ReplicateImageResponse[] = [];
    
    for (let i = 0; i < count; i++) {
      // Use different seeds for variation while keeping character consistent
      const seed = options?.seed ? options.seed + i : undefined;
      
      const result = await this.generateImage({
        prompt,
        subjectImageUrl: characterRefUrl,
        seed,
        ...options,
      });
      
      results.push(result);
    }

    return results;
  }

  /**
   * Default negative prompt for Islamic children's book illustrations
   */
  private buildDefaultNegativePrompt(): string {
    return [
      // Text prevention
      "text", "words", "letters", "numbers", "watermark", "signature",
      // Character consistency issues
      "different face", "changed appearance", "wrong skin tone", "inconsistent character",
      "missing hijab", "different hair color", "wrong clothing", "character variation",
      // Quality issues
      "blurry", "distorted", "low quality", "artifacts", "bad anatomy", "deformed",
      "ugly", "mutated", "disfigured", "extra limbs", "missing limbs",
      // Content issues
      "scary", "violent", "inappropriate", "revealing clothing", "tight clothing",
      "adult content", "weapons", "blood",
    ].join(", ");
  }

  /**
   * Check if error is retryable (rate limits, transient failures)
   */
  private isRetryableError(error: Error & { response?: { status?: number } }): boolean {
    // Retry on 429 (rate limit) and 5xx (server errors)
    if (error.response?.status) {
      return error.response.status === 429 || error.response.status >= 500;
    }
    
    // Retry on network errors
    if (error.message.includes('ECONNRESET') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('network')) {
      return true;
    }

    return false;
  }

  /**
   * Get model info (useful for debugging/logging)
   */
  getModelInfo(): { model: string; provider: string } {
    return {
      model: this.model,
      provider: 'replicate',
    };
  }
}

export default ReplicateProvider;
