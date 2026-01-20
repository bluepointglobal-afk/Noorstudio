/**
 * Stripe Module
 * Client-side Stripe integration for checkout and billing
 */

export { getStripe, isStripeConfigured, STRIPE_PRICE_IDS, getPriceIdForTier } from "./client";
export type { PlanTier } from "./client";
export { useCheckout, useCustomerPortal } from "./useCheckout";
export type { CheckoutState, UseCheckoutResult } from "./useCheckout";
