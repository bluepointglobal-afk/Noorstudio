// FLUX (Black Forest Labs) Provider
// High-quality text-to-image generation for initial character creation

export interface FluxImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  safety_tolerance?: number;
}

export interface FluxImageResponse {
  imageUrl: string;
  seed?: number;
  processingTimeMs?: number;
}

export class FluxProvider {
  private apiKey: string;
  private apiUrl = "https://api.bfl.ml/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate an image using FLUX
   * Using FLUX.1 [dev] model for high-quality generation
   */
  async generateImage(
    request: FluxImageRequest,
    retryCount = 0,
    maxRetries = 2
  ): Promise<FluxImageResponse> {
    try {
      const startTime = Date.now();

      console.log(`[FLUX] Generating image...`);
      console.log(`[FLUX] Prompt length: ${request.prompt.length}`);

      // Step 1: Create the generation request
      console.log(`[FLUX] Calling API: ${this.apiUrl}/flux-pro-1.1`);
      const response = await fetch(`${this.apiUrl}/flux-pro-1.1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Key": this.apiKey,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.width || 768,
          height: request.height || 1024,
          prompt_upsampling: false,
          seed: request.seed,
          safety_tolerance: request.safety_tolerance || 2,
        }),
      });

      console.log(`[FLUX] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FLUX] API error response:`, errorText);
        throw new Error(`FLUX API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const requestId = data.id;

      console.log(`[FLUX] Request created: ${requestId}`);

      // Step 2: Poll for result
      let result = await this.pollForResult(requestId);

      const processingTimeMs = Date.now() - startTime;
      console.log(`[FLUX] Generation successful in ${processingTimeMs}ms`);

      return {
        imageUrl: result.sample,
        seed: request.seed,
        processingTimeMs,
      };
    } catch (error: unknown) {
      const err = error as Error & { cause?: Error };
      console.error(`[FLUX] Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: err.message,
        name: err.name,
        cause: err.cause?.message,
        stack: err.stack?.split('\n').slice(0, 3)
      });

      // Retry on transient errors
      if (retryCount < maxRetries && this.isRetryableError(err)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[FLUX] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateImage(request, retryCount + 1, maxRetries);
      }

      throw new Error(`FLUX image generation failed: ${err.message}`);
    }
  }

  /**
   * Poll for generation result
   */
  private async pollForResult(requestId: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls

      const response = await fetch(`${this.apiUrl}/get_result?id=${requestId}`, {
        headers: {
          "X-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FLUX poll error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (data.status === "Ready") {
        return data.result;
      } else if (data.status === "Error") {
        throw new Error(`FLUX generation failed: ${data.error || "Unknown error"}`);
      }

      // Status is "Pending" - continue polling
      console.log(`[FLUX] Status: ${data.status}, polling... (${i + 1}/${maxAttempts})`);
    }

    throw new Error("FLUX generation timed out after polling");
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
      message.includes("timeout")
    );
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: "flux",
      model: "flux-pro-1.1",
    };
  }
}

export default FluxProvider;
