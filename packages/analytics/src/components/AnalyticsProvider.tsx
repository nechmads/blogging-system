import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { AnalyticsManager } from '../manager'
import { PostHogAdapter } from '../adapters/posthog'
import { AnalyticsEvent } from '../events'
import type { UserTraits } from '../types'

export interface AnalyticsUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  createdAt?: string
}

export interface AnalyticsProviderProps {
  apiKey: string | undefined
  enabled?: boolean
  debug?: boolean
  user: AnalyticsUser | null
  children: React.ReactNode
}

export function AnalyticsProvider({ apiKey, enabled = true, debug = false, user, children }: AnalyticsProviderProps) {
  const location = useLocation()
  const prevPathRef = useRef<string>('')
  const identifiedUserRef = useRef<string | null>(null)
  const [initialized, setInitialized] = useState(AnalyticsManager.isEnabled)

  // Initialize analytics once
  useEffect(() => {
    if (!apiKey || !enabled) return
    if (AnalyticsManager.isEnabled) return

    const adapter = new PostHogAdapter()
    AnalyticsManager.init(adapter, { apiKey, debug })
    setInitialized(true)
  }, [apiKey, enabled, debug])

  // Track page views on route change (or when analytics first initializes)
  useEffect(() => {
    if (!initialized) return
    if (location.pathname === prevPathRef.current) return

    prevPathRef.current = location.pathname
    AnalyticsManager.track(AnalyticsEvent.PageViewed, { path: location.pathname })
    AnalyticsManager.page({ path: location.pathname })
  }, [location.pathname, initialized])

  // Identify / reset user
  useEffect(() => {
    if (!initialized) return

    if (user && identifiedUserRef.current !== user.id) {
      const traits: UserTraits = {}
      if (user.email) traits.email = user.email
      if (user.firstName) traits.firstName = user.firstName
      if (user.lastName) traits.lastName = user.lastName
      if (user.createdAt) traits.createdAt = user.createdAt

      AnalyticsManager.identify(user.id, traits)
      identifiedUserRef.current = user.id
    } else if (!user && identifiedUserRef.current) {
      AnalyticsManager.reset()
      identifiedUserRef.current = null
    }
  }, [user, initialized])

  return <>{children}</>
}
