# Creative packet 01 — Cover Stock

Output directory: `design-prototypes/emdash-2026-09-07/01-cover-stock/`
Seed: `76f5dc78b350331b2ac88e39ea45ebba`

## 1. Core idea and product job

Every post is an **issue**, and every issue has a **cover**. The cover is
generated from type — title, kicker, date — so it needs no photograph, and it
looks the same quality whether a featured image exists or not. The home page
is a bookshop shelf: one issue faces out at full size (the lead), the rest
stand beside it. The article opens on its own cover.

Feeling: a considered series of small books from a publisher with a house
style. Collected, warm, tactile without texture. The page must still make the
lead irresistible and the archive scannable in one glance; the shelf *is* the
archive, so it must be readable as a list too.

## 2. Originality method — reference collision

Three references from outside web design. For each: the structural principle
to translate, the literal motif to reject, why it belongs here.

- **Penguin/Pelican paperback series (the Marber grid).** Principle: a fixed
  grid partitions the cover into a *series band* (publisher + kicker), a
  *title zone* and an *illustration zone*, so every title in the series is
  instantly the same family while the illustration varies. Reject: the
  penguin, Penguin orange, the tri-band pastiche, "vintage" type. Belongs
  because the publication's posts are a series by one author and the
  illustration zone gives the unreliable image a place that is fine empty.
- **Record-shop face-out shelf.** Principle: one item faces out at full size
  while the rest stand edge-on or overlapped and come forward on attention.
  Reject: vinyl texture, sleeve wear, crates, price stickers. Belongs because
  the home page's job is exactly "one irresistible, the rest browsable".
- **Library catalogue / due-date card.** Principle: metadata is a stamped
  column of dates and short codes beside the title, tabular and terse.
  Reject: typewriter faces, rubber-stamp effects, aged paper. Belongs because
  the archive also needs a plain, fast list view below the shelf, and dates
  are the reader's main scanning key.

## 3. Content-native generator

**Issue → cover → shelf.** The relationship between one post and the series.
It governs: hierarchy (face-out vs. shelved), repetition (the same cover grid
on every post), imagery (the illustration zone), and interaction (take a book
off the shelf = open the post).

## 4. Inputs, probable defaults, and rejections

Composition sketches considered:

1. *(Rejected — the safest prior.)* A 3-up grid of uniform cover cards with a
   big lead card on top. It is a card grid wearing a costume.
2. *(Chosen.)* **Face-out shelf.** The lead cover stands at roughly 60–70% of
   viewport height on the left; to its right the seven archive covers stand
   on the same shelf line, narrower, staggered in height like real books,
   scroll-snapping sideways when they overflow. Below the shelf, a
   catalogue-card list of the same posts with dates in a stamped column.
3. *(Kept as a detail of 2.)* **Spines.** On desktop, shelved covers may show
   a narrower "spine" state (title running vertically) and open to the full
   cover on hover/focus, so the shelf holds more issues in less width.

Probable defaults to refuse: rounded corners on covers; drop shadows on every
cover (allowed only on the lifted/hover state); a masthead bar with a
centred wordmark; chips for tags; a "Read more →" button on every item;
images as the cover's main event.

## 5. Composition contract

- **First viewport silhouette:** a tall portrait rectangle on the left, a row
  of shorter portrait rectangles standing on one horizontal shelf line to the
  right, all sitting on a warm paper ground. The publication name sits small
  above the shelf as the *publisher's imprint*, not as a hero masthead.
- Covers keep a fixed aspect (around 2:3). All covers share one grid: series
  band top, title zone, illustration zone (or deck when no image), imprint
  foot (author · date).
- Below the shelf: the catalogue list — one row per post, date column left in
  tabular figures, title, kicker, reading time. No thumbnails here.
- Post page: on desktop the article's own cover occupies the left third and
  stays sticky while the text column scrolls beside it; sources and comments
  belong to the text column. On mobile the cover comes first at full width,
  then the text.
- Density medium; the objects are the rhythm. No hairline rules between
  covers; rules may appear in the catalogue list only.

## 6. Typography contract

- **Fraunces** (variable: opsz 9–144, wght 300–900, italic) for cover titles
  at a high optical size, and for the article h1 and h2s. One bold role only:
  the cover/article title. Fraunces italic at text sizes carries the deck.
- **Instrument Sans** for series band, imprint, catalogue list, nav, forms,
  comments metadata. Regular and medium only.
- **Source Serif 4** for the article body at ~1.125rem / 1.6, measure 62–68ch.
- Contrast comes from scale and the cover grid, not from weight stacking.
- Collision safeguards: cover titles use fluid size with a per-cover fit rule
  (long titles such as "GitHub's Agentic Workflows and the Coming 'Continuous
  AI' Era" step down); `text-wrap: balance`; a title never touches the series
  band or the illustration zone; at 390px the face-out cover keeps its grid.

## 7. Color contract

- Ground: warm paper (not white, not yellow). Ink: near-black warm.
- **Cover plates are derived from `--publication-accent` with CSS relative
  colour**, never the raw hex on a plate that carries text. Three plate
  variants rotate by post index so the shelf has rhythm:
  1. *tint plate* — accent with lightness raised (oklch L ≈ 0.92, chroma
     capped) under ink type;
  2. *deep plate* — accent with lightness clamped to a floor (oklch L ≤ 0.45)
     under paper type;
  3. *paper plate* — paper ground with an accent-derived series band.
- Every text-on-plate combination must measure ≥ 4.5:1 at `#b4361f`,
  `#ffd400` and `#0a0a2a`. Record the measured values in the concept's notes.
- Links in the article: ink with an accent-derived (contrast-floored)
  underline.

## 8. Imagery / content-bearing visual

The **cover** is the content-bearing visual. When a featured image exists it
sits in the illustration zone as a square inset smaller than the title zone,
with a paper mat; uneven generated art reads as a small plate on a designed
cover. When absent, the illustration zone holds the deck in Fraunces italic.
Both states must look equally finished — the lead has no image, so the
face-out cover is the proof.

## 9. Interaction and motion

- Shelf: horizontal scroll-snap when it overflows; ← → keys move between
  covers when the shelf has focus; hover/focus lifts a cover a few pixels
  (the only shadow in the design). Reduced motion: no lift transition.
- Cover back: a shelved cover or catalogue row can be turned to show the deck
  and tags (a toggle, click/Enter), like reading the back of a book. Optional
  if it threatens clarity; the shelf must work without it.
- Post page: sticky cover; nothing else moves.

## 10. Mobile transformation

The face-out cover fills the width (aspect kept, ~3:4). The shelf becomes a
horizontal snap scroller showing about 2.3 covers with visible shelf line.
The catalogue list follows. Post page: cover, then text; the cover shrinks to
a thin "spine" strip at the top when scrolled if that helps orientation.

## 11. Signature moment and aesthetic risk

Signature: one issue facing out, the others standing beside it on a shelf;
and an article that opens on its own cover.
Risk: covers collapse into cards. Guard: no radius, no per-cover shadow, no
per-cover border; covers stand on a shared shelf line with staggered heights;
covers touch the shelf. Second risk: the derived plate family looks muddy at
a hostile hex; guard with the measured floors.

## 12. Acceptance and rejection checks

Pass when: the first viewport is recognisably a shelf when blurred; the
no-image lead cover is as finished as an image cover; all plate/text pairs
pass 4.5:1 at the three test hexes; the catalogue list is scannable by date;
the article page reads at 62–68ch with the cover beside it; mobile keeps the
shelf metaphor.
Fail when: rounded card grid; uniform cover heights in a tidy grid; a
centred masthead hero above the shelf; tag chips; per-cover "Read more"
buttons; raw accent behind text; image-led covers.

## Best fit

Publications with few, long, considered pieces by one author — a series, not
a feed.
