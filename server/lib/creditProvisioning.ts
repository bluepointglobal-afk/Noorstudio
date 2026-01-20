/**
 * Credit Provisioning Service
 * Handles automatic credit provisioning when payments succeed
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";
import Stripe from "stripe";

// Plan tier definitions with credit amounts
export const PLAN_TIERS = {
  creator: {
    name: "Creator",
    characterCredits: 10,
    bookCredits: 15,
  },
  author: {
    name: "Author",
    characterCredits: 30,
    bookCredits: 50,
  },
  studio: {
    name: "Studio",
    characterCredits: 100,
    bookCredits: 200,
  },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS;

// Price ID to tier mapping (set in Stripe Dashboard via metadata)
// These should be configured with price metadata: { tier: "author" } or { tier: "studio" }
export function getTierFromPriceId(priceId: string, priceMetadata?: Record<string, string>): PlanTier | null {
  // First check metadata
  if (priceMetadata?.tier) {
    const tier = priceMetadata.tier.toLowerCase() as PlanTier;
    if (tier in PLAN_TIERS) {
      return tier;
    }
  }

  // Fallback: check environment variable mappings
  const authorPriceId = process.env.STRIPE_PRICE_AUTHOR;
  const studioPriceId = process.env.STRIPE_PRICE_STUDIO;

  if (priceId === authorPriceId) return "author";
  if (priceId === studioPriceId) return "studio";

  return null;
}

/**
 * Initialize Supabase client with service role for admin operations
 */
function getSupabaseAdmin(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[CreditProvisioning] Supabase not configured");
    return null;
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export interface ProvisionCreditsInput {
  userId: string;
  tier: PlanTier;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  isRenewal?: boolean;
}

export interface ProvisionCreditsResult {
  success: boolean;
  characterCreditsAdded: number;
  bookCreditsAdded: number;
  error?: string;
}

/**
 * Provision credits to a user based on their plan tier
 */
export async function provisionCredits(
  input: ProvisionCreditsInput
): Promise<ProvisionCreditsResult> {
  const { userId, tier, stripeCustomerId, stripeSubscriptionId, isRenewal = false } = input;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      characterCreditsAdded: 0,
      bookCreditsAdded: 0,
      error: "Supabase not configured",
    };
  }

  const planConfig = PLAN_TIERS[tier];
  if (!planConfig) {
    return {
      success: false,
      characterCreditsAdded: 0,
      bookCreditsAdded: 0,
      error: `Invalid tier: ${tier}`,
    };
  }

  const reason = isRenewal ? "subscription_renewal" : "subscription";

  try {
    // Update profile with plan tier and Stripe customer ID
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        plan_tier: tier,
        stripe_customer_id: stripeCustomerId,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("[CreditProvisioning] Failed to update profile:", profileError);
      return {
        success: false,
        characterCreditsAdded: 0,
        bookCreditsAdded: 0,
        error: `Failed to update profile: ${profileError.message}`,
      };
    }

    // Add character credits (using negative amount since deduct_credits_v2 subtracts)
    const { error: charCreditError } = await supabase.rpc("deduct_credits_v2", {
      p_user_id: userId,
      p_credit_type: "character_credits",
      p_amount: -planConfig.characterCredits, // Negative to ADD
      p_reason: reason,
      p_entity_type: "subscription",
      p_entity_id: stripeSubscriptionId,
      p_metadata: {
        tier,
        stripeCustomerId,
        stripeSubscriptionId,
        isRenewal,
      },
    });

    if (charCreditError) {
      console.error("[CreditProvisioning] Failed to add character credits:", charCreditError);
    }

    // Add book credits
    const { error: bookCreditError } = await supabase.rpc("deduct_credits_v2", {
      p_user_id: userId,
      p_credit_type: "book_credits",
      p_amount: -planConfig.bookCredits, // Negative to ADD
      p_reason: reason,
      p_entity_type: "subscription",
      p_entity_id: stripeSubscriptionId,
      p_metadata: {
        tier,
        stripeCustomerId,
        stripeSubscriptionId,
        isRenewal,
      },
    });

    if (bookCreditError) {
      console.error("[CreditProvisioning] Failed to add book credits:", bookCreditError);
    }

    console.log(`[CreditProvisioning] Provisioned ${tier} credits for user ${userId}:`, {
      characterCredits: planConfig.characterCredits,
      bookCredits: planConfig.bookCredits,
      isRenewal,
    });

    return {
      success: true,
      characterCreditsAdded: planConfig.characterCredits,
      bookCreditsAdded: planConfig.bookCredits,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[CreditProvisioning] Error:", message);
    return {
      success: false,
      characterCreditsAdded: 0,
      bookCreditsAdded: 0,
      error: message,
    };
  }
}

/**
 * Handle subscription cancellation - downgrade to creator tier
 * Note: Credits are NOT removed on cancellation (per requirements)
 */
export async function handleCancellation(
  userId: string,
  stripeCustomerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        plan_tier: "creator",
        // Keep stripe_customer_id for potential resubscription
      })
      .eq("id", userId);

    if (error) {
      console.error("[CreditProvisioning] Failed to downgrade user:", error);
      return { success: false, error: error.message };
    }

    console.log(`[CreditProvisioning] User ${userId} downgraded to creator tier (credits preserved)`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Get user ID from Stripe customer ID
 */
export async function getUserIdFromStripeCustomer(
  stripeCustomerId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error || !data) {
    console.error("[CreditProvisioning] Could not find user for Stripe customer:", stripeCustomerId);
    return null;
  }

  return data.id;
}

/**
 * Process a Stripe subscription event
 */
export async function processSubscriptionEvent(
  event: Stripe.Event,
  stripe: Stripe
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!userId || !subscriptionId) {
        console.warn("[CreditProvisioning] Missing userId or subscriptionId in checkout session");
        return;
      }

      // Get subscription to find the price/tier
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const priceMetadata = subscription.items.data[0]?.price.metadata as Record<string, string>;

      const tier = getTierFromPriceId(priceId, priceMetadata);
      if (!tier) {
        console.warn(`[CreditProvisioning] Could not determine tier for price ${priceId}`);
        return;
      }

      await provisionCredits({
        userId,
        tier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        isRenewal: false,
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;

      // Only handle subscription renewals (not initial payments)
      if (invoice.billing_reason !== "subscription_cycle") {
        return;
      }

      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      if (!subscriptionId) return;

      const userId = await getUserIdFromStripeCustomer(customerId);
      if (!userId) return;

      // Get subscription to find the tier
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const priceMetadata = subscription.items.data[0]?.price.metadata as Record<string, string>;

      const tier = getTierFromPriceId(priceId, priceMetadata);
      if (!tier) {
        console.warn(`[CreditProvisioning] Could not determine tier for price ${priceId}`);
        return;
      }

      await provisionCredits({
        userId,
        tier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        isRenewal: true,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const userId = await getUserIdFromStripeCustomer(customerId);
      if (!userId) return;

      await handleCancellation(userId, customerId);
      break;
    }
  }
}
