---
title: "Design-review capture: fold shots, captureBeyondViewport, and viewport-dependent layout"
kind: "pitfall"
status: "active"
visibility: "shared"
applies_to:
  - "design-prototypes"
tags:
  - "screenshots"
  - "tooling"
  - "design-review"
created_at: "2026-09-07"
updated_at: "2026-09-07"
created_by: "claude"
verified_at: "2026-09-07"
supersedes: []
superseded_by: null
---

Four capture traps found in the second template exploration
(`design-prototypes/emdash-2026-09-07/`), each of which produced a critic
finding that was not a design fault:

- **`Page.captureScreenshot` with `captureBeyondViewport: true` under mobile
  emulation displaces sticky/fixed elements and fires IntersectionObservers
  for content that is not on screen.** A pinned running head appeared 120px
  below the top and "cut through" body text in a 390px viewport shot while
  `getBoundingClientRect().top === 0` live. Viewport shots must pass
  `captureBeyondViewport: false`; only full-page shots need it.
  `_build/capture.mjs` does this now.
- **Full-page capture inflates the viewport, so `vh`-based spacing and any
  JS that reads `innerHeight` renders differently in a full-page shot than
  on screen.** A footer dropped off one full-page shot; a title-fit script
  broke the lead differently in the fold and full-page captures. Use rem or
  vw for spacing, and give fit scripts a fixed reference budget
  (Poster uses 1440×900) rather than the live viewport height.
- **Critics need exact first-viewport captures (`*-fold.png`) alongside
  full-page shots.** Two critics stalled or mis-cropped tall full-page
  images trying to isolate the fold; supplying fold shots removed every
  crop step.
- **Scroll-driven transitions are caught mid-flight** if the capture fires
  within ~150ms of scroll priming; a compact sticky strip measured 190px in
  a shot and 64px at rest. Wait ≥450ms after priming, and make state
  changes that must be deterministic instant rather than tuned.

Also verified: Chrome does not repaint `text-decoration-color` after a
custom property changes on `<html>`, so a live accent swap needs a repaint
nudge (prototype-only; the real template sets the accent server-side), and
Google's CSS API serves Fraunces without its WONK/SOFT axes.

## Evidence

- `design-prototypes/emdash-2026-09-07/_build/NOTES.md`, sections
  "Round 2 — concept 01", "Round 2 — concept 02", "Assessment 1 — concept
  03 (second dispatch)" and "Cross-cutting lessons".
- `design-prototypes/emdash-2026-09-07/_build/capture.mjs`.
