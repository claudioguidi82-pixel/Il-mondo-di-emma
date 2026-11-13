// Infinite Adaptive Curriculum & Procedural Generator tailored to Emma (Born: 22/08/2021 - 5 Years Old)
// Preschool Focus: Visual Discrimination, Colors, Shapes, Animal Sounds, Counting 1-5, Concrete Visual Math,
// Music & Rhythm, First English Words, and Dedicated Preschool IQ Psychometric Levels (WPPSI-IV inspired)
// Strict Italian Gender & Number Agreement (e.g. "una mela", "due mele", "un biscottino", "due biscottini")
// Systematic Crescendo of Difficulty Every 10 Levels (after each Svago Level)
import { GameCategory, Puzzle, PuzzleOption, RhythmNote, EnglishWordHighlight } from '../types/game';

// Emma's Birthdate
export const EMMA_BIRTH_DATE = '2021-08-22';

export interface EmmaAgeInfo {
  years: number;
  months: number;
  totalMonths: number;
  displayText: string;
  developmentalStage: string;
}

// Compute Emma's exact current age
export function getEmmaCurrentAge(currentDate: Date = new Date()): EmmaAgeInfo {
  const birth = new Date(EMMA_BIRTH_DATE);
  let years = currentDate.getFullYear() - birth.getFullYear();
  let months = currentDate.getMonth() - birth.getMonth();
  
  if (currentDate.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const displayText = `${years} anni e ${months} mesi`;

  let developmentalStage = 'Fase Prescolare (Logica QI, Musica & Ritmo, Prime Parole Inglese, Numeri & Forme)';
  if (totalMonths >= 72) {
    developmentalStage = 'Fase Scuola Primaria (Inizio Lettura, Inglese Base e Calcolo Aritmetico)';
  } else if (totalMonths >= 66) {
    developmentalStage = 'Fase Transizione Infanzia (Fonetica, Ritmo Musicale, Inglese & Somme Visive)';
  }

  return { years, months, totalMonths, displayText, developmentalStage };
}

// Friendly Animal Guides
const ANIMAL_GUIDES = [
  { name: 'Leo lo Scoiattolo', emoji: '🐿️', role: 'Amico degli Animali', voicePitch: 1.25 },
  { name: 'Piuma la Rondine', emoji: '🕊️', role: 'Maestra di Musica & Inglese', voicePitch: 1.3 },
  { name: 'Brio il Delfino', emoji: '🐬', role: 'Campione dei Numeri', voicePitch: 1.2 },
  { name: 'Fiamma la Volpina', emoji: '🦊', role: 'Esploratrice di Forme', voicePitch: 1.22 },
  { name: 'Miele l\'Orsetto', emoji: '🧸', role: 'Custode del Ritmo', voicePitch: 1.15 },
  { name: 'Barnaba il Gufo', emoji: '🦉', role: 'Saggio del QI & Favole', voicePitch: 1.1 },
];

// =========================================================================
// GRAMMATICAL CONCORDANCE UTILITY (GENDER & NUMBER FOR ITALIAN PRESCHOOL)
// Solves: "1 mela" -> "una mela" (NOT "uno mela"), "2 mele" (NOT "2 mela")
// =========================================================================
export interface MathItemTheme {
  emoji: string;
  singular: string;          // "mela", "fragolina", "biscottino", "stellina"
  plural: string;            // "mele", "fragoline", "biscottini", "stelline"
  gender: 'f' | 'm';
  articleSingular: string;   // "una" o "un"
  articlePluralAll: string;  // "tutte le", "tutti i", "tutti gli"
  eachPhrase: string;        // "una ad una" o "uno ad uno"
  countPronoun: string;      // "contarle" o "contarli"
}

export const MATH_ITEM_CATALOG: MathItemTheme[] = [
  { emoji: '🍎', singular: 'mela', plural: 'mele', gender: 'f', articleSingular: 'una', articlePluralAll: 'tutte le', eachPhrase: 'una ad una', countPronoun: 'contarle' },
  { emoji: '🍓', singular: 'fragolina', plural: 'fragoline', gender: 'f', articleSingular: 'una', articlePluralAll: 'tutte le', eachPhrase: 'una ad una', countPronoun: 'contarle' },
  { emoji: '⭐', singular: 'stellina', plural: 'stelline', gender: 'f', articleSingular: 'una', articlePluralAll: 'tutte le', eachPhrase: 'una ad una', countPronoun: 'contarle' },
  { emoji: '🦋', singular: 'farfallina', plural: 'farfalline', gender: 'f', articleSingular: 'una', articlePluralAll: 'tutte le', eachPhrase: 'una ad una', countPronoun: 'contarle' },
  { emoji: '🥕', singular: 'carota', plural: 'carote', gender: 'f', articleSingular: 'una', articlePluralAll: 'tutte le', eachPhrase: 'una ad una', countPronoun: 'contarle' },
  { emoji: '🍪', singular: 'biscottino', plural: 'biscottini', gender: 'm', articleSingular: 'un', articlePluralAll: 'tutti i', eachPhrase: 'uno ad uno', countPronoun: 'contarli' },
  { emoji: '🎈', singular: 'palloncino', plural: 'palloncini', gender: 'm', articleSingular: 'un', articlePluralAll: 'tutti i', eachPhrase: 'uno ad uno', countPronoun: 'contarli' },
  { emoji: '🐬', singular: 'delfino', plural: 'delfini', gender: 'm', articleSingular: 'un', articlePluralAll: 'tutti i', eachPhrase: 'uno ad uno', countPronoun: 'contarli' },
  { emoji: '🧸', singular: 'orsetto', plural: 'orsetti', gender: 'm', articleSingular: 'un', articlePluralAll: 'tutti gli', eachPhrase: 'uno ad uno', countPronoun: 'contarli' },
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
};

export function formatQuantityItalian(count: number, item: MathItemTheme): { text: string; speech: string } {
  if (count === 1) {
    return {
      text: `${item.articleSingular} ${item.singular}`,
      speech: `${item.articleSingular} ${item.singular}`,
    };
  }
  const word = ITALIAN_NUM_WORDS[count]?.[item.gender] || `${count}`;
  return {
    text: `${count} ${item.plural}`,
    speech: `${word} ${item.plural}`,
  };
}

// Deterministic shuffle so options never jump during state updates
function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * 31 + i * 17) % (i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

// =========================================================================
// 5-YEAR-OLD APPROPRIATE CURATED DATA CATALOGS
// =========================================================================

// 1. I Versi degli Animali (Graduati: base nel Tier 1, selvatici/campestri nei tier successivi)
const ANIMAL_SOUNDS = [
  {
    sound: 'Miao',
    prompt: 'Chi fa "Miao"? 🐱',
    speech: 'Ascolta bene: quale animaletto fa Miao?',
    correct: { label: 'Gattino', emoji: '🐱', sublabel: 'Fa Miao Miao!' },
    distractors: [
      { label: 'Cagnolino', emoji: '🐶', sublabel: 'Fa Bau Bau!' },
      { label: 'Mucca', emoji: '🐄', sublabel: 'Fa Muuu!' },
    ],
    explanation: 'Proprio il gattino! Fa le fusa e dice Miao!',
  },
  {
    sound: 'Bau Bau',
    prompt: 'Chi fa "Bau Bau"? 🐶',
    speech: 'Quale animale fedele abbaia e fa Bau Bau?',
    correct: { label: 'Cagnolino', emoji: '🐶', sublabel: 'Fa Bau Bau!' },
    distractors: [
      { label: 'Gattino', emoji: '🐱', sublabel: 'Fa Miao!' },
      { label: 'Pecorella', emoji: '🐑', sublabel: 'Fa Beee!' },
    ],
    explanation: 'Bravissima! È il cagnolino scodinzolante che fa Bau Bau!',
  },
  {
    sound: 'Muuu',
    prompt: 'Chi fa "Muuu"? 🐄',
    speech: 'Quale animale della fattoria fa Muuu e ci dona il latte?',
    correct: { label: 'Mucca', emoji: '🐄', sublabel: 'Fa Muuu!' },
    distractors: [
      { label: 'Cavallo', emoji: '🐴', sublabel: 'Fa Ih-oh!' },
      { label: 'Gallina', emoji: '🐔', sublabel: 'Fa Coccodè!' },
    ],
    explanation: 'Esatto! La simpatica mucca fa Muuu!',
  },
  {
    sound: 'Cra Cra',
    prompt: 'Chi fa "Cra Cra" nello stagno? 🐸',
    speech: 'Quale ranocchia salterina fa Cra Cra nello stagno?',
    correct: { label: 'Ranocchia', emoji: '🐸', sublabel: 'Fa Cra Cra!' },
    distractors: [
      { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota zitto' },
      { label: 'Uccellino', emoji: '🐣', sublabel: 'Fa Cip Cip!' },
    ],
    explanation: 'Proprio la ranocchia verde che salta tra le ninfee!',
  },
  {
    sound: 'Beee',
    prompt: 'Chi fa "Beee" nel prato? 🐑',
    speech: 'Quale animaletto con la lana soffice fa Beee?',
    correct: { label: 'Pecorella', emoji: '🐑', sublabel: 'Fa Beee!' },
    distractors: [
      { label: 'Maialino', emoji: '🐷', sublabel: 'Fa Oink Oink!' },
      { label: 'Gattino', emoji: '🐱', sublabel: 'Fa Miao!' },
    ],
    explanation: 'La dolce pecorella con il suo morbido vello di lana!',
  },
  {
    sound: 'Oink Oink',
    prompt: 'Chi fa "Oink Oink"? 🐷',
    speech: 'Quale maialino rosa e simpatico fa Oink Oink?',
    correct: { label: 'Maialino', emoji: '🐷', sublabel: 'Fa Oink Oink!' },
    distractors: [
      { label: 'Cagnolino', emoji: '🐶', sublabel: 'Fa Bau!' },
      { label: 'Mucca', emoji: '🐄', sublabel: 'Fa Muuu!' },
    ],
    explanation: 'Proprio il maialino rosa che rotola felice!',
  },
  {
    sound: 'Chicchirichì',
    prompt: 'Chi canta "Chicchirichì" al mattino? 🐓',
    speech: 'Chi sveglia tutti al mattino cantando Chicchirichì?',
    correct: { label: 'Gallo', emoji: '🐓', sublabel: 'Canta all\'alba!' },
    distractors: [
      { label: 'Gufo', emoji: '🦉', sublabel: 'Vola di notte' },
      { label: 'Coniglio', emoji: '🐰', sublabel: 'Mangia carote' },
    ],
    explanation: 'Il gallo canterino con la cresta rossa!',
  },
];

// 2. Cosa Mangiano gli Animali?
const ANIMAL_FOOD = [
  {
    animal: 'Coniglietto',
    prompt: 'Cosa piace mangiare al coniglietto? 🐰',
    speech: 'Qual è il cibo fresco preferito del tenero coniglietto?',
    correct: { label: 'Carota', emoji: '🥕', sublabel: 'Arancione e croccante' },
    distractors: [
      { label: 'Formaggio', emoji: '🧀', sublabel: 'Piace al topolino' },
      { label: 'Pesce', emoji: '🐟', sublabel: 'Piace al gattino' },
    ],
    explanation: 'Bravissima! Il coniglietto adora le carote croccanti!',
  },
  {
    animal: 'Scimmietta',
    prompt: 'Cosa mangia volentieri la scimmietta? 🐵',
    speech: 'Quale frutto dolce e giallo piace tanto alla scimmietta?',
    correct: { label: 'Banana', emoji: '🍌', sublabel: 'Gialla e dolce' },
    distractors: [
      { label: 'Osso', emoji: '🦴', sublabel: 'Piace al cane' },
      { label: 'Formaggio', emoji: '🧀', sublabel: 'Piace al topo' },
    ],
    explanation: 'Esatto! La scimmia è ghiottissima di banane!',
  },
  {
    animal: 'Cagnolino',
    prompt: 'Cosa adora sgranocchiare il cagnolino? 🐶',
    speech: 'Qual è il bocconcino preferito del cagnolino?',
    correct: { label: 'Osso', emoji: '🦴', sublabel: 'Da rosicchiare' },
    distractors: [
      { label: 'Miele', emoji: '🍯', sublabel: 'Piace all\'orso' },
      { label: 'Carota', emoji: '🥕', sublabel: 'Piace al coniglio' },
    ],
    explanation: 'Proprio l\'osso! Il cagnolino lo stringe felice tra le zampe!',
  },
  {
    animal: 'Orsetto',
    prompt: 'Cosa piace all\'orsetto golosone? 🐻',
    speech: 'Quale dolcetto dorato preparato dalle api mangia l\'orso?',
    correct: { label: 'Miele', emoji: '🍯', sublabel: 'Dolce delle api' },
    distractors: [
      { label: 'Carota', emoji: '🥕', sublabel: 'Cibo del coniglio' },
      { label: 'Banana', emoji: '🍌', sublabel: 'Cibo della scimmia' },
    ],
    explanation: 'Che bontà! L\'orsetto adora il miele profumato!',
  },
];

// 3. Dove Vivono gli Animali? (Habitat)
const ANIMAL_HABITATS = [
  {
    prompt: 'Dove nuota felice il pesciolino? 🐟',
    speech: 'In quale elemento vive e nuota il piccolo pesciolino colorato?',
    correct: { label: 'Nel Mare', emoji: '🌊', sublabel: 'Nell\'acqua azzurra' },
    distractors: [
      { label: 'Sull\'Albero', emoji: '🌳', sublabel: 'Per gli uccellini' },
      { label: 'Nella Tana', emoji: '🪵', sublabel: 'Per l\'orso' },
    ],
    explanation: 'Esatto! I pesciolini nuotano liberi nell\'acqua del mare!',
  },
  {
    prompt: 'Dove vola e canta l\'uccellino? 🕊️',
    speech: 'Dove vola libero con le sue alucce l\'uccellino?',
    correct: { label: 'Nel Cielo', emoji: '☁️', sublabel: 'Tra le nuvole' },
    distractors: [
      { label: 'Nel Mare', emoji: '🌊', sublabel: 'Per i pesci' },
      { label: 'Sotto Terra', emoji: '🌱', sublabel: 'Per le formiche' },
    ],
    explanation: 'Proprio nel cielo aperto tra le nuvole e il sole!',
  },
  {
    prompt: 'Dove fa il miele la piccola ape? 🐝',
    speech: 'Come si chiama la casa rotonda dove l\'ape prepara il miele?',
    correct: { label: 'Alveare', emoji: '🍯', sublabel: 'Casa dell\'ape' },
    distractors: [
      { label: 'Nel Mare', emoji: '🌊', sublabel: 'Per i pesci' },
      { label: 'Nido', emoji: '🪺', sublabel: 'Per le rondini' },
    ],
    explanation: 'Bravissima! L\'ape vive nell\'alveare con tutte le sue amiche!',
  },
];

// 4. Confronti di Grandezza Visiva per 5 Anni
const SIZE_COMPARISONS = [
  {
    prompt: 'Chi è il più GRANDE? 🐘',
    speech: 'Guarda bene: chi è l\'animale più grande e gigante?',
    correct: { label: 'Elefante', emoji: '🐘', sublabel: 'È grandissimo!' },
    distractors: [
      { label: 'Formichina', emoji: '🐜', sublabel: 'È piccolina' },
      { label: 'Farfalla', emoji: '🦋', sublabel: 'È leggera' },
    ],
    explanation: 'L\'elefante è un gigante con le orecchie enormi e la proboscide!',
  },
  {
    prompt: 'Chi è il più PICCOLO? 🐜',
    speech: 'Tocca con il dito la figura più piccolina di tutte!',
    correct: { label: 'Formica', emoji: '🐜', sublabel: 'È piccolissima!' },
    distractors: [
      { label: 'Orso', emoji: '🐻', sublabel: 'È grande' },
      { label: 'Cavallo', emoji: '🐴', sublabel: 'È grande' },
    ],
    explanation: 'Proprio la minuscola formica che cammina sul prato!',
  },
  {
    prompt: 'Chi ha il collo più ALTO? 🦒',
    speech: 'Chi arriva a mangiare le foglie più in alto degli alberi?',
    correct: { label: 'Giraffa', emoji: '🦒', sublabel: 'Collo lunghissimo!' },
    distractors: [
      { label: 'Coniglietto', emoji: '🐰', sublabel: 'È piccolino' },
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'È bassa' },
    ],
    explanation: 'La giraffa con il suo collo altissimo che tocca le nuvole!',
  },
];

// 5. Forme e Colori Magici
const SHAPES_CATALOG = [
  { name: 'Cerchio', emoji: '🔴', color: '#ef4444', hint: 'Tondo come una palla ⚽' },
  { name: 'Stella', emoji: '⭐', color: '#f59e0b', hint: 'Brilla nel cielo notturno ✨' },
  { name: 'Cuore', emoji: '💖', color: '#ec4899', hint: 'Dolce e pieno d\'affetto' },
  { name: 'Triangolo', emoji: '🔺', color: '#10b981', hint: 'Ha tre punte come una fetta di pizza 🍕' },
  { name: 'Quadrato', emoji: '🟦', color: '#3b82f6', hint: 'Ha quattro lati uguali come una scatola' },
];

const COLOR_MIXES = [
  {
    prompt: 'Cosa nasce unendo Giallo 🟡 e Blu 🔵?',
    speech: 'Magia dei colori! Se mescoliamo il colore giallo con il blu, che colore compare?',
    correct: { label: 'Verde', emoji: '🟢', color: '#10b981' },
    distractors: [
      { label: 'Rosso', emoji: '🔴', color: '#ef4444' },
      { label: 'Nero', emoji: '⚫', color: '#000000' },
    ],
    explanation: 'Magia! Giallo e Blu creano il Verde brillante come un prato!',
  },
  {
    prompt: 'Cosa nasce unendo Rosso 🔴 e Giallo 🟡?',
    speech: 'Uniamo il rosso e il giallo: quale colore caldo otteniamo?',
    correct: { label: 'Arancione', emoji: '🟠', color: '#f97316' },
    distractors: [
      { label: 'Viola', emoji: '🟣', color: '#a855f7' },
      { label: 'Blu', emoji: '🔵', color: '#3b82f6' },
    ],
    explanation: 'Bravissima! Rosso e Giallo formano l\'Arancione come una carota!',
  },
  {
    prompt: 'Cosa nasce unendo Rosso 🔴 e Bianco ⚪?',
    speech: 'Cosa succede se schiariamo il rosso con un goccio di bianco?',
    correct: { label: 'Rosa', emoji: '🌸', color: '#ec4899' },
    distractors: [
      { label: 'Verde', emoji: '🟢', color: '#10b981' },
      { label: 'Marrone', emoji: '🪵', color: '#854d0e' },
    ],
    explanation: 'Esatto! Il Rosso e il Bianco creano il delicato Rosa!',
  },
];

// 6. Lettere Iniziali Affettuose & Familiari (Emma, Mamma, Sole...)
const INITIAL_LETTER_SPECIALS = [
  {
    letter: 'E',
    word: 'Elefante ed Emma!',
    emoji: '🐘',
    speech: 'La tua lettera magica! Quale figura inizia con la E di Emma e di Elefante?',
    explanation: 'La lettera E! La tua lettera speciale, Emma!',
  },
  {
    letter: 'A',
    word: 'Ape',
    emoji: '🐝',
    speech: 'Chi vola e fa ronzio iniziando con la A di Ape?',
    explanation: 'A come Ape ronzante e Arcobaleno!',
  },
  {
    letter: 'M',
    word: 'Mela',
    emoji: '🍎',
    speech: 'Cosa è rosso e dolce e inizia con la M come Mela e Mamma?',
    explanation: 'M come Mela, Mamma e Miao!',
  },
  {
    letter: 'S',
    word: 'Sole',
    emoji: '☀️',
    speech: 'Chi scalda il cielo e inizia con la lettera S di Sole?',
    explanation: 'S come Sole caldo e Stella brillante!',
  },
  {
    letter: 'C',
    word: 'Cane',
    emoji: '🐶',
    speech: 'Chi fa bau bau e inizia con la C di Cane e Cuore?',
    explanation: 'C come Cane e Cuoricino!',
  },
  {
    letter: 'O',
    word: 'Orso',
    emoji: '🐻',
    speech: 'Quale amico del bosco inizia con la O di Orsetto?',
    explanation: 'O come Orsetto goloso!',
  },
];

// 7. Indovinelli Magici in Rima per Sviluppare il Ragionamento (Preschool 5 anni)
export const KID_RIDDLES = [
  {
    prompt: 'Indovinello: Chi sono? 🐴',
    speech: 'Ascolta l\'indovinello magico: Ho una folta criniera ma non sono un leone, corro nel prato e mangio buon fieno. Chi sono?',
    riddleText: 'Ho la criniera ma non sono un leone, corro nel prato e mangio buon fieno... Chi sono?',
    correct: { label: 'Cavallino', emoji: '🐴', sublabel: 'Corre e nitrisce!' },
    distractors: [
      { label: 'Farfallina', emoji: '🦋', sublabel: 'Vola sui fiori' },
      { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota nel mare' },
    ],
    explanation: 'Proprio il cavallino galoppante con la sua bellissima criniera!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🦋',
    speech: 'Ascolta questo indovinello: Volo sui fiori con ali colorate, sembro una fata dalle ali incantate. Chi sono?',
    riddleText: 'Volo sui fiori con ali colorate, sembro una fata dalle ali incantate... Chi sono?',
    correct: { label: 'Farfalla', emoji: '🦋', sublabel: 'Ali multicolore' },
    distractors: [
      { label: 'Lumachina', emoji: '🐌', sublabel: 'Striscia piano' },
      { label: 'Cagnolino', emoji: '🐶', sublabel: 'Abbaia e corre' },
    ],
    explanation: 'Meraviglioso! La farfalla magica che vola da un fiore all\'altro!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🐌',
    speech: 'Indovinello: Porto la mia casetta sempre sulla schiena e vado pian pianino senza alcuna fretta. Chi sono?',
    riddleText: 'Porto la casetta sempre sulla schiena e vado piano piano senza alcuna fretta... Chi sono?',
    correct: { label: 'Chiocciola', emoji: '🐌', sublabel: 'Con il guscio' },
    distractors: [
      { label: 'Coniglietto', emoji: '🐰', sublabel: 'Fa grandi salti' },
      { label: 'Ghepardo', emoji: '🐆', sublabel: 'Corre velocissimo' },
    ],
    explanation: 'Esatto! La chiocciolina con la casetta rotonda sulla schiena!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🌈',
    speech: 'Indovinello colorato: Sette colori brillano nel cielo dopo il temporale, sembro un ponte magico e speciale. Chi sono?',
    riddleText: 'Sette colori brillano nel cielo dopo il temporale, sembro un ponte magico e speciale... Chi sono?',
    correct: { label: 'Arcobaleno', emoji: '🌈', sublabel: 'Ponte di 7 colori' },
    distractors: [
      { label: 'Semaforo', emoji: '🚦', sublabel: 'Sulla strada' },
      { label: 'Torta', emoji: '🎂', sublabel: 'Per il compleanno' },
    ],
    explanation: 'L\'arcobaleno meraviglioso con tutti i suoi colori magici!',
  },
];

// =========================================================================
// 8. CATALOGO MUSICA, STRUMENTI & RITMO SONORO (LIVELLI MUSICALI CON NOTE REALI)
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
    title: 'La Scala Magica: Do - Re - Mi!',
    prompt: 'Ascolta le note: DO 🎵 - RE 🎶 - ... Quale nota viene dopo?',
    speech: 'Ascolta la melodia che sale: Do... Re... Quale nota musicale cantiamo adesso? Do, Re, Mi!',
    rhythmNotes: [
      { freq: 261.63, duration: 0.35, label: 'DO', emoji: '🔴' },
      { freq: 293.66, duration: 0.35, label: 'RE', emoji: '🟠' },
      { freq: 329.63, duration: 0.45, label: '❓', emoji: '🎵' },
    ],
    correct: { label: 'Nota MI!', emoji: '🎶', sublabel: 'Do - Re - MI!', noteFreq: 329.63 },
    distractors: [
      { label: 'Silenzio', emoji: '🤫', sublabel: 'Pausa muta', noteFreq: 196.0 },
      { label: 'Sirena', emoji: '🚨', sublabel: 'Rumore forte', noteFreq: 220.0 },
    ],
    explanation: 'Bravissima! Nella scala musicale dopo il Do e il Re viene sempre il dolce MI!',
  },
  {
    title: 'Il Ritmo del Tamburello: Ta - Ta - Bum!',
    prompt: 'Segui il ritmo: Tamburo 🥁, Battito 👏, Tamburo 🥁... Cosa tocca adesso?',
    speech: 'Sentiamo il ritmo allegro: Tamburo, Battito di mani, Tamburo... Cosa viene adesso per continuare il ritmo?',
    rhythmNotes: [
      { freq: 196.0, duration: 0.3, label: 'BUM', emoji: '🥁' },
      { freq: 523.25, duration: 0.25, label: 'CLAP', emoji: '👏' },
      { freq: 196.0, duration: 0.3, label: 'BUM', emoji: '🥁' },
      { freq: 523.25, duration: 0.35, label: '❓', emoji: '✨' },
    ],
    correct: { label: 'Battito 👏', emoji: '👏', sublabel: 'Clap con le manine!', noteFreq: 523.25 },
    distractors: [
      { label: 'Cuscino', emoji: '🛏️', sublabel: 'Non fa musica', noteFreq: 220.0 },
      { label: 'Ombrello', emoji: '☂️', sublabel: 'Per la pioggia', noteFreq: 246.94 },
    ],
    explanation: 'Che senso del ritmo! Tamburo, Battito, Tamburo, Battito!',
  },
  {
    title: 'Lo Strumento coi Tasti Bianchi e Neri',
    prompt: 'Quale strumento musicale si suona coi ditini sui tasti bianchi e neri? 🎹',
    speech: 'Ascolta questa dolce melodia: quale strumento musicale ha tanti tasti bianchi e neri da suonare con le dita?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.25, label: 'DO', emoji: '🎹' },
      { freq: 659.25, duration: 0.25, label: 'MI', emoji: '🎹' },
      { freq: 783.99, duration: 0.4, label: 'SOL', emoji: '🎹' },
    ],
    correct: { label: 'Pianoforte', emoji: '🎹', sublabel: 'Tasti bianchi e neri', noteFreq: 523.25 },
    distractors: [
      { label: 'Tamburo', emoji: '🥁', sublabel: 'Si suona con le bacchette', noteFreq: 196.0 },
      { label: 'Maracas', emoji: '🪇', sublabel: 'Si scuotono', noteFreq: 440.0 },
    ],
    explanation: 'Esatto! Il Pianoforte ha i tasti bianchi e neri che cantano sotto le dita!',
  },
  {
    title: 'Chi Fa "Bum Bum" con le Bacchette?',
    prompt: 'Quale strumento tiene il tempo facendo "Bum Bum" con le bacchette? 🥁',
    speech: 'Quale strumento rotondo fa Bum Bum quando lo tocchiamo a tempo con le bacchette?',
    rhythmNotes: [
      { freq: 164.81, duration: 0.28, label: 'BUM', emoji: '🥁' },
      { freq: 164.81, duration: 0.28, label: 'BUM', emoji: '🥁' },
      { freq: 220.0, duration: 0.4, label: 'TA!', emoji: '🥁' },
    ],
    correct: { label: 'Tamburo', emoji: '🥁', sublabel: 'Ritmo Bum Bum!', noteFreq: 220.0 },
    distractors: [
      { label: 'Violino', emoji: '🎻', sublabel: 'Ha le corde e l\'archetto', noteFreq: 659.25 },
      { label: 'Arpa', emoji: '🎵', sublabel: 'Pizzica le corde', noteFreq: 587.33 },
    ],
    explanation: 'Proprio il Tamburo! È il re del ritmo e della marcia!',
  },
  {
    title: 'Lo Strumento con 6 Corde da Pizzicare',
    prompt: 'Quale strumento si abbraccia e ha le corde che fanno "Plin Plin"? 🎸',
    speech: 'Quale strumento musicale ha le corde e si suona pizzicandole con le dita per cantare insieme?',
    rhythmNotes: [
      { freq: 329.63, duration: 0.25, label: 'PLIN', emoji: '🎸' },
      { freq: 392.0, duration: 0.25, label: 'PLON', emoji: '🎸' },
      { freq: 523.25, duration: 0.4, label: 'PLIN!', emoji: '🎸' },
    ],
    correct: { label: 'Chitarra', emoji: '🎸', sublabel: 'Suona con le corde', noteFreq: 392.0 },
    distractors: [
      { label: 'Tromba', emoji: '🎺', sublabel: 'Si soffia dentro', noteFreq: 440.0 },
      { label: 'Campanella', emoji: '🔔', sublabel: 'Fa Din Don', noteFreq: 783.99 },
    ],
    explanation: 'Fantastico! La Chitarra regala allegre canzoni pizzicando le sue corde!',
  },
  {
    title: 'Ritmo Melodico: Campanella e Stellina',
    prompt: 'Completa il ritmo musicale: Din 🔔 - Din 🔔 - Stella 🌟 - Din 🔔 - Din 🔔 - ...?',
    speech: 'Ascolta il ritmo a tre tempi: Campanella, Campanella, Stella... Campanella, Campanella... cosa chiude il giro?',
    rhythmNotes: [
      { freq: 659.25, duration: 0.22, label: 'DIN', emoji: '🔔' },
      { freq: 659.25, duration: 0.22, label: 'DIN', emoji: '🔔' },
      { freq: 880.0, duration: 0.4, label: 'STELLA', emoji: '🌟' },
    ],
    correct: { label: 'Stella 🌟', emoji: '🌟', sublabel: 'Chiude il giro musicale!', noteFreq: 880.0 },
    distractors: [
      { label: 'Sasso', emoji: '🪨', sublabel: 'Non suona', noteFreq: 196.0 },
      { label: 'Scarpa', emoji: '👟', sublabel: 'Fuori tempo', noteFreq: 220.0 },
    ],
    explanation: 'Che orecchio musicale! Din, Din, Stella... il ritmo è perfetto!',
  },
];

// =========================================================================
// 9. CATALOGO PRIME PAROLINE IN INGLESE (PRESCHOOL BILINGUAL DISCOVERY)
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
  // Tier 1 Base
  {
    wordInfo: { en: 'DOG', it: 'Cagnolino', phoneticHint: 'Si legge: "Dog"', emoji: '🐶', categoryLabel: 'Animali in Inglese' },
    prompt: 'In inglese "DOG" significa Cagnolino! Qual è il DOG? 🐶',
    speech: 'Impariamo una parolina in inglese! In inglese il cagnolino si chiama Dog! Tocca il Dog!',
    correct: { label: 'DOG (Cagnolino)', emoji: '🐶', sublabel: '🇬🇧 Dog = 🇮🇹 Cagnolino' },
    distractors: [
      { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota nel mare' },
      { label: 'Albero', emoji: '🌳', sublabel: 'Nel bosco' },
    ],
    explanation: 'Bravissima! Dog in inglese vuol dire proprio Cagnolino!',
  },
  {
    wordInfo: { en: 'CAT', it: 'Gattino', phoneticHint: 'Si legge: "Chet"', emoji: '🐱', categoryLabel: 'Animali in Inglese' },
    prompt: 'In inglese "CAT" è il Gattino che fa Miao! Tocca il CAT! 🐱',
    speech: 'Parolina inglese! Il gattino morbido in inglese si chiama Cat! Tocca il Cat!',
    correct: { label: 'CAT (Gattino)', emoji: '🐱', sublabel: '🇬🇧 Cat = 🇮🇹 Gattino' },
    distractors: [
      { label: 'Mucca', emoji: '🐄', sublabel: 'Fa Muuu' },
      { label: 'Macchinina', emoji: '🚗', sublabel: 'Ha 4 ruote' },
    ],
    explanation: 'Super! Cat è il Gattino in inglese!',
  },
  {
    wordInfo: { en: 'SUN', it: 'Sole', phoneticHint: 'Si legge: "San"', emoji: '☀️', categoryLabel: 'Natura in Inglese' },
    prompt: 'In inglese il Sole giallo si chiama "SUN"! Qual è il SUN? ☀️',
    speech: 'Come si dice Sole in inglese? Si dice San! Tocca il Sole splendente, Sun!',
    correct: { label: 'SUN (Sole)', emoji: '☀️', sublabel: '🇬🇧 Sun = 🇮🇹 Sole' },
    distractors: [
      { label: 'Ombrello', emoji: '☂️', sublabel: 'Per la pioggia' },
      { label: 'Scarpa', emoji: '👟', sublabel: 'Si mette ai piedi' },
    ],
    explanation: 'Meraviglioso! Sun significa Sole in inglese!',
  },
  {
    wordInfo: { en: 'APPLE', it: 'Mela', phoneticHint: 'Si legge: "Èppol"', emoji: '🍎', categoryLabel: 'Frutta in Inglese' },
    prompt: 'In inglese una mela rossa si chiama "APPLE"! Tocca la APPLE! 🍎',
    speech: 'Impariamo l\'inglese: una mela dolce e rossa si chiama Èppol! Tocca la Apple!',
    correct: { label: 'APPLE (Mela)', emoji: '🍎', sublabel: '🇬🇧 Apple = 🇮🇹 Mela' },
    distractors: [
      { label: 'Carota', emoji: '🥕', sublabel: 'Arancione' },
      { label: 'Pallone', emoji: '⚽', sublabel: 'Per giocare' },
    ],
    explanation: 'Proprio così! Apple in inglese significa una mela!',
  },
  // Tier 2+ Colori, Stelle, Natura & Numeri in Inglese
  {
    wordInfo: { en: 'STAR', it: 'Stella', phoneticHint: 'Si legge: "Star"', emoji: '⭐', categoryLabel: 'Cielo in Inglese' },
    prompt: 'In inglese la Stellina dorata si chiama "STAR"! Tocca la STAR! ⭐',
    speech: 'La stellina che brilla nel cielo in inglese si chiama Star! Tocca la Star dorata!',
    correct: { label: 'STAR (Stella)', emoji: '⭐', sublabel: '🇬🇧 Star = 🇮🇹 Stella' },
    distractors: [
      { label: 'Sasso', emoji: '🪨', sublabel: 'Grigio' },
      { label: 'Funghetto', emoji: '🍄', sublabel: 'Nel bosco' },
    ],
    explanation: 'Bravissima! Star vuol dire Stella in inglese!',
  },
  {
    wordInfo: { en: 'RED', it: 'Rosso', phoneticHint: 'Si legge: "Red"', emoji: '🔴', categoryLabel: 'Colori in Inglese' },
    prompt: 'In inglese il colore ROSSO si dice "RED"! Quale cerchio è RED? 🔴',
    speech: 'Giochiamo coi colori in inglese! Il colore Rosso si chiama Red! Tocca il colore Red!',
    correct: { label: 'RED (Rosso)', emoji: '🔴', sublabel: '🇬🇧 Red = 🇮🇹 Rosso' },
    distractors: [
      { label: 'Blu', emoji: '🔵', sublabel: 'Colore del mare' },
      { label: 'Verde', emoji: '🟢', sublabel: 'Colore del prato' },
    ],
    explanation: 'Fantastico! Red è il colore Rosso in inglese!',
  },
  {
    wordInfo: { en: 'BLUE', it: 'Blu', phoneticHint: 'Si legge: "Blu"', emoji: '🔵', categoryLabel: 'Colori in Inglese' },
    prompt: 'In inglese il colore BLU del mare si scrive "BLUE"! Tocca BLUE! 🔵',
    speech: 'Come il mare e il cielo: in inglese Blu si dice Blu! Tocca il cerchio Blue!',
    correct: { label: 'BLUE (Blu)', emoji: '🔵', sublabel: '🇬🇧 Blue = 🇮🇹 Blu' },
    distractors: [
      { label: 'Giallo', emoji: '🟡', sublabel: 'Come il limone' },
      { label: 'Rosso', emoji: '🔴', sublabel: 'Come la fragola' },
    ],
    explanation: 'Perfetto! Blue è il colore Blu in inglese!',
  },
  {
    wordInfo: { en: 'HEART', it: 'Cuore', phoneticHint: 'Si legge: "Hart"', emoji: '💖', categoryLabel: 'Parole Dolci in Inglese' },
    prompt: 'In inglese il Cuoricino si chiama "HEART"! Tocca il HEART! 💖',
    speech: 'Una parola dolcissima in inglese: il cuoricino si dice Hart! Tocca il Heart rosa!',
    correct: { label: 'HEART (Cuore)', emoji: '💖', sublabel: '🇬🇧 Heart = 🇮🇹 Cuore' },
    distractors: [
      { label: 'Quadrato', emoji: '🟦', sublabel: 'Ha 4 angoli' },
      { label: 'Triangolo', emoji: '🔺', sublabel: 'Ha 3 punte' },
    ],
    explanation: 'Che meraviglia! Heart significa Cuore in inglese!',
  },
  {
    wordInfo: { en: 'BUTTERFLY', it: 'Farfalla', phoneticHint: 'Si legge: "Bàtterflai"', emoji: '🦋', categoryLabel: 'Natura in Inglese' },
    prompt: 'In inglese la Farfalla si chiama "BUTTERFLY"! Tocca la BUTTERFLY! 🦋',
    speech: 'Ascolta che bella parola inglese: la farfallina colorata si chiama Bàtterflai! Tocca la Butterfly!',
    correct: { label: 'BUTTERFLY (Farfalla)', emoji: '🦋', sublabel: '🇬🇧 Butterfly = 🇮🇹 Farfalla' },
    distractors: [
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'Cammina piano' },
      { label: 'Orsetto', emoji: '🐻', sublabel: 'Dorme nella tana' },
    ],
    explanation: 'Campionessa d\'inglese! Butterfly è la Farfalla!',
  },
  {
    wordInfo: { en: 'RAINBOW', it: 'Arcobaleno', phoneticHint: 'Si legge: "Rèinbou"', emoji: '🌈', categoryLabel: 'Cielo in Inglese' },
    prompt: 'In inglese l\'Arcobaleno si chiama "RAINBOW"! Tocca il RAINBOW! 🌈',
    speech: 'L\'arcobaleno dai sette colori in inglese si chiama Rèinbou! Tocca il Rainbow!',
    correct: { label: 'RAINBOW (Arcobaleno)', emoji: '🌈', sublabel: '🇬🇧 Rainbow = 🇮🇹 Arcobaleno' },
    distractors: [
      { label: 'Nuvola Grigia', emoji: '🌧️', sublabel: 'Pioggia' },
      { label: 'Sasso', emoji: '🪨', sublabel: 'Duro' },
    ],
    explanation: 'Bravissima! Rainbow significa proprio Arcobaleno!',
  },
];

// =========================================================================
// 10. CATALOGO LIVELLI PSICOMETRICI PER MISURARE IL QI (WPPSI-IV 5 ANNI)
// Parametri misurati:
// - Ragionamento Fluido & Matrici Analogiche (Gf)
// - Elaborazione Visuo-Spaziale & Trasformazione Forme (Gv)
// - Memoria di Lavoro & Serie Deduttive (Gwm)
// - Astrazione Concettuale & Categorizzazione (Gc/Gf)
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
    iqParameterTag: 'Ragionamento Analogico Fluido (Gf)',
    prompt: 'Analogia QI: Il Pesciolino 🐟 sta al Mare 🌊 come l\'Uccellino 🐦 sta al...?',
    speech: 'Sfida del Genietto! Se il pesciolino nuota nel mare, l\'uccellino con le ali dove vola?',
    patternItems: ['🐟', '➔', '🌊', '🐦', '➔', '❓'],
    correct: { label: 'Cielo Azzurro', emoji: '☁️', sublabel: 'Vola nel cielo!' },
    distractors: [
      { label: 'Sotto il Mare', emoji: '🪸', sublabel: 'Per i pesci' },
      { label: 'Nel Frigorifero', emoji: '🧊', sublabel: 'Troppo freddo' },
    ],
    explanation: 'Ragionamento perfetto! Pesce nel mare, uccellino nel cielo!',
  },
  {
    iqParameterTag: 'Matrice Visuo-Spaziale (Gv/Gf)',
    prompt: 'Matrice QI: Cerchio Rosso 🔴 ➔ Stella Rossa 🌟 : Cerchio Blu 🔵 ➔ ...?',
    speech: 'Osserva la trasformazione magica: il Cerchio Rosso diventa una Stella Rossa. Allora il Cerchio Blu cosa diventa?',
    patternItems: ['🔴', '➔', '🌟', '🔵', '➔', '❓'],
    correct: { label: 'Stella Blu!', emoji: '💠', sublabel: 'Stessa forma, colore blu' },
    distractors: [
      { label: 'Banana Gialla', emoji: '🍌', sublabel: 'È un frutto' },
      { label: 'Quadrato Verde', emoji: '🟩', sublabel: 'Forma e colore diversi' },
    ],
    explanation: 'Che mente brillante! Hai trasformato la forma mantenendo la regola logica!',
  },
  {
    iqParameterTag: 'Deduzione Logico-Temporale (Gf)',
    prompt: 'Analogia QI: Il Sole ☀️ brilla di Giorno, mentre la Luna 🌙 brilla di...?',
    speech: 'Pensiamo insieme: il Sole illumina il giorno, mentre la Luna e le stelline quando brillano?',
    patternItems: ['☀️', '➔', '🌅', '🌙', '➔', '❓'],
    correct: { label: 'Di Notte!', emoji: '🌌', sublabel: 'Nel cielo stellato' },
    distractors: [
      { label: 'A Mezzogiorno', emoji: '🏖️', sublabel: 'C\'è il sole' },
      { label: 'Nel Piatto', emoji: '🍽️', sublabel: 'Per la pappa' },
    ],
    explanation: 'Esatto! Sole di giorno, Luna di notte: un\'analogia logica impeccabile!',
  },
  {
    iqParameterTag: 'Astrazione Funzionale (Gc/Gf)',
    prompt: 'Logica QI: La Scarpa 👟 si mette sul Piede, il Cappello 🧢 si mette sulla...?',
    speech: 'Ragionamento del Genietto: se la scarpa veste il piedino, il cappello dove si indossa?',
    patternItems: ['👟', '➔', '🦶', '🧢', '➔', '❓'],
    correct: { label: 'Sulla Testa!', emoji: '🧒', sublabel: 'Protegge il capino' },
    distractors: [
      { label: 'Sulla Pancia', emoji: '👕', sublabel: 'Lì va la maglietta' },
      { label: 'Sulle Mani', emoji: '🧤', sublabel: 'Lì vanno i guanti' },
    ],
    explanation: 'Bravissima! Scarpa sul piede, cappello sulla testa!',
  },
  {
    iqParameterTag: 'Memoria di Lavoro & Crescita (Gwm)',
    prompt: 'Serie QI: 1 Germoglio 🌱 ➔ 2 Fiorellini 🌸🌸 ➔ 3 Alberi 🌳🌳🌳. Quale passo mostra PIÙ elementi?',
    speech: 'Osserva la crescita della natura: prima c\'è un germoglio, poi due fiorellini, poi tre alberi! Quale gruppo è il più numeroso?',
    patternItems: ['🌱', '🌸🌸', '🌳🌳🌳', '❓'],
    correct: { label: '3 Alberi 🌳🌳🌳', emoji: '🌳', sublabel: '3 è il più grande della serie!' },
    distractors: [
      { label: '1 Germoglio 🌱', emoji: '🌱', sublabel: 'È solo uno' },
      { label: '2 Fiorellini 🌸', emoji: '🌸', sublabel: 'Sono due' },
    ],
    explanation: 'Ottima concentrazione! La serie cresce da 1 a 2 fino a 3 alberi!',
  },
  {
    iqParameterTag: 'Categorizzazione Esclusiva (Gf)',
    prompt: 'Test QI: Mela 🍎, Fragola 🍓 e Banana 🍌 sono frutti. Quale tra questi NON c\'entra?',
    speech: 'Trova l\'elemento fuori categoria: Mela, Fragola, Banana... quale oggetto non appartiene alla famiglia della frutta?',
    patternItems: ['🍎', '🍓', '🍌', '❓'],
    correct: { label: 'Orologio ⏰', emoji: '⏰', sublabel: 'Segna l\'ora, non è un frutto!' },
    distractors: [
      { label: 'Mela Rossa', emoji: '🍎', sublabel: 'È un frutto' },
      { label: 'Fragolina', emoji: '🍓', sublabel: 'È un frutto' },
    ],
    explanation: 'Geniale! Hai distinto subito la categoria logica della frutta!',
  },
];

// Occasional name insertion (1 in 5 times)
export function getEncouragementPhrase(isSuccess: boolean, includeName: boolean = Math.random() < 0.22): string {
  if (isSuccess) {
    const withoutName = [
      'Bravissima! Risposta perfetta!',
      'Eccezionale! Hai fatto centro!',
      'Fantastico! Continua così!',
      'Proprio così! Che mente brillante!',
      'Meraviglioso! Ottimo ragionamento!',
      'Superlativo! Che bella risposta!',
    ];
    const withName = [
      'Bravissima Emma! Hai fatto centro!',
      'Super Emma! Sei una campionessa!',
      'Proprio così, Emma! Che bel colpo!',
    ];
    return includeName 
      ? withName[Math.floor(Math.random() * withName.length)]
      : withoutName[Math.floor(Math.random() * withoutName.length)];
  } else {
    const withoutName = [
      'Quasi! Guarda bene e riprova.',
      'Non fa niente, fai con calma e ritenta!',
      'Sei vicina! Prova a guardare un\'altra volta.',
    ];
    const withName = [
      'Quasi, Emma! Fai con calma e riprova.',
      'Non preoccuparti Emma, ritenta con un sorriso!',
    ];
    return includeName
      ? withName[Math.floor(Math.random() * withName.length)]
      : withoutName[Math.floor(Math.random() * withoutName.length)];
  }
}

// =========================================================================
// PROCEDURAL LEVEL GENERATOR - GRADUAL CRESCENDO EVERY 10 LEVELS
// Includes in every 10-level cycle:
// - Step 1: Versi degli Animali & Natura (logic)
// - Step 2: Conteggio Interattivo con il Dito (numbers - grammatica M/F perfetta)
// - Step 3: Musica, Note & Ritmo Sonoro con audio reale (music)
// - Step 4: Forme, Colori & Mescolanze Cromatiche (shapes)
// - Step 5: Lettere Familiari, Fonetica & Indovinelli in Rima (letters)
// - Step 6: Prime Paroline in Inglese (english)
// - Step 7: Livello Misurazione QI - Matrici & Analogie Psicometriche (logic / iq_matrix)
// - Step 8: Grandezze, Habitat o Sottrazione Visiva Concreta (numbers / logic)
// - Step 9: Pattern Sequenziale o Addizione Visiva Concreta (numbers / logic)
// - Level 10, 20, 30...: Gioco di Svago, poi il grado di difficoltà sale di Tier!
// =========================================================================
export function generateProceduralPuzzle(level: number): Puzzle {
  const guide = ANIMAL_GUIDES[(level - 1) % ANIMAL_GUIDES.length];
  
  // Tier increases every 10 levels after the Svago level (10, 20, 30, 40...)
  const tier = Math.floor((level - 1) / 10) + 1;
  const step = ((level - 1) % 10) + 1; // 1 to 9

  // Select mathematical theme with proper grammatical gender
  const mathTheme = MATH_ITEM_CATALOG[(level + tier) % MATH_ITEM_CATALOG.length];

  // -------------------------------------------------------------
  // STEP 1: I VERSI DEGLI ANIMALI & IDENTITÀ
  // -------------------------------------------------------------
  if (step === 1) {
    const soundList = tier === 1 
      ? ANIMAL_SOUNDS.slice(0, 3)
      : ANIMAL_SOUNDS;
    const item = soundList[(level + tier) % soundList.length];
    
    const options: PuzzleOption[] = deterministicShuffle([
      {
        id: 'opt_sound_corr',
        label: item.correct.label,
        emoji: item.correct.emoji,
        sublabel: item.correct.sublabel,
        isCorrect: true,
      },
      ...item.distractors.map((d, i) => ({
        id: `opt_sound_dist_${i}`,
        label: d.label,
        emoji: d.emoji,
        sublabel: d.sublabel,
        isCorrect: false,
      })),
    ], level);

    return {
      id: `lvl_${level}_sound`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'animal_sounds',
      title: `Livello ${level}: I Versi degli Animali`,
      prompt: item.prompt,
      speechText: item.speech,
      animalGuide: guide,
      options,
      rewardStars: 2,
      rewardGems: 1,
      funExplanation: item.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 2: CONTEGGIO INTERATTIVO CON IL DITO (Grammatica M/F impeccabile)
  // -------------------------------------------------------------
  if (step === 2) {
    const targetCount = tier === 1
      ? 2 + ((level - 1) % 2)
      : tier === 2
      ? 3 + ((level - 1) % 3)
      : tier === 3
      ? 4 + ((level - 1) % 3)
      : 5 + ((level - 1) % 3);

    const formatted = formatQuantityItalian(targetCount, mathTheme);

    return {
      id: `lvl_${level}_count`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      type: 'count_interactive',
      title: `Livello ${level}: Tocca e Conta!`,
      prompt: `Tocca con il dito ${mathTheme.articlePluralAll} ${formatted.text}!`,
      speechText: `Tocca ${mathTheme.articlePluralAll} ${mathTheme.plural}, ${mathTheme.eachPhrase}, con il ditino per ${mathTheme.countPronoun} insieme!`,
      animalGuide: guide,
      targetCount,
      itemEmoji: mathTheme.emoji,
      itemName: formatted.text,
      itemGender: mathTheme.gender,
      rewardStars: 2,
      rewardGems: 2,
      funExplanation: `Bravissima! Hai contato fino a ${formatted.speech}!`,
    };
  }

  // -------------------------------------------------------------
  // STEP 3: MUSICA, NOTE & RITMO SONORO (LIVELLI DI MUSICA E RITMO)
  // -------------------------------------------------------------
  if (step === 3) {
    const musicItem = MUSIC_RHYTHM_CATALOG[(level + tier - 1) % MUSIC_RHYTHM_CATALOG.length];
    const options: PuzzleOption[] = deterministicShuffle([
      {
        id: 'opt_music_corr',
        label: musicItem.correct.label,
        emoji: musicItem.correct.emoji,
        sublabel: musicItem.correct.sublabel,
        noteFreq: musicItem.correct.noteFreq,
        isCorrect: true,
      },
      ...musicItem.distractors.map((d, i) => ({
        id: `opt_music_dist_${i}`,
        label: d.label,
        emoji: d.emoji,
        sublabel: d.sublabel,
        noteFreq: d.noteFreq,
        isCorrect: false,
      })),
    ], level);

    return {
      id: `lvl_${level}_music`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'music',
      type: 'music_rhythm',
      title: `Livello ${level}: ${musicItem.title} 🎵`,
      prompt: musicItem.prompt,
      speechText: musicItem.speech,
      animalGuide: guide,
      rhythmNotes: musicItem.rhythmNotes,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: musicItem.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 4: FORME, COLORI & SPAZIO
  // -------------------------------------------------------------
  if (step === 4) {
    if (tier >= 2 && level % 2 === 0) {
      const mix = COLOR_MIXES[(level + tier) % COLOR_MIXES.length];
      const options: PuzzleOption[] = deterministicShuffle([
        {
          id: 'opt_mix_corr',
          label: mix.correct.label,
          emoji: mix.correct.emoji,
          color: mix.correct.color,
          isCorrect: true,
        },
        ...mix.distractors.map((d, i) => ({
          id: `opt_mix_dist_${i}`,
          label: d.label,
          emoji: d.emoji,
          color: d.color,
          isCorrect: false,
        })),
      ], level);

      return {
        id: `lvl_${level}_colormix`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        type: 'color_mix',
        title: `Livello ${level}: Magia dei Colori!`,
        prompt: mix.prompt,
        speechText: mix.speech,
        animalGuide: guide,
        options,
        rewardStars: 2,
        rewardGems: 1,
        funExplanation: mix.explanation,
      };
    } else {
      const shapeList = tier === 1 ? SHAPES_CATALOG.slice(0, 3) : SHAPES_CATALOG;
      const shape = shapeList[(level + tier) % shapeList.length];
      const otherShapes = SHAPES_CATALOG.filter(s => s.name !== shape.name).slice(0, 2);

      const articleShape = shape.name === 'Stella' ? 'la' : 'il';
      const options: PuzzleOption[] = deterministicShuffle([
        {
          id: `opt_shape_corr_${shape.name}`,
          label: shape.name,
          emoji: shape.emoji,
          color: shape.color,
          sublabel: shape.hint,
          isCorrect: true,
        },
        ...otherShapes.map((s, idx) => ({
          id: `opt_shape_dist_${idx}`,
          label: s.name,
          emoji: s.emoji,
          color: s.color,
          sublabel: s.hint,
          isCorrect: false,
        })),
      ], level);

      return {
        id: `lvl_${level}_shape`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        type: 'match_shape',
        title: `Livello ${level}: Riconosci la Forma!`,
        prompt: `Tocca ${articleShape} "${shape.name}" ${shape.emoji}`,
        speechText: `Tocca con il ditino la figura che si chiama ${shape.name}!`,
        animalGuide: guide,
        options,
        rewardStars: 2,
        rewardGems: 1,
        funExplanation: shape.name === 'Stella'
          ? `Esatto! Quella è proprio una bellissima Stella!`
          : `Esatto! Quello è proprio un bellissimo ${shape.name}!`,
      };
    }
  }

  // -------------------------------------------------------------
  // STEP 5: LETTERE FAMILIARI & INDOVINELLI IN RIMA
  // -------------------------------------------------------------
  if (step === 5) {
    if (tier >= 2 && level % 2 === 1) {
      const riddle = KID_RIDDLES[(level + tier) % KID_RIDDLES.length];
      const options: PuzzleOption[] = deterministicShuffle([
        {
          id: 'opt_riddle_corr',
          label: riddle.correct.label,
          emoji: riddle.correct.emoji,
          sublabel: riddle.correct.sublabel,
          isCorrect: true,
        },
        ...riddle.distractors.map((d, i) => ({
          id: `opt_riddle_dist_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ], level);

      return {
        id: `lvl_${level}_riddle`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'letters',
        type: 'riddle',
        title: `Livello ${level}: Indovinello in Rima! 🧩`,
        prompt: riddle.riddleText,
        speechText: riddle.speech,
        animalGuide: guide,
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: riddle.explanation,
      };
    }

    const lettersPool = tier === 1 
      ? INITIAL_LETTER_SPECIALS.slice(0, 2)
      : INITIAL_LETTER_SPECIALS;
    const letterItem = lettersPool[(level + tier) % lettersPool.length];
    const distractors = INITIAL_LETTER_SPECIALS
      .filter(l => l.letter !== letterItem.letter)
      .slice(0, 2);

    const options: PuzzleOption[] = deterministicShuffle([
      {
        id: `opt_let_corr_${letterItem.letter}`,
        label: letterItem.letter,
        emoji: letterItem.emoji,
        sublabel: letterItem.word,
        isCorrect: true,
      },
      ...distractors.map((d, i) => ({
        id: `opt_let_dist_${i}`,
        label: d.letter,
        emoji: d.emoji,
        sublabel: d.word,
        isCorrect: false,
      })),
    ], level);

    return {
      id: `lvl_${level}_letter`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'letters',
      type: 'initial_letter',
      title: `Livello ${level}: La Lettera Magica`,
      prompt: `Quale figura inizia con la "${letterItem.letter}"? (${letterItem.word})`,
      speechText: letterItem.speech,
      animalGuide: guide,
      options,
      rewardStars: 2,
      rewardGems: 1,
      funExplanation: letterItem.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 6: PRIME PAROLINE IN INGLESE (ENGLISH PRESCHOOL DISCOVERY)
  // -------------------------------------------------------------
  if (step === 6) {
    const englishPool = tier === 1
      ? ENGLISH_WORDS_CATALOG.slice(0, 4) // Dog, Cat, Sun, Apple in Tier 1
      : ENGLISH_WORDS_CATALOG;
    const engItem = englishPool[(level + tier - 1) % englishPool.length];

    const options: PuzzleOption[] = deterministicShuffle([
      {
        id: 'opt_eng_corr',
        label: engItem.correct.label,
        emoji: engItem.correct.emoji,
        sublabel: engItem.correct.sublabel,
        isCorrect: true,
      },
      ...engItem.distractors.map((d, i) => ({
        id: `opt_eng_dist_${i}`,
        label: d.label,
        emoji: d.emoji,
        sublabel: d.sublabel,
        isCorrect: false,
      })),
    ], level);

    return {
      id: `lvl_${level}_english`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'english',
      type: 'english_words',
      title: `Livello ${level}: Inglese · "${engItem.wordInfo.en}" 🇬🇧`,
      prompt: engItem.prompt,
      speechText: engItem.speech,
      animalGuide: guide,
      englishWord: engItem.wordInfo,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: engItem.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 7: LIVELLO MISURAZIONE QI (MATRICI LOGICHE & ANALOGIE WPPSI-IV)
  // -------------------------------------------------------------
  if (step === 7) {
    const iqItem = IQ_PSYCHOMETRIC_CATALOG[(level + tier - 1) % IQ_PSYCHOMETRIC_CATALOG.length];
    const options: PuzzleOption[] = deterministicShuffle([
      {
        id: 'opt_iq_corr',
        label: iqItem.correct.label,
        emoji: iqItem.correct.emoji,
        sublabel: iqItem.correct.sublabel,
        isCorrect: true,
      },
      ...iqItem.distractors.map((d, i) => ({
        id: `opt_iq_dist_${i}`,
        label: d.label,
        emoji: d.emoji,
        sublabel: d.sublabel,
        isCorrect: false,
      })),
    ], level);

    return {
      id: `lvl_${level}_iq_matrix`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'iq_matrix',
      title: `Livello ${level}: Sfida QI del Genietto 🧠`,
      prompt: iqItem.prompt,
      speechText: iqItem.speech,
      animalGuide: guide,
      patternItems: iqItem.patternItems,
      iqParameterTag: iqItem.iqParameterTag,
      options,
      rewardStars: 3,
      rewardGems: 3,
      funExplanation: iqItem.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 8: GRANDEZZE & HABITAT (Tier 1-2) O SOTTRAZIONE VISIVA (Tier 3+)
  // Grammatica rigorosa: "una mela", "tre mele meno una mela fa due mele"
  // -------------------------------------------------------------
  if (step === 8) {
    if (tier >= 3) {
      const total = tier === 3 ? 3 : tier === 4 ? 4 : 5;
      const minus = tier >= 5 && level % 2 === 0 ? 2 : 1;
      const answer = total - minus;
      const theme = mathTheme;

      const formattedTotal = formatQuantityItalian(total, theme);
      const formattedMinus = formatQuantityItalian(minus, theme);
      const formattedAnswer = formatQuantityItalian(answer, theme);

      const candidateValues = answer <= 1 ? [1, 2, 3] : [answer - 1, answer, answer + 1];
      const options: PuzzleOption[] = deterministicShuffle(
        candidateValues.map((val, idx) => ({
          id: `opt_sub_${idx}`,
          label: `${val}`,
          emoji: theme.emoji,
          sublabel: formatQuantityItalian(val, theme).text,
          isCorrect: val === answer,
        })),
        level
      );

      const speechAction = theme.gender === 'f'
        ? `Abbiamo ${formattedTotal.speech}. Ne togliamo ${formattedMinus.speech}. Quante ${theme.plural} restano?`
        : `Abbiamo ${formattedTotal.speech}. L'orsetto ne mangia ${formattedMinus.speech}. Quanti ${theme.plural} restano?`;

      return {
        id: `lvl_${level}_sub`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        type: 'visual_subtraction',
        title: `Livello ${level}: ${theme.gender === 'f' ? 'Quante ne Restano?' : 'Quanti ne Restano?'}`,
        prompt: `${formattedTotal.text} - ${formattedMinus.text} = ?`,
        speechText: speechAction,
        animalGuide: guide,
        subtractionParts: { 
          total, 
          minus, 
          emoji: theme.emoji,
          singular: theme.singular,
          plural: theme.plural,
          gender: theme.gender,
        },
        options,
        rewardStars: 3,
        rewardGems: 2,
        funExplanation: `Esatto! ${formattedTotal.speech} meno ${formattedMinus.speech} fa ${formattedAnswer.speech}!`,
      };
    } else if (level % 2 === 0) {
      const item = ANIMAL_HABITATS[(level + tier) % ANIMAL_HABITATS.length];
      const options: PuzzleOption[] = deterministicShuffle([
        {
          id: 'opt_hab_corr',
          label: item.correct.label,
          emoji: item.correct.emoji,
          sublabel: item.correct.sublabel,
          isCorrect: true,
        },
        ...item.distractors.map((d, i) => ({
          id: `opt_hab_dist_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ], level);

      return {
        id: `lvl_${level}_habitat`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'logic',
        type: 'animal_habitat',
        title: `Livello ${level}: Dove Vive?`,
        prompt: item.prompt,
        speechText: item.speech,
        animalGuide: guide,
        options,
        rewardStars: 2,
        rewardGems: 1,
        funExplanation: item.explanation,
      };
    } else {
      const item = SIZE_COMPARISONS[(level + tier) % SIZE_COMPARISONS.length];
      const options: PuzzleOption[] = deterministicShuffle([
        {
          id: 'opt_size_corr',
          label: item.correct.label,
          emoji: item.correct.emoji,
          sublabel: item.correct.sublabel,
          isCorrect: true,
        },
        ...item.distractors.map((d, i) => ({
          id: `opt_size_dist_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ], level);

      return {
        id: `lvl_${level}_size`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'logic',
        type: 'size_sorting',
        title: `Livello ${level}: Grande e Piccolo`,
        prompt: item.prompt,
        speechText: item.speech,
        animalGuide: guide,
        options,
        rewardStars: 2,
        rewardGems: 1,
        funExplanation: item.explanation,
      };
    }
  }

  // -------------------------------------------------------------
  // STEP 9: PATTERN RITMICO (Tier 1) O ADDIZIONE VISIVA CONCRETA (Tier 2+)
  // Grammatica perfetta: "una mela + una mela = due mele"
  // -------------------------------------------------------------
  if (tier >= 2) {
    const a = tier === 2 ? 1 : tier === 3 ? 2 : 3;
    const b = tier >= 4 && level % 2 === 0 ? 2 : 1;
    const answer = a + b;
    const theme = mathTheme;

    const formattedA = formatQuantityItalian(a, theme);
    const formattedB = formatQuantityItalian(b, theme);
    const formattedAnswer = formatQuantityItalian(answer, theme);

    const candidateValues = answer <= 1 ? [1, 2, 3] : [answer - 1, answer, answer + 1];
    const options: PuzzleOption[] = deterministicShuffle(
      candidateValues.map((val, idx) => ({
        id: `opt_add_${idx}`,
        label: `${val}`,
        emoji: theme.emoji,
        sublabel: formatQuantityItalian(val, theme).text,
        isCorrect: val === answer,
      })),
      level
    );

    const questionWord = theme.gender === 'f' ? 'Quante' : 'Quanti';
    const speechAdd = `Uniamo insieme: ${formattedA.speech} più ${formattedB.speech}. ${questionWord} ${theme.plural} abbiamo in tutto?`;
    const verbFa = (a === 1 && b === 1) ? 'fa' : 'fanno';

    return {
      id: `lvl_${level}_add`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      type: 'visual_addition',
      title: `Livello ${level}: Uniamo e Sommiamo!`,
      prompt: `${formattedA.text} + ${formattedB.text} = ?`,
      speechText: speechAdd,
      animalGuide: guide,
      additionParts: { 
        countA: a, 
        countB: b, 
        emoji: theme.emoji,
        singular: theme.singular,
        plural: theme.plural,
        gender: theme.gender,
      },
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: `Esatto! ${formattedA.speech} più ${formattedB.speech} ${verbFa} ${formattedAnswer.speech}!`,
    };
  } else {
    const pA = '🍎';
    const pB = '🍌';
    const pattern = [pA, pB, pA, pB, '❓'];

    const options: PuzzleOption[] = deterministicShuffle([
      { id: 'opt_pat_a', label: 'Mela 🍎', emoji: pA, isCorrect: true },
      { id: 'opt_pat_b', label: 'Banana 🍌', emoji: pB, isCorrect: false },
    ], level);

    return {
      id: `lvl_${level}_pattern`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'pattern_sequence',
      title: `Livello ${level}: Quale Viene Dopo?`,
      prompt: `Mela, Banana, Mela, Banana... cosa viene adesso?`,
      speechText: `Ascolta il ritmo: Mela, Banana, Mela, Banana... quale figura viene subito dopo?`,
      animalGuide: guide,
      patternItems: pattern,
      options,
      rewardStars: 2,
      rewardGems: 1,
      funExplanation: `Bravissima! Il ritmo ricomincia con la Mela!`,
    };
  }
}
