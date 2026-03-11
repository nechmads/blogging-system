# Paddle Billing Integration Plan

## Price IDs
- Growth Monthly: `pri_01kkbyjnr11ayyv946t00894qc`
- Growth Yearly: `pri_01kkbymh4k5khftkx3zam18trb`

## Phase 1: Database & DAL (Backend Foundation)

### 1.1 D1 Migration (`0018_paddle_subscriptions.sql`)
- Add columns to `users` table:
  - `paddle_customer_id TEXT`
  - `paddle_subscription_id TEXT`
  - `subscription_status TEXT NOT NULL DEFAULT 'none'` (none/active/trialing/past_due/paused/canceled)
  - `subscription_price_id TEXT`
  - `current_period_end TEXT`
- Create `paddle_events` table for idempotency:
  - `event_id TEXT PRIMARY KEY`
  - `event_type TEXT NOT NULL`
  - `processed_at TEXT NOT NULL DEFAULT (datetime('now'))`

### 1.2 DAL Types (`services/data-layer/src/types.ts`)
- Add new fields to `User` interface: `paddleCustomerId`, `paddleSubscriptionId`, `subscriptionStatus`, `subscriptionPriceId`, `currentPeriodEnd`
- Add to `UpdateUserInput`: same fields as optional
- Add `PaddleEvent` type and `CreatePaddleEventInput`

### 1.3 DAL Users Domain (`services/data-layer/src/domains/users.ts`)
- Update `mapRow` to include new paddle fields
- Update `updateUser` to handle new fields

### 1.4 DAL Paddle Events Domain (new: `services/data-layer/src/domains/paddle-events.ts`)
- `getPaddleEvent(db, eventId)` — check if event was already processed
- `createPaddleEvent(db, eventId, eventType)` — mark event as processed
- Expose via DAL index

---

## Phase 2: Webhook Handler (Server-side)

### 2.1 Paddle Webhook Verification Utility
- New file: `apps/web/src/lib/paddle.ts`
- `verifyPaddleWebhook(rawBody, signatureHeader, secret)` using Web Crypto API
- `PRICE_TO_TIER` mapping: `{ pri_01kkbyjnr11ayyv946t00894qc: 'growth', pri_01kkbymh4k5khftkx3zam18trb: 'growth' }`
- `resolveTierFromPriceId(priceId)` helper

### 2.2 Webhook Route (`apps/web/src/api/paddle-webhook.ts`)
- `POST /webhooks/paddle` — NO auth middleware (Paddle can't send Clerk tokens)
- Read raw body first, verify signature, then parse JSON
- Idempotency check via `getPaddleEvent()`
- Handle events:
  - `subscription.created` → save paddleCustomerId, paddleSubscriptionId, update tier, set subscriptionStatus
  - `subscription.updated` → update tier (if price changed), update status, update currentPeriodEnd
  - `subscription.canceled` → set tier back to 'creator', set subscriptionStatus to 'canceled'
  - `subscription.paused` → set subscriptionStatus to 'paused' (keep tier for grace)
  - `subscription.resumed` → set subscriptionStatus to 'active'
  - `subscription.past_due` → set subscriptionStatus to 'past_due' (keep tier — Paddle is retrying)
- Respond 200 immediately, process via `waitUntil()`

### 2.3 Wrangler Config
- Add secrets: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`
- Add vars: `PADDLE_ENVIRONMENT` ('sandbox'), `PADDLE_PRICE_GROWTH_MONTHLY`, `PADDLE_PRICE_GROWTH_YEARLY`
- Add client vars: `VITE_PADDLE_CLIENT_TOKEN`, `VITE_PADDLE_ENVIRONMENT`

---

## Phase 3: Billing API Routes (Server-side)

### 3.1 Billing Routes (`apps/web/src/api/billing.ts`)
- `GET /api/billing/subscription` — return current user's subscription info (status, tier, currentPeriodEnd, scheduledChange)
- `POST /api/billing/portal-session` — create Paddle customer portal session URL (requires paddleCustomerId), return URL
- `POST /api/billing/cancel` — cancel subscription via Paddle API (effective end of period)

### 3.2 Shared Tier Config Updates (`packages/shared/src/tiers.ts`)
- Add `PADDLE_PRICE_IDS` mapping constant
- Add feature descriptions for pricing page display
- Add `TIER_FEATURES` array for rendering the pricing table

---

## Phase 4: Frontend — Paddle.js Setup & Pricing Page

### 4.1 Paddle.js Integration
- `pnpm add @paddle/paddle-js` in `apps/web`
- New hook: `apps/web/src/hooks/usePaddle.ts`
  - Initialize Paddle.js once with client token + environment
  - `openCheckout(priceId, userEmail, userId)` helper
  - Handle `checkout.completed` event for optimistic UI update

### 4.2 Pricing Page (`apps/web/src/pages/PricingPage.tsx`)
- Public route at `/pricing`
- Three-column tier comparison (Creator / Growth / Enterprise)
- Feature comparison table with checkmarks, limits, and "Unlimited" badges
- Monthly/Yearly toggle switch (show savings for yearly)
- Use `Paddle.PricePreview()` for localized pricing display
- CTA buttons:
  - Creator: "Get Started Free" → /sign-up
  - Growth: "Start Growth Plan" → opens Paddle overlay checkout
  - Enterprise: "Contact Us" → mailto link
- FAQ section below the comparison
- Responsive: stacked cards on mobile
- Uses PublicNavbar + PublicFooter

### 4.3 Route Registration (`apps/web/src/app.tsx`)
- Add `/pricing` as public route

### 4.4 Navigation Updates
- `PublicNavbar.tsx`: Add "Pricing" link between Blog and CTA
- `PublicFooter.tsx`: Add "Pricing" link

---

## Phase 5: Frontend — Upgrade Flow & Settings

### 5.1 UpgradePrompt Redesign (`apps/web/src/components/upgrade/UpgradePrompt.tsx`)
- Replace "Contact Us" mailto with "Upgrade to Growth" button
- Button opens Paddle overlay checkout via `usePaddle()` hook
- Pass user email + userId as customData
- Show monthly/yearly toggle inside modal
- On `checkout.completed`: show success toast, refresh user store, close modal

### 5.2 Settings Page — Billing Section
- New section in SettingsPage between Connections and Notifications
- Shows current plan name and tier badge
- If subscribed:
  - Subscription status (Active, Past Due, etc.)
  - Next billing date
  - "Manage Billing" button → opens Paddle customer portal (via `/api/billing/portal-session`)
  - "Cancel Subscription" button → confirmation modal → Paddle Retain flow or API cancel
- If free tier:
  - "Upgrade to Growth" CTA → opens Paddle checkout

### 5.3 User Store Updates
- Extend `CurrentUser` to include `subscriptionStatus`, `currentPeriodEnd`, `paddleCustomerId`
- After checkout completion, call `loadCurrentUser()` to refresh tier

---

## Phase 6: Landing Page Updates

### 6.1 Pricing Teaser Section on Landing Page
- Add a section after "Who it's for" / before FAQ
- Show 2-column comparison: Free vs Growth (simplified)
- "See Full Pricing" CTA → /pricing
- Keep it brief — drive users to the full pricing page

---

## Implementation Order

1. Phase 1 (DB + DAL) — foundation, no visible changes
2. Phase 2 (Webhook) — can test with Paddle webhook simulator
3. Phase 3 (Billing API) — server routes for frontend to consume
4. Phase 4 (Pricing Page + Paddle.js) — the big visible deliverable
5. Phase 5 (Upgrade flow + Settings) — in-app upgrade experience
6. Phase 6 (Landing page) — marketing polish

## Files to Create
- `services/data-layer/migrations/0018_paddle_subscriptions.sql`
- `services/data-layer/src/domains/paddle-events.ts`
- `apps/web/src/lib/paddle.ts`
- `apps/web/src/api/paddle-webhook.ts`
- `apps/web/src/api/billing.ts`
- `apps/web/src/hooks/usePaddle.ts`
- `apps/web/src/pages/PricingPage.tsx`

## Files to Modify
- `services/data-layer/src/types.ts`
- `services/data-layer/src/domains/users.ts`
- `services/data-layer/src/index.ts`
- `apps/web/src/server.ts`
- `apps/web/src/app.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/stores/user-store.ts`
- `apps/web/src/components/upgrade/UpgradePrompt.tsx`
- `apps/web/src/components/public/PublicNavbar.tsx`
- `apps/web/src/components/public/PublicFooter.tsx`
- `apps/web/src/pages/SettingsPage.tsx`
- `apps/web/src/pages/LandingPage.tsx`
- `apps/web/wrangler.jsonc`
- `packages/shared/src/tiers.ts`
