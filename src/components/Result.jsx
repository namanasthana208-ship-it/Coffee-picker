import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DrinkScene from '../anim/DrinkScene.jsx'
import { usePrefersReducedMotion } from '../lib/useReducedMotion.js'
import { BrewWord, Screen, Stamp, EASE } from './Brand.jsx'

const TAGS = ['Top pick', 'Backup', 'Safe bet']

export default function Result({ result, onRestart }) {
  const { persona, picks } = result
  const [idx, setIdx] = useState(0)
  const [playId, setPlayId] = useState(0)
  const [dir, setDir] = useState(1)
  const stageRef = useRef(null)
  const reduced = usePrefersReducedMotion()
  const pick = picks[idx]

  const go = (next) => {
    setDir(next > idx || (idx === 2 && next === 0) ? 1 : -1)
    setIdx(next)
    setPlayId((p) => p + 1)
    // Bring the new drink's animation into view if we've scrolled past it.
    const stage = stageRef.current
    if (stage) {
      const top = stage.getBoundingClientRect().top
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: reduced ? 'auto' : 'smooth' })
    }
  }
  const notHere = () => go((idx + 1) % 3)

  const reason = idx === 1 ? `No ${picks[0].drink.name}? This is your closest match.` : idx === 2 ? 'Works at practically any café, anywhere.' : null

  return (
    <Screen className="result">
      <header className="result-head">
        <p className="kicker kicker--muted">
          <span aria-hidden="true">
            Your <BrewWord /> type
          </span>
          <span className="sr-only">Your brew type</span>
        </p>
        <Stamp className="persona-stamp" thud delay={0.25}>
          No. {persona.no} · {persona.name}
        </Stamp>
        <motion.p className="persona-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
          {persona.line}
        </motion.p>
      </header>

      <div className="pick-stage" ref={stageRef}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.article
            key={pick.drink.id}
            className="pick"
            custom={dir}
            initial={{ opacity: 0, x: 48 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 * dir, transition: { duration: 0.24, ease: 'easeIn' } }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="pick-tags">
              <span className={`tag${idx === 0 ? ' tag--hot' : ''}`}>{TAGS[idx]}</span>
              {pick.temp === 'iced' && <span className="tag tag--quiet">Iced</span>}
              {pick.temp === 'hot' && pick.drink.temps.length > 1 && <span className="tag tag--quiet">Hot</span>}
            </div>
            {reason && <p className="pick-reason">{reason}</p>}

            <div className="scene-frame">
              <DrinkScene pick={pick} playId={playId} />
              <button className="replay" onClick={() => setPlayId((p) => p + 1)} aria-label={`Replay the ${pick.drink.name} animation`}>
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <path d="M4.5 10a5.5 5.5 0 1 0 1.7-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M5.6 2.8 L6.4 6.3 L2.9 6.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Replay
              </button>
            </div>

            <h1 className="drink-name">{pick.drink.name}</h1>
            <p className="drink-short">{pick.drink.short}</p>

            <section className="label-card" aria-label="Why it's you">
              <h3 className="label-title">Tasting notes on you</h3>
              <ul className="why">
                {pick.reasons.map((r) => (
                  <li key={r.pillar}>
                    <span className="why-pillar">{r.pillar}</span>
                    <span className="why-text">{r.text}</span>
                  </li>
                ))}
              </ul>

              {pick.tweaks.length > 0 && (
                <div className="label-row">
                  <span className="label-key">Ask for</span>
                  <span className="label-val">{pick.tweaks.join(' · ')}</span>
                </div>
              )}

              {pick.roast && (
                <div className="label-row roast">
                  <span className="label-key">Beans</span>
                  <span className="label-val">
                    <span className="roast-dots" aria-hidden="true">
                      {[1, 2, 3].map((d) => (
                        <motion.span key={d} className={`roast-dot${d <= pick.roast.dots ? ' is-on' : ''}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + d * 0.12, type: 'spring', stiffness: 500, damping: 20 }} />
                      ))}
                    </span>
                    <strong>{pick.roast.label} roast.</strong> Look for {pick.roast.notes} on the bag.
                  </span>
                </div>
              )}

              <div className="label-row">
                <span className="label-key">At home</span>
                <span className="label-val">{pick.drink.tip}</span>
              </div>
            </section>

            {pick.funLine && <p className="fun-line">{pick.funLine}</p>}
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="result-actions">
        <motion.button className="btn btn-primary" onClick={notHere} whileTap={{ scale: 0.97 }}>
          {idx === 2 ? 'Back to my top pick' : "They don't have it"}
        </motion.button>
      </div>

      <nav className="shortlist" aria-label="Your three picks">
        <p className="kicker kicker--muted">Your shortlist</p>
        <ol>
          {picks.map((p, i) => (
            <li key={p.drink.id}>
              <button className={`shortlist-item${i === idx ? ' is-current' : ''}`} onClick={() => i !== idx && go(i)} aria-current={i === idx ? 'true' : undefined}>
                <span className="shortlist-tag">{TAGS[i]}</span>
                <span className="shortlist-name">{p.drink.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <button className="link-btn restart" onClick={onRestart}>
        Start over
      </button>
    </Screen>
  )
}
