/**
 * Writer Web — backend Worker
 *
 * Data reads (GET) are served directly via the DAL service binding.
 * Writes, AI operations, and WebSocket connections proxy to writer-agent.
 * Scout triggers proxy directly to content-scout.
 */

import { Hono } from 'hono'

import sessions from './api/sessions'
import publications from './api/publications'
import topics from './api/topics'
import ideas from './api/ideas'
import activity from './api/activity'

const app = new Hono<{ Bindings: Env }>()

// ─── DAL direct reads ───────────────────────────────────────────────

app.route('/api', sessions)
app.route('/api', publications)
app.route('/api', topics)
app.route('/api', ideas)
app.route('/api', activity)

// ─── Scout trigger (proxied to content-scout) ───────────────────────

app.post('/api/publications/:pubId/scout', async (c) => {
  if (!c.env.CONTENT_SCOUT_URL || !c.env.SCOUT_API_KEY) {
    return c.json({ error: 'Scout service not configured' }, 503)
  }

  const res = await fetch(`${c.env.CONTENT_SCOUT_URL}/api/scout/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.env.SCOUT_API_KEY}`,
    },
    body: JSON.stringify({ publicationId: c.req.param('pubId') }),
  })

  if (!res.ok) {
    console.error(`Scout service error (${res.status}):`, await res.text())
    return c.json({ error: 'Content scout failed. Please try again later.' }, 502)
  }

  return new Response(res.body, { status: res.status, headers: res.headers })
})

// ─── WebSocket proxy (agent chat) ───────────────────────────────────

app.get('/agents/*', async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return proxyToWriterAgent(c)
  }

  const url = new URL(c.req.url)
  const target = `${c.env.WRITER_AGENT_URL}${url.pathname}${url.search}`

  const upstreamResp = await fetch(target, {
    headers: {
      Upgrade: 'websocket',
      'X-API-Key': c.env.WRITER_API_KEY,
    },
  })

  const upstream = upstreamResp.webSocket
  if (!upstream) {
    return c.text('Failed to connect to agent', 502)
  }

  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)

  server.accept()
  upstream.accept()

  server.addEventListener('message', (event) => {
    try { upstream.send(event.data as string | ArrayBuffer) } catch { /* closed */ }
  })
  upstream.addEventListener('message', (event) => {
    try { server.send(event.data as string | ArrayBuffer) } catch { /* closed */ }
  })

  server.addEventListener('close', (event) => {
    try { upstream.close(event.code, event.reason) } catch { /* closed */ }
  })
  upstream.addEventListener('close', (event) => {
    try { server.close(event.code, event.reason) } catch { /* closed */ }
  })

  server.addEventListener('error', () => {
    try { upstream.close(1011, 'Client error') } catch { /* closed */ }
  })
  upstream.addEventListener('error', () => {
    try { server.close(1011, 'Upstream error') } catch { /* closed */ }
  })

  return new Response(null, { status: 101, webSocket: client })
})

// ─── Catch-all: proxy writes/AI/DO to writer-agent ─────────────────

app.all('/agents/*', proxyToWriterAgent)
app.all('/api/*', proxyToWriterAgent)

// ─── Health check ───────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', service: 'writer-web' }))

// ─── Export ─────────────────────────────────────────────────────────

export default app

// ─── Writer-agent proxy helper ──────────────────────────────────────

import type { Context } from 'hono'

async function proxyToWriterAgent(c: Context<{ Bindings: Env }>): Promise<Response> {
  const url = new URL(c.req.url)
  const target = `${c.env.WRITER_AGENT_URL}${url.pathname}${url.search}`
  const headers = new Headers(c.req.raw.headers)
  headers.set('X-API-Key', c.env.WRITER_API_KEY)

  const res = await fetch(target, {
    method: c.req.method,
    headers,
    body: c.req.raw.body,
  })

  return new Response(res.body, { status: res.status, headers: res.headers })
}
