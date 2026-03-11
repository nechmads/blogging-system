# Public API for AI Agents

**Owner:** Shahar
**Status:** Planning
**Last updated:** 2026-03-11

---

## Overview

Build a public REST API that AI agents (and other integrations) can use to interact with Hot Metal on behalf of a user. The API enables the full content lifecycle: create publications, manage settings/topics, generate drafts autonomously, and publish posts — all without touching the web UI.

### Design Principles

1. **Thin API layer** — The `/agents-api/v1/` route handlers are thin wrappers that call shared action functions. These same actions can be reused by the admin frontend API, MCP server, or any future interface.
2. **Separate from frontend API** — Lives in its own folder (`apps/web/src/agents-api/v1/`) with its own auth middleware, clearly separated from the existing `/api/*` (Clerk-authenticated frontend routes) and `/internal/*` (service-to-service routes).
3. **API key authentication** — Uses the `hm_*` user API keys we already built. No Clerk JWTs, no cookies — just a Bearer token.
4. **One-shot draft generation** — Reuses the existing auto-write pipeline (same as content-scout's `full-auto` mode) so agents can request "write a post about X" and get a complete draft back in a single call.
5. **Consistent with existing patterns** — Uses the same DAL RPC calls, quota checks, ownership verification, and error response shapes as the rest of the app.
6. **Webhook callbacks for async operations** — Long-running actions (draft generation, scout) accept an optional `webhookUrl`. When provided, the API returns immediately with a `202 Accepted` and calls the webhook when the work completes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  apps/web/src                                           │
│                                                         │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  /api/*      │  │/agents-api/v1/*│  │  /internal/*  │ │
│  │  (frontend)  │  │  (public)      │  │  (S2S)        │ │
│  │  Clerk JWT   │  │  API key       │  │  X-Internal   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘ │
│         │                 │                  │          │
│         └─────────┬───────┴──────────────────┘          │
│                   ▼                                     │
│         ┌─────────────────┐                             │
│         │    actions/      │  ← Shared business logic   │
│         │  (pure functions │    No HTTP concerns         │
│         │   taking env +   │    Reusable by MCP, etc.   │
│         │   params)        │                             │
│         └────────┬────────┘                             │
│                  │                                      │
│         ┌────────┴────────┐                             │
│         │  DAL / DO / CMS │                             │
│         └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/web/src/
├── actions/                    ← NEW: shared business logic
│   ├── errors.ts               # ActionError, NotFoundError, ValidationError, etc.
│   ├── publications.ts         # create, update, delete, list publications
│   ├── topics.ts               # CRUD topics
│   ├── drafts.ts               # auto-write, get draft, get session
│   ├── publish.ts              # publish draft to CMS + social
│   └── ideas.ts                # list, get, promote ideas
│
├── agents-api/v1/              ← NEW: public API routes
│   ├── index.ts                # Hono router, mounts all sub-routers + error handler
│   ├── me.ts                   # GET /agents-api/v1/me
│   ├── publications.ts         # /agents-api/v1/publications/* (CRUD + list posts)
│   ├── topics.ts               # /agents-api/v1/publications/:pubId/topics/*
│   ├── drafts.ts               # /agents-api/v1/publications/:pubId/drafts/generate
│   │                           # /agents-api/v1/sessions/:id (status + drafts)
│   │                           # /agents-api/v1/sessions/:id/publish
│   ├── ideas.ts                # /agents-api/v1/publications/:pubId/ideas/*
│   ├── styles.ts               # /agents-api/v1/styles/*
│   └── scout.ts                # /agents-api/v1/publications/:pubId/scout/run
│
├── middleware/
│   └── api-key-auth.ts         ← NEW: API key auth middleware
│
└── server.ts                   # Mount /agents-api/* with api-key-auth

packages/shared/src/
└── webhook.ts                  ← NEW: shared webhook delivery utility
                                # (in @hotmetal/shared so both apps/web and
                                #  services/content-scout can import it)
```

---

## Key Reference Files

Implementing agents should read these files to understand existing patterns before writing new code:

### Authentication & Middleware
| File | What to learn |
|------|--------------|
| `apps/web/src/middleware/clerk-auth.ts` | How context variables (`userId`, `userEmail`, `userName`, `userTier`) are set — the API key middleware must set the same variables |
| `apps/web/src/middleware/ensure-user.ts` | How `userTier` is loaded from DAL after auth |
| `apps/web/src/middleware/ownership.ts` | `verifyPublicationOwnership()` helper — returns 404 (not 403) to avoid leaking resource existence. Reuse or mirror this pattern. |
| `apps/web/src/middleware/internal-auth.ts` | Service-to-service auth pattern (for comparison) |
| `apps/web/src/server.ts` | Route mounting order, `AppEnv` type definition, how middleware is applied per path prefix |

### Existing API Routes (patterns to follow)
| File | What to learn |
|------|--------------|
| `apps/web/src/api/publications.ts` | Publication CRUD: slug validation (`/^[a-z0-9-]+$/`), CMS publication creation via `CmsApi`, quota checks, ownership verification |
| `apps/web/src/api/topics.ts` | Topic CRUD with publication ownership check |
| `apps/web/src/api/sessions.ts` | Session creation, chat token generation, listing with filters |
| `apps/web/src/api/publish.ts` | Full publish flow: proxy to WriterAgent DO, session status update, social share dispatch via PUBLISHER service, feed regeneration |
| `apps/web/src/api/notifications.ts` | Simplest API route pattern — good template for new routes |

### Auto-Write Pipeline (the flow we reuse for draft generation)
| File | What to learn |
|------|--------------|
| `services/content-scout/src/steps/auto-write.ts` | The 3-step pipeline: create session → auto-write → publish. `buildSeedContext()` and `buildWriteInstruction()` functions to adapt. |
| `apps/web/src/api/internal.ts` | Internal endpoints the scout calls. Shows how to proxy to WriterAgent DO via `getAgentByName`. |
| `apps/web/src/agent/writer-agent.ts` | `handleAutoWrite()` (line ~417) — the DO method that runs autonomous writing. `handlePublishToCms()` (line ~696) — publishes a draft to CMS. |

### Quota System
| File | What to learn |
|------|--------------|
| `apps/web/src/lib/quota.ts` | `checkPublicationQuota()`, `checkTopicQuota()`, `checkPostsPerWeekQuota()` — existing quota helpers. These take Hono `Context` so can't be reused directly in action functions. Extract the logic. |
| `packages/shared/src/tiers.ts` | `getTierLimits()`, `isUnlimited()` — tier limit definitions |

### Types & DAL
| File | What to learn |
|------|--------------|
| `services/data-layer/src/types.ts` | All DAL input/output types |
| `services/data-layer/src/index.ts` | `DataLayerApi` interface — all available RPC methods |
| `apps/web/env.d.ts` | `Env` type with all service bindings (DAL, WRITER_AGENT, CONTENT_SCOUT, PUBLISHER, etc.) |

### Key Code Patterns

**Calling the WriterAgent Durable Object:**

```typescript
import { getAgentByName } from 'agents'
import type { WriterAgent } from '../agent/writer-agent'

// Get a reference to the DO instance for this session
const agent = await getAgentByName<Env, WriterAgent>(c.env.WRITER_AGENT, sessionId)

// Call the DO's HTTP handler (the DO routes these to handleAutoWrite, handlePublishToCms, etc.)
const res = await agent.fetch(new Request('https://do/auto-write', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: instruction }),
}))
const result = await res.json()
```

**Using `waitUntil()` in Hono (Cloudflare Workers):**

```typescript
// Access ExecutionContext via Hono's c.executionCtx
c.executionCtx.waitUntil(
  doBackgroundWork().catch((err) => console.error('Background task failed:', err))
)
// Return 202 immediately — the background work continues after response is sent
return c.json({ data: { sessionId, status: 'generating' } }, 202)
```

**Ownership check pattern (return 404 not 403):**

```typescript
const pub = await deps.DAL.getPublicationById(pubId)
if (!pub || pub.userId !== userId) {
  throw new NotFoundError('Publication not found')
}
```

---

## Phase 0: Shared Action Layer

**Goal:** Extract business logic from existing `/api/*` and `/internal/*` routes into pure action functions that both the existing frontend API and the new public API can call.

### Actions to extract

Each action function takes explicit dependencies (DAL, env bindings, etc.) as parameters — not Hono context objects. This makes them reusable by any transport (HTTP, MCP, WebSocket, etc.).

#### `actions/publications.ts`

```typescript
interface ActionDeps {
  DAL: DataLayerApi
  CMS_URL: string
  CMS_API_KEY: string
}

// Extracted from apps/web/src/api/publications.ts
async function createPublication(deps: ActionDeps, userId: string, userTier: string, input: CreatePublicationInput): Promise<Publication>
async function listPublications(deps: ActionDeps, userId: string): Promise<Publication[]>
async function getPublication(deps: ActionDeps, userId: string, pubId: string): Promise<Publication & { topics: Topic[] }>
async function updatePublication(deps: ActionDeps, userId: string, pubId: string, input: UpdatePublicationInput): Promise<Publication>
async function deletePublication(deps: ActionDeps, userId: string, pubId: string): Promise<void>
```

Each function includes the ownership check + quota check that currently lives inline in the route handler. Throws typed errors (e.g., `NotFoundError`, `QuotaExceededError`, `ValidationError`) that the route handlers catch and convert to HTTP responses.

#### `actions/topics.ts`

```typescript
async function createTopic(deps, userId: string, userTier: string, pubId: string, input: CreateTopicInput): Promise<Topic>
async function listTopics(deps, userId: string, pubId: string): Promise<Topic[]>
async function updateTopic(deps, userId: string, topicId: string, input: UpdateTopicInput): Promise<Topic>
async function deleteTopic(deps, userId: string, topicId: string): Promise<void>
```

#### `actions/drafts.ts`

This is the most important action — it encapsulates the auto-write flow that currently lives split across `content-scout/steps/auto-write.ts` and `api/internal.ts`.

```typescript
interface DraftDeps extends ActionDeps {
  WRITER_AGENT: DurableObjectNamespace
  internalFetch: (path: string, init: RequestInit) => Promise<Response>
  // OR directly: env for getAgentByName
}

interface GenerateDraftInput {
  publicationId: string
  title: string
  instructions: string      // what to write about
  styleId?: string           // optional writing style override
  autoPublish?: boolean      // default: false
}

interface GenerateDraftResult {
  sessionId: string
  draft: {
    version: number
    title: string
    content: string          // markdown
    wordCount: number
  }
  published?: {
    postId: string
    slug: string
    url: string
  }
}

async function generateDraft(deps: DraftDeps, userId: string, userTier: string, input: GenerateDraftInput): Promise<GenerateDraftResult>
```

**Implementation:** Reuses the same pipeline as the content-scout auto-write:
1. Validate publication ownership + quota
2. Build seed context from `input.instructions` (simpler than the idea-based one — no sources needed unless the agent provides them)
3. Create a session via DAL
4. Call WriterAgent DO's `handleAutoWrite` (via `getAgentByName`)
5. If `autoPublish`, call WriterAgent DO's `handlePublishToCms`
6. Return draft content and optional publish result

#### `actions/publish.ts`

```typescript
async function publishDraft(deps, userId: string, userTier: string, sessionId: string, input: PublishInput): Promise<PublishResult>
```

#### `actions/ideas.ts`

```typescript
async function listIdeas(deps, userId: string, pubId: string, filters?: { status?: IdeaStatus }): Promise<Idea[]>
async function getIdea(deps, userId: string, ideaId: string): Promise<Idea>
async function promoteIdea(deps, userId: string, ideaId: string): Promise<Session>
```

### Error types

```typescript
// actions/errors.ts
class ActionError extends Error {
  constructor(message: string, public code: string, public status: number) { ... }
}
class NotFoundError extends ActionError { ... }       // 404
class ForbiddenError extends ActionError { ... }       // 403
class ValidationError extends ActionError { ... }      // 400
class QuotaExceededError extends ActionError { ... }   // 403, includes limit/current
```

### Migration strategy for existing routes

We do **not** need to rewrite all existing `/api/*` routes at once. The plan:
1. Create the actions layer with the functions above
2. Wire the new `/agents-api/v1/*` routes to call these actions
3. **Optionally** refactor existing `/api/*` routes to call the same actions later (nice-to-have, not blocking)
4. The existing `/internal/*` routes stay unchanged for now — the content-scout still calls them directly via service binding

---

## Phase 1: API Key Auth Middleware

**Goal:** Create a middleware that authenticates requests using `hm_*` API keys.

### `middleware/api-key-auth.ts`

```typescript
import type { Context, Next } from 'hono'
import type { AppEnv } from '../server'

export async function apiKeyAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer hm_')) {
    return c.json({ error: 'Missing or invalid API key. Use: Authorization: Bearer hm_...' }, 401)
  }

  const rawToken = authHeader.slice(7) // strip "Bearer "
  const userId = await c.env.DAL.validateUserApiKey(rawToken)
  if (!userId) {
    return c.json({ error: 'Invalid or revoked API key' }, 401)
  }

  // Load user for tier info (same as ensureUser does for Clerk)
  const user = await c.env.DAL.getUserById(userId)
  if (!user) {
    return c.json({ error: 'User account not found' }, 401)
  }

  // Set same context variables as clerkAuth + ensureUser
  c.set('userId', user.id)
  c.set('userEmail', user.email)
  c.set('userName', user.name)
  c.set('userTier', user.tier)

  await next()
}
```

### Mount in `server.ts`

```typescript
import { apiKeyAuth } from './middleware/api-key-auth'
import agentsApiV1 from './agents-api/v1'

// After existing routes, before the SPA fallback
app.use('/agents-api/*', apiKeyAuth)
app.route('/agents-api/v1', agentsApiV1)
```

---

## Phase 2: Core Read Endpoints

**Goal:** Let agents discover what's in their account.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /agents-api/v1/me | Current user info (id, email, name, tier) |
| GET | /agents-api/v1/publications | List all publications |
| GET | /agents-api/v1/publications/:id | Get publication details + topics |
| GET | /agents-api/v1/publications/:id/topics | List topics for a publication |
| GET | /agents-api/v1/publications/:id/ideas | List ideas (filterable by ?status=) |
| GET | /agents-api/v1/publications/:id/posts | List published posts |
| GET | /agents-api/v1/styles | List available writing styles |

### Response format

All responses follow a consistent envelope:

```json
// Single resource
{ "data": { ... } }

// Collection
{ "data": [ ... ] }

// Error
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

### Implementation

Each route handler is ~5-10 lines: parse params → call action → return `c.json({ data: result })`. For this phase, the actions are simple enough (just DAL calls + ownership checks) that we can implement them inline or extract them as we go.

---

## Phase 3: Write Endpoints (CRUD)

**Goal:** Let agents create and manage publications, topics, and settings.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /agents-api/v1/publications | Create a publication |
| PATCH | /agents-api/v1/publications/:id | Update publication settings |
| DELETE | /agents-api/v1/publications/:id | Delete a publication |
| POST | /agents-api/v1/publications/:id/topics | Create a topic |
| PATCH | /agents-api/v1/topics/:id | Update a topic |
| DELETE | /agents-api/v1/topics/:id | Delete a topic |

### Input validation

All write endpoints validate inputs and return 400 with descriptive errors:

```json
{
  "error": "Invalid slug format. Use lowercase letters, numbers, and hyphens only.",
  "code": "VALIDATION_ERROR"
}
```

Slug validation, timezone validation, and autoPublishMode validation are extracted into the action layer so they're shared between `/api/*` and `/agents-api/v1/*`.

---

## Phase 4: Draft Generation (The Key Feature)

**Goal:** Let an agent request "write a post about X" and get back a complete draft.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /agents-api/v1/publications/:id/drafts/generate | Generate a draft autonomously |
| GET | /agents-api/v1/sessions/:id | Get session status + draft |
| GET | /agents-api/v1/sessions/:id/drafts/:version | Get specific draft version content |

### `POST /agents-api/v1/publications/:id/drafts/generate`

**Request body:**

```json
{
  "title": "Why Edge Computing Changes Everything",
  "instructions": "Write a blog post about the shift from centralized cloud to edge computing. Cover: performance benefits, use cases (IoT, gaming, AR), challenges (consistency, debugging), and where Cloudflare Workers fits. Include real-world examples.",
  "styleId": "optional-style-uuid",
  "autoPublish": false,
  "webhookUrl": "https://my-agent.example.com/hooks/hotmetal"
}
```

### Sync vs Async behavior

The endpoint supports two modes based on whether `webhookUrl` is provided:

**Without `webhookUrl` (synchronous):** The request blocks until the draft is complete and returns the full result. This can take 1-3 minutes.

```json
{
  "data": {
    "sessionId": "uuid",
    "draft": {
      "version": 1,
      "title": "Why Edge Computing Changes Everything",
      "content": "# Why Edge Computing Changes Everything\n\n...",
      "wordCount": 1247
    },
    "status": "draft_ready"
  }
}
```

**With `webhookUrl` (async):** Returns immediately with `202 Accepted` and the `sessionId`. When the work finishes, Hot Metal sends a POST to the `webhookUrl` with the full result.

Immediate response (202):

```json
{
  "data": {
    "sessionId": "uuid",
    "status": "generating"
  }
}
```

Webhook POST body (sent when done):

```json
{
  "event": "draft.completed",
  "sessionId": "uuid",
  "data": {
    "draft": {
      "version": 1,
      "title": "Why Edge Computing Changes Everything",
      "content": "# Why Edge Computing Changes Everything\n\n...",
      "wordCount": 1247
    },
    "status": "draft_ready"
  },
  "timestamp": "2026-03-11T14:30:00Z"
}
```

If `autoPublish: true`, the webhook body includes `published`:

```json
{
  "event": "draft.published",
  "sessionId": "uuid",
  "data": {
    "draft": { ... },
    "published": {
      "postId": "cms-post-id",
      "slug": "why-edge-computing-changes-everything",
      "url": "https://my-pub.hotmetalapp.com/why-edge-computing-changes-everything"
    },
    "status": "published"
  },
  "timestamp": "2026-03-11T14:30:00Z"
}
```

On failure:

```json
{
  "event": "draft.failed",
  "sessionId": "uuid",
  "error": "Auto-write did not produce a draft",
  "timestamp": "2026-03-11T14:30:00Z"
}
```

**Polling fallback:** Even with webhooks, the agent can always poll `GET /agents-api/v1/sessions/:id` as a fallback if the webhook delivery fails.

### Implementation

The `generateDraft` action:

```
1.  Verify user owns publication
2.  Check quota (postsPerWeek)
3.  Resolve writing style (input.styleId → publication.styleId → default)
4.  Build seedContext from title + instructions
5.  Create DAL session (publicationId, styleId, seedContext)
6.  If webhookUrl provided:
    a. Return 202 with { sessionId, status: 'generating' }
    b. Use waitUntil() to continue processing in the background (steps 7-10)
7.  Get WriterAgent DO by sessionId
8.  Call DO.handleAutoWrite(buildInstruction(title, instructions))
    → Agent writes draft using research tools + save_draft
    → Returns { success, draft }
9.  If autoPublish:
    a. Call DO.handlePublishToCms(slug, author)
    b. Update session status = 'completed'
    c. Trigger feed regeneration
10. If webhookUrl provided:
    → POST result to webhookUrl (with retry, see Webhook Delivery below)
    Otherwise:
    → Return result directly in HTTP response
```

The key difference from the content-scout pipeline: the agent (the caller) provides the title and instructions directly, instead of having them come from a generated idea. The seedContext format and buildInstruction helper are simpler.

### Timeout handling

Without `webhookUrl`, the auto-write step in the WriterAgent DO has a 9-minute hard timeout with AbortController. The HTTP response waits for completion. Cloudflare Workers have a 30-second wall-clock limit for normal requests, but the DO proxy extends this because the DO itself handles the long-running work.

If the synchronous request times out, the draft may still get saved in the DO — the agent can poll `GET /agents-api/v1/sessions/:id` to check status.

Using `webhookUrl` is the recommended approach for agents, as it avoids timeout concerns entirely.

---

## Phase 5: Publish Endpoint

**Goal:** Let agents publish a completed draft.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /agents-api/v1/sessions/:id/publish | Publish a session's draft |

**Request body:**

```json
{
  "slug": "my-post-slug",
  "author": "Shahar",
  "tags": "edge, cloudflare, devops",
  "excerpt": "A deep dive into edge computing...",
  "publishToLinkedIn": false,
  "publishToTwitter": false,
  "tweetText": "optional custom tweet",
  "linkedInText": "optional custom linkedin post"
}
```

**Response:**

```json
{
  "data": {
    "postId": "cms-post-id",
    "slug": "my-post-slug",
    "url": "https://my-pub.hotmetalapp.com/my-post-slug",
    "social": {
      "linkedin": { "success": true },
      "twitter": { "success": true, "tweetId": "..." }
    }
  }
}
```

### Implementation

Reuses the same `handlePublishToCms` logic from the WriterAgent DO. The action function:
1. Verify session ownership
2. Check quota (if new publish, not update)
3. Proxy to DO `/publish`
4. On success, update DAL session status
5. Dispatch social shares if requested
6. Trigger feed regeneration

---

## Phase 6: Content Scout Trigger

**Goal:** Let agents trigger the content scout on demand.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /agents-api/v1/publications/:id/scout/run | Trigger content scout |

**Request body:**

```json
{
  "webhookUrl": "https://my-agent.example.com/hooks/hotmetal"
}
```

Both fields are optional. Without `webhookUrl`, returns synchronously with `{ "data": { "queued": true } }` (the scout runs in the background via queue — the endpoint doesn't wait for scout completion either way).

With `webhookUrl`, the scout workflow sends a POST when it finishes:

```json
{
  "event": "scout.completed",
  "publicationId": "uuid",
  "data": {
    "ideasFound": 3,
    "draftWritten": true,
    "ideaTitle": "Why Edge Computing Changes Everything"
  },
  "timestamp": "2026-03-11T14:35:00Z"
}
```

**Implementation note:** The scout runs as a Cloudflare Workflow (multi-step, durable). To support the webhook callback, the `webhookUrl` needs to be passed through to the workflow params and called in a final step after the existing 6 steps complete. This requires a small change to the ScoutWorkflow in content-scout.

---

## Phase 7: Documentation & Discovery

**Goal:** Make the API discoverable by agents.

### `llms.txt`

Add `llms.txt` to the marketing site root. Content:

```
# Hot Metal

> AI-powered blogging platform with automated content creation and multi-channel publishing.

Hot Metal helps you create, manage, and publish blog content. Our API enables programmatic access for AI agents and integrations.

## API

Base URL: https://app.hotmetalapp.com/agents-api/v1
Authentication: Bearer token (API key from Settings > API Keys)

## Documentation

- [API Reference](https://hotmetalapp.com/docs/api)
- [OpenAPI Spec](https://app.hotmetalapp.com/agents-api/v1/openapi.json)

## Key Capabilities

- Create and manage blog publications
- Generate blog posts from instructions using AI
- Publish posts to your blog and social channels (LinkedIn, X)
- Manage writing styles, topics, and content ideas
```

### OpenAPI spec

Serve `GET /agents-api/v1/openapi.json` that returns a full OpenAPI 3.1 spec describing all endpoints, request/response schemas, authentication, and error codes. This can be generated from the route definitions or maintained as a static file.

### `/docs/api` page

Add a human-readable API documentation page to the marketing site / web app. Covers:
- Getting started (create API key, make first request)
- Authentication
- All endpoints with examples
- Error handling
- Rate limits
- Code examples (curl, Python, TypeScript)

---

## Implementation TODOs

Ordered task list for implementation. Tasks marked `[PARALLEL]` can be assigned to separate agents working in isolated worktrees simultaneously. Tasks marked `[SEQUENTIAL]` must complete before the next group starts.

### Step 1: Foundation `[SEQUENTIAL]`

Must be done first — everything else depends on this.

- [ ] **1.1 Action error types** — Create `apps/web/src/actions/errors.ts` with `ActionError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, `QuotaExceededError` classes. These are thrown by action functions and caught by route handlers to produce consistent error responses.
- [ ] **1.2 API key auth middleware** — Create `apps/web/src/middleware/api-key-auth.ts`. Validates `Bearer hm_*` tokens via `DAL.validateUserApiKey()`, loads user record, sets `userId`/`userEmail`/`userName`/`userTier` context variables (same as Clerk auth). Returns `401` with descriptive error on failure.
- [ ] **1.3 Router scaffold** — Create `apps/web/src/agents-api/v1/index.ts` as a Hono router that will mount all sub-routers. Create stub files for each route module (`me.ts`, `publications.ts`, `topics.ts`, `ideas.ts`, `drafts.ts`, `styles.ts`, `scout.ts`) exporting empty Hono routers. The `index.ts` should import and mount each router with `app.route('/', me)`, etc.
- [ ] **1.4 Mount in server.ts** — Add `app.use('/agents-api/*', apiKeyAuth)` and `app.route('/agents-api/v1', agentsApiV1)` to `server.ts`. Place it after the existing `/api/*` routes and before the SPA fallback. Also add CORS middleware for `/agents-api/*` that allows any origin (agents call from various environments) — use Hono's built-in `cors()` middleware with `origin: '*'`.
- [ ] **1.5 Error handler** — Add an `onError` handler in `agents-api/v1/index.ts` that catches `ActionError` subclasses and maps them to `{ error, code }` JSON responses with the correct HTTP status. Unknown errors return 500 with a generic message.

### Step 2: Read & Write Endpoints + Webhook Utility `[PARALLEL]`

All tasks in this step can run simultaneously in separate worktrees. Each task only modifies its own route file (created as a stub in Step 1) plus `actions/` files.

- [ ] **2A: `/me` endpoint** — `agents-api/v1/me.ts`: `GET /me` returns `{ data: { id, email, name, tier } }`. Trivial — reads from context variables set by auth middleware.
- [ ] **2B: Publications endpoints** — `agents-api/v1/publications.ts` + `actions/publications.ts`:
  - `GET /publications` — list user's publications
  - `GET /publications/:id` — get publication with topics
  - `GET /publications/:id/posts` — list published posts (calls CMS API via `CmsApi.listPosts`)
  - `POST /publications` — create publication (with slug/name validation, quota check). See `apps/web/src/api/publications.ts` for slug validation regex and CMS publication creation.
  - `PATCH /publications/:id` — update settings (with ownership check)
  - `DELETE /publications/:id` — delete (with ownership check)
- [ ] **2C: Topics endpoints** — `agents-api/v1/topics.ts` + `actions/topics.ts`:
  - `GET /publications/:pubId/topics` — list topics
  - `POST /publications/:pubId/topics` — create topic (with quota check)
  - `PATCH /topics/:id` — update topic (with ownership check via publication)
  - `DELETE /topics/:id` — delete topic (with ownership check)
- [ ] **2D: Ideas endpoints** — `agents-api/v1/ideas.ts` + `actions/ideas.ts`:
  - `GET /publications/:pubId/ideas` — list ideas (filterable by `?status=`)
  - `GET /ideas/:id` — get idea detail (with ownership check via publication)
- [ ] **2E: Styles endpoint** — `agents-api/v1/styles.ts`:
  - `GET /styles` — list user's custom styles + prebuilt styles
- [ ] **2F: Webhook delivery utility** — Create `packages/shared/src/webhook.ts` in the `@hotmetal/shared` package (so both `apps/web` and `services/content-scout` can import it). Includes `validateWebhookUrl()` (HTTPS-only, SSRF protection blocking private IPs, max 2048 chars) and `deliverWebhook()` (HMAC-SHA256 signing with `X-HotMetal-Signature` header, retry logic with 3 attempts at 5s/30s/120s backoff, 10s per-attempt timeout). Export both from the package's index. This is a standalone utility with no route dependencies.

### Step 3: Draft Generation + Scout Trigger `[PARALLEL]`

Both tasks can run simultaneously. Each depends on Step 1 (router) and Step 2F (webhook utility).

> **Wait for:** Step 1 complete + Step 2F (webhook utility) complete.

- [ ] **3A: Draft generation endpoint** — `agents-api/v1/posts.ts` + `actions/drafts.ts`. The core feature. Includes:
  - `POST /publications/:id/drafts/generate` — accepts `title`, `instructions`, `styleId?`, `autoPublish?`, `webhookUrl?`. Without webhook: blocks until draft complete, returns full result. With webhook: returns `202` with `sessionId`, fires `waitUntil()` for background processing, calls webhook on completion.
  - `GET /sessions/:id` — get session status + current draft summary
  - `GET /sessions/:id/drafts/:version` — get specific draft content
  - Action logic: ownership check → quota check → resolve style → create session → call WriterAgent DO `handleAutoWrite` → optionally `handlePublishToCms` → return/webhook result.
  - Reuses the same WriterAgent DO auto-write path as the content-scout pipeline.
- [ ] **3B: Scout trigger endpoint** — `agents-api/v1/scout.ts`:
  - `POST /publications/:id/scout/run` — accepts `webhookUrl?`. Proxies to CONTENT_SCOUT service binding. Returns `{ data: { queued: true } }`.
  - Pass `webhookUrl` through to the scout queue message so the workflow can call it on completion.

### Step 4: Publish Endpoint `[SEQUENTIAL]`

> **Wait for:** Step 3A complete (needs sessions/drafts to exist).

- [ ] **4A: Publish endpoint** — Add to `agents-api/v1/posts.ts`:
  - `POST /sessions/:id/publish` — accepts `slug`, `author`, `tags?`, `excerpt?`, social sharing options. Ownership check → quota check → proxy to WriterAgent DO `/publish` → update session status → dispatch social shares → trigger feed regeneration.
  - Action logic in `actions/publish.ts`.

### Step 5: Scout Workflow Webhook Step `[PARALLEL with Step 4]`

Can run in parallel with Step 4 since it modifies a different service.

> **Wait for:** Step 2F (webhook utility) complete.

- [ ] **5A: Add webhook step to ScoutWorkflow** — Modify `services/content-scout/src/workflow.ts`:
  - Accept `webhookUrl?` in workflow params (passed from queue message)
  - Add a 7th step (`deliver-webhook`) after step 6 that calls `deliverWebhook()` with the scout results
  - Import/inline the webhook delivery logic (or extract to `@hotmetal/shared` if the utility needs to be used from both `apps/web` and `services/content-scout`)

### Step 6: Integration Testing `[SEQUENTIAL]`

> **Wait for:** All previous steps complete.

- [ ] **6A: Typecheck** — Run `pnpm typecheck` across all affected packages (`@hotmetal/web`, `@hotmetal/data-layer`, `@hotmetal/content-scout`). Fix any type errors.
- [ ] **6B: Manual smoke test** — Using curl or a REST client:
  1. Create an API key via the Settings UI
  2. `GET /agents-api/v1/me` with the key
  3. `GET /agents-api/v1/publications` to list publications
  4. `POST /agents-api/v1/publications/:id/drafts/generate` to generate a draft
  5. `POST /agents-api/v1/sessions/:id/publish` to publish
  6. Verify webhook delivery with a test endpoint (e.g., webhook.site)
- [ ] **6C: Code review** — Run senior-code-reviewer on all new files, focusing on auth security, SSRF protection, error handling, and consistency with existing patterns.

### Step 7: Documentation `[PARALLEL]`

All documentation tasks can run in parallel with each other. Can start once endpoint shapes are finalized (after Step 4).

> **Wait for:** Steps 3-4 complete (endpoint shapes finalized).

- [ ] **7A: `llms.txt`** — Add `llms.txt` and `llms-full.txt` to the marketing site root (`apps/web/public/` or the marketing site's public folder). Describes Hot Metal, API base URL, auth method, link to OpenAPI spec.
- [ ] **7B: OpenAPI spec** — Create `agents-api/v1/openapi.ts` serving `GET /agents-api/v1/openapi.json`. Full OpenAPI 3.1 spec with all endpoints, request/response schemas, auth scheme, error codes. Can be a static JSON file or generated.
- [ ] **7C: API docs page** — Add `/docs/api` page to the marketing site with human-readable documentation: getting started, authentication, all endpoints with curl examples, error handling, webhook usage.

### Step 8: Finalize `[SEQUENTIAL]`

> **Wait for:** All steps complete.

- [ ] **8A: Update `docs/` folder** — Add `docs/AGENTS_API.md` documenting the public API architecture, endpoint summary, and how it relates to the internal APIs.
- [ ] **8B: Update `.agentspack/todos.md`** — Mark the Agents API feature as completed with a summary of what was built.
- [ ] **8C: Postman collection** — Add all `/agents-api/v1/*` endpoints to the Postman collection in `postman/` with full documentation, example requests/responses.

---

### Parallelism Summary

```
Step 1 ──────────────────────────────────────── (sequential, ~1 session)
    │
    ├──► Step 2A: /me           ─┐
    ├──► Step 2B: publications   │
    ├──► Step 2C: topics         ├── all parallel (~2-3 agents)
    ├──► Step 2D: ideas          │
    ├──► Step 2E: styles         │
    └──► Step 2F: webhook util  ─┘
              │
              ├──► Step 3A: draft generation ─┐
              └──► Step 3B: scout trigger     ├── parallel (~2 agents)
                        │                     │
                        └──► Step 5A: scout   │
                             workflow webhook ─┘
              │
              └──► Step 4A: publish endpoint  ── (sequential, after 3A)
                        │
                        ├──► Step 7A: llms.txt      ─┐
                        ├──► Step 7B: OpenAPI spec    ├── parallel (~2-3 agents)
                        └──► Step 7C: API docs page  ─┘
                                      │
                                      └──► Step 6 + 8  ── (sequential, final)
```

**Maximum parallelism:** Up to 6 agents during Step 2, 2-3 agents during Steps 3+5, 2-3 agents during Step 7.

---

## Webhook Delivery

Long-running endpoints (`drafts/generate`, `scout/run`) accept an optional `webhookUrl` parameter. When provided, the API returns immediately and sends the result to the URL when the work completes.

### Delivery mechanism

- **Transport:** POST request with JSON body and `Content-Type: application/json`
- **Signature:** Each webhook includes an `X-HotMetal-Signature` header — an HMAC-SHA256 of the request body, keyed with the app's `INTERNAL_API_KEY`. This lets the receiver verify the webhook came from Hot Metal. (Future improvement: per-user webhook signing secrets.)
- **Retry:** On non-2xx response or network error, retry up to 3 times with exponential backoff (5s, 30s, 120s). After all retries fail, the result is still available via polling (`GET /agents-api/v1/sessions/:id`).
- **Timeout:** Each delivery attempt has a 10-second timeout.

### URL validation

- Must be an `https://` URL (reject `http://`, `file://`, etc.)
- Must not point to private/internal IPs (SSRF protection — validate resolved IP is not in 10.x, 172.16-31.x, 192.168.x, 127.x, or link-local ranges)
- Max URL length: 2048 characters

### Webhook payload shape

All webhook payloads share the same envelope:

```json
{
  "event": "draft.completed | draft.published | draft.failed | scout.completed | scout.failed",
  "sessionId": "uuid (when applicable)",
  "publicationId": "uuid (when applicable)",
  "data": { ... },
  "timestamp": "ISO 8601 UTC"
}
```

### Implementation

A shared `deliverWebhook` utility function in `packages/shared/src/webhook.ts` (in the `@hotmetal/shared` package, so both `apps/web` and `services/content-scout` can import it):

```typescript
interface WebhookPayload {
  event: string
  sessionId?: string
  publicationId?: string
  data?: unknown
  error?: string
  timestamp: string
}

async function validateWebhookUrl(url: string): Promise<void>
// Throws on: non-https, private IP ranges, URL too long (>2048 chars)

async function deliverWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
  signingSecret: string,
): Promise<void>
// Signs payload with HMAC-SHA256, sends POST, retries on failure
```

This function is called from within `waitUntil()` (for draft generation in `apps/web`) or from a final workflow step (for scout in `services/content-scout`). It handles retries internally.

---

## Security Considerations

1. **Rate limiting** — Add per-key rate limits (e.g., 60 req/min for reads, 10 req/min for writes, 5 req/min for draft generation). Can use Cloudflare's rate limiting or a simple KV-based counter.
2. **Quota enforcement** — All write operations respect tier-based quotas (same as frontend).
3. **Key scoping** — Initially all keys have full account access. Future: scoped keys (read-only, per-publication, etc.).
4. **Audit logging** — Log all API key usage (key ID, endpoint, timestamp) for security auditing.
5. **CORS** — The `/agents-api/*` routes should allow CORS from any origin (agents call from various environments). The existing `/api/*` routes remain same-origin only.

---

## Future Extensions (Not in scope now)

- **MCP Server** — Wrap the action layer as MCP tools. A user could add Hot Metal as an MCP server in Claude Desktop / any MCP client.
- **Registered webhooks** — In addition to per-request webhook URLs, let users register persistent webhook endpoints in Settings for all events (new ideas, draft ready, post published).
- **Scoped API keys** — Keys with limited permissions (read-only, specific publications only).
- **Batch operations** — Generate multiple drafts in one request.
- **Interactive drafting via API** — Chat-based drafting over HTTP (not WebSocket) for agents that want iterative refinement.
- **OAuth2 Device Flow** — Agent-initiated auth without a pre-existing API key.
