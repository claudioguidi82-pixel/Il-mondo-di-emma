// 3D Storybook Artwork & Contextual Subject Backdrop Registry for Choice Cards
// Maps genuine animal cards to bespoke Pixar-style 3D animal illustrations and gives
// every academic subject its own cohesive, non-distracting visual stage.

import zooLion3d from '../assets/images/zoo_lion_3d_1795268326883.jpg';
import zooGiraffe3d from '../assets/images/zoo_giraffe_3d_1795268326961.jpg';
import zooElephant3d from '../assets/images/zoo_elephant_3d_1795268327303.jpg';
import cardCamel3d from '../assets/images/card_camel_3d_1795268325780.jpg';
import cardElephant3d from '../assets/images/card_elephant_3d_1795268326180.jpg';
import cardZebra3d from '../assets/images/card_zebra_3d_1795268326180.jpg';
import homeWorldDiorama from '../assets/images/home_world_diorama_1795267242665.jpg';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';
import treasureChest3d from '../assets/images/treasure_chest_3d_1795267243685.jpg';
import trophyMedallion3d from '../assets/images/trophy_medallion_3d_1795267241130.jpg';
import { GameCategory, PuzzleOption } from '../types/game';

export const STORYBOOK_ASSETS = {
  arenaMeadowBackdrop,
  zooLion3d,
  zooGiraffe3d,
  zooElephant3d,
  cardCamel3d,
  cardElephant3d,
  cardZebra3d,
  homeWorldDiorama,
  treasureChest3d,
  trophyMedallion3d,
};

export type CardBackdropKind = 'nature' | 'numbers' | 'letters' | 'shapes' | 'music' | 'english';

export interface CardVisualScene {
  imageSrc?: string;
  imagePosition?: string;
  backdropKind: CardBackdropKind;
  skyGradient: string;
  hillGradient: string;
  accentGlow: string;
}

// Strict emoji-based 3D illustration matching: ONLY trigger bespoke 3D animal artwork
// when the option's actual visual symbol IS that exact animal (never matching "Leonardo",
// boy "Leo", or unrelated phrases like "coppia di cuori").
const EXACT_ANIMAL_EMOJI_ARTWORK: Record<
  string,
  { imageSrc: string; imagePosition: string }
> = {
  '🐪': { imageSrc: cardCamel3d, imagePosition: 'center 35%' },
  '🐫': { imageSrc: cardCamel3d, imagePosition: 'center 35%' },
  '🐘': { imageSrc: cardElephant3d, imagePosition: 'center 35%' },
  '🦓': { imageSrc: cardZebra3d, imagePosition: 'center 30%' },
  '🦁': { imageSrc: zooLion3d, imagePosition: 'center 28%' },
  '🦒': { imageSrc: zooGiraffe3d, imagePosition: 'center 22%' },
};

const NATURE_EMOJI_SET = new Set([
  '🐱', '🐶', '🐄', '🐦', '🐸', '🐧', '🐿️', '🦛', '🐢', '🐝', '🐞', '🦋', '🦫', '🦩',
  '🐨', '🦘', '🐻', '🐻‍❄️', '🦌', '🐌', '🦉', '🐓', '🦜', '🐆', '🦥', '🐳', '🦀', '🐡',
  '🐬', '🦈', '🐙', '🐟', '🐠', '🐴', '🐑', '🐰', '🦆', '🌻', '🌱', '🌿', '🌳', '🌸', '🍂',
]);

const CATEGORY_SCENIC_PALETTES: Record<
  GameCategory,
  { backdropKind: CardBackdropKind; skyGradient: string; hillGradient: string; accentGlow: string }
> = {
  logic: {
    backdropKind: 'nature',
    skyGradient: 'from-indigo-100 via-sky-50 to-amber-50',
    hillGradient: 'from-emerald-400 to-green-500',
    accentGlow: 'rgba(99, 102, 241, 0.22)',
  },
  letters: {
    backdropKind: 'letters',
    skyGradient: 'from-rose-100 via-amber-50 to-orange-50',
    hillGradient: 'from-rose-300 to-amber-300',
    accentGlow: 'rgba(236, 72, 153, 0.2)',
  },
  numbers: {
    backdropKind: 'numbers',
    skyGradient: 'from-amber-100 via-yellow-50 to-sky-50',
    hillGradient: 'from-amber-300 to-orange-300',
    accentGlow: 'rgba(245, 158, 11, 0.22)',
  },
  shapes: {
    backdropKind: 'shapes',
    skyGradient: 'from-sky-100 via-cyan-50 to-indigo-50',
    hillGradient: 'from-sky-300 to-indigo-300',
    accentGlow: 'rgba(14, 165, 233, 0.22)',
  },
  music: {
    backdropKind: 'music',
    skyGradient: 'from-fuchsia-100 via-violet-50 to-amber-50',
    hillGradient: 'from-violet-300 to-fuchsia-300',
    accentGlow: 'rgba(192, 38, 211, 0.22)',
  },
  english: {
    backdropKind: 'english',
    skyGradient: 'from-sky-100 via-blue-50 to-amber-50',
    hillGradient: 'from-sky-300 to-blue-300',
    accentGlow: 'rgba(37, 99, 235, 0.22)',
  },
};

export function resolveOptionArtwork(
  option: PuzzleOption,
  category: GameCategory
): CardVisualScene {
  const basePalette = CATEGORY_SCENIC_PALETTES[category] || CATEGORY_SCENIC_PALETTES.logic;
  const emoji = (option.emoji || '').trim();

  // 1. Exact 3D animal illustration ONLY when the option's emoji is that animal
  if (emoji && EXACT_ANIMAL_EMOJI_ARTWORK[emoji]) {
    const match = EXACT_ANIMAL_EMOJI_ARTWORK[emoji];
    return {
      ...basePalette,
      backdropKind: 'nature',
      imageSrc: match.imageSrc,
      imagePosition: match.imagePosition,
    };
  }

  // 2. For logic/science cards, only show sunny meadow hills if the card actually depicts nature/animals
  if (category === 'logic') {
    const isNatureCard = emoji ? NATURE_EMOJI_SET.has(emoji) : false;
    return {
      ...basePalette,
      backdropKind: isNatureCard ? 'nature' : 'shapes',
      skyGradient: isNatureCard
        ? 'from-sky-200 via-cyan-50 to-emerald-50'
        : 'from-indigo-100 via-violet-50 to-amber-50',
    };
  }

  return { ...basePalette };
}

/**
 * Intentionally avoids showing animal portraits on the question board, because
 * animal cameos either clash with unrelated subjects (Math/History/Art) or spoil
 * animal quiz answers right inside the question prompt.
 */
export function resolveQuestionCameo(
  _prompt: string,
  guideName: string,
  _guideEmoji: string
): { imageSrc?: string; alt: string } {
  return { alt: guideName };
}
