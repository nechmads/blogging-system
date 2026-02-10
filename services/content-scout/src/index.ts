import { Hono } from 'hono'
import type { ScoutEnv, ScoutQueueMessage } from './env'
import { ScoutWorkflow } from './workflow'
import { runWithRetry } from './steps/d1-retry'
import { computeNextRun, parseSchedule } from '@hotmetal/shared'
import { DEFAULT_TIMEZONE } from '@hotmetal/content-core'

const app = new Hono<{ Bindings: ScoutEnv }>()

// API key auth middleware for manual trigger routes
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const expected = c.env.API_KEY
  if (!expected || !authHeader || authHeader !== `Bearer ${expected}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return next()
})

// Manual trigger: run scout for a single publication (no next_scout_at change)
app.post('/api/scout/run', async (c) => {
  const { publicationId } = await c.req.json<{ publicationId: string }>()
  if (!publicationId) return c.json({ error: 'publicationId is required' }, 400)

  await c.env.SCOUT_QUEUE.send({ publicationId, triggeredBy: 'manual' })
  return c.json({ queued: true, publicationId })
})

// Manual trigger: run scout for all publications (no next_scout_at change)
app.post('/api/scout/run-all', async (c) => {
  const count = await enqueueAllPublications(c.env)
  return c.json({ queued: true, count })
})

// Health check (no auth required)
app.get('/health', (c) => c.json({ status: 'ok', service: 'content-scout' }))

export { ScoutWorkflow }

export default {
  fetch: app.fetch,

  // Hourly cron — enqueue publications whose next_scout_at has passed
  async scheduled(_event: ScheduledEvent, env: ScoutEnv, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      await backfillNullSchedules(env)
      await enqueueDuePublications(env)
    })())
  },

  // Queue consumer — start a workflow per publication
  async queue(batch: MessageBatch<ScoutQueueMessage>, env: ScoutEnv) {
    for (const message of batch.messages) {
      const { publicationId, triggeredBy } = message.body

      try {
        await env.SCOUT_WORKFLOW.create({
          id: `scout-${publicationId}-${crypto.randomUUID()}`,
          params: { publicationId, triggeredBy },
        })
        message.ack()
      } catch (err) {
        console.error(`Failed to start workflow for publication ${publicationId}:`, err)
        message.retry()
      }
    }
  },
}

const QUEUE_BATCH_SIZE = 100

interface ScheduleRow {
  id: string
  scout_schedule: string | null
  timezone: string | null
}

/**
 * Backfill next_scout_at for publications that have NULL (e.g. after migration).
 */
async function backfillNullSchedules(env: ScoutEnv): Promise<void> {
  const result = await runWithRetry(() =>
    env.WRITER_DB
      .prepare('SELECT id, scout_schedule, timezone FROM publications WHERE next_scout_at IS NULL')
      .all<ScheduleRow>(),
  )

  const pubs = result.results ?? []
  if (pubs.length === 0) return

  for (const pub of pubs) {
    const schedule = parseSchedule(pub.scout_schedule)
    const tz = pub.timezone ?? DEFAULT_TIMEZONE
    const nextRun = computeNextRun(schedule, tz)

    await runWithRetry(() =>
      env.WRITER_DB
        .prepare('UPDATE publications SET next_scout_at = ? WHERE id = ?')
        .bind(nextRun, pub.id)
        .run(),
    )
  }

  console.log(`Backfilled next_scout_at for ${pubs.length} publication(s)`)
}

/**
 * Query publications whose next_scout_at <= now, then for each:
 * optimistically update next_scout_at and enqueue immediately.
 * Interleaving update + enqueue per publication minimizes the
 * crash window where a pub could be advanced but not enqueued.
 */
async function enqueueDuePublications(env: ScoutEnv): Promise<number> {
  const now = Math.floor(Date.now() / 1000)

  const result = await runWithRetry(() =>
    env.WRITER_DB
      .prepare('SELECT id, scout_schedule, timezone FROM publications WHERE next_scout_at IS NOT NULL AND next_scout_at <= ?')
      .bind(now)
      .all<ScheduleRow>(),
  )

  const pubs = result.results ?? []
  if (pubs.length === 0) return 0

  for (const pub of pubs) {
    const schedule = parseSchedule(pub.scout_schedule)
    const tz = pub.timezone ?? DEFAULT_TIMEZONE
    const nextRun = computeNextRun(schedule, tz)

    // Optimistic update BEFORE enqueue to prevent double-enqueue
    await runWithRetry(() =>
      env.WRITER_DB
        .prepare('UPDATE publications SET next_scout_at = ? WHERE id = ?')
        .bind(nextRun, pub.id)
        .run(),
    )

    // Enqueue immediately after update
    await env.SCOUT_QUEUE.send({ publicationId: pub.id, triggeredBy: 'cron' })
  }

  console.log(`Enqueued ${pubs.length} due publication(s)`)
  return pubs.length
}

/**
 * Enqueue all publications (for manual run-all trigger).
 * Does NOT modify next_scout_at.
 */
async function enqueueAllPublications(env: ScoutEnv): Promise<number> {
  const publications = await env.WRITER_DB
    .prepare('SELECT id FROM publications')
    .all<{ id: string }>()

  const pubs = publications.results ?? []
  if (pubs.length === 0) return 0

  for (let i = 0; i < pubs.length; i += QUEUE_BATCH_SIZE) {
    const batch = pubs.slice(i, i + QUEUE_BATCH_SIZE)
    await env.SCOUT_QUEUE.sendBatch(
      batch.map((pub) => ({ body: { publicationId: pub.id, triggeredBy: 'manual' as const } })),
    )
  }

  return pubs.length
}
