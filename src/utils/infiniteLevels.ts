// Infinite Adaptive Curriculum & Procedural Generator tailored to Emma (Born: 22/08/2021 - 5 Years Old)
// Preschool Focus: Visual Discrimination, Colors, Shapes, Animal Sounds, Counting 1-5, Concrete Visual Math, Logic
// Strict Italian Gender & Number Agreement (e.g. "una mela", "due mele", "un biscottino", "due biscottini")
// Systematic Crescendo of Difficulty Every 10 Levels (after each Svago Level)
import { GameCategory, Puzzle, PuzzleOption } from '../types/game';

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

  let developmentalStage = 'Fase Prescolare (Colori, Forme, Animali, Suoni, Ragionamento & Prime Quantità)';
  if (totalMonths >= 72) {
    developmentalStage = 'Fase Scuola Primaria (Inizio Lettura e Calcolo Aritmetico)';
  } else if (totalMonths >= 66) {
    developmentalStage = 'Fase Transizione Infanzia (Fonetica Spontanea & Somme Visive)';
  }

  return { years, months, totalMonths, displayText, developmentalStage };
}

// Friendly Animal Guides
const ANIMAL_GUIDES = [
  { name: 'Leo lo Scoiattolo', emoji: '🐿️', role: 'Amico degli Animali', voicePitch: 1.25 },
  { name: 'Piuma la Rondine', emoji: '🕊️', role: 'Guida dei Colori', voicePitch: 1.3 },
  { name: 'Brio il Delfino', emoji: '🐬', role: 'Campione dei Numeri', voicePitch: 1.2 },
  { name: 'Fiamma la Volpina', emoji: '🦊', role: 'Esploratrice di Forme', voicePitch: 1.22 },
  { name: 'Miele l\'Orsetto', emoji: '🧸', role: 'Custode del Bosco', voicePitch: 1.15 },
  { name: 'Barnaba il Gufo', emoji: '🦉', role: 'Saggio delle Favole', voicePitch: 1.1 },
];

// =========================================================================
// GRAMMATICAL CONCORDANCE UTILITY (GENDER & NUMBER FOR ITALIAN PRESCHOOL)
// Solves: "1 mela" -> "una mela" (NOT "uno mela"), "2 mele" (NOT "2 mela")
// =========================================================================
export interface MathItemTheme {
  emoji: string;
  singular: string;       // "mela", "fragolina", "biscottino", "stellina"
  plural: string;         // "mele", "fragoline", "biscottini", "stelline"
  gender: 'f' | 'm';
  articleSingular: string; // "una" o "un"
}

export const MATH_ITEM_CATALOG: MathItemTheme[] = [
  { emoji: '🍎', singular: 'mela', plural: 'mele', gender: 'f', articleSingular: 'una' },
  { emoji: '🍓', singular: 'fragolina', plural: 'fragoline', gender: 'f', articleSingular: 'una' },
  { emoji: '⭐', singular: 'stellina', plural: 'stelline', gender: 'f', articleSingular: 'una' },
  { emoji: '🦋', singular: 'farfallina', plural: 'farfalline', gender: 'f', articleSingular: 'una' },
  { emoji: '🥕', singular: 'carota', plural: 'carote', gender: 'f', articleSingular: 'una' },
  { emoji: '🍪', singular: 'biscottino', plural: 'biscottini', gender: 'm', articleSingular: 'un' },
  { emoji: '🎈', singular: 'palloncino', plural: 'palloncini', gender: 'm', articleSingular: 'un' },
  { emoji: '🐬', singular: 'delfino', plural: 'delfini', gender: 'm', articleSingular: 'un' },
  { emoji: '🧸', singular: 'orsetto', plural: 'orsetti', gender: 'm', articleSingular: 'un' },
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
      text: `1 ${item.singular}`,
      speech: `${item.articleSingular} ${item.singular}`,
    };
  }
  const word = ITALIAN_NUM_WORDS[count]?.[item.gender] || `${count}`;
  return {
    text: `${count} ${item.plural}`,
    speech: `${word} ${item.plural}`,
  };
}

// =========================================================================
// 5-YEAR-OLD APPROPRIATE CURATED DATA CATALOGS
// =========================================================================

// 1. I Versi degli Animali (Graduati: base nel Tier 1, selvatici/campestri nei tier successivi)
const ANIMAL_SOUNDS = [
  // Tier 1 Base
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
  // Tier 2 Natura
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
  {
    animal: 'Gattino',
    prompt: 'Cosa beve il gattino nella ciotolina? 🐱',
    speech: 'Cosa beve con gusto il gattino quando fa le fusa?',
    correct: { label: 'Latte', emoji: '🥛', sublabel: 'Fresco e bianco' },
    distractors: [
      { label: 'Carota', emoji: '🥕', sublabel: 'Verdura' },
      { label: 'Osso', emoji: '🦴', sublabel: 'Per i cani' },
    ],
    explanation: 'Proprio così! Una bella ciotolina di latte fresco!',
  },
  {
    animal: 'Topolino',
    prompt: 'Cosa cerca il furbetto topolino? 🐭',
    speech: 'Quale boccone con i buchi fa impazzire il topolino?',
    correct: { label: 'Formaggio', emoji: '🧀', sublabel: 'Giallo con i buchi' },
    distractors: [
      { label: 'Miele', emoji: '🍯', sublabel: 'Per l\'orsetto' },
      { label: 'Pesce', emoji: '🐟', sublabel: 'Per il gatto' },
    ],
    explanation: 'Il topolino adora sgranocchiare il formaggio!',
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
  {
    prompt: 'Dove dorme l\'orsetto d\'inverno? 🐻',
    speech: 'Qual è il rifugio caldo nel bosco dove dorme l\'orsetto?',
    correct: { label: 'Nella Tana', emoji: '🪵', sublabel: 'Nel bosco caldo' },
    distractors: [
      { label: 'Nel Mare', emoji: '🌊', sublabel: 'Troppo bagnato' },
      { label: 'Nel Nido', emoji: '🪺', sublabel: 'Troppo piccolo' },
    ],
    explanation: 'L\'orsetto dorme al caldo nella sua tana tra i tronchi del bosco!',
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
  {
    prompt: 'Chi è il più LENTO a camminare? 🐌',
    speech: 'Chi cammina pianissimo portando la casetta sulla schiena?',
    correct: { label: 'Chiocciolina', emoji: '🐌', sublabel: 'Molto lenta' },
    distractors: [
      { label: 'Ghepardo', emoji: '🐆', sublabel: 'Corre veloce' },
      { label: 'Leprotto', emoji: '🐇', sublabel: 'Fa grandi salti' },
    ],
    explanation: 'La chiocciolina va piano piano senza alcuna fretta!',
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

// 6. Trova l'Intruso Evidente (Logica visiva)
const ODD_ONE_OUT_CATALOG = [
  {
    prompt: 'Quale NON si mangia? 🍽️',
    speech: 'Guarda bene questi tre oggetti: quale NON è un frutto da mangiare?',
    correct: { label: 'Scarpa', emoji: '👟', sublabel: 'Si mette ai piedi!' },
    distractors: [
      { label: 'Mela', emoji: '🍎', sublabel: 'Frutto delizioso' },
      { label: 'Banana', emoji: '🍌', sublabel: 'Frutto dolce' },
    ],
    explanation: 'Bravissima! La scarpa serve per camminare, non si mangia affatto!',
  },
  {
    prompt: 'Quale NON è un animale? 🐾',
    speech: 'Tocca l\'elemento che NON è un animale vivo:',
    correct: { label: 'Automobile', emoji: '🚗', sublabel: 'Ha le ruote e il motore' },
    distractors: [
      { label: 'Gattino', emoji: '🐱', sublabel: 'È un animale' },
      { label: 'Cagnolino', emoji: '🐶', sublabel: 'È un animale' },
    ],
    explanation: 'Esatto! L\'automobile è un veicolo con le ruote, non un animale!',
  },
  {
    prompt: 'Quale NON nuota nell\'acqua? 🌊',
    speech: 'Chi tra questi NON sa nuotare sotto il mare?',
    correct: { label: 'Scoiattolo', emoji: '🐿️', sublabel: 'Vive sugli alberi!' },
    distractors: [
      { label: 'Delfino', emoji: '🐬', sublabel: 'Nuota nel mare' },
      { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota nell\'acqua' },
    ],
    explanation: 'Lo scoiattolo vive sugli alberi del bosco e mangia le ghiande!',
  },
  {
    prompt: 'Quale NON serve per dormire? 🛏️',
    speech: 'Quale di questi oggetti NON serve per fare la nanna a letto?',
    correct: { label: 'Bicicletta', emoji: '🚲', sublabel: 'Serve per pedalare fuori!' },
    distractors: [
      { label: 'Cuscino', emoji: '🛏️', sublabel: 'Morbido per la testa' },
      { label: 'Pigiama', emoji: '🧸', sublabel: 'Per la nanna' },
    ],
    explanation: 'La bicicletta serve per correre al parco, non per dormire a letto!',
  },
];

// 7. Lettere Iniziali Affettuose & Familiari (Emma, Mamma, Sole...)
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

// 8. Indovinelli Magici in Rima per Sviluppare il Ragionamento (Preschool 5 anni)
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
    prompt: 'Indovinello: Chi sono? 🐟',
    speech: 'Ascolta bene: Vivo nell\'acqua fresca, non so camminare, ma con le mie pinne so ben nuotare. Chi sono?',
    riddleText: 'Vivo nell\'acqua fresca, non so camminare, ma con le mie pinne so ben nuotare... Chi sono?',
    correct: { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota nell\'acqua' },
    distractors: [
      { label: 'Uccellino', emoji: '🐣', sublabel: 'Vola in cielo' },
      { label: 'Gattino', emoji: '🐱', sublabel: 'Fa Miao sul divano' },
    ],
    explanation: 'Bravissima! È il pesciolino argentato che sguazza nell\'acqua!',
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
    prompt: 'Indovinello: Chi sono? 🍎',
    speech: 'Ascolta la rima: Rotonda e profumata, rossa o dorata, dolce e croccante appena sgranocchiata. Chi sono?',
    riddleText: 'Rotonda e profumata, rossa o dorata, dolce e succosa appena sgranocchiata... Chi sono?',
    correct: { label: 'Mela', emoji: '🍎', sublabel: 'Frutto delizioso' },
    distractors: [
      { label: 'Sasso', emoji: '🪨', sublabel: 'Duro e grigio' },
      { label: 'Scarpa', emoji: '👟', sublabel: 'Si mette ai piedi' },
    ],
    explanation: 'Bravissima Emma! La mela dolce e croccante!',
  },
  {
    prompt: 'Indovinello: Chi sono? ☀️',
    speech: 'Indovinello caldo: Giallo e splendente nel cielo d\'estate, scaldo la terra e le giornate dorate. Chi sono?',
    riddleText: 'Giallo e splendente nel cielo d\'estate, scaldo la terra e le giornate dorate... Chi sono?',
    correct: { label: 'Sole', emoji: '☀️', sublabel: 'Luminoso e caldo' },
    distractors: [
      { label: 'Pupazzo di neve', emoji: '⛄', sublabel: 'Fatto di ghiaccio' },
      { label: 'Ombrello', emoji: '☂️', sublabel: 'Per la pioggia' },
    ],
    explanation: 'Il sole che risplende alto e ci riscalda ogni giorno!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🐰',
    speech: 'Ascolta bene: Ho lunghe orecchie e un musetto carino, mangio carote e salto nel giardino. Chi sono?',
    riddleText: 'Ho lunghe orecchie e musetto carino, mangio carote e salto nel giardino... Chi sono?',
    correct: { label: 'Coniglietto', emoji: '🐰', sublabel: 'Salterino e morbido' },
    distractors: [
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'Molto lenta' },
      { label: 'Elefante', emoji: '🐘', sublabel: 'Con la proboscide' },
    ],
    explanation: 'Proprio il tenero coniglietto dalle lunghe orecchie!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🐝',
    speech: 'Indovinello alato: Volo di fiore in fiore con un ronzio canterino, preparo il dolce miele per il tuo pancino. Chi sono?',
    riddleText: 'Volo di fiore in fiore con un ronzio canterino, preparo il dolce miele per il tuo pancino... Chi sono?',
    correct: { label: 'Ape', emoji: '🐝', sublabel: 'Fa ronzio e miele' },
    distractors: [
      { label: 'Mucca', emoji: '🐄', sublabel: 'Fa il latte' },
      { label: 'Orso', emoji: '🐻', sublabel: 'Mangia il miele' },
    ],
    explanation: 'L\'apina laboriosa che vola sui fiori e fa il miele dorato!',
  },
  {
    prompt: 'Indovinello: Chi sono? 🌙',
    speech: 'Indovinello della sera: Di notte risplendo nel cielo incantato, sembro una fetta di formaggio dorato. Chi sono?',
    riddleText: 'Di notte risplendo nel cielo incantato, sembro una fetta di formaggio dorato... Chi sono?',
    correct: { label: 'Luna', emoji: '🌙', sublabel: 'Nel cielo notturno' },
    distractors: [
      { label: 'Sole', emoji: '☀️', sublabel: 'Brilla di giorno' },
      { label: 'Albero', emoji: '🌳', sublabel: 'Con le foglie verdi' },
    ],
    explanation: 'La dolce luna che ci fa compagnia prima della nanna!',
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
// Tier 1 (Lv 1 - 9): Fondamentali (Suoni base, conteggio 1-3, forme cerchio/stella)
// Tier 2 (Lv 11 - 19): Lettere familiari, forme secondarie, conteggio 1-5, addizioni 1+1
// Tier 3 (Lv 21 - 29): Mescolanza colori, logica spaziale, confronti quantità, addizioni 2+1
// Tier 4 (Lv 31 - 39): Sottrazioni visive con asportazione (3-1), sequenze numeriche, forme e lati
// Tier 5+ (Lv 41+): Crescendo continuo combinato, mai frustrante, a misura di 5 anni
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
  // Tier 1: animali domestici. Tier 2+: animali del bosco e della campagna
  // -------------------------------------------------------------
  if (step === 1) {
    const soundList = tier === 1 
      ? ANIMAL_SOUNDS.slice(0, 3) // Gattino, Cane, Mucca
      : ANIMAL_SOUNDS;
    const item = soundList[(level + tier) % soundList.length];
    
    const options: PuzzleOption[] = [
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
    ].sort(() => Math.random() - 0.5);

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
  // STEP 2: CONTEGGIO INTERATTIVO CON IL DITO (Grammatica impeccabile)
  // Tier 1: 1 a 3 elementi
  // Tier 2: 3 a 5 elementi
  // Tier 3+: fino a 6 elementi
  // -------------------------------------------------------------
  if (step === 2) {
    const targetCount = tier === 1
      ? 2 + ((level - 1) % 2) // 2 o 3 nel Tier 1
      : tier === 2
      ? 3 + ((level - 1) % 3) // 3, 4 o 5 nel Tier 2
      : 4 + ((level - 1) % 3); // 4, 5 o 6 nel Tier 3+

    const formatted = formatQuantityItalian(targetCount, mathTheme);

    return {
      id: `lvl_${level}_count`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'numbers',
      type: 'count_interactive',
      title: `Livello ${level}: Tocca e Conta!`,
      prompt: `Tocca con il dito tutte le ${formatted.text}!`,
      speechText: `Tocca tutte le ${mathTheme.plural} una ad una con il ditino per contarle insieme!`,
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
  // STEP 3: INDOVINELLI MAGICI IN RIMA
  // Crescendo: indovinelli con rime e associazioni logiche per l'età
  // -------------------------------------------------------------
  if (step === 3) {
    const riddle = KID_RIDDLES[(level + tier) % KID_RIDDLES.length];
    const options: PuzzleOption[] = [
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
    ].sort(() => Math.random() - 0.5);

    return {
      id: `lvl_${level}_riddle`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'riddle',
      title: `Livello ${level}: Indovinello Magico! 🧩`,
      prompt: riddle.riddleText,
      speechText: riddle.speech,
      animalGuide: guide,
      options,
      rewardStars: 3,
      rewardGems: 2,
      funExplanation: riddle.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 4: FORME, COLORI & SPAZIO
  // Tier 1: Cerchio e Stella
  // Tier 2: Triangolo e Quadrato
  // Tier 3+: Mescolanza colori
  // -------------------------------------------------------------
  if (step === 4) {
    if (tier >= 3 && level % 2 === 0) {
      // Mescolanze cromatiche
      const mix = COLOR_MIXES[(level + tier) % COLOR_MIXES.length];
      const options: PuzzleOption[] = [
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
      ].sort(() => Math.random() - 0.5);

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
      // Riconoscimento forme geometriche calibrate
      const shapeList = tier === 1 ? SHAPES_CATALOG.slice(0, 3) : SHAPES_CATALOG;
      const shape = shapeList[(level + tier) % shapeList.length];
      const otherShapes = SHAPES_CATALOG.filter(s => s.name !== shape.name).slice(0, 2);

      const options: PuzzleOption[] = [
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
      ].sort(() => Math.random() - 0.5);

      return {
        id: `lvl_${level}_shape`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'shapes',
        type: 'match_shape',
        title: `Livello ${level}: Riconosci la Forma!`,
        prompt: `Tocca il "${shape.name}" ${shape.emoji}`,
        speechText: `Tocca con il ditino la figura che si chiama ${shape.name}!`,
        animalGuide: guide,
        options,
        rewardStars: 2,
        rewardGems: 1,
        funExplanation: `Esatto! Quello è proprio un bellissimo ${shape.name}!`,
      };
    }
  }

  // -------------------------------------------------------------
  // STEP 5: LETTERE FAMILIARI & FONETICA
  // Tier 1: E di Emma e A di Ape
  // Tier 2+: M di Mamma, S di Sole, C di Cane, O di Orso
  // -------------------------------------------------------------
  if (step === 5) {
    const lettersPool = tier === 1 
      ? INITIAL_LETTER_SPECIALS.slice(0, 2) // Solo E di Emma e A di Ape
      : INITIAL_LETTER_SPECIALS;
    const letterItem = lettersPool[(level + tier) % lettersPool.length];
    const distractors = INITIAL_LETTER_SPECIALS
      .filter(l => l.letter !== letterItem.letter)
      .slice(0, 2);

    const options: PuzzleOption[] = [
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
    ].sort(() => Math.random() - 0.5);

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
  // STEP 6: GRANDEZZE (Tier 1-2) O SOTTRAZIONE VISIVA CONCRETA (Tier 3+)
  // Grammatica rigorosa: "una mela", "tre mele meno una mela fa due mele"
  // -------------------------------------------------------------
  if (step === 6) {
    if (tier >= 3) {
      // Sottrazione Visiva Concreta con frutta o biscottini
      const total = tier === 3 ? 3 : 4;
      const minus = 1;
      const answer = total - minus;
      const theme = mathTheme;

      const formattedTotal = formatQuantityItalian(total, theme);
      const formattedMinus = formatQuantityItalian(minus, theme);
      const formattedAnswer = formatQuantityItalian(answer, theme);

      const options: PuzzleOption[] = [answer, answer + 1, Math.max(1, answer - 1)]
        .map((val, idx) => ({
          id: `opt_sub_${idx}`,
          label: `${val}`,
          emoji: theme.emoji,
          sublabel: formatQuantityItalian(val, theme).text,
          isCorrect: val === answer,
        }))
        .sort(() => Math.random() - 0.5);

      const speechAction = theme.gender === 'f'
        ? `Abbiamo ${formattedTotal.speech}. Ne togliamo ${theme.articleSingular}. Quante ${theme.plural} restano?`
        : `Abbiamo ${formattedTotal.speech}. L'orsetto ne mangia ${theme.articleSingular}. Quanti ${theme.plural} restano?`;

      return {
        id: `lvl_${level}_sub`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'numbers',
        type: 'visual_subtraction',
        title: `Livello ${level}: Quante ne Restano?`,
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
    } else {
      // Confronto grandezza visiva evidente (Tier 1-2)
      const item = SIZE_COMPARISONS[(level + tier) % SIZE_COMPARISONS.length];
      const options: PuzzleOption[] = [
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
      ].sort(() => Math.random() - 0.5);

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
  // STEP 7: TROVA L'INTRUSO EVIDENTE
  // -------------------------------------------------------------
  if (step === 7) {
    const item = ODD_ONE_OUT_CATALOG[(level + tier) % ODD_ONE_OUT_CATALOG.length];
    const options: PuzzleOption[] = [
      {
        id: 'opt_odd_corr',
        label: item.correct.label,
        emoji: item.correct.emoji,
        sublabel: item.correct.sublabel,
        isCorrect: true,
      },
      ...item.distractors.map((d, i) => ({
        id: `opt_odd_dist_${i}`,
        label: d.label,
        emoji: d.emoji,
        sublabel: d.sublabel,
        isCorrect: false,
      })),
    ].sort(() => Math.random() - 0.5);

    return {
      id: `lvl_${level}_odd`,
      levelNumber: level,
      difficultyTier: tier,
      category: 'logic',
      type: 'odd_one_out',
      title: `Livello ${level}: Trova l'Intruso!`,
      prompt: item.prompt,
      speechText: item.speech,
      animalGuide: guide,
      options,
      rewardStars: 2,
      rewardGems: 2,
      funExplanation: item.explanation,
    };
  }

  // -------------------------------------------------------------
  // STEP 8: HABITAT & COSA MANGIANO GLI ANIMALI
  // -------------------------------------------------------------
  if (step === 8) {
    if (level % 2 === 0) {
      const item = ANIMAL_HABITATS[(level + tier) % ANIMAL_HABITATS.length];
      const options: PuzzleOption[] = [
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
      ].sort(() => Math.random() - 0.5);

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
      const item = ANIMAL_FOOD[(level + tier) % ANIMAL_FOOD.length];
      const options: PuzzleOption[] = [
        {
          id: 'opt_food_corr',
          label: item.correct.label,
          emoji: item.correct.emoji,
          sublabel: item.correct.sublabel,
          isCorrect: true,
        },
        ...item.distractors.map((d, i) => ({
          id: `opt_food_dist_${i}`,
          label: d.label,
          emoji: d.emoji,
          sublabel: d.sublabel,
          isCorrect: false,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `lvl_${level}_food`,
        levelNumber: level,
        difficultyTier: tier,
        category: 'logic',
        type: 'animal_food',
        title: `Livello ${level}: Cosa Mangia l'Animale?`,
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
    // Addizione visiva con frutta concreta
    const a = tier === 2 ? 1 : 2;
    const b = 1;
    const answer = a + b;
    const theme = mathTheme;

    const formattedA = formatQuantityItalian(a, theme);
    const formattedB = formatQuantityItalian(b, theme);
    const formattedAnswer = formatQuantityItalian(answer, theme);

    const options: PuzzleOption[] = [answer, answer + 1, Math.max(1, answer - 1)]
      .map((val, idx) => ({
        id: `opt_add_${idx}`,
        label: `${val}`,
        emoji: theme.emoji,
        sublabel: formatQuantityItalian(val, theme).text,
        isCorrect: val === answer,
      }))
      .sort(() => Math.random() - 0.5);

    const questionWord = theme.gender === 'f' ? 'quante' : 'quanti';
    const speechAdd = a === 1 && b === 1
      ? `Uniamo insieme: ${formattedA.speech} più ${formattedB.speech}. ${questionWord.charAt(0).toUpperCase() + questionWord.slice(1)} ${theme.plural} abbiamo in tutto?`
      : `Uniamo insieme: ${formattedA.speech} più ${formattedB.speech}. ${questionWord.charAt(0).toUpperCase() + questionWord.slice(1)} ${theme.plural} abbiamo in tutto?`;

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
    // Tier 1: Pattern visivo semplice alternato (ABAB con Mela e Banana)
    const pA = '🍎';
    const pB = '🍌';
    const pattern = [pA, pB, pA, pB, '❓'];

    const options: PuzzleOption[] = [
      { id: 'opt_pat_a', label: 'Mela 🍎', emoji: pA, isCorrect: true },
      { id: 'opt_pat_b', label: 'Banana 🍌', emoji: pB, isCorrect: false },
    ].sort(() => Math.random() - 0.5);

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
