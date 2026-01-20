/**
 * useCheckout Hook
 * Handles Stripe checkout session creation and redirect
 */

import { useState } from "react";
import { getStripe, getPriceIdForTier, isStripeConfigured, PlanTier } from "./client";
import { supabase } from "@/lib/supabase/client";

export interface CheckoutState {
  isLoading: boolean;
  error: string | null;
}

export interface UseCheckoutResult {
  checkout: (tier: PlanTier) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for initiating Stripe checkout
 */
export function useCheckout(): UseCheckoutResult {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
  });

  const checkout = async (tier: PlanTier): Promise<void> => {
    // Reset state
    setState({ isLoading: true, error: null });

    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        throw new Error("Stripe is not configured. Payments are disabled.");
      }

      // Get price ID for the tier
      const priceId = getPriceIdForTier(tier);
      if (!priceId) {
        throw new Error(`No price configured for ${tier} plan. Please contact support.`);
      }

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error("Please sign in to upgrade your plan.");
      }

      // Create checkout session via backend
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/app/billing/cancel`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create checkout session (${response.status})`);
      }

      const { sessionId, url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        // If backend returns the URL directly, use it
        window.location.href = url;
      } else if (sessionId) {
        // Otherwise use Stripe.js to redirect
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error("Failed to load Stripe. Please try again.");
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw new Error(error.message || "Failed to redirect to checkout");
        }
      } else {
        throw new Error("Invalid response from checkout endpoint");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setState({ isLoading: false, error: message });
      throw err;
    }
  };

  return {
    checkout,
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Hook for creating Customer Portal session
 */
export function useCustomerPortal(): {
  openPortal: (customerId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
  });

  const openPortal = async (customerId: string): Promise<void> => {
    setState({ isLoading: true, error: null });

    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error("Please sign in to manage your subscription.");
      }

      const response = await fetch("/api/checkout/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId,
          returnUrl: `${window.location.origin}/app/billing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create portal session (${response.status})`);
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Invalid response from portal endpoint");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setState({ isLoading: false, error: message });
      throw err;
    }
  };

  return {
    openPortal,
    isLoading: state.isLoading,
    error: state.error,
  };
}
