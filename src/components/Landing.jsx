import { motion } from 'framer-motion'
import { BrewWord, Screen, Stamp, EASE } from './Brand.jsx'

export default function Landing({ onStart }) {
  return (
    <Screen className="landing">
      <Stamp className="landing-stamp">Small-batch picks · Est. 2026</Stamp>

      <h1 className="landing-title" aria-label="What's your brew type?">
        What's your
        <br />
        <BrewWord reveal /> type?
      </h1>

      <motion.p className="lede" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.6 }}>
        Twelve questions about your personality, your mood and your taste. One cup that's unmistakably you.
      </motion.p>

      <motion.div className="landing-art" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease: EASE }}>
        <LandingCup />
      </motion.div>

      <motion.div className="landing-cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5, ease: EASE }}>
        <motion.button className="btn btn-primary" onClick={onStart} whileTap={{ scale: 0.97 }}>
          Find my type
        </motion.button>
        <p className="fine">About a minute. No sign-up.</p>
      </motion.div>

      <ul className="pillars" aria-label="What the quiz looks at">
        <li>
          <span className="pillar-no">01</span> Personality
        </li>
        <li>
          <span className="pillar-no">02</span> Mood
        </li>
        <li>
          <span className="pillar-no">03</span> Taste
        </li>
      </ul>
    </Screen>
  )
}

function LandingCup() {
  return (
    <svg viewBox="0 0 200 150" className="landing-cup" aria-hidden="true">
      <ellipse cx="100" cy="138" rx="74" ry="6" fill="rgba(10,5,2,0.3)" />
      <path d="M30 128 Q100 146 170 128" fill="rgba(240,226,204,0.06)" stroke="#F0E2CC" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 127 L174 127" stroke="#F0E2CC" strokeWidth="2" strokeLinecap="round" />
      <path d="M134 74 C164 70 166 112 128 114" fill="none" stroke="#F0E2CC" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M50 62 L150 62 Q148 112 120 124 L80 124 Q52 112 50 62 Z" fill="#33221A" stroke="#F0E2CC" strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="100" cy="62" rx="50" ry="8" fill="#B9844F" stroke="#F0E2CC" strokeWidth="2" />
      <path d="M100 58 C92 56 90 64 100 66 C110 64 108 56 100 58 Z M100 66 L100 60" fill="#F0E2CC" opacity="0.85" />
      <path d="M62 72 Q64 98 78 114" stroke="rgba(255,248,235,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <g className="landing-steam" stroke="#C4AD93" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M82 46 C76 36 88 30 82 18" />
        <path d="M100 44 C94 32 106 26 100 12" />
        <path d="M118 46 C112 36 124 30 118 18" />
      </g>
    </svg>
  )
}
