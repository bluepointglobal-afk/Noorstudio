// AI Engine Configuration
// Reads from environment variables with safe defaults

export type TextProvider = "claude" | "mock";
export type ImageProvider = "nanobanana" | "mock";

export interface AIConfig {
  textProvider: TextProvider;
  imageProvider: ImageProvider;
  claudeApiKey: string;
  nanobananaApiKey: string;
  maxOutputTokensOutline: number;
  maxOutputTokensChapter: number;
  maxChaptersPerRun: number;
  maxRetries: number;
  // Server proxy URLs (for browser safety)
  textProxyUrl: string;
  imageProxyUrl: string;
}

function getEnvString(key: string, defaultValue: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return (import.meta.env[key] as string) || defaultValue;
  }
  return defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnvString(key, String(defaultValue));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getAIConfig(): AIConfig {
  return {
    textProvider: getEnvString("VITE_AI_TEXT_PROVIDER", "mock") as TextProvider,
    imageProvider: getEnvString("VITE_AI_IMAGE_PROVIDER", "mock") as ImageProvider,
    claudeApiKey: getEnvString("VITE_CLAUDE_API_KEY", ""),
    nanobananaApiKey: getEnvString("VITE_NANOBANANA_API_KEY", ""),
    maxOutputTokensOutline: getEnvNumber("VITE_AI_MAX_OUTPUT_TOKENS_OUTLINE", 1200),
    maxOutputTokensChapter: getEnvNumber("VITE_AI_MAX_OUTPUT_TOKENS_CHAPTER", 1600),
    maxChaptersPerRun: getEnvNumber("VITE_AI_MAX_CHAPTERS_PER_RUN", 3),
    maxRetries: getEnvNumber("VITE_AI_MAX_RETRIES", 2),
    textProxyUrl: getEnvString("VITE_AI_TEXT_PROXY_URL", "/api/ai/text"),
    imageProxyUrl: getEnvString("VITE_AI_IMAGE_PROXY_URL", "/api/ai/image"),
  };
}

// Check if we're in mock mode
export function isTextMockMode(): boolean {
  return getAIConfig().textProvider === "mock";
}

export function isImageMockMode(): boolean {
  return getAIConfig().imageProvider === "mock";
}

// Validate configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const config = getAIConfig();
  const errors: string[] = [];

  if (config.textProvider === "claude" && !config.claudeApiKey) {
    // API key should be on server, not client - this is just a warning
    console.warn("Claude provider selected but no API key configured. Using server proxy.");
  }

  if (config.imageProvider === "nanobanana" && !config.nanobananaApiKey) {
    console.warn("NanoBanana provider selected but no API key configured. Using server proxy.");
  }

  if (config.maxOutputTokensOutline < 100 || config.maxOutputTokensOutline > 4000) {
    errors.push("maxOutputTokensOutline should be between 100 and 4000");
  }

  if (config.maxOutputTokensChapter < 100 || config.maxOutputTokensChapter > 4000) {
    errors.push("maxOutputTokensChapter should be between 100 and 4000");
  }

  if (config.maxChaptersPerRun < 1 || config.maxChaptersPerRun > 10) {
    errors.push("maxChaptersPerRun should be between 1 and 10");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
