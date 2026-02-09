import { getAgentByName } from 'agents'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { WriterAgentEnv } from '../env'
import type { WriterAgent } from '../agent/writer-agent'
import { SessionManager } from '../lib/session-manager'
import { writerApiKeyAuth } from '../middleware/api-key-auth'

const publish = new Hono<{ Bindings: WriterAgentEnv }>()

publish.use('/api/sessions/:sessionId/publish', writerApiKeyAuth)
publish.use('/api/sessions/:sessionId/generate-seo', writerApiKeyAuth)

/** Generate SEO excerpt and tags for the current draft. */
publish.post('/api/sessions/:sessionId/generate-seo', async (c) => {
  const sessionId = c.req.param('sessionId')
  const agent = await getAgentByName<WriterAgentEnv, WriterAgent>(c.env.WRITER_AGENT, sessionId)

  const url = new URL(c.req.url)
  url.pathname = '/generate-seo'

  const res = await agent.fetch(new Request(url.toString(), { method: 'POST' }))
  const data = await res.json()
  return c.json(data, res.status as ContentfulStatusCode)
})

/** Publish the current draft to the CMS — proxied to agent DO. */
publish.post('/api/sessions/:sessionId/publish', async (c) => {
  const sessionId = c.req.param('sessionId')

  // Verify session exists
  const manager = new SessionManager(c.env.WRITER_DB)
  const session = await manager.getById(sessionId)
  if (!session) {
    return c.json({ error: 'Session not found' }, 404)
  }

  const agent = await getAgentByName<WriterAgentEnv, WriterAgent>(c.env.WRITER_AGENT, sessionId)

  const url = new URL(c.req.url)
  url.pathname = '/publish'

  const res = await agent.fetch(
    new Request(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await c.req.text(),
    }),
  )

  const data = await res.json()

  // If publish succeeded, update session status in D1
  if (res.ok && (data as { success?: boolean }).success) {
    const result = data as { postId: string }
    try {
      await manager.update(sessionId, {
        status: 'completed',
        cmsPostId: result.postId,
      })
    } catch (err) {
      console.error(`Failed to update session ${sessionId} after successful publish:`, err)
    }
  }

  return c.json(data, res.status as ContentfulStatusCode)
})

export default publish
