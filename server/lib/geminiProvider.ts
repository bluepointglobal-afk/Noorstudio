// Google Gemini 2.0 Provider for Image Generation
// Uses Gemini's multimodal image generation (same as AI Studio chat)
// Perfect for multi-pose character sheets with img2img

import { uploadToCloudinary } from "./cloudinaryUpload";

export interface GeminiImageRequest {
  prompt: string;
  referenceImageUrl?: string; // For img2img
  width?: number;
  height?: number;
  seed?: number;
}

export interface GeminiImageResponse {
  imageUrl: string;
  seed?: number;
  processingTimeMs?: number;
}

/**
 * Gemini 2.0 Provider for Image Generation
 *
 * Uses Gemini's multimodal generateContent API with image output.
 * Same method as Google AI Studio chat interface.
 */
export class GeminiProvider {
  private apiKey: string;
  private apiUrl = "https://generativelanguage.googleapis.com/v1beta";
  private model = "gemini-2.5-flash-image"; // Image generation model

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate an image with optional reference image for img2img
   * Uses same approach as AI Studio: upload image + text prompt → generate grid
   */
  async generateImage(
    request: GeminiImageRequest,
    retryCount = 0,
    maxRetries = 2
  ): Promise<GeminiImageResponse> {
    try {
      const startTime = Date.now();

      console.log(`[Gemini] Generating image with ${this.model}...`);
      console.log(`[Gemini] Has reference: ${request.referenceImageUrl ? 'Yes' : 'No'}`);

      // Build multimodal request (image + text → image output)
      const parts = [];

      // Add reference image if provided (for img2img like AI Studio)
      if (request.referenceImageUrl) {
        const imageData = await this.fetchImageAsBase64(request.referenceImageUrl);
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imageData,
          },
        });
      }

      // Add text prompt
      parts.push({
        text: request.prompt,
      });

      const payload = {
        contents: [{
          parts,
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      };

      console.log(`[Gemini] Calling generateContent API...`);

      const endpoint = `${this.apiUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

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
      // Gemini returns images as inline_data in parts
      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inline_data?.mime_type?.startsWith('image/')
      );

      if (!imagePart?.inline_data?.data) {
        console.error(`[Gemini] No image in response:`, JSON.stringify(data, null, 2));
        throw new Error("No image data in Gemini response - check if model supports image output");
      }

      // Convert base64 to buffer and upload to Cloudinary
      const imageBuffer = Buffer.from(imagePart.inline_data.data, 'base64');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const filename = `gemini-${timestamp}-${randomSuffix}`;

      console.log(`[Gemini] Uploading to Cloudinary (${imageBuffer.length} bytes)...`);
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
   * Fetch image from URL and convert to base64
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      console.log(`[Gemini] Fetching reference image: ${imageUrl.substring(0, 50)}...`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      console.log(`[Gemini] Reference image loaded: ${base64.length} chars`);
      return base64;
    } catch (error) {
      console.error(`[Gemini] Failed to fetch reference image:`, error);
      throw new Error(`Failed to fetch reference image: ${error}`);
    }
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: 'gemini',
      model: this.model,
    };
  }
}

export default GeminiProvider;
