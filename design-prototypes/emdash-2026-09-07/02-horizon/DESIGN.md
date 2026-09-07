# Horizon — draft design notes (concept 02, prototype only)

Static prototype for the Hot Metal / EmDash template round two. These notes
describe this prototype's tokens and rules; they are not an application-wide
design system. Generator: `_build/c2.py` (Python 3, stdlib) — edit that, not
the HTML.

## Originality gate

- **Probable generic answer to refuse:** wordmark-left/links-right navbar,
  hero image, a "latest posts" grid, and dates as small grey labels under
  titles — or, in the other direction, a vertical timeline of dots and cards.
- **Content-native rule that generates the composition:** every element is
  placed by its real publication date on a horizontal axis whose right end is
  "now". Nearest to now is largest (the lead). The archive's order, gaps and
  clustering *are* the composition: the Mar→Sep void is compressed into a
  marked break, and the Feb cluster is staggered so titles never pile.
- **First-viewport silhouette and type roles:** a thin band across the top
  with giant light month numerals (Schibsted Grotesk 400, 6.5rem), short day
  ticks with small tabular numerals, one coloured square-and-bar at the right
  end; beneath it a heavy right-aligned headline (Schibsted 800) growing
  leftward from the Sep 2 tick, a Literata italic deck right-aligned to the
  same edge, and the identity
  block (description, author, follow links) as a small left column aligned
  with the lead's top; a quiet Archive · About · RSS line sits on the
  masthead. The largest type on the page is a date.
- **Familiar fallbacks that would invalidate it:** a navbar, a hero image,
  evenly spaced dates, mono numerals, bold in more than the title role, boxed
  legend/axis chrome, dots-and-cards.
- **How the premise still serves the job:** the lead is the largest thing
  under the axis and pinned to "now"; the axis is the nav (every tick is a
  focusable link to its entry, hover/focus links tick and entry both ways);
  the sticky strip plus scroll-spy cursor keeps the reader oriented in time
  while scanning; the article page keeps the strip thin and gives the
  reading column 62–66ch of Literata.

If the copy and logo were swapped for an unrelated product the page would
still be "a chart of when things were said" — the organising logic only makes
sense for dated claims, which is the packet's best-fit.

## Tokens

```
--ground      oklch(98.6% 0.004 240)   cold white page
--ink         oklch(21%   0.03  262)   blue-black text, titles, cursor
--ink-2       oklch(42%   0.022 258)   decks, kickers, meta
--axis        oklch(63%   0.012 255)   baseline, ticks, leaders, hairlines
--axis-soft   oklch(84%   0.008 250)   resting underline on tag/social links
--numeral     oklch(55%   0.014 255)   giant month numerals (September = ink)

--sans   "Schibsted Grotesk"  400 structure / 700 h2 / 800 titles; italic file bundled
--serif  "Literata"           body 1.125rem/1.6, decks italic 1.25–1.5rem, opsz auto

--gutter        clamp(20px, 4.4vw, 64px)
--axis-h        232px   expanded axis (≈26% of a 900px viewport)
--axis-compact  72px    sticky strip after 48px of scroll (expands again under 16px);
                        baseline 40px up, leaving ~19px of clear ground under the labels
--annot         88px    square image annotation pinned left of the tick
--lead-img 100px / --lead-bare 40px   leader length with / without a thumbnail
```

Weight is used in exactly one role: titles (h1/h2 800, article h2 700).
Everything else is 400 and differs by size, colour, style or placement.
Tabular figures are on for every `time`, tick label and numeral. Literata
uses `font-optical-sizing: auto`, so 18px body and 22–24px decks get their own
optical size from the variable font.

## Axis rules (computed in `c2.py` from the posts' ISO dates)

- Piecewise-linear scale in "day units". Segment A: 2026-02-12 → 2026-03-08
  (24 days). Break glyph: 2 units. Segment B: 2026-08-29 → 2026-09-07 (9
  days). Total 35 units; at 1312px inner width that is 37.5px per day.
- `x(d) = (d − A0)/35` in segment A, `(24 + 2 + (d − B0))/35` in B.
  Positions: Feb 16 .1143 · 17 .1429 · 18 .1714 · 20 .2286 · 24 .3429 ·
  Mar 1 .4857 · Mar 4 .5714 · Sep 1 .8286 · Sep 2 .8571 · now 1.0.
- **Break:** the 174 days between Mar 8 and Aug 29 are compressed into the
  glyph at .686–.743, drawn as a gap in the baseline crossed by two slanted
  strokes and labelled "174 days skipped". On the post page the progress
  line passes underneath; the glyph keeps its gap.
- **Hanging:** the lead hangs from its axis tick: the newest tick runs down
  to the axis edge (its day label set beside it) and the lead's leader
  continues from there to the meta line above the headline — one unbroken
  line from baseline to meta. Headline, deck and "Read the forecast" are
  right-aligned to that leader (nearest-to-now is the one right-pinned
  entry). Every archive entry is a **slice of the axis**: a full-width
  hairline (`--axis-soft`) with the date notch, thumbnail and meta at the
  entry's real x, and a short leader (40px, or 100px past a thumbnail) to
  ONE left-aligned reading column (max 720px). No entry flips alignment.
- **Cluster rhythm:** ticks keep their true uneven spacing on the axis; in
  the list the space above an entry is `20px + 8px × min(days of silence,
  8)`, so Feb 16/17/18 sit at 28px while Feb 24→Mar 1 opens to 60px; the
  Sep 2→Mar 4 void is carried by the axis break plus a fixed 24px. The seven
  archive entries span about two 900px viewports. Entries with no image
  simply have the short leader, so the no-image lead is the cleanest entry.
- Under 1100px the thumbnail moves to the right of the leader (no room on
  the left for the earliest ticks). Under 720px the axis becomes a vertical
  rail (40px + 20px gutter) whose month numerals are 4.5rem — still the
  largest type on the page:
  "now" at the top, month numerals on the rail, the break glyph between Sep 2
  and Mar 4, one tick per entry with the date as the entry's first line.
- Month numerals: "02" at the origin (Feb 1 is off-axis), "03" at Mar 1,
  "09" at Sep 1.

## Accent derivation

`--publication-accent` is set on `<html>` (default `#b4361f`). One derived
token carries every legibility-bearing use — the "now" mark, the reading
progress line, in-text link underlines and the focus ring:

```
--accent-ink: oklch(from var(--publication-accent) clamp(0.30, l, 0.50) max(c, 0.11) h)
```

Lightness is floored at .30 so a near-black accent still reads as a colour
against the ink, capped at .50 so a pale accent is dark enough to carry a
3px stem and a pennant; chroma is floored at .11 so the result is never grey.
Measured in Chrome (canvas-resolved sRGB against the ground
`rgb(251,252,253)`); the reader cursor is ink, never the accent:

| accent    | resolved         | now stem + pennant | progress hairline | link underline | comment-axis now | cursor (ink) |
|-----------|------------------|-------------------:|------------------:|---------------:|-----------------:|-------------:|
| `#b4361f` | rgb(174, 48, 24) | 6.25:1             | 6.25:1            | 6.25:1         | 6.25:1           | 17.09:1      |
| `#ffd400` | rgb(133, 92, 0)  | 5.73:1             | 5.73:1            | 5.73:1         | 5.73:1           | 17.09:1      |
| `#0a0a2a` | rgb(35, 35, 99)  | 13.54:1            | 13.54:1           | 13.54:1        | 13.54:1          | 17.09:1      |

Chrome does not repaint `text-decoration-color` when a custom property on
`<html>` changes after first paint; a MutationObserver on the root `style`
attribute nudges `.readlink` and `.prose a` so a live accent swap repaints
them (production sets the accent before first paint).

The focus ring uses the same token (2px outline, 3px offset). Tag, social and
source links rest on `--axis-soft` and take the accent only on hover, so the
accent stays in four roles and "now" remains the only colour on the page.
Edge case noted: a pure-grey accent has no hue, so `max(c, .11)` would tint it
red; the accent is per-publication and a grey accent is not expected.

## Interaction

- **Glyphs.** "Now" is the only accent-coloured mark and has its own shape:
  a 3px stem that breaks the baseline (ground halo) rising above it to a
  right-pointing pennant, label in ink below. Every post is a plain tick;
  the reader cursor is a hollow ink square sitting on the baseline (never
  filled), so the two stay distinct even when the accent is near-black.
- **Ruled distance.** Each archive entry draws a hairline from the left
  margin out to its tick, so the thumbnail's drift reads as measured
  distance from the origin; the lead has none (its tick hangs straight off
  the axis).
- Home: `.axis` is sticky; after 48px of scroll it gets `.is-compact`
  (an instant snap to a 64px strip; numerals shrink to 1.125rem). The
  hollow cursor sits through the baseline like a bead, clear of numerals above and labels below. A
  rAF-throttled scroll listener picks the last entry whose top is above the
  reading line (strip + min(25% of the viewport, 200px) — capped so an
  anchor jump, which lands an entry at 84px, never lets the next entry win)
  and moves the hollow cursor to that entry's `data-x`; the matching tick
  and its label turn ink. The strip is opaque with ~19px of clear ground
  under the 12px tick labels, so nothing bleeds through.
- Ticks are `<a href="#e-slug">` with `aria-label="date — title"`; hovering or
  focusing a tick adds `.is-hot` to its entry (leader thickens, title
  underlines) and vice versa.
- The comments mini-axis ends at "now" with a plain ink tick, so the page
  keeps exactly one coloured flag. RSS appears once in the identity block
  and once in the footer; the masthead nav is Archive · About.
- The margin figure scales: days for under a year ("Time will tell."),
  then years and days ("Time has told."); the template computes it per
  render from `publishedAt`.
- Post: the strip is sticky at 72px; `--p` = scrollY / (docHeight − viewport)
  drives a separate 2px accent hairline along the strip's bottom edge — it
  starts under the wordmark, not at the axis origin, and is hidden at zero
  scroll (`.at-top`) — so it never reads as travel along the date axis; the
  strip's
  ticks link back to `index.html#e-slug`; the sticky aside's list tracks the
  current h2 with the same "last heading above the reading line" rule.
- Forms use `method="dialog"` + `novalidate`; local validation marks fields
  and focuses the first bad one; a valid submit shows "Demo only — nothing was
  sent." and resets.
- `prefers-reduced-motion: reduce` removes every transition, so the cursor,
  strip and progress line jump.
