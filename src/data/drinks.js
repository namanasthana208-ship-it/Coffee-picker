// The 36-drink menu.
//
// attrs (0-5): caffeine, bitter, sweet, creamy, comfort, adventure, pace
// avail: 3 = everywhere, 2 = most specialty cafés, 1 = rare
// family: the equipment a café needs (espresso, brew, cold, matcha, chocolate, traditional)
// temps: the first entry is the default when the user says "either"
// scene: recipe for the pour animation (per temperature), or `brew` for manual brews.
//   Heights (h) are fractions of the vessel's inner height.

export const C = {
  espresso: '#3B2116',
  americano: '#4B2C1B',
  water: '#D7E1DF',
  steamedMilk: '#EADBC4',
  coldMilk: '#EFE5D6',
  foam: '#F7EFE2',
  choc: '#4A2416',
  hotChoc: '#5C3121',
  chocFoam: '#E9D6C1',
  caramel: '#B8732C',
  coldBrew: '#2A160C',
  nitroHead: '#D2AA7E',
  tonic: '#DCEAE4',
  condensed: '#F3E3C0',
  chai: '#B9824F',
  cardamomMilk: '#E8D6B8',
  mascarpone: '#F3E6CC',
  cocoa: '#5A3424',
  cinnamon: '#9A5A32',
  cardamom: '#7E8F5A',
  decoction: '#2E1A10',
  kaapiMix: '#B88D63',
  kaapiFroth: '#E6CFAA',
  turkish: '#2A170D',
  turkishFoam: '#8C5D38',
  whip: '#FBF6EC',
  dalgona: '#C68A4F',
  indianCold: '#BE9068',
  indianFroth: '#E2CBAA',
  matcha: '#7C9E53',
  matchaMilk: '#B9C98F',
  matchaFoam: '#E5EBD3',
  strawberry: '#E7A2A6',
}

const ESPRESSO_SHOT = (h, extra = {}) => ({ t: 'pour', via: 'shot', color: C.espresso, h, crema: true, ...extra })

export const DRINKS = [
  // ── Classics ────────────────────────────────────────────────
  {
    id: 'espresso', name: 'Espresso', group: 'classic', family: 'espresso', avail: 3, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 5, sweet: 0, creamy: 0, comfort: 1, adventure: 1, pace: 0 },
    notes: ['coffee', 'chocolate'], flags: { espresso: true, decaf: true, dairyFree: true },
    short: 'A concentrated shot. Pure, intense, gone in three sips.',
    tip: 'No machine? A Moka pot or a strong AeroPress gets you close.',
    scene: { hot: { vessel: 'demitasse', steam: true, steps: [ESPRESSO_SHOT(0.62)] } },
  },
  {
    id: 'ristretto', name: 'Ristretto', group: 'classic', family: 'espresso', avail: 2, temps: ['hot'],
    attrs: { caffeine: 3, bitter: 4, sweet: 1, creamy: 0, comfort: 1, adventure: 2, pace: 0 },
    notes: ['coffee', 'chocolate'], flags: { espresso: true, decaf: true, dairyFree: true },
    short: 'A shorter, sweeter, more syrupy shot.',
    tip: 'Pull a normal shot but stop it early, around 15 to 20ml.',
    scene: { hot: { vessel: 'demitasse', steam: true, steps: [ESPRESSO_SHOT(0.4)] } },
  },
  {
    id: 'americano', name: 'Americano', group: 'classic', family: 'espresso', avail: 3, temps: ['hot', 'iced'],
    attrs: { caffeine: 4, bitter: 3, sweet: 0, creamy: 0, comfort: 2, adventure: 1, pace: 3 },
    notes: ['coffee'], flags: { espresso: true, decaf: true, dairyFree: true, syrupable: true, coldFoam: true },
    short: 'Espresso lengthened with water. Clean, long and easy.',
    tip: 'Add hot water to a double shot, roughly two parts water to one coffee.',
    scene: {
      hot: { vessel: 'mug', steam: true, steps: [ESPRESSO_SHOT(0.24), { t: 'mix', via: 'kettle', to: C.americano, h: 0.5 }] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'carafe', color: C.water, alpha: 0.4, h: 0.58 }, ESPRESSO_SHOT(0.18, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'macchiato', name: 'Macchiato', group: 'classic', family: 'espresso', avail: 2, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 4, sweet: 0, creamy: 1, comfort: 1, adventure: 1, pace: 0 },
    notes: ['coffee'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true },
    short: 'Espresso, marked with a dollop of foam.',
    tip: 'Spoon a small cap of frothed milk onto a double shot.',
    scene: { hot: { vessel: 'demitasse', steam: true, steps: [ESPRESSO_SHOT(0.56), { t: 'pour', via: 'pitcher', color: C.foam, h: 0.12, foam: true, dome: 6 }] } },
  },
  {
    id: 'cortado', name: 'Cortado', group: 'classic', family: 'espresso', avail: 2, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 3, sweet: 1, creamy: 2, comfort: 3, adventure: 2, pace: 1 },
    notes: ['coffee', 'nutty'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, syrupable: true },
    short: 'Espresso cut with an equal splash of warm milk.',
    tip: 'Equal parts double shot and steamed milk, with very little foam.',
    scene: { hot: { vessel: 'gibraltar', steam: true, steps: [ESPRESSO_SHOT(0.4, { crema: false }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.4, blend: 12 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.07, foam: true }] } },
  },
  {
    id: 'flat-white', name: 'Flat White', group: 'classic', family: 'espresso', avail: 2, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 3, sweet: 1, creamy: 3, comfort: 4, adventure: 1, pace: 2 },
    notes: ['coffee', 'nutty'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, syrupable: true },
    short: 'A double shot under silky, glossy microfoam.',
    tip: 'Steam milk until glossy rather than foamy, then pour it into a double shot.',
    scene: { hot: { vessel: 'cup', steam: true, steps: [ESPRESSO_SHOT(0.3, { crema: false }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.48, blend: 14 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.07, foam: true }] } },
  },
  {
    id: 'cappuccino', name: 'Cappuccino', group: 'classic', family: 'espresso', avail: 3, temps: ['hot'],
    attrs: { caffeine: 3, bitter: 2, sweet: 1, creamy: 4, comfort: 4, adventure: 0, pace: 3 },
    notes: ['coffee', 'chocolate'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, syrupable: true },
    short: 'Equal thirds: espresso, steamed milk and airy foam.',
    tip: 'Froth hot milk by pumping it in a French press, then spoon it over a shot.',
    scene: { hot: { vessel: 'cup', steam: true, steps: [ESPRESSO_SHOT(0.28, { crema: false }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.28, blend: 12 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.28, foam: true, dome: 13 }, { t: 'dust', color: C.cocoa }] } },
  },
  {
    id: 'latte', name: 'Latte', group: 'classic', family: 'espresso', avail: 3, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 1, sweet: 1, creamy: 5, comfort: 5, adventure: 0, pace: 3 },
    notes: ['coffee', 'nutty'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, syrupable: true },
    short: 'Espresso in plenty of steamed milk with a thin cap of foam.',
    tip: 'One shot to roughly 200ml of steamed milk.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [ESPRESSO_SHOT(0.2, { crema: false }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.58, blend: 16 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.1, foam: true }] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.6 }, ESPRESSO_SHOT(0.2, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'flavoured-latte', name: 'Flavoured Latte', group: 'classic', family: 'espresso', avail: 3, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 1, sweet: 4, creamy: 4, comfort: 4, adventure: 0, pace: 3 },
    notes: ['vanilla', 'nutty'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'A latte with a pump of caramel, vanilla or hazelnut.',
    tip: 'Stir a spoon of caramel or vanilla syrup into the shot before the milk.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [{ t: 'pour', via: 'pump', color: C.caramel, h: 0.07 }, ESPRESSO_SHOT(0.18, { crema: false, blend: 8 }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.52, blend: 16 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.1, foam: true }] },
      iced: { vessel: 'highball', steps: [{ t: 'pour', via: 'pump', color: C.caramel, h: 0.06 }, { t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.55, blend: 8 }, ESPRESSO_SHOT(0.18, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'mocha', name: 'Mocha', group: 'classic', family: 'espresso', avail: 3, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 1, sweet: 4, creamy: 4, comfort: 5, adventure: 1, pace: 3 },
    notes: ['chocolate'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: "Espresso, chocolate and steamed milk. Dessert's best friend.",
    tip: 'Melt a square of dark chocolate into the shot before adding the milk.',
    scene: {
      hot: { vessel: 'mug', steam: true, steps: [{ t: 'pour', via: 'pump', color: C.choc, h: 0.12 }, ESPRESSO_SHOT(0.2, { crema: false, blend: 8 }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.42, blend: 16 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.1, foam: true }, { t: 'dust', color: C.cocoa }] },
      iced: { vessel: 'highball', steps: [{ t: 'pour', via: 'pump', color: C.choc, h: 0.1 }, { t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.5, blend: 8 }, ESPRESSO_SHOT(0.18, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'cold-brew', name: 'Cold Brew', group: 'classic', family: 'cold', avail: 3, temps: ['iced'],
    attrs: { caffeine: 5, bitter: 2, sweet: 0, creamy: 0, comfort: 2, adventure: 2, pace: 3 },
    notes: ['chocolate', 'coffee'], flags: { dairyFree: true, syrupable: true, coldFoam: true },
    short: 'Steeped cold for 12 to 24 hours. Smooth, low-acid, strong.',
    tip: 'Steep coarse grounds in cold water (1:8) in the fridge overnight, then strain.',
    scene: { iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'carafe', color: C.coldBrew, h: 0.76 }] } },
  },
  {
    id: 'affogato', name: 'Affogato', group: 'classic', family: 'espresso', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 2, sweet: 4, creamy: 3, comfort: 3, adventure: 3, pace: 1 },
    notes: ['vanilla'], flags: { espresso: true, decaf: true, dairyFree: false },
    short: 'A scoop of vanilla gelato, drowned in hot espresso.',
    tip: 'Pour a hot double shot over one scoop of good vanilla ice cream.',
    scene: { hot: { vessel: 'bowl', steps: [{ t: 'scoop' }, ESPRESSO_SHOT(0.34, { crema: false })] } },
  },

  // ── Specialty ───────────────────────────────────────────────
  {
    id: 'nitro-cold-brew', name: 'Nitro Cold Brew', group: 'specialty', family: 'cold', avail: 2, temps: ['iced'],
    attrs: { caffeine: 5, bitter: 2, sweet: 1, creamy: 2, comfort: 2, adventure: 3, pace: 3 },
    notes: ['chocolate', 'coffee'], flags: { dairyFree: true },
    short: 'Cold brew charged with nitrogen. Creamy, without any milk.',
    tip: 'Shake cold brew hard in a sealed jar for a nitro-style foam.',
    scene: { iced: { vessel: 'highball', steps: [{ t: 'pour', via: 'tap', color: C.coldBrew, h: 0.72, cascade: true }, { t: 'pour', via: 'tap', color: C.nitroHead, h: 0.1, foam: true }] } },
  },
  {
    id: 'espresso-tonic', name: 'Espresso Tonic', group: 'specialty', family: 'espresso', avail: 1, temps: ['iced'],
    attrs: { caffeine: 4, bitter: 3, sweet: 2, creamy: 0, comfort: 1, adventure: 5, pace: 2 },
    notes: ['fruity', 'coffee'], flags: { espresso: true, decaf: true, dairyFree: true },
    short: 'Espresso floated over tonic and ice. Bright, bitter-sweet, fizzy.',
    tip: 'Pour a shot slowly over ice and 150ml of tonic. Add a twist of orange.',
    scene: { iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'bottle', color: C.tonic, alpha: 0.5, h: 0.6, bubbles: true }, ESPRESSO_SHOT(0.18, { crema: false, cloud: true, blend: 26 })] } },
  },
  {
    id: 'spanish-latte', name: 'Spanish Latte', group: 'specialty', family: 'espresso', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 1, sweet: 4, creamy: 5, comfort: 4, adventure: 2, pace: 3 },
    notes: ['vanilla'], flags: { espresso: true, decaf: true, dairyFree: false, hasMilk: true, sweetAdjust: true },
    short: 'A latte sweetened with condensed milk. Silky and rich.',
    tip: 'Stir a tablespoon of condensed milk into the shot, then add the milk.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [{ t: 'pour', via: 'pump', color: C.condensed, h: 0.12 }, ESPRESSO_SHOT(0.2, { crema: false, blend: 8 }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.46, blend: 16 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.08, foam: true }] },
      iced: { vessel: 'highball', steps: [{ t: 'pour', via: 'pump', color: C.condensed, h: 0.1 }, { t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.5, blend: 8 }, ESPRESSO_SHOT(0.18, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'vietnamese-iced', name: 'Vietnamese Iced Coffee', group: 'specialty', family: 'traditional', avail: 1, temps: ['iced'],
    attrs: { caffeine: 5, bitter: 3, sweet: 4, creamy: 3, comfort: 3, adventure: 3, pace: 3 },
    notes: ['chocolate'], flags: { dairyFree: false, hasMilk: true, sweetAdjust: true },
    short: 'Strong phin-dripped coffee over sweet condensed milk and ice.',
    tip: 'Brew very strong coffee over two spoons of condensed milk, stir, pour over ice.',
    scene: { iced: { vessel: 'highball', steps: [{ t: 'pour', via: 'pump', color: C.condensed, h: 0.16 }, { t: 'ice', n: 6 }, { t: 'pour', via: 'carafe', color: C.coldBrew, h: 0.54, blend: 8 }] } },
  },
  {
    id: 'einspanner', name: 'Einspänner', group: 'specialty', family: 'espresso', avail: 1, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 3, sweet: 2, creamy: 3, comfort: 3, adventure: 4, pace: 3 },
    notes: ['vanilla', 'coffee'], flags: { espresso: true, decaf: true, dairyFree: false, hasMilk: true },
    short: 'Viennese coffee crowned with a thick cap of cold whipped cream.',
    tip: 'Lightly whip cream with a little sugar and spoon it over a strong Americano.',
    scene: { hot: { vessel: 'mug', steam: true, steps: [ESPRESSO_SHOT(0.24, { crema: false }), { t: 'mix', via: 'kettle', to: C.americano, h: 0.36 }, { t: 'dollop', color: C.whip, size: 1 }] } },
  },
  {
    id: 'turkish', name: 'Turkish Coffee', group: 'specialty', family: 'traditional', avail: 1, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 4, sweet: 2, creamy: 0, comfort: 2, adventure: 4, pace: 2 },
    notes: ['spiced', 'coffee'], flags: { dairyFree: true },
    short: 'Unfiltered, finely ground, simmered in a cezve. Often with cardamom.',
    tip: 'Simmer very fine coffee, water and sugar in a small pot until it foams up.',
    scene: { hot: { vessel: 'turkish', steam: true, steps: [{ t: 'pour', via: 'cezve', color: C.turkish, h: 0.72 }, { t: 'pour', via: 'cezve', color: C.turkishFoam, h: 0.14, foam: true, dome: 3 }] } },
  },
  {
    id: 'dirty-chai', name: 'Dirty Chai', group: 'specialty', family: 'espresso', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 4, bitter: 1, sweet: 3, creamy: 4, comfort: 4, adventure: 3, pace: 3 },
    notes: ['spiced'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'A spiced chai latte with a shot of espresso. The best of both.',
    tip: 'Add a shot of espresso to a strong masala chai.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [{ t: 'pour', via: 'pitcher', color: C.chai, h: 0.52 }, ESPRESSO_SHOT(0.16, { crema: false, blend: 16 }), { t: 'pour', via: 'pitcher', color: C.foam, h: 0.1, foam: true }, { t: 'dust', color: C.cinnamon }] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.chai, h: 0.54 }, ESPRESSO_SHOT(0.16, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'cardamom-latte', name: 'Cardamom Latte', group: 'specialty', family: 'espresso', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 1, sweet: 3, creamy: 4, comfort: 5, adventure: 3, pace: 3 },
    notes: ['spiced'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'A latte warmed with crushed green cardamom.',
    tip: 'Crush two cardamom pods into the milk as it heats, then strain.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [ESPRESSO_SHOT(0.2, { crema: false }), { t: 'pour', via: 'pitcher', color: C.cardamomMilk, h: 0.52, blend: 16 }, { t: 'pour', via: 'pitcher', color: C.foam, h: 0.1, foam: true }, { t: 'dust', color: C.cardamom }] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.cardamomMilk, h: 0.55 }, ESPRESSO_SHOT(0.18, { crema: false, cloud: true, blend: 22 })] },
    },
  },
  {
    id: 'tiramisu-latte', name: 'Tiramisu Latte', group: 'specialty', family: 'espresso', avail: 1, temps: ['hot', 'iced'],
    attrs: { caffeine: 3, bitter: 1, sweet: 5, creamy: 5, comfort: 4, adventure: 3, pace: 3 },
    notes: ['chocolate', 'vanilla'], flags: { espresso: true, decaf: true, dairyFree: false, hasMilk: true, sweetAdjust: true },
    short: 'Dessert in a glass: espresso, mascarpone cream and cocoa.',
    tip: 'Whip mascarpone with milk and sugar, float it on a latte, dust with cocoa.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [ESPRESSO_SHOT(0.2, { crema: false }), { t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.4, blend: 16 }, { t: 'pour', via: 'pitcher', color: C.mascarpone, h: 0.16, foam: true, dome: 4 }, { t: 'dust', color: C.cocoa }] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 5 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.44 }, ESPRESSO_SHOT(0.16, { crema: false, cloud: true, blend: 20 }), { t: 'pour', via: 'pitcher', color: C.mascarpone, h: 0.14, foam: true, dome: 3 }, { t: 'dust', color: C.cocoa }] },
    },
  },

  // ── India ───────────────────────────────────────────────────
  {
    id: 'filter-kaapi', name: 'Filter Kaapi', group: 'india', family: 'traditional', avail: 2, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 3, sweet: 3, creamy: 4, comfort: 5, adventure: 2, pace: 2 },
    notes: ['chocolate', 'coffee'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'South Indian coffee-chicory decoction with boiled milk, pulled frothy.',
    tip: 'Mix strong decoction with hot milk and sugar, then pour between two cups to froth.',
    scene: { hot: { vessel: 'tumbler', steam: true, steps: [{ t: 'pour', via: 'carafe', color: C.decoction, h: 0.3 }, { t: 'mix', via: 'pull', to: C.kaapiMix, h: 0.5 }, { t: 'pour', via: 'pull', color: C.kaapiFroth, h: 0.16, foam: true, dome: 8 }] } },
  },
  {
    id: 'indian-cold-coffee', name: 'Indian Cold Coffee', group: 'india', family: 'traditional', avail: 3, temps: ['iced'],
    attrs: { caffeine: 2, bitter: 1, sweet: 5, creamy: 5, comfort: 4, adventure: 1, pace: 3 },
    notes: ['chocolate', 'vanilla'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'Coffee, milk, sugar and ice blended thick and frothy. A café classic.',
    tip: 'Blend instant coffee, sugar, cold milk and ice until frothy.',
    scene: { iced: { vessel: 'highball', steps: [{ t: 'ice', n: 3 }, { t: 'pour', via: 'pitcher', color: C.indianCold, h: 0.62 }, { t: 'pour', via: 'pitcher', color: C.indianFroth, h: 0.14, foam: true, dome: 5 }] } },
  },
  {
    id: 'dalgona', name: 'Dalgona', group: 'india', family: 'traditional', avail: 1, temps: ['iced', 'hot'],
    attrs: { caffeine: 3, bitter: 2, sweet: 4, creamy: 4, comfort: 3, adventure: 4, pace: 3 },
    notes: ['nutty'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'Clouds of whipped coffee spooned over milk.',
    tip: 'Whisk equal parts instant coffee, sugar and hot water until stiff, then spoon over milk.',
    scene: {
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 5 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.56 }, { t: 'dollop', color: C.dalgona, size: 1.05, style: 'cloud' }] },
      hot: { vessel: 'mug', steam: true, steps: [{ t: 'pour', via: 'pitcher', color: C.steamedMilk, h: 0.56 }, { t: 'dollop', color: C.dalgona, size: 1.05, style: 'cloud' }] },
    },
  },

  // ── Matcha ──────────────────────────────────────────────────
  {
    id: 'matcha-latte', name: 'Matcha Latte', group: 'matcha', family: 'matcha', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 2, bitter: 2, sweet: 2, creamy: 4, comfort: 4, adventure: 2, pace: 3 },
    notes: ['earthy'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true, syrupable: true },
    short: 'Whisked matcha with steamed milk. Earthy, calm, gently energising.',
    tip: 'Whisk 2g of matcha with a splash of hot (not boiling) water, then add milk.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [{ t: 'pour', via: 'pitcher', color: C.matcha, h: 0.2 }, { t: 'mix', via: 'pitcher', to: C.matchaMilk, h: 0.52 }, { t: 'pour', via: 'pitcher', color: C.matchaFoam, h: 0.1, foam: true }] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.55 }, { t: 'pour', via: 'pitcher', color: C.matcha, h: 0.2, cloud: true, blend: 22 }] },
    },
  },
  {
    id: 'dirty-matcha', name: 'Dirty Matcha', group: 'matcha', family: 'matcha', avail: 1, temps: ['hot', 'iced'],
    attrs: { caffeine: 4, bitter: 2, sweet: 2, creamy: 4, comfort: 3, adventure: 4, pace: 3 },
    notes: ['earthy'], flags: { espresso: true, decaf: true, dairyFree: true, hasMilk: true },
    short: 'A matcha latte with a shot of espresso floated on top.',
    tip: 'Make a matcha latte, then pour a shot slowly over the back of a spoon.',
    scene: {
      hot: { vessel: 'latte', steam: true, steps: [{ t: 'pour', via: 'pitcher', color: C.matcha, h: 0.18 }, { t: 'mix', via: 'pitcher', to: C.matchaMilk, h: 0.44 }, ESPRESSO_SHOT(0.16, { crema: false, blend: 14 })] },
      iced: { vessel: 'highball', steps: [{ t: 'ice', n: 6 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.44 }, { t: 'pour', via: 'pitcher', color: C.matcha, h: 0.16, cloud: true, blend: 18 }, ESPRESSO_SHOT(0.14, { crema: false, cloud: true, blend: 18 })] },
    },
  },
  {
    id: 'strawberry-matcha', name: 'Strawberry Matcha', group: 'matcha', family: 'matcha', avail: 1, temps: ['iced'],
    attrs: { caffeine: 2, bitter: 1, sweet: 4, creamy: 4, comfort: 3, adventure: 4, pace: 3 },
    notes: ['fruity', 'earthy'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'Strawberry milk under a layer of whisked matcha. Pretty and fresh.',
    tip: 'Mash strawberries with a little sugar, add milk and ice, pour matcha on top.',
    scene: { iced: { vessel: 'highball', steps: [{ t: 'pour', via: 'pump', color: C.strawberry, h: 0.3 }, { t: 'ice', n: 5 }, { t: 'pour', via: 'pitcher', color: C.coldMilk, h: 0.3, blend: 12 }, { t: 'pour', via: 'pitcher', color: C.matcha, h: 0.18, cloud: true, blend: 20 }] } },
  },

  // ── Chocolate ───────────────────────────────────────────────
  {
    id: 'hot-chocolate', name: 'Hot Chocolate', group: 'chocolate', family: 'chocolate', avail: 3, temps: ['hot'],
    attrs: { caffeine: 1, bitter: 1, sweet: 5, creamy: 5, comfort: 5, adventure: 0, pace: 4 },
    notes: ['chocolate'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'Rich, thick, proper hot chocolate. Zero coffee, all comfort.',
    tip: 'Whisk chopped dark chocolate into hot milk with a pinch of salt.',
    scene: { hot: { vessel: 'mug', steam: true, steps: [{ t: 'pour', via: 'pitcher', color: C.hotChoc, h: 0.64 }, { t: 'pour', via: 'pitcher', color: C.chocFoam, h: 0.1, foam: true, dome: 4 }] } },
  },
  {
    id: 'spiced-hot-chocolate', name: 'Spiced Hot Chocolate', group: 'chocolate', family: 'chocolate', avail: 1, temps: ['hot'],
    attrs: { caffeine: 1, bitter: 1, sweet: 4, creamy: 4, comfort: 4, adventure: 3, pace: 4 },
    notes: ['chocolate', 'spiced'], flags: { dairyFree: true, hasMilk: true, sweetAdjust: true },
    short: 'Mexican-style hot chocolate with cinnamon and a whisper of chilli.',
    tip: 'Add cinnamon and a pinch of chilli to hot chocolate as it simmers.',
    scene: { hot: { vessel: 'mug', steam: true, steps: [{ t: 'pour', via: 'pitcher', color: C.hotChoc, h: 0.64 }, { t: 'pour', via: 'pitcher', color: C.chocFoam, h: 0.1, foam: true, dome: 4 }, { t: 'dust', color: C.cinnamon }] } },
  },

  // ── Manual brews ────────────────────────────────────────────
  {
    id: 'v60', name: 'V60 Pour-over', group: 'manual', family: 'brew', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 4, bitter: 2, sweet: 0, creamy: 0, comfort: 2, adventure: 3, pace: 3 },
    notes: ['fruity', 'coffee'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [0, 1],
    short: 'Hand-poured through a cone. Bright, clean, and great for fruity beans.',
    tip: '15g coffee to 250g water just off the boil. Pour slowly in spirals over three minutes.',
    brew: { kind: 'pourover', variant: 'v60' },
  },
  {
    id: 'chemex', name: 'Chemex', group: 'manual', family: 'brew', avail: 1, temps: ['hot'],
    attrs: { caffeine: 3, bitter: 1, sweet: 1, creamy: 0, comfort: 3, adventure: 3, pace: 5 },
    notes: ['fruity', 'coffee'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [0, 1],
    short: 'A thick paper filter in an hourglass flask. Exceptionally clean, almost tea-like.',
    tip: 'Grind a little coarser than for V60 and use a 1:16 ratio. The thick filter does the rest.',
    brew: { kind: 'pourover', variant: 'chemex' },
  },
  {
    id: 'kalita', name: 'Kalita Wave', group: 'manual', family: 'brew', avail: 1, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 2, sweet: 1, creamy: 0, comfort: 3, adventure: 3, pace: 4 },
    notes: ['nutty', 'fruity', 'coffee'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [0, 1],
    short: 'A flat-bottomed pour-over. Balanced, sweet and forgiving.',
    tip: 'Pour in gentle pulses to keep the bed flat. Aim for three to four minutes.',
    brew: { kind: 'pourover', variant: 'kalita' },
  },
  {
    id: 'aeropress', name: 'AeroPress', group: 'manual', family: 'brew', avail: 2, temps: ['hot', 'iced'],
    attrs: { caffeine: 4, bitter: 3, sweet: 0, creamy: 1, comfort: 3, adventure: 3, pace: 2 },
    notes: ['coffee', 'chocolate'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [0, 2],
    short: 'Steep, stir, press. Full-bodied, quick and endlessly tweakable.',
    tip: '15g medium-fine coffee and 220g water. Stir, steep for a minute, press for thirty seconds.',
    brew: { kind: 'aeropress' },
  },
  {
    id: 'french-press', name: 'French Press', group: 'manual', family: 'brew', avail: 2, temps: ['hot'],
    attrs: { caffeine: 4, bitter: 3, sweet: 0, creamy: 1, comfort: 4, adventure: 2, pace: 4 },
    notes: ['chocolate', 'nutty', 'coffee'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [1, 2],
    short: 'Steeped and plunged. A heavy, rich body with a little silt.',
    tip: 'Coarse grounds at a 1:15 ratio. Steep four minutes, then plunge slowly.',
    brew: { kind: 'frenchpress' },
  },
  {
    id: 'moka', name: 'Moka Pot', group: 'manual', family: 'brew', avail: 1, temps: ['hot'],
    attrs: { caffeine: 5, bitter: 4, sweet: 0, creamy: 0, comfort: 3, adventure: 2, pace: 1 },
    notes: ['chocolate', 'coffee'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [1, 2],
    short: 'Stovetop pressure brewing. Strong, intense, close to espresso.',
    tip: 'Fill the base with hot water up to the valve, use medium heat, and pull it off as it gurgles.',
    brew: { kind: 'moka' },
  },
  {
    id: 'siphon', name: 'Siphon', group: 'manual', family: 'brew', avail: 1, temps: ['hot'],
    attrs: { caffeine: 3, bitter: 1, sweet: 1, creamy: 0, comfort: 2, adventure: 5, pace: 5 },
    notes: ['fruity', 'coffee'], flags: { manual: true, decaf: true, dairyFree: true }, roastRange: [0, 1],
    short: 'Vacuum brewing with flame and glass. Theatrical, delicate, aromatic.',
    tip: 'Honestly? This one is best enjoyed at a café that does it properly.',
    brew: { kind: 'siphon' },
  },
]

export const DRINKS_BY_ID = Object.fromEntries(DRINKS.map((d) => [d.id, d]))

export const AVAIL_LABEL = { 3: 'Everywhere', 2: 'Most specialty cafés', 1: 'Rare find' }

export const ROASTS = {
  light: { label: 'Light', dots: 1, notes: 'floral, citrus, stone fruit' },
  medium: { label: 'Medium', dots: 2, notes: 'caramel, nutty, balanced' },
  dark: { label: 'Dark', dots: 3, notes: 'chocolate, smoky, bold' },
}

// Brewed coffee colour by roast, used by the brew animations.
export const BREW_COLOR = { light: '#6E3D1C', medium: '#4A2614', dark: '#2A160C' }
