import type { IdeaBrief, TopicRow } from '../types'

export interface StoredIdeasResult {
  count: number
  ideaIds: string[]
}

export async function storeIdeas(
  db: D1Database,
  publicationId: string,
  ideas: IdeaBrief[],
  topics: TopicRow[],
): Promise<StoredIdeasResult> {
  const topicsByName = new Map(topics.map((t) => [t.name, t]))
  const ideaIds: string[] = []

  const statements = ideas.map((idea) => {
    const topicId = topicsByName.get(idea.topic)?.id ?? null
    const id = crypto.randomUUID()
    ideaIds.push(id)

    return db
      .prepare(
        `INSERT INTO ideas (id, publication_id, topic_id, title, angle, summary, sources, relevance_score, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      )
      .bind(
        id,
        publicationId,
        topicId,
        idea.title,
        idea.angle,
        idea.summary,
        JSON.stringify(idea.sources),
        idea.relevance_score,
      )
  })

  await db.batch(statements)

  return { count: ideas.length, ideaIds }
}
