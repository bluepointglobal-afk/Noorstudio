// Replicate AI Provider for Character Consistency
// Uses IP-Adapter models for maintaining character appearance across scenes

import Replicate from "replicate";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
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
    // Using fofr/consistent-character with latest version hash
    // Version: 6d07be93 - generates multiple poses (separate images) which we stitch into a grid
    this.model = model || "fofr/consistent-character:6d07be932f1a1dcab88b599a25863a98e50768597ab4ed3b6c099ef0f707dc05";
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

      // Build input for fofr/consistent-character
      const input: Record<string, unknown> = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || this.buildDefaultNegativePrompt(),
        number_of_outputs: request.numOutputs || 4, // Generate 4 poses for 2×2 grid
        output_format: "webp",
        output_quality: 95,
        randomise_poses: true, // Get varied poses
      };

      // Add character reference if provided (IP-Adapter)
      if (request.subjectImageUrl) {
        input.subject = request.subjectImageUrl;

        // Prompt strength for reference adherence
        if (request.referenceStrength !== undefined) {
          input.prompt_strength = request.referenceStrength;
        } else {
          input.prompt_strength = 0.95; // Very high for strict consistency
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

      // Extract image URLs from output
      let imageUrls: string[] = [];

      // Handle array output (most common for number_of_outputs > 1)
      if (Array.isArray(output)) {
        console.log(`[Replicate] Output is array with ${output.length} elements`);

        for (const element of output) {
          if (element && typeof element === 'object' && 'getReader' in element) {
            // ReadableStream - download and store
            const url = await this.downloadStreamAndStore(element as ReadableStream, processingTimeMs);
            imageUrls.push(url);
          } else if (typeof element === 'string') {
            // URL string
            imageUrls.push(element);
          }
        }
      } else if (typeof output === 'string') {
        // Single URL string
        imageUrls.push(output);
      } else if (typeof output === 'object' && output !== null) {
        // Object response
        const outputObj = output as Record<string, any>;
        console.log(`[Replicate] Object output, keys:`, Object.keys(outputObj));

        if (outputObj.output && Array.isArray(outputObj.output)) {
          imageUrls = outputObj.output.filter((url: any) => typeof url === 'string');
        } else if (outputObj.images && Array.isArray(outputObj.images)) {
          imageUrls = outputObj.images.filter((url: any) => typeof url === 'string');
        } else if (outputObj.image && typeof outputObj.image === 'string') {
          imageUrls.push(outputObj.image);
        } else if (outputObj.url && typeof outputObj.url === 'string') {
          imageUrls.push(outputObj.url);
        }
      }

      if (imageUrls.length === 0) {
        console.error(`[Replicate] No image URLs extracted from output:`, JSON.stringify(output));
        throw new Error('No image URLs found in Replicate output');
      }

      console.log(`[Replicate] Extracted ${imageUrls.length} image URLs`);

      // If multiple images requested, stitch into grid
      let finalImageUrl: string;
      const numOutputs = request.numOutputs || 1;

      if (numOutputs > 1 && imageUrls.length > 1) {
        console.log(`[Replicate] Multiple outputs (${imageUrls.length}) - stitching into grid...`);

        // Determine grid dimensions based on count
        let cols = 2, rows = 2;
        if (imageUrls.length === 8) {
          cols = 3; rows = 3;
        } else if (imageUrls.length === 12) {
          cols = 3; rows = 4;
        }

        // Trim to expected count if needed
        const expectedCount = cols * rows;
        if (imageUrls.length > expectedCount) {
          console.log(`[Replicate] Trimming ${imageUrls.length} images to ${expectedCount} for ${cols}×${rows} grid`);
          imageUrls = imageUrls.slice(0, expectedCount);
        }

        finalImageUrl = await this.stitchImagesIntoGrid(imageUrls, cols, rows);
        console.log(`[Replicate] Grid stitched successfully: ${finalImageUrl}`);
      } else {
        // Single image
        finalImageUrl = imageUrls[0];
        console.log(`[Replicate] Single image: ${finalImageUrl}`);
      }

      console.log(`[Replicate] Generation successful in ${processingTimeMs}ms`);

      return {
        imageUrl: finalImageUrl,
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
   * Stitch multiple images into a grid layout
   * Downloads images, creates a grid, uploads to Cloudinary
   *
   * @param imageUrls - Array of image URLs to stitch (must be 4, 8, or 12)
   * @param cols - Number of columns (2 or 3)
   * @param rows - Number of rows (2, 3, or 4)
   * @returns Cloudinary URL of the stitched grid
   */
  async stitchImagesIntoGrid(
    imageUrls: string[],
    cols: number = 2,
    rows: number = 2
  ): Promise<string> {
    try {
      const expectedCount = cols * rows;
      if (imageUrls.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} images for ${cols}×${rows} grid, got ${imageUrls.length}`);
      }

      console.log(`[Replicate] Stitching ${imageUrls.length} images into ${cols}×${rows} grid...`);

      // Download all images as buffers
      const imageBuffers: Buffer[] = [];
      for (const url of imageUrls) {
        console.log(`[Replicate] Downloading image: ${url.substring(0, 80)}...`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download image from ${url}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffers.push(Buffer.from(arrayBuffer));
      }

      // Get dimensions of first image (assume all same size)
      const firstImage = sharp(imageBuffers[0]);
      const metadata = await firstImage.metadata();
      const imgWidth = metadata.width || 512;
      const imgHeight = metadata.height || 512;

      console.log(`[Replicate] Individual image size: ${imgWidth}×${imgHeight}`);

      // Calculate grid dimensions
      const gridWidth = imgWidth * cols;
      const gridHeight = imgHeight * rows;
      const padding = 10; // White padding between images

      console.log(`[Replicate] Creating grid canvas: ${gridWidth + (padding * (cols + 1))}×${gridHeight + (padding * (rows + 1))}`);

      // Create composite array for Sharp
      const composites: any[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = (col * imgWidth) + (padding * (col + 1));
        const y = (row * imgHeight) + (padding * (row + 1));

        composites.push({
          input: imageBuffers[i],
          top: y,
          left: x,
        });
      }

      // Create white background and composite all images
      const gridBuffer = await sharp({
        create: {
          width: gridWidth + (padding * (cols + 1)),
          height: gridHeight + (padding * (rows + 1)),
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite(composites)
        .webp({ quality: 95 })
        .toBuffer();

      console.log(`[Replicate] Grid created: ${gridBuffer.length} bytes`);

      // Upload to Cloudinary
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const filename = `pose-grid-${timestamp}-${randomSuffix}`;

      console.log(`[Replicate] Uploading grid to Cloudinary as: ${filename}`);

      const cloudinaryUrl = await uploadToCloudinary(gridBuffer, {
        folder: 'noorstudio/pose-packs',
        filename,
        format: 'webp',
      });

      console.log(`[Replicate] Grid upload complete: ${cloudinaryUrl}`);

      return cloudinaryUrl;
    } catch (error) {
      const err = error as Error;
      console.error(`[Replicate] Grid stitching failed:`, err.message);
      console.error(`[Replicate] Error stack:`, err.stack);
      throw new Error(`Failed to stitch images into grid: ${err.message}`);
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
      // Anatomy errors (CRITICAL - prevents 3 hands, etc.)
      "extra hands", "three hands", "multiple hands", "extra arms", "third arm",
      "extra fingers", "six fingers", "deformed hands", "malformed hands",
      "extra limbs", "missing limbs", "extra legs", "third leg",
      "bad anatomy", "incorrect anatomy", "anatomically incorrect",
      "distorted proportions", "wrong proportions", "deformed body",
      // Quality issues
      "blurry", "distorted", "low quality", "artifacts", "jpeg artifacts",
      "ugly", "mutated", "disfigured", "deformed face",
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
