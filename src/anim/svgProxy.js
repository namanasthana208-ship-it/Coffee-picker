// GSAP tweens these plain objects; we write the SVG transform ourselves each frame.
// SVG's own `rotate(a ox oy)` pivots exactly where we say (e.g. a spout), with no
// origin bookkeeping, so tilting sources can never drift.

export function makeProxy(el, { ox = 0, oy = 0, opacity } = {}) {
  return {
    el,
    ox,
    oy,
    x: 0,
    y: 0,
    rotation: 0,
    opacity: opacity ?? (el ? Number(el.getAttribute('opacity') ?? 1) : 1),
    _last: '',
  }
}

export function syncProxies(proxies) {
  if (!proxies) return
  for (const p of proxies) {
    if (!p.el) continue
    const tf = `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rotation.toFixed(2)} ${p.ox} ${p.oy})`
    const key = `${tf}|${p.opacity.toFixed(3)}`
    if (key === p._last) continue
    p._last = key
    p.el.setAttribute('transform', tf)
    p.el.setAttribute('opacity', p.opacity.toFixed(3))
  }
}
