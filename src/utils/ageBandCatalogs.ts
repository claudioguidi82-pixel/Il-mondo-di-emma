// Age-Adaptive Educational Question Catalogs for "Il Mio Mondo"
// Covers 3 additional developmental bands alongside the 4-5yo band in infiniteLevels.ts:
// - toddler_2_3 (2-3 Anni · Prima Infanzia)
// - early_primary_6_7 (6-7 Anni · 1a-2a Primaria)
// - primary_8_plus (8+ Anni · Primaria Avanzata)

import { EnglishWordHighlight, RhythmNote } from '../types/game';

export interface GenericOptionItem {
  label: string;
  emoji: string;
  sublabel: string;
  color?: string;
  noteFreq?: number;
}

export interface AgeQuizEntry {
  prompt: string;
  speech: string;
  correct: GenericOptionItem;
  distractors: GenericOptionItem[];
  explanation: string;
  patternItems?: string[];
  iqParameterTag?: string;
}

export interface AgeMusicEntry {
  title: string;
  prompt: string;
  speech: string;
  rhythmNotes: RhythmNote[];
  correct: GenericOptionItem & { noteFreq: number };
  distractors: (GenericOptionItem & { noteFreq: number })[];
  explanation: string;
}

export interface AgeEnglishEntry {
  wordInfo: EnglishWordHighlight;
  prompt: string;
  speech: string;
  correct: GenericOptionItem;
  distractors: GenericOptionItem[];
  explanation: string;
}

// =========================================================================
// BAND A: 2–3 ANNI (PRIMA INFANZIA)
// =========================================================================
export const TODDLER_ANIMALS: AgeQuizEntry[] = [
  {
    prompt: 'Chi fa "MIAO MIAO" e ama fare le fusa? 🐱',
    speech: 'Ascolta bene: chi fa Miao Miao e ama le coccole?',
    correct: { label: 'Gattino', emoji: '🐱', sublabel: 'Fa Miao!' },
    distractors: [
      { label: 'Pesciolino', emoji: '🐟', sublabel: 'Nuota' },
      { label: 'Auto', emoji: '🚗', sublabel: 'Fa Brumm' },
    ],
    explanation: 'Sì! Il dolce gattino fa Miao Miao!',
  },
  {
    prompt: 'Chi fa "BAU BAU" e scodinzola felice? 🐶',
    speech: 'Chi è l\'amico che fa Bau Bau e muove la codina?',
    correct: { label: 'Cagnolino', emoji: '🐶', sublabel: 'Fa Bau Bau!' },
    distractors: [
      { label: 'Farfalla', emoji: '🦋', sublabel: 'Vola sui fiori' },
      { label: 'Nuvola', emoji: '☁️', sublabel: 'Sta in cielo' },
    ],
    explanation: 'Esatto! Il cagnolino fa Bau Bau!',
  },
  {
    prompt: 'Chi fa "MUUU" nel prato verde? 🐄',
    speech: 'In fattoria, chi fa Muuu e ci dona il latte?',
    correct: { label: 'Mucca', emoji: '🐄', sublabel: 'Fa Muuu!' },
    distractors: [
      { label: 'Uccellino', emoji: '🐦', sublabel: 'Fa Cip Cip' },
      { label: 'Pallone', emoji: '⚽', sublabel: 'Rimbalza' },
    ],
    explanation: 'Proprio la mucca! Fa Muuu sul prato verde!',
  },
  {
    prompt: 'Chi fa "CIP CIP" volando nel cielo azzurro? 🐦',
    speech: 'Guarda in alto sugli alberi: chi canta Cip Cip?',
    correct: { label: 'Uccellino', emoji: '🐦', sublabel: 'Fa Cip Cip!' },
    distractors: [
      { label: 'Elefante', emoji: '🐘', sublabel: 'È grandissimo' },
      { label: 'Treno', emoji: '🚂', sublabel: 'Fa Ciuf Ciuf' },
    ],
    explanation: 'Sì! Il piccolo uccellino canta Cip Cip!',
  },
  {
    prompt: 'Chi salta nello stagno e fa "CRA CRA"? 🐸',
    speech: 'Chi è tutta verde, salta sulle foglie e fa Cra Cra?',
    correct: { label: 'Ranocchia', emoji: '🐸', sublabel: 'Fa Cra Cra!' },
    distractors: [
      { label: 'Orsetto', emoji: '🐻', sublabel: 'Vive nel bosco' },
      { label: 'Sole', emoji: '☀️', sublabel: 'Splende in cielo' },
    ],
    explanation: 'Bravissimo! La ranocchia salta e fa Cra Cra!',
  },
  {
    prompt: 'Chi ruggisce forte facendo "ROAAAR"? 🦁',
    speech: 'Nella savana chi ha la criniera e fa Roaaar?',
    correct: { label: 'Leone', emoji: '🦁', sublabel: 'Fa Roaaar!' },
    distractors: [
      { label: 'Tartaruga', emoji: '🐢', sublabel: 'Va piano' },
      { label: 'Pesce', emoji: '🐠', sublabel: 'Sta nel mare' },
    ],
    explanation: 'Esatto! Il leone fa un ruggito Roaaar!',
  },
];

export const TODDLER_COLORS_SHAPES: AgeQuizEntry[] = [
  {
    prompt: 'Quale di questi è di colore ROSSO come la fragola? 🔴',
    speech: 'Tocca la figura di colore rosso, come una fragolina dolce!',
    correct: { label: 'Rosso', emoji: '🍓', sublabel: 'Colore Rosso!', color: '#ef4444' },
    distractors: [
      { label: 'Blu', emoji: '🐳', sublabel: 'Colore Blu', color: '#3b82f6' },
      { label: 'Giallo', emoji: '🌻', sublabel: 'Colore Giallo', color: '#eab308' },
    ],
    explanation: 'Sì! La fragola è di colore Rosso!',
  },
  {
    prompt: 'Quale di questi è di colore GIALLO come il Sole? 🟡',
    speech: 'Trova il colore giallo brillante come il sole!',
    correct: { label: 'Giallo', emoji: '☀️', sublabel: 'Colore Giallo!', color: '#eab308' },
    distractors: [
      { label: 'Verde', emoji: '🐸', sublabel: 'Colore Verde', color: '#10b981' },
      { label: 'Viola', emoji: '🍇', sublabel: 'Colore Viola', color: '#9333ea' },
    ],
    explanation: 'Esatto! Il sole splende di colore Giallo!',
  },
  {
    prompt: 'Quale figura è tutta TONDA come una palla? ⚽',
    speech: 'Tocca la forma rotonda che può rotolare: il cerchio!',
    correct: { label: 'Cerchio', emoji: '🔴', sublabel: 'Tutto tondo!' },
    distractors: [
      { label: 'Quadrato', emoji: '🟦', sublabel: 'Ha 4 punte' },
      { label: 'Triangolo', emoji: '🔺', sublabel: 'Ha 3 punte' },
    ],
    explanation: 'Perfetto! Il cerchio è tutto rotondo come una pallina!',
  },
  {
    prompt: 'Quale di questi è di colore VERDE come l\'erba? 🟢',
    speech: 'Cerca il colore verde brillante come le foglioline!',
    correct: { label: 'Verde', emoji: '🍀', sublabel: 'Colore Verde!', color: '#10b981' },
    distractors: [
      { label: 'Rosso', emoji: '🍎', sublabel: 'Colore Rosso', color: '#ef4444' },
      { label: 'Arancione', emoji: '🍊', sublabel: 'Colore Arancione', color: '#f97316' },
    ],
    explanation: 'Sì! Il quadrifoglio è proprio Verde!',
  },
  {
    prompt: 'Quale di questi è di colore BLU come il mare? 🔵',
    speech: 'Tocca il colore blu come l\'acqua del mare!',
    correct: { label: 'Blu', emoji: '🐳', sublabel: 'Colore Blu!', color: '#3b82f6' },
    distractors: [
      { label: 'Giallo', emoji: '🍌', sublabel: 'Colore Giallo', color: '#eab308' },
      { label: 'Rosa', emoji: '🌸', sublabel: 'Colore Rosa', color: '#ec4899' },
    ],
    explanation: 'Proprio così! La balena nuota nel mare Blu!',
  },
  {
    prompt: 'Dove si trova la STELLINA che brilla? ⭐',
    speech: 'Tocca la forma a stella tutta dorata!',
    correct: { label: 'Stella', emoji: '⭐', sublabel: 'Brilla in cielo!' },
    distractors: [
      { label: 'Quadrato', emoji: '🟦', sublabel: 'È un quadrato' },
      { label: 'Cerchio', emoji: '🟢', sublabel: 'È un cerchio' },
    ],
    explanation: 'Evviva! Hai riconosciuto subito la stellina!',
  },
];

export const TODDLER_LOGIC: AgeQuizEntry[] = [
  {
    prompt: 'Chi è più GRANDE tra l\'Elefante e la Formichina? 🐘',
    speech: 'Guarda bene: quale animale è grandissimo?',
    correct: { label: 'Elefante', emoji: '🐘', sublabel: 'È grandissimo!' },
    distractors: [
      { label: 'Formichina', emoji: '🐜', sublabel: 'È piccolina' },
      { label: 'Coccinella', emoji: '🐞', sublabel: 'È piccina' },
    ],
    explanation: 'Sì! L\'elefante è enorme!',
    iqParameterTag: 'Confronto Grandezze (Gv · Gf)',
  },
  {
    prompt: 'Cosa mangia il dolce Coniglietto? 🐰',
    speech: 'Il coniglietto ha fame: cosa preferisce sgranocchiare?',
    correct: { label: 'Carota', emoji: '🥕', sublabel: 'Croccante!' },
    distractors: [
      { label: 'Scarpa', emoji: '👟', sublabel: 'Non si mangia' },
      { label: 'Pallone', emoji: '⚽', sublabel: 'È un gioco' },
    ],
    explanation: 'Esatto! Il coniglietto adora le carote!',
    iqParameterTag: 'Associazioni Semplici (Gf · Gc)',
  },
  {
    prompt: 'Continua il ritmo: 🔴 ➔ 🟡 ➔ 🔴 ➔ ...?',
    speech: 'Guarda i colori: Rosso, Giallo, Rosso... quale viene adesso?',
    patternItems: ['🔴', '🟡', '🔴', '❓'],
    correct: { label: 'Giallo 🟡', emoji: '🟡', sublabel: 'Tocca al Giallo!' },
    distractors: [
      { label: 'Rosso 🔴', emoji: '🔴', sublabel: 'C\'era prima' },
      { label: 'Blu 🔵', emoji: '🔵', sublabel: 'Non c\'è nel ritmo' },
    ],
    explanation: 'Super! Dopo il rosso torna il giallo!',
    iqParameterTag: 'Sequenza AB Base (Gf)',
  },
  {
    prompt: 'Dove nuota il Pesciolino colorato? 🐟',
    speech: 'Il pesciolino vuole fare un tuffo: dove vive?',
    correct: { label: 'Nel Mare 🌊', emoji: '🌊', sublabel: 'Nell\'acqua!' },
    distractors: [
      { label: 'Sul Letto 🛏️', emoji: '🛏️', sublabel: 'Per dormire' },
      { label: 'Sull\'Albero 🌳', emoji: '🌳', sublabel: 'Ci stanno gli uccelli' },
    ],
    explanation: 'Giusto! Il pesciolino vive felice nel mare!',
    iqParameterTag: 'Habitat & Logica (Gc · Gf)',
  },
  {
    prompt: 'Trova l\'intruso: cosa NON si mangia? 🍎',
    speech: 'Quale di queste figure NON è un cibo buono da mangiare?',
    correct: { label: 'Macchinina 🚗', emoji: '🚗', sublabel: 'È un giocattolo!' },
    distractors: [
      { label: 'Mela 🍎', emoji: '🍎', sublabel: 'Frutto dolce' },
      { label: 'Banana 🍌', emoji: '🍌', sublabel: 'Frutto giallo' },
    ],
    explanation: 'Esatto! La macchinina è per giocare, non da mangiare!',
    iqParameterTag: 'Categorizzazione Base (Gf)',
  },
];

export const TODDLER_LETTERS: AgeQuizEntry[] = [
  {
    prompt: 'Quale parolina inizia con la "A" come APE? 🐝',
    speech: 'Ascolta il suono Aaa! Tocca l\'Ape che inizia con la lettera A!',
    correct: { label: 'Ape 🐝', emoji: '🐝', sublabel: 'A di Ape!' },
    distractors: [
      { label: 'Sole ☀️', emoji: '☀️', sublabel: 'S di Sole' },
      { label: 'Luna 🌙', emoji: '🌙', sublabel: 'L di Luna' },
    ],
    explanation: 'Sì! A come Ape!',
  },
  {
    prompt: 'Quale frutto inizia con la "M" come MELA? 🍎',
    speech: 'Ascolta il suono Mmm! Tocca la Mela!',
    correct: { label: 'Mela 🍎', emoji: '🍎', sublabel: 'M di Mela!' },
    distractors: [
      { label: 'Pera 🍐', emoji: '🍐', sublabel: 'P di Pera' },
      { label: 'Uva 🍇', emoji: '🍇', sublabel: 'U di Uva' },
    ],
    explanation: 'Esatto! M come Mela!',
  },
  {
    prompt: 'Quale figura splende in cielo e inizia con "S" come SOLE? ☀️',
    speech: 'Ascolta il suono Sss! Tocca il Sole splendente!',
    correct: { label: 'Sole ☀️', emoji: '☀️', sublabel: 'S di Sole!' },
    distractors: [
      { label: 'Casa 🏠', emoji: '🏠', sublabel: 'C di Casa' },
      { label: 'Fiore 🌸', emoji: '🌸', sublabel: 'F di Fiore' },
    ],
    explanation: 'Proprio il Sole! Inizia con la lettera S!',
  },
  {
    prompt: 'Quale animale inizia con la "O" come ORSO? 🐻',
    speech: 'Ascolta la vocale Ooo! Quale animale inizia con O?',
    correct: { label: 'Orso 🐻', emoji: '🐻', sublabel: 'O di Orso!' },
    distractors: [
      { label: 'Gatto 🐱', emoji: '🐱', sublabel: 'G di Gatto' },
      { label: 'Cane 🐶', emoji: '🐶', sublabel: 'C di Cane' },
    ],
    explanation: 'Sì! O come Orso!',
  },
];

export const TODDLER_ENGLISH: AgeEnglishEntry[] = [
  {
    wordInfo: { en: 'CAT', it: 'Gatto', phoneticHint: 'Càt', emoji: '🐱', categoryLabel: 'Animali Amici' },
    prompt: 'In inglese il Gattino si dice "CAT"! Tocca il gattino CAT! 🐱',
    speech: 'In inglese il gattino si chiama Càt! Tocca il gattino!',
    correct: { label: 'CAT (Gatto)', emoji: '🐱', sublabel: '🇬🇧 Cat = Gatto' },
    distractors: [
      { label: 'Cane', emoji: '🐶', sublabel: 'Dog' },
      { label: 'Sole', emoji: '☀️', sublabel: 'Sun' },
    ],
    explanation: 'Super! Cat vuol dire Gatto!',
  },
  {
    wordInfo: { en: 'DOG', it: 'Cane', phoneticHint: 'Dòg', emoji: '🐶', categoryLabel: 'Animali Amici' },
    prompt: 'In inglese il Cagnolino si dice "DOG"! Tocca DOG! 🐶',
    speech: 'In inglese il cagnolino si chiama Dòg! Tocca il cagnolino!',
    correct: { label: 'DOG (Cane)', emoji: '🐶', sublabel: '🇬🇧 Dog = Cane' },
    distractors: [
      { label: 'Pesce', emoji: '🐟', sublabel: 'Fish' },
      { label: 'Mela', emoji: '🍎', sublabel: 'Apple' },
    ],
    explanation: 'Sì! Dog è il Cagnolino!',
  },
  {
    wordInfo: { en: 'SUN', it: 'Sole', phoneticHint: 'Sàn', emoji: '☀️', categoryLabel: 'Natura' },
    prompt: 'In inglese il Sole si dice "SUN"! Tocca il Sole SUN! ☀️',
    speech: 'In inglese il sole caldo si dice Sàn! Tocca il sole!',
    correct: { label: 'SUN (Sole)', emoji: '☀️', sublabel: '🇬🇧 Sun = Sole' },
    distractors: [
      { label: 'Luna', emoji: '🌙', sublabel: 'Moon' },
      { label: 'Fiore', emoji: '🌸', sublabel: 'Flower' },
    ],
    explanation: 'Fantastico! Sun significa Sole!',
  },
  {
    wordInfo: { en: 'APPLE', it: 'Mela', phoneticHint: 'Èppol', emoji: '🍎', categoryLabel: 'Frutta' },
    prompt: 'In inglese la Mela si dice "APPLE"! Tocca APPLE! 🍎',
    speech: 'In inglese la mela rossa si dice Èppol! Tocca la mela!',
    correct: { label: 'APPLE (Mela)', emoji: '🍎', sublabel: '🇬🇧 Apple = Mela' },
    distractors: [
      { label: 'Stella', emoji: '⭐', sublabel: 'Star' },
      { label: 'Palla', emoji: '⚽', sublabel: 'Ball' },
    ],
    explanation: 'Esatto! Apple è la Mela!',
  },
];

// =========================================================================
// BAND C: 6–7 ANNI (1ª–2ª SCUOLA PRIMARIA)
// =========================================================================
export const EARLY_PRIMARY_SCIENCE: AgeQuizEntry[] = [
  {
    prompt: 'Quale pianeta del Sistema Solare è chiamato il "Pianeta Rosso" per la sua polvere ferrosa? 🪐',
    speech: 'Domanda di astronomia: quale pianeta vicino alla Terra è famoso per il suo colore rosso?',
    correct: { label: 'Marte 🔴', emoji: '🔴', sublabel: 'Il Pianeta Rosso!' },
    distractors: [
      { label: 'Nettuno 🔵', emoji: '🔵', sublabel: 'Gigante blu ghiacciato' },
      { label: 'Luna 🌙', emoji: '🌙', sublabel: 'È un satellite' },
    ],
    explanation: 'Esatto! Marte appare rosso perché il suo suolo è ricco di ossido di ferro!',
  },
  {
    prompt: 'Quale parte della pianta assorbe l\'acqua e i sali minerali dal terreno? 🌱',
    speech: 'Scienze della natura: quale parte dell\'albero sta sotto terra e beve l\'acqua dalla pioggia?',
    correct: { label: 'Le Radici', emoji: '🌱', sublabel: 'Nutrono la pianta!' },
    distractors: [
      { label: 'I Petali', emoji: '🌸', sublabel: 'Colorano il fiore' },
      { label: 'I Frutti', emoji: '🍎', sublabel: 'Contengono i semi' },
    ],
    explanation: 'Perfetto! Le radici ancorano la pianta al suolo e assorbono acqua e nutrienti!',
  },
  {
    prompt: 'A quale temperatura (in gradi) l\'acqua liquida si trasforma in GHIACCIO solido? 🧊',
    speech: 'Esperimento scientifico: quando fa tanto freddo, a quanti gradi l\'acqua congela e diventa ghiaccio?',
    correct: { label: '0 Gradi (0°C)', emoji: '🧊', sublabel: 'Punto di congelamento!' },
    distractors: [
      { label: '50 Gradi', emoji: '🌡️', sublabel: 'È molto caldo!' },
      { label: '100 Gradi', emoji: '♨️', sublabel: 'A 100°C l\'acqua bolle' },
    ],
    explanation: 'Geniale! A 0 gradi centigradi l\'acqua ghiaccia, mentre a 100 gradi bolle!',
  },
  {
    prompt: 'Quali animali sono MAMMIFERI anche se vivono sempre nell\'acqua dell\'oceano? 🐬',
    speech: 'Sfida da scienziato: quale di questi abitanti del mare è un mammifero che respira aria?',
    correct: { label: 'Delfino e Balena', emoji: '🐬', sublabel: 'Mammiferi marini!' },
    distractors: [
      { label: 'Squalo e Tonno', emoji: '🦈', sublabel: 'Sono pesci con branchie' },
      { label: 'Polpo e Granchio', emoji: '🐙', sublabel: 'Invertebrati marini' },
    ],
    explanation: 'Ottimo! Delfini e balene sono mammiferi e salgono in superficie per respirare!',
  },
  {
    prompt: 'In quale stagione gli alberi perdono le foglie gialle e arancioni prima dell\'inverno? 🍂',
    speech: 'Quale delle quattro stagioni segue l\'estate e colora i boschi di foglie dorate?',
    correct: { label: 'Autunno 🍂', emoji: '🍂', sublabel: 'Tra Estate e Inverno!' },
    distractors: [
      { label: 'Primavera 🌸', emoji: '🌸', sublabel: 'Sbocciano i fiori' },
      { label: 'Estate ☀️', emoji: '☀️', sublabel: 'Fa molto caldo' },
    ],
    explanation: 'Esatto! In autunno le foglie cambiano colore e cadono per preparare l\'albero all\'inverno!',
  },
  {
    prompt: 'Quale organo del nostro corpo pompa il sangue senza fermarsi mai, giorno e notte? ❤️',
    speech: 'Corpo umano: quale muscolo speciale batte nel petto e fa circolare il sangue?',
    correct: { label: 'Il Cuore ❤️', emoji: '❤️', sublabel: 'Motore del corpo!' },
    distractors: [
      { label: 'Lo Stomaco', emoji: '🍎', sublabel: 'Digerisce il cibo' },
      { label: 'L\'Orecchio', emoji: '👂', sublabel: 'Ascolta i suoni' },
    ],
    explanation: 'Perfetto! Il cuore è un muscolo straordinario che batte circa centomila volte al giorno!',
  },
];

export const EARLY_PRIMARY_LANGUAGE: AgeQuizEntry[] = [
  {
    prompt: 'Ortografia: Quale parola è scritta nel modo CORRETTO con la doppia consonante?',
    speech: 'Sfida di prima elementare: quale di queste parole è scritta correttamente?',
    correct: { label: 'PALLA ⚽', emoji: '⚽', sublabel: 'Con due L: PAL-LA!' },
    distractors: [
      { label: 'PALA (per giocare a calcio)', emoji: '🥄', sublabel: 'Pala serve per scavare' },
      { label: 'PLLA', emoji: '❌', sublabel: 'Manca la vocale A' },
    ],
    explanation: 'Esatto! PALLA si scrive con due L, altrimenti diventa PALA!',
  },
  {
    prompt: 'Divisione in Sillabe: Quante sillabe ha la parola "CIOC-CO-LA-TA" 🍫?',
    speech: 'Dividi in sillabe: CIOC - CO - LA - TA. Quante sillabe conti?',
    correct: { label: '4 Sillabe', emoji: '4️⃣', sublabel: 'CIOC · CO · LA · TA' },
    distractors: [
      { label: '2 Sillabe', emoji: '2️⃣', sublabel: 'Troppo poche' },
      { label: '6 Sillabe', emoji: '6️⃣', sublabel: 'Troppe' },
    ],
    explanation: 'Perfetto! Cioc-co-la-ta ha esattamente quattro sillabe!',
  },
  {
    prompt: 'Contrari: Qual è il CONTRARIO della parola "VELOCE" 🐆?',
    speech: 'Trova la parola dal significato opposto: qual è il contrario di Veloce?',
    correct: { label: 'LENTO 🐢', emoji: '🐢', sublabel: 'Opposto di Veloce!' },
    distractors: [
      { label: 'RAPIDO 🚀', emoji: '🚀', sublabel: 'È un sinonimo' },
      { label: 'ALTO 🦒', emoji: '🦒', sublabel: 'Opposto di Basso' },
    ],
    explanation: 'Bravissimo! Lento è esattamente il contrario di Veloce!',
  },
  {
    prompt: 'Singolare e Plurale: Se un fiore diventa tanti FIORI, un "AMICO" al plurale diventa...?',
    speech: 'Grammatica: uno è un amico, e quando sono in tanti sono tanti...?',
    correct: { label: 'AMICI 👫', emoji: '👫', sublabel: 'Plurale corretto!' },
    distractors: [
      { label: 'AMICHI', emoji: '❌', sublabel: 'Senza la H!' },
      { label: 'AMICA', emoji: '👤', sublabel: 'È singolare femminile' },
    ],
    explanation: 'Esatto! Il plurale di amico è AMICI, senza la lettera H!',
  },
  {
    prompt: 'Lettere Ponte (MP/MB): Come si scrive correttamente la parola con il suono della pioggia? ☂️',
    speech: 'Regola d\'oro dell\'ortografia: davanti a P e B ci vuole sempre la M! Qual è scritta bene?',
    correct: { label: 'OMBRELLO ☂️', emoji: '☂️', sublabel: 'M prima di B!' },
    distractors: [
      { label: 'ONBRELLO', emoji: '❌', sublabel: 'N prima di B è errore' },
      { label: 'OBRELLO', emoji: '❌', sublabel: 'Manca la M' },
    ],
    explanation: 'Fantastico! Prima di B e P si scrive sempre la M: oMbrello, caMpana, baMbino!',
  },
  {
    prompt: 'Vocale o Consonante: Quale di queste lettere è una VOCALE? 🔤',
    speech: 'Ricorda le cinque vocali A, E, I, O, U: quale di queste lettere è una vocale?',
    correct: { label: 'Lettera U', emoji: '🍇', sublabel: 'A · E · I · O · U!' },
    distractors: [
      { label: 'Lettera R', emoji: '🐸', sublabel: 'È una consonante' },
      { label: 'Lettera T', emoji: '🐢', sublabel: 'È una consonante' },
    ],
    explanation: 'Perfetto! La U è una delle cinque vocali dell\'alfabeto!',
  },
];

export const EARLY_PRIMARY_GEOMETRY: AgeQuizEntry[] = [
  {
    prompt: 'Poligoni: Quale figura geometrica ha 4 lati, con i lati opposti uguali (2 lunghi e 2 corti)? ▭',
    speech: 'Come un quaderno o una porta: quale figura ha due lati lunghi e due lati corti?',
    correct: { label: 'Rettangolo', emoji: '📱', sublabel: '2 lati lunghi e 2 corti!' },
    distractors: [
      { label: 'Triangolo', emoji: '🔺', sublabel: 'Ha solo 3 lati' },
      { label: 'Cerchio', emoji: '⚪', sublabel: 'Non ha lati dritti' },
    ],
    explanation: 'Esatto! Il rettangolo ha quattro lati e quattro angoli retti, come una porta o un libro!',
  },
  {
    prompt: 'Poligoni: Quanti lati ha un PENTAGONO (come una casetta stilizzata)? ⬠',
    speech: 'In geometria la parola Penta significa cinque: quanti lati ha un pentagono?',
    correct: { label: '5 Lati', emoji: '5️⃣', sublabel: 'Penta = Cinque!' },
    distractors: [
      { label: '3 Lati', emoji: '3️⃣', sublabel: 'È il triangolo' },
      { label: '4 Lati', emoji: '4️⃣', sublabel: 'È il quadrilatero' },
    ],
    explanation: 'Super! Un pentagono ha esattamente 5 lati e 5 vertici!',
  },
  {
    prompt: 'Geometria Solida 3D: Quante FACCE quadrate ha un dado da gioco (Cubo)? 🎲',
    speech: 'Pensa a un dado numerato da 1 a 6: quante facce ha un cubo in totale?',
    correct: { label: '6 Facce 🎲', emoji: '🎲', sublabel: 'Dal numero 1 al 6!' },
    distractors: [
      { label: '4 Facce', emoji: '4️⃣', sublabel: 'Troppo poche' },
      { label: '10 Facce', emoji: '🔟', sublabel: 'Troppe' },
    ],
    explanation: 'Perfetto! Un cubo ha 6 facce quadrate tutte identiche!',
  },
  {
    prompt: 'Simmetria: Quale lettera maiuscola è SIMMETRICA se la tagliamo a metà in verticale? ✂️',
    speech: 'Immagina uno specchio al centro: quale di queste lettere ha il lato sinistro uguale al destro?',
    correct: { label: 'Lettera A', emoji: '🅰️', sublabel: 'Perfettamente simmetrica!' },
    distractors: [
      { label: 'Lettera F', emoji: '🇫', sublabel: 'Non è simmetrica' },
      { label: 'Lettera L', emoji: '🇱', sublabel: 'Non è simmetrica' },
    ],
    explanation: 'Grande occhio geometrico! La lettera A ha un perfetto asse di simmetria verticale!',
  },
];

export const EARLY_PRIMARY_LOGIC: AgeQuizEntry[] = [
  {
    prompt: 'Sequenza Numerica (+3): 3 ➔ 6 ➔ 9 ➔ 12 ➔ Quale numero viene dopo?',
    speech: 'Osserva la regola: tre, sei, nove, dodici... aggiungendo 3, qual è il numero successivo?',
    patternItems: ['3', '➔', '6', '➔', '9', '➔', '12', '➔', '❓'],
    correct: { label: '15', emoji: '🎯', sublabel: '12 + 3 = 15!' },
    distractors: [
      { label: '14', emoji: '🔢', sublabel: '12 + 2' },
      { label: '18', emoji: '🔢', sublabel: 'Salto troppo grande' },
    ],
    explanation: 'Eccellente! È la tabellina del 3: dopo 12 arriva 15!',
    iqParameterTag: 'Serie Aritmetica +3 (Gf · Gwm)',
  },
  {
    prompt: 'Analogia Logica: LIBRO 📖 sta a LEGGERE come MATITA ✏️ sta a...?',
    speech: 'Completa l\'analogia: il libro serve per leggere, proprio come la matita serve per...?',
    patternItems: ['📖', '➔', '👀', '|', '✏️', '➔', '❓'],
    correct: { label: 'SCRIVERE / DISEGNARE', emoji: '📝', sublabel: 'Relazione funzionale!' },
    distractors: [
      { label: 'NUOTARE', emoji: '🏊', sublabel: 'Non c\'entra' },
      { label: 'DORMIRE', emoji: '😴', sublabel: 'Serve il letto' },
    ],
    explanation: 'Perfetto! Hai colto subito la relazione logica tra strumento e azione!',
    iqParameterTag: 'Analogia Verbale (Gf · Gc)',
  },
  {
    prompt: 'Sequenza Decrescente (-2): 20 ➔ 18 ➔ 16 ➔ 14 ➔ Quale numero manca?',
    speech: 'Contiamo all\'indietro saltando di due: venti, diciotto, sedici, quattordici... cosa viene dopo?',
    patternItems: ['20', '➔', '18', '➔', '16', '➔', '14', '➔', '❓'],
    correct: { label: '12', emoji: '⭐', sublabel: '14 - 2 = 12!' },
    distractors: [
      { label: '13', emoji: '🔢', sublabel: 'Sottrae solo 1' },
      { label: '10', emoji: '🔢', sublabel: 'Sottrae 4' },
    ],
    explanation: 'Fantastico! Togliendo 2 da 14 si arriva a 12!',
    iqParameterTag: 'Serie Decrescente (Gf · Gwm)',
  },
  {
    prompt: 'Logica Deduttiva: Luca è più alto di Sara, e Sara è più alta di Leo. Chi è il PIÙ BASSO?',
    speech: 'Ascolta con attenzione gli indizi: Luca è più alto di Sara, e Sara è più alta di Leo. Chi è il più basso dei tre?',
    patternItems: ['Luca > Sara', '·', 'Sara > Leo', '➔', 'Minore = ❓'],
    correct: { label: 'Leo', emoji: '👦', sublabel: 'Luca > Sara > Leo!' },
    distractors: [
      { label: 'Luca', emoji: '🧑', sublabel: 'È il più alto' },
      { label: 'Sara', emoji: '👧', sublabel: 'Sta nel mezzo' },
    ],
    explanation: 'Ragionamento da campione! In ordine dal più alto al più basso: Luca, Sara, Leo!',
    iqParameterTag: 'Deduzione Transitiva (Gf)',
  },
];

export const EARLY_PRIMARY_ENGLISH: AgeEnglishEntry[] = [
  {
    wordInfo: { en: 'SCHOOL', it: 'Scuola', phoneticHint: 'Scul', emoji: '🏫', categoryLabel: 'English Primaria' },
    prompt: 'Cosa significa la parola inglese "SCHOOL"? 🏫',
    speech: 'In inglese "School" è il posto dove si impara con gli amici: cosa vuol dire School?',
    correct: { label: 'Scuola 🏫', emoji: '🏫', sublabel: '🇬🇧 School = Scuola' },
    distractors: [
      { label: 'Montagna ⛰️', emoji: '⛰️', sublabel: 'Mountain' },
      { label: 'Spiaggia 🏖️', emoji: '🏖️', sublabel: 'Beach' },
    ],
    explanation: 'Great! School in inglese significa Scuola!',
  },
  {
    wordInfo: { en: 'BOOK', it: 'Libro', phoneticHint: 'Buk', emoji: '📖', categoryLabel: 'English Primaria' },
    prompt: 'In inglese il Libro si chiama "BOOK"! Qual è "BOOK"? 📖',
    speech: 'Quando leggiamo una bella storia apriamo un "Buk": tocca Book!',
    correct: { label: 'BOOK (Libro)', emoji: '📖', sublabel: '🇬🇧 Book = Libro' },
    distractors: [
      { label: 'Zaino', emoji: '🎒', sublabel: 'Backpack' },
      { label: 'Matita', emoji: '✏️', sublabel: 'Pencil' },
    ],
    explanation: 'Awesome! Book significa proprio Libro!',
  },
  {
    wordInfo: { en: 'WATER', it: 'Acqua', phoneticHint: 'Uòter', emoji: '💧', categoryLabel: 'English Primaria' },
    prompt: 'In inglese l\'Acqua fresca si dice "WATER"! Tocca "WATER"! 💧',
    speech: 'Quando abbiamo sete beviamo "Uòter": cosa significa Water?',
    correct: { label: 'WATER (Acqua)', emoji: '💧', sublabel: '🇬🇧 Water = Acqua' },
    distractors: [
      { label: 'Fuoco', emoji: '🔥', sublabel: 'Fire' },
      { label: 'Vento', emoji: '💨', sublabel: 'Wind' },
    ],
    explanation: 'Super! Water in inglese significa Acqua!',
  },
  {
    wordInfo: { en: 'TWELVE', it: 'Dodici (12)', phoneticHint: 'Tuèlv', emoji: '🕛', categoryLabel: 'Numeri in Inglese' },
    prompt: 'Quale numero corrisponde alla parola inglese "TWELVE"? 🕛',
    speech: 'Contiamo oltre il dieci in inglese: ten, eleven, twelve! Che numero è Twelve?',
    correct: { label: '12 (Dodici)', emoji: '1️⃣', sublabel: '🇬🇧 Twelve = 12!' },
    distractors: [
      { label: '2 (Due)', emoji: '2️⃣', sublabel: 'Two' },
      { label: '20 (Venti)', emoji: '🔢', sublabel: 'Twenty' },
    ],
    explanation: 'Perfetto! Twelve è il numero 12!',
  },
];

// =========================================================================
// BAND D: 8+ ANNI (PRIMARIA AVANZATA)
// =========================================================================
export const PRIMARY_ADV_SCIENCE: AgeQuizEntry[] = [
  {
    prompt: 'Scienze della Terra: Quale processo permette alle piante verdi di produrre ossigeno grazie alla luce del sole? 🌿',
    speech: 'Domanda di biologia: come si chiama il processo con cui le foglie trasformano la luce solare in energia e ossigeno?',
    correct: { label: 'Fotosintesi', emoji: '🌿', sublabel: 'Luce + CO₂ ➔ Ossigeno!' },
    distractors: [
      { label: 'Evaporazione', emoji: '💨', sublabel: 'Riguarda il ciclo dell\'acqua' },
      { label: 'Gravità', emoji: '🌍', sublabel: 'Forza di attrazione' },
    ],
    explanation: 'Straordinario! Con la fotosintesi clorofilliana le piante producono ossigeno vitale per la Terra!',
  },
  {
    prompt: 'Astronomia: Quanti giorni impiega circa la Terra per compiere un giro completo attorno al Sole (moto di rivoluzione)? 🌍',
    speech: 'Quanto dura un intero anno terrestre, cioè un giro completo della Terra intorno al Sole?',
    correct: { label: '365 Giorni', emoji: '🌍', sublabel: '1 anno solare!' },
    distractors: [
      { label: '30 Giorni', emoji: '📅', sublabel: 'Circa un mese' },
      { label: '24 Giorni', emoji: '⏰', sublabel: '24 sono le ore di un giorno' },
    ],
    explanation: 'Esatto! La Terra impiega 365 giorni (e circa 6 ore) per completare la sua orbita intorno al Sole!',
  },
  {
    prompt: 'Geografia: Qual è l\'oceano più vasto e profondo del pianeta Terra? 🌊',
    speech: 'Tra tutti gli oceani del mappamondo, quale è il più grande in assoluto?',
    correct: { label: 'Oceano Pacifico', emoji: '🌊', sublabel: 'Copre un terzo della Terra!' },
    distractors: [
      { label: 'Mar Mediterraneo', emoji: '⛵', sublabel: 'È un mare chiuso' },
      { label: 'Oceano Artico', emoji: '🧊', sublabel: 'È il più piccolo' },
    ],
    explanation: 'Bravissimo! L\'Oceano Pacifico è il gigante azzurro più esteso del pianeta!',
  },
  {
    prompt: 'Fisica: Perché un palloncino riempito di ELIO sale verso il cielo? 🎈',
    speech: 'Quesito scientifico: perché l\'elio fa volare i palloncini verso l\'alto?',
    correct: { label: 'È più leggero dell\'aria', emoji: '🎈', sublabel: 'Densità minore!' },
    distractors: [
      { label: 'È attirato dalla Luna', emoji: '🌙', sublabel: 'Non è questo il motivo' },
      { label: 'È più pesante dell\'acqua', emoji: '💧', sublabel: 'Altrimenti cadrebbe' },
    ],
    explanation: 'Perfetto! L\'elio ha una densità inferiore all\'aria circostante, quindi riceve una spinta verso l\'alto!',
  },
];

export const PRIMARY_ADV_LANGUAGE: AgeQuizEntry[] = [
  {
    prompt: 'Grammatica: Nella frase "Il gatto salta velocemente", quale parola è un VERBO (azione)?',
    speech: 'Analisi grammaticale: nella frase "Il gatto salta velocemente", qual è il verbo?',
    correct: { label: 'SALTA', emoji: '⚡', sublabel: 'Verbo saltare!' },
    distractors: [
      { label: 'GATTO', emoji: '🐱', sublabel: 'È un nome' },
      { label: 'VELOCEMENTE', emoji: '💨', sublabel: 'È un avverbio' },
    ],
    explanation: 'Ottimo! "Salta" indica l\'azione compiuta dal soggetto, quindi è il verbo!',
  },
  {
    prompt: 'Sinonimi: Quale parola ha un significato simile (sinonimo) a "CORAGGIOSO"? 🦁',
    speech: 'Trova il sinonimo esatto della parola "Coraggioso".',
    correct: { label: 'AUDACE / VALOROSO', emoji: '🛡️', sublabel: 'Stesso significato!' },
    distractors: [
      { label: 'TIMOROSO', emoji: '😰', sublabel: 'È il contrario' },
      { label: 'SILENZIOSO', emoji: '🤫', sublabel: 'Significa senza rumore' },
    ],
    explanation: 'Perfetto! Audace e valoroso sono sinonimi di coraggioso!',
  },
  {
    prompt: 'Ortografia: Quale di queste frasi usa l\'apostrofo/accento nel modo CORRETTO?',
    speech: 'Attenzione agli accenti e all\'apostrofo: quale frase è scritta senza errori?',
    correct: { label: 'Un po\' di acqua 💧', emoji: '✅', sublabel: 'Troncamento di "poco"!' },
    distractors: [
      { label: 'Un pò di acqua', emoji: '❌', sublabel: 'Ci vuole l\'apostrofo, non l\'accento' },
      { label: 'Un po di acqua', emoji: '❌', sublabel: 'Manca l\'apostrofo' },
    ],
    explanation: 'Da vero scrittore! "Po\'" deriva da "poco" quindi vuole sempre l\'apostrofo, mai l\'accento!',
  },
  {
    prompt: 'Lessico: Cosa significa il prefisso "BIO-" in parole come Biologia e Biodiversità? 🧬',
    speech: 'Etimologia: dal greco antico, che cosa significa il prefisso Bio?',
    correct: { label: 'VITA 🌱', emoji: '🌱', sublabel: 'Bios = Vita!' },
    distractors: [
      { label: 'PIETRA 🪨', emoji: '🪨', sublabel: 'Quello è Lito-' },
      { label: 'STELLA ⭐', emoji: '⭐', sublabel: 'Quello è Astro-' },
    ],
    explanation: 'Eccellente! Biologia è letteralmente lo studio della vita!',
  },
];

export const PRIMARY_ADV_GEOMETRY: AgeQuizEntry[] = [
  {
    prompt: 'Geometria: Quanti lati ha un ESAGONO regolare (come le cellette dell\'alveare delle api)? 🐝',
    speech: 'Le api costruiscono cellette perfette a forma di esagono: quanti lati ha un esagono?',
    correct: { label: '6 Lati', emoji: '⬢', sublabel: 'Esa = Sei lati!' },
    distractors: [
      { label: '5 Lati', emoji: '⬠', sublabel: 'È un pentagono' },
      { label: '8 Lati', emoji: '🛑', sublabel: 'È un ottagono' },
    ],
    explanation: 'Perfetto! L\'esagono ha 6 lati e permette alle api di non sprecare nemmeno un millimetro di spazio!',
  },
  {
    prompt: 'Perimetro: Se un quadrato ha ogni lato lungo 5 cm, qual è il suo PERIMETRO totale? 🟦',
    speech: 'Calcola il perimetro di un quadrato che ha ciascuno dei quattro lati lungo cinque centimetri.',
    correct: { label: '20 cm', emoji: '📏', sublabel: '5 × 4 = 20 cm!' },
    distractors: [
      { label: '10 cm', emoji: '📐', sublabel: 'Sono solo 2 lati' },
      { label: '25 cm', emoji: '🔢', sublabel: '25 cm² è l\'area!' },
    ],
    explanation: 'Geniale! Il perimetro è la somma dei 4 lati: 5 + 5 + 5 + 5 = 20 cm!',
  },
  {
    prompt: 'Angoli: Quanti gradi misura un ANGOLO RETTO (come l\'angolo di un quaderno)? 📐',
    speech: 'In geometria, quanti gradi esatti misura un angolo retto?',
    correct: { label: '90 Gradi (90°)', emoji: '📐', sublabel: 'Angolo retto perfetto!' },
    distractors: [
      { label: '45 Gradi', emoji: '📏', sublabel: 'È un angolo acuto' },
      { label: '180 Gradi', emoji: '➖', sublabel: 'È un angolo piatto' },
    ],
    explanation: 'Esatto! Un angolo retto misura esattamente 90 gradi!',
  },
  {
    prompt: 'Poligoni: Quale cartello stradale di STOP 🛑 ha esattamente 8 LATI?',
    speech: 'Il cartello rosso dello Stop ha otto lati uguali: come si chiama questo poligono?',
    correct: { label: 'Ottagono 🛑', emoji: '🛑', sublabel: 'Otto lati!' },
    distractors: [
      { label: 'Esagono', emoji: '⬢', sublabel: 'Ha 6 lati' },
      { label: 'Rombo', emoji: '🔷', sublabel: 'Ha 4 lati' },
    ],
    explanation: 'Perfetto! Otto lati = Ottagono!',
  },
];

export const PRIMARY_ADV_LOGIC: AgeQuizEntry[] = [
  {
    prompt: 'Serie Geometrica (×2): 2 ➔ 4 ➔ 8 ➔ 16 ➔ Quale numero raddoppiato viene dopo?',
    speech: 'Ogni numero raddoppia rispetto al precedente: due, quattro, otto, sedici... qual è il prossimo?',
    patternItems: ['2', '➔', '4', '➔', '8', '➔', '16', '➔', '❓'],
    correct: { label: '32', emoji: '🚀', sublabel: '16 × 2 = 32!' },
    distractors: [
      { label: '24', emoji: '🔢', sublabel: 'È 16 + 8' },
      { label: '20', emoji: '🔢', sublabel: 'È 16 + 4' },
    ],
    explanation: 'Straordinario! Raddoppiando 16 si ottiene esattamente 32!',
    iqParameterTag: 'Progressione Geometrica ×2 (Gf · Gwm)',
  },
  {
    prompt: 'Serie di Fibonacci: 1 ➔ 1 ➔ 2 ➔ 3 ➔ 5 ➔ 8 ➔ Somma gli ultimi due: cosa viene dopo?',
    speech: 'Sfida matematica famosa: ogni numero è la somma dei due precedenti: 3 + 5 fa 8... quindi 5 + 8 quanto fa?',
    patternItems: ['1', '1', '2', '3', '5', '8', '➔', '❓'],
    correct: { label: '13', emoji: '✨', sublabel: '5 + 8 = 13!' },
    distractors: [
      { label: '11', emoji: '🔢', sublabel: 'Troppo basso' },
      { label: '16', emoji: '🔢', sublabel: 'Quello è 8 × 2' },
    ],
    explanation: 'Incredibile! Hai risolto la celebre sequenza di Fibonacci: 5 + 8 = 13!',
    iqParameterTag: 'Deduzione di Fibonacci (Gf)',
  },
  {
    prompt: 'Analogia Scientifica: TERMOMETRO 🌡️ sta a TEMPERATURA come OROLOGIO ⏰ sta a...?',
    speech: 'Ragionamento analogico: il termometro misura la temperatura, cosa misura l\'orologio?',
    patternItems: ['🌡️ ➔ °C', '|', '⏰ ➔ ❓'],
    correct: { label: 'TEMPO ⏳', emoji: '⏳', sublabel: 'Ore, minuti e secondi!' },
    distractors: [
      { label: 'PESO ⚖️', emoji: '⚖️', sublabel: 'Si misura con la bilancia' },
      { label: 'LUNGHEZZA 📏', emoji: '📏', sublabel: 'Si misura col metro' },
    ],
    explanation: 'Perfetto! L\'orologio è lo strumento che misura lo scorrere del tempo!',
    iqParameterTag: 'Analogia Astratta (Gf · Gc)',
  },
  {
    prompt: 'Logica Matematica: Ho 3 scatole e dentro ogni scatola ci sono 6 matite. Quante matite ho in tutto?',
    speech: 'Problema mentale: tre scatole con sei matite in ciascuna. Quante matite hai in totale?',
    patternItems: ['📦(6)', '+', '📦(6)', '+', '📦(6)', '=', '❓'],
    correct: { label: '18 Matite', emoji: '✏️', sublabel: '3 × 6 = 18!' },
    distractors: [
      { label: '9 Matite', emoji: '🔢', sublabel: 'Quello è 3 + 6' },
      { label: '12 Matite', emoji: '🔢', sublabel: 'Quello è 2 × 6' },
    ],
    explanation: 'Grande calcolo! 3 scatole per 6 matite fa 18 matite!',
    iqParameterTag: 'Problem Solving Moltiplicativo (Gf · Gwm)',
  },
];

export const PRIMARY_ADV_ENGLISH: AgeEnglishEntry[] = [
  {
    wordInfo: { en: 'KNOWLEDGE', it: 'Conoscenza', phoneticHint: 'Nòledg', emoji: '🧠', categoryLabel: 'English Avanzato' },
    prompt: 'Cosa significa la parola inglese "KNOWLEDGE"? 🧠',
    speech: 'Parola da grandi esploratori: cosa significa "Knowledge" in italiano?',
    correct: { label: 'Conoscenza / Sapere', emoji: '🧠', sublabel: '🇬🇧 Knowledge = Conoscenza' },
    distractors: [
      { label: 'Velocità', emoji: '⚡', sublabel: 'Speed' },
      { label: 'Vacanza', emoji: '🏖️', sublabel: 'Holiday' },
    ],
    explanation: 'Brilliant! Knowledge significa proprio Conoscenza!',
  },
  {
    wordInfo: { en: 'YESTERDAY', it: 'Ieri', phoneticHint: 'Ièsterdei', emoji: '📅', categoryLabel: 'Tempo in Inglese' },
    prompt: 'Se "Today" è Oggi e "Tomorrow" è Domani, cosa significa "YESTERDAY"? 📅',
    speech: 'Parole del tempo in inglese: Today è oggi, Tomorrow è domani... cosa significa Yesterday?',
    correct: { label: 'Ieri ⏪', emoji: '⏪', sublabel: '🇬🇧 Yesterday = Ieri' },
    distractors: [
      { label: 'Prossima settimana', emoji: '📆', sublabel: 'Next week' },
      { label: 'Mezzanotte', emoji: '🌙', sublabel: 'Midnight' },
    ],
    explanation: 'Exact! Yesterday significa Ieri!',
  },
  {
    wordInfo: { en: 'ADVENTURE', it: 'Avventura', phoneticHint: 'Advèncer', emoji: '🧭', categoryLabel: 'English Avanzato' },
    prompt: 'Cosa significa la parola inglese "ADVENTURE"? 🧭',
    speech: 'Qual è la traduzione italiana della parola inglese "Adventure"?',
    correct: { label: 'Avventura 🧭', emoji: '🧭', sublabel: '🇬🇧 Adventure = Avventura' },
    distractors: [
      { label: 'Inverno', emoji: '❄️', sublabel: 'Winter' },
      { label: 'Quaderno', emoji: '📓', sublabel: 'Notebook' },
    ],
    explanation: 'Fantastic! Adventure significa Avventura!',
  },
  {
    wordInfo: { en: 'THUNDER', it: 'Tuono', phoneticHint: 'Thànder', emoji: '⚡', categoryLabel: 'Natura in Inglese' },
    prompt: 'Durante un temporale, cosa significa la parola inglese "THUNDER"? ⛈️',
    speech: 'Nel cielo in tempesta sentiamo il suono del "Thunder": cosa significa?',
    correct: { label: 'Tuono ⛈️', emoji: '⛈️', sublabel: '🇬🇧 Thunder = Tuono' },
    distractors: [
      { label: 'Arcobaleno', emoji: '🌈', sublabel: 'Rainbow' },
      { label: 'Neve', emoji: '❄️', sublabel: 'Snow' },
    ],
    explanation: 'Well done! Thunder significa Tuono!',
  },
];

// Personalized Initial-Letter Dictionary for any child's first letter (A-Z)
export const INITIAL_LETTER_WORD_BANK: Record<string, { word: string; emoji: string }> = {
  A: { word: 'Aereo', emoji: '✈️' },
  B: { word: 'Balena', emoji: '🐳' },
  C: { word: 'Castello', emoji: '🏰' },
  D: { word: 'Delfino', emoji: '🐬' },
  E: { word: 'Elicottero', emoji: '🚁' },
  F: { word: 'Farfalla', emoji: '🦋' },
  G: { word: 'Giraffa', emoji: '🦒' },
  H: { word: 'Hotel', emoji: '🏨' },
  I: { word: 'Isola', emoji: '🏝️' },
  J: { word: 'Jeep', emoji: '🚙' },
  K: { word: 'Koala', emoji: '🐨' },
  L: { word: 'Leone', emoji: '🦁' },
  M: { word: 'Mongolfiera', emoji: '🎈' },
  N: { word: 'Nuvola', emoji: '☁️' },
  O: { word: 'Orso', emoji: '🐻' },
  P: { word: 'Pinguino', emoji: '🐧' },
  Q: { word: 'Quadrifoglio', emoji: '🍀' },
  R: { word: 'Razzo', emoji: '🚀' },
  S: { word: 'Stella', emoji: '⭐' },
  T: { word: 'Tartaruga', emoji: '🐢' },
  U: { word: 'Uccellino', emoji: '🐦' },
  V: { word: 'Violino', emoji: '🎻' },
  W: { word: 'Waffle', emoji: '🧇' },
  X: { word: 'Xilofono', emoji: '🌈' },
  Y: { word: 'Yacht', emoji: '⛵' },
  Z: { word: 'Zebra', emoji: '🦓' },
};
