// BFL FLUX.2 Klein 9B Provider
// High-quality text-to-image generation for initial character creation
// Uses FLUX.2 Klein 9B (faster, 9B parameter model optimized for speed)

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface BFLImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  safety_tolerance?: number;
  // Note: FLUX.2 Klein 9B does NOT support input_image
  // For image-based generation, use Replicate instead
}

export interface BFLImageResponse {
  imageUrl: string;
  seed?: number;
  processingTimeMs?: number;
  jobId?: string;
}

/**
 * BFL FLUX.2 Klein 9B Provider
 *
 * CRITICAL: This provider is for TEXT-TO-IMAGE ONLY.
 * For image+text (character consistency), use Replicate.
 *
 * API: https://api.bfl.ai/v1/flux-2-klein-9b
 * Auth: x-key header
 * Flow: POST → {id, polling_url} → Poll until Ready → Download & store
 */
export class BFLProvider {
  private apiKey: string;
  private apiUrl = "https://api.bfl.ai/v1";
  private storageDir: string;

  constructor(apiKey: string, storageDir?: string) {
    this.apiKey = apiKey;
    // TODO: Replace with proper cloud storage (S3/GCS/Cloudinary)
    // For now, use local temp storage with env override
    this.storageDir = storageDir || process.env.IMAGE_STORAGE_DIR || "/tmp/noorstudio-images";

    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log(`[BFL] Created storage directory: ${this.storageDir}`);
    }
  }

  /**
   * Generate an image using FLUX.2 Klein 9B (text-to-image only)
   *
   * IMPORTANT: Optimal prompt length is 30-80 words (per FLUX docs).
   * Longer prompts may degrade quality or be truncated.
   */
  async generateImage(
    request: BFLImageRequest,
    traceId: string,
    retryCount = 0,
    maxRetries = 2
  ): Promise<BFLImageResponse> {
    const startTime = Date.now();

    try {
      console.log(JSON.stringify({
        trace_id: traceId,
        stage: "bfl_submit",
        provider: "bfl",
        model: "flux-2-klein-9b",
        prompt_length: request.prompt.length,
        width: request.width || 1024,
        height: request.height || 1024,
        timestamp: new Date().toISOString()
      }));

      // Warn if prompt is too long (FLUX optimal: 30-80 words)
      const wordCount = request.prompt.split(/\s+/).length;
      if (wordCount > 100) {
        console.warn(JSON.stringify({
          trace_id: traceId,
          warning: "prompt_too_long",
          word_count: wordCount,
          recommended: "30-80 words",
          message: "Long prompts may degrade FLUX quality"
        }));
      }

      // Step 1: Submit generation request
      const submitResponse = await fetch(`${this.apiUrl}/flux-2-klein-9b`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-key": this.apiKey,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.width || 1024,
          height: request.height || 1024,
          seed: request.seed,
          safety_tolerance: request.safety_tolerance ?? 2,
        }),
      });

      if (!submitResponse.ok) {
        const errorBody = await submitResponse.text();
        console.error(JSON.stringify({
          trace_id: traceId,
          error: "bfl_submit_failed",
          status: submitResponse.status,
          body: errorBody,
          timestamp: new Date().toISOString()
        }));
        throw new Error(`BFL submit failed (${submitResponse.status}): ${errorBody}`);
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.id;
      const pollingUrl = submitData.polling_url || `${this.apiUrl}/get_result?id=${jobId}`;

      console.log(JSON.stringify({
        trace_id: traceId,
        stage: "bfl_polling_started",
        job_id: jobId,
        polling_url: pollingUrl,
        timestamp: new Date().toISOString()
      }));

      // Step 2: Poll for result with exponential backoff
      const result = await this.pollForResult(jobId, pollingUrl, traceId);

      console.log(JSON.stringify({
        trace_id: traceId,
        stage: "bfl_ready",
        job_id: jobId,
        delivery_url: result.sample?.substring(0, 50) + "...",
        timestamp: new Date().toISOString()
      }));

      // Step 3: Download image and store locally (BFL URLs expire)
      const storedUrl = await this.downloadAndStore(result.sample, jobId, traceId);

      const processingTimeMs = Date.now() - startTime;

      console.log(JSON.stringify({
        trace_id: traceId,
        stage: "bfl_complete",
        job_id: jobId,
        stored_url: storedUrl,
        processing_time_ms: processingTimeMs,
        timestamp: new Date().toISOString()
      }));

      return {
        imageUrl: storedUrl,
        seed: request.seed,
        processingTimeMs,
        jobId,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error(JSON.stringify({
        trace_id: traceId,
        error: "bfl_generation_failed",
        attempt: retryCount + 1,
        max_retries: maxRetries + 1,
        message: err.message,
        timestamp: new Date().toISOString()
      }));

      // Retry on transient errors
      if (retryCount < maxRetries && this.isRetryableError(err)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(JSON.stringify({
          trace_id: traceId,
          action: "retry",
          delay_ms: delay,
          timestamp: new Date().toISOString()
        }));
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateImage(request, traceId, retryCount + 1, maxRetries);
      }

      throw new Error(`BFL image generation failed: ${err.message}`);
    }
  }

  /**
   * Poll BFL for generation result with exponential backoff
   * Timeout: 2 minutes (60 polls × 2s = 120s)
   */
  private async pollForResult(jobId: string, pollingUrl: string, traceId: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      // Exponential backoff: 2s, 2s, 3s, 4s, 6s, 8s, max 10s
      const delay = Math.min(2000 * Math.pow(1.2, i), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const response = await fetch(pollingUrl, {
        headers: {
          "x-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(JSON.stringify({
          trace_id: traceId,
          error: "bfl_poll_failed",
          status: response.status,
          body: errorText,
          timestamp: new Date().toISOString()
        }));
        throw new Error(`BFL poll error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (data.status === "Ready") {
        return data.result;
      } else if (data.status === "Failed" || data.status === "Error") {
        throw new Error(`BFL generation failed: ${data.error || "Unknown error"}`);
      }

      // Status is "Pending" - continue polling
      if (i % 5 === 0) { // Log every 5th poll to reduce noise
        console.log(JSON.stringify({
          trace_id: traceId,
          stage: "bfl_polling",
          status: data.status,
          attempt: i + 1,
          max_attempts: maxAttempts,
          timestamp: new Date().toISOString()
        }));
      }
    }

    throw new Error(`BFL generation timed out after ${maxAttempts} polling attempts`);
  }

  /**
   * Download image from BFL delivery URL and store locally
   *
   * CRITICAL: BFL delivery URLs expire. We MUST download and store
   * in our own storage before returning to frontend.
   *
   * TODO: Replace with cloud storage (S3/GCS/Cloudinary)
   */
  private async downloadAndStore(deliveryUrl: string, jobId: string, traceId: string): Promise<string> {
    try {
      console.log(JSON.stringify({
        trace_id: traceId,
        stage: "download_started",
        delivery_url: deliveryUrl.substring(0, 50) + "...",
        timestamp: new Date().toISOString()
      }));

      const response = await fetch(deliveryUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const filename = `bfl-${jobId}-${crypto.randomBytes(4).toString('hex')}.png`;
      const filepath = path.join(this.storageDir, filename);

      fs.writeFileSync(filepath, Buffer.from(buffer));

      // Return path that can be served via static middleware
      // TODO: Return cloud storage URL when implemented
      const publicUrl = `/stored-images/${filename}`;

      console.log(JSON.stringify({
        trace_id: traceId,
        stage: "download_complete",
        stored_path: filepath,
        public_url: publicUrl,
        size_bytes: buffer.byteLength,
        timestamp: new Date().toISOString()
      }));

      return publicUrl;
    } catch (error: unknown) {
      const err = error as Error;
      console.error(JSON.stringify({
        trace_id: traceId,
        error: "download_failed",
        message: err.message,
        timestamp: new Date().toISOString()
      }));
      throw new Error(`Failed to download and store BFL image: ${err.message}`);
    }
  }

  /**
   * Check if error is retryable (rate limits, transient failures)
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("500") ||
      message.includes("502") ||
      message.includes("503") ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("etimedout")
    );
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: "bfl",
      model: "flux-2-klein-9b",
    };
  }
}

export default BFLProvider;
