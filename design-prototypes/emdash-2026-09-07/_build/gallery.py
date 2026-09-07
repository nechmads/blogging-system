"""Builds the run-root comparison gallery. Neutral: it links to every concept
and describes what each one is, it does not rank them."""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common

RUN = common.RUN

CONCEPTS = [
    ("01-cover-stock", "Cover Stock",
     "Every post is an issue with a generated typographic cover, so it needs no "
     "photograph and looks the same whether an image exists or not. The home page is "
     "a face-out shelf: one issue faces out, the rest stand beside it. The article "
     "opens on its own cover.",
     ["Fraunces · Instrument Sans · Source Serif 4",
      "Cover plates derived from the publication colour, contrast-floored",
      "An image, when present, is a small inset on the cover"]),
    ("02-horizon", "Horizon",
     "Time is the spine. A large date axis runs across the top, posts hang from "
     "their real dates, and only \u201cnow\u201d is in colour. Scrolling the "
     "archive travels back along the axis; the article carries a reading-progress "
     "line on the same strip.",
     ["Schibsted Grotesk · Literata",
      "Posts positioned by date, with an honest break for the gap",
      "Images are small annotations pinned to the axis, or absent"]),
    ("03-poster", "Poster",
     "The headline is the argument. The lead title fills the first screen edge to "
     "edge; the archive is a wall of posters with no rules or containers. Images "
     "exist only on hover, so a missing one costs nothing.",
     ["Bricolage Grotesque · Geist",
      "One sans family across a huge scale range; no hairlines",
      "One accent use per screen, derived from the hex"]),
]

def has_preview(slug, page):
    return os.path.exists(os.path.join(RUN, "previews", f"{slug}-{page}.png"))

def build():
    cards = []
    for slug, name, blurb, facts in CONCEPTS:
        num = slug.split("-")[0]
        thumb = (f'<img src="previews/{slug}-home.png" alt="Home page of the '
                 f'{name} concept" loading="lazy">') if has_preview(slug, "home") else \
                '<div class="noshot">preview not captured</div>'
        facts_html = "".join(f"<li>{f}</li>" for f in facts)
        cards.append(f"""      <article class="card">
        <a class="shot" href="{slug}/index.html">{thumb}</a>
        <div class="meta">
          <p class="num">{num}</p>
          <h2>{name}</h2>
          <p class="blurb">{blurb}</p>
          <ul class="facts">{facts_html}</ul>
          <p class="links">
            <a href="{slug}/index.html">Home page</a>
            <a href="{slug}/post.html">Article page</a>
          </p>
        </div>
      </article>""")

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EmDash blog templates — round two, three concepts</title>
<style>
  :root {{
    --ink: #16181c; --muted: #6a6e78; --line: #d9d6cf; --bg: #f7f6f3;
    --card: #fff; --accent: #b4361f;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; background: var(--bg); color: var(--ink);
    font: 16px/1.6 ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }}
  .wrap {{ max-width: 1120px; margin: 0 auto; padding: 64px 24px 96px; }}
  header p.eyebrow {{
    font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--muted); margin: 0 0 14px;
  }}
  header h1 {{ font-size: clamp(30px, 4.5vw, 46px); line-height: 1.1; margin: 0 0 18px; letter-spacing: -.02em; }}
  header .lede {{ max-width: 62ch; color: #40444c; font-size: 17px; margin: 0 0 10px; }}
  header .note {{ max-width: 62ch; color: var(--muted); font-size: 14px; margin: 18px 0 0; }}
  hr {{ border: 0; border-top: 1px solid var(--line); margin: 44px 0; }}
  .card {{
    display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 32px; align-items: start; padding: 30px 0; border-top: 1px solid var(--line);
  }}
  .card:first-of-type {{ border-top: 0; }}
  .shot {{ display: block; border: 1px solid var(--line); background: var(--card); overflow: hidden; }}
  .shot img {{
    display: block; width: 100%; aspect-ratio: 16/10;
    object-fit: cover; object-position: top center;
  }}
  .noshot {{
    aspect-ratio: 16/10; display: grid; place-items: center;
    color: var(--muted); font-size: 13px;
  }}
  .num {{ font-variant-numeric: tabular-nums; color: var(--accent); font-size: 13px;
         letter-spacing: .1em; margin: 0 0 6px; }}
  .card h2 {{ font-size: 26px; margin: 0 0 10px; letter-spacing: -.01em; }}
  .blurb {{ margin: 0 0 14px; color: #40444c; }}
  .facts {{ margin: 0 0 16px; padding: 0; list-style: none; }}
  .facts li {{
    font-size: 13px; color: var(--muted); padding: 5px 0;
    border-top: 1px solid var(--line);
  }}
  .links a {{
    display: inline-block; margin-right: 10px; padding: 8px 14px;
    border: 1px solid var(--ink); color: var(--ink); text-decoration: none;
    font-size: 14px;
  }}
  .links a:hover, .links a:focus-visible {{ background: var(--ink); color: #fff; }}
  a:focus-visible, .shot:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 3px; }}
  footer {{ margin-top: 60px; color: var(--muted); font-size: 13px; max-width: 70ch; }}
  @media (max-width: 800px) {{
    .wrap {{ padding: 40px 18px 64px; }}
    .card {{ grid-template-columns: 1fr; gap: 20px; }}
  }}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <p class="eyebrow">Hot Metal · EmDash publication templates</p>
      <h1>Three more design concepts</h1>
      <p class="lede">Each concept is a working static prototype with a home page and a
        full article page, built on identical content from the <em>Looking Ahead</em>
        publication so they can be compared fairly. Open a few, then pick one — or
        combine parts of several.</p>
      <p class="note">These are prototypes, not the product: links inside a concept lead
        to that concept's own two pages, and the comment forms are demo-only and never
        send anything. Everything is self-contained — fonts and images are bundled, so
        the pages work offline from a file. Nothing in the application has been changed.</p>
    </header>
    <hr>
{chr(10).join(cards)}
    <footer>
      <p>Sample content is from your own public publication. The featured images are
      its real generated art — deliberately kept, because they are what these templates
      will actually have to work with: square, uneven, and often missing entirely. The
      lead story genuinely has no image — watch how each concept handles that.</p>
      <p>This is the second exploration; the first (2026-09-06) produced Press Machine
      and One Signal. These three deliberately avoid its silhouettes.</p>
    </footer>
  </div>
</body>
</html>
"""
    common.write(RUN, "index.html", html)
    return os.path.join(RUN, "index.html")

if __name__ == "__main__":
    print(build())
