import { Hono } from 'hono'
import type { AppEnv } from '../server'

const me = new Hono<AppEnv>()

/**
 * Return the authenticated user's profile.
 *
 * Data sources: userId/email/name come from the Clerk JWT (set by clerkAuth),
 * while tier comes from D1 (set by ensureUser). Clerk refreshes JWT claims
 * frequently, so this is effectively consistent. If database-only fields are
 * added in the future, this endpoint should fetch the full user record.
 */
me.get('/me', async (c) => {
  return c.json({
    id: c.get('userId'),
    email: c.get('userEmail'),
    name: c.get('userName'),
    tier: c.get('userTier'),
  })
})

export default me
