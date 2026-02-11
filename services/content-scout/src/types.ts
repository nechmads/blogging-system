import type { Publication, Topic, Idea, IdeaSource } from '@hotmetal/data-layer'

// --- Search result types ---

export interface TopicSearchResults {
  topicName: string
  topicDescription: string | null
  topicPriority: number
  news: Array<{ title: string; link: string; snippet: string; date?: string; source?: string }>
  web: Array<{ title: string; url: string; snippet: string }>
}

// --- Filtered story (after dedup) ---

export interface FilteredStory {
  title: string
  snippet: string
  url: string | null
  date: string | null
  topicName: string
}

// --- Idea brief (LLM output) ---

export interface IdeaBrief {
  title: string
  angle: string
  summary: string
  topic: string
  relevance_score: number
  sources: IdeaSource[]
}

// --- Publication context (loaded in step 1) ---

export interface PublicationContext {
  publication: Publication
  topics: Topic[]
  recentIdeas: Pick<Idea, 'id' | 'title' | 'angle'>[]
}
