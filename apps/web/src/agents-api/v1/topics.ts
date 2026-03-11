/**
 * Topics endpoints for the public Agents API v1.
 *
 * All responses use the { data } envelope. Errors are thrown as ActionError
 * subclasses and caught by the centralized error handler in index.ts.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../server'
import type { TopicPriority } from '@hotmetal/content-core'
import { getTierLimits, isUnlimited } from '@hotmetal/shared'
import {
	NotFoundError,
	ValidationError,
	QuotaExceededError,
} from '../../actions/errors'

const topics = new Hono<AppEnv>()

// ─── Helpers ────────────────────────────────────────────────────────

/** Verify the publication exists and belongs to the authenticated user. */
async function verifyOwnership(c: { env: Pick<Env, 'DAL'>; get: (key: string) => string }, pubId: string) {
	const pub = await c.env.DAL.getPublicationById(pubId)
	if (!pub || pub.userId !== c.get('userId')) {
		throw new NotFoundError('Publication not found')
	}
	return pub
}

/** Check whether the publication has room for another topic under the user's tier limits. */
async function checkTopicQuota(dal: Pick<Env['DAL'], 'countTopicsByPublication'>, pubId: string, userTier: string) {
	const limits = getTierLimits(userTier)
	if (isUnlimited(limits.topicsPerPublication)) return

	const current = await dal.countTopicsByPublication(pubId)
	if (current >= limits.topicsPerPublication) {
		throw new QuotaExceededError(
			`Free plan allows up to ${limits.topicsPerPublication} topics per publication`,
			limits.topicsPerPublication,
			current,
		)
	}
}

/** Validate that priority is 1, 2, or 3 (if provided). */
function validatePriority(priority: unknown): void {
	if (priority !== undefined && ![1, 2, 3].includes(priority as number)) {
		throw new ValidationError('priority must be 1, 2, or 3')
	}
}

// ─── GET /publications/:pubId/topics ────────────────────────────────

/** List all topics for a publication (verified ownership). */
topics.get('/publications/:pubId/topics', async (c) => {
	const pub = await verifyOwnership(c, c.req.param('pubId'))
	const result = await c.env.DAL.listTopicsByPublication(pub.id)
	return c.json({ data: result })
})

// ─── POST /publications/:pubId/topics ───────────────────────────────

/** Create a new topic under a publication. */
topics.post('/publications/:pubId/topics', async (c) => {
	const pub = await verifyOwnership(c, c.req.param('pubId'))

	await checkTopicQuota(c.env.DAL, pub.id, c.get('userTier'))

	const body = await c.req.json<{
		name?: string
		description?: string
		priority?: number
	}>()

	if (!body.name?.trim()) {
		throw new ValidationError('name is required')
	}

	validatePriority(body.priority)

	const id = crypto.randomUUID()
	const topic = await c.env.DAL.createTopic({
		id,
		publicationId: pub.id,
		name: body.name.trim(),
		description: body.description?.trim(),
		priority: (body.priority as TopicPriority) ?? 1,
	})

	return c.json({ data: topic }, 201)
})

// ─── PATCH /topics/:id ──────────────────────────────────────────────

/** Update an existing topic. Ownership is verified through the topic's publication. */
topics.patch('/topics/:id', async (c) => {
	const topicId = c.req.param('id')
	const existing = await c.env.DAL.getTopicById(topicId)
	if (!existing) {
		throw new NotFoundError('Topic not found')
	}

	// Verify ownership via the topic's parent publication
	await verifyOwnership(c, existing.publicationId)

	const body = await c.req.json<{
		name?: string
		description?: string | null
		priority?: number
		isActive?: boolean
	}>()

	validatePriority(body.priority)

	const updated = await c.env.DAL.updateTopic(topicId, {
		name: body.name?.trim(),
		description: body.description,
		priority: body.priority as TopicPriority | undefined,
		isActive: body.isActive,
	})

	return c.json({ data: updated })
})

// ─── DELETE /topics/:id ─────────────────────────────────────────────

/** Delete a topic. Ownership is verified through the topic's publication. */
topics.delete('/topics/:id', async (c) => {
	const topicId = c.req.param('id')
	const existing = await c.env.DAL.getTopicById(topicId)
	if (!existing) {
		throw new NotFoundError('Topic not found')
	}

	// Verify ownership via the topic's parent publication
	await verifyOwnership(c, existing.publicationId)

	await c.env.DAL.deleteTopic(topicId)
	return c.json({ data: { deleted: true } })
})

export default topics
