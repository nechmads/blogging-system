import { Hono } from 'hono'
import type { AppEnv } from '../../server'

const me = new Hono<AppEnv>()

/** GET /me — current user info from API key auth context. */
me.get('/me', (c) => {
	return c.json({
		data: {
			id: c.get('userId'),
			email: c.get('userEmail'),
			name: c.get('userName'),
			tier: c.get('userTier'),
		},
	})
})

export default me
