// Engine sanity check: random answer sets → invariants + how often each drink wins.
// Run: node scripts/check-engine.mjs
import { QUESTIONS } from '../src/data/questions.js'
import { DRINKS } from '../src/data/drinks.js'
import { recommend, isEligible } from '../src/lib/engine.js'

const N = Number(process.argv[2] || 40000)
let seed = 12345
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]

const topCounts = Object.fromEntries(DRINKS.map((d) => [d.id, 0]))
const anyCounts = Object.fromEntries(DRINKS.map((d) => [d.id, 0]))
const personaCounts = {}
const errors = []
let safeNotEverywhere = 0
let backupSameFamily = 0

for (let i = 0; i < N; i++) {
  const answers = { dairyFree: rand() < 0.2 }
  for (const q of QUESTIONS) {
    if (q.type === 'multi') {
      const chosen = q.options.filter(() => rand() < 0.3).map((o) => o.id)
      answers[q.id] = chosen.length ? chosen : [pick(q.options).id]
    } else answers[q.id] = pick(q.options).id
  }
  let res
  try {
    res = recommend(answers)
  } catch (e) {
    errors.push(`${e.message} :: ${JSON.stringify(answers)}`)
    continue
  }
  const { picks, ctx, persona } = res
  personaCounts[persona.id] = (personaCounts[persona.id] || 0) + 1
  const ids = picks.map((p) => p.drink.id)
  if (new Set(ids).size !== 3) errors.push(`duplicate picks ${ids}`)
  for (const p of picks) {
    if (!isEligible(p.drink, ctx)) errors.push(`ineligible ${p.drink.id}`)
    if (ctx.temp !== 'either' && p.temp !== ctx.temp) errors.push(`temp mismatch ${p.drink.id} ${p.temp} vs ${ctx.temp}`)
    if (!p.drink.scene && !p.drink.brew) errors.push(`no scene ${p.drink.id}`)
    if (p.drink.scene && !p.drink.scene[p.temp] && !Object.values(p.drink.scene)[0]) errors.push(`no scene for temp ${p.drink.id}`)
    if (p.roast && !p.drink.flags.manual) errors.push(`roast on non-manual ${p.drink.id}`)
    if (!p.roast && p.drink.flags.manual) errors.push(`missing roast on ${p.drink.id}`)
    if (p.reasons.length !== 3 || p.reasons.some((r) => !r.text)) errors.push(`bad reasons ${p.drink.id}`)
    anyCounts[p.drink.id]++
  }
  if (picks[2].drink.avail !== 3) safeNotEverywhere++
  if (picks[1].drink.family === picks[0].drink.family) backupSameFamily++
  topCounts[ids[0]]++
}

console.log(`samples: ${N}, errors: ${errors.length}`)
if (errors.length) console.log([...new Set(errors)].slice(0, 15).join('\n'))
console.log(`safe bet not "everywhere": ${safeNotEverywhere}, backup same family: ${backupSameFamily}`)
console.log('personas:', personaCounts)
console.log('\ndrink                 top%    in-picks%')
for (const d of DRINKS) {
  console.log(
    d.id.padEnd(22),
    ((topCounts[d.id] / N) * 100).toFixed(2).padStart(6),
    ((anyCounts[d.id] / N) * 100).toFixed(2).padStart(9),
  )
}
