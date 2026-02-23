/// <reference types="vite/client" />
import type { AnalyticsAdapter, AnalyticsConfig, PageProperties, UserTraits } from './types'
import type { AnalyticsEvent, AnalyticsEventProperties } from './events'

const LOG_CALLS = import.meta.env.VITE_LOG_ANALYTICS_CALLS === 'true'

class AnalyticsManagerImpl {
  private adapter: AnalyticsAdapter | null = null
  private enabled = false

  init(adapter: AnalyticsAdapter, config: AnalyticsConfig): void {
    this.adapter = adapter
    this.enabled = true
    this.adapter.init(config)
  }

  identify(userId: string, traits?: UserTraits): void {
    if (LOG_CALLS) console.log('[Analytics] identify', userId, traits)
    if (!this.enabled || !this.adapter) return
    this.adapter.identify(userId, traits)
  }

  track<E extends AnalyticsEvent>(
    ...args: AnalyticsEventProperties[E] extends Record<string, never>
      ? [event: E]
      : [event: E, properties: AnalyticsEventProperties[E]]
  ): void {
    const [event, properties] = args
    if (LOG_CALLS) console.log('[Analytics] track', event, properties ?? '')
    if (!this.enabled || !this.adapter) return
    this.adapter.track(event, properties as Record<string, unknown> | undefined)
  }

  page(properties?: PageProperties): void {
    if (LOG_CALLS) console.log('[Analytics] page', properties)
    if (!this.enabled || !this.adapter) return
    this.adapter.page(properties)
  }

  reset(): void {
    if (LOG_CALLS) console.log('[Analytics] reset')
    if (!this.enabled || !this.adapter) return
    this.adapter.reset()
  }

  get isEnabled(): boolean {
    return this.enabled
  }
}

export const AnalyticsManager = new AnalyticsManagerImpl()
