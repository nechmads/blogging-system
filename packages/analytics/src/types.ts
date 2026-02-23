export interface UserTraits {
  email?: string
  name?: string
  firstName?: string
  lastName?: string
  createdAt?: string
  [key: string]: unknown
}

export interface PageProperties {
  path: string
  pageName?: string
  [key: string]: unknown
}

export interface AnalyticsConfig {
  apiKey: string
  debug?: boolean
}

export interface AnalyticsAdapter {
  init(config: AnalyticsConfig): void
  identify(userId: string, traits?: UserTraits): void
  track(event: string, properties?: Record<string, unknown>): void
  page(properties?: PageProperties): void
  reset(): void
}
