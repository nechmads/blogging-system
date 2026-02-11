import type { DataLayerApi } from '@hotmetal/data-layer'

export interface PublisherEnv {
  DAL: DataLayerApi
  CMS_URL: string
  CMS_API_KEY: string
  PUBLISHER_API_KEY: string
  BLOG_BASE_URL: string
  LINKEDIN_CLIENT_ID: string
  LINKEDIN_CLIENT_SECRET: string
  LINKEDIN_REDIRECT_URI: string
}
