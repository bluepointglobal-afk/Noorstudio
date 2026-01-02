// NoorStudio Server
// Handles AI proxy, sharing, with rate limiting
// Keeps API keys and service role keys server-side only

import { env } from "./env";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { aiRoutes } from "./routes/ai";
import { shareRoutes } from "./routes/share";
import { AppError, RateLimitError } from "./errors";
import helmet from "helmet";

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

// AI routes (text/image generation)
app.use("/api/ai", aiRoutes);

// Share routes (project sharing to Supabase)
app.use("/api/share", shareRoutes);

// ============================================
// Error Handler
// ============================================

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // If we already sent headers, don't try to send again
  if (res.headersSent) {
    return _next(err);
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : (err.status || err.statusCode || 500);
  const errorCode = isAppError ? err.code : (err.code || "INTERNAL_SERVER_ERROR");

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
      details: (env.NODE_ENV === "development" || isAppError) ? err.details : undefined,
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
