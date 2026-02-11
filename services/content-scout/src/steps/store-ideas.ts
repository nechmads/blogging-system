import type { DataLayerApi, Topic, CreateIdeaInput } from '@hotmetal/data-layer'
import type { IdeaBrief } from '../types'

export interface StoredIdeasResult {
  count: number
  ideaIds: string[]
}

export async function storeIdeas(
  dal: DataLayerApi,
  publicationId: string,
  ideas: IdeaBrief[],
  topics: Topic[],
): Promise<StoredIdeasResult> {
  const topicsByName = new Map(topics.map((t) => [t.name, t]))

  // Build entries with deterministic IDs so workflow retries are idempotent.
  // The DAL uses INSERT OR IGNORE which skips rows that already exist.
  const entries = await Promise.all(
    ideas.map(async (idea) => ({
      id: await deterministicId(publicationId, idea.title, idea.angle),
      topicId: topicsByName.get(idea.topic)?.id ?? null,
      idea,
    })),
  )

  const items: CreateIdeaInput[] = entries.map(({ id, topicId, idea }) => ({
    id,
    publicationId,
    topicId,
    title: idea.title,
    angle: idea.angle,
    summary: idea.summary,
    sources: JSON.stringify(idea.sources),
    relevanceScore: idea.relevance_score,
  }))

  await dal.createIdeas(items)

  return { count: ideas.length, ideaIds: entries.map((e) => e.id) }
}

/** Generate a deterministic UUID-like ID from content fields. */
async function deterministicId(...parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join('\0'))
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
  // Format as UUID v4 shape for consistency with existing IDs
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    '8' + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-')
}
