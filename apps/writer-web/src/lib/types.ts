export interface Session {
  id: string
  userId: string
  title: string | null
  status: 'active' | 'completed' | 'archived'
  currentDraftVersion: number
  cmsPostId: string | null
  createdAt: number
  updatedAt: number
}

export interface Draft {
  id: string
  version: number
  title: string | null
  word_count: number
  is_final: number
  created_at: number
}

export interface DraftContent extends Draft {
  content: string
  citations: string | null
  feedback: string | null
}

export interface SeoSuggestion {
  excerpt: string
  tags: string
}

export interface PublishInput {
  slug: string
  author?: string
  tags?: string
  excerpt?: string
}

export interface PublishResult {
  success: boolean
  postId: string
  slug: string
  title: string
}

