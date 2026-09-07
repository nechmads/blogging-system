"""Concept 02 — Horizon. Time is the spine: a date axis across the top, posts
hung from their real dates, "now" at the right edge as the only colour.

Run from _build:  python3 c2.py
Writes ../02-horizon/{index.html,post.html} plus fonts/ and img/.
"""

import os
from datetime import date

import common
from content import ARTICLE, CITATIONS, COMMENTS, POSTS, SITE, esc

OUT = os.path.join(common.RUN, "02-horizon")

# ---------------------------------------------------------------------------
# Axis geometry — computed from the posts' real ISO dates.
#
# Piecewise-linear scale. Segment A runs from a few days before the oldest
# post to a few days after the last post of the cluster; segment B runs from
# a few days before the newest post to "now". The void between them (174 days
# with nothing published) is compressed into a marked break glyph two "days"
# wide. Inside a segment, spacing is proportional: 1 day = 1/TOTAL of the axis.
# ---------------------------------------------------------------------------
NOW = date(2026, 9, 7)  # SITE["today"]
DATES = [date.fromisoformat(p["iso"]) for p in POSTS]

A0 = date(2026, 2, 12)
A1 = date(2026, 3, 8)
B0 = date(2026, 8, 29)
B1 = NOW
BREAK_UNITS = 2.0
DAYS_A = (A1 - A0).days
DAYS_B = (B1 - B0).days
TOTAL = DAYS_A + DAYS_B + BREAK_UNITS
GAP_DAYS = (B0 - A1).days


def xpos(d):
    """Fraction (0..1) of the axis width for a date."""
    if d <= A1:
        return (d - A0).days / TOTAL
    if d >= B0:
        return (DAYS_A + BREAK_UNITS + (d - B0).days) / TOTAL
    raise ValueError("date falls inside the compressed gap: %s" % d)


BREAK_X0 = DAYS_A / TOTAL
BREAK_X1 = (DAYS_A + BREAK_UNITS) / TOTAL

MONTHS = [  # (numeral, name, x)
    ("02", "February 2026", 0.0),  # Feb 1 is off-axis; the label sits at the origin
    ("03", "March", xpos(date(2026, 3, 1))),
    ("09", "September", xpos(date(2026, 9, 1))),
]

# Cluster handling: ticks keep their true (uneven) spacing on the axis; in the
# list, the space above each entry grows with the days of silence before it
# (see gap_px), so the Feb 16/17/18 run sits visibly tighter than Feb 24 -> Mar 1.


def fmt(x):
    return "%.4f" % x


def gap_px(days):
    """Vertical space above an archive entry: a base plus 12px per day of
    silence before it, capped at 8 days so the 182-day gap (already shown as
    the axis break) does not open a void in the list."""
    return 20 + 8 * min(days, 8)


def days_ago(d):
    n = (NOW - d).days
    return "today" if n == 0 else ("yesterday" if n == 1 else "%d days ago" % n)


def elapsed(d):
    """(numeral, caption) for the article's margin figure; scales past a year."""
    n = (NOW - d).days
    if n < 1:
        return ("0", "days since this was published. Published today.")
    if n < 365:
        return (str(n), "%s since this was published. Time will tell." % ("day" if n == 1 else "days"))
    y, rest = divmod(n, 365)
    return (str(y), "%s and %d days since this was published. Time has told." % ("year" if y == 1 else "years", rest))


# ---------------------------------------------------------------------------
# CSS
# ---------------------------------------------------------------------------
CSS = common.font_css(["schibsted-grotesk", "literata"]) + r"""
:root {
  --publication-accent: #b4361f;
  /* Every legibility-bearing use of the accent goes through this one
     derivation: lightness floored/capped, chroma floored so a near-black or
     pale accent still reads as *a colour* against the cold-white ground. */
  --accent-ink: oklch(from var(--publication-accent) clamp(0.30, l, 0.50) max(c, 0.11) h);

  --ground: oklch(98.6% 0.004 240);
  --ink: oklch(21% 0.03 262);
  --ink-2: oklch(42% 0.022 258);
  --axis: oklch(63% 0.012 255);
  --axis-soft: oklch(84% 0.008 250);
  --numeral: oklch(55% 0.014 255);

  --sans: "Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif;
  --serif: "Literata", Georgia, "Times New Roman", serif;

  --gutter: clamp(20px, 4.4vw, 64px);
  --axis-h: 232px;
  --axis-compact: 72px;
  --base: 44px;            /* baseline height above the axis bottom (expanded) */
  --base-compact: 40px;    /* labels end ~19px above the strip's edge: sealed, nothing bleeds */
  --annot: 88px;
  --lead-img: 100px;       /* leader length when a thumbnail hangs at the tick */
  --lead-bare: 40px;
  --ease: cubic-bezier(.3,.7,.2,1);
}
html { overflow-x: clip; background: var(--ground); color: var(--ink); }
body {
  margin: 0; font-family: var(--sans); font-size: 1rem; line-height: 1.5;
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
* { box-sizing: border-box; }
img { max-width: 100%; display: block; }
a { color: inherit; }
time, .tnum { font-variant-numeric: tabular-nums; }
:focus-visible { outline: 2px solid var(--accent-ink); outline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---------- the axis (home) ---------- */
.axis {
  position: sticky; top: 0; z-index: 10; height: var(--axis-h);
  background: var(--ground);
  /* compaction snaps: deterministic under any capture, and the cursor slide is the motion that matters */
}
.axis.is-compact { transform: translateY(calc(var(--axis-compact) - var(--axis-h))); }
.axis-in { position: relative; height: 100%; margin: 0 var(--gutter); }
.axis-title { position: absolute; left: 0; top: 18px; display: flex; gap: 14px; align-items: baseline; white-space: nowrap; }
.wordmark { font-size: 1.0625rem; font-weight: 400; letter-spacing: .01em; text-decoration: none; margin: 0; }
.wordmark a { text-decoration: none; }
.wordmark:hover, .wordmark a:hover { text-decoration: underline; text-decoration-color: var(--axis); text-underline-offset: 4px; }
.tagline { font-family: var(--serif); font-style: italic; font-size: 1rem; color: var(--ink-2); font-optical-sizing: auto; }
.mast-nav { position: absolute; right: 0; top: 18px; display: flex; gap: 22px; font-size: .9375rem; }
.mast-nav a { text-decoration: none; color: var(--ink-2); }
.mast-nav a:hover { color: var(--ink); text-decoration: underline; text-decoration-color: var(--axis); text-underline-offset: 4px; }
.axis.is-compact .mast-nav { opacity: 0; pointer-events: none; }
.axis.is-compact .axis-title { opacity: 0; pointer-events: none; }

.scale { position: absolute; left: 0; right: 0; bottom: 0; top: 0; --b: var(--base); }
.axis.is-compact .scale { --b: var(--base-compact); }
.seg { position: absolute; height: 1px; background: var(--axis); bottom: var(--b); transition: bottom 0s; }
.seg-a { left: 0; width: calc(var(--x1) * 100%); }
.seg-b { left: calc(var(--x0) * 100%); right: 0; }

.brk { position: absolute; bottom: var(--b); left: calc(var(--x0) * 100%); width: calc((var(--x1) - var(--x0)) * 100%); height: 0; transition: bottom 0s; }
.brk i { position: absolute; top: -8px; width: 1.5px; height: 16px; background: var(--ink-2); transform: rotate(24deg); left: calc(50% - 5px); }
.brk i + i { left: calc(50% + 4px); }
.brk small { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: .6875rem; color: var(--axis); letter-spacing: .01em; }
.axis.is-compact .brk small { opacity: 0; }

.month { position: absolute; bottom: calc(var(--b) + 13px); left: calc(var(--x) * 100%); line-height: 1; white-space: nowrap; transition: bottom 0s, font-size 0s; }
.month b { display: block; font-weight: 400; font-size: 6.5rem; letter-spacing: -.045em; color: var(--numeral); line-height: .78; font-variant-numeric: tabular-nums; transition: font-size 0s; }
.month span { position: absolute; left: 0.18em; bottom: calc(100% + 10px); font-size: .8125rem; color: var(--axis); letter-spacing: .01em; }
.month.m-last b { color: var(--ink); }
.axis.is-compact .month { bottom: calc(var(--b) + 6px); }
.axis.is-compact .month b { font-size: 1.125rem; letter-spacing: -.01em; line-height: .9; }
.axis.is-compact .month span { opacity: 0; }

.tick { position: absolute; left: calc(var(--x) * 100%); bottom: var(--b); width: 1px; height: 12px; margin-left: -0.5px; background: var(--axis); transform: translateY(100%); text-decoration: none; transition: bottom 0s, height .15s; }
.tick span { position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%); font-size: .8125rem; color: var(--ink-2); font-variant-numeric: tabular-nums; line-height: 1; white-space: nowrap; }
.tick.at-origin span { left: 0; transform: none; }
.tick::before { content: ""; position: absolute; left: -12px; right: -12px; top: -6px; bottom: -18px; } /* hit area */
.axis.is-compact .tick { height: 8px; }
.axis.is-compact .tick span { font-size: .75rem; top: calc(100% + 3px); }
.tick.is-current, .tick.is-hot, .tick:hover, .tick:focus-visible { background: var(--ink); height: 18px; width: 2px; margin-left: -1px; }
.axis.is-compact .tick.is-current, .axis.is-compact .tick.is-hot, .axis.is-compact .tick:hover, .axis.is-compact .tick:focus-visible { height: 12px; }
.tick.is-current span, .tick.is-hot span, .tick:hover span { color: var(--ink); }
/* the newest post's tick runs down to the axis edge and meets the lead's leader; its label sits beside it */
.axis:not(.is-compact) .tick.newest, .axis:not(.is-compact) .tick.newest.is-current { height: var(--base); }
.axis:not(.is-compact) .tick.newest span { left: auto; right: 8px; transform: none; top: 6px; }

/* "now": a 3px stem that breaks the baseline (ground halo) with a pennant —
   a different shape from every tick and from the reader cursor, so it stays
   the one special mark even when the accent is near-black */
.now { position: absolute; left: calc(var(--x) * 100%); bottom: calc(var(--b) - 14px); width: 3px; height: 48px; margin-left: -1.5px; background: var(--accent-ink); box-shadow: 0 0 0 3px var(--ground); transition: bottom 0s, height 0s; }
.now::before { content: ""; position: absolute; left: 3px; top: 0; width: 0; height: 0; border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 16px solid var(--accent-ink); }
.now span { position: absolute; right: 10px; top: 34px; font-size: .8125rem; white-space: nowrap; color: var(--ink); line-height: 1; }
.axis.is-compact .now { height: 34px; bottom: calc(var(--b) - 10px); }
.axis.is-compact .now::before { border-top-width: 6px; border-bottom-width: 6px; border-left-width: 12px; }
.axis.is-compact .now span { font-size: .6875rem; top: 24px; }

/* reader cursor: hollow, never filled */
.cursor { position: absolute; left: calc(var(--x, .857) * 100%); bottom: calc(var(--b) - 4px); width: 9px; height: 9px; margin-left: -4.5px; box-sizing: border-box; border: 1.5px solid var(--ink); background: var(--ground); transition: left .16s var(--ease); }

/* ---------- page body ---------- */
.page { margin: 0 var(--gutter); }
.hero { position: relative; padding: 48px 0 8px; }
.ident { position: absolute; left: 0; top: 48px; width: min(340px, 30%); }
.ident p { margin: 0 0 14px; font-family: var(--serif); font-optical-sizing: auto; font-size: 1.0625rem; line-height: 1.5; color: var(--ink-2); }
.ident .who { color: var(--ink-2); margin-right: 4px; }
.ident-links, .foot-links { display: flex; gap: 18px; font-size: .875rem; }
.ident-links a, .foot-links a, .tag-list a { text-decoration: underline; text-decoration-color: var(--axis-soft); text-underline-offset: 4px; text-decoration-thickness: 1px; }
.ident-links a:hover, .foot-links a:hover, .tag-list a:hover { text-decoration-color: var(--accent-ink); }

/* entries: the tick, its label and thumbnail sit at the entry's real x; a
   short vertical leader drops to one left-aligned reading column */
.entry { position: relative; padding-top: var(--gap, 64px); scroll-margin-top: 84px; --lead: var(--lead-bare); }
.entry.has-img { --lead: var(--lead-img); }
/* each entry is a slice of the axis: a full-width hairline with the date notch, image and meta at the true x */
.entry::before { content: ""; position: absolute; top: var(--gap, 64px); left: 0; right: 0; height: 1px; background: var(--axis-soft); }
.entry.lead::before { display: none; }
.entry.is-current::before, .entry.is-hot::before { background: var(--axis); }
.mark { position: absolute; top: var(--gap, 64px); left: calc(var(--x) * 100%); height: var(--lead); border-left: 1px solid var(--axis); }
.mark::before { content: ""; position: absolute; top: -5px; left: -1px; width: 1px; height: 11px; background: var(--ink-2); }
.kicker { position: absolute; top: 7px; left: 12px; margin: 0; font-size: .875rem; color: var(--ink-2); white-space: nowrap; line-height: 1.2; }
.kicker time { color: var(--ink); }
.annot { position: absolute; top: 10px; right: 14px; width: var(--annot); height: var(--annot); display: block; }
.annot::before { content: ""; position: absolute; left: 100%; top: 10px; width: 14px; height: 1px; background: var(--axis); }
.annot img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.85) contrast(1.02); }
.entry.is-current .mark, .entry.is-hot .mark { border-left-width: 2px; border-left-color: var(--ink); }
.entry.is-current .mark::before, .entry.is-hot .mark::before { background: var(--ink); }

.ebody { padding-top: calc(var(--lead) + 8px); max-width: 720px; }
.entry h2 { margin: 0; font-size: clamp(1.625rem, 2vw, 2.25rem); line-height: 1.06; font-weight: 800; letter-spacing: -.022em; text-wrap: balance; }
.entry h2 a { text-decoration: none; }
.entry h2 a:hover, .entry h2 a:focus-visible, .entry.is-hot h2 a { text-decoration: underline; text-decoration-color: var(--accent-ink); text-decoration-thickness: 3px; text-underline-offset: 5px; }
.dek { margin: 8px 0 0; font-family: var(--serif); font-style: italic; font-optical-sizing: auto; font-size: 1.125rem; line-height: 1.45; color: var(--ink-2); text-wrap: pretty; max-width: 640px; }

/* the lead hangs left of its tick, headline right-aligned to the leader,
   deck flush-left inside the same block */
.entry.lead { padding-top: 0; }
.entry.lead .mark { top: -48px; height: calc(var(--lead) + 48px); }
.entry.lead .kicker { left: auto; right: 12px; top: auto; bottom: 4px; font-size: .9375rem; }
.entry.lead .ebody { max-width: 720px; margin-left: auto; margin-right: calc((1 - var(--x)) * 100%); padding-right: 14px; padding-top: calc(var(--lead) + 10px); text-align: right; }
.entry.lead h2 { font-size: clamp(2.25rem, 4.9vw, 4.375rem); line-height: .98; letter-spacing: -.03em; text-align: right; }
.entry.lead .dek { font-size: 1.5rem; line-height: 1.4; margin: 24px 0 0 auto; max-width: 600px; }
.entry.lead .readlink { margin-top: 18px; }
.readlink { display: inline-block; font-size: .9375rem; text-decoration: underline; text-decoration-color: var(--accent-ink); text-decoration-thickness: 2px; text-underline-offset: 4px; }
.rest { padding-top: 24px; }

/* mobile rail pieces, hidden on desktop */
.rail-month, .rail-break, .rail-now { display: none; }

/* tags */
.tags { margin-top: 140px; max-width: 760px; }
.tags .label, .foot .label { font-size: .8125rem; color: var(--axis); margin: 0 0 8px; }
.tag-list { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: .9375rem; }

/* footer as a final baseline */
.foot { margin: 120px var(--gutter) 0; padding: 26px 0 56px; position: relative; display: flex; justify-content: space-between; gap: 32px; flex-wrap: wrap; font-size: .875rem; color: var(--ink-2); }
.foot::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--axis); }
.foot::after { content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 12px; background: var(--axis); }
.foot .fname { color: var(--ink); text-decoration: none; }
.foot p { margin: 0 0 6px; }

/* ---------- post page ---------- */
.strip { position: sticky; top: 0; z-index: 10; height: var(--axis-compact); background: var(--ground); }
.strip-in { position: relative; height: 100%; margin: 0 var(--gutter); display: grid; grid-template-columns: 200px 1fr; align-items: stretch; }
.strip .wordmark { align-self: center; }
.strip .scale { position: relative; --b: var(--base-compact); }
.strip .month b { font-size: 1.125rem; letter-spacing: -.01em; line-height: .9; }
.strip .month span { display: none; }
.strip .tick { height: 8px; }
.strip .tick span { font-size: .75rem; top: calc(100% + 3px); }
.strip .tick.post-tick { background: var(--ink); height: 11px; width: 2px; margin-left: -1px; }
.strip .tick.post-tick span { color: var(--ink); }
.strip .now { height: 34px; bottom: calc(var(--b) - 10px); }
.strip .now::before { border-top-width: 6px; border-bottom-width: 6px; border-left-width: 12px; }
.strip .now span { font-size: .6875rem; top: 24px; }
.strip .brk small { display: none; }
/* reading progress: its own hairline along the strip's bottom edge (under the wordmark too), not on the date axis */
.progress { position: absolute; left: 0; bottom: 0; height: 2px; width: calc(var(--p, 0) * 100%); background: var(--accent-ink); transition: width .25s var(--ease); pointer-events: none; }
.strip.at-top .progress { width: 0; transition: none; visibility: hidden; }

.post { margin: 0 var(--gutter); display: grid; grid-template-columns: minmax(0, 66ch) minmax(220px, 1fr); column-gap: clamp(48px, 7vw, 120px); padding-top: 72px; }
.post > * { grid-column: 1; }
.post-aside { grid-column: 2; grid-row: 1 / span 3; align-self: start; position: sticky; top: 100px; padding-top: 14px; }
.post-head { margin-bottom: 40px; }
.post-head .kicker { font-size: .9375rem; }
.post-head h1 { margin: 0; font-size: clamp(2.25rem, 4.2vw, 3.75rem); line-height: .98; letter-spacing: -.03em; font-weight: 800; text-wrap: balance; }
.post-head .sub { margin: 22px 0 0; font-family: var(--serif); font-style: italic; font-optical-sizing: auto; font-size: 1.5rem; line-height: 1.38; color: var(--ink-2); text-wrap: pretty; }
.post-head .meta { margin: 26px 0 0; font-size: .9375rem; color: var(--ink-2); }
.post-head .meta span { white-space: nowrap; }
.post-head .meta time { font-variant-numeric: normal; }
.post-head .meta span + span::before { content: " · "; color: var(--axis); white-space: normal; }
.post-annot { width: var(--annot); height: var(--annot); margin-top: 22px; }

.elapsed { margin: 0 0 40px; line-height: 1; }
.elapsed b { display: block; font-weight: 400; font-size: 6rem; letter-spacing: -.045em; color: var(--numeral); line-height: .8; font-variant-numeric: tabular-nums; }
.elapsed span { display: block; font-size: .875rem; color: var(--ink-2); margin-top: 12px; max-width: 24ch; line-height: 1.4; }
.toc { margin: 0; padding: 0; list-style: none; font-size: .9375rem; }
.toc li { position: relative; padding-left: 20px; margin: 0 0 10px; }
.toc li::before { content: ""; position: absolute; left: 0; top: .62em; width: 10px; height: 1px; background: var(--axis); }
.toc li.is-current::before { background: var(--ink); width: 14px; height: 2px; top: .58em; }
.toc a { text-decoration: none; color: var(--ink-2); }
.toc li.is-current a, .toc a:hover { color: var(--ink); }
.toc-label { font-size: .8125rem; color: var(--axis); margin: 0 0 12px; }

.prose { font-family: var(--serif); font-optical-sizing: auto; font-size: 1.125rem; line-height: 1.6; max-width: 66ch; }
.prose p { margin: 0 0 1.35em; text-wrap: pretty; }
.prose a { text-decoration: underline; text-decoration-color: var(--accent-ink); text-decoration-thickness: 2px; text-underline-offset: 3px; }
.prose a:hover { text-decoration-thickness: 3px; }
.prose strong { font-weight: 700; }
.prose code { font-family: var(--sans); font-size: .97em; letter-spacing: -.005em; }
.prose h2 { position: relative; font-family: var(--sans); font-weight: 700; font-size: 1.625rem; line-height: 1.15; letter-spacing: -.015em; margin: 2.2em 0 .7em; scroll-margin-top: 92px; text-wrap: balance; }
.prose h2::before { content: ""; position: absolute; left: -26px; top: .18em; width: 1px; height: .85em; background: var(--ink); }
.prose h2::after { content: ""; position: absolute; left: -26px; top: .18em; width: 14px; height: 1px; background: var(--ink); }

.post-tail { margin-top: 56px; }
.post-tail section { margin-top: 64px; }
.post-tail h2 { font-size: 1.125rem; font-weight: 400; margin: 0 0 20px; color: var(--ink); }
.post-tail h2 small { color: var(--axis); font-size: .875rem; margin-left: 8px; font-variant-numeric: tabular-nums; }

.sources { margin: 0; padding: 0; list-style: none; counter-reset: src; }
.sources li { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr) 11rem; column-gap: 16px; align-items: baseline; padding: 7px 0; font-size: .9375rem; }
.sources li::before { counter-increment: src; content: counter(src, decimal-leading-zero); color: var(--axis); font-variant-numeric: tabular-nums; }
.sources a { text-decoration: underline; text-decoration-color: var(--axis-soft); text-underline-offset: 4px; text-decoration-thickness: 1px; }
.sources a:hover { text-decoration-color: var(--accent-ink); }
.sources .site { color: var(--ink-2); font-size: .875rem; overflow-wrap: anywhere; }

.mini { position: relative; height: 44px; margin: 8px 0 28px; max-width: 520px; }
.mini .seg { bottom: 22px; left: 0; width: 100%; }
.mini .tick { bottom: 22px; height: 8px; }
.mini .tick.post-tick { background: var(--ink); height: 12px; width: 2px; margin-left: -1px; }
.mini .tick span { font-size: .75rem; }
/* the comments axis ends at now with a plain ink tick: the page keeps one coloured flag */
.mini .now { bottom: 22px; height: 14px; width: 1px; margin-left: -.5px; background: var(--ink); box-shadow: none; }
.mini .now::before { display: none; }
.mini .now span { font-size: .75rem; top: 18px; right: auto; left: 50%; transform: translateX(-50%); }
.comment { position: relative; padding-left: 5.5rem; margin: 0 0 28px; max-width: 60ch; }
.comment time { position: absolute; left: 0; top: .1em; font-size: .875rem; color: var(--ink-2); padding-left: 12px; }
.comment time::before { content: ""; position: absolute; left: 0; top: .35em; width: 1px; height: .9em; background: var(--axis); }
.comment .who { margin: 0 0 4px; font-size: .9375rem; }
.comment p { margin: 0; font-family: var(--serif); font-optical-sizing: auto; font-size: 1.0625rem; line-height: 1.5; color: var(--ink-2); }

form { max-width: 60ch; }
.field { display: grid; gap: 6px; margin: 0 0 18px; }
.field label { font-size: .875rem; color: var(--ink-2); }
.field input, .field textarea { font: inherit; font-size: 1rem; color: var(--ink); background: transparent; border: 0; border-bottom: 1px solid var(--axis); padding: 8px 0; border-radius: 0; }
.field textarea { min-height: 96px; resize: vertical; font-family: var(--serif); font-optical-sizing: auto; }
.field input:focus, .field textarea:focus { outline: none; border-bottom-color: var(--ink); box-shadow: 0 1px 0 var(--ink); }
.field.is-invalid input, .field.is-invalid textarea { border-bottom-color: var(--accent-ink); box-shadow: 0 1px 0 var(--accent-ink); }
.row { display: flex; gap: 16px; align-items: end; flex-wrap: wrap; }
.row .field { flex: 1 1 220px; margin: 0; }
button { font: inherit; font-size: .9375rem; color: var(--ground); background: var(--ink); border: 0; padding: 10px 18px; cursor: pointer; }
button:hover { background: var(--ink-2); }
.form-note { margin: 12px 0 0; font-size: .875rem; color: var(--ink-2); min-height: 1.3em; }
.form-note.is-ok { color: var(--ink); }
.subscribe p.intro { margin: 0 0 18px; font-family: var(--serif); font-optical-sizing: auto; font-size: 1.0625rem; color: var(--ink-2); max-width: 48ch; }

/* ---------- reduced motion: cursor and progress jump ---------- */
@media (prefers-reduced-motion: reduce) {
  .axis, .scale, .seg, .brk, .month, .month b, .month span, .tick, .now, .cursor, .progress, .mark { transition: none !important; }
}

/* ---------- narrow: the axis becomes a vertical rail ---------- */
@media (max-width: 1100px) {
  .annot { right: auto; left: 14px; top: 26px; }
  .annot::before { left: auto; right: 100%; }
  .entry.has-img { --lead: calc(var(--annot) + 40px); }
  .entry.lead .annot { left: auto; right: 14px; }
  .entry.lead .annot::before { right: auto; left: 100%; }
  .post { grid-template-columns: minmax(0, 1fr); }
  .post-aside { grid-column: 1; grid-row: auto; position: static; padding: 0; margin-bottom: 40px; }
  .elapsed { display: none; }
}
@media (max-width: 720px) {
  :root { --annot: 88px; --rail: 40px; }
  .axis { position: static; height: auto; transition: none; }
  .axis.is-compact { transform: none; }
  .axis-in { height: auto; padding: 16px 0 0; }
  .axis-title { position: static; flex-direction: column; gap: 2px; white-space: normal; }
  .mast-nav { position: static; margin-top: 8px; gap: 18px; }
  .axis.is-compact .mast-nav { opacity: 1; pointer-events: auto; }
  .axis.is-compact .axis-title { opacity: 1; }
  .axis .scale { display: none; }
  .archive { padding-left: var(--rail); }
  .hero { display: flex; flex-direction: column; padding: 20px 0 0; }
  .hero > * { order: 0; }
  .ident { position: static; order: -1; width: auto; margin: 0 0 28px calc(-1 * var(--rail)); }
  .ident p { font-size: 1rem; margin-bottom: 10px; }
  .ident-links { flex-wrap: wrap; gap: 6px 14px; }
  /* the rail: each hung element draws its own segment so the line is
     continuous through the archive and never runs beside the identity text */
  .entry, .rail-month, .rail-break, .rail-now { position: relative; }
  .entry::before, .rail-month::before, .rail-now::before { content: ""; width: 1px; height: auto; position: absolute; left: calc(-1 * var(--rail) + 8px); top: 0; bottom: 0; width: 1px; background: var(--axis); }
  .rail-now { display: block; height: 40px; }
  .rail-now::before { background: var(--accent-ink); width: 3px; margin-left: -1px; }
  .rail-now::after { content: ""; position: absolute; left: calc(-1 * var(--rail) + 10px); top: 0; width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-left: 14px solid var(--accent-ink); }
  .rail-now span { position: absolute; left: 0; top: -1px; font-size: .8125rem; }
  .rail-month { display: block; height: 84px; }
  .rail-month b { position: absolute; left: calc(-1 * var(--rail) - 4px); top: 6px; font-weight: 400; font-size: 4.5rem; letter-spacing: -.045em; color: var(--numeral); line-height: 1; background: var(--ground); padding: 4px 6px 4px 4px; font-variant-numeric: tabular-nums; }
  .rail-month span { position: absolute; left: 60px; top: 52px; font-size: .8125rem; color: var(--axis); }
  .rail-break { display: block; height: 44px; }
  .rail-break i { position: absolute; left: calc(-1 * var(--rail) + 1px); top: 14px; width: 15px; height: 1.5px; background: var(--ink-2); transform: rotate(-28deg); }
  .rail-break i + i { top: 24px; }
  .rail-break small { position: absolute; left: 0; top: 12px; font-size: .75rem; color: var(--axis); }
  .entry { margin-top: 0; padding: var(--gap, 40px) 0 8px; scroll-margin-top: 12px; --lead: 0px; }
  .entry.lead { padding-top: 0; }
  .mark, .entry.lead .mark { position: relative; top: auto; left: auto; height: auto; border: 0; margin: 0 0 10px; }
  .mark::before { left: calc(-1 * var(--rail) + 8px); top: .6em; width: 12px; height: 1px; }
  .entry.is-current .mark::before, .entry.is-hot .mark::before { height: 2px; background: var(--ink); }
  .kicker, .entry.lead .kicker { position: static; white-space: normal; font-size: .875rem; }
  .annot, .entry.lead .annot { position: static; margin: 10px 0 0; }
  .annot::before { display: none; }
  .ebody, .entry.lead .ebody { padding: 0; margin: 0; max-width: none; }
  .entry.lead h2, .entry.lead .ebody { text-align: left; }
  .entry.lead .dek { margin-left: 0; }
  .entry::before { display: none; }
  .rest { padding-top: 0; }
  .entry h2 { font-size: 1.75rem; }
  .entry.lead h2 { font-size: 2.375rem; }
  .entry.lead .dek { font-size: 1.25rem; }
  .dek { font-size: 1.125rem; }
  .tags { margin-top: 64px; }
  .foot { margin-top: 64px; }

  .strip-in { grid-template-columns: 112px 1fr; column-gap: 12px; }
  .strip .wordmark { font-size: .9375rem; }
  .strip .month b { font-size: .8125rem; }
  .strip .tick:not(.post-tick) span { display: none; }
  .strip .tick.post-tick span { left: auto; right: 4px; transform: none; }
  .strip .now span { display: none; }
  .post { padding-top: 40px; }
  .post-head h1 { font-size: 2.25rem; }
  .post-head .sub { font-size: 1.25rem; }
  .prose { font-size: 1.0625rem; }
  .prose h2 { padding-top: 14px; }
  .prose h2::before { left: 0; top: 0; width: 1px; height: 10px; }
  .prose h2::after { left: 0; top: 0; width: 14px; height: 1px; }
  .sources li { grid-template-columns: 2rem minmax(0, 1fr); row-gap: 2px; }
  .sources .site { grid-column: 2; }
  .comment { padding-left: 0; padding-top: 22px; }
  .comment time { top: 0; }
}
"""

# ---------------------------------------------------------------------------
# JS
# ---------------------------------------------------------------------------
JS_COMMON = r"""
(function () {
  // Chrome does not repaint text-decoration-color when a custom property on
  // <html> changes after first paint; nudge decorated links so a live accent
  // swap (theme preview, the capture tool's --accent) repaints them too.
  if (window.MutationObserver) {
    new MutationObserver(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.readlink, .prose a'), function (a) {
        a.style.textDecorationColor = 'transparent';
        void a.offsetWidth;
        a.style.textDecorationColor = '';
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  }
  // Demo forms: method="dialog" already aborts submission; validate locally
  // and tell the reader nothing was sent.
  var forms = document.querySelectorAll('form[data-demo]');
  Array.prototype.forEach.call(forms, function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var note = f.querySelector('.form-note');
      var fields = Array.prototype.slice.call(f.querySelectorAll('[required]'));
      var bad = [];
      fields.forEach(function (i) {
        var v = i.value.trim();
        var ok = v.length > 0 && (i.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        i.closest('.field').classList.toggle('is-invalid', !ok);
        if (!ok) bad.push(i);
      });
      note.classList.remove('is-ok');
      if (bad.length) {
        note.textContent = bad.length === 1
          ? 'Please add ' + bad[0].getAttribute('data-name') + '.'
          : 'Please fill in ' + bad.map(function (i) { return i.getAttribute('data-name'); }).join(', ') + '.';
        bad[0].focus();
        return;
      }
      note.textContent = 'Demo only — nothing was sent.';
      note.classList.add('is-ok');
      f.reset();
    });
  });
})();
"""

JS_HOME = r"""
(function () {
  var axis = document.getElementById('axis');
  var cursor = axis.querySelector('.cursor');
  var entries = Array.prototype.slice.call(document.querySelectorAll('.entry'));
  var ticks = {};
  Array.prototype.forEach.call(axis.querySelectorAll('.tick'), function (t) {
    ticks[t.getAttribute('href').slice(1)] = t;
  });
  var COMPACT = 72, tops = [], compact = false, current = null, queued = false;

  function measure() {
    tops = entries.map(function (e) { return e.getBoundingClientRect().top + window.scrollY; });
  }
  // Scroll-spy: the current entry is the LAST one whose top sits above the
  // reading line: the strip plus a quarter of the viewport, capped at 200px so
  // an anchor jump (entry top at 84px) never lets the next entry win.
  function update() {
    queued = false;
    var y = window.scrollY;
    if (!compact && y > 48) { compact = true; axis.classList.add('is-compact'); }
    else if (compact && y < 16) { compact = false; axis.classList.remove('is-compact'); }
    var line = y + COMPACT + Math.min(200, Math.round(window.innerHeight * 0.25));
    var idx = 0;
    for (var i = 0; i < tops.length; i++) { if (tops[i] <= line) idx = i; else break; }
    var e = entries[idx];
    if (e !== current) {
      if (current) {
        current.classList.remove('is-current');
        if (ticks[current.id]) ticks[current.id].classList.remove('is-current');
      }
      current = e;
      e.classList.add('is-current');
      if (ticks[e.id]) ticks[e.id].classList.add('is-current');
      cursor.style.setProperty('--x', e.getAttribute('data-x'));
    }
  }
  function schedule() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { measure(); schedule(); });
  window.addEventListener('load', function () { measure(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
  measure(); update();

  // Hover/focus a tick highlights its entry; hover/focus an entry highlights its tick.
  function hot(entry, tick, on) {
    if (entry) entry.classList.toggle('is-hot', on);
    if (tick) tick.classList.toggle('is-hot', on);
  }
  Object.keys(ticks).forEach(function (id) {
    var t = ticks[id], e = document.getElementById(id);
    ['mouseenter', 'focus'].forEach(function (n) { t.addEventListener(n, function () { hot(e, t, true); }); });
    ['mouseleave', 'blur'].forEach(function (n) { t.addEventListener(n, function () { hot(e, t, false); }); });
  });
  entries.forEach(function (e) {
    var t = ticks[e.id];
    e.addEventListener('mouseenter', function () { hot(e, t, true); });
    e.addEventListener('mouseleave', function () { hot(e, t, false); });
    e.addEventListener('focusin', function () { hot(e, t, true); });
    e.addEventListener('focusout', function () { hot(e, t, false); });
  });
  // Expose the scroll-spy state for verification tooling.
  window.__horizon = { current: function () { return current && current.id; }, compact: function () { return compact; } };
})();
"""

JS_POST = r"""
(function () {
  var strip = document.querySelector('.strip');
  var bar = strip.querySelector('.progress');
  var heads = Array.prototype.slice.call(document.querySelectorAll('.prose h2[id]'));
  var items = {};
  Array.prototype.forEach.call(document.querySelectorAll('.toc li'), function (li) {
    items[li.getAttribute('data-for')] = li;
  });
  var tops = [], cur = null, queued = false, last = -1;
  function measure() { tops = heads.map(function (h) { return h.getBoundingClientRect().top + window.scrollY; }); }
  function update() {
    queued = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    if (p !== last) {
      last = p;
      strip.style.setProperty('--p', p.toFixed(4));
      strip.classList.toggle('at-top', p === 0);
      bar.setAttribute('aria-valuenow', Math.round(p * 100));
    }
    var line = y + 72 + Math.min(200, Math.round(window.innerHeight * 0.25));
    var idx = -1;
    for (var i = 0; i < tops.length; i++) { if (tops[i] <= line) idx = i; else break; }
    var id = idx >= 0 ? heads[idx].id : null;
    if (id !== cur) {
      if (cur && items[cur]) items[cur].classList.remove('is-current');
      cur = id;
      if (cur && items[cur]) items[cur].classList.add('is-current');
    }
  }
  function schedule() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { measure(); schedule(); });
  window.addEventListener('load', function () { measure(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
  measure(); update();
  window.__horizon = { progress: function () { return last; }, section: function () { return cur; } };
})();
"""


# ---------------------------------------------------------------------------
# HTML pieces
# ---------------------------------------------------------------------------
def scale_html(mode, post_slug=None):
    """The axis scale: baseline segments, break, month numerals, ticks, now.
    mode = 'home' (ticks link to entries on this page) or 'post' (ticks link
    back to index.html#entry; the post's own tick is marked)."""
    out = []
    out.append('<span class="seg seg-a" style="--x1:%s"></span>' % fmt(BREAK_X0))
    out.append('<span class="seg seg-b" style="--x0:%s"></span>' % fmt(BREAK_X1))
    out.append('<span class="brk" style="--x0:%s;--x1:%s" aria-hidden="true"><i></i><i></i><small>%d days skipped</small></span>'
               % (fmt(BREAK_X0), fmt(BREAK_X1), GAP_DAYS))
    for i, (num, name, x) in enumerate(MONTHS):
        cls = "month m-last" if i == len(MONTHS) - 1 else "month"
        out.append('<div class="%s" style="--x:%s" aria-hidden="true"><b>%s</b><span>%s</span></div>' % (cls, fmt(x), num, name))
    for p in POSTS:
        d = date.fromisoformat(p["iso"])
        x = xpos(d)
        day = str(d.day)
        label = "%s — %s" % (p["date"], p["title"])
        if mode == "home":
            href = "#e-%s" % p["slug"]
            cls = "tick newest" if p is POSTS[0] else "tick"
        else:
            href = "index.html#e-%s" % p["slug"]
            cls = "tick post-tick" if p["slug"] == post_slug else "tick"
        if mode == "post" and p["slug"] == post_slug:
            day = p["short"]
        out.append('<a class="%s" href="%s" style="--x:%s" aria-label="%s"><span aria-hidden="true">%s</span></a>'
                   % (cls, href, fmt(x), esc(label), esc(day)))
    out.append('<span class="now" style="--x:1" aria-hidden="true"><span>Now · Sep 7</span></span>')
    if mode == "home":
        out.append('<span class="cursor" aria-hidden="true"></span>')
    else:
        pass
    return "\n".join(out)


def head(title, desc, extra_js):
    return """<!DOCTYPE html>
<html lang="en" style="--publication-accent:%s">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s</title>
<meta name="description" content="%s">
<meta name="robots" content="noindex">
<style>%s</style>
</head>
<body>
""" % (SITE["accent"], esc(title), esc(desc), CSS)


def foot_html():
    return """<footer class="foot">
  <div>
    <p><a class="fname" href="index.html">%s</a> — <span class="tagline">%s</span></p>
    <p>© 2026 %s</p>
  </div>
  <div>
    <p class="label">Follow</p>
    <p class="foot-links">%s</p>
  </div>
</footer>
""" % (esc(SITE["name"]), esc(SITE["tagline"]), esc(SITE["author"]),
       " ".join('<a href="%s">%s</a>' % (h, esc(n)) for n, h in SITE["social"]))


def entry_html(p, gap, is_lead=False):
    d = date.fromisoformat(p["iso"])
    x = xpos(d)
    classes = ["entry"]
    if is_lead:
        classes.append("lead")
    if p["img"]:
        classes.append("has-img")
    annot = ('<a class="annot" href="post.html" tabindex="-1" aria-hidden="true"><img src="img/%s" alt="" width="1024" height="1024" loading="lazy"></a>' % p["img"]) if p["img"] else ""
    read = '<a class="readlink" href="post.html">Read the forecast</a>' if is_lead else ""
    style = "--x:%s" % fmt(x) + ("" if is_lead else ";--gap:%dpx" % gap)
    return """<article class="%s" id="e-%s" data-x="%s" style="%s">
  <div class="mark">
    <p class="kicker"><time datetime="%s">%s</time> · %s · %s read</p>
    %s
  </div>
  <div class="ebody">
    <h2><a href="post.html">%s</a></h2>
    <p class="dek">%s</p>
    %s
  </div>
</article>""" % (" ".join(classes), p["slug"], fmt(x), style, p["iso"], esc(p["short"]),
                 p["kicker"], esc(p["read"]), annot, esc(p["title"]), p["dek"], read)


def rail_month(num, name):
    return '<div class="rail-month" aria-hidden="true"><b>%s</b><span>%s</span></div>' % (num, name)


def build_home():
    parts = [head("%s — %s" % (SITE["name"], SITE["tagline"]), SITE["short_description"], JS_HOME)]
    parts.append("""<header class="axis" id="axis">
  <div class="axis-in">
    <div class="axis-title">
      <h1 class="wordmark"><a href="index.html">%s</a></h1>
      <span class="tagline">%s</span>
    </div>
    <nav class="mast-nav" aria-label="Site">
      <a href="#archive">Archive</a>
      <a href="#about">About</a>
    </nav>
    <nav class="scale" aria-label="Posts by date">
%s
    </nav>
  </div>
</header>
""" % (esc(SITE["name"]), esc(SITE["tagline"]), scale_html("home")))

    parts.append('<main class="page home">')
    parts.append('<div class="archive" id="archive">')
    ident = """<aside class="ident" id="about">
    <p>%s</p>
    <p class="ident-links"><span class="who">%s</span>%s</p>
  </aside>""" % (esc(SITE["short_description"]), esc(SITE["author"]),
                 " ".join('<a href="%s">%s</a>' % (h, esc(n)) for n, h in SITE["social"]))
    month_names = {2: ("02", "February"), 3: ("03", "March"), 9: ("09", "September")}
    seen_month = None
    for i, p in enumerate(POSTS):
        d = date.fromisoformat(p["iso"])
        if i == 0:
            parts.append('<section class="hero" aria-label="Latest">')
            parts.append('<div class="rail-now" aria-hidden="true"><span>Now · Sep 7</span></div>')
        if i == 1:
            parts.append('<section class="rest" aria-label="Earlier">')
            parts.append('<div class="rail-break" aria-hidden="true"><i></i><i></i><small>%d days skipped</small></div>' % GAP_DAYS)
        if d.month != seen_month:
            seen_month = d.month
            parts.append(rail_month(*month_names[d.month]))
        gap = gap_px((date.fromisoformat(POSTS[i - 1]["iso"]) - d).days) if i > 1 else 0
        parts.append(entry_html(p, gap, is_lead=(i == 0)))
        if i == 0:
            parts.append(ident)
            parts.append('</section>')
    parts.append('</section>')
    parts.append('</div>')  # archive

    tags = []
    for p in POSTS:
        for t in p["tags"]:
            if t not in tags:
                tags.append(t)
    parts.append("""<section class="tags" aria-label="Topics">
  <p class="label">Topics</p>
  <ul class="tag-list">%s</ul>
</section>""" % "".join('<li><a href="#archive">%s</a></li>' % esc(t) for t in tags))
    parts.append('</main>')
    parts.append(foot_html())
    parts.append("<script>%s%s</script>\n</body>\n</html>\n" % (JS_COMMON, JS_HOME))
    return "\n".join(parts)


def build_post():
    p = ARTICLE
    d = date.fromisoformat(p["iso"])
    body = common.body_with_ids(p["body"], p["sections"])
    parts = [head("%s — %s" % (p["title"], SITE["name"]), p["hook"], JS_POST)]
    parts.append("""<header class="strip">
  <div class="strip-in">
    <a class="wordmark" href="index.html">%s</a>
    <nav class="scale" aria-label="Posts by date">
%s
    </nav>
    <span class="progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></span>
  </div>
</header>
""" % (esc(SITE["name"]), scale_html("post", p["slug"])))

    annot = ('<img class="post-annot" src="img/%s" alt="" width="1024" height="1024">' % p["img"]) if p["img"] else ""
    toc = "".join('<li data-for="%s"><a href="#%s">%s</a></li>' % (sid, sid, esc(t)) for sid, t in p["sections"])
    e_num, e_cap = elapsed(d)
    parts.append("""<main class="post">
  <header class="post-head">
    <p class="kicker">%s · %s read</p>
    <h1>%s</h1>
    <p class="sub">%s</p>
    <p class="meta"><span>%s</span><span><time datetime="%s">%s</time></span><span>%s</span></p>
    %s
  </header>
  <aside class="post-aside" aria-label="About this post">
    <p class="elapsed"><b>%s</b><span>%s</span></p>
    <p class="toc-label">In this piece</p>
    <ol class="toc">%s</ol>
  </aside>
  <div class="prose">
%s
  </div>
""" % (p["kicker"], esc(p["read"]), esc(p["title"]), esc(p["subtitle"]), esc(SITE["author"]), p["iso"], esc(p["date"]),
       days_ago(d), annot, e_num, e_cap, toc, body))

    # tail: tags, sources, subscribe, comments
    parts.append('<footer class="post-tail">')
    parts.append("""<section class="tags" aria-label="Tags">
  <p class="label">Filed under</p>
  <ul class="tag-list">%s</ul>
</section>""" % "".join('<li><a href="index.html#archive">%s</a></li>' % esc(t) for t in p["tags"]))
    parts.append("""<section class="sources-wrap" aria-labelledby="sources-h">
  <h2 id="sources-h">Sources<small class="tnum">%d</small></h2>
  <ol class="sources">%s</ol>
</section>""" % (len(CITATIONS), "".join(
        '<li><a href="%s" target="_blank" rel="noopener noreferrer">%s</a><span class="site">%s</span></li>' % (esc(u), esc(t), esc(s))
        for t, s, u in CITATIONS)))
    parts.append("""<section class="subscribe" aria-labelledby="sub-h">
  <h2 id="sub-h">Get the next forecast</h2>
  <p class="intro">One email when a new piece is published. No digests, no summaries.</p>
  <form method="dialog" data-demo novalidate>
    <div class="row">
      <div class="field"><label for="sub-email">Email</label><input id="sub-email" type="email" required data-name="your email" autocomplete="email" placeholder="you@example.com"></div>
      <button type="submit">Subscribe</button>
    </div>
    <p class="form-note" aria-live="polite"></p>
  </form>
</section>""")

    # comments on a miniature axis: post date → now
    c0, c1 = d, NOW
    span = (c1 - c0).days

    def mx(dd):
        return (dd - c0).days / span

    mini = ['<span class="seg"></span>']
    mini.append('<span class="tick post-tick at-origin" style="--x:0" aria-hidden="true"><span>Sep 2</span></span>')
    seen = {}
    for who, when, text in COMMENTS:
        cd = date.fromisoformat({"September 3, 2026": "2026-09-03", "September 4, 2026": "2026-09-04"}[when])
        if cd in seen:
            continue
        seen[cd] = True
        mini.append('<span class="tick" style="--x:%s" aria-hidden="true"><span>%d</span></span>' % (fmt(mx(cd)), cd.day))
    mini.append('<span class="now" style="--x:1" aria-hidden="true"><span>Now</span></span>')
    comments = "".join("""<article class="comment">
    <time datetime="%s">%s</time>
    <p class="who">%s</p>
    <p>%s</p>
  </article>""" % ({"September 3, 2026": "2026-09-03", "September 4, 2026": "2026-09-04"}[when],
                   when.replace("September ", "Sep ").replace(", 2026", ""), esc(who), text)
                       for who, when, text in COMMENTS)
    parts.append("""<section class="comments" aria-labelledby="com-h">
  <h2 id="com-h">Comments<small class="tnum">%d</small></h2>
  <div class="mini" aria-hidden="true">%s</div>
  %s
  <form method="dialog" data-demo novalidate>
    <div class="field"><label for="c-name">Name</label><input id="c-name" type="text" required data-name="your name" autocomplete="name"></div>
    <div class="field"><label for="c-text">Comment</label><textarea id="c-text" required data-name="a comment"></textarea></div>
    <button type="submit">Post comment</button>
    <p class="form-note" aria-live="polite"></p>
  </form>
</section>""" % (len(COMMENTS), "".join(mini), comments))
    parts.append('</footer>')
    parts.append('</main>')
    parts.append(foot_html())
    parts.append("<script>%s%s</script>\n</body>\n</html>\n" % (JS_COMMON, JS_POST))
    return "\n".join(parts)


def main():
    common.prepare(OUT, ["schibsted-grotesk", "literata"], [p["img"] for p in POSTS if p["img"]])
    common.write(OUT, "index.html", build_home())
    common.write(OUT, "post.html", build_post())
    print("axis: A %s..%s (%d d), break %d d -> %.3f..%.3f, B %s..%s (%d d), %.2f px/day at 1312"
          % (A0, A1, DAYS_A, GAP_DAYS, BREAK_X0, BREAK_X1, B0, B1, DAYS_B, 1312 / TOTAL))
    for i, p in enumerate(POSTS):
        d = date.fromisoformat(p["iso"])
        g = gap_px((date.fromisoformat(POSTS[i - 1]["iso"]) - d).days) if i > 1 else 0
        print("  %-6s x=%.4f gap=%3dpx %s" % (p["short"], xpos(d), g, p["title"][:40]))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
