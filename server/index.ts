// NoorStudio Server
// Handles AI proxy, sharing, with rate limiting
// Keeps API keys and service role keys server-side only

import { env } from "./env";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { aiRoutes } from "./routes/ai";
import { shareRoutes } from "./routes/share";
import { checkoutRoutes } from "./routes/checkout";
import { webhookRoutes } from "./routes/webhooks";
import { AppError, RateLimitError, AuthError } from "./errors";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet"; // Added import for helmet
import { AI_TOKEN_BUDGETS, GLOBAL_LIMITS, estimateTokens } from "../src/lib/ai/tokenBudget";

const STAGE_COSTS: Record<string, number> = Object.entries(AI_TOKEN_BUDGETS).reduce((acc, [key, val]) => {
  acc[key] = val.creditCost;
  return acc;
}, {} as Record<string, number>);
const app = express();
const PORT = env.PORT;

// ============================================
// Rate Limiting (In-Memory, MVP)
// ============================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore: Map<string, Map<string, RateLimitEntry>> = new Map();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/ai/text": { maxRequests: 30, windowMs: 10 * 60 * 1000 }, // 30 req / 10 min
  "/api/ai/image": { maxRequests: 15, windowMs: 10 * 60 * 1000 },
  "/api/share/upsert": { maxRequests: 20, windowMs: 10 * 60 * 1000 },
};

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;
  const config = RATE_LIMITS[path];

  // Skip if no rate limit configured for this path
  if (!config) {
    next();
    return;
  }

  const clientIp = getClientIp(req);
  const now = Date.now();

  // Get or create store for this path
  if (!rateLimitStore.has(path)) {
    rateLimitStore.set(path, new Map());
  }
  const pathStore = rateLimitStore.get(path)!;

  // Get or create entry for this IP
  let entry = pathStore.get(clientIp);

  if (!entry || now - entry.windowStart > config.windowMs) {
    // New window
    entry = { count: 1, windowStart: now };
    pathStore.set(clientIp, entry);
  } else {
    entry.count++;
  }

  // Check limit
  if (entry.count > config.maxRequests) {
    const resetInMs = config.windowMs - (now - entry.windowStart);
    const resetInSec = Math.ceil(resetInMs / 1000);
    const resetInMin = Math.ceil(resetInMs / 60000);

    // Standardized error shape
    res.setHeader("Retry-After", resetInSec.toString());
    const error = new RateLimitError(
      `Rate limit exceeded. Please try again in ${resetInMin} minute${resetInMin === 1 ? "" : "s"}.`,
      {
        retryAfterMs: resetInMs,
        retryAfterSec: resetInSec,
      }
    );
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Add rate limit headers
  res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
  res.setHeader("X-RateLimit-Remaining", (config.maxRequests - entry.count).toString());
  res.setHeader("X-RateLimit-Reset", new Date(entry.windowStart + config.windowMs).toISOString());

  next();
}

// ============================================
// Authentication Middleware
// ============================================

export const supabase = env.SUPABASE_URL && env.SUPABASE_ANON_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  : null;

/**
 * Deduct credits from user profile
 * Uses service role access via the server's supabase client
 */
export async function deductCredits(
  userId: string,
  type: "character_credits" | "book_credits",
  amount: number,
  reason: string,
  entityType?: string,
  entityId?: string,
  metadata?: unknown
) {
  if (!supabase) return;

  const { data, error } = await supabase.rpc('deduct_credits_v2', {
    p_user_id: userId,
    p_credit_type: type,
    p_amount: amount,
    p_reason: reason,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata
  });

  if (error) {
    console.error("Credit deduction RPC failed:", error);
  }
}

// Extend Request type to include user and credit info
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: import("@supabase/supabase-js").User;
      creditCost?: number;
      creditType?: "character_credits" | "book_credits";
    }
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Health check doesn't need auth
  if (req.path === "/api/health") {
    next();
    return;
  }

  // ALWAYS bypass auth in development mode for testing
  if (env.NODE_ENV === "development") {
    console.warn("[AUTH] Development mode - bypassing authentication");
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!supabase) {
    res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Auth service not configured" } });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired session" } });
    return;
  }

  // Attach user to request for downstream use (e.g. data isolation)
  req.user = data.user;
  next();
}

/**
 * Middleware to check if user has enough credits
 * This is the core "Foundation Hardening" for credit enforcement
 */
const creditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // ALWAYS bypass credit checks in development mode
  if (env.NODE_ENV === "development") {
    console.warn("[CREDITS] Development mode - bypassing credit check");
    return next();
  }

  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const stage = req.body.stage || (req.path.includes("image") ? "illustrations" : "outline");
  const cost = STAGE_COSTS[stage] || 1;

  try {
    if (!supabase) {
      console.warn("Supabase client not initialized, skipping credit check");
      return next();
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("character_credits, book_credits")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }

    const creditType = stage === "illustrations" || stage === "cover" ? "character_credits" : "book_credits";
    const balance = profile[creditType as keyof typeof profile] as number;

    if (balance < cost) {
      return res.status(402).json({
        error: "Insufficient credits",
        required: cost,
        current: balance,
        creditType
      });
    }

    req.creditCost = cost;
    req.creditType = creditType;

    // PROJECT-WIDE TOKEN BUDGET ENFORCEMENT
    const projectId = req.body.projectId;
    if (projectId) {
      // Corrected query for projectId in metadata
      const { data: usageData } = await supabase
        .from("ai_usage")
        .select("tokens_in, tokens_out")
        .filter("metadata", "cs", JSON.stringify({ projectId }));

      if (usageData) {
        const totalTokens = usageData.reduce((sum, entry) =>
          sum + (entry.tokens_in || 0) + (entry.tokens_out || 0), 0
        );

        if (totalTokens > GLOBAL_LIMITS.totalBookMaxTokens) {
          return res.status(403).json({
            error: {
              code: "AI_TOKEN_BUDGET_EXCEEDED",
              message: `Project ${projectId} has reached the global token limit (${totalTokens} > ${GLOBAL_LIMITS.totalBookMaxTokens}).`
            }
          });
        }
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error during credit check" });
  }
};

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [path, pathStore] of rateLimitStore) {
    const config = RATE_LIMITS[path];
    if (!config) continue;

    for (const [ip, entry] of pathStore) {
      if (now - entry.windowStart > config.windowMs) {
        pathStore.delete(ip);
      }
    }
  }
}, 5 * 60 * 1000);

// ============================================
// Middleware
// ============================================

// Baseline HTTP Hardening
app.use(helmet());

// Custom CSP to allow Vite, Supabase, and NanoBanana
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-inline/eval needed for Vite dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.supabase.co", // Supabase Storage
        "https://api.nanobanana.com", // NanoBanana API (if it returns direct image URLs)
      ],
      connectSrc: [
        "'self'",
        env.CLIENT_ORIGIN,
        "https://*.supabase.co", // Supabase API/Storage
        "https://api.nanobanana.com", // NanoBanana API
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === "production", // Enable CSP in production
}));
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));

// Stripe webhook route (must be before express.json() for raw body access)
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json({ limit: "1mb" }));

// Apply rate limiting to specific routes
app.use(rateLimitMiddleware);

// ============================================
// Routes
// ============================================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI routes (text/image generation) - Protected
// Apply auth and credit middleware to AI routes
app.use("/api/ai", authMiddleware, creditMiddleware, aiRoutes);

// Share routes (project sharing to Supabase) - Protected
app.use("/api/share", authMiddleware, shareRoutes);

// Checkout routes (Stripe payments) - Protected
app.use("/api/checkout", authMiddleware, checkoutRoutes);

// ============================================
// Error Handler
// ============================================

app.use((err: Error | AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // If we already sent headers, don't try to send again
  if (res.headersSent) {
    return _next(err);
  }

  const errWithStatus = err as Error & { status?: number; statusCode?: number; code?: string; details?: unknown };
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : (errWithStatus.status || errWithStatus.statusCode || 500);
  const errorCode = isAppError ? err.code : (errWithStatus.code || "INTERNAL_SERVER_ERROR");

  // Log 500s as errors, others as warnings
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${errorCode}:`, err);
  } else {
    console.warn(`[SERVER WARN] ${errorCode}: ${err.message}`);
  }

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: statusCode === 500 && env.NODE_ENV !== "development"
        ? "An unexpected error occurred"
        : err.message || "Internal server error",
      details: (env.NODE_ENV === "development" || isAppError) ? (isAppError ? err.details : errWithStatus.details) : undefined,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`NoorStudio server running on port ${PORT}`);
  console.log(`Text provider: ${env.AI_TEXT_PROVIDER}`);
  console.log(`Image provider: ${env.AI_IMAGE_PROVIDER}`);
  console.log(`Supabase: ${env.SUPABASE_URL ? "configured" : "not configured"}`);
});

export default app;
