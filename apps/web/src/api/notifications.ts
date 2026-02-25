import { Hono } from 'hono'
import type { AppEnv } from '../server'

const notifications = new Hono<AppEnv>()

/** Get or create notification preferences for the authenticated user. */
notifications.get('/notifications/preferences', async (c) => {
	const userId = c.get('userId')
	const prefs = await c.env.DAL.getOrCreateNotificationPreferences(userId)
	return c.json({
		newIdeas: prefs.newIdeas,
		draftReady: prefs.draftReady,
		postPublished: prefs.postPublished,
	})
})

/** Update notification preferences (partial update). */
notifications.patch('/notifications/preferences', async (c) => {
	const userId = c.get('userId')
	const body = await c.req.json()
	const { newIdeas, draftReady, postPublished } = body as Record<string, unknown>

	// Validate types — only booleans accepted
	for (const [key, val] of Object.entries({ newIdeas, draftReady, postPublished })) {
		if (val !== undefined && typeof val !== 'boolean') {
			return c.json({ error: `${key} must be a boolean` }, 400)
		}
	}

	if (newIdeas === undefined && draftReady === undefined && postPublished === undefined) {
		return c.json({ error: 'No valid fields provided' }, 400)
	}

	const updated = await c.env.DAL.updateNotificationPreferences(userId, {
		newIdeas: newIdeas as boolean | undefined,
		draftReady: draftReady as boolean | undefined,
		postPublished: postPublished as boolean | undefined,
	})

	return c.json({
		newIdeas: updated.newIdeas,
		draftReady: updated.draftReady,
		postPublished: updated.postPublished,
	})
})

export default notifications
