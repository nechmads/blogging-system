# Paddle Billing Integration Guide

Comprehensive reference for integrating Paddle as the subscription billing system for a Cloudflare Workers-based SaaS app (TypeScript, Hono framework).

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Architecture & Data Model](#2-architecture--data-model)
3. [Environment Setup & Configuration](#3-environment-setup--configuration)
4. [Products & Prices (Catalog)](#4-products--prices-catalog)
5. [Paddle.js Client-Side SDK](#5-paddlejs-client-side-sdk)
6. [Building a Pricing Page](#6-building-a-pricing-page)
7. [Checkout Integration](#7-checkout-integration)
8. [Webhooks & Events](#8-webhooks--events)
9. [Webhook Signature Verification](#9-webhook-signature-verification)
10. [Subscription Lifecycle Management](#10-subscription-lifecycle-management)
11. [Customer Portal & Payment Updates](#11-customer-portal--payment-updates)
12. [Paddle Retain (Cancellation Flows)](#12-paddle-retain-cancellation-flows)
13. [Testing & Sandbox](#13-testing--sandbox)
14. [API Reference Summary](#14-api-reference-summary)
15. [Cloudflare Workers Considerations](#15-cloudflare-workers-considerations)
16. [Best Practices & Gotchas](#16-best-practices--gotchas)
17. [Implementation Checklist](#17-implementation-checklist)

---

## 1. Core Concepts

### What is Paddle?

Paddle is a **Merchant of Record (MoR)** platform for SaaS businesses. Unlike a payment gateway (e.g., Stripe), Paddle acts as the seller of record, meaning:

- Paddle handles **global tax compliance** (VAT, sales tax, GST) automatically
- Paddle generates **invoices and receipts** on your behalf
- Paddle manages **PCI compliance** - you never touch card details
- You receive **net payouts** from Paddle after taxes and fees

### Key Entities

| Entity | Prefix | Description |
|--------|--------|-------------|
| **Product** | `pro_` | An item you sell (e.g., "Pro Plan", "Enterprise Plan") |
| **Price** | `pri_` | How much and how often a product is billed (monthly, yearly, one-time) |
| **Customer** | `ctm_` | A person or business buying from you |
| **Address** | `add_` | Customer billing address |
| **Business** | `biz_` | Business entity associated with a customer |
| **Transaction** | `txn_` | A record of payment collection - created for each billing event |
| **Subscription** | `sub_` | An ongoing billing relationship with recurring items |
| **Adjustment** | `adj_` | A refund or credit against a transaction |
| **Discount** | `dsc_` | A reduction applied to prices |

### How Entities Relate

```
Product
  └── Price(s)        (one product can have multiple prices: monthly, yearly, etc.)

Customer
  ├── Address(es)
  ├── Business(es)
  ├── Transaction(s)  (payment records)
  └── Subscription(s) (ongoing billing)

Subscription
  ├── Items[]         (list of prices the customer is subscribed to)
  ├── Transaction(s)  (billing events within this subscription)
  └── Scheduled Change (pending pause/cancel/resume)
```

### Subscription Model

When a customer checks out:
1. Paddle creates a **Customer** (with Address and optionally Business)
2. Paddle creates a **Transaction** to collect payment
3. On payment success, Paddle creates a **Subscription** for recurring items
4. On each billing cycle, Paddle creates a new **Transaction** under the subscription

---

## 2. Architecture & Data Model

### Subscription Statuses

| Status | Description | Customer Access |
|--------|-------------|-----------------|
| `trialing` | In a free trial period | Full access |
| `active` | Billing normally, payment current | Full access |
| `past_due` | Payment failed, in retry/dunning period | Full access (recommended) |
| `paused` | Billing temporarily stopped by request | Restricted or no access |
| `canceled` | Billing permanently stopped | No access |

**Important:** When status is `active` or `past_due`, customers should have full access to your app. The `past_due` status means Paddle is actively retrying payment through its dunning process.

### Scheduled Changes

Subscriptions can have a `scheduled_change` object when a pause, cancel, or resume is set to take effect at the end of the current billing period. This allows you to show users that their subscription will change while still granting access until the period ends.

---

## 3. Environment Setup & Configuration

### Required Credentials

| Credential | Location | Usage |
|------------|----------|-------|
| **API Key** | Paddle Dashboard > Developer Tools > Authentication | Server-side API calls |
| **Client-Side Token** | Paddle Dashboard > Developer Tools > Authentication | Paddle.js initialization |
| **Webhook Secret** | Paddle Dashboard > Developer Tools > Notifications | Webhook signature verification |

### Environment Variables

```env
# Server-side only (NEVER expose to client)
PADDLE_API_KEY=pdl_sdbx_apikey_xxxxx          # sandbox key
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxx        # webhook signing secret

# Client-side safe
PADDLE_CLIENT_TOKEN=test_xxxxxxxx             # client-side token
PADDLE_ENVIRONMENT=sandbox                     # "sandbox" or "production"

# Price IDs (from your Paddle catalog)
PADDLE_PRICE_PRO_MONTHLY=pri_xxxxx
PADDLE_PRICE_PRO_YEARLY=pri_xxxxx
PADDLE_PRICE_ENTERPRISE_MONTHLY=pri_xxxxx
PADDLE_PRICE_ENTERPRISE_YEARLY=pri_xxxxx
```

### API Base URLs

| Environment | Base URL |
|-------------|----------|
| **Sandbox** | `https://sandbox-api.paddle.com` |
| **Production** | `https://api.paddle.com` |

### API Key Prefixes

- Live keys: `pdl_live_apikey_...`
- Sandbox keys: `pdl_sdbx_apikey_...`

Using a sandbox key with the live API (or vice versa) returns a 403 error.

### Sandbox Dashboard

- Sandbox dashboard: `https://sandbox-vendors.paddle.com`
- Production dashboard: `https://vendors.paddle.com`

---

## 4. Products & Prices (Catalog)

### Product Catalog Structure

A complete product consists of:
- **Product entity**: Name, description, image, tax category
- **Price entity(ies)**: How much and how often a product is billed

You can create products and prices via the Paddle Dashboard (Catalog > Products) or via API.

### Creating Products via API

```typescript
// POST https://sandbox-api.paddle.com/products
const response = await fetch(`${PADDLE_API_BASE}/products`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${PADDLE_API_KEY}`,
  },
  body: JSON.stringify({
    name: "Pro Plan",
    description: "Full access to all features",
    tax_category: "standard",  // "standard" for software/SaaS
    custom_data: {
      tier: "pro",
      features: ["unlimited_publications", "custom_styles"]
    }
  }),
});
```

### Creating Prices via API

```typescript
// POST https://sandbox-api.paddle.com/prices
const response = await fetch(`${PADDLE_API_BASE}/prices`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${PADDLE_API_KEY}`,
  },
  body: JSON.stringify({
    product_id: "pro_xxxxx",
    description: "Pro Plan - Monthly",
    billing_cycle: {
      interval: "month",
      frequency: 1          // every 1 month
    },
    unit_price: {
      amount: "1900",       // $19.00 in cents
      currency_code: "USD"
    },
    trial_period: {          // optional
      interval: "day",
      frequency: 14          // 14-day trial
    },
    custom_data: {
      plan: "pro",
      interval: "monthly"
    }
  }),
});
```

### Price Types

- **Recurring prices**: Have a `billing_cycle` (monthly, yearly, etc.)
- **One-time prices**: No `billing_cycle` - used for setup fees, add-ons, etc.

**Constraint:** All recurring items on a subscription must share the same billing period. If a customer subscribes to a yearly plan, any recurring add-ons must also be yearly.

### Custom Data

You can store your own structured key-value data on products and prices using the `custom_data` field. This is useful for mapping Paddle entities to your internal tier system.

---

## 5. Paddle.js Client-Side SDK

### Installation Options

**Option A: NPM package (recommended for TypeScript)**

```bash
npm install @paddle/paddle-js
```

```typescript
import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;

async function setupPaddle() {
  paddleInstance = await initializePaddle({
    environment: 'sandbox',   // or omit for production
    token: 'test_xxxxxxxx',   // client-side token
    eventCallback: (event) => {
      // Handle all Paddle.js events
      console.log('Paddle event:', event.name, event.data);
    },
    checkout: {
      settings: {
        // Default settings for all checkouts on this page
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        allowLogout: false,
      }
    }
  });
}
```

**Option B: Script tag (for non-SPA pages)**

```html
<script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
<script>
  Paddle.Initialize({
    token: 'test_xxxxxxxx',
    environment: 'sandbox',
  });
</script>
```

### Key Paddle.js Methods

| Method | Description |
|--------|-------------|
| `Paddle.Initialize(options)` | Initialize Paddle.js (call once per page load) |
| `Paddle.Update(options)` | Update initialization values (e.g., customer info in SPAs) |
| `Paddle.Environment.set(env)` | Set environment to "sandbox" or "production" |
| `Paddle.Checkout.open(options)` | Open a checkout overlay or inline |
| `Paddle.Checkout.close()` | Close an open checkout |
| `Paddle.Checkout.updateCheckout(options)` | Update settings on an open checkout |
| `Paddle.Checkout.updateItems(items)` | Update items in an open checkout |
| `Paddle.PricePreview(request)` | Get localized pricing for items (for pricing pages) |
| `Paddle.TransactionPreview(request)` | Advanced pricing preview with transaction context |
| `Paddle.Retain.initCancellationFlow(options)` | Start a Paddle Retain cancellation flow |
| `Paddle.Retain.demo()` | Preview cancellation flow in demo mode |
| `Paddle.Spinner.show()` / `hide()` | Show/hide a loading spinner |

### React / SPA Usage with @paddle/paddle-js

The NPM package provides a React-friendly async initialization pattern:

```typescript
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { useEffect, useRef } from 'react';

function usePaddle() {
  const paddleRef = useRef<Paddle | undefined>();

  useEffect(() => {
    if (paddleRef.current) return; // Already initialized

    initializePaddle({
      environment: import.meta.env.VITE_PADDLE_ENVIRONMENT as 'sandbox' | 'production',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          // Show success UI, but rely on webhooks for provisioning
        }
      },
    }).then((paddle) => {
      paddleRef.current = paddle;
    });
  }, []);

  return paddleRef;
}
```

### Important Constraints

- `Paddle.Initialize()` can only be called **once per page**. Use `Paddle.Update()` to update `pwCustomer` or pass an updated `eventCallback` (important for SPAs).
- The NPM package (`@paddle/paddle-js`) always fetches the latest Paddle.js from the CDN for security compliance — it does NOT bundle the checkout script.
- Minimum TypeScript version: 4.1

---

## 6. Building a Pricing Page

### Using Paddle.PricePreview()

`Paddle.PricePreview()` returns localized pricing including taxes, discounts, and currency conversion. It automatically detects visitor location via IP address.

```typescript
import { initializePaddle } from '@paddle/paddle-js';

const paddle = await initializePaddle({
  token: 'test_xxxxxxxx',
  environment: 'sandbox',
});

// Get localized prices for your plans
const preview = await paddle.PricePreview({
  items: [
    { priceId: 'pri_pro_monthly', quantity: 1 },
    { priceId: 'pri_pro_yearly', quantity: 1 },
    { priceId: 'pri_enterprise_monthly', quantity: 1 },
    { priceId: 'pri_enterprise_yearly', quantity: 1 },
  ],
});

// preview.data contains localized pricing info
preview.data.details.lineItems.forEach(item => {
  console.log({
    priceId: item.price.id,
    name: item.price.description,
    unitPrice: item.formattedUnitTotals.total,    // e.g., "$19.00"
    currency: preview.data.currencyCode,          // e.g., "USD"
    interval: item.price.billingCycle?.interval,   // "month" or "year"
  });
});
```

### Key Features

- **Automatic localization**: Detects visitor location via IP and returns prices in their local currency
- **Tax-inclusive pricing**: Shows prices with tax included based on visitor location
- **No server-side calls needed**: Works entirely client-side via Paddle.js
- **Discount support**: Can include discount codes to show discounted prices
- **camelCase fields**: Same as the API's preview prices endpoint, but field names are in camelCase

### Building the UI

Use the preview response to render your pricing page with localized prices. The response includes formatted price strings (e.g., "$19.00", "EUR 16.00") that you can display directly.

---

## 7. Checkout Integration

### Overlay Checkout (Recommended)

The overlay checkout appears as a modal on top of your page. This is the simplest integration.

```typescript
// Open overlay checkout
paddle.Checkout.open({
  items: [
    { priceId: 'pri_xxxxx', quantity: 1 }
  ],
  customer: {
    email: 'user@example.com',  // Pre-fill if user is logged in
  },
  customData: {
    userId: 'usr_internal_123',  // Your internal user ID for webhook mapping
  },
  settings: {
    displayMode: 'overlay',
    theme: 'light',
    locale: 'en',
    allowLogout: false,          // Hide "change email" when pre-filled
    successUrl: 'https://yourapp.com/subscription?success=1',
  },
});
```

### Inline Checkout

Embeds checkout directly into your page inside a container element.

```typescript
paddle.Checkout.open({
  items: [
    { priceId: 'pri_xxxxx', quantity: 1 }
  ],
  customer: {
    email: 'user@example.com',
  },
  customData: {
    userId: 'usr_internal_123',
  },
  settings: {
    displayMode: 'inline',
    frameTarget: 'checkout-container',    // DOM element ID
    frameStyle: 'width:100%; min-width:312px; background:transparent; border:0;',
    frameInitialHeight: 420,
  },
});
```

### HTML Data Attributes (No JavaScript)

You can trigger checkout without writing JavaScript using HTML attributes:

```html
<a
  href="#"
  class="paddle_button"
  data-items='[{"priceId":"pri_xxxxx","quantity":1}]'
  data-customer-email="user@example.com"
  data-custom-data='{"userId":"usr_internal_123"}'
  data-success-url="https://yourapp.com/subscription?success=1"
>
  Subscribe Now
</a>
```

### Checkout.open() Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | `Array<{priceId, quantity}>` | Products/prices to check out |
| `customer` | `{email?, id?}` | Pre-fill customer info |
| `customData` | `object` | Your key-value data (passed to transaction & subscription) |
| `settings.displayMode` | `"overlay"` or `"inline"` | How to display checkout |
| `settings.variant` | `"multi-page"` or `"one-page"` | Checkout layout variant (overlay only) |
| `settings.theme` | `"light"` or `"dark"` | Checkout theme |
| `settings.locale` | `string` | Language code (e.g., `"en"`, `"fr"`) |
| `settings.allowLogout` | `boolean` | Allow changing customer email |
| `settings.successUrl` | `string` | Redirect URL after success |
| `settings.frameTarget` | `string` | DOM element ID for inline mode |

### Handling Checkout Events

```typescript
await initializePaddle({
  token: 'test_xxxxxxxx',
  eventCallback: (event) => {
    switch (event.name) {
      case 'checkout.loaded':
        console.log('Checkout UI is ready');
        break;
      case 'checkout.customer.created':
        console.log('New customer created');
        break;
      case 'checkout.completed':
        console.log('Payment successful!', event.data);
        // Show success message, but rely on webhooks for provisioning
        break;
      case 'checkout.closed':
        console.log('User closed checkout');
        break;
      case 'checkout.error':
        console.error('Checkout error', event.data);
        break;
    }
  },
});
```

### Important: Don't Rely on Client Events for Provisioning

Use the `checkout.completed` event for UI updates only (show a success message, redirect). Always use **webhooks** for actual subscription provisioning since client-side events can be spoofed or missed.

---

## 8. Webhooks & Events

### How Webhooks Work

When a subscribed event occurs, Paddle sends an HTTP POST to your webhook endpoint with a JSON payload containing the updated entity. You must respond with a **2xx status code within 5 seconds**.

### Webhook Payload Structure

Every webhook follows this format:

```json
{
  "event_id": "evt_01hv8x2acma2gz7he8kg2s0hna",
  "event_type": "subscription.created",
  "occurred_at": "2024-04-12T10:18:49.621022Z",
  "notification_id": "ntf_01hv8x2af22vrrz7k67g06x1kq",
  "data": {
    "id": "sub_01hv8x...",
    "status": "active",
    "customer_id": "ctm_01hv8x...",
    "items": [...],
    "billing_details": {...},
    "current_billing_period": {...},
    "custom_data": {
      "userId": "usr_internal_123"
    }
    // ... full entity
  }
}
```

### Event Types

**Subscription Events** (most important for SaaS):

| Event | When It Fires |
|-------|---------------|
| `subscription.created` | New subscription created after checkout completion |
| `subscription.activated` | Subscription becomes active (after trial ends or first payment) |
| `subscription.updated` | Any change to subscription (plan change, billing update, etc.) |
| `subscription.trialing` | Subscription enters trial period |
| `subscription.paused` | Subscription paused |
| `subscription.resumed` | Subscription resumed from pause |
| `subscription.canceled` | Subscription canceled |
| `subscription.past_due` | Payment failed, entering dunning |
| `subscription.imported` | Subscription imported from another system |

**Transaction Events:**

| Event | When It Fires |
|-------|---------------|
| `transaction.created` | New transaction created |
| `transaction.updated` | Transaction status changed |
| `transaction.ready` | Transaction ready for payment |
| `transaction.paid` | Payment received |
| `transaction.completed` | All processing complete |
| `transaction.billed` | Invoice sent (manual collection) |
| `transaction.canceled` | Transaction canceled |
| `transaction.past_due` | Payment past due |

**Customer Events:** `customer.created`, `customer.updated`, `customer.imported`

**Other Events:** `address.*`, `business.*`, `product.*`, `price.*`, `discount.*`, `adjustment.*`, `payout.*`, `report.*`

### Essential Events for SaaS Billing

Subscribe to at minimum:
- `subscription.created` - Provision access
- `subscription.updated` - Handle plan changes
- `subscription.canceled` - Revoke access
- `transaction.completed` - Payment confirmation

### Recommended Events for Full Coverage

- `subscription.created`
- `subscription.activated`
- `subscription.updated`
- `subscription.paused`
- `subscription.resumed`
- `subscription.canceled`
- `subscription.past_due`
- `transaction.completed`
- `transaction.paid`

### subscription.created Payload Details

The `subscription.created` event includes:
- The complete subscription entity (except `management_urls`)
- A `transaction_id` field containing the Paddle ID of the transaction that created the subscription
- `custom_data` passed during checkout (use this to link to your internal user ID)

### Retry Behavior

| Environment | Retries | Window |
|-------------|---------|--------|
| Sandbox | 3 | ~15 minutes |
| Live | 60 | ~3 days |

Live retries: 20 attempts in first hour, 47 within first day, all 60 within 3 days.

**Guarantee:** At-least-once delivery. Events may be delivered more than once and may arrive out of order.

### Setting Up Webhook Destinations

Via Paddle Dashboard: **Developer Tools > Notifications > New Destination**

Via API:
```typescript
// POST https://sandbox-api.paddle.com/notification-settings
const response = await fetch(`${PADDLE_API_BASE}/notification-settings`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${PADDLE_API_KEY}`,
  },
  body: JSON.stringify({
    description: "Production webhook endpoint",
    destination: "https://yourapp.com/api/paddle/webhook",
    type: "url",
    subscribed_events: [
      "subscription.created",
      "subscription.activated",
      "subscription.updated",
      "subscription.paused",
      "subscription.resumed",
      "subscription.canceled",
      "subscription.past_due",
      "transaction.completed",
    ],
    active: true,
  }),
});
```

Maximum 10 active webhook destinations per account.

---

## 9. Webhook Signature Verification

### Paddle-Signature Header Format

```
ts=1671552777;h1=eb4d0dc8853be92b7f063b9f3ba5233eb920a09459b6e6b2c26705b4364db151
```

- `ts` = Unix timestamp when the notification was sent
- `h1` = HMAC-SHA256 signature

### Verification Algorithm

1. **Extract** `ts` and `h1` from the `Paddle-Signature` header by splitting on `;` then `=`
2. **Build signed payload**: `{ts}:{raw_request_body}` (timestamp + colon + raw body string)
3. **Compute HMAC**: HMAC-SHA256 of the signed payload using your webhook secret key
4. **Compare**: The computed hex digest must match `h1`

### Implementation for Cloudflare Workers (Web Crypto API)

Since Cloudflare Workers don't have Node.js `crypto` module, use the Web Crypto API:

```typescript
async function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  // 1. Parse the Paddle-Signature header
  const parts = signatureHeader.split(';');
  const tsParam = parts.find(p => p.startsWith('ts='));
  const h1Param = parts.find(p => p.startsWith('h1='));

  if (!tsParam || !h1Param) return false;

  const ts = tsParam.split('=')[1];
  const h1 = h1Param.split('=')[1];

  if (!ts || !h1) return false;

  // 2. Optional: Check timestamp to prevent replay attacks (5s tolerance)
  const timestampAge = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (Math.abs(timestampAge) > 300) {  // 5 minute tolerance for production
    return false;
  }

  // 3. Build the signed payload
  const signedPayload = `${ts}:${rawBody}`;

  // 4. Compute HMAC-SHA256 using Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  // 5. Convert to hex string
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 6. Timing-safe comparison
  // In Cloudflare Workers, use crypto.subtle.timingSafeEqual if available
  // Otherwise, compare constant-time
  if (computedSignature.length !== h1.length) return false;

  const a = encoder.encode(computedSignature);
  const b = encoder.encode(h1);

  // Use timingSafeEqual for constant-time comparison
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean;
  };

  try {
    return subtle.timingSafeEqual(a.buffer, b.buffer);
  } catch {
    // Fallback: simple comparison (less secure but functional)
    return computedSignature === h1;
  }
}
```

### Alternative: Using Node.js crypto (for reference)

```typescript
import { createHmac } from 'crypto';

function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;

  const [tsPart, h1Part] = signatureHeader.split(';');
  const ts = tsPart?.split('=')[1];
  const h1 = h1Part?.split('=')[1];

  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computed = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return computed === h1;
}
```

### Critical Rules

- **NEVER parse/transform** the raw body before verification. Read the body as a raw string first, verify, then parse JSON.
- **NEVER add whitespace** or reformat the body - this changes the signature.
- Store `event_id` to enforce **idempotency** (events may be delivered more than once).
- Consider checking `ts` timestamp to prevent **replay attacks** (Paddle SDKs default to 5-second tolerance, but use wider tolerance for production).

---

## 10. Subscription Lifecycle Management

### Subscription Creation (via Checkout)

Subscriptions are created automatically when a customer completes checkout for recurring items. You don't create subscriptions via API directly - the checkout flow handles this.

### Upgrade / Downgrade

When upgrading or downgrading, you **replace items** on the subscription:

```typescript
// PATCH https://sandbox-api.paddle.com/subscriptions/{subscription_id}
const response = await fetch(
  `${PADDLE_API_BASE}/subscriptions/${subscriptionId}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      items: [
        {
          price_id: "pri_new_plan_price_id",  // New plan's price
          quantity: 1,
        }
      ],
      proration_billing_mode: "prorated_immediately",
      // Options:
      // "prorated_immediately" - charge/credit prorated amount now
      // "prorated_next_billing_period" - adjust on next bill
      // "full_immediately" - charge full new price now
      // "full_next_billing_period" - charge full on next bill
      // "do_not_bill" - no charge for the change
    }),
  }
);
```

### Proration Billing Modes

| Mode | Behavior |
|------|----------|
| `prorated_immediately` | Calculate prorated difference, charge/credit now |
| `prorated_next_billing_period` | Calculate prorated difference, apply on next bill |
| `full_immediately` | Charge full new price now |
| `full_next_billing_period` | Charge full new price on next bill |
| `do_not_bill` | No charge for the change |

Paddle calculates proration **to the minute** for precise billing.

### Pause a Subscription

```typescript
// POST https://sandbox-api.paddle.com/subscriptions/{subscription_id}/pause
const response = await fetch(
  `${PADDLE_API_BASE}/subscriptions/${subscriptionId}/pause`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      effective_from: "next_billing_period",
      // Options: "next_billing_period" (default) or "immediately"
    }),
  }
);
```

When paused:
- Status changes to `paused`
- No transactions created, no payment collected
- Customer can resume (unlike cancellation)
- Creates a `scheduled_change` if set to `next_billing_period`

### Resume a Paused Subscription

```typescript
// POST https://sandbox-api.paddle.com/subscriptions/{subscription_id}/resume
const response = await fetch(
  `${PADDLE_API_BASE}/subscriptions/${subscriptionId}/resume`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      effective_from: "immediately",
      // Options: "immediately" (default) or a specific RFC 3339 datetime
    }),
  }
);
```

### Cancel a Subscription

```typescript
// POST https://sandbox-api.paddle.com/subscriptions/{subscription_id}/cancel
const response = await fetch(
  `${PADDLE_API_BASE}/subscriptions/${subscriptionId}/cancel`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      effective_from: "next_billing_period",
      // Options: "next_billing_period" (default) or "immediately"
    }),
  }
);
```

**Cancellation is permanent.** You cannot reinstate a canceled subscription. The customer would need to go through checkout again to create a new subscription.

When set to `next_billing_period`, a `scheduled_change` is added to the subscription so you can show users their access will continue until the period ends.

### Add One-Time Charges to a Subscription

```typescript
// POST https://sandbox-api.paddle.com/subscriptions/{subscription_id}/charge
const response = await fetch(
  `${PADDLE_API_BASE}/subscriptions/${subscriptionId}/charge`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      effective_from: "immediately",
      items: [
        {
          price_id: "pri_one_time_addon",
          quantity: 1,
        }
      ],
    }),
  }
);
```

---

## 11. Customer Portal & Payment Updates

### Paddle's Built-in Customer Portal

Paddle provides a hosted customer portal where customers can:
- View transaction/payment history
- Update payment methods
- Cancel subscriptions
- Manage billing information

The portal requires no setup and is included by default.

### Creating Authenticated Portal Sessions

Generate authenticated links so logged-in users can access the portal without re-authenticating:

```typescript
// POST https://sandbox-api.paddle.com/customers/{customer_id}/portal-sessions
const response = await fetch(
  `${PADDLE_API_BASE}/customers/${paddleCustomerId}/portal-sessions`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      subscription_ids: [subscriptionId],  // Optional: deep links for these subs
    }),
  }
);

const data = await response.json();
// data.data.urls contains:
// - data.data.urls.general  (customer portal homepage)
// - data.data.urls.subscriptions[0].update_payment_method  (update payment)
// - data.data.urls.subscriptions[0].cancel  (cancel subscription)
```

### Security Notes for Portal Sessions

- Portal session tokens are **unique, impossible to guess, and customer-specific**
- Tokens **expire automatically** - do not cache portal URLs
- Can only be generated via the server-side API with a valid API key

### Update Payment Method via Checkout

You can also build a custom payment update flow using Paddle.js Checkout:

```typescript
// Create an update-payment-method transaction via API
// Then open checkout with that transaction
paddle.Checkout.open({
  transactionId: 'txn_update_payment_xxxxx',
  settings: {
    displayMode: 'overlay',
  },
});
```

---

## 12. Paddle Retain (Cancellation Flows)

### Overview

Paddle Retain provides intelligent cancellation flows that can reduce churn by up to 30%. It's included at no additional cost for Paddle Billing customers.

### How It Works

When a customer clicks "Cancel", instead of immediately canceling, a multi-step flow is presented:

1. **Survey**: Ask why they want to cancel
2. **Feedback**: Ask what they liked about the product
3. **Salvage Attempt**: Offer alternatives (pause subscription, switch to lower plan)
4. **Discount Offer**: As a last resort, offer a temporary discount
5. **Confirmation**: If they still want to cancel, proceed

### Implementation

```typescript
// Start a cancellation flow
paddle.Retain.initCancellationFlow({
  subscriptionId: 'sub_xxxxx',  // Paddle subscription ID
}).then((result) => {
  // result tells you what the customer decided
  switch (result.status) {
    case 'retained':
      // Customer chose to stay (accepted salvage or discount)
      console.log('Customer retained!');
      break;
    case 'canceled':
      // Customer proceeded with cancellation
      // Retain automatically schedules cancellation in Paddle
      console.log('Subscription will be canceled');
      break;
    case 'closed':
      // Customer closed the flow without deciding
      console.log('Flow closed');
      break;
  }
});
```

### Configuration

Configure cancellation flows in the Paddle Dashboard:
- Customize survey questions
- Set up salvage offers (pause, plan switch, discount)
- Configure discount amounts and duration

### Important Limitations

- **Retain only works with live/production data** - not available in sandbox
- Use `Paddle.Retain.demo()` to preview the cancellation flow UI during development
- Retain is automatically included when using Paddle.js with Paddle Billing
- The `pwCustomer` parameter in `Paddle.Initialize()` helps Retain identify the customer, but it can also infer from `subscriptionId`

---

## 13. Testing & Sandbox

### Sandbox Setup

1. Create a sandbox account at `https://sandbox-vendors.paddle.com/signup`
2. Create products and prices in the sandbox catalog
3. Generate sandbox API keys and client tokens
4. Configure webhook destination pointing to your dev endpoint

### Test Card Numbers

In sandbox mode, use test cards (real cards won't work). Enter any cardholder name and a valid future expiry date.

Common test card numbers:
- **Successful payment**: `4242 4242 4242 4242`
- **3D Secure authentication**: Various numbers available in Paddle docs
- **Declined payment**: Various numbers available in Paddle docs
- **CVC**: Any 3-digit number
- **Expiry**: Any future date

For the complete list of test card numbers including 3DS and decline scenarios, see: https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-payment-method

### Testing Webhooks Locally

**Option A: Webhook Simulator (built-in)**
- Dashboard: Developer Tools > Notifications > Simulate
- Sends test events with valid signatures to your configured endpoint

**Option B: Tunneling for local development**

Using ngrok:
```bash
ngrok http 8787   # your Wrangler dev port
```

Using Hookdeck CLI:
```bash
npm install -g hookdeck-cli
hookdeck listen 8787 paddle-source
```

Then configure the tunnel URL as your webhook destination in Paddle Dashboard.

### Quick Authentication Test

Verify your API key works:
```bash
curl -X GET "https://sandbox-api.paddle.com/event-types" \
  -H "Authorization: Bearer pdl_sdbx_apikey_xxxxx"
```

### Testing Checklist

- [ ] Sandbox credentials configured
- [ ] Products and prices created in sandbox
- [ ] Overlay checkout opens and completes successfully
- [ ] Webhooks received and signature verified
- [ ] Subscription created in your database after checkout
- [ ] Plan upgrade/downgrade works
- [ ] Cancellation flow works
- [ ] Payment failure handling (use decline test cards)
- [ ] Customer portal session links work

---

## 14. API Reference Summary

### Authentication

All API requests use Bearer authentication:

```
Authorization: Bearer pdl_sdbx_apikey_xxxxx
```

### Base URLs

- Sandbox: `https://sandbox-api.paddle.com`
- Production: `https://api.paddle.com`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Products** | | |
| GET | `/products` | List products |
| POST | `/products` | Create product |
| GET | `/products/{id}` | Get product |
| PATCH | `/products/{id}` | Update product |
| **Prices** | | |
| GET | `/prices` | List prices |
| POST | `/prices` | Create price |
| GET | `/prices/{id}` | Get price |
| PATCH | `/prices/{id}` | Update price |
| **Customers** | | |
| GET | `/customers` | List customers |
| POST | `/customers` | Create customer |
| GET | `/customers/{id}` | Get customer |
| PATCH | `/customers/{id}` | Update customer |
| **Subscriptions** | | |
| GET | `/subscriptions` | List subscriptions |
| GET | `/subscriptions/{id}` | Get subscription |
| PATCH | `/subscriptions/{id}` | Update subscription (upgrade/downgrade) |
| POST | `/subscriptions/{id}/pause` | Pause subscription |
| POST | `/subscriptions/{id}/resume` | Resume subscription |
| POST | `/subscriptions/{id}/cancel` | Cancel subscription |
| POST | `/subscriptions/{id}/charge` | One-time charge |
| **Transactions** | | |
| GET | `/transactions` | List transactions |
| POST | `/transactions` | Create transaction |
| GET | `/transactions/{id}` | Get transaction |
| PATCH | `/transactions/{id}` | Update transaction |
| **Customer Portal** | | |
| POST | `/customers/{id}/portal-sessions` | Create portal session |
| **Pricing Preview** | | |
| POST | `/pricing-preview` | Preview prices |
| **Discounts** | | |
| GET | `/discounts` | List discounts |
| POST | `/discounts` | Create discount |
| GET | `/discounts/{id}` | Get discount |
| PATCH | `/discounts/{id}` | Update discount |
| **Notifications** | | |
| GET | `/notification-settings` | List webhook destinations |
| POST | `/notification-settings` | Create webhook destination |
| GET | `/notifications` | List sent notifications |
| POST | `/notifications/{id}/replay` | Replay a notification |
| **Event Types** | | |
| GET | `/event-types` | List all event types |

### Response Format

All API responses follow this structure:
```json
{
  "data": { ... },        // Entity or array of entities
  "meta": {
    "request_id": "req_xxxxx",
    "pagination": {        // For list endpoints
      "per_page": 50,
      "next": "https://...",
      "has_more": true,
      "estimated_total": 100
    }
  }
}
```

### Error Response Format

```json
{
  "error": {
    "type": "request_error",
    "code": "not_found",
    "detail": "Entity not found",
    "documentation_url": "https://developer.paddle.com/errors/..."
  },
  "meta": {
    "request_id": "req_xxxxx"
  }
}
```

---

## 15. Cloudflare Workers Considerations

### No Node.js crypto Module

Cloudflare Workers use the Web Crypto API instead of Node.js `crypto`. The webhook signature verification in Section 9 shows the Web Crypto implementation.

### Raw Body Access with Hono

In Hono, you need to read the raw body before any middleware parses it:

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Paddle webhook endpoint - read raw body for signature verification
app.post('/api/paddle/webhook', async (c) => {
  const rawBody = await c.req.text();  // Get raw body as string
  const signature = c.req.header('Paddle-Signature');
  const secret = c.env.PADDLE_WEBHOOK_SECRET;

  const isValid = await verifyPaddleWebhook(rawBody, signature, secret);

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const event = JSON.parse(rawBody);

  // Process event asynchronously if needed
  c.executionCtx.waitUntil(processWebhookEvent(event));

  // Respond immediately (must respond within 5 seconds)
  return c.json({ received: true });
});
```

### 5-Second Webhook Timeout

Paddle requires a 2xx response within 5 seconds. With Cloudflare Workers:
- Use `c.executionCtx.waitUntil()` for async processing after sending the response
- Store the raw event in D1/KV first, then process asynchronously
- The 30-second Workers timeout gives enough time for the initial response

### API Calls from Workers

Cloudflare Workers support `fetch` natively. The Paddle API works well since it's a standard REST API:

```typescript
async function paddleApiCall(
  env: Env,
  method: string,
  path: string,
  body?: object
) {
  const baseUrl = env.PADDLE_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.PADDLE_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Paddle API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
```

### Paddle Node.js SDK Compatibility

The official `@paddle/paddle-node-sdk` may not be fully compatible with Cloudflare Workers due to Node.js-specific dependencies. Consider:
- Using the REST API directly with `fetch` (recommended for Workers)
- Using the third-party `paddle-billing` package (uses native `fetch`, Node.js v18+)
- Testing SDK compatibility in your Workers environment

---

## 16. Best Practices & Gotchas

### Security

1. **Never expose API keys client-side** - only use client-side tokens in browser code
2. **Always verify webhook signatures** - reject requests with invalid signatures
3. **Don't trust client-side events for provisioning** - use webhooks for subscription activation
4. **Check timestamps on webhooks** to prevent replay attacks

### Idempotency

1. **Store `event_id`** from every processed webhook in your database
2. **Check for duplicates** before processing (events may arrive multiple times)
3. Use a unique constraint on `event_id` in your database:

```sql
CREATE TABLE paddle_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Out-of-Order Events

1. Events may arrive out of order (e.g., `subscription.updated` before `subscription.created`)
2. Use `occurred_at` timestamps to determine logical ordering
3. Consider a "fetch-before-process" pattern: query the Paddle API for current state rather than relying solely on webhook data

### Common Gotchas

| Gotcha | Solution |
|--------|----------|
| Parsing JSON before HMAC verification | Always read raw body first, verify, then parse |
| Using product IDs instead of price IDs in checkout | Checkout `items` uses `priceId`, not product ID |
| Mixing sandbox and production credentials | Use separate env vars, check prefixes match |
| Forgetting `environment: "sandbox"` in Paddle.js | Paddle defaults to production |
| Calling `Paddle.Initialize()` multiple times in SPA | Use `Paddle.Update()` for subsequent changes |
| Not handling `past_due` status | Keep user access during dunning; Paddle retries payment |
| Caching customer portal URLs | Portal sessions expire - always generate fresh |
| Trying to reinstate a canceled subscription | Cancellation is permanent - customer must re-subscribe |

### Linking Paddle to Your Users

Pass your internal user ID via `customData` during checkout:

```typescript
paddle.Checkout.open({
  items: [{ priceId: 'pri_xxxxx', quantity: 1 }],
  customData: {
    userId: 'your_internal_user_id',  // This appears in webhook payloads
  },
});
```

Then in your webhook handler:
```typescript
const userId = event.data.custom_data?.userId;
// Use this to update the correct user's subscription in your database
```

### Webhook Handler Pattern

```typescript
async function processWebhookEvent(event: PaddleWebhookEvent) {
  // 1. Idempotency check
  const existing = await db.getEvent(event.event_id);
  if (existing) return; // Already processed

  // 2. Store event for audit trail
  await db.insertEvent(event.event_id, event.event_type);

  // 3. Process based on event type
  switch (event.event_type) {
    case 'subscription.created': {
      const userId = event.data.custom_data?.userId;
      const subscriptionId = event.data.id;
      const status = event.data.status;
      const priceId = event.data.items[0]?.price?.id;

      await db.createSubscription({
        userId,
        paddleSubscriptionId: subscriptionId,
        paddleCustomerId: event.data.customer_id,
        status,
        priceId,
        currentPeriodEnd: event.data.current_billing_period?.ends_at,
      });
      break;
    }

    case 'subscription.updated': {
      await db.updateSubscription(event.data.id, {
        status: event.data.status,
        priceId: event.data.items[0]?.price?.id,
        currentPeriodEnd: event.data.current_billing_period?.ends_at,
        scheduledChange: event.data.scheduled_change || null,
      });
      break;
    }

    case 'subscription.canceled': {
      await db.updateSubscription(event.data.id, {
        status: 'canceled',
        canceledAt: event.occurred_at,
      });
      break;
    }

    case 'subscription.paused': {
      await db.updateSubscription(event.data.id, {
        status: 'paused',
      });
      break;
    }

    case 'subscription.past_due': {
      await db.updateSubscription(event.data.id, {
        status: 'past_due',
      });
      // Optionally notify user about payment issue
      break;
    }

    case 'transaction.completed': {
      // Payment confirmed - good for logging/analytics
      break;
    }
  }
}
```

---

## 17. Implementation Checklist

### Phase 1: Setup
- [ ] Create Paddle sandbox account
- [ ] Create products and prices in sandbox catalog
- [ ] Generate API key (server-side)
- [ ] Generate client-side token
- [ ] Add environment variables to Cloudflare Workers config
- [ ] Create database tables for subscriptions and webhook events

### Phase 2: Pricing Page
- [ ] Add Paddle.js to frontend (script tag or NPM package)
- [ ] Initialize Paddle.js with client token and sandbox environment
- [ ] Use `Paddle.PricePreview()` for localized pricing display
- [ ] Build pricing UI with plan comparison

### Phase 3: Checkout
- [ ] Implement overlay checkout with `Paddle.Checkout.open()`
- [ ] Pass user ID in `customData` for webhook mapping
- [ ] Pre-fill customer email for logged-in users
- [ ] Handle checkout success/close events in UI
- [ ] Set up success URL redirect

### Phase 4: Webhooks
- [ ] Create webhook endpoint in Hono app
- [ ] Implement signature verification using Web Crypto API
- [ ] Handle core events: subscription.created, .updated, .canceled
- [ ] Implement idempotency (store event_id, check for duplicates)
- [ ] Handle out-of-order events gracefully
- [ ] Register webhook destination in Paddle Dashboard
- [ ] Test with webhook simulator

### Phase 5: Subscription Management
- [ ] Implement upgrade/downgrade via API (PATCH subscription with new items)
- [ ] Choose and implement proration billing mode
- [ ] Implement pause/resume subscription
- [ ] Implement cancel subscription (prefer end-of-period)
- [ ] Add Paddle Retain cancellation flow for churn reduction
- [ ] Generate customer portal sessions for payment updates

### Phase 6: Production
- [ ] Apply for Paddle live account
- [ ] Complete business verification
- [ ] Create production products and prices
- [ ] Update environment variables with production credentials
- [ ] Update API base URL to `api.paddle.com`
- [ ] Set Paddle.js environment to production (remove sandbox setting)
- [ ] Configure production webhook destination
- [ ] Run real transaction test (small amount, then refund)
- [ ] Verify domain approval and checkout branding

---

## Appendix: NPM Packages

| Package | Use Case |
|---------|----------|
| `@paddle/paddle-js` | Client-side: TypeScript wrapper for Paddle.js |
| `@paddle/paddle-node-sdk` | Server-side: Official SDK (may need Node.js runtime) |
| `paddle-billing` | Server-side: Third-party TypeScript wrapper (uses native fetch) |

For Cloudflare Workers, direct `fetch` calls to the REST API are recommended over SDKs to avoid Node.js compatibility issues.

---

## 18. Hot Metal Implementation Plan

### Paddle Catalog Mapping

| Hot Metal Tier | Paddle Product | Monthly Price ID | Yearly Price ID |
|---------------|---------------|-----------------|----------------|
| Creator | (none - free) | — | — |
| Growth | "Growth Plan" | `pri_growth_monthly` | `pri_growth_yearly` |
| Enterprise | "Enterprise Plan" | Contact sales | Contact sales |

### Database Changes Needed

Add subscription tracking to the users table (via DAL):

```sql
-- 0018_paddle_subscriptions.sql
ALTER TABLE users ADD COLUMN paddle_customer_id TEXT;
ALTER TABLE users ADD COLUMN paddle_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'none';
-- 'none', 'active', 'trialing', 'past_due', 'paused', 'canceled'
ALTER TABLE users ADD COLUMN subscription_price_id TEXT;
ALTER TABLE users ADD COLUMN current_period_end TEXT;

CREATE TABLE paddle_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Key Integration Points

1. **Pricing page** (`/pricing`) — Public page using `Paddle.PricePreview()` for localized pricing
2. **Checkout** — Overlay triggered from pricing page + UpgradePrompt components, passing `customData: { userId }`
3. **Webhook endpoint** — Route in web app backend (`POST /api/paddle/webhook`) with signature verification
4. **Settings page** — "Manage Billing" button that opens Paddle customer portal session
5. **Tier sync** — Webhook handler maps `subscription.items[0].price.id` → tier name and updates user's `tier` column

### customData Flow

```
Checkout.open({ customData: { userId: "clerk_xxx" } })
  → Paddle stores on subscription
  → Webhook payload includes custom_data.userId
  → Handler looks up user by userId, updates tier
```

### Environment Variables

```env
# Client-side (VITE_ prefix for Vite)
VITE_PADDLE_CLIENT_TOKEN=test_xxxxxxxx
VITE_PADDLE_ENVIRONMENT=sandbox

# Server-side (wrangler secrets)
PADDLE_API_KEY=pdl_sdbx_apikey_xxxxx
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxx

# Price ID mapping (server-side config)
PADDLE_PRICE_GROWTH_MONTHLY=pri_xxxxx
PADDLE_PRICE_GROWTH_YEARLY=pri_xxxxx
```

---

## References

- Paddle Developer Docs: https://developer.paddle.com/
- Paddle API Reference: https://developer.paddle.com/api-reference/overview
- Paddle.js Methods: https://developer.paddle.com/paddlejs/overview
- Webhook Events: https://developer.paddle.com/webhooks/overview
- Paddle Node.js SDK: https://github.com/PaddleHQ/paddle-node-sdk
- Paddle.js NPM Package: https://github.com/PaddleHQ/paddle-js-wrapper
- Test Card Numbers: https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-payment-method
- Sandbox Setup: https://developer.paddle.com/build/tools/sandbox
- Customer Portal: https://developer.paddle.com/concepts/customer-portal
- Paddle Retain: https://developer.paddle.com/build/retain/configure-cancellation-flows-surveys
