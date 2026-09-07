/**
 * Seed a running local EmDash instance with the "Looking Ahead" sample posts
 * used by the template design explorations, so every template can be eyeballed
 * on the same realistic content: eight posts, bursty real dates, one long
 * article with citations, and — deliberately — a newest post with NO featured
 * image (the real newest post has none, and templates must survive it).
 *
 * Goes through EmdashCmsClient, the same write path the publisher uses.
 *
 * Prereqs: an EmDash instance at BASE_URL (`pnpm preview:emdash`) seeded with
 * emdash/seed.json, and an `ec_pat_` (mint via ../emdash-spike/src/seed-live-d1.ts).
 *
 * Usage:
 *   BASE_URL=http://localhost:4321 PAT=ec_pat_... pnpm tsx scripts/emdash-seed-looking-ahead.ts
 *   DRY=1 pnpm tsx scripts/emdash-seed-looking-ahead.ts   # print the bodies, write nothing
 *   FORCE=1 …                                            # rewrite posts that already exist
 */
import { readFileSync } from 'node:fs'
import { EmdashCmsClient } from '../packages/shared/src/emdash-cms-client'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321'
const PAT = process.env.PAT
const PUB = process.env.PUB_SLUG ?? 'demo'

/** `DRY=1` prints the converted markdown and exits — checks the conversion with no instance. */
const DRY = process.env.DRY === '1'
/** `FORCE=1` rewrites posts that already exist, instead of skipping them. */
const FORCE = process.env.FORCE === '1'

if (!PAT && !DRY) {
  console.error('✗ Set PAT=ec_pat_... (and optionally BASE_URL), or DRY=1. See the script header.')
  process.exit(2)
}

const AUTHOR = 'Shahar Nechmad'
const IMG = 'https://images.hotmetalapp.com/sessions'

/**
 * The full 1,740-word lead article, scraped from the live publication for round
 * one. It is stored as HTML, but `createPost` feeds `content` through
 * `markdownToPortableText` — so HTML handed over as-is is treated as literal
 * text and the blog renders visible `<p>` tags. Convert it first.
 */
const LEAD_BODY = htmlToMarkdown(
  readFileSync(
    new URL('../design-prototypes/emdash-2026-09-07/_build/article-body.html', import.meta.url),
    'utf8',
  ).trim(),
)

/**
 * A deliberately small HTML → markdown converter, covering exactly the tags the
 * sample bodies use (p, h2, h3, a, strong, em, code, ul/li, blockquote). Not a
 * general-purpose converter: this is prototype seed content, not a content
 * migration path.
 */
function htmlToMarkdown(html: string): string {
  const blocks: string[] = []
  const blockRe = /<(h2|h3|p|blockquote|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi
  let match: RegExpExecArray | null
  while ((match = blockRe.exec(html)) !== null) {
    const [, tag, body] = match
    if (tag.toLowerCase() === 'ul' || tag.toLowerCase() === 'ol') {
      const ordered = tag.toLowerCase() === 'ol'
      const items = [...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(
        (li, i) => `${ordered ? `${i + 1}.` : '-'} ${inline(li[1])}`,
      )
      blocks.push(items.join('\n'))
      continue
    }
    const text = inline(body)
    if (!text) continue
    if (tag.toLowerCase() === 'h2') blocks.push(`## ${text}`)
    else if (tag.toLowerCase() === 'h3') blocks.push(`### ${text}`)
    else if (tag.toLowerCase() === 'blockquote') blocks.push(`> ${text}`)
    else blocks.push(text)
  }
  return blocks.join('\n\n')
}

/** Inline marks inside one block, then unescape the entities markdown carries literally. */
function inline(html: string): string {
  return html
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `[${inline(text)}](${href})`)
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, text) => `**${inline(text)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, text) => `*${inline(text)}*`)
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_m, text) => `\`${text}\``)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const LEAD_CITATIONS = [
  { title: 'Bots have officially overtaken humans on the internet', publisher: 'techspot.com', url: 'https://www.techspot.com/news/112657-bots-have-officially-overtaken-humans-internet-cloudflare.html' },
  { title: 'Bot web traffic has overtaken human web traffic, data shows', publisher: 'nbcnews.com', url: 'https://www.nbcnews.com/tech/tech-news/bot-web-traffic-overtaken-human-web-traffic-data-shows-rcna348522' },
  { title: 'Agentic Commerce: A Guide for Businesses', publisher: 'stripe.com', url: 'https://stripe.com/resources/more/agentic-commerce' },
  { title: 'Developing an open standard for agentic commerce', publisher: 'stripe.com', url: 'https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce' },
  { title: 'Introducing our agentic commerce solutions', publisher: 'stripe.com', url: 'https://stripe.com/blog/introducing-our-agentic-commerce-solutions' },
  { title: 'Introducing the Agentic Commerce Suite', publisher: 'stripe.com', url: 'https://stripe.com/blog/agentic-commerce-suite' },
  { title: 'How to prepare for agentic commerce: A technical field guide', publisher: 'stripe.com', url: 'https://stripe.com/guides/how-to-prepare-for-agentic-commerce-technical-field-guide' },
  { title: 'Agents and AI on Stripe', publisher: 'docs.stripe.com', url: 'https://docs.stripe.com/agents' },
  { title: 'WebMCP | AI on Chrome', publisher: 'developer.chrome.com', url: 'https://developer.chrome.com/docs/ai/webmcp' },
  { title: 'WebMCP: Turn Your Website Into a Tool for AI Agents', publisher: 'codewithseb.com', url: 'https://www.codewithseb.com/blog/webmcp-website-ai-agent-tools-guide' },
  { title: 'Building the business model for the agentic Internet', publisher: 'blog.cloudflare.com', url: 'https://blog.cloudflare.com/agentic-internet-bot-report/' },
  { title: 'Model Context Protocol Introduction', publisher: 'modelcontextprotocol.io', url: 'https://modelcontextprotocol.io/introduction' },
  { title: 'The agent-first approach to building products', publisher: 'dev.to', url: 'https://dev.to/adamklein/the-agent-first-approach-to-building-products-51oj' },
]

/** A short markdown body for the archive posts: the hook, a sub-heading, a list and a quote. */
function shortBody(hook: string, title: string): string {
  return [
    hook,
    'This is a shorter piece. It exists so that the archive has real titles, real dates and a real mix of lengths, which is what a template actually has to lay out.',
    '## What this is about',
    `${title} is the kind of claim this publication makes: opinionated, dated, and meant to be judged later. The point of seeding it here is to see how each template treats a post that is neither the lead nor a long read.`,
    ['- A [link](https://example.com) to check link styling', '- **Bold** and *italic* runs, and `inline code`'].join('\n'),
    '> A pull quote, so a template that styles blockquotes has one to style.',
    'If you are looking at this in a template preview, compare it with the lead article, which has the full text, thirteen citations and no featured image.',
  ].join('\n\n')
}

interface Seed {
  slug: string
  title: string
  subtitle?: string
  hook: string
  topics: string
  tags: string
  publishedAt: string
  featuredImage?: string
  content?: string
  citations?: { title: string; publisher: string; url: string }[]
}

const POSTS: Seed[] = [
  {
    slug: 'agent-first-development-is-the-future',
    title: 'Agent First Development is The Future',
    subtitle: 'Mobile-first was a rethink of where you start. This is the same move, one layer deeper.',
    hook: 'In June 2026, bot and agent traffic passed human traffic on the internet for the first time. The winning products will be the ones an agent can actually use.',
    topics: 'Product strategy',
    tags: 'agent-first development, api design, product strategy',
    publishedAt: '2026-09-02T09:00:00.000Z',
    content: LEAD_BODY,
    citations: LEAD_CITATIONS,
  },
  {
    slug: 'the-iran-war-is-not-really-about-iran',
    title: 'The Iran War Is Not Really About Iran',
    hook: 'The US strike on Iran is a message aimed at Beijing. China buys 90–95% of Iran’s oil, and a destabilized regime puts that lifeline at risk.',
    topics: 'Geopolitics',
    tags: 'geopolitics, china, energy',
    publishedAt: '2026-03-04T09:00:00.000Z',
    featuredImage: `${IMG}/0b42ee68-f91b-4667-9623-1336b749a747/3e0a7008-7d6e-4919-8c1e-742ae1ebc93a.jpg`,
  },
  {
    slug: 'openai-pentagon-deal-red-lines',
    title: 'OpenAI’s Pentagon Deal and the Red Lines Problem',
    hook: 'OpenAI signed a Pentagon deal while the US military was already running Claude — the model it had officially blacklisted — on live operations.',
    topics: 'AI & policy',
    tags: 'policy, defense, openai',
    publishedAt: '2026-03-01T09:00:00.000Z',
    featuredImage: `${IMG}/e6f7c941-9efa-4871-a4f8-e15780ff891c/9e104c50-0836-46fd-9e1b-cd69666f5bb6.jpg`,
  },
  {
    slug: 'should-ai-agents-be-friends',
    title: 'Should AI Agents be Friends?',
    hook: 'Large-scale research shows agents simulate social behavior rather than genuinely socialize. The real question isn’t whether they can — it’s whether they should.',
    topics: 'Research',
    tags: 'research, multi-agent, society',
    publishedAt: '2026-02-24T09:00:00.000Z',
    featuredImage: `${IMG}/f6e35cec-069b-47ab-aef3-650dd23edcd9/7f36f34d-14bf-4c3c-bf14-ac019ef28d5c.jpg`,
  },
  {
    slug: 'from-copilot-to-colleague',
    title: 'From Copilot to Colleague: The Five Pillars of an Agentic AI Strategy',
    hook: 'Most “AI strategies” are a list of tools. Here is the structure that survives contact with an actual org chart.',
    topics: 'Strategy',
    tags: 'strategy, enterprise',
    publishedAt: '2026-02-20T09:00:00.000Z',
    featuredImage: `${IMG}/72d44556-3f5c-4b62-8652-922bc24a86f6/1fddf092-37f7-44d0-8632-0040621e82bb.jpg`,
  },
  {
    slug: 'the-hyper-learner',
    title: 'The Hyper Learner',
    hook: 'The most valuable skill of the next decade isn’t prompting. It’s the ability to absorb an entire field in a weekend.',
    topics: 'Essay',
    tags: 'learning, careers',
    publishedAt: '2026-02-18T09:00:00.000Z',
    featuredImage: `${IMG}/9db0c1e8-8b94-48d9-8134-bfc8d49863c9/8d403125-1a98-477b-8b6a-d1041715bec1.jpg`,
  },
  {
    slug: 'github-agentic-workflows',
    title: 'GitHub’s Agentic Workflows and the Coming ‘Continuous AI’ Era',
    hook: 'What continuous integration did for tests, continuous AI is about to do for everything else a solo founder can’t staff.',
    topics: 'Tools',
    tags: 'tools, github, automation',
    publishedAt: '2026-02-17T09:00:00.000Z',
    featuredImage: `${IMG}/c75e2033-da03-4d8a-ba75-0cf783ffe48a/02a65b61-c6bd-429b-bf13-6a01ce334a53.jpg`,
  },
  {
    slug: 'how-i-10x-d-my-ai-coding-productivity',
    title: 'How I 10x’d My AI Coding Productivity (And You Can Too)',
    hook: 'Nine months of working almost entirely through coding agents, and the handful of habits that made the difference.',
    topics: 'Practice',
    tags: 'coding agents, practice',
    publishedAt: '2026-02-16T09:00:00.000Z',
    featuredImage: `${IMG}/4b95c13e-66bc-4ac2-acd0-b7881eadf5d4/2cf393d2-aef5-4adc-a991-3fb31682d374.jpg`,
  },
]

async function main() {
  if (DRY) {
    for (const seed of POSTS) {
      const md = seed.content ?? shortBody(seed.hook, seed.title)
      console.log(`\n──── ${seed.slug} (${md.length} chars) ────\n`)
      console.log(md.length > 1200 ? `${md.slice(0, 1200)}\n… (${md.split('\n\n').length} blocks)` : md)
    }
    return
  }

  const client = new EmdashCmsClient(BASE_URL, PAT!)
  const existing = await client.listPosts({ publicationId: PUB, limit: 100 })

  for (const seed of POSTS) {
    const existingPost = existing.data.find((p) => p.slug === seed.slug)
    if (existingPost && !FORCE) {
      console.log(`  = ${seed.slug} (already present; FORCE=1 to rewrite)`)
      continue
    }
    const content = seed.content ?? shortBody(seed.hook, seed.title)
    const fields = {
      publicationId: PUB,
      title: seed.title,
      subtitle: seed.subtitle,
      slug: seed.slug,
      hook: seed.hook,
      excerpt: seed.hook,
      content,
      markdown: content,
      status: 'published',
      author: AUTHOR,
      tags: seed.tags,
      topics: seed.topics,
      featuredImage: seed.featuredImage,
      citations: seed.citations,
      publishedAt: seed.publishedAt,
    } as Parameters<EmdashCmsClient['createPost']>[0]

    const post = existingPost
      ? await client.updatePost(existingPost.id, fields)
      : await client.createPost(fields)
    console.log(`  ${existingPost ? '~' : '+'} ${post.slug}  (${post.publishedAt ?? 'no date'})`)
  }
  console.log(`\nDone. Home: ${BASE_URL}/  Lead: ${BASE_URL}/${POSTS[0].slug}`)
}

main().catch((e) => {
  console.error('✗ Failed:', e)
  process.exit(1)
})
