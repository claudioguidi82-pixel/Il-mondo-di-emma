// Infinite Adaptive Curriculum & Procedural Generator for "Il Mio Mondo"
// Dynamically adapts levels, difficulty tiers, numerical range & progressive subjects right from Level 1
// across 5 developmental bands (2-3, 4-5, 6-7, 8-9, 10-12 years) and personalizes copy with name & gender.
import { AgeBandId, ChildProfile, GameCategory, Puzzle, PuzzleOption, RhythmNote, EnglishWordHighlight, UserProgress } from '../types/game';
import {
  AGE_BAND_ORDER,
  calculateChildAge,
  ChildAgeInfo,
  computeAdaptiveMasteryProfile,
  DEFAULT_BIRTH_DATE,
  getDisplayChildName,
  getGenderedWord,
} from './childProfile';
import {
  AgeQuizEntry,
  TODDLER_ANIMALS,
  TODDLER_COLORS_SHAPES,
  TODDLER_ENGLISH,
  TODDLER_LETTERS,
  TODDLER_LOGIC,
  EARLY_PRIMARY_ART,
  EARLY_PRIMARY_ENGLISH,
  EARLY_PRIMARY_GEOMETRY,
  EARLY_PRIMARY_LANGUAGE,
  EARLY_PRIMARY_LOGIC,
  EARLY_PRIMARY_MUSIC,
  EARLY_PRIMARY_SCIENCE,
  PRIMARY_ADV_ENGLISH,
  PRIMARY_ADV_GEOMETRY,
  PRIMARY_ADV_LANGUAGE,
  PRIMARY_ADV_LOGIC,
  PRIMARY_ADV_SCIENCE,
  UPPER_PRIMARY_ART,
  UPPER_PRIMARY_MUSIC,
  PRETEEN_ART_GEOMETRY,
  PRETEEN_ENGLISH_A2,
  PRETEEN_LANGUAGE_LOGIC,
  PRETEEN_LOGIC_CODING,
  PRETEEN_MUSIC_CULTURE,
  PRETEEN_SCIENCE_HISTORY,
  INITIAL_LETTER_WORD_BANK,
  EMOTIONAL_EMPATHY_CATALOG,
  MEMORY_ATTENTION_CATALOG,
  NATURE_ECOLOGY_CATALOG,
  FINANCIAL_TIME_CATALOG,
  ASTRONOMY_SPACE_CATALOG,
  GEOGRAPHY_WORLD_CATALOG,
  INVENTIONS_TECH_CATALOG,
  PHILOSOPHY_CRITICAL_CATALOG,
  TEEN_SCIENCE_CHEMISTRY_PHYSICS,
  TEEN_LANGUAGE_LITERATURE,
  TEEN_ART_ARCHITECTURE,
  TEEN_MUSIC_THEORY,
  TEEN_ENGLISH_B1,
  TEEN_LOGIC_ALGORITHMS,
} from './ageBandCatalogs';

export const DEFAULT_CHILD_BIRTH_DATE = DEFAULT_BIRTH_DATE;

export type EmmaAgeInfo = ChildAgeInfo;

export function getChildAgeInfo(birthDate?: string, currentDate: Date = new Date()): ChildAgeInfo {
  return calculateChildAge(birthDate, currentDate);
}

// Backward-compatible export
export function getEmmaCurrentAge(currentDate: Date = new Date(), birthDate?: string): ChildAgeInfo {
  return calculateChildAge(birthDate, currentDate);
}

// Friendly Guides
const ANIMAL_GUIDES = [
  { name: 'Leo il Leone Esploratore', emoji: '🦁', role: 'Guida della Savana & Scienze', voicePitch: 1.02 },
  { name: 'Piuma la Rondine', emoji: '🕊️', role: 'Maestra di Musica & Inglese', voicePitch: 1.03 },
  { name: 'Brio il Delfino', emoji: '🐬', role: 'Campione dei Numeri & Calcolo', voicePitch: 1.01 },
  { name: 'Fiamma la Volpina', emoji: '🦊', role: 'Architetta di Forme & Spazio', voicePitch: 1.02 },
  { name: 'Gigi la Giraffa Curiosa', emoji: '🦒', role: 'Esperta di Parole & Rime', voicePitch: 1.02 },
  { name: 'Barnaba il Gufo Saggio', emoji: '🦉', role: 'Maestro di Logica & Indovinelli', voicePitch: 1.0 },
];

// =========================================================================
// GRAMMATICAL CONCORDANCE UTILITY (GENDER & NUMBER FOR ITALIAN)
// =========================================================================
export interface MathItemTheme {
  emoji: string;
  singular: string;
  plural: string;
  gender: 'f' | 'm';
  articleSingular: string;
  articlePluralDef: string;
  articlePluralAll: string;
  eachPhrase: string;
  countPronoun: string;
  countedLabel: string;
}

export const MATH_ITEM_CATALOG: MathItemTheme[] = [
  { emoji: '🍓', singular: 'fragolina', plural: 'fragoline', gender: 'f', articleSingular: 'una', articlePluralDef: 'le', articlePluralAll: 'tutte le', eachPhrase: 'una alla volta', countPronoun: 'contarle', countedLabel: 'Contate' },
  { emoji: '⭐', singular: 'stellina', plural: 'stelline', gender: 'f', articleSingular: 'una', articlePluralDef: 'le', articlePluralAll: 'tutte le', eachPhrase: 'una alla volta', countPronoun: 'contarle', countedLabel: 'Contate' },
  { emoji: '🦋', singular: 'farfallina', plural: 'farfalline', gender: 'f', articleSingular: 'una', articlePluralDef: 'le', articlePluralAll: 'tutte le', eachPhrase: 'una alla volta', countPronoun: 'contarle', countedLabel: 'Contate' },
  { emoji: '🍎', singular: 'mela', plural: 'mele', gender: 'f', articleSingular: 'una', articlePluralDef: 'le', articlePluralAll: 'tutte le', eachPhrase: 'una alla volta', countPronoun: 'contarle', countedLabel: 'Contate' },
  { emoji: '💎', singular: 'gemma', plural: 'gemme', gender: 'f', articleSingular: 'una', articlePluralDef: 'le', articlePluralAll: 'tutte le', eachPhrase: 'una alla volta', countPronoun: 'contarle', countedLabel: 'Contate' },
  { emoji: '🍪', singular: 'biscottino', plural: 'biscottini', gender: 'm', articleSingular: 'un', articlePluralDef: 'i', articlePluralAll: 'tutti i', eachPhrase: 'uno alla volta', countPronoun: 'contarli', countedLabel: 'Contati' },
  { emoji: '🎈', singular: 'palloncino', plural: 'palloncini', gender: 'm', articleSingular: 'un', articlePluralDef: 'i', articlePluralAll: 'tutti i', eachPhrase: 'uno alla volta', countPronoun: 'contarli', countedLabel: 'Contati' },
  { emoji: '🐬', singular: 'delfino', plural: 'delfini', gender: 'm', articleSingular: 'un', articlePluralDef: 'i', articlePluralAll: 'tutti i', eachPhrase: 'uno alla volta', countPronoun: 'contarli', countedLabel: 'Contati' },
  { emoji: '🚀', singular: 'razzo', plural: 'razzi', gender: 'm', articleSingular: 'un', articlePluralDef: 'i', articlePluralAll: 'tutti i', eachPhrase: 'uno alla volta', countPronoun: 'contarli', countedLabel: 'Contati' },
  { emoji: '🧸', singular: 'orsetto', plural: 'orsetti', gender: 'm', articleSingular: 'un', articlePluralDef: 'gli', articlePluralAll: 'tutti gli', eachPhrase: 'uno alla volta', countPronoun: 'contarli', countedLabel: 'Contati' },
];

const ITALIAN_NUM_WORDS: Record<number, { f: string; m: string }> = {
  1: { f: 'una', m: 'un' },
  2: { f: 'due', m: 'due' },
  3: { f: 'tre', m: 'tre' },
  4: { f: 'quattro', m: 'quattro' },
  5: { f: 'cinque', m: 'cinque' },
  6: { f: 'sei', m: 'sei' },
  7: { f: 'sette', m: 'sette' },
  8: { f: 'otto', m: 'otto' },
  9: { f: 'nove', m: 'nove' },
  10: { f: 'dieci', m: 'dieci' },
};

export function formatQuantityItalian(count: number, item: MathItemTheme): { text: string; speech: string } {
  if (count === 1) {
    const capArticle = item.articleSingular.charAt(0).toUpperCase() + item.articleSingular.slice(1);
    return {
      text: `${capArticle} ${item.singular}`,
      speech: `${item.articleSingular} ${item.singular}`,
    };
  }
  const word = ITALIAN_NUM_WORDS[count]?.[item.gender] || `${count}`;
  return {
    text: `${count} ${item.plural}`,
    speech: `${word} ${item.plural}`,
  };
}

export function formatAllPluralItalian(count: number, item: MathItemTheme): { text: string; speech: string } {
  if (count <= 1) {
    return formatQuantityItalian(1, item);
  }
  const allWord = item.gender === 'f' ? 'tutte' : 'tutti';
  const numWord = ITALIAN_NUM_WORDS[count]?.[item.gender] || `${count}`;
  return {
    text: `${allWord} e ${count} ${item.articlePluralDef} ${item.plural}`,
    speech: `${allWord} e ${numWord} ${item.articlePluralDef} ${item.plural}`,
  };
}

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed * 2654435761;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s ^ (s >>> 13)) * 1597334677;
    const j = Math.abs(s) % (i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

// =========================================================================
// 1. SCIENZE DEI BAMBINI, MONDO ANIMALE & NATURA (5-6 ANNI)
// (Replaces toddler "Chi fa Bau?" with smart 5-year-old animal & nature questions)
// =========================================================================
const NATURE_AND_ANIMALS_5YO = [
  {
    prompt: 'Chi è il re della savana con una grande criniera dorata e un ruggito potente? 🦁',
    speech: 'Esploriamo la savana! Quale grande felino ha una folta criniera dorata e ruggisce facendo Roar?',
    correct: { label: 'Leone', emoji: '🦁', sublabel: 'Re della savana!' },
    distractors: [
      { label: 'Pinguino', emoji: '🐧', sublabel: 'Vive tra i ghiacci' },
      { label: 'Scoiattolo', emoji: '🐿️', sublabel: 'Vive sugli alberi' },
    ],
    explanation: 'Esatto! Il leone maschio ha una splendida criniera e vive nella savana!',
  },
  {
    prompt: 'Quale animale usa la sua lunga proboscide per bere e fare la doccia? 🐘',
    speech: 'Qual è il mammifero terrestre più grande, che usa la proboscide per raccogliere le foglie e spruzzare l\'acqua?',
    correct: { label: 'Elefante', emoji: '🐘', sublabel: 'Ha la proboscide!' },
    distractors: [
      { label: 'Zebra', emoji: '🦓', sublabel: 'Manto a strisce' },
      { label: 'Cammello', emoji: '🐪', sublabel: 'Ha le gobbe' },
    ],
    explanation: 'Bravissima! L\'elefante usa la proboscide proprio come una mano e una doccia!',
  },
  {
    prompt: 'Quale animale ha il collo così lungo da brucare le foglie in cima alle acacie? 🦒',
    speech: 'Quale animale altissimo della savana ha il collo lungo e il manto a macchie per raggiungere i rami più alti?',
    correct: { label: 'Giraffa', emoji: '🦒', sublabel: 'L\'animale più alto!' },
    distractors: [
      { label: 'Ippopotamo', emoji: '🦛', sublabel: 'Nuota nei fiumi' },
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'Cammina bassa' },
    ],
    explanation: 'Proprio la giraffa! È l\'animale più alto del pianeta!',
  },
  {
    prompt: 'Quale insetto laborioso vola di fiore in fiore per produrre il miele nell\'alveare? 🐝',
    speech: 'Domanda da piccola scienziata: chi raccoglie il nettare dei fiori e produce il dolce miele nell\'alveare?',
    correct: { label: 'Ape', emoji: '🐝', sublabel: 'Produce il miele!' },
    distractors: [
      { label: 'Coccinella', emoji: '🐞', sublabel: 'Puntini neri' },
      { label: 'Libellula', emoji: '蜻', sublabel: 'Vola sull\'acqua' },
    ],
    explanation: 'Perfetto! Le api sono preziosissime per i fiori e preparano il miele!',
  },
  {
    prompt: 'Quale animale costruisce dighe di legno nei fiumi usando i suoi denti forti? 🦫',
    speech: 'Quale piccolo ingegnere dei fiumi taglia i rametti e costruisce vere dighe sull\'acqua?',
    correct: { label: 'Castoro', emoji: '🦫', sublabel: 'Ingegnere dei fiumi!' },
    distractors: [
      { label: 'Fenicottero', emoji: '🦩', sublabel: 'Sta su una zampa' },
      { label: 'Koala', emoji: '🐨', sublabel: 'Mangia eucalipto' },
    ],
    explanation: 'Grande! Il castoro costruisce dighe perfette con rami e tronchi!',
  },
  {
    prompt: 'Quale animale australiano salta fortissimo e porta il suo cucciolo nel marsupio? 🦘',
    speech: 'Chi vive in Australia, fa salti lunghissimi e custodisce il suo piccolo in una tasca sulla pancia chiamata marsupio?',
    correct: { label: 'Canguro', emoji: '🦘', sublabel: 'Ha il marsupio!' },
    distractors: [
      { label: 'Orso Polare', emoji: '🐻‍❄️', sublabel: 'Vive al Polo Nord' },
      { label: 'Cervo', emoji: '🦌', sublabel: 'Ha le corna ramificate' },
    ],
    explanation: 'Proprio il canguro! Il suo cucciolo cresce al sicuro dentro il marsupio!',
  },
  {
    prompt: 'Come si trasforma il piccolo Bruco 🐛 dopo aver dormito nel suo bozzolo?',
    speech: 'La metamorfosi della natura: il piccolo bruco mangia le foglioline, chiude il bozzolo e poi si trasforma in una meravigliosa...?',
    correct: { label: 'Farfalla', emoji: '🦋', sublabel: 'Metamorfosi magica!' },
    distractors: [
      { label: 'Chiocciola', emoji: '🐌', sublabel: 'Ha il guscio' },
      { label: 'Ranocchia', emoji: '🐸', sublabel: 'Nasce dal girino' },
    ],
    explanation: 'Bravissima! Dalla crisalide il bruco rinasce come una farfalla colorata!',
  },
  {
    prompt: 'Quale animale notturno vede benissimo al buio e ruota la testa sugli alberi? 🦉',
    speech: 'Quando scende la notte nel bosco, chi si sveglia con i suoi grandi occhi rotondi e canta Hu-Hu?',
    correct: { label: 'Gufo', emoji: '🦉', sublabel: 'Vede nella notte!' },
    distractors: [
      { label: 'Gallo', emoji: '🐓', sublabel: 'Canta all\'alba' },
      { label: 'Pappagallo', emoji: '🦜', sublabel: 'Vive nella giungla' },
    ],
    explanation: 'Esatto! Il gufo è un rapace notturno dalla vista acutissima!',
  },
  {
    prompt: 'Qual è l\'animale terrestre più veloce del mondo quando corre nella savana? 🐆',
    speech: 'Chi corre più veloce di un\'automobile tra le erbe dorate della savana?',
    correct: { label: 'Ghepardo', emoji: '🐆', sublabel: 'Campione di velocità!' },
    distractors: [
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'Va pianissimo' },
      { label: 'Bradipo', emoji: '🦥', sublabel: 'Si muove lento' },
    ],
    explanation: 'Straordinario! Il ghepardo è il velocista più rapido di tutta la Terra!',
  },
  {
    prompt: 'Quale gigante buono del mare respira dallo sfiatatoio facendo uno spruzzo d\'acqua? 🐳',
    speech: 'Qual è l\'animale più grande di tutti gli oceani, che canta sott\'acqua e spruzza una fontanella dal dorso?',
    correct: { label: 'Balena', emoji: '🐳', sublabel: 'Gigante degli oceani!' },
    distractors: [
      { label: 'Granchio', emoji: '🦀', sublabel: 'Cammina di lato' },
      { label: 'Cavalluccio Marino', emoji: '🐡', sublabel: 'È piccolino' },
    ],
    explanation: 'Proprio la balena! È il mammifero più grande del nostro pianeta!',
  },
  {
    prompt: 'Quale animale va in letargo nella sua tana quando arriva il freddo inverno? 🐻',
    speech: 'Quando cade la neve in inverno, quale grande abitante del bosco fa un lungo sonno chiamato letargo?',
    correct: { label: 'Orso Bruno', emoji: '🐻', sublabel: 'Dorme in letargo!' },
    distractors: [
      { label: 'Pinguino', emoji: '🐧', sublabel: 'Tuffa nel ghiaccio' },
      { label: 'Rondine', emoji: '🕊️', sublabel: 'Migra al caldo' },
    ],
    explanation: 'Esatto! L\'orso dorme al calduccio nella tana fino al ritorno della primavera!',
  },
  {
    prompt: 'Di cosa ha bisogno una piantina 🌱 per crescere forte insieme alla terra?',
    speech: 'Per far sbocciare un semino nella terra, di quali due elementi naturali ha sempre bisogno?',
    correct: { label: 'Acqua e Sole ☀️💧', emoji: '🌻', sublabel: 'Nutrono le piante!' },
    distractors: [
      { label: 'Caramelle 🍬', emoji: '🍬', sublabel: 'Sono dolci' },
      { label: 'Giocattoli 🧸', emoji: '🧸', sublabel: 'Sono per giocare' },
    ],
    explanation: 'Da vera botanica! Con l\'acqua e la luce del sole le piante crescono rigogliose!',
  },
];

// =========================================================================
// 2. PRE-LETTURA, SILLABE, RIME & PAROLE (5-6 ANNI) (Gc)
// =========================================================================
interface LanguageChallengeEntry {
  prompt: string;
  speech: string;
  correct: { label: string; emoji: string; sublabel: string };
  distractors: { label: string; emoji: string; sublabel: string }[];
  explanation: string;
}

const LANGUAGE_AND_SYLLABLES_5YO: LanguageChallengeEntry[] = [
  {
    prompt: 'Rima Poetica: Quale parola fa RIMA con "STELLA" ⭐?',
    speech: 'Giochiamo con le rime! Ascolta il suono finale: Stella... quale di queste parole finisce proprio come Stella?',
    correct: { label: 'Ombrello / Castella ➔ Sorella!', emoji: '👧', sublabel: 'Stèlla · Sorèlla (-ELLA)' },
    distractors: [
      { label: 'Pallone', emoji: '⚽', sublabel: 'Finisce in -ONE' },
      { label: 'Matita', emoji: '✏️', sublabel: 'Finisce in -ITA' },
    ],
    explanation: 'Che orecchio poetico! Stella e Sorella finiscono entrambe con il suono ELLA!',
  },
  {
    prompt: 'Rima Poetica: Quale parola fa RIMA con "CUORE" 💖?',
    speech: 'Trova la rima giusta: Cuore... quale parola fa rima perfetta con Cuore?',
    correct: { label: 'Fiore 🌸', emoji: '🌸', sublabel: 'Cuòre · Fiòre (-ORE)' },
    distractors: [
      { label: 'Nuvola', emoji: '☁️', sublabel: 'Finisce in -OLA' },
      { label: 'Libro', emoji: '📘', sublabel: 'Finisce in -BRO' },
    ],
    explanation: 'Bravissima! Cuore e Fiore fanno una rima dolcissima!',
  },
  {
    prompt: 'Rima Poetica: Quale parola fa RIMA con "CASTELLO" 🏰?',
    speech: 'Ascolta bene la rima: Castello... quale di questi oggetti fa rima con Castello?',
    correct: { label: 'Ombrello ☂️', emoji: '☂️', sublabel: 'Castèllo · Ombrèllo (-ELLO)' },
    distractors: [
      { label: 'Corona', emoji: '👑', sublabel: 'Finisce in -ONA' },
      { label: 'Banana', emoji: '🍌', sublabel: 'Finisce in -ANA' },
    ],
    explanation: 'Esatto! Castello e Ombrello rimano alla perfezione!',
  },
  {
    prompt: 'Gioco delle Sillabe: Con quale sillaba inizia la parola "MA-RE" 🌊?',
    speech: 'Dividiamo in sillabe battendo le mani: MA - RE! Quale altra parola inizia con la stessa sillaba MA?',
    correct: { label: 'MA-ti-ta ✏️', emoji: '✏️', sublabel: 'Inizia con la sillaba MA!' },
    distractors: [
      { label: 'SO-le ☀️', emoji: '☀️', sublabel: 'Inizia con SO' },
      { label: 'LU-na 🌙', emoji: '🌙', sublabel: 'Inizia con LU' },
    ],
    explanation: 'Perfetto! Mare e Matita iniziano entrambe con la sillaba MA!',
  },
  {
    prompt: 'Gioco delle Sillabe: Con quale sillaba inizia "CA-SA" 🏠?',
    speech: 'Batti le mani: CA - SA! Quale animale inizia proprio con la sillaba CA?',
    correct: { label: 'CA-val-lo 🐴', emoji: '🐴', sublabel: 'Inizia con la sillaba CA!' },
    distractors: [
      { label: 'PE-sce 🐟', emoji: '🐟', sublabel: 'Inizia con PE' },
      { label: 'GU-fo 🦉', emoji: '🦉', sublabel: 'Inizia con GU' },
    ],
    explanation: 'Fantastico! Casa e Cavallo iniziano con la sillaba CA!',
  },
  {
    prompt: 'Contiamo le Sillabe: Quante volte batti le mani per dire "FAR-FAL-LA" 🦋?',
    speech: 'Prova a scandire ad alta voce battendo le mani: FAR - FAL - LA! Quante sillabe sono?',
    correct: { label: '3 Sillabe 👏👏👏', emoji: '3️⃣', sublabel: 'FAR · FAL · LA (3)' },
    distractors: [
      { label: '1 Sillaba 👏', emoji: '1️⃣', sublabel: 'Troppo corta' },
      { label: '5 Sillabe', emoji: '5️⃣', sublabel: 'Troppo lunga' },
    ],
    explanation: 'Bravissima! FAR - FAL - LA è composta esattamente da tre sillabe!',
  },
  {
    prompt: 'Suono Iniziale: Quale parola inizia con la lettera "E" come ELEFANTE? 🐘',
    speech: 'Cerchiamo la vocale E! Quale di queste parole comincia proprio con la lettera E?',
    correct: { label: 'Elicottero 🚁', emoji: '🚁', sublabel: 'Inizia con la vocale E!' },
    distractors: [
      { label: 'Astronave 🚀', emoji: '🚀', sublabel: 'Inizia con A' },
      { label: 'Bicicletta 🚲', emoji: '🚲', sublabel: 'Inizia con B' },
    ],
    explanation: 'Proprio Elicottero! Inizia con la lettera E come Elefante!',
  },
  {
    prompt: 'Suono Iniziale: Quale parola inizia con la lettera "S" come STELLA e SOLE? ☀️',
    speech: 'Ascolta il suono Sss: quale di queste figure comincia con la lettera S?',
    correct: { label: 'Scoiattolo 🐿️', emoji: '🐿️', sublabel: 'Inizia con S!' },
    distractors: [
      { label: 'Tartaruga 🐢', emoji: '🐢', sublabel: 'Inizia con T' },
      { label: 'Coniglio 🐰', emoji: '🐰', sublabel: 'Inizia con C' },
    ],
    explanation: 'Esatto! Scoiattolo inizia con la S di Sole e Stella!',
  },
  {
    prompt: 'Suono Iniziale: Quale parola inizia con la "F" come FIORE e FARFALLA? 🌸',
    speech: 'Quale frutto rosso e profumato inizia con la lettera F come Fiore e Farfalla?',
    correct: { label: 'Fragola 🍓', emoji: '🍓', sublabel: 'Inizia con F!' },
    distractors: [
      { label: 'Mela 🍎', emoji: '🍎', sublabel: 'Inizia con M' },
      { label: 'Ciliegia 🍒', emoji: '🍒', sublabel: 'Inizia con C' },
    ],
    explanation: 'Bravissima! Fragola, Fiore e Farfalla iniziano tutte con la lettera F!',
  },
  {
    prompt: 'Parole Lunghe e Corte: Quale tra queste due parole è PIÙ LUNGA da pronunciare?',
    speech: 'Sfida da scuola primaria! Ascolta bene: è più lunga la parola RE oppure la parola AR-CO-BA-LE-NO?',
    correct: { label: 'ARCOBALENO 🌈', emoji: '🌈', sublabel: 'Ha 5 sillabe e 10 lettere!' },
    distractors: [
      { label: 'RE 👑', emoji: '👑', sublabel: 'Ha solo 2 lettere' },
      { label: 'TE 🍵', emoji: '🍵', sublabel: 'È cortissima' },
    ],
    explanation: 'Geniale! Arcobaleno è una parola lunghissima di ben cinque sillabe!',
  },
];

// =========================================================================
// 3. INDOVINELLI INTELLIGENTI IN RIMA PER 5-6 ANNI (KID_RIDDLES)
// =========================================================================
export const KID_RIDDLES = [
  {
    prompt: 'Indovinello: Chi sono? 🐴',
    speech: 'Ascolta l\'indovinello: Ho una folta criniera ma non sono un leone, galoppo nel prato e mangio buon fieno. Chi sono?',
    riddleText: 'Ho la criniera ma non sono un leone, galoppo nel prato e mangio buon fieno... Chi sono?',
    correct: { label: 'Cavallino', emoji: '🐴', sublabel: 'Galoppa e nitrisce!' },
    distractors: [
      { label: 'Farfallina', emoji: '🦋', sublabel: 'Vola sui fiori' },
      { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota nel mare' },
    ],
    explanation: 'Proprio il cavallino galoppante con la sua bellissima criniera!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🌈',
    speech: 'Indovinello: Sette colori brillano in cielo dopo il temporale, formo un grande arco magico e speciale. Chi sono?',
    riddleText: 'Sette colori brillano in cielo dopo il temporale, formo un grande arco magico e speciale... Chi sono?',
    correct: { label: 'Arcobaleno', emoji: '🌈', sublabel: 'Ponte di 7 colori' },
    distractors: [
      { label: 'Semaforo', emoji: '🚦', sublabel: 'Ha solo 3 luci' },
      { label: 'Lampadina', emoji: '💡', sublabel: 'Sta in cameretta' },
    ],
    explanation: 'L\'arcobaleno meraviglioso che spunta tra il sole e le nuvole!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🐢',
    speech: 'Indovinello: Cammino pianissimo per tutta la vita, ma ho una corazza dura e sempre pulita. Chi sono?',
    riddleText: 'Cammino pianissimo per tutta la vita, ma porto sul dorso una corazza dura e pulita... Chi sono?',
    correct: { label: 'Tartaruga', emoji: '🐢', sublabel: 'Col guscio robusto' },
    distractors: [
      { label: 'Ghepardo', emoji: '🐆', sublabel: 'Corre veloce' },
      { label: 'Rondine', emoji: '🕊️', sublabel: 'Vola nel cielo' },
    ],
    explanation: 'Esatto! La saggia tartaruga che porta sempre con sé la sua corazza!',
  },
  {
    prompt: 'Indovinello: Cosa sono? ☂️',
    speech: 'Indovinello: Se c\'è il sole resto chiuso in un cantuccio, ma se cade la pioggia mi apro sopra il tuo cappuccio. Cosa sono?',
    riddleText: 'Col sole resto chiuso in un cantuccio, ma se piove mi apro sopra il tuo cappuccio... Cosa sono?',
    correct: { label: 'Ombrello', emoji: '☂️', sublabel: 'Ripara dalla pioggia!' },
    distractors: [
      { label: 'Occhiali da Sole', emoji: '🕶️', sublabel: 'Si usano col sole' },
      { label: 'Pattini', emoji: '🛼', sublabel: 'Si mettono ai piedi' },
    ],
    explanation: 'Bravissima! L\'ombrello si apre appena iniziano a cadere le gocce di pioggia!',
  },
  {
    prompt: 'Indovinello: Chi sono? ⛄',
    speech: 'Indovinello d\'inverno: Ho il naso di carota, la sciarpa al collo e sono tutto bianco, ma se esce il sole caldo mi sciolgo in un lampo. Chi sono?',
    riddleText: 'Ho il naso di carota e sono tutto bianco, ma se esce il sole caldo mi sciolgo in un lampo... Chi sono?',
    correct: { label: 'Pupazzo di Neve', emoji: '⛄', sublabel: 'Fatto di neve fresca!' },
    distractors: [
      { label: 'Orsetto di Peluche', emoji: '🧸', sublabel: 'Non si scioglie' },
      { label: 'Albero di Natale', emoji: '🎄', sublabel: 'Sempreverde' },
    ],
    explanation: 'Fantastico! Il simpatico pupazzo di neve col naso di carota!',
  },
  {
    prompt: 'Indovinello: Cosa sono? ⏰',
    speech: 'Indovinello: Ho due lancette che girano in tondo, faccio Tic-Tac per tutto il giorno e non mi fermo mai un secondo. Cosa sono?',
    riddleText: 'Ho le lancette che girano in tondo e faccio Tic-Tac ogni secondo... Cosa sono?',
    correct: { label: 'Orologio', emoji: '⏰', sublabel: 'Segna le ore!' },
    distractors: [
      { label: 'Bussola', emoji: '🧭', sublabel: 'Indica il Nord' },
      { label: 'Tamburo', emoji: '🥁', sublabel: 'Fa Bum Bum' },
    ],
    explanation: 'Proprio l\'orologio che segna il tempo con le sue lancette!',
  },
  {
    prompt: 'Indovinello: Cosa sono? 📖',
    speech: 'Indovinello: Ho tante pagine piene di parole e figure, ma se mi apri ti porto in mille avventure. Cosa sono?',
    riddleText: 'Ho tante pagine piene di figure, se mi apri e mi leggi vivi mille avventure... Cosa sono?',
    correct: { label: 'Libro di Fiabe', emoji: '📖', sublabel: 'Custode di storie!' },
    distractors: [
      { label: 'Cuscino', emoji: '🛏️', sublabel: 'Per dormire' },
      { label: 'Forchetta', emoji: '🍴', sublabel: 'Per mangiare' },
    ],
    explanation: 'Meraviglioso! Un bel libro illustrato pieno di storie e conoscenze!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🌻',
    speech: 'Indovinello della natura: Sono un grande fiore giallo e per tutto il giorno giro la mia corolla per guardare il Sole. Chi sono?',
    riddleText: 'Sono un grande fiore giallo e giro sempre la corolla seguendo il Sole... Chi sono?',
    correct: { label: 'Girasole', emoji: '🌻', sublabel: 'Segue la luce del sole!' },
    distractors: [
      { label: 'Abete', emoji: '🌲', sublabel: 'Albero di montagna' },
      { label: 'Cactus', emoji: '🌵', sublabel: 'Cresce nel deserto' },
    ],
    explanation: 'Esatto! Si chiama Girasole proprio perché ruota verso il sole!',
  },
];

// =========================================================================
// 4. FORME GEOMETRICHE, ORIENTAMENTO SPAZIALE & COLORI (5-6 ANNI) (Gv)
// =========================================================================
const GEOMETRY_AND_SPACE_5YO = [
  {
    prompt: 'Geometria: Quale figura geometrica ha esattamente 3 LATI e 3 PUNTE? 🔺',
    speech: 'Osserva i lati delle figure: quale forma geometrica ha esattamente tre lati e tre punte?',
    correct: { label: 'Triangolo', emoji: '🔺', sublabel: '3 lati e 3 angoli!' },
    distractors: [
      { label: 'Cerchio', emoji: '🔴', sublabel: '0 angoli, tutto tondo' },
      { label: 'Quadrato', emoji: '🟦', sublabel: '4 lati uguali' },
    ],
    explanation: 'Perfetto! Il Triangolo si chiama così proprio perché ha tre angoli e tre lati!',
  },
  {
    prompt: 'Geometria: Quale figura ha 4 LATI TUTTI UGUALI come i dadi da gioco? 🟦',
    speech: 'Quale forma geometrica ha quattro lati tutti della stessa identica lunghezza?',
    correct: { label: 'Quadrato', emoji: '🟦', sublabel: '4 lati perfettamente uguali!' },
    distractors: [
      { label: 'Triangolo', emoji: '🔺', sublabel: 'Ne ha 3' },
      { label: 'Cerchio', emoji: '🟡', sublabel: 'Non ha lati dritti' },
    ],
    explanation: 'Esatto! Il quadrato ha quattro lati uguali e quattro angoli dritti!',
  },
  {
    prompt: 'Geometria: Quale forma assomiglia a un aquilone che vola nel cielo? 🔷',
    speech: 'Guarda bene: quale forma geometrica ha quattro lati inclinati proprio come un aquilone o un diamante?',
    correct: { label: 'Rombo', emoji: '🔷', sublabel: 'Come un aquilone!' },
    distractors: [
      { label: 'Cerchio', emoji: '🟢', sublabel: 'Rotondo' },
      { label: 'Mezzaluna', emoji: '🌙', sublabel: 'Curva' },
    ],
    explanation: 'Bravissima! Il Rombo ha la stessa sagoma di un aquilone!',
  },
  {
    prompt: 'Spazio & Forme 3D: Quale oggetto ha la forma di una SFERA perfetta? 🌍',
    speech: 'Nella geometria solida, quale di questi oggetti ha la forma di una sfera che può rotolare in ogni direzione?',
    correct: { label: 'Mappamondo / Palla ⚽', emoji: '⚽', sublabel: 'Sfera 3D perfetta!' },
    distractors: [
      { label: 'Scatola Regalo 🎁', emoji: '🎁', sublabel: 'È un cubo' },
      { label: 'Fetta di Torta 🍰', emoji: '🍰', sublabel: 'Non rotola' },
    ],
    explanation: 'Ottimo occhio spaziale! La palla e il pianeta Terra hanno la forma di una sfera!',
  },
  {
    prompt: 'Geometria in Natura: Quante punte ha questa STELLA Marina / Stellina dorata? ⭐',
    speech: 'Conta con gli occhi le punte della stellina dorata: quante punte ha in tutto?',
    correct: { label: '5 Punte ⭐', emoji: '5️⃣', sublabel: '1, 2, 3, 4 e 5 punte!' },
    distractors: [
      { label: '2 Punte', emoji: '2️⃣', sublabel: 'Sono poche' },
      { label: '8 Punte', emoji: '8️⃣', sublabel: 'Sono troppe' },
    ],
    explanation: 'Proprio cinque punte, come le cinque dita della tua mano!',
  },
  {
    prompt: 'Orientamento Spaziale: Se guardi il cielo sopra il tetto della casa, cosa trovi IN ALTO? ☀️',
    speech: 'Ragioniamo sullo spazio: cosa si trova in alto sopra le case e gli alberi?',
    correct: { label: 'Nuvola e Sole ⛅', emoji: '⛅', sublabel: 'Stanno in alto nel cielo!' },
    distractors: [
      { label: 'Radici dell\'Albero 🌱', emoji: '🌱', sublabel: 'Stanno sotto terra' },
      { label: 'Tappeto di Casa 🧶', emoji: '🧶', sublabel: 'Sta sul pavimento' },
    ],
    explanation: 'Esatto! Il sole e le nuvole stanno in alto, mentre le radici stanno sotto terra!',
  },
];

const COLOR_MIXES = [
  {
    prompt: 'Laboratorio dei Colori: Cosa nasce mescolando GIALLO 🟡 + BLU 🔵?',
    speech: 'Se sul foglio da disegno mescoliamo la tempera gialla con quella blu, quale colore nuovo appare?',
    correct: { label: 'Verde Brillante', emoji: '🟢', color: '#10b981' },
    distractors: [
      { label: 'Rosso Fuoco', emoji: '🔴', color: '#ef4444' },
      { label: 'Viola Scuro', emoji: '🟣', color: '#9333ea' },
    ],
    explanation: 'Magia della pittura! Giallo e Blu creano il Verde come le foglie di primavera!',
  },
  {
    prompt: 'Laboratorio dei Colori: Cosa nasce mescolando ROSSO 🔴 + GIALLO 🟡?',
    speech: 'Uniamo il rosso acceso e il giallo solare: quale colore caldo otteniamo?',
    correct: { label: 'Arancione', emoji: '🟠', color: '#f97316' },
    distractors: [
      { label: 'Blu Notte', emoji: '🔵', color: '#3b82f6' },
      { label: 'Verde Prato', emoji: '🟢', color: '#10b981' },
    ],
    explanation: 'Bravissima! Rosso e Giallo formano l\'Arancione come mandarini e carote!',
  },
  {
    prompt: 'Laboratorio dei Colori: Cosa nasce mescolando ROSSO 🔴 + BLU 🔵?',
    speech: 'Mescoliamo insieme il rosso e il blu: quale colore elegante e magico nasce?',
    correct: { label: 'Viola / Indaco', emoji: '🟣', color: '#a855f7' },
    distractors: [
      { label: 'Giallo Limone', emoji: '🟡', color: '#eab308' },
      { label: 'Bianco Neve', emoji: '⚪', color: '#f8fafc' },
    ],
    explanation: 'Fantastico! Rosso più Blu dà vita al colore Viola come l\'uva e la lavanda!',
  },
  {
    prompt: 'Laboratorio dei Colori: Cosa nasce unendo ROSSO 🔴 + BIANCO ⚪?',
    speech: 'Se aggiungiamo il bianco al colore rosso, quale colore delicato otteniamo?',
    correct: { label: 'Rosa Confetto', emoji: '🌸', color: '#ec4899' },
    distractors: [
      { label: 'Marrone Terra', emoji: '🤎', color: '#854d0e' },
      { label: 'Nero Carbone', emoji: '⚫', color: '#0f172a' },
    ],
    explanation: 'Esatto! Il Rosso schiarito con il Bianco diventa un dolcissimo Rosa!',
  },
  {
    prompt: 'Laboratorio dei Colori: Cosa nasce unendo BLU SCURO 🔵 + BIANCO ⚪?',
    speech: 'Se schiariamo il blu intenso con il bianco delle nuvole, quale colore del cielo sereno appare?',
    correct: { label: 'Celeste / Azzurro', emoji: '🩵', color: '#38bdf8' },
    distractors: [
      { label: 'Arancione', emoji: '🟠', color: '#f97316' },
      { label: 'Rosso', emoji: '🔴', color: '#ef4444' },
    ],
    explanation: 'Perfetto! Blu e Bianco creano l\'Azzurro limpido del cielo!',
  },
];

// =========================================================================
// 5. MUSICA, NOTE & STRUMENTI DELL'ORCHESTRA (5-6 ANNI) (Gwm)
// =========================================================================
interface MusicRhythmEntry {
  title: string;
  prompt: string;
  speech: string;
  rhythmNotes: RhythmNote[];
  correct: { label: string; emoji: string; sublabel: string; noteFreq: number };
  distractors: { label: string; emoji: string; sublabel: string; noteFreq: number }[];
  explanation: string;
}

const MUSIC_RHYTHM_CATALOG: MusicRhythmEntry[] = [
  {
    title: 'La Scala Musicale: Do - Re - Mi - Fa!',
    prompt: 'Ascolta la scala che sale: DO 🎵 - RE 🎶 - MI 🎵 - ... Quale nota viene dopo il MI?',
    speech: 'Ascolta le note che salgono in ordine: Do, Re, Mi... quale nota musicale viene subito dopo il Mi?',
    rhythmNotes: [
      { freq: 261.63, duration: 0.3, label: 'DO', emoji: '🔴' },
      { freq: 293.66, duration: 0.3, label: 'RE', emoji: '🟠' },
      { freq: 329.63, duration: 0.3, label: 'MI', emoji: '🟡' },
      { freq: 349.23, duration: 0.42, label: '❓', emoji: '🎵' },
    ],
    correct: { label: 'Nota FA!', emoji: '🎶', sublabel: 'Do · Re · Mi · FA!', noteFreq: 349.23 },
    distractors: [
      { label: 'Rumore del Vento', emoji: '💨', sublabel: 'Non è una nota', noteFreq: 196.0 },
      { label: 'Clacson', emoji: '📯', sublabel: 'Rumore stradale', noteFreq: 220.0 },
    ],
    explanation: 'Che orecchio musicale! Nella scala delle sette note dopo Do, Re, Mi viene il FA!',
  },
  {
    title: 'Il Re dei Tasti Bianchi e Neri',
    prompt: 'Quale grande strumento ha 88 tasti bianchi e neri e suona melodie dolci e forti? 🎹',
    speech: 'Quale strumento dell\'orchestra si suona con entrambe le mani sopra tanti tasti bianchi e neri?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.25, label: 'DO', emoji: '🎹' },
      { freq: 659.25, duration: 0.25, label: 'MI', emoji: '🎹' },
      { freq: 783.99, duration: 0.3, label: 'SOL', emoji: '🎹' },
      { freq: 1046.5, duration: 0.4, label: 'DO+', emoji: '✨' },
    ],
    correct: { label: 'Pianoforte', emoji: '🎹', sublabel: 'Tastiera musicale', noteFreq: 523.25 },
    distractors: [
      { label: 'Tamburello', emoji: '🥁', sublabel: 'Non ha i tasti', noteFreq: 196.0 },
      { label: 'Maracas', emoji: '🪇', sublabel: 'Si scuotono', noteFreq: 440.0 },
    ],
    explanation: 'Esatto! Il Pianoforte può suonare sia piano sia forte grazie ai suoi tasti!',
  },
  {
    title: 'L\'Archetto Magico sul Legno',
    prompt: 'Quale strumento elegante si appoggia vicino alla spalla e si suona facendo scorrere l\'archetto sulle 4 corde? 🎻',
    speech: 'Nell\'orchestra, quale strumento di legno si suona facendo scivolare un archetto sulle sue quattro corde?',
    rhythmNotes: [
      { freq: 440.0, duration: 0.35, label: 'LA', emoji: '🎻' },
      { freq: 554.37, duration: 0.35, label: 'DO#', emoji: '🎻' },
      { freq: 659.25, duration: 0.45, label: 'MI', emoji: '🎶' },
    ],
    correct: { label: 'Violino', emoji: '🎻', sublabel: 'Suona con l\'archetto!', noteFreq: 659.25 },
    distractors: [
      { label: 'Tromba', emoji: '🎺', sublabel: 'Si soffia dentro', noteFreq: 440.0 },
      { label: 'Tamburo', emoji: '🥁', sublabel: 'Usa le bacchette', noteFreq: 196.0 },
    ],
    explanation: 'Bravissima! Il Violino canta grazie all\'archetto che accarezza le corde!',
  },
  {
    title: 'Lo Strumento d\'Oro in cui si Soffia',
    prompt: 'Quale strumento dorato suona la fanfara reale quando soffiamo dentro e premiamo i tre pistoni? 🎺',
    speech: 'Quale strumento a fiato tutto dorato annuncia l\'arrivo del re con una brillante fanfara?',
    rhythmNotes: [
      { freq: 392.0, duration: 0.22, label: 'TA', emoji: '🎺' },
      { freq: 523.25, duration: 0.22, label: 'TA', emoji: '🎺' },
      { freq: 659.25, duration: 0.22, label: 'TA', emoji: '🎺' },
      { freq: 783.99, duration: 0.45, label: 'TAAA!', emoji: '👑' },
    ],
    correct: { label: 'Tromba', emoji: '🎺', sublabel: 'Strumento a fiato dorato!', noteFreq: 783.99 },
    distractors: [
      { label: 'Chitarra', emoji: '🎸', sublabel: 'Si pizzicano le corde', noteFreq: 329.63 },
      { label: 'Xilofono', emoji: '🌈', sublabel: 'Usa i martelletti', noteFreq: 523.25 },
    ],
    explanation: 'Proprio la Tromba! È uno strumento a fiato dal suono squillante e festoso!',
  },
  {
    title: 'Pattern Ritmico a 4 Tempi: Bum - Clap - Bum - ...?',
    prompt: 'Completa il ritmo dell\'orchestra: Tamburo 🥁 ➔ Battito 👏 ➔ Tamburo 🥁 ➔ ...?',
    speech: 'Segui il tempo musicale: Tamburo, Battito di mani, Tamburo... cosa viene sul quarto tempo?',
    rhythmNotes: [
      { freq: 196.0, duration: 0.28, label: 'BUM', emoji: '🥁' },
      { freq: 587.33, duration: 0.28, label: 'CLAP', emoji: '👏' },
      { freq: 196.0, duration: 0.28, label: 'BUM', emoji: '🥁' },
      { freq: 587.33, duration: 0.36, label: '❓', emoji: '✨' },
    ],
    correct: { label: 'Battito di Mani 👏', emoji: '👏', sublabel: 'Chiude il tempo 4/4!', noteFreq: 587.33 },
    distractors: [
      { label: 'Cuscino Morbido', emoji: '🛏️', sublabel: 'Non tiene il ritmo', noteFreq: 220.0 },
      { label: 'Stivale', emoji: '🥾', sublabel: 'Fuori tempo', noteFreq: 246.94 },
    ],
    explanation: 'Tempo perfetto! Hai mantenuto il ritmo regolare Bum-Clap-Bum-Clap!',
  },
  {
    title: 'Suoni Acuti e Suoni Gravi',
    prompt: 'Ascolta la differenza: l\'uccellino fa un canto ACUTO 🐦, mentre il grande tamburo fa un suono...',
    speech: 'In musica i suoni alti e sottili come il flauto si chiamano acuti. Come si chiama invece il suono profondo e basso del grande tamburo?',
    rhythmNotes: [
      { freq: 987.77, duration: 0.25, label: 'ACUTO', emoji: '🐦' },
      { freq: 880.0, duration: 0.25, label: 'ALTO', emoji: '🎶' },
      { freq: 146.83, duration: 0.45, label: 'BASSO', emoji: '🥁' },
    ],
    correct: { label: 'Grave e Profondo 🥁', emoji: '🥁', sublabel: 'Suono basso "Bum!"', noteFreq: 146.83 },
    distractors: [
      { label: 'Invisibile', emoji: '👻', sublabel: 'Non riguarda il suono', noteFreq: 440.0 },
      { label: 'Salato', emoji: '🧂', sublabel: 'È un sapore', noteFreq: 392.0 },
    ],
    explanation: 'Da vera musicista! I suoni bassi e profondi in musica si chiamano suoni gravi!',
  },
  {
    title: 'Le 6 Corde della Chitarra',
    prompt: 'Quale strumento ha una cassa armonica col foro centrale e 6 corde da pizzicare? 🎸',
    speech: 'Quale strumento musicale portiamo anche in gita e suoniamo pizzicando le sue sei corde?',
    rhythmNotes: [
      { freq: 329.63, duration: 0.25, label: 'MI', emoji: '🎸' },
      { freq: 392.0, duration: 0.25, label: 'SOL', emoji: '🎸' },
      { freq: 493.88, duration: 0.25, label: 'SI', emoji: '🎸' },
      { freq: 659.25, duration: 0.4, label: 'MI+', emoji: '🎶' },
    ],
    correct: { label: 'Chitarra', emoji: '🎸', sublabel: '6 corde armoniche', noteFreq: 659.25 },
    distractors: [
      { label: 'Fischietto', emoji: '🪈', sublabel: 'Fa un solo fischio', noteFreq: 880.0 },
      { label: 'Campana', emoji: '🔔', sublabel: 'Fa Din Don', noteFreq: 783.99 },
    ],
    explanation: 'Fantastico! La Chitarra ha sei corde che vibrano sopra la cassa armonica!',
  },
];

const TODDLER_MUSIC_RHYTHM: MusicRhythmEntry[] = [
  {
    title: 'Suona il Tamburo: BUM BUM! 🥁',
    prompt: 'Ascolta il suono forte "BUM BUM"! Tocca il TAMBURO! 🥁',
    speech: 'Ascolta bene: bum, bum, bum! Quale strumento fa questo bel suono ritmato? Tocca il tamburo!',
    rhythmNotes: [
      { freq: 196.0, duration: 0.32, label: 'BUM', emoji: '🥁' },
      { freq: 196.0, duration: 0.32, label: 'BUM', emoji: '🥁' },
      { freq: 261.63, duration: 0.4, label: 'BUM!', emoji: '🥁' },
    ],
    correct: { label: 'Tamburo', emoji: '🥁', sublabel: 'Fa BUM BUM!', noteFreq: 196.0 },
    distractors: [
      { label: 'Mela', emoji: '🍎', sublabel: 'Si mangia, non suona', noteFreq: 440.0 },
      { label: 'Pallone', emoji: '⚽', sublabel: 'Rimbalza nel prato', noteFreq: 392.0 },
    ],
    explanation: 'Bravissima! Il tamburo fa BUM BUM quando teniamo il ritmo!',
  },
  {
    title: 'Batti le Mani a Tempo! 👏',
    prompt: 'Ascolta il ritmo allegro: CLAP, CLAP! Quali sono le MANI che battono? 👏',
    speech: 'Facciamo il ritmo insieme: clap, clap, clap! Tocca le mani che battono a tempo!',
    rhythmNotes: [
      { freq: 523.25, duration: 0.25, label: 'CLAP', emoji: '👏' },
      { freq: 659.25, duration: 0.25, label: 'CLAP', emoji: '👏' },
      { freq: 783.99, duration: 0.35, label: 'CLAP!', emoji: '✨' },
    ],
    correct: { label: 'Mani che Battono', emoji: '👏', sublabel: 'Fanno CLAP CLAP!', noteFreq: 659.25 },
    distractors: [
      { label: 'Scarpa', emoji: '👟', sublabel: 'Si mette ai piedi', noteFreq: 261.63 },
      { label: 'Cappello', emoji: '🧢', sublabel: 'Si mette in testa', noteFreq: 293.66 },
    ],
    explanation: 'Che ritmo allegro! Battere le mani a tempo è la prima musica del corpo!',
  },
  {
    title: 'La Campanella Din Don! 🔔',
    prompt: 'Ascolta il suono dolce "DIN DON"! Tocca la CAMPANELLA! 🔔',
    speech: 'Senti che suono dolce e tintinnante: din, don, din, don! Tocca la campanella dorata!',
    rhythmNotes: [
      { freq: 783.99, duration: 0.32, label: 'DIN', emoji: '🔔' },
      { freq: 659.25, duration: 0.32, label: 'DON', emoji: '🔔' },
      { freq: 783.99, duration: 0.38, label: 'DIN!', emoji: '✨' },
    ],
    correct: { label: 'Campanella', emoji: '🔔', sublabel: 'Fa DIN DON!', noteFreq: 783.99 },
    distractors: [
      { label: 'Cuscino', emoji: '🛏️', sublabel: 'È morbido per dormire', noteFreq: 220.0 },
      { label: 'Carota', emoji: '🥕', sublabel: 'È croccante', noteFreq: 329.63 },
    ],
    explanation: 'Sì! La campanella suona DIN DON con una nota dolce e squillante!',
  },
  {
    title: 'La Chitarra Musicale! 🎸',
    prompt: 'Ascolta le corde che cantano: PLIN PLIN! Tocca la CHITARRA! 🎸',
    speech: 'Ascolta queste corde allegre che suonano una melodia felice! Tocca la chitarra!',
    rhythmNotes: [
      { freq: 329.63, duration: 0.28, label: 'PLIN', emoji: '🎸' },
      { freq: 392.0, duration: 0.28, label: 'PLON', emoji: '🎸' },
      { freq: 523.25, duration: 0.38, label: '🎶', emoji: '🎵' },
    ],
    correct: { label: 'Chitarra', emoji: '🎸', sublabel: 'Suona con le corde!', noteFreq: 523.25 },
    distractors: [
      { label: 'Cucchiaio', emoji: '🥄', sublabel: 'Si usa per la pappa', noteFreq: 293.66 },
      { label: 'Ombrello', emoji: '☂️', sublabel: 'Ripara dalla pioggia', noteFreq: 246.94 },
    ],
    explanation: 'Evviva! La chitarra fa cantare le sue corde musicali!',
  },
];

// =========================================================================
// 6. INGLESE PER 5-6 ANNI (VOCABOLARIO AMPIO & FRASI) (Gc)
// =========================================================================
interface EnglishLessonEntry {
  wordInfo: EnglishWordHighlight;
  prompt: string;
  speech: string;
  correct: { label: string; emoji: string; sublabel: string };
  distractors: { label: string; emoji: string; sublabel: string }[];
  explanation: string;
}

const ENGLISH_WORDS_CATALOG: EnglishLessonEntry[] = [
  {
    wordInfo: { en: 'LION', it: 'Leone', phoneticHint: 'Làion', emoji: '🦁', categoryLabel: 'Safari in Inglese' },
    prompt: 'In inglese il Leone della savana si chiama "LION"! Tocca il leone "LION"! 🦁',
    speech: 'Parolina inglese della savana: il Leone si dice Làion. Tocca il coraggioso Leone, Làion!',
    correct: { label: 'LION (Leone)', emoji: '🦁', sublabel: '🇬🇧 Lion = 🇮🇹 Leone' },
    distractors: [
      { label: 'Rana', emoji: '🐸', sublabel: 'In inglese è Frog' },
      { label: 'Pecora', emoji: '🐑', sublabel: 'In inglese è Sheep' },
    ],
    explanation: 'Wonderful! Lion in inglese significa proprio Leone!',
  },
  {
    wordInfo: { en: 'GIRAFFE', it: 'Giraffa', phoneticHint: 'Giràf', emoji: '🦒', categoryLabel: 'Safari in Inglese' },
    prompt: 'In inglese la Giraffa dal collo alto si dice "GIRAFFE"! Tocca "GIRAFFE"! 🦒',
    speech: 'Come si dice Giraffa in inglese? Si pronuncia Giràf! Tocca la simpatica Giraffa, Giràf!',
    correct: { label: 'GIRAFFE (Giraffa)', emoji: '🦒', sublabel: '🇬🇧 Giraffe = 🇮🇹 Giraffa' },
    distractors: [
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'In inglese è Turtle' },
      { label: 'Pesce', emoji: '🐟', sublabel: 'In inglese è Fish' },
    ],
    explanation: 'Bravissima! Giraffe è la Giraffa in inglese!',
  },
  {
    wordInfo: { en: 'ELEPHANT', it: 'Elefante', phoneticHint: 'Èlefant', emoji: '🐘', categoryLabel: 'Safari in Inglese' },
    prompt: 'In inglese l\'Elefante con la proboscide si chiama "ELEPHANT"! Tocca "ELEPHANT"! 🐘',
    speech: 'Una grande parola della savana: in inglese l\'Elefante si dice Èlefant. Tocca Èlefant!',
    correct: { label: 'ELEPHANT (Elefante)', emoji: '🐘', sublabel: '🇬🇧 Elephant = 🇮🇹 Elefante' },
    distractors: [
      { label: 'Uccellino', emoji: '🐦', sublabel: 'In inglese è Bird' },
      { label: 'Gattino', emoji: '🐱', sublabel: 'In inglese è Cat' },
    ],
    explanation: 'Super! Elephant vuol dire Elefante in inglese!',
  },
  {
    wordInfo: { en: 'BUTTERFLY', it: 'Farfalla', phoneticHint: 'Bàtterflai', emoji: '🦋', categoryLabel: 'Natura in Inglese' },
    prompt: 'In inglese la Farfalla colorata si chiama "BUTTERFLY"! Tocca "BUTTERFLY"! 🦋',
    speech: 'In inglese la farfallina dalle ali colorate si dice Bàtterflai. Tocca la farfalla Bàtterflai!',
    correct: { label: 'BUTTERFLY (Farfalla)', emoji: '🦋', sublabel: '🇬🇧 Butterfly = 🇮🇹 Farfalla' },
    distractors: [
      { label: 'Lumaca', emoji: '🐌', sublabel: 'In inglese è Snail' },
      { label: 'Orso', emoji: '🐻', sublabel: 'In inglese è Bear' },
    ],
    explanation: 'Campionessa! Butterfly è la Farfalla in inglese!',
  },
  {
    wordInfo: { en: 'RAINBOW', it: 'Arcobaleno', phoneticHint: 'Rèinbou', emoji: '🌈', categoryLabel: 'Cielo in Inglese' },
    prompt: 'In inglese l\'Arcobaleno dai 7 colori si chiama "RAINBOW"! Tocca "RAINBOW"! 🌈',
    speech: 'L\'arcobaleno che brilla dopo la pioggia in inglese si dice Rèinbou. Tocca Rèinbou!',
    correct: { label: 'RAINBOW (Arcobaleno)', emoji: '🌈', sublabel: '🇬🇧 Rainbow = 🇮🇹 Arcobaleno' },
    distractors: [
      { label: 'Ombrello', emoji: '☂️', sublabel: 'In inglese è Umbrella' },
      { label: 'Sasso', emoji: '🪨', sublabel: 'In inglese è Stone' },
    ],
    explanation: 'Fantastico! Rainbow significa Arcobaleno!',
  },
  {
    wordInfo: { en: 'MOON', it: 'Luna', phoneticHint: 'Mun', emoji: '🌙', categoryLabel: 'Spazio in Inglese' },
    prompt: 'In inglese la Luna della notte si chiama "MOON"! Qual è la Luna "MOON"? 🌙',
    speech: 'Quando viene sera spunta la Luna: in inglese si dice Mun. Tocca la Luna Mun!',
    correct: { label: 'MOON (Luna)', emoji: '🌙', sublabel: '🇬🇧 Moon = 🇮🇹 Luna' },
    distractors: [
      { label: 'Albero', emoji: '🌳', sublabel: 'In inglese è Tree' },
      { label: 'Mela', emoji: '🍎', sublabel: 'In inglese è Apple' },
    ],
    explanation: 'Perfetto! Moon in inglese vuol dire Luna!',
  },
  {
    wordInfo: { en: 'DOLPHIN', it: 'Delfino', phoneticHint: 'Dòlfin', emoji: '🐬', categoryLabel: 'Mare in Inglese' },
    prompt: 'In inglese il Delfino che salta tra le onde si chiama "DOLPHIN"! Tocca "DOLPHIN"! 🐬',
    speech: 'Il delfino amico del mare in inglese si dice Dòlfin. Tocca il delfino Dòlfin!',
    correct: { label: 'DOLPHIN (Delfino)', emoji: '🐬', sublabel: '🇬🇧 Dolphin = 🇮🇹 Delfino' },
    distractors: [
      { label: 'Coniglio', emoji: '🐰', sublabel: 'In inglese è Rabbit' },
      { label: 'Cavallo', emoji: '🐴', sublabel: 'In inglese è Horse' },
    ],
    explanation: 'Bravissima! Dolphin è il Delfino in inglese!',
  },
  {
    wordInfo: { en: 'FLOWER', it: 'Fiore', phoneticHint: 'Flàuer', emoji: '🌸', categoryLabel: 'Natura in Inglese' },
    prompt: 'In inglese un Fiore profumato si chiama "FLOWER"! Tocca il fiore "FLOWER"! 🌸',
    speech: 'In primavera sbocciano i fiori: in inglese Fiore si dice Flàuer. Tocca il fiorellino Flàuer!',
    correct: { label: 'FLOWER (Fiore)', emoji: '🌸', sublabel: '🇬🇧 Flower = 🇮🇹 Fiore' },
    distractors: [
      { label: 'Macchinina', emoji: '🚗', sublabel: 'In inglese è Car' },
      { label: 'Cappello', emoji: '🧢', sublabel: 'In inglese è Hat' },
    ],
    explanation: 'Esatto! Flower significa Fiore in inglese!',
  },
  {
    wordInfo: { en: 'GREEN', it: 'Verde', phoneticHint: 'Grin', emoji: '🟢', categoryLabel: 'Colori in Inglese' },
    prompt: 'In inglese il colore VERDE del prato si dice "GREEN"! Qual è il colore "GREEN"? 🟢',
    speech: 'Giochiamo con i colori in inglese: il Verde delle foglie si dice Grin. Tocca il colore Grin!',
    correct: { label: 'GREEN (Verde)', emoji: '🟢', sublabel: '🇬🇧 Green = 🇮🇹 Verde' },
    distractors: [
      { label: 'Rosso (Red)', emoji: '🔴', sublabel: 'Colore della fragola' },
      { label: 'Blu (Blue)', emoji: '🔵', sublabel: 'Colore del mare' },
    ],
    explanation: 'Ottimo! Green è il colore Verde in inglese!',
  },
  {
    wordInfo: { en: 'YELLOW', it: 'Giallo', phoneticHint: 'Ièllou', emoji: '🟡', categoryLabel: 'Colori in Inglese' },
    prompt: 'In inglese il colore GIALLO del sole e dei limoni si dice "YELLOW"! Tocca "YELLOW"! 🟡',
    speech: 'Come il sole e i girasoli: il colore Giallo in inglese si dice Ièllou. Tocca Ièllou!',
    correct: { label: 'YELLOW (Giallo)', emoji: '🟡', sublabel: '🇬🇧 Yellow = 🇮🇹 Giallo' },
    distractors: [
      { label: 'Viola (Purple)', emoji: '🟣', sublabel: 'Colore dell\'uva' },
      { label: 'Nero (Black)', emoji: '⚫', sublabel: 'Colore della notte' },
    ],
    explanation: 'Bravissima! Yellow significa Giallo in inglese!',
  },
  {
    wordInfo: { en: 'BOOK', it: 'Libro', phoneticHint: 'Buk', emoji: '📘', categoryLabel: 'Scuola in Inglese' },
    prompt: 'In inglese il Libro delle storie si chiama "BOOK"! Tocca il libro "BOOK"! 📘',
    speech: 'Parolina da scuola primaria: il libro in inglese si chiama Buk. Tocca il libro Buk!',
    correct: { label: 'BOOK (Libro)', emoji: '📘', sublabel: '🇬🇧 Book = 🇮🇹 Libro' },
    distractors: [
      { label: 'Pallone (Ball)', emoji: '⚽', sublabel: 'Per giocare' },
      { label: 'Torta (Cake)', emoji: '🎂', sublabel: 'Da mangiare' },
    ],
    explanation: 'Perfetto! Book vuol dire Libro in inglese!',
  },
  {
    wordInfo: { en: 'RABBIT', it: 'Coniglietto', phoneticHint: 'Rèbbit', emoji: '🐰', categoryLabel: 'Animali in Inglese' },
    prompt: 'In inglese il Coniglietto dalle orecchie lunghe si chiama "RABBIT"! Tocca "RABBIT"! 🐰',
    speech: 'Il coniglietto che salta nel prato in inglese si dice Rèbbit. Tocca il coniglietto Rèbbit!',
    correct: { label: 'RABBIT (Coniglietto)', emoji: '🐰', sublabel: '🇬🇧 Rabbit = 🇮🇹 Coniglietto' },
    distractors: [
      { label: 'Anatra (Duck)', emoji: '🦆', sublabel: 'Nuota nel lago' },
      { label: 'Treno (Train)', emoji: '🚂', sublabel: 'Corre sui binari' },
    ],
    explanation: 'Super! Rabbit è il Coniglietto in inglese!',
  },
];

// =========================================================================
// 7. LOGICA, MATRICI CHC, SEQUENZE TEMPORALI & INTRUSI (5-6 ANNI) (Gf / Gv)
// =========================================================================
interface IQMatrixEntry {
  iqParameterTag: string;
  prompt: string;
  speech: string;
  patternItems?: string[];
  correct: { label: string; emoji: string; sublabel: string };
  distractors: { label: string; emoji: string; sublabel: string }[];
  explanation: string;
}

const IQ_PSYCHOMETRIC_CATALOG: IQMatrixEntry[] = [
  {
    iqParameterTag: 'Sequenza Temporale Evolutiva (Gf)',
    prompt: 'Storia nel Tempo: Semino 🌱 ➔ Piantina 🌿 ➔ Albero in Fiore 🌸 ➔ Cosa viene dopo?',
    speech: 'Osserva cosa succede nel tempo: piantiamo un semino, spunta la piantina, l\'albero fiorisce... e dopo i fiori cosa nasce sui rami?',
    patternItems: ['🌱', '➔', '🌿', '➔', '🌸', '➔', '❓'],
    correct: { label: 'Albero coi Frutti 🍎', emoji: '🍎', sublabel: 'Dai fiori nascono i frutti!' },
    distractors: [
      { label: 'Ghiacciolo 🍧', emoji: '🍧', sublabel: 'Non cresce sugli alberi' },
      { label: 'Bicicletta 🚲', emoji: '🚲', sublabel: 'È un mezzo di trasporto' },
    ],
    explanation: 'Ragionamento temporale impeccabile! Dopo i fiori sugli alberi maturano i frutti!',
  },
  {
    iqParameterTag: 'Matrice Bivariata Forma-Colore (Gf · Gv)',
    prompt: 'Matrice Logica: Cerchio Rosso 🔴 ➔ Stella Rossa 🌟 : Cerchio Blu 🔵 ➔ ...?',
    speech: 'Osserva la regola segreta: il Cerchio Rosso si trasforma in una Stella mantenendo il suo colore. Allora il Cerchio Blu in cosa si trasforma?',
    patternItems: ['🔴', '➔', '🌟', '🔵', '➔', '❓'],
    correct: { label: 'Stella Blu 💠', emoji: '💠', sublabel: 'Forma stella + colore blu!' },
    distractors: [
      { label: 'Banana Gialla 🍌', emoji: '🍌', sublabel: 'Non segue la regola' },
      { label: 'Quadrato Verde 🟩', emoji: '🟩', sublabel: 'Cambia forma e colore' },
    ],
    explanation: 'Che mente brillante! Hai applicato insieme la regola della forma e quella del colore!',
  },
  {
    iqParameterTag: 'Causa ed Effetto Meteorologico (Gf · Gc)',
    prompt: 'Logica Causa-Effetto: Nuvola di Pioggia 🌧️ + Sole Caldo ☀️ = Cosa appare nel cielo?',
    speech: 'Quando piove ma allo stesso tempo spunta il sole tra le nuvole, quale meraviglia dai sette colori compare nel cielo?',
    patternItems: ['🌧️', '+', '☀️', '➔', '❓'],
    correct: { label: 'Arcobaleno 🌈', emoji: '🌈', sublabel: 'Luce del sole nelle gocce!' },
    distractors: [
      { label: 'Pupazzo di Neve ⛄', emoji: '⛄', sublabel: 'Serve la neve fredda' },
      { label: 'Astronave 🚀', emoji: '🚀', sublabel: 'Vola nello spazio' },
    ],
    explanation: 'Scienziata perfetta! I raggi del sole attraversando le gocce d\'acqua creano l\'arcobaleno!',
  },
  {
    iqParameterTag: 'Categorizzazione Semantica & Intruso (Gf · Gc)',
    prompt: 'Trova l\'INTRUSO: Aereo ✈️, Elicottero 🚁, Mongolfiera 🎈 e Sottomarino 🚤. Chi NON vola nel cielo?',
    speech: 'Aguzza l\'ingegno: Aereo, Elicottero, Mongolfiera e Barca. Quale di questi mezzi non vola nel cielo ma viaggia sull\'acqua?',
    patternItems: ['✈️', '🚁', '🎈', '🚤'],
    correct: { label: 'Motoscafo / Barca 🚤', emoji: '🚤', sublabel: 'Naviga sull\'acqua, non vola!' },
    distractors: [
      { label: 'Aereo ✈️', emoji: '✈️', sublabel: 'Vola tra le nuvole' },
      { label: 'Elicottero 🚁', emoji: '🚁', sublabel: 'Vola con l\'elica' },
    ],
    explanation: 'Occhio d\'aquila! Aereo, elicottero e mongolfiera volano in cielo, mentre la barca naviga sull\'acqua!',
  },
  {
    iqParameterTag: 'Analogia Funzionale (Gf · Gc)',
    prompt: 'Analogia: Il Pennello 🖌️ serve al Pittore come la Bacchetta 🪄 serve a chi dirige l\'...?',
    speech: 'Ragioniamo per analogia: il pittore usa il pennello per dipingere i quadri, mentre il direttore usa la bacchetta per guidare...?',
    patternItems: ['🖌️', '➔', '🎨', '🎼', '➔', '❓'],
    correct: { label: 'Orchestra Musicale 🎻', emoji: '🎻', sublabel: 'Suonano insieme a tempo!' },
    distractors: [
      { label: 'Frigorifero 🧊', emoji: '🧊', sublabel: 'Sta in cucina' },
      { label: 'Scivolo 🛝', emoji: '🛝', sublabel: 'Sta al parco giochi' },
    ],
    explanation: 'Esatto! Il direttore d\'orchestra guida tutti i musicisti a tempo!',
  },
  {
    iqParameterTag: 'Ciclo delle 4 Stagioni (Gf · Gc)',
    prompt: 'Il Giro delle Stagioni: Inverno ❄️ ➔ Primavera 🌸 ➔ Estate 🏖️ ➔ Quale stagione viene dopo l\'Estate?',
    speech: 'Seguiamo il ciclo dell\'anno: dopo l\'Inverno viene la Primavera, poi la calda Estate... e quando le foglie diventano arancioni e cadono, che stagione arriva?',
    patternItems: ['❄️', '➔', '🌸', '➔', '🏖️', '➔', '❓'],
    correct: { label: 'Autunno 🍂', emoji: '🍂', sublabel: 'Foglie dorate e castagne!' },
    distractors: [
      { label: 'Ferragosto 🍉', emoji: '🍉', sublabel: 'È in piena estate' },
      { label: 'Mezzanotte 🕛', emoji: '🕛', sublabel: 'È un\'ora della notte' },
    ],
    explanation: 'Bravissima! Le quattro stagioni sono Inverno, Primavera, Estate e Autunno!',
  },
  {
    iqParameterTag: 'Proporzione Quantitativa (Gf · Gwm)',
    prompt: 'Regola dei Numeri: 1 Bicicletta 🚲 ha 2 Ruote. Quante ruote hanno 2 Biciclette 🚲🚲 insieme?',
    speech: 'Problema da vera campionessa: una bicicletta ha due ruote. Se nel parco ci sono due biciclette, quante ruote ci sono in tutto?',
    patternItems: ['🚲 = 2', '🚲 + 🚲', '➔', '❓'],
    correct: { label: '4 Ruote! (2 + 2)', emoji: '4️⃣', sublabel: '2 ruote + 2 ruote = 4!' },
    distractors: [
      { label: '2 Ruote', emoji: '2️⃣', sublabel: 'Sono di una sola bici' },
      { label: '10 Ruote', emoji: '🔟', sublabel: 'Sono troppe' },
    ],
    explanation: 'Straordinaria! Due ruote più altre due ruote fanno esattamente quattro ruote!',
  },
  {
    iqParameterTag: 'Deduzione Inversa & Opposti (Gf)',
    prompt: 'Logica degli Opposti: Il Ghiaccio 🧊 è FREDDO, il Fuoco 🔥 è CALDO; la Tartaruga 🐢 è LENTA, il Razzo 🚀 è...?',
    speech: 'Giochiamo con i contrari: se la tartaruga cammina lenta, il razzo spaziale che vola tra le stelle com\'è?',
    patternItems: ['🐢 = Lenta', '🚀 = ❓'],
    correct: { label: 'Velocissimo! 🚀', emoji: '⚡', sublabel: 'Il contrario di lento!' },
    distractors: [
      { label: 'Bagnato 💧', emoji: '💧', sublabel: 'Contrario di asciutto' },
      { label: 'Addormentato 😴', emoji: '😴', sublabel: 'Contrario di sveglio' },
    ],
    explanation: 'Ragionamento logico perfetto! Veloce è l\'esatto contrario di lento!',
  },
  {
    iqParameterTag: 'Esclusione Categoriale (Gf)',
    prompt: 'Trova l\'INTRUSO: Pianoforte 🎹, Violino 🎻, Chitarra 🎸 e Pentola 🍲. Quale NON è uno strumento musicale?',
    speech: 'Quale di questi quattro oggetti appartiene alla cucina e non all\'orchestra musicale?',
    patternItems: ['🎹', '🎻', '🎸', '🍲'],
    correct: { label: 'Pentola 🍲', emoji: '🍲', sublabel: 'Serve per cucinare la minestra!' },
    distractors: [
      { label: 'Violino 🎻', emoji: '🎻', sublabel: 'Strumento a corde' },
      { label: 'Chitarra 🎸', emoji: '🎸', sublabel: 'Strumento musicale' },
    ],
    explanation: 'Perfetto! La pentola si usa sui fornelli in cucina, mentre gli altri sono strumenti musicali!',
  },
  {
    iqParameterTag: 'Relazione Parte-Tutto (Gv · Gf)',
    prompt: 'Chi Lascia Questa Impronta? 🐾 Un uccellino ha le piume 🪶, un pesciolino ha le...',
    speech: 'Osserva il corpo degli animali: gli uccellini sono coperti di piume per volare, mentre i pesciolini per nuotare sono coperti di...?',
    patternItems: ['🐦 ➔ 🪶', '🐟 ➔ ❓'],
    correct: { label: 'Squame e Pinne 🐟', emoji: '🐟', sublabel: 'Per nuotare velocissimi!' },
    distractors: [
      { label: 'Lana di Pecora 🧶', emoji: '🧶', sublabel: 'La ha la pecorella' },
      { label: 'Ruote di Gomma 🛞', emoji: '🛞', sublabel: 'Le ha l\'automobile' },
    ],
    explanation: 'Esatto! I pesci hanno le squame lucenti e le pinne per muoversi nell\'acqua!',
  },
];

// =========================================================================
// 8. SEQUENZE LOGICHE E PATTERN VARIATI (ABAB, AABB, ABC, CRESCENTI)
// =========================================================================
const PATTERN_SEQUENCES_5YO = [
  {
    prompt: 'Sequenza Alternata (AB-AB): Sole ☀️, Luna 🌙, Sole ☀️, Luna 🌙, ... Cosa viene adesso?',
    speech: 'Segui l\'ordine del cielo: Sole, Luna, Sole, Luna... cosa tocca adesso per continuare la sequenza?',
    patternItems: ['☀️', '🌙', '☀️', '🌙', '❓'],
    correct: { label: 'Sole ☀️', emoji: '☀️', sublabel: 'Ricomincia con il Sole!' },
    distractors: [
      { label: 'Luna 🌙', emoji: '🌙', sublabel: 'È appena passata' },
      { label: 'Ombrello ☂️', emoji: '☂️', sublabel: 'Non è nella sequenza' },
    ],
    explanation: 'Perfetto! Nel ritmo alternato dopo la Luna torna sempre il Sole!',
  },
  {
    prompt: 'Sequenza a Tre (ABC-ABC): Rosso 🔴, Giallo 🟡, Blu 🔵, Rosso 🔴, Giallo 🟡, ...?',
    speech: 'Attenzione alla sequenza di tre colori: Rosso, Giallo, Blu... Rosso, Giallo... quale colore chiude il secondo giro?',
    patternItems: ['🔴', '🟡', '🔵', '🔴', '🟡', '❓'],
    correct: { label: 'Blu 🔵', emoji: '🔵', sublabel: 'Completa la tripletta Rosso-Giallo-Blu!' },
    distractors: [
      { label: 'Rosso 🔴', emoji: '🔴', sublabel: 'È il primo' },
      { label: 'Giallo 🟡', emoji: '🟡', sublabel: 'È il secondo' },
    ],
    explanation: 'Grande memoria sequenziale! La regola a tre colori è Rosso, Giallo e Blu!',
  },
  {
    prompt: 'Sequenza Doppia (AA-BB): 2 Stelle ⭐⭐, 2 Cuori 💖💖, 2 Stelle ⭐⭐, ... Cosa viene dopo?',
    speech: 'Osserva la regola a coppie: due Stelle, due Cuori, due Stelle... quale coppia viene adesso?',
    patternItems: ['⭐⭐', '💖💖', '⭐⭐', '❓'],
    correct: { label: '2 Cuori 💖💖', emoji: '💖', sublabel: 'Tocca alla coppia di Cuori!' },
    distractors: [
      { label: '2 Stelle ⭐⭐', emoji: '⭐', sublabel: 'Sono appena passate' },
      { label: '1 Nuvola ☁️', emoji: '☁️', sublabel: 'Non fa parte del ritmo' },
    ],
    explanation: 'Bravissima! Hai riconosciuto subito la regola delle coppie alternate!',
  },
  {
    prompt: 'Sequenza dei Numeri Pari: 2️⃣ ➔ 4️⃣ ➔ 6️⃣ ➔ Quale numero facendo +2 viene dopo il 6?',
    speech: 'Contiamo saltando di due in due come i canguri: due, quattro, sei... aggiungendo altri due, a quale numero arriviamo?',
    patternItems: ['2️⃣', '➔', '4️⃣', '➔', '6️⃣', '➔', '❓'],
    correct: { label: 'Numero 8! 8️⃣', emoji: '8️⃣', sublabel: '6 + 2 = 8!' },
    distractors: [
      { label: 'Numero 5', emoji: '5️⃣', sublabel: 'È più piccolo di 6' },
      { label: 'Numero 3', emoji: '3️⃣', sublabel: 'È all\'inizio' },
    ],
    explanation: 'Campionessa di matematica! Saltando di due in due dopo il sei c\'è l\'otto!',
  },
  {
    prompt: 'Sequenza della Natura (ABC): Bruco 🐛 ➔ Bozzolo 🥜 ➔ Farfalla 🦋 : Bruco 🐛 ➔ Bozzolo 🥜 ➔ ...?',
    speech: 'Completa il ciclo: Bruco, Bozzolo, Farfalla... Bruco, Bozzolo... chi vola fuori adesso?',
    patternItems: ['🐛', '🥜', '🦋', '🐛', '🥜', '❓'],
    correct: { label: 'Farfalla 🦋', emoji: '🦋', sublabel: 'Spiega le ali!' },
    distractors: [
      { label: 'Bruco 🐛', emoji: '🐛', sublabel: 'È il primo passo' },
      { label: 'Pesce 🐟', emoji: '🐟', sublabel: 'Nuota nel mare' },
    ],
    explanation: 'Esatto! Dopo il bozzolo sboccia sempre la farfalla!',
  },
  {
    prompt: 'Sequenza Crescente (+1): 1 Stella ⭐ ➔ 2 Stelle ⭐⭐ ➔ 3 Stelle ⭐⭐⭐ ➔ Quante stelle vengono adesso?',
    speech: 'Ogni passo aggiunge una stellina in più: una stella, due stelle, tre stelle... quante stelline ci saranno nel prossimo riquadro?',
    patternItems: ['⭐', '⭐⭐', '⭐⭐⭐', '❓'],
    correct: { label: '4 Stelle ⭐⭐⭐⭐', emoji: '🌟', sublabel: '3 + 1 = 4 stelle!' },
    distractors: [
      { label: '1 Stella ⭐', emoji: '⭐', sublabel: 'Torna indietro' },
      { label: '2 Stelle ⭐⭐', emoji: '✨', sublabel: 'Sono meno di tre' },
    ],
    explanation: 'Perfetto! La scala cresce di uno ad ogni passo: 1, 2, 3 e 4!',
  },
];

export function getEncouragementPhrase(
  isSuccess: boolean,
  childProfile?: ChildProfile,
  includeName: boolean = Math.random() < 0.35
): string {
  const childName = childProfile?.name?.trim();
  const gender = childProfile?.gender;
  const bravo = getGenderedWord(gender, 'Bravissima', 'Bravissimo', 'Fantastico');
  const campione = getGenderedWord(gender, 'vera campionessa', 'vero campione', 'super stella');
  const pronto = getGenderedWord(gender, 'pronta', 'pronto', 'pronto');
  const vicino = getGenderedWord(gender, 'vicinissima', 'vicinissimo', 'vicino');
  const tranquillo = getGenderedWord(gender, 'Tranquilla', 'Tranquillo', 'Dai');

  if (isSuccess) {
    const withoutName = [
      `${bravo}! Risposta da ${campione}!`,
      'Eccezionale! Ragionamento perfetto!',
      'Fantastico! Hai risolto la sfida al volo!',
      'Proprio così! Che mente brillante!',
      'Meraviglioso! Ottima osservazione!',
      'Superlativo! Continua così!',
    ];
    const withName = childName
      ? [
          `${bravo} ${childName}! Ragionamento impeccabile!`,
          `Super ${childName}! Sei ${pronto} per grandi scoperte!`,
          `Proprio così, ${childName}! Che bella risposta!`,
        ]
      : withoutName;
    return includeName && childName
      ? withName[Math.floor(Math.random() * withName.length)]
      : withoutName[Math.floor(Math.random() * withoutName.length)];
  } else {
    const withoutName = [
      'Quasi! Osserva bene tutti gli indizi e riprova.',
      'Nessun problema, ragioniamo con calma e ritenta!',
      `Sei ${vicino}! Guarda bene le figure un'altra volta.`,
    ];
    const withName = childName
      ? [
          `Quasi, ${childName}! Osserva bene gli indizi e riprova.`,
          `${tranquillo} ${childName}, prova un'altra risposta con calma!`,
        ]
      : withoutName;
    return includeName && childName
      ? withName[Math.floor(Math.random() * withName.length)]
      : withoutName[Math.floor(Math.random() * withoutName.length)];
  }
}

function adaptGenderText(text: string, childProfile?: ChildProfile): string {
  const gender = childProfile?.gender || 'n';
  if (gender === 'f') {
    return text
      .replace(/\bBravissimo\b/g, 'Bravissima')
      .replace(/\bbravissimo\b/g, 'bravissima')
      .replace(/\bvero campione\b/gi, 'vera campionessa')
      .replace(/\bCampione\b/g, 'Campionessa')
      .replace(/\bcampione\b/g, 'campionessa')
      .replace(/\bpiccolo scienziato\b/gi, 'piccola scienziata')
      .replace(/\bvero botanico\b/gi, 'vera botanica')
      .replace(/\bvero musicista\b/gi, 'vera musicista')
      .replace(/\bvero matematico\b/gi, 'vera matematica')
      .replace(/\bvero programmatore\b/gi, 'vera programmatrice')
      .replace(/\bvero storico\b/gi, 'vera storica')
      .replace(/\bvero custode\b/gi, 'vera custode')
      .replace(/\bda astronomo\b/gi, 'da astronoma')
      .replace(/\barrabb?iato\b/g, 'arrabbiata')
      .replace(/\bfrustrato\b/g, 'frustrata')
      .replace(/\bAttento\b/g, 'Attenta')
      .replace(/\battento\b/g, 'attenta');
  }
  if (gender === 'm') {
    return text
      .replace(/\bBravissima\b/g, 'Bravissimo')
      .replace(/\bbravissima\b/g, 'bravissimo')
      .replace(/\bvera campionessa\b/gi, 'vero campione')
      .replace(/\bCampionessa\b/g, 'Campione')
      .replace(/\bcampionessa\b/g, 'campione')
      .replace(/\bpiccola scienziata\b/gi, 'piccolo scienziato')
      .replace(/\bvera botanica\b/gi, 'vero botanico')
      .replace(/\bvera musicista\b/gi, 'vero musicista')
      .replace(/\bvera matematica\b/gi, 'vero matematico')
      .replace(/\bvera programmatrice\b/gi, 'vero programmatore')
      .replace(/\bvera storica\b/gi, 'vero storico')
      .replace(/\bvera custode\b/gi, 'vero custode')
      .replace(/\bda astronoma\b/gi, 'da astronomo')
      .replace(/\barrabbiata\b/g, 'arrabbiato')
      .replace(/\bfrustrata\b/g, 'frustrato')
      .replace(/\bAttenta\b/g, 'Attento')
      .replace(/\battenta\b/g, 'attento');
  }
  return text
    .replace(/\bBravissim[ao]\b/g, 'Fantastico')
    .replace(/\bver[ao]\s+campion(?:essa|e)\b/gi, 'super stella')
    .replace(/\bCampion(?:essa|e)\b/g, 'Super')
    .replace(/\bcampion(?:essa|e)\b/g, 'super stella')
    .replace(/\bpiccol[ao]\s+scienziat[ao]\b/gi, 'giovane mente')
    .replace(/\bver[ao]\s+botanic[ao]\b/gi, 'amante della natura')
    .replace(/\bver[ao]\s+musicista\b/gi, 'grande talento musicale')
    .replace(/\bver[ao]\s+matematic[ao]\b/gi, 'mente matematica')
    .replace(/\bver[ao]\s+programmat(?:ore|rice)\b/gi, 'mente digitale')
    .replace(/\bver[ao]\s+storic[ao]\b/gi, 'mente curiosa')
    .replace(/\bver[ao]\s+custode\b/gi, 'custode')
    .replace(/\bda astronom[ao]\b/gi, 'di astronomia');
}

function personalizeSpeechWithName(
  speechText: string,
  childProfile: ChildProfile | undefined,
  level: number
): string {
  const cleanName = childProfile?.name?.trim();
  if (!cleanName) return speechText;

  // Avoid duplicating the child's name if already explicitly included in the sentence
  const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${escapedName}\\b`, 'i').test(speechText)) {
    return speechText;
  }

  const trimmed = speechText.trim();
  if (!trimmed) return speechText;

  const canLowercaseOpening =
    /^(Ascolta|Guarda|Tocca|Trova|Cerca|Osserva|Scegli|Conta|Completa|Indovina|Quale|Quali|Chi|Quanti|Quante|Dove|Cosa|Quanto|Come|Perché|Nel|Nella|In|Se|Un|Una|La|Il|Lo|Le|I|Sommiamo|Risolvi|Ricorda|Scopri|Aiuta|Abbina|Collega)\b/.test(
      trimmed
    );

  if (canLowercaseOpening) {
    const lowered = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    return level % 3 === 1
      ? `Dai ${cleanName}, ${lowered}`
      : `${cleanName}, ${lowered}`;
  }

  return `${cleanName}! ${trimmed}`;
}

function buildPersonalizedInitialLetterPuzzle(
  level: number,
  tier: number,
  guide: (typeof ANIMAL_GUIDES)[number],
  childProfile: ChildProfile
): Puzzle | null {
  const cleanName = childProfile.name.trim();
  if (!cleanName) return null;
  const firstLetter = cleanName.charAt(0).toUpperCase();
  const match = INITIAL_LETTER_WORD_BANK[firstLetter];
  if (!match) return null;

  const otherLetters = Object.keys(INITIAL_LETTER_WORD_BANK).filter((l) => l !== firstLetter);
  const d1Key = otherLetters[(level * 5 + 1) % otherLetters.length];
  const d2Key = otherLetters[(level * 7 + 4) % otherLetters.length];
  const d1 = INITIAL_LETTER_WORD_BANK[d1Key];
  const d2 = INITIAL_LETTER_WORD_BANK[d2Key];

  const options: PuzzleOption[] = deterministicShuffle(
    [
      {
        id: `opt_name_init_corr_${level}`,
        label: `${match.word} ${match.emoji}`,
        emoji: match.emoji,
        sublabel: `${firstLetter} di ${cleanName} e ${match.word}!`,
        isCorrect: true,
      },
      {
        id: `opt_name_init_d1_${level}`,
        label: `${d1.word} ${d1.emoji}`,
        emoji: d1.emoji,
        sublabel: `Inizia con ${d1Key}`,
        isCorrect: false,
      },
      {
        id: `opt_name_init_d2_${level}`,
        label: `${d2.word} ${d2.emoji}`,
        emoji: d2.emoji,
        sublabel: `Inizia con ${d2Key}`,
        isCorrect: false,
      },
    ],
    level * 37 + tier
  );

  return {
    id: `lvl_${level}_name_initial`,
    levelNumber: level,
    difficultyTier: tier,
    category: 'letters',
    type: 'initial_letter',
    title: `Livello ${level}: La Lettera Speciale di ${cleanName}! ✨`,
    prompt: `Quale di queste parole inizia con la "${firstLetter}" come ${cleanName.toUpperCase()}?`,
    speechText: `Cerchiamo la tua iniziale, ${cleanName}! Quale di queste parole comincia con la lettera ${firstLetter}?`,
    animalGuide: guide,
    iqParameterTag: 'Consapevolezza Fonologica & Iniziale (Gc · Gwm)',
    chcPrimary: 'Gc',
    chcSecondary: 'Gwm',
    diagnosticTarget: 'Riconoscimento del fonema iniziale associato al proprio nome (Gc · IR)',
    options,
    rewardStars: 3,
    rewardGems: 2,
    funExplanation: `Proprio ${match.word}! Inizia con la lettera ${firstLetter} proprio come ${cleanName}!`,
  };
}

interface EnrichmentModule {
  id: string;
  subjectLabel: string;
  titlePrefix: string;
  emoji: string;
  category: GameCategory;
  chcPrimary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  chcSecondary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  minBandIdx: number; // 0=2-3, 1=4-5, 2=6-7, 3=8-9, 4=10-12
  entries: AgeQuizEntry[];
}

const ENRICHMENT_MODULES: EnrichmentModule[] = [
  {
    id: 'empathy',
    subjectLabel: 'Educazione Emotiva & Empatia',
    titlePrefix: 'Cuore & Empatia',
    emoji: '💛',
    category: 'letters',
    chcPrimary: 'Gc',
    chcSecondary: 'Gf',
    minBandIdx: 0,
    entries: EMOTIONAL_EMPATHY_CATALOG,
  },
  {
    id: 'memory',
    subjectLabel: 'Memoria Visiva & Attenzione',
    titlePrefix: 'Memoria Lampo',
    emoji: '🎯',
    category: 'logic',
    chcPrimary: 'Gwm',
    chcSecondary: 'Gs',
    minBandIdx: 1,
    entries: MEMORY_ATTENTION_CATALOG,
  },
  {
    id: 'ecology',
    subjectLabel: 'Ecologia & Alimentazione',
    titlePrefix: 'Pianeta & Salute',
    emoji: '♻️',
    category: 'logic',
    chcPrimary: 'Gc',
    chcSecondary: 'Gf',
    minBandIdx: 1,
    entries: NATURE_ECOLOGY_CATALOG,
  },
  {
    id: 'financial_time',
    subjectLabel: 'Orologio & Educazione Finanziaria',
    titlePrefix: 'Tempo & Risparmio',
    emoji: '⏰',
    category: 'numbers',
    chcPrimary: 'Gf',
    chcSecondary: 'Gwm',
    minBandIdx: 2,
    entries: FINANCIAL_TIME_CATALOG,
  },
  {
    id: 'astronomy',
    subjectLabel: 'Astronomia & Universo',
    titlePrefix: 'Viaggio tra le Stelle',
    emoji: '🪐',
    category: 'shapes',
    chcPrimary: 'Gc',
    chcSecondary: 'Gv',
    minBandIdx: 2,
    entries: ASTRONOMY_SPACE_CATALOG,
  },
  {
    id: 'geography',
    subjectLabel: 'Geografia del Mondo',
    titlePrefix: 'Esploratori del Mondo',
    emoji: '🧭',
    category: 'shapes',
    chcPrimary: 'Gv',
    chcSecondary: 'Gc',
    minBandIdx: 3,
    entries: GEOGRAPHY_WORLD_CATALOG,
  },
  {
    id: 'inventions',
    subjectLabel: 'Invenzioni & Tecnologia',
    titlePrefix: 'Scienza & Invenzioni',
    emoji: '💻',
    category: 'logic',
    chcPrimary: 'Gf',
    chcSecondary: 'Gc',
    minBandIdx: 3,
    entries: INVENTIONS_TECH_CATALOG,
  },
  {
    id: 'philosophy',
    subjectLabel: 'Pensiero Critico & Filosofia',
    titlePrefix: 'Mente Critica',
    emoji: '🦉',
    category: 'logic',
    chcPrimary: 'Gf',
    chcSecondary: 'Gc',
    minBandIdx: 4,
    entries: PHILOSOPHY_CRITICAL_CATALOG,
  },
];

function buildDistinctNumericValues(correct: number, deltas: number[], total = 3): number[] {
  const minAllowed = correct >= 1 ? 1 : 0;
  const result: number[] = [correct];
  for (const d of deltas) {
    if (result.length >= total) break;
    const candidate = correct + d;
    if (candidate >= minAllowed && !result.includes(candidate)) {
      result.push(candidate);
    }
  }
  let fallbackOffset = 1;
  while (result.length < total) {
    const up = correct + fallbackOffset;
    if (!result.includes(up)) {
      result.push(up);
      if (result.length >= total) break;
    }
    const down = correct - fallbackOffset;
    if (down >= minAllowed && !result.includes(down)) {
      result.push(down);
    }
    fallbackOffset++;
  }
  return result;
}

// =========================================================================
// PROCEDURAL LEVEL GENERATOR (NON-REPEATING & PROGRESSIVE ACROSS 6 AGE BANDS: 2 -> 14 YEARS)
// Adapts difficulty tiers, numerical complexity, enrichment subjects & proportional early
// mastery unlocking immediately from birthDate and real learning statistics!
// =========================================================================
export function generateProceduralPuzzle(
  level: number,
  childProfile?: ChildProfile,
  progress?: UserProgress
): Puzzle {
  const guide = ANIMAL_GUIDES[(level * 5 + 1) % ANIMAL_GUIDES.length];
  const ageInfo = calculateChildAge(childProfile?.birthDate);
  const chronologicalBand = ageInfo.ageBand;
  const baseBandIdx = AGE_BAND_ORDER.indexOf(chronologicalBand);
  const mastery = computeAdaptiveMasteryProfile(progress);
  const effectiveBandIdx = AGE_BAND_ORDER.indexOf(mastery.effectiveBand);
  const childName = getDisplayChildName(childProfile);

  // Tier increases every 10 levels (1..10 = Tier 1, 11..20 = Tier 2, 21..30 = Tier 3, 31+ = Tier 4+)
  const tier = Math.floor((level - 1) / 10) + 1;
  const cycleIdx = tier - 1;
  const rawStep = ((level - 1) % 10) + 1; // 1..9 (10 is Svago)

  // Proportional mastery-based early unlocking schedule:
  // boostLevel 1 -> 2 out of 9 levels; boostLevel 2 -> 3 out of 9; boostLevel 3 -> 4 out of 9
  const isMasterySlot =
    (mastery.boostLevel === 1 && (rawStep === 4 || rawStep === 8)) ||
    (mastery.boostLevel === 2 && (rawStep === 3 || rawStep === 6 || rawStep === 9)) ||
    (mastery.boostLevel === 3 && rawStep % 2 === 0);

  const useEarlyBandPromotion = isMasterySlot && (level % 2 === 0 || effectiveBandIdx > baseBandIdx && level % 3 === 0);
  const useMasteryEnrichment = isMasterySlot && !useEarlyBandPromotion;

  const ageBand: AgeBandId =
    useEarlyBandPromotion && effectiveBandIdx > baseBandIdx
      ? mastery.effectiveBand
      : chronologicalBand;

  const isMasteryUnlocked = isMasterySlot && (effectiveBandIdx > baseBandIdx || useMasteryEnrichment);

  const tierStageLabel =
    tier === 1
      ? 'Base'
      : tier === 2
      ? 'Intermedio'
      : tier === 3
      ? 'Avanzato'
      : `Maestro Lv.${tier}`;

  const bandShiftDelta = Math.max(1, effectiveBandIdx - baseBandIdx);
  const difficultyLabel = isMasteryUnlocked
    ? useEarlyBandPromotion && effectiveBandIdx > baseBandIdx
      ? `Sbloccata per Merito · Fascia +${bandShiftDelta}`
      : 'Sbloccata per Merito · Materia Extra'
    : `${tierStageLabel} · ${ageInfo.shortAgeLabel}`;

  // Age-tailored & tier-progressive subject rotation (subjects unlock progressively with age & level!)
  const stepPermutationsByBand: Record<AgeBandId, number[][]> = {
    toddler_2_3: [
      // Tier 1 (Liv. 1-10): Animali, Artistica Colori/Forme, Conteggio 1-4, Ritmo Base, Logica Base
      [1, 4, 2, 3, 7, 1, 4, 2, 3],
      // Tier 2 (Liv. 11-20): Sblocca Prime Vocali (5) & Prime Somme 1-4 (9)
      [4, 1, 5, 2, 3, 7, 9, 4, 5],
      // Tier 3+ (Liv. 21+): Aggiunge Prime Parole Inglesi (6) & Sottrazioni Visive (8)
      [1, 5, 4, 3, 6, 7, 9, 8, 2],
    ],
    preschool_4_5: [
      [1, 4, 2, 3, 5, 7, 6, 8, 9],
      [7, 4, 6, 2, 5, 3, 8, 1, 9],
      [5, 8, 1, 7, 3, 9, 4, 6, 2],
      [6, 3, 8, 5, 9, 1, 2, 7, 4],
    ],
    early_primary_6_7: [
      [9, 5, 4, 7, 3, 8, 6, 1, 4],
      [5, 8, 4, 7, 2, 3, 1, 6, 9],
      [7, 9, 6, 5, 4, 3, 8, 1, 2],
    ],
    upper_primary_8_9: [
      [7, 9, 4, 1, 3, 5, 2, 8, 6],
      [2, 4, 7, 6, 3, 8, 5, 1, 9],
      [8, 7, 5, 4, 1, 2, 9, 3, 6],
    ],
    preteen_10_12: [
      [7, 2, 4, 1, 3, 5, 8, 6, 9],
      [2, 4, 7, 1, 3, 8, 5, 9, 6],
      [8, 7, 4, 5, 1, 2, 3, 6, 9],
    ],
    teen_13_14: [
      [7, 2, 1, 4, 5, 3, 8, 6, 9],
      [2, 7, 4, 1, 8, 5, 3, 9, 6],
      [8, 1, 7, 2, 4, 5, 6, 3, 9],
    ],
  };

  const bandPerms = stepPermutationsByBand[ageBand];
  const perm = bandPerms[Math.min(cycleIdx, bandPerms.length - 1)];
  const step = perm[(rawStep - 1) % 9];

  const uniqueIdx = cycleIdx * 3 + Math.floor((rawStep - 1) / 3);
  const mathTheme = MATH_ITEM_CATALOG[(level * 3 + cycleIdx) % MATH_ITEM_CATALOG.length];

  const finalize = (puzzle: Puzzle): Puzzle => {
    const genderedSpeech = adaptGenderText(puzzle.speechText, childProfile);
    return {
      ...puzzle,
      difficultyLabel: puzzle.difficultyLabel || difficultyLabel,
      isMasteryUnlocked: puzzle.isMasteryUnlocked ?? isMasteryUnlocked,
      title: adaptGenderText(puzzle.title, childProfile),
      prompt: adaptGenderText(puzzle.prompt, childProfile),
      speechText: personalizeSpeechWithName(genderedSpeech, childProfile, level),
      funExplanation: adaptGenderText(puzzle.funExplanation, childProfile),
      options: puzzle.options?.map((o) => ({
        ...o,
        label: adaptGenderText(o.label, childProfile),
        sublabel: o.sublabel ? adaptGenderText(o.sublabel, childProfile) : o.sublabel,
      })),
    };
  };

  // -------------------------------------------------------------
  // ENRICHMENT SUBJECTS (AGE-NATIVE & PROPORTIONAL MASTERY EARLY-UNLOCK)
  // Opens Empathy, Visual Memory, Ecology, Time/Finance, Astronomy,
  // World Geography, Inventions/Tech, and Critical Thinking/Philosophy!
  // -------------------------------------------------------------
  const isRegularEnrichmentSlot = !isMasterySlot && rawStep === 7 && level >= 7;
  if (useMasteryEnrichment || isRegularEnrichmentSlot) {
    const maxUnlockedIdx = useMasteryEnrichment
      ? Math.min(AGE_BAND_ORDER.length - 1, baseBandIdx + Math.max(1, effectiveBandIdx - baseBandIdx))
      : baseBandIdx;

    // Prefer stretch modules above chronological age when unlocked by mastery
    const stretchModules = ENRICHMENT_MODULES.filter(
      (m) => m.minBandIdx > baseBandIdx && m.minBandIdx <= maxUnlockedIdx
    );
    const eligibleModules =
      useMasteryEnrichment && stretchModules.length > 0
        ? stretchModules
        : ENRICHMENT_MODULES.filter((m) => m.minBandIdx <= maxUnlockedIdx);

    if (eligibleModules.length > 0) {
      const mod = eligibleModules[(cycleIdx + level) % eligibleModules.length];
      const entry = mod.entries[(cycleIdx + rawStep + Math.floor(level / 3)) % mod.entries.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_enr_corr_${level}`,
            label: entry.correct.label,
            emoji: entry.correct.emoji,
            sublabel: entry.correct.sublabel,
            isCorrect: true,
          },
          ...entry.distractors.map((d, i) => ({
            id: `opt_enr_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 83 + tier
      );

      return finalize({
        id: `lvl_${level}_enrich_${mod.id}`,
        levelNumber: level,
        difficultyTier: tier,
        category: mod.category,
        subjectLabel: mod.subjectLabel,
        isMasteryUnlocked: useMasteryEnrichment,
        type: 'iq_matrix',
        title: `Livello ${level}: ${mod.titlePrefix} ${mod.emoji}`,
        prompt: entry.prompt,
        speechText: entry.speech,
        animalGuide: guide,
        patternItems: entry.patternItems,
        iqParameterTag: entry.iqParameterTag || `${mod.subjectLabel} (${mod.chcPrimary} · ${mod.chcSecondary})`,
        chcPrimary: mod.chcPrimary,
        chcSecondary: mod.chcSecondary,
        diagnosticTarget: `${mod.subjectLabel} · ${useMasteryEnrichment ? 'Sbloccata per rendimento elevato' : ageInfo.shortAgeLabel}`,
        options,
        rewardStars: 3,
        rewardGems: useMasteryEnrichment ? 4 : 3,
        funExplanation: entry.explanation,
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 1: NATURA, SCIENZE, GEOGRAFIA, STORIA, CHIMICA & FISICA (6 BANDS: 2->14 ANNI)
  // -------------------------------------------------------------
  if (step === 1) {
    const pool =
      ageBand === 'toddler_2_3'
        ? TODDLER_ANIMALS
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_SCIENCE
        : ageBand === 'upper_primary_8_9'
        ? PRIMARY_ADV_SCIENCE
        : ageBand === 'preteen_10_12'
        ? PRETEEN_SCIENCE_HISTORY
        : ageBand === 'teen_13_14'
        ? TEEN_SCIENCE_CHEMISTRY_PHYSICS
        : NATURE_AND_ANIMALS_5YO;

    const item = pool[(cycleIdx * 2 + rawStep) % pool.length];
    const options: PuzzleOption[] = deterministicShuffle(
      [
        {
          id: `opt_nat_corr_${level}`,
          label: item.correct.label,
          emoji: item.correct.emoji,
          sublabel: item.correct.sublabel,
          isCorrect: true,
        },
        ...item.distractors.map((d, i) => ({
          id: `opt_nat_dist_${level}_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ],
      level * 17 + tier
    );

    const subjectByBand: Record<AgeBandId, { subject: string; title: string }> = {
      toddler_2_3: {
        subject: 'Animali & Versi',
        title: `Livello ${level}: Versi & Animali Amici 🐾`,
      },
      preschool_4_5: {
        subject: 'Natura & Animali',
        title: `Livello ${level}: Esploriamo la Natura & gli Animali 🌍`,
      },
      early_primary_6_7: {
        subject: 'Scienze Naturali',
        title: `Livello ${level}: Scienze & Scoperte (${ageInfo.shortAgeLabel}) 🔬`,
      },
      upper_primary_8_9: {
        subject: 'Scienze & Geografia',
        title: `Livello ${level}: Scienze della Terra & Geografia 🌍`,
      },
      preteen_10_12: {
        subject: 'Storia, Civica & Fisica',
        title: `Livello ${level}: Storia, Fisica & Astronomia 🔭`,
      },
      teen_13_14: {
        subject: 'Chimica, Biologia & Fisica',
        title: `Livello ${level}: Chimica, Fisica & Storia Moderna 🧪`,
      },
    };

    return finalize({
      id: `lvl_${level}_nature_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      subjectLabel: subjectByBand[ageBand].subject,
      type: 'animal_sounds',
      title: subjectByBand[ageBand].title,
      prompt: item.prompt,
      speechText: item.speech,
      animalGuide: guide,
      iqParameterTag:
        'iqParameterTag' in item && typeof item.iqParameterTag === 'string'
          ? item.iqParameterTag
          : 'Conoscenza Scientifica & Ragionamento (Gc · Gf)',
      chcPrimary: 'Gc',
      chcSecondary: 'Gf',
      diagnosticTarget: `${subjectByBand[ageBand].subject} · ${ageInfo.ageBandTitle} (Gc · Gf)`,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: item.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 2: CONTEGGIO (2–5), TABELLINE (6–7), DIVISIONI/FRAZIONI (8–9), PRE-ALGEBRA (10–12), ALGEBRA & RADICI (13–14)
  // -------------------------------------------------------------
  if (step === 2) {
    // Band F (13-14 Anni): Radici Quadrate -> Proporzioni -> Equazioni Algebriche con Parentesi
    if (ageBand === 'teen_13_14') {
      if (tier === 1) {
        const roots: { sym: string; rad: number; ans: number; tip: string }[] = [
          { sym: '√144', rad: 144, ans: 12, tip: '12 × 12 = 144, quindi √144 = 12!' },
          { sym: '√169', rad: 169, ans: 13, tip: '13 × 13 = 169, quindi √169 = 13!' },
          { sym: '√225', rad: 225, ans: 15, tip: '15 × 15 = 225, quindi √225 = 15!' },
          { sym: '√81 + √16', rad: 97, ans: 13, tip: '√81 = 9 e √16 = 4; sommati danno 13!' },
          { sym: '√100 + √25', rad: 125, ans: 15, tip: '√100 = 10 e √25 = 5; 10 + 5 = 15!' },
          { sym: '√196', rad: 196, ans: 14, tip: '14 × 14 = 196, quindi √196 = 14!' },
        ];
        const r = roots[(cycleIdx + rawStep + level) % roots.length];
        const vals = buildDistinctNumericValues(r.ans, [-2, 2, -1, 3]);
        const options: PuzzleOption[] = deterministicShuffle(
          vals.map((val, idx) => ({
            id: `opt_sqrt_${level}_${idx}`,
            label: `${val}`,
            emoji: '√',
            sublabel: `Valore esatto: ${val}`,
            isCorrect: val === r.ans,
          })),
          level * 89 + tier
        );
        return finalize({
          id: `lvl_${level}_sqrt_teen`,
          levelNumber: level,
          difficultyTier: tier,
          category: 'numbers',
          subjectLabel: 'Algebra & Radici Quadrate',
          type: 'visual_addition',
          title: `Livello ${level}: Radici Quadrate (${r.sym}) 📐`,
          prompt: `Calcola il valore esatto di ${r.sym} = ?`,
          speechText: `Sfida di algebra, ${childName}: quanto vale ${r.sym}?`,
          animalGuide: guide,
          iqParameterTag: 'Radici Quadrate & Algebra (Gf · Gwm)',
          chcPrimary: 'Gf',
          chcSecondary: 'Gwm',
          diagnosticTarget: 'Estrazione di radice quadrata e calcolo algebrico (13–14 anni)',
          patternItems: [r.sym, '=', '❓'],
          options,
          rewardStars: 3,
          rewardGems: 3,
          funExplanation: `Perfetto! ${r.tip} Da vero matematico!`,
        });
      }

      // Tier 2+: Equazioni di 1° grado con termini a entrambi i membri o parentesi
      const teenEquations: { eq: string; speechEq: string; x: number; tip: string }[] = [
        { eq: '2(x + 3) = 16', speechEq: 'due per aperta parentesi x più 3 chiusa uguale 16', x: 5, tip: 'Dividendo per 2: x + 3 = 8, quindi x = 5!' },
        { eq: '5x − 7 = 2x + 8', speechEq: 'cinque x meno 7 uguale due x più 8', x: 5, tip: '3x = 15, quindi x = 5!' },
        { eq: '3(x − 2) = 21', speechEq: 'tre per aperta parentesi x meno 2 chiusa uguale 21', x: 9, tip: 'x − 2 = 7, quindi x = 9!' },
        { eq: '4x + 5 = x + 26', speechEq: 'quattro x più 5 uguale x più 26', x: 7, tip: '3x = 21, quindi x = 7!' },
        { eq: '6x − 12 = 2x + 12', speechEq: 'sei x meno 12 uguale due x più 12', x: 6, tip: '4x = 24, quindi x = 6!' },
      ];
      const teq = teenEquations[(cycleIdx + rawStep + level) % teenEquations.length];
      const vals = buildDistinctNumericValues(teq.x, [-2, 2, -1, 3]);
      const options: PuzzleOption[] = deterministicShuffle(
        vals.map((val, idx) => ({
          id: `opt_teq_${level}_${idx}`,
          label: `x = ${val}`,
          emoji: '🧮',
          sublabel: 'Soluzione equazione',
          isCorrect: val === teq.x,
        })),
        level * 97 + tier
      );
      return finalize({
        id: `lvl_${level}_teen_eq`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        subjectLabel: 'Algebra & Equazioni 1° Grado',
        type: 'visual_addition',
        title: `Livello ${level}: Equazione Algebrica (${teq.eq}) 🧮`,
        prompt: `Risolvi l'equazione lineare: qual è il valore di x in ${teq.eq}?`,
        speechText: `Sfida di algebra, ${childName}: risolvi l'equazione ${teq.speechEq}. Quanto vale x?`,
        animalGuide: guide,
        iqParameterTag: 'Equazioni Lineari & Pensiero Algebrico (Gf · Gwm)',
        chcPrimary: 'Gf',
        chcSecondary: 'Gwm',
        diagnosticTarget: 'Risoluzione di equazioni algebriche di primo grado (13–14 anni)',
        patternItems: [teq.eq, '➔', 'x = ?'],
        options,
        rewardStars: 3,
        rewardGems: 4,
        funExplanation: `Eccezionale! ${teq.tip} Da vero matematico!`,
      });
    }

    // Band E (10-12 Anni): Progressive Pre-Algebra across Tiers (Potenze -> Percentuali -> Equazioni)
    if (ageBand === 'preteen_10_12') {
      if (tier === 1) {
        const powers: { base: number; exp: number; sym: string; ans: number }[] = [
          { base: 2, exp: 3, sym: '2³', ans: 8 },
          { base: 5, exp: 2, sym: '5²', ans: 25 },
          { base: 3, exp: 3, sym: '3³', ans: 27 },
          { base: 7, exp: 2, sym: '7²', ans: 49 },
          { base: 4, exp: 2, sym: '4²', ans: 16 },
          { base: 6, exp: 2, sym: '6²', ans: 36 },
          { base: 2, exp: 4, sym: '2⁴', ans: 16 },
          { base: 9, exp: 2, sym: '9²', ans: 81 },
        ];
        const p = powers[(cycleIdx * 3 + rawStep + level) % powers.length];
        const vals = buildDistinctNumericValues(p.ans, [-p.base, p.base, -2, 4]);
        const options: PuzzleOption[] = deterministicShuffle(
          vals.map((val, idx) => ({
            id: `opt_pow_${level}_${idx}`,
            label: `${val}`,
            emoji: '⚡',
            sublabel: `Risultato: ${val}`,
            isCorrect: val === p.ans,
          })),
          level * 61 + tier
        );
        return finalize({
          id: `lvl_${level}_powers`,
          levelNumber: level,
          difficultyTier: tier,
          category: 'numbers',
          subjectLabel: 'Pre-Algebra & Potenze',
          type: 'visual_addition',
          title: `Livello ${level}: Potenze (${p.sym}) ⚡`,
          prompt: `Quanto vale la potenza ${p.sym}?`,
          speechText: `Sfida sulle potenze, ${childName}: quanto vale ${p.sym}?`,
          animalGuide: guide,
          iqParameterTag: 'Potenze & Pensiero Algebrico (Gf · Gwm)',
          chcPrimary: 'Gf',
          chcSecondary: 'Gwm',
          diagnosticTarget: 'Calcolo esponenziale e comprensione delle potenze (10–12 anni)',
          patternItems: [p.sym, '=', '❓'],
          options,
          rewardStars: 3,
          rewardGems: 3,
          funExplanation: `Esatto! ${p.sym} significa moltiplicare ${p.base} per sé stesso ${p.exp} volte, cioè ${p.ans}! Da vero matematico!`,
        });
      }

      if (tier === 2) {
        const percents: { pct: number; total: number; ans: number }[] = [
          { pct: 25, total: 80, ans: 20 },
          { pct: 10, total: 150, ans: 15 },
          { pct: 20, total: 50, ans: 10 },
          { pct: 50, total: 64, ans: 32 },
          { pct: 25, total: 120, ans: 30 },
          { pct: 10, total: 240, ans: 24 },
          { pct: 50, total: 96, ans: 48 },
          { pct: 20, total: 75, ans: 15 },
        ];
        const q = percents[(cycleIdx * 2 + rawStep + level) % percents.length];
        const vals = buildDistinctNumericValues(q.ans, [-5, 5, -10, 10]);
        const options: PuzzleOption[] = deterministicShuffle(
          vals.map((val, idx) => ({
            id: `opt_pct_${level}_${idx}`,
            label: `${val}`,
            emoji: '📊',
            sublabel: `${q.pct}% di ${q.total}`,
            isCorrect: val === q.ans,
          })),
          level * 67 + tier
        );
        return finalize({
          id: `lvl_${level}_percent`,
          levelNumber: level,
          difficultyTier: tier,
          category: 'numbers',
          subjectLabel: 'Pre-Algebra & Percentuali',
          type: 'visual_addition',
          title: `Livello ${level}: Calcolo Percentuale (${q.pct}%) 📊`,
          prompt: `Quanto è il ${q.pct}% di ${q.total}?`,
          speechText: `Ragionamento proporzionale, ${childName}: quanto è il ${q.pct}% di ${q.total}?`,
          animalGuide: guide,
          iqParameterTag: 'Proporzioni & Percentuali (Gf · Gwm)',
          chcPrimary: 'Gf',
          chcSecondary: 'Gwm',
          diagnosticTarget: 'Calcolo mentale percentuale e ragionamento proporzionale (10–12 anni)',
          patternItems: [`${q.pct}%`, 'di', `${q.total}`, '=', '❓'],
          options,
          rewardStars: 3,
          rewardGems: 3,
          funExplanation: `Perfetto! Il ${q.pct}% di ${q.total} è esattamente ${q.ans}! Da vero matematico!`,
        });
      }

      // Tier 3+: Equazioni intuitive di 1° grado
      const equations: { eq: string; speechEq: string; x: number; explanation: string }[] = [
        {
          eq: '2x + 4 = 14',
          speechEq: 'due x più 4 uguale 14',
          x: 5,
          explanation: 'Sottraendo 4 otteniamo 2x = 10, quindi x = 5!',
        },
        {
          eq: '3x − 3 = 12',
          speechEq: 'tre x meno 3 uguale 12',
          x: 5,
          explanation: 'Aggiungendo 3 otteniamo 3x = 15, quindi x = 5!',
        },
        {
          eq: '5x = 35',
          speechEq: 'cinque x uguale 35',
          x: 7,
          explanation: 'Dividendo 35 per 5 troviamo subito x = 7!',
        },
        {
          eq: '4x + 2 = 22',
          speechEq: 'quattro x più 2 uguale 22',
          x: 5,
          explanation: 'Togliendo 2 otteniamo 4x = 20, quindi x = 5!',
        },
        {
          eq: '2x − 6 = 10',
          speechEq: 'due x meno 6 uguale 10',
          x: 8,
          explanation: 'Aggiungendo 6 otteniamo 2x = 16, quindi x = 8!',
        },
        {
          eq: '3x + 6 = 27',
          speechEq: 'tre x più 6 uguale 27',
          x: 7,
          explanation: 'Sottraendo 6 otteniamo 3x = 21, quindi x = 7!',
        },
      ];
      const eq = equations[(cycleIdx + rawStep + level) % equations.length];
      const vals = buildDistinctNumericValues(eq.x, [-2, 2, -1, 3]);
      const options: PuzzleOption[] = deterministicShuffle(
        vals.map((val, idx) => ({
          id: `opt_eq_${level}_${idx}`,
          label: `x = ${val}`,
          emoji: '🧮',
          sublabel: `Incognita x`,
          isCorrect: val === eq.x,
        })),
        level * 71 + tier
      );
      return finalize({
        id: `lvl_${level}_equation`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        subjectLabel: 'Pre-Algebra & Equazioni',
        type: 'visual_addition',
        title: `Livello ${level}: Trova l'Incognita (${eq.eq}) 🧮`,
        prompt: `Risolvi l'equazione: quanto vale x in ${eq.eq}?`,
        speechText: `Sfida di algebra, ${childName}: se ${eq.speechEq}, quanto vale la incognita x?`,
        animalGuide: guide,
        iqParameterTag: 'Risoluzione Equazioni & Logica Algebrica (Gf · Gwm)',
        chcPrimary: 'Gf',
        chcSecondary: 'Gwm',
        diagnosticTarget: 'Pensiero algebrico inverso ed equazioni di primo grado (10–12 anni)',
        patternItems: [eq.eq, '➔', 'x = ?'],
        options,
        rewardStars: 3,
        rewardGems: 3,
        funExplanation: `Eccezionale! ${eq.explanation} Da vero matematico!`,
      });
    }

    // Band D (8-9 Anni): Tier 1 Divisioni esatte -> Tier 2+ Frazioni di quantità
    if (ageBand === 'upper_primary_8_9') {
      if (tier === 1) {
        const divisions: [number, number][] = [
          [18, 3],
          [24, 4],
          [35, 5],
          [27, 3],
          [32, 4],
          [42, 6],
          [48, 8],
          [54, 9],
        ];
        const [dividend, divisor] = divisions[(cycleIdx + rawStep + level) % divisions.length];
        const answer = dividend / divisor;
        const vals = buildDistinctNumericValues(answer, [-2, 2, -1, 1]);
        const options: PuzzleOption[] = deterministicShuffle(
          vals.map((val, idx) => ({
            id: `opt_div_${level}_${idx}`,
            label: `${val}`,
            emoji: '➗',
            sublabel: `Quoziente: ${val}`,
            isCorrect: val === answer,
          })),
          level * 63 + tier
        );
        return finalize({
          id: `lvl_${level}_div_8_9`,
          levelNumber: level,
          difficultyTier: tier,
          category: 'numbers',
          subjectLabel: 'Divisioni & Calcolo',
          type: 'visual_subtraction',
          title: `Livello ${level}: Divisione Esatta (${dividend} ÷ ${divisor}) ➗`,
          prompt: `Calcolo mentale: quanto fa ${dividend} ÷ ${divisor} = ?`,
          speechText: `Sfida sulle divisioni, ${childName}: quanto fa ${dividend} diviso ${divisor}?`,
          animalGuide: guide,
          iqParameterTag: 'Divisione Esatta & Operazioni Inverse (Gf · Gwm)',
          chcPrimary: 'Gf',
          chcSecondary: 'Gwm',
          diagnosticTarget: 'Calcolo mentale inverso e divisioni esatte (8–9 anni)',
          patternItems: [`${dividend}`, '÷', `${divisor}`, '=', '❓'],
          options,
          rewardStars: 3,
          rewardGems: 3,
          funExplanation: `Perfetto! ${dividend} diviso ${divisor} fa ${answer}, perché ${answer} × ${divisor} = ${dividend}!`,
        });
      }

      // Tier 2+: Frazioni di quantità
      const fractions: { frac: string; num: number; den: number; total: number; ans: number }[] = [
        { frac: '½', num: 1, den: 2, total: 24, ans: 12 },
        { frac: '¼', num: 1, den: 4, total: 20, ans: 5 },
        { frac: '⅓', num: 1, den: 3, total: 18, ans: 6 },
        { frac: '⅕', num: 1, den: 5, total: 35, ans: 7 },
        { frac: '½', num: 1, den: 2, total: 36, ans: 18 },
        { frac: '¼', num: 1, den: 4, total: 32, ans: 8 },
      ];
      const f = fractions[(cycleIdx + rawStep + level) % fractions.length];
      const vals = buildDistinctNumericValues(f.ans, [-2, 3, -1, 2]);
      const options: PuzzleOption[] = deterministicShuffle(
        vals.map((val, idx) => ({
          id: `opt_frac_${level}_${idx}`,
          label: `${val}`,
          emoji: '🍕',
          sublabel: `${f.frac} di ${f.total}`,
          isCorrect: val === f.ans,
        })),
        level * 67 + tier
      );
      return finalize({
        id: `lvl_${level}_frac_8_9`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        subjectLabel: 'Frazioni & Ragionamento',
        type: 'visual_subtraction',
        title: `Livello ${level}: Frazioni (${f.frac} di ${f.total}) 🍕`,
        prompt: `Quanto vale ${f.frac} di ${f.total}?`,
        speechText: `Ragioniamo con le frazioni, ${childName}: quanto vale ${f.frac} di ${f.total}?`,
        animalGuide: guide,
        iqParameterTag: 'Frazioni & Pensiero Proporzionale (Gf · Gwm)',
        chcPrimary: 'Gf',
        chcSecondary: 'Gwm',
        diagnosticTarget: 'Comprensione delle frazioni unitarie di quantità (8–9 anni)',
        patternItems: [f.frac, 'di', `${f.total}`, '=', '❓'],
        options,
        rewardStars: 3,
        rewardGems: 3,
        funExplanation: `Esatto! Per trovare ${f.frac} di ${f.total} basta dividere ${f.total} per ${f.den}, cioè ${f.ans}!`,
      });
    }

    // Band C (6-7 Anni): Tier 2+ introduces prime tabelline ×2 e ×5!
    if (ageBand === 'early_primary_6_7' && tier >= 2) {
      const earlyMult: [number, number][] = [
        [2, 4],
        [2, 6],
        [5, 3],
        [5, 4],
        [2, 7],
        [5, 5],
        [2, 8],
        [3, 4],
      ];
      const [a, b] = earlyMult[(cycleIdx + rawStep + level) % earlyMult.length];
      const answer = a * b;
      const vals = buildDistinctNumericValues(answer, [-a, a, 2, -2]);
      const options: PuzzleOption[] = deterministicShuffle(
        vals.map((val, idx) => ({
          id: `opt_emul_${level}_${idx}`,
          label: `${val}`,
          emoji: '✖️',
          sublabel: `Risultato: ${val}`,
          isCorrect: val === answer,
        })),
        level * 59 + tier
      );
      return finalize({
        id: `lvl_${level}_early_mult`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        subjectLabel: 'Prime Tabelline',
        type: 'visual_addition',
        title: `Livello ${level}: Prime Tabelline (${a} × ${b}) ✖️`,
        prompt: `Quante volte fa ${a} × ${b} = ?`,
        speechText: `Sfida delle prime tabelline, ${childName}: quanto fa ${a} per ${b}?`,
        animalGuide: guide,
        iqParameterTag: 'Moltiplicazione Introduttiva (Gf · Gwm)',
        chcPrimary: 'Gf',
        chcSecondary: 'Gwm',
        diagnosticTarget: 'Addizione ripetuta e prime tabelline ×2, ×3, ×5 (6–7 anni)',
        patternItems: [`${a}`, '×', `${b}`, '=', '❓'],
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: `Fantastico! ${a} ripetuto ${b} volte fa esattamente ${answer}!`,
      });
    }

    // Bands A (2-3), B (4-5), C Tier 1 (6-7): Interactive tactile counting
    const countPool =
      ageBand === 'toddler_2_3'
        ? tier === 1
          ? [2, 3, 2, 4, 3]
          : [3, 4, 5, 4, 5]
        : ageBand === 'preschool_4_5'
        ? tier === 1
          ? [4, 5, 6, 7, 5, 6]
          : [6, 7, 8, 9, 8, 10]
        : [8, 9, 10, 9, 10];
    const targetCount = countPool[(cycleIdx + rawStep) % countPool.length];

    const formatted = formatQuantityItalian(targetCount, mathTheme);
    const formattedAll = formatAllPluralItalian(targetCount, mathTheme);
    const completedPronoun = mathTheme.gender === 'f' ? 'Le hai contate tutte' : 'Li hai contati tutti';

    return finalize({
      id: `lvl_${level}_count_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      subjectLabel: ageBand === 'toddler_2_3' ? 'Primi Numeri (1–5)' : 'Numeri & Conteggio',
      type: 'count_interactive',
      title: `Livello ${level}: Conteggio fino a ${targetCount}!`,
      prompt: `Tocca ${formattedAll.text}, ${mathTheme.eachPhrase}!`,
      speechText: `Sfida di attenzione, ${childName}: tocca ${formattedAll.speech}, ${mathTheme.eachPhrase}, per ${mathTheme.countPronoun} fino a ${targetCount}!`,
      animalGuide: guide,
      iqParameterTag: 'Memoria di Lavoro & Enumerazione (Gwm · Gs)',
      chcPrimary: 'Gwm',
      chcSecondary: 'Gs',
      diagnosticTarget: `Controllo esecutivo nel conteggio (${ageInfo.shortAgeLabel}) (Gwm · Gs)`,
      targetCount,
      itemEmoji: mathTheme.emoji,
      itemName: formatted.text,
      itemGender: mathTheme.gender,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: `${completedPronoun} con precisione: sono proprio ${formatted.speech}!`,
    });
  }

  // -------------------------------------------------------------
  // STEP 3: MUSICA, SENSO DEL RITMO, ORCHESTRA, COMPOSITORI & TEORIA (6 BANDS: 2->14 ANNI)
  // -------------------------------------------------------------
  if (step === 3) {
    const musicPool =
      ageBand === 'toddler_2_3'
        ? TODDLER_MUSIC_RHYTHM
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_MUSIC
        : ageBand === 'upper_primary_8_9'
        ? UPPER_PRIMARY_MUSIC
        : ageBand === 'preteen_10_12'
        ? PRETEEN_MUSIC_CULTURE
        : ageBand === 'teen_13_14'
        ? TEEN_MUSIC_THEORY
        : MUSIC_RHYTHM_CATALOG;

    const musicItem = musicPool[(cycleIdx + rawStep) % musicPool.length];
    const options: PuzzleOption[] = deterministicShuffle(
      [
        {
          id: `opt_music_corr_${level}`,
          label: musicItem.correct.label,
          emoji: musicItem.correct.emoji,
          sublabel: musicItem.correct.sublabel,
          noteFreq: musicItem.correct.noteFreq,
          isCorrect: true,
        },
        ...musicItem.distractors.map((d, i) => ({
          id: `opt_music_dist_${level}_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          noteFreq: d.noteFreq,
          isCorrect: false,
        })),
      ],
      level * 23 + tier
    );

    const musicSubjectLabel =
      ageBand === 'toddler_2_3'
        ? 'Musica & Senso del Ritmo'
        : ageBand === 'preschool_4_5'
        ? 'Musica, Ritmo & Strumenti'
        : ageBand === 'early_primary_6_7'
        ? 'Scala Musicale & Ritmo'
        : ageBand === 'upper_primary_8_9'
        ? 'Musica, Note & Orchestra'
        : ageBand === 'preteen_10_12'
        ? 'Musica Classica & Armonia'
        : 'Teoria Musicale & Acustica';

    return finalize({
      id: `lvl_${level}_music_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'music',
      subjectLabel: musicSubjectLabel,
      type: 'music_rhythm',
      title: `Livello ${level}: ${musicItem.title} 🎵`,
      prompt: musicItem.prompt,
      speechText: musicItem.speech,
      animalGuide: guide,
      iqParameterTag: 'Senso del Ritmo & Memoria Uditiva (Gwm · Gf)',
      chcPrimary: 'Gwm',
      chcSecondary: 'Gf',
      diagnosticTarget: `${musicSubjectLabel} · Codifica ritmico-melodica (${ageInfo.shortAgeLabel})`,
      rhythmNotes: musicItem.rhythmNotes,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: musicItem.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 4: ARTISTICA, COLORI, PITTURA, PROSPETTIVA & GEOMETRIA (5 BANDS)
  // -------------------------------------------------------------
  if (step === 4) {
    if (ageBand === 'toddler_2_3') {
      const item = TODDLER_COLORS_SHAPES[(cycleIdx + rawStep) % TODDLER_COLORS_SHAPES.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_todd_col_corr_${level}`,
            label: item.correct.label,
            emoji: item.correct.emoji,
            sublabel: item.correct.sublabel,
            color: item.correct.color,
            isCorrect: true,
          },
          ...item.distractors.map((d, i) => ({
            id: `opt_todd_col_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            color: d.color,
            isCorrect: false,
          })),
        ],
        level * 19 + tier
      );
      return finalize({
        id: `lvl_${level}_toddler_shapes`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        subjectLabel: 'Artistica: Colori & Forme',
        type: 'find_color',
        title: `Livello ${level}: Artistica · Colori & Forme 🎨`,
        prompt: item.prompt,
        speechText: item.speech,
        animalGuide: guide,
        iqParameterTag: 'Percezione Visiva Colori & Forme (Gv · Gs)',
        chcPrimary: 'Gv',
        chcSecondary: 'Gs',
        diagnosticTarget: 'Discriminazione cromatica e forme geometriche base (Gv)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: item.explanation,
      });
    }

    if (
      ageBand === 'early_primary_6_7' ||
      ageBand === 'upper_primary_8_9' ||
      ageBand === 'preteen_10_12' ||
      ageBand === 'teen_13_14'
    ) {
      const useArtCatalog =
        ageBand !== 'preteen_10_12' && ageBand !== 'teen_13_14' && (cycleIdx + rawStep) % 2 === 0;
      const geoArtPool =
        ageBand === 'teen_13_14'
          ? TEEN_ART_ARCHITECTURE
          : ageBand === 'preteen_10_12'
          ? PRETEEN_ART_GEOMETRY
          : ageBand === 'upper_primary_8_9'
          ? useArtCatalog
            ? UPPER_PRIMARY_ART
            : PRIMARY_ADV_GEOMETRY
          : useArtCatalog
          ? EARLY_PRIMARY_ART
          : EARLY_PRIMARY_GEOMETRY;

      const geoItem = geoArtPool[(cycleIdx + rawStep) % geoArtPool.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_geo_adv_corr_${level}`,
            label: geoItem.correct.label,
            emoji: geoItem.correct.emoji,
            sublabel: geoItem.correct.sublabel,
            color: geoItem.correct.color,
            isCorrect: true,
          },
          ...geoItem.distractors.map((d, i) => ({
            id: `opt_geo_adv_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            color: d.color,
            isCorrect: false,
          })),
        ],
        level * 29 + tier
      );

      const subjectLabel =
        ageBand === 'teen_13_14'
          ? 'Arte Moderna, Solidi & Pitagora'
          : ageBand === 'preteen_10_12'
          ? 'Arte, Prospettiva & Geometria'
          : useArtCatalog
          ? ageBand === 'upper_primary_8_9'
            ? 'Artistica & Grandi Pittori'
            : 'Artistica, Colori & Simmetria'
          : 'Geometria & Poligoni';

      return finalize({
        id: `lvl_${level}_geo_art_${ageBand}`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        subjectLabel,
        type: 'match_shape',
        title: `Livello ${level}: ${subjectLabel} (${ageInfo.shortAgeLabel}) ${useArtCatalog || ageBand === 'preteen_10_12' ? '🎨' : '📐'}`,
        prompt: geoItem.prompt,
        speechText: geoItem.speech,
        animalGuide: guide,
        iqParameterTag: geoItem.iqParameterTag || 'Percezione Artistica & Geometria Spaziale (Gv · Gf)',
        chcPrimary: 'Gv',
        chcSecondary: 'Gf',
        diagnosticTarget: `${subjectLabel} (${ageInfo.shortAgeLabel})`,
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: geoItem.explanation,
      });
    }

    // Preschool 4-5yo: alternates Artistica Color Mix & 5yo Geometry
    const useColorMix = (cycleIdx + rawStep) % 2 === 0;
    if (useColorMix) {
      const mix = COLOR_MIXES[(cycleIdx + Math.floor(rawStep / 2)) % COLOR_MIXES.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_mix_corr_${level}`,
            label: mix.correct.label,
            emoji: mix.correct.emoji,
            color: mix.correct.color,
            isCorrect: true,
          },
          ...mix.distractors.map((d, i) => ({
            id: `opt_mix_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            color: d.color,
            isCorrect: false,
          })),
        ],
        level * 19 + tier
      );

      return finalize({
        id: `lvl_${level}_colormix`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        subjectLabel: 'Artistica: Mescolanza Colori',
        type: 'color_mix',
        title: `Livello ${level}: Artistica · Laboratorio Colori 🎨`,
        prompt: mix.prompt,
        speechText: mix.speech,
        animalGuide: guide,
        iqParameterTag: 'Sintesi Cromatica & Trasformazione (Gv · Gf)',
        chcPrimary: 'Gv',
        chcSecondary: 'Gf',
        diagnosticTarget: 'Visualizzazione percettiva e combinazione cromatica (Gv · IT)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: mix.explanation,
      });
    } else {
      const geoItem = GEOMETRY_AND_SPACE_5YO[(cycleIdx + Math.floor(rawStep / 2)) % GEOMETRY_AND_SPACE_5YO.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_geo_corr_${level}`,
            label: geoItem.correct.label,
            emoji: geoItem.correct.emoji,
            sublabel: geoItem.correct.sublabel,
            isCorrect: true,
          },
          ...geoItem.distractors.map((d, i) => ({
            id: `opt_geo_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 29 + tier
      );

      return finalize({
        id: `lvl_${level}_geometry`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        subjectLabel: 'Geometria & Spazio',
        type: 'match_shape',
        title: `Livello ${level}: Geometria & Spazio 🔷`,
        prompt: geoItem.prompt,
        speechText: geoItem.speech,
        animalGuide: guide,
        iqParameterTag: 'Relazioni Visuo-Spaziali & Geometria (Gv · Gs)',
        chcPrimary: 'Gv',
        chcSecondary: 'Gs',
        diagnosticTarget: 'Analisi geometrica dei lati, forme e orientamento spaziale (Gv · Gs)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: geoItem.explanation,
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 5: LINGUAGGIO, LETTERE, ORTOGRAFIA, GRAMMATICA & ANALISI LOGICA (5 BANDS)
  // -------------------------------------------------------------
  if (step === 5) {
    // Personalized puzzle using the child's OWN initial letter for ages 2-5
    if (
      childProfile?.name?.trim() &&
      (ageBand === 'toddler_2_3' || ageBand === 'preschool_4_5') &&
      cycleIdx % 3 === 0 &&
      rawStep <= 6
    ) {
      const personalPuzzle = buildPersonalizedInitialLetterPuzzle(level, tier, guide, childProfile);
      if (personalPuzzle) {
        personalPuzzle.subjectLabel = 'Lettere & Nome Personale';
        return finalize(personalPuzzle);
      }
    }

    if (ageBand === 'toddler_2_3') {
      const item = TODDLER_LETTERS[(cycleIdx + rawStep) % TODDLER_LETTERS.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_todd_let_corr_${level}`,
            label: item.correct.label,
            emoji: item.correct.emoji,
            sublabel: item.correct.sublabel,
            isCorrect: true,
          },
          ...item.distractors.map((d, i) => ({
            id: `opt_todd_let_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 31 + tier
      );
      return finalize({
        id: `lvl_${level}_toddler_letters`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'letters',
        subjectLabel: 'Prime Vocali & Suoni',
        type: 'initial_letter',
        title: `Livello ${level}: Prime Letterine & Suoni 🔤`,
        prompt: item.prompt,
        speechText: item.speech,
        animalGuide: guide,
        iqParameterTag: 'Primi Suoni & Vocabolario (Gc)',
        chcPrimary: 'Gc',
        chcSecondary: 'Gwm',
        diagnosticTarget: 'Riconoscimento vocale iniziale e associazioni visivo-verbali (Gc)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: item.explanation,
      });
    }

    if (
      ageBand === 'early_primary_6_7' ||
      ageBand === 'upper_primary_8_9' ||
      ageBand === 'preteen_10_12' ||
      ageBand === 'teen_13_14'
    ) {
      const langPool =
        ageBand === 'teen_13_14'
          ? TEEN_LANGUAGE_LITERATURE
          : ageBand === 'preteen_10_12'
          ? PRETEEN_LANGUAGE_LOGIC
          : ageBand === 'upper_primary_8_9'
          ? PRIMARY_ADV_LANGUAGE
          : EARLY_PRIMARY_LANGUAGE;
      const langItem = langPool[(cycleIdx + rawStep) % langPool.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_lang_adv_corr_${level}`,
            label: langItem.correct.label,
            emoji: langItem.correct.emoji,
            sublabel: langItem.correct.sublabel,
            isCorrect: true,
          },
          ...langItem.distractors.map((d, i) => ({
            id: `opt_lang_adv_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 37 + tier
      );

      const subjectLabel =
        ageBand === 'teen_13_14'
          ? 'Letteratura & Analisi del Periodo'
          : ageBand === 'preteen_10_12'
          ? 'Analisi Logica & Retorica'
          : ageBand === 'upper_primary_8_9'
          ? 'Grammatica & Sinonimi'
          : 'Ortografia & Contrari';

      return finalize({
        id: `lvl_${level}_lang_${ageBand}`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'letters',
        subjectLabel,
        type: 'spell_word',
        title: `Livello ${level}: ${subjectLabel} 📘`,
        prompt: langItem.prompt,
        speechText: langItem.speech,
        animalGuide: guide,
        iqParameterTag: langItem.iqParameterTag || 'Competenza Linguistica & Ortografica (Gc · Gwm)',
        chcPrimary: 'Gc',
        chcSecondary: 'Gwm',
        diagnosticTarget: `${subjectLabel} (${ageInfo.shortAgeLabel})`,
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: langItem.explanation,
      });
    }

    // Preschool 4-5yo: alternates Riddles & Syllables/Rhymes
    const useRiddle = (cycleIdx + rawStep) % 2 === 1;
    if (useRiddle) {
      const riddle = KID_RIDDLES[(cycleIdx + rawStep) % KID_RIDDLES.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_riddle_corr_${level}`,
            label: riddle.correct.label,
            emoji: riddle.correct.emoji,
            sublabel: riddle.correct.sublabel,
            isCorrect: true,
          },
          ...riddle.distractors.map((d, i) => ({
            id: `opt_riddle_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 31 + tier
      );

      return finalize({
        id: `lvl_${level}_riddle`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'letters',
        subjectLabel: 'Indovinelli & Deduzione',
        type: 'riddle',
        title: `Livello ${level}: Indovinello di Logica & Rima 🧩`,
        prompt: riddle.riddleText,
        speechText: riddle.speech,
        animalGuide: guide,
        iqParameterTag: 'Inferenza Verbale & Deduzione (Gc · Gf)',
        chcPrimary: 'Gc',
        chcSecondary: 'Gf',
        diagnosticTarget: 'Comprensione degli indizi verbali e sintesi deduttiva (Gc · IT)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: riddle.explanation,
      });
    } else {
      const langItem = LANGUAGE_AND_SYLLABLES_5YO[(cycleIdx + rawStep) % LANGUAGE_AND_SYLLABLES_5YO.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_lang_corr_${level}`,
            label: langItem.correct.label,
            emoji: langItem.correct.emoji,
            sublabel: langItem.correct.sublabel,
            isCorrect: true,
          },
          ...langItem.distractors.map((d, i) => ({
            id: `opt_lang_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 37 + tier
      );

      return finalize({
        id: `lvl_${level}_syllables`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'letters',
        subjectLabel: 'Fonetica, Sillabe & Rime',
        type: 'initial_letter',
        title: `Livello ${level}: Sillabe, Rime & Parole 🔤`,
        prompt: langItem.prompt,
        speechText: langItem.speech,
        animalGuide: guide,
        iqParameterTag: 'Consapevolezza Fonologica & Sillabica (Gc · Gwm)',
        chcPrimary: 'Gc',
        chcSecondary: 'Gwm',
        diagnosticTarget: 'Segmentazione sillabica, riconoscimento rime e pre-lettura (Gc · IR)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: langItem.explanation,
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 6: INGLESE CALIBRATO PER ETÀ (6 BANDS: BASE -> A1 -> A1+ -> A2 -> B1)
  // -------------------------------------------------------------
  if (step === 6) {
    const engPool =
      ageBand === 'toddler_2_3'
        ? TODDLER_ENGLISH
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_ENGLISH
        : ageBand === 'upper_primary_8_9'
        ? PRIMARY_ADV_ENGLISH
        : ageBand === 'preteen_10_12'
        ? PRETEEN_ENGLISH_A2
        : ageBand === 'teen_13_14'
        ? TEEN_ENGLISH_B1
        : ENGLISH_WORDS_CATALOG;
    const engItem = engPool[(cycleIdx * 2 + rawStep) % engPool.length];
    const options: PuzzleOption[] = deterministicShuffle(
      [
        {
          id: `opt_eng_corr_${level}`,
          label: engItem.correct.label,
          emoji: engItem.correct.emoji,
          sublabel: engItem.correct.sublabel,
          isCorrect: true,
        },
        ...engItem.distractors.map((d, i) => ({
          id: `opt_eng_dist_${level}_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ],
      level * 41 + tier
    );

    const engSubjectLabel =
      ageBand === 'teen_13_14'
        ? 'Inglese Avanzato (B1)'
        : ageBand === 'preteen_10_12'
        ? 'Inglese Ragazzi (A2)'
        : ageBand === 'upper_primary_8_9'
        ? 'Inglese Primaria (A1+)'
        : ageBand === 'early_primary_6_7'
        ? 'Inglese Primaria (A1)'
        : 'Inglese Prescolare';

    return finalize({
      id: `lvl_${level}_english_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'english',
      subjectLabel: engSubjectLabel,
      type: 'english_words',
      title: `Livello ${level}: ${engSubjectLabel} · "${engItem.wordInfo.en}" 🇬🇧`,
      prompt: engItem.prompt,
      speechText: engItem.speech,
      animalGuide: guide,
      iqParameterTag: 'Plasticità Lessicale Bilingue (Gc · Gwm)',
      chcPrimary: 'Gc',
      chcSecondary: 'Gwm',
      diagnosticTarget: `${engSubjectLabel} · Acquisizione L2 (${ageInfo.shortAgeLabel})`,
      englishWord: engItem.wordInfo,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: engItem.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 7: PROVA LOGICA, RAGIONAMENTO, CODING, ALGORITMI & PROBABILITÀ (6 BANDS)
  // -------------------------------------------------------------
  if (step === 7) {
    const logicPool =
      ageBand === 'toddler_2_3'
        ? TODDLER_LOGIC
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_LOGIC
        : ageBand === 'upper_primary_8_9'
        ? PRIMARY_ADV_LOGIC
        : ageBand === 'preteen_10_12'
        ? PRETEEN_LOGIC_CODING
        : ageBand === 'teen_13_14'
        ? TEEN_LOGIC_ALGORITHMS
        : IQ_PSYCHOMETRIC_CATALOG;

    const iqItem = logicPool[(cycleIdx * 2 + rawStep) % logicPool.length];
    const options: PuzzleOption[] = deterministicShuffle(
      [
        {
          id: `opt_iq_corr_${level}`,
          label: iqItem.correct.label,
          emoji: iqItem.correct.emoji,
          sublabel: iqItem.correct.sublabel,
          isCorrect: true,
        },
        ...iqItem.distractors.map((d, i) => ({
          id: `opt_iq_dist_${level}_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ],
      level * 43 + tier
    );

    const logicSubjectLabel =
      ageBand === 'teen_13_14'
        ? 'Algoritmi & Logica Booleana'
        : ageBand === 'preteen_10_12'
        ? 'Logica, Coding & Probabilità'
        : ageBand === 'upper_primary_8_9'
        ? 'Logica & Pensiero Laterale'
        : 'Logica & Ragionamento';

    return finalize({
      id: `lvl_${level}_iq_matrix_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      subjectLabel: logicSubjectLabel,
      type: 'iq_matrix',
      title: `Livello ${level}: ${logicSubjectLabel} 🧠`,
      prompt: iqItem.prompt,
      speechText: iqItem.speech,
      animalGuide: guide,
      patternItems: iqItem.patternItems,
      iqParameterTag: iqItem.iqParameterTag || 'Ragionamento Fluido (Gf · Gv)',
      chcPrimary: 'Gf',
      chcSecondary: 'Gv',
      diagnosticTarget: `${logicSubjectLabel} (${ageInfo.shortAgeLabel}) (Gf · IT · IC)`,
      options,
      rewardStars: 3,
      rewardGems: 3,
      funExplanation: iqItem.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 8: SOTTRAZIONE PROGRESSIVA / ESPRESSIONI CON PRIORITÀ (10–14)
  // -------------------------------------------------------------
  if (step === 8) {
    if (ageBand === 'preteen_10_12' || ageBand === 'teen_13_14') {
      const expressionsByTier: { expr: string; speechExpr: string; ans: number; tip: string }[][] = [
        [
          { expr: '4 + 3 × 5', speechExpr: '4 più 3 per 5', ans: 19, tip: 'Prima si esegue 3 × 5 = 15, poi 4 + 15 = 19!' },
          { expr: '20 − 2 × 6', speechExpr: '20 meno 2 per 6', ans: 8, tip: 'Prima 2 × 6 = 12, poi 20 − 12 = 8!' },
          { expr: '18 ÷ 3 + 7', speechExpr: '18 diviso 3 più 7', ans: 13, tip: 'Prima 18 ÷ 3 = 6, poi 6 + 7 = 13!' },
          { expr: '5 × 4 − 9', speechExpr: '5 per 4 meno 9', ans: 11, tip: 'Prima 5 × 4 = 20, poi 20 − 9 = 11!' },
        ],
        [
          { expr: '(8 + 4) ÷ 3', speechExpr: 'aperta parentesi 8 più 4 chiusa diviso 3', ans: 4, tip: 'Prima la parentesi (8 + 4) = 12, poi 12 ÷ 3 = 4!' },
          { expr: '3 × (7 − 2)', speechExpr: '3 per aperta parentesi 7 meno 2', ans: 15, tip: 'Prima la parentesi (7 − 2) = 5, poi 3 × 5 = 15!' },
          { expr: '6 × 4 + 8 ÷ 2', speechExpr: '6 per 4 più 8 diviso 2', ans: 28, tip: '6 × 4 = 24 e 8 ÷ 2 = 4; sommati danno 28!' },
          { expr: '(15 − 3) × 2', speechExpr: 'aperta parentesi 15 meno 3 chiusa per 2', ans: 24, tip: 'Prima (15 − 3) = 12, poi 12 × 2 = 24!' },
        ],
        [
          { expr: '5² − 10', speechExpr: '5 alla seconda meno 10', ans: 15, tip: 'Prima la potenza 5² = 25, poi 25 − 10 = 15!' },
          { expr: '2³ × 4 − 2', speechExpr: '2 alla terza per 4 meno 2', ans: 30, tip: '2³ = 8; 8 × 4 = 32; 32 − 2 = 30!' },
          { expr: '3² + 4²', speechExpr: '3 alla seconda più 4 alla seconda', ans: 25, tip: '9 + 16 = 25 (la terna di Pitagora 3-4-5)!' },
          { expr: '(6² − 6) ÷ 5', speechExpr: 'aperta parentesi 6 alla seconda meno 6 chiusa diviso 5', ans: 6, tip: '36 − 6 = 30; poi 30 ÷ 5 = 6!' },
        ],
      ];
      const exprPool = expressionsByTier[Math.min(tier - 1, expressionsByTier.length - 1)];
      const ex = exprPool[(cycleIdx + rawStep + level) % exprPool.length];
      const vals = buildDistinctNumericValues(ex.ans, [-4, 4, -2, 6]);
      const options: PuzzleOption[] = deterministicShuffle(
        vals.map((val, idx) => ({
          id: `opt_expr_${level}_${idx}`,
          label: `${val}`,
          emoji: '🧮',
          sublabel: `Risultato: ${val}`,
          isCorrect: val === ex.ans,
        })),
        level * 73 + tier
      );
      return finalize({
        id: `lvl_${level}_expr_preteen`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        subjectLabel: 'Espressioni & Priorità',
        type: 'visual_subtraction',
        title: `Livello ${level}: Espressioni (${ex.expr}) 🧮`,
        prompt: `Rispetta l'ordine delle operazioni: quanto fa ${ex.expr} = ?`,
        speechText: `Attenzione alla priorità delle operazioni, ${childName}: quanto fa ${ex.speechExpr}?`,
        animalGuide: guide,
        iqParameterTag: 'Ordine Operazioni & Memoria di Lavoro (Gwm · Gf)',
        chcPrimary: 'Gwm',
        chcSecondary: 'Gf',
        diagnosticTarget: 'Calcolo di espressioni aritmetiche con priorità e parentesi (10–12 anni)',
        patternItems: [ex.expr, '=', '❓'],
        options,
        rewardStars: 3,
        rewardGems: 3,
        funExplanation: `Perfetto! ${ex.tip} Da vero matematico!`,
      });
    }

    const subtractionPairsByBand: Record<'toddler_2_3' | 'preschool_4_5' | 'early_primary_6_7' | 'upper_primary_8_9', [number, number][]> = {
      toddler_2_3: [
        [3, 1],
        [4, 1],
        [4, 2],
        [5, 1],
      ],
      preschool_4_5:
        tier === 1
          ? [
              [4, 1],
              [5, 2],
              [6, 2],
              [5, 3],
              [7, 2],
              [6, 3],
            ]
          : [
              [8, 3],
              [7, 4],
              [9, 3],
              [9, 4],
              [10, 3],
              [10, 4],
            ],
      early_primary_6_7:
        tier === 1
          ? [
              [12, 4],
              [15, 6],
              [14, 5],
              [16, 7],
              [18, 5],
              [20, 6],
            ]
          : [
              [24, 8],
              [27, 9],
              [30, 12],
              [25, 7],
              [28, 11],
              [32, 9],
            ],
      upper_primary_8_9:
        tier === 1
          ? [
              [32, 14],
              [45, 18],
              [38, 19],
              [50, 23],
              [42, 15],
              [54, 26],
            ]
          : [
              [82, 37],
              [95, 48],
              [100, 36],
              [74, 29],
              [120, 45],
              [86, 39],
            ],
    };

    const pairs = subtractionPairsByBand[ageBand];
    const [total, minus] = pairs[(cycleIdx * 2 + rawStep) % pairs.length];
    const answer = total - minus;
    const theme = mathTheme;

    const formattedTotal = formatQuantityItalian(total, theme);
    const formattedMinus = formatQuantityItalian(minus, theme);
    const formattedAnswer = formatQuantityItalian(answer, theme);

    const deltaDistractor = ageBand === 'upper_primary_8_9' ? 3 : 1;
    const candidateValues = buildDistinctNumericValues(answer, [-deltaDistractor, deltaDistractor, 2, -2]);
    const options: PuzzleOption[] = deterministicShuffle(
      candidateValues.map((val, idx) => ({
        id: `opt_sub_${level}_${idx}`,
        label: `${val}`,
        emoji: theme.emoji,
        sublabel: total > 12 ? `Risultato: ${val}` : formatQuantityItalian(val, theme).text,
        isCorrect: val === answer,
      })),
      level * 47 + tier
    );

    const speechAction =
      total > 12
        ? `Calcolo mentale: quanto fa ${total} meno ${minus}?`
        : theme.gender === 'f'
        ? `Calcolo visivo: abbiamo ${formattedTotal.speech} e ne togliamo ${formattedMinus.speech}. Quante ${theme.plural} restano?`
        : `Calcolo visivo: abbiamo ${formattedTotal.speech} e ne togliamo ${formattedMinus.speech}. Quanti ${theme.plural} restano?`;

    const verbResta = answer === 1 ? 'resta' : 'restano';

    return finalize({
      id: `lvl_${level}_sub_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      subjectLabel: total > 12 ? 'Calcolo Mentale (−)' : 'Sottrazione Visiva',
      type: 'visual_subtraction',
      title: `Livello ${level}: Sottrazione (${total} − ${minus})`,
      prompt:
        total > 12
          ? `Calcolo mentale: quanto fa ${total} − ${minus} = ?`
          : `Quanto fa ${formattedTotal.text} − ${formattedMinus.text} = ?`,
      speechText: speechAction,
      animalGuide: guide,
      iqParameterTag: 'Calcolo Mentale & Sottrazione (Gwm · Gf)',
      chcPrimary: 'Gwm',
      chcSecondary: 'Gf',
      diagnosticTarget: `Manipolazione numerica e sottrazione (${ageInfo.shortAgeLabel}) (Gwm · IT)`,
      subtractionParts:
        total <= 12
          ? {
              total,
              minus,
              emoji: theme.emoji,
              singular: theme.singular,
              plural: theme.plural,
              gender: theme.gender,
            }
          : undefined,
      patternItems: total > 12 ? [`${total}`, '−', `${minus}`, '=', '❓'] : undefined,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation:
        total > 12
          ? `Perfetto! ${total} meno ${minus} fa esattamente ${answer}!`
          : `Perfetto! Da ${formattedTotal.speech} togliendo ${formattedMinus.speech} ${verbResta} ${formattedAnswer.speech}!`,
    });
  }

  // -------------------------------------------------------------
  // STEP 9: SEQUENZE (4–5), ADDIZIONI/TABELLINE (6–9), FRAZIONI AVANZATE (10–12), PROPORZIONI & SCONTI (13–14)
  // -------------------------------------------------------------
  if (ageBand === 'teen_13_14') {
    const proportions: { prompt: string; speech: string; strip: string[]; ans: number; unit: string; tip: string }[] = [
      {
        prompt: 'Proporzioni: Trova il termine incognito x in 4 : 6 = 10 : x',
        speech: 'Sfida sulle proporzioni: se 4 sta a 6 come 10 sta a x, quanto vale x?',
        strip: ['4 : 6', '=', '10 : x'],
        ans: 15,
        unit: '',
        tip: 'Il prodotto dei medi (6 × 10 = 60) diviso 4 fa esattamente 15!',
      },
      {
        prompt: 'Sconto Percentuale: Una giacca costa 80 € ed è scontata del 25%. Quanto la paghi? 💶',
        speech: 'Calcolo dello sconto: se una giacca da ottanta euro ha lo sconto del venticinque percento, quanto costa scontata?',
        strip: ['80 €', '− 25%', '=', '❓ €'],
        ans: 60,
        unit: ' €',
        tip: 'Il 25% di 80 € è 20 € di sconto: 80 − 20 = 60 €!',
      },
      {
        prompt: 'Proporzioni: Trova x nella proporzione 3 : x = 9 : 24',
        speech: 'Proporzione algebrica: 3 sta a x come 9 sta a 24. Quanto vale x?',
        strip: ['3 : x', '=', '9 : 24'],
        ans: 8,
        unit: '',
        tip: 'x = (3 × 24) ÷ 9 = 72 ÷ 9 = 8!',
      },
      {
        prompt: 'Statistica & Media: Qual è la media aritmetica dei voti 6, 8, 9 e 9? 📊',
        speech: 'Statistica: qual è la media aritmetica esatta dei quattro voti 6, 8, 9 e 9?',
        strip: ['Media(6, 8, 9, 9)', '=', '❓'],
        ans: 8,
        unit: '',
        tip: '(6 + 8 + 9 + 9) = 32; dividendo per 4 otteniamo media 8!',
      },
    ];

    const pr = proportions[(cycleIdx + rawStep + level) % proportions.length];
    const vals = buildDistinctNumericValues(pr.ans, [-2, 2, -4, 4]);
    const options: PuzzleOption[] = deterministicShuffle(
      vals.map((val, idx) => ({
        id: `opt_prop_${level}_${idx}`,
        label: `${val}${pr.unit}`,
        emoji: '📊',
        sublabel: `Risultato: ${val}${pr.unit}`,
        isCorrect: val === pr.ans,
      })),
      level * 101 + tier
    );
    return finalize({
      id: `lvl_${level}_prop_teen`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      subjectLabel: 'Proporzioni, Sconti & Statistica',
      type: 'visual_addition',
      title: `Livello ${level}: Proporzioni & Statistica 📊`,
      prompt: pr.prompt,
      speechText: pr.speech,
      animalGuide: guide,
      iqParameterTag: 'Proporzioni, Percentuali & Statistica (Gf · Gwm)',
      chcPrimary: 'Gf',
      chcSecondary: 'Gwm',
      diagnosticTarget: 'Calcolo proporzionale, sconti percentuali e media statistica (13–14 anni)',
      patternItems: pr.strip,
      options,
      rewardStars: 3,
      rewardGems: 4,
      funExplanation: `Eccellente! ${pr.tip} Da vero matematico!`,
    });
  }

  if (ageBand === 'preteen_10_12') {
    const advancedFractions: { frac: string; num: number; den: number; total: number; ans: number }[] = [
      { frac: '¾', num: 3, den: 4, total: 20, ans: 15 },
      { frac: '⅖', num: 2, den: 5, total: 25, ans: 10 },
      { frac: '⅔', num: 2, den: 3, total: 27, ans: 18 },
      { frac: '⅜', num: 3, den: 8, total: 32, ans: 12 },
      { frac: '⅚', num: 5, den: 6, total: 30, ans: 25 },
      { frac: '⅗', num: 3, den: 5, total: 40, ans: 24 },
    ];
    const af = advancedFractions[(cycleIdx + rawStep + level) % advancedFractions.length];
    const vals = buildDistinctNumericValues(af.ans, [-3, 3, -5, 5]);
    const options: PuzzleOption[] = deterministicShuffle(
      vals.map((val, idx) => ({
        id: `opt_afrac_${level}_${idx}`,
        label: `${val}`,
        emoji: '📐',
        sublabel: `${af.frac} di ${af.total}`,
        isCorrect: val === af.ans,
      })),
      level * 79 + tier
    );
    return finalize({
      id: `lvl_${level}_adv_frac`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      subjectLabel: 'Frazioni & Proporzioni',
      type: 'visual_addition',
      title: `Livello ${level}: Frazioni Avanzate (${af.frac} di ${af.total}) 📐`,
      prompt: `Calcola la frazione di quantità: quanto vale ${af.frac} di ${af.total}?`,
      speechText: `Sfida sulle frazioni, ${childName}: quanto vale ${af.frac} di ${af.total}?`,
      animalGuide: guide,
      iqParameterTag: 'Frazioni Complesse & Calcolo Proporzionale (Gf · Gwm)',
      chcPrimary: 'Gf',
      chcSecondary: 'Gwm',
      diagnosticTarget: 'Calcolo frazionario a due passaggi (divisione e moltiplicazione, 10–12 anni)',
      patternItems: [af.frac, 'di', `${af.total}`, '=', '❓'],
      options,
      rewardStars: 3,
      rewardGems: 3,
      funExplanation: `Eccellente! Dividendo ${af.total} per ${af.den} si ottiene ${af.total / af.den}, poi moltiplicando per ${af.num} fa ${af.ans}! Da vero matematico!`,
    });
  }

  const usePattern = ageBand === 'preschool_4_5' && (cycleIdx + rawStep) % 3 === 0;
  if (usePattern) {
    const patItem = PATTERN_SEQUENCES_5YO[(cycleIdx + rawStep) % PATTERN_SEQUENCES_5YO.length];
    const options: PuzzleOption[] = deterministicShuffle(
      [
        {
          id: `opt_pat_corr_${level}`,
          label: patItem.correct.label,
          emoji: patItem.correct.emoji,
          sublabel: patItem.correct.sublabel,
          isCorrect: true,
        },
        ...patItem.distractors.map((d, i) => ({
          id: `opt_pat_dist_${level}_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ],
      level * 53 + tier
    );

    return finalize({
      id: `lvl_${level}_pattern`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      subjectLabel: 'Logica & Sequenze',
      type: 'pattern_sequence',
      title: `Livello ${level}: Completa la Sequenza Logica!`,
      prompt: patItem.prompt,
      speechText: patItem.speech,
      animalGuide: guide,
      iqParameterTag: 'Seriazione & Previsione Logica (Gf · Gs)',
      chcPrimary: 'Gf',
      chcSecondary: 'Gs',
      diagnosticTarget: 'Riconoscimento di pattern periodici e serie crescenti (Gf · IC)',
      patternItems: patItem.patternItems,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: patItem.explanation,
    });
  }

  // For 8–9 years, alternate progressive multiplication tables & mental additions up to 100
  if (ageBand === 'upper_primary_8_9' && (cycleIdx + rawStep) % 2 === 0) {
    const multPairs: [number, number][] =
      tier === 1
        ? [
            [3, 4],
            [4, 6],
            [5, 7],
            [6, 6],
            [7, 4],
            [8, 3],
          ]
        : [
            [6, 7],
            [9, 4],
            [7, 8],
            [8, 6],
            [9, 7],
            [12, 4],
          ];
    const [a, b] = multPairs[(uniqueIdx + level) % multPairs.length];
    const answer = a * b;
    const vals = buildDistinctNumericValues(answer, [-a, b, -b, a]);
    const options: PuzzleOption[] = deterministicShuffle(
      vals.map((val, idx) => ({
        id: `opt_mul_${level}_${idx}`,
        label: `${val}`,
        emoji: '✖️',
        sublabel: `Prodotto: ${val}`,
        isCorrect: val === answer,
      })),
      level * 59 + tier
    );

    return finalize({
      id: `lvl_${level}_mult`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      subjectLabel: 'Tabelline & Moltiplicazione',
      type: 'visual_addition',
      title: `Livello ${level}: Tabelline & Moltiplicazione (${a} × ${b})`,
      prompt: `Calcolo rapido: quanto fa ${a} × ${b} = ?`,
      speechText: `Sfida delle tabelline, ${childName}: quanto fa ${a} per ${b}?`,
      animalGuide: guide,
      iqParameterTag: 'Moltiplicazione & Calcolo Rapido (Gf · Gwm)',
      chcPrimary: 'Gf',
      chcSecondary: 'Gwm',
      diagnosticTarget: 'Automatizzazione delle tabelline e calcolo mentale avanzato (Gwm · Gs)',
      patternItems: [`${a}`, '×', `${b}`, '=', '❓'],
      options,
      rewardStars: 3,
      rewardGems: 3,
      funExplanation: `Fantastico! ${a} moltiplicato per ${b} fa esattamente ${answer}!`,
    });
  }

  const additionPairsByBand: Record<'toddler_2_3' | 'preschool_4_5' | 'early_primary_6_7' | 'upper_primary_8_9', [number, number][]> = {
    toddler_2_3: [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
      [3, 1],
    ],
    preschool_4_5:
      tier === 1
        ? [
            [2, 2],
            [3, 2],
            [4, 2],
            [3, 3],
            [4, 3],
            [5, 2],
          ]
        : [
            [5, 3],
            [4, 4],
            [6, 2],
            [5, 4],
            [6, 3],
            [5, 5],
          ],
    early_primary_6_7:
      tier === 1
        ? [
            [7, 5],
            [8, 6],
            [9, 4],
            [8, 7],
            [11, 5],
            [9, 8],
          ]
        : [
            [12, 9],
            [14, 8],
            [15, 7],
            [16, 9],
            [13, 11],
            [17, 8],
          ],
    upper_primary_8_9:
      tier === 1
        ? [
            [18, 14],
            [23, 19],
            [27, 15],
            [16, 28],
            [34, 15],
            [29, 17],
          ]
        : [
            [46, 28],
            [53, 39],
            [64, 27],
            [38, 47],
            [59, 34],
            [48, 36],
          ],
  };

  const additionPairs = additionPairsByBand[ageBand];
  const [a, b] = additionPairs[(uniqueIdx + level) % additionPairs.length];
  const answer = a + b;
  const theme = mathTheme;

  const formattedA = formatQuantityItalian(a, theme);
  const formattedB = formatQuantityItalian(b, theme);
  const formattedAnswer = formatQuantityItalian(answer, theme);

  const distractorStep = ageBand === 'upper_primary_8_9' ? 2 : 1;
  const candidateValues = buildDistinctNumericValues(answer, [-distractorStep, distractorStep, 2, -2]);
  const options: PuzzleOption[] = deterministicShuffle(
    candidateValues.map((val, idx) => ({
      id: `opt_add_${level}_${idx}`,
      label: `${val}`,
      emoji: theme.emoji,
      sublabel: answer > 10 ? `Totale: ${val}` : formatQuantityItalian(val, theme).text,
      isCorrect: val === answer,
    })),
    level * 59 + tier
  );

  const questionWord = theme.gender === 'f' ? 'Quante' : 'Quanti';
  const speechAdd =
    answer > 10
      ? `Calcolo mentale: quanto fa ${a} più ${b}?`
      : `Sommiamo insieme: ${formattedA.speech} più ${formattedB.speech}. ${questionWord} ${theme.plural} abbiamo in tutto?`;

  return finalize({
    id: `lvl_${level}_add_${ageBand}`,
    levelNumber: level,
    difficultyTier: tier,
    category: 'numbers',
    subjectLabel: answer > 10 ? 'Calcolo Mentale (+)' : 'Addizione Visiva',
    type: 'visual_addition',
    title: `Livello ${level}: Addizione (${a} + ${b})`,
    prompt:
      answer > 10
        ? `Calcolo mentale: quanto fa ${a} + ${b} = ?`
        : `Quanto fa ${formattedA.text} + ${formattedB.text} = ?`,
    speechText: speechAdd,
    animalGuide: guide,
    iqParameterTag: 'Addizione & Calcolo Mentale (Gf · Gwm)',
    chcPrimary: 'Gf',
    chcSecondary: 'Gwm',
    diagnosticTarget: `Integrazione additiva calibrata ${ageInfo.shortAgeLabel} (Gf · IP · IT)`,
    additionParts:
      answer <= 10
        ? {
            countA: a,
            countB: b,
            emoji: theme.emoji,
            singular: theme.singular,
            plural: theme.plural,
            gender: theme.gender,
          }
        : undefined,
    patternItems: answer > 10 ? [`${a}`, '+', `${b}`, '=', '❓'] : undefined,
    options,
    rewardStars: 3,
    rewardGems: 2,
    funExplanation:
      answer > 10
        ? `Esatto! ${a} più ${b} fa proprio ${answer}!`
        : `Esatto! ${formattedA.speech} più ${formattedB.speech} fanno proprio ${formattedAnswer.speech}!`,
  });
}
