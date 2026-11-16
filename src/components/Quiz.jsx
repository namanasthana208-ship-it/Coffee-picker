import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QUESTIONS, PILLARS } from '../data/questions.js'
import { ProgressCup, Screen, EASE } from './Brand.jsx'

const TOTAL = QUESTIONS.length

export default function Quiz({ index, answers, onAnswer, onBack }) {
  const q = QUESTIONS[index]
  return (
    <Screen className="quiz">
      <header className="quiz-top">
        <button className="link-btn" onClick={onBack} style={{ visibility: index === 0 ? 'hidden' : 'visible' }} aria-label="Previous question">
          <span aria-hidden="true">←</span> Back
        </button>
        <ProgressCup fill={index / TOTAL} label={`${index} of ${TOTAL} answered`} />
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={q.id}
          className="question"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <p className="kicker">
            {PILLARS[q.pillar].label} · Batch {String(index + 1).padStart(2, '0')} / {TOTAL}
          </p>
          <h2 className="question-title">{q.title}</h2>
          {q.hint && <p className="hint">{q.hint}</p>}
          {q.type === 'multi' ? (
            <MultiQuestion q={q} answers={answers} onAnswer={onAnswer} />
          ) : (
            <SingleQuestion q={q} answers={answers} onAnswer={onAnswer} />
          )}
        </motion.section>
      </AnimatePresence>
    </Screen>
  )
}

function SingleQuestion({ q, answers, onAnswer }) {
  const [picked, setPicked] = useState(answers[q.id] ?? null)
  const [dairyFree, setDairyFree] = useState(Boolean(answers.dairyFree))
  const locked = useRef(false)

  const choose = (opt) => {
    if (locked.current) return
    locked.current = true
    setPicked(opt.id)
    // Let the stamp land before moving on.
    window.setTimeout(() => onAnswer(q.id, opt.id, q.type === 'milk' ? { dairyFree } : {}), 420)
  }

  useNumberKeys(q.options, choose)

  return (
    <>
      {q.type === 'milk' && (
        <motion.button
          type="button"
          className={`toggle${dairyFree ? ' is-on' : ''}`}
          role="switch"
          aria-checked={dairyFree}
          onClick={() => setDairyFree((v) => !v)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="toggle-track" aria-hidden="true">
            <motion.span className="toggle-knob" layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
          </span>
          I'm dairy-free
        </motion.button>
      )}
      <ul className="options">
        {q.options.map((o, i) => (
          <motion.li key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06, duration: 0.36, ease: EASE }}>
            <OptionButton option={o} n={i + 1} selected={picked === o.id} onClick={() => choose(o)} />
          </motion.li>
        ))}
      </ul>
    </>
  )
}

function MultiQuestion({ q, answers, onAnswer }) {
  const [sel, setSel] = useState(() => new Set(answers[q.id] || []))
  const [error, setError] = useState('')
  const toggle = (id) => {
    setError('')
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  const submit = () => {
    if (sel.size === 0) {
      setError('Pick at least one flavour to continue.')
      return
    }
    onAnswer(q.id, [...sel])
  }
  return (
    <>
      <ul className="chips">
        {q.options.map((o, i) => (
          <motion.li key={o.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.06 + i * 0.045, type: 'spring', stiffness: 420, damping: 24 }}>
            <motion.button type="button" className={`chip${sel.has(o.id) ? ' is-selected' : ''}`} aria-pressed={sel.has(o.id)} onClick={() => toggle(o.id)} whileTap={{ scale: 0.95 }}>
              {o.label}
            </motion.button>
          </motion.li>
        ))}
      </ul>
      <div className="multi-actions">
        <motion.button className="btn btn-primary" onClick={submit} whileTap={{ scale: 0.97 }}>
          Roast my profile
        </motion.button>
        <p className="form-error" role="alert">
          {error}
        </p>
      </div>
    </>
  )
}

function OptionButton({ option, n, selected, onClick }) {
  return (
    <motion.button type="button" className={`option${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={onClick} whileTap={{ scale: 0.975 }}>
      <span className="option-n" aria-hidden="true">
        {n}
      </span>
      <span className="option-text">
        <span className="option-label">{option.label}</span>
        {option.sub && <span className="option-sub">{option.sub}</span>}
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            className="option-tick"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.8, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 600, damping: 18 }}
          >
            <svg viewBox="0 0 20 20" width="20" height="20">
              <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M6 10.4 L8.8 13 L14 7.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function useNumberKeys(options, choose) {
  const ref = useRef(choose)
  useEffect(() => {
    ref.current = choose
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) ref.current(options[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options])
}
