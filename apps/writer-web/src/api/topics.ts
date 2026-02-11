import { Hono } from 'hono'

const topics = new Hono<{ Bindings: Env }>()

/** List topics for a publication. */
topics.get('/publications/:pubId/topics', async (c) => {
  const result = await c.env.DAL.listTopicsByPublication(c.req.param('pubId'))
  return c.json({ data: result })
})

export default topics
