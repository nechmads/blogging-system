import type { AnalyticsAdapter, AnalyticsConfig, PageProperties, UserTraits } from './types'
import type { AnalyticsEvent, AnalyticsEventProperties } from './events'

class AnalyticsManagerImpl {
  private adapter: AnalyticsAdapter | null = null
  private enabled = false
  private logCalls = false

  init(adapter: AnalyticsAdapter, config: AnalyticsConfig): void {
    this.adapter = adapter
    this.enabled = true
    this.logCalls = config.logCalls ?? false
    this.adapter.init(config)
  }

  identify(userId: string, traits?: UserTraits): void {
    if (!this.enabled || !this.adapter) return
    if (this.logCalls) console.log('[Analytics] identify', userId, traits)
    this.adapter.identify(userId, traits)
  }

  track<E extends AnalyticsEvent>(
    ...args: AnalyticsEventProperties[E] extends Record<string, never>
      ? [event: E]
      : [event: E, properties: AnalyticsEventProperties[E]]
  ): void {
    if (!this.enabled || !this.adapter) return
    const [event, properties] = args
    if (this.logCalls) console.log('[Analytics] track', event, properties ?? '')
    this.adapter.track(event, properties as Record<string, unknown> | undefined)
  }

  page(properties?: PageProperties): void {
    if (!this.enabled || !this.adapter) return
    if (this.logCalls) console.log('[Analytics] page', properties)
    this.adapter.page(properties)
  }

  reset(): void {
    if (!this.enabled || !this.adapter) return
    if (this.logCalls) console.log('[Analytics] reset')
    this.adapter.reset()
  }

  get isEnabled(): boolean {
    return this.enabled
  }
}

export const AnalyticsManager = new AnalyticsManagerImpl()
