"""Concept 01 — Cover Stock. Generates 01-cover-stock/index.html + post.html.

Every post is an issue with a typographic cover on one fixed grid (series band,
title zone, illustration zone or deck, imprint foot). The home page is a
face-out shelf; the article opens on its own cover. Run from _build:
    python3 c1.py
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
from content import SITE, POSTS, ARTICLE, CITATIONS, COMMENTS, esc

OUT = os.path.join(common.RUN, "01-cover-stock")
FONTS = ["fraunces", "instrument-sans", "source-serif"]
common.prepare(OUT, FONTS, [p["img"] for p in POSTS if p["img"]])

ISSUE0 = 41
PLATES = ["deep", "tint", "paper"]
# Shelved cover widths (px at desktop) — staggered like real books. 2:3 fixed.
SIZES = [1.0, 0.95, 1.06, 0.97, 1.03, 0.94, 1.07]


def issue_no(i):
    return "No. %d" % (ISSUE0 - i)


_MONTHS = {"January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
           "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"}


def short_date(long):
    """One date register outside the catalogue: 'Sep 2, 2026'. The catalogue keeps ISO as a card-index contrast."""
    m, rest = long.split(" ", 1)
    return "%s %s" % (_MONTHS.get(m, m), rest)


def plate(i):
    return PLATES[i % 3]


def fit(title):
    n = len(title)
    return "xl" if n <= 30 else "l" if n <= 40 else "m" if n <= 56 else "s"


def cover(i, p, *, href="post.html", h1=False, extra_cls="", style="", loading="lazy"):
    """One cover. As a link (shelf) or as a plain block with the article h1."""
    pl = plate(i)
    cls = "cover cover--%s fit-%s %s" % (pl, fit(p["title"]), extra_cls)
    if p["img"]:
        ill = ('<span class="cv-ill cv-ill--img"><img src="img/%s" alt="" width="1024" height="1024" loading="%s"></span>'
               % (p["img"], loading))
    else:
        ill = '<span class="cv-ill cv-ill--deck"><span class="cv-deck">%s</span></span>' % p["dek"]
    ttl = ('<h1 class="cv-h">%s</h1>' if h1 else '<span class="cv-h">%s</span>') % esc(p["title"])
    inner = (
        '<span class="cv-band"><span>%s</span><span>%s</span></span>' % (esc(SITE["name"]), issue_no(i))
        + '<span class="cv-title"><span class="cv-kicker">%s</span>%s</span>' % (p["kicker"], ttl)
        + ill
        + '<span class="cv-foot"><span class="cv-author">%s</span><time datetime="%s">%s</time></span>'
        % (esc(SITE["author"]), p["iso"], short_date(p["date"]))
    )
    st = ' style="%s"' % style if style else ""
    inner = ('<span class="cv">%s</span><span class="cv-spine" aria-hidden="true">%s · %s</span>'
             % (inner, esc(SITE["name"]), issue_no(i)))
    if href:
        return '<a class="%s" href="%s"%s>%s</a>' % (cls, href, st, inner)
    return '<div class="%s"%s>%s</div>' % (cls, st, inner)


def header(page):
    home = page == "index"
    nav = [
        ("Shelf", "index.html" if not home else "#shelf"),
        ("Catalogue", "#catalogue" if home else "index.html#catalogue"),
        ("About", "#colophon" if home else "index.html#colophon"),
        ("RSS", "#"),
    ]
    links = "".join('<a href="%s"%s>%s</a>' % (h, ' class="rss"' if t == "RSS" else "", t) for t, h in nav)
    # The home page's h1 is the imprint; the article's h1 lives on its cover.
    name = ('<h1 class="imprint-name"><a href="index.html">%s</a></h1>' if home else '<a class="imprint-name" href="index.html">%s</a>') % esc(SITE["name"])
    return (
        '<header class="imprint">%s'
        '<span class="imprint-tag">%s</span><nav aria-label="Site">%s</nav></header>'
        % (name, esc(SITE["tagline"]), links)
    )


def footer():
    social = " ".join('<a href="%s">%s</a>' % (h, t) for t, h in SITE["social"])
    return (
        '<footer class="foot"><div class="foot-in">'
        '<p><span class="foot-name">%s</span> · %s</p>'
        '<p class="foot-links">%s</p>'
        '<p class="foot-fine">© 2026 %s · Made with Hot Metal</p>'
        '</div></footer>' % (esc(SITE["name"]), esc(SITE["tagline"]), social, esc(SITE["author"]))
    )


def subscribe(compact=False):
    return (
        '<form class="sub%s" method="dialog" novalidate data-demo>'
        '<label for="sub-email">Get the next issue by email</label>'
        '<div class="sub-row"><input id="sub-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>'
        '<button type="submit">Subscribe</button></div>'
        '<p class="form-note" aria-live="polite"></p></form>' % (" sub--compact" if compact else "")
    )


CSS = """
html{--publication-accent:#b4361f;overflow-x:clip}
:root{
  --ground:oklch(93.5% 0.016 82);
  --stock:oklch(97.5% 0.008 85);
  --shelf:oklch(85% 0.022 78);
  --ink:oklch(22% 0.012 60);
  --ink-2:oklch(42% 0.012 60);
  --rule:oklch(80% 0.014 80);
  /* Derived accent family — never the raw hex under text. */
  --accent-ink:oklch(from var(--publication-accent) clamp(0.25, l, 0.42) min(c, 0.15) h);
  --plate-deep:var(--accent-ink);
  --plate-tint:oklch(from var(--publication-accent) 0.92 min(c, 0.08) h);
  --accent-line:oklch(from var(--publication-accent) clamp(0.3, l, 0.5) min(c, 0.17) h);
  --sans:'Instrument Sans',system-ui,-apple-system,sans-serif;
  --disp:'Fraunces',Georgia,'Times New Roman',serif;
  --body:'Source Serif 4',Georgia,'Times New Roman',serif;
  --pad:clamp(16px, 3.4vw, 48px);
  --lift:160ms cubic-bezier(.2,.7,.2,1);
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:1rem;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}
img{display:block;max-width:100%}
:focus-visible{outline:2px solid var(--accent-ink);outline-offset:3px}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}

/* Imprint — the publisher's mark, not a masthead */
.imprint{display:flex;flex-wrap:wrap;align-items:baseline;gap:.35rem 1.25rem;padding:1.1rem var(--pad) .9rem;font-size:.82rem;letter-spacing:.01em}
.imprint-name{font-weight:500;text-transform:uppercase;letter-spacing:.14em;text-decoration:none;margin:0;font-size:inherit}
.imprint-name a{text-decoration:none}
.imprint-tag{color:var(--ink-2)}
.imprint nav{margin-left:auto;display:flex;gap:1.2rem}
.imprint nav a{text-decoration:none;color:var(--ink-2)}
.imprint nav a:hover{color:var(--ink);text-decoration:underline;text-underline-offset:.2em}
.imprint nav a.rss::before{content:"";display:inline-block;width:.55em;height:.55em;margin-right:.35em;border-radius:50%;background:var(--accent-line);vertical-align:.05em}

/* ---------- Cover grid (Marber-style: band / title / illustration / foot) ---------- */
.cover{container-type:inline-size;position:relative;display:block;aspect-ratio:2/3;width:100%;text-decoration:none;color:var(--cv-fg);background:var(--cv-bg);--cv-fg:var(--ink);--cv-bg:var(--stock);--cv-rule:var(--ink)}
.cover--deep{--cv-bg:var(--plate-deep);--cv-fg:var(--stock);--cv-rule:var(--stock)}
.cover--tint{--cv-bg:var(--plate-tint);--cv-fg:var(--ink);--cv-rule:var(--ink)}
.cover--paper{--cv-bg:var(--stock);--cv-fg:var(--ink);--cv-rule:var(--ink)}
.cv{display:grid;grid-template-rows:14cqw 1fr 50cqw 12cqw;height:100%}
.cv > *{display:block;min-width:0}
.cv-band{display:flex;justify-content:space-between;align-items:center;gap:.8em;padding:0 6cqw;font-size:max(.6rem,3.1cqw);text-transform:uppercase;letter-spacing:min(.12em,.6cqw);border-bottom:1px solid var(--cv-rule)}
.cover--paper .cv-band{background:var(--accent-ink);color:var(--stock);border-bottom:0}
.cv-band > span{white-space:nowrap}
.cv-title{padding:5cqw 6cqw 4cqw;display:flex;flex-direction:column;gap:2.4cqw;overflow:clip}
.cv-kicker{font-size:max(.6rem,3.1cqw);letter-spacing:.1em;text-transform:uppercase;opacity:.85}
.cv-h{margin:0;font-family:var(--disp);font-weight:600;font-optical-sizing:none;font-variation-settings:"opsz" 144;line-height:1.02;letter-spacing:-.01em;text-wrap:balance;hyphens:manual;font-size:var(--fs)}
.fit-xl{--fs:max(1.25rem,14cqw)}
.fit-l{--fs:max(1.15rem,12cqw)}
.fit-m{--fs:max(1rem,10cqw)}
.fit-s{--fs:max(.95rem,9cqw)}
.cv-ill{border-top:1px solid var(--cv-rule);overflow:clip}
.cv-ill--deck{padding:4cqw 6cqw 0}
.cover--paper .cv-ill{border-top-color:var(--rule)}
/* The photo belongs to the plate: flush in the zone, greyscaled, then it takes the plate's hue (luminosity blend). */
.cv-ill--img img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.05);mix-blend-mode:luminosity}
.cv-deck{display:block;font-family:var(--body);font-style:italic;font-weight:400;font-size:max(.8rem,4.7cqw);line-height:1.32;text-wrap:pretty}
.cv-foot{display:flex;justify-content:space-between;align-items:center;gap:1em;padding:0 6cqw;font-size:max(.6rem,3cqw);letter-spacing:.04em;border-top:1px solid var(--cv-rule);font-variant-numeric:tabular-nums}
.cover--paper .cv-foot{border-top-color:var(--rule)}
.cv-foot > *{white-space:nowrap;overflow:clip;text-overflow:ellipsis}
@container (max-width:190px){.cv-author{display:none}.cv-foot{justify-content:flex-end}}
/* The issue cut by the shelf's edge is shown as its spine: the plate, the series name and number turned 90°. */
.cv-spine{display:none;position:absolute;top:0;left:0;bottom:0;width:40px;writing-mode:vertical-rl;align-items:center;justify-content:flex-start;padding-top:14px;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;color:var(--cv-fg)}
.cover--paper .cv-spine{background:var(--accent-ink);color:var(--stock)}
.cover.is-partial .cv{visibility:hidden}
.cover.is-partial .cv-spine{display:flex}
a.cover{transition:transform var(--lift),box-shadow var(--lift)}
a.cover:hover,a.cover:focus-visible{transform:translateY(-8px);box-shadow:0 18px 26px -16px oklch(22% 0.02 60 / .55)}

/* ---------- Shelf ---------- */
.shelf-wrap{padding-top:.5rem}
.shelf{display:grid;grid-template-columns:auto minmax(0,1fr);gap:0 clamp(20px,3vw,40px);align-items:end;padding-inline:var(--pad)}
.lead{width:clamp(300px,min(27vw,46vh),440px)}
.lead .cv-h,.opening-cover .cv-h{font-size:calc(var(--fs) * 1.25)}
.lead .cv-deck,.opening-cover .cv-deck{font-size:max(.95rem,5.8cqw)}
.stack{display:flex;flex-direction:column;justify-content:flex-end;min-width:0}
.shelf-label{display:flex;align-items:flex-end;justify-content:space-between;gap:1.5rem 3rem;padding:0 0 .2rem 4px}
.shelf-note{margin:0;font-family:var(--body);font-style:italic;font-weight:400;font-size:clamp(1.05rem,1.35vw,1.25rem);line-height:1.35;max-width:32em;color:var(--ink);text-wrap:pretty}
.shelf-count{margin:0;font-size:.82rem;color:var(--ink-2);white-space:nowrap;display:flex;align-items:center;gap:.8rem}
.row{display:flex;align-items:flex-end;gap:16px;overflow-x:auto;overflow-y:clip;scroll-snap-type:x proximity;scroll-padding-left:4px;padding:16px 0 0 4px;scrollbar-width:none;--base:18.5vw}
.row::-webkit-scrollbar{display:none}
.row .cover{flex:0 0 auto;width:calc(var(--base) * var(--m,1));scroll-snap-align:start}
.shelf-line{height:14px;border-top:2px solid var(--ink);background:var(--shelf)}
.cap-btns{display:inline-flex;gap:.25rem}
.cap-btns button{width:2.25rem;height:2.25rem;border:1px solid var(--ink);display:inline-grid;place-items:center;font-family:var(--disp);font-size:1.05rem;line-height:1}
.cap-btns button:hover{background:var(--ink);color:var(--stock)}
.cap-btns button:disabled{opacity:.35;cursor:default;background:none;color:inherit}

/* ---------- Catalogue ---------- */
.section{padding:3.2rem var(--pad) 0}
.section-h{display:flex;align-items:baseline;gap:1rem;margin:0 0 1rem;font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;font-weight:500}
.section-h h2{margin:0;font-size:inherit;font-weight:inherit;letter-spacing:inherit}
.section-h small{font-weight:400;letter-spacing:.02em;text-transform:none;color:var(--ink-2);margin-left:.6rem}
.cat-all{margin-left:auto;font-size:.78rem;letter-spacing:.06em;color:var(--ink-2);border-bottom:1px solid var(--accent-line);padding-bottom:1px}
.cat-all:hover,.cat-all[aria-pressed="true"]{color:var(--ink)}
.cat{list-style:none;margin:0;padding:0;border-top:1px solid var(--ink)}
.cat li{border-bottom:1px solid var(--rule)}
.cat-row{display:grid;grid-template-columns:4.2rem 7.2rem minmax(0,1fr) 9rem 4rem;gap:.5rem 1.2rem;align-items:baseline;padding:.85rem 0;font-variant-numeric:tabular-nums;text-decoration:none;color:inherit}
.cat-no{color:var(--accent-ink)}
.cat-date{color:var(--ink-2)}
.cat-title{font-size:1.02rem;font-weight:500}
.cat-row:hover .cat-title{text-decoration:underline;text-underline-offset:.2em;text-decoration-color:var(--accent-line)}
.cat-kicker,.cat-read{color:var(--ink-2);font-size:.85rem}
.cat-read{text-align:right}
.cat-back{padding:0 0 1rem 12.6rem;font-size:.95rem}
.cat-back[hidden]{display:none}
.cat-back p{margin:0;font-family:var(--body);font-style:italic;font-size:1.08rem;line-height:1.4;max-width:60ch}
.cat-back .subjects{margin:.35rem 0 0;color:var(--ink-2);font-size:.85rem}
.cat-back .subjects a{color:var(--ink);text-decoration-color:var(--accent-line);text-underline-offset:.2em}

/* ---------- Colophon ---------- */
.colophon{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:2rem clamp(24px,5vw,80px);padding:3.6rem var(--pad) 0;border-top:0}
.colophon h2{margin:0 0 .6rem;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;font-weight:400;color:var(--ink-2)}
.colophon .about{font-family:var(--body);font-size:1.08rem;line-height:1.55;max-width:56ch;margin:0}
.colophon .who{margin:.8rem 0 0;color:var(--ink-2);font-size:.9rem}
.colophon .social{margin:.9rem 0 0;display:flex;gap:1.1rem;font-size:.9rem}
.colophon .social a{text-decoration-color:var(--accent-line);text-underline-offset:.2em}
.subjects-idx{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.2rem .9rem;font-size:.92rem}
.subjects-idx a{text-decoration-color:var(--accent-line);text-underline-offset:.2em}
.sub label{display:block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.5rem;font-weight:400;color:var(--ink-2)}
.sub-row{display:flex;border:1px solid var(--ink);max-width:28rem}
.sub input{flex:1;min-width:0;border:0;background:var(--stock);padding:.7rem .8rem;font:inherit;color:var(--ink)}
.sub input:focus-visible{outline-offset:-2px}
.sub button[type=submit],.cmt-form button[type=submit]{background:var(--ink);color:var(--stock);padding:.7rem 1.1rem;font-weight:500}
.sub button[type=submit]:hover,.cmt-form button[type=submit]:hover{background:var(--accent-ink)}
.form-note{margin:.5rem 0 0;font-size:.85rem;color:var(--ink-2);min-height:1.2em}
.form-note.err{color:var(--accent-ink)}
.form-note:empty{display:none}

/* ---------- Footer ---------- */
.foot{margin-top:4rem;border-top:2px solid var(--ink);background:var(--shelf)}
.foot-in{padding:1.4rem var(--pad) 2.2rem;font-size:.85rem;display:flex;flex-wrap:wrap;gap:.4rem 2rem;align-items:baseline}
.foot p{margin:0}
.foot-name{font-weight:500;text-transform:uppercase;letter-spacing:.12em}
.foot-links{display:flex;gap:1rem}
.foot-links a{text-decoration-color:var(--accent-line);text-underline-offset:.2em}
.foot-fine{width:100%;color:var(--ink-2)}

/* ---------- Post ---------- */
/* One reading axis: the opening and the body share the same two columns, centred as a pair. */
.opening,.post{--cover-w:clamp(300px,min(27vw,46vh),440px);display:grid;grid-template-columns:var(--cover-w) minmax(0,68ch);gap:0 clamp(28px,4vw,64px);justify-content:center;font-family:var(--body);font-size:1.125rem}
.opening{align-items:stretch;padding:.5rem var(--pad) 0}
.opening-cover{align-self:end}
.opening-cover .cover{width:100%}
/* The lede's first baseline sits on the cover's title baseline; the opening then runs to the shelf line. */
.opening-text{padding:calc(var(--cover-w) * .325) 0 1.6rem;line-height:1.6}
.prose--lede{margin-top:1.6rem}
.standfirst{font-size:clamp(1.35rem,1.9vw,1.7rem);line-height:1.35;margin:0 0 1.1rem;text-wrap:pretty}
.byline{font-family:var(--sans);font-size:.85rem;color:var(--ink-2);margin:0;display:flex;flex-wrap:wrap;gap:.3rem .9rem;font-variant-numeric:tabular-nums;line-height:1.5}
.byline b{font-weight:500;color:var(--ink)}
.post{padding:2.6rem var(--pad) 0;align-items:start}
.post-aside{position:sticky;top:1.25rem;justify-self:end;width:min(250px,100%);visibility:hidden;opacity:0;transition:opacity 220ms ease}
.post-aside.is-stuck{visibility:visible;opacity:1}
.post-col{min-width:0;line-height:1.6}
.prose > :first-child{margin-top:0}
.prose p{margin:0 0 1.15em}
.prose h2{font-family:var(--disp);font-weight:500;font-optical-sizing:none;font-variation-settings:"opsz" 72;font-size:1.7rem;line-height:1.15;margin:2.2em 0 .6em;letter-spacing:-.01em;text-wrap:balance}
.prose a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent-line);text-decoration-thickness:2px;text-underline-offset:.16em}
.prose a:hover{text-decoration-color:var(--ink)}
.prose strong{font-weight:600}
.prose code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;background:var(--stock);padding:.05em .3em}
.spine{display:none}

/* Sources — a stamped column of numbers, like a due-date card */
.sources{margin-top:3rem;padding-top:1rem;border-top:2px solid var(--ink)}
.sources h2,.comments h2,.also h2,.post-sub-h{font-family:var(--sans);font-weight:500;font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;margin:0 0 .9rem}
.sources h2 small,.comments h2 small{font-weight:400;letter-spacing:.02em;text-transform:none;color:var(--ink-2);margin-left:.6rem}
.src{margin:0;padding:0;list-style:none;counter-reset:src;font-family:var(--sans);font-size:.92rem;line-height:1.4}
.src li{display:grid;grid-template-columns:2.6rem minmax(0,1fr);gap:.6rem;padding:.5rem 0;border-bottom:1px solid var(--rule);counter-increment:src}
.src li::before{content:counter(src,decimal-leading-zero);font-variant-numeric:tabular-nums;color:var(--accent-ink)}
.src a{text-decoration-color:var(--accent-line);text-underline-offset:.2em}
.src .dom{color:var(--ink-2);margin-left:.5rem;white-space:nowrap}
.subjects{font-family:var(--sans);font-size:.92rem;margin:1.6rem 0 0;color:var(--ink-2)}
.subjects a{color:var(--ink);text-decoration-color:var(--accent-line);text-underline-offset:.2em}
.subjects .lbl{letter-spacing:.08em;text-transform:uppercase;font-size:.78rem;margin-right:.5rem}

/* Comments */
.comments{margin-top:3rem;padding-top:1rem;border-top:2px solid var(--ink)}
.cmt{list-style:none;margin:0;padding:0}
.cmt li{padding:1rem 0;border-bottom:1px solid var(--rule);display:grid;grid-template-columns:2.6rem minmax(0,1fr);gap:.6rem}
.cmt .ini{font-family:var(--sans);font-size:.7rem;letter-spacing:.06em;width:2rem;height:2rem;display:grid;place-items:center;background:var(--plate-tint);color:var(--ink);border:1px solid var(--ink)}
.cmt .who{font-family:var(--sans);font-size:.85rem;display:flex;gap:.7rem;align-items:baseline;margin:0 0 .3rem}
.cmt .who b{font-weight:500}
.cmt .who time{color:var(--ink-2)}
.cmt p{margin:0;font-size:1.02rem;line-height:1.5}
.cmt-form{margin-top:1.4rem;font-family:var(--sans);font-size:.95rem;display:grid;gap:.7rem}
.cmt-form label{display:block;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.3rem;font-weight:500}
.cmt-form input,.cmt-form textarea{width:100%;border:1px solid var(--ink);background:var(--stock);padding:.6rem .75rem;font:inherit;color:var(--ink)}
.cmt-form textarea{min-height:7rem;resize:vertical;font-family:var(--body);font-size:1.02rem}
.cmt-form .row2{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.8rem;align-items:end}
.cmt-form button[type=submit]{justify-self:start}
.post-sub-wrap{margin-top:2.6rem;padding-top:1rem;border-top:2px solid var(--ink);font-family:var(--sans)}

/* More from the shelf */
.also{margin-top:4rem;padding:0 var(--pad)}
.also h2{font-size:.74rem;font-weight:400;color:var(--ink-2)}
.also .shelf-line{margin-inline:calc(-1 * var(--pad))}
.also .row{--base:15vw}

/* ---------- Motion / narrow ---------- */
@media (prefers-reduced-motion:reduce){
  a.cover,.post-aside{transition:none}
  a.cover:hover,a.cover:focus-visible{transform:none}
  html{scroll-behavior:auto}
}
@media (max-width:1100px){
  .cat-row{grid-template-columns:4.2rem 7.2rem minmax(0,1fr) 4rem}
  .cat-kicker{display:none}
}
@media (max-width:860px){
  .opening,.post{grid-template-columns:1fr;gap:0}
  .opening-cover .cover{aspect-ratio:3/4}
  .opening-cover .cv{grid-template-rows:12cqw 1fr 44cqw 10cqw}
  .opening-cover .cv-deck{font-size:max(.95rem,5.3cqw)}
  .opening-text{padding:1.4rem 0 0;max-width:66ch}
  .prose--lede{margin-top:1.2rem}
  .post-line{display:none}
  .post{padding-top:0}
  .post-aside{display:none}
  .spine{display:flex;position:sticky;top:0;z-index:2;margin-bottom:1.4rem;gap:.8rem;align-items:center;margin:0 calc(-1 * var(--pad));padding:.5rem var(--pad);background:var(--plate-deep);color:var(--stock);font-family:var(--sans);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
  .spine span:last-child{overflow:clip;text-overflow:ellipsis;min-width:0}
  .spine span:first-child{flex:0 0 auto}
}
@media (max-width:700px){
  .imprint{font-size:.78rem;gap:.3rem .9rem}
  .imprint nav{width:100%;margin-left:0;gap:1rem}
  .shelf{grid-template-columns:1fr;gap:0;padding-left:0}
  .also{padding-left:0}
  .also .shelf-line{margin-left:0}
  .lead{width:auto;margin:0 0 0 var(--pad);aspect-ratio:3/4}
  .lead .cv{grid-template-rows:12cqw 1fr 44cqw 10cqw}
  .lead .cv-deck{font-size:max(.95rem,5.3cqw)}
  .shelf-label{flex-direction:column;align-items:flex-start;gap:.6rem;padding:1.6rem 0 .4rem var(--pad)}
  .shelf-count{width:100%;justify-content:space-between}
  .shelf-note{font-size:1rem}
  .shelf-count{white-space:normal}
  .cap-btns button{width:2.75rem;height:2.75rem}
  .row{--base:38vw;padding:14px 0 0 var(--pad);gap:12px;scroll-snap-type:x mandatory;scroll-padding-left:var(--pad)}
  .cat-row{grid-template-columns:4.2rem 7.2rem minmax(0,1fr);gap:.2rem .8rem}
  .cat-title{grid-column:1 / -1;grid-row:2}
  .cat-read{grid-column:3;text-align:right;grid-row:1}
  .section-h{flex-wrap:wrap}
  .cat-back{padding-left:0}
  .colophon{grid-template-columns:1fr}
  .post-col{font-size:1.06rem}
  .also .row{--base:38vw}
}
@media (max-width:420px){
  .cat-row{grid-template-columns:4.2rem minmax(0,1fr) auto}
  .cat-date{grid-column:2}
  .cat-read{grid-column:3;grid-row:1}
}
"""

JS = r"""
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduce ? 'auto' : 'smooth';

  // Shelf: arrow keys move focus between covers; buttons page the shelf.
  document.querySelectorAll('.row').forEach(function(row){
    var covers = Array.prototype.slice.call(row.querySelectorAll('a.cover'));
    row.addEventListener('keydown', function(e){
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = covers.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === 'ArrowRight' ? Math.min(i + 1, covers.length - 1) : Math.max(i - 1, 0);
      if (n !== i) { e.preventDefault(); covers[n].focus({preventScroll:true}); covers[n].scrollIntoView({behavior:behavior, block:'nearest', inline:'nearest'}); }
    });
    var wrap = row.closest('.shelf-wrap');
    if (!wrap) return;
    var prev = wrap.querySelector('[data-shelf-prev]'), next = wrap.querySelector('[data-shelf-next]');
    if (!prev || !next) return;
    function step(dir){
      var w = covers[0] ? covers[0].getBoundingClientRect().width + 16 : 240;
      row.scrollBy({left: dir * w * 2, behavior: behavior});
    }
    function update(){
      prev.disabled = row.scrollLeft <= 2;
      next.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
    }
    prev.addEventListener('click', function(){ step(-1); });
    next.addEventListener('click', function(){ step(1); });
    row.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    update();
  });

  // Fit each shelf to whole covers plus a 40px spine of the next one, so no title is ever sliced by the edge.
  function fitShelf(row){
    var covers = row.querySelectorAll('a.cover'); if (!covers.length) return;
    row.style.width = '';
    var cs = getComputedStyle(row), gap = parseFloat(cs.columnGap) || 16, padL = parseFloat(cs.paddingLeft) || 0, spine = 40;
    var avail = row.clientWidth, used = padL, n = 0;
    for (var i = 0; i < covers.length; i++) {
      var w = covers[i].getBoundingClientRect().width;
      if (used + (n ? gap : 0) + w + gap + spine > avail) break;
      used += (n ? gap : 0) + w; n++;
    }
    if (n === 0 || n === covers.length) return;
    row.style.width = Math.round(used + gap + spine) + 'px';
  }
  function fitAll(){ document.querySelectorAll('.row').forEach(fitShelf); }
  fitAll(); window.addEventListener('resize', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  // The cover cut at the shelf's edge shows only its plate — a spine, never sliced type.
  if ('IntersectionObserver' in window) document.querySelectorAll('.row').forEach(function(row){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ e.target.classList.toggle('is-partial', e.intersectionRatio < 0.98); });
    }, {root: row, threshold: [0, 0.5, 0.98, 1]});
    row.querySelectorAll('a.cover').forEach(function(c){ io.observe(c); });
  });

  // Post: once the opening has scrolled away, reveal the pinned facsimile (desktop). The narrow running head is plain CSS sticky.
  var pcover = document.querySelector('.opening');
  var pinned = document.querySelectorAll('.post-aside');
  if (pcover && pinned.length && 'IntersectionObserver' in window) {
    new IntersectionObserver(function(entries){
      var e = entries[0], gone = !e.isIntersecting && e.boundingClientRect.top < 0;
      pinned.forEach(function(el){ el.classList.toggle('is-stuck', gone); });
    }, {threshold: 0}).observe(pcover);
  }

  // Catalogue: turn a row over to read the back (deck + subjects).
  var all = document.querySelector('.cat-all');
  if (all) all.addEventListener('click', function(){
    var on = all.getAttribute('aria-pressed') !== 'true';
    all.setAttribute('aria-pressed', String(on));
    all.textContent = on ? 'Hide summaries' : 'Show summaries';
    document.querySelectorAll('.cat-back').forEach(function(b){ b.hidden = !on; });
  });

  // Demo forms: method="dialog" already aborts submission; validate locally and say so.
  document.querySelectorAll('form[data-demo]').forEach(function(form){
    var note = form.querySelector('.form-note');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function(f){ return !f.checkValidity(); });
      note.classList.toggle('err', bad.length > 0);
      form.querySelectorAll('[aria-invalid]').forEach(function(x){ x.removeAttribute('aria-invalid'); });
      if (bad.length) {
        var f = bad[0];
        f.setAttribute('aria-invalid', 'true');
        note.textContent = f.type === 'email' ? 'Enter a valid email address.' : 'Please fill in ' + (f.labels[0] ? f.labels[0].textContent.toLowerCase() : 'this field') + '.';
        f.focus();
        return;
      }
      note.textContent = 'Demo only — nothing was sent.';
      form.reset();
    });
  });
})();
"""


def page(title, body, page_id):
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
        "<meta name=\"robots\" content=\"noindex\">\n"
        "<title>%s</title>\n<style>\n%s\n%s</style>\n</head>\n<body class=\"page-%s\">\n%s\n<script>%s</script>\n</body>\n</html>\n"
        % (esc(title), common.font_css(FONTS), CSS, page_id, body, JS)
    )


# ---------------------------------------------------------------- home
def build_home():
    lead = POSTS[0]
    shelved = "".join(
        cover(i, p, extra_cls="", style="--m:%s" % SIZES[i - 1], loading="eager" if i <= 4 else "lazy")
        for i, p in enumerate(POSTS) if i > 0
    )
    rows = []
    for i, p in enumerate(POSTS):
        tags = " · ".join('<a href="#">%s</a>' % esc(t) for t in p["tags"])
        rows.append(
            '<li><a class="cat-row" href="post.html">'
            '<span class="cat-no">%s</span>'
            '<time class="cat-date" datetime="%s">%s</time>'
            '<span class="cat-title">%s</span>'
            '<span class="cat-kicker">%s</span>'
            '<span class="cat-read">%s</span>'
            '</a>'
            '<div class="cat-back" hidden><p>%s</p><p class="subjects">Subjects: %s</p></div></li>'
            % (issue_no(i), p["iso"], p["iso"], esc(p["title"]), p["kicker"], p["read"], p["dek"], tags)
        )
    all_tags = []
    for p in POSTS:
        for t in p["tags"]:
            if t not in all_tags:
                all_tags.append(t)
    subjects = "".join('<li><a href="#">%s</a></li>' % esc(t) for t in all_tags)
    social = " ".join('<a href="%s">%s</a>' % (h, t) for t, h in SITE["social"])

    body = (
        header("index")
        + '<main>'
        + '<section class="shelf-wrap" id="shelf" aria-label="The shelf">'
        + '<div class="shelf">'
        + cover(0, lead, extra_cls="lead", loading="eager")
        + '<div class="stack"><div class="shelf-label"><p class="shelf-note">%s</p>' % esc(SITE["short_description"])
        + '<p class="shelf-count">Back issues · %d on the shelf '
          '<span class="cap-btns"><button type="button" data-shelf-prev aria-label="Earlier on the shelf">‹</button><button type="button" data-shelf-next aria-label="Later on the shelf">›</button></span></p></div>' % (len(POSTS) - 1)
        + '<div class="row" aria-label="Back issues, newest first. Use the left and right arrow keys to move along the shelf.">%s</div>' % shelved
        + '</div></div>'
        + '<div class="shelf-line" aria-hidden="true"></div>'
        + '</section>'
        + '<section class="section" id="catalogue" aria-labelledby="cat-h">'
        + '<div class="section-h"><h2 id="cat-h">Catalogue <small>every issue, newest first</small></h2>'
          '<button class="cat-all" type="button" aria-pressed="false">Show summaries</button></div>'
        + '<ol class="cat">%s</ol></section>' % "".join(rows)
        + '<section class="colophon" id="colophon" aria-labelledby="col-h">'
        + '<div><h2 id="col-h">From the publisher</h2><p class="about">%s</p>' % esc(SITE["description"])
        + '<p class="who">Written and published by %s.</p>' % esc(SITE["author"])
        + '<p class="social">%s</p></div>' % social
        + '<div><h2>Subjects</h2><ul class="subjects-idx">%s</ul>' % subjects
        + '<div style="margin-top:2rem">%s</div></div>' % subscribe()
        + '</section></main>'
        + footer()
    )
    return page("%s — %s" % (SITE["name"], SITE["tagline"]), body, "home")


# ---------------------------------------------------------------- post
def build_post():
    a = ARTICLE
    prose = common.body_with_ids(a["body"], a["sections"])
    # The first two paragraphs open beside the cover; the rest reads below the shelf line.
    parts = re.split(r"(?<=</p>)", prose, maxsplit=2)
    lede, rest = "".join(parts[:2]), parts[2]
    src = "".join(
        '<li><span><a href="%s" target="_blank" rel="noopener noreferrer">%s</a><span class="dom">%s</span></span></li>' % (u, esc(t), d)
        for t, d, u in CITATIONS
    )
    tags = " · ".join('<a href="index.html#catalogue">%s</a>' % esc(t) for t in a["tags"])
    cmts = "".join(
        '<li><span class="ini" aria-hidden="true">%s</span><div><p class="who"><b>%s</b><time>%s</time></p><p>%s</p></div></li>'
        % ("".join(w[0] for w in n.replace(".", "").split()[:2]).upper(), esc(n), short_date(d), c)
        for n, d, c in COMMENTS
    )
    also = "".join(cover(i, POSTS[i], style="--m:%s" % SIZES[i - 1]) for i in range(1, len(POSTS)))

    body = (
        header("post")
        + '<main><article class="issue">'
        + '<header class="opening">'
        + '<div class="opening-cover">%s</div>' % cover(0, a, href=None, h1=True, loading="eager")
        + '<div class="opening-text"><p class="standfirst">%s</p>' % esc(a["hook"])
        + '<p class="byline"><b>%s</b><time datetime="%s">%s</time><span>%s read</span><span>%s words</span></p>'
          % (esc(SITE["author"]), a["iso"], short_date(a["date"]), a["read"], "{:,}".format(a["words"]))
        + '<div class="prose prose--lede">%s</div></div>' % lede
        + '</header><div class="shelf-line post-line" aria-hidden="true"></div>'
        + '<div class="post">'
        + '<aside class="post-aside" aria-hidden="true">%s</aside>' % cover(0, a, href=None, h1=False, loading="lazy")
        + '<div class="post-col">'
        + '<div class="spine" aria-hidden="true"><span>%s</span><span>%s</span></div>' % (issue_no(0), esc(a["title"]))
        + '<div class="prose">%s</div>' % rest
        + '<section class="sources" aria-labelledby="src-h"><h2 id="src-h">Sources <small>%d cited</small></h2><ol class="src">%s</ol></section>' % (len(CITATIONS), src)
        + '<p class="subjects"><span class="lbl">Subjects</span>%s</p>' % tags
        + '<section class="comments" aria-labelledby="cmt-h"><h2 id="cmt-h">Comments <small>%d</small></h2><ul class="cmt">%s</ul>' % (len(COMMENTS), cmts)
        + '<form class="cmt-form" method="dialog" novalidate data-demo>'
        + '<div><label for="c-name">Name</label><input id="c-name" name="name" type="text" autocomplete="name" required></div>'
        + '<div><label for="c-text">Comment</label><textarea id="c-text" name="comment" required></textarea></div>'
        + '<button type="submit">Post comment</button><p class="form-note" aria-live="polite"></p></form></section>'
        + '<div class="post-sub-wrap">%s</div>' % subscribe(compact=True)
        + '</div></div></article></main>'
        + '<section class="also shelf-wrap" aria-labelledby="also-h"><h2 id="also-h">More from the shelf</h2>'
        + '<div class="row" aria-label="More issues. Use the left and right arrow keys to move along the shelf.">%s</div>' % also
        + '<div class="shelf-line" aria-hidden="true"></div></section>'
        + footer()
    )
    return page("%s — %s" % (a["title"], SITE["name"]), body, "post")


if __name__ == "__main__":
    print(common.write(OUT, "index.html", build_home()))
    print(common.write(OUT, "post.html", build_post()))
