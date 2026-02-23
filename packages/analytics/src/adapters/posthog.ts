import posthog from 'posthog-js'
import type { AnalyticsAdapter, AnalyticsConfig, PageProperties, UserTraits } from '../types'

export class PostHogAdapter implements AnalyticsAdapter {
  init(config: AnalyticsConfig): void {
    posthog.init(config.apiKey, {
      api_host: 'https://us.i.posthog.com',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      loaded: config.debug
        ? () => console.log('[Analytics] PostHog loaded (debug mode)')
        : undefined,
    })

    if (config.debug) {
      posthog.debug()
    }
  }

  identify(userId: string, traits?: UserTraits): void {
    posthog.identify(userId, traits)
  }

  track(event: string, properties?: Record<string, unknown>): void {
    posthog.capture(event, properties)
  }

  page(properties?: PageProperties): void {
    posthog.capture('$pageview', properties)
  }

  reset(): void {
    posthog.reset()
  }
}
