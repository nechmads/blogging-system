# Plan: Publication Sharing & Collaborative Drafts

**Created:** 2026-03-06
**Status:** Planning

---

## Overview

Allow publication owners to invite other users to collaborate on a publication. Invited users can manage settings, write content, and publish — enabling team-based content workflows without requiring real-time collaborative editing.

---

## Core Concepts

### Roles

| Role | Description |
|---|---|
| **Owner** | Full control. The user who created the publication. |
| **Editor** | Can manage settings, write, edit drafts, publish. Cannot manage members or delete publication. |
| **Viewer** | Read-only access to ideas, drafts, and published content. Useful for reviewers/stakeholders. |

### Permission Matrix

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| View publication, ideas, topics | Yes | Yes | Yes |
| Create/edit topics | Yes | Yes | No |
| Run content scout | Yes | Yes | No |
| Create writing sessions | Yes | Yes | No |
| Submit drafts to publication | Yes | Yes | No |
| Edit publication drafts | Yes | Yes | No |
| Publish posts | Yes | Yes | No |
| Edit publication settings | Yes | Yes | No |
| Manage members (invite/remove) | Yes | No | No |
| Delete publication | Yes | No | No |

### Two-Layer Content Model

**Sessions** remain personal AI workspaces — each user's chat history, AI interactions, and working drafts are private.

**Publication Drafts** are the shared layer. When a user is ready, they "submit" their session's draft content to the publication. From there, any member with editor+ role can open, edit, and eventually publish it.

```
Personal Layer                    Shared Layer
┌──────────────────┐             ┌─────────────────────────┐
│ Writing Session   │  ──submit──▶ │ Publication Draft        │
│ (AI chat + drafts)│             │ (shared content)         │
│ Private to user   │  ◀──pull───│ Editable by members      │
└──────────────────┘             │ Lockable (1 editor/time) │
                                  │ Publishable              │
                                  └─────────────────────────┘
```

- **Submit**: Copies current draft content (markdown) from session to a new publication draft
- **Pull**: Creates a new personal session seeded with the publication draft's content (for AI-assisted refinement)
- **Edit inline**: Open publication draft directly in Tiptap editor (already built)
- **Publish**: Same flow as today's session publish, but from the publication draft

---

## Data Model Changes

### New Table: `publication_members`

```sql
CREATE TABLE publication_members (
  id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'editor',  -- 'editor' | 'viewer'
  invited_by TEXT NOT NULL REFERENCES users(id),
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'declined' | 'revoked'
  invited_at INTEGER DEFAULT (unixepoch()),
  accepted_at INTEGER,
  UNIQUE(publication_id, user_id)
);

CREATE INDEX idx_pub_members_publication ON publication_members(publication_id);
CREATE INDEX idx_pub_members_user ON publication_members(user_id);
CREATE INDEX idx_pub_members_email_status ON publication_members(invited_email, status);
```

Notes:
- The owner is NOT stored in this table — ownership is still `publications.user_id`
- `invited_email` is stored for pending invites (user may not have an account yet)
- Role is always 'editor' or 'viewer' (never 'owner' — owner is implicit from publications.user_id)

### New Table: `publication_drafts`

```sql
CREATE TABLE publication_drafts (
  id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,           -- markdown
  submitted_by TEXT NOT NULL REFERENCES users(id),
  source_session_id TEXT,          -- optional link back to originating session
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'in_review' | 'approved' | 'published' | 'archived'
  locked_by TEXT REFERENCES users(id),
  locked_at INTEGER,
  featured_image_url TEXT,
  cms_post_id TEXT,                -- set after publishing, enables re-editing
  published_at INTEGER,
  published_by TEXT REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_pub_drafts_publication ON publication_drafts(publication_id);
CREATE INDEX idx_pub_drafts_status ON publication_drafts(status);
CREATE INDEX idx_pub_drafts_locked ON publication_drafts(locked_by);
```

Notes:
- Lock auto-expires after 30 minutes of idle (checked at query time, not via cron)
- `source_session_id` is informational only — no FK constraint needed
- `cms_post_id` enables the "edit published post" flow from shared drafts

---

## Invitation Flow (Email-Based)

### Sending an Invite

1. Owner enters an email address and selects a role (editor/viewer)
2. Backend creates a `publication_members` row with `status: 'pending'`
3. Email sent via Resend with:
   - Publication name, owner name
   - Accept link: `{WEB_APP_URL}/invitations/{memberId}/accept?token={signedToken}`
   - The token is a signed JWT (or HMAC) containing `memberId` to prevent URL tampering

### Accepting an Invite

1. User clicks the accept link
2. If not logged in → redirected to sign-in/sign-up, then back to accept
3. Backend verifies:
   - Token is valid and matches the `memberId`
   - The invite email matches the authenticated user's email
   - Status is still 'pending'
4. Updates `status: 'accepted'`, sets `user_id` to the authenticated user's ID, sets `accepted_at`
5. Redirects to the publication's page

### Edge Cases

- **User doesn't have an account yet**: Sign-up flow, then accept. The `invited_email` match ensures only the intended recipient can accept.
- **Invite to existing member**: Return error "already a member"
- **Owner invites themselves**: Block at API level
- **Revoking an invite**: Owner sets `status: 'revoked'`. If already accepted, this removes access immediately.

---

## Architecture Changes

### Middleware Refactor: `requirePublicationAccess`

Replace the current inline `verifyPublicationOwnership()` calls with a Hono middleware:

```typescript
function requirePublicationAccess(minRole: 'viewer' | 'editor' | 'owner') {
  return async (c: Context, next: Next) => {
    const pubId = c.req.param('pubId')
    const userId = c.get('userId')

    const publication = await c.env.DAL.getPublicationById(pubId)
    if (!publication) return c.json({ error: 'Not found' }, 404)

    // Check ownership first
    if (publication.userId === userId) {
      c.set('publication', publication)
      c.set('publicationRole', 'owner')
      return next()
    }

    // Check membership
    const membership = await c.env.DAL.getPublicationMember(pubId, userId)
    if (!membership || membership.status !== 'accepted') {
      return c.json({ error: 'Not found' }, 404)
    }

    const roleHierarchy = { viewer: 0, editor: 1, owner: 2 }
    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    c.set('publication', publication)
    c.set('publicationRole', membership.role)
    return next()
  }
}
```

Usage on routes:
```typescript
// Anyone with access can view
app.get('/publications/:pubId', requirePublicationAccess('viewer'), getPublication)

// Editors+ can write and manage content
app.post('/publications/:pubId/drafts', requirePublicationAccess('editor'), submitDraft)
app.post('/publications/:pubId/topics', requirePublicationAccess('editor'), createTopic)
app.patch('/publications/:pubId', requirePublicationAccess('editor'), updatePublication)

// Only owners can manage members
app.post('/publications/:pubId/members', requirePublicationAccess('owner'), inviteMember)
app.delete('/publications/:pubId/members/:memberId', requirePublicationAccess('owner'), removeMember)
app.delete('/publications/:pubId', requirePublicationAccess('owner'), deletePublication)
```

### DAL Changes

New domain file: `publication-members.ts`
- `createMember(db, data)` → create pending invite
- `getMemberById(db, id)` → get single member
- `getPublicationMember(db, publicationId, userId)` → check access
- `getMemberByEmailAndPublication(db, email, publicationId)` → prevent duplicate invites
- `listMembersByPublication(db, publicationId)` → for settings page
- `listMembershipsByUser(db, userId)` → for "shared with me" dashboard
- `listPendingInvitesByEmail(db, email)` → for post-signup acceptance
- `updateMemberStatus(db, id, status, acceptedAt?)` → accept/decline/revoke
- `updateMemberRole(db, id, role)` → change role
- `deleteMember(db, id)` → hard delete

New domain file: `publication-drafts.ts`
- `createDraft(db, data)` → submit from session
- `getDraftById(db, id)` → get single draft
- `listDraftsByPublication(db, publicationId, filters?)` → list with status filter
- `updateDraftContent(db, id, content, title?)` → save edits
- `updateDraftStatus(db, id, status)` → status transitions
- `acquireLock(db, id, userId)` → lock with 30-min expiry check
- `releaseLock(db, id, userId)` → explicit unlock
- `markPublished(db, id, userId, cmsPostId)` → after successful publish

Update `listPublicationsByUser` → also return publications where user is an accepted member (with role info).

### API Routes

New route group: `/api/publications/:pubId/members`
- `GET` — list members (editor+)
- `POST` — invite member (owner only)
- `PATCH /:memberId` — update role (owner only)
- `DELETE /:memberId` — remove/revoke (owner only)

New route group: `/api/publications/:pubId/drafts`
- `GET` — list publication drafts (viewer+)
- `POST` — submit a draft from session (editor+)
- `GET /:draftId` — get draft content (viewer+)
- `PATCH /:draftId` — update draft content (editor+, must hold lock)
- `POST /:draftId/lock` — acquire lock (editor+)
- `DELETE /:draftId/lock` — release lock (lock holder or owner)
- `POST /:draftId/publish` — publish draft (editor+)
- `POST /:draftId/pull` — create new session from draft content (editor+)

New route: `/api/invitations/:memberId/accept`
- `POST` — accept an invitation (authenticated, email must match)

### Quota Attribution

All quotas are attributed to the **publication owner**, not the acting user:
- Posts per week per publication → counted against owner's limits
- Topics per publication → counted against owner's limits
- The acting editor's own tier/quotas are not affected

---

## Frontend Changes

### Dashboard

Split the publications section into two:

```
┌─────────────────────────────────────┐
│ My Publications                     │
│ ┌─────────┐ ┌─────────┐ ┌───────┐  │
│ │ Pub A   │ │ Pub B   │ │  +    │  │
│ │ (owner) │ │ (owner) │ │ New   │  │
│ └─────────┘ └─────────┘ └───────┘  │
│                                     │
│ Shared With Me                      │
│ ┌─────────────┐ ┌─────────────┐     │
│ │ Pub C       │ │ Pub D       │     │
│ │ by Alice    │ │ by Bob      │     │
│ │ (editor)    │ │ (viewer)    │     │
│ └─────────────┘ └─────────────┘     │
└─────────────────────────────────────┘
```

- Shared publication cards show the owner's name and the user's role
- No "+" button in the shared section

### Publication Settings — Members Section (Owner Only)

```
┌─────────────────────────────────────┐
│ Team Members                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ you@email.com          Owner    │ │
│ │ alice@email.com        Editor ▼ │ │
│ │ bob@email.com          Viewer ▼ │ │
│ │ pending@email.com      Pending  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Invite Member]                     │
│                                     │
│ Invite modal:                       │
│ ┌─────────────────────────────────┐ │
│ │ Email: [____________]           │ │
│ │ Role:  (o) Editor  ( ) Viewer  │ │
│ │            [Send Invite]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- Role dropdown to change roles (owner only)
- Remove button per member
- Revoke button for pending invites

### Publication Drafts Page

New page at `/publications/:id/drafts`:

```
┌─────────────────────────────────────┐
│ Publication Drafts                  │
│                                     │
│ [Filter: All | Draft | In Review]   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ "AI in Healthcare"              │ │
│ │ Submitted by Alice · 2h ago    │ │
│ │ Status: Draft                   │ │
│ │ [Open] [Publish]               │ │
│ ├─────────────────────────────────┤ │
│ │ "Remote Work Trends"           │ │
│ │ Submitted by You · 1d ago     │ │
│ │ Status: In Review              │ │
│ │ 🔒 Locked by Bob              │ │
│ │ [View]                          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- "Open" acquires lock and opens Tiptap editor
- "View" opens read-only when locked by someone else
- "Publish" opens the publish modal
- Lock status shown with who holds it
- Viewers see everything but no edit/publish buttons

### Sidebar Navigation Update

For shared publications, add a "Drafts" nav item:

```
▼ Publication Name
  Ideas
  Drafts        ← new
  Writing
  Schedule
  Settings      ← hidden for viewers
```

### Pending Invitations

If a user has pending invitations, show a banner or section on the dashboard:

```
┌─────────────────────────────────────┐
│ 📬 You have 1 pending invitation   │
│                                     │
│ "Tech Insights" by Alice            │
│ Role: Editor                        │
│ [Accept] [Decline]                  │
└─────────────────────────────────────┘
```

---

## Notification Emails

Using existing Resend integration:

1. **Invitation email** — "You've been invited to collaborate on {publication name}"
2. **Invitation accepted** — Notify owner: "{name} accepted your invitation to {publication}"
3. **New publication draft** — Notify members: "New draft submitted: {title}"
4. **Draft published** — Notify members: "{title} was published by {name}"

Add to `notification_preferences`:
- `team_invite` (default: true)
- `team_draft_submitted` (default: true)
- `team_draft_published` (default: true)

---

## Implementation Phases

### Phase 1: Data Model & Middleware Refactor
- D1 migration for `publication_members` and `publication_drafts`
- DAL domains: `publication-members.ts`, `publication-drafts.ts`
- Refactor `verifyPublicationOwnership` → `requirePublicationAccess` middleware
- Update all existing routes to use the new middleware
- Update `listPublicationsByUser` to include memberships

### Phase 2: Invitation Flow
- API routes for member management (invite, list, update role, remove)
- Invitation accept endpoint with signed token verification
- Invitation email template via Resend
- Acceptance notification email to owner

### Phase 3: Publication Drafts Backend
- API routes for drafts (submit, list, get, update, lock/unlock, publish, pull)
- Lock acquisition with 30-min auto-expiry
- Publish flow from publication draft (reuse existing publish logic)
- Pull flow (create session seeded with draft content)

### Phase 4: Frontend — Dashboard & Members
- Split dashboard: "My Publications" + "Shared With Me"
- Pending invitations banner/section
- Members management UI in publication settings
- Invite modal with email + role picker
- Role-based UI visibility (hide settings for viewers, hide member management for editors)

### Phase 5: Frontend — Publication Drafts
- Drafts page with list, filters, lock status
- Submit-to-publication flow from session workspace
- Draft editor (Tiptap, with lock acquisition)
- Publish from draft flow
- Pull-to-session flow

### Phase 6: Notifications & Polish
- Email notifications for drafts submitted/published
- Notification preferences for team events
- Activity feed entries for team actions
- Edge case handling (revoked access while editing, expired locks, etc.)

---

## Tier Gating

Publication sharing should be a **paid feature**:
- Free tier: No sharing (single-owner only)
- Paid tiers: Allow inviting members (limit varies by tier)

Add to tier limits:
- `membersPerPublication`: 0 (free), 3 (creator), 10 (professional), unlimited (studio)

---

## Open Questions

1. Should we notify all members when the content scout finds new ideas?
2. Should editors see each other's personal writing sessions, or only publication drafts?
3. Do we need an "activity feed" on the publication showing who did what?
4. Should the owner be able to transfer ownership to another member?
