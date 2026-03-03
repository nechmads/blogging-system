import { Hono } from 'hono'
import type { AppEnv } from '../server'

const me = new Hono<AppEnv>()

/** Return the authenticated user's profile. */
me.get('/me', async (c) => {
  const userId = c.get('userId')
  const user = await c.env.DAL.getUserById(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
  })
})

export default me
