// AI Proxy Routes
// Handles text and image generation requests, keeping API keys server-side

import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
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
const OPENAI_API_KEY = env.OPENAI_API_KEY || "";
const NANOBANANA_API_KEY = env.NANOBANANA_API_KEY || "";
const GOOGLE_API_KEY = env.GOOGLE_API_KEY || "";
const REPLICATE_API_TOKEN = env.REPLICATE_API_TOKEN || "";
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || "2", 10);

// Initialize Claude client if key is available
let claudeClient: Anthropic | null = null;
if (CLAUDE_API_KEY && TEXT_PROVIDER === "claude") {
  claudeClient = new Anthropic({ apiKey: CLAUDE_API_KEY });
}

// Initialize OpenAI client if key is available
let openaiClient: OpenAI | null = null;
if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
}

// Initialize Replicate provider if token is available
import { ReplicateProvider } from "../lib/replicateProvider";
let replicateProvider: ReplicateProvider | null = null;
if (REPLICATE_API_TOKEN && IMAGE_PROVIDER === "replicate") {
  replicateProvider = new ReplicateProvider(REPLICATE_API_TOKEN);
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

  /** Optional deterministic seed for identity consistency. */
  seed?: number;

  /** Optional reference/identity strength (provider-specific). */
  referenceStrength?: number;
}

interface ImageResponse {
  imageUrl: string;
  providerMeta?: Record<string, unknown>;
  provider: string;
}

// NanoBanana API configuration
const NANOBANANA_API_URL = process.env.NANOBANANA_API_URL || "https://api.nanobanana.com/v1";
const NANOBANANA_MODEL = process.env.NANOBANANA_MODEL || "pixar-3d-v1";

// API timeout configuration (in milliseconds)
const API_TIMEOUT_MS = parseInt(process.env.API_TIMEOUT_MS || "30000", 10);

// Helper: Create fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

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
    const num = parseInt(chapterNum);

    const chapterTexts: Record<number, { title: string; text: string; vocab: string[]; adab: string[] }> = {
      1: {
        title: "The Journey Begins",
        text: `Amira woke up early that morning, the sun just beginning to peek through her window. "Bismillah," she whispered, as Mama had taught her, before placing her feet on the cool floor.\n\n"Today is the day!" she exclaimed, jumping up with excitement. Today she would visit Grandmother, who lived in the village beyond the hills.\n\nMama had prepared a basket of treats - fresh dates, honey cakes, and sweet oranges. "Remember, my dear," Mama said, kneeling down to look into Amira's eyes, "the Prophet, peace be upon him, taught us that the best of people are those who are most beneficial to others."\n\nAmira nodded solemnly, clutching the basket. She didn't quite understand what Mama meant, but she would remember those words.\n\nAs she walked down the dusty road, the morning breeze carried the scent of jasmine. Birds sang their morning songs, and Amira felt her heart fill with joy. What adventures awaited her today?`,
        vocab: [
          "Bismillah - In the name of Allah, said before starting any action",
          "Peace be upon him - Phrase of respect said after mentioning Prophet Muhammad",
        ],
        adab: [
          "Starting the day with Bismillah",
          "Respecting and listening to parents",
          "Remembering the teachings of the Prophet (PBUH)",
        ],
      },
      2: {
        title: "Meeting the Hungry Traveler",
        text: `The road stretched ahead, winding through fields of golden wheat. Amira hummed a nasheed Mama had taught her, swinging the basket gently as she walked.\n\nThen she heard it — a soft sound, almost like a kitten. She stopped and listened. Under a fig tree sat a small boy, younger than her, hugging his knees. His clothes were dusty and his eyes were red.\n\n"Assalamu alaikum," Amira said softly, kneeling beside him. "Are you okay?"\n\nThe boy looked up. "Wa alaikum assalam. I'm Yusuf. I've been walking since morning and I have nothing to eat."\n\nAmira looked at her basket — Grandmother's treats. Her stomach twisted. These were for Grandmother. But Mama's words echoed in her mind: the best of people are those who help others.\n\nWithout another thought, she opened the basket and held out the honey cakes. "Here, take these. Bismillah — eat!"\n\nYusuf's eyes widened. "Really? For me?" He took a small bite and smiled for the first time. "Jazakallah khair! This is the best thing I've ever tasted!"`,
        vocab: [
          "Assalamu alaikum - Peace be upon you, the Islamic greeting",
          "Jazakallah khair - May Allah reward you with goodness",
          "Nasheed - An Islamic song or chant",
        ],
        adab: [
          "Greeting others with Salam",
          "Sharing food with those in need",
          "Saying Bismillah before eating",
        ],
      },
      3: {
        title: "The Unexpected Gift",
        text: `After sharing her food with Yusuf, Amira continued on her journey. The basket felt lighter now, but her heart felt strangely full.\n\nThe path split into two at a large oak tree. Amira looked left, then right. Which way led to Grandmother's village? She couldn't remember.\n\n"Oh no," she whispered, turning in a circle. The sun was getting higher and the shadows shorter. "Ya Allah, please guide me," she prayed, clasping her hands together.\n\n"Amira! Amira!" a voice called. She spun around to see Yusuf running toward her, and behind him, a tall woman in a green headscarf.\n\n"This is my mother," Yusuf said breathlessly. "I told her how you shared your food with me. She knows the way to your grandmother's village!"\n\nYusuf's mother smiled warmly. "Your kindness reached us, little one. Come, the village is just beyond those olive trees. We'll walk with you."\n\nAmira beamed. She had given away her treats, yet here was Allah sending her exactly the help she needed.`,
        vocab: [
          "Ya Allah - O Allah, used when making a supplication",
          "Dua - A personal prayer or supplication to Allah",
        ],
        adab: [
          "Turning to Allah in times of difficulty",
          "Trusting that kindness is always rewarded",
          "Helping strangers as a community",
        ],
      },
      4: {
        title: "Grandmother's Wisdom",
        text: `The olive trees parted to reveal a small stone house with a garden full of roses. Grandmother stood at the door, her arms already open wide.\n\n"My little Amira!" she cried, wrapping her in the warmest hug. "I've been waiting for you. Come in, come in!"\n\nInside, Grandmother had prepared a feast — steaming rice, roasted chicken, and fresh bread. Amira's eyes went wide. "But Grandmother, I'm sorry — I gave away your honey cakes and dates. I met a hungry boy on the road and I—"\n\nGrandmother held up her hand and smiled. "You gave away my treats?" She pulled Amira close. "Habibti, you gave me something far better than treats. You gave me a granddaughter I can be proud of."\n\nShe poured Amira a cup of mint tea. "Let me tell you a story. When I was your age, I gave my last piece of bread to a traveler. That traveler turned out to be a teacher who taught me to read the Quran. One small act of kindness changed my whole life."\n\nAmira sipped her tea, finally understanding Mama's words. The best of people truly are those who help others. And kindness, she now knew, always finds its way back to you.\n\n"Alhamdulillah," Amira whispered, grateful for the journey, the friends she'd made, and the lesson she'd never forget.`,
        vocab: [
          "Habibti - My dear, a term of endearment",
          "Alhamdulillah - All praise is due to Allah, expressing gratitude",
        ],
        adab: [
          "Respecting elders and listening to their wisdom",
          "Being grateful for blessings (Alhamdulillah)",
          "Understanding that generosity is rewarded by Allah",
        ],
      },
    };

    const chapter = chapterTexts[num] || chapterTexts[1];
    mockText = JSON.stringify({
      chapter_title: `Chapter ${chapterNum}: ${chapter.title}`,
      chapter_number: num,
      text: chapter.text,
      vocabulary_notes: chapter.vocab,
      islamic_adab_checks: chapter.adab,
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

    const response = await fetchWithTimeout(`${NANOBANANA_API_URL}/generate`, {
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
        seed: req.seed,
        reference_strength: req.referenceStrength,
      }),
    }, 60000); // 60 second timeout for image generation

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

// ============================================
// OpenAI DALL-E 3 Provider
// ============================================

async function openaiImageGeneration(
  req: ImageRequest,
  retryCount = 0
): Promise<ImageResponse> {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized. Check OPENAI_API_KEY.");
  }

  try {
    if (env.NODE_ENV === "development") {
      console.log("OpenAI DALL-E 3 image generation:", {
        task: req.task,
        promptLength: req.prompt.length,
        style: req.style,
      });
    }

    // Enhance prompt for Islamic children's book style
    const enhancedPrompt = `${req.prompt}

Style: Warm, inviting children's book illustration with Islamic aesthetic. 
Characters wear modest clothing (long sleeves, loose clothing, hijabs for girls/women). 
Diverse Muslim characters with Middle Eastern, South Asian, or African features. 
Family-friendly, wholesome scenes. Soft, gentle colors. 2D illustrated style like high-quality picture books.

Important: No text, no words, no letters, no numbers, no signatures, no watermarks.`;

    const response = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      size: req.task === "cover" ? "1024x1792" : "1792x1024", // Portrait for cover, landscape for illustrations
      quality: "standard",
      n: 1,
      response_format: "url",
      style: "vivid",
    });

    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI API");
    }

    return {
      imageUrl,
      provider: "openai",
      providerMeta: {
        model: "dall-e-3",
        task: req.task,
        size: req.task === "cover" ? "1024x1792" : "1792x1024",
        style: req.style || "vivid",
        revisedPrompt: response.data[0]?.revised_prompt,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`OpenAI API error (attempt ${retryCount + 1}):`, err.message);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying OpenAI image generation in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return openaiImageGeneration(req, retryCount + 1);
    }

    throw err;
  }
}

// ============================================
// Google Generative AI Provider
// ============================================

async function googleImageGeneration(
  req: ImageRequest,
  retryCount = 0
): Promise<ImageResponse> {
  if (!GOOGLE_API_KEY) {
    throw new Error("Google API key not configured");
  }

  try {
    if (env.NODE_ENV === "development") {
      console.log("Google Image Generation call:", {
        task: req.task,
        promptLength: req.prompt.length,
        seed: req.seed,
      });
    }

    // Use Google's Generative AI REST API for image generation
    // Note: This uses the text-to-image capability via prompt
    const response = await fetchWithTimeout("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: req.prompt,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
      }),
    }, 45000); // 45 second timeout

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Google API error:", errorData);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying Google image generation (attempt ${retryCount + 2})`);
        return googleImageGeneration(req, retryCount + 1);
      }

      throw new Error(
        `Google image generation failed: ${response.status} ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Extract image URL from response
    const imageUrl = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!imageUrl) {
      throw new Error("No image URL returned from Google API");
    }

    return {
      imageUrl,
      provider: "google",
      providerMeta: {
        seed: req.seed,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Google API error:", err.message);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying Google image generation (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
      return googleImageGeneration(req, retryCount + 1);
    }

    throw err;
  }
}

// ============================================
// Claude-Local Provider (Claude descriptions + Local SVG generation)
// ============================================

// Character definitions for consistency
const CHARACTER_SPECS: Record<string, {
  name: string;
  age: number;
  skinTone: string;
  hairColor: string;
  hijabColor: string;
  clothingColor: string;
  distinctiveFeatures: string;
}> = {
  amira: {
    name: "Amira",
    age: 9,
    skinTone: "#E8C69F",
    hairColor: "#3D2817",
    hijabColor: "#D4A5A5",
    clothingColor: "#F4A9B8",
    distinctiveFeatures: "warm smile, thoughtful eyes, round face",
  },
  layla: {
    name: "Layla",
    age: 9,
    skinTone: "#D4A574",
    hairColor: "#2C2C2C",
    hijabColor: "#4A7BA7",
    clothingColor: "#6B9FD4",
    distinctiveFeatures: "bright smile, kind eyes, oval face",
  },
  ahmed: {
    name: "Ahmed",
    age: 10,
    skinTone: "#D4A574",
    hairColor: "#2C2C2C",
    hijabColor: "none",
    clothingColor: "#4A7B4A",
    distinctiveFeatures: "curious expression, short dark hair, friendly face",
  },
};

async function claudeLocalImageGeneration(
  req: ImageRequest,
  retryCount = 0
): Promise<ImageResponse> {
  // Use Claude to analyze the prompt and enhance it with character consistency
  let enhancedDescription = req.prompt;
  
  if (claudeClient) {
    try {
      const charPrompt = Object.entries(CHARACTER_SPECS)
        .map(([key, char]) => `${char.name}: ${char.distinctiveFeatures}, skin ${char.skinTone}, clothing ${char.clothingColor}, hijab ${char.hijabColor}`)
        .join('\n');
      
      const response = await claudeClient.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: `You are an illustration description specialist. Given a scene description, output a detailed visual description for a children's book illustration. Maintain these character appearances for consistency:\n${charPrompt}\n\nKeep descriptions warm, child-friendly, and culturally appropriate (Islamic aesthetic). Output ONLY the description, no commentary.`,
        messages: [{ role: "user", content: `Describe this scene for illustration: ${req.prompt}` }],
      });
      
      const textContent = response.content.find((c) => c.type === "text");
      if (textContent && textContent.type === "text") {
        enhancedDescription = textContent.text;
      }
    } catch (err) {
      console.warn("Claude description enhancement failed, using original prompt:", err);
    }
  }
  
  // Generate local SVG-based illustration
  const size = req.size || { width: 800, height: 600 };
  const svgImage = generateLocalIllustration(enhancedDescription, req.task || "illustration", size);
  
  // Convert SVG to data URL
  const base64Svg = Buffer.from(svgImage).toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;
  
  return {
    imageUrl: dataUrl,
    providerMeta: {
      provider: "claude-local",
      enhancedDescription: enhancedDescription.substring(0, 200),
      task: req.task,
      size,
    },
    provider: "claude-local",
  };
}

function generateLocalIllustration(description: string, task: string, size: { width: number; height: number }): string {
  const { width, height } = size;
  
  // Color palettes based on scene type
  const palettes: Record<string, { bg: string[]; accent: string; text: string }> = {
    cover: { bg: ["#1e5282", "#2e82c2", "#4ea2e2"], accent: "#FFD700", text: "#FFFFFF" },
    chapter1: { bg: ["#FFF8DC", "#FFE4B5", "#FFDAB9"], accent: "#8B4513", text: "#2F4F4F" },
    chapter2: { bg: ["#E0F7FA", "#B2EBF2", "#80DEEA"], accent: "#00796B", text: "#004D40" },
    chapter3: { bg: ["#FCE4EC", "#F8BBD9", "#F48FB1"], accent: "#C2185B", text: "#880E4F" },
    illustration: { bg: ["#FFF3E0", "#FFE0B2", "#FFCC80"], accent: "#E65100", text: "#BF360C" },
  };
  
  const palette = palettes[task] || palettes.illustration;
  
  // Detect characters in description for consistent rendering
  const hasAmira = description.toLowerCase().includes("amira");
  const hasLayla = description.toLowerCase().includes("layla");
  const hasAhmed = description.toLowerCase().includes("ahmed");
  
  // Build character SVG elements
  let characterElements = "";
  let charX = width * 0.3;
  
  if (hasAmira) {
    characterElements += generateCharacterSVG(CHARACTER_SPECS.amira, charX, height * 0.55, height * 0.35);
    charX += width * 0.25;
  }
  if (hasLayla) {
    characterElements += generateCharacterSVG(CHARACTER_SPECS.layla, charX, height * 0.55, height * 0.35);
    charX += width * 0.25;
  }
  if (hasAhmed) {
    characterElements += generateCharacterSVG(CHARACTER_SPECS.ahmed, charX, height * 0.55, height * 0.35);
  }
  
  // Create SVG with gradient background, decorative elements, and characters
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.bg[0]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${palette.bg[1]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${palette.bg[2]};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- Decorative Islamic geometric border -->
  <rect x="15" y="15" width="${width - 30}" height="${height - 30}" 
        fill="none" stroke="${palette.accent}" stroke-width="3" rx="10"/>
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" 
        fill="none" stroke="${palette.accent}" stroke-width="1.5" rx="8" stroke-dasharray="10,5"/>
  
  <!-- Corner ornaments -->
  ${generateCornerOrnaments(width, height, palette.accent)}
  
  <!-- Characters -->
  ${characterElements}
  
  <!-- Scene description text area -->
  <rect x="40" y="${height - 100}" width="${width - 80}" height="70" fill="white" fill-opacity="0.85" rx="8" filter="url(#shadow)"/>
  <text x="${width / 2}" y="${height - 60}" font-family="Georgia, serif" font-size="14" fill="${palette.text}" text-anchor="middle">
    ${truncateText(description, 60)}
  </text>
  <text x="${width / 2}" y="${height - 40}" font-family="Georgia, serif" font-size="12" fill="${palette.text}" text-anchor="middle" opacity="0.7">
    NoorStudio Illustration
  </text>
</svg>`;
  
  return svg;
}

function generateCharacterSVG(char: typeof CHARACTER_SPECS.amira, x: number, y: number, scale: number): string {
  const headSize = scale * 0.3;
  const bodyHeight = scale * 0.5;
  
  return `
  <!-- Character: ${char.name} -->
  <g transform="translate(${x}, ${y})">
    <!-- Body/Dress -->
    <ellipse cx="0" cy="${bodyHeight * 0.4}" rx="${headSize * 0.8}" ry="${bodyHeight * 0.5}" fill="${char.clothingColor}"/>
    
    <!-- Head -->
    <circle cx="0" cy="-${headSize * 0.5}" r="${headSize}" fill="${char.skinTone}"/>
    
    <!-- Hijab (if applicable) -->
    ${char.hijabColor !== "none" ? `
    <ellipse cx="0" cy="-${headSize * 0.7}" rx="${headSize * 1.1}" ry="${headSize * 0.9}" fill="${char.hijabColor}"/>
    <ellipse cx="0" cy="-${headSize * 0.3}" rx="${headSize * 0.95}" ry="${headSize * 0.7}" fill="${char.skinTone}"/>
    ` : `
    <!-- Hair for male character -->
    <ellipse cx="0" cy="-${headSize * 0.8}" rx="${headSize * 0.9}" ry="${headSize * 0.5}" fill="${char.hairColor}"/>
    `}
    
    <!-- Face features -->
    <circle cx="-${headSize * 0.25}" cy="-${headSize * 0.5}" r="${headSize * 0.08}" fill="#3D2817"/>
    <circle cx="${headSize * 0.25}" cy="-${headSize * 0.5}" r="${headSize * 0.08}" fill="#3D2817"/>
    <path d="M-${headSize * 0.15},-${headSize * 0.25} Q0,-${headSize * 0.15} ${headSize * 0.15},-${headSize * 0.25}" 
          stroke="#3D2817" stroke-width="2" fill="none"/>
    
    <!-- Name label -->
    <text x="0" y="${bodyHeight * 0.7}" font-family="Arial" font-size="12" fill="#333" text-anchor="middle" font-weight="bold">${char.name}</text>
  </g>`;
}

function generateCornerOrnaments(width: number, height: number, color: string): string {
  const size = 25;
  const positions = [
    { x: 30, y: 30 },
    { x: width - 30, y: 30 },
    { x: 30, y: height - 30 },
    { x: width - 30, y: height - 30 },
  ];
  
  return positions.map(pos => `
    <g transform="translate(${pos.x}, ${pos.y})">
      <circle cx="0" cy="0" r="${size}" fill="none" stroke="${color}" stroke-width="2"/>
      <circle cx="0" cy="0" r="${size * 0.6}" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="${size * 0.3}" fill="${color}" opacity="0.3"/>
    </g>
  `).join('');
}

function truncateText(text: string, maxLen: number): string {
  const cleaned = text.replace(/\n/g, ' ').trim();
  return cleaned.length > maxLen ? cleaned.substring(0, maxLen) + "..." : cleaned;
}

// ============================================
// Style Enhancement Helper
// ============================================

/**
 * Build a style-enhanced prompt by prepending style-specific directives.
 * This ensures the chosen art style is respected even when using generic models.
 */
function buildStyleEnhancedPrompt(basePrompt: string, style: string): string {
  const STYLE_PREFIXES: Record<string, string> = {
    "pixar-3d": "Pixar-style 3D CGI children's book illustration with soft lighting, subsurface scattering on skin, rounded features, expressive eyes, high-quality render like Disney/Pixar animated films",
    "watercolor": "Soft traditional watercolor children's book illustration with gentle color bleeding, organic textures, delicate brushstrokes, dreamy quality like classic children's book art",
    "anime": "Vibrant Japanese anime/manga style children's book illustration with expressive large eyes, dynamic poses, clean linework, cel-shaded coloring, inspired by Studio Ghibli",
    "manga": "Japanese manga style children's book illustration with expressive large eyes, dynamic poses, clean black linework, screentone shading, manga panel aesthetic",
    "2d-vector": "Clean modern 2D vector children's book illustration with flat colors, bold outlines, geometric simplification, contemporary aesthetic",
    "paper-cutout": "Textured paper collage style children's book illustration with visible paper grain, layered cut-paper shapes, handcrafted feel, Eric Carle inspired",
  };

  const stylePrefix = STYLE_PREFIXES[style] || STYLE_PREFIXES["pixar-3d"];
  
  // If prompt already explicitly includes the style keywords, don't duplicate
  const styleLower = style.toLowerCase();
  const promptLower = basePrompt.toLowerCase();
  if (promptLower.includes(styleLower) || 
      (styleLower === "anime" && promptLower.includes("manga")) ||
      (styleLower === "manga" && promptLower.includes("anime"))) {
    return basePrompt;
  }
  
  // Prepend style directive to ensure it's prioritized by the model
  return `${stylePrefix}.\n\n${basePrompt}`;
}

// ============================================
// Replicate Provider (Character Consistency)
// ============================================

async function replicateImageGeneration(
  req: ImageRequest,
  retryCount = 0
): Promise<ImageResponse> {
  if (!replicateProvider) {
    throw new Error("Replicate provider not initialized. Check REPLICATE_API_TOKEN.");
  }

  try {
    if (env.NODE_ENV === "development") {
      console.log("Replicate character-consistent generation:", {
        task: req.task,
        promptLength: req.prompt.length,
        hasReferences: (req.references?.length || 0) > 0,
        style: req.style || "pixar-3d",
        seed: req.seed,
      });
    }

    // Default sizes based on task type
    const defaultSize = req.task === "cover"
      ? { width: 1024, height: 1536 } // 2:3 ratio for book covers
      : { width: 1024, height: 768 };  // 4:3 ratio for illustrations

    const width = req.size?.width || defaultSize.width;
    const height = req.size?.height || defaultSize.height;

    // Build comprehensive negative prompt
    const negativePrompt = req.task === "cover"
      ? [
          // Text prevention (CRITICAL for covers)
          "text", "words", "letters", "numbers", "title", "author", "signature",
          "watermark", "logo", "barcode", "typography", "font", "writing",
          // Quality issues
          "blurry", "distorted", "low quality", "pixelated", "artifacts",
          "bad anatomy", "deformed", "ugly", "mutated",
          // Content issues
          "scary", "violent", "inappropriate", "revealing clothing",
        ].join(", ")
      : [
          // Character consistency (CRITICAL for illustrations)
          "different face", "changed appearance", "wrong skin tone", "inconsistent character",
          "missing hijab", "different hair color", "wrong clothing", "character variation",
          "text", "words", "letters", "numbers", "watermark",
          // Quality issues
          "blurry", "distorted", "low quality", "artifacts", "bad anatomy", "deformed",
          // Content issues
          "scary", "violent", "inappropriate", "revealing clothing",
        ].join(", ");

    // Extract character reference from references array (first one is character ref)
    const characterRefUrl = req.references && req.references.length > 0
      ? req.references[0]
      : undefined;

    // 🔧 FIX: Enhance prompt with style information
    const styleEnhancedPrompt = buildStyleEnhancedPrompt(
      req.prompt,
      req.style || "pixar-3d"
    );

    if (env.NODE_ENV === "development") {
      console.log("[Replicate] Using style:", req.style || "pixar-3d");
      console.log("[Replicate] Prompt enhanced:", styleEnhancedPrompt.substring(0, 150) + "...");
    }

    const result = await replicateProvider.generateImage({
      prompt: styleEnhancedPrompt,  // ← Use style-enhanced prompt instead of raw prompt
      subjectImageUrl: characterRefUrl,
      negativePrompt,
      width,
      height,
      seed: req.seed,
      numOutputs: req.count || 1,
      guidanceScale: req.task === "cover" ? 8.5 : 7.5,
      numInferenceSteps: req.task === "cover" ? 35 : 30,
      referenceStrength: req.referenceStrength || 0.8,
    });

    return {
      imageUrl: result.imageUrl,
      providerMeta: {
        model: result.model,
        seed: result.seed,
        processingTime: result.processingTimeMs,
        characterReference: characterRefUrl ? "used" : "none",
      },
      provider: "replicate",
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Replicate API error (attempt ${retryCount + 1}):`, err.message);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying Replicate image generation in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return replicateImageGeneration(req, retryCount + 1);
    }

    throw err;
  }
}

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

    if (IMAGE_PROVIDER === "replicate" && replicateProvider) {
      response = await replicateImageGeneration(body);
    } else if (IMAGE_PROVIDER === "openai" && openaiClient) {
      response = await openaiImageGeneration(body);
    } else if (IMAGE_PROVIDER === "nanobanana") {
      response = await nanobananaImageGeneration(body);
    } else if (IMAGE_PROVIDER === "google") {
      response = await googleImageGeneration(body);
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
    openaiConfigured: !!OPENAI_API_KEY,
    nanobananaConfigured: !!NANOBANANA_API_KEY,
    googleConfigured: !!GOOGLE_API_KEY,
    replicateConfigured: !!REPLICATE_API_TOKEN,
    replicateModel: replicateProvider?.getModelInfo()?.model,
    apiTimeoutMs: API_TIMEOUT_MS,
  });
});

export { router as aiRoutes };
