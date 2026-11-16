# What's your (brew) type?

A 12-question quiz that picks your coffee from your **personality**, **current mood** and **taste**, and then shows the drink being made.

## Run it

```bash
npm install
npm run dev
```

## How it works

- **Questions** are in `src/data/questions.js`: 4 on personality, 4 on mood and 4 on taste. Each answer nudges a target profile within its pillar.
- **Drinks** are in `src/data/drinks.js`. There are 36, each scored on caffeine, bitterness, sweetness, creaminess, comfort, adventure and pace, with flavour notes, availability and equipment family.
- **Engine** is `src/lib/engine.js`. It works through these steps:
  1. Applies hard filters: hot or iced, dairy-free, and an after-dinner caffeine cap.
  2. Scores each drink per pillar, weighted taste 45%, mood 35% and personality 20%, plus a small bonus for the persona's signature drinks.
  3. Picks a top pick, a backup from another equipment family, and a safe bet any café makes.
  4. Builds the "why" lines, the order tweaks, and a roast recommendation, which is given for manual brews only.
- **Animations** are in `src/anim/`:
  - `renderer.js` is the canvas liquid renderer. It draws layers, meniscus, damped wobble, foam, crema, ice, steam, streams and splashes.
  - `pourScene.js` turns each drink's recipe into a GSAP timeline.
  - `brewScenes.jsx` holds the five brew animations: pour-over (V60, Chemex and Kalita), French press, AeroPress, Moka pot and siphon.
  - `art.jsx` holds the line-art vessels and pouring tools.

## Checks

```bash
npm run check   # 40k random answer sets (invariants + win rates) and hand-written archetypes
npm run lint
npm run build
```

## Dev helpers

- `/?lab` opens an animation lab with every drink. Add `&drink=<id>` to open a specific one.
- `/?answers=<url-encoded JSON>` (dev only) jumps straight to the result screen for a set of answers.
