export const POST_STATUSES = [
  'idea',
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
] as const

export type PostStatus = (typeof POST_STATUSES)[number]

export interface Citation {
  url: string
  title: string
  publisher?: string
  accessedAt?: string
  excerpt?: string
}

export interface Post {
  id: string
  // TODO: Add blogId when multi-blog support is implemented (Phase 4)
  title: string
  subtitle?: string
  slug: string
  hook?: string
  content: string
  excerpt?: string
  featuredImage?: string
  status: PostStatus
  tags?: string
  topics?: string
  citations?: Citation[]
  seoTitle?: string
  seoDescription?: string
  canonicalUrl?: string
  ogImage?: string
  author: string
  publishedAt?: string
  scheduledAt?: string
  createdAt: string
  updatedAt: string
}
