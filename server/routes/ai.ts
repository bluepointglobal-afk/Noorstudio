// AI Proxy Routes
// Handles text and image generation requests, keeping API keys server-side

import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import { deductCredits, supabase } from "../index";
import { AI_TOKEN_BUDGETS, IMAGE_LIMITS, estimateTokens, AIStage } from "../../src/lib/ai/tokenBudget";

const router = Router();

// ============================================
// Configuration
// ============================================

const TEXT_PROVIDER = env.AI_TEXT_PROVIDER;
const IMAGE_PROVIDER = env.AI_IMAGE_PROVIDER;
const CLAUDE_API_KEY = env.CLAUDE_API_KEY || "";
const NANOBANANA_API_KEY = env.NANOBANANA_API_KEY || "";
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || "2", 10);

// Initialize Claude client if key is available
let claudeClient: Anthropic | null = null;
if (CLAUDE_API_KEY && TEXT_PROVIDER === "claude") {
  claudeClient = new Anthropic({ apiKey: CLAUDE_API_KEY });
}

// ============================================
// Types
// ============================================

interface TextRequest {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  stage?: AIStage;
  attemptId?: string;
  projectId?: string;
}

interface TextResponse {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: string;
}

interface ImageRequest {
  task: "illustration" | "cover";
  prompt: string;
  references?: string[];
  style?: string;
  size?: { width: number; height: number };
  count?: number;
  attemptId?: string;
  projectId?: string;
}

interface ImageResponse {
  imageUrl: string;
  providerMeta?: Record<string, unknown>;
  provider: string;
}

// NanoBanana API configuration
const NANOBANANA_API_URL = process.env.NANOBANANA_API_URL || "https://api.nanobanana.com/v1";
const NANOBANANA_MODEL = process.env.NANOBANANA_MODEL || "pixar-3d-v1";

// ============================================
// Telemetry Helper
// ============================================

async function logAIUsage(data: {
  userId: string;
  provider: string;
  stage: string;
  requestType: "text" | "image";
  tokensIn?: number;
  tokensOut?: number;
  creditsCharged: number;
  success: boolean;
  errorCode?: string;
  metadata?: unknown;
}) {
  if (!supabase) return;

  try {
    await supabase.from("ai_usage").insert({
      user_id: data.userId,
      provider: data.provider,
      stage: data.stage,
      request_type: data.requestType,
      tokens_in: data.tokensIn,
      tokens_out: data.tokensOut,
      credits_charged: data.creditsCharged,
      success: data.success,
      error_code: data.errorCode,
      metadata: data.metadata,
    });
  } catch (err) {
    console.error("Failed to log AI usage:", err);
  }
}

// ============================================
// Mock Providers
// ============================================

async function mockTextGeneration(req: TextRequest): Promise<TextResponse> {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Generate mock response based on prompt content
  const isMockOutline = req.prompt.toLowerCase().includes("outline");
  const isMockChapter = req.prompt.toLowerCase().includes("chapter");
  const isMockHumanize = req.prompt.toLowerCase().includes("humanize") || req.prompt.toLowerCase().includes("edit");

  let mockText = "";

  if (isMockOutline) {
    mockText = JSON.stringify({
      book_title: "The Generous Traveler",
      one_liner: "A young girl learns the joy of sharing during a journey to her grandmother's house.",
      moral: "True happiness comes from giving to others, as taught by Prophet Muhammad (PBUH).",
      chapters: [
        {
          title: "The Journey Begins",
          goal: "Introduce Amira and her journey",
          key_scene: "Amira packs her bag with treats for grandmother",
          dua_or_ayah_hint: "Bismillah before starting journey",
        },
        {
          title: "Meeting the Hungry Traveler",
          goal: "First test of generosity",
          key_scene: "Amira meets a hungry child and shares her food",
          dua_or_ayah_hint: "Hadith about feeding the hungry",
        },
        {
          title: "The Unexpected Gift",
          goal: "Show the rewards of giving",
          key_scene: "The child's family helps Amira when she gets lost",
          dua_or_ayah_hint: "Those who give will be given more",
        },
        {
          title: "Grandmother's Wisdom",
          goal: "Reinforce the moral",
          key_scene: "Grandmother shares her own story of generosity",
          dua_or_ayah_hint: "Dua for blessing in what we have",
        },
      ],
    });
  } else if (isMockChapter) {
    const chapterNum = req.prompt.match(/Chapter (\d+)/i)?.[1] || "1";
    mockText = JSON.stringify({
      chapter_title: `Chapter ${chapterNum}: The Journey`,
      chapter_number: parseInt(chapterNum),
      text: `Amira woke up early that morning, the sun just beginning to peek through her window. "Bismillah," she whispered, as Mama had taught her, before placing her feet on the cool floor.\n\n"Today is the day!" she exclaimed, jumping up with excitement. Today she would visit Grandmother, who lived in the village beyond the hills.\n\nMama had prepared a basket of treats - fresh dates, honey cakes, and sweet oranges. "Remember, my dear," Mama said, kneeling down to look into Amira's eyes, "the Prophet, peace be upon him, taught us that the best of people are those who are most beneficial to others."\n\nAmira nodded solemnly, clutching the basket. She didn't quite understand what Mama meant, but she would remember those words.\n\nAs she walked down the dusty road, the morning breeze carried the scent of jasmine. Birds sang their morning songs, and Amira felt her heart fill with joy. What adventures awaited her today?`,
      vocabulary_notes: [
        "Bismillah - In the name of Allah, said before starting any action",
        "Peace be upon him - Phrase of respect said after mentioning Prophet Muhammad",
      ],
      islamic_adab_checks: [
        "Starting the day with Bismillah",
        "Respecting and listening to parents",
        "Remembering the teachings of the Prophet (PBUH)",
      ],
    });
  } else if (isMockHumanize) {
    mockText = JSON.stringify({
      chapter_title: "The Journey Begins",
      chapter_number: 1,
      edited_text: `The first rays of dawn crept through Amira's window, painting golden stripes across her bedroom floor. Her eyes flew open, and a smile spread across her face.\n\n"Bismillah," she whispered softly, just as Mama had taught her. It was her favorite word - it meant she was starting something with Allah's blessing.\n\n"Today's the day!" She bounced out of bed, her heart dancing with excitement. Today she would finally visit Grandmother in the village beyond the rolling green hills!\n\nIn the kitchen, Mama was already awake, carefully packing a woven basket. Inside lay plump dates that glistened like jewels, honey cakes still warm from the oven, and oranges so bright they looked like little suns.\n\n"Come here, my little traveler," Mama said, kneeling down so their eyes met. She took Amira's small hands in hers. "The Prophet, peace be upon him, taught us something beautiful. He said the best people are those who help others. Remember that on your journey, yes?"\n\nAmira nodded, though the words felt like a puzzle she hadn't quite solved yet. She tucked them away in her heart to think about later.\n\nWith the basket on her arm and a spring in her step, Amira set off down the dusty road. The morning breeze brought the sweet scent of jasmine, and somewhere nearby, a bird sang a cheerful melody. What wonderful things would today bring?`,
      changes_made: [
        "Added more sensory details (golden stripes, glistening dates, warm cakes)",
        "Made Amira's internal thoughts more childlike and relatable",
        "Improved dialogue to sound more natural",
        "Added the metaphor of 'tucking words in her heart' for the lesson",
        "Enhanced the ending to create anticipation",
      ],
    });
  } else {
    mockText = JSON.stringify({
      message: "Mock response generated",
      prompt_preview: req.prompt.substring(0, 100),
    });
  }

  return {
    text: mockText,
    usage: {
      inputTokens: Math.ceil(req.prompt.length / 4),
      outputTokens: Math.ceil(mockText.length / 4),
    },
    provider: "mock",
  };
}

async function mockImageGeneration(req: ImageRequest): Promise<ImageResponse> {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  // Return a demo image
  const demoImages = [
    "/demo/spreads/spread-1.png",
    "/demo/spreads/spread-2.png",
  ];
  const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];

  return {
    imageUrl: randomImage,
    providerMeta: {
      prompt: req.prompt.substring(0, 100),
      style: req.style || "default",
      mock: true,
    },
    provider: "mock",
  };
}

// ============================================
// Claude Provider
// ============================================

async function claudeTextGeneration(
  req: TextRequest,
  retryCount = 0
): Promise<TextResponse> {
  if (!claudeClient) {
    throw new Error("Claude client not initialized. Check CLAUDE_API_KEY.");
  }

  try {
    const response = await claudeClient.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: req.maxOutputTokens,
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response");
    }

    return {
      text: textContent.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      provider: "claude",
    };
  } catch (error) {
    console.error(`Claude API error (attempt ${retryCount + 1}):`, error);

    if (retryCount < MAX_RETRIES) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return claudeTextGeneration(req, retryCount + 1);
    }

    throw error;
  }
}

// ============================================
// NanoBanana Provider (Real Implementation)
// ============================================

async function nanobananaImageGeneration(
  req: ImageRequest,
  retryCount = 0
): Promise<ImageResponse> {
  if (!NANOBANANA_API_KEY) {
    throw new Error("NanoBanana API key not configured");
  }

  // Default sizes based on task type
  const defaultSize = req.task === "cover"
    ? { width: 1024, height: 1536 } // 2:3 ratio for book covers
    : { width: 1024, height: 768 };  // 4:3 ratio for illustrations

  const size = req.size || defaultSize;

  // Build task-specific negative prompt for better compliance
  const coverNegativePrompt = [
    // Text prevention (HIGHEST PRIORITY for covers)
    "text", "words", "letters", "numbers", "title", "author", "signature",
    "watermark", "logo", "barcode", "ISBN", "typography", "font", "writing",
    // Quality issues
    "blurry", "distorted", "low quality", "pixelated", "artifacts",
    "bad anatomy", "deformed", "ugly", "mutated", "disfigured",
    // Content issues
    "scary", "violent", "inappropriate", "revealing clothing", "tight clothing",
    // Orientation for covers
    "horizontal", "landscape orientation",
  ].join(", ");

  const illustrationNegativePrompt = [
    // Text prevention
    "text", "words", "letters", "numbers", "watermark", "signature",
    // Character consistency (CRITICAL for illustrations)
    "different face", "changed appearance", "wrong skin tone", "inconsistent character",
    "missing hijab", "different hair color", "wrong clothing", "character variation",
    // Quality issues
    "blurry", "distorted", "low quality", "artifacts", "bad anatomy", "deformed",
    // Content issues
    "scary", "violent", "inappropriate", "revealing clothing",
  ].join(", ");

  const negativePrompt = req.task === "cover" ? coverNegativePrompt : illustrationNegativePrompt;

  // Use higher guidance for covers to ensure stricter prompt adherence
  const guidanceScale = req.task === "cover" ? 8.5 : 7.5;

  try {
    if (env.NODE_ENV === "development") {
      console.log("NanoBanana API call:", {
        task: req.task,
        promptLength: req.prompt.length,
        references: req.references?.length || 0,
        size,
        guidanceScale,
      });
    }

    const response = await fetch(`${NANOBANANA_API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NANOBANANA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NANOBANANA_MODEL,
        prompt: req.prompt,
        negative_prompt: negativePrompt,
        reference_images: req.references || [],
        width: size.width,
        height: size.height,
        style: req.style || "pixar-3d",
        guidance_scale: guidanceScale,
        num_inference_steps: req.task === "cover" ? 35 : 30, // More steps for cover quality
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `NanoBanana API error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      imageUrl: data.image_url || data.url,
      providerMeta: {
        model: NANOBANANA_MODEL,
        task: req.task,
        size,
        seed: data.seed,
        processingTime: data.processing_time_ms,
      },
      provider: "nanobanana",
    };
  } catch (error) {
    console.error(`NanoBanana API error (attempt ${retryCount + 1}):`, error);

    if (retryCount < MAX_RETRIES) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return nanobananaImageGeneration(req, retryCount + 1);
    }

    throw error;
  }
}

// ============================================
// Routes
// ============================================

// Text generation endpoint
router.post("/text", async (req: Request, res: Response) => {
  try {
    const body = req.body as TextRequest;

    if (!body.prompt || !body.system) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Missing required fields: prompt, system",
        },
      });
      return;
    }

    const stage = body.stage || "outline";
    const budget = AI_TOKEN_BUDGETS[stage];

    // Enforce prompt limit early
    const promptTokens = estimateTokens(body.prompt + (body.system || ""));
    if (budget && promptTokens > budget.maxPromptTokens) {
      if (req.user) {
        logAIUsage({
          userId: req.user.id,
          provider: TEXT_PROVIDER,
          stage,
          requestType: "text",
          tokensIn: promptTokens,
          creditsCharged: 0,
          success: false,
          errorCode: "AI_TOKEN_BUDGET_EXCEEDED",
          metadata: { attemptId: body.attemptId },
        });
      }
      return res.status(400).json({
        error: {
          code: "AI_TOKEN_BUDGET_EXCEEDED",
          message: `Prompt exceeds limit for ${stage} (${promptTokens} > ${budget.maxPromptTokens} tokens)`,
        },
      });
    }

    const maxTokens = Math.min(
      body.maxOutputTokens || 1000,
      budget?.maxOutputTokens || 2000
    );

    let response: TextResponse;

    if (TEXT_PROVIDER === "claude" && claudeClient) {
      response = await claudeTextGeneration({
        system: body.system,
        prompt: body.prompt,
        maxOutputTokens: maxTokens,
      });
    } else {
      response = await mockTextGeneration({
        system: body.system,
        prompt: body.prompt,
        maxOutputTokens: maxTokens,
      });
    }

    // Deduct credits AFTER success
    if (req.user && req.creditCost && req.creditType) {
      const projectId = (body as TextRequest & { projectId?: string }).projectId;
      await deductCredits(
        req.user.id,
        req.creditType,
        req.creditCost,
        `AI Stage: ${stage}`,
        'project',
        projectId,
        { attemptId: (body as TextRequest & { attemptId?: string }).attemptId, stage }
      );
    }

    // Log success usage
    if (req.user) {
      logAIUsage({
        userId: req.user.id,
        provider: response.provider,
        stage,
        requestType: "text",
        tokensIn: response.usage?.inputTokens || promptTokens,
        tokensOut: response.usage?.outputTokens,
        creditsCharged: req.creditCost || 0,
        success: true,
        metadata: { attemptId: body.attemptId },
      });
    }

    res.json(response);
  } catch (error: unknown) {
    const err = error as Error & { status?: number; statusCode?: number; code?: string };
    console.error("Text generation error:", err);

    // Log failure
    if (req.user) {
      logAIUsage({
        userId: req.user.id,
        provider: TEXT_PROVIDER,
        stage: (req.body as TextRequest & { stage?: AIStage }).stage || "outline",
        requestType: "text",
        creditsCharged: 0,
        success: false,
        errorCode: err.code || "TEXT_GENERATION_FAILED",
        metadata: { attemptId: (req.body as TextRequest & { attemptId?: string }).attemptId },
      });
    }

    res.status(err.status || err.statusCode || 500).json({
      error: {
        code: err.code || "TEXT_GENERATION_FAILED",
        message: err.message || "Text generation failed",
        details: env.NODE_ENV === "development" ? err.stack : undefined,
      },
    });
  }
});

// Image generation endpoint
router.post("/image", async (req: Request, res: Response) => {
  try {
    const body = req.body as ImageRequest & { count?: number; attemptId?: string };
    const stage = body.task === "cover" ? "cover" : "illustrations";
    const limit = stage === "cover" ? IMAGE_LIMITS.cover : IMAGE_LIMITS.illustrations;
    const count = body.count || 1;

    if (count > limit) {
      return res.status(400).json({
        error: {
          code: "IMAGE_LIMIT_EXCEEDED",
          message: `Maximum ${limit} images allowed for ${stage} (requested ${count})`,
        },
      });
    }

    if (!body.prompt) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Missing required field: prompt",
        },
      });
      return;
    }

    let response: ImageResponse;

    if (IMAGE_PROVIDER === "nanobanana") {
      response = await nanobananaImageGeneration(body);
    } else {
      response = await mockImageGeneration(body);
    }

    // Deduct credits AFTER success
    if (req.user && req.creditCost && req.creditType) {
      const projectId = (body as ImageRequest & { projectId?: string }).projectId;
      await deductCredits(
        req.user.id,
        req.creditType,
        req.creditCost,
        `AI Image: ${body.task || 'illustration'}`,
        'project',
        projectId,
        { attemptId: body.attemptId, task: body.task }
      );
    }

    // Log success usage
    if (req.user) {
      logAIUsage({
        userId: req.user.id,
        provider: response.provider,
        stage,
        requestType: "image",
        tokensIn: estimateTokens(body.prompt),
        creditsCharged: req.creditCost || 0,
        success: true,
        metadata: { attemptId: body.attemptId, task: body.task },
      });
    }

    res.json(response);
  } catch (error: unknown) {
    const err = error as Error & { status?: number; statusCode?: number; code?: string };
    console.error("Image generation error:", err);

    // Log failure
    if (req.user) {
      logAIUsage({
        userId: req.user.id,
        provider: IMAGE_PROVIDER,
        stage: req.body.task === "cover" ? "cover" : "illustrations",
        requestType: "image",
        creditsCharged: 0,
        success: false,
        errorCode: err.code || "IMAGE_GENERATION_FAILED",
      });
    }

    res.status(err.status || err.statusCode || 500).json({
      error: {
        code: err.code || "IMAGE_GENERATION_FAILED",
        message: err.message || "Image generation failed",
        details: env.NODE_ENV === "development" ? err.stack : undefined,
      },
    });
  }
});

// Get current provider status
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    textProvider: TEXT_PROVIDER,
    imageProvider: IMAGE_PROVIDER,
    claudeConfigured: !!CLAUDE_API_KEY,
    nanobananaConfigured: !!NANOBANANA_API_KEY,
  });
});

export { router as aiRoutes };
