// Canvas liquid renderer.
//
// Draws containers (clipped liquid layers with meniscus, damped wobble,
// soft layer blending, foam texture, crema, ice, steam and particles),
// tapered pour streams with splashes, and free particles.
// All geometry is in a 240 × 280 "scene" coordinate space; GSAP timelines
// mutate the plain state objects and this renderer draws them every tick.

export const SCENE_W = 240
export const SCENE_H = 280

const TAU = Math.PI * 2
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp = (a, b, t) => a + (b - a) * t

// ── Colour helpers ───────────────────────────────────────────
const rgbCache = new Map()
export function hexToRgb(hex) {
  let c = rgbCache.get(hex)
  if (!c) {
    const n = parseInt(hex.slice(1), 16)
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    rgbCache.set(hex, c)
  }
  return c
}
function rgba(rgb, a) {
  return `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`
}
function mixRgb(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}
function shade(rgb, k) {
  // k > 0 lightens towards white, k < 0 darkens towards black
  return k >= 0 ? mixRgb(rgb, [255, 255, 255], k) : mixRgb(rgb, [0, 0, 0], -k)
}

// Deterministic pseudo-random so textures don't shimmer between frames.
function seeded(seed) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

// ── Geometry ─────────────────────────────────────────────────
/** Horizontal extent of a polygon at height y. */
export function wallsAt(poly, y) {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    if ((y1 <= y && y2 >= y) || (y2 <= y && y1 >= y)) {
      if (y1 === y2) {
        lo = Math.min(lo, x1, x2)
        hi = Math.max(hi, x1, x2)
      } else {
        const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1)
        lo = Math.min(lo, x)
        hi = Math.max(hi, x)
      }
    }
  }
  return lo === Infinity ? null : [lo, hi]
}

/** Build a container record from a cavity polygon. */
export function makeContainer(id, poly, opts = {}) {
  let top = Infinity
  let bottom = -Infinity
  let minX = Infinity
  let maxX = -Infinity
  for (const [x, y] of poly) {
    top = Math.min(top, y)
    bottom = Math.max(bottom, y)
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
  }
  return {
    id,
    poly,
    top,
    bottom,
    cx: (minX + maxX) / 2,
    capacity: bottom - top,
    layers: [],
    glass: opts.glass ?? 'rgba(240,226,204,0.05)',
    extendTop: opts.extendTop ?? 26,
    meniscus: opts.meniscus ?? 2.2,
    wave: { amp: 0.3, idle: opts.idleWave ?? 0.3, boost: 0 },
    ice: [],
    scoop: null,
    dollop: null,
    specks: [],
    clouds: [],
    bubbles: [],
    bloomBubbles: [],
    cascadeDots: [],
    wisps: [],
    bubbleRate: 0,
    bubbleColor: '#FFFFFF',
    cascade: 0,
    bloom: 0,
    steam: 0,
    steamWidth: opts.steamWidth ?? 0.5,
    dust: { rate: 0, color: '#5A3424' },
    impact: 0,
    seed: opts.seed ?? 7,
  }
}

/** Add a layer. h is in scene px. */
export function addLayer(c, spec) {
  const layer = {
    color: spec.color,
    to: spec.to || null,
    mixT: 0,
    alpha: spec.alpha ?? 1,
    h: spec.h ?? 0,
    blend: spec.blend ?? 3,
    foam: Boolean(spec.foam),
    crema: Boolean(spec.crema),
    dome: spec.dome || 0,
    domeT: spec.domeT ?? 1,
    name: spec.name || '',
    specks: null,
  }
  if (layer.foam || layer.crema) {
    const r = seeded(c.seed * 31 + c.layers.length * 7 + 3)
    layer.specks = Array.from({ length: layer.foam ? 70 : 40 }, () => ({ u: r(), v: r(), r: 0.5 + r() * 1.3, k: r() }))
  }
  c.layers.push(layer)
  return layer
}

export function totalHeight(c) {
  let s = 0
  for (const l of c.layers) s += l.h
  return s
}

function layerColor(l) {
  const a = hexToRgb(l.color)
  return l.to && l.mixT > 0 ? mixRgb(a, hexToRgb(l.to), clamp(l.mixT, 0, 1)) : a
}

function topVisibleIndex(c) {
  for (let i = c.layers.length - 1; i >= 0; i--) if (c.layers[i].h > 0.05) return i
  return -1
}

/** Surface height at x, including wobble, meniscus and any dome on the top layer. */
export function surfaceAt(c, x, t) {
  const total = totalHeight(c)
  const base = c.bottom - total
  const ti = topVisibleIndex(c)
  if (ti < 0) return c.bottom
  const top = c.layers[ti]
  const w = wallsAt(c.poly, clamp(base, c.top, c.bottom)) || [c.cx - 20, c.cx + 20]
  let y = base + waveOffset(c, x, t)
  if (top.dome > 0) {
    const half = (w[1] - w[0]) / 2
    const u = clamp((x - c.cx) / half, -1, 1)
    y -= top.dome * top.domeT * (1 - u * u)
  }
  return y
}

function waveOffset(c, x, t) {
  const a = c.wave.amp
  return a * (Math.sin(x * 0.085 + t * 2.3) * 0.7 + Math.sin(x * 0.047 - t * 1.6) * 0.5)
}

// ── Renderer ─────────────────────────────────────────────────
export function createRenderer(canvas, state, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d')
  let t = 0
  let last = performance.now()
  let scale = 1
  const rand = Math.random

  // The visible window onto the 240 × 280 scene (same aspect ratio).
  const view = state.view || [0, 0, SCENE_W, SCENE_H]

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    const w = canvas.clientWidth || SCENE_W
    const h = canvas.clientHeight || SCENE_H
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    scale = canvas.width / view[2]
  }
  resize()

  // ── Containers ─────────────────────────────────────────────
  function clipContainer(c) {
    ctx.beginPath()
    const p = c.poly
    // Extend the clip straight up above the rim so foam domes can rise over it.
    const [tl] = p
    ctx.moveTo(tl[0], tl[1] - c.extendTop)
    for (const [x, y] of p) ctx.lineTo(x, y)
    const last = p[p.length - 1]
    ctx.lineTo(last[0], last[1] - c.extendTop)
    ctx.closePath()
    ctx.clip()
  }

  function tracePoly(poly) {
    ctx.beginPath()
    ctx.moveTo(poly[0][0], poly[0][1])
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1])
    ctx.closePath()
  }

  function drawContainer(c, dt) {
    const total = totalHeight(c)

    // Glass tint behind everything.
    if (c.glass) {
      tracePoly(c.poly)
      ctx.fillStyle = c.glass
      ctx.fill()
    }

    // Wobble: kicks up while a stream is landing, settles with damping after.
    const targetAmp = reducedMotion ? 0 : c.impact > 0 ? 1.7 : c.wave.idle
    const k = 1 - Math.pow(c.impact > 0 ? 0.9 : 0.975, dt * 60)
    c.wave.amp = lerp(c.wave.amp, targetAmp, k)

    if (c.scoop && c.scoop.visible) drawScoop(c, c.scoop)

    if (total > 0.05) {
      ctx.save()
      clipContainer(c)
      const surfaceBase = c.bottom - total
      const ti = topVisibleIndex(c)
      let cum = 0
      for (let i = 0; i < c.layers.length; i++) {
        const l = c.layers[i]
        if (l.h <= 0.05) continue
        const yB = c.bottom - cum
        cum += l.h
        const yT = c.bottom - cum
        drawLayer(c, l, i, yB, yT, i === ti, i > 0 && cum - l.h > 0.05)
      }
      drawClouds(c, dt)
      drawBubbles(c, dt, surfaceBase)
      drawCascade(c, dt, surfaceBase)
      drawShading(c, surfaceBase, ti)
      drawSpecks(c)
      drawBloom(c, dt)
      ctx.restore()
    }

    drawIce(c, dt, total)
    if (c.dollop && c.dollop.visible) drawDollop(c, c.dollop)
    updateDust(c, dt)
    drawSteam(c, dt)
    c.impact = 0
  }

  function drawLayer(c, l, i, yB, yT, isTop, hasBelow) {
    const rgb = layerColor(l)
    const wTop = wallsAt(c.poly, clamp(yT, c.top, c.bottom)) || [c.cx - 30, c.cx + 30]
    const xl = Math.min(wTop[0], (wallsAt(c.poly, clamp(yB, c.top, c.bottom)) || wTop)[0]) - 4
    const xr = Math.max(wTop[1], (wallsAt(c.poly, clamp(yB, c.top, c.bottom)) || wTop)[1]) + 4
    const half = (wTop[1] - wTop[0]) / 2
    const blend = hasBelow ? l.blend : 0

    const edge = (x) => {
      if (isTop) {
        let y = yT + waveOffset(c, x, t)
        // Meniscus: liquid creeps up the glass where it meets the wall.
        const m = c.meniscus * (Math.exp(-(x - wTop[0]) / 3.5) + Math.exp(-(wTop[1] - x) / 3.5))
        y -= m
        if (l.dome > 0) {
          const u = clamp((x - c.cx) / half, -1, 1)
          y -= l.dome * l.domeT * (1 - u * u)
        }
        return y
      }
      return yT + Math.sin(x * 0.11 + t * 1.4 + i) * 0.45
    }

    ctx.beginPath()
    ctx.moveTo(xl, edge(xl))
    for (let x = xl + 3; x <= xr; x += 3) ctx.lineTo(x, edge(x))
    ctx.lineTo(xr, edge(xr))
    ctx.lineTo(xr, yB + blend + 1)
    ctx.lineTo(xl, yB + blend + 1)
    ctx.closePath()

    if (blend > 0) {
      const g = ctx.createLinearGradient(0, yB + blend, 0, yB - blend)
      g.addColorStop(0, rgba(rgb, 0))
      g.addColorStop(1, rgba(rgb, l.alpha))
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = rgba(rgb, l.alpha)
    }
    ctx.fill()

    // Foam: soft micro-bubbles, denser near the top.
    if (l.foam && l.specks) {
      const light = rgba(shade(rgb, 0.45), 0.55)
      const dark = rgba(shade(rgb, -0.12), 0.35)
      const top = edge(c.cx)
      for (const s of l.specks) {
        const x = wTop[0] + 2 + s.u * (wTop[1] - wTop[0] - 4)
        const ey = edge(x)
        const y = ey + 1.5 + Math.pow(s.v, 1.6) * Math.max(0, yB - ey - 2)
        if (y > yB || y < top - 40) continue
        ctx.fillStyle = s.k > 0.55 ? light : dark
        ctx.beginPath()
        ctx.arc(x, y, s.r * 0.75, 0, TAU)
        ctx.fill()
      }
      // A thin bright skin on top of the foam.
      ctx.beginPath()
      for (let x = wTop[0]; x <= wTop[1]; x += 3) {
        const y = edge(x) + 0.8
        if (x === wTop[0]) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = rgba(shade(rgb, 0.55), 0.7)
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    // Crema: a tan band with tiger-stripe flecks.
    if (l.crema && isTop) {
      const cr = hexToRgb('#B9844F')
      ctx.beginPath()
      for (let x = xl; x <= xr; x += 3) {
        const y = edge(x)
        if (x === xl) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let x = xr; x >= xl; x -= 3) ctx.lineTo(x, edge(x) + Math.min(5, l.h * 0.4))
      ctx.closePath()
      ctx.fillStyle = rgba(cr, 0.92)
      ctx.fill()
      if (l.specks) {
        for (const s of l.specks) {
          const x = wTop[0] + 2 + s.u * (wTop[1] - wTop[0] - 4)
          const y = edge(x) + 0.6 + s.v * Math.min(4, l.h * 0.35)
          ctx.fillStyle = s.k > 0.5 ? 'rgba(138,90,48,0.55)' : 'rgba(222,174,112,0.6)'
          ctx.beginPath()
          ctx.arc(x, y, s.r * 0.55, 0, TAU)
          ctx.fill()
        }
      }
    }
  }

  // Depth: darker towards the walls, a soft highlight down the left side.
  function drawShading(c, surfaceBase, ti) {
    if (ti < 0) return
    const top = surfaceBase - 14
    const w = wallsAt(c.poly, clamp(surfaceBase, c.top, c.bottom)) || [c.cx - 30, c.cx + 30]
    const x0 = w[0]
    const x1 = w[1]
    const g = ctx.createLinearGradient(x0, 0, x1, 0)
    g.addColorStop(0, 'rgba(20,10,5,0.22)')
    g.addColorStop(0.16, 'rgba(20,10,5,0)')
    g.addColorStop(0.2, 'rgba(255,248,235,0.07)')
    g.addColorStop(0.28, 'rgba(255,248,235,0)')
    g.addColorStop(0.8, 'rgba(20,10,5,0)')
    g.addColorStop(1, 'rgba(20,10,5,0.26)')
    ctx.fillStyle = g
    ctx.fillRect(x0 - 6, top, x1 - x0 + 12, c.bottom - top + 4)
  }

  function drawSpecks(c) {
    ctx.globalAlpha = 0.85
    for (const s of c.specks) {
      const y = surfaceAt(c, s.x, t) + s.dy
      ctx.fillStyle = s.color
      ctx.beginPath()
      ctx.arc(s.x, y, s.r, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function updateDust(c, dt) {
    if (c.dust.rate > 0 && !reducedMotion) {
      const n = c.dust.rate * dt * 90
      const w = wallsAt(c.poly, clamp(c.bottom - totalHeight(c), c.top, c.bottom)) || [c.cx - 20, c.cx + 20]
      for (let i = 0; i < n; i++) {
        if (rand() > n - i) break
        state.particles.push({
          type: 'dust',
          c,
          x: lerp(w[0] + 6, w[1] - 6, rand()),
          y: c.top - 46 - rand() * 20,
          vx: (rand() - 0.5) * 0.3,
          vy: 0.9 + rand() * 0.8,
          r: 0.35 + rand() * 0.5,
          color: c.dust.color,
        })
      }
    }
  }

  function drawClouds(c, dt) {
    for (let i = c.clouds.length - 1; i >= 0; i--) {
      const p = c.clouds[i]
      p.y += p.vy * dt * 60
      p.x += Math.sin(t * 1.3 + p.ph) * 0.15 * dt * 60
      p.r += p.vr * dt * 60
      p.a -= 0.0035 * dt * 60
      if (p.a <= 0 || p.y > c.bottom + p.r) {
        c.clouds.splice(i, 1)
        continue
      }
      ctx.fillStyle = rgba(p.rgb, p.a)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, TAU)
      ctx.fill()
    }
  }

  function drawBubbles(c, dt, surfaceBase) {
    if (c.bubbleRate > 0 && !reducedMotion && rand() < c.bubbleRate * dt * 14) {
      const w = wallsAt(c.poly, c.bottom - 6) || [c.cx - 20, c.cx + 20]
      c.bubbles.push({ x: lerp(w[0] + 5, w[1] - 5, rand()), y: c.bottom - 3, v: 0.35 + rand() * 0.5, r: 0.7 + rand() * 1.1, ph: rand() * TAU })
    }
    ctx.lineWidth = 0.8
    for (let i = c.bubbles.length - 1; i >= 0; i--) {
      const b = c.bubbles[i]
      b.y -= b.v * dt * 60
      b.x += Math.sin(t * 3 + b.ph) * 0.12
      if (b.y < surfaceBase + 2) {
        c.bubbles.splice(i, 1)
        continue
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, TAU)
      ctx.stroke()
    }
  }

  // Nitro cascade: fine bubbles drifting *down* the glass while the head forms.
  function drawCascade(c, dt, surfaceBase) {
    if (c.cascade > 0 && !reducedMotion) {
      const n = c.cascade * dt * 120
      const w = wallsAt(c.poly, clamp(surfaceBase + 6, c.top, c.bottom)) || [c.cx - 20, c.cx + 20]
      for (let i = 0; i < n; i++) {
        if (rand() > n - i) break
        c.cascadeDots.push({ x: lerp(w[0] + 2, w[1] - 2, rand()), y: surfaceBase + 4 + rand() * 10, v: 0.25 + rand() * 0.35, life: 1 })
      }
    }
    ctx.fillStyle = 'rgba(214,176,132,0.45)'
    for (let i = c.cascadeDots.length - 1; i >= 0; i--) {
      const d = c.cascadeDots[i]
      d.y += d.v * dt * 60
      d.life -= 0.006 * dt * 60
      if (d.life <= 0 || d.y > c.bottom) {
        c.cascadeDots.splice(i, 1)
        continue
      }
      ctx.globalAlpha = d.life
      ctx.fillRect(d.x, d.y, 0.9, 0.9)
    }
    ctx.globalAlpha = 1
  }

  // Pour-over bloom: little CO₂ bubbles that swell and pop on the coffee bed.
  function drawBloom(c, dt) {
    if (c.bloom > 0 && !reducedMotion && rand() < c.bloom * dt * 20) {
      const sy = c.bottom - totalHeight(c)
      const w = wallsAt(c.poly, clamp(sy, c.top, c.bottom)) || [c.cx - 10, c.cx + 10]
      c.bloomBubbles.push({ x: lerp(w[0] + 4, w[1] - 4, rand()), age: 0, life: 0.6 + rand() * 0.8, r: 1 + rand() * 1.8 })
    }
    ctx.lineWidth = 0.8
    for (let i = c.bloomBubbles.length - 1; i >= 0; i--) {
      const b = c.bloomBubbles[i]
      b.age += dt
      if (b.age > b.life) {
        c.bloomBubbles.splice(i, 1)
        continue
      }
      const k = b.age / b.life
      const y = surfaceAt(c, b.x, t) - b.r * k * 0.6
      ctx.strokeStyle = `rgba(214,180,140,${0.75 * (1 - k)})`
      ctx.beginPath()
      ctx.arc(b.x, y, b.r * (0.4 + k * 0.6), Math.PI, TAU)
      ctx.stroke()
    }
  }

  function drawIce(c, dt, total) {
    if (!c.ice.length) return
    const sy = c.bottom - total
    for (let i = 0; i < c.ice.length; i++) {
      const q = c.ice[i]
      if (q.y < -60) continue
      const submerged = q.y > sy && total > 1
      const bob = submerged && !reducedMotion ? Math.sin(t * 1.4 + i * 1.7) * 0.6 : 0
      ctx.save()
      ctx.translate(q.x, q.y + bob)
      ctx.rotate(q.rot)
      const w = q.w
      const h = q.h
      ctx.beginPath()
      ctx.roundRect(-w / 2, -h / 2, w, h, 4)
      ctx.fillStyle = submerged ? 'rgba(255,255,255,0.14)' : 'rgba(235,242,245,0.2)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.62)'
      ctx.lineWidth = 1.1
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-w / 2 + 4, -h / 2 + 3)
      ctx.lineTo(w / 2 - 6, -h / 2 + 3)
      ctx.moveTo(-w / 2 + 3, -h / 2 + 4)
      ctx.lineTo(-w / 2 + 3, h / 2 - 7)
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    }
  }

  function drawScoop(c, s) {
    const r = s.r
    ctx.save()
    ctx.translate(s.x, s.y)
    // A smooth, slightly squat ball of gelato; the espresso pool hides its base.
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.94, 0, 0, TAU)
    ctx.fillStyle = '#F5EAD6'
    ctx.fill()
    ctx.strokeStyle = 'rgba(200,178,146,0.7)'
    ctx.lineWidth = 1
    ctx.stroke()
    // Soft shadow on the underside.
    ctx.beginPath()
    ctx.arc(0, 2, r * 0.9, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.strokeStyle = 'rgba(160,130,95,0.35)'
    ctx.lineWidth = 3
    ctx.stroke()
    // Espresso coats the crown of the scoop, then runs down in a few uneven drips.
    if (s.melt > 0) {
      const m = s.melt
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(0, 0, r - 0.6, r * 0.94 - 0.6, 0, 0, TAU)
      ctx.clip()
      // Cap: an irregular lower edge that creeps down as it melts.
      const capY = -r + 4 + m * r * 0.5
      ctx.beginPath()
      ctx.moveTo(-r, -r)
      ctx.lineTo(r, -r)
      for (let x = r; x >= -r; x -= 3) ctx.lineTo(x, capY + Math.sin(x * 0.42) * 2.2 + Math.cos(x * 0.9) * 1.2)
      ctx.closePath()
      ctx.fillStyle = `rgba(74,40,22,${0.88 * Math.min(1, m * 1.6)})`
      ctx.fill()
      const drips = [
        [-0.34, 2.4, 0.75],
        [0.3, 1.9, 0.45],
      ]
      for (const [u, w, len] of drips) {
        const x = u * r
        const y0 = capY + Math.sin(x * 0.42) * 2.2
        const l = m * len * r * 0.55
        ctx.beginPath()
        ctx.moveTo(x - w, y0 - 1)
        ctx.lineTo(x - w * 0.8, y0 + l)
        ctx.arc(x, y0 + l, w * 0.95, Math.PI, 0, true)
        ctx.lineTo(x + w, y0 - 1)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.restore()
  }

  function drawDollop(c, d) {
    const rgb = hexToRgb(d.color)
    ctx.save()
    ctx.translate(c.cx, d.y)
    ctx.scale(d.sx * d.size, d.sy * d.size)
    if (d.style === 'cloud') {
      // Whipped coffee: a soft, airy mound with a few lazy peaks and whisk ridges.
      ctx.beginPath()
      ctx.moveTo(-38, 2)
      ctx.bezierCurveTo(-40, -10, -30, -16, -20, -15)
      ctx.bezierCurveTo(-16, -24, -4, -26, 2, -20)
      ctx.bezierCurveTo(8, -27, 20, -24, 22, -15)
      ctx.bezierCurveTo(32, -15, 40, -8, 38, 2)
      ctx.quadraticCurveTo(0, 7, -38, 2)
      ctx.closePath()
      ctx.fillStyle = rgba(rgb, 1)
      ctx.fill()
      ctx.strokeStyle = rgba(shade(rgb, -0.16), 0.55)
      ctx.lineWidth = 1.1
      ctx.lineCap = 'round'
      for (const [x0, y0, x1, y1] of [
        [-30, -6, -18, -11],
        [-12, -14, 0, -17],
        [6, -12, 18, -15],
        [-22, -1, -6, -4],
        [10, -3, 26, -6],
      ]) {
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.quadraticCurveTo((x0 + x1) / 2, y1 - 3, x1, y1)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.ellipse(-8, -18, 7, 2.4, -0.2, 0, TAU)
      ctx.fillStyle = rgba(shade(rgb, 0.45), 0.55)
      ctx.fill()
      ctx.restore()
      return
    }
    const tiers = [
      [0, 0, 34, 9],
      [0, -9, 26, 8],
      [-1, -17, 17, 7],
      [1, -24, 8, 6],
    ]
    for (const [x, y, rx, ry] of tiers) {
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU)
      ctx.fillStyle = rgba(rgb, 1)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x, y + 1, rx, ry, 0, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.strokeStyle = rgba(shade(rgb, -0.18), 0.6)
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(1, -29)
    ctx.quadraticCurveTo(4, -34, 0, -37)
    ctx.strokeStyle = rgba(rgb, 1)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(-8, -12, 6, 2, -0.3, 0, TAU)
    ctx.fillStyle = rgba(shade(rgb, 0.5), 0.6)
    ctx.fill()
    ctx.restore()
  }

  // Steam wisps: thin tapered curls that rise, sway and fade.
  function drawSteam(c, dt) {
    if (c.steam <= 0 || reducedMotion) return
    const total = totalHeight(c)
    const base = Math.min(c.top, c.bottom - total) - 4
    const w = wallsAt(c.poly, c.top + 1) || [c.cx - 20, c.cx + 20]
    const span = (w[1] - w[0]) * c.steamWidth
    if (c.wisps.length < 4 && rand() < dt * 1.6) {
      c.wisps.push({ x: c.cx + (rand() - 0.5) * span, age: 0, life: 2.6 + rand() * 1.2, amp: 3 + rand() * 4, ph: rand() * TAU })
    }
    ctx.lineCap = 'round'
    for (let i = c.wisps.length - 1; i >= 0; i--) {
      const s = c.wisps[i]
      s.age += dt
      if (s.age > s.life) {
        c.wisps.splice(i, 1)
        continue
      }
      const life = Math.sin((Math.PI * s.age) / s.life)
      const rise = s.age * 9
      let px = s.x
      let py = base - rise
      for (let k = 1; k <= 12; k++) {
        const y = base - rise - k * 4.2
        const x = s.x + Math.sin(k * 0.45 + s.age * 1.8 + s.ph) * s.amp * (k / 12)
        const a = c.steam * 0.26 * life * (1 - k / 13)
        ctx.strokeStyle = `rgba(240,226,204,${a.toFixed(3)})`
        ctx.lineWidth = 2.6 - k * 0.12
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(x, y)
        ctx.stroke()
        px = x
        py = y
      }
    }
  }

  // ── Streams ────────────────────────────────────────────────
  function drawStream(s) {
    if (!s.color || s.botY - s.topY < 0.5) return
    const c = s.target
    const offsets = s.twin ? [-s.twin, s.twin] : [0]
    for (const off of offsets) {
      const x0 = s.x + off
      const sy = c ? surfaceAt(c, x0, t) : SCENE_H
      const bot = Math.min(s.botY, sy + 1.5)
      const top = s.topY
      if (bot <= top) continue
      const rgb = hexToRgb(s.color)
      const len = bot - top
      const pts = []
      for (let y = top; y <= bot; y += 3) {
        const u = (y - top) / Math.max(1, len)
        const w = lerp(s.w0, s.w1, Math.pow(u, 0.6))
        const wig = reducedMotion ? 0 : Math.sin(y * 0.13 + t * 13) * 0.45 * u
        pts.push([x0 + wig, y, w])
      }
      pts.push([x0, bot, s.w1])
      ctx.beginPath()
      pts.forEach(([x, y, w], i) => (i ? ctx.lineTo(x - w / 2, y) : ctx.moveTo(x - w / 2, y)))
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + pts[i][2] / 2, pts[i][1])
      ctx.closePath()
      ctx.fillStyle = rgba(rgb, s.alpha ?? 1)
      ctx.fill()
      // Specular line down the stream.
      ctx.beginPath()
      pts.forEach(([x, y, w], i) => (i ? ctx.lineTo(x - w * 0.18, y) : ctx.moveTo(x - w * 0.18, y)))
      ctx.strokeStyle = rgba(shade(rgb, 0.5), 0.35 * (s.alpha ?? 1))
      ctx.lineWidth = 0.7
      ctx.stroke()

      // Landing: wobble, splashes, clouds.
      if (c && s.botY >= sy - 1) {
        c.impact = 1
        if (!reducedMotion) {
          if (rand() < 0.45) {
            state.particles.push({
              type: 'splash',
              x: x0 + (rand() - 0.5) * 3,
              y: sy - 1,
              vx: (rand() - 0.5) * 1.6,
              vy: -0.8 - rand() * 1.4,
              r: 0.6 + rand() * 0.9,
              rgb,
              floor: sy + 1,
            })
          }
          if (s.cloud && rand() < 0.5) {
            c.clouds.push({ x: x0 + (rand() - 0.5) * 8, y: sy + 3, r: 3 + rand() * 4, vr: 0.06 + rand() * 0.06, vy: 0.16 + rand() * 0.22, a: 0.42, ph: rand() * TAU, rgb })
          }
        }
      }
    }
  }

  // ── Free particles ─────────────────────────────────────────
  function drawParticles(dt) {
    const ps = state.particles
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]
      const f = dt * 60
      if (p.type === 'splash') {
        p.vy += 0.16 * f
        p.x += p.vx * f
        p.y += p.vy * f
        if (p.y > p.floor) {
          ps.splice(i, 1)
          continue
        }
        ctx.fillStyle = rgba(p.rgb, 0.9)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, TAU)
        ctx.fill()
      } else if (p.type === 'dust') {
        p.x += p.vx * f
        p.y += p.vy * f
        const sy = surfaceAt(p.c, p.x, t)
        if (p.y >= sy) {
          if (p.c.specks.length < 160) p.c.specks.push({ x: p.x, dy: 0.6 + Math.random() * 2.2, r: p.r, color: p.color })
          ps.splice(i, 1)
          continue
        }
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, TAU)
        ctx.fill()
      } else if (p.type === 'drop') {
        p.vy += 0.2 * f
        p.y += p.vy * f
        const sy = p.c ? surfaceAt(p.c, p.x, t) : p.floor
        if (p.y >= sy) {
          if (p.c) p.c.wave.amp = Math.max(p.c.wave.amp, 0.8)
          ps.splice(i, 1)
          continue
        }
        ctx.fillStyle = rgba(p.rgb, 1)
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.r * 0.85, p.r * 1.25, 0, 0, TAU)
        ctx.fill()
      } else if (p.type === 'puff') {
        p.age += dt
        if (p.age > p.life) {
          ps.splice(i, 1)
          continue
        }
        const k = p.age / p.life
        p.x += p.vx * f
        p.y += p.vy * f
        p.vy *= 0.985
        ctx.fillStyle = `rgba(${p.rgb || '240,226,204'},${(p.a ?? 0.35) * (1 - k)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (0.6 + k * 1.4), 0, TAU)
        ctx.fill()
      } else if (p.type === 'ground') {
        p.vy += 0.12 * f
        p.x += p.vx * f
        p.y += p.vy * f
        if (p.y >= p.floor) {
          ps.splice(i, 1)
          continue
        }
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.r, p.r)
      }
    }
  }

  // Emitters a scene can switch on: drip (drops from a point into a container), puff.
  function runEmitters(dt) {
    if (reducedMotion) return
    for (const e of state.emitters || []) {
      if (e.rate <= 0) continue
      e.acc = (e.acc || 0) + e.rate * dt
      while (e.acc >= 1) {
        e.acc -= 1
        if (e.kind === 'drop') {
          state.particles.push({ type: 'drop', x: e.x + (rand() - 0.5) * (e.spread || 0), y: e.y, vy: 0.4, r: e.r || 1.5, rgb: hexToRgb(e.color), c: e.target, floor: e.floor })
        } else if (e.kind === 'puff') {
          state.particles.push({ type: 'puff', x: e.x + (rand() - 0.5) * (e.spread || 4), y: e.y, vx: (rand() - 0.5) * (e.vx || 0.6), vy: e.vy ?? -0.6 - rand() * 0.6, r: e.r || 4, age: 0, life: e.life || 1.2, a: e.alpha, rgb: e.rgb })
        } else if (e.kind === 'ground') {
          state.particles.push({ type: 'ground', x: e.x + (rand() - 0.5) * (e.spread || 10), y: e.y, vx: (rand() - 0.5) * 0.4, vy: 0.5 + rand(), r: 1.2 + rand() * 1.2, color: e.color, floor: e.floor })
        }
      }
    }
  }

  // ── Frame ──────────────────────────────────────────────────
  function frame() {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    t += reducedMotion ? 0 : dt
    ctx.setTransform(scale, 0, 0, scale, -view[0] * scale, -view[1] * scale)
    ctx.clearRect(view[0], view[1], view[2], view[3])
    if (state.drawBack) state.drawBack(ctx, t, dt)
    for (const c of state.containers) drawContainer(c, dt)
    for (const s of state.streams) drawStream(s)
    runEmitters(dt)
    drawParticles(dt)
    if (state.drawFront) state.drawFront(ctx, t, dt)
  }

  return { frame, resize, ctx }
}
