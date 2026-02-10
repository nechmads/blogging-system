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
    console.log('[cron] Scout cron tick started')
    ctx.waitUntil((async () => {
      try {
        await backfillNullSchedules(env)
        const count = await enqueueDuePublications(env)
        console.log(`[cron] Scout cron tick complete — ${count} publication(s) enqueued`)
      } catch (err) {
        console.error('[cron] Scout cron tick failed:', err)
      }
    })())
  },

  // Queue consumer — start a workflow per publication
  async queue(batch: MessageBatch<ScoutQueueMessage>, env: ScoutEnv) {
    console.log(`[queue] Processing batch of ${batch.messages.length} message(s)`)
    for (const message of batch.messages) {
      const { publicationId, triggeredBy } = message.body

      try {
        const workflowId = `scout-${publicationId}-${crypto.randomUUID()}`
        console.log(`[queue] Starting workflow ${workflowId} (trigger: ${triggeredBy})`)
        await env.SCOUT_WORKFLOW.create({
          id: workflowId,
          params: { publicationId, triggeredBy },
        })
        message.ack()
      } catch (err) {
        console.error(`[queue] Failed to start workflow for publication ${publicationId}:`, err)
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

  console.log(`[backfill] Found ${pubs.length} publication(s) with NULL next_scout_at`)

  for (const pub of pubs) {
    const schedule = parseSchedule(pub.scout_schedule)
    const tz = pub.timezone ?? DEFAULT_TIMEZONE
    const nextRun = computeNextRun(schedule, tz)
    console.log(`[backfill] pub=${pub.id} schedule=${JSON.stringify(schedule)} tz=${tz} nextRun=${new Date(nextRun * 1000).toISOString()}`)

    await runWithRetry(() =>
      env.WRITER_DB
        .prepare('UPDATE publications SET next_scout_at = ? WHERE id = ?')
        .bind(nextRun, pub.id)
        .run(),
    )
  }
}

/**
 * Query publications whose next_scout_at <= now, then for each:
 * optimistically update next_scout_at and enqueue immediately.
 * Interleaving update + enqueue per publication minimizes the
 * crash window where a pub could be advanced but not enqueued.
 */
async function enqueueDuePublications(env: ScoutEnv): Promise<number> {
  const now = Math.floor(Date.now() / 1000)
  console.log(`[enqueue] Checking for due publications (now=${new Date(now * 1000).toISOString()})`)

  const result = await runWithRetry(() =>
    env.WRITER_DB
      .prepare('SELECT id, scout_schedule, timezone FROM publications WHERE next_scout_at IS NOT NULL AND next_scout_at <= ?')
      .bind(now)
      .all<ScheduleRow>(),
  )

  const pubs = result.results ?? []
  if (pubs.length === 0) {
    console.log('[enqueue] No publications due')
    return 0
  }

  console.log(`[enqueue] Found ${pubs.length} due publication(s)`)

  for (const pub of pubs) {
    const schedule = parseSchedule(pub.scout_schedule)
    const tz = pub.timezone ?? DEFAULT_TIMEZONE
    const nextRun = computeNextRun(schedule, tz)

    console.log(`[enqueue] pub=${pub.id} — advancing next_scout_at to ${new Date(nextRun * 1000).toISOString()}`)

    // Optimistic update BEFORE enqueue to prevent double-enqueue
    await runWithRetry(() =>
      env.WRITER_DB
        .prepare('UPDATE publications SET next_scout_at = ? WHERE id = ?')
        .bind(nextRun, pub.id)
        .run(),
    )

    // Enqueue immediately after update
    await env.SCOUT_QUEUE.send({ publicationId: pub.id, triggeredBy: 'cron' })
    console.log(`[enqueue] pub=${pub.id} — queued`)
  }

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
