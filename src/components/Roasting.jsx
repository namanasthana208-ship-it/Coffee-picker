import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ProgressCup, Screen } from './Brand.jsx'

export default function Roasting({ onDone }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 1700)
    return () => window.clearTimeout(id)
  }, [onDone])
  return (
    <Screen className="roasting" aria-live="polite">
      <ProgressCup fill={1} size={84} steaming label="All twelve answered" />
      <h2 className="roasting-line">
        Roasting your profile
        <span className="dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}>
              .
            </motion.span>
          ))}
        </span>
      </h2>
      <p className="fine">Weighing personality, mood and taste.</p>
    </Screen>
  )
}
