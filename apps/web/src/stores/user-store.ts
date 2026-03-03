import { observable } from '@legendapp/state'
import { fetchCurrentUser, type CurrentUser } from '@/lib/api'

export const userStore$ = observable({
  user: null as CurrentUser | null,
  loading: false,
  loaded: false,
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

/** Reset user store (call on sign-out). */
export function clearUserStore() {
  userStore$.user.set(null)
  userStore$.loaded.set(false)
}
