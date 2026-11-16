// The five coffee personas. Numbered like batch stamps on a bean bag.
export const PERSONAS = {
  purist: {
    id: 'purist',
    no: '01',
    name: 'The Purist',
    line: 'Nothing to hide. You like coffee that tastes like coffee.',
    signature: ['espresso', 'ristretto', 'macchiato', 'americano', 'v60', 'turkish'],
  },
  explorer: {
    id: 'explorer',
    no: '02',
    name: 'The Explorer',
    line: "First in line for the thing nobody's tried yet.",
    signature: ['espresso-tonic', 'dirty-matcha', 'vietnamese-iced', 'einspanner', 'dirty-chai', 'v60', 'siphon'],
  },
  comfort: {
    id: 'comfort',
    no: '03',
    name: 'The Comfort Seeker',
    line: 'Warm hands, slow sips, zero drama.',
    signature: ['latte', 'flat-white', 'cappuccino', 'filter-kaapi', 'cardamom-latte', 'matcha-latte', 'hot-chocolate'],
  },
  indulger: {
    id: 'indulger',
    no: '04',
    name: 'The Indulger',
    line: "Life's short. Order the one with whipped cream.",
    signature: ['mocha', 'spanish-latte', 'tiramisu-latte', 'affogato', 'indian-cold-coffee', 'dalgona', 'strawberry-matcha'],
  },
  gogetter: {
    id: 'gogetter',
    no: '05',
    name: 'The Go-Getter',
    line: 'Caffeine is a tool, and you have places to be.',
    signature: ['americano', 'cold-brew', 'nitro-cold-brew', 'cortado', 'flat-white', 'moka'],
  },
}

export const PERSONA_ORDER = ['purist', 'explorer', 'comfort', 'indulger', 'gogetter']
