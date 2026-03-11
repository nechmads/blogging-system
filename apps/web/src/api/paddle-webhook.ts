/**
 * Paddle webhook handler.
 *
 * Receives Paddle webhook events, verifies the signature,
 * and syncs subscription state to the database.
 *
 * This route has NO auth middleware — Paddle sends requests directly.
 * Security is via HMAC signature verification.
 *
 * Setup:
 * 1. Go to Paddle Dashboard > Developer Tools > Notifications > New Destination
 * 2. URL: https://hotmetalapp.com/webhooks/paddle
 * 3. Subscribe to: subscription.created, .activated, .updated, .paused, .resumed, .canceled, .past_due
 * 4. Copy the Webhook Secret → `wrangler secret put PADDLE_WEBHOOK_SECRET`
 */

import { Hono } from 'hono'
import type { AppEnv } from '../server'
import { verifyPaddleWebhook, resolveTierFromPriceId } from '../lib/paddle'

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled'

const paddleWebhook = new Hono<AppEnv>()

interface PaddleWebhookPayload {
	event_id: string
	event_type: string
	occurred_at: string
	data: {
		id: string // subscription ID (sub_...)
		status: string
		customer_id: string // ctm_...
		items: Array<{
			price: {
				id: string // pri_...
				product_id: string
			}
			quantity: number
		}>
		custom_data?: {
			userId?: string
		}
		current_billing_period?: {
			starts_at: string
			ends_at: string
		}
		scheduled_change?: {
			action: string
			effective_at: string
		} | null
	}
}

paddleWebhook.post('/paddle', async (c) => {
	const secret = c.env.PADDLE_WEBHOOK_SECRET
	if (!secret) {
		console.error('[Paddle] PADDLE_WEBHOOK_SECRET not configured')
		return c.json({ error: 'Webhook not configured' }, 500)
	}

	// 1. Read raw body BEFORE any parsing
	const rawBody = await c.req.text()
	const signature = c.req.header('Paddle-Signature')

	// 2. Verify signature
	const isValid = await verifyPaddleWebhook(rawBody, signature ?? null, secret)
	if (!isValid) {
		console.error('[Paddle] Invalid webhook signature')
		return c.json({ error: 'Invalid signature' }, 401)
	}

	// 3. Parse the event
	let event: PaddleWebhookPayload
	try {
		event = JSON.parse(rawBody)
	} catch {
		console.error('[Paddle] Failed to parse webhook body')
		return c.json({ error: 'Invalid JSON' }, 400)
	}

	// 4. Respond immediately (Paddle requires 2xx within 5 seconds)
	//    Process the event asynchronously via waitUntil
	c.executionCtx.waitUntil(
		processEvent(c.env, event).catch((err) => {
			console.error(`[Paddle] Error processing event ${event.event_id} (${event.event_type}):`, err)
		}),
	)

	return c.json({ received: true })
})

async function processEvent(env: Env, event: PaddleWebhookPayload): Promise<void> {
	const { event_id, event_type, data } = event

	// Idempotency check — skip if already processed
	const alreadyProcessed = await env.DAL.hasPaddleEvent(event_id)
	if (alreadyProcessed) {
		console.log(`[Paddle] Skipping duplicate event: ${event_id}`)
		return
	}

	const userId = data.custom_data?.userId
	if (!userId) {
		console.error(`[Paddle] No userId in custom_data for event ${event_id} (${event_type})`)
		return
	}

	const priceId = data.items?.[0]?.price?.id
	const tier = resolveTierFromPriceId(priceId)

	console.log(`[Paddle] Processing ${event_type} for user ${userId}, subscription ${data.id}, tier ${tier}`)

	switch (event_type) {
		case 'subscription.created':
		case 'subscription.activated': {
			// Check if user already has a subscription row (re-subscribe case)
			const existing = await env.DAL.getSubscriptionByUserId(userId)

			if (existing) {
				// Update existing row (re-subscribe after cancel)
				await env.DAL.updateSubscription(userId, {
					paddleSubscriptionId: data.id,
					paddlePriceId: priceId,
					tier,
					status: data.status as 'active' | 'trialing',
					currentPeriodStart: data.current_billing_period?.starts_at ?? null,
					currentPeriodEnd: data.current_billing_period?.ends_at ?? null,
					canceledAt: null,
				})
			} else {
				// Create new subscription row
				const id = crypto.randomUUID()
				await env.DAL.createSubscription({
					id,
					userId,
					paddleCustomerId: data.customer_id,
					paddleSubscriptionId: data.id,
					paddlePriceId: priceId,
					tier,
					status: data.status as 'active' | 'trialing',
					currentPeriodStart: data.current_billing_period?.starts_at,
					currentPeriodEnd: data.current_billing_period?.ends_at,
				})
			}

			// Update user tier
			await env.DAL.updateUser(userId, { tier })
			console.log(`[Paddle] User ${userId} upgraded to ${tier}`)
			break
		}

		case 'subscription.updated': {
			// Plan change, billing update, or renewal
			const updatedStatus = data.status as SubscriptionStatus
			await env.DAL.updateSubscription(userId, {
				paddlePriceId: priceId,
				tier,
				status: updatedStatus,
				currentPeriodStart: data.current_billing_period?.starts_at ?? null,
				currentPeriodEnd: data.current_billing_period?.ends_at ?? null,
			})

			// Sync tier (may have changed plan)
			await env.DAL.updateUser(userId, { tier })
			break
		}

		case 'subscription.canceled': {
			// Paddle fires this when the subscription is scheduled to cancel.
			// The user keeps their tier until the billing period ends.
			// We check scheduled_change — if present, the cancel is deferred.
			const effectiveAt = data.scheduled_change?.effective_at
			await env.DAL.updateSubscription(userId, {
				status: 'canceled',
				canceledAt: event.occurred_at,
			})

			if (!effectiveAt || new Date(effectiveAt) <= new Date()) {
				// Cancel is immediate or already past — revert tier now
				await env.DAL.updateUser(userId, { tier: 'creator' })
				console.log(`[Paddle] User ${userId} subscription canceled, reverted to creator`)
			} else {
				// Cancel is deferred — user keeps tier until effectiveAt
				console.log(`[Paddle] User ${userId} subscription canceled, access until ${effectiveAt}`)
			}
			break
		}

		case 'subscription.paused': {
			await env.DAL.updateSubscription(userId, {
				status: 'paused',
			})
			// Keep tier during pause — user paid for the period
			console.log(`[Paddle] User ${userId} subscription paused`)
			break
		}

		case 'subscription.resumed': {
			await env.DAL.updateSubscription(userId, {
				status: 'active',
				currentPeriodStart: data.current_billing_period?.starts_at ?? null,
				currentPeriodEnd: data.current_billing_period?.ends_at ?? null,
			})
			// Ensure tier is correct
			await env.DAL.updateUser(userId, { tier })
			console.log(`[Paddle] User ${userId} subscription resumed`)
			break
		}

		case 'subscription.past_due': {
			await env.DAL.updateSubscription(userId, {
				status: 'past_due',
			})
			// Keep tier — Paddle is retrying payment
			console.log(`[Paddle] User ${userId} subscription past_due (Paddle retrying)`)
			break
		}

		default:
			console.log(`[Paddle] Unhandled event type: ${event_type}`)
	}

	// Record event AFTER successful processing for idempotency
	try {
		await env.DAL.recordPaddleEvent(event_id, event_type)
	} catch (err) {
		// Processing succeeded but event recording failed.
		// A retry from Paddle may re-process this event, but handlers are idempotent.
		console.error(`[Paddle] Failed to record event ${event_id} after successful processing:`, err)
	}
}

export default paddleWebhook
