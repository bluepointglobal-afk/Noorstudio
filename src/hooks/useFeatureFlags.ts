/**
 * React Hook: useFeatureFlags
 *
 * Provides easy access to feature flags in React components.
 * Caches results to minimize repeated checks.
 */

import { useState, useEffect } from 'react';
import {
  isUniverseV2Enabled,
  isAssetGenerationEnabled,
  isOutlineVersioningEnabled,
  getAllFeatureFlags,
} from '../lib/featureFlags';

export interface FeatureFlags {
  universeV2: boolean;
  assetGeneration: boolean;
  outlineVersioning: boolean;
  devMode: boolean;
}

/**
 * Hook to check if Universe V2 is enabled for current user
 *
 * Usage:
 *   const { enabled, loading } = useUniverseV2();
 *   if (loading) return <Spinner />;
 *   if (enabled) return <UniverseV2UI />;
 *   return <LegacyUI />;
 */
export function useUniverseV2() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    isUniverseV2Enabled().then((result) => {
      if (mounted) {
        setEnabled(result);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { enabled, loading };
}

/**
 * Hook to get all feature flags for current user
 *
 * Usage:
 *   const { flags, loading } = useFeatureFlags();
 *   if (loading) return <Spinner />;
 *   if (flags.universeV2) { ... }
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    getAllFeatureFlags().then((result) => {
      if (mounted) {
        setFlags(result as FeatureFlags);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { flags, loading };
}

/**
 * Simple hook for synchronous feature flags (non-rollout based)
 *
 * Usage:
 *   const assetGenerationEnabled = useSimpleFeatureFlag('assetGeneration');
 */
export function useSimpleFeatureFlag(
  flag: 'assetGeneration' | 'outlineVersioning'
): boolean {
  if (flag === 'assetGeneration') {
    return isAssetGenerationEnabled();
  }
  if (flag === 'outlineVersioning') {
    return isOutlineVersioningEnabled();
  }
  return false;
}
