// Scoring engine: answers → persona, ranked drinks, three picks, reasons, tweaks, roast.
import { DRINKS, ROASTS } from '../data/drinks.js'
import { PERSONAS, PERSONA_ORDER } from '../data/personas.js'
import { QUESTIONS, PILLARS } from '../data/questions.js'

const ATTRS = ['caffeine', 'bitter', 'sweet', 'creamy', 'comfort', 'adventure', 'pace']
const SIGNATURE_BONUS = 0.04
const FLAVOUR_WEIGHT = 1.5
const PERSONA_ROAST = { purist: 1, explorer: 0, comfort: 2, indulger: 1.5, gogetter: 2 }

const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

function optionFor(questionId, answers) {
  const q = QUESTION_BY_ID[questionId]
  const value = answers[questionId]
  return q.options.find((o) => o.id === value)
}

/** Turn raw answers into everything the scorer needs. */
export function buildContext(answers) {
  const pillars = { personality: {}, mood: {}, taste: {} }
  const personaPoints = Object.fromEntries(PERSONA_ORDER.map((p) => [p, 0]))
  const ctx = {
    temp: 'either',
    lowCaffeine: false,
    dairyFree: Boolean(answers.dairyFree),
    flavours: Array.isArray(answers.flavours) ? answers.flavours : [],
    answers,
  }

  for (const q of QUESTIONS) {
    if (q.type === 'multi') continue
    const opt = optionFor(q.id, answers)
    if (!opt) throw new Error(`Missing answer for "${q.id}"`)
    for (const [attr, [t, w]] of Object.entries(opt.targets || {})) {
      const slot = (pillars[q.pillar][attr] ||= { sum: 0, w: 0 })
      slot.sum += t * w
      slot.w += w
    }
    for (const [p, pts] of Object.entries(opt.persona || {})) personaPoints[p] += pts
    if (opt.flags?.temp) ctx.temp = opt.flags.temp
    if (opt.flags?.lowCaffeine) ctx.lowCaffeine = true
  }
  if (ctx.flavours.length === 0) throw new Error('Pick at least one flavour')

  // Collapse to weighted-mean targets.
  ctx.targets = {}
  for (const [pillar, attrs] of Object.entries(pillars)) {
    ctx.targets[pillar] = {}
    for (const [attr, { sum, w }] of Object.entries(attrs)) {
      ctx.targets[pillar][attr] = { t: sum / w, w }
    }
  }

  ctx.persona = pickPersona(personaPoints, answers)
  return ctx
}

function pickPersona(points, answers) {
  const best = Math.max(...Object.values(points))
  const tied = PERSONA_ORDER.filter((p) => points[p] === best)
  if (tied.length === 1) return PERSONAS[tied[0]]
  // Tie-break: favourite movie, then restaurant, then Saturday, then playlist.
  for (const qid of ['movie', 'restaurant', 'saturday', 'playlist']) {
    const opt = optionFor(qid, answers)
    const winner = Object.keys(opt?.persona || {}).find((p) => tied.includes(p))
    if (winner) return PERSONAS[winner]
  }
  return PERSONAS[tied[0]]
}

export function isEligible(drink, ctx) {
  if (ctx.temp !== 'either' && !drink.temps.includes(ctx.temp)) return false
  if (ctx.dairyFree && drink.flags.dairyFree === false) return false
  if (ctx.lowCaffeine && drink.attrs.caffeine > 2 && !drink.flags.decaf) return false
  return true
}

function effectiveAttrs(drink, ctx) {
  if (ctx.lowCaffeine && drink.flags.decaf && drink.attrs.caffeine > 2) {
    return { ...drink.attrs, caffeine: 0.5 }
  }
  return drink.attrs
}

function flavourMatches(drink, ctx) {
  return drink.notes.filter((n) => ctx.flavours.includes(n))
}

function pillarFit(attrs, targets, extra) {
  let num = 0
  let den = 0
  for (const [attr, { t, w }] of Object.entries(targets)) {
    num += w * (1 - Math.abs(t - attrs[attr]) / 5)
    den += w
  }
  if (extra) {
    num += extra.w * extra.v
    den += extra.w
  }
  return den ? num / den : 0.5
}

export function scoreDrink(drink, ctx) {
  const attrs = effectiveAttrs(drink, ctx)
  const matches = flavourMatches(drink, ctx)
  const flavourValue = matches.length ? Math.min(1, 0.7 + 0.3 * matches.length) : 0
  const fits = {
    personality: pillarFit(attrs, ctx.targets.personality),
    mood: pillarFit(attrs, ctx.targets.mood),
    taste: pillarFit(attrs, ctx.targets.taste, { w: FLAVOUR_WEIGHT, v: flavourValue }),
  }
  let score =
    PILLARS.taste.weight * fits.taste +
    PILLARS.mood.weight * fits.mood +
    PILLARS.personality.weight * fits.personality
  if (ctx.persona.signature.includes(drink.id)) score += SIGNATURE_BONUS
  return { drink, score, fits, attrs, matches }
}

export function rankDrinks(ctx) {
  return DRINKS.filter((d) => isEligible(d, ctx))
    .map((d) => scoreDrink(d, ctx))
    .sort((a, b) => b.score - a.score || b.drink.avail - a.drink.avail || a.drink.id.localeCompare(b.drink.id))
}

/** Top pick, an available backup from another equipment family, and a safe bet any café can make. */
export function choosePicks(ranked) {
  const top = ranked[0]
  const rest = ranked.slice(1)
  // A backup from another equipment family is only worth it if it's still a good match.
  const closeEnough = (r) => r.score >= top.score - 0.15
  const backup =
    rest.find((r) => r.drink.family !== top.drink.family && r.drink.avail >= top.drink.avail && closeEnough(r)) ||
    rest.find((r) => r.drink.avail >= top.drink.avail) ||
    rest[0]
  const pool = rest.filter((r) => r !== backup)
  const everywhere = pool.filter((r) => r.drink.avail === 3)
  let safe = everywhere[0]
  if (top.drink.avail === 3) {
    // Top pick is already easy to find, so prefer variety, but never at the cost of a poor match.
    const families = [top.drink.family, backup.drink.family]
    safe = everywhere.find((r) => !families.includes(r.drink.family) && r.score >= top.score - 0.12) || safe
  }
  return [top, backup, safe || pool[0]]
}

export function servedTemp(drink, ctx) {
  return ctx.temp !== 'either' && drink.temps.includes(ctx.temp) ? ctx.temp : drink.temps[0]
}

// ── Explanations ─────────────────────────────────────────────
// Each pillar only explains itself with the attributes it owns, so a
// "Personality" line never talks about sugar and a "Taste" line never talks about mood.
const PHRASES = {
  personality: {
    adventure: {
      high: "You chase the new, and this isn't an everyday order.",
      mid: 'A fresh take on a familiar favourite.',
      low: 'You know what you like, and this is a true classic.',
    },
    pace: {
      high: 'You like to take your time, and this rewards slow sipping.',
      mid: 'Easy to enjoy at your own pace.',
      low: "You're always on the move, and this is quick to finish.",
    },
    comfort: {
      high: "You're a homebody at heart, and this tastes like home.",
      mid: 'Familiar, with a little warmth. Very you.',
      low: 'No fuss, all function. Very you.',
    },
  },
  mood: {
    caffeine: {
      high: 'Running low? This one packs a proper caffeine kick.',
      mid: 'Enough caffeine to keep you going without the jitters.',
      low: "You're already buzzing, so this keeps the caffeine gentle.",
    },
    comfort: {
      high: 'Comfort in a cup, for a day like today.',
      mid: 'Something warm and steady for today.',
      low: 'No fuss today, just good coffee.',
    },
    pace: {
      high: 'Made for lingering over a long chat or a long task.',
      mid: 'Not rushed, not lingering.',
      low: 'Quick to drink, so you can get on with your day.',
    },
  },
  taste: {
    bitter: {
      high: "You like it bold, and this one doesn't hold back.",
      mid: 'Balanced, with just a little edge.',
      low: 'Smooth and never bitter, the way you like it.',
    },
    sweet: {
      high: 'Sweet enough to keep your sweet tooth happy.',
      mid: 'Just a touch of sweetness.',
      low: 'No sugar rush. Clean and unsweetened.',
    },
    creamy: {
      high: 'Creamy and silky, as requested.',
      mid: 'A little milk to round it out.',
      low: 'No milk getting in the way of the coffee.',
    },
  },
}

const CRAVING = {
  chocolate: 'Hits your craving for chocolate.',
  nutty: 'Hits your craving for nutty, caramel notes.',
  fruity: 'Hits your craving for something bright and fruity.',
  spiced: 'Hits your craving for warm spice.',
  vanilla: 'Hits your craving for vanilla.',
  earthy: 'Hits your craving for earthy matcha.',
}

function level(t) {
  if (t >= 3.5) return 'high'
  if (t <= 1.5) return 'low'
  return 'mid'
}

function pillarReason(pillar, scored, ctx, used) {
  const targets = ctx.targets[pillar]
  const phrases = PHRASES[pillar]
  const candidates = Object.entries(targets)
    .filter(([attr]) => phrases[attr] && !used.has(attr))
    .map(([attr, { t, w }]) => {
      const match = 1 - Math.abs(t - scored.attrs[attr]) / 5
      return { attr, t, match, strength: w * match }
    })
    .filter((c) => c.match >= 0.7)
    .sort((a, b) => b.strength - a.strength)
  const pick = candidates[0]
  if (!pick) return null
  used.add(pick.attr)
  return phrases[pick.attr][level(pick.t)]
}

export function buildReasons(scored, ctx) {
  const used = new Set()
  const reasons = []
  const d = scored.drink

  // Taste first: a flavour match is the most convincing reason.
  let taste
  const fav = scored.matches.find((m) => m !== 'coffee')
  if (fav) taste = CRAVING[fav]
  else if (scored.matches.includes('coffee') && d.attrs.creamy <= 1 && d.attrs.sweet <= 1) {
    taste = 'Pure coffee, nothing added, just as you asked.'
  } else {
    taste = pillarReason('taste', scored, ctx, used) || 'Built around the flavours you picked.'
  }
  reasons.push({ pillar: 'Taste', text: taste })

  let mood
  if (ctx.lowCaffeine) {
    mood =
      scored.drink.attrs.caffeine > 2
        ? "It's after dinner, so make it decaf and sleep easy."
        : "It's after dinner, so we kept the caffeine low."
    used.add('caffeine')
  } else {
    mood = pillarReason('mood', scored, ctx, used) || 'Right for how today is going.'
  }
  reasons.push({ pillar: 'Mood', text: mood })

  const short = ctx.persona.name.replace('The ', '')
  const article = /^[AEIOU]/.test(short) ? 'An' : 'A'
  const personality = pillarReason('personality', scored, ctx, used) || `${article} ${short} pick, through and through.`
  reasons.push({ pillar: 'Personality', text: personality })

  // Display order: personality, mood, taste.
  return [reasons[2], reasons[1], reasons[0]]
}

export function buildTweaks(drink, ctx) {
  const tweaks = []
  const mood = ctx.targets.mood
  const taste = ctx.targets.taste
  const f = drink.flags
  const sweetT = taste.sweet?.t ?? 2.5
  const creamyT = taste.creamy?.t ?? 2.5
  const bitterT = taste.bitter?.t ?? 2.5

  if (ctx.dairyFree && f.hasMilk && f.dairyFree) tweaks.push('Make it with oat milk')
  if (ctx.lowCaffeine && drink.attrs.caffeine > 2 && f.decaf) {
    tweaks.push(f.manual ? 'Brew it with decaf beans' : 'Ask for decaf')
  }
  if (!ctx.lowCaffeine && (mood.caffeine?.t ?? 0) >= 4.5 && f.espresso && drink.attrs.caffeine <= 3) {
    tweaks.push('Add an extra shot')
  }
  if (sweetT <= 0.5 && drink.attrs.sweet >= 3 && f.sweetAdjust) tweaks.push('Ask for it half sweet')
  if (sweetT >= 4 && drink.attrs.sweet <= 1 && f.syrupable) {
    const syrup = ctx.flavours.includes('vanilla') ? 'vanilla' : ctx.flavours.includes('nutty') ? 'caramel' : 'vanilla'
    tweaks.push(`Add a pump of ${syrup} syrup`)
  }
  if (f.coldFoam && servedTemp(drink, ctx) === 'iced' && (creamyT >= 2 || sweetT >= 3)) {
    tweaks.push('Top it with cold foam')
  }
  if (bitterT <= 0.5 && drink.attrs.bitter >= 3 && f.hasMilk) tweaks.push('Ask for an extra splash of milk')
  return tweaks.slice(0, 2)
}

/** Roast recommendation: manual brews only. */
export function buildRoast(drink, ctx) {
  if (!drink.flags.manual) return null
  const bitter = optionFor('bitterness', ctx.answers).roast
  const flavourOpts = QUESTION_BY_ID.flavours.options.filter((o) => ctx.flavours.includes(o.id))
  const flavour = flavourOpts.reduce((s, o) => s + o.roast, 0) / flavourOpts.length
  const milk = optionFor('milk', ctx.answers).roast
  const persona = PERSONA_ROAST[ctx.persona.id]
  let r = 0.6 * ((bitter + flavour) / 2) + 0.2 * milk + 0.2 * persona
  const [lo, hi] = drink.roastRange
  r = Math.min(hi, Math.max(lo, r))
  const key = r < 0.67 ? 'light' : r < 1.34 ? 'medium' : 'dark'
  return { key, ...ROASTS[key] }
}

export function funLine(drink, ctx) {
  const opt = optionFor('movie', ctx.answers)
  return opt?.funLine ? opt.funLine.replace('{drink}', drink.name) : null
}

/** Everything the result screen needs, in one call. */
export function recommend(answers) {
  const ctx = buildContext(answers)
  const ranked = rankDrinks(ctx)
  if (ranked.length < 3) throw new Error('Not enough eligible drinks')
  const picks = choosePicks(ranked).map((scored, i) => {
    const drink = scored.drink
    return {
      rank: i,
      drink,
      score: scored.score,
      temp: servedTemp(drink, ctx),
      reasons: buildReasons(scored, ctx),
      tweaks: buildTweaks(drink, ctx),
      roast: buildRoast(drink, ctx),
      funLine: funLine(drink, ctx),
    }
  })
  return { persona: ctx.persona, picks, ctx }
}

export { ATTRS }
