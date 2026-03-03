export type TierName = 'free' | 'pro'

export interface TierLimits {
  topicsPerPublication: number
  postsPerWeekPerPublication: number
  publicationsPerUser: number
}

/** Tier definitions. -1 = unlimited. */
const TIER_CONFIG: Record<TierName, TierLimits> = {
  free: {
    topicsPerPublication: 3,
    postsPerWeekPerPublication: 5,
    publicationsPerUser: 2,
  },
  pro: {
    topicsPerPublication: -1,
    postsPerWeekPerPublication: -1,
    publicationsPerUser: -1,
  },
}

export const UPGRADE_EMAIL = 'hello@hotmetalapp.com'

export function getTierLimits(tier: string): TierLimits {
  if (tier in TIER_CONFIG) return TIER_CONFIG[tier as TierName]
  return TIER_CONFIG.free
}

export function isUnlimited(limit: number): boolean {
  return limit === -1
}
