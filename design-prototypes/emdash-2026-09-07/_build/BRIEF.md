# Run brief — EmDash blog templates, round two

Run: `design-prototypes/emdash-2026-09-07/`  ·  Started 2026-09-07
Branch: `design/emdash-templates-round2` (worktree `~/Projects/hotmetal-design-round2`)

This is the **common product/content brief** shared by every concept. Each
concept's creative packet is a separate file under `_build/packets/` and is
given only to that concept's implementer.

## Product brief (shared by all concepts)

**Product.** Hot Metal publication templates, rendered by `apps/emdash-blog`
(Astro 6 + Tailwind, EmDash CMS). A template is chosen per publication
(`publications.template_id`) and must look right for *any* publication that
picks it — not just one site. These prototypes are static HTML for choosing a
direction; the chosen one(s) will later be ported to a real Astro template.

**Audience.** Readers of an independent expert's publication: arriving from
X/LinkedIn/search, skimming the home page, then reading one long argument.

**Primary job.**
- *Home:* make one article irresistible, make the archive scannable and
  credible at a glance.
- *Post:* sustained 1,500–2,500 word reading with in-text links, a real
  citations block, and comments.

**This round's ask.** "Unique and eye-catching." Round one (2026-09-06) was
five restrained, print-derived directions; two shipped. This round should be
bolder and more screen-native while still doing the reading job. Distinctive
organising logic, not decoration.

**Data actually available** (`PublicationBranding` + `Post`):
name, tagline, description, logoUrl, headerImageUrl, **accentColor (arbitrary
per-publication hex, injected as `--publication-accent`)**, socialLinks;
per post: title, subtitle, hook, excerpt, **featuredImage (often absent)**,
tags, topics, author, publishedAt, `citations[]`, body HTML.

**Hard constraints that shape the design.**
1. **Featured images are unreliable.** They are AI-generated, always square
   (1024×1024), variable quality, and frequently missing entirely — the newest
   post in the sample has none. A template that leans on photography fails.
   The archive needs a designed no-image state, not just the lead.
2. **The accent color is not ours.** Any use that carries legibility — label
   text, small marks, a duotone, a large filled plane — must derive a
   contrast-floored variant (CSS relative colour / `oklch(from …)` or
   `color-mix`) rather than use the hex raw. Test at least `#b4361f` (sample),
   `#ffd400` (pale) and `#0a0a2a` (near-black). Round one failed this in four
   of five concepts while looking fine at the sample red.
3. Citations, comments, RSS and tags are required surfaces, not decoration.
4. Astro + Tailwind, server-rendered on Cloudflare; view transitions enabled.
   Nothing in the prototype may depend on a server, a build step or the
   network.
5. A form with no `method` leaks its fields into the URL with JS off. Demo
   forms use `method="dialog"` (aborts submission) and say "demo only".
6. `overflow-x: hidden` on `body` disables `position: sticky`; use
   `overflow-x: clip` on the root if clipping is needed.

**Tone.** Authoritative, forward-looking, human. Not corporate-AI.

**Exclusions (all concepts).** Interchangeable rounded-card grids; purple/blue
gradients; glassmorphism; decorative blobs, glows and particle fields; the
current centered-Playfair blog default; and — new this round — anything that
re-does round one: no newspaper broadsheet, no dark mono dispatch log, no
gallery-catalogue plates, no fixed accent-coloured side panel, no annotated
margin notebook.

**Sample content.** The public "Looking Ahead" publication (the user's own).
Identical content across all concepts, from `_build/content.py`: 8 posts (the
newest has no image), one full 1,740-word article with 13 citations, three
illustrative comments. Comments are illustrative, everything else is real.

## Coverage per concept

`index.html` (home) and `post.html` (article), each at desktop (1440) and
mobile (390), with: masthead/nav, publication identity (name, tagline, short
description, social links, RSS), a lead story, an archive of the other seven
posts, the no-image lead handled by design, a long article with h2s + in-text
links, a citations block, a comments thread with a form, tags, and a footer.

## Entropy

External seeds (`node scripts/generate-seeds.mjs 3`), one per direction:
1 `76f5dc78b350331b2ac88e39ea45ebba` · 2 `35584857fa0661b9f1dfdf993893ac18`
3 `269f447cf139a3aa48034590c3d5e4ba`

## The three directions (summary — full packets in `_build/packets/`)

| # | name | method | one line |
|---|---|---|---|
| 01 | Cover Stock | reference collision | every post is an issue with a generated typographic cover; the home page is a face-out shelf |
| 02 | Horizon | binding art direction | time is the spine: a giant date axis across the top, posts hang from it, scrolling travels into the past |
| 03 | Poster | anti-convergence | the headline is the argument: the lead title consumes the screen; images exist only on hover |

## Divergence check

| | composition | type | imagery | color | interaction | density |
|---|---|---|---|---|---|---|
| 01 | framed portrait covers on a shelf | Fraunces display in a fixed cover grid · Instrument Sans · Source Serif 4 body | small inset in the cover's illustration zone | paper + a derived family of cover plates | shelf snap, lift, flip-to-back | medium, objecty |
| 02 | horizontal date axis + entries hung from it | Schibsted Grotesk, giant thin numerals · Literata body | square annotation pinned to the axis | cold white, ink, accent only on "now" | scroll-as-time, axis scroll-spy | sparse, technical |
| 03 | full-bleed type, no containers, no rules | one sans (Bricolage Grotesque) across a huge scale range · Geist body | hover/focus-only, cursor-following | white / black, accent as one highlight | cursor-follow reveal, variable-axis settle | heavy then airy |

At least three dimensions change between any pair, and none repeats a
round-one silhouette (ruled columns, dark index, centred plates, accent panel,
margin notes).

## Budget (stated up front)

Per concept: initial build + fresh independent critic assessment, up to **2**
critique-driven revision rounds targeting 8.5/10, then one `ap-design-polish`
subtraction pass and `ap-frontend-review` verification (fix mode), plus the
reserved final assessment if polish changed the appearance. Max 4 valid
assessments per concept. Every critic gets a new conversation with no
inherited history and never sees the target or the budget.
