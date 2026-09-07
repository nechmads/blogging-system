# Studio run record — internal

Not part of the shareable package. Critic inputs never include this file.

Budget per concept: initial build + fresh assessment, up to 2 critique-driven
revision rounds (target 8.5/10), then polish + frontend-review (fix mode),
plus the reserved final assessment if polish changed the appearance. Max 4
valid assessments per concept. Every critic is a new `ap-design-critic`
conversation given only the fixed prompt, the concept's brief, and
neutral-named screenshots.

| concept | build | assess 1 | round 1 | assess 2 | round 2 | assess 3 | polish | review | final |
|---|---|---|---|---|---|---|---|---|---|
| 01 cover-stock | done | 7.5 | done | 7.5 | done | 8.0 | done | done | **8.0** |
| 02 horizon | done | 7.5 | done | 8.0 | done | 7.5 | done | done | **7.5** |
| 03 poster | done | 7.5 | done | 7.5 | done | 8.0 | done | done | **8.0** |

## Log

- 2026-09-07 — run created in worktree `~/Projects/hotmetal-design-round2`
  (branch `design/emdash-templates-round2`). Content, images and the first
  run's fonts are reused from `emdash-2026-09-06` (`_build/content.py` copied,
  `common.py` reads both font dirs). Six new families bundled to
  `_shared/fonts` via `_build/fetch-fonts.py` (Fraunces, Instrument Sans,
  Schibsted Grotesk, Literata, Bricolage Grotesque, Geist; latin + latin-ext).
- New dependency-free capture tool `_build/capture.mjs` (headless Chrome over
  CDP): full-page with automatic dpr drop and 8000px banding past Chrome's
  16384px limit, viewport shots at scroll offsets, reduced-motion emulation,
  scroll priming, waits for `document.fonts.ready`. Verified on round-one
  pages.
- Exploration produced 3 directions with external entropy seeds; see
  `BRIEF.md` and `packets/`. Packets are per-file so each implementer sees
  only its own.
- Screenshots go to `_shots/<concept>/` (gitignored).

### Build 1 — concept 01 Cover Stock (2026-09-07 16:34)

Built by an isolated implementer. Reported: shelf snap + keyboard, catalogue
"Turn" back-of-issue toggle, sticky cover on the article, spine strip on
mobile, method="dialog" forms verified, no console errors, all 8 titles fit at
1440/390. Contrast table measured at three hexes: lowest pair 4.92:1 (link
underline marks at #ffd400). Root-cause note worth keeping: `cqw` inside the
container's own `grid-template-rows` resolves against the viewport, not the
element — fixed with an inner grid. Gap: optional spine state not built.
Critic 1 dispatched (fresh ap-design-critic, artifacts only).

### Build 1 — concept 02 Horizon (2026-09-07 ~16:40)

Built by an isolated implementer. Piecewise day-scaled axis (Feb 12–Mar 8,
break "174 days skipped", Aug 29–Sep 7), raised/dropped stagger for ≤4-day
clusters, no-image entries always raised so the lead is the cleanest entry.
Sticky axis compacts after 48px; rAF scroll-spy verified at 7 offsets and after
anchor jumps. One accent derivation for all four roles; lowest measured 4.61:1
at #ffd400. Gaps: focus ring not visually captured (headless focus limitation);
grey accents get tinted by the chroma floor; capture.mjs occasionally throws
ENOTEMPTY on profile cleanup after writing (harmless race).
Critic 1 dispatched.

### Assessment 1 — concept 01 Cover Stock: 7.5

Fit 8 · identity 8.5 · composition 7 · type 7 · hierarchy 7.5 ·
distinctiveness 8.5 · restraint 8 · craft 7. Headline findings: ~250px void
between the description and the shelf in the home's first viewport, with
cover No. 37 cut mid-date at the edge; the article cover (508×760, saturated)
never recedes and pushes the body right of centre; three stacked
introductions on the article (cover deck, italic deck, serif standfirst,
byline); Fraunces "wonk" italic h reads as a fi-ligature at deck size; small
covers clip the imprint under a neighbour and carry 60–70px image stamps that
spotlight the weakest images; eight identical TURN links; duplicate subscribe
form. Praised: the cover grid as the no-image answer, the shelf, the accent
logic at both hostile hexes, the catalogue and sources blocks. Round 1 sent
to the implementer with all three changes plus the minor restraint items.

### Build 1 — concept 03 Poster (2026-09-07 ~16:55)

Built by an isolated implementer. Title size tiers by character count (lead
12/12/10/8vw, wall 7.5/6.5/5.5/4.6vw, mobile 20/18/15/12.5vw); all eight
titles measured as lead at 1440 (fill 79–96%, fits 900) and at 390. Load
settle via CSS keyframes (wdth 100/wght 300 → 84/800, none under reduced
motion). Hover reveal follows the cursor and dodges the deck; keyboard focus
pins the square beside the title; coarse pointers get an inline 72px square.
Tint/floor derivations measured: lowest 4.79:1 (tag underline at #ffd400).
Viewport heights capped with min(100svh, 62rem) because full-page capture
inflates the viewport. Critic 1 dispatched.

### Assessment 1 — concept 02 Horizon: 7.5

Fit 7.5 · identity 8.5 · composition 6.5 · type 8 · hierarchy 7 ·
distinctiveness 9 · restraint 8.5 · craft 7. Headline findings: the archive
is a 3,900px staircase because each entry's text block drifts to its date's x
(one and a half entries per viewport, half the width blank) while vertical
rhythm is perfectly even, contradicting the stagger rule; the hero's left half
is abandoned (description + follow links in the bottom-left corner, ~400px
void) and there is no nav; the sticky cursor lands on the "17" label and a
leader crosses the label row; the article progress line paints over the date
axis. Praised: the axis, the image-less lead, time carried through the
article and comments, weight discipline. Round 1 sent with all three changes.

### Assessment 1 — concept 03 Poster: 7.5 (second dispatch)

The first critic dispatch stalled on a watchdog timeout while cropping the
tall full-page images under heavy machine load (load average ~27 from
unrelated system daemons) and issued no score — void, not counted. Fix: added
exact first-viewport captures (`post-desktop-fold.png`, `post-mobile-fold.png`)
so critics never need to crop, and told the critic so. Lesson: always ship
fold shots alongside full-page shots.

Fit 8 · identity 8.5 · composition 6.5 · type 7 · hierarchy 7.5 ·
distinctiveness 8.5 · restraint 8 · craft 6.5. Headline findings: archive
band gaps (~300px) larger than the bands, 5,003px home, ~1.7 entries per
viewport; mobile poster void (~250px) reads as a failed image; lead rag
strands "Future" alone; coloured tag underlines multiply the accent and are
the weakest element under hostile hexes; 25px left margin vs 120px right
column; flat semibold small-type tier; article intro in three sizes and a
560px right void. Praised: the lead fold, the vertical name + nav cluster,
the wall and the reveal, the accent tint at both hexes. Round 1 sent with
all findings. The same-session Cover Stock implementer also stalled once on
the watchdog and was resumed by message.

### Round 1 — concept 02 Horizon

Ticks/thumbnails/date labels stay at real x; a short leader drops into one
left-aligned 720px reading column (no alternation; the implementer rejected
two columns because thumbnails already carry the date position). Vertical
gap = 32px + 12px × min(days of silence, 8), so the Feb cluster is visibly
tighter. Home 3896 → 3335px, ~3 entries per viewport. Identity block moved up
as a left column aligned with the lead; quiet Archive · About · RSS on the
masthead line; deck flush-left in the right-pinned block; orphan "2026"
removed. Compact strip 60px with clear ground under labels; cursor sits on
the baseline; article progress line is a separate 2px hairline under the
strip. Capture tool: settle delay after priming raised 150 → 450ms because a
scroll-driven transition was caught mid-shrink. Critic 2 dispatched.

### Round 1 — concept 01 Cover Stock

Right column now one structure (shelf label above bottom-aligned covers at
~66% of the lead's height); partially visible covers hide their number and
imprint via IntersectionObserver so none is cut mid-date. Article: full cover
in an opening with one standfirst + byline, then a 250px sticky facsimile
that appears once the opening cover scrolls off; body column moved to
x≈370–975 (66ch). Three intros collapsed to one. Fraunces WONK/SOFT/ss0x are
not in the bundled file (tested; identical renders), so decks and the
publisher's note moved to Source Serif 4 italic. Imprint uses container
queries to abbreviate/wrap; plates bleed the illustration zone width with a
stock mat. TURN ×8 → one "+" disclosure per row; whole row toggles. Second
"subscribe" was the comment form — nothing removed. No colours changed.
Coordinator added `home-desktop-fold.png`, `post-desktop-fold.png`,
`home-mobile-fold.png` for the critic. Critic 2 dispatched.

### Assessment 2 — concept 02 Horizon: 8.0 (7.5 → 8.0)

Fit 8.5 · identity 8.5 · composition 7 · type 8 · hierarchy 8 ·
distinctiveness 9 · restraint 8.5 · craft 7. Findings: the now marker and
the scroll cursor share one glyph (identical at #0a0a2a, marker nearly
invisible at #ffd400); "Read the forecast" underline stays red in the swap
shots (possible hard-coded token — to verify); archive left-loaded, the date
hang carried only by the small image; home compact axis ~190px vs the
article strip's ~55px; lead deck belongs to neither edge; mobile byline
comma spacing; zero-scroll progress sliver (the capture-timing artifact,
now explicit). Round 2 sent with all four items.

### Assessment 2 — concept 01 Cover Stock: 7.5 (no change)

Fit 8.5 · identity 8.5 · composition 6.5 · type 8 · hierarchy 8 ·
distinctiveness 8.5 · restraint 7.5 · craft 6. Findings: article deck
(x≈495) and body (x≈370) on different axes, right third empty once the cover
shrinks; mobile running head pins ~120px below the top and cuts through a
body line (defect); fourth shelf cover sliced mid-glyph at the right edge
(also mobile); "Latest issue" line restates the cover; two "newest first"
notes; eight "+" squares; small-cover photos in a white matte read as pasted
thumbnails; tagline floating in the upper-right void. Praised: the lead
cover, the accent behaviour, the catalogue, the sticky mini-cover. Critic
noted it did not open two of the twelve shots and judged the article's
lower sections downscaled. Round 2 sent with all five items.

### Round 1 — concept 03 Poster

Wall gap ~198 → ~99px (home 5,003 → 4,147px, two bands per viewport);
mobile hero no longer forces a screen height, deck 2rem under the title.
Lead rag fixed by rule: `glue()` binds the last two words of every title
with a no-break space (Chrome's `text-wrap: pretty` alone did not prevent the
orphan); all eight titles re-measured as lead at 1440/390. Tag underlines
removed (plain text, middots) so the accent is one event per screen. New
`--edge: 5rem` left margin answering the 6rem rail; meta/tags/labels demoted
to 400. Article intro collapsed to two tiers; column shifted toward centre
(x≈267–950); pull quotes and the two-column sources claim the right side.
Reveal square shrinks adaptively (240 → ≥160px) in the fallback slot so it
never crosses into the next band. Defect found and fixed during the pass:
mobile pull quotes clipped at the right. Critic 2 dispatched.

### Assessment 2 — concept 03 Poster: 7.5 (no change)

Fit 8 · identity 8.5 · composition 6.5 · type 7.5 · hierarchy 7.5 ·
distinctiveness 8.5 · restraint 8.5 · craft 7. Findings: the fold does not
consume the screen (widest line to x≈1015, lines end y≈520, deck stranded in
the corner); wall title size follows string length so the longest title is
the smallest; article bold leaks into H2s, lead-ins, comment names and
section heads, and the column leaves the right third dead; tag line nearly
touching the fixed nav cluster; accent twice on the article fold (highlight +
tinted underline); article untested at the hostile hexes. Praised: the
vertical masthead + cluster, the wall and reveal, the accent highlight.
Round 2 sent with all four items plus article accent shots.

### Round 2 — concept 01 Cover Stock

One centred grid (`cover-w | minmax(0, 68ch)`) so standfirst and body share
x=631 and the sticky pair is centred; shelf fitted by script to n whole
covers + a 40px blanked spine (no sliced titles at 1440/390); shelved covers
raised to ~72% of the lead; tagline and "Back issues" moved directly above
the shelf; "Latest issue" caption removed; one "newest first"; rows are the
links with a single "Show summaries" header control; small-cover photos
flush, greyscaled + `mix-blend-mode: luminosity` so they take the plate hue.
Mobile running head: a real gate defect fixed (it now observes the whole
opening), and the 120px offset the critic saw was a CAPTURE ARTIFACT —
`captureBeyondViewport: true` under mobile emulation displaces sticky/fixed
elements and fires IntersectionObservers for off-screen content. Fixed in
`capture.mjs` (viewport shots now pass `captureBeyondViewport: false`);
re-captured `post-mobile-scroll-1200.png` (+ new `-2400.png`): the bar pins
flush at the top. Lesson for the memory notes. Critic 3 dispatched.

### Round 2 — concept 02 Horizon

"Now" is a 3px accent stem breaking the baseline with a pennant (reused on
the post strip, comments mini-axis and mobile rail); the reader cursor is a
hollow ink square. Accent: the underline's computed colour was already the
derived token — the stale red was Chrome not repainting
`text-decoration-color` after a custom-property change on <html>; a
MutationObserver nudges a repaint on live swaps (prototype-only concern).
Token cap 0.55 → 0.50; lowest measured 5.73:1 at #ffd400. Archive entries
draw a hairline from the left margin to their tick. Compact strip 64px;
the ~190px the critic saw was the 320ms collapse transition caught
mid-flight, so compaction is now an instant snap. Deck + CTA right-aligned
to the headline edge; proportional figures in the byline; progress hairline
has an explicit zero state and starts under the wordmark. Critic 3 dispatched.

### Assessment 3 — concept 01 Cover Stock: 8.0 (7.5 → 8.0)

Fit 8.5 · identity 8.5 · composition 7 · type 8 · hierarchy 8 ·
distinctiveness 8.5 · restraint 8.5 · craft 7.5. Remaining: the shelf's
right edge (35px sliver + stray rules) still reads as a cut; article first
viewport half empty (lede at y≈460, 35px off the deck zone); two voids in
the lead cover; three date registers; flat lower-page label tier. No
clipping or collisions found. Revision budget spent; polish + frontend
review (fix mode) dispatched to the implementer with those four items as
craft targets, then the reserved final assessment.

### Assessment 3 — concept 02 Horizon: 7.5 (8.0 → 7.5)

Fit 8.5 · identity 8.5 · composition 6.5 · type 8 · hierarchy 8 ·
distinctiveness 8.5 · restraint 8.5 · craft 6.5. A different critic
weighted composition harder: the desktop archive occupies a ~650px left
column with the right half blank for 2,000px (the previous critic had asked
for exactly this single column; this one wants the rules to run full width
with the image/meta at the true x) — a genuine disagreement, not a
regression. Two real defects it found: the sticky compact strip is not
sealed (glyph tops bleed under the tick labels) and the lead's leader is
disconnected from its tick. Also: mobile numerals too small to be the
signature, header stack with RSS twice, inline code undersized, ~11px strip
labels. Praised: the axis header, weight discipline, the date-length rules,
the required surfaces. Budget spent; polish + frontend review dispatched
with the defects and the mobile/density items, the full-width rule idea
marked optional.

### Round 2 — concept 03 Poster

Lead-fit script (progressive enhancement over the CSS tiers): measures a
hidden clone at final axis values, raises size until title + caption exceed
the first screen, then picks the size whose widest line comes closest to
the rail; all eight titles fill 85–100% at 1440×900 with the caption inside
the fold. Deck moved under the title's left edge as the caption; CTA
1.25rem black. One wall size (5.5vw / 10vw mobile), never by length. H2s
weight 450 / width 82 / opsz 60; lead-ins and comment names 500; label tier
regular; column 41rem centred between edge and rail; link underlines ink so
the accent is one event per screen; article accent shots added. Right
gutter 2.5rem so band text clears the nav cluster by ≥52px. All `vh`
spacing replaced with rem because full-page capture inflates the viewport
(the footer had dropped off the shot). Critic 3 dispatched.

### Assessment 3 — concept 03 Poster: 8.0 (7.5 → 8.0)

Fit 8.5 · identity 8.5 · composition 7.5 · type 7.5 · hierarchy 8 ·
distinctiveness 8 · restraint 8.5 · craft 7. Remaining: the fold stacks
deck under title instead of using the void beside the shortest line; the
title breaks differently between the fold and full-page captures (the fit
script depends on viewport height — full-page capture inflates it); a
single wall size leaves short titles orphaned (the previous critic had asked
for exactly one size — disagreement; polish gets a bounded range); bold
still spread on the article; reveal-square gap inconsistent; sources
numbers misaligned. Budget spent; polish + frontend review dispatched.

### Polish + review — concept 02 Horizon

Polish: strip sealed (72px, opaque bottom edge, labels 12px); one continuous
leader tick → meta on the lead; dead band cut and gap rule scaled to
`20 + 8·min(days, 8)` (home 3335 → 2997px, archive ≈ two viewports); each
entry is now a full-width axis slice with notch/image/meta at true x; mobile
numerals 2.25 → 4.5rem; nav collapsed to Archive · About with one social
line; comments "now" is a plain ink tick (one coloured flag per page);
elapsed wording scales ("N years and D days… Time has told."). AI-tell
self-assessed 3 → 2. Review (fix mode): P2 scroll-spy overshoot after anchor
jumps fixed (reading line capped at min(25% viewport, 200px)); P2 missing h1
fixed; P3 meta-on-rule and mobile month-name seating fixed. Remaining P3:
`:focus-visible` cannot be captured in headless Chrome (rule verified in
CSS). Appearance changed → reserved final assessment dispatched.

### Final assessment — concept 02 Horizon: 7.5

Fit 8 · identity 8.5 · composition 6.5 · type 8 · hierarchy 7.5 ·
distinctiveness 8.5 · restraint 8 · craft 7.5. Four valid assessments
(7.5 / 8.0 / 7.5 / 7.5); target not reached; budget spent. The first desktop
viewport and the article page are consistently praised; the archive below
the fold is the persistent disagreement between critics (single column vs
positioned titles vs full-width slices — three critics asked for three
different things). Remaining, for whoever ports it: the sticky strip keeps
"09" dark while the cursor is in February (hierarchy error inside the
orientation element); mobile has no drawn axis line and 480px of masthead
before the lead; persona copy baked into UI strings ("Read the forecast",
"Time will tell.") must become neutral template strings; no subscribe form
on the home page; 23 underlined tags read as noise; "2" label tangent to the
lead leader.

### Polish + review — concept 01 Cover Stock

Polish: every cover carries a vertical spine (series · number); the cover
cut by the shelf edge shows only its plate-coloured spine, and the fitted
row ends inside the page margin at 1440/900/390; article lede baseline on
the cover's title baseline with the first two paragraphs in the opening;
face-out title ×1.25 and deck 5.8cqw so the lead cover is one block; one
date register ("Sep 2, 2026") everywhere except the catalogue's ISO;
section labels below CATALOGUE tapered; eight "BACK OF ISSUE" labels, the
footer slogan and dead CSS removed. AI-tell self-assessed 3 → 2. Review
(fix mode): P2 no h1 fixed; P2 mobile running head became a plain in-flow
sticky strip at the body's start (no 35px hole, no boundary gap); P2 "More
from the shelf" ledge inset regression fixed; P3 aria-invalid, 36/44px
touch targets, mobile lead width. Open P3: focus-visible not exercisable
by real Tab in headless Chrome (verified by forcing the style). Appearance
changed → reserved final assessment dispatched.

### Final assessment — concept 01 Cover Stock: 8.0

Fit 8.5 · identity 8.5 · composition 7.5 · type 8 · hierarchy 8 ·
distinctiveness 8.5 · restraint 8.5 · craft 7. Four valid assessments
(7.5 / 7.5 / 8.0 / 8.0); target not reached; budget spent. Remaining: the
shelf shows three face-outs + one spine and relies on arrow buttons instead
of standing all seven issues on the shelf (the spine device could carry the
rest); the article's shelf line crosses the reading column and the sticky
cover shifts from x≈185 to x≈324; the article cover's band/foot are serif
where the home covers' are sans; a MOBILE MARGIN DEFECT (tagline and
"Back issues" rows flush at x=0 — a polish side-effect the review missed).
Only the margin defect is being repaired (fix mode, no reassessment); the
8.0 belongs to the pre-repair version.

### Polish + review — concept 03 Poster

Polish: the lead-fit script now chooses size and caption slot together —
prefers a size whose widest line reaches the rail AND leaves a ≥20rem void
beside the last/shortest line, then places the caption in that void
(fallback: under the title's left edge with spare space below); size budget
is the 1440×900 reference fold so the break is viewport-height-stable;
titles capped at three lines. Wall: one base size, one-liners may grow up
to 1.3× (comparable ink mass); mobile alternates title only. Article: H2s
400/wdth 80, lead-ins plain, names regular, pull quotes −0.02em. Reveal gap
24px on both bands; sources numbers on the column edge. AI-tell
self-assessed 3 → 2. Review (fix mode): P2 no-JS/900px caption stacked at
the hero bottom fixed; P2 absolute caption using the grid area as
containing block fixed; P2 void probe measured mid-animation fixed. Open
P3: focus rings not paintable in headless Chrome (rule verified; simulated
evidence); Bricolage/Geist have no italic (synthesized oblique in one pull
quote). Appearance changed → reserved final assessment dispatched.

### Final assessment — concept 03 Poster: 8.0

Fit 8 · identity 8.5 · composition 7.5 · type 8 · hierarchy 8 ·
distinctiveness 8 · restraint 8.5 · craft 7.5. Four valid assessments
(7.5 / 7.5 / 8.0 / 8.0); target not reached; budget spent. The home fold is
now praised without reservation. Remaining: the archive reads as a
large-type list (critics 2/3/4 disagreed on how titles should size — one
size, bounded growth, or fill-to-measure); the article opens without a
poster moment; mobile title-only alternation reads as a wrapping error
(flip the whole band or drop it); sources domain line at a third indent;
footer/teaser on a different grid; nav cluster 50px from right-band tags.
Cover Stock's mobile margin defect was repaired (padding leftover from the
shelf-column change) without reassessment.

## Cross-cutting lessons from this run

- Ship exact first-viewport captures (`*-fold.png`) with every set; two
  critics stalled or mis-cropped tall full-page images.
- `Page.captureScreenshot` with `captureBeyondViewport: true` under mobile
  emulation displaces sticky/fixed elements and fires IntersectionObservers
  for off-screen content; viewport shots must pass `false`.
- Full-page capture inflates the viewport, so any `vh`-based spacing or
  JS that measures `innerHeight` renders differently in a full-page shot
  than on screen. Poster's lead-fit had to use a fixed 1440×900 reference
  budget; Cover Stock uses `vw`, Horizon rem.
- Chrome does not repaint `text-decoration-color` after a custom property
  changes on <html> — a live accent swap needs a repaint nudge (prototype
  only; the real template sets the accent server-side).
- Google's CSS API serves Fraunces without its WONK/SOFT axes; the wonky
  italic h cannot be turned off in the bundled file.
- Watchdog stalls (600s no progress) hit two agents while the machine was
  at load average ~27 from unrelated system daemons; resuming by message
  worked, and a background capture task does not re-wake its agent — send
  a nudge.
- Critics disagree most about archive composition (all three concepts);
  the first viewport and the article reading column converge quickly.
