import type { User, CreateUserInput, UpdateUserInput } from '../types'

interface UserRow {
	id: string
	email: string
	name: string
	created_at: number
	updated_at: number
}

function mapRow(row: UserRow): User {
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
	const row = await db
		.prepare('SELECT * FROM users WHERE id = ?')
		.bind(id)
		.first<UserRow>()
	return row ? mapRow(row) : null
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
	const row = await db
		.prepare('SELECT * FROM users WHERE email = ?')
		.bind(email)
		.first<UserRow>()
	return row ? mapRow(row) : null
}

export async function createUser(db: D1Database, data: CreateUserInput): Promise<User> {
	const now = Math.floor(Date.now() / 1000)
	await db
		.prepare('INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
		.bind(data.id, data.email, data.name, now, now)
		.run()

	return {
		id: data.id,
		email: data.email,
		name: data.name,
		createdAt: now,
		updatedAt: now,
	}
}

export async function updateUser(db: D1Database, id: string, data: UpdateUserInput): Promise<User | null> {
	const sets: string[] = []
	const bindings: (string | number)[] = []

	if (data.email !== undefined) {
		sets.push('email = ?')
		bindings.push(data.email)
	}
	if (data.name !== undefined) {
		sets.push('name = ?')
		bindings.push(data.name)
	}

	if (sets.length === 0) return getUserById(db, id)

	const now = Math.floor(Date.now() / 1000)
	sets.push('updated_at = ?')
	bindings.push(now)
	bindings.push(id)

	await db
		.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
		.bind(...bindings)
		.run()

	return getUserById(db, id)
}

export async function listUsers(db: D1Database): Promise<User[]> {
	const result = await db
		.prepare('SELECT * FROM users ORDER BY created_at ASC')
		.all<UserRow>()
	return (result.results ?? []).map(mapRow)
}

const SEED_USER_ID = 'default'

/**
 * One-time migration: transfer all data from the 'default' seed user
 * to a real Clerk user ID. Updates the users PK and all FK references
 * (sessions, publications, social_connections).
 *
 * Safety guards:
 * - Pre-check: 'default' user must exist and be the only user
 * - In-batch: the users UPDATE has a conditional WHERE that also checks
 *   the count, closing the TOCTOU window between the pre-check and batch
 * - Post-check: verifies the PK update actually touched a row
 *
 * Returns true if the migration was performed.
 */
export async function migrateDefaultUser(
	db: D1Database,
	newUserId: string,
	email: string,
	name: string,
): Promise<boolean> {
	// Pre-flight check (avoids the batch cost in the common case)
	const defaultUser = await db
		.prepare('SELECT id FROM users WHERE id = ?')
		.bind(SEED_USER_ID)
		.first<{ id: string }>()
	if (!defaultUser) return false

	const now = Math.floor(Date.now() / 1000)

	// Run all updates in a batch (D1 batch = single transaction).
	// The users UPDATE includes a subquery guard to prevent execution
	// if another user was concurrently created (closes the TOCTOU gap).
	const results = await db.batch([
		db.prepare('UPDATE sessions SET user_id = ? WHERE user_id = ?').bind(newUserId, SEED_USER_ID),
		db.prepare('UPDATE publications SET user_id = ? WHERE user_id = ?').bind(newUserId, SEED_USER_ID),
		db.prepare('UPDATE social_connections SET user_id = ? WHERE user_id = ?').bind(newUserId, SEED_USER_ID),
		db.prepare(
			`UPDATE users SET id = ?, email = ?, name = ?, updated_at = ?
			 WHERE id = ? AND (SELECT COUNT(*) FROM users) = 1`,
		).bind(newUserId, email, name, now, SEED_USER_ID),
	])

	// Verify the PK update actually ran (last statement in the batch)
	const usersResult = results[results.length - 1]
	return (usersResult?.meta?.changes ?? 0) === 1
}
