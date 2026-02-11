import type { ScoutEnv } from '../env'
import type { Publication, Idea } from '@hotmetal/data-layer'
import type { IdeaBrief } from '../types'
import { slugify, getWeekStartTimestamp } from '../utils'

export async function autoWriteTopIdea(
  env: ScoutEnv,
  publication: Publication,
  ideas: IdeaBrief[],
  storedIdeaIds: string[],
): Promise<number> {
  if (publication.autoPublishMode === 'draft') return 0

  if (publication.autoPublishMode === 'full-auto') {
    const shouldWrite = await checkCadence(env, publication)
    if (!shouldWrite) return 0
  }

  // Pick the highest-scoring idea and its corresponding stored ID
  let topIndex = 0
  for (let i = 1; i < ideas.length; i++) {
    if (ideas[i].relevance_score > ideas[topIndex].relevance_score) {
      topIndex = i
    }
  }

  const ideaId = storedIdeaIds[topIndex]
  if (!ideaId) return 0

  // Fetch the stored idea by primary key
  const storedIdea = await env.DAL.getIdeaById(ideaId)
  if (!storedIdea) return 0

  await writeAndPublish(env, publication, storedIdea)
  return 1
}

async function checkCadence(env: ScoutEnv, publication: Publication): Promise<boolean> {
  const weekStart = getWeekStartTimestamp()
  const count = await env.DAL.countCompletedSessionsForWeek(publication.id, weekStart)
  return count < publication.cadencePostsPerWeek
}

async function writeAndPublish(
  env: ScoutEnv,
  publication: Publication,
  idea: Idea,
): Promise<void> {
  const baseUrl = env.WRITER_AGENT_URL
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.WRITER_AGENT_API_KEY}`,
  }

  // 1. Create a writing session with seed context
  const seedContext = buildSeedContext(idea, publication)
  const sessionRes = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId: publication.userId,
      title: idea.title,
      publicationId: publication.id,
      ideaId: idea.id,
      seedContext,
    }),
  })
  if (!sessionRes.ok) throw new Error(`Failed to create session: ${await sessionRes.text()}`)
  const session = (await sessionRes.json()) as { id: string }

  // 2. Send a write instruction to the agent
  const chatRes = await fetch(`${baseUrl}/api/sessions/${session.id}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: buildWriteInstruction(idea, publication) }),
  })
  if (!chatRes.ok) throw new Error(`Chat failed for session ${session.id}: ${await chatRes.text()}`)

  // 3. Wait for draft to be produced (poll)
  const draft = await pollForDraft(baseUrl, env.WRITER_AGENT_API_KEY, session.id)
  if (!draft) throw new Error(`No draft produced for session ${session.id} within timeout`)

  // 4. Publish the draft
  const publishRes = await fetch(`${baseUrl}/api/sessions/${session.id}/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      slug: slugify(idea.title),
      author: publication.defaultAuthor,
    }),
  })
  if (!publishRes.ok) throw new Error(`Publish failed: ${await publishRes.text()}`)

  // 5. Update idea status
  await env.DAL.promoteIdea(idea.id, session.id)
}

function buildSeedContext(idea: Idea, publication: Publication): string {
  let context = '## Writing Assignment\n\n'
  context += `**Title:** ${idea.title}\n`
  context += `**Angle:** ${idea.angle}\n\n`
  context += `**Brief:**\n${idea.summary}\n\n`

  if (publication.writingTone) {
    context += `**Writing Tone:** ${publication.writingTone}\n\n`
  }

  if (idea.sources) {
    context += '## Source Material\n\n'
    for (const source of idea.sources) {
      context += `### ${source.title}\nURL: ${source.url}\n${source.snippet}\n\n`
    }
  }

  return context
}

function buildWriteInstruction(idea: Idea, publication: Publication): string {
  let instruction = `Please write a complete blog post based on the research context provided. `
  instruction += `The post should be titled "${idea.title}" and take the following angle: ${idea.angle}\n\n`
  instruction += `Key points to cover:\n${idea.summary}\n\n`

  if (publication.writingTone) {
    instruction += `Writing style: ${publication.writingTone}\n\n`
  }

  instruction += `Please research the topic using the available tools, then write a thorough, well-sourced blog post. `
  instruction += `Include citations where appropriate. The post should be ready for publication.`

  return instruction
}

async function pollForDraft(
  baseUrl: string,
  apiKey: string,
  sessionId: string,
  maxAttempts = 30,
  intervalMs = 10_000,
): Promise<{ version: number } | null> {
  const headers = { Authorization: `Bearer ${apiKey}` }

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))

    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/drafts`, { headers })
    if (!res.ok) continue

    const { data: drafts } = (await res.json()) as {
      data: Array<{ version: number; is_final: number }>
    }

    const finalDraft = drafts.find((d) => d.is_final)
    if (finalDraft) return finalDraft

    // If we have drafts but none are final, keep polling
    // On the last attempt, return whatever we have
    if (i === maxAttempts - 1 && drafts.length > 0) {
      return drafts[drafts.length - 1]
    }
  }

  return null
}
