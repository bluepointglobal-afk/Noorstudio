import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const envSchema = z.object({
    PORT: z.string().transform((v) => parseInt(v, 10)).default("3001"),
    CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
    AI_TEXT_PROVIDER: z.enum(["mock", "claude"]).default("mock"),
    AI_IMAGE_PROVIDER: z.enum(["mock", "nanobanana", "google"]).default("mock"),
    CLAUDE_API_KEY: z.string().optional(),
    NANOBANANA_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
}).refine((data) => {
    if (data.AI_TEXT_PROVIDER === "claude" && !data.CLAUDE_API_KEY) {
        return false;
    }
    return true;
}, {
    message: "CLAUDE_API_KEY is required when AI_TEXT_PROVIDER is 'claude'",
    path: ["CLAUDE_API_KEY"],
}).refine((data) => {
    if (data.AI_IMAGE_PROVIDER === "nanobanana" && !data.NANOBANANA_API_KEY) {
        return false;
    }
    return true;
}, {
    message: "NANOBANANA_API_KEY is required when AI_IMAGE_PROVIDER is 'nanobanana'",
    path: ["NANOBANANA_API_KEY"],
}).refine((data) => {
    if (data.AI_IMAGE_PROVIDER === "google" && !data.GOOGLE_API_KEY) {
        return false;
    }
    return true;
}, {
    message: "GOOGLE_API_KEY is required when AI_IMAGE_PROVIDER is 'google'",
    path: ["GOOGLE_API_KEY"],
}).refine((data) => {
    // If either Supabase var is present, both must be present
    const hasUrl = !!data.SUPABASE_URL;
    const hasKey = !!data.SUPABASE_SERVICE_ROLE_KEY;
    if ((hasUrl || hasKey) && !(hasUrl && hasKey)) {
        return false;
    }
    return true;
}, {
    message: "Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required if sharing is enabled",
    path: ["SUPABASE_URL"],
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("❌ Invalid environment variables:");
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join(".")}: ${err.message}`);
            });
        } else {
            console.error("❌ Unknown error during environment validation:", error);
        }
        process.exit(1);
    }
}

export const env = validateEnv();
