// Line-art illustrations in the Roastery style: vessels and the things that pour into them.
// Every source is drawn with its pouring point (the "mouth") at local (0, 0).
import { innerPoly, outerPoly, toPath, cupPoly } from './geometry.js'

export const INK = {
  cream: '#F0E2CC',
  beige: '#C4AD93',
  line: '#765A4A',
  dark: '#33221A',
  darker: '#1E1410',
  terra: '#B5562F',
  steel: '#8C8378',
  steelDark: '#6E665D',
  wood: '#9A6A44',
  brass: '#C9A04A',
}

const stroke = { stroke: INK.cream, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }
const thin = { stroke: INK.cream, strokeWidth: 1.2, strokeLinejoin: 'round', strokeLinecap: 'round', fill: 'none' }
const glint = { stroke: 'rgba(255,248,235,0.32)', strokeWidth: 2.4, strokeLinecap: 'round', fill: 'none' }

// ── Vessels ─────────────────────────────────────────────────
export function Vessel({ v }) {
  const cx = v.cx ?? 120
  const inner = innerPoly(v)
  const outer = outerPoly(v)
  const bottom = v.yBot + v.base
  const iL = inner[0]
  const iR = inner[inner.length - 1]
  const oL = outer[0]
  const oR = outer[outer.length - 1]
  const halfMid = (v.halfTop + v.halfBot) / 2 + v.wall

  return (
    <g>
      <ellipse cx={cx} cy={(v.saucer ? bottom + 9 : bottom) + 3} rx={(v.saucer ? 74 : halfMid + 14)} ry="5" fill="rgba(10,5,2,0.28)" />
      {v.saucer && <Saucer cx={cx} y={bottom + 1} />}
      {v.handle && <Handle kind={v.handle} v={v} />}
      {v.opaque ? (
        <OpaqueBody v={v} outer={outer} />
      ) : (
        <>
          {/* Thick glass base */}
          <path d={`${toPath(inner.slice(Math.floor(inner.length / 2) - 8, Math.floor(inner.length / 2) + 8))} L ${cx + v.halfBot + v.wall} ${bottom - 2} L ${cx - v.halfBot - v.wall} ${bottom - 2} Z`} fill="rgba(240,226,204,0.06)" />
          <path d={toPath(inner)} {...thin} stroke="rgba(240,226,204,0.38)" />
          <path d={toPath(outer)} {...stroke} fill="none" />
          <line x1={iL[0]} y1={iL[1]} x2={oL[0]} y2={oL[1]} {...stroke} strokeWidth="2.6" />
          <line x1={iR[0]} y1={iR[1]} x2={oR[0]} y2={oR[1]} {...stroke} strokeWidth="2.6" />
          {/* Glass glints */}
          <path d={`M ${iL[0] + 6} ${v.yTop + 10} L ${cx - v.halfBot + 5} ${v.yBot - v.r - 6}`} {...glint} />
          <path d={`M ${iR[0] - 7} ${v.yTop + 14} L ${iR[0] - 7 - (v.halfTop - v.halfBot) * 0.3} ${v.yTop + 14 + (v.yBot - v.yTop) * 0.28}`} {...glint} stroke="rgba(255,248,235,0.16)" />
        </>
      )}
      {v.dabara && <Dabara cx={cx} />}
    </g>
  )
}

function Saucer({ cx, y }) {
  return (
    <g>
      <path d={`M ${cx - 70} ${y} Q ${cx} ${y + 14} ${cx + 70} ${y} Z`} fill="rgba(240,226,204,0.08)" />
      <path d={`M ${cx - 70} ${y} Q ${cx} ${y + 14} ${cx + 70} ${y}`} {...stroke} fill="none" />
      <path d={`M ${cx - 72} ${y - 1} L ${cx + 72} ${y - 1}`} {...stroke} />
    </g>
  )
}

function Handle({ kind, v }) {
  const cx = v.cx ?? 120
  const xr = cx + v.halfTop + v.wall
  if (kind === 'small') {
    const y0 = v.yTop + 8
    return (
      <g fill="none">
        <path d={`M ${xr - 1} ${y0} C ${xr + 22} ${y0 - 2}, ${xr + 22} ${y0 + 28}, ${xr - 3} ${y0 + 30}`} {...stroke} strokeWidth="2.2" />
        <path d={`M ${xr - 1} ${y0 + 6} C ${xr + 13} ${y0 + 5}, ${xr + 13} ${y0 + 22}, ${xr - 2} ${y0 + 24}`} {...thin} stroke="rgba(240,226,204,0.5)" />
      </g>
    )
  }
  if (kind === 'cup') {
    const y0 = v.yTop + 8
    return (
      <g fill="none">
        <path d={`M ${xr - 4} ${y0} C ${xr + 26} ${y0 - 6}, ${xr + 26} ${y0 + 36}, ${xr - 14} ${y0 + 40}`} {...stroke} strokeWidth="2.2" />
        <path d={`M ${xr - 6} ${y0 + 7} C ${xr + 15} ${y0 + 4}, ${xr + 15} ${y0 + 30}, ${xr - 14} ${y0 + 32}`} {...thin} stroke="rgba(240,226,204,0.5)" />
      </g>
    )
  }
  // mug
  const y0 = v.yTop + 14
  const y1 = v.yBot - 14
  return (
    <g fill="none">
      <path d={`M ${xr} ${y0} C ${xr + 34} ${y0 - 2}, ${xr + 34} ${y1 + 2}, ${xr} ${y1}`} {...stroke} strokeWidth="2.2" />
      <path d={`M ${xr} ${y0 + 9} C ${xr + 22} ${y0 + 8}, ${xr + 22} ${y1 - 7}, ${xr} ${y1 - 8}`} {...thin} stroke="rgba(240,226,204,0.5)" />
    </g>
  )
}

function OpaqueBody({ v, outer }) {
  const cx = v.cx ?? 120
  const d = toPath(outer, true)
  if (v.opaque === 'steel') {
    return (
      <g>
        <path d={d} fill={INK.steel} {...stroke} />
        <path d={`M ${cx - v.halfTop + 6} ${v.yTop + 8} L ${cx - v.halfBot + 6} ${v.yBot - 8}`} stroke="rgba(255,255,255,0.45)" strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${cx + v.halfTop - 8} ${v.yTop + 8} L ${cx + v.halfBot - 6} ${v.yBot - 8}`} stroke="rgba(0,0,0,0.22)" strokeWidth="7" strokeLinecap="round" />
        <path d={`M ${cx - v.halfTop - v.wall} ${v.yTop + 7} L ${cx + v.halfTop + v.wall} ${v.yTop + 7}`} stroke="rgba(30,20,16,0.35)" strokeWidth="1.2" />
        <ellipse cx={cx} cy={v.yTop} rx={v.halfTop + v.wall} ry="2.4" fill="none" {...stroke} />
      </g>
    )
  }
  // glazed ceramic (Turkish cup)
  const mid = (v.yTop + v.yBot) / 2
  const halfMid = (v.halfTop + v.halfBot) / 2
  const zig = []
  for (let i = 0; i <= 10; i++) zig.push(`${i ? 'L' : 'M'} ${cx - halfMid + (i * 2 * halfMid) / 10} ${mid + (i % 2 ? -4 : 4)}`)
  return (
    <g>
      <path d={d} fill={INK.terra} {...stroke} />
      <path d={zig.join(' ')} fill="none" stroke={INK.cream} strokeWidth="1.4" strokeLinejoin="round" />
      <path d={`M ${cx - halfMid - 1} ${mid - 9} L ${cx + halfMid + 1} ${mid - 9} M ${cx - halfMid} ${mid + 9} L ${cx + halfMid} ${mid + 9}`} stroke="rgba(240,226,204,0.6)" strokeWidth="1" />
      <path d={`M ${cx - v.halfTop + 6} ${v.yTop + 8} L ${cx - v.halfBot + 4} ${v.yBot - 10}`} stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx={cx} cy={v.yTop} rx={v.halfTop + v.wall} ry="2.2" fill="none" {...stroke} />
    </g>
  )
}

/** The wide steel bowl a filter-kaapi tumbler sits in. */
function Dabara({ cx }) {
  const body = cupPoly({ cx, yTop: 214, yBot: 254, halfTop: 60, halfBot: 40, r: 10, bulge: 5 })
  return (
    <g>
      <path d={toPath(body, true)} fill={INK.steel} {...stroke} />
      <path d={`M ${cx - 50} 222 Q ${cx - 46} 240 ${cx - 34} 248`} stroke="rgba(255,255,255,0.45)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d={`M ${cx + 54} 222 Q ${cx + 50} 240 ${cx + 38} 248`} stroke="rgba(0,0,0,0.2)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx={cx} cy={214} rx={61} ry={3} fill="none" {...stroke} />
    </g>
  )
}

// ── Sources (mouth at 0,0) ──────────────────────────────────
export function Pitcher() {
  return (
    <g>
      <path d="M44 6 C62 6 62 34 44 36" fill="none" {...stroke} strokeWidth="3" />
      <path d="M0 0 Q8 -5 16 -5 L44 -7 L44 44 Q44 50 38 50 L14 50 Q8 50 8 44 L9 9 Q6 3 0 0 Z" fill={INK.steel} {...stroke} />
      <path d="M16 4 L15 42" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M38 0 L38 44" stroke="rgba(0,0,0,0.18)" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

export function Kettle() {
  return (
    <g>
      <path d="M0 0 C2 -10 8 -18 18 -20 C30 -22 34 -8 40 0 C44 6 50 8 56 8" fill="none" {...stroke} strokeWidth="3.4" />
      <path d="M0 0 C2 -10 8 -18 18 -20 C30 -22 34 -8 40 0 C44 6 50 8 56 8" fill="none" stroke={INK.dark} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M52 44 L55 6 Q76 -6 97 6 L100 44 Q100 48 96 48 L56 48 Q52 48 52 44 Z" fill={INK.dark} {...stroke} />
      <path d="M62 0 Q76 -10 90 0" fill="none" {...stroke} />
      <circle cx="76" cy="-8" r="3" fill={INK.wood} {...stroke} strokeWidth="1.4" />
      <path d="M97 10 C116 10 116 38 100 40" fill="none" stroke={INK.wood} strokeWidth="5" strokeLinecap="round" />
      <path d="M60 10 L59 40" stroke="rgba(240,226,204,0.3)" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

export function Carafe() {
  return (
    <g>
      <path d="M0 0 Q6 -1 9 -6 L34 -6 L34 12 Q50 24 50 44 Q50 64 30 66 L14 66 Q-4 64 -4 44 Q-4 24 9 12 L9 6 Q6 2 0 0 Z" fill="rgba(28,16,9,0.92)" {...stroke} />
      <path d="M7 -9 L36 -9" {...stroke} strokeWidth="3" />
      <path d="M4 28 Q2 44 8 56" stroke="rgba(255,248,235,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="6" y="34" width="32" height="14" rx="2" fill={INK.beige} />
      <path d="M12 41 L32 41" stroke={INK.dark} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}

export function Bottle() {
  return (
    <g>
      <path d="M-5 0 L-5 14 Q-14 22 -14 34 L-14 84 Q-14 90 -8 90 L8 90 Q14 90 14 84 L14 34 Q14 22 5 14 L5 0 Z" fill="rgba(170,205,185,0.3)" {...stroke} />
      <rect x="-6.5" y="-3" width="13" height="5" rx="1.5" fill={INK.beige} {...stroke} strokeWidth="1.2" />
      <rect x="-14" y="46" width="28" height="22" fill={INK.terra} stroke={INK.cream} strokeWidth="1.2" />
      <path d="M-8 56 L8 56" stroke={INK.cream} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M-9 30 L-9 80" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

export function Cezve() {
  return (
    <g>
      <path d="M34 6 L86 -10" stroke={INK.brass} strokeWidth="5" strokeLinecap="round" />
      <path d="M0 0 Q4 -2 8 -2 L32 -2 L32 2 Q30 10 34 24 Q35 30 28 30 L8 30 Q1 30 2 24 Q6 10 4 4 Q2 2 0 0 Z" fill="#9A5A32" {...stroke} />
      <path d="M10 6 Q8 16 10 24" stroke="rgba(255,230,200,0.45)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function PullTumbler() {
  return (
    <g>
      <path d="M0 0 L32 0 L29 44 Q29 46 27 46 L5 46 Q3 46 3 44 Z" fill={INK.steel} {...stroke} />
      <path d="M7 4 L8 40" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="16" cy="0" rx="16" ry="2" fill="none" {...stroke} />
    </g>
  )
}

export function Portafilter() {
  return (
    <g>
      <rect x="-30" y="-150" width="60" height="104" fill={INK.dark} {...stroke} />
      <path d="M-30 -60 L30 -60" stroke="rgba(240,226,204,0.25)" strokeWidth="1.2" />
      <rect x="-26" y="-46" width="52" height="10" rx="2" fill={INK.steelDark} {...stroke} />
      <path d="M22 -30 L86 -38 Q90 -38 90 -34 L90 -30 Q90 -27 86 -27 L24 -20 Z" fill={INK.darker} {...stroke} />
      <path d="M-22 -36 L22 -36 L18 -16 Q0 -10 -18 -16 Z" fill={INK.steel} {...stroke} />
      <path d="M-9 -14 L9 -14 L7 -5 L-7 -5 Z" fill={INK.steel} {...stroke} strokeWidth="1.6" />
      <path d="M-6 -5 L-4 0 M6 -5 L4 0" {...stroke} strokeWidth="2.4" />
      <path d="M-14 -32 L-12 -20" stroke="rgba(255,255,255,0.45)" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

export function Pump() {
  return (
    <g>
      <rect x="22" y="8" width="34" height="64" rx="6" fill="#5A3A20" {...stroke} />
      <rect x="22" y="30" width="34" height="20" fill={INK.beige} />
      <path d="M30 40 L48 40" stroke={INK.dark} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="32" y="2" width="14" height="8" rx="2" fill={INK.darker} {...stroke} strokeWidth="1.4" />
      <path d="M28 14 L28 64" stroke="rgba(255,255,255,0.3)" strokeWidth="2.4" strokeLinecap="round" />
      <g data-pump-head="">
        <path d="M39 2 L39 -12" {...stroke} strokeWidth="3" />
        <path d="M0 0 L0 -6 Q0 -12 6 -12 L44 -12" fill="none" {...stroke} strokeWidth="3.2" />
        <rect x="30" y="-20" width="20" height="9" rx="3" fill={INK.darker} {...stroke} strokeWidth="1.6" />
      </g>
    </g>
  )
}

export function Tap() {
  return (
    <g>
      <rect x="26" y="-160" width="24" height="142" rx="4" fill={INK.dark} {...stroke} />
      <path d="M-4 0 L-4 -14 Q-4 -24 6 -24 L28 -24 L28 -16 L8 -16 Q4 -16 4 -10 L4 0 Z" fill={INK.steel} {...stroke} />
      <g data-lever="">
        <rect x="18" y="-68" width="8" height="44" rx="4" fill={INK.darker} {...stroke} strokeWidth="1.6" />
      </g>
    </g>
  )
}

export function Shaker() {
  return (
    <g>
      <rect x="-11" y="-54" width="22" height="44" rx="4" fill={INK.steel} {...stroke} />
      <path d="M-12 -10 Q0 4 12 -10 Z" fill={INK.steelDark} {...stroke} strokeWidth="1.6" />
      <circle cx="-4" cy="-6" r="1" fill={INK.cream} />
      <circle cx="0" cy="-4" r="1" fill={INK.cream} />
      <circle cx="4" cy="-6" r="1" fill={INK.cream} />
      <path d="M-6 -48 L-6 -16" stroke="rgba(255,255,255,0.45)" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
}

export const SOURCE_ART = {
  pitcher: Pitcher,
  kettle: Kettle,
  carafe: Carafe,
  bottle: Bottle,
  cezve: Cezve,
  pull: PullTumbler,
  shot: Portafilter,
  pump: Pump,
  tap: Tap,
  shaker: Shaker,
}
