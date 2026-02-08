import { tool } from 'ai'
import { z } from 'zod'
import type { WriterAgent } from '../agent/writer-agent'

export function createDraftTools(agent: WriterAgent) {
  const save_draft = tool({
    description:
      'Save a new draft version of the blog post. Use this after writing or significantly revising content. Increments the version number automatically.',
    parameters: z.object({
      title: z.string().describe('The title of the blog post'),
      content: z.string().describe('The full content of the blog post in Markdown format'),
      citations: z
        .array(
          z.object({
            url: z.string(),
            title: z.string(),
            publisher: z.string().optional(),
            excerpt: z.string().optional(),
          }),
        )
        .optional()
        .describe('Sources cited in the post'),
      feedback: z
        .string()
        .optional()
        .describe('The user feedback that prompted this revision (if any)'),
    }),
    execute: async ({ title, content, citations, feedback }) => {
      const citationsJson = citations ? JSON.stringify(citations) : null
      const draft = agent.saveDraft(title, content, citationsJson, feedback ?? null)

      return {
        success: true,
        version: draft.version,
        wordCount: draft.word_count,
        title: draft.title,
      }
    },
  })

  const get_current_draft = tool({
    description:
      'Get the latest draft version. Use this to review the current state of the post before making changes.',
    parameters: z.object({}),
    execute: async () => {
      const draft = agent.getCurrentDraft()
      if (!draft) {
        return { found: false, message: 'No drafts exist yet.' }
      }

      return {
        found: true,
        version: draft.version,
        title: draft.title,
        content: draft.content,
        wordCount: draft.word_count,
        citations: draft.citations ? JSON.parse(draft.citations) : [],
        isFinal: draft.is_final === 1,
      }
    },
  })

  const list_drafts = tool({
    description: 'List all draft versions with their metadata. Use this to show draft history.',
    parameters: z.object({}),
    execute: async () => {
      const drafts = agent.listDrafts()
      return {
        count: drafts.length,
        drafts: drafts.map((d) => ({
          version: d.version,
          title: d.title,
          wordCount: d.word_count,
          isFinal: d.is_final === 1,
          createdAt: d.created_at,
        })),
      }
    },
  })

  return { save_draft, get_current_draft, list_drafts }
}
