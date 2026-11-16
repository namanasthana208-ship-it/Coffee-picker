// Animation lab: open the app with ?lab to review every drink's animation.
import { useState } from 'react'
import DrinkScene from '../anim/DrinkScene.jsx'
import { DRINKS, ROASTS } from '../data/drinks.js'

export default function Lab() {
  const initial = new URLSearchParams(window.location.search).get('drink') || DRINKS[0].id
  const [id, setId] = useState(initial)
  const drink = DRINKS.find((d) => d.id === id) || DRINKS[0]
  const [temp, setTemp] = useState(drink.temps[0])
  const [roast, setRoast] = useState('medium')
  const [playId, setPlayId] = useState(0)
  const [done, setDone] = useState(false)

  const pick = {
    drink,
    temp: drink.temps.includes(temp) ? temp : drink.temps[0],
    roast: drink.flags.manual ? { key: roast, ...ROASTS[roast] } : null,
  }

  const select = (d) => {
    setId(d.id)
    setTemp(d.temps[0])
    setDone(false)
    setPlayId((p) => p + 1)
  }

  return (
    <main className="lab">
      <h1 className="lab-title">Animation lab</h1>
      <div className="lab-layout">
        <div className="lab-stage">
          <div className="scene-frame">
            <DrinkScene pick={pick} playId={playId} onDone={() => setDone(true)} />
          </div>
          <p className="lab-meta" data-testid="lab-meta">
            {drink.name} · {pick.temp}
            {pick.roast ? ` · ${pick.roast.label} roast` : ''} · {done ? 'done' : 'playing'}
          </p>
          <div className="lab-controls">
            {drink.temps.length > 1 &&
              drink.temps.map((t) => (
                <button key={t} className={`chip${pick.temp === t ? ' is-selected' : ''}`} onClick={() => (setTemp(t), setDone(false), setPlayId((p) => p + 1))}>
                  {t}
                </button>
              ))}
            {drink.flags.manual &&
              Object.keys(ROASTS).map((r) => (
                <button key={r} className={`chip${roast === r ? ' is-selected' : ''}`} onClick={() => (setRoast(r), setDone(false), setPlayId((p) => p + 1))}>
                  {r}
                </button>
              ))}
            <button className="chip" onClick={() => (setDone(false), setPlayId((p) => p + 1))}>
              replay
            </button>
          </div>
        </div>
        <ul className="lab-list">
          {DRINKS.map((d) => (
            <li key={d.id}>
              <button className={`chip${d.id === id ? ' is-selected' : ''}`} onClick={() => select(d)} data-drink={d.id}>
                {d.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
