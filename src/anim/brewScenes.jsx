// The five manual-brew animations. Each scene = static SVG art + renderer state + GSAP timeline.
import { gsap } from 'gsap'
import { cupPoly, innerPoly, outerPoly, toPath, circlePoly } from './geometry.js'
import { makeContainer, addLayer, hexToRgb, SCENE_H } from './renderer.js'
import { INK, Kettle } from './art.jsx'
import { makeProxy } from './svgProxy.js'

const WATER = '#D7E1DF'
const DRY_GROUNDS = '#7A5638'
const WET_GROUNDS = '#3A2416'
const OFF = SCENE_H + 30

const stroke = { stroke: INK.cream, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }
const thin = { stroke: 'rgba(240,226,204,0.38)', strokeWidth: 1.2, fill: 'none' }
const glint = { stroke: 'rgba(255,248,235,0.32)', strokeWidth: 2.4, strokeLinecap: 'round', fill: 'none' }

const ease = (k) => k * k * (3 - 2 * k)
const clamp01 = (v) => Math.max(0, Math.min(1, v))

function stream(target, extra = {}) {
  return { x: 120, topY: 0, botY: 0, color: null, w0: 3, w1: 2.4, twin: 0, cloud: false, alpha: 1, target, ...extra }
}

function Shadow({ cx = 120, y, rx }) {
  return <ellipse cx={cx} cy={y} rx={rx} ry="5" fill="rgba(10,5,2,0.28)" />
}

function GlassOutline({ v, handle }) {
  const inner = innerPoly(v)
  const outer = outerPoly(v)
  const iL = inner[0]
  const iR = inner[inner.length - 1]
  const oL = outer[0]
  const oR = outer[outer.length - 1]
  return (
    <g>
      {handle}
      <path d={toPath(inner)} {...thin} />
      <path d={toPath(outer)} {...stroke} fill="none" />
      <line x1={iL[0]} y1={iL[1]} x2={oL[0]} y2={oL[1]} {...stroke} strokeWidth="2.6" />
      <line x1={iR[0]} y1={iR[1]} x2={oR[0]} y2={oR[1]} {...stroke} strokeWidth="2.6" />
      <path d={`M ${iL[0] + 5} ${v.yTop + 8} L ${120 - v.halfBot + 6} ${v.yBot - v.r - 4}`} {...glint} />
    </g>
  )
}

export function Flame({ cx = 120, y, width = 40, part = 'flame' }) {
  const n = 5
  const tongues = Array.from({ length: n }, (_, i) => {
    const x = cx - width / 2 + (i + 0.5) * (width / n)
    const h = 12 + (i % 2 ? 4 : 0) + (i === 2 ? 4 : 0)
    return { x, h, d: i * 0.13 }
  })
  return (
    <g data-part={part} opacity="0">
      <ellipse cx={cx} cy={y - 4} rx={width * 0.62} ry="7" fill="rgba(232,148,106,0.22)" />
      {tongues.map((tg, i) => (
        <g key={i} className="flicker" style={{ animationDelay: `${tg.d}s`, transformOrigin: `${tg.x}px ${y}px` }}>
          <path d={`M ${tg.x - 4} ${y} Q ${tg.x - 4} ${y - tg.h * 0.6} ${tg.x} ${y - tg.h} Q ${tg.x + 4} ${y - tg.h * 0.6} ${tg.x + 4} ${y} Z`} fill={INK.terra} />
          <path d={`M ${tg.x - 2} ${y} Q ${tg.x - 2} ${y - tg.h * 0.35} ${tg.x} ${y - tg.h * 0.6} Q ${tg.x + 2} ${y - tg.h * 0.35} ${tg.x + 2} ${y} Z`} fill="#F4C9A0" />
        </g>
      ))}
    </g>
  )
}

function KettleSource({ mouth }) {
  return (
    <g transform={`translate(${mouth.x} ${mouth.y})`}>
      <g data-src="kettle" opacity="0">
        <Kettle />
      </g>
    </g>
  )
}

// The kettle sits in a group translated to its spout, so its proxy rotates about local 0,0.
function kettleIn(tl, root, at, state) {
  const e = makeProxy(root.querySelector('[data-src="kettle"]'), { opacity: 0 })
  state.proxies.push(e)
  tl.fromTo(e, { x: 80, y: -110, rotation: 0, opacity: 0 }, { x: 0, y: 0, rotation: -6, opacity: 1, duration: 0.6, ease: 'power3.out' }, at)
  return e
}
function kettleTilt(tl, e, at, deg = -24) {
  tl.to(e, { rotation: deg, duration: 0.38, ease: 'power2.inOut' }, at)
}
function kettleOut(tl, e, at) {
  tl.to(e, { x: 80, y: -110, opacity: 0, duration: 0.45, ease: 'power2.in' }, at)
}
function paddleProxy(root, state, ox, oy) {
  const p = makeProxy(root.querySelector('[data-part="paddle"]'), { ox, oy, opacity: 0 })
  state.proxies.push(p)
  return p
}
function streamOn(tl, s, at, props) {
  tl.set(s, { topY: props.y, botY: props.y, ...props }, at)
  tl.to(s, { botY: OFF, duration: 0.36, ease: 'power2.in' }, at)
}
function streamOff(tl, s, at) {
  tl.to(s, { topY: OFF, duration: 0.32, ease: 'power2.in' }, at)
}

function iceCubes(c, spots) {
  c.ice = spots.map(([x, y, rot], i) => ({ x, y, restY: y, w: 20 + (i % 2) * 3, h: 18 + ((i + 1) % 2) * 3, rot }))
}

// ═════════════════════════════════════════════════════════════
// Pour-over: V60, Chemex, Kalita Wave
// ═════════════════════════════════════════════════════════════
const SERVER = { yTop: 175, yBot: 248, halfTop: 30, halfBot: 40, r: 12, bulge: 6, wall: 2.5, base: 6 }
const CHEMEX_BULB = { yTop: 184, yBot: 250, halfTop: 12, halfBot: 32, r: 14, bulge: 22, wall: 3, base: 5 }
const BEDS = {
  v60: [[82, 96], [158, 96], [124, 160], [116, 160]],
  chemex: [[78, 96], [162, 96], [126, 152], [114, 152]],
  kalita: [[86, 102], [154, 102], [142, 150], [98, 150]],
}
const POUR_MOUTH = { x: 122, y: 56 }

function zigzag(x0, x1, y, amp = 3, step = 7) {
  const pts = []
  for (let x = x0, i = 0; x <= x1; x += step, i++) pts.push(`${i ? 'L' : 'M'} ${x} ${y - (i % 2 ? amp : 0)}`)
  return pts.join(' ')
}

function PourOverArt({ variant }) {
  const serverInner = innerPoly(SERVER)
  return (
    <g>
      {variant === 'chemex' ? (
        <g>
          <Shadow y={258} rx={58} />
          <GlassOutline v={CHEMEX_BULB} />
          {/* Upper cone of the flask */}
          <path d="M 72 94 L 112 154 M 168 94 L 128 154" {...stroke} fill="none" />
          <path d="M 66 86 Q 70 92 74 94 L 166 94" {...stroke} fill="none" />
          <path d={zigzag(80, 160, 94, 3, 8)} stroke="#EFE6D6" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path d="M 84 100 L 116 150" stroke="rgba(255,248,235,0.25)" strokeWidth="2.4" strokeLinecap="round" />
          {/* Wooden collar and leather tie */}
          <path d="M 104 150 L 136 150 L 141 182 L 99 182 Z" fill={INK.wood} {...stroke} />
          <path d="M 101 166 L 139 166" stroke={INK.darker} strokeWidth="2.4" />
          <circle cx="143" cy="168" r="3.2" fill={INK.darker} {...stroke} strokeWidth="1.2" />
          <path d="M 143 171 L 146 186" stroke={INK.darker} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 108 154 L 106 178" stroke="rgba(255,240,220,0.3)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <Shadow y={258} rx={56} />
          <GlassOutline v={SERVER} handle={<path d="M 151 194 C 174 194 174 232 154 234" {...stroke} fill="none" strokeWidth="2.4" />} />
          <path d={`M ${serverInner[0][0] - 4} ${SERVER.yTop} L ${serverInner[serverInner.length - 1][0] + 4} ${SERVER.yTop}`} {...stroke} />
          {variant === 'kalita' ? (
            <g>
              <path
                d={`M 80 100 ${Array.from({ length: 10 }, (_, i) => `L ${80 + (i + 1) * 1.8 + (i % 2 ? 2 : -1)} ${100 + (i + 1) * 5.2}`).join(' ')} L 98 152 M 160 100 ${Array.from({ length: 10 }, (_, i) => `L ${160 - (i + 1) * 1.8 - (i % 2 ? 2 : -1)} ${100 + (i + 1) * 5.2}`).join(' ')} L 142 152`}
                {...stroke}
                fill="none"
              />
              <path d="M 74 100 L 166 100" {...stroke} strokeWidth="2.6" />
              <path d={zigzag(84, 156, 100, 2.5, 6)} stroke="#EFE6D6" strokeWidth="1.8" fill="none" />
              <path d="M 102 160 L 100 173 M 138 160 L 140 173" {...stroke} />
              <rect x="92" y="152" width="56" height="8" rx="2" fill={INK.dark} {...stroke} />
              {[112, 120, 128].map((x) => (
                <circle key={x} cx={x} cy="156" r="1.4" fill={INK.cream} />
              ))}
              <path d="M 160 108 C 178 108 178 130 156 132" {...stroke} fill="none" strokeWidth="2.4" />
            </g>
          ) : (
            <g>
              <path d="M 74 94 L 117 164 M 166 94 L 123 164" {...stroke} fill="none" />
              <path d="M 70 94 L 170 94" {...stroke} strokeWidth="2.6" />
              <path d={zigzag(80, 160, 94, 3, 8)} stroke="#EFE6D6" strokeWidth="2" fill="none" />
              {[0, 1, 2].map((i) => (
                <path key={i} d={`M ${92 + i * 12} 102 Q ${104 + i * 8} 128 ${114 + i * 3} 154`} stroke="rgba(240,226,204,0.2)" strokeWidth="1.2" fill="none" />
              ))}
              <rect x="90" y="164" width="60" height="8" rx="2" fill={INK.dark} {...stroke} />
              <rect x="116" y="160" width="8" height="5" fill={INK.dark} {...stroke} strokeWidth="1.2" />
              <path d="M 162 102 C 182 102 182 126 158 128" {...stroke} fill="none" strokeWidth="2.4" />
            </g>
          )}
        </g>
      )}
      <KettleSource mouth={POUR_MOUTH} />
    </g>
  )
}

function createPourOver({ variant, iced, color }) {
  const server = variant === 'chemex' ? makeContainer('server', innerPoly(CHEMEX_BULB), { steamWidth: 0.3 }) : makeContainer('server', innerPoly(SERVER), { steamWidth: 0.35 })
  const bed = makeContainer('bed', BEDS[variant], { glass: 'rgba(239,230,214,0.2)', extendTop: 8, meniscus: 0.6, idleWave: 0.1 })
  const grounds = addLayer(bed, { color: DRY_GROUNDS, to: WET_GROUNDS, h: variant === 'v60' ? 14 : 12, dome: 4, domeT: 0, foam: true })
  const slurry = addLayer(bed, { color, alpha: 0.92, blend: 5 })
  const brewed = addLayer(server, { color })
  if (iced) iceCubes(server, [[106, 232, 0.2], [134, 230, -0.25], [118, 210, 0.35], [140, 208, -0.1]])
  const dripY = variant === 'chemex' ? 184 : variant === 'kalita' ? 160 : 172
  const drips = variant === 'kalita' ? [112, 120, 128].map((x) => stream(server, { x })) : [stream(server, { x: 120 })]
  const main = stream(bed, { x: POUR_MOUTH.x })
  const dripper = { kind: 'drop', x: 120, y: dripY, color, rate: 0, target: server, r: 1.4, spread: variant === 'kalita' ? 16 : 0 }
  return { containers: [server, bed], streams: [main, ...drips], particles: [],
    proxies: [], emitters: [dripper], main, drips, dripper, bed, server, L: { grounds, slurry, brewed }, dripY, iced }
}

function pourOverTimeline(state, root, { color, iced }) {
  const tl = gsap.timeline({ paused: true })
  const schedule = []
  const m = POUR_MOUTH
  const { main, drips, dripper, bed, server, L } = state
  const serverFull = server.capacity * 0.56
  let t = 0.3

  const k = kettleIn(tl, root, t, state)
  t += 0.6
  schedule.push({ t, text: 'Bloom' })
  kettleTilt(tl, k, t)
  streamOn(tl, main, t + 0.28, { y: m.y, x: m.x, color: WATER, alpha: 0.65, w0: 3.2, w1: 2.4 })
  tl.to(L.grounds, { mixT: 1, h: '+=6', duration: 1, ease: 'sine.out' }, t + 0.45)
  tl.to(L.grounds, { domeT: 1, duration: 1.4, ease: 'power2.out' }, t + 0.6)
  tl.to(bed, { bloom: 1, duration: 0.3 }, t + 0.7)
  streamOff(tl, main, t + 1.2)
  tl.to(k, { rotation: -6, duration: 0.3 }, t + 1.3)
  t += 2.6

  schedule.push({ t, text: 'Spiral pour' })
  tl.to(bed, { bloom: 0.25, duration: 0.5 }, t)
  kettleTilt(tl, k, t)
  const ps = t + 0.28
  streamOn(tl, main, ps, { y: m.y, x: m.x, color: WATER, alpha: 0.65 })
  const sway = [0, -11, 11, -9, 9, -11, 11, -6, 0]
  tl.to(k, { keyframes: { x: sway, easeEach: 'sine.inOut' }, duration: 3.4 }, ps)
  tl.to(main, { keyframes: { x: sway.map((d) => m.x + d), easeEach: 'sine.inOut' }, duration: 3.4 }, ps)
  tl.to(L.slurry, { h: 34, duration: 3.2, ease: 'sine.inOut' }, ps + 0.2)
  drips.forEach((d) => streamOn(tl, d, ps + 0.8, { y: state.dripY, color, w0: drips.length > 1 ? 1.6 : 2.4, w1: drips.length > 1 ? 1.3 : 1.9 }))
  tl.to(L.brewed, { h: serverFull * 0.45, duration: 3.2, ease: 'sine.in' }, ps + 1)
  streamOff(tl, main, ps + 3.3)
  kettleOut(tl, k, ps + 3.4)
  t = ps + 3.5

  schedule.push({ t, text: 'Drawdown' })
  tl.to(L.slurry, { h: 0, duration: 2.6, ease: 'sine.inOut' }, t)
  tl.to(L.grounds, { domeT: 0.25, duration: 2.6, ease: 'sine.inOut' }, t)
  tl.to(bed, { bloom: 0, duration: 1 }, t)
  tl.to(L.brewed, { h: serverFull, duration: 2.9, ease: 'sine.out' }, t)
  drips.forEach((d) => {
    tl.to(d, { w0: 1, w1: 0.8, duration: 2.2, ease: 'sine.in' }, t)
    streamOff(tl, d, t + 2.3)
  })
  tl.to(dripper, { rate: 3, duration: 0.05 }, t + 2.4)
  tl.to(dripper, { rate: 0, duration: 0.05 }, t + 3.6)
  t += 3.4

  schedule.push({ t, text: iced ? 'Over ice, ready' : 'Ready' })
  if (!iced) tl.to(server, { steam: 1, duration: 1.6 }, t)
  tl.to({}, { duration: 0.4 }, t)
  return { tl, schedule }
}

// ═════════════════════════════════════════════════════════════
// French press
// ═════════════════════════════════════════════════════════════
const BEAKER = { yTop: 128, yBot: 240, halfTop: 34, halfBot: 34, r: 3, wall: 2.5, base: 4 }
const FP_MOUTH = { x: 124, y: 74 }
const MESH_TOP = 132 // mesh y when the plunger is resting under the lid
const MESH_BOTTOM = 230

function FrenchPressArt() {
  return (
    <g>
      <Shadow y={256} rx={62} />
      <GlassOutline v={BEAKER} />
      {/* Steel cage and feet */}
      <path d="M 82 136 L 82 246 M 158 136 L 158 246" stroke={INK.steel} strokeWidth="5" strokeLinecap="round" />
      <path d="M 82 136 L 82 246 M 158 136 L 158 246" stroke={INK.cream} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M 78 246 L 162 246" stroke={INK.steel} strokeWidth="6" strokeLinecap="round" />
      <path d="M 86 252 L 92 246 M 154 252 L 148 246" stroke={INK.cream} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 160 144 C 194 144 196 216 160 222" stroke={INK.darker} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M 160 144 C 194 144 196 216 160 222" {...stroke} strokeWidth="1.2" fill="none" />
      <text data-part="timer" x="200" y="124" textAnchor="middle" fill={INK.beige} fontSize="12" fontFamily="Work Sans, sans-serif" fontWeight="600" opacity="0">
        4:00
      </text>
      <g data-part="lidset" opacity="0">
        <g data-part="plunger">
          {/* Rod is as long as the plunge, so the knob ends up resting on the lid. */}
          <path d={`M 120 ${MESH_TOP - (MESH_BOTTOM - MESH_TOP) - 4} L 120 ${MESH_TOP}`} {...stroke} strokeWidth="2.6" />
          <circle cx="120" cy={MESH_TOP - (MESH_BOTTOM - MESH_TOP) - 10} r="7" fill={INK.darker} {...stroke} />
          <rect x="88" y={MESH_TOP - 2} width="64" height="5" rx="2" fill={INK.steel} {...stroke} strokeWidth="1.4" />
          <path d={`M 90 ${MESH_TOP + 5} L 150 ${MESH_TOP + 5}`} stroke={INK.cream} strokeWidth="1" strokeDasharray="2 2" />
        </g>
        <rect x="80" y="116" width="80" height="12" rx="3" fill={INK.steel} {...stroke} />
        <path d="M 86 120 L 112 120" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <KettleSource mouth={FP_MOUTH} />
    </g>
  )
}

function createFrenchPress({ color }) {
  const beaker = makeContainer('beaker', innerPoly(BEAKER), { steamWidth: 0.4 })
  const liquid = addLayer(beaker, { color: '#8A6A50', to: color, alpha: 0.55 })
  const r = (() => {
    let s = 99
    return () => ((s = (s * 16807) % 2147483647) / 2147483647)
  })()
  const grounds = Array.from({ length: 80 }, () => ({ u: r(), off: r(), d: r() * 0.55, s: 1 + r() * 1.4, k: r() }))
  const state = {
    containers: [beaker],
    streams: [stream(beaker, { x: FP_MOUTH.x })],
    particles: [],
    proxies: [],
    emitters: [],
    beaker,
    L: { liquid },
    grounds,
    groundsIn: 0,
    lift: 0,
    meshY: MESH_TOP,
    timer: 240,
  }
  let plungerEl = null
  let timerEl = null
  let shown = -1
  state.bind = (root) => {
    plungerEl = root.querySelector('[data-part="plunger"]')
    timerEl = root.querySelector('[data-part="timer"]')
  }
  // The plunger and the steep timer are driven from state every frame.
  state.drawBack = () => {
    if (plungerEl) plungerEl.setAttribute('transform', `translate(0 ${(state.meshY - MESH_TOP).toFixed(2)})`)
    const v = Math.ceil(state.timer)
    if (timerEl && v !== shown) {
      shown = v
      timerEl.textContent = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`
    }
  }
  state.drawFront = (ctx, t) => {
    const b = state.beaker
    const surface = b.bottom - liquid.h
    const wet = liquid.h > 4
    for (const g of grounds) {
      const local = clamp01((state.groundsIn * 1.6 - g.d) / 0.6)
      if (local <= 0) continue
      const x = 90 + g.u * 60
      const dryY = 238 - g.off * 13
      let y = 40 + (dryY - 40) * ease(local)
      if (state.lift > 0) {
        const crust = surface + 2 + g.off * 14 + Math.sin(t * 1.3 + g.u * 9) * 0.8
        y = y + (crust - y) * ease(state.lift)
      }
      y = Math.max(y, state.meshY + 4 + g.off * 8)
      y = Math.min(y, 239 - (1 - g.off) * 2)
      ctx.fillStyle = g.k > 0.5 ? (wet ? '#3A2416' : DRY_GROUNDS) : wet ? '#5A3A24' : '#8E6A4A'
      ctx.fillRect(x, y, g.s, g.s)
    }
  }
  return state
}

function frenchPressTimeline(state, root) {
  const tl = gsap.timeline({ paused: true })
  const schedule = []
  const m = FP_MOUTH
  const s = state.streams[0]
  const lid = makeProxy(root.querySelector('[data-part="lidset"]'), { opacity: 0 })
  state.proxies.push(lid)
  const timer = root.querySelector('[data-part="timer"]')
  let t = 0.3
  schedule.push({ t, text: 'Add grounds' })
  tl.to(state, { groundsIn: 1, duration: 1.2, ease: 'none' }, t)
  t += 1.1

  const k = kettleIn(tl, root, t, state)
  t += 0.6
  schedule.push({ t, text: 'Pour' })
  kettleTilt(tl, k, t)
  streamOn(tl, s, t + 0.28, { y: m.y, x: m.x, color: WATER, alpha: 0.65, w0: 3.4, w1: 2.6 })
  tl.to(state.L.liquid, { h: 98, duration: 2.2, ease: 'sine.inOut' }, t + 0.5)
  tl.to(state, { lift: 1, duration: 1.6, ease: 'sine.out' }, t + 0.9)
  tl.to(state.L.liquid, { mixT: 0.45, alpha: 0.8, duration: 2.2 }, t + 0.5)
  streamOff(tl, s, t + 2.6)
  kettleOut(tl, k, t + 2.7)
  t += 3

  schedule.push({ t, text: 'Steep 4:00' })
  tl.fromTo(lid, { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, t)
  tl.to(timer, { opacity: 1, duration: 0.3 }, t + 0.4)
  tl.to(state, { timer: 0, duration: 2.6, ease: 'none' }, t + 0.6)
  tl.to(state.L.liquid, { mixT: 1, alpha: 1, duration: 2.6 }, t + 0.6)
  tl.to(timer, { opacity: 0, duration: 0.3 }, t + 3.3)
  t += 3.4

  schedule.push({ t, text: 'Plunge' })
  tl.to(state, { meshY: MESH_BOTTOM, duration: 2.6, ease: 'power1.inOut' }, t)
  t += 2.8

  schedule.push({ t, text: 'Ready' })
  tl.to(state.beaker, { steam: 1, duration: 1.6 }, t)
  tl.to({}, { duration: 0.4 }, t)
  return { tl, schedule }
}

// ═════════════════════════════════════════════════════════════
// AeroPress
// ═════════════════════════════════════════════════════════════
const CHAMBER = { yTop: 98, yBot: 192, halfTop: 24, halfBot: 24, r: 2, wall: 3, base: 0 }
const AP_MUG = { yTop: 210, yBot: 256, halfTop: 40, halfBot: 35, r: 8, wall: 3, base: 6 }
const AP_MOUTH = { x: 124, y: 60 }

function AeroPressArt() {
  return (
    <g>
      <Shadow y={268} rx={56} />
      <GlassOutline v={AP_MUG} handle={<path d="M 162 218 C 186 218 186 246 158 248" {...stroke} fill="none" strokeWidth="2.4" />} />
      {/* Chamber */}
      <path d="M 93 98 L 93 194 L 147 194 L 147 98" stroke={INK.cream} strokeWidth="2" fill="rgba(240,226,204,0.05)" strokeLinejoin="round" />
      <rect x="84" y="94" width="72" height="6" rx="2" fill={INK.dark} {...stroke} strokeWidth="1.6" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M 140 ${182 - i * 20} L 146 ${182 - i * 20}`} stroke={INK.cream} strokeWidth="1.2" />
          <text x="153" y={185 - i * 20} fill={INK.beige} fontSize="8" fontFamily="Work Sans, sans-serif">
            {i + 1}
          </text>
        </g>
      ))}
      <path d="M 98 104 L 98 186" {...glint} />
      {/* Cap */}
      <rect x="88" y="194" width="64" height="9" rx="2" fill={INK.dark} {...stroke} />
      <path d="M 104 203 L 136 203" stroke={INK.cream} strokeWidth="1" strokeDasharray="1.5 2.5" />
      <g data-part="paddle" opacity="0">
        <rect x="114" y="40" width="12" height="104" rx="4" fill={INK.wood} {...stroke} strokeWidth="1.4" />
      </g>
      <g data-part="plunger" transform="translate(0 -80)">
        <rect x="100" y="-102" width="40" height="96" rx="2" fill="rgba(51,34,26,0.92)" {...stroke} strokeWidth="1.6" />
        <rect x="92" y="-108" width="56" height="8" rx="3" fill={INK.dark} {...stroke} strokeWidth="1.6" />
        <rect x="96" y="-8" width="48" height="8" rx="2" fill={INK.darker} {...stroke} strokeWidth="1.4" />
        <path d="M 106 -96 L 106 -14" stroke="rgba(255,240,220,0.25)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <KettleSource mouth={AP_MOUTH} />
    </g>
  )
}

function createAeroPress({ color, iced }) {
  const chamber = makeContainer('chamber', innerPoly(CHAMBER), { meniscus: 1.4, extendTop: 4 })
  const grounds = addLayer(chamber, { color: DRY_GROUNDS, to: WET_GROUNDS, h: 0, foam: true })
  const liquid = addLayer(chamber, { color: '#8A6A50', to: color, alpha: 0.6, blend: 6 })
  const mug = makeContainer('mug', innerPoly(AP_MUG), { steamWidth: 0.4 })
  const brewed = addLayer(mug, { color })
  if (iced) iceCubes(mug, [[104, 240, 0.2], [136, 238, -0.25], [120, 222, 0.3]])
  const state = {
    containers: [chamber, mug],
    streams: [stream(chamber, { x: AP_MOUTH.x }), stream(mug, { x: 120 })],
    particles: [],
    proxies: [],
    emitters: [
      { kind: 'ground', x: 120, y: 66, spread: 24, rate: 0, color: DRY_GROUNDS, floor: 190 },
      { kind: 'puff', x: 120, y: 206, spread: 30, rate: 0, vy: 0.2, vx: 1.2, r: 3, life: 0.8, alpha: 0.4 },
    ],
    chamber,
    mug,
    L: { grounds, liquid, brewed },
    waterH: 0,
    seal: -80,
    iced,
  }
  let plungerEl = null
  state.bind = (root) => {
    plungerEl = root.querySelector('[data-part="plunger"]')
  }
  state.drawBack = () => {
    const limit = Math.max(0, CHAMBER.yBot - grounds.h - state.seal)
    liquid.h = Math.min(state.waterH, limit)
    if (plungerEl) plungerEl.setAttribute('transform', `translate(0 ${state.seal.toFixed(2)})`)
  }
  return state
}

function aeroPressTimeline(state, root, { iced }) {
  const tl = gsap.timeline({ paused: true })
  const schedule = []
  const m = AP_MOUTH
  const [pour, press] = state.streams
  const [groundsEm, puff] = state.emitters
  const paddle = paddleProxy(root, state, 120, 40)
  const brew = state.L.brewed.color
  let t = 0.3

  schedule.push({ t, text: 'Add coffee' })
  tl.to(groundsEm, { rate: 70, duration: 0.05 }, t)
  tl.to(state.L.grounds, { h: 8, duration: 0.9, ease: 'sine.out' }, t + 0.25)
  tl.to(groundsEm, { rate: 0, duration: 0.05 }, t + 0.85)
  t += 1.2

  const k = kettleIn(tl, root, t, state)
  t += 0.6
  schedule.push({ t, text: 'Add water' })
  kettleTilt(tl, k, t)
  streamOn(tl, pour, t + 0.28, { y: m.y, x: m.x, color: WATER, alpha: 0.65, w0: 3.2, w1: 2.4 })
  tl.to(state, { waterH: 70, duration: 2, ease: 'sine.inOut' }, t + 0.5)
  tl.to(state.L.liquid, { mixT: 0.5, alpha: 0.85, duration: 2 }, t + 0.5)
  tl.to(state.L.grounds, { mixT: 1, duration: 0.8 }, t + 0.5)
  streamOff(tl, pour, t + 2.4)
  kettleOut(tl, k, t + 2.5)
  t += 2.8

  schedule.push({ t, text: 'Stir' })
  tl.to(paddle, { opacity: 1, duration: 0.3 }, t)
  tl.to(paddle, { keyframes: { rotation: [0, 14, -14, 12, -12, 0], easeEach: 'sine.inOut' }, duration: 1.4 }, t)
  tl.to(state.L.liquid, { mixT: 1, alpha: 1, duration: 1.4 }, t)
  tl.to(paddle, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in' }, t + 1.4)
  t += 1.9

  schedule.push({ t, text: 'Press' })
  tl.to(state, { seal: 96, duration: 0.7, ease: 'power3.out' }, t)
  t += 0.8
  tl.to(state, { seal: 184, duration: 3, ease: 'power1.inOut' }, t)
  tl.to(state.L.grounds, { h: 5, duration: 1.2, ease: 'sine.in' }, t + 1.8)
  streamOn(tl, press, t + 0.6, { y: 203, x: 120, color: brew, w0: 2.6, w1: 2.1 })
  tl.to(state.L.brewed, { h: 28, duration: 2.6, ease: 'sine.inOut' }, t + 0.8)
  streamOff(tl, press, t + 3)
  tl.to(puff, { rate: 24, duration: 0.05 }, t + 3)
  tl.to(puff, { rate: 0, duration: 0.05 }, t + 3.5)
  t += 3.6

  schedule.push({ t, text: iced ? 'Over ice, ready' : 'Ready' })
  if (!iced) tl.to(state.mug, { steam: 1, duration: 1.6 }, t)
  tl.to({}, { duration: 0.4 }, t)
  return { tl, schedule }
}

// ═════════════════════════════════════════════════════════════
// Moka pot (cutaway)
// ═════════════════════════════════════════════════════════════
const MOKA_TOP = { yTop: 120, yBot: 182, halfTop: 40, halfBot: 30, r: 4 }
const MOKA_BASE = { yTop: 198, yBot: 248, halfTop: 33, halfBot: 42, r: 4 }

function MokaArt() {
  const top = cupPoly(MOKA_TOP)
  const base = cupPoly(MOKA_BASE)
  const topOuter = cupPoly({ ...MOKA_TOP, halfTop: 44, halfBot: 33, yBot: 186 })
  const baseOuter = cupPoly({ ...MOKA_BASE, yTop: 194, halfTop: 36, halfBot: 46, yBot: 252 })
  return (
    <g>
      {/* Stove */}
      <path d="M 66 262 L 174 262" stroke={INK.steelDark} strokeWidth="4" strokeLinecap="round" />
      <path d="M 82 266 L 82 274 M 158 266 L 158 274" stroke={INK.steelDark} strokeWidth="3" strokeLinecap="round" />
      <Flame cx={120} y={260} width={56} />
      {/* Boiler (cutaway) */}
      <path d={toPath(baseOuter, true)} fill="rgba(140,131,120,0.16)" {...stroke} />
      <path d={toPath(base)} {...thin} />
      {[-30, -10, 10, 30].map((dx) => (
        <path key={dx} d={`M ${120 + dx} 196 L ${120 + dx * 1.24} 250`} stroke="rgba(240,226,204,0.16)" strokeWidth="1" />
      ))}
      <circle cx="150" cy="212" r="3" fill={INK.steel} {...stroke} strokeWidth="1.2" />
      {/* Waist / filter basket */}
      <path d="M 86 184 L 154 184 L 158 196 L 82 196 Z" fill={INK.steel} {...stroke} />
      <path d="M 90 190 L 150 190" stroke="rgba(30,20,16,0.4)" strokeWidth="1.2" />
      {/* Collector (cutaway) */}
      <path d={toPath(topOuter, true)} fill="rgba(140,131,120,0.12)" {...stroke} />
      <path d={toPath(top)} {...thin} />
      {[-28, -9, 9, 28].map((dx) => (
        <path key={dx} d={`M ${120 + dx * 1.24} 120 L ${120 + dx} 184`} stroke="rgba(240,226,204,0.14)" strokeWidth="1" />
      ))}
      {/* Central column */}
      <path d="M 116 184 L 116 138 M 124 184 L 124 138" stroke={INK.cream} strokeWidth="1.6" />
      <path d="M 113 138 L 127 138" {...stroke} strokeWidth="2.4" />
      {/* Spout, lid, knob, handle */}
      <path d="M 76 120 L 64 112 L 80 114" {...stroke} fill="none" />
      <path d="M 74 120 Q 120 104 166 120" fill={INK.steel} {...stroke} />
      <circle cx="120" cy="106" r="4.5" fill={INK.darker} {...stroke} strokeWidth="1.4" />
      <path d="M 162 126 L 190 132 Q 194 134 192 140 L 180 176 Q 178 180 174 178 L 158 166" fill={INK.darker} {...stroke} />
      <path d="M 82 126 L 88 178" {...glint} />
    </g>
  )
}

function createMoka({ color }) {
  const upper = makeContainer('upper', cupPoly(MOKA_TOP), { steamWidth: 0.3, extendTop: 4 })
  const boiler = makeContainer('boiler', cupPoly(MOKA_BASE), { glass: 'rgba(240,226,204,0.03)', idleWave: 0.2 })
  const water = addLayer(boiler, { color: WATER, alpha: 0.42, h: 40 })
  const coffee = addLayer(upper, { color, to: '#8A5A34' })
  const state = {
    containers: [boiler, upper],
    streams: [],
    particles: [],
    proxies: [],
    emitters: [{ kind: 'puff', x: 120, y: 134, spread: 6, rate: 0, vy: -0.9, r: 4, life: 1.3, alpha: 0.4 }],
    upper,
    boiler,
    L: { water, coffee },
    flow: 0,
    blond: 0,
  }
  const brew = hexToRgb(color)
  const blond = hexToRgb('#A0683A')
  state.drawFront = (ctx, t) => {
    if (state.flow < 0.02) return
    const rgb = brew.map((v, i) => v + (blond[i] - v) * state.blond * 0.7)
    const surface = upper.bottom - coffee.h
    const w = 0.8 + state.flow * 3.2
    for (const side of [-1, 1]) {
      const wob = Math.sin(t * 9 + side) * 0.6 * state.flow
      const x0 = 120 + side * 3
      const xEnd = 120 + side * (12 + state.flow * 10)
      ctx.beginPath()
      ctx.moveTo(x0, 136)
      ctx.quadraticCurveTo(120 + side * (8 + state.flow * 8) + wob, 126 - state.flow * 6, xEnd, Math.max(surface, 140))
      ctx.strokeStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},0.95)`
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    // A glossy bead sitting on the column top.
    ctx.fillStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},1)`
    ctx.beginPath()
    ctx.ellipse(120, 136, 4 + state.flow * 1.5, 2 + state.flow * 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  return state
}

function mokaTimeline(state, root) {
  const tl = gsap.timeline({ paused: true })
  const schedule = []
  const flame = root.querySelector('[data-part="flame"]')
  const puff = state.emitters[0]
  let t = 0.3
  schedule.push({ t, text: 'Heat' })
  tl.to(flame, { opacity: 1, duration: 0.6 }, t)
  tl.to(state.boiler, { bubbleRate: 1, duration: 1.2 }, t + 0.5)
  t += 2

  schedule.push({ t, text: 'Coffee rises' })
  tl.to(state, { flow: 0.3, duration: 1.4, ease: 'sine.in' }, t)
  tl.to(state.L.coffee, { h: 8, duration: 1.6, ease: 'sine.in' }, t + 0.3)
  tl.to(state.L.water, { h: 34, duration: 1.6 }, t)
  t += 1.7

  schedule.push({ t, text: 'Full flow' })
  tl.to(state, { flow: 1, duration: 0.7, ease: 'sine.out' }, t)
  tl.to(state.L.coffee, { h: 36, duration: 2.6, ease: 'sine.inOut' }, t)
  tl.to(state.L.water, { h: 12, duration: 2.6 }, t)
  t += 2.6

  schedule.push({ t, text: 'Sputter' })
  tl.to(state, { keyframes: { flow: [1, 0.35, 0.95, 0.25, 0.8, 0.1, 0], easeEach: 'sine.inOut' }, duration: 1.8 }, t)
  tl.to(state, { blond: 1, duration: 1.4 }, t)
  tl.to(state.L.coffee, { h: 44, mixT: 0.3, duration: 1.8 }, t)
  tl.to(state.L.water, { h: 5, duration: 1.8 }, t)
  tl.to(puff, { rate: 7, duration: 0.05 }, t + 0.2)
  tl.to(puff, { rate: 0, duration: 0.05 }, t + 1.9)
  t += 2

  schedule.push({ t, text: 'Ready' })
  tl.to(flame, { opacity: 0, duration: 0.6 }, t)
  tl.to(state.boiler, { bubbleRate: 0, duration: 0.4 }, t)
  tl.to(state.upper, { steam: 1, duration: 1.6 }, t + 0.3)
  tl.to({}, { duration: 0.4 }, t)
  return { tl, schedule }
}

// ═════════════════════════════════════════════════════════════
// Siphon
// ═════════════════════════════════════════════════════════════
const HOPPER = { yTop: 66, yBot: 148, halfTop: 25, halfBot: 23, r: 10, wall: 2.5, base: 0 }
const GLOBE = { cx: 120, cy: 214, r: 36 }

function globePoly() {
  const { cx, cy, r } = GLOBE
  const a0 = -Math.PI + Math.acos(10 / r) // left neck edge (x = cx - 10)
  const a1 = -Math.acos(10 / r) // right neck edge (x = cx + 10)
  return [[cx - 10, 174], ...circlePoly(cx, cy, r, 40, a0, a1 - Math.PI * 2), [cx + 10, 174]]
}

function SiphonArt() {
  const globe = globePoly()
  const globeOuter = [[107, 172], ...circlePoly(GLOBE.cx, GLOBE.cy, GLOBE.r + 3, 40, -Math.PI + Math.acos(13 / 39), -Math.acos(13 / 39) - Math.PI * 2), [133, 172]]
  return (
    <g>
      {/* Stand */}
      <path d="M 58 266 L 196 266" stroke={INK.steelDark} strokeWidth="5" strokeLinecap="round" />
      <path d="M 192 266 L 192 62" stroke={INK.steel} strokeWidth="5" strokeLinecap="round" />
      <path d="M 192 92 L 150 92" stroke={INK.steel} strokeWidth="4" strokeLinecap="round" />
      <path d="M 150 86 L 150 98" {...stroke} />
      <path d="M 192 196 L 160 196" stroke={INK.steel} strokeWidth="4" strokeLinecap="round" />
      {/* Burner */}
      <rect x="104" y="252" width="32" height="12" rx="3" fill={INK.dark} {...stroke} />
      <Flame cx={120} y={252} width={24} />
      {/* Lower globe */}
      <path d={toPath(globe)} {...thin} />
      <path d={toPath(globeOuter)} {...stroke} fill="none" />
      <path d="M 96 196 Q 90 214 98 232" {...glint} />
      {/* Upper chamber + tube */}
      <path d="M 117 148 L 117 246 M 123 148 L 123 246" stroke="rgba(240,226,204,0.75)" strokeWidth="1.2" />
      <GlassOutline v={HOPPER} />
      <path d="M 101 146 L 139 146" stroke={INK.cream} strokeWidth="2" />
      <path d="M 120 146 L 120 240" stroke="rgba(240,226,204,0.3)" strokeWidth="1" strokeDasharray="1.5 2.5" />
      <path d="M 98 168 L 142 168" {...stroke} strokeWidth="3" />
      <g data-part="paddle" opacity="0">
        <path d="M 116 20 L 124 20 L 125 104 Q 120 112 115 104 Z" fill={INK.wood} {...stroke} strokeWidth="1.4" />
      </g>
    </g>
  )
}

function createSiphon({ color }) {
  const globe = makeContainer('globe', globePoly(), { meniscus: 1.6, extendTop: 0 })
  const hopper = makeContainer('hopper', innerPoly(HOPPER), { steamWidth: 0.3 })
  const water = addLayer(globe, { color: WATER, alpha: 0.48, h: 44 })
  const back = addLayer(globe, { color })
  const brewing = addLayer(hopper, { color: WATER, to: color, alpha: 0.6, blend: 6 })
  const r = (() => {
    let s = 7
    return () => ((s = (s * 16807) % 2147483647) / 2147483647)
  })()
  const crustBits = Array.from({ length: 50 }, () => ({ u: r(), off: r(), s: 1 + r() * 1.3 }))
  const state = {
    containers: [globe, hopper],
    streams: [],
    particles: [],
    proxies: [],
    emitters: [{ kind: 'ground', x: 120, y: 36, spread: 26, rate: 0, color: DRY_GROUNDS, floor: 100 }],
    globe,
    hopper,
    L: { water, back, brewing },
    tube: 0,
    tubeColor: 0,
    crust: 0,
    dome: 0,
  }
  const wRgb = hexToRgb(WATER)
  const cRgb = hexToRgb(color)
  state.drawFront = (ctx, t) => {
    // Liquid travelling through the tube.
    if (state.tube > 0.01) {
      const rgb = wRgb.map((v, i) => v + (cRgb[i] - v) * state.tubeColor)
      const a = 0.55 + 0.45 * state.tubeColor
      const top = 246 - state.tube * 98
      ctx.fillStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`
      ctx.fillRect(117.6, top, 4.8, 246 - top)
    }
    // Floating crust of grounds while brewing.
    if (state.crust > 0.01) {
      const surface = hopper.bottom - brewing.h
      ctx.fillStyle = WET_GROUNDS
      for (const b of crustBits) {
        const x = 98 + b.u * 44
        const y = surface + 1 + b.off * 7 + Math.sin(t * 1.6 + b.u * 8) * 0.7
        ctx.globalAlpha = state.crust
        ctx.fillRect(x, y, b.s, b.s)
      }
      ctx.globalAlpha = 1
    }
    // Dome of spent grounds left on the filter.
    if (state.dome > 0.01) {
      ctx.fillStyle = WET_GROUNDS
      ctx.beginPath()
      ctx.moveTo(98, 146)
      ctx.quadraticCurveTo(120, 146 - state.dome * 18, 142, 146)
      ctx.closePath()
      ctx.fill()
    }
  }
  return state
}

function siphonTimeline(state, root) {
  const tl = gsap.timeline({ paused: true })
  const schedule = []
  const flame = root.querySelector('[data-part="flame"]')
  const paddle = paddleProxy(root, state, 120, 20)
  const grounds = state.emitters[0]
  let t = 0.3

  schedule.push({ t, text: 'Heat' })
  tl.to(flame, { opacity: 1, duration: 0.6 }, t)
  tl.to(state.globe, { bubbleRate: 1.2, duration: 1 }, t + 0.4)
  t += 1.8

  schedule.push({ t, text: 'Water rises' })
  tl.to(state, { tube: 1, duration: 0.5, ease: 'sine.in' }, t)
  tl.to(state.L.water, { h: 4, duration: 2.6, ease: 'sine.inOut' }, t + 0.2)
  tl.to(state.L.brewing, { h: 50, duration: 2.6, ease: 'sine.inOut' }, t + 0.4)
  tl.to(state.hopper, { bubbleRate: 0.8, duration: 0.6 }, t + 0.6)
  t += 3

  schedule.push({ t, text: 'Add coffee' })
  tl.to(grounds, { rate: 60, duration: 0.05 }, t)
  tl.to(grounds, { rate: 0, duration: 0.05 }, t + 0.8)
  tl.to(state, { crust: 1, duration: 0.8 }, t + 0.3)
  t += 1.1

  schedule.push({ t, text: 'Stir' })
  tl.to(paddle, { opacity: 1, duration: 0.3 }, t)
  tl.to(paddle, { keyframes: { rotation: [0, 12, -12, 10, -10, 0], easeEach: 'sine.inOut' }, duration: 1.3 }, t)
  tl.to(state.L.brewing, { mixT: 0.7, alpha: 0.95, duration: 1.3 }, t)
  tl.to(paddle, { opacity: 0, y: -30, duration: 0.35, ease: 'power2.in' }, t + 1.35)
  t += 1.8

  schedule.push({ t, text: 'Brew' })
  tl.to(state.L.brewing, { mixT: 1, alpha: 1, duration: 1.2 }, t)
  tl.to(state.hopper, { bloom: 1, duration: 0.3 }, t)
  tl.to(state.hopper, { bloom: 0, bubbleRate: 0, duration: 0.4 }, t + 1.2)
  tl.to(state, { tubeColor: 1, duration: 1 }, t)
  t += 1.5

  schedule.push({ t, text: 'Drawdown' })
  tl.to(flame, { opacity: 0, duration: 0.5 }, t)
  tl.to(state.globe, { bubbleRate: 0, duration: 0.3 }, t)
  tl.to(state.L.water, { h: 0, duration: 0.6 }, t)
  tl.to(state.L.brewing, { h: 0, duration: 2.6, ease: 'sine.inOut' }, t + 0.3)
  tl.to(state.L.back, { h: 42, duration: 2.6, ease: 'sine.inOut' }, t + 0.4)
  tl.to(state, { crust: 0, duration: 1.6 }, t + 0.8)
  tl.to(state, { dome: 1, duration: 2, ease: 'sine.out' }, t + 0.9)
  tl.to(state, { tube: 0, duration: 0.5, ease: 'sine.in' }, t + 2.7)
  t += 3.3

  schedule.push({ t, text: 'Ready' })
  tl.to({}, { duration: 0.6 }, t)
  return { tl, schedule }
}

// ═════════════════════════════════════════════════════════════
export const BREWS = {
  pourover: { Art: PourOverArt, create: createPourOver, timeline: pourOverTimeline },
  frenchpress: { Art: FrenchPressArt, create: createFrenchPress, timeline: frenchPressTimeline },
  aeropress: { Art: AeroPressArt, create: createAeroPress, timeline: aeroPressTimeline },
  moka: { Art: MokaArt, create: createMoka, timeline: mokaTimeline },
  siphon: { Art: SiphonArt, create: createSiphon, timeline: siphonTimeline },
}
