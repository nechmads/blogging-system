import type { Context } from 'hono'
import type { AppEnv } from '../server'
import { getTierLimits, isUnlimited, UPGRADE_EMAIL } from '@hotmetal/shared'

function getWeekStartTimestamp(): number {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - diff)
  weekStart.setUTCHours(0, 0, 0, 0)
  return Math.floor(weekStart.getTime() / 1000)
}

export function quotaExceededResponse(
  c: Context<AppEnv>,
  message: string,
  limit: number,
  current: number,
) {
  return c.json(
    {
      error: message,
      code: 'QUOTA_EXCEEDED' as const,
      limit,
      current,
      upgradeEmail: UPGRADE_EMAIL,
    },
    403,
  )
}

/**
 * Check whether the publication has room for another topic.
 * Returns a 403 response if exceeded, or null if OK.
 */
export async function checkTopicQuota(
  c: Context<AppEnv>,
  pubId: string,
  userTier: string,
) {
  const limits = getTierLimits(userTier)
  if (isUnlimited(limits.topicsPerPublication)) return null

  const current = await c.env.DAL.countTopicsByPublication(pubId)
  if (current >= limits.topicsPerPublication) {
    return quotaExceededResponse(
      c,
      `Free plan allows up to ${limits.topicsPerPublication} topics per publication`,
      limits.topicsPerPublication,
      current,
    )
  }
  return null
}

/**
 * Check whether the publication has room for another post this week.
 * Returns a 403 response if exceeded, or null if OK.
 */
export async function checkPostsPerWeekQuota(
  c: Context<AppEnv>,
  pubId: string,
  userTier: string,
) {
  const limits = getTierLimits(userTier)
  if (isUnlimited(limits.postsPerWeekPerPublication)) return null

  const weekStart = getWeekStartTimestamp()
  const current = await c.env.DAL.countCompletedSessionsForWeek(pubId, weekStart)
  if (current >= limits.postsPerWeekPerPublication) {
    return quotaExceededResponse(
      c,
      `Free plan allows up to ${limits.postsPerWeekPerPublication} posts per week per publication`,
      limits.postsPerWeekPerPublication,
      current,
    )
  }
  return null
}

/**
 * Check whether the user has room for another publication.
 * Returns a 403 response if exceeded, or null if OK.
 */
export async function checkPublicationQuota(
  c: Context<AppEnv>,
  userId: string,
  userTier: string,
) {
  const limits = getTierLimits(userTier)
  if (isUnlimited(limits.publicationsPerUser)) return null

  const current = await c.env.DAL.countPublicationsByUser(userId)
  if (current >= limits.publicationsPerUser) {
    return quotaExceededResponse(
      c,
      `Free plan allows up to ${limits.publicationsPerUser} publications`,
      limits.publicationsPerUser,
      current,
    )
  }
  return null
}
