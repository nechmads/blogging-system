# EmDash blog templates — round two, three design concepts

Open **`index.html`** in any browser. It links to all three concepts.

Each concept has two pages:

| | Concept | Home | Article |
|---|---|---|---|
| 01 | Cover Stock | `01-cover-stock/index.html` | `01-cover-stock/post.html` |
| 02 | Horizon | `02-horizon/index.html` | `02-horizon/post.html` |
| 03 | Poster | `03-poster/index.html` | `03-poster/post.html` |

This is the second exploration. The first (`design-prototypes/emdash-2026-09-06/`)
produced Press Machine and One Signal; these three deliberately avoid its
silhouettes and are bolder and more screen-native.

## What these are

Static design prototypes for the publication templates rendered by
`apps/emdash-blog`. They are for choosing a direction — no application code has
been changed, and nothing here is wired to the CMS.

Everything is self-contained: fonts and images are bundled inside each concept
folder, so the pages work offline, straight from a file, with no server, no
build step and no network. You can zip the whole folder and send it on.

## What is real and what is demo

- **The content is real.** Copy, archive, the full 1,740-word article, its 13
  citations and the featured images all come from the live *Looking Ahead*
  publication, so the concepts are compared on the material they will carry.
- **The comments are illustrative.** The three comment threads are written for
  the prototype; they are not real reader comments.
- **The forms do nothing.** Comment and subscribe forms validate locally and
  then say "demo only — nothing was sent". Nothing leaves the page.
- **Links stay inside the concept.** Every archive entry opens that concept's
  own article page — the prototypes only have two pages each. Links in the
  article text and the sources list are genuine outbound links to the cited
  sources. Tag and RSS links point nowhere.
- **A few behaviours are prototype conveniences.** Poster fits its lead title
  to the screen with a small script (the CSS size tiers are the no-JS
  fallback); Horizon repaints link colours when the accent is swapped live.
  Both would be handled differently in the real template.

## Two things to look at while comparing

1. **The lead story has no featured image.** That is true of the real newest
   post, and missing images are common. Cover Stock answers with a typographic
   cover, Horizon with a bare date tick, Poster by never giving images a slot.
2. **The accent colour is per-publication.** It is set to Looking Ahead's red
   here, but a real template has to survive any hex. Every concept derives its
   tints from the hex with contrast floors; each was checked at pale yellow
   `#ffd400` and near-black `#0a0a2a` as well as the sample red.

## Review record

The per-concept design notes live in each concept's `DESIGN.md`; the run
record, creative packets, builders and the capture tool are in `_build/`.
Screenshot sets are regenerable and not committed.
