import { observable } from '@legendapp/state'
import { fetchCurrentUser, fetchSubscription, type CurrentUser, type SubscriptionInfo } from '@/lib/api'

export const userStore$ = observable({
  user: null as CurrentUser | null,
  loading: false,
  loaded: false,
  subscription: null as SubscriptionInfo | null,
  subscriptionLoaded: false,
})

/** Fetch and cache the current user. No-op if already loaded. */
export async function loadCurrentUser(): Promise<CurrentUser | null> {
  if (userStore$.loaded.peek()) return userStore$.user.peek()
  if (userStore$.loading.peek()) {
    // Wait for in-flight request
    return new Promise((resolve) => {
      const dispose = userStore$.loaded.onChange((loaded) => {
        if (loaded) { dispose(); resolve(userStore$.user.peek()) }
      })
    })
  }

  userStore$.loading.set(true)
  try {
    const user = await fetchCurrentUser()
    userStore$.user.set(user)
    userStore$.loaded.set(true)
    return user
  } catch {
    userStore$.loaded.set(true)
    return null
  } finally {
    userStore$.loading.set(false)
  }
}

/** Force re-fetch the current user (bypasses cache). */
export async function refreshUser(): Promise<CurrentUser | null> {
  try {
    const user = await fetchCurrentUser()
    userStore$.user.set(user)
    return user
  } catch {
    return null
  }
}

/** Fetch and cache subscription info. No-op if already loaded. */
export async function loadSubscription(): Promise<SubscriptionInfo | null> {
  if (userStore$.subscriptionLoaded.peek()) return userStore$.subscription.peek()
  return refreshSubscription()
}

/** Force re-fetch subscription info. */
export async function refreshSubscription(): Promise<SubscriptionInfo | null> {
  try {
    const data = await fetchSubscription()
    userStore$.subscription.set(data)
    userStore$.subscriptionLoaded.set(true)
    return data
  } catch {
    userStore$.subscriptionLoaded.set(true)
    return null
  }
}

/**
 * Poll subscription until the tier changes from its current value.
 * Used after Paddle checkout completes — the webhook may take a moment.
 */
export async function pollForTierChange(maxAttempts = 10, intervalMs = 2000): Promise<void> {
  const currentTier = userStore$.subscription.peek()?.tier ?? userStore$.user.peek()?.tier ?? 'creator'

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    const [sub, user] = await Promise.all([refreshSubscription(), refreshUser()])
    const newTier = sub?.tier ?? user?.tier
    if (newTier && newTier !== currentTier) return
  }
}

/** Reset user store (call on sign-out). */
export function clearUserStore() {
  userStore$.user.set(null)
  userStore$.loaded.set(false)
  userStore$.subscription.set(null)
  userStore$.subscriptionLoaded.set(false)
}
