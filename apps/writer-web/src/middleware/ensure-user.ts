/**
 * Ensure-user middleware — "fallback-first" user sync.
 *
 * After Clerk JWT validation, checks if the user exists in D1 via the DAL.
 * - If not found: creates them from the JWT claims
 * - If found but stale: updates their email/name from JWT claims
 *
 * One-time migration: if the 'default' seed user is the only user in the
 * system, the first real Clerk sign-in will migrate all of default's data
 * (publications, sessions, social connections) to the new user.
 *
 * Must run AFTER clerkAuth middleware (depends on userId/userEmail/userName vars).
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../server'

export const ensureUser = createMiddleware<AppEnv>(async (c, next) => {
	const userId = c.get('userId')
	const email = c.get('userEmail')
	const name = c.get('userName')

	try {
		const existing = await c.env.DAL.getUserById(userId)

		if (!existing) {
			// Try one-time migration from 'default' seed user.
			// migrateDefaultUser only runs if 'default' exists AND is the only user.
			const migrated = await c.env.DAL.migrateDefaultUser(
				userId,
				email || `${userId}@placeholder.local`,
				name || 'User',
			)

			if (migrated) {
				console.info(`Migrated 'default' user data to ${userId}`)
			} else {
				// Normal first login — create a new user row
				await c.env.DAL.createUser({
					id: userId,
					email: email || `${userId}@placeholder.local`,
					name: name || 'User',
				})
			}
		} else if (email && name && (existing.email !== email || existing.name !== name)) {
			// Profile changed in Clerk — sync updates to D1
			await c.env.DAL.updateUser(userId, { email, name })
		}
	} catch (err) {
		// Don't block the request — the userId from the JWT is valid regardless
		console.warn('ensureUser sync:', err instanceof Error ? err.message : err)
	}

	await next()
})
