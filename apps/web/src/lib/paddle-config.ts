/**
 * Paddle price IDs and configuration.
 *
 * Single source of truth for all Paddle-related constants
 * used across the frontend (PricingPage, UpgradePrompt) and backend (webhook handler).
 *
 * Price IDs are loaded from VITE_ env vars so sandbox and production
 * can coexist via `.env` (production) and `.env.development` (sandbox).
 */

const env = import.meta.env ?? {}

export const PADDLE_PRICE_IDS = {
	growthMonthly: env.VITE_PADDLE_GROWTH_MONTHLY_PRICE_ID ?? '',
	growthYearly: env.VITE_PADDLE_GROWTH_YEARLY_PRICE_ID ?? '',
}
