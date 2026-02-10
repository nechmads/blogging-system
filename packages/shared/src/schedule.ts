import type { ScoutSchedule } from '@hotmetal/content-core'
import { DEFAULT_SCHEDULE } from '@hotmetal/content-core'

/**
 * Compute evenly spaced hours for a "times per day" schedule.
 * E.g. count=3 -> [0, 8, 16], count=4 -> [0, 6, 12, 18]
 */
export function getScheduleSlots(count: number): number[] {
  const interval = Math.floor(24 / count)
  return Array.from({ length: count }, (_, i) => i * interval)
}

/**
 * Parse a JSON string into a ScoutSchedule, falling back to DEFAULT_SCHEDULE.
 * Uses runtime validation to guard against corrupt stored data.
 */
export function parseSchedule(raw: string | null | undefined): ScoutSchedule {
  if (!raw) return DEFAULT_SCHEDULE
  try {
    const parsed = JSON.parse(raw)
    return validateSchedule(parsed) ? parsed : DEFAULT_SCHEDULE
  } catch {
    return DEFAULT_SCHEDULE
  }
}

/**
 * Validate that a timezone string is a valid IANA timezone.
 * Uses Intl.DateTimeFormat — throws on invalid tz.
 */
export function validateTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Type guard for ScoutSchedule. Validates shape and value ranges.
 */
export function validateSchedule(input: unknown): input is ScoutSchedule {
  if (!input || typeof input !== 'object') return false
  const s = input as Record<string, unknown>

  switch (s.type) {
    case 'daily':
      return typeof s.hour === 'number' && s.hour >= 0 && s.hour <= 23 && Number.isInteger(s.hour)
    case 'times_per_day':
      return typeof s.count === 'number' && s.count >= 2 && s.count <= 6 && Number.isInteger(s.count)
    case 'every_n_days':
      return (
        typeof s.days === 'number' &&
        s.days >= 2 &&
        s.days <= 7 &&
        Number.isInteger(s.days) &&
        typeof s.hour === 'number' &&
        s.hour >= 0 &&
        s.hour <= 23 &&
        Number.isInteger(s.hour)
      )
    default:
      return false
  }
}

/**
 * Convert a date to a monotonic day number for calendar-day arithmetic.
 * Uses a simplified Julian day calculation.
 */
function dayNumber(year: number, month: number, day: number): number {
  // Adjust for months January and February
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

/**
 * Add N calendar days to a local date, returning the new local date.
 */
function addCalendarDays(year: number, month: number, day: number, n: number): { year: number; month: number; day: number } {
  // Use Date in UTC mode for calendar arithmetic (no DST concerns in UTC)
  const d = new Date(Date.UTC(year, month - 1, day + n))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

/**
 * Get current date/time parts in a specific timezone.
 */
function getPartsInTz(epochMs: number, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(epochMs)).map((p) => [p.type, p.value]),
  )
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
    second: parseInt(parts.second, 10),
  }
}

/**
 * Convert a local date/time in a timezone to a UTC epoch (seconds).
 * Computes the UTC offset at the *target* datetime to handle DST correctly.
 */
function localToUtcEpoch(
  year: number,
  month: number,
  day: number,
  hour: number,
  tz: string,
): number {
  // Build a UTC Date for the local date/time (naive, ignoring offset)
  const naiveUtc = Date.UTC(year, month - 1, day, hour, 0, 0)

  // Find what the local time is when UTC is at naiveUtc
  const localAtNaive = getPartsInTz(naiveUtc, tz)

  // The offset (in ms) is: naiveUtc - actual UTC time that corresponds to local time
  // If local hour at naiveUtc matches our target, offset is 0
  // Otherwise, compute difference
  const localMs = Date.UTC(
    localAtNaive.year,
    localAtNaive.month - 1,
    localAtNaive.day,
    localAtNaive.hour,
    localAtNaive.minute,
    localAtNaive.second,
  )
  const offsetMs = localMs - naiveUtc

  // The actual UTC epoch for our target local time
  const utcMs = naiveUtc - offsetMs

  // Verify: the local time at utcMs should be our target hour.
  // If DST caused the hour to be skipped (spring forward), advance to next valid hour.
  const verify = getPartsInTz(utcMs, tz)
  if (verify.hour !== hour) {
    // Spring-forward: the target hour doesn't exist. Advance by 1 hour.
    return Math.floor((utcMs + 3600_000) / 1000)
  }

  return Math.floor(utcMs / 1000)
}

/**
 * Compute the next scout run time as a UTC epoch (seconds).
 *
 * @param schedule - The publication's scout schedule
 * @param timezone - IANA timezone string
 * @param afterEpoch - UTC epoch (seconds) to compute next run after. Defaults to now.
 * @returns UTC epoch in seconds
 */
export function computeNextRun(
  schedule: ScoutSchedule,
  timezone: string,
  afterEpoch?: number,
): number {
  const nowSec = afterEpoch ?? Math.floor(Date.now() / 1000)
  const nowMs = nowSec * 1000
  const now = getPartsInTz(nowMs, timezone)

  switch (schedule.type) {
    case 'daily': {
      // Next occurrence of schedule.hour in the target timezone
      if (now.hour < schedule.hour) {
        // Today
        return localToUtcEpoch(now.year, now.month, now.day, schedule.hour, timezone)
      }
      // Tomorrow (calendar day arithmetic, DST-safe)
      const tomorrow = addCalendarDays(now.year, now.month, now.day, 1)
      return localToUtcEpoch(tomorrow.year, tomorrow.month, tomorrow.day, schedule.hour, timezone)
    }

    case 'times_per_day': {
      const slots = getScheduleSlots(schedule.count)
      // Find next slot today
      const nextSlot = slots.find((h) => h > now.hour)
      if (nextSlot !== undefined) {
        return localToUtcEpoch(now.year, now.month, now.day, nextSlot, timezone)
      }
      // First slot tomorrow (calendar day arithmetic, DST-safe)
      const tomorrow = addCalendarDays(now.year, now.month, now.day, 1)
      return localToUtcEpoch(tomorrow.year, tomorrow.month, tomorrow.day, slots[0], timezone)
    }

    case 'every_n_days': {
      // Compute cadence in local-timezone calendar days to avoid DST issues.
      // Anchor: 2024-01-01 in the publication's timezone.
      const anchorDate = new Date(Date.UTC(2024, 0, 1, 12)) // noon UTC to avoid edge issues
      const anchorLocal = getPartsInTz(anchorDate.getTime(), timezone)

      // Count calendar days between anchor local date and current local date
      const anchorDayNum = dayNumber(anchorLocal.year, anchorLocal.month, anchorLocal.day)
      const nowDayNum = dayNumber(now.year, now.month, now.day)
      const daysSinceAnchor = nowDayNum - anchorDayNum
      const remainder = ((daysSinceAnchor % schedule.days) + schedule.days) % schedule.days

      if (remainder === 0 && now.hour < schedule.hour) {
        // Today is a cadence day and the hour hasn't passed yet
        return localToUtcEpoch(now.year, now.month, now.day, schedule.hour, timezone)
      }

      // Next cadence day: advance by calendar days in local timezone
      const daysUntilNext = remainder === 0 ? schedule.days : schedule.days - remainder
      const nextLocal = addCalendarDays(now.year, now.month, now.day, daysUntilNext)
      return localToUtcEpoch(nextLocal.year, nextLocal.month, nextLocal.day, schedule.hour, timezone)
    }
  }
}
