/**
 * Stripe Checkout Routes
 * Handles checkout session creation and customer portal
 */

import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../env";

const router = Router();

// Initialize Stripe (only if configured)
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" })
  : null;

/**
 * POST /api/checkout/create-session
 * Creates a Stripe Checkout session for subscription
 */
router.post("/create-session", async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe not configured",
        message: "Payment processing is not available",
      });
    }

    const { priceId, successUrl, cancelUrl } = req.body;

    // Validate required fields
    if (!priceId) {
      return res.status(400).json({
        error: "Missing priceId",
        message: "Price ID is required",
      });
    }

    // Get user ID from auth (set by authMiddleware)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${env.CLIENT_ORIGIN}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${env.CLIENT_ORIGIN}/app/billing/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout session error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: "Stripe error",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "Internal error",
      message: "Failed to create checkout session",
    });
  }
});

/**
 * POST /api/checkout/create-portal-session
 * Creates a Stripe Customer Portal session for subscription management
 */
router.post("/create-portal-session", async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe not configured",
        message: "Payment processing is not available",
      });
    }

    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({
        error: "Missing customerId",
        message: "Customer ID is required",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${env.CLIENT_ORIGIN}/app/billing`,
    });

    return res.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Portal session error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: "Stripe error",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "Internal error",
      message: "Failed to create portal session",
    });
  }
});

export const checkoutRoutes = router;
