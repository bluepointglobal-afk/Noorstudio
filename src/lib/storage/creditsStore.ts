// Credits Store - localStorage persistence for credit system
// Keys:
// - noorstudio.credits.balances.v1
// - noorstudio.credits.ledger.v1

import { CreditType, PlanTier } from "@/lib/models";
import { CreditBalancesSchema, CreditLedgerEntrySchema } from "@/lib/validation/schemas";
import { validateAndRepair, validateArrayAndRepair } from "./validation";
import { getNamespacedKey } from "./keys";
import { supabase } from "@/lib/supabase/client";

// ============================================
// Types
// ============================================

export interface CreditBalances {
  characterCredits: number;
  bookCredits: number;
  plan: PlanTier;
}

export interface CreditLedgerEntry {
  id: string;
  ts: string;
  type: CreditType;
  amount: number;
  reason: string;
  entityType?: "character" | "pose" | "book" | "project" | "system";
  entityId?: string;
  meta?: Record<string, unknown>;
}

// ============================================
// Constants
// ============================================

const BALANCES_KEY = "noorstudio.credits.balances.v1";
const LEDGER_KEY = "noorstudio.credits.ledger.v1";

const DEFAULT_BALANCES: CreditBalances = {
  characterCredits: 30,
  bookCredits: 50,
  plan: "author",
};

const PLAN_LIMITS: Record<PlanTier, { characterCredits: number; bookCredits: number }> = {
  creator: { characterCredits: 10, bookCredits: 15 },
  author: { characterCredits: 30, bookCredits: 50 },
  studio: { characterCredits: 100, bookCredits: 200 },
};

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Balance Functions
// ============================================

export function getBalances(): CreditBalances {
  try {
    const key = getNamespacedKey(BALANCES_KEY);
    const stored = localStorage.getItem(key);
    if (!stored) return DEFAULT_BALANCES;

    const parsed = JSON.parse(stored);
    return validateAndRepair(key, parsed, CreditBalancesSchema, DEFAULT_BALANCES);
  } catch {
    if (import.meta.env.DEV) {
      console.error("Failed to parse credit balances from localStorage");
    }
    return DEFAULT_BALANCES;
  }
}

export function setBalances(balances: CreditBalances): void {
  localStorage.setItem(getNamespacedKey(BALANCES_KEY), JSON.stringify(balances));
}

export function seedDefaultBalancesIfEmpty(): void {
  const existing = localStorage.getItem(getNamespacedKey(BALANCES_KEY));
  if (!existing) {
    localStorage.setItem(getNamespacedKey(BALANCES_KEY), JSON.stringify(DEFAULT_BALANCES));
  }
}

export function getPlanLimits(plan: PlanTier): { characterCredits: number; bookCredits: number } {
  return PLAN_LIMITS[plan];
}

// ============================================
// Ledger Functions
// ============================================

export function getLedger(): CreditLedgerEntry[] {
  try {
    const key = getNamespacedKey(LEDGER_KEY);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return validateArrayAndRepair(key, parsed, CreditLedgerEntrySchema);
  } catch {
    if (import.meta.env.DEV) {
      console.error("Failed to parse credit ledger from localStorage");
    }
    return [];
  }
}

export function setLedger(ledger: CreditLedgerEntry[]): void {
  localStorage.setItem(getNamespacedKey(LEDGER_KEY), JSON.stringify(ledger.slice(0, 500))); // Cap at 500
}

export function addLedgerEntry(entry: Omit<CreditLedgerEntry, "id" | "ts">): CreditLedgerEntry {
  const ledger = getLedger();

  const newEntry: CreditLedgerEntry = {
    id: generateId(),
    ts: new Date().toISOString(),
    ...entry,
  };

  ledger.unshift(newEntry); // Add to beginning (most recent first)
  setLedger(ledger);

  return newEntry;
}

export function clearLedger(): void {
  localStorage.removeItem(getNamespacedKey(LEDGER_KEY));
}

// ============================================
// Credit Consumption
// ============================================

export interface ConsumeCreditsOptions {
  type: CreditType;
  amount: number;
  reason: string;
  entityType?: CreditLedgerEntry["entityType"];
  entityId?: string;
  meta?: Record<string, unknown>;
}

export interface ConsumeCreditsResult {
  success: boolean;
  newBalance: number;
  entry?: CreditLedgerEntry;
  error?: string;
}

export function consumeCredits(options: ConsumeCreditsOptions): ConsumeCreditsResult {
  const { type, amount, reason, entityType, entityId, meta } = options;
  const balances = getBalances();

  const currentBalance = type === "character" ? balances.characterCredits : balances.bookCredits;

  if (currentBalance < amount) {
    return {
      success: false,
      newBalance: currentBalance,
      error: `Insufficient ${type} credits. Need ${amount}, have ${currentBalance}.`,
    };
  }

  // Deduct credits
  const newBalance = currentBalance - amount;
  const updatedBalances: CreditBalances = {
    ...balances,
    [type === "character" ? "characterCredits" : "bookCredits"]: newBalance,
  };

  setBalances(updatedBalances);

  // Add ledger entry
  const entry = addLedgerEntry({
    type,
    amount,
    reason,
    entityType,
    entityId,
    meta,
  });

  return {
    success: true,
    newBalance,
    entry,
  };
}

export function hasEnoughCredits(type: CreditType, amount: number): boolean {
  const balances = getBalances();
  const current = type === "character" ? balances.characterCredits : balances.bookCredits;
  return current >= amount;
}

// ============================================
// Credit Addition (for demo/admin)
// ============================================

export interface AddCreditsOptions {
  type: CreditType;
  amount: number;
  reason: string;
}

export function addCredits(options: AddCreditsOptions): CreditBalances {
  const { type, amount, reason } = options;
  const balances = getBalances();

  const currentBalance = type === "character" ? balances.characterCredits : balances.bookCredits;
  const newBalance = currentBalance + amount;

  const updatedBalances: CreditBalances = {
    ...balances,
    [type === "character" ? "characterCredits" : "bookCredits"]: newBalance,
  };

  setBalances(updatedBalances);

  // Add ledger entry (negative amount to indicate credit add)
  addLedgerEntry({
    type,
    amount: -amount, // Negative = credits added
    reason,
    entityType: "system",
  });

  return updatedBalances;
}

// ============================================
// Plan Management
// ============================================

export function changePlan(newPlan: PlanTier): CreditBalances {
  const balances = getBalances();
  const limits = PLAN_LIMITS[newPlan];

  // Update plan and reset to plan limits
  const updatedBalances: CreditBalances = {
    characterCredits: limits.characterCredits,
    bookCredits: limits.bookCredits,
    plan: newPlan,
  };

  setBalances(updatedBalances);

  // Add ledger entry
  addLedgerEntry({
    type: "character",
    amount: 0,
    reason: `Plan changed to ${newPlan}`,
    entityType: "system",
  });

  return updatedBalances;
}

export async function syncCreditsWithServer(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('character_credits, book_credits, plan')
      .eq('id', session.user.id)
      .single();

    if (profile && !error) {
      setBalances({
        characterCredits: profile.character_credits,
        bookCredits: profile.book_credits,
        plan: (profile.plan as PlanTier) || 'author'
      });

      // Trigger a storage event for other tabs/hooks
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("Failed to sync credits with server:", err);
    }
  }
}

// ============================================
// Ledger Filtering
// ============================================

export interface LedgerFilters {
  type?: CreditType;
  entityType?: CreditLedgerEntry["entityType"];
  dateFrom?: string;
  dateTo?: string;
}

export function getFilteredLedger(filters: LedgerFilters): CreditLedgerEntry[] {
  const ledger = getLedger();

  return ledger.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.entityType && entry.entityType !== filters.entityType) return false;

    if (filters.dateFrom) {
      const entryDate = new Date(entry.ts);
      const fromDate = new Date(filters.dateFrom);
      if (entryDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const entryDate = new Date(entry.ts);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (entryDate > toDate) return false;
    }

    return true;
  });
}

// ============================================
// Stats & Analytics
// ============================================

export interface CreditStats {
  totalCharacterCreditsUsed: number;
  totalBookCreditsUsed: number;
  totalCharacterCreditsAdded: number;
  totalBookCreditsAdded: number;
  transactionCount: number;
}

export function getCreditStats(): CreditStats {
  const ledger = getLedger();

  return ledger.reduce(
    (acc, entry) => {
      if (entry.amount > 0) {
        // Credits consumed
        if (entry.type === "character") {
          acc.totalCharacterCreditsUsed += entry.amount;
        } else {
          acc.totalBookCreditsUsed += entry.amount;
        }
      } else {
        // Credits added
        if (entry.type === "character") {
          acc.totalCharacterCreditsAdded += Math.abs(entry.amount);
        } else {
          acc.totalBookCreditsAdded += Math.abs(entry.amount);
        }
      }
      acc.transactionCount++;
      return acc;
    },
    {
      totalCharacterCreditsUsed: 0,
      totalBookCreditsUsed: 0,
      totalCharacterCreditsAdded: 0,
      totalBookCreditsAdded: 0,
      transactionCount: 0,
    } as CreditStats
  );
}

// ============================================
// Reset Functions
// ============================================

export function resetCredits(): void {
  localStorage.removeItem(getNamespacedKey(BALANCES_KEY));
  localStorage.removeItem(getNamespacedKey(LEDGER_KEY));
  seedDefaultBalancesIfEmpty();
}
