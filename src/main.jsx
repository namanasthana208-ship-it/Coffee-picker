import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// `?lab` opens a gallery of every drink animation (for reviewing the animations).
const isLab = new URLSearchParams(window.location.search).has('lab')
const Lab = lazy(() => import('./components/Lab.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isLab ? (
      <Suspense fallback={null}>
        <Lab />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
