import { Hono } from 'hono'
import type { AppEnv } from '../../server'

const styles = new Hono<AppEnv>()

/** GET /styles — List all writing styles available to the authenticated user (own custom + prebuilt). */
styles.get('/styles', async (c) => {
	const userId = c.get('userId')
	const result = await c.env.DAL.listWritingStylesByUser(userId)
	return c.json({ data: result })
})

export default styles
