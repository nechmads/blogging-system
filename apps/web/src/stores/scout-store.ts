import { observable } from '@legendapp/state'
import { fetchNewIdeasCount } from '@/lib/api'

export const scoutStore$ = observable({
  polling: false,
  pollingPubId: null as string | null,
  baselineCount: 0,
  newIdeasCount: 0,
})

export function startScoutPolling(pubId: string, currentCount: number) {
  scoutStore$.polling.set(true)
  scoutStore$.pollingPubId.set(pubId)
  scoutStore$.baselineCount.set(currentCount)
}

export function clearNewIdeasBadge() {
  scoutStore$.newIdeasCount.set(0)
}

export function stopScoutPolling() {
  scoutStore$.polling.set(false)
  scoutStore$.pollingPubId.set(null)
  scoutStore$.baselineCount.set(0)
}

/** Fetch the global count of ideas with status 'new' and update the badge. */
export async function refreshNewIdeasCount() {
  try {
    const count = await fetchNewIdeasCount()
    scoutStore$.newIdeasCount.set(count)
  } catch {
    // Silently ignore — badge will update on next refresh
  }
}
