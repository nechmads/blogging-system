import { getAgentByName } from 'agents'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { WriterAgentEnv } from '../env'
import type { WriterAgent } from '../agent/writer-agent'
import { writerApiKeyAuth } from '../middleware/api-key-auth'

const chat = new Hono<{ Bindings: WriterAgentEnv }>()

chat.use('/api/sessions/:sessionId/chat', writerApiKeyAuth)

/** Send a message and get a full (non-streaming) AI response — proxied to agent DO. */
chat.post('/api/sessions/:sessionId/chat', async (c) => {
  const sessionId = c.req.param('sessionId')

  const session = await c.env.DAL.getSessionById(sessionId)
  if (!session) {
    return c.json({ error: 'Session not found' }, 404)
  }

  const agent = await getAgentByName<WriterAgentEnv, WriterAgent>(c.env.WRITER_AGENT, sessionId)

  const url = new URL(c.req.url)
  url.pathname = '/chat'

  const res = await agent.fetch(new Request(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: c.req.raw.body,
  }))

  const data = await res.json()
  return c.json(data, res.status as ContentfulStatusCode)
})

export default chat
