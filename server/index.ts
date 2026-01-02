// NoorStudio Server
// Handles AI proxy, sharing, with rate limiting
// Keeps API keys and service role keys server-side only

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { aiRoutes } from "./routes/ai";
import { shareRoutes } from "./routes/share";

const app = express();
const PORT = process.env.PORT || 3001;

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
  "/api/ai/image": { maxRequests: 15, windowMs: 10 * 60 * 1000 }, // 15 req / 10 min
  "/api/share/upsert": { maxRequests: 20, windowMs: 10 * 60 * 1000 }, // 20 req / 10 min
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
    const resetInMin = Math.ceil(resetInMs / 60000);

    res.status(429).json({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${resetInMin} minute${resetInMin === 1 ? "" : "s"}.`,
      retryAfterMs: resetInMs,
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

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`NoorStudio server running on port ${PORT}`);
  console.log(`Text provider: ${process.env.AI_TEXT_PROVIDER || "mock"}`);
  console.log(`Image provider: ${process.env.AI_IMAGE_PROVIDER || "mock"}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? "configured" : "not configured"}`);
});

export default app;
