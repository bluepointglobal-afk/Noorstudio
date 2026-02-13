// Replicate AI Provider for Character Consistency
// Uses IP-Adapter models for maintaining character appearance across scenes

import Replicate from "replicate";
import * as fs from "fs/promises";
import * as path from "path";
import { uploadToCloudinary } from "./cloudinaryUpload";

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
  private storageDir: string;

  constructor(apiToken: string, model?: string, storageDir?: string) {
    this.client = new Replicate({ auth: apiToken });
    // Default to the consistent-character model (specific version for stability)
    this.model = model || "fofr/consistent-character:9c77a3c2f884193fcee4d89645f02a0b9def9434f9e03cb98460456b831c8772";
    this.storageDir = storageDir || process.env.IMAGE_STORAGE_DIR || "/tmp/noorstudio-images";
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

        // Add reference strength if provided (controls how strongly to match the reference)
        // Higher values (0.8-1.0) = stronger character consistency, lower prompt influence
        // Lower values (0.4-0.6) = more prompt influence, weaker character lock
        if (request.referenceStrength !== undefined) {
          input.prompt_strength = request.referenceStrength;
          console.log(`[Replicate] Using reference strength: ${request.referenceStrength}`);
        }
      }

      // Add seed for reproducibility
      if (request.seed !== undefined) {
        input.seed = request.seed;
      }

      console.log(`[Replicate] Generating image with model: ${this.model}`);
      console.log(`[Replicate] Character reference: ${request.subjectImageUrl ? 'Yes' : 'No'}`);
      console.log(`[Replicate] Full input:`, JSON.stringify(input, null, 2));

      // Run the model
      console.log(`[Replicate] Calling Replicate API...`);
      const output = await this.client.run(this.model as `${string}/${string}:${string}`, { input });
      console.log(`[Replicate] API call succeeded, output type: ${typeof output}`);
      console.log(`[Replicate] Raw output:`, JSON.stringify(output));

      const processingTimeMs = Date.now() - startTime;

      // Extract image from output (Replicate can return streams, URLs, or various object formats)
      let imageUrl: string;

      // Check if output is an array with a ReadableStream (newer Replicate SDK behavior)
      if (Array.isArray(output) && output.length > 0) {
        const firstElement = output[0];

        // Check if it's a ReadableStream (has getReader method)
        if (firstElement && typeof firstElement === 'object' && 'getReader' in firstElement) {
          console.log(`[Replicate] Detected ReadableStream output, downloading...`);
          imageUrl = await this.downloadStreamAndStore(firstElement as ReadableStream, processingTimeMs);
        } else if (typeof firstElement === 'string') {
          // It's already a URL string
          imageUrl = firstElement;
        } else {
          console.error(`[Replicate] Unexpected array element type:`, typeof firstElement);
          throw new Error(`Unexpected array element type: ${typeof firstElement}`);
        }
      } else if (typeof output === 'string') {
        imageUrl = output;
      } else if (typeof output === 'object' && output !== null) {
        // Handle object response (some models return {output: [...]} or {image: "..."})
        const outputObj = output as Record<string, any>;

        console.log(`[Replicate] Attempting to extract URL from object:`, JSON.stringify(outputObj).substring(0, 500));

        // Try various known output formats
        if (outputObj.output && Array.isArray(outputObj.output) && outputObj.output.length > 0) {
          imageUrl = outputObj.output[0];
        } else if (outputObj.image && typeof outputObj.image === 'string') {
          imageUrl = outputObj.image;
        } else if (outputObj.images && Array.isArray(outputObj.images) && outputObj.images.length > 0) {
          imageUrl = outputObj.images[0];
        } else if (outputObj.url && typeof outputObj.url === 'string') {
          imageUrl = outputObj.url;
        } else if (outputObj[0] && typeof outputObj[0] === 'string') {
          // Sometimes it's an object that looks like an array
          imageUrl = outputObj[0];
        } else {
          // Check if any field contains a URL-like string
          const urlFields = Object.entries(outputObj).find(([key, value]) =>
            typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))
          );
          if (urlFields) {
            console.log(`[Replicate] Found URL in field: ${urlFields[0]}`);
            imageUrl = urlFields[1] as string;
          } else {
            console.error(`[Replicate] Unexpected object structure - no URL found:`, JSON.stringify(output));
            console.error(`[Replicate] Object keys:`, Object.keys(outputObj));
            throw new Error(`Unexpected output format from Replicate: object without recognized image field. Keys: ${Object.keys(outputObj).join(', ')}`);
          }
        }
      } else {
        throw new Error(`Unexpected output format from Replicate: ${typeof output}`);
      }

      console.log(`[Replicate] Generation successful in ${processingTimeMs}ms`);
      console.log(`[Replicate] Final imageUrl:`, imageUrl);

      return {
        imageUrl,
        seed: request.seed,
        model: this.model,
        processingTimeMs,
      };
    } catch (error: unknown) {
      const err = error as Error & { response?: { status?: number } };
      console.error(`[Replicate] Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: err.message,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3).join('\n')
      });

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
   * Download a ReadableStream from Replicate and store it locally
   * Returns the public /stored-images/ URL
   */
  private async downloadStreamAndStore(
    stream: ReadableStream,
    processingTimeMs: number
  ): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const filename = `replicate-${timestamp}-${randomSuffix}`;

      console.log(`[Replicate] Downloading stream for: ${filename}`);

      // Read entire stream into buffer first (simpler and more reliable)
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Concatenate all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const buffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`[Replicate] Stream downloaded: ${totalLength} bytes in ${processingTimeMs}ms`);
      console.log(`[Replicate] Uploading to Cloudinary...`);

      // Upload to Cloudinary for permanent storage
      const cloudinaryUrl = await uploadToCloudinary(buffer, {
        folder: 'noorstudio/pose-packs',
        filename,
        format: 'webp',
      });

      console.log(`[Replicate] Upload complete: ${cloudinaryUrl}`);

      return cloudinaryUrl;
    } catch (error) {
      const err = error as Error;
      console.error(`[Replicate] Stream download/upload failed:`, err.message);
      console.error(`[Replicate] Error stack:`, err.stack);
      throw new Error(`Failed to download/upload Replicate stream: ${err.message}`);
    }
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
