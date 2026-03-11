/**
 * Paddle price IDs and configuration.
 *
 * Single source of truth for all Paddle-related constants
 * used across the frontend (PricingPage, UpgradePrompt) and backend (webhook handler).
 */

export const PADDLE_PRICE_IDS = {
  growthMonthly: 'pri_01kkbyjnr11ayyv946t00894qc',
  growthYearly: 'pri_01kkbymh4k5khftkx3zam18trb',
} as const

export type PaddlePriceId = (typeof PADDLE_PRICE_IDS)[keyof typeof PADDLE_PRICE_IDS]
