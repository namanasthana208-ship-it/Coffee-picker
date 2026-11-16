// Vessel geometry: cavity polygons shared by the canvas (liquid clip) and SVG (outlines).

const lerp = (a, b, t) => a + (b - a) * t

/**
 * A cup/glass profile: straight or bulging walls with rounded bottom corners.
 * Returns points from the top-left rim, down the left wall, across the bottom,
 * and up to the top-right rim.
 */
export function cupPoly({ cx = 120, yTop, yBot, halfTop, halfBot, r = 8, bulge = 0, steps = 14 }) {
  const left = []
  const right = []
  const wallBottom = yBot - r
  for (let i = 0; i <= steps; i++) {
    const s = i / steps
    const y = lerp(yTop, wallBottom, s)
    const half = lerp(halfTop, halfBot, s) + bulge * Math.sin(Math.PI * s)
    left.push([cx - half, y])
    right.push([cx + half, y])
  }
  const corner = (ccx, ccy, a0, a1) => {
    const pts = []
    for (let i = 1; i <= 6; i++) {
      const a = lerp(a0, a1, i / 6)
      pts.push([ccx + r * Math.cos(a), ccy + r * Math.sin(a)])
    }
    return pts
  }
  const bl = corner(cx - halfBot + r, wallBottom, Math.PI, Math.PI / 2)
  const br = corner(cx + halfBot - r, wallBottom, Math.PI / 2, 0)
  return [...left, ...bl, ...br, ...right.reverse()]
}

/** Outer (glass) outline for a vessel spec: same shape, thicker walls and base. */
export function outerPoly(v) {
  return cupPoly({
    cx: v.cx ?? 120,
    yTop: v.yTop,
    yBot: v.yBot + v.base,
    halfTop: v.halfTop + v.wall,
    halfBot: v.halfBot + v.wall,
    r: v.r + v.wall * 0.8,
    bulge: v.bulge || 0,
  })
}

export function innerPoly(v) {
  return cupPoly({ cx: v.cx ?? 120, yTop: v.yTop, yBot: v.yBot, halfTop: v.halfTop, halfBot: v.halfBot, r: v.r, bulge: v.bulge || 0 })
}

export function toPath(points, close = false) {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return close ? `${d} Z` : d
}

/** Polygon approximating a circle (for round flasks and globes). */
export function circlePoly(cx, cy, r, n = 36, from = 0, to = Math.PI * 2) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = lerp(from, to, i / n)
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}
