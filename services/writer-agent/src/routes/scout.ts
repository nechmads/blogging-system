import { Hono } from 'hono'
import type { WriterAgentEnv } from '../env'
import { PublicationManager } from '../lib/publication-manager'
import { writerApiKeyAuth } from '../middleware/api-key-auth'

const scout = new Hono<{ Bindings: WriterAgentEnv }>()

scout.use('/api/publications/:id/scout', writerApiKeyAuth)

/** Trigger the content scout for a specific publication. */
scout.post('/api/publications/:id/scout', async (c) => {
  const pubId = c.req.param('id')

  // Verify publication exists
  const manager = new PublicationManager(c.env.WRITER_DB)
  const publication = await manager.getById(pubId)
  if (!publication) {
    return c.json({ error: 'Publication not found' }, 404)
  }

  if (!c.env.CONTENT_SCOUT_URL || !c.env.CONTENT_SCOUT_API_KEY) {
    console.error('CONTENT_SCOUT_URL or CONTENT_SCOUT_API_KEY not configured')
    return c.json({ error: 'Scout service not configured' }, 503)
  }

  // Proxy to content-scout
  const scoutUrl = `${c.env.CONTENT_SCOUT_URL}/api/scout/run`
  const res = await fetch(scoutUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.env.CONTENT_SCOUT_API_KEY}`,
    },
    body: JSON.stringify({ publicationId: pubId }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`Scout service error (${res.status}):`, body)
    return c.json({ error: 'Content scout failed. Please try again later.' }, 502)
  }

  const result = await res.json()
  return c.json(result)
})

export default scout
