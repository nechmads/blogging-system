import { Hono } from 'hono'

type IdeaStatus = 'new' | 'reviewed' | 'promoted' | 'dismissed'
const IDEA_STATUSES: readonly IdeaStatus[] = ['new', 'reviewed', 'promoted', 'dismissed']

const ideas = new Hono<{ Bindings: Env }>()

/** Return the global count of ideas with status 'new'. */
ideas.get('/ideas/new-count', async (c) => {
  const count = await c.env.DAL.countIdeasByStatus('new')
  return c.json({ count })
})

/** Get a single idea by ID. */
ideas.get('/ideas/:id', async (c) => {
  const idea = await c.env.DAL.getIdeaById(c.req.param('id'))
  if (!idea) return c.json({ error: 'Idea not found' }, 404)
  return c.json(idea)
})

/** Return the count of ideas for a publication. */
ideas.get('/publications/:pubId/ideas/count', async (c) => {
  const count = await c.env.DAL.countIdeasByPublication(c.req.param('pubId'))
  return c.json({ count })
})

/** List ideas for a publication (filterable by status). */
ideas.get('/publications/:pubId/ideas', async (c) => {
  const statusParam = c.req.query('status')
  if (statusParam && !IDEA_STATUSES.includes(statusParam as IdeaStatus)) {
    return c.json({ error: `Invalid status. Must be one of: ${IDEA_STATUSES.join(', ')}` }, 400)
  }
  const result = await c.env.DAL.listIdeasByPublication(c.req.param('pubId'), {
    status: statusParam as IdeaStatus | undefined,
  })
  return c.json({ data: result })
})

export default ideas
