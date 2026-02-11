import { Hono } from 'hono'
import type { WriterAgentEnv } from '../env'
import { writerApiKeyAuth } from '../middleware/api-key-auth'

const activity = new Hono<{ Bindings: WriterAgentEnv }>()

activity.use('/api/activity', writerApiKeyAuth)

/** Get recent session activity for the content calendar. */
activity.get('/api/activity', async (c) => {
  const days = Math.max(1, Math.min(Number(c.req.query('days')) || 30, 90))
  const activities = await c.env.DAL.getRecentActivity(days)
  return c.json({ data: activities })
})

export default activity
