---
title: "apps/web must be built with apps/web/.env — a worktree does not have it"
kind: "pitfall"
status: "active"
visibility: "shared"
applies_to:
  - "apps/web"
tags:
  - "deploy"
  - "vite"
  - "worktree"
created_at: "2026-09-07"
updated_at: "2026-09-07"
created_by: "claude"
verified_at: "2026-09-07"
supersedes: []
superseded_by: null
---

`apps/web/.env` is gitignored and holds **eight** `VITE_*` variables — the Clerk
publishable key, Paddle client token, environment and price IDs, and the PostHog
host and key. Vite inlines `VITE_*` at build time, so a build without that file
produces a bundle where every one of them is `undefined`.

The visible symptom is a hard failure at boot:

```
Uncaught Error: Missing VITE_CLERK_PUBLISHABLE_KEY — add it to .env
```

Billing and analytics are silently dead in the same build, but only the Clerk
check throws, so that is the only thing you see.

**A git worktree does not contain it.** It exists only in the main checkout at
`/Users/nechmads/Projects/hotmetal/apps/web/.env`. `vite build` also runs in
`production` mode, so `.env.development` — which *is* present in a worktree —
is not loaded and does not help.

Before running `pnpm deploy:web` from a worktree, copy the file in
(`cp <main-checkout>/apps/web/.env apps/web/.env`; it is gitignored, so it will
not be committed), or build from the main checkout.

**Verify before deploying** — the bundle should contain the real values:

```
f=$(ls apps/web/dist/client/assets/index-*.js | head -1)
grep -qE "pk_[a-z]+_[A-Za-z0-9]{4}" "$f" && echo clerk ok
grep -qE "(live|test)_[a-f0-9]{10}" "$f" && echo paddle ok
grep -q "phc_" "$f" && echo posthog ok
```

A no-env build and an env build produce different bundle hashes, so comparing
`/assets/index-*.js` on the live site against a local build tells you which one
is deployed.
