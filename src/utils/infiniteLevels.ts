// Infinite Adaptive Curriculum & Procedural Generator for "Il Mio Mondo"
// Dynamically adapts levels, difficulty, numerical range & subjects right from Level 1
// based on the child's entered birthDate (2-3, 4-5, 6-7, 8+ years) and personalizes copy with name & gender.
import { ChildProfile, GameCategory, Puzzle, PuzzleOption, RhythmNote, EnglishWordHighlight } from '../types/game';
import {
  calculateChildAge,
  ChildAgeInfo,
  DEFAULT_BIRTH_DATE,
  getDisplayChildName,
  getGenderedWord,
} from './childProfile';
import {
  TODDLER_ANIMALS,
  TODDLER_COLORS_SHAPES,
  TODDLER_ENGLISH,
  TODDLER_LETTERS,
  TODDLER_LOGIC,
  EARLY_PRIMARY_ENGLISH,
  EARLY_PRIMARY_GEOMETRY,
  EARLY_PRIMARY_LANGUAGE,
  EARLY_PRIMARY_LOGIC,
  EARLY_PRIMARY_SCIENCE,
  PRIMARY_ADV_ENGLISH,
  PRIMARY_ADV_GEOMETRY,
  PRIMARY_ADV_LANGUAGE,
  PRIMARY_ADV_LOGIC,
  PRIMARY_ADV_SCIENCE,
  INITIAL_LETTER_WORD_BANK,
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
  if (!childProfile || childProfile.gender === 'f') return text;
  if (childProfile.gender === 'm') {
    return text
      .replace(/\bBravissima\b/g, 'Bravissimo')
      .replace(/\bCampionessa\b/g, 'Campione')
      .replace(/\bpiccola scienziata\b/g, 'piccolo scienziato')
      .replace(/\bvera botanica\b/g, 'vero botanico')
      .replace(/\bvera musicista\b/g, 'vero musicista');
  }
  return text
    .replace(/\bBravissima\b/g, 'Fantastico')
    .replace(/\bCampionessa\b/g, 'Super')
    .replace(/\bpiccola scienziata\b/g, 'giovane scienziato')
    .replace(/\bvera botanica\b/g, 'vero genio della natura')
    .replace(/\bvera musicista\b/g, 'grande talento musicale');
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

// =========================================================================
// PROCEDURAL LEVEL GENERATOR (NON-REPEATING & AGE-ADAPTIVE ACROSS 4 BANDS)
// Adapts levels, difficulty, numerical range & subjects immediately from birthDate!
// =========================================================================
export function generateProceduralPuzzle(level: number, childProfile?: ChildProfile): Puzzle {
  const guide = ANIMAL_GUIDES[(level * 5 + 1) % ANIMAL_GUIDES.length];
  const ageInfo = calculateChildAge(childProfile?.birthDate);
  const ageBand = ageInfo.ageBand;
  const childName = getDisplayChildName(childProfile);

  // Tier increases every 10 levels (1..10 = Tier 1, 11..20 = Tier 2, etc.)
  const tier = Math.floor((level - 1) / 10) + 1;
  const cycleIdx = tier - 1;
  const rawStep = ((level - 1) % 10) + 1; // 1..9 (10 is Svago)

  // Age-tailored subject rotation so right from Level 1 the child sees subjects calibrated to their age
  const stepPermutationsByBand: Record<typeof ageBand, number[][]> = {
    toddler_2_3: [
      [1, 4, 2, 3, 6, 5, 7, 2, 4],
      [4, 1, 2, 6, 3, 7, 5, 4, 2],
      [1, 2, 4, 5, 3, 6, 7, 1, 4],
    ],
    preschool_4_5: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [7, 4, 6, 2, 5, 3, 8, 1, 9],
      [5, 8, 1, 7, 3, 9, 4, 6, 2],
      [6, 3, 8, 5, 9, 1, 2, 7, 4],
    ],
    early_primary_6_7: [
      [9, 5, 7, 4, 8, 6, 1, 3, 9],
      [5, 8, 4, 7, 9, 1, 6, 3, 8],
      [7, 9, 6, 5, 4, 8, 3, 1, 7],
    ],
    primary_8_plus: [
      [7, 9, 1, 5, 4, 8, 6, 3, 7],
      [9, 4, 7, 6, 8, 5, 1, 3, 9],
      [8, 7, 5, 1, 9, 4, 6, 3, 8],
    ],
  };

  const bandPerms = stepPermutationsByBand[ageBand];
  const perm = bandPerms[cycleIdx % bandPerms.length];
  const step = perm[(rawStep - 1) % 9];

  const uniqueIdx = cycleIdx * 3 + Math.floor((rawStep - 1) / 3);
  const mathTheme = MATH_ITEM_CATALOG[(level * 3 + cycleIdx) % MATH_ITEM_CATALOG.length];

  const finalize = (puzzle: Puzzle): Puzzle => ({
    ...puzzle,
    prompt: adaptGenderText(puzzle.prompt, childProfile),
    speechText: adaptGenderText(puzzle.speechText, childProfile),
    funExplanation: adaptGenderText(puzzle.funExplanation, childProfile),
  });

  // -------------------------------------------------------------
  // STEP 1: NATURA, ANIMALETTI & SCIENZE (ADAPTED BY AGE BAND)
  // -------------------------------------------------------------
  if (step === 1) {
    const pool =
      ageBand === 'toddler_2_3'
        ? TODDLER_ANIMALS
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_SCIENCE
        : ageBand === 'primary_8_plus'
        ? PRIMARY_ADV_SCIENCE
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

    const titleByBand =
      ageBand === 'toddler_2_3'
        ? `Livello ${level}: Versi & Animali Amici 🐾`
        : ageBand === 'early_primary_6_7'
        ? `Livello ${level}: Scienze & Scoperte (${ageInfo.shortAgeLabel}) 🔬`
        : ageBand === 'primary_8_plus'
        ? `Livello ${level}: Scienze della Terra & Spazio 🌍`
        : `Livello ${level}: Esploriamo la Natura & gli Animali 🌍`;

    return finalize({
      id: `lvl_${level}_nature_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'animal_sounds',
      title: titleByBand,
      prompt: item.prompt,
      speechText: item.speech,
      animalGuide: guide,
      iqParameterTag: 'Conoscenza Scientifica & Ragionamento (Gc · Gf)',
      chcPrimary: 'Gc',
      chcSecondary: 'Gf',
      diagnosticTarget: `Conoscenze sul mondo naturale calibrato ${ageInfo.ageBandTitle} (Gc · Gf)`,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: item.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 2: CONTEGGIO INTERATTIVO (CALIBRATO PER ETÀ)
  // -------------------------------------------------------------
  if (step === 2) {
    const countPool =
      ageBand === 'toddler_2_3'
        ? [2, 3, 2, 4, 3, 4]
        : ageBand === 'preschool_4_5'
        ? [4, 5, 6, 7, 8, 9, 5, 7, 6, 8]
        : [7, 8, 9, 10, 8, 9];
    const targetCount = countPool[(cycleIdx + rawStep) % countPool.length];

    const formatted = formatQuantityItalian(targetCount, mathTheme);
    const formattedAll = formatAllPluralItalian(targetCount, mathTheme);
    const completedPronoun = mathTheme.gender === 'f' ? 'Le hai contate tutte' : 'Li hai contati tutti';

    return finalize({
      id: `lvl_${level}_count_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
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
  // STEP 3: MUSICA, NOTE & STRUMENTI DELL'ORCHESTRA (Gwm + Gf)
  // -------------------------------------------------------------
  if (step === 3) {
    const musicItem = MUSIC_RHYTHM_CATALOG[(cycleIdx + rawStep) % MUSIC_RHYTHM_CATALOG.length];
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

    return finalize({
      id: `lvl_${level}_music_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'music',
      type: 'music_rhythm',
      title: `Livello ${level}: ${musicItem.title} 🎵`,
      prompt: musicItem.prompt,
      speechText: musicItem.speech,
      animalGuide: guide,
      iqParameterTag: 'Memoria Sequenziale Uditiva (Gwm · Gf)',
      chcPrimary: 'Gwm',
      chcSecondary: 'Gf',
      diagnosticTarget: 'Codifica ritmico-melodica e memoria uditiva a breve termine (Gwm · IR)',
      rhythmNotes: musicItem.rhythmNotes,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: musicItem.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 4: GEOMETRIA, ORIENTAMENTO SPAZIALE & COLORI (ADAPTED BY AGE)
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
        type: 'find_color',
        title: `Livello ${level}: Colori & Forme Magiche 🎨`,
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

    if (ageBand === 'early_primary_6_7' || ageBand === 'primary_8_plus') {
      const geoPool =
        ageBand === 'primary_8_plus' ? PRIMARY_ADV_GEOMETRY : EARLY_PRIMARY_GEOMETRY;
      const geoItem = geoPool[(cycleIdx + rawStep) % geoPool.length];
      const options: PuzzleOption[] = deterministicShuffle(
        [
          {
            id: `opt_geo_adv_corr_${level}`,
            label: geoItem.correct.label,
            emoji: geoItem.correct.emoji,
            sublabel: geoItem.correct.sublabel,
            isCorrect: true,
          },
          ...geoItem.distractors.map((d, i) => ({
            id: `opt_geo_adv_dist_${level}_${i}`,
            label: d.label,
            emoji: d.emoji,
            sublabel: d.sublabel,
            isCorrect: false,
          })),
        ],
        level * 29 + tier
      );
      return finalize({
        id: `lvl_${level}_geo_${ageBand}`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        type: 'match_shape',
        title: `Livello ${level}: Geometria & Poligoni (${ageInfo.shortAgeLabel}) 📐`,
        prompt: geoItem.prompt,
        speechText: geoItem.speech,
        animalGuide: guide,
        iqParameterTag: 'Geometria, Simmetria & Spazio (Gv · Gf)',
        chcPrimary: 'Gv',
        chcSecondary: 'Gf',
        diagnosticTarget: `Analisi poligoni, perimetri e geometria spaziale (${ageInfo.shortAgeLabel})`,
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: geoItem.explanation,
      });
    }

    // Preschool 4-5yo: alternates Color Mix & 5yo Geometry
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
        type: 'color_mix',
        title: `Livello ${level}: Laboratorio dei Colori 🎨`,
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
        type: 'match_shape',
        title: `Livello ${level}: Geometria & Spazio 3D 🔷`,
        prompt: geoItem.prompt,
        speechText: geoItem.speech,
        animalGuide: guide,
        iqParameterTag: 'Relazioni Visuo-Spaziali & Geometria (Gv · Gs)',
        chcPrimary: 'Gv',
        chcSecondary: 'Gs',
        diagnosticTarget: 'Analisi geometrica dei lati, forme 3D e orientamento spaziale (Gv · Gs)',
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: geoItem.explanation,
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 5: LINGUAGGIO, LETTERE, SILLABE, GRAMMATICA & INDOVINELLI
  // -------------------------------------------------------------
  if (step === 5) {
    // Give the child a personalized puzzle using their OWN initial letter once per 10 levels (for <= 6yo)
    if (
      childProfile?.name?.trim() &&
      (ageBand === 'toddler_2_3' || ageBand === 'preschool_4_5') &&
      cycleIdx % 3 === 0 &&
      rawStep <= 6
    ) {
      const personalPuzzle = buildPersonalizedInitialLetterPuzzle(level, tier, guide, childProfile);
      if (personalPuzzle) return finalize(personalPuzzle);
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

    if (ageBand === 'early_primary_6_7' || ageBand === 'primary_8_plus') {
      const langPool =
        ageBand === 'primary_8_plus' ? PRIMARY_ADV_LANGUAGE : EARLY_PRIMARY_LANGUAGE;
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
      return finalize({
        id: `lvl_${level}_lang_${ageBand}`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'letters',
        type: 'spell_word',
        title:
          ageBand === 'primary_8_plus'
            ? `Livello ${level}: Grammatica, Sinonimi & Lessico 📘`
            : `Livello ${level}: Ortografia, Sillabe & Parole 🔤`,
        prompt: langItem.prompt,
        speechText: langItem.speech,
        animalGuide: guide,
        iqParameterTag: 'Competenza Linguistica & Ortografica (Gc · Gwm)',
        chcPrimary: 'Gc',
        chcSecondary: 'Gwm',
        diagnosticTarget: `Ortografia, lessico e grammatica (${ageInfo.shortAgeLabel})`,
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
  // STEP 6: INGLESE CALIBRATO PER ETÀ (Gc + Gwm)
  // -------------------------------------------------------------
  if (step === 6) {
    const engPool =
      ageBand === 'toddler_2_3'
        ? TODDLER_ENGLISH
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_ENGLISH
        : ageBand === 'primary_8_plus'
        ? PRIMARY_ADV_ENGLISH
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

    return finalize({
      id: `lvl_${level}_english_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'english',
      type: 'english_words',
      title: `Livello ${level}: English Discovery · "${engItem.wordInfo.en}" 🇬🇧`,
      prompt: engItem.prompt,
      speechText: engItem.speech,
      animalGuide: guide,
      iqParameterTag: 'Plasticità Lessicale Bilingue (Gc · Gwm)',
      chcPrimary: 'Gc',
      chcSecondary: 'Gwm',
      diagnosticTarget: `Acquisizione lessicale L2 calibrata ${ageInfo.shortAgeLabel} (Gc · IT)`,
      englishWord: engItem.wordInfo,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: engItem.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 7: PROVA LOGICA MULTIPARAMETRICA CHC (CALIBRATA PER ETÀ)
  // -------------------------------------------------------------
  if (step === 7) {
    const logicPool =
      ageBand === 'toddler_2_3'
        ? TODDLER_LOGIC
        : ageBand === 'early_primary_6_7'
        ? EARLY_PRIMARY_LOGIC
        : ageBand === 'primary_8_plus'
        ? PRIMARY_ADV_LOGIC
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

    return finalize({
      id: `lvl_${level}_iq_matrix_${ageBand}`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'iq_matrix',
      title: `Livello ${level}: Sfida di Logica & Ingegno 🧠`,
      prompt: iqItem.prompt,
      speechText: iqItem.speech,
      animalGuide: guide,
      patternItems: iqItem.patternItems,
      iqParameterTag: iqItem.iqParameterTag || 'Ragionamento Fluido (Gf · Gv)',
      chcPrimary: 'Gf',
      chcSecondary: 'Gv',
      diagnosticTarget: `Ragionamento fluido e deduzione logica (${ageInfo.shortAgeLabel}) (Gf · IT · IC)`,
      options,
      rewardStars: 3,
      rewardGems: 3,
      funExplanation: iqItem.explanation,
    });
  }

  // -------------------------------------------------------------
  // STEP 8: SOTTRAZIONE / CALCOLO MENTALE (CALIBRATO PER ETÀ)
  // -------------------------------------------------------------
  if (step === 8) {
    const subtractionPairsByBand: Record<typeof ageBand, [number, number][]> = {
      toddler_2_3: [
        [3, 1],
        [4, 1],
        [4, 2],
        [5, 1],
      ],
      preschool_4_5: [
        [4, 1],
        [5, 2],
        [6, 2],
        [5, 3],
        [7, 2],
        [6, 3],
        [8, 3],
        [7, 4],
        [6, 4],
        [8, 2],
        [9, 3],
        [9, 4],
      ],
      early_primary_6_7: [
        [12, 4],
        [15, 6],
        [14, 5],
        [16, 7],
        [18, 5],
        [17, 8],
        [20, 6],
        [19, 7],
      ],
      primary_8_plus: [
        [32, 14],
        [45, 18],
        [38, 19],
        [50, 23],
        [42, 15],
        [48, 19],
        [36, 17],
        [54, 26],
      ],
    };

    const pairs = subtractionPairsByBand[ageBand];
    const [total, minus] = pairs[(cycleIdx * 2 + rawStep) % pairs.length];
    const answer = total - minus;
    const theme = mathTheme;

    const formattedTotal = formatQuantityItalian(total, theme);
    const formattedMinus = formatQuantityItalian(minus, theme);
    const formattedAnswer = formatQuantityItalian(answer, theme);

    const deltaDistractor = ageBand === 'primary_8_plus' ? 3 : 1;
    const candidateValues =
      answer <= 1
        ? [1, 2, 3]
        : [Math.max(1, answer - deltaDistractor), answer, answer + deltaDistractor];
    const options: PuzzleOption[] = deterministicShuffle(
      candidateValues.map((val, idx) => ({
        id: `opt_sub_${level}_${idx}`,
        label: `${val}`,
        emoji: theme.emoji,
        sublabel: ageBand === 'primary_8_plus' ? `Risultato: ${val}` : formatQuantityItalian(val, theme).text,
        isCorrect: val === answer,
      })),
      level * 47 + tier
    );

    const speechAction =
      ageBand === 'primary_8_plus' || ageBand === 'early_primary_6_7'
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
      type: 'visual_subtraction',
      title: `Livello ${level}: Sottrazione (${total} - ${minus})`,
      prompt:
        ageBand === 'primary_8_plus' || ageBand === 'early_primary_6_7'
          ? `Calcolo mentale: quanto fa ${total} − ${minus} = ?`
          : `Quanto fa ${formattedTotal.text} - ${formattedMinus.text} = ?`,
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
  // STEP 9: ADDIZIONE / TABELLINE / SEQUENZA LOGICA (CALIBRATA PER ETÀ)
  // -------------------------------------------------------------
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

  // For 8+ years, alternate multiplication tables & mental additions up to 50
  if (ageBand === 'primary_8_plus' && (cycleIdx + rawStep) % 2 === 0) {
    const multPairs: [number, number][] = [
      [3, 4],
      [4, 6],
      [5, 7],
      [6, 6],
      [7, 4],
      [8, 3],
      [6, 7],
      [9, 4],
      [5, 9],
      [8, 6],
    ];
    const [a, b] = multPairs[(uniqueIdx + level) % multPairs.length];
    const answer = a * b;
    const options: PuzzleOption[] = deterministicShuffle(
      [answer - a, answer, answer + b].map((val, idx) => ({
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

  const additionPairsByBand: Record<typeof ageBand, [number, number][]> = {
    toddler_2_3: [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
      [3, 1],
    ],
    preschool_4_5: [
      [2, 2],
      [3, 2],
      [4, 2],
      [3, 3],
      [4, 3],
      [5, 2],
      [5, 3],
      [4, 4],
      [6, 2],
      [5, 4],
      [6, 3],
      [7, 2],
      [5, 5],
      [6, 4],
    ],
    early_primary_6_7: [
      [7, 5],
      [8, 6],
      [9, 4],
      [8, 7],
      [11, 5],
      [9, 8],
      [12, 6],
      [13, 5],
      [7, 9],
      [14, 6],
    ],
    primary_8_plus: [
      [18, 14],
      [23, 19],
      [27, 15],
      [16, 28],
      [34, 15],
      [29, 17],
      [19, 25],
      [24, 22],
    ],
  };

  const additionPairs = additionPairsByBand[ageBand];
  const [a, b] = additionPairs[(uniqueIdx + level) % additionPairs.length];
  const answer = a + b;
  const theme = mathTheme;

  const formattedA = formatQuantityItalian(a, theme);
  const formattedB = formatQuantityItalian(b, theme);
  const formattedAnswer = formatQuantityItalian(answer, theme);

  const distractorStep = ageBand === 'primary_8_plus' ? 2 : 1;
  const candidateValues = [Math.max(1, answer - distractorStep), answer, answer + distractorStep];
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
