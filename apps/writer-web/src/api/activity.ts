import { Hono } from 'hono'

const activity = new Hono<{ Bindings: Env }>()

/** Get recent session activity for the content calendar. */
activity.get('/activity', async (c) => {
  const days = Math.max(1, Math.min(Number(c.req.query('days')) || 30, 90))
  const activities = await c.env.DAL.getRecentActivity(days)
  return c.json({ data: activities })
})

export default activity
