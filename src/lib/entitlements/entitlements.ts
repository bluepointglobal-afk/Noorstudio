// Entitlements v1 - Plan-based limits and access control
// Plans: Creator (free), Author, Studio

// ============================================
// Demo Mode - Bypasses all limits for testing
// ============================================

const DEMO_MODE_KEY = "noorstudio.demo_mode.v1";

export function isDemoMode(): boolean {
  // STRICT: Demo mode is ONLY allowed in development environments.
  // This prevents trivial entitlement bypasses in production via localStorage.
  if (!import.meta.env.DEV) {
    return false;
  }

  try {
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    if (stored !== null) return stored === "true";
  } catch {
    // Ignore storage errors
  }

  return true;
}

export function setDemoMode(enabled: boolean): void {
  // Only allow setting demo mode in development
  if (import.meta.env.DEV) {
    localStorage.setItem(DEMO_MODE_KEY, enabled ? "true" : "false");
  }
}

// ============================================
// Types
// ============================================

export type PlanType = "creator" | "author" | "studio";

export interface PlanLimits {
  maxCharacters: number;
  maxProjects: number;
  exportEnabled: boolean;
  maxKBItemsPerKB: number;
}

export interface PlanInfo {
  id: PlanType;
  name: string;
  description: string;
  price: string;
  limits: PlanLimits;
  features: string[];
  recommended?: boolean;
}

// ============================================
// Plan Definitions
// ============================================

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  creator: {
    maxCharacters: 2,
    maxProjects: 1,
    exportEnabled: false,
    maxKBItemsPerKB: 10,
  },
  author: {
    maxCharacters: 20,
    maxProjects: 10,
    exportEnabled: true,
    maxKBItemsPerKB: 200,
  },
  studio: {
    maxCharacters: 200,
    maxProjects: 100,
    exportEnabled: true,
    maxKBItemsPerKB: 2000,
  },
};

export const PLANS: PlanInfo[] = [
  {
    id: "creator",
    name: "Creator",
    description: "Perfect for trying out NoorStudio",
    price: "Free",
    limits: PLAN_LIMITS.creator,
    features: [
      "2 characters",
      "1 book project",
      "10 KB items per knowledge base",
      "Preview exports (no download)",
      "Community support",
    ],
  },
  {
    id: "author",
    name: "Author",
    description: "For serious content creators",
    price: "$29/mo",
    limits: PLAN_LIMITS.author,
    recommended: true,
    features: [
      "20 characters",
      "10 book projects",
      "200 KB items per knowledge base",
      "Full export capabilities",
      "Priority support",
      "Early access to features",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    description: "For teams and publishers",
    price: "$99/mo",
    limits: PLAN_LIMITS.studio,
    features: [
      "200 characters",
      "100 book projects",
      "2000 KB items per knowledge base",
      "Full export capabilities",
      "Dedicated support",
      "Custom integrations",
      "Team collaboration (coming soon)",
    ],
  },
];

// ============================================
// Storage
// ============================================

const PLAN_STORAGE_KEY = "noorstudio.plan.v1";

export function getCurrentPlan(): PlanType {
  try {
    const stored = localStorage.getItem(PLAN_STORAGE_KEY);
    if (stored && ["creator", "author", "studio"].includes(stored)) {
      return stored as PlanType;
    }
    return "creator"; // Default to free plan
  } catch {
    return "creator";
  }
}

export function setCurrentPlan(plan: PlanType): void {
  localStorage.setItem(PLAN_STORAGE_KEY, plan);
}

export function getPlanLimits(plan?: PlanType): PlanLimits {
  const currentPlan = plan || getCurrentPlan();
  return PLAN_LIMITS[currentPlan];
}

export function getPlanInfo(plan?: PlanType): PlanInfo {
  const currentPlan = plan || getCurrentPlan();
  return PLANS.find((p) => p.id === currentPlan) || PLANS[0];
}

// ============================================
// Entitlement Checks
// ============================================

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  upgradeRequired?: boolean;
}

export function canCreateCharacter(currentCharacterCount: number): EntitlementCheckResult {
  // Demo mode bypasses all limits
  if (isDemoMode()) {
    return { allowed: true, currentCount: currentCharacterCount, limit: 999 };
  }

  const limits = getPlanLimits();
  const allowed = currentCharacterCount < limits.maxCharacters;

  return {
    allowed,
    reason: allowed ? undefined : `You've reached the maximum of ${limits.maxCharacters} characters on your plan.`,
    currentCount: currentCharacterCount,
    limit: limits.maxCharacters,
    upgradeRequired: !allowed,
  };
}

export function canCreateProject(currentProjectCount: number): EntitlementCheckResult {
  // Demo mode bypasses all limits
  if (isDemoMode()) {
    return { allowed: true, currentCount: currentProjectCount, limit: 999 };
  }

  const limits = getPlanLimits();
  const allowed = currentProjectCount < limits.maxProjects;

  return {
    allowed,
    reason: allowed ? undefined : `You've reached the maximum of ${limits.maxProjects} projects on your plan.`,
    currentCount: currentProjectCount,
    limit: limits.maxProjects,
    upgradeRequired: !allowed,
  };
}

export function canCreateKBItem(currentItemCount: number): EntitlementCheckResult {
  // Demo mode bypasses all limits
  if (isDemoMode()) {
    return { allowed: true, currentCount: currentItemCount, limit: 999 };
  }

  const limits = getPlanLimits();
  const allowed = currentItemCount < limits.maxKBItemsPerKB;

  return {
    allowed,
    reason: allowed ? undefined : `You've reached the maximum of ${limits.maxKBItemsPerKB} items per knowledge base on your plan.`,
    currentCount: currentItemCount,
    limit: limits.maxKBItemsPerKB,
    upgradeRequired: !allowed,
  };
}

export function canExport(): EntitlementCheckResult {
  // Demo mode bypasses all limits
  if (isDemoMode()) {
    return { allowed: true };
  }

  const limits = getPlanLimits();
  const allowed = limits.exportEnabled;

  return {
    allowed,
    reason: allowed ? undefined : "Export is not available on the Creator plan. Upgrade to Author or Studio to export your books.",
    upgradeRequired: !allowed,
  };
}

// ============================================
// Usage Summary
// ============================================

export interface UsageSummary {
  plan: PlanInfo;
  characters: { used: number; limit: number; percentage: number };
  projects: { used: number; limit: number; percentage: number };
  exportEnabled: boolean;
}

export function getUsageSummary(characterCount: number, projectCount: number): UsageSummary {
  const planInfo = getPlanInfo();
  const limits = planInfo.limits;

  return {
    plan: planInfo,
    characters: {
      used: characterCount,
      limit: limits.maxCharacters,
      percentage: Math.min(100, Math.round((characterCount / limits.maxCharacters) * 100)),
    },
    projects: {
      used: projectCount,
      limit: limits.maxProjects,
      percentage: Math.min(100, Math.round((projectCount / limits.maxProjects) * 100)),
    },
    exportEnabled: limits.exportEnabled,
  };
}
