// Small shared brand pieces: the ghosted "brew", stamps, the progress cup.
import { motion } from 'framer-motion'

export const EASE = [0.22, 1, 0.36, 1]

/** "brew", almost blended into the background. `reveal` fades it up in terracotta once. */
export function BrewWord({ reveal = false }) {
  return (
    <span className={`brew-word${reveal ? ' brew-word--reveal' : ''}`} aria-hidden="true">
      brew
    </span>
  )
}

export function Stamp({ children, className = '', thud = false, delay = 0 }) {
  if (!thud) return <span className={`stamp ${className}`}>{children}</span>
  return (
    <motion.span
      className={`stamp ${className}`}
      initial={{ opacity: 0, scale: 1.9, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -3 }}
      transition={{ delay, type: 'spring', stiffness: 520, damping: 18, mass: 0.8 }}
    >
      {children}
    </motion.span>
  )
}

/** The cup that fills as you answer. fill: 0..1 */
export function ProgressCup({ fill = 0, size = 44, steaming = false, label }) {
  const h = 26 * Math.max(0, Math.min(1, fill))
  return (
    <div className="progress-cup" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <defs>
          <clipPath id="pc-clip">
            <path d="M10 16 H36 L33.5 40 Q33 43 30 43 H16 Q13 43 12.5 40 Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#pc-clip)">
          <motion.rect
            x="8"
            width="32"
            fill="#B5562F"
            initial={false}
            animate={{ y: 43 - h, height: h + 1 }}
            transition={{ type: 'spring', stiffness: 170, damping: 14 }}
          />
          <motion.rect
            x="8"
            width="32"
            height="2.2"
            fill="#E8946A"
            initial={false}
            animate={{ y: 43 - h, opacity: fill > 0.02 ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 170, damping: 14 }}
          />
        </g>
        <path d="M10 16 H36 L33.5 40 Q33 43 30 43 H16 Q13 43 12.5 40 Z" fill="none" stroke="#F0E2CC" strokeWidth="2" strokeLinejoin="round" />
        <path d="M35.5 21 H38 Q42 21 42 25.5 Q42 30 37.5 30 H34.5" fill="none" stroke="#F0E2CC" strokeWidth="2" strokeLinecap="round" />
        {steaming && (
          <g className="pc-steam" stroke="#C4AD93" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M18 11 C16 8 20 6 18 2" />
            <path d="M24 11 C22 8 26 6 24 2" />
            <path d="M30 11 C28 8 32 6 30 2" />
          </g>
        )}
      </svg>
    </div>
  )
}

export function Screen({ className = '', children, ...rest }) {
  return (
    <motion.main
      className={`screen ${className}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.38, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.main>
  )
}
