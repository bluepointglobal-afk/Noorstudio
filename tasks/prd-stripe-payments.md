# PRD: Stripe Payments Integration

## Overview
Integrate Stripe for subscription-based payments and one-time credit purchases, enabling monetization of NoorStudio.

## Current State
- BillingPage UI exists with plan comparison and demo credit buttons
- Credit system fully implemented (creditsStore.ts, ledger, balance tracking)
- Entitlements system complete (3 tiers: Creator, Author, Studio)
- Server-side credit deduction via Supabase RPC works
- **NO Stripe integration** - all payments are demo/mock

## User Stories

### US-001: Stripe Package Installation (Priority 1)
**As a developer, I want Stripe packages installed so that I can build payment features.**

**Acceptance Criteria:**
- Install `stripe` (server-side SDK)
- Install `@stripe/stripe-js` (client-side loader)
- Add STRIPE_SECRET_KEY to server/env.ts validation
- Add VITE_STRIPE_PUBLISHABLE_KEY to client config
- Update .env.example with Stripe key placeholders
- Typecheck passes

### US-002: Checkout Session Endpoint (Priority 2)
**As a developer, I want a checkout session endpoint so that users can be redirected to Stripe Checkout.**

**Acceptance Criteria:**
- Create POST /api/checkout/create-session endpoint in server/routes/
- Accept priceId, userId, and successUrl/cancelUrl parameters
- Create Stripe Checkout Session with subscription mode
- Return sessionId to client
- Add authentication check (JWT required)
- Typecheck passes

### US-003: Stripe Webhook Endpoint (Priority 3)
**As a developer, I want a webhook endpoint so that Stripe events can trigger credit provisioning.**

**Acceptance Criteria:**
- Create POST /api/webhooks/stripe endpoint
- Verify webhook signature using STRIPE_WEBHOOK_SECRET
- Handle checkout.session.completed event
- Handle customer.subscription.created event
- Handle customer.subscription.updated event
- Handle customer.subscription.deleted event
- Log webhook events for debugging
- Typecheck passes

### US-004: Credit Provisioning on Payment (Priority 4)
**As a system, I want credits provisioned automatically when payment succeeds so that users get immediate access.**

**Acceptance Criteria:**
- On checkout.session.completed, identify the plan tier from price metadata
- Provision credits based on plan (Creator: 10+15, Author: 30+50, Studio: 100+200)
- Update user's plan_tier in Supabase profiles table
- Record credit addition in ledger with "subscription" reason
- Handle subscription renewal (monthly credit refresh)
- Typecheck passes

### US-005: Checkout Button Integration (Priority 5)
**As an author, I want to click a button to start the checkout process so that I can upgrade my plan.**

**Acceptance Criteria:**
- Create loadStripe() initialization in client
- Add "Upgrade" buttons to BillingPage plan cards
- On click, call /api/checkout/create-session
- Redirect to Stripe Checkout using returned sessionId
- Handle loading/error states
- Typecheck passes

### US-006: Success and Cancel Pages (Priority 6)
**As an author, I want to see confirmation after payment so that I know my upgrade succeeded.**

**Acceptance Criteria:**
- Create /app/billing/success route
- Show confirmation message with new plan details
- Fetch updated credits and display balance
- Create /app/billing/cancel route
- Show message that payment was canceled
- Add "Return to Billing" button
- Typecheck passes

### US-007: Subscription Management (Priority 7)
**As an author, I want to manage my subscription so that I can cancel or change plans.**

**Acceptance Criteria:**
- Create POST /api/checkout/create-portal-session endpoint
- Generate Stripe Customer Portal link
- Add "Manage Subscription" button to BillingPage
- Allow users to cancel subscription via portal
- Handle subscription cancellation webhook (downgrade to free)
- Typecheck passes

## Technical Notes

### Stripe Products/Prices (to create in Stripe Dashboard)
```
Product: NoorStudio Creator
- Price: $0/month (free tier, no checkout needed)

Product: NoorStudio Author
- Price: $29/month
- Metadata: { tier: "author", character_credits: 30, book_credits: 50 }

Product: NoorStudio Studio
- Price: $99/month
- Metadata: { tier: "studio", character_credits: 100, book_credits: 200 }
```

### Environment Variables
```
# Server (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Client (.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Webhook Event Flow
```
checkout.session.completed
  → Extract customer, subscription, price metadata
  → Update Supabase profiles.plan_tier
  → Add credits to user balance
  → Record in ledger

customer.subscription.updated
  → Check if plan changed (upgrade/downgrade)
  → Adjust credits if needed

customer.subscription.deleted
  → Set plan_tier to "creator" (free)
  → Keep existing credits (no removal)
```

### Security Notes
- Always verify webhook signatures
- Never expose STRIPE_SECRET_KEY to client
- Use server-side session creation only
- Validate userId matches authenticated user

## Dependencies
- Supabase Auth (for user identification)
- Supabase profiles table (for plan_tier storage)
- Existing creditsStore.ts (for credit management)

## Out of Scope
- One-time credit purchases (future)
- Invoices/receipts viewing (use Stripe portal)
- Proration for mid-cycle upgrades (handled by Stripe)
- Multiple currencies (USD only)
