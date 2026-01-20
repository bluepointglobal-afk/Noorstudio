/**
 * Stripe Webhook Routes
 * Handles Stripe webhook events for subscription management
 */

import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../env";
import { processSubscriptionEvent } from "../lib/creditProvisioning";

const router = Router();

// Initialize Stripe (only if configured)
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" })
  : null;

/**
 * POST /api/webhooks/stripe
 * Handles incoming Stripe webhook events
 * IMPORTANT: This endpoint expects raw body (not JSON parsed)
 */
router.post("/stripe", async (req: Request, res: Response) => {
  if (!stripe) {
    console.warn("[Webhook] Stripe not configured");
    return res.status(503).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.warn("[Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(503).json({ error: "Webhook secret not configured" });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body buffer
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Webhook] Signature verification failed:", message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${message}` });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    // Handle specific event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[Webhook] Checkout completed:", {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          userId: session.client_reference_id,
        });
        // Process credit provisioning
        await processSubscriptionEvent(event, stripe);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Webhook] Subscription created:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Webhook] Subscription updated:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Webhook] Subscription deleted:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });
        // Handle cancellation - downgrade to creator tier
        await processSubscriptionEvent(event, stripe);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[Webhook] Invoice payment succeeded:", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          billingReason: invoice.billing_reason,
        });
        // Handle renewal credit provisioning
        await processSubscriptionEvent(event, stripe);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Error processing event:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export const webhookRoutes = router;
