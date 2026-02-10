/** Daily at a specific hour (0-23) in the publication's timezone. */
export interface DailySchedule {
  type: 'daily'
  hour: number
}

/** Evenly spaced runs per day (count 2-6, from midnight). */
export interface TimesPerDaySchedule {
  type: 'times_per_day'
  count: number
}

/** Every N days (2-7) at a specific hour (0-23). */
export interface EveryNDaysSchedule {
  type: 'every_n_days'
  days: number
  hour: number
}

export type ScoutSchedule = DailySchedule | TimesPerDaySchedule | EveryNDaysSchedule

export const SCHEDULE_TYPES = ['daily', 'times_per_day', 'every_n_days'] as const
export type ScheduleType = (typeof SCHEDULE_TYPES)[number]

export const DEFAULT_SCHEDULE: ScoutSchedule = { type: 'daily', hour: 8 }
export const DEFAULT_TIMEZONE = 'UTC'
