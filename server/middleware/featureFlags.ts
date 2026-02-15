/**
 * Feature Flags Middleware - Backend
 *
 * Server-side feature flag checking and percentage rollout.
 * Ensures consistent rollout between frontend and backend.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Hash a user ID to a consistent number between 0-99
 * MUST match the frontend hashing algorithm for consistency
 */
function hashUserId(userId: string): number {
  if (!userId) return 0;

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return a value between 0-99
  return Math.abs(hash) % 100;
}

/**
 * Check if a user is in the rollout percentage
 */
function isUserInRollout(userId: string | null, percentage: number): boolean {
  if (!userId) return false;
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const userHash = hashUserId(userId);
  return userHash < percentage;
}

/**
 * Extend Express Request to include feature flag data
 */
declare global {
  namespace Express {
    interface Request {
      hasUniverseV2Access?: boolean;
      featureFlags?: {
        universeV2: boolean;
        assetGeneration: boolean;
        outlineVersioning: boolean;
      };
    }
  }
}

/**
 * Middleware: Check Universe V2 Access
 *
 * Adds `req.hasUniverseV2Access` boolean to the request object.
 * Does NOT block requests - just adds information.
 *
 * Usage:
 *   app.use(checkUniverseV2Access);
 *
 * Then in routes:
 *   if (req.hasUniverseV2Access) {
 *     // Use Universe V2 logic
 *   } else {
 *     // Use legacy logic
 *   }
 */
export function checkUniverseV2Access(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if feature is globally enabled
  const enabled = process.env.ENABLE_UNIVERSE_V2 === 'true';

  if (!enabled) {
    req.hasUniverseV2Access = false;
    next();
    return;
  }

  // Get rollout percentage
  const rolloutPercentage = parseInt(
    process.env.UNIVERSE_V2_ROLLOUT_PERCENTAGE || '0',
    10
  );

  // If rollout is 100%, everyone gets access
  if (rolloutPercentage >= 100) {
    req.hasUniverseV2Access = true;
    next();
    return;
  }

  // If rollout is 0%, nobody gets access
  if (rolloutPercentage <= 0) {
    req.hasUniverseV2Access = false;
    next();
    return;
  }

  // Check if user is in rollout percentage
  const userId = (req as any).user?.id;
  req.hasUniverseV2Access = isUserInRollout(userId, rolloutPercentage);

  next();
}

/**
 * Middleware: Require Universe V2 Access
 *
 * Blocks requests if user doesn't have Universe V2 access.
 * Returns 403 Forbidden if access denied.
 *
 * Usage:
 *   router.get('/universes', requireUniverseV2Access, handler);
 */
export function requireUniverseV2Access(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // First check access (in case checkUniverseV2Access wasn't called)
  if (req.hasUniverseV2Access === undefined) {
    checkUniverseV2Access(req, res, () => {});
  }

  if (!req.hasUniverseV2Access) {
    res.status(403).json({
      error: 'Universe V2 access denied',
      message: 'This feature is not available for your account yet',
      code: 'FEATURE_NOT_AVAILABLE',
    });
    return;
  }

  next();
}

/**
 * Middleware: Add All Feature Flags to Request
 *
 * Adds a complete feature flags object to the request.
 * Useful for complex feature flag logic.
 *
 * Usage:
 *   app.use(addFeatureFlags);
 *
 * Then in routes:
 *   if (req.featureFlags?.universeV2) { ... }
 */
export function addFeatureFlags(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check Universe V2 access if not already checked
  if (req.hasUniverseV2Access === undefined) {
    checkUniverseV2Access(req, res, () => {});
  }

  // Build feature flags object
  req.featureFlags = {
    universeV2: req.hasUniverseV2Access || false,
    assetGeneration: process.env.ENABLE_ASSET_GENERATION === 'true',
    outlineVersioning: process.env.ENABLE_OUTLINE_VERSIONS === 'true',
  };

  next();
}

/**
 * Utility: Get feature flags for a specific user
 *
 * Useful for background jobs or non-request contexts.
 *
 * @param userId - User ID to check
 * @returns Feature flags object
 */
export function getFeatureFlagsForUser(userId: string): {
  universeV2: boolean;
  assetGeneration: boolean;
  outlineVersioning: boolean;
} {
  // Check Universe V2
  const universeV2Enabled = process.env.ENABLE_UNIVERSE_V2 === 'true';
  const rolloutPercentage = parseInt(
    process.env.UNIVERSE_V2_ROLLOUT_PERCENTAGE || '0',
    10
  );
  const hasUniverseV2 = universeV2Enabled && isUserInRollout(userId, rolloutPercentage);

  return {
    universeV2: hasUniverseV2,
    assetGeneration: process.env.ENABLE_ASSET_GENERATION === 'true',
    outlineVersioning: process.env.ENABLE_OUTLINE_VERSIONS === 'true',
  };
}

/**
 * Utility: Check if a specific feature is enabled for a user
 *
 * @param userId - User ID to check
 * @param feature - Feature name to check
 * @returns boolean - true if feature is enabled
 */
export function isFeatureEnabledForUser(
  userId: string,
  feature: 'universeV2' | 'assetGeneration' | 'outlineVersioning'
): boolean {
  const flags = getFeatureFlagsForUser(userId);
  return flags[feature];
}

/**
 * Express route handler: Get feature flags for current user
 *
 * Endpoint: GET /api/feature-flags
 *
 * Returns the feature flags for the authenticated user.
 * Useful for frontend to check server-side feature flags.
 */
export function getFeatureFlagsHandler(req: Request, res: Response): void {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  const flags = getFeatureFlagsForUser(userId);

  res.json({
    featureFlags: flags,
    rolloutInfo: {
      universeV2RolloutPercentage: parseInt(
        process.env.UNIVERSE_V2_ROLLOUT_PERCENTAGE || '0',
        10
      ),
      userHash: hashUserId(userId),
    },
  });
}

/**
 * Development-only: Override feature flags
 *
 * Endpoint: POST /api/feature-flags/override (dev only)
 *
 * Allows overriding feature flags for testing.
 * Only available in development mode.
 */
export function overrideFeatureFlagsHandler(req: Request, res: Response): void {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Feature flag overrides not available in production',
    });
    return;
  }

  // In a real implementation, you might store overrides in Redis
  // For now, this is just a placeholder
  res.json({
    message: 'Feature flag override not implemented',
    note: 'Use environment variables to control feature flags',
  });
}
