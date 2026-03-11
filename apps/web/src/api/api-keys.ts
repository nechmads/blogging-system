import { Hono } from 'hono'
import type { AppEnv } from '../server'

const apiKeys = new Hono<AppEnv>()

/** List all active API keys for the authenticated user. */
apiKeys.get('/api-keys', async (c) => {
	const userId = c.get('userId')
	const keys = await c.env.DAL.listUserApiKeys(userId)
	return c.json({
		data: keys.map((k) => ({
			id: k.id,
			label: k.label,
			lastFour: k.lastFour,
			lastUsedAt: k.lastUsedAt,
			createdAt: k.createdAt,
		})),
	})
})

/** Create a new API key. Returns the raw token only once. */
apiKeys.post('/api-keys', async (c) => {
	const userId = c.get('userId')

	// Cap at 10 active keys per user
	const existing = await c.env.DAL.listUserApiKeys(userId)
	if (existing.length >= 10) {
		return c.json({ error: 'Maximum of 10 active API keys allowed. Revoke an existing key first.' }, 400)
	}

	const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
	const label = typeof body.label === 'string' ? body.label.trim().slice(0, 100) : undefined

	const result = await c.env.DAL.createUserApiKey(userId, label)

	return c.json({
		id: result.key.id,
		label: result.key.label,
		lastFour: result.key.lastFour,
		createdAt: result.key.createdAt,
		rawToken: result.rawToken,
	}, 201)
})

/** Revoke an API key. */
apiKeys.delete('/api-keys/:id', async (c) => {
	const userId = c.get('userId')
	const id = c.req.param('id')

	const revoked = await c.env.DAL.revokeUserApiKey(id, userId)
	if (!revoked) {
		return c.json({ error: 'API key not found' }, 404)
	}

	return c.json({ success: true })
})

export default apiKeys
