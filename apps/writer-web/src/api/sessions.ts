import { Hono } from 'hono'

const sessions = new Hono<{ Bindings: Env }>()

/** List sessions with optional filters. */
sessions.get('/sessions', async (c) => {
  const userId = c.req.query('userId') || undefined
  const status = c.req.query('status') || undefined
  const result = await c.env.DAL.listSessions({
    userId,
    status: status as 'active' | 'completed' | 'archived' | undefined,
  })
  return c.json({ data: result })
})

/** Get a single session by ID. */
sessions.get('/sessions/:id', async (c) => {
  const session = await c.env.DAL.getSessionById(c.req.param('id'))
  if (!session) return c.json({ error: 'Session not found' }, 404)
  return c.json(session)
})

export default sessions
