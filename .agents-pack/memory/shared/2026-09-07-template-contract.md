---
title: "Blog templates: the round-two component contract"
kind: "fact"
status: "active"
visibility: "shared"
applies_to:
  - "apps/emdash-blog/src/templates"
  - "apps/publications-web/src/templates"
tags:
  - "templates"
  - "emdash"
created_at: "2026-09-07"
updated_at: "2026-09-07"
created_by: "claude"
verified_at: "2026-09-07"
supersedes: []
superseded_by: null
---

`cover-stock`, `horizon` and `poster` (PR #49) use a tighter component contract
than `starter`/`editorial`/`bold`/`press-machine`/`one-signal`, and it is the
shape to prefer for a new template:

`Header` (`publicationName`, `logoUrl`, `showDate` marks the home page),
`Home` (`branding`, the capped `posts`, `hasMorePosts`), `PostList`
(`posts`, `heading`, `showViewAll`, `standalone` — the last makes it own the
`main` landmark and the `h1`, set only on `/posts`), `PostContent` (the article
props plus `publicationName`, and it must render `<slot name="comments"/>`),
`Footer`, `NotFound`. The switcher branches are then short and identical in
shape across the three.

Three constraints a shared template must satisfy, each found by breaking one:

- **Never import a *value* from `../../../dl/publication`.** `apps/emdash-blog`
  serves one publication per instance and exposes `getBranding()`;
  `apps/publications-web` serves every publication from one worker and has no
  such function. A template that reaches for branding compiles in one app and
  breaks the other. `import type { PublicationBranding }` is fine; anything
  else arrives as a prop.
- **`apps/publications-web` typechecks with `astro/tsconfigs/strict`** while
  `apps/emdash-blog` uses `base`. Narrowing that does not reach a nested
  closure is an error in one app only, so typecheck both.
- **The two copies must stay byte-identical** (`diff -r`), per
  `docs/emdash-phase2-parity.md`.

## Previewing a template locally

`scripts/emdash-seed-looking-ahead.ts` seeds the eight sample posts
(`DRY=1` prints them, `FORCE=1` rewrites existing ones). Then set
`PUBLICATION_TEMPLATE` / `PUBLICATION_ACCENT` in `apps/emdash-blog/.dev.vars`.
Two traps cost real time:

- **`astro preview` reads `dist/server/.dev.vars`**, so an edit to `.dev.vars`
  needs a rebuild, not just a restart. Without one the wrangler.jsonc defaults
  win and the wrong template renders.
- **An unquoted `#` hex is swallowed as a comment** by the dotenv parser, so
  `PUBLICATION_ACCENT=#b4361f` silently injects no accent. Quote it.

Also note `createPost` feeds `content` through `markdownToPortableText`: hand
it HTML and the blog renders visible `<p>` tags.
