// Age-Adaptive Educational Question Catalogs for "Il Mio Mondo"
// Covers all developmental bands alongside the 4-5yo band in infiniteLevels.ts:
// - toddler_2_3 (2-3 Anni · Prima Infanzia)
// - early_primary_6_7 (6-7 Anni · 1a-2a Primaria)
// - upper_primary_8_9 (8-9 Anni · 3a-4a Primaria)
// - preteen_10_12 (10-12 Anni · 5a Primaria & Scuola Media)

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
// PROGRESSIVE ART / ARTISTICA & VISUAL REASONING (6–7 ANNI)
// =========================================================================
export const EARLY_PRIMARY_ART: AgeQuizEntry[] = [
  {
    prompt: 'Artistica · Colori Caldi: Quale di questi colori trasmette CALORE come il fuoco e il sole d’estate? ☀️',
    speech: 'Educazione artistica: quale tra questi è un colore caldo come il sole e il fuoco?',
    correct: { label: 'Arancione 🔥', emoji: '🟠', sublabel: 'Colore caldo!', color: '#f97316' },
    distractors: [
      { label: 'Blu Ghiaccio ❄️', emoji: '🔵', sublabel: 'È un colore freddo', color: '#3b82f6' },
      { label: 'Verde Mare 🌊', emoji: '🟢', sublabel: 'È un colore freddo', color: '#10b981' },
    ],
    explanation: 'Bravissimo! Rosso, giallo e arancione sono i colori caldi della tavolozza!',
    iqParameterTag: 'Educazione Artistica & Percezione Cromatica (Gv · Gc)',
  },
  {
    prompt: 'Artistica · Simmetria: Se pieghi a metà una farfalla disegnata, le due ali sono uguali e speculari. Come si chiama questa proprietà? 🦋',
    speech: 'Osserva le ali della farfalla: sono perfettamente speculari! Come si chiama in arte e geometria questa armonia?',
    correct: { label: 'Simmetria 🦋', emoji: '🦋', sublabel: 'Due metà speculari!' },
    distractors: [
      { label: 'Ombra 🌑', emoji: '🌑', sublabel: 'È la sagoma scura' },
      { label: 'Cornice 🖼️', emoji: '🖼️', sublabel: 'È il bordo del quadro' },
    ],
    explanation: 'Esatto! La simmetria rende i disegni equilibrati e armoniosi come una farfalla!',
    iqParameterTag: 'Ragionamento Visuo-Spaziale & Artistico (Gv)',
  },
  {
    prompt: 'Artistica · Tecniche: Con quale tecnica crei un’immagine unendo tanti pezzettini colorati di carta o ceramica come un puzzle? 🧩',
    speech: 'In laboratorio di artistica, come si chiama l’opera fatta con tante tessere colorate vicine tra loro?',
    correct: { label: 'Mosaico 🎨', emoji: '🧩', sublabel: 'Tessere colorate!' },
    distractors: [
      { label: 'Acquerello 💧', emoji: '💧', sublabel: 'Usa pennello e acqua' },
      { label: 'Scultura 🗿', emoji: '🗿', sublabel: 'Si modella in 3D' },
    ],
    explanation: 'Perfetto! Il mosaico unisce piccole tessere colorate per formare figure spettacolari!',
    iqParameterTag: 'Linguaggio Artistico & Composizione (Gc · Gv)',
  },
  {
    prompt: 'Artistica · Colori Primari e Secondari: Quale colore SECONDARIO ottieni mescolando il Blu 🔵 con il Giallo 🟡?',
    speech: 'Sfida sulla tavolozza: mescolando blu e giallo quale colore secondario nasce?',
    correct: { label: 'Verde 🟢', emoji: '🌿', sublabel: 'Blu + Giallo = Verde!', color: '#10b981' },
    distractors: [
      { label: 'Viola 🟣', emoji: '🍇', sublabel: 'Serve rosso + blu', color: '#9333ea' },
      { label: 'Rosa 🌸', emoji: '🌸', sublabel: 'Serve rosso + bianco', color: '#ec4899' },
    ],
    explanation: 'Esatto! Blu e Giallo si fondono nel Verde brillante della natura!',
    iqParameterTag: 'Sintesi Cromatica (Gv · Gf)',
  },
];

// =========================================================================
// PROGRESSIVE MUSIC & SENSE OF RHYTHM (6–7 ANNI)
// =========================================================================
export const EARLY_PRIMARY_MUSIC: AgeMusicEntry[] = [
  {
    title: 'Senso del Ritmo: Scala Ascendente',
    prompt: 'Ascolta la melodia che sale: DO ➔ RE ➔ MI ➔ FA ➔ Quale nota sale subito dopo? 🎵',
    speech: 'Ascolta attentamente la scala musicale che sale gradino dopo gradino: Do, Re, Mi, Fa... quale nota viene subito dopo?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.3, label: 'DO', emoji: '🔴', color: '#ef4444' },
      { freq: 587.33, duration: 0.3, label: 'RE', emoji: '🟠', color: '#f97316' },
      { freq: 659.25, duration: 0.3, label: 'MI', emoji: '🟡', color: '#eab308' },
      { freq: 698.46, duration: 0.3, label: 'FA', emoji: '🟢', color: '#22c55e' },
    ],
    correct: { label: 'SOL 🔵', emoji: '🎵', sublabel: 'Do-Re-Mi-Fa-SOL!', noteFreq: 783.99 },
    distractors: [
      { label: 'DO 🔴', emoji: '🎶', sublabel: 'È la prima nota', noteFreq: 523.25 },
      { label: 'SI 🟣', emoji: '🎼', sublabel: 'È l’ultima nota', noteFreq: 987.77 },
    ],
    explanation: 'Fantastico! Dopo il FA nella scala musicale c’è sempre il SOL!',
  },
  {
    title: 'Senso del Ritmo: Pattern Sonoro A-A-B',
    prompt: 'Ascolta il ritmo: BASSO ➔ BASSO ➔ ACUTO ➔ BASSO ➔ BASSO ➔ Cosa completa la battuta? 🥁',
    speech: 'Segui il senso del ritmo: due note basse e una acuta, poi ancora due note basse... quale suono chiude il ritmo?',
    rhythmNotes: [
      { freq: 392.0, duration: 0.25, label: 'BUM', emoji: '🥁', color: '#6366f1' },
      { freq: 392.0, duration: 0.25, label: 'BUM', emoji: '🥁', color: '#6366f1' },
      { freq: 783.99, duration: 0.35, label: 'CLAP', emoji: '👏', color: '#f59e0b' },
      { freq: 392.0, duration: 0.25, label: 'BUM', emoji: '🥁', color: '#6366f1' },
      { freq: 392.0, duration: 0.25, label: 'BUM', emoji: '🥁', color: '#6366f1' },
    ],
    correct: { label: 'CLAP (Acuto) 👏', emoji: '👏', sublabel: 'Bum-Bum-Clap!', noteFreq: 783.99 },
    distractors: [
      { label: 'BUM (Basso) 🥁', emoji: '🥁', sublabel: 'Ce ne erano già due', noteFreq: 392.0 },
      { label: 'Silenzio 🤫', emoji: '🤫', sublabel: 'Manca il terzo battito', noteFreq: 261.63 },
    ],
    explanation: 'Che senso del ritmo! Il pattern A-A-B si chiude esattamente con il battito acuto CLAP!',
  },
  {
    title: 'Senso del Ritmo: Lento o Veloce?',
    prompt: 'In musica, quale parola italiana indica un ritmo VELOCE e gioioso? 🎼',
    speech: 'I musicisti di tutto il mondo usano parole italiane per il tempo: quale indica una musica veloce e allegra?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.18, label: 'DO', emoji: '⚡', color: '#10b981' },
      { freq: 659.25, duration: 0.18, label: 'MI', emoji: '⚡', color: '#10b981' },
      { freq: 783.99, duration: 0.18, label: 'SOL', emoji: '⚡', color: '#10b981' },
      { freq: 1046.5, duration: 0.25, label: 'DO!', emoji: '🌟', color: '#f59e0b' },
    ],
    correct: { label: 'Allegro ⚡', emoji: '🎻', sublabel: 'Ritmo vivace e veloce!', noteFreq: 1046.5 },
    distractors: [
      { label: 'Adagio 🐢', emoji: '🐢', sublabel: 'Significa molto lento', noteFreq: 329.63 },
      { label: 'Pausa ⏸️', emoji: '⏸️', sublabel: 'Indica silenzio', noteFreq: 261.63 },
    ],
    explanation: 'Esatto! "Allegro" dice all’orchestra di suonare con passo veloce e gioioso!',
  },
];

// =========================================================================
// BAND D: 8–9 ANNI (3ª–4ª PRIMARIA: SCIENZE, GEOGRAFIA, GRAMMATICA, ARTE, MUSICA)
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
    prompt: 'Geografia d’Italia: Qual è il fiume più lungo d’Italia, che attraversa la Pianura Padana? 🏞️',
    speech: 'Sfida di geografia italiana: qual è il fiume più lungo della nostra penisola?',
    correct: { label: 'Fiume Po 🏞️', emoji: '🏞️', sublabel: 'Lungo 652 km!' },
    distractors: [
      { label: 'Fiume Tevere', emoji: '🏛️', sublabel: 'Attraversa Roma (405 km)' },
      { label: 'Fiume Arno', emoji: '🌉', sublabel: 'Attraversa Firenze' },
    ],
    explanation: 'Esatto! Il Po nasce dal Monviso e attraversa tutto il Nord Italia fino al Mare Adriatico!',
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

// =========================================================================
// PROGRESSIVE ART / ARTISTICA (8–9 ANNI)
// =========================================================================
export const UPPER_PRIMARY_ART: AgeQuizEntry[] = [
  {
    prompt: 'Artistica · Colori Complementari: Sulla ruota dei colori, qual è il colore opposto e complementare del ROSSO 🔴 (che lo fa risaltare al massimo)?',
    speech: 'Teoria dell’arte: quale colore è il complementare del rosso sulla ruota cromatica?',
    correct: { label: 'Verde 🟢', emoji: '🟢', sublabel: 'Rosso ↔ Verde!', color: '#10b981' },
    distractors: [
      { label: 'Arancione 🟠', emoji: '🟠', sublabel: 'È un colore analogo vicino', color: '#f97316' },
      { label: 'Giallo 🟡', emoji: '🟡', sublabel: 'Il complementare del giallo è il viola', color: '#eab308' },
    ],
    explanation: 'Da vero artista! Rosso e Verde sono opposti sulla ruota cromatica e messi vicini creano il massimo contrasto!',
    iqParameterTag: 'Teoria Cromatica & Artistica (Gv · Gc)',
  },
  {
    prompt: 'Storia dell’Arte: Chi ha dipinto la famosa "Notte Stellata" con il cielo pieno di vortici blu e gialli? 🌌',
    speech: 'Storia dell’arte: quale grande pittore ha creato il capolavoro intitolato "La Notte Stellata"?',
    correct: { label: 'Vincent van Gogh 🎨', emoji: '🌌', sublabel: 'Pennellate a vortice!' },
    distractors: [
      { label: 'Leonardo da Vinci 🖼️', emoji: '🖼️', sublabel: 'Ha dipinto la Gioconda' },
      { label: 'Michelangelo 🗿', emoji: '🗿', sublabel: 'Ha affrescato la Cappella Sistina' },
    ],
    explanation: 'Bravissimo! Vincent van Gogh dipinse "La Notte Stellata" nel 1889 con pennellate piene di movimento!',
    iqParameterTag: 'Storia dell’Arte & Cultura Visiva (Gc)',
  },
  {
    prompt: 'Artistica · Luce e Volume: Come si chiama la tecnica che usa luce e ombra per far sembrare un disegno piatto quasi in 3D? 💡',
    speech: 'Quando disegniamo con la matita, come si chiama il passaggio graduale dalla luce all’ombra che dà volume?',
    correct: { label: 'Chiaroscuro 🌗', emoji: '🌗', sublabel: 'Dà profondità e volume!' },
    distractors: [
      { label: 'Contorno ✏️', emoji: '✏️', sublabel: 'È solo la linea esterna' },
      { label: 'Puntinismo 🔵', emoji: '🔵', sublabel: 'Disegna con puntini' },
    ],
    explanation: 'Esatto! Il chiaroscuro modella gli oggetti con luce e ombra dando il senso della tridimensionalità!',
    iqParameterTag: 'Percezione Spaziale & Tecnica Artistica (Gv)',
  },
  {
    prompt: 'Artistica · Inquadratura: Quando un pittore dipinge frutta, fiori e vasi appoggiati su un tavolo, come si chiama questo genere? 🍎🏺',
    speech: 'In pittura, come si chiama un quadro che ritrae frutta, vasi e oggetti immobili su un tavolo?',
    correct: { label: 'Natura Morta 🍎', emoji: '🏺', sublabel: 'Oggetti e frutta in posa!' },
    distractors: [
      { label: 'Ritratto 👤', emoji: '👤', sublabel: 'Raffigura una persona' },
      { label: 'Paesaggio ⛰️', emoji: '⛰️', sublabel: 'Raffigura monti o mare' },
    ],
    explanation: 'Perfetto! Si chiama Natura Morta ed è perfetta per studiare luci, riflessi e composizione!',
    iqParameterTag: 'Cultura Artistica & Composizione (Gc · Gv)',
  },
];

// =========================================================================
// PROGRESSIVE MUSIC & RHYTHM (8–9 ANNI)
// =========================================================================
export const UPPER_PRIMARY_MUSIC: AgeMusicEntry[] = [
  {
    title: 'Musica & Ritmo: Valore delle Note',
    prompt: 'Senso del Ritmo: Se una SEMIBREVE vale 4 battiti e una MINIMA vale la metà, quanti battiti dura una MINIMA? 🎵',
    speech: 'Matematica e musica insieme: se una semibreve vale quattro battiti e la minima dura esattamente la metà, quanti battiti vale?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.65, label: '1-2', emoji: '🎵', color: '#8b5cf6' },
      { freq: 659.25, duration: 0.65, label: '3-4', emoji: '🎵', color: '#ec4899' },
    ],
    correct: { label: '2 Battiti 🎵', emoji: '🎵', sublabel: '4 ÷ 2 = 2 battiti!', noteFreq: 659.25 },
    distractors: [
      { label: '1 Battito', emoji: '♩', sublabel: 'Quella è la semiminima', noteFreq: 523.25 },
      { label: '8 Battiti', emoji: '🎼', sublabel: 'Troppo lunga', noteFreq: 392.0 },
    ],
    explanation: 'Perfetto! La musica è piena di frazioni: la minima vale esattamente 2 battiti!',
  },
  {
    title: 'Orchestra: Famiglie di Strumenti',
    prompt: 'Ascolta queste note squillanti: Violino, Viola, Violoncello e Contrabbasso appartengono alla famiglia degli... 🎻',
    speech: 'Nell’orchestra sinfonica, a quale famiglia appartengono violino, viola e violoncello che si suonano con l’archetto?',
    rhythmNotes: [
      { freq: 440.0, duration: 0.3, label: 'LA', emoji: '🎻', color: '#f59e0b' },
      { freq: 554.37, duration: 0.3, label: 'DO#', emoji: '🎻', color: '#f59e0b' },
      { freq: 659.25, duration: 0.45, label: 'MI', emoji: '🎻', color: '#f59e0b' },
    ],
    correct: { label: 'Archi 🎻', emoji: '🎻', sublabel: 'Corde sfregate con l’archetto!', noteFreq: 659.25 },
    distractors: [
      { label: 'Fiati 🎺', emoji: '🎺', sublabel: 'Si suonano soffiando', noteFreq: 523.25 },
      { label: 'Percussioni 🥁', emoji: '🥁', sublabel: 'Si suonano battendo', noteFreq: 329.63 },
    ],
    explanation: 'Esatto! Violino, viola, violoncello e contrabbasso formano il cuore degli Archi dell’orchestra!',
  },
  {
    title: 'Senso del Ritmo: Tempo del Valzer',
    prompt: 'Ascolta il ritmo danzante: UNO-due-tre, UNO-due-tre! Quanti battiti ha ogni battuta di un Valzer? 💃',
    speech: 'Ascolta l’accento del valzer: uno, due, tre... uno, due, tre! Su quanti battiti si conta questo tempo musicale?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.32, label: 'UNO!', emoji: '🌟', color: '#ec4899' },
      { freq: 659.25, duration: 0.24, label: 'due', emoji: '🎶', color: '#38bdf8' },
      { freq: 783.99, duration: 0.24, label: 'tre', emoji: '🎶', color: '#38bdf8' },
      { freq: 523.25, duration: 0.32, label: 'UNO!', emoji: '🌟', color: '#ec4899' },
      { freq: 659.25, duration: 0.24, label: 'due', emoji: '🎶', color: '#38bdf8' },
      { freq: 783.99, duration: 0.24, label: 'tre', emoji: '🎶', color: '#38bdf8' },
    ],
    correct: { label: '3 Battiti (3/4) 💃', emoji: '💃', sublabel: 'Ritmo ternario del Valzer!', noteFreq: 783.99 },
    distractors: [
      { label: '4 Battiti (4/4)', emoji: '🥁', sublabel: 'È il tempo della marcia/pop', noteFreq: 523.25 },
      { label: '2 Battiti (2/4)', emoji: '🎵', sublabel: 'È una marcia rapida', noteFreq: 440.0 },
    ],
    explanation: 'Magnifico orecchio musicale! Il valzer si riconosce sempre dal suo elegante tempo ternario in 3/4!',
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
  {
    prompt: 'Pensiero Laterale: Se in una gara di corsa superi chi si trova al SECONDO posto, in che posizione ti trovi ora? 🏃',
    speech: 'Indovinello di ragionamento puro: stai correndo una gara e superi chi è al secondo posto. Adesso in che posizione sei?',
    correct: { label: 'Secondo posto 🥈', emoji: '🥈', sublabel: 'Prendi il suo posto!' },
    distractors: [
      { label: 'Primo posto 🥇', emoji: '🥇', sublabel: 'Attenzione: il primo è ancora davanti!' },
      { label: 'Terzo posto 🥉', emoji: '🥉', sublabel: 'Eri terzo prima del sorpasso' },
    ],
    explanation: 'Geniale! Superando il secondo prendi esattamente il secondo posto: il primo è ancora in testa!',
    iqParameterTag: 'Ragionamento Critico & Controllo Impulsività (Gf)',
  },
];

export const PRIMARY_ADV_ENGLISH: AgeEnglishEntry[] = [
  {
    wordInfo: { en: 'KNOWLEDGE', it: 'Conoscenza', phoneticHint: 'Nòledg', emoji: '🧠', categoryLabel: 'English A1+' },
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
    wordInfo: { en: 'ADVENTURE', it: 'Avventura', phoneticHint: 'Advèncer', emoji: '🧭', categoryLabel: 'English A1+' },
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

// =========================================================================
// BAND E: 10–12 ANNI (5ª PRIMARIA & SCUOLA MEDIA)
// Materie progressive: Storia & Civica, Fisica & Astronomia, Analisi Logica,
// Arte & Prospettiva Rinascimentale, Geometria & Pitagora, Coding/Logica,
// Musica Classica & Ritmi Composti, Inglese A2
// =========================================================================
export const PRETEEN_SCIENCE_HISTORY: AgeQuizEntry[] = [
  {
    prompt: 'Fisica · Moto: Un treno viaggia a 90 km all’ora. Quanti chilometri percorre in 2 ore e mezza? 🚄',
    speech: 'Problema di fisica: un treno viaggia costante a novanta chilometri all’ora. Quanti chilometri percorre in due ore e mezza?',
    patternItems: ['90 km/h', '×', '2,5 h', '=', '❓'],
    correct: { label: '225 km 🚄', emoji: '🚄', sublabel: '90 + 90 + 45 = 225 km!' },
    distractors: [
      { label: '180 km', emoji: '🔢', sublabel: 'Sono solo 2 ore' },
      { label: '270 km', emoji: '🔢', sublabel: 'Sono 3 ore intere' },
    ],
    explanation: 'Bravissimo! Spazio = Velocità × Tempo: 90 × 2 = 180 km più mezz’ora (45 km) = 225 km!',
    iqParameterTag: 'Fisica & Ragionamento Proporzionale (Gf · Gwm)',
  },
  {
    prompt: 'Storia Antica: Quale grande civiltà ha inventato la DEMOCRAZIA (governo del popolo) nella città di Atene? 🏛️',
    speech: 'Domanda di storia antica: in quale civiltà è nata la democrazia ad Atene?',
    correct: { label: 'Antichi Greci 🏛️', emoji: '🏛️', sublabel: 'Demos = Popolo, Kratos = Potere!' },
    distractors: [
      { label: 'Antichi Egizi 🔺', emoji: '🔺', sublabel: 'Erano governati dai Faraoni' },
      { label: 'Vichinghi ⛵', emoji: '⛵', sublabel: 'Navigatori del Nord Europa' },
    ],
    explanation: 'Eccellente! Nell’antica Atene greca nacque l’idea di democrazia, parola che significa governo del popolo!',
    iqParameterTag: 'Storia & Cultura Generale (Gc)',
  },
  {
    prompt: 'Biologia: Quale molecola a forma di doppia elica contiene tutte le istruzioni genetiche di ogni essere vivente? 🧬',
    speech: 'Biologia cellulare: come si chiama la molecola a doppia elica che custodisce il codice genetico nel nucleo della cellula?',
    correct: { label: 'DNA 🧬', emoji: '🧬', sublabel: 'Acido desossiribonucleico!' },
    distractors: [
      { label: 'Clorofilla 🌿', emoji: '🌿', sublabel: 'Pigmento verde delle piante' },
      { label: 'Emoglobina 🩸', emoji: '🩸', sublabel: 'Trasporta ossigeno nel sangue' },
    ],
    explanation: 'Perfetto! Il DNA è il libretto di istruzioni della vita presente in quasi tutte le nostre cellule!',
    iqParameterTag: 'Scienze Biologiche (Gc)',
  },
  {
    prompt: 'Storia & Civica: In quale anno è entrata in vigore la Costituzione della Repubblica Italiana? 🇮🇹',
    speech: 'Educazione civica e storia contemporanea: il primo gennaio di quale anno è entrata in vigore la Costituzione Italiana?',
    correct: { label: '1948 🇮🇹', emoji: '📜', sublabel: '1° gennaio 1948!' },
    distractors: [
      { label: '1861', emoji: '🏛️', sublabel: 'Anno dell’Unità d’Italia' },
      { label: '1918', emoji: '📅', sublabel: 'Fine della Prima Guerra Mondiale' },
    ],
    explanation: 'Ottima memoria storica! La Costituzione Italiana entrò in vigore il 1° gennaio 1948!',
    iqParameterTag: 'Storia & Educazione Civica (Gc)',
  },
  {
    prompt: 'Astronomia: Qual è il pianeta più grande del Sistema Solare, famoso per la sua Grande Macchia Rossa? 🪐',
    speech: 'Astronomia: tra tutti i pianeti del Sistema Solare, qual è il gigante gassoso più grande di tutti?',
    correct: { label: 'Giove 🟠', emoji: '🪐', sublabel: 'Più grande di tutti gli altri messi insieme!' },
    distractors: [
      { label: 'Saturno 🪐', emoji: '🪐', sublabel: 'È il secondo per grandezza, celebre per gli anelli' },
      { label: 'Marte 🔴', emoji: '🔴', sublabel: 'È il pianeta rosso, più piccolo della Terra' },
    ],
    explanation: 'Esatto! Giove è il gigante del Sistema Solare e la sua Grande Macchia Rossa è una tempesta enorme!',
    iqParameterTag: 'Astronomia & Scienze (Gc)',
  },
  {
    prompt: 'Fisica · Energia: Quale di queste fonti di energia è RINNOVABILE e non si esaurisce mai? ☀️💨',
    speech: 'Scienze dell’ambiente: quale tra queste è una fonte di energia rinnovabile e pulita?',
    correct: { label: 'Energia Eolica (Vento) 💨', emoji: '🌬️', sublabel: 'Pulita e rinnovabile!' },
    distractors: [
      { label: 'Carbone 🪨', emoji: '🪨', sublabel: 'È un combustibile fossile' },
      { label: 'Petrolio 🛢️', emoji: '🛢️', sublabel: 'È una risorsa esauribile' },
    ],
    explanation: 'Bravissimo! Il vento, il sole e l’acqua sono energie rinnovabili fondamentali per il futuro del pianeta!',
    iqParameterTag: 'Fisica Ambientale & Sostenibilità (Gc · Gf)',
  },
];

export const PRETEEN_LANGUAGE_LOGIC: AgeQuizEntry[] = [
  {
    prompt: 'Analisi Logica: Nella frase "Luca legge un libro avvincente", che funzione svolge "un libro avvincente"? 📖',
    speech: 'Analisi logica: nella frase "Luca legge un libro avvincente", che cosa risponde alla domanda "che cosa legge"?',
    correct: { label: 'Complemento Oggetto 🎯', emoji: '📖', sublabel: 'Risponde a: Chi? Che cosa?' },
    distractors: [
      { label: 'Soggetto 👤', emoji: '👤', sublabel: 'Il soggetto è Luca' },
      { label: 'Complemento di Luogo 📍', emoji: '📍', sublabel: 'Risponde a: Dove?' },
    ],
    explanation: 'Perfetto! "Un libro avvincente" riceve direttamente l’azione del verbo leggere: è il Complemento Oggetto!',
    iqParameterTag: 'Analisi Logica & Sintassi (Gc · Gf)',
  },
  {
    prompt: 'Figure Retoriche: "Sei veloce COME un ghepardo!" 🐆 Che figura retorica usa la parola "come" per fare un paragone?',
    speech: 'Letteratura italiana: "Sei veloce come un ghepardo". Come si chiama il paragone esplicito introdotto da "come"?',
    correct: { label: 'Similitudine 🐆', emoji: '✨', sublabel: 'Paragone esplicito con "come"!' },
    distractors: [
      { label: 'Onomatopea 💥', emoji: '💥', sublabel: 'Imita un suono (es. Splash, Boom)' },
      { label: 'Rima Baciata 🎵', emoji: '🎵', sublabel: 'Riguarda la fine dei versi' },
    ],
    explanation: 'Da vero scrittore! La similitudine mette a confronto due immagini usando "come", "simile a" o "pare"!',
    iqParameterTag: 'Letteratura & Figure Retoriche (Gc)',
  },
  {
    prompt: 'Ortografia Avanzata: Quale forma è GRAMMATICALMENTE CORRETTA in italiano? ✍️',
    speech: 'Sfida di ortografia da scuola media: quale di queste tre forme è scritta senza alcun errore?',
    correct: { label: 'Qual è il tuo libro? ✅', emoji: '✅', sublabel: '"Qual è" NON vuole mai l’apostrofo!' },
    distractors: [
      { label: 'Qual’è il tuo libro?', emoji: '❌', sublabel: 'Errore comune: niente apostrofo!' },
      { label: 'Quale è’ il tuo libro?', emoji: '❌', sublabel: 'Forma errata' },
    ],
    explanation: 'Impeccabile! "Qual è" è un troncamento, non un’elisione: non vuole mai l’apostrofo!',
    iqParameterTag: 'Ortografia & Padronanza Linguistica (Gc)',
  },
  {
    prompt: 'Etimologia: La parola "TELESCOPIO" 🔭 unisce "Tele" (lontano) e "Skopeo". Cosa significa "Skopeo" in greco antico?',
    speech: 'Ragiona sull’etimologia: in Telescopio e Microscopio, cosa significa la radice greca "Skopeo"?',
    correct: { label: 'Osservare / Guardare 👁️', emoji: '🔭', sublabel: 'Guardare da lontano!' },
    distractors: [
      { label: 'Ascoltare 👂', emoji: '👂', sublabel: 'Quello è "Fono" (es. Telefono)' },
      { label: 'Scrivere ✍️', emoji: '✍️', sublabel: 'Quello è "Grafia" (es. Fotografia)' },
    ],
    explanation: 'Geniale! Telescopio significa letteralmente "osservare lontano" e Microscopio "osservare il piccolo"!',
    iqParameterTag: 'Etimologia & Ragionamento Lessicale (Gc · Gf)',
  },
];

export const PRETEEN_ART_GEOMETRY: AgeQuizEntry[] = [
  {
    prompt: 'Arte & Prospettiva: Nel Rinascimento, quale genio italiano ha dipinto la Gioconda e progettato macchine volanti? 🖼️',
    speech: 'Storia dell’arte e ingegno: quale artista e scienziato del Rinascimento ha dipinto la Gioconda e studiato il volo?',
    correct: { label: 'Leonardo da Vinci 🎨', emoji: '🖼️', sublabel: 'Artista, scienziato e inventore!' },
    distractors: [
      { label: 'Pablo Picasso 🎭', emoji: '🎭', sublabel: 'Maestro del Cubismo (1900)' },
      { label: 'Claude Monet 🌸', emoji: '🌸', sublabel: 'Maestro dell’Impressionismo francese' },
    ],
    explanation: 'Splendido! Leonardo da Vinci unì arte, anatomia, prospettiva e scienza in modo unico nella storia!',
    iqParameterTag: 'Storia dell’Arte & Rinascimento (Gc)',
  },
  {
    prompt: 'Artistica · Prospettiva: In un disegno di un viale alberato che sembra andare lontano, dove si incontrano tutte le linee parallele? 🛤️',
    speech: 'Disegno tecnico e artistico: nella prospettiva centrale, come si chiama il punto sull’orizzonte dove convergono le linee?',
    correct: { label: 'Punto di Fuga 🎯', emoji: '🛤️', sublabel: 'Crea il senso di profondità 3D!' },
    distractors: [
      { label: 'Punto Cardinale 🧭', emoji: '🧭', sublabel: 'Indica Nord, Sud, Est, Ovest' },
      { label: 'Centro di Gravità ⚖️', emoji: '⚖️', sublabel: 'È un concetto di fisica' },
    ],
    explanation: 'Bravissimo! Il punto di fuga sulla linea dell’orizzonte crea l’illusione perfetta della profondità!',
    iqParameterTag: 'Prospettiva Artistica & Spazio 3D (Gv)',
  },
  {
    prompt: 'Geometria · Area del Triangolo: Un triangolo ha base = 10 cm e altezza = 6 cm. Qual è la sua AREA? 📐',
    speech: 'Calcola l’area di un triangolo con base dieci centimetri e altezza sei centimetri: ricorda di dividere per due!',
    patternItems: ['Base = 10', 'Altezza = 6', 'Area = (b×h)÷2 = ❓'],
    correct: { label: '30 cm² 📐', emoji: '📐', sublabel: '(10 × 6) ÷ 2 = 30 cm²!' },
    distractors: [
      { label: '60 cm²', emoji: '🔢', sublabel: 'Quella è l’area del rettangolo' },
      { label: '16 cm²', emoji: '🔢', sublabel: 'Quella è solo 10 + 6' },
    ],
    explanation: 'Perfetto! Un triangolo è metà di un rettangolo: (10 × 6) ÷ 2 = 30 cm²!',
    iqParameterTag: 'Geometria Piana & Formula Area (Gv · Gf)',
  },
  {
    prompt: 'Geometria · Angoli: Quanto vale SEMPRE la somma dei tre angoli interni di qualsiasi triangolo? 🔺',
    speech: 'Regola d’oro della geometria: se sommi i tre angoli interni di qualunque triangolo, quanti gradi ottieni sempre?',
    correct: { label: '180 Gradi (180°) 🔺', emoji: '🔺', sublabel: 'Un angolo piatto esatto!' },
    distractors: [
      { label: '360 Gradi (360°)', emoji: '🟦', sublabel: 'Quella è la somma di un quadrilatero' },
      { label: '90 Gradi (90°)', emoji: '📐', sublabel: 'È un solo angolo retto' },
    ],
    explanation: 'Eccellente! In ogni triangolo del piano euclideo i tre angoli sommati danno sempre 180°!',
    iqParameterTag: 'Geometria Euclidea (Gv · Gc)',
  },
  {
    prompt: 'Teorema di Pitagora: In un triangolo rettangolo i due cateti misurano 3 cm e 4 cm. Quanto misura l’ipotenusa? 📐',
    speech: 'Sfida pitagorica: un triangolo rettangolo ha i due cateti di tre e quattro centimetri. Quanto è lunga l’ipotenusa?',
    patternItems: ['3² + 4²', '=', '9 + 16 = 25', '➔ √25 = ❓'],
    correct: { label: '5 cm 🏆', emoji: '📐', sublabel: 'Terna pitagorica 3 - 4 - 5!' },
    distractors: [
      { label: '7 cm', emoji: '🔢', sublabel: 'Non si sommano semplicemente 3 + 4' },
      { label: '6 cm', emoji: '🔢', sublabel: '6² fa 36, non 25' },
    ],
    explanation: 'Straordinario! 3² + 4² = 9 + 16 = 25, e la radice quadrata di 25 è esattamente 5 cm!',
    iqParameterTag: 'Teorema di Pitagora & Radici (Gf · Gv)',
  },
];

export const PRETEEN_LOGIC_CODING: AgeQuizEntry[] = [
  {
    prompt: 'Serie di Fibonacci: 1 ➔ 1 ➔ 2 ➔ 3 ➔ 5 ➔ 8 ➔ 13 ➔ Somma gli ultimi due: qual è il prossimo numero?',
    speech: 'Sfida matematica di Fibonacci: ogni numero è la somma dei due precedenti: otto più tredici quanto fa?',
    patternItems: ['3', '5', '8', '13', '➔', '❓'],
    correct: { label: '21 ✨', emoji: '✨', sublabel: '8 + 13 = 21!' },
    distractors: [
      { label: '19', emoji: '🔢', sublabel: 'Ricontrolla 8 + 13' },
      { label: '26', emoji: '🔢', sublabel: 'Quello è 13 × 2' },
    ],
    explanation: 'Fantastico! 8 + 13 = 21: la spirale di Fibonacci appare persino nei girasoli e nelle conchiglie!',
    iqParameterTag: 'Sequenze Ricorsive & Ragionamento Fluido (Gf)',
  },
  {
    prompt: 'Pensiero Computazionale (Coding): Se X = 4, esegui: [Raddoppia X] ➔ [Aggiungi 3] ➔ [Moltiplica per 2]. Risultato? 💻',
    speech: 'Segui l’algoritmo passo dopo passo: parti da quattro, raddoppialo, aggiungi tre e infine moltiplica tutto per due!',
    patternItems: ['X=4', '➔ ×2', '➔ +3', '➔ ×2', '= ❓'],
    correct: { label: '22 💻', emoji: '💻', sublabel: '4×2=8 ➔ 8+3=11 ➔ 11×2=22!' },
    distractors: [
      { label: '14', emoji: '🔢', sublabel: 'Manca l’ultimo ×2 sul +3' },
      { label: '19', emoji: '🔢', sublabel: 'Ricontrolla i 3 passi' },
    ],
    explanation: 'Da vero programmatore! Eseguendo i passi in ordine: 4 → 8 → 11 → 22!',
    iqParameterTag: 'Algoritmi & Memoria di Lavoro (Gf · Gwm)',
  },
  {
    prompt: 'Probabilità: Lanci un dado regolare a 6 facce (1, 2, 3, 4, 5, 6). Che probabilità hai di ottenere un numero PARI? 🎲',
    speech: 'Ragionamento probabilistico: lanciando un dado da uno a sei, che probabilità c’è di ottenere un numero pari?',
    patternItems: ['Pari: 2, 4, 6', 'su', '6 facce', '=', '❓'],
    correct: { label: '50% (3 su 6 = ½) 🎲', emoji: '🎲', sublabel: 'Metà delle facce sono pari!' },
    distractors: [
      { label: '25% (¼)', emoji: '📊', sublabel: 'Troppo bassa' },
      { label: '100%', emoji: '📊', sublabel: 'Ci sono anche i dispari 1, 3, 5' },
    ],
    explanation: 'Esatto! I numeri pari sono 3 su 6, cioè esattamente 1/2, ovvero il 50% di probabilità!',
    iqParameterTag: 'Probabilità & Frazioni (Gf · Gwm)',
  },
  {
    prompt: 'Numeri Primi: Un numero primo è divisibile solo per 1 e per se stesso. Quale di questi numeri è PRIMO? 🔑',
    speech: 'Sfida di aritmetica logica: quale tra questi tre numeri è un numero primo?',
    correct: { label: '17 🔑', emoji: '🔑', sublabel: 'Divisibile solo per 1 e 17!' },
    distractors: [
      { label: '15', emoji: '🔢', sublabel: '15 = 3 × 5 (non è primo)' },
      { label: '21', emoji: '🔢', sublabel: '21 = 3 × 7 (non è primo)' },
    ],
    explanation: 'Bravissimo! 17 è un numero primo, mentre 15 (3×5) e 21 (3×7) sono composti!',
    iqParameterTag: 'Teoria dei Numeri & Deduzione (Gf)',
  },
  {
    prompt: 'Sillogismo Logico: "Tutti i quadrati sono rettangoli. La figura A è un quadrato." Cosa puoi dedurre con certezza? 🧠',
    speech: 'Logica deduttiva: se tutti i quadrati sono rettangoli e la figura A è un quadrato, cosa è sicuramente vero?',
    correct: { label: 'La figura A è anche un rettangolo ✅', emoji: '🧠', sublabel: 'Deduzione certa!' },
    distractors: [
      { label: 'Tutti i rettangoli sono quadrati ❌', emoji: '❌', sublabel: 'Falso: esistono rettangoli allungati' },
      { label: 'La figura A è un triangolo ❌', emoji: '❌', sublabel: 'Ha 4 lati, non 3' },
    ],
    explanation: 'Logica impeccabile! Ogni quadrato possiede 4 angoli retti, quindi rientra sempre nella famiglia dei rettangoli!',
    iqParameterTag: 'Sillogismo & Logica Formale (Gf)',
  },
];

export const PRETEEN_MUSIC_CULTURE: AgeMusicEntry[] = [
  {
    title: 'Musica Classica: Intervallo di Ottava',
    prompt: 'Ascolta queste due note: DO basso ➔ DO alto! Come si chiama la distanza di 8 note tra lo stesso suono grave e acuto? 🎹',
    speech: 'Ascolta l’armonia perfetta tra il Do grave e il Do acuto: come si chiama in musica questo intervallo di otto note?',
    rhythmNotes: [
      { freq: 261.63, duration: 0.48, label: 'DO grave', emoji: '🎹', color: '#4f46e5' },
      { freq: 523.25, duration: 0.55, label: 'DO acuto', emoji: '✨', color: '#06b6d4' },
    ],
    correct: { label: 'Ottava 🎹', emoji: '🎹', sublabel: 'La frequenza raddoppia (×2)!', noteFreq: 523.25 },
    distractors: [
      { label: 'Terza', emoji: '🎵', sublabel: 'È Do ➔ Mi', noteFreq: 329.63 },
      { label: 'Quinta', emoji: '🎶', sublabel: 'È Do ➔ Sol', noteFreq: 392.0 },
    ],
    explanation: 'Fantastico! In un’ottava la frequenza sonora raddoppia esattamente: fisica e musica lavorano insieme!',
  },
  {
    title: 'Grandi Compositori: La Nona Sinfonia',
    prompt: 'Ascolta l’inizio dell’"Inno alla Gioia" (Inno Europeo)! Quale leggendario compositore lo ha scritto pur essendo diventato sordo? 🎼',
    speech: 'Ascolta questa celebre melodia, l’Inno alla Gioia: quale genio della musica classica l’ha composta?',
    rhythmNotes: [
      { freq: 659.25, duration: 0.3, label: 'MI', emoji: '🎼', color: '#f59e0b' },
      { freq: 659.25, duration: 0.3, label: 'MI', emoji: '🎼', color: '#f59e0b' },
      { freq: 698.46, duration: 0.3, label: 'FA', emoji: '🎼', color: '#ec4899' },
      { freq: 783.99, duration: 0.3, label: 'SOL', emoji: '🎼', color: '#8b5cf6' },
      { freq: 783.99, duration: 0.3, label: 'SOL', emoji: '🎼', color: '#8b5cf6' },
      { freq: 698.46, duration: 0.3, label: 'FA', emoji: '🎼', color: '#ec4899' },
      { freq: 659.25, duration: 0.3, label: 'MI', emoji: '🎼', color: '#f59e0b' },
      { freq: 587.33, duration: 0.4, label: 'RE', emoji: '🎼', color: '#38bdf8' },
    ],
    correct: { label: 'Ludwig van Beethoven 🎼', emoji: '🎹', sublabel: 'Nona Sinfonia (1824)!', noteFreq: 659.25 },
    distractors: [
      { label: 'Antonio Vivaldi 🎻', emoji: '🎻', sublabel: 'Compose "Le Quattro Stagioni"', noteFreq: 523.25 },
      { label: 'Giuseppe Verdi 🎭', emoji: '🎭', sublabel: 'Maestro dell’opera italiana', noteFreq: 440.0 },
    ],
    explanation: 'Magnifico! Beethoven compose l’Inno alla Gioia sentendo la musica interamente dentro la sua mente!',
  },
  {
    title: 'Armonia: Accordo Maggiore vs Minore',
    prompt: 'Ascolta questo arpeggio luminoso e solare (DO - MI - SOL)! Che tipo di accordo musicale trasmette gioia e luce? ☀️',
    speech: 'Ascolta l’arpeggio Do, Mi, Sol: questo suono aperto e luminoso è un accordo Maggiore o Minore?',
    rhythmNotes: [
      { freq: 523.25, duration: 0.28, label: 'DO', emoji: '☀️', color: '#f59e0b' },
      { freq: 659.25, duration: 0.28, label: 'MI', emoji: '☀️', color: '#f59e0b' },
      { freq: 783.99, duration: 0.45, label: 'SOL', emoji: '✨', color: '#10b981' },
    ],
    correct: { label: 'Accordo Maggiore ☀️', emoji: '☀️', sublabel: 'Suono aperto e luminoso!', noteFreq: 783.99 },
    distractors: [
      { label: 'Accordo Minore 🌧️', emoji: '🌧️', sublabel: 'Ha un suono più malinconico', noteFreq: 622.25 },
      { label: 'Dissonanza ⚡', emoji: '⚡', sublabel: 'Suoni in tensione tra loro', noteFreq: 554.37 },
    ],
    explanation: 'Orecchio da musicista! La triade Do-Mi-Sol è l’accordo di Do Maggiore, luminoso e stabile!',
  },
];

export const PRETEEN_ENGLISH_A2: AgeEnglishEntry[] = [
  {
    wordInfo: { en: 'WENT', it: 'Andò / Sono andato', phoneticHint: 'Uènt', emoji: '🚀', categoryLabel: 'English A2 · Past Simple' },
    prompt: 'English A2 · Past Simple: Qual è il passato (Past Simple) corretto del verbo irregolare "TO GO" (andare)? 🇬🇧',
    speech: 'Grammatica inglese: "Yesterday I ... to school". Qual è il passato irregolare del verbo To Go?',
    correct: { label: 'WENT ✅', emoji: '🚀', sublabel: '🇬🇧 Go ➔ Went!' },
    distractors: [
      { label: 'GOED', emoji: '❌', sublabel: 'Non è regolare' },
      { label: 'GOING', emoji: '⏳', sublabel: 'È la forma -ing' },
    ],
    explanation: 'Spot on! "To go" è irregolare: Yesterday I WENT to school!',
  },
  {
    wordInfo: { en: 'LIBRARY', it: 'Biblioteca', phoneticHint: 'Làibrari', emoji: '🏛️', categoryLabel: 'English A2 · False Friends' },
    prompt: 'False Friends: Attenzione all’inganno! Cosa significa davvero la parola inglese "LIBRARY"? 🏛️',
    speech: 'Attenzione ai falsi amici in inglese: "Library" assomiglia a libreria, ma cosa significa davvero?',
    correct: { label: 'Biblioteca (dove si prendono in prestito) 🏛️', emoji: '🏛️', sublabel: '🇬🇧 Bookshop = Libreria!' },
    distractors: [
      { label: 'Negozio che vende libri', emoji: '🛍️', sublabel: 'Quello è "Bookshop"' },
      { label: 'Laboratorio scientifico', emoji: '🔬', sublabel: 'Quello è "Laboratory"' },
    ],
    explanation: 'Smart! "Library" è la biblioteca; il negozio dove si comprano i libri si chiama "Bookshop"!',
  },
  {
    wordInfo: { en: 'ENVIRONMENT', it: 'Ambiente', phoneticHint: 'Invàironment', emoji: '🌍', categoryLabel: 'English A2 · Scienza' },
    prompt: 'English A2: "We must protect the ENVIRONMENT!" 🌍 Cosa significa "ENVIRONMENT"?',
    speech: 'Comprensione inglese: "We must protect the environment!". Cosa significa la parola Environment?',
    correct: { label: 'Ambiente / Natura 🌍', emoji: '🌍', sublabel: '🇬🇧 Protect the environment!' },
    distractors: [
      { label: 'Esperimento', emoji: '🧪', sublabel: 'Quello è "Experiment"' },
      { label: 'Intrattenimento', emoji: '🎬', sublabel: 'Quello è "Entertainment"' },
    ],
    explanation: 'Great job! Environment significa proprio Ambiente!',
  },
  {
    wordInfo: { en: 'BETTER', it: 'Migliore', phoneticHint: 'Bèter', emoji: '🏆', categoryLabel: 'English A2 · Comparatives' },
    prompt: 'Comparativi Irregolari: Qual è il comparativo di maggioranza di "GOOD" (buono)? 🏆',
    speech: 'In inglese Good è irregolare: come si dice "più buono" oppure "migliore"?',
    correct: { label: 'BETTER 🏆', emoji: '🏆', sublabel: '🇬🇧 Good ➔ Better ➔ Best!' },
    distractors: [
      { label: 'GOODER', emoji: '❌', sublabel: 'Forma non corretta' },
      { label: 'MORE GOOD', emoji: '❌', sublabel: 'Forma non corretta' },
    ],
    explanation: 'Brilliant! Good → Better (migliore) → The Best (il migliore)!',
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

// =========================================================================
// EXTRA ENRICHMENT SUBJECTS (UNLOCKED BY AGE & PROPORTIONALLY BY HIGH MASTERY!)
// Covers Emotional Intelligence, Visual Memory, Ecology & Nutrition,
// Time & Financial Literacy, Astronomy, World Geography, Inventions/Tech & Critical Thinking
// =========================================================================

// 1. EDUCAZIONE EMOTIVA & EMPATIA (Già da 3–6 anni e trasversale)
export const EMOTIONAL_EMPATHY_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Empatia & Emozioni: Un tuo amico cade al parco e si mette a piangere. Qual è il gesto più gentile? 💛',
    speech: 'Pensa con il cuore: se un tuo amico cade al parco ed è triste, qual è il gesto più gentile da fare?',
    correct: { label: 'Aiutarlo e consolarlo 🤝', emoji: '🤝', sublabel: 'Empatia e amicizia' },
    distractors: [
      { label: 'Ridere forte', emoji: '🙈', sublabel: 'Lo farebbe stare peggio' },
      { label: 'Scappare via', emoji: '🏃', sublabel: 'Resterebbe solo' },
    ],
    explanation: 'Che bel cuore! Aiutare e ascoltare chi è in difficoltà è la vera forza dell’empatia!',
    iqParameterTag: 'Intelligenza Emotiva & Empatia (Gc · Gf)',
  },
  {
    prompt: 'Riconosci l’Emozione: Quando senti il cuore battere forte prima di una sorpresa bella, cosa provi? ✨',
    speech: 'Ascolta le tue emozioni: quando aspetti una bella sorpresa e sorridi con entusiasmo, quale emozione provi?',
    correct: { label: 'Gioia & Entusiasmo 😊', emoji: '😊', sublabel: 'Emozione positiva' },
    distractors: [
      { label: 'Noia', emoji: '🥱', sublabel: 'Quando non c’è nulla da fare' },
      { label: 'Rabbia', emoji: '😠', sublabel: 'Quando qualcosa ci infastidisce' },
    ],
    explanation: 'Esatto! Riconoscere e dare un nome alle emozioni ci aiuta a crescere sereni!',
    iqParameterTag: 'Consapevolezza Emotiva (Gc)',
  },
  {
    prompt: 'Calma & Autocontrollo: Quando sei molto arrabbiato o frustrato per un gioco difficile, cosa aiuta subito a calmarsi? 🌬️',
    speech: 'Strategia di autocontrollo: quando un esercizio ti sembra difficile e senti rabbia, qual è il trucco migliore per ritrovare la calma?',
    correct: { label: 'Fare 3 respiri lenti e profondi 🌬️', emoji: '🌬️', sublabel: 'Rilassa mente e cuore' },
    distractors: [
      { label: 'Lanciare gli oggetti', emoji: '💥', sublabel: 'Non risolve il problema' },
      { label: 'Arrendersi per sempre', emoji: '🚪', sublabel: 'Così non si impara' },
    ],
    explanation: 'Fantastico! Respirare lentamente calma il cervello e ti permette di trovare subito la soluzione!',
    iqParameterTag: 'Autoregolazione Emotiva & Problem Solving (Gf · Gc)',
  },
];

// 2. MEMORIA VISIVA & ATTENZIONE SELETTIVA (4–9 anni)
export const MEMORY_ATTENTION_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Memoria Lampo: Guarda i simboli in ordine [🌟 🍎 🐶 🌟]. Quale simbolo appare DUE volte?',
    speech: 'Sfida di memoria visiva: osserva bene la sequenza Stella, Mela, Cagnolino, Stella. Quale simbolo compare due volte?',
    patternItems: ['🌟', '🍎', '🐶', '🌟'],
    correct: { label: 'La Stella 🌟', emoji: '🌟', sublabel: 'Compare al 1° e 4° posto' },
    distractors: [
      { label: 'La Mela 🍎', emoji: '🍎', sublabel: 'Compare una sola volta' },
      { label: 'Il Cagnolino 🐶', emoji: '🐶', sublabel: 'Compare una sola volta' },
    ],
    explanation: 'Occhio di falco! La Stella era sia all’inizio sia alla fine della sequenza!',
    iqParameterTag: 'Memoria di Lavoro & Attenzione Visiva (Gwm · Gs)',
  },
  {
    prompt: 'Osservazione Rapida: Nella serie [3, 8, 5, 2, 9] qual è il numero ESATTAMENTE al centro? 🎯',
    speech: 'Concentrati sulla serie tre, otto, cinque, due, nove. Quale numero si trova esattamente nel mezzo?',
    patternItems: ['3', '8', '5', '2', '9'],
    correct: { label: '5 (al centro) 🎯', emoji: '5️⃣', sublabel: '2 numeri a sinistra, 2 a destra' },
    distractors: [
      { label: '8', emoji: '8️⃣', sublabel: 'È al secondo posto' },
      { label: '2', emoji: '2️⃣', sublabel: 'È al quarto posto' },
    ],
    explanation: 'Precisione perfetta! Il 5 è proprio nel mezzo, con due numeri prima e due dopo!',
    iqParameterTag: 'Attenzione Selettiva & Posizione Spaziale (Gs · Gwm)',
  },
  {
    prompt: 'Sequenza al Contrario: Se invertiamo completamente l’ordine di [🔴 🟡 🟢], quale colore diventa il PRIMO? 🔄',
    speech: 'Gira mentalmente la fila: Rosso, Giallo, Verde. Se la leggi al contrario, quale colore viene per primo?',
    patternItems: ['🔴', '🟡', '🟢', '➔', '🔄'],
    correct: { label: 'Verde 🟢', emoji: '🟢', sublabel: 'Ordine inverso: 🟢 🟡 🔴' },
    distractors: [
      { label: 'Rosso 🔴', emoji: '🔴', sublabel: 'Diventa l’ultimo' },
      { label: 'Giallo 🟡', emoji: '🟡', sublabel: 'Resta sempre al centro' },
    ],
    explanation: 'Grande memoria di lavoro! Invertendo Rosso-Giallo-Verde otteniamo Verde-Giallo-Rosso!',
    iqParameterTag: 'Inversione Mentale & Memoria di Lavoro (Gwm · Gf)',
  },
];

// 3. ECOLOGIA, AMBIENTE & EDUCAZIONE ALIMENTARE (5–10 anni)
export const NATURE_ECOLOGY_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Ecologia & Riciclo: Dove si butta una bottiglietta di plastica vuota per proteggere il pianeta? ♻️',
    speech: 'Proteggiamo il nostro pianeta: nella raccolta differenziata, dove si mette una bottiglietta di plastica vuota?',
    correct: { label: 'Nella Plastica ♻️', emoji: '♻️', sublabel: 'Si trasforma in nuovi oggetti!' },
    distractors: [
      { label: 'Nell’Umido / Organico', emoji: '🍌', sublabel: 'Solo scarti di cibo' },
      { label: 'Nella Carta', emoji: '📰', sublabel: 'Solo giornali e cartone' },
    ],
    explanation: 'Da vero custode della Terra! Riciclare la plastica salva gli oceani e risparmia energia!',
    iqParameterTag: 'Ecologia & Sostenibilità Ambientale (Gc)',
  },
  {
    prompt: 'Educazione Alimentare: Quali alimenti dovremmo mangiare tutti i giorni per avere vitamine ed energia sana? 🥦',
    speech: 'Salute a tavola: quali cibi colorati ci regalano vitamine preziose ogni giorno per crescere forti?',
    correct: { label: 'Frutta e Verdura 🍎🥦', emoji: '🥗', sublabel: 'Ricche di vitamine e fibre' },
    distractors: [
      { label: 'Solo caramelle gommose', emoji: '🍬', sublabel: 'Troppi zuccheri' },
      { label: 'Solo patatine fritte', emoji: '🍟', sublabel: 'Solo ogni tanto' },
    ],
    explanation: 'Perfetto! Frutta e verdura colorate danno energia pulita al cervello e ai muscoli!',
    iqParameterTag: 'Educazione Alimentare & Scienze (Gc)',
  },
  {
    prompt: 'Ciclo dell’Acqua: Cosa succede all’acqua del mare quando il Sole la scalda tanto? ☀️🌊',
    speech: 'Osserva il ciclo dell’acqua: quando il Sole scalda il mare, cosa fa l’acqua per salire verso le nuvole?',
    correct: { label: 'Evapora e sale in cielo ☁️', emoji: '☁️', sublabel: 'Diventa vapore acqueo' },
    distractors: [
      { label: 'Diventa sabbia', emoji: '🏖️', sublabel: 'La sabbia resta a riva' },
      { label: 'Scompare per sempre', emoji: '❌', sublabel: 'L’acqua non si distrugge' },
    ],
    explanation: 'Bravissimo! Il Sole fa evaporare l’acqua, che forma le nuvole e poi ritorna come pioggia!',
    iqParameterTag: 'Cicli Naturali & Ragionamento Causale (Gc · Gf)',
  },
];

// 4. OROLOGIO, TEMPO & EDUCAZIONE FINANZIARIA (6–12 anni)
export const FINANCIAL_TIME_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Leggere l’Orologio: Quanti minuti ci sono in MEZZ’ORA? ⏰',
    speech: 'Sfida del tempo: se un’ora intera ha sessanta minuti, quanti minuti ci sono in mezz’ora?',
    correct: { label: '30 minuti ⏰', emoji: '⏰', sublabel: '60 ÷ 2 = 30 minuti' },
    distractors: [
      { label: '15 minuti', emoji: '🕒', sublabel: 'Quello è un quarto d’ora' },
      { label: '50 minuti', emoji: '⏱️', sublabel: 'Quasi un’ora intera' },
    ],
    explanation: 'Esatto! Un’ora ha 60 minuti, quindi la metà esatta è 30 minuti!',
    iqParameterTag: 'Misura del Tempo & Calcolo Mentale (Gwm · Gf)',
  },
  {
    prompt: 'Educazione Finanziaria: Hai 10 € nel salvadanaio e compri un libro da 6 €. Quanto resto ricevi? 💶',
    speech: 'Gestiamo il salvadanaio: se hai dieci euro e compri un libro bellissimo che costa sei euro, quanto resto ti rimane?',
    patternItems: ['10 €', '−', '6 €', '=', '❓'],
    correct: { label: '4 € di resto 💶', emoji: '🐷', sublabel: '10 − 6 = 4 euro' },
    distractors: [
      { label: '5 €', emoji: '💶', sublabel: '6 + 5 farebbe 11' },
      { label: '3 €', emoji: '🪙', sublabel: '6 + 3 farebbe 9' },
    ],
    explanation: 'Ottima gestione! 10 meno 6 fa 4 euro che puoi risparmiare per un prossimo obiettivo!',
    iqParameterTag: 'Educazione Finanziaria & Calcolo Pratico (Gf · Gwm)',
  },
  {
    prompt: 'Risparmio Intelligente: Se risparmi 2 € ogni settimana, quanti euro avrai dopo 4 settimane? 🐷',
    speech: 'Calcolo del risparmio: se metti nel salvadanaio due euro ogni settimana, quanto avrai accumulato dopo quattro settimane?',
    patternItems: ['2 €', '×', '4 sett.', '=', '❓'],
    correct: { label: '8 € risparmiati! 🐷', emoji: '✨', sublabel: '2 × 4 = 8 euro' },
    distractors: [
      { label: '6 €', emoji: '🪙', sublabel: 'Solo 3 settimane' },
      { label: '10 €', emoji: '💶', sublabel: 'Servono 5 settimane' },
    ],
    explanation: 'Fantastico! Risparmiare poco ma con costanza permette di realizzare grandi progetti!',
    iqParameterTag: 'Pianificazione & Educazione Finanziaria (Gf · Gwm)',
  },
];

// 5. ASTRONOMIA & UNIVERSO (6–12 anni)
export const ASTRONOMY_SPACE_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Astronomia: Quale pianeta del Sistema Solare è celebre per i suoi grandi ANELLI luminosi di ghiaccio e roccia? 🪐',
    speech: 'Viaggio nello spazio: quale pianeta gigante è famoso in tutto il cielo per i suoi spettacolari anelli?',
    correct: { label: 'Saturno 🪐', emoji: '🪐', sublabel: 'Il signore degli anelli!' },
    distractors: [
      { label: 'Marte', emoji: '🔴', sublabel: 'È il Pianeta Rosso' },
      { label: 'Mercurio', emoji: '☄️', sublabel: 'È il più vicino al Sole' },
    ],
    explanation: 'Spettacolare! Gli anelli di Saturno sono fatti da miliardi di cristalli di ghiaccio e rocce!',
    iqParameterTag: 'Astronomia & Scienze dello Spazio (Gc)',
  },
  {
    prompt: 'Moto della Terra: Perché sulla Terra si alternano il GIORNO e la NOTTE ogni 24 ore? 🌍',
    speech: 'Domanda da astronomo: perché vediamo il Sole di giorno e le stelle di notte ogni ventiquattro ore?',
    correct: { label: 'La Terra ruota su sé stessa 🌍', emoji: '🌍', sublabel: 'Moto di rotazione (24 ore)' },
    distractors: [
      { label: 'Il Sole si spegne di notte', emoji: '💡', sublabel: 'Il Sole brilla sempre!' },
      { label: 'La Luna copre il Sole ogni sera', emoji: '🌙', sublabel: 'Quella è una rara eclissi' },
    ],
    explanation: 'Esatto! Mentre la Terra gira come una trottola, metà pianeta è illuminata dal Sole e l’altra metà è nella notte!',
    iqParameterTag: 'Fisica Terrestre & Astronomia (Gc · Gf)',
  },
  {
    prompt: 'Esplorazione Spaziale: Come si chiama la galassia a spirale che ospita il Sole e la nostra Terra? 🌌',
    speech: 'Guardiamo le stelle: qual è il nome della nostra grande galassia che contiene miliardi di stelle?',
    correct: { label: 'Via Lattea 🌌', emoji: '🌌', sublabel: 'La nostra casa cosmica' },
    distractors: [
      { label: 'Andromeda', emoji: '✨', sublabel: 'È la galassia vicina' },
      { label: 'Orsa Maggiore', emoji: '🐻', sublabel: 'È una costellazione' },
    ],
    explanation: 'Meraviglioso! La Via Lattea contiene oltre cento miliardi di stelle!',
    iqParameterTag: 'Astronomia & Cultura Scientifica (Gc)',
  },
];

// 6. GEOGRAFIA DEL MONDO & CULTURE (7–12 anni)
export const GEOGRAPHY_WORLD_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Geografia Mondiale: Qual è l’OCEANO più grande e profondo della Terra? 🌊',
    speech: 'Sfida sul mappamondo: qual è l’oceano più vasto dell’intero pianeta Terra?',
    correct: { label: 'Oceano Pacifico 🌊', emoji: '🌏', sublabel: 'Copre quasi un terzo della Terra' },
    distractors: [
      { label: 'Mar Mediterraneo', emoji: '⛵', sublabel: 'È un mare interno' },
      { label: 'Oceano Artico', emoji: '🧊', sublabel: 'È il più piccolo' },
    ],
    explanation: 'Esatto! L’Oceano Pacifico è così grande che contiene più superficie di tutte le terre emerse messe insieme!',
    iqParameterTag: 'Geografia Fisica & Orientamento (Gc · Gv)',
  },
  {
    prompt: 'Capitali & Monumenti: In quale città d’Italia si trova il celebre COLOSSEO? 🏛️',
    speech: 'Viaggio in Italia: in quale città capitale si può visitare l’antico e grandioso Colosseo?',
    correct: { label: 'Roma 🏛️', emoji: '🇮🇹', sublabel: 'Capitale d’Italia' },
    distractors: [
      { label: 'Venezia', emoji: '🚤', sublabel: 'Famosa per i canali e Piazza San Marco' },
      { label: 'Firenze', emoji: '🎨', sublabel: 'Culla del Rinascimento' },
    ],
    explanation: 'Perfetto! Il Colosseo è il simbolo di Roma ed è una delle sette meraviglie del mondo moderno!',
    iqParameterTag: 'Geografia & Patrimonio Culturale (Gc)',
  },
  {
    prompt: 'Punti Cardinali: Se guardi il Sole sorgere davanti a te all’alba (EST), quale punto cardinale hai alle tue SPALLE? 🧭',
    speech: 'Sfida con la bussola: se davanti a te hai l’Est dove sorge il Sole, quale punto cardinale si trova esattamente dietro le tue spalle?',
    correct: { label: 'Ovest 🧭', emoji: '🧭', sublabel: 'Dove tramonta il Sole' },
    distractors: [
      { label: 'Nord', emoji: '⬆️', sublabel: 'Si trova alla tua sinistra' },
      { label: 'Sud', emoji: '⬇️', sublabel: 'Si trova alla tua destra' },
    ],
    explanation: 'Orientamento perfetto! Est e Ovest sono opposti, proprio come Nord e Sud!',
    iqParameterTag: 'Orientamento Spaziale & Geografia (Gv · Gf)',
  },
];

// 7. INVENZIONI, SCIENZA & TECNOLOGIA (8–12 anni)
export const INVENTIONS_TECH_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Storia delle Invenzioni: Chi inventò la STAMPA a caratteri mobili nel 1455, rendendo i libri accessibili a tutti? 📚',
    speech: 'Domanda sulle grandi invenzioni: quale inventore creò la stampa a caratteri mobili permettendo di stampare milioni di libri?',
    correct: { label: 'Johannes Gutenberg 📚', emoji: '🖨️', sublabel: 'Rivoluzionò la cultura' },
    distractors: [
      { label: 'Cristoforo Colombo', emoji: '⛵', sublabel: 'Navigatore del 1492' },
      { label: 'Wolfgang Mozart', emoji: '🎼', sublabel: 'Compositore musicale' },
    ],
    explanation: 'Da vero storico della scienza! Grazie a Gutenberg la conoscenza si diffuse in tutto il mondo!',
    iqParameterTag: 'Storia della Tecnologia & Cultura (Gc)',
  },
  {
    prompt: 'Informatica & Bit: Nel linguaggio dei computer (codice BINARIO), quali sono le UNICHE due cifre utilizzate? 💻',
    speech: 'Scopriamo il linguaggio dei computer: il sistema binario usa solo due cifre per scrivere tutto. Quali sono?',
    patternItems: ['0', '1', '0', '1', '💻'],
    correct: { label: '0 e 1 💻', emoji: '💻', sublabel: 'Spento (0) e Acceso (1)' },
    distractors: [
      { label: '1 e 9', emoji: '🔢', sublabel: 'Sistema decimale' },
      { label: 'A e B', emoji: '🔤', sublabel: 'Lettere dell’alfabeto' },
    ],
    explanation: 'Esatto! Ogni immagine, musica e videogioco dentro un computer è fatto da miliardi di 0 e 1! Da vero programmatore!',
    iqParameterTag: 'Pensiero Computazionale & Tecnologia (Gf · Gc)',
  },
  {
    prompt: 'Scienza & Fisica: Quale strumento usa un ago magnetico per indicare sempre il Nord terrestre? 🧭',
    speech: 'Invenzione geniale per i viaggiatori: quale strumento sfrutta il magnetismo della Terra per indicare sempre il Nord?',
    correct: { label: 'La Bussola 🧭', emoji: '🧭', sublabel: 'Sfrutta il campo magnetico' },
    distractors: [
      { label: 'Il Termometro', emoji: '🌡️', sublabel: 'Misura la temperatura' },
      { label: 'Il Microscopio', emoji: '🔬', sublabel: 'Ingrandisce l’invisibile' },
    ],
    explanation: 'Bravissimo! La bussola ha permesso ai navigatori di attraversare gli oceani in sicurezza!',
    iqParameterTag: 'Fisica & Strumenti Scientifici (Gc · Gf)',
  },
];

// 8. PENSIERO CRITICO, FILOSOFIA & PROBLEM SOLVING (9–12 anni)
export const PHILOSOPHY_CRITICAL_CATALOG: AgeQuizEntry[] = [
  {
    prompt: 'Pensiero Critico: Quale tra queste frasi è un FATTO verificabile e NON una semplice opinione personale? 🔍',
    speech: 'Alleniamo il pensiero critico: quale di queste affermazioni è un fatto scientifico verificabile e non un’opinione?',
    correct: { label: 'L’acqua bolle a 100 °C 🌡️', emoji: '🔬', sublabel: 'Verificabile con un esperimento' },
    distractors: [
      { label: 'Il blu è il colore più bello', emoji: '🎨', sublabel: 'È un gusto personale' },
      { label: 'Il calcio è lo sport migliore', emoji: '⚽', sublabel: 'È un’opinione' },
    ],
    explanation: 'Ragionamento brillante! Distinguere i fatti dalle opinioni è la super-abilità del pensiero critico!',
    iqParameterTag: 'Pensiero Critico & Analisi Logica (Gf · Gc)',
  },
  {
    prompt: 'Strategia & Problem Solving: Una lumaca sale 3 m di giorno e scivola giù 2 m di notte su un muro alto 5 m. In quanti GIORNI arriva in cima? 🐌',
    speech: 'Enigma di strategia: una lumaca sale tre metri di giorno e scende due metri di notte su un muro di cinque metri. A quale giorno tocca la cima?',
    correct: { label: 'Il 3° giorno! 🐌', emoji: '🏆', sublabel: 'G1: 1m · G2: 2m · G3: 2+3=5m!' },
    distractors: [
      { label: 'Il 5° giorno', emoji: '5️⃣', sublabel: 'Attento all’ultimo salto diurno!' },
      { label: 'Il 2° giorno', emoji: '2️⃣', sublabel: 'Arriva solo a 4 metri' },
    ],
    explanation: 'Geniale! Alla fine del 2° giorno è a 2 metri: durante il 3° giorno sale 3 metri e tocca subito i 5 metri!',
    iqParameterTag: 'Problem Solving & Ragionamento Strategico (Gf · Gwm)',
  },
  {
    prompt: 'Filosofia & Dialogo: Il filosofo Socrate diceva «So di non sapere». Cosa ci insegna questa frase famosa? 🦉',
    speech: 'Piccola sfida di filosofia: Socrate diceva "So di non sapere". Secondo te quale prezioso insegnamento nasconde?',
    correct: { label: 'Restare curiosi e fare domande 🦉', emoji: '🦉', sublabel: 'La curiosità apre la mente' },
    distractors: [
      { label: 'Non serve mai studiare', emoji: '📕', sublabel: 'Anzi, l’opposto!' },
      { label: 'Non bisogna mai sbagliare', emoji: '❌', sublabel: 'Dagli errori si impara' },
    ],
    explanation: 'Meraviglioso! Chi riconosce di avere sempre qualcosa da scoprire continua a crescere per tutta la vita!',
    iqParameterTag: 'Filosofia, Metacognizione & Pensiero Critico (Gf · Gc)',
  },
];

// =========================================================================
// BAND 6: 13–14 ANNI (3ª MEDIA & INIZIO SUPERIORI — ALGEBRA, CHIMICA, FISICA,
//         LETTERATURA, ARTE MODERNA, TEORIA MUSICALE, ALGORITMI & INGLESE B1)
// =========================================================================

export const TEEN_SCIENCE_CHEMISTRY_PHYSICS: AgeQuizEntry[] = [
  {
    prompt: 'Chimica & Tavola Periodica: Qual è il simbolo chimico dell’ORO nella tavola periodica degli elementi? 🧪',
    speech: 'Sfida di chimica: nella tavola periodica, qual è il simbolo chimico dell’oro, derivato dal latino Aurum?',
    correct: { label: 'Au (Aurum) 🥇', emoji: '🧪', sublabel: 'Numero atomico 79' },
    distractors: [
      { label: 'Ag (Argento)', emoji: '🥈', sublabel: 'Deriva da Argentum' },
      { label: 'Fe (Ferro)', emoji: '🧲', sublabel: 'Deriva da Ferrum' },
    ],
    explanation: 'Esatto! Au deriva dal latino Aurum; Ag è l’argento e Fe è il ferro!',
    iqParameterTag: 'Chimica & Cultura Scientifica (Gc)',
  },
  {
    prompt: 'Biologia Cellulare: Quale molecola a doppia elica custodisce il codice genetico dentro il nucleo delle cellule? 🧬',
    speech: 'Domanda di biologia: come si chiama la molecola a doppia elica che contiene tutte le informazioni genetiche di un organismo?',
    correct: { label: 'Il DNA 🧬', emoji: '🧬', sublabel: 'Acido desossiribonucleico' },
    distractors: [
      { label: 'La Clorofilla', emoji: '🌿', sublabel: 'Serve per la fotosintesi' },
      { label: 'L’Emoglobina', emoji: '🩸', sublabel: 'Trasporta ossigeno nel sangue' },
    ],
    explanation: 'Perfetto! Il DNA è il manuale d’istruzioni biologico a forma di doppia elica scoperto nel 1953!',
    iqParameterTag: 'Biologia Molecolare & Scienze (Gc · Gf)',
  },
  {
    prompt: 'Fisica & Cinematica: Un treno viaggia a velocità costante di 90 km/h per 2 ore e mezza (2,5 h). Quanti km percorre? 🚄',
    speech: 'Problema di fisica: se un treno mantiene novanta chilometri all’ora per due ore e mezza, quale distanza percorre in totale?',
    patternItems: ['v = 90 km/h', '×', 't = 2,5 h', '=', '❓'],
    correct: { label: '225 km 🚄', emoji: '🚄', sublabel: '90 × 2 = 180 · + 45 = 225 km' },
    distractors: [
      { label: '180 km', emoji: '🛤️', sublabel: 'Solo 2 ore di viaggio' },
      { label: '240 km', emoji: '⏱️', sublabel: 'Sarebbero 2 ore e 40 minuti' },
    ],
    explanation: 'Bravissimo! Con la formula s = v × t, 90 × 2,5 = 225 chilometri!',
    iqParameterTag: 'Fisica, Cinematica & Ragionamento Quantitativo (Gf · Gwm)',
  },
  {
    prompt: 'Storia & Educazione Civica: In quale anno entrò ufficialmente in vigore la Costituzione della Repubblica Italiana? 🇮🇹',
    speech: 'Storia contemporanea e civica: in quale anno entrò in vigore la Costituzione della Repubblica Italiana, il primo gennaio?',
    correct: { label: '1948 (1° Gennaio) 📜', emoji: '🏛️', sublabel: '139 articoli fondamentali' },
    distractors: [
      { label: '1861', emoji: '🗺️', sublabel: 'Anno dell’Unità d’Italia' },
      { label: '1918', emoji: '🕊️', sublabel: 'Fine della Prima Guerra Mondiale' },
    ],
    explanation: 'Da vero storico! La Costituzione Italiana fu approvata nel dicembre 1947 ed entrò in vigore il 1° gennaio 1948!',
    iqParameterTag: 'Storia Contemporanea & Educazione Civica (Gc)',
  },
  {
    prompt: 'Fisica & Leggi di Newton: Secondo il 2° principio della dinamica (F = m × a), se la massa è 4 kg e l’accelerazione è 5 m/s², qual è la forza? ⚡',
    speech: 'Leggi della dinamica di Newton: se forza uguale massa per accelerazione, quanta forza serve per accelerare quattro chilogrammi a cinque metri al secondo quadrato?',
    patternItems: ['F = m × a', '➔', '4 × 5', '=', '❓'],
    correct: { label: '20 Newton (N) ⚡', emoji: '⚡', sublabel: 'F = 4 × 5 = 20 N' },
    distractors: [
      { label: '9 Newton (N)', emoji: '📐', sublabel: 'Hai sommato invece di moltiplicare' },
      { label: '25 Newton (N)', emoji: '🔋', sublabel: 'Sarebbe 5 × 5' },
    ],
    explanation: 'Eccellente! La forza si misura in Newton e vale F = 4 kg × 5 m/s² = 20 N!',
    iqParameterTag: 'Fisica & Leggi della Dinamica (Gf · Gc)',
  },
];

export const TEEN_LANGUAGE_LITERATURE: AgeQuizEntry[] = [
  {
    prompt: 'Analisi del Periodo: Nella frase «Studio con passione perché voglio imparare», che tipo di subordinata è «perché voglio imparare»? 📖',
    speech: 'Analisi del periodo: nella frase "Studio con passione perché voglio imparare", quale funzione logica svolge la proposizione introdotta da perché?',
    correct: { label: 'Subordinata Causale 💡', emoji: '📘', sublabel: 'Spiega la causa / motivo' },
    distractors: [
      { label: 'Subordinata Temporale', emoji: '⏳', sublabel: 'Indica il tempo (quando)' },
      { label: 'Subordinata Concessiva', emoji: '⚖️', sublabel: 'Introdotta da benché/sebbene' },
    ],
    explanation: 'Perfetto! Risponde alla domanda "per quale motivo?", quindi è una proposizione subordinata causale!',
    iqParameterTag: 'Sintassi & Analisi del Periodo (Gc · Gf)',
  },
  {
    prompt: 'Letteratura Italiana: Chi è l’autore della «Divina Commedia» (Inferno, Purgatorio e Paradiso)? 🪶',
    speech: 'Storia della letteratura italiana: quale sommo poeta fiorentino scrisse la Divina Commedia in terzine di endecasillabi?',
    correct: { label: 'Dante Alighieri 🪶', emoji: '📜', sublabel: 'Padre della lingua italiana' },
    distractors: [
      { label: 'Alessandro Manzoni', emoji: '📖', sublabel: 'Autore de I Promessi Sposi' },
      { label: 'Giacomo Leopardi', emoji: '🌙', sublabel: 'Autore de L’Infinito' },
    ],
    explanation: 'Esatto! Dante Alighieri compose la Divina Commedia tra il 1304 e il 1321!',
    iqParameterTag: 'Letteratura Italiana & Cultura (Gc)',
  },
  {
    prompt: 'Figure Retoriche: L’espressione «un silenzio assordante» affianca due parole di senso opposto. Che figura retorica è? 🎭',
    speech: 'Sfida di retorica: come si chiama la figura che unisce due parole dal significato opposto, come "silenzio assordante" o "ghiaccio bollente"?',
    correct: { label: 'Ossimoro 🎭', emoji: '🎭', sublabel: 'Accostamento di opposti' },
    distractors: [
      { label: 'Similitudine', emoji: '🔗', sublabel: 'Paragone con "come"' },
      { label: 'Onomatopea', emoji: '💥', sublabel: 'Imita un suono (es. tic-tac)' },
    ],
    explanation: 'Bravissimo! L’ossimoro crea un forte contrasto poetico accostando due termini antitetici!',
    iqParameterTag: 'Retorica & Pensiero Astratto (Gc · Gf)',
  },
  {
    prompt: 'Etimologia & Lessico: La parola «DEMOCRAZIA» deriva dal greco antico démos + krátos. Cosa significa letteralmente? 🏛️',
    speech: 'Etimologia greca: unendo démos e krátos nasce la parola Democrazia. Qual è il suo significato letterale?',
    correct: { label: 'Governo / Potere del Popolo 🏛️', emoji: '🗳️', sublabel: 'démos (popolo) + krátos (potere)' },
    distractors: [
      { label: 'Governo di uno solo', emoji: '👑', sublabel: 'Quella è la Monarchia' },
      { label: 'Studio delle stelle', emoji: '🔭', sublabel: 'Quella è l’Astronomia' },
    ],
    explanation: 'Perfetto! Conoscere le radici greche e latine permette di capire centinaia di parole scientifiche e storiche!',
    iqParameterTag: 'Etimologia & Competenza Lessicale (Gc)',
  },
];

export const TEEN_ART_ARCHITECTURE: AgeQuizEntry[] = [
  {
    prompt: 'Storia dell’Arte Moderna: Quale movimento pittorico dell’800 (Monet, Renoir, Degas) dipingeva all’aperto per catturare la luce fuggevole? 🎨',
    speech: 'Storia dell’arte: come si chiama il celebre movimento francese guidato da Monet che dipingeva all’aria aperta catturando i riflessi della luce sull’acqua?',
    correct: { label: 'Impressionismo 🎨', emoji: '🌅', sublabel: 'Da "Impressione, levar del sole"' },
    distractors: [
      { label: 'Cubismo', emoji: '🧊', sublabel: 'Scompone in forme geometriche (Picasso)' },
      { label: 'Barocco', emoji: '🏛️', sublabel: 'Stile monumentale del Seicento' },
    ],
    explanation: 'Fantastico! L’Impressionismo rivoluzionò la pittura con pennellate rapide e luce naturale en plein air!',
    iqParameterTag: 'Storia dell’Arte & Percezione Visiva (Gv · Gc)',
  },
  {
    prompt: 'Geometria & Teorema di Pitagora: In un triangolo rettangolo con cateti 6 cm e 8 cm, quanto misura l’ipotenusa? 📐',
    speech: 'Applica il Teorema di Pitagora: se i due cateti di un triangolo rettangolo misurano sei e otto centimetri, quanto misura l’ipotenusa?',
    patternItems: ['a = 6', 'b = 8', '➔', 'c = √(6²+8²)', '= ?'],
    correct: { label: '10 cm 📐', emoji: '📐', sublabel: '√(36 + 64) = √100 = 10 cm' },
    distractors: [
      { label: '14 cm', emoji: '📏', sublabel: 'Somma dei cateti, non l’ipotenusa' },
      { label: '12 cm', emoji: '🔺', sublabel: '12² = 144 ≠ 100' },
    ],
    explanation: 'Da vero matematico! 6² + 8² = 36 + 64 = 100, e la radice quadrata di 100 è 10 cm!',
    iqParameterTag: 'Teorema di Pitagora & Geometria (Gv · Gf)',
  },
  {
    prompt: 'Geometria Solida: Qual è il VOLUME di un cubo con spigolo lungo 4 cm (V = l³)? 🧊',
    speech: 'Geometria nello spazio 3D: quanto vale il volume di un cubo con lo spigolo lungo quattro centimetri?',
    patternItems: ['l = 4 cm', '➔', 'V = 4³', '=', '❓'],
    correct: { label: '64 cm³ 🧊', emoji: '🧊', sublabel: '4 × 4 × 4 = 64 cm³' },
    distractors: [
      { label: '16 cm³', emoji: '🟦', sublabel: 'Questa è l’area di una sola faccia' },
      { label: '48 cm³', emoji: '📦', sublabel: '4 × 12 = somma degli spigoli' },
    ],
    explanation: 'Perfetto! Il volume di un cubo si calcola elevando lo spigolo alla terza potenza: 4 × 4 × 4 = 64 cm³!',
    iqParameterTag: 'Geometria Solida 3D & Volumi (Gv · Gwm)',
  },
  {
    prompt: 'Arte & Proporzioni: Quale numero irrazionale (≈ 1,618) è noto come «Sezione Aurea», usata dal Partenone a Leonardo da Vinci? 🐚',
    speech: 'Arte e matematica: quale celebre rapporto proporzionale, vicino a uno virgola seicentodiciotto, si trova nelle spirali delle conchiglie e nei capolavori del Rinascimento?',
    correct: { label: 'Rapporto Aureo φ (Phi) 🐚', emoji: '✨', sublabel: 'φ ≈ 1,618 · Armonia naturale' },
    distractors: [
      { label: 'Pi Greco π', emoji: '⭕', sublabel: '≈ 3,141 · Rapporto del cerchio' },
      { label: 'Zero Assoluto', emoji: '❄️', sublabel: 'Temperatura minima in fisica' },
    ],
    explanation: 'Meraviglioso! La Sezione Aurea φ (Phi) lega arte, architettura e matematica della natura!',
    iqParameterTag: 'Estetica Matematica & Storia dell’Arte (Gv · Gc)',
  },
];

export const TEEN_MUSIC_THEORY: AgeMusicEntry[] = [
  {
    title: 'Accordo Maggiore: La Triade DO - MI - SOL',
    prompt: 'Ascolta l’accordo di DO Maggiore (DO - MI - SOL). Quante note diverse formano una triade musicale di base? 🎹',
    speech: 'Teoria musicale: ascolta la triade armonica Do, Mi, Sol. Da quante note distinte è composto un accordo di triade?',
    rhythmNotes: [
      { freq: 261.63, duration: 0.34, label: 'DO (1ª)', emoji: '🔴' },
      { freq: 329.63, duration: 0.34, label: 'MI (3ª)', emoji: '🟡' },
      { freq: 392.0, duration: 0.45, label: 'SOL (5ª)', emoji: '🔵' },
    ],
    correct: { label: '3 Note (1ª, 3ª, 5ª) 🎹', emoji: '🎹', sublabel: 'Fondamentale, terza e quinta', noteFreq: 392.0 },
    distractors: [
      { label: '2 Note', emoji: '🎵', sublabel: 'Due note formano un intervallo', noteFreq: 293.66 },
      { label: '7 Note', emoji: '🎼', sublabel: 'Sette note formano la scala intera', noteFreq: 493.88 },
    ],
    explanation: 'Esatto! Una triade unisce 1°, 3° e 5° grado della scala, creando l’armonia fondamentale della musica occidentale!',
  },
  {
    title: 'Acustica Musicale: Il LA di Riferimento (440 Hz)',
    prompt: 'Quale grandezza fisica, misurata in Hertz (Hz), determina se una nota musicale è più ACUTA o più GRAVE? 🌊',
    speech: 'Fisica del suono e musica: i musicisti accordano gli strumenti sul LA a quattrocentoquaranta Hertz. Cosa misura l’Hertz?',
    rhythmNotes: [
      { freq: 220.0, duration: 0.32, label: '220 Hz', emoji: '🥁' },
      { freq: 440.0, duration: 0.36, label: '440 Hz', emoji: '🎻' },
      { freq: 880.0, duration: 0.42, label: '880 Hz', emoji: '✨' },
    ],
    correct: { label: 'La Frequenza delle vibrazioni 🌊', emoji: '🌊', sublabel: 'Più Hz = nota più acuta', noteFreq: 440.0 },
    distractors: [
      { label: 'Il peso dello strumento', emoji: '⚖️', sublabel: 'Si misura in chilogrammi', noteFreq: 220.0 },
      { label: 'La lunghezza dello spartito', emoji: '📜', sublabel: 'Non dipende dalle onde sonore', noteFreq: 293.66 },
    ],
    explanation: 'Da vero musicista e fisico! Raddoppiare la frequenza (da 440 Hz a 880 Hz) fa salire la nota di un’ottava esatta!',
  },
  {
    title: 'Storia della Musica: Le Quattro Stagioni',
    prompt: 'Quale compositore veneziano del Barocco scrisse i celebri concerti per violino «Le Quattro Stagioni»? 🎻',
    speech: 'Storia della musica classica: quale grande compositore barocco nato a Venezia compose "Le Quattro Stagioni" per violino e orchestra?',
    rhythmNotes: [
      { freq: 329.63, duration: 0.22, label: 'MI', emoji: '🌸' },
      { freq: 415.3, duration: 0.22, label: 'SOL#', emoji: '☀️' },
      { freq: 415.3, duration: 0.22, label: 'SOL#', emoji: '🍂' },
      { freq: 415.3, duration: 0.38, label: 'SOL#', emoji: '❄️' },
    ],
    correct: { label: 'Antonio Vivaldi 🎻', emoji: '🎻', sublabel: 'Maestro del Barocco (1725)', noteFreq: 415.3 },
    distractors: [
      { label: 'Giuseppe Verdi', emoji: '🎭', sublabel: 'Maestro dell’Opera dell’800', noteFreq: 349.23 },
      { label: 'Fryderyk Chopin', emoji: '🎹', sublabel: 'Poeta del pianoforte romantico', noteFreq: 261.63 },
    ],
    explanation: 'Bravissimo! Antonio Vivaldi dipinse con il violino il canto degli uccelli in Primavera e i temporali d’Estate!',
  },
];

export const TEEN_ENGLISH_B1: AgeEnglishEntry[] = [
  {
    wordInfo: { en: 'IF IT RAINS, WE WILL STAY HOME', it: 'First Conditional (Ipotesi reale)', phoneticHint: 'If it rèinz, ui uil stèi hòum', emoji: '☔', categoryLabel: 'English B1 · Conditionals' },
    prompt: 'English B1 (First Conditional): Completa «If you study hard, you ___ pass the exam!» 🇬🇧',
    speech: 'Sfida di inglese livello B1 sul First Conditional: completa "If you study hard, you... pass the exam". Quale ausiliare futuro serve?',
    correct: { label: 'WILL (you will pass) ✨', emoji: '✅', sublabel: 'If + Present Simple ➔ WILL + base' },
    distractors: [
      { label: 'WERE', emoji: '❌', sublabel: 'Passato del verbo essere' },
      { label: 'DID', emoji: '⏳', sublabel: 'Ausiliare del passato' },
    ],
    explanation: 'Spot on! Nel First Conditional usiamo "If + Present Simple" seguito da "will + verbo base"!',
  },
  {
    wordInfo: { en: 'HAVE YOU EVER VISITED LONDON?', it: 'Present Perfect (Esperienze di vita)', phoneticHint: 'Hèv iu èver vìzitid Làndon?', emoji: '🎡', categoryLabel: 'English B1 · Present Perfect' },
    prompt: 'English B1 (Present Perfect): Quale participio passato completa «I have never ___ sushi»? 🇬🇧',
    speech: 'Grammatica inglese B1: nel Present Perfect "I have never... sushi", qual è il participio passato corretto del verbo to eat?',
    correct: { label: 'EATEN (have never eaten) 🍣', emoji: '🍣', sublabel: 'eat · ate · EATEN' },
    distractors: [
      { label: 'ATE', emoji: '⏳', sublabel: 'È il Past Simple, non il participio' },
      { label: 'EATING', emoji: '🍽️', sublabel: 'È la forma in -ing' },
    ],
    explanation: 'Brilliant! I verbi irregolari inglesi usano la 3ª colonna (EATEN) con have/has nel Present Perfect!',
  },
  {
    wordInfo: { en: 'GIVE UP = ARRENDERSI', it: 'Phrasal Verbs B1', phoneticHint: 'Ghiv àp', emoji: '💪', categoryLabel: 'English B1 · Phrasal Verbs' },
    prompt: 'English B1 (Phrasal Verbs): Cosa significa l’incoraggiamento «Never GIVE UP!»? 🇬🇧',
    speech: 'Espressioni idiomatiche B1: quando qualcuno ti dice in inglese "Never give up!", cosa significa esattamente?',
    correct: { label: 'Non arrenderti mai! 💪', emoji: '🏆', sublabel: 'Give up = arrendersi / mollare' },
    distractors: [
      { label: 'Alzati dal letto!', emoji: '🛏️', sublabel: 'Quello è "Get up!"' },
      { label: 'Guarda in alto!', emoji: '🔭', sublabel: 'Quello è "Look up!"' },
    ],
    explanation: 'Awesome! "Never give up" è uno dei phrasal verbs più usati in inglese!',
  },
];

export const TEEN_LOGIC_ALGORITHMS: AgeQuizEntry[] = [
  {
    prompt: 'Logica Booleana & Informatica: Se A = VERO e B = FALSO, qual è il risultato dell’espressione (A AND B) OR A? 💻',
    speech: 'Sfida di logica booleana: se A è vero e B è falso, quanto vale l’espressione "A e B, oppure A"?',
    patternItems: ['A=VERO', 'B=FALSO', '➔', '(A AND B) OR A', '= ?'],
    correct: { label: 'VERO (TRUE) ✅', emoji: '💻', sublabel: '(VERO AND FALSO)=FALSO · FALSO OR VERO = VERO' },
    distractors: [
      { label: 'FALSO (FALSE)', emoji: '❌', sublabel: 'OR è vero se almeno uno è vero' },
      { label: 'ERRORE', emoji: '⚠️', sublabel: 'L’espressione è sempre valutabile' },
    ],
    explanation: 'Da vero programmatore! (VERO AND FALSO) dà FALSO, ma poi FALSO OR VERO restituisce VERO!',
    iqParameterTag: 'Logica Booleana & Algoritmi (Gf · Gwm)',
  },
  {
    prompt: 'Successione di Fibonacci: Qual è il prossimo numero nella celebre serie 1, 1, 2, 3, 5, 8, 13, ___? 🐚',
    speech: 'Sfida matematica su Fibonacci: uno, uno, due, tre, cinque, otto, tredici... quale numero viene subito dopo?',
    patternItems: ['2', '3', '5', '8', '13', '➔', '❓'],
    correct: { label: '21 🐚', emoji: '✨', sublabel: 'Ogni termine è la somma dei due precedenti: 8 + 13 = 21' },
    distractors: [
      { label: '18', emoji: '🔢', sublabel: '8 + 13 fa più di 18' },
      { label: '26', emoji: '⚡', sublabel: 'Quello è il doppio di 13' },
    ],
    explanation: 'Perfetto! Nella successione di Fibonacci ogni numero nasce dalla somma dei due precedenti: 8 + 13 = 21!',
    iqParameterTag: 'Successioni Ricorsive & Ragionamento Fluido (Gf)',
  },
  {
    prompt: 'Calcolo Combinatorio: Quanti diversi codici PIN di 2 cifre puoi creare usando solo le cifre {1, 2, 3} (con ripetizione ammessa)? 🔐',
    speech: 'Ragionamento combinatorio: quante coppie diverse di due cifre puoi formare scegliendo ogni cifra tra uno, due e tre, potendo anche ripetere la stessa cifra?',
    patternItems: ['3 scelte', '×', '3 scelte', '=', '❓'],
    correct: { label: '9 codici diversi 🔐', emoji: '🔐', sublabel: '3 × 3 = 9 (11,12,13,21,22,23,31,32,33)' },
    distractors: [
      { label: '6 codici', emoji: '🔢', sublabel: 'Quelli sono senza ripetizione (3×2)' },
      { label: '3 codici', emoji: '3️⃣', sublabel: 'Troppo pochi!' },
    ],
    explanation: 'Eccellente! Con 3 scelte per la prima cifra e 3 per la seconda otteniamo 3 × 3 = 9 combinazioni!',
    iqParameterTag: 'Combinatoria & Probabilità (Gf · Gwm)',
  },
  {
    prompt: 'Logica Proposizionale: Se «Tutti i quadrati sono rettangoli» e «Questa figura NON è un rettangolo», cosa possiamo dedurre con certezza? 🧠',
    speech: 'Deduzione rigorosa: se tutti i quadrati sono rettangoli, e sappiamo che una figura non è un rettangolo, cosa possiamo concludere con certezza?',
    correct: { label: 'NON è un quadrato ✅', emoji: '🧠', sublabel: 'Modus Tollens (deduzione sicura)' },
    distractors: [
      { label: 'È sicuramente un cerchio', emoji: '🔴', sublabel: 'Potrebbe essere un triangolo o pentagono' },
      { label: 'Potrebbe essere un quadrato', emoji: '🟦', sublabel: 'Contraddice la premessa!' },
    ],
    explanation: 'Logica impeccabile! Se fosse un quadrato dovrebbe essere anche un rettangolo: quindi sicuramente non è un quadrato!',
    iqParameterTag: 'Logica Deduttiva & Modus Tollens (Gf)',
  },
];


