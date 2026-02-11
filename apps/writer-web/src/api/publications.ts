import { Hono } from 'hono'

const publications = new Hono<{ Bindings: Env }>()

/** List publications (optionally filtered by user). */
publications.get('/publications', async (c) => {
  const userId = c.req.query('userId')
  const result = userId
    ? await c.env.DAL.listPublicationsByUser(userId)
    : await c.env.DAL.listAllPublications()
  return c.json({ data: result })
})

/** Get a single publication with its topics. */
publications.get('/publications/:id', async (c) => {
  const publication = await c.env.DAL.getPublicationById(c.req.param('id'))
  if (!publication) return c.json({ error: 'Publication not found' }, 404)
  const topics = await c.env.DAL.listTopicsByPublication(publication.id)
  return c.json({ ...publication, topics })
})

export default publications
