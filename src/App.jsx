import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { QUESTIONS, INTERLUDES } from './data/questions.js'
import { recommend } from './lib/engine.js'
import Landing from './components/Landing.jsx'
import Quiz from './components/Quiz.jsx'
import Interlude from './components/Interlude.jsx'
import Roasting from './components/Roasting.jsx'

// The result screen carries the animation engine (GSAP + canvas); fetch it while the quiz runs.
const loadResult = () => import('./components/Result.jsx')
const Result = lazy(loadResult)

// Dev only: `?answers=<json>` jumps straight to the result for those answers.
function devAnswers() {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('answers')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function App() {
  const [screen, setScreen] = useState(() => (devAnswers() ? 'result' : 'landing'))
  const [answers, setAnswers] = useState(() => devAnswers() || {})
  const [index, setIndex] = useState(0)
  const [interlude, setInterlude] = useState(null)

  const result = useMemo(() => (screen === 'result' ? recommend(answers) : null), [screen, answers])

  const start = useCallback(() => {
    loadResult()
    setAnswers({})
    setIndex(0)
    setScreen('quiz')
    window.scrollTo(0, 0)
  }, [])

  const answer = useCallback(
    (questionId, value, extra = {}) => {
      setAnswers((a) => ({ ...a, [questionId]: value, ...extra }))
      if (index === QUESTIONS.length - 1) {
        setScreen('roasting')
      } else if (INTERLUDES[index]) {
        setInterlude(INTERLUDES[index])
        setIndex(index + 1)
        setScreen('interlude')
      } else {
        setIndex(index + 1)
      }
    },
    [index],
  )

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const toQuiz = useCallback(() => setScreen('quiz'), [])
  const toResult = useCallback(() => {
    setScreen('result')
    window.scrollTo(0, 0)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <AnimatePresence mode="wait">
          {screen === 'landing' && <Landing key="landing" onStart={start} />}
          {screen === 'quiz' && <Quiz key="quiz" index={index} answers={answers} onAnswer={answer} onBack={back} />}
          {screen === 'interlude' && <Interlude key={`interlude-${index}`} {...interlude} answered={index} onDone={toQuiz} />}
          {screen === 'roasting' && <Roasting key="roasting" onDone={toResult} />}
          {screen === 'result' && result && <Result key="result" result={result} onRestart={start} />}
        </AnimatePresence>
      </Suspense>
    </MotionConfig>
  )
}
