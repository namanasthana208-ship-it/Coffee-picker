// The 12-question quiz, grouped into three pillars.
//
// Each option nudges that pillar's target profile. A target is
// `attribute: [value 0-5, weight]`. The engine takes the weighted
// mean per attribute inside a pillar, then scores drinks against it.
// Attributes: caffeine, bitter, sweet, creamy, comfort, adventure, pace
// (pace: 0 = quick shot, 5 = slow sip).

export const PILLARS = {
  personality: { label: 'Personality', weight: 0.2 },
  mood: { label: 'Current mood', weight: 0.35 },
  taste: { label: 'Taste', weight: 0.45 },
}

export const QUESTIONS = [
  // ── Personality ──────────────────────────────────────────────
  {
    id: 'saturday',
    pillar: 'personality',
    title: 'A free Saturday looks like…',
    options: [
      { id: 'new-place', label: 'Trying a new place', targets: { adventure: [5, 1] }, persona: { explorer: 2 } },
      { id: 'usual-spot', label: 'My usual spot, my usual people', targets: { adventure: [0.5, 1], comfort: [3.5, 0.4] }, persona: { purist: 1, comfort: 1 } },
      { id: 'blanket', label: 'Blanket, series, do not disturb', targets: { comfort: [5, 1], pace: [4.5, 0.6] }, persona: { comfort: 2 } },
      { id: 'errands', label: 'Errands done by 10am', targets: { pace: [0.5, 1], caffeine: [4, 0.4] }, persona: { gogetter: 2 } },
    ],
  },
  {
    id: 'restaurant',
    pillar: 'personality',
    title: 'At a restaurant, you…',
    options: [
      { id: 'cant-pronounce', label: "Order the thing you can't pronounce", targets: { adventure: [5, 1.2] }, persona: { explorer: 2 } },
      { id: 'same-dish', label: 'Get the same dish every time', targets: { adventure: [0, 1.2] }, persona: { purist: 2 } },
      { id: 'dessert-first', label: 'Check the dessert menu first', targets: { sweet: [4.5, 0.8], comfort: [4, 0.5] }, persona: { indulger: 2 } },
      { id: 'quickest', label: "Pick whatever's quickest", targets: { pace: [0.5, 1] }, persona: { gogetter: 2 } },
    ],
  },
  {
    id: 'playlist',
    pillar: 'personality',
    title: 'Pick a playlist.',
    options: [
      { id: 'jazz', label: 'Jazz and classical', targets: { bitter: [4, 0.5], pace: [4, 0.6], adventure: [3, 0.3] }, persona: { purist: 2 } },
      { id: 'lofi', label: 'Lo-fi beats', targets: { comfort: [4, 0.6], bitter: [1.5, 0.3], pace: [3.5, 0.4] }, persona: { comfort: 2 } },
      { id: 'pop', label: 'Pop hits', targets: { sweet: [4, 0.6], adventure: [2, 0.3] }, persona: { indulger: 2 } },
      { id: 'techno', label: 'Techno and rap', targets: { caffeine: [4.5, 0.6], bitter: [4, 0.4] }, persona: { gogetter: 1, explorer: 1 } },
    ],
  },
  {
    id: 'movie',
    pillar: 'personality',
    title: 'Favourite movie genre?',
    options: [
      { id: 'action', label: 'Action and thrillers', targets: { caffeine: [4, 0.5], pace: [1, 0.5] }, persona: { gogetter: 2 }, funLine: 'Action-movie energy. The {drink} gets you to the next scene fast.' },
      { id: 'scifi', label: 'Sci-fi, indie, foreign films', targets: { adventure: [4.5, 0.8] }, persona: { explorer: 2 }, funLine: 'A sci-fi fan ordering a {drink}? Feels right. Slightly futuristic.' },
      { id: 'classics', label: 'Classics, noir, drama', targets: { adventure: [1, 0.6], bitter: [3.5, 0.3] }, persona: { purist: 2 }, funLine: 'Classics fan. The {drink} has never once gone out of style.' },
      { id: 'romcom', label: 'Rom-coms and musicals', targets: { sweet: [4.5, 0.6], creamy: [4, 0.4] }, persona: { indulger: 2 }, funLine: 'Rom-com heart. The {drink} is basically a meet-cute in a cup.' },
      { id: 'feelgood', label: 'Animation and comfort rewatches', targets: { comfort: [4.5, 0.7] }, persona: { comfort: 2 }, funLine: 'Comfort rewatcher. The {drink} is the cosy sequel you needed.' },
    ],
  },

  // ── Mood ─────────────────────────────────────────────────────
  {
    id: 'battery',
    pillar: 'mood',
    title: 'Battery level?',
    options: [
      { id: 'low', label: '10%', sub: 'Running on fumes', targets: { caffeine: [5, 1.5] } },
      { id: 'mid', label: '50%', sub: 'Getting by', targets: { caffeine: [3, 1] } },
      { id: 'high', label: '90%', sub: 'Already buzzing', targets: { caffeine: [1.5, 1] } },
    ],
  },
  {
    id: 'feeling',
    pillar: 'mood',
    title: 'How are you feeling?',
    options: [
      { id: 'stressed', label: 'Stressed', targets: { comfort: [4, 1], caffeine: [2.5, 0.5] } },
      { id: 'happy', label: 'Happy', targets: { adventure: [3, 0.4], sweet: [3, 0.3] } },
      { id: 'low', label: 'A bit low', targets: { comfort: [5, 1], sweet: [4, 0.8] } },
      { id: 'focused', label: 'Locked in', targets: { caffeine: [4, 0.8], pace: [1, 0.5], creamy: [1.5, 0.4] } },
    ],
  },
  {
    id: 'occasion',
    pillar: 'mood',
    title: "What's this coffee for?",
    options: [
      { id: 'morning', label: 'Morning kickstart', targets: { caffeine: [4, 1], pace: [1.5, 0.5] } },
      { id: 'work', label: 'A long work session', targets: { caffeine: [3.5, 0.8], pace: [4, 0.6] } },
      { id: 'treat', label: 'An afternoon treat', targets: { sweet: [4, 1], comfort: [4, 0.6] } },
      { id: 'evening', label: 'After dinner', targets: { caffeine: [0, 2] }, flags: { lowCaffeine: true } },
      { id: 'social', label: 'Catching up with someone', targets: { pace: [4.5, 0.8], comfort: [3.5, 0.5] } },
    ],
  },
  {
    id: 'temp',
    pillar: 'mood',
    title: 'Hot or iced right now?',
    options: [
      { id: 'hot', label: 'Hot', targets: {}, flags: { temp: 'hot' } },
      { id: 'iced', label: 'Iced', targets: {}, flags: { temp: 'iced' } },
      { id: 'either', label: 'Either works', targets: {}, flags: { temp: 'either' } },
    ],
  },

  // ── Taste ────────────────────────────────────────────────────
  {
    id: 'bitterness',
    pillar: 'taste',
    title: 'How do you feel about bitterness?',
    options: [
      { id: 'bold', label: 'Love it bold', targets: { bitter: [5, 1.2] }, roast: 2 },
      { id: 'balanced', label: 'Balanced', targets: { bitter: [2.5, 1] }, roast: 1 },
      { id: 'smooth', label: 'Hate bitter', targets: { bitter: [0.5, 1.5] }, roast: 0 },
    ],
  },
  {
    id: 'sweetness',
    pillar: 'taste',
    title: 'Sweetness?',
    options: [
      { id: 'none', label: 'None at all', targets: { sweet: [0, 1.2] } },
      { id: 'little', label: 'A little', targets: { sweet: [2, 1] } },
      { id: 'sweet-tooth', label: 'Sweet tooth', targets: { sweet: [4.5, 1.2] } },
    ],
  },
  {
    id: 'milk',
    pillar: 'taste',
    type: 'milk',
    title: 'How do you take your milk?',
    options: [
      { id: 'black', label: 'Black', sub: 'No milk', targets: { creamy: [0, 1.5] }, roast: 0.5 },
      { id: 'splash', label: 'A splash', targets: { creamy: [2, 1] }, roast: 1 },
      { id: 'creamy', label: 'Creamy', targets: { creamy: [4.5, 1.3] }, roast: 2 },
    ],
  },
  {
    id: 'flavours',
    pillar: 'taste',
    type: 'multi',
    title: 'Flavours you love?',
    hint: 'Pick as many as you like.',
    options: [
      { id: 'chocolate', label: 'Chocolate', roast: 2 },
      { id: 'nutty', label: 'Nutty and caramel', roast: 2 },
      { id: 'fruity', label: 'Fruity', roast: 0 },
      { id: 'spiced', label: 'Spiced', roast: 2 },
      { id: 'vanilla', label: 'Vanilla', roast: 1 },
      { id: 'earthy', label: 'Earthy, matcha', roast: 1 },
      { id: 'coffee', label: 'Just coffee', roast: 1 },
    ],
  },
]

// Short interlude cards shown after a pillar is complete (index = question just answered).
export const INTERLUDES = {
  3: { kicker: 'Personality: noted', line: "Now, how's today going?" },
  7: { kicker: 'Mood: logged', line: 'Last up, your taste.' },
}

export const FLAVOUR_LABELS = Object.fromEntries(
  QUESTIONS.find((q) => q.id === 'flavours').options.map((o) => [o.id, o.label.toLowerCase()]),
)
