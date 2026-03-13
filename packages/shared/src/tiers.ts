export type TierName = 'creator' | 'growth' | 'enterprise'

export interface TierLimits {
  topicsPerPublication: number
  postsPerWeekPerPublication: number
  publicationsPerUser: number
  customWritingStylesLimit: number
  timesPerDayScheduleAllowed: boolean
}

/** Tier definitions. -1 = unlimited. */
const TIER_CONFIG: Record<TierName, TierLimits> = {
  creator: {
    topicsPerPublication: 3,
    postsPerWeekPerPublication: 3,
    publicationsPerUser: 2,
    customWritingStylesLimit: 0,
    timesPerDayScheduleAllowed: false,
  },
  growth: {
    topicsPerPublication: -1,
    postsPerWeekPerPublication: 10,
    publicationsPerUser: 5,
    customWritingStylesLimit: 5,
    timesPerDayScheduleAllowed: true,
  },
  enterprise: {
    topicsPerPublication: -1,
    postsPerWeekPerPublication: -1,
    publicationsPerUser: -1,
    customWritingStylesLimit: -1,
    timesPerDayScheduleAllowed: true,
  },
}

export const TIER_DISPLAY_NAMES: Record<TierName, string> = {
  creator: 'Creator',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

export const UPGRADE_EMAIL = 'hello@hotmetalapp.com'

export function getTierLimits(tier: string): TierLimits {
  if (tier in TIER_CONFIG) return TIER_CONFIG[tier as TierName]
  return TIER_CONFIG.creator
}

export function getTierDisplayName(tier: string): string {
  if (tier in TIER_DISPLAY_NAMES) return TIER_DISPLAY_NAMES[tier as TierName]
  return 'Creator'
}

export function isUnlimited(limit: number): boolean {
  return limit === -1
}
