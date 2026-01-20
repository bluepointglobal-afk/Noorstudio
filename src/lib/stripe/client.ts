/**
 * Stripe Client Configuration
 * Client-side Stripe initialization for checkout
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Singleton promise for Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance (lazy-loaded singleton)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.warn("Stripe publishable key not configured. Payments disabled.");
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
  }
  return stripePromise;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_PUBLISHABLE_KEY;
}

/**
 * Price IDs for subscription plans
 * These should match the prices created in Stripe Dashboard
 */
export const STRIPE_PRICE_IDS = {
  author: import.meta.env.VITE_STRIPE_PRICE_AUTHOR as string | undefined,
  studio: import.meta.env.VITE_STRIPE_PRICE_STUDIO as string | undefined,
} as const;

/**
 * Plan tier to price ID mapping
 */
export type PlanTier = "creator" | "author" | "studio";

export function getPriceIdForTier(tier: PlanTier): string | null {
  switch (tier) {
    case "author":
      return STRIPE_PRICE_IDS.author || null;
    case "studio":
      return STRIPE_PRICE_IDS.studio || null;
    case "creator":
    default:
      return null; // Free tier, no checkout needed
  }
}
