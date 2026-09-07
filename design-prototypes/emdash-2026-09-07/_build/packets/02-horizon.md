# Creative packet 02 — Horizon

Output directory: `design-prototypes/emdash-2026-09-07/02-horizon/`
Seed: `35584857fa0661b9f1dfdf993893ac18`

## 1. Core idea and product job

The publication is called *Looking Ahead*: every post is a forecast that time
then judges. So **time is the spine of the site**. A large date axis runs
across the top of the home page; posts hang from their dates; "now" is at the
right edge and is the only thing in colour. Scrolling down travels back along
the axis into the past. On the article page the axis becomes a thin sticky
strip with the post's own date marked and a reading-progress line.

Feeling: calm foresight — a chart table, not a dashboard. It must still make
the lead irresistible (the lead is pinned to "now" and is the largest thing
below the axis) and the archive scannable (the axis *is* the archive's order,
and each hung entry is a plain, big, readable title).

## 2. Originality method — binding art direction

Emotional target: standing at a chart table looking at what is ahead.
World: the forecaster's chart room — tide tables, almanacs, ephemerides,
timeline scales, ruled axes with big numerals. Its principles, translated:

- **Position means date.** Everything on the home page is placed by when it
  happened; the axis is the composition, not a decoration.
- **Scale marks are the only ornament.** Ticks, one baseline, month labels.
  No boxes, no cards, no rules other than the axis and its ticks.
- **Numerals are the display type.** Months and years set very large and
  light; titles set heavy but smaller than the numerals.
- **"Now" is the only colour.** The accent marks today, the reading-progress
  line and links; nothing else.

Literal motifs to reject: weather icons, isobars, compass roses, sextants,
tide-chart curves, "roadmap" dots-on-a-line with cards, chart chrome
(legends, axis labels in boxes), monospaced type, green-on-black.

The premise must not outshout the content: the axis owns the first 25–30% of
the viewport at most; the lead headline owns the rest.

## 3. Content-native generator

**Elapsed time.** The relationship between when a thing was said and now.
It governs composition (position by date), hierarchy (nearest to now is
largest), the archive's structure (order and gaps), navigation (the axis is
the nav), and the article's progress line (time spent reading, drawn on the
same axis).

The sample data is bursty: one post on Sep 2, two in early March, five inside
Feb 16–24. A proportional axis would pile six posts into three weeks and leave
a six-month void. That is a real property of publishing, so the axis must
handle it honestly: **compress empty stretches into a marked break** (an axis
break glyph, like a chart's ⫽) and give clustered dates a stagger rule so
titles never overlap. Do not fake even spacing.

## 4. Inputs, probable defaults, and rejections

Probable defaults to refuse: a vertical timeline with dots and cards; a top
navbar with wordmark left and links right; dates as small grey labels under
titles; a hero image; mono type for numbers; a "latest posts" grid under the
hero; small-caps labels.

Deliberate alternatives: the axis as the header (the wordmark sits at the
axis origin, small, as the chart's title block); the lead headline
right-aligned, growing leftward from the "now" marker; dates as the largest
type on the page; entries hung from ticks with leader lines; images pinned to
the axis as small square annotations.

## 5. Composition contract

- **First viewport silhouette:** a thin horizontal band across the top with
  large light numerals and short ticks, a single coloured marker at the right
  end; beneath it, a heavy right-aligned headline block with a deck; a lot of
  white on the left. Recognisable when blurred as a ruler over a block of
  text.
- Home below the fold: the axis stays sticky (compressed to ~48px) and a
  "you are here" cursor moves back along it as the reader scrolls; entries
  are hung in date order, each a large title (2.5–3rem), a one-line deck,
  kicker + reading time, and — when it exists — a small square image pinned
  to its tick with a leader line. Entries alternate hanging position so a
  cluster reads as a stagger, not a pile.
- Post page: axis strip at top, thin and sticky, with the post's date marked
  and the progress line drawn from the origin toward "now" as the reader
  advances. Article column 62–66ch, left of centre; h2s carry a small tick;
  sources as a tabular list with columns (n · title · site); comments dated
  on a miniature axis or with the same tick vocabulary.
- Density sparse. Nothing is boxed.

## 6. Typography contract

- **Schibsted Grotesk** (variable 400–900, italic) for everything structural:
  month/year numerals at 5–8rem weight 400, titles at weight 700–800,
  kickers, nav, forms, comments. Tabular figures on for every date.
- **Literata** (variable, opsz) for the article body at ~1.125rem / 1.6, and
  for decks on the home page in italic at a larger size.
- Contrast comes from scale inversion (numerals bigger than titles) and from
  weight in exactly one role (titles). Nothing else is bold.
- Collision safeguards: hung titles use `text-wrap: balance` and a max
  width; the stagger rule for clustered ticks keeps leader lines from
  crossing text; at 390px the axis rotates to a vertical rail and titles
  never sit under a leader line.

## 7. Color contract

- Ground: cold white. Ink: blue-black. Axis and ticks: mid grey.
- **Accent only on: the "now" marker, the reading-progress line, in-text
  links (underline), and the focus ring.** Derived with CSS relative colour
  and contrast-floored: measure the link underline and the marker against
  the ground at `#b4361f`, `#ffd400` and `#0a0a2a`; record the values. A pale
  accent must still mark "now" visibly (darken the derived marker; never
  hide it).
- No second hue anywhere.

## 8. Imagery / content-bearing visual

The axis is the content-bearing visual. Featured images, when present, are
**annotations**: a small square (≈96–120px) pinned to the entry's tick with a
short leader line, like a photo clipped to a chart. When absent the tick
carries the date label only, which is the default state, so the lead (no
image) is the cleanest entry, not the poorest. On the article page the image,
if any, is a single square annotation beside the opening, never a hero band.

## 9. Interaction and motion

- Axis scroll-spy: as the reader scrolls the home page, the axis cursor moves
  to the date of the entry at the reading line. Implement as "last entry
  whose top is above the reading line" on a requestAnimationFrame-throttled
  scroll listener — not IntersectionObserver with a negative rootMargin.
- Hovering/focusing a tick highlights its entry and vice versa; ticks are
  focusable links.
- Article: the progress line grows along the axis strip with scroll.
- Reduced motion: the cursor and progress line jump instead of animating.

## 10. Mobile transformation

The axis becomes a **vertical rail** on the left (≈56px) with month labels
rotated or stacked, ticks pointing right, "now" at the top. Entries stack to
its right, left-aligned against the rail, the lead first and largest (the
desktop right-alignment does not survive a 390px column and is dropped). The
post page keeps the thin sticky strip at the top.

## 11. Signature moment and aesthetic risk

Signature: the giant light numerals of the axis with the single coloured
"now" marker, and scrolling the archive as travelling back in time with the
cursor sliding along the axis.
Risk: it reads as a generic "timeline component" or a product roadmap. Guard:
no dots-and-cards, numerals larger than titles, the break glyph for gaps,
sparse ground, right-aligned lead. Second risk: a dashboard feel; guard with
Literata italic decks and generous reading typography.

## 12. Acceptance and rejection checks

Pass when: the first viewport's largest type is a date; posts are positioned
by real dates with an honest break for the gap; the no-image lead is the
cleanest entry; the accent appears in ≤ 4 roles and passes the three test
hexes; the axis cursor tracks correctly at any scroll position including
anchor jumps; the article reads at 62–66ch; mobile keeps position-means-date
via the rail.
Fail when: vertical timeline with dots and cards; a navbar; a hero image;
mono numerals; chart legend chrome; even spacing that lies about the dates;
bold used in more than one role.

## Best fit

Forecasting, analysis and trend publications — anyone whose posts are dated
claims about the future.
