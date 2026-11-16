// Turns a drink recipe into renderer state + a GSAP timeline.
import { gsap } from 'gsap'
import { C } from '../data/drinks.js'
import { innerPoly } from './geometry.js'
import { makeContainer, addLayer, SCENE_H } from './renderer.js'
import { makeProxy } from './svgProxy.js'

// `view` crops the 240 × 280 scene (same aspect) so short cups fill the frame.
const CLOSE = [30, 62, 180, 210]
export const VESSELS = {
  demitasse: { yTop: 198, yBot: 242, halfTop: 33, halfBot: 28, r: 10, bulge: 2, wall: 3, base: 5, handle: 'small', saucer: true, view: CLOSE },
  gibraltar: { yTop: 170, yBot: 242, halfTop: 37, halfBot: 33, r: 6, wall: 3.5, base: 10, view: CLOSE },
  cup: { yTop: 184, yBot: 242, halfTop: 56, halfBot: 32, r: 14, bulge: 7, wall: 3, base: 5, handle: 'cup', saucer: true, view: CLOSE },
  latte: { yTop: 118, yBot: 244, halfTop: 43, halfBot: 37, r: 8, wall: 3, base: 9, view: [30, 54, 180, 210] },
  mug: { yTop: 150, yBot: 244, halfTop: 49, halfBot: 47, r: 10, wall: 3.5, base: 8, handle: 'mug', view: CLOSE },
  highball: { yTop: 98, yBot: 246, halfTop: 47, halfBot: 43, r: 6, wall: 3, base: 10, view: [15, 20, 210, 245] },
  tumbler: { yTop: 152, yBot: 234, halfTop: 32, halfBot: 26, r: 4, wall: 2.5, base: 4, opaque: 'steel', dabara: true, pullY: 26, view: [0, 0, 240, 280] },
  turkish: { yTop: 198, yBot: 242, halfTop: 31, halfBot: 25, r: 10, wall: 3, base: 5, opaque: 'ceramic', saucer: true, view: CLOSE },
  bowl: { yTop: 196, yBot: 244, halfTop: 62, halfBot: 34, r: 18, bulge: 4, wall: 3, base: 6, view: CLOSE },
}

// How each source behaves while pouring.
const SOURCES = {
  pitcher: { rest: -14, pour: -50, w: [5, 3.4], dx: 0 },
  kettle: { rest: -6, pour: -24, w: [3.2, 2.4], dx: 0 },
  carafe: { rest: -16, pour: -64, w: [5.4, 4], dx: 0 },
  bottle: { rest: -30, pour: -118, w: [5, 3.6], dx: 0 },
  cezve: { rest: -10, pour: -52, w: [4, 3], dx: 0 },
  pull: { rest: -40, pour: -96, w: [3.4, 2.6], dx: 0 },
  shot: { rest: 0, pour: 0, w: [2.2, 1.7], twin: 4, drop: true },
  pump: { rest: 0, pour: 0, w: [3, 2.6], drop: true, pump: true },
  tap: { rest: 0, pour: 0, w: [6, 4.6], drop: true, tap: true },
}

const NAMES = {
  [C.espresso]: 'Espresso',
  [C.water]: 'Water',
  [C.steamedMilk]: 'Steamed milk',
  [C.coldMilk]: 'Cold milk',
  [C.foam]: 'Microfoam',
  [C.choc]: 'Chocolate sauce',
  [C.hotChoc]: 'Hot chocolate',
  [C.chocFoam]: 'Frothed milk',
  [C.caramel]: 'Caramel syrup',
  [C.coldBrew]: 'Cold brew',
  [C.nitroHead]: 'Nitro head',
  [C.tonic]: 'Tonic',
  [C.condensed]: 'Condensed milk',
  [C.chai]: 'Masala chai',
  [C.cardamomMilk]: 'Cardamom milk',
  [C.mascarpone]: 'Mascarpone cream',
  [C.decoction]: 'Decoction',
  [C.kaapiFroth]: 'Froth',
  [C.turkish]: 'Turkish coffee',
  [C.turkishFoam]: 'Kaimak foam',
  [C.indianCold]: 'Blended cold coffee',
  [C.indianFroth]: 'Froth',
  [C.matcha]: 'Whisked matcha',
  [C.matchaFoam]: 'Matcha foam',
  [C.strawberry]: 'Strawberry milk',
  [C.americano]: 'Hot water',
  [C.kaapiMix]: 'Hot milk, pulled',
  [C.matchaMilk]: 'Steamed milk',
  [C.cocoa]: 'Cocoa',
  [C.cinnamon]: 'Cinnamon',
  [C.cardamom]: 'Cardamom',
  [C.whip]: 'Whipped cream',
  [C.dalgona]: 'Whipped coffee',
}

export function nameFor(color, fallback = '') {
  return NAMES[color] || fallback
}

/** Which source art a recipe needs (so the SVG only renders those). */
export function sourcesFor(recipe) {
  const set = new Set()
  for (const s of recipe.steps) {
    if (s.via) set.add(s.via)
    if (s.t === 'dust') set.add('shaker')
  }
  return [...set]
}

export function mouthFor(vessel, via) {
  const v = VESSELS[vessel]
  if (via === 'pull') return { x: 120, y: v.pullY ?? 30 }
  if (via === 'shaker') return { x: 120, y: v.yTop - 40 }
  const dx = via === 'shot' || via === 'tap' ? 0 : 3
  return { x: 120 + dx, y: v.yTop - (via === 'pump' ? 44 : 38) }
}

/** Build fresh mutable state for one play-through. */
export function createPourState(recipe) {
  const v = VESSELS[recipe.vessel]
  const c = makeContainer('main', innerPoly(v), {
    glass: v.opaque ? null : 'rgba(240,226,204,0.05)',
    extendTop: v.opaque ? 34 : 26,
    steamWidth: 0.45,
  })
  const plan = []
  for (const step of recipe.steps) {
    if (step.t === 'pour') {
      const layer = addLayer(c, {
        color: step.color,
        alpha: step.alpha,
        blend: step.blend ?? (step.foam ? 6 : 4),
        foam: step.foam,
        crema: step.crema,
        dome: step.dome,
        domeT: step.dome ? 0 : 1,
      })
      plan.push({ step, layer, target: step.h * c.capacity })
    } else if (step.t === 'mix') {
      const layer = c.layers[c.layers.length - 1]
      layer.to = step.to
      plan.push({ step, layer, add: step.h * c.capacity })
    } else {
      plan.push({ step })
    }
  }

  // Ice: two loose columns stacked from the bottom.
  const iceStep = recipe.steps.find((s) => s.t === 'ice')
  if (iceStep) {
    const jitter = [3, -2, -4, 2, 1, -3]
    const rot = [0.18, -0.24, 0.3, -0.12, -0.3, 0.2]
    for (let i = 0; i < iceStep.n; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      c.ice.push({
        x: 120 + (col ? 15 : -15) + jitter[i % 6],
        y: -80,
        restY: v.yBot - 15 - row * 23 - (col ? 6 : 0),
        w: 24 + (i % 3) * 2,
        h: 21 + ((i + 1) % 3) * 2,
        rot: rot[i % 6],
      })
    }
  }
  if (recipe.steps.some((s) => s.t === 'scoop')) {
    c.scoop = { x: 120, y: -60, r: 27, visible: 0, melt: 0, restY: v.yBot - 33 }
  }
  const dollopStep = recipe.steps.find((s) => s.t === 'dollop')
  if (dollopStep) {
    c.dollop = { y: -90, sx: 1, sy: 1, size: dollopStep.size ?? 1, color: dollopStep.color, style: dollopStep.style || 'swirl', visible: 0 }
  }

  const stream = { x: 120, topY: 0, botY: 0, color: null, w0: 4, w1: 3, twin: 0, cloud: false, alpha: 1, target: c }
  return { containers: [c], streams: [stream], particles: [], emitters: [], proxies: [], main: c, stream, plan, vessel: v, view: v.view }
}

/**
 * Build the timeline. `root` is the scene's <svg>; sources are found by [data-src].
 * Returns { tl, schedule } where schedule is a list of { t, text } labels.
 */
export function buildPourTimeline(recipe, state, root) {
  const tl = gsap.timeline({ paused: true })
  const c = state.main
  const s = state.stream
  const schedule = []
  let cursor = 0.35
  let current = null
  let poured = 0 // scene px of liquid so far

  // Each source sits in a group translated to its mouth, so rotating its proxy
  // about local 0,0 tilts it around the spout.
  const proxies = {}
  const el = (via) => {
    if (!(via in proxies)) {
      const node = root.querySelector(`[data-src="${via}"]`)
      proxies[via] = node ? makeProxy(node, { opacity: 0 }) : null
      if (proxies[via]) state.proxies.push(proxies[via])
    }
    return proxies[via]
  }

  const enter = (via) => {
    const src = SOURCES[via] || { rest: 0 }
    const e = el(via)
    if (!e) return
    if (src.drop) {
      tl.fromTo(e, { x: 0, y: -150, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, cursor)
    } else {
      tl.fromTo(e, { x: 80, y: -110, rotation: 0, opacity: 0 }, { x: 0, y: 0, rotation: src.rest, opacity: 1, duration: 0.6, ease: 'power3.out' }, cursor)
    }
    cursor += 0.6
  }

  const exit = (via) => {
    const e = el(via)
    if (!e) return
    const src = SOURCES[via] || {}
    if (src.drop) tl.to(e, { y: -150, opacity: 0, duration: 0.45, ease: 'power2.in' }, cursor)
    else tl.to(e, { x: 80, y: -110, opacity: 0, duration: 0.45, ease: 'power2.in' }, cursor + 0.15)
    cursor += 0.25
  }

  for (const item of state.plan) {
    const step = item.step

    if (step.t === 'pour' || step.t === 'mix') {
      if (step.via !== current) {
        if (current) exit(current)
        enter(step.via)
        current = step.via
      }
      const src = SOURCES[step.via]
      const m = mouthFor(recipe.vessel, step.via)
      const e = el(step.via)
      const color = step.t === 'mix' ? step.to : step.color
      const amount = step.t === 'mix' ? item.add : item.target
      const isShot = step.via === 'shot'
      const dur = Math.min(2.1, Math.max(isShot ? 1.25 : 0.6, 0.4 + amount / 62))

      if (src.pour && e) tl.to(e, { rotation: src.pour, duration: 0.38, ease: 'power2.inOut' }, cursor)
      const start = cursor + (src.pour ? 0.28 : 0.05)
      tl.set(s, { x: m.x, topY: m.y, botY: m.y, color, alpha: step.alpha ?? 1, w0: src.w[0], w1: src.w[1], twin: src.twin || 0, cloud: Boolean(step.cloud) }, start)
      tl.to(s, { botY: SCENE_H + 30, duration: 0.36, ease: 'power2.in' }, start)
      const fill = start + 0.2

      if (step.t === 'mix') {
        tl.to(item.layer, { h: `+=${amount}`, mixT: 1, duration: dur, ease: 'sine.inOut' }, fill)
      } else {
        tl.to(item.layer, { h: item.target, duration: dur, ease: 'sine.inOut' }, fill)
        if (step.dome) tl.to(item.layer, { domeT: 1, duration: dur * 0.9, ease: 'power1.out' }, fill + dur * 0.25)
      }
      if (step.bubbles) tl.to(c, { bubbleRate: 1, duration: 0.4 }, fill)
      if (step.cascade) {
        tl.to(c, { cascade: 1, duration: 0.3 }, fill)
        tl.to(c, { cascade: 0, duration: 1.4 }, fill + dur + 0.8)
      }
      if (c.scoop) tl.to(c.scoop, { melt: 1, duration: dur + 1.2, ease: 'sine.out' }, fill)
      if (src.pump && e) {
        const head = e.el.querySelector('[data-pump-head]')
        if (head) tl.to(head, { y: 6, duration: 0.16, yoyo: true, repeat: Math.max(1, Math.round(dur / 0.32) * 2 - 1), ease: 'power1.inOut' }, start - 0.05)
      }
      if (src.tap && e) {
        const node = e.el.querySelector('[data-lever]')
        if (node) {
          const lever = makeProxy(node, { ox: 22, oy: -26, opacity: 1 })
          state.proxies.push(lever)
          tl.to(lever, { rotation: -32, duration: 0.3 }, start - 0.15)
          tl.to(lever, { rotation: 0, duration: 0.35 }, fill + dur - 0.1)
        }
      }

      tl.to(s, { topY: SCENE_H + 30, duration: 0.32, ease: 'power2.in' }, fill + dur - 0.18)
      if (src.pour && e) tl.to(e, { rotation: src.rest, duration: 0.34, ease: 'power2.inOut' }, fill + dur - 0.1)

      schedule.push({ t: start, text: nameFor(color) })
      poured += amount
      cursor = fill + dur + 0.12
      continue
    }

    if (current) {
      exit(current)
      current = null
    }

    if (step.t === 'ice') {
      schedule.push({ t: cursor, text: 'Ice' })
      c.ice.forEach((q, i) => {
        tl.fromTo(q, { y: -70 - i * 12 }, { y: q.restY, duration: 0.62, ease: 'bounce.out' }, cursor + i * 0.09)
      })
      cursor += c.ice.length * 0.09 + 0.55
    } else if (step.t === 'scoop') {
      schedule.push({ t: cursor, text: 'Vanilla gelato' })
      tl.set(c.scoop, { visible: 1 }, cursor)
      tl.fromTo(c.scoop, { y: -60 }, { y: c.scoop.restY, duration: 0.8, ease: 'bounce.out' }, cursor)
      cursor += 0.95
    } else if (step.t === 'dollop') {
      const d = c.dollop
      const rest = c.bottom - poured + 6
      schedule.push({ t: cursor, text: nameFor(step.color, 'Topping') })
      tl.set(d, { visible: 1 }, cursor)
      tl.fromTo(d, { y: -70, sx: 0.92, sy: 1.08 }, { y: rest, duration: 0.5, ease: 'power2.in' }, cursor)
      tl.to(d, { sy: 0.8, sx: 1.14, duration: 0.1, ease: 'power1.out' }, cursor + 0.5)
      tl.to(d, { sy: 1, sx: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' }, cursor + 0.6)
      cursor += 1.3
    } else if (step.t === 'dust') {
      const e = el('shaker')
      schedule.push({ t: cursor, text: nameFor(step.color, 'Dusting') })
      if (e) {
        e.oy = -30
        tl.fromTo(e, { y: -120, opacity: 0, rotation: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, cursor)
        tl.to(e, { rotation: 14, duration: 0.11, yoyo: true, repeat: 7, ease: 'sine.inOut' }, cursor + 0.45)
        tl.to(e, { y: -120, opacity: 0, duration: 0.4, ease: 'power2.in' }, cursor + 1.4)
      }
      tl.set(c.dust, { color: step.color }, cursor)
      tl.to(c.dust, { rate: 1, duration: 0.05 }, cursor + 0.45)
      tl.to(c.dust, { rate: 0, duration: 0.05 }, cursor + 1.3)
      cursor += 1.8
    }
  }
  if (current) exit(current)
  if (recipe.steam) tl.to(c, { steam: 1, duration: 1.6, ease: 'sine.out' }, cursor - 0.2)
  tl.to({}, { duration: 0.3 }, cursor) // pad so the final state settles
  schedule.push({ t: cursor + 0.1, text: '' })
  // Keep the whole pour brisk; every step keeps its relative choreography.
  tl.timeScale(1.35)
  return { tl, schedule }
}
