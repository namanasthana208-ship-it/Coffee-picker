import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { QUESTIONS } from '../data/questions.js'
import { ProgressCup, Screen, EASE } from './Brand.jsx'

export default function Interlude({ kicker, line, answered, onDone }) {
  // Fire once, whether the timer runs out or the user taps first.
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })
  const finish = () => {
    if (done.current) return
    done.current = true
    onDoneRef.current()
  }
  useEffect(() => {
    const id = window.setTimeout(finish, 1900)
    return () => window.clearTimeout(id)
    // Runs once on mount; `finish` reads the latest callback through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Screen className="interlude" onClick={finish}>
      <ProgressCup fill={answered / QUESTIONS.length} size={56} label={`${answered} of ${QUESTIONS.length} answered`} />
      <motion.p className="kicker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: EASE }}>
        {kicker}
      </motion.p>
      <motion.h2 className="interlude-line" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: EASE }}>
        {line}
      </motion.h2>
      <motion.button className="link-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        Continue <span aria-hidden="true">→</span>
      </motion.button>
    </Screen>
  )
}
