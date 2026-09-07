# Creative packet 03 — Poster

Output directory: `design-prototypes/emdash-2026-09-07/03-poster/`
Seed: `269f447cf139a3aa48034590c3d5e4ba`

## 1. Core idea and product job

**The headline is the argument.** This author writes claims — "Agent First
Development is The Future", "The Iran War Is Not Really About Iran" — and the
design gives the claim the whole screen. The lead title fills the first
viewport edge to edge at poster scale; everything else is small and steps
back. The archive is a wall of posters: each post is a full-width band whose
title is set large, alternating alignment, with no rules and no containers
between them. Images exist only as a reward for attention: on desktop they
appear on hover/focus and follow the cursor; on mobile they are a small
square beside the deck. A missing image therefore costs nothing.

Feeling: bold, confident, direct — a bill-poster wall, a manifesto. The
article page, by contrast, must be calm and disciplined for 1,700 words; the
poster scale returns only in pull quotes.

## 2. Originality method — anti-convergence

The local convergence to escape (round one + the three shipped templates):
serif display with mono metadata; paper grounds; hairline rules everywhere;
numbered indexes (`001…`, `Plate II`, `§NN`); masthead top-left then the
headline; images duotoned, plated or stripped; small-caps labels; restraint
as the default posture. The anti-brief:

| dimension | probable default | this direction |
|---|---|---|
| composition | contained text column under a masthead | full-bleed type filling the viewport, ragged, edge to edge; no containers |
| masthead | wordmark top-left | the publication name runs vertically up the right edge of the first screen (rotated), and nav is a small fixed cluster bottom-right; on mobile a thin top strip |
| type | serif + mono pairing | **one** sans family for all display and UI across a huge scale range; hierarchy carried by optical size and width axes, not by mixing families |
| metadata | small caps, mono, grey | plain lowercase sans, small, black; date first |
| archive | numbered ruled rows or cards | a stack of posters: full-width bands, title at 4–6vw, alternating left/right alignment, tag as an accent-derived underline, no chips |
| imagery | duotone/plate/strip in a slot | none in the layout; cursor-following 240px square on hover/focus (desktop), small inline square on mobile |
| colour | paper + ink + tiny accent | pure white and pure black; the accent appears as **one** large highlight per screen (a marker-band behind the deck's key phrase, or the tag underline), derived and floored |
| rules | hairlines separating everything | none on the home page; separation by scale and whitespace only |
| motion | none | the lead title's variable axes settle on load (width/weight, ~600ms, once); hover reveal of images; nothing on the article page |

## 3. Content-native generator

**Claim → evidence.** The post is a claim; the article is the evidence. The
claim gets scale, the evidence gets measure. This governs hierarchy (title
enormous, all else small), the archive (a wall of claims), the article
(calm evidence column with poster-scale pull quotes as the only loud
moments), and imagery (never part of the claim).

## 4. Inputs, probable defaults, and rejections

Composition sketches:

1. *(Rejected — the safest prior.)* A big centred headline with a small deck
   under it and a grid of posts below. It is a landing-page hero.
2. *(Chosen.)* **Edge-to-edge title.** The lead title starts at the left edge
   and wraps to the right edge at 9–12vw, ragged right, no centring, letter
   spacing tightened. The deck sits in the negative space bottom-right at a
   normal reading size with the accent highlight on its key phrase. The
   publication name runs vertically up the right edge. Then the wall: seven
   full-width poster bands.
3. *(Considered.)* Titles stacked as overlapping layers at different scales.
   Rejected: overlap harms legibility and reads as decoration.

Probable defaults to refuse: outline/stroke text, gradients, text glow,
marquee/ticker, chips, hairlines, cards, mono, italics as the only contrast,
a centred wordmark hero, drop caps.

## 5. Composition contract

- **First viewport silhouette:** a black mass of letterforms on white
  filling the width, a small grey block bottom-right (the deck), a thin
  vertical strip of text along the right edge. Recognisable when blurred as
  a poster.
- Title size is fluid by title length: short titles (≤ 30 chars) at ~11vw,
  medium at ~9vw, long (> 45 chars, e.g. "GitHub's Agentic Workflows and the
  Coming 'Continuous AI' Era") at ~7vw, so the lead always fills 70–100% of
  the width and never exceeds the viewport height on a 1440×900 screen.
  `text-wrap: balance` is off for the lead (ragged is the point) and on for
  archive titles.
- The wall: each archive post is a band with the title at 4–6vw (same
  length rule), alternating left and right alignment, date + kicker small
  above, deck small below, tag underline in derived accent. Bands are
  separated by whitespace only. The one no-image post looks identical to
  the others by construction.
- Post page: a calm column, 64–68ch, left of centre, title at ~6vw (still
  the loudest thing but bounded), body in Geist; h2s in the display family
  at ~2.5rem; pull quotes at 4–5vw as "posters" inside the article; sources
  as a plain numbered list; comments as plain stacked entries; tags as
  underlined words.

## 6. Typography contract

- **Bricolage Grotesque** (variable: opsz 12–96, wdth 75–100, wght 200–800)
  for every display and UI role: lead and archive titles at opsz 96, width
  ~80–90, weight 700–800; decks and metadata at opsz 12, width 100, weight
  400–500. One family, hierarchy from axes and scale.
- **Geist** (variable 100–900) for the article body at ~1.125rem / 1.6, and
  for comment bodies and forms. Weight 400; 600 for the one bold role in
  the article (h2s are the display family, so bold in Geist is rare).
- Weight distribution: heavy in exactly one role per page (titles).
  Metadata, nav, deck, forms: regular.
- Collision safeguards: the vertical masthead is on the right edge and the
  lead title has a right padding equal to the strip width, so they never
  touch; the deck is positioned below the title's last line, never over it;
  at 390px the title drops to ~15vw and the vertical strip becomes a top
  strip; hover images never cover the title (offset from the cursor, kept
  inside the viewport).

## 7. Color contract

- Ground `#fff`, ink `#000`. Grey only for secondary text (one grey).
- **One accent use per screen**, derived from `--publication-accent` with
  CSS relative colour: on the home page the marker highlight behind the
  deck's key phrase (a tint with L raised so black text stays ≥ 7:1) and
  the archive tag underlines (a floored variant ≥ 3:1 against white). On the
  article page: link underlines and the one highlight in the opening
  paragraph. Measure at `#b4361f`, `#ffd400`, `#0a0a2a` and record the
  values.
- Focus ring: black, 3px, offset. Never the accent.

## 8. Imagery / content-bearing visual

The typography is the content-bearing visual. Images are **hover-only** on
desktop: hovering or keyboard-focusing an archive title reveals its featured
image as a 240px square that follows the cursor (or sits beside the title on
keyboard focus). On mobile, an image (if any) is a 64–80px square beside the
deck. No image slot exists in the layout, so the no-image lead and the
no-image archive row need no special state. On the article page the featured
image, if present, is a single small square in the metadata line, never a
hero.

## 9. Interaction and motion

- Load: the lead title's width/weight axes settle once (≈600ms), from wide
  and light to condensed and heavy. Reduced motion: title renders in its
  final state, no animation.
- Hover/focus reveal on archive titles (desktop, pointer: fine only); touch
  devices show the inline square instead.
- Nav cluster bottom-right fixed on desktop (home · archive · rss ·
  subscribe); a thin top strip on mobile.
- Article: nothing moves. Comment/subscribe forms: `method="dialog"`, local
  validation, "demo only" message.

## 10. Mobile transformation

Title at ~15vw, edge to edge, still the first thing; deck below; the vertical
masthead becomes a thin top strip with the name and nav; the wall keeps
alternating alignment at 8–10vw; inline image squares replace hover reveals.
The generator (claim gets scale) survives.

## 11. Signature moment and aesthetic risk

Signature: the lead claim consuming the screen, and images that exist only
when you reach for them.
Risk: illegibility or clumsiness at poster scale (bad rag, a two-letter
orphan, a title taller than the viewport). Guard: the length-based size rule,
manual `<br>`-free wrapping, checking every one of the eight titles at 1440
and 390. Second risk: the article page inherits the shouting; guard with a
strictly calm reading column.

## 12. Acceptance and rejection checks

Pass when: no hairline rules on the home page; one display family; the lead
title spans ≥ 70% of the viewport width and fits within the first screen at
1440×900; the accent appears once per screen in a floored derivation; all
eight titles wrap cleanly at 1440 and 390; the article reads at 64–68ch with
regular-weight body; hover reveal works with keyboard focus too and does
nothing harmful with reduced motion.
Fail when: outline or gradient text; a centred hero; cards or chips; mono
anywhere; hairline rules on the home; a hero image; the vertical masthead
colliding with the title; more than one bold role per page.

## Best fit

Opinionated, claim-driven writers who want each post to land like a
statement — commentary, strategy, contrarian analysis.
