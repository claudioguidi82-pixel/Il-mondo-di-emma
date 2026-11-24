// 3D Storybook Artwork & Rich Subject-Correlated Scenic Backgrounds for Choice Cards
// Designed specifically for pre-readers (2-7y): every answer button displays a full-bleed
// habitat/context backdrop matching the answer itself (e.g., boat -> sea, airplane -> sky,
// car -> road, rocket -> space, penguin -> arctic ice, cow/dog -> sunny meadow).

import homeWorldDiorama from '../assets/images/home_world_diorama_1795267242665.jpg';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';
import { GameCategory, PuzzleOption } from '../types/game';

export const STORYBOOK_ASSETS = {
  arenaMeadowBackdrop,
  homeWorldDiorama,
};

export type CardBackdropKind =
  | 'sea'
  | 'sky'
  | 'space'
  | 'road'
  | 'meadow'
  | 'savanna'
  | 'ice'
  | 'kitchen'
  | 'music'
  | 'color'
  | 'numbers'
  | 'letters'
  | 'shapes'
  | 'english';

export interface CardVisualScene {
  imageSrc?: string;
  imagePosition?: string;
  backdropKind: CardBackdropKind;
  skyGradient: string;
  hillGradient: string;
  accentGlow: string;
  swatchHex?: string;
  isDarkBackdrop?: boolean;
}

// Emoji & Italian/English keyword matchers for unmistakable visual habitats
const SEA_EMOJI_RE = /[🚤🛥️⛵🚢⛴️🛳️⚓🐬🐳🐋🐟🐠🐡🦈🐙🦀🦞🐚🌊🏝️🏖️🏊🚣🧜🤿]/u;
const SEA_TEXT_RE =
  /\b(motoscafo|barca|nave|veliero|vela|sottomarino|mare|oceano|onda|onde|delfino|balena|pesce|pesciolino|squalo|polpo|granchio|stella marina|ancora|isola|spiaggia|acqua|boat|ship|whale|fish|dolphin|shark|sea|ocean)\b/i;

const SKY_EMOJI_RE = /[✈️🛩️🚁🎈🪁🐦🦅🦜🦢🕊️🦋🐝🐞🌈☀️🌤️⛅☁️🌧️⛈️⚡🌬️🪶🦩]/u;
const SKY_TEXT_RE =
  /\b(aereo|aeroplano|elicottero|mongolfiera|aquilone|cielo|nuvola|nuvole|sole|arcobaleno|pioggia|temporale|fulmine|vento|uccello|uccellino|aquila|rondine|pappagallo|farfalla|ape|coccinella|volo|vola|plane|airplane|bird|sky|sun|cloud|rainbow|butterfly|bee)\b/i;

const SPACE_EMOJI_RE = /[🚀🛸🪐🌍🌎🌏🌕🌖🌗🌘🌑🌒🌓🌔🌙⭐🌟✨💫☄️🌌🔭🦉🦇]/u;
const SPACE_TEXT_RE =
  /\b(razzo|astronauta|pianeta|pianeti|saturno|giove|marte|terra|venere|mercurio|nettuno|urano|luna|stella|stellina|galassia|cometa|spazio|universo|notte|telescopio|gufo|pipistrello|rocket|space|moon|star|planet|owl|night)\b/i;

const ROAD_EMOJI_RE = /[🚗🚕🚙🚌🚎🏎️🚓🚑🚒🚐🚚🚛🚜🚲🛵🏍️🚂🚆🚇🚊🚦🛑🏠🏡🏫🏰🏛️🌉🏗️]/u;
const ROAD_TEXT_RE =
  /\b(auto|automobile|macchina|macchinina|camion|autobus|bus|treno|locomotiva|bicicletta|bici|moto|trattore|ambulanza|polizia|pompieri|semaforo|strada|città|casa|casetta|scuola|castello|ponte|car|train|bus|bike|house|road|city)\b/i;

const ICE_EMOJI_RE = /[🐧❄️⛄☃️🏔️⛷️🧊🌨️]/u;
const ICE_TEXT_RE =
  /\b(pinguino|orso polare|neve|ghiaccio|polo|artico|antartide|inverno|pupazzo|montagna|slitta|penguin|snow|ice|winter|polar)\b/i;

const SAVANNA_EMOJI_RE = /[🦁🦒🐘🦓🐪🐫🐆🦛🦏🐒🐵🦘🐨🦥🌵🌴🏜️]/u;
const SAVANNA_TEXT_RE =
  /\b(leone|giraffa|elefante|zebra|cammello|dromedario|ghepardo|ippopotamo|rinoceronte|scimmia|scimmietta|canguro|koala|savana|deserto|cactus|palma|lion|giraffe|elephant|zebra|camel|monkey)\b/i;

const MEADOW_EMOJI_RE = /[🐶🐱🐄🐴🐑🐷🐓🐔🐥🦆🐰🐭🐻🦊🐿️🦌🦔🐸🐌🐢🐜🌳🌲🌻🌸🌺🌷🌼🌱🌿🍀🍄]/u;
const MEADOW_TEXT_RE =
  /\b(cane|cagnolino|gatto|gattino|mucca|cavallo|cavallino|pecora|pecorella|maiale|maialino|gallo|gallina|pulcino|anatra|coniglio|coniglietto|topo|topolino|orso|orsetto|volpe|scoiattolo|cervo|riccio|rana|ranocchia|chiocciola|tartaruga|formica|albero|bosco|prato|fiore|rosa|girasole|foglia|fungo|fattoria|dog|cat|cow|horse|frog|duck|rabbit|bear|tree|flower|forest)\b/i;

const KITCHEN_EMOJI_RE = /[🍎🍏🍐🍊🍋🍌🍉🍇🍓🫐🍒🍑🍍🥭🥝🍅🥕🥦🌽🍞🥐🥨🧀🥚🍕🍔🍟🍰🧁🍪🍩🍫🍦🍨🍯🥛🍽️]/u;
const KITCHEN_TEXT_RE =
  /\b(mela|mele|banana|banane|fragola|fragole|arancia|arance|pera|ciliegia|uva|anguria|limone|carota|carote|pomodoro|pane|pizza|torta|biscotto|biscottino|gelato|cioccolato|formaggio|latte|miele|uovo|frutta|verdura|cibo|apple|banana|strawberry|cake|pizza|milk|honey)\b/i;

const MUSIC_EMOJI_RE = /[🥁🎹🎸🎻🎺🎷🪈🔔🎵🎶🎼🎤🎧]/u;
const MUSIC_TEXT_RE =
  /\b(tamburo|pianoforte|piano|chitarra|violino|tromba|flauto|campanella|nota|note|musica|melodia|ritmo|orchestra|canto|drum|guitar|music)\b/i;

const COLOR_SWATCH_MAP: Array<{ re: RegExp; hex: string; sky: string }> = [
  { re: /(🔴|🟥|❤️|\brosso\b|\brossa\b|\bred\b)/i, hex: '#ef4444', sky: 'from-rose-400 via-red-300 to-rose-200' },
  { re: /(🟠|🟧|🧡|\barancione\b|\borange\b)/i, hex: '#f97316', sky: 'from-orange-400 via-amber-300 to-orange-200' },
  { re: /(🟡|🟨|💛|\bgiallo\b|\bgialla\b|\byellow\b)/i, hex: '#eab308', sky: 'from-yellow-300 via-amber-200 to-yellow-100' },
  { re: /(🟢|🟩|💚|\bverde\b|\bgreen\b)/i, hex: '#22c55e', sky: 'from-emerald-400 via-green-300 to-emerald-200' },
  { re: /(🔵|🟦|💙|\bblu\b|\bazzurro\b|\bblue\b)/i, hex: '#3b82f6', sky: 'from-blue-400 via-sky-300 to-blue-200' },
  { re: /(🟣|🟪|💜|\bviola\b|\bpurple\b|\blilla\b)/i, hex: '#a855f7', sky: 'from-purple-400 via-fuchsia-300 to-purple-200' },
  { re: /(🩷|\brosa\b|\bpink\b)/i, hex: '#ec4899', sky: 'from-pink-400 via-rose-300 to-pink-200' },
  { re: /(🟤|\bmarrone\b|\bbrown\b)/i, hex: '#92400e', sky: 'from-amber-700 via-amber-500 to-amber-300' },
];

const CATEGORY_SCENIC_PALETTES: Record<
  GameCategory,
  { backdropKind: CardBackdropKind; skyGradient: string; hillGradient: string; accentGlow: string }
> = {
  logic: {
    backdropKind: 'meadow',
    skyGradient: 'from-sky-300 via-sky-100 to-emerald-100',
    hillGradient: 'from-emerald-500 to-green-400',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
  },
  letters: {
    backdropKind: 'letters',
    skyGradient: 'from-rose-200 via-amber-100 to-orange-100',
    hillGradient: 'from-rose-300 to-amber-300',
    accentGlow: 'rgba(236, 72, 153, 0.22)',
  },
  numbers: {
    backdropKind: 'numbers',
    skyGradient: 'from-amber-200 via-yellow-100 to-sky-100',
    hillGradient: 'from-amber-400 to-orange-300',
    accentGlow: 'rgba(245, 158, 11, 0.24)',
  },
  shapes: {
    backdropKind: 'shapes',
    skyGradient: 'from-sky-200 via-cyan-100 to-indigo-100',
    hillGradient: 'from-sky-400 to-indigo-300',
    accentGlow: 'rgba(14, 165, 233, 0.24)',
  },
  music: {
    backdropKind: 'music',
    skyGradient: 'from-violet-600 via-fuchsia-500 to-amber-400',
    hillGradient: 'from-violet-700 to-fuchsia-600',
    accentGlow: 'rgba(192, 38, 211, 0.3)',
  },
  english: {
    backdropKind: 'english',
    skyGradient: 'from-sky-300 via-blue-200 to-amber-100',
    hillGradient: 'from-sky-400 to-blue-400',
    accentGlow: 'rgba(37, 99, 235, 0.24)',
  },
};

export function resolveOptionArtwork(
  option: PuzzleOption,
  category: GameCategory
): CardVisualScene {
  const basePalette = CATEGORY_SCENIC_PALETTES[category] || CATEGORY_SCENIC_PALETTES.logic;
  const emoji = (option.emoji || '').trim();
  const label = (option.label || '').trim();
  const combined = `${emoji} ${label}`;

  // 1. Subject-correlated habitat backgrounds (Boat -> Sea, Airplane -> Sky, Car -> Road, etc.)
  if (SEA_EMOJI_RE.test(emoji) || SEA_TEXT_RE.test(label)) {
    return {
      backdropKind: 'sea',
      skyGradient: 'from-sky-300 via-cyan-300 to-blue-600',
      hillGradient: 'from-blue-600 to-cyan-500',
      accentGlow: 'rgba(6, 182, 212, 0.35)',
    };
  }

  if (SPACE_EMOJI_RE.test(emoji) || SPACE_TEXT_RE.test(label)) {
    return {
      backdropKind: 'space',
      skyGradient: 'from-slate-950 via-indigo-900 to-violet-800',
      hillGradient: 'from-indigo-950 to-slate-900',
      accentGlow: 'rgba(129, 140, 248, 0.4)',
      isDarkBackdrop: true,
    };
  }

  if (SKY_EMOJI_RE.test(emoji) || SKY_TEXT_RE.test(label)) {
    return {
      backdropKind: 'sky',
      skyGradient: 'from-sky-400 via-sky-200 to-cyan-100',
      hillGradient: 'from-sky-300 to-white',
      accentGlow: 'rgba(56, 189, 248, 0.32)',
    };
  }

  if (ICE_EMOJI_RE.test(emoji) || ICE_TEXT_RE.test(label)) {
    return {
      backdropKind: 'ice',
      skyGradient: 'from-sky-300 via-cyan-100 to-slate-50',
      hillGradient: 'from-slate-100 to-sky-200',
      accentGlow: 'rgba(125, 211, 252, 0.35)',
    };
  }

  if (ROAD_EMOJI_RE.test(emoji) || ROAD_TEXT_RE.test(label)) {
    return {
      backdropKind: 'road',
      skyGradient: 'from-sky-300 via-sky-100 to-emerald-100',
      hillGradient: 'from-slate-700 to-slate-600',
      accentGlow: 'rgba(100, 116, 139, 0.3)',
    };
  }

  if (SAVANNA_EMOJI_RE.test(emoji) || SAVANNA_TEXT_RE.test(label)) {
    return {
      backdropKind: 'savanna',
      skyGradient: 'from-amber-300 via-orange-200 to-yellow-100',
      hillGradient: 'from-amber-500 to-yellow-500',
      accentGlow: 'rgba(245, 158, 11, 0.3)',
    };
  }

  if (MEADOW_EMOJI_RE.test(emoji) || MEADOW_TEXT_RE.test(label)) {
    return {
      backdropKind: 'meadow',
      skyGradient: 'from-sky-300 via-sky-100 to-emerald-100',
      hillGradient: 'from-emerald-500 to-green-400',
      accentGlow: 'rgba(34, 197, 94, 0.28)',
    };
  }

  if (KITCHEN_EMOJI_RE.test(emoji) || KITCHEN_TEXT_RE.test(label)) {
    return {
      backdropKind: 'kitchen',
      skyGradient: 'from-amber-100 via-orange-50 to-rose-100',
      hillGradient: 'from-amber-300 to-orange-200',
      accentGlow: 'rgba(251, 146, 60, 0.28)',
    };
  }

  if (MUSIC_EMOJI_RE.test(emoji) || MUSIC_TEXT_RE.test(label) || category === 'music') {
    return {
      backdropKind: 'music',
      skyGradient: 'from-indigo-700 via-purple-600 to-fuchsia-500',
      hillGradient: 'from-purple-900 to-indigo-800',
      accentGlow: 'rgba(232, 121, 249, 0.35)',
      isDarkBackdrop: true,
    };
  }

  // 3. Color swatches / colored shapes get a vivid matching color backdrop
  for (const sw of COLOR_SWATCH_MAP) {
    if (sw.re.test(combined)) {
      return {
        backdropKind: 'color',
        skyGradient: sw.sky,
        hillGradient: sw.sky,
        accentGlow: sw.hex,
        swatchHex: option.color || sw.hex,
      };
    }
  }

  if (option.color) {
    return {
      ...basePalette,
      backdropKind: 'color',
      swatchHex: option.color,
    };
  }

  // 4. Clean academic fallback (letters, numbers, shapes, english) without mismatched grass hills
  return {
    ...basePalette,
    backdropKind: category === 'logic' ? 'shapes' : basePalette.backdropKind,
  };
}

export function resolveQuestionCameo(
  _prompt: string,
  guideName: string,
  _guideEmoji: string
): { imageSrc?: string; alt: string } {
  return { alt: guideName };
}
