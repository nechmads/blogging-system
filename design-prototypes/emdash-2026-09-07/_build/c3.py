"""Concept 03 — Poster. Generates 03-poster/index.html and 03-poster/post.html.

The headline is the argument: the lead title fills the first screen edge to
edge, the archive is a wall of full-width poster bands, images exist only on
hover/focus (desktop) or as a small inline square (touch / narrow). One display
family (Bricolage Grotesque, variable opsz/wdth/wght) for every display and UI
role; Geist for the article body. Run from _build: python3 c3.py
"""

import os, re
import common, content
from content import SITE, POSTS, ARTICLE, CITATIONS, COMMENTS, esc

OUT = os.path.join(common.RUN, "03-poster")
FONTS = ["bricolage-grotesque", "geist"]


# ---------------------------------------------------------------- size rule
# Title size is fluid by title length so the lead always fills 70–100% of the
# width and stays inside a 1440×900 first screen. Four tiers; the packet names
# three (≤30 / ≤45 / >45) and a fourth catches the 69-character title.
# The wall is deliberately NOT tiered: every archive title is one size and
# rhythm comes from line count and alternating alignment. The lead's CSS tier
# is the no-JS fallback; with JS the lead is fitted to the fold (see JS).
#                 lead (home)      wall (home)      post title     lead@390  wall@390  post@390
SIZES = {
    "s":  ("12vw",   "5.5vw", "7vw",   "18vw",   "10vw",  "14vw"),   # ≤ 30 chars
    "m":  ("12.5vw", "5.5vw", "6vw",   "18vw",   "10vw",  "12vw"),   # 31–45
    "l":  ("10vw",   "5.5vw", "5vw",   "15vw",   "10vw",  "10vw"),   # 46–60
    "xl": ("8vw",    "5.5vw", "4.2vw", "12.5vw", "10vw",  "8.5vw"),  # > 60
}


def glue(title):
    """Escape a title and bind its last two words with a no-break space, so no
    title role ever ends on a single-word line. A rule, not hand-setting."""
    e = esc(title)
    head, sep, tail = e.rpartition(" ")
    return head + "\u00a0" + tail if sep else e


def tier(title):
    n = len(title)
    return "s" if n <= 30 else "m" if n <= 45 else "l" if n <= 60 else "xl"


def size_css():
    out = []
    for k, (lead, wall, post, lead_m, wall_m, post_m) in SIZES.items():
        out.append(".h-%s{--lead:%s;--wall:%s;--post:%s}" % (k, lead, wall, post))
    out.append("@media (max-width:759px){")
    for k, (lead, wall, post, lead_m, wall_m, post_m) in SIZES.items():
        out.append(".h-%s{--lead:%s;--wall:%s;--post:%s}" % (k, lead_m, wall_m, post_m))
    out.append("}")
    return "\n".join(out)


# ---------------------------------------------------------------- css
CSS = r"""
:root{--publication-accent:#b4361f}
html{
  /* Every legibility-bearing colour is derived, never the raw hex.
     tint: L pinned high, chroma capped, so black text stays ≥ 7:1 on it.
     floor: L clamped ≤ .55 so a pale accent still reads ≥ 3:1 on white. */
  --accent-tint:oklch(from var(--publication-accent) 0.93 min(c, 0.08) h);
  --accent-floor:oklch(from var(--publication-accent) clamp(0.2, l, 0.55) c h);
  --ink:#000;--paper:#fff;--grey:#595959;
  --rail:6rem;--gutter:2.5rem;--edge:5rem;
  --display:'Bricolage Grotesque','Helvetica Neue',Arial,sans-serif;
  --body:'Geist','Helvetica Neue',Arial,sans-serif;
  overflow-x:clip;background:var(--paper);color:var(--ink);
  -webkit-text-size-adjust:100%;
}
*{box-sizing:border-box}
body{margin:0;position:relative;font-family:var(--display);font-optical-sizing:auto;
  font-variation-settings:"opsz" 12;font-size:1rem;line-height:1.5;padding-right:var(--rail)}
a{color:inherit}
img{display:block;max-width:100%}
:focus-visible{outline:3px solid var(--ink);outline-offset:4px}
mark{background:var(--accent-tint);color:var(--ink);padding:.02em .18em 0;margin:0 -.05em;
  -webkit-box-decoration-break:clone;box-decoration-break:clone}
.vh{position:absolute;width:1px;height:1px;overflow:clip;clip-path:inset(50%);white-space:nowrap}

/* --- the poster voice: one family, hierarchy from axes and scale --- */
.poster{font-family:var(--display);font-weight:800;font-stretch:84%;letter-spacing:-.035em;
  line-height:.9;font-variation-settings:"opsz" 96;overflow-wrap:break-word;margin:0}
.small{font-size:.9375rem;line-height:1.45;font-weight:500;font-stretch:100%;
  font-variation-settings:"opsz" 12;letter-spacing:0}
.meta{font-size:.9375rem;font-weight:400;line-height:1.4;text-transform:lowercase}
.meta a{text-decoration:none}
.meta a:hover{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em}
.deck{font-size:1.0625rem;line-height:1.5;font-weight:400;color:var(--grey);font-stretch:100%}

/* --- rail: vertical masthead on the first screen, fixed nav at bottom right --- */
.masthead{position:absolute;top:var(--gutter);right:0;width:var(--rail);height:min(calc(100svh - 13rem),49rem);
  display:flex;justify-content:center;align-items:flex-end}
.masthead a{writing-mode:vertical-rl;transform:rotate(180deg);text-decoration:none;white-space:nowrap;
  font-size:1.0625rem;font-weight:500;line-height:1;letter-spacing:.005em}
.masthead .tag{color:var(--grey);font-weight:400}
.rail-nav{position:fixed;right:0;bottom:0;width:var(--rail);padding:1rem 0 var(--gutter);z-index:6;
  display:flex;flex-direction:column;align-items:center;gap:.15em;background:var(--paper)}
.rail-nav a{font-size:.9375rem;font-weight:500;line-height:1.5;text-decoration:none;text-transform:lowercase}
.rail-nav a:hover{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em}
.rail-nav a[aria-current]{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em}
.strip{display:none}

/* --- home: the lead claim consumes the first screen --- */
.hero{position:relative;min-height:min(100svh,62rem);display:grid;grid-template-rows:auto auto auto 1fr;
  padding:var(--gutter) var(--gutter) var(--gutter) var(--edge)}
.hero .meta{margin:0 0 .5rem}
.lead-title{font-size:var(--lead);text-wrap:pretty;
  animation:settle 600ms cubic-bezier(.2,.7,.2,1) both}
.lead-title a{text-decoration:none}
.lead-title a:hover{text-decoration:underline;text-decoration-thickness:.045em;text-underline-offset:.05em}
@keyframes settle{
  from{font-weight:300;font-stretch:100%;letter-spacing:0}
  to{font-weight:800;font-stretch:84%;letter-spacing:-.035em}
}
.hero-deck{grid-row:3;justify-self:start;max-width:38ch;margin:1.5rem 0 0;font-size:1.125rem}
.hero-deck.is-beside{position:absolute;grid-area:auto;margin:0}
.hero-deck p{margin:0}
.hero-deck .more{display:inline-block;margin-top:.9rem;color:var(--ink);font-size:1.25rem;font-weight:500;text-decoration:none}
.hero-deck .more:hover{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em}

/* --- the wall: full-width bands, alternating alignment, whitespace only --- */
.wall{padding:0 var(--gutter) 0 var(--edge)}
.band{margin:6.25rem 0}
.band--right{text-align:right}
.band-title{font-size:var(--wall);text-wrap:balance;margin:.15em 0 .35em;letter-spacing:-.025em}
.band-title a{text-decoration:none}
.band-title a:hover{text-decoration:underline;text-decoration-thickness:.045em;text-underline-offset:.05em}
.band-body{display:flex;gap:1.25rem;align-items:flex-start}
.band--right .band-body{justify-content:flex-end}
.band-body .deck{max-width:46ch;margin:0;order:1}
.band-fig{display:none;width:72px;height:72px;object-fit:cover;flex:none;order:0}
.band--right .band-fig{order:2}
.tags{margin:.9rem 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.35em 0;font-size:.9375rem;
  font-weight:400;text-transform:lowercase}
.band--right .tags{justify-content:flex-end}
.tags li+li::before{content:"\00b7";margin:0 .55em;color:var(--grey)}
.tags a{text-decoration:none}
.tags a:hover{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em}

/* hover / focus reveal: the only place an image exists on desktop */
.reveal{position:fixed;top:0;left:0;width:240px;height:240px;pointer-events:none;opacity:0;z-index:5;
  will-change:transform}
.reveal.is-on{opacity:1}
.reveal img{width:100%;height:100%;object-fit:cover}
@media (prefers-reduced-motion:no-preference){.reveal{transition:opacity 140ms ease-out}}

/* --- article: calm evidence column, poster scale only in pull quotes --- */
/* 41rem ≈ 66ch of Geist at 1.125rem; the offset centres it between the left edge and the rail */
.article{padding:2.5rem var(--gutter) 0 var(--edge);--col:41rem;--col-offset:max(0px,calc((100vw - var(--rail) - var(--edge) - var(--gutter) - var(--col)) / 2))}
.col{max-width:var(--col);margin-left:var(--col-offset)}
.post-head{margin-bottom:3rem}
.post-head .meta{margin:0 0 1rem}
.post-fig{width:56px;height:56px;object-fit:cover;display:inline-block;vertical-align:middle;margin-right:.75rem}
.post-title{font-size:var(--post);max-width:18ch;text-wrap:balance;margin:0 0 .35em}
.post-sub{font-size:1.35rem;line-height:1.35;font-weight:400;font-stretch:100%;margin:0 0 2rem;max-width:44ch}
.prose{font-family:var(--body);font-size:1.125rem;line-height:1.6}
.prose p{margin:0 0 1.35em}
.prose a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--ink);
  text-decoration-thickness:1.5px;text-underline-offset:.16em}
.prose a:hover{background:var(--accent-tint);text-decoration-color:var(--ink)}
.prose strong{font-weight:400}
.prose code{font-family:inherit;font-weight:500}
.prose h2{font-family:var(--display);font-optical-sizing:auto;font-variation-settings:"opsz" 60;
  font-size:2.6rem;line-height:1.05;font-weight:400;font-stretch:80%;letter-spacing:-.015em;
  margin:2.6em 0 .6em;text-wrap:balance}
.prose sup.ref{font-size:.7em;line-height:0;margin-left:.15em;vertical-align:baseline;position:relative;top:-.55em}
.prose sup.ref a{text-decoration:none;font-weight:500}
.prose sup.ref a:hover{text-decoration:underline}
.pq{font-size:4.4vw;letter-spacing:-.02em;max-width:28ch;width:calc(100% + var(--col-offset) + 6rem);margin:1.2em 0 1.2em calc(var(--col-offset) * -1);text-wrap:balance}
.section{margin-top:5rem}
.section-title{font-size:.9375rem;line-height:1.4;font-weight:400;font-stretch:100%;letter-spacing:0;
  text-transform:lowercase;font-variation-settings:"opsz" 12;margin:0 0 1.2rem}
.sources{padding:0;margin:0;list-style:none;counter-reset:src;font-family:var(--body);font-size:.9375rem;line-height:1.5}
.sources li{margin:0 0 .55em;display:grid;grid-template-columns:2rem 1fr;break-inside:avoid;counter-increment:src}
.sources li::before{content:counter(src) ".";font-family:var(--display);font-variation-settings:"opsz" 12;color:var(--grey)}
.sources a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--ink);
  text-decoration-thickness:1.5px;text-underline-offset:.16em}
.sources .domain{color:var(--grey);margin-left:.5em}
.post-tags{margin:2.5rem 0 0}
.comment{margin:0 0 2.25rem}
.comment-head{display:flex;gap:.75em;align-items:baseline;margin:0 0 .3em;font-family:var(--body)}
.comment-head .who{font-weight:400}
.comment-head .when{color:var(--grey);font-size:.9375rem}
.comment p{font-family:var(--body);font-size:1.0625rem;line-height:1.55;margin:0;max-width:60ch}
form{font-family:var(--body);margin-top:2.5rem}
.field{display:block;margin:0 0 1.1rem}
.field span{display:block;font-family:var(--display);font-weight:400;font-size:.9375rem;margin-bottom:.35em}
input,textarea{font:inherit;font-size:1.0625rem;color:var(--ink);background:var(--paper);
  border:2px solid var(--ink);border-radius:0;padding:.6em .7em;width:100%;max-width:38ch}
textarea{min-height:7.5em;max-width:60ch;resize:vertical}
button{font:inherit;font-family:var(--display);font-weight:400;font-size:1.0625rem;color:var(--paper);
  background:var(--ink);border:2px solid var(--ink);border-radius:0;padding:.6em 1.2em;cursor:pointer}
button:hover{background:var(--paper);color:var(--ink)}
.form-note{font-family:var(--display);font-weight:500;margin:1rem 0 0}
.subscribe-row{display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-end}
.subscribe-row .field{margin:0;flex:1 1 16rem}
.next{margin-top:6rem}
.next .label{margin:0 0 .3rem}
.next-title{font-size:2.6rem;line-height:1;margin:0;max-width:22ch;text-wrap:balance;font-weight:600}
.next-title a{text-decoration:none}
.next-title a:hover{text-decoration:underline;text-decoration-thickness:.05em;text-underline-offset:.06em}

/* --- footer: identity, social, rss, subscribe --- */
footer{padding:8rem var(--gutter) 8rem var(--edge);display:grid;grid-template-columns:minmax(0,38ch) minmax(0,38ch);
  gap:3rem 6rem;align-items:start}
.site-name{font-size:2rem;line-height:1;font-weight:400;font-stretch:90%;letter-spacing:-.02em;margin:0 0 .5rem;
  font-variation-settings:"opsz" 40}
.site-name a{text-decoration:none}
footer .tagline{margin:0 0 1rem;font-weight:400}
footer .about{font-family:var(--body);color:var(--grey);margin:0 0 1.25rem;line-height:1.5}
.social{margin:0;padding:0;list-style:none;display:flex;gap:1.25em}
.social a{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em;font-weight:400}
footer .subscribe{margin:0}
footer .subscribe form{margin-top:1rem}
footer .subscribe h2{font-size:1.35rem;font-weight:400;margin:0;line-height:1.2}
footer .subscribe p{font-family:var(--body);color:var(--grey);margin:.3rem 0 0}
.colophon{grid-column:1 / -1;color:var(--grey);font-size:.9375rem;margin:0}

@media (prefers-reduced-motion:reduce){
  .lead-title{animation:none}
  .reveal{transition:none}
}
/* touch: no hover reveal, inline squares instead */
@media (hover:none),(pointer:coarse){
  .band-fig{display:block}
  .reveal{display:none}
}
@media (max-width:759px){
  html{--rail:0px;--gutter:1rem;--edge:1rem}
  body{padding-right:0}
  .masthead,.rail-nav{display:none}
  .strip{display:flex;position:sticky;top:0;z-index:6;justify-content:space-between;align-items:baseline;
    gap:1rem;padding:.7rem var(--gutter);background:var(--paper)}
  .strip .name{font-weight:500;font-stretch:90%;font-size:1.0625rem;text-decoration:none;white-space:nowrap}
  .strip nav{display:flex;gap:.8em}
  .strip nav a{font-size:.9375rem;font-weight:500;text-decoration:none}
  .strip nav a[aria-current]{text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.15em}
  .hero{min-height:auto;padding-top:1.25rem}
  .hero-deck{max-width:none;justify-self:stretch;margin-top:2rem;font-size:1.0625rem}
  .hero-deck .more{font-size:1.125rem}
  .band{margin:4rem 0}
  .band--right{text-align:left}
  .band--right .band-title{text-align:right}
  .band--right .band-body{justify-content:flex-start}
  .band--right .band-fig{order:0}
  .band--right .tags{justify-content:flex-start}
  .band-fig{display:block}
  .band-body{gap:1rem}
  .reveal{display:none}
  .article{padding-top:1.5rem;--col-offset:0rem}
  .post-title{max-width:none}
  .post-sub{font-size:1.2rem}
  .prose{font-size:1.0625rem}
  .prose h2{font-size:1.85rem}
  .pq{font-size:9.5vw;margin-left:0;max-width:none;width:auto}
  .section{margin-top:4.5rem}
  .next-title{font-size:2rem}
  footer{grid-template-columns:1fr;gap:2.5rem;padding:6rem var(--gutter) 5rem}
  input,textarea{max-width:none}
}
@media (min-width:760px) and (max-width:1023px){
  .hero-deck{max-width:34ch}
}
@media (min-width:1024px){
  .sources{columns:2;column-gap:2.5rem}
}
"""

JS = r"""
(function () {
  // Hover / keyboard-focus image reveal. Fine pointers only; touch and narrow
  // layouts get the inline square from CSS instead. The square hangs below the
  // title (never over it) and follows the cursor horizontally; on keyboard focus
  // it sits beside the title's first or last line.
  var box = document.getElementById('reveal');
  if (box) {
    var img = box.firstElementChild;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var SIZE = 240, GAP = 24, PAD = 12;
    var active = null, mode = null, px = 0, x = 0, y = 0, raf = 0, snap = true;
    function narrow() { return window.innerWidth < 760; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function railWidth() { return parseFloat(getComputedStyle(document.body).paddingRight) || 0; }
    function target() {
      var band = active.closest('.band');
      var right = band.classList.contains('band--right');
      var rects = active.getClientRects(), minLeft = Infinity, maxRight = -Infinity, widest = 0;
      for (var i = 0; i < rects.length; i++) {
        minLeft = Math.min(minLeft, rects[i].left); maxRight = Math.max(maxRight, rects[i].right);
        if (rects[i].width > rects[widest].width) widest = i;
      }
      // The <h2> block is tight to the glyphs (line-height .9); the inline
      // <a>'s own rects overshoot below the baseline, so use them only for x
      // and derive line tops from the block.
      var block = active.parentNode.getBoundingClientRect();
      var widestTop = block.top + widest * (block.height / rects.length);
      var body = band.querySelector('.band-body .deck').getBoundingClientRect();  // the deck, not its full-width flex row
      var sideX = right ? body.left - GAP - SIZE : body.right + GAP;  // the band's empty side, level with the deck
      var next = band.nextElementSibling ? band.nextElementSibling.getBoundingClientRect().top : Infinity;
      var maxX = window.innerWidth - railWidth() - SIZE - PAD;
      // Below the title, shrunk (never under 160px) so it stays clear of the next band.
      var size = clamp(next - GAP - (block.bottom + GAP), 160, SIZE);
      var below = Math.min(block.bottom + GAP, next - GAP - size);
      var tx, ty;
      if (mode === 'focus') {
        // Beside the title block (top-aligned, clear of every line), else on the empty side below it.
        if (!right && maxRight + GAP <= maxX) { tx = maxRight + GAP; ty = widestTop; size = SIZE; }
        else if (right && minLeft - GAP - SIZE >= PAD) { tx = minLeft - GAP - SIZE; ty = widestTop; size = SIZE; }
        else { tx = sideX; ty = below; }
        return [clamp(tx, PAD, maxX), ty, size];
      }
      tx = px - size / 2;
      ty = below;
      // Never over the title; keep off the deck/tags block as well.
      if (tx < body.right + GAP && tx + size > body.left - GAP) tx = sideX;
      if (ty + size > window.innerHeight - PAD && block.top - GAP - size >= PAD) { ty = block.top - GAP - size; }
      return [clamp(tx, PAD, maxX), clamp(ty, PAD, window.innerHeight - size - PAD), size];
    }
    var curSize = SIZE;
    function tick() {
      if (!active) return;
      var t = target();
      if (t[2] !== curSize) { curSize = t[2]; box.style.width = box.style.height = curSize + 'px'; }
      if (snap || mode === 'focus' || reduced.matches) { x = t[0]; y = t[1]; }
      else { x += (t[0] - x) * 0.22; y += (t[1] - y) * 0.22; }
      snap = false;
      box.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      raf = window.requestAnimationFrame(tick);
    }
    function show(a, m) {
      active = a; mode = m; snap = true;
      if (img.getAttribute('src') !== a.getAttribute('data-img')) img.src = a.getAttribute('data-img');
      box.classList.add('is-on');
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(tick);
    }
    function hide() {
      active = null; mode = null;
      box.classList.remove('is-on');
      window.cancelAnimationFrame(raf);
    }
    var links = document.querySelectorAll('.band-title a[data-img]');
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !fine.matches || narrow()) return;
        px = e.clientX; show(a, 'hover');
      });
      a.addEventListener('pointermove', function (e) {
        if (active === a && mode === 'hover') px = e.clientX;
      });
      a.addEventListener('pointerleave', function () {
        if (active === a && mode === 'hover') hide();
      });
      a.addEventListener('focus', function () {
        if (!fine.matches || narrow()) return;
        show(a, 'focus');
      });
      a.addEventListener('blur', function () { if (active === a) hide(); });
    });
    window.addEventListener('resize', function () { if (active) hide(); });
  }


  // Fit the lead to the fold (desktop only). The CSS length tier is the no-JS
  // fallback. The budget is the 1440×900 reference fold (clamped 700–900px,
  // so the break is identical on any taller viewport); the title may use at
  // most three lines (a long title gets fewer lines at a smaller size, never
  // a fourth block); among sizes within 85% of the cap, the one whose widest
  // line comes closest to the rail wins. Measured on a hidden clone with the
  // final variable-axis values so the settle animation cannot skew it. Then
  // the caption (deck + CTA) is placed in the void beside the last line if
  // one exists, else beside the shortest line, else under the title.
  var hero = document.querySelector('.hero'), lead = document.querySelector('.lead-title');
  var deck = hero ? hero.querySelector('.hero-deck') : null;
  var lastW = 0;
  function lineBoxes(el) {
    // Visual line boxes of the inline <a>, derived from the block's tight line step.
    var a = el.firstElementChild, rs = a.getClientRects(), b = el.getBoundingClientRect();
    var step = rs.length ? b.height / rs.length : b.height, out = [];
    for (var i = 0; i < rs.length; i++) out.push({ left: rs[i].left, right: rs[i].right, width: rs[i].width, top: b.top + i * step, bottom: b.top + (i + 1) * step });
    return out;
  }
  function fitLead() {
    if (!hero || !lead || !deck) return;
    deck.classList.remove('is-beside'); deck.style.cssText = '';
    if (!window.matchMedia('(min-width: 760px)').matches) { hero.style.minHeight = ''; lead.style.fontSize = ''; return; }
    hero.style.minHeight = Math.min(window.innerHeight, 62 * 16) + 'px';
    var fold = Math.max(700, Math.min(window.innerHeight, 900));
    var avail = lead.clientWidth;
    var heroBox = hero.getBoundingClientRect();
    var top = lead.getBoundingClientRect().top - heroBox.top;
    var probe = lead.cloneNode(true);
    // The probe sits exactly over the lead so its line boxes are the lead's final geometry
    // (the live lead may still be mid settle-animation with wider axes).
    probe.style.cssText = 'position:absolute;grid-area:auto;left:' + lead.offsetLeft + 'px;top:' + lead.offsetTop + 'px;visibility:hidden;pointer-events:none;animation:none;width:' + avail + 'px';
    probe.removeAttribute('id');
    hero.appendChild(probe);
    var a = probe.firstElementChild;
    function scan(budget) {
      // Every size (≤ 3 lines) that fits the budget, with its line widths.
      var cands = [];
      for (var s = 6; s <= 30; s += 0.25) {
        probe.style.fontSize = s + 'vw';
        var rs = a.getClientRects();
        if (probe.offsetHeight > budget || a.scrollWidth > avail + 1 || rs.length > 3) break;
        var ws = [];
        for (var i = 0; i < rs.length; i++) ws.push(rs[i].width);
        cands.push({ s: s, fill: Math.max.apply(null, ws) / avail, ws: ws });
      }
      return cands;
    }
    function pick(cands, floor, ok) {
      // Largest fill among sizes ≥ floor × cap that satisfy ok(); ties → larger.
      if (!cands.length) return null;
      var cap = cands[cands.length - 1].s, best = null;
      for (var j = cands.length - 1; j >= 0 && cands[j].s >= cap * floor; j--) {
        if (!ok(cands[j])) continue;
        if (!best || cands[j].fill > best.fill + 0.005) best = cands[j];
      }
      return best;
    }
    var GAP = 32, deckMin = 20 * 16;
    function voidLine(ws) {
      // Index of the line the caption can sit beside: the last line if its
      // void is wide enough, else the shortest line, else -1.
      var last = ws.length - 1;
      if (avail - ws[last] - GAP >= deckMin) return last;
      var sh = 0;
      for (var k = 1; k < ws.length; k++) if (ws[k] < ws[sh]) sh = k;
      return avail - ws[sh] - GAP >= deckMin ? sh : -1;
    }
    // Pass 1: title owns the fold and leaves a void for the caption.
    var all = scan(fold - top - 40);
    var c1 = pick(all, 0.75, function (c) { return voidLine(c.ws) >= 0; });
    var placed = false;
    if (c1) {
      lead.style.fontSize = c1.s + 'vw';
      probe.style.fontSize = c1.s + 'vw';
      var lines = lineBoxes(probe), leadBox = probe.getBoundingClientRect();
      var idx = voidLine(lines.map(function (l) { return l.width; }));
      if (idx >= 0) {
        var L = lines[idx], voidW = leadBox.right - L.right - GAP;
        deck.classList.add('is-beside');
        deck.style.maxWidth = Math.min(38 * 11, voidW) + 'px';
        deck.style.left = (L.right - heroBox.left + GAP) + 'px';
        var dh = deck.offsetHeight;
        var dTop = Math.max(L.bottom - dh - (L.bottom - L.top) * 0.06, leadBox.top);
        var dBottom = dTop + dh, dLeft = L.right + GAP, hit = false;
        for (var m = 0; m < lines.length; m++) {
          if (m === idx) continue;
          if (lines[m].right + GAP > dLeft && lines[m].bottom > dTop && lines[m].top < dBottom) { hit = true; break; }
        }
        if (!hit && dBottom <= heroBox.top + fold - 24) { deck.style.top = (dTop - heroBox.top) + 'px'; placed = true; }
        else { deck.classList.remove('is-beside'); deck.style.cssText = ''; }
      }
    }
    if (!placed) {
      // Pass 2: caption under the title; the title gives up the caption's height.
      deck.classList.remove('is-beside'); deck.style.cssText = '';
      var c2 = pick(scan(fold - top - deck.offsetHeight - 64), 0.85, function () { return true; });
      lead.style.fontSize = c2 ? c2.s + 'vw' : '';
    }
    probe.remove();
  }
  // The wall: one base size, but a title that fits on ONE line may grow up to
  // 1.3× so every band carries comparable ink; two-line titles stay at base.
  function fitWall() {
    var titles = document.querySelectorAll('.band-title');
    var wide = window.matchMedia('(min-width: 760px)').matches;
    Array.prototype.forEach.call(titles, function (h) {
      h.style.fontSize = '';
      if (!wide) return;
      var a = h.firstElementChild, base = parseFloat(getComputedStyle(h).fontSize);
      if (a.getClientRects().length !== 1) return;
      var lo = base, hi = base * 1.3, avail = h.clientWidth;
      h.style.fontSize = hi + 'px';
      if (a.getClientRects().length === 1 && a.scrollWidth <= avail + 1) return;
      for (var i = 0; i < 6; i++) {
        var mid = (lo + hi) / 2;
        h.style.fontSize = mid + 'px';
        if (a.getClientRects().length === 1 && a.scrollWidth <= avail + 1) lo = mid; else hi = mid;
      }
      h.style.fontSize = lo + 'px';
    });
  }
  function fitAll() { fitLead(); fitWall(); }
  window.hmFitLead = fitAll;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll); else fitAll();
  lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // Height-only changes (browser chrome, capture tools) do not refit.
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; fitAll(); }
  });

  // Demo forms: method="dialog" already aborts submission with JS off; with JS
  // the browser's own validation runs first, then a demo-only note appears.
  var forms = document.querySelectorAll('form[data-demo]');
  Array.prototype.forEach.call(forms, function (form) {
    var note = form.querySelector('.form-note');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      note.textContent = 'Demo only — nothing was sent.';
      note.hidden = false;
      form.reset();
    });
  });
})();
"""


# ---------------------------------------------------------------- fragments
def meta_line(p, author=False):
    bits = [esc(p["date"]), p["kicker"], esc(p["read"]) + " read"]
    if author:
        bits.append(esc(SITE["author"]))
    return " · ".join(bits)


def rail(current):
    """Vertical masthead (first screen) + fixed nav cluster (desktop), and the
    thin sticky top strip (narrow). Both are in the DOM; CSS picks one."""
    def item(label, href, key):
        cur = ' aria-current="page"' if key == current else ""
        return '<a href="%s"%s>%s</a>' % (href, cur, label)
    home = "index.html"
    items = [item("home", home, "home"), item("archive", home + "#archive", "archive"),
             item("rss", "#", "rss"), item("subscribe", "#subscribe", "subscribe")]
    return """
<header>
  <p class="masthead"><a href="index.html"><span class="name">%(name)s</span><span class="tag"> — %(tagline)s</span></a></p>
  <nav class="rail-nav" aria-label="Site">%(items)s</nav>
  <div class="strip">
    <a class="name" href="index.html">%(name)s</a>
    <nav aria-label="Site">%(strip_items)s</nav>
  </div>
</header>""" % {
        "name": esc(SITE["name"]), "tagline": esc(SITE["tagline"]),
        "items": "".join(items), "strip_items": "".join(items[1:]),
    }


def subscribe_form():
    return """
<form method="dialog" data-demo>
  <div class="subscribe-row">
    <label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>
    <button type="submit">Subscribe</button>
  </div>
  <p class="form-note" role="status" hidden></p>
</form>"""


def footer():
    social = "".join('<li><a href="%s">%s</a></li>' % (esc(h), esc(n)) for n, h in SITE["social"])
    return """
<footer>
  <div>
    <p class="site-name"><a href="index.html">%(name)s</a></p>
    <p class="tagline">%(tagline)s</p>
    <p class="about">%(about)s</p>
    <ul class="social" aria-label="Elsewhere">%(social)s</ul>
  </div>
  <div class="subscribe" id="subscribe">
    <h2>New claims by email</h2>
    <p>One message per post. No digest, no roundup.</p>
    %(form)s
  </div>
  <p class="colophon">%(name)s · written by %(author)s · comments are illustrative</p>
</footer>""" % {
        "name": esc(SITE["name"]), "tagline": esc(SITE["tagline"]),
        "about": esc(SITE["short_description"]), "social": social,
        "form": subscribe_form(), "author": esc(SITE["author"]),
    }


def page(title, body, current, desc):
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<meta name="robots" content="noindex">
<style>
%(fonts)s
%(sizes)s
%(css)s
</style>
</head>
<body>
%(rail)s
%(body)s
<script>%(js)s</script>
</body>
</html>
""" % {
        "title": esc(title), "desc": esc(desc), "fonts": common.font_css(FONTS),
        "sizes": size_css(), "css": CSS, "rail": rail(current), "body": body, "js": JS,
    }


# ---------------------------------------------------------------- home
def highlight(dek, phrase):
    e = esc(dek)
    return e.replace(esc(phrase), "<mark>%s</mark>" % esc(phrase), 1)


def home():
    lead = POSTS[0]
    hero = """
<main id="main">
<section class="hero" aria-labelledby="lead">
  <p class="meta">%(meta)s</p>
  <h1 class="poster lead-title h-%(tier)s" id="lead"><a href="post.html">%(title)s</a></h1>
  <div class="hero-deck deck">
    <p>%(dek)s</p>
    <a class="more" href="post.html">Read the argument →</a>
  </div>
</section>""" % {
        "meta": meta_line(lead), "tier": tier(lead["title"]),
        "title": glue(lead["title"]),
        "dek": highlight(lead["dek"], "It happened a year early"),
    }

    bands = []
    for i, p in enumerate(POSTS[1:]):
        side = "left" if i % 2 == 0 else "right"
        fig = ""
        data = ""
        if p["img"]:
            fig = '<img class="band-fig" src="img/%s" alt="" width="72" height="72" loading="lazy">' % p["img"]
            data = ' data-img="img/%s"' % p["img"]
        tags = "".join('<li><a href="index.html#archive">%s</a></li>' % esc(t) for t in p["tags"])
        bands.append("""
<article class="band band--%(side)s">
  <p class="meta">%(meta)s</p>
  <h2 class="poster band-title h-%(tier)s"><a href="post.html"%(data)s>%(title)s</a></h2>
  <div class="band-body">%(fig)s<p class="deck">%(dek)s</p></div>
  <ul class="tags" aria-label="Tags">%(tags)s</ul>
</article>""" % {
            "side": side, "meta": meta_line(p), "tier": tier(p["title"]), "data": data,
            "title": glue(p["title"]), "fig": fig, "dek": esc(p["dek"]), "tags": tags,
        })

    wall = """
<section class="wall" id="archive" aria-label="Archive">
%s
</section>
</main>
<div class="reveal" id="reveal" aria-hidden="true"><img src="img/%s" alt=""></div>
""" % ("".join(bands), POSTS[1]["img"])
    return page(SITE["name"], hero + wall + footer(), "home",
                SITE["tagline"] + ". " + SITE["short_description"])


# ---------------------------------------------------------------- article
PULL_QUOTES = [
    # (substring of the paragraph after which the quote is inserted, quote html)
    ("treat the human-facing UI as one client among several",
     "Design for the agent as your primary user. The human UI is one client among several."),
    ("it <em>is</em> the product",
     "For a growing share of your users, the agent interface <em>is</em> the product."),
]


def article_body():
    body = common.body_with_ids(ARTICLE["body"], ARTICLE["sections"])
    # Number the in-text links that appear in the sources list.
    index = {url: n for n, (_, _, url) in enumerate(CITATIONS, 1)}

    def ref(m):
        n = index.get(m.group(1))
        return m.group(0) + ('<sup class="ref"><a href="#src-%d" aria-label="Source %d">%d</a></sup>' % (n, n, n) if n else "")
    body = re.sub(r'<a href="([^"]+)"[^>]*>.*?</a>', ref, body)
    # Poster-scale pull quotes: the only loud moments on the article page.
    paras = re.split(r"(?<=</p>)", body)
    out = []
    for para in paras:
        out.append(para)
        for needle, quote in PULL_QUOTES:
            if needle in para:
                out.append('\n<aside class="poster pq" aria-label="Pull quote">%s</aside>\n' % quote)
    return "".join(out)


def post():
    a = ARTICLE
    fig = ('<img class="post-fig" src="img/%s" alt="">' % a["img"]) if a["img"] else ""
    sources = "".join(
        '<li id="src-%d"><a href="%s" rel="noopener noreferrer" target="_blank">%s</a><span class="domain">%s</span></li>'
        % (n, esc(url), esc(t), esc(d)) for n, (t, d, url) in enumerate(CITATIONS, 1))
    comments = "".join("""
<article class="comment">
  <p class="comment-head"><span class="who">%s</span><span class="when">%s</span></p>
  <p>%s</p>
</article>""" % (esc(w), esc(d), esc(t)) for w, d, t in COMMENTS)
    tags = "".join('<li><a href="index.html#archive">%s</a></li>' % esc(t) for t in a["tags"])
    nxt = POSTS[1]
    body = """
<main id="main">
<article class="article">
  <div class="col">
    <header class="post-head">
      <p class="meta">%(fig)s%(meta)s</p>
      <h1 class="poster post-title h-%(tier)s">%(title)s</h1>
      <p class="post-sub">%(subtitle)s</p>
    </header>
    <div class="prose">
    <p>%(hook)s</p>
%(body)s
    </div>
    <ul class="tags post-tags" aria-label="Tags">%(tags)s</ul>

    <section class="section" aria-labelledby="sources-h">
      <h2 class="section-title" id="sources-h">Sources</h2>
      <ol class="sources">%(sources)s</ol>
    </section>

    <section class="section" aria-labelledby="comments-h">
      <h2 class="section-title" id="comments-h">Comments</h2>
      %(comments)s
      <form method="dialog" data-demo aria-label="Leave a comment">
        <label class="field"><span>Name</span><input type="text" name="name" required autocomplete="name"></label>
        <label class="field"><span>Comment</span><textarea name="comment" required minlength="3"></textarea></label>
        <button type="submit">Post comment</button>
        <p class="form-note" role="status" hidden></p>
      </form>
    </section>

    <section class="next" aria-labelledby="next-h">
      <p class="meta label" id="next-h">Next claim · %(next_meta)s</p>
      <p class="poster next-title"><a href="post.html">%(next_title)s</a></p>
    </section>
  </div>
</article>
</main>
""" % {
        "fig": fig, "meta": meta_line(a, author=True), "tier": tier(a["title"]),
        "title": glue(a["title"]), "subtitle": esc(a["subtitle"]),
        "hook": highlight(a["hook"], "The winning products will be the ones an agent can actually use."),
        "body": article_body(), "tags": tags, "sources": sources, "comments": comments,
        "next_meta": meta_line(nxt), "next_title": glue(nxt["title"]),
    }
    return page(a["title"] + " — " + SITE["name"], body + footer(), "post", a["hook"])


if __name__ == "__main__":
    common.prepare(OUT, FONTS, [p["img"] for p in POSTS if p["img"]])
    print(common.write(OUT, "index.html", home()))
    print(common.write(OUT, "post.html", post()))
    for p in POSTS:
        print("%-3s %2d  %s" % (tier(p["title"]), len(p["title"]), p["title"]))
