/**
 * Ensure-user middleware — user sync on every authenticated request.
 *
 * After Clerk JWT validation, checks if the user exists in D1 via the DAL.
 * - If not found: creates them from the JWT claims (first login)
 * - If found but stale: updates their email/name from JWT claims
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
			await c.env.DAL.createUser({
				id: userId,
				email: email || `${userId}@placeholder.local`,
				name: name || 'User',
			})
			c.set('userTier', 'free') // new users are always free
		} else {
			// Set tier immediately so a profile-sync failure doesn't downgrade pro users
			c.set('userTier', existing.tier)
			try {
				if (email && name && (existing.email !== email || existing.name !== name)) {
					await c.env.DAL.updateUser(userId, { email, name })
				}
			} catch (syncErr) {
				console.warn('ensureUser profile sync:', syncErr instanceof Error ? syncErr.message : syncErr)
			}
		}
	} catch (err) {
		// Don't block the request — the userId from the JWT is valid regardless
		console.warn('ensureUser sync:', err instanceof Error ? err.message : err)
		c.set('userTier', 'free') // safe fallback
	}

	await next()
})
