import type { Subscription, CreateSubscriptionInput, UpdateSubscriptionInput, SubscriptionStatus } from '../types'

const VALID_STATUSES = new Set<SubscriptionStatus>(['active', 'trialing', 'past_due', 'paused', 'canceled'])

interface SubscriptionRow {
	id: string
	user_id: string
	paddle_customer_id: string
	paddle_subscription_id: string
	paddle_price_id: string | null
	tier: string
	status: string
	current_period_start: string | null
	current_period_end: string | null
	canceled_at: string | null
	created_at: string
	updated_at: string
}

function mapRow(row: SubscriptionRow): Subscription {
	return {
		id: row.id,
		userId: row.user_id,
		paddleCustomerId: row.paddle_customer_id,
		paddleSubscriptionId: row.paddle_subscription_id,
		paddlePriceId: row.paddle_price_id,
		tier: row.tier,
		status: row.status as SubscriptionStatus,
		currentPeriodStart: row.current_period_start,
		currentPeriodEnd: row.current_period_end,
		canceledAt: row.canceled_at,
		createdAt: new Date(row.created_at).getTime() / 1000,
		updatedAt: new Date(row.updated_at).getTime() / 1000,
	}
}

export async function getSubscriptionByUserId(db: D1Database, userId: string): Promise<Subscription | null> {
	const row = await db
		.prepare('SELECT * FROM subscriptions WHERE user_id = ?')
		.bind(userId)
		.first<SubscriptionRow>()
	return row ? mapRow(row) : null
}

export async function getSubscriptionByPaddleId(db: D1Database, paddleSubscriptionId: string): Promise<Subscription | null> {
	const row = await db
		.prepare('SELECT * FROM subscriptions WHERE paddle_subscription_id = ?')
		.bind(paddleSubscriptionId)
		.first<SubscriptionRow>()
	return row ? mapRow(row) : null
}

export async function createSubscription(db: D1Database, data: CreateSubscriptionInput): Promise<Subscription> {
	if (!VALID_STATUSES.has(data.status)) {
		throw new Error(`Invalid subscription status: ${data.status}`)
	}

	const now = new Date().toISOString()
	await db
		.prepare(`INSERT INTO subscriptions (id, user_id, paddle_customer_id, paddle_subscription_id, paddle_price_id, tier, status, current_period_start, current_period_end, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
		.bind(
			data.id,
			data.userId,
			data.paddleCustomerId,
			data.paddleSubscriptionId,
			data.paddlePriceId ?? null,
			data.tier,
			data.status,
			data.currentPeriodStart ?? null,
			data.currentPeriodEnd ?? null,
			now,
			now,
		)
		.run()

	return {
		id: data.id,
		userId: data.userId,
		paddleCustomerId: data.paddleCustomerId,
		paddleSubscriptionId: data.paddleSubscriptionId,
		paddlePriceId: data.paddlePriceId ?? null,
		tier: data.tier,
		status: data.status,
		currentPeriodStart: data.currentPeriodStart ?? null,
		currentPeriodEnd: data.currentPeriodEnd ?? null,
		canceledAt: null,
		createdAt: new Date(now).getTime() / 1000,
		updatedAt: new Date(now).getTime() / 1000,
	}
}

export async function updateSubscription(db: D1Database, userId: string, data: UpdateSubscriptionInput): Promise<Subscription | null> {
	const sets: string[] = []
	const bindings: (string | number | null)[] = []

	if (data.paddleSubscriptionId !== undefined) {
		sets.push('paddle_subscription_id = ?')
		bindings.push(data.paddleSubscriptionId)
	}
	if (data.paddlePriceId !== undefined) {
		sets.push('paddle_price_id = ?')
		bindings.push(data.paddlePriceId)
	}
	if (data.tier !== undefined) {
		sets.push('tier = ?')
		bindings.push(data.tier)
	}
	if (data.status !== undefined) {
		if (!VALID_STATUSES.has(data.status)) {
			throw new Error(`Invalid subscription status: ${data.status}`)
		}
		sets.push('status = ?')
		bindings.push(data.status)
	}
	if (data.currentPeriodStart !== undefined) {
		sets.push('current_period_start = ?')
		bindings.push(data.currentPeriodStart)
	}
	if (data.currentPeriodEnd !== undefined) {
		sets.push('current_period_end = ?')
		bindings.push(data.currentPeriodEnd)
	}
	if (data.canceledAt !== undefined) {
		sets.push('canceled_at = ?')
		bindings.push(data.canceledAt)
	}

	if (sets.length === 0) return getSubscriptionByUserId(db, userId)

	const now = new Date().toISOString()
	sets.push('updated_at = ?')
	bindings.push(now)
	bindings.push(userId)

	await db
		.prepare(`UPDATE subscriptions SET ${sets.join(', ')} WHERE user_id = ?`)
		.bind(...bindings)
		.run()

	return getSubscriptionByUserId(db, userId)
}

// ─── Paddle Events (idempotency) ────────────────────────────────────

export async function hasPaddleEvent(db: D1Database, eventId: string): Promise<boolean> {
	const row = await db
		.prepare('SELECT event_id FROM paddle_events WHERE event_id = ?')
		.bind(eventId)
		.first()
	return row !== null
}

export async function recordPaddleEvent(db: D1Database, eventId: string, eventType: string): Promise<void> {
	await db
		.prepare('INSERT OR IGNORE INTO paddle_events (event_id, event_type) VALUES (?, ?)')
		.bind(eventId, eventType)
		.run()
}
