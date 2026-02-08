import { tool } from 'ai'
import { z } from 'zod'

export function createResearchTools() {
  const search_web = tool({
    description:
      'Search the web for information relevant to the blog post topic. Returns search results with titles, URLs, and snippets. Currently returns placeholder results — real search integration coming soon.',
    parameters: z.object({
      query: z.string().describe('The search query'),
      maxResults: z.number().default(5).describe('Maximum number of results to return'),
    }),
    execute: async ({ query, maxResults }) => {
      // Stub: return placeholder results
      return {
        query,
        results: [
          {
            title: `[Placeholder] Search result for "${query}"`,
            url: `https://example.com/search?q=${encodeURIComponent(query)}`,
            snippet: `This is a placeholder search result. Real web search integration is coming in a future update. Query: "${query}"`,
          },
        ],
        note: 'Web search is not yet connected. These are placeholder results.',
        totalResults: 1,
      }
    },
  })

  const lookup_source = tool({
    description:
      'Fetch and parse a specific URL to extract content for citation. Returns the page title, main content excerpt, and metadata. Currently returns placeholder results — real URL parsing coming soon.',
    parameters: z.object({
      url: z.string().url().describe('The URL to fetch and parse'),
    }),
    execute: async ({ url }) => {
      // Stub: return placeholder
      return {
        url,
        title: `[Placeholder] Content from ${new URL(url).hostname}`,
        excerpt:
          'This is a placeholder excerpt. Real URL parsing integration is coming in a future update.',
        publishedDate: null,
        author: null,
        note: 'URL lookup is not yet connected. This is a placeholder result.',
      }
    },
  })

  return { search_web, lookup_source }
}
