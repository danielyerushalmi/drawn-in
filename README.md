# Drawn In

A study of what highly interactive websites earn for the companies that build them, and what they take from the
people who use them. The site plays the techniques on you first, then shows you what it recorded, then explains.

The research and paper notes are in [`research/RESEARCH.md`](research/RESEARCH.md).

## Run it

```
npm install
npm run dev        # http://localhost:5411
npm run build      # static site in dist/
npm run preview    # http://localhost:5412, serves dist/
```

`dist/` is a plain static site and can be hosted anywhere that serves files.

## How it is put together

- **Part I plays along, inside the screen.** One fixed WebGL canvas (Three + Rapier, `src/stage.js`) above a set of
  CSS-sticky scenes. The same tiles play every scene: drawn to your cursor in the hero and interludes; a ring around a
  floating 3D screen that flashes a calm and a loud web page for 50 ms each (`src/pages.js` draws them); five pieces you grab in 3D and drop into a wireframe frame
  (the IKEA effect); red badges orbiting a real, endless feed and diving into it when a refresh pays out. Interludes
  show live numbers (time on page, tiles captured). A live event log prints what the page records, in plain sight.
- **The gate and the curtain.** Part I ends on a Continue button that counts down and presses itself (autoplay).
  Nothing below can be reached until it is pressed. The button grows into a full-screen curtain, "Recording stopped",
  then "See? You're drawn in.", handed off in place to the page underneath (`src/main.js`, `src/toys.js`).
- **The reveal.** A session report of what was measured, your cursor's path as a session-replay trail, and a
  two-question recall check that reproduces Xu & Sundar (2016) (`src/reveal.js`, `src/tracker.js`). Nothing is stored
  or sent; it lives in memory and is gone when the tab closes.
- **Part II stops performing**, out on paper: no smooth scroll, no physics. The only interactive pieces explain
  something: an evidence ledger filtered by strength of evidence, a live measurement of this page's own weight, the
  attention-span bars, and a conceptual "interactivity curve" (`src/essay.js`).
- **The finale.** The same tiles fall onto the paper and only move when you click.
- **Reduce motion** (top right) honours WCAG 2.3.3 and switches on by itself under `prefers-reduced-motion`.

## Checking it

```
node scripts/verify.mjs [url]          # screenshots at every chapter + physics probes, into shots/
W=390 H=844 node scripts/verify.mjs    # the same at phone size
node scripts/interact.mjs [url]        # plays every toy and checks the reveal reports it
node scripts/audit.mjs [url]           # 7 screen sizes: cut-off text, overflow, axe-core contrast (RM=1 for reduced motion)
node scripts/edge.mjs [url]            # 34 behaviour checks: reduced motion, gate, going back up, resize, touch, Part II controls
node scripts/review.mjs 1280x720 [url] # real-state screenshots of every section into shots/review/
```

`window.__stage.state()` in the console returns the physics state as numbers.
