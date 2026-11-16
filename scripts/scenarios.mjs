// Hand-written "archetype" answer sets: does each one land on a sensible drink?
// Run: node scripts/scenarios.mjs
import { recommend, rankDrinks, buildContext } from '../src/lib/engine.js'

const S = (saturday, restaurant, playlist, movie, battery, feeling, occasion, temp, bitterness, sweetness, milk, flavours, dairyFree = false) => ({
  saturday, restaurant, playlist, movie, battery, feeling, occasion, temp, bitterness, sweetness, milk, flavours, dairyFree,
})

const scenarios = {
  'espresso purist': S('errands', 'quickest', 'jazz', 'classics', 'low', 'focused', 'morning', 'hot', 'bold', 'none', 'black', ['coffee']),
  'macchiato': S('usual-spot', 'same-dish', 'jazz', 'classics', 'mid', 'focused', 'morning', 'hot', 'bold', 'none', 'splash', ['coffee']),
  'siphon explorer': S('new-place', 'cant-pronounce', 'jazz', 'scifi', 'high', 'happy', 'social', 'hot', 'balanced', 'none', 'black', ['fruity']),
  'chemex': S('usual-spot', 'same-dish', 'jazz', 'classics', 'mid', 'happy', 'work', 'hot', 'smooth', 'none', 'black', ['fruity']),
  'cold brew grinder': S('errands', 'quickest', 'techno', 'action', 'low', 'focused', 'work', 'iced', 'balanced', 'none', 'black', ['chocolate']),
  'nitro': S('new-place', 'cant-pronounce', 'techno', 'scifi', 'low', 'happy', 'work', 'iced', 'balanced', 'little', 'splash', ['chocolate']),
  'hot chocolate night': S('blanket', 'dessert-first', 'lofi', 'feelgood', 'high', 'low', 'evening', 'hot', 'smooth', 'sweet-tooth', 'creamy', ['chocolate']),
  'moka': S('errands', 'quickest', 'techno', 'action', 'low', 'focused', 'morning', 'hot', 'bold', 'none', 'black', ['chocolate']),
  'latte comfort': S('blanket', 'same-dish', 'lofi', 'feelgood', 'mid', 'stressed', 'work', 'hot', 'smooth', 'little', 'creamy', ['coffee']),
  'cappuccino': S('usual-spot', 'same-dish', 'jazz', 'classics', 'mid', 'happy', 'social', 'hot', 'balanced', 'little', 'creamy', ['chocolate', 'coffee']),
  'iced latte': S('usual-spot', 'same-dish', 'pop', 'romcom', 'mid', 'happy', 'work', 'iced', 'smooth', 'little', 'creamy', ['coffee']),
  'americano': S('errands', 'quickest', 'jazz', 'action', 'mid', 'focused', 'work', 'hot', 'balanced', 'none', 'black', ['coffee']),
  'kaapi': S('usual-spot', 'same-dish', 'lofi', 'feelgood', 'low', 'stressed', 'morning', 'hot', 'balanced', 'little', 'creamy', ['chocolate']),
  'cold coffee india': S('usual-spot', 'dessert-first', 'pop', 'romcom', 'mid', 'happy', 'treat', 'iced', 'smooth', 'sweet-tooth', 'creamy', ['chocolate']),
  'matcha': S('blanket', 'same-dish', 'lofi', 'feelgood', 'high', 'stressed', 'work', 'hot', 'smooth', 'little', 'creamy', ['earthy']),
  'dairy-free evening iced': S('new-place', 'cant-pronounce', 'pop', 'scifi', 'high', 'happy', 'evening', 'iced', 'smooth', 'little', 'creamy', ['vanilla'], true),
}

for (const [name, answers] of Object.entries(scenarios)) {
  const res = recommend(answers)
  const ranked = rankDrinks(buildContext(answers)).slice(0, 5)
  console.log(`\n■ ${name}  →  ${res.persona.name}`)
  console.log('  picks:', res.picks.map((p) => `${p.drink.name}${p.temp === 'iced' ? ' (iced)' : ''}`).join(' | '))
  console.log('  top5 :', ranked.map((r) => `${r.drink.id} ${r.score.toFixed(3)}`).join(', '))
  const top = res.picks[0]
  for (const r of top.reasons) console.log(`   ${r.pillar.padEnd(11)} ${r.text}`)
  if (top.tweaks.length) console.log('   tweaks:', top.tweaks.join('; '))
  if (top.roast) console.log('   roast:', top.roast.label)
}
