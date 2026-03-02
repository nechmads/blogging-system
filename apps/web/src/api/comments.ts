import { Hono } from 'hono'
import type { AppEnv } from '../server'
import { verifyPublicationOwnership } from '../middleware/ownership'

const comments = new Hono<AppEnv>()

/** List comments for a publication (admin). Optional ?status= filter. */
comments.get('/publications/:pubId/comments', async (c) => {
  const pub = await verifyPublicationOwnership(c, c.req.param('pubId'))
  if (!pub) return c.json({ error: 'Publication not found' }, 404)

  const status = c.req.query('status') as 'pending' | 'approved' | 'deleted' | undefined
  const validStatuses = ['pending', 'approved', 'deleted']
  const filters = status && validStatuses.includes(status) ? { status } : undefined

  const result = await c.env.DAL.listCommentsByPublication(pub.id, filters)
  return c.json({ data: result })
})

/** Approve a pending comment. */
comments.patch('/comments/:id/approve', async (c) => {
  const comment = await c.env.DAL.getCommentById(c.req.param('id'))
  if (!comment) return c.json({ error: 'Comment not found' }, 404)

  // Verify publication ownership
  const pub = await verifyPublicationOwnership(c, comment.publicationId)
  if (!pub) return c.json({ error: 'Comment not found' }, 404)

  const updated = await c.env.DAL.updateCommentStatus(c.req.param('id'), 'approved')
  return c.json(updated)
})

/** Soft-delete a comment (set status to 'deleted'). */
comments.delete('/comments/:id', async (c) => {
  const comment = await c.env.DAL.getCommentById(c.req.param('id'))
  if (!comment) return c.json({ error: 'Comment not found' }, 404)

  // Verify publication ownership
  const pub = await verifyPublicationOwnership(c, comment.publicationId)
  if (!pub) return c.json({ error: 'Comment not found' }, 404)

  await c.env.DAL.updateCommentStatus(c.req.param('id'), 'deleted')
  return c.json({ deleted: true })
})

export default comments
