/**
 * Feature Flags System - Frontend
 *
 * Manages feature flags for gradual rollout and A/B testing.
 * Supports percentage-based rollout using consistent user hashing.
 */

import { supabase } from './supabase';

/**
 * Hash a user ID to a consistent number between 0-99
 * Uses simple string hashing for consistent percentage bucketing
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
 * Get the current user's ID from Supabase session
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

/**
 * Check if a user is in the rollout percentage
 *
 * @param userId - User ID to check
 * @param percentage - Rollout percentage (0-100)
 * @returns true if user is in the rollout group
 */
function isUserInRollout(userId: string | null, percentage: number): boolean {
  if (!userId) return false;
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const userHash = hashUserId(userId);
  return userHash < percentage;
}

/**
 * Feature: Universe V2
 *
 * Checks if the user has access to Universe V2 features based on:
 * 1. Global feature flag (VITE_ENABLE_UNIVERSE_V2)
 * 2. Rollout percentage (VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE)
 * 3. User's consistent hash bucket
 *
 * @returns Promise<boolean> - true if user has access to Universe V2
 */
export async function isUniverseV2Enabled(): Promise<boolean> {
  // Check if feature is globally enabled
  const enabled = import.meta.env.VITE_ENABLE_UNIVERSE_V2 === 'true';
  if (!enabled) return false;

  // Get rollout percentage
  const rolloutPercentage = parseInt(
    import.meta.env.VITE_UNIVERSE_V2_ROLLOUT_PERCENTAGE || '0',
    10
  );

  // If rollout is 100%, everyone gets access
  if (rolloutPercentage >= 100) return true;

  // If rollout is 0%, nobody gets access
  if (rolloutPercentage <= 0) return false;

  // Check if user is in rollout percentage
  const userId = await getCurrentUserId();
  return isUserInRollout(userId, rolloutPercentage);
}

/**
 * Feature: Asset Generation
 *
 * Checks if the user has access to asset generation features
 *
 * @returns boolean - true if asset generation is enabled
 */
export function isAssetGenerationEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ASSET_GENERATION === 'true';
}

/**
 * Feature: Outline Versioning
 *
 * Checks if the user has access to outline version control
 *
 * @returns boolean - true if outline versioning is enabled
 */
export function isOutlineVersioningEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_OUTLINE_VERSIONS === 'true';
}

/**
 * Development-only feature flags
 * Automatically enabled in development, controlled by env var in production
 */
export function isDevModeEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_MODE === 'true';
}

/**
 * Debug logging helper
 * Only logs in development or when debug mode is enabled
 */
export function debugLog(...args: any[]): void {
  if (isDevModeEnabled()) {
    console.log('[Feature Flags]', ...args);
  }
}

/**
 * Feature flag context for React components
 * Usage in components:
 *
 * const universeV2Enabled = await isUniverseV2Enabled();
 * if (universeV2Enabled) {
 *   // Show Universe V2 UI
 * } else {
 *   // Show legacy UI
 * }
 */

/**
 * Get all feature flags for current user
 * Useful for debugging and support
 */
export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  const universeV2 = await isUniverseV2Enabled();

  return {
    universeV2,
    assetGeneration: isAssetGenerationEnabled(),
    outlineVersioning: isOutlineVersioningEnabled(),
    devMode: isDevModeEnabled(),
  };
}

/**
 * Feature flag override for testing (development only)
 * Allows manually enabling/disabling features in dev tools
 */
export const FeatureFlagOverrides = {
  _overrides: {} as Record<string, boolean>,

  set(flag: string, value: boolean): void {
    if (!isDevModeEnabled()) {
      console.warn('Feature flag overrides only work in development mode');
      return;
    }
    this._overrides[flag] = value;
    debugLog(`Override set: ${flag} = ${value}`);
  },

  get(flag: string): boolean | undefined {
    return this._overrides[flag];
  },

  clear(): void {
    this._overrides = {};
    debugLog('All overrides cleared');
  },

  getAll(): Record<string, boolean> {
    return { ...this._overrides };
  },
};

// Expose to window for dev tools access (development only)
if (isDevModeEnabled() && typeof window !== 'undefined') {
  (window as any).featureFlags = {
    isUniverseV2Enabled,
    getAllFeatureFlags,
    overrides: FeatureFlagOverrides,
  };
}
