import { Hono } from 'hono'
import { AlexanderApi } from '@hotmetal/shared'
import type { AppEnv } from '../server'

const styles = new Hono<AppEnv>()

/** List all styles available to the authenticated user (own + prebuilt). */
styles.get('/styles', async (c) => {
  const userId = c.get('userId')
  const result = await c.env.DAL.listWritingStylesByUser(userId)
  return c.json({ data: result })
})

/** Create a new writing style. */
styles.post('/styles', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    name?: string
    description?: string
    systemPrompt?: string
    toneGuide?: string
    sourceUrl?: string
    sampleText?: string
  }>()

  if (!body.name?.trim()) {
    return c.json({ error: 'name is required' }, 400)
  }
  if (!body.systemPrompt?.trim()) {
    return c.json({ error: 'systemPrompt is required' }, 400)
  }

  const style = await c.env.DAL.createWritingStyle({
    id: crypto.randomUUID(),
    userId,
    name: body.name.trim(),
    description: body.description?.trim(),
    systemPrompt: body.systemPrompt.trim(),
    toneGuide: body.toneGuide,
    sourceUrl: body.sourceUrl?.trim(),
    sampleText: body.sampleText?.trim(),
  })

  return c.json(style, 201)
})

/** Analyze a URL to generate a writing style using Alexander API. */
styles.post('/styles/analyze-url', async (c) => {
  const body = await c.req.json<{ url?: string; rssFeed?: string }>()

  if (!body.url?.trim() && !body.rssFeed?.trim()) {
    return c.json({ error: 'url or rssFeed is required' }, 400)
  }

  // Validate URL protocol to prevent SSRF
  if (body.url) {
    try {
      const parsed = new URL(body.url.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return c.json({ error: 'URL must use http or https' }, 400)
      }
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400)
    }
  }

  if (!c.env.ALEXANDER_API_URL || !c.env.ALEXANDER_API_KEY) {
    return c.json({ error: 'Alexander API not configured' }, 503)
  }

  const api = new AlexanderApi(c.env.ALEXANDER_API_URL, c.env.ALEXANDER_API_KEY)

  try {
    const result = await api.toneGuide({
      url: body.url?.trim(),
      rss_feed: body.rssFeed?.trim(),
    })
    return c.json(result)
  } catch (err) {
    console.error('Alexander tone guide error:', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return c.json({ error: message }, 502)
  }
})

/** Duplicate a style into the user's collection. */
styles.post('/styles/:id/duplicate', async (c) => {
  const userId = c.get('userId')
  const source = await c.env.DAL.getWritingStyleById(c.req.param('id'))

  if (!source) return c.json({ error: 'Style not found' }, 404)

  // Allow duplicating prebuilt or own styles
  if (!source.isPrebuilt && source.userId !== userId) {
    return c.json({ error: 'Style not found' }, 404)
  }

  const duplicate = await c.env.DAL.createWritingStyle({
    id: crypto.randomUUID(),
    userId,
    name: `${source.name} (copy)`,
    description: source.description ?? undefined,
    systemPrompt: source.systemPrompt,
    toneGuide: source.toneGuide ?? undefined,
    sourceUrl: source.sourceUrl ?? undefined,
    sampleText: source.sampleText ?? undefined,
  })

  return c.json(duplicate, 201)
})

/** Get a single style by ID (own or prebuilt). */
styles.get('/styles/:id', async (c) => {
  const style = await c.env.DAL.getWritingStyleById(c.req.param('id'))
  if (!style) return c.json({ error: 'Style not found' }, 404)

  const userId = c.get('userId')
  if (!style.isPrebuilt && style.userId !== userId) {
    return c.json({ error: 'Style not found' }, 404)
  }

  return c.json(style)
})

/** Update an existing style (own only, not prebuilt). */
styles.patch('/styles/:id', async (c) => {
  const userId = c.get('userId')
  const style = await c.env.DAL.getWritingStyleById(c.req.param('id'))

  if (!style) return c.json({ error: 'Style not found' }, 404)
  if (style.isPrebuilt) return c.json({ error: 'Cannot edit prebuilt styles' }, 403)
  if (style.userId !== userId) return c.json({ error: 'Style not found' }, 404)

  const body = await c.req.json<{
    name?: string
    description?: string | null
    systemPrompt?: string
    toneGuide?: string | null
    sourceUrl?: string | null
    sampleText?: string | null
  }>()

  const updated = await c.env.DAL.updateWritingStyle(c.req.param('id'), {
    name: body.name?.trim(),
    description: body.description !== undefined ? (body.description?.trim() ?? null) : undefined,
    systemPrompt: body.systemPrompt?.trim(),
    toneGuide: body.toneGuide,
    sourceUrl: body.sourceUrl !== undefined ? (body.sourceUrl?.trim() ?? null) : undefined,
    sampleText: body.sampleText !== undefined ? (body.sampleText?.trim() ?? null) : undefined,
  })

  return c.json(updated)
})

/** Delete a style (own only, not prebuilt). */
styles.delete('/styles/:id', async (c) => {
  const userId = c.get('userId')
  const style = await c.env.DAL.getWritingStyleById(c.req.param('id'))

  if (!style) return c.json({ error: 'Style not found' }, 404)
  if (style.isPrebuilt) return c.json({ error: 'Cannot delete prebuilt styles' }, 403)
  if (style.userId !== userId) return c.json({ error: 'Style not found' }, 404)

  await c.env.DAL.deleteWritingStyle(c.req.param('id'))
  return c.json({ ok: true })
})

export default styles
