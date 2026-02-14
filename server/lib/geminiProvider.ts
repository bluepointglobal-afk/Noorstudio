// Google Gemini/Imagen Provider for Image Generation
// Supports both text-to-image and image-to-image (img2img)
// Best for multi-pose character sheets

import { uploadToCloudinary } from "./cloudinaryUpload";

export interface GeminiImageRequest {
  prompt: string;
  referenceImageUrl?: string; // For img2img
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
}

export interface GeminiImageResponse {
  imageUrl: string;
  seed?: number;
  processingTimeMs?: number;
}

/**
 * Gemini/Imagen Provider for Image Generation
 *
 * Uses Google's Imagen 3 API for high-quality image generation
 * with excellent multi-pose character sheet capabilities.
 */
export class GeminiProvider {
  private apiKey: string;
  private apiUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate an image with optional reference image for img2img
   */
  async generateImage(
    request: GeminiImageRequest,
    retryCount = 0,
    maxRetries = 2
  ): Promise<GeminiImageResponse> {
    try {
      const startTime = Date.now();

      console.log(`[Gemini] Generating image...`);
      console.log(`[Gemini] Has reference: ${request.referenceImageUrl ? 'Yes' : 'No'}`);

      // Build request based on whether we have a reference image
      const payload = request.referenceImageUrl
        ? await this.buildImg2ImgRequest(request)
        : this.buildText2ImgRequest(request);

      console.log(`[Gemini] Calling API...`);

      // Call Gemini Image Generation API (using generateImages endpoint)
      const endpoint = `${this.apiUrl}/models/imagen-3.0-generate-001:predict?key=${this.apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini] API error:`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[Gemini] Response received`);

      // Extract image from response
      const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (!imageBase64) {
        console.error(`[Gemini] No image in response:`, JSON.stringify(data));
        throw new Error("No image data in Gemini response");
      }

      // Convert base64 to buffer and upload to Cloudinary
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const filename = `gemini-${timestamp}-${randomSuffix}`;

      console.log(`[Gemini] Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(imageBuffer, {
        folder: 'noorstudio/pose-packs',
        filename,
        format: 'png',
      });

      const processingTimeMs = Date.now() - startTime;
      console.log(`[Gemini] Generation successful in ${processingTimeMs}ms`);
      console.log(`[Gemini] Image URL: ${cloudinaryUrl}`);

      return {
        imageUrl: cloudinaryUrl,
        seed: request.seed,
        processingTimeMs,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Gemini] Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err.message);

      // Retry on transient errors
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Gemini] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateImage(request, retryCount + 1, maxRetries);
      }

      throw new Error(`Gemini image generation failed: ${err.message}`);
    }
  }

  /**
   * Build text-to-image request payload
   */
  private buildText2ImgRequest(request: GeminiImageRequest): any {
    return {
      instances: [
        {
          prompt: request.prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: this.getAspectRatio(request.width, request.height),
        negativePrompt: request.negativePrompt || this.getDefaultNegativePrompt(),
        seed: request.seed,
      },
    };
  }

  /**
   * Build image-to-image request payload
   */
  private async buildImg2ImgRequest(request: GeminiImageRequest): Promise<any> {
    // Fetch and convert reference image to base64
    let imageBase64 = "";
    if (request.referenceImageUrl) {
      try {
        const imageResponse = await fetch(request.referenceImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(imageBuffer).toString('base64');
      } catch (error) {
        console.error(`[Gemini] Failed to fetch reference image:`, error);
        throw new Error(`Failed to fetch reference image: ${error}`);
      }
    }

    return {
      instances: [
        {
          prompt: request.prompt,
          image: {
            bytesBase64Encoded: imageBase64,
          },
        },
      ],
      parameters: {
        sampleCount: 1,
        mode: "image-to-image",
        negativePrompt: request.negativePrompt || this.getDefaultNegativePrompt(),
        seed: request.seed,
      },
    };
  }

  /**
   * Get aspect ratio string from dimensions
   */
  private getAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return "1:1";

    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 16/9) < 0.1) return "16:9";
    if (Math.abs(ratio - 9/16) < 0.1) return "9:16";
    if (Math.abs(ratio - 4/3) < 0.1) return "4:3";
    if (Math.abs(ratio - 3/4) < 0.1) return "3:4";

    return "1:1"; // Default
  }

  /**
   * Default negative prompt for Islamic children's book illustrations
   */
  private getDefaultNegativePrompt(): string {
    return [
      "text", "words", "letters", "watermark",
      "low quality", "blurry", "distorted",
      "scary", "violent", "inappropriate",
      "revealing clothing", "tight clothing",
    ].join(", ");
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: 'gemini',
      model: 'imagen-3.0',
    };
  }
}

export default GeminiProvider;
