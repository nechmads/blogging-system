import type { DataLayerApi } from '@hotmetal/data-layer'
import type { PublicationContext } from '../types'

export async function loadPublicationContext(
  dal: DataLayerApi,
  publicationId: string,
): Promise<PublicationContext> {
  const publication = await dal.getPublicationById(publicationId)
  if (!publication) throw new Error(`Publication ${publicationId} not found`)

  const topics = await dal.listTopicsByPublication(publicationId)

  // Recent ideas (last 7 days) for dedup context
  const recentIdeas = await dal.getRecentIdeasByPublication(publicationId, 7)

  return {
    publication,
    topics,
    recentIdeas,
  }
}
