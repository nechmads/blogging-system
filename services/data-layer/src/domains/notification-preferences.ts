import type { NotificationPreferences, UpdateNotificationPreferencesInput } from '../types'

interface NotificationPreferencesRow {
	user_id: string
	new_ideas: number
	draft_ready: number
	post_published: number
	created_at: number
	updated_at: number
}

function mapRow(row: NotificationPreferencesRow): NotificationPreferences {
	return {
		userId: row.user_id,
		newIdeas: row.new_ideas === 1,
		draftReady: row.draft_ready === 1,
		postPublished: row.post_published === 1,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

/**
 * Get or create notification preferences for a user.
 * Uses INSERT OR IGNORE so first access creates a row with all defaults enabled.
 */
export async function getOrCreatePreferences(
	db: D1Database,
	userId: string,
): Promise<NotificationPreferences> {
	const now = Math.floor(Date.now() / 1000)

	await db
		.prepare(
			'INSERT OR IGNORE INTO notification_preferences (user_id, created_at, updated_at) VALUES (?, ?, ?)',
		)
		.bind(userId, now, now)
		.run()

	const row = await db
		.prepare('SELECT * FROM notification_preferences WHERE user_id = ?')
		.bind(userId)
		.first<NotificationPreferencesRow>()

	if (!row) {
		throw new Error(`Failed to get or create notification preferences for user ${userId}`)
	}
	return mapRow(row)
}

/**
 * Update notification preferences (partial update).
 * Only fields present in `data` are changed.
 */
export async function updatePreferences(
	db: D1Database,
	userId: string,
	data: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
	const sets: string[] = []
	const bindings: (number | string)[] = []

	if (data.newIdeas !== undefined) {
		sets.push('new_ideas = ?')
		bindings.push(data.newIdeas ? 1 : 0)
	}
	if (data.draftReady !== undefined) {
		sets.push('draft_ready = ?')
		bindings.push(data.draftReady ? 1 : 0)
	}
	if (data.postPublished !== undefined) {
		sets.push('post_published = ?')
		bindings.push(data.postPublished ? 1 : 0)
	}

	if (sets.length === 0) return getOrCreatePreferences(db, userId)

	const now = Math.floor(Date.now() / 1000)
	sets.push('updated_at = ?')
	bindings.push(now)
	bindings.push(userId)

	await db
		.prepare(`UPDATE notification_preferences SET ${sets.join(', ')} WHERE user_id = ?`)
		.bind(...bindings)
		.run()

	const row = await db
		.prepare('SELECT * FROM notification_preferences WHERE user_id = ?')
		.bind(userId)
		.first<NotificationPreferencesRow>()

	if (!row) {
		throw new Error(`Preferences not found after update for user ${userId}`)
	}
	return mapRow(row)
}
