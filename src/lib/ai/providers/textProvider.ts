// Text Provider Client
// Calls the server proxy for AI text generation

import { getAIConfig, isTextMockMode } from "../config";
import { enforceBudget, AIStage, estimateTokens } from "../budget";

// ============================================
// Types
// ============================================

export interface TextGenerationRequest {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  stage: AIStage;
}

export interface TextGenerationResponse {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: string;
  budgetWarnings?: string[];
}

export interface TextGenerationError {
  error: string;
  message: string;
  retryable: boolean;
}

// ============================================
// Cancel Token Support
// ============================================

export class CancelToken {
  private _cancelled = false;
  private _abortController: AbortController | null = null;

  get cancelled(): boolean {
    return this._cancelled;
  }

  get signal(): AbortSignal | undefined {
    return this._abortController?.signal;
  }

  cancel(): void {
    this._cancelled = true;
    this._abortController?.abort();
  }

  reset(): void {
    this._cancelled = false;
    this._abortController = new AbortController();
  }

  constructor() {
    this._abortController = new AbortController();
  }
}

// ============================================
// Mock Provider (Client-side)
// ============================================

async function mockTextGeneration(
  request: TextGenerationRequest
): Promise<TextGenerationResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const isMockOutline = request.prompt.toLowerCase().includes("outline");
  const isMockChapter = request.prompt.toLowerCase().includes("chapter");
  const isMockHumanize = request.prompt.toLowerCase().includes("humanize") || request.prompt.toLowerCase().includes("edit");

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
    }, null, 2);
  } else if (isMockChapter) {
    const chapterNum = request.prompt.match(/Chapter (\d+)/i)?.[1] || "1";
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
    }, null, 2);
  } else if (isMockHumanize) {
    const chapterNum = request.prompt.match(/CHAPTER: (\d+)/i)?.[1] || "1";
    mockText = JSON.stringify({
      chapter_title: "The Journey Begins",
      chapter_number: parseInt(chapterNum),
      edited_text: `The first rays of dawn crept through Amira's window, painting golden stripes across her bedroom floor. Her eyes flew open, and a smile spread across her face.\n\n"Bismillah," she whispered softly, just as Mama had taught her. It was her favorite word - it meant she was starting something with Allah's blessing.\n\n"Today's the day!" She bounced out of bed, her heart dancing with excitement. Today she would finally visit Grandmother in the village beyond the rolling green hills!\n\nIn the kitchen, Mama was already awake, carefully packing a woven basket. Inside lay plump dates that glistened like jewels, honey cakes still warm from the oven, and oranges so bright they looked like little suns.\n\n"Come here, my little traveler," Mama said, kneeling down so their eyes met. She took Amira's small hands in hers. "The Prophet, peace be upon him, taught us something beautiful. He said the best people are those who help others. Remember that on your journey, yes?"\n\nAmira nodded, though the words felt like a puzzle she hadn't quite solved yet. She tucked them away in her heart to think about later.\n\nWith the basket on her arm and a spring in her step, Amira set off down the dusty road. The morning breeze brought the sweet scent of jasmine, and somewhere nearby, a bird sang a cheerful melody. What wonderful things would today bring?`,
      changes_made: [
        "Added more sensory details (golden stripes, glistening dates, warm cakes)",
        "Made Amira's internal thoughts more childlike and relatable",
        "Improved dialogue to sound more natural",
        "Added the metaphor of 'tucking words in her heart' for the lesson",
        "Enhanced the ending to create anticipation",
      ],
    }, null, 2);
  } else {
    mockText = JSON.stringify({
      message: "Mock response generated",
      prompt_preview: request.prompt.substring(0, 100),
    });
  }

  return {
    text: mockText,
    usage: {
      inputTokens: estimateTokens(request.prompt),
      outputTokens: estimateTokens(mockText),
    },
    provider: "mock",
  };
}

// ============================================
// Server Proxy Provider
// ============================================

async function proxyTextGeneration(
  request: TextGenerationRequest,
  cancelToken?: CancelToken
): Promise<TextGenerationResponse> {
  const config = getAIConfig();

  const response = await fetch(config.textProxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system: request.system,
      prompt: request.prompt,
      maxOutputTokens: request.maxOutputTokens,
    }),
    signal: cancelToken?.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      error: "API request failed",
      message: errorData.message || `HTTP ${response.status}`,
      retryable: response.status >= 500,
    } as TextGenerationError;
  }

  return await response.json();
}

// ============================================
// Main Generation Function
// ============================================

export async function generateText(
  request: TextGenerationRequest,
  cancelToken?: CancelToken
): Promise<TextGenerationResponse> {
  // Apply budget enforcement
  const budgetResult = enforceBudget(request.stage, request.prompt);

  const adjustedRequest = {
    ...request,
    prompt: budgetResult.adjustedInput || request.prompt,
    maxOutputTokens: budgetResult.maxOutputTokens,
  };

  // Check for cancellation
  if (cancelToken?.cancelled) {
    throw { error: "Cancelled", message: "Request was cancelled", retryable: false };
  }

  let response: TextGenerationResponse;

  if (isTextMockMode()) {
    response = await mockTextGeneration(adjustedRequest);
  } else {
    response = await proxyTextGeneration(adjustedRequest, cancelToken);
  }

  // Add budget warnings to response
  if (budgetResult.warnings.length > 0) {
    response.budgetWarnings = budgetResult.warnings;
  }

  return response;
}

// ============================================
// JSON Parsing with Retry
// ============================================

export function parseJSONResponse<T>(text: string): { success: true; data: T } | { success: false; error: string; rawText: string } {
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    const data = JSON.parse(jsonText) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "JSON parse error",
      rawText: text,
    };
  }
}

export async function generateTextWithJSONRetry<T>(
  request: TextGenerationRequest,
  repairPromptBuilder: (rawText: string) => { system: string; prompt: string },
  cancelToken?: CancelToken
): Promise<{ data: T; usage?: { inputTokens: number; outputTokens: number }; raw?: string }> {
  const response = await generateText(request, cancelToken);
  const parseResult = parseJSONResponse<T>(response.text);

  if (parseResult.success) {
    return { data: parseResult.data, usage: response.usage };
  }

  // First parse failed, try repair
  if (import.meta.env.DEV) {
    console.warn("JSON parse failed, attempting repair:", parseResult.error);
  }

  const repairPrompt = repairPromptBuilder(response.text);
  const repairRequest: TextGenerationRequest = {
    ...repairPrompt,
    maxOutputTokens: request.maxOutputTokens,
    stage: request.stage,
  };

  const repairResponse = await generateText(repairRequest, cancelToken);
  const repairParseResult = parseJSONResponse<T>(repairResponse.text);

  if (repairParseResult.success) {
    const totalUsage = response.usage && repairResponse.usage
      ? {
        inputTokens: response.usage.inputTokens + repairResponse.usage.inputTokens,
        outputTokens: response.usage.outputTokens + repairResponse.usage.outputTokens,
      }
      : undefined;
    return { data: repairParseResult.data, usage: totalUsage };
  }

  // Repair also failed, return raw text for manual review
  if (import.meta.env.DEV) {
    console.error("JSON repair failed:", repairParseResult.error);
  }
  throw {
    error: "JSON parse failed",
    message: "Could not parse AI response as valid JSON after retry",
    rawText: response.text,
    retryable: false,
  };
}
