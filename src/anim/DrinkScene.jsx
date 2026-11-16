// Plays a drink's animation: a pour (for café drinks) or a brew (for manual brews).
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { createRenderer, SCENE_W, SCENE_H } from './renderer.js'
import { Vessel, SOURCE_ART } from './art.jsx'
import { VESSELS, createPourState, buildPourTimeline, sourcesFor, mouthFor } from './pourScene.js'
import { BREWS } from './brewScenes.jsx'
import { BREW_COLOR } from '../data/drinks.js'
import { syncProxies } from './svgProxy.js'
import { usePrefersReducedMotion } from '../lib/useReducedMotion.js'

function recipeFor(pick) {
  const { drink, temp } = pick
  if (drink.brew) return null
  return drink.scene[temp] || Object.values(drink.scene)[0]
}

export default function DrinkScene({ pick, playId = 0, onDone }) {
  const canvasRef = useRef(null)
  const svgRef = useRef(null)
  const labelRef = useRef(null)
  const reduced = usePrefersReducedMotion()
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  const brew = pick.drink.brew
  const recipe = recipeFor(pick)
  const brewOpts = useMemo(
    () => ({
      variant: brew?.variant,
      iced: pick.temp === 'iced',
      color: BREW_COLOR[pick.roast?.key || 'medium'],
    }),
    [brew?.variant, pick.temp, pick.roast?.key],
  )

  const sceneKey = `${pick.drink.id}:${pick.temp}:${brewOpts.color}`

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const root = svgRef.current
    if (!canvas || !root) return undefined
    let state
    let tl
    let schedule = []
    let renderer
    let lastLabel = null

    const ctx = gsap.context(() => {
      if (brew) {
        const def = BREWS[brew.kind]
        state = def.create(brewOpts)
        state.bind?.(root)
        ;({ tl, schedule } = def.timeline(state, root, brewOpts))
        tl.timeScale(1.15)
      } else {
        state = createPourState(recipe)
        ;({ tl, schedule } = buildPourTimeline(recipe, state, root))
      }
    }, root)

    renderer = createRenderer(canvas, state, { reducedMotion: reduced })

    const setLabel = (text) => {
      if (text === lastLabel || !labelRef.current) return
      lastLabel = text
      const el = labelRef.current
      el.classList.remove('is-in')
      // Restart the CSS transition so each new step fades in.
      void el.offsetWidth
      el.textContent = text
      if (text) el.classList.add('is-in')
    }
    tl.eventCallback('onComplete', () => onDoneRef.current?.())

    const tick = () => {
      renderer.frame()
      syncProxies(state.proxies)
      const time = tl.time()
      let text = ''
      for (const s of schedule) if (s.t <= time) text = s.text
      setLabel(text)
    }
    gsap.ticker.add(tick)
    // Dev-only handle for inspecting the animation at exact moments.
    if (import.meta.env.DEV) window.__scene = { tl, state, schedule }

    const ro = new ResizeObserver(() => renderer.resize())
    ro.observe(canvas)

    if (reduced) {
      tl.progress(1)
      setLabel(schedule.length ? schedule[schedule.length - 1].text : '')
      onDoneRef.current?.()
    } else {
      tl.play(0)
    }

    return () => {
      ro.disconnect()
      gsap.ticker.remove(tick)
      tl.kill()
      ctx.revert()
    }
    // sceneKey captures drink/temp/colour; playId restarts the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey, playId, reduced])

  return (
    <div className="scene" role="img" aria-label={`Animation of a ${pick.drink.name} being made`}>
      <canvas ref={canvasRef} className="scene-canvas" />
      <svg ref={svgRef} className="scene-svg" viewBox={(recipe ? VESSELS[recipe.vessel].view : null)?.join(' ') || `0 0 ${SCENE_W} ${SCENE_H}`} aria-hidden="true">
        {brew ? <BrewArt brew={brew} /> : <PourArt recipe={recipe} />}
      </svg>
      <p ref={labelRef} className="scene-label" aria-live="polite" />
    </div>
  )
}

function BrewArt({ brew }) {
  const Art = BREWS[brew.kind].Art
  return <Art variant={brew.variant} />
}

function PourArt({ recipe }) {
  const v = VESSELS[recipe.vessel]
  return (
    <g>
      <Vessel v={v} />
      {sourcesFor(recipe).map((via) => {
        const Art = SOURCE_ART[via]
        if (!Art) return null
        const m = mouthFor(recipe.vessel, via)
        return (
          <g key={via} transform={`translate(${m.x} ${m.y})`}>
            <g data-src={via} opacity="0">
              <Art />
            </g>
          </g>
        )
      })}
    </g>
  )
}
