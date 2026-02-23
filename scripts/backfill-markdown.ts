/**
 * One-time backfill script: populates the `markdown` field for existing CMS posts
 * by converting their HTML `content` to Markdown.
 *
 * Reads CMS_URL and CMS_API_KEY from apps/web/.dev.vars.
 * Run with: npx tsx scripts/backfill-markdown.ts
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'

// --- Read env from .dev.vars ---

function readDevVars(): { cmsUrl: string; cmsApiKey: string } {
  const devVarsPath = resolve(__dirname, '..', 'apps', 'web', '.dev.vars')
  const content = readFileSync(devVarsPath, 'utf-8')
  const vars: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
  }

  const cmsUrl = process.env['CMS_URL'] || vars['CMS_URL']
  const cmsApiKey = process.env['CMS_API_KEY'] || vars['CMS_API_KEY']
  if (!cmsUrl || !cmsApiKey) {
    throw new Error('CMS_URL and CMS_API_KEY must be set in apps/web/.dev.vars')
  }
  return { cmsUrl, cmsApiKey }
}

// --- HTML to Markdown converter ---

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkStringify, { bullet: '-', emphasis: '*', strong: '*' })

async function htmlToMarkdown(html: string): Promise<string> {
  const result = await processor.process(html)
  return String(result)
}

// --- CMS API helpers ---

interface Post {
  id: string
  title: string
  content: string
  markdown?: string
}

async function fetchAllPosts(cmsUrl: string, apiKey: string): Promise<Post[]> {
  const all: Post[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch(`${cmsUrl}/api/v1/posts?limit=${limit}&offset=${offset}`, {
      headers: { 'X-API-Key': apiKey },
    })
    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`)
    const body = (await res.json()) as { data: Post[] }
    all.push(...body.data)
    if (body.data.length < limit) break
    offset += limit
  }

  return all
}

async function updatePostMarkdown(cmsUrl: string, apiKey: string, id: string, markdown: string): Promise<void> {
  const res = await fetch(`${cmsUrl}/api/v1/posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ markdown }),
  })
  if (!res.ok) throw new Error(`Failed to update post ${id}: ${res.status}`)
}

// --- Main ---

async function main() {
  const { cmsUrl, cmsApiKey } = readDevVars()
  console.log(`Connecting to CMS at ${cmsUrl}`)

  const posts = await fetchAllPosts(cmsUrl, cmsApiKey)
  console.log(`Found ${posts.length} posts`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const post of posts) {
    if (post.markdown) {
      console.log(`  SKIP  ${post.id} "${post.title}" (already has markdown)`)
      skipped++
      continue
    }

    if (!post.content) {
      console.log(`  SKIP  ${post.id} "${post.title}" (no content)`)
      skipped++
      continue
    }

    try {
      const markdown = await htmlToMarkdown(post.content)
      await updatePostMarkdown(cmsUrl, cmsApiKey, post.id, markdown)
      console.log(`  OK    ${post.id} "${post.title}"`)
      updated++
    } catch (err) {
      console.error(`  FAIL  ${post.id} "${post.title}":`, err instanceof Error ? err.message : err)
      failed++
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
