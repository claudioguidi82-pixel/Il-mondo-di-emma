import {
  AgeBandId,
  ChildGender,
  ChildProfile,
  ExerciseDifficultyScore,
  GameCategory,
  LevelPerformanceEntry,
  UserProgress,
} from '../types/game';
import { isValidChildEntry } from './adultPlayDetector';

export const AGE_BAND_ORDER: AgeBandId[] = [
  'toddler_2_3',
  'preschool_4_5',
  'early_primary_6_7',
  'upper_primary_8_9',
  'preteen_10_12',
  'teen_13_14',
];

export const DEFAULT_BIRTH_DATE = '2021-01-01';

export const DEFAULT_CHILD_PROFILE: ChildProfile = {
  name: '',
  surname: '',
  birthDate: '',
  gender: 'n',
  customBackgroundUrl: undefined,
  isConfigured: false,
};

export interface AgeRoadmapStage {
  band: AgeBandId;
  ageRangeLabel: string;
  schoolLabel: string;
  newlyAddedSubjects: string[];
  coreFocus: string;
}

export const AGE_CURRICULUM_ROADMAP: AgeRoadmapStage[] = [
  {
    band: 'toddler_2_3',
    ageRangeLabel: '2–3 Anni',
    schoolLabel: 'Nido & Prima Infanzia',
    newlyAddedSubjects: [
      'Animali, Versi & Oggetti',
      'Artistica: Colori Primari & Forme',
      'Conteggio Tattile (1–3 / 1–5)',
      'Musica & Senso del Ritmo Base',
    ],
    coreFocus: '100% visivo e sonoro: versi degli animali, colori primari, forme, grande/piccolo e tocco tattile 1–5 (zero lettura, zero calcoli).',
  },
  {
    band: 'preschool_4_5',
    ageRangeLabel: '4–5 Anni',
    schoolLabel: 'Scuola dell’Infanzia',
    newlyAddedSubjects: [
      'Fonetica, Sillabe & Rime',
      'Logica & Sequenze Visive',
      'Artistica: Mescolanza Colori',
      'Inglese Prescolare',
    ],
    coreFocus: 'Addizioni/sottrazioni visive fino a 10, strumenti musicali, rime e prime parole inglesi.',
  },
  {
    band: 'early_primary_6_7',
    ageRangeLabel: '6–7 Anni',
    schoolLabel: '1ª–2ª Scuola Primaria',
    newlyAddedSubjects: [
      'Calcolo Mentale (fino a 30)',
      'Ortografia & Contrari',
      'Artistica: Colori Caldi/Freddi & Simmetria',
      'Scala Musicale & Ritmo',
    ],
    coreFocus: 'Ragionamento deduttivo, poligoni 2D/3D, prime tabelline, armonia cromatica e inglese A1.',
  },
  {
    band: 'upper_primary_8_9',
    ageRangeLabel: '8–9 Anni',
    schoolLabel: '3ª–4ª Scuola Primaria',
    newlyAddedSubjects: [
      'Tabelline, Divisioni & Frazioni',
      'Scienze & Geografia',
      'Grammatica & Sinonimi',
      'Artistica: Complementari, Luce & Pittori',
    ],
    coreFocus: 'Perimetri e angoli, orchestra e durata delle note, geografia, scienze naturali e inglese A1+.',
  },
  {
    band: 'preteen_10_12',
    ageRangeLabel: '10–12 Anni',
    schoolLabel: '5ª Primaria & 1ª–2ª Media',
    newlyAddedSubjects: [
      'Pre-Algebra, Potenze & Percentuali',
      'Storia, Civica, Fisica & Astronomia',
      'Logica, Coding & Probabilità',
      'Artistica: Prospettiva & Rinascimento · Musica Classica · Inglese A2',
    ],
    coreFocus: 'Equazioni intuitive, aree e Pitagora, analisi logica, compositori e pensiero critico/computazionale.',
  },
  {
    band: 'teen_13_14',
    ageRangeLabel: '13–14 Anni',
    schoolLabel: '3ª Media & Inizio Superiori',
    newlyAddedSubjects: [
      'Algebra, Equazioni, Radici & Teorema di Pitagora',
      'Chimica, Biologia Cellulare & Leggi della Fisica',
      'Letteratura Italiana & Analisi del Periodo',
      'Arte Moderna, Teoria Musicale Avanzata, Algoritmi & Inglese B1',
    ],
    coreFocus: 'Ragionamento astratto e scientifico, algebra e proporzioni, logica booleana, filosofia critica e inglese B1.',
  },
];

export interface ChildAgeInfo {
  years: number;
  months: number;
  totalMonths: number;
  birthYear: number;
  birthMonth: number; // 1..12
  birthDay: number;   // 1..31
  birthDateIso: string;
  birthDateFormatted: string; // DD/MM/YYYY
  displayText: string;        // es. "5 anni e 3 mesi"
  shortAgeLabel: string;      // es. "5 Anni"
  ageBand: AgeBandId;
  ageBandTitle: string;
  developmentalStage: string;
  curriculumSummary: string;
  subjectsHighlight: string[];
  newlyAddedSubjects: string[];
  unlockedSubjectsCount: number;
  difficultyBadge: string;
}

export function normalizeBirthDateString(dateStr?: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  // Format 1: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    const currentYear = new Date().getFullYear();
    if (y >= currentYear - 18 && y <= currentYear && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const check = new Date(y, m - 1, d);
      if (check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  // Format 2: DD/MM/YYYY or DD-MM-YYYY
  const itMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (itMatch) {
    const d = Number(itMatch[1]);
    const m = Number(itMatch[2]);
    const y = Number(itMatch[3]);
    const currentYear = new Date().getFullYear();
    if (y >= currentYear - 18 && y <= currentYear && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const check = new Date(y, m - 1, d);
      if (check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

export function isValidIsoDate(dateStr?: string): boolean {
  return normalizeBirthDateString(dateStr) !== null;
}

export function parseBirthDateParts(birthDate?: string): { year: number; month: number; day: number; iso: string } {
  const normalized = normalizeBirthDateString(birthDate) || DEFAULT_BIRTH_DATE;
  const [yStr, mStr, dStr] = normalized.split('-');
  return {
    year: Number(yStr),
    month: Number(mStr),
    day: Number(dStr),
    iso: normalized,
  };
}

export function calculateChildAge(
  birthDate?: string,
  currentDate: Date = new Date()
): ChildAgeInfo {
  const { year: birthYear, month: birthMonth, day: birthDay, iso } = parseBirthDateParts(birthDate);

  let years = currentDate.getFullYear() - birthYear;
  let months = currentDate.getMonth() + 1 - birthMonth;

  if (currentDate.getDate() < birthDay) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // Keep age within the supported educational developmental range (2..14 anni)
  if (years < 2) {
    years = 2;
    months = Math.max(0, months);
  }
  if (years > 14) {
    years = 14;
    months = 0;
  }

  const totalMonths = years * 12 + months;
  const dd = String(birthDay).padStart(2, '0');
  const mm = String(birthMonth).padStart(2, '0');
  const birthDateFormatted = `${dd}/${mm}/${birthYear}`;
  const displayText =
    months === 0
      ? `${years} ${years === 1 ? 'anno' : 'anni'}`
      : `${years} ${years === 1 ? 'anno' : 'anni'} e ${months} ${months === 1 ? 'mese' : 'mesi'}`;
  const shortAgeLabel = `${years} ${years === 1 ? 'Anno' : 'Anni'}`;

  let ageBand: AgeBandId = 'preschool_4_5';
  let ageBandTitle = '4–5 Anni · Scuola dell’Infanzia';
  let developmentalStage =
    'Percorso 4–5 Anni (Logica & Sequenze, Artistica & Colori, Musica & Ritmo, Sillabe, Calcolo fino a 10 & Inglese Base)';
  let curriculumSummary =
    'Conteggio 4–9, somme/sottrazioni visive fino a 10, rime e sillabe, mescolanza colori e forme, senso del ritmo e strumenti musicali, natura e inglese base.';
  let subjectsHighlight = [
    'Logica & Sequenze',
    'Fonetica, Sillabe & Rime',
    'Numeri & Calcolo (fino a 10)',
    'Artistica, Colori & Forme',
    'Musica, Ritmo & Strumenti',
    'Inglese Prescolare',
  ];
  let newlyAddedSubjects = [
    'Fonetica & Sillabe',
    'Logica & Sequenze',
    'Mescolanza Colori',
    'Inglese Prescolare',
  ];
  let unlockedSubjectsCount = 6;
  let difficultyBadge = 'Fascia 2/6 · Infanzia (4–5 anni)';

  if (years <= 3) {
    ageBand = 'toddler_2_3';
    ageBandTitle = years === 2 ? '2 Anni · Primi Passi Sensoriali' : '3 Anni · Prima Infanzia';
    developmentalStage =
      years === 2
        ? 'Percorso 2 Anni (100% Visivo e Sonoro: Animali & Versi, Colori Primari, Ritmo & Tocco 1–3 · Zero Matematica/Lettura)'
        : 'Percorso 3 Anni (100% Visivo e Sonoro: Animali & Versi, Colori & Forme, Conteggio Tattile 1–5 & Logica Concreta)';
    curriculumSummary =
      years === 2
        ? 'Solo giochi sensoriali concreti: versi degli animali, colori primari, forme semplici, grande/piccolo, suoni ritmati e tocco tattile 1–3 (nessuna matematica o lettura).'
        : 'Versi degli animali, colori e forme, conteggio tattile guidato 1–5, grande/piccolo, associazioni visive e senso del ritmo (zero lettura richiesta).';
    subjectsHighlight = [
      'Animali, Versi & Associazioni',
      'Artistica: Colori Primari & Forme',
      years === 2 ? 'Tocco & Conta (1–3)' : 'Conteggio Tattile (1–5)',
      'Musica & Senso del Ritmo Base',
    ];
    newlyAddedSubjects = [
      'Versi & Associazioni',
      'Colori Primari',
      years === 2 ? 'Tocco 1–3' : 'Conteggio Tattile 1–5',
      'Senso del Ritmo',
    ];
    unlockedSubjectsCount = 4;
    difficultyBadge =
      years === 2
        ? 'Fascia 1/6 · Primi Passi (2 anni)'
        : 'Fascia 1/6 · Prima Infanzia (3 anni)';
  } else if (years >= 6 && years <= 7) {
    ageBand = 'early_primary_6_7';
    ageBandTitle = '6–7 Anni · 1ª–2ª Primaria';
    developmentalStage =
      'Percorso 6–7 Anni (Calcolo Mentale fino a 30, Ortografia, Deduzione, Artistica & Simmetria, Scala Musicale & Inglese A1)';
    curriculumSummary =
      'Calcolo mentale e prime tabelline (×2, ×5), ortografia e contrari, logica deduttiva, artistica (colori caldi/freddi e simmetria), poligoni, scala musicale e inglese primaria.';
    subjectsHighlight = [
      'Logica Deduttiva & Matrici',
      'Ortografia, Sillabe & Contrari',
      'Calcolo Mentale (fino a 30)',
      'Artistica, Simmetria & Poligoni',
      'Musica, Ritmo & Scala Do-Si',
      'Inglese Primaria (A1)',
    ];
    newlyAddedSubjects = [
      'Calcolo Mentale & Prime Tabelline',
      'Ortografia & Contrari',
      'Colori Caldi/Freddi & Simmetria',
      'Scienze Naturali',
    ];
    unlockedSubjectsCount = 7;
    difficultyBadge = 'Fascia 3/6 · Primaria Base (6–7 anni)';
  } else if (years >= 8 && years <= 9) {
    ageBand = 'upper_primary_8_9';
    ageBandTitle = '8–9 Anni · 3ª–4ª Primaria';
    developmentalStage =
      'Percorso 8–9 Anni (Tabelline, Divisioni & Frazioni, Scienze & Geografia, Grammatica, Artistica & Pittori, Orchestra & Inglese A1+)';
    curriculumSummary =
      'Tabelline, divisioni esatte e prime frazioni, analisi grammaticale e sinonimi, scienze e geografia, perimetri e angoli, artistica (colori complementari, chiaroscuro e grandi pittori), musica/orchestra e inglese A1+.';
    subjectsHighlight = [
      'Logica, Scienze & Geografia',
      'Grammatica, Sinonimi & Lessico',
      'Tabelline, Divisioni & Frazioni',
      'Artistica, Pittori & Geometria',
      'Musica, Durata Note & Orchestra',
      'Inglese Primaria Avanzato (A1+)',
    ];
    newlyAddedSubjects = [
      'Tabelline, Divisioni & Frazioni',
      'Geografia & Scienze',
      'Grammatica & Sinonimi',
      'Artistica: Complementari & Pittori',
    ];
    unlockedSubjectsCount = 8;
    difficultyBadge = 'Fascia 4/6 · Primaria Avanzata (8–9 anni)';
  } else if (years >= 10 && years <= 12) {
    ageBand = 'preteen_10_12';
    ageBandTitle = '10–12 Anni · 5ª Primaria & Medie';
    developmentalStage =
      'Percorso 10–12 Anni (Pre-Algebra, Potenze & Percentuali, Storia & Fisica, Analisi Logica, Arte Rinascimentale, Coding, Musica Classica & Inglese A2)';
    curriculumSummary =
      'Espressioni, potenze, percentuali ed equazioni intuitive, fisica e astronomia, storia e civica, analisi logica e figure retoriche, arte e prospettiva rinascimentale, logica/coding, grandi compositori e inglese A2.';
    subjectsHighlight = [
      'Logica, Coding & Probabilità',
      'Storia, Civica, Fisica & Astronomia',
      'Pre-Algebra, Potenze & Percentuali',
      'Analisi Logica & Figure Retoriche',
      'Arte, Prospettiva & Geometria',
      'Musica Classica, Tempi & Inglese A2',
    ];
    newlyAddedSubjects = [
      'Pre-Algebra, Potenze & %',
      'Storia, Civica & Fisica',
      'Coding & Pensiero Computazionale',
      'Prospettiva, Rinascimento & Inglese A2',
    ];
    unlockedSubjectsCount = 10;
    difficultyBadge = 'Fascia 5/6 · Medie (10–12 anni)';
  } else if (years >= 13) {
    ageBand = 'teen_13_14';
    ageBandTitle = '13–14 Anni · 3ª Media & Superiori';
    developmentalStage =
      'Percorso 13–14 Anni (Algebra & Radici, Chimica & Fisica, Letteratura & Analisi del Periodo, Arte Moderna & Volumi, Teoria Musicale, Algoritmi & Inglese B1)';
    curriculumSummary =
      'Equazioni algebriche, radici quadrate, proporzioni e Teorema di Pitagora, chimica/biologia cellulare e leggi di Newton, letteratura italiana e analisi del periodo, arte moderna e architettura, teoria musicale e acustica, logica booleana/algoritmi e inglese B1.';
    subjectsHighlight = [
      'Algebra, Equazioni, Radici & Pitagora',
      'Chimica, Biologia & Leggi della Fisica',
      'Letteratura & Analisi del Periodo',
      'Arte Moderna, Sezione Aurea & Solidi',
      'Teoria Musicale, Accordi & Acustica',
      'Algoritmi, Logica Booleana & Inglese B1',
    ];
    newlyAddedSubjects = [
      'Algebra, Radici & Proporzioni',
      'Chimica, DNA & Leggi di Newton',
      'Letteratura & Analisi del Periodo',
      'Algoritmi, Arte Moderna & Inglese B1',
    ];
    unlockedSubjectsCount = 12;
    difficultyBadge = 'Fascia 6/6 · Avanzato (13–14 anni)';
  }

  return {
    years,
    months,
    totalMonths,
    birthYear,
    birthMonth,
    birthDay,
    birthDateIso: iso,
    birthDateFormatted,
    displayText,
    shortAgeLabel,
    ageBand,
    ageBandTitle,
    developmentalStage,
    curriculumSummary,
    subjectsHighlight,
    newlyAddedSubjects,
    unlockedSubjectsCount,
    difficultyBadge,
  };
}

export type AdaptiveWindowDecisionCode =
  | 'increase_difficulty'
  | 'maintain_verify'
  | 'targeted_reinforcement'
  | 'reduce_slightly'
  | 'return_prerequisite';

export interface SubjectDifficultySpec {
  difficulty: ExerciseDifficultyScore;
  shortLabel: string;
  description: string;
  weight: number;
}

export const DIFFICULTY_LEVEL_SPECS: Record<ExerciseDifficultyScore, SubjectDifficultySpec> = {
  1: {
    difficulty: 1,
    shortLabel: 'Molto facile',
    description: 'Molto facile, riconoscimento',
    weight: 1.0,
  },
  2: {
    difficulty: 2,
    shortLabel: 'Facile',
    description: 'Facile, comprensione',
    weight: 1.25,
  },
  3: {
    difficulty: 3,
    shortLabel: 'Intermedia',
    description: 'Intermedia, applicazione',
    weight: 1.5,
  },
  4: {
    difficulty: 4,
    shortLabel: 'Avanzata',
    description: 'Avanzata, ragionamento',
    weight: 1.75,
  },
  5: {
    difficulty: 5,
    shortLabel: 'Esperta',
    description: 'Esperta, trasferimento e problem solving',
    weight: 2.0,
  },
};

/**
 * Evaluates a single exercise attempt according to Section 4.1 & 4.2 of the adaptive specification:
 * - Risposta autonoma (1st try, 0 hints): autonomy = 100, c_i = 1.00
 * - Un suggerimento (or 2nd try with 0 hints): autonomy = 75, c_i = 0.75
 * - Due suggerimenti (or 2nd try + 1 hint, or 3rd try): autonomy = 50, c_i = 0.50
 * - Risposta guidata (3+ hints or 4th try): autonomy = 25, c_i = 0.25
 * - Risposta fornita dal sistema (5+ attempts): autonomy = 0, c_i = 0.00
 */
export function evaluateSingleTrialMetrics(entry: {
  firstTry?: boolean;
  attempts?: number;
  hintsUsed?: number;
}): {
  c_i: number;
  autonomyScore: 100 | 75 | 50 | 25 | 0;
  responseModeLabel: string;
  isAutonomous: boolean;
} {
  const attempts = Math.max(1, entry.attempts || 1);
  const hints = Math.max(0, entry.hintsUsed || 0);
  const isAutonomous = Boolean(entry.firstTry) && attempts === 1 && hints === 0;

  if (isAutonomous) {
    return {
      c_i: 1.0,
      autonomyScore: 100,
      responseModeLabel: 'Risposta autonoma',
      isAutonomous: true,
    };
  }
  if ((attempts === 1 && hints === 1) || (attempts === 2 && hints === 0)) {
    return {
      c_i: 0.75,
      autonomyScore: 75,
      responseModeLabel: 'Un suggerimento',
      isAutonomous: false,
    };
  }
  if (
    (attempts === 1 && hints === 2) ||
    (attempts === 2 && hints === 1) ||
    (attempts === 3 && hints <= 1)
  ) {
    return {
      c_i: 0.5,
      autonomyScore: 50,
      responseModeLabel: 'Due suggerimenti',
      isAutonomous: false,
    };
  }
  if (attempts >= 5 || hints >= 4) {
    return {
      c_i: 0.0,
      autonomyScore: 0,
      responseModeLabel: 'Risposta fornita dal sistema',
      isAutonomous: false,
    };
  }
  return {
    c_i: 0.25,
    autonomyScore: 25,
    responseModeLabel: 'Risposta guidata',
    isAutonomous: false,
  };
}

export interface SubjectAdaptiveProfile {
  subjectId: GameCategory;
  subjectTitle: string;
  chcArea: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  ageInMonths: number;
  chronologicalBand: AgeBandId;
  effectiveBand: AgeBandId;
  indicativeEducationalAgeLabel: string; // es. "6–7 anni", "6 anni", "5–6 anni", "5 anni", "4–5 anni"
  educationalAgeOffsetYears: number;     // -1 .. +1.5 relative to chronological age
  targetDifficulty: ExerciseDifficultyScore; // 1..5
  difficultyLabel: string;
  difficultyDescription: string;
  difficultyWeight: number;
  effectiveTier: 1 | 2 | 3;
  adaptiveStatus: 'downgrade' | 'standard' | 'upgrade';
  supportLevel: 'guided' | 'balanced' | 'independent';
  maxOptions: 2 | 3 | 4;
  sampleCount: number;
  window10Count: number;
  window10EquivalentCorrect: number; // 0..10
  window10AutonomousCount: number;
  window10AssistedCount: number;
  window10AutonomyScore: number;     // 0..100
  decisionCode: AdaptiveWindowDecisionCode;
  decisionLabel: string;
  decisionExplanation: string;
}

export interface AdaptiveMasteryProfile {
  chronologicalBand: AgeBandId;
  effectiveBand: AgeBandId;
  adaptiveStatus: 'downgrade' | 'standard' | 'upgrade';
  effectiveTier: 1 | 2 | 3;
  targetDifficulty: ExerciseDifficultyScore;
  supportLevel: 'guided' | 'balanced' | 'independent';
  maxOptions: 2 | 3;
  boostLevel: 0 | 1 | 2 | 3;
  boostLabel: string;
  statusExplanation: string;
  earlyUnlockRatio: number;
  unlockedBonusSubjects: string[];
  nextThresholdHint: string;
  progressPercentToNext: number;
  solvedCount: number;
  accuracyPercent: number;
  autonomyPercent: number;
  recentAccuracyPercent: number;
  recentAutonomyPercent: number;
  consecutiveAutonomous: number;
  recentErrorCount: number;
  subjects: Record<GameCategory, SubjectAdaptiveProfile>;
}

const BONUS_SUBJECTS_BY_STEP: Record<AgeBandId, string[]> = {
  toddler_2_3: ['Educazione Emotiva & Empatia', 'Memoria Visiva', 'Sequenze di Colori'],
  preschool_4_5: ['Educazione Emotiva & Empatia', 'Memoria Visiva', 'Ecologia & Ambiente', 'Artistica: Mescolanza Colori'],
  early_primary_6_7: ['Ecologia & Ambiente', 'Orologio & Tempo', 'Artistica: Colori Caldi/Freddi', 'Prime Tabelline'],
  upper_primary_8_9: ['Astronomia & Universo', 'Geografia del Mondo', 'Educazione Finanziaria', 'Tabelline & Divisioni'],
  preteen_10_12: ['Invenzioni & Tecnologia', 'Pensiero Critico & Filosofia', 'Pre-Algebra & Potenze', 'Coding & Probabilità'],
  teen_13_14: ['Pensiero Critico & Filosofia', 'Astronomia Avanzata', 'Invenzioni & Codice Binario', 'Educazione Finanziaria'],
};

const SUBJECT_META: Record<
  GameCategory,
  { title: string; chcArea: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs' }
> = {
  logic: { title: 'Logica e ragionamento', chcArea: 'Gf' },
  numbers: { title: 'Matematica', chcArea: 'Gwm' },
  shapes: { title: 'Spazio e geometria', chcArea: 'Gv' },
  english: { title: 'Inglese', chcArea: 'Gc' },
  letters: { title: 'Linguaggio e italiano', chcArea: 'Gc' },
  music: { title: 'Memoria uditiva e ritmo', chcArea: 'Gwm' },
};

function formatIndicativeEducationalAge(baseYears: number, offset: number): string {
  const clampY = (y: number) => Math.max(2, Math.min(14, y));
  if (offset >= 1.25) {
    const low = clampY(baseYears + 1);
    const high = clampY(baseYears + 2);
    return low === high ? `${low} anni` : `${low}–${high} anni`;
  }
  if (offset >= 0.85) {
    return `${clampY(baseYears + 1)} anni`;
  }
  if (offset >= 0.35) {
    const low = clampY(baseYears);
    const high = clampY(baseYears + 1);
    return low === high ? `${low} anni` : `${low}–${high} anni`;
  }
  if (offset <= -0.6) {
    const low = clampY(baseYears - 1);
    const high = clampY(baseYears);
    return low === high ? `${low} anni` : `${low}–${high} anni`;
  }
  return `${clampY(baseYears)} anni`;
}

/**
 * Computes the independent adaptive learning state for a single subject (Section 2.1, 2.2, 2.3):
 * - Evaluates the sliding window of the last 10 significant exercises for that subject.
 * - Factors in both normalized correctness and discrete autonomy (100, 75, 50, 25, 0) so
 *   10 correct answers achieved via 7 hints are NEVER automatically promoted ("Mantieni e verifica").
 * - Determines the independent Difficulty (1..5), Indicative Educational Age, and effective AgeBand.
 */
export function computeSingleSubjectAdaptiveProfile(
  subjectId: GameCategory,
  ageInfo: ChildAgeInfo,
  subjectHistory: LevelPerformanceEntry[],
  fallbackStat?: { correct: number; total: number; attempts?: number; assistedSuccesses?: number; hintsUsed?: number }
): SubjectAdaptiveProfile {
  const meta = SUBJECT_META[subjectId];
  const baseBandIdx = AGE_BAND_ORDER.indexOf(ageInfo.ageBand);

  // Build effective entries list (combining explicit levelHistory with any legacy aggregate stats)
  const entries: LevelPerformanceEntry[] = [...subjectHistory];
  if (entries.length === 0 && fallbackStat && fallbackStat.total > 0) {
    const tot = Math.min(12, fallbackStat.total);
    const autoCount = Math.max(0, Math.min(tot, fallbackStat.correct - (fallbackStat.assistedSuccesses || 0)));
    for (let i = 0; i < tot; i++) {
      const isAuto = i < autoCount;
      entries.push({
        level: i + 1,
        tier: 2,
        weight: 1.25,
        category: subjectId,
        firstTry: isAuto,
        assistedSuccess: !isAuto,
        attempts: isAuto ? 1 : 2,
        hintsUsed: isAuto ? 0 : 1,
        starsEarned: isAuto ? 3 : 2,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const sampleCount = Math.max(entries.length, fallbackStat?.total || 0);
  const window10 = entries.slice(-10);
  const windowN = window10.length;

  // Baseline starting difficulty calibrated on chronological age in months (Section 2.1)
  const monthWithinYear = ageInfo.months;
  const initialDifficulty: ExerciseDifficultyScore = monthWithinYear >= 7 ? 2 : 2;

  if (windowN === 0) {
    const spec = DIFFICULTY_LEVEL_SPECS[initialDifficulty];
    return {
      subjectId,
      subjectTitle: meta.title,
      chcArea: meta.chcArea,
      ageInMonths: ageInfo.totalMonths,
      chronologicalBand: ageInfo.ageBand,
      effectiveBand: ageInfo.ageBand,
      indicativeEducationalAgeLabel: `${ageInfo.years} anni`,
      educationalAgeOffsetYears: 0,
      targetDifficulty: initialDifficulty,
      difficultyLabel: spec.shortLabel,
      difficultyDescription: spec.description,
      difficultyWeight: spec.weight,
      effectiveTier: 1,
      adaptiveStatus: 'standard',
      supportLevel: ageInfo.years <= 3 ? 'guided' : 'balanced',
      maxOptions: ageInfo.years <= 2 ? 2 : 3,
      sampleCount: 0,
      window10Count: 0,
      window10EquivalentCorrect: 0,
      window10AutonomousCount: 0,
      window10AssistedCount: 0,
      window10AutonomyScore: 0,
      decisionCode: 'maintain_verify',
      decisionLabel: 'Valutazione iniziale',
      decisionExplanation: `Percorso iniziale calibrato sull'età anagrafica (${ageInfo.displayText}).`,
    };
  }

  let sumCi = 0;
  let sumAutonomy = 0;
  let autonomousCount = 0;
  let assistedCount = 0;

  window10.forEach((e) => {
    const ev = evaluateSingleTrialMetrics(e);
    sumCi += ev.c_i;
    sumAutonomy += ev.autonomyScore;
    if (ev.isAutonomous) {
      autonomousCount++;
    } else {
      assistedCount++;
    }
  });

  // Normalized performance & autonomy across the sliding window of up to 10 exercises
  const meanCi = sumCi / windowN;
  const windowAutonomyScore = Math.round(sumAutonomy / windowN);
  // Equivalent correct answers on a 10-exercise scale:
  // Combines raw solved count with autonomy-adjusted c_i so hint-heavy answers do not count as full autonomous successes
  const rawSuccessRateInWindow =
    window10.filter((e) => evaluateSingleTrialMetrics(e).c_i > 0).length / windowN;
  const effectiveSuccessRatio = rawSuccessRateInWindow * 0.45 + meanCi * 0.55;
  const equivalentCorrectOutOf10 = Math.max(
    0,
    Math.min(10, Math.round(effectiveSuccessRatio * 10))
  );

  // Section 2.3: Mathematical decision table on the sliding window of 10 exercises
  let decisionCode: AdaptiveWindowDecisionCode = 'maintain_verify';
  let decisionLabel = 'Mantieni e verifica';
  let decisionExplanation = '';
  let targetDifficulty: ExerciseDifficultyScore = 2;
  let educationalAgeOffsetYears = 0;
  let adaptiveStatus: 'downgrade' | 'standard' | 'upgrade' = 'standard';

  const hasEnoughForPromotion = windowN >= 3;

  if (equivalentCorrectOutOf10 >= 9 && windowAutonomyScore >= 75 && hasEnoughForPromotion) {
    decisionCode = 'increase_difficulty';
    decisionLabel = 'Aumenta difficoltà';
    adaptiveStatus = 'upgrade';
    if (sampleCount >= 12 && windowAutonomyScore >= 88 && equivalentCorrectOutOf10 === 10) {
      targetDifficulty = 5;
      educationalAgeOffsetYears = 1.35;
    } else if (sampleCount >= 6 && windowAutonomyScore >= 82) {
      targetDifficulty = 4;
      educationalAgeOffsetYears = 0.9;
    } else {
      targetDifficulty = 3;
      educationalAgeOffsetYears = 0.45;
    }
    decisionExplanation = `${equivalentCorrectOutOf10}/10 equivalenti corretti con autonomia elevata (IA ${windowAutonomyScore}/100): aumento graduale della complessità cognitiva (Difficoltà ${targetDifficulty}/5).`;
  } else if (equivalentCorrectOutOf10 >= 8 || (rawSuccessRateInWindow >= 0.85 && windowAutonomyScore < 75)) {
    decisionCode = 'maintain_verify';
    decisionLabel = 'Mantieni e verifica';
    adaptiveStatus = 'standard';
    targetDifficulty = windowAutonomyScore >= 72 && sampleCount >= 5 ? 3 : 2;
    educationalAgeOffsetYears = windowAutonomyScore >= 75 ? 0.35 : 0;
    decisionExplanation =
      windowAutonomyScore < 75
        ? `Risposte corrette ma con ricorso ai suggerimenti (IA ${windowAutonomyScore}/100, ${assistedCount} assistiti): nessuna promozione automatica finché l'autonomia non è consolidata.`
        : `${equivalentCorrectOutOf10}/10 nella finestra mobile (IA ${windowAutonomyScore}/100): livello mantenuto con prove di verifica della stabilità.`;
  } else if (equivalentCorrectOutOf10 >= 6) {
    decisionCode = 'targeted_reinforcement';
    decisionLabel = 'Mantieni, proponi rinforzo mirato';
    adaptiveStatus = 'standard';
    targetDifficulty = 2;
    educationalAgeOffsetYears = 0;
    decisionExplanation = `${equivalentCorrectOutOf10}/10 nella finestra mobile (IA ${windowAutonomyScore}/100): consolidamento con esercizi di rinforzo mirato sulla competenza attuale.`;
  } else if (equivalentCorrectOutOf10 >= 4) {
    decisionCode = 'reduce_slightly';
    decisionLabel = 'Riduci leggermente';
    adaptiveStatus = 'downgrade';
    targetDifficulty = 2;
    educationalAgeOffsetYears = -0.65;
    decisionExplanation = `${equivalentCorrectOutOf10}/10 nella finestra mobile (IA ${windowAutonomyScore}/100): riduzione leggera della difficoltà con supporto guidato.`;
  } else {
    decisionCode = 'return_prerequisite';
    decisionLabel = 'Torna a un prerequisito più semplice';
    adaptiveStatus = 'downgrade';
    targetDifficulty = 1;
    educationalAgeOffsetYears = -1.0;
    decisionExplanation = `${equivalentCorrectOutOf10}/10 nella finestra mobile (IA ${windowAutonomyScore}/100): ritorno automatico a un prerequisito più semplice (Difficoltà 1/5) per ricostruire sicurezza.`;
  }

  // Compute subject-specific effectiveBand:
  // - Fundamental rule (Section 2.3): increasing difficulty primarily increases cognitive complexity (1..5) within the child's developmental stage.
  // - When a subject reaches sustained Advanced/Expert mastery (targetDifficulty >= 4) and chronological age >= 5, allow +1 educational band for that specific subject (never pushing 2-3yo toddlers into reading/arithmetic!).
  // - On downgrade/return_prerequisite, allow stepping back -1 band (down to toddler_2_3 / preschool_4_5) to reinforce prerequisites.
  let bandShift = 0;
  if (adaptiveStatus === 'upgrade' && targetDifficulty >= 4 && ageInfo.years >= 4) {
    bandShift = ageInfo.years <= 3 ? 0 : 1;
  } else if (decisionCode === 'return_prerequisite' && baseBandIdx > 0) {
    bandShift = -1;
  }
  const effectiveBandIdx = Math.max(0, Math.min(AGE_BAND_ORDER.length - 1, baseBandIdx + bandShift));
  const effectiveBand = AGE_BAND_ORDER[effectiveBandIdx];

  const effectiveTier: 1 | 2 | 3 =
    targetDifficulty >= 4 ? 3 : targetDifficulty === 3 ? 2 : 1;

  const supportLevel: 'guided' | 'balanced' | 'independent' =
    adaptiveStatus === 'downgrade' || targetDifficulty === 1 || ageInfo.years <= 3
      ? 'guided'
      : targetDifficulty >= 4
      ? 'independent'
      : 'balanced';

  const maxOptions: 2 | 3 | 4 =
    ageInfo.years <= 2 || (ageInfo.years <= 5 && adaptiveStatus === 'downgrade')
      ? 2
      : targetDifficulty >= 4 && ageInfo.years >= 6
      ? 4
      : 3;

  const spec = DIFFICULTY_LEVEL_SPECS[targetDifficulty];

  return {
    subjectId,
    subjectTitle: meta.title,
    chcArea: meta.chcArea,
    ageInMonths: ageInfo.totalMonths,
    chronologicalBand: ageInfo.ageBand,
    effectiveBand,
    indicativeEducationalAgeLabel: formatIndicativeEducationalAge(
      ageInfo.years,
      educationalAgeOffsetYears
    ),
    educationalAgeOffsetYears,
    targetDifficulty,
    difficultyLabel: spec.shortLabel,
    difficultyDescription: spec.description,
    difficultyWeight: spec.weight,
    effectiveTier,
    adaptiveStatus,
    supportLevel,
    maxOptions,
    sampleCount,
    window10Count: windowN,
    window10EquivalentCorrect: equivalentCorrectOutOf10,
    window10AutonomousCount: autonomousCount,
    window10AssistedCount: assistedCount,
    window10AutonomyScore: windowAutonomyScore,
    decisionCode,
    decisionLabel,
    decisionExplanation,
  };
}

/**
 * Bidirectional Adaptive Progression Engine with Independent Per-Subject Levels (Section 2 of PDF):
 * - Computes an independent adaptive profile for each of the 6 subjects (`subjects[category]`).
 * - Also provides global summary indicators for the header and general status badges.
 */
export function computeAdaptiveMasteryProfile(progress?: UserProgress): AdaptiveMasteryProfile {
  const ageInfo = calculateChildAge(progress?.childProfile?.birthDate);
  const baseIdx = AGE_BAND_ORDER.indexOf(ageInfo.ageBand);
  const rawHistory = progress?.levelHistory || [];
  // Exclude adult/parent test taps detected by local telemetry so parent previews never distort child progression
  const history = rawHistory.filter(isValidChildEntry);
  const solvedCount =
    history.length > 0
      ? history.length
      : Math.max(0, (progress?.totalPuzzlesSolved || 0) - (progress?.adultFilteredCount || 0));

  const allCategories: GameCategory[] = ['logic', 'numbers', 'shapes', 'letters', 'music', 'english'];
  const subjects = {} as Record<GameCategory, SubjectAdaptiveProfile>;
  allCategories.forEach((cat) => {
    const catHistory = history.filter((h) => h.category === cat);
    const catStat = progress?.categoryStats?.[cat];
    subjects[cat] = computeSingleSubjectAdaptiveProfile(cat, ageInfo, catHistory, catStat);
  });

  const recent = history.slice(-15);
  const recentLast5 = history.slice(-5);

  let accuracyPercent = 0;
  let autonomyPercent = 0;
  let recentAccuracyPercent = 0;
  let recentAutonomyPercent = 0;
  let recentErrorCount = 0;
  let consecutiveAutonomous = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const ev = evaluateSingleTrialMetrics(history[i]);
    if (ev.isAutonomous) {
      consecutiveAutonomous++;
    } else {
      break;
    }
  }

  const computeWindowStats = (items: typeof history) => {
    if (items.length === 0) return { acc: 0, auto: 0, errors: 0 };
    let wTotal = 0;
    let wCorrect = 0;
    let wAutonomy = 0;
    let errors = 0;
    const n = items.length;

    items.forEach((h, idx) => {
      const diffWeight = h.weight ?? 1.25;
      const recency = Math.pow(0.92, n - 1 - idx);
      const effW = diffWeight * recency;
      const ev = evaluateSingleTrialMetrics(h);
      if (!ev.isAutonomous) errors++;

      wTotal += effW;
      wCorrect += effW * ev.c_i;
      wAutonomy += effW * (ev.autonomyScore / 100);
    });

    return {
      acc: Math.round((wCorrect / Math.max(0.001, wTotal)) * 100),
      auto: Math.round((wAutonomy / Math.max(0.001, wTotal)) * 100),
      errors,
    };
  };

  if (recent.length > 0) {
    const overallStats = computeWindowStats(recent);
    const last5Stats = computeWindowStats(recentLast5);
    accuracyPercent = overallStats.acc;
    autonomyPercent = overallStats.auto;
    recentAccuracyPercent = last5Stats.acc;
    recentAutonomyPercent = last5Stats.auto;
    recentErrorCount = last5Stats.errors;
  } else if (progress?.categoryStats) {
    const cats = Object.values(progress.categoryStats).filter(Boolean);
    const total = cats.reduce((acc, c) => acc + (c?.total || 0), 0);
    const correct = cats.reduce((acc, c) => acc + (c?.correct || 0), 0);
    if (total > 0) {
      accuracyPercent = Math.round((correct / total) * 100);
      autonomyPercent = accuracyPercent;
      recentAccuracyPercent = accuracyPercent;
      recentAutonomyPercent = accuracyPercent;
    }
  }

  // Aggregate subject difficulties to determine global overview state
  const activeSubjects = allCategories
    .map((c) => subjects[c])
    .filter((s) => s.sampleCount > 0);
  const avgSubjectDifficulty =
    activeSubjects.length > 0
      ? Math.round(
          activeSubjects.reduce((acc, s) => acc + s.targetDifficulty, 0) /
            activeSubjects.length
        )
      : 2;
  const targetDifficulty = Math.max(1, Math.min(5, avgSubjectDifficulty)) as ExerciseDifficultyScore;

  const anyDowngrade = activeSubjects.some((s) => s.adaptiveStatus === 'downgrade');
  const upgradeCount = activeSubjects.filter((s) => s.adaptiveStatus === 'upgrade').length;

  let adaptiveStatus: 'downgrade' | 'standard' | 'upgrade' = 'standard';
  let boostLevel: 0 | 1 | 2 | 3 = 0;
  let effectiveTier: 1 | 2 | 3 = targetDifficulty >= 4 ? 3 : targetDifficulty === 3 ? 2 : 1;
  let supportLevel: 'guided' | 'balanced' | 'independent' =
    ageInfo.years <= 3 ? 'guided' : 'balanced';
  let earlyUnlockRatio = 0;
  let boostLabel = `Personalizzato per Materia · ${ageInfo.shortAgeLabel}`;
  let statusExplanation =
    'Ogni materia evolve in modo indipendente secondo la finestra mobile degli ultimi 10 esercizi, bilanciando risposte corrette e autonomia.';
  let nextThresholdHint =
    'Ottieni 9–10 risposte corrette su 10 con autonomia elevata (IA ≥ 75) in una materia per aumentarne la difficoltà.';
  let progressPercentToNext = Math.min(
    99,
    Math.round(
      ((Math.min(solvedCount, 10) / 10) * 0.45 +
        (Math.min(accuracyPercent, 85) / 85) * 0.35 +
        (Math.min(autonomyPercent, 80) / 80) * 0.2) *
        100
    )
  );

  if (anyDowngrade && upgradeCount === 0) {
    adaptiveStatus = 'downgrade';
    boostLevel = 0;
    effectiveTier = 1;
    supportLevel = 'guided';
    boostLabel = 'Rinforzo Mirato per Materia · Supporto Attivo';
    statusExplanation =
      'Il motore adattivo ha ridotto gradualmente la difficoltà nelle materie con esitazioni o aiuti frequenti, mantenendo invariate le materie più forti.';
    nextThresholdHint =
      'Rispondi in autonomia senza suggerimenti nelle prossime prove della materia per risalire di difficoltà.';
  } else if (upgradeCount >= 1) {
    adaptiveStatus = 'upgrade';
    boostLevel = targetDifficulty >= 4 ? 2 : 1;
    effectiveTier = targetDifficulty >= 4 ? 3 : 2;
    supportLevel = ageInfo.years <= 5 ? 'balanced' : 'independent';
    earlyUnlockRatio = ageInfo.years <= 3 ? 0.2 : 0.35;
    boostLabel = `Percorso Adattivo Personalizzato (${upgradeCount} ${upgradeCount === 1 ? 'materia avanzata' : 'materie avanzate'})`;
    statusExplanation =
      'Progressione differenziata attiva: il bambino affronta sfide di livello superiore nelle materie padroneggiate e consolidamento graduale nelle altre.';
    progressPercentToNext = 100;
  }

  const maxAllowedShift = ageInfo.years <= 7 ? 0 : boostLevel >= 2 ? 1 : 0;
  const bandShift = adaptiveStatus === 'upgrade' ? Math.min(1, maxAllowedShift) : 0;
  const effectiveIdx = Math.min(AGE_BAND_ORDER.length - 1, baseIdx + bandShift);
  const effectiveBand = AGE_BAND_ORDER[effectiveIdx];

  const maxOptions: 2 | 3 =
    ageInfo.years <= 2 ||
    (ageInfo.years <= 5 && adaptiveStatus === 'downgrade') ||
    (ageInfo.years === 3 && solvedCount < 6)
      ? 2
      : 3;

  const baseBonus = BONUS_SUBJECTS_BY_STEP[ageInfo.ageBand] || [];
  const nextBandBonus =
    effectiveIdx > baseIdx ? BONUS_SUBJECTS_BY_STEP[effectiveBand] || [] : [];

  const unlockedBonusSubjects =
    adaptiveStatus !== 'upgrade' || boostLevel === 0
      ? []
      : boostLevel === 1
      ? baseBonus.slice(0, 2)
      : Array.from(new Set([...baseBonus, ...nextBandBonus]));

  return {
    chronologicalBand: ageInfo.ageBand,
    effectiveBand,
    adaptiveStatus,
    effectiveTier,
    targetDifficulty,
    supportLevel,
    maxOptions,
    boostLevel,
    boostLabel,
    statusExplanation,
    earlyUnlockRatio,
    unlockedBonusSubjects,
    nextThresholdHint,
    progressPercentToNext,
    solvedCount,
    accuracyPercent,
    autonomyPercent,
    recentAccuracyPercent,
    recentAutonomyPercent,
    consecutiveAutonomous,
    recentErrorCount,
    subjects,
  };
}

export function getDisplayChildName(profile?: ChildProfile): string {
  const clean = profile?.name?.trim();
  if (clean) return clean;
  if (profile?.gender === 'f') return 'Piccola Esploratrice';
  if (profile?.gender === 'm') return 'Piccolo Esploratore';
  return 'Esploratore';
}

export function getFullChildName(profile?: ChildProfile): string {
  const name = profile?.name?.trim();
  const surname = profile?.surname?.trim();
  if (name && surname) return `${name} ${surname}`;
  if (name) return name;
  return 'Bambino / Bambina';
}

export function getWorldTitle(profile?: ChildProfile): { prefix: string; childName: string | null; full: string } {
  const clean = profile?.name?.trim();
  if (clean) {
    return {
      prefix: 'Il Mondo di ',
      childName: clean,
      full: `Il Mondo di ${clean}`,
    };
  }
  return {
    prefix: 'Il Mio ',
    childName: 'Mondo',
    full: 'Il Mio Mondo',
  };
}

export function getGenderedWord(
  gender: ChildGender | undefined,
  fem: string,
  masc: string,
  neutral?: string
): string {
  if (gender === 'f') return fem;
  if (gender === 'm') return masc;
  return neutral ?? masc;
}

/**
 * Compresses an uploaded image File into a lightweight JPEG Data URL (<= ~150KB)
 * so it can be stored safely in localStorage and rendered crisply full-screen.
 */
export function compressUploadedImage(
  file: File,
  maxDimension = 1280,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Seleziona un file immagine valido (JPG, PNG, WEBP).'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      reject(new Error('L\'immagine supera i 20 MB. Scegli una foto più leggera.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere la foto selezionata.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato immagine non supportato dal browser.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas non disponibile per l\'elaborazione dell\'immagine.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Errore durante la compressione della foto.'));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export interface BirthdayStatus {
  hasBirthDate: boolean;
  isBirthdayToday: boolean;
  isBirthdayCountdownSoon: boolean;
  daysUntilBirthday: number;
  turningAgeYears: number;
  birthDay: number;
  birthMonth: number;
  nextBirthdayFormatted: string;
  todayBirthdayYearKey: string;
}

const ITALIAN_MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

export function getBirthdayStatus(birthDate?: string): BirthdayStatus {
  const normalized = normalizeBirthDateString(birthDate);
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  if (!normalized) {
    return {
      hasBirthDate: false,
      isBirthdayToday: false,
      isBirthdayCountdownSoon: false,
      daysUntilBirthday: 365,
      turningAgeYears: 4,
      birthDay: 1,
      birthMonth: 1,
      nextBirthdayFormatted: 'Da configurare',
      todayBirthdayYearKey: `${currentYear}`,
    };
  }

  const [bYearStr, bMonthStr, bDayStr] = normalized.split('-');
  const bYear = parseInt(bYearStr, 10);
  const bMonth = parseInt(bMonthStr, 10);
  const bDay = parseInt(bDayStr, 10);

  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const effectiveBirthDayThisYear =
    bMonth === 2 && bDay === 29 && !isLeapYear(currentYear) ? 28 : bDay;

  const isBirthdayToday =
    todayMonth === bMonth && todayDay === effectiveBirthDayThisYear;

  const todayMidnight = new Date(currentYear, todayMonth - 1, todayDay).getTime();
  let nextBdayDate = new Date(currentYear, bMonth - 1, effectiveBirthDayThisYear);
  let nextBdayYear = currentYear;

  if (nextBdayDate.getTime() < todayMidnight) {
    nextBdayYear = currentYear + 1;
    const nextYearDay =
      bMonth === 2 && bDay === 29 && !isLeapYear(nextBdayYear) ? 28 : bDay;
    nextBdayDate = new Date(nextBdayYear, bMonth - 1, nextYearDay);
  }

  const daysUntilBirthday = isBirthdayToday
    ? 0
    : Math.max(1, Math.round((nextBdayDate.getTime() - todayMidnight) / 86_400_000));

  const turningAgeYears = Math.max(1, Math.min(18, nextBdayYear - bYear));
  const monthLabel = ITALIAN_MONTH_NAMES[Math.max(0, Math.min(11, bMonth - 1))];

  return {
    hasBirthDate: true,
    isBirthdayToday,
    isBirthdayCountdownSoon: !isBirthdayToday && daysUntilBirthday <= 7,
    daysUntilBirthday,
    turningAgeYears,
    birthDay: bDay,
    birthMonth: bMonth,
    nextBirthdayFormatted: `${bDay} ${monthLabel}`,
    todayBirthdayYearKey: `${currentYear}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`,
  };
}

export type AgeVisualStageId =
  | 'early_childhood'   // 2-5 anni: Mondo Fiabesco
  | 'primary_explorer'  // 6-8 anni: Accademia Esploratori
  | 'preteen_campus'    // 9-11 anni: Campus Scienze & Logica
  | 'teen_nextgen';     // 12-14 anni: NextGen Minimal Studio

export interface GenderSystemPalette {
  gender: ChildGender;
  label: string;
  accentHex: string;
  accentSoftHex: string;
  accentBgClass: string;
  accentBgHoverClass: string;
  accentTextClass: string;
  accentSoftBgClass: string;
  accentBorderClass: string;
  accentRingClass: string;
  tabActiveClass: string;
  badgeClass: string;
  headerGradientClass: string;
}

/**
 * Returns tasteful, high-contrast system colors tailored to the user's gender ('f' | 'm' | 'n')
 * and progressively refined in saturation/sobriety as the user grows older.
 */
export function getGenderSystemPalette(
  gender: ChildGender | undefined = 'n',
  stageId: AgeVisualStageId = 'early_childhood'
): GenderSystemPalette {
  const g: ChildGender = gender === 'f' || gender === 'm' ? gender : 'n';
  const isTeen = stageId === 'teen_nextgen';
  const isCampus = stageId === 'preteen_campus';
  const isMature = isTeen || isCampus;

  if (g === 'f') {
    if (isTeen) {
      return {
        gender: 'f',
        label: 'Rose Slate',
        accentHex: '#e11d48',
        accentSoftHex: 'rgba(244, 63, 94, 0.14)',
        accentBgClass: 'bg-rose-600 text-white',
        accentBgHoverClass: 'hover:bg-rose-500',
        accentTextClass: 'text-rose-300',
        accentSoftBgClass: 'bg-rose-500/12 text-rose-200 border-rose-400/25',
        accentBorderClass: 'border-rose-400/35',
        accentRingClass: 'ring-rose-400/50',
        tabActiveClass: 'bg-rose-600 text-white shadow-xs',
        badgeClass: 'bg-rose-500/15 text-rose-200 border border-rose-400/30',
        headerGradientClass: 'from-slate-900 via-slate-900 to-rose-950/60',
      };
    }
    if (isCampus) {
      return {
        gender: 'f',
        label: 'Berry Indigo',
        accentHex: '#db2777',
        accentSoftHex: 'rgba(236, 72, 153, 0.16)',
        accentBgClass: 'bg-pink-600 text-white',
        accentBgHoverClass: 'hover:bg-pink-500',
        accentTextClass: 'text-pink-300',
        accentSoftBgClass: 'bg-pink-500/15 text-pink-200 border-pink-400/30',
        accentBorderClass: 'border-pink-400/35',
        accentRingClass: 'ring-pink-400/50',
        tabActiveClass: 'bg-pink-600 text-white shadow-xs',
        badgeClass: 'bg-pink-500/15 text-pink-200 border border-pink-400/30',
        headerGradientClass: 'from-slate-900 via-slate-900 to-pink-950/70',
      };
    }
    return {
      gender: 'f',
      label: isMature ? 'Rose' : 'Rosa Corallo',
      accentHex: '#ec4899',
      accentSoftHex: 'rgba(236, 72, 153, 0.14)',
      accentBgClass: 'bg-gradient-to-b from-rose-400 to-pink-600 text-white',
      accentBgHoverClass: 'hover:brightness-105',
      accentTextClass: 'text-rose-700',
      accentSoftBgClass: 'bg-rose-50 text-rose-800 border-rose-200',
      accentBorderClass: 'border-rose-300',
      accentRingClass: 'ring-rose-300',
      tabActiveClass: 'bg-gradient-to-b from-rose-400 to-pink-600 text-white shadow-sm',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
      headerGradientClass: 'from-rose-500 via-pink-500 to-fuchsia-600',
    };
  }

  if (g === 'm') {
    if (isTeen) {
      return {
        gender: 'm',
        label: 'Cobalt Slate',
        accentHex: '#2563eb',
        accentSoftHex: 'rgba(56, 189, 248, 0.14)',
        accentBgClass: 'bg-sky-600 text-white',
        accentBgHoverClass: 'hover:bg-sky-500',
        accentTextClass: 'text-sky-300',
        accentSoftBgClass: 'bg-sky-500/12 text-sky-200 border-sky-400/25',
        accentBorderClass: 'border-sky-400/35',
        accentRingClass: 'ring-sky-400/50',
        tabActiveClass: 'bg-sky-600 text-white shadow-xs',
        badgeClass: 'bg-sky-500/15 text-sky-200 border border-sky-400/30',
        headerGradientClass: 'from-slate-900 via-slate-900 to-sky-950/60',
      };
    }
    if (isCampus) {
      return {
        gender: 'm',
        label: 'Ocean Cobalt',
        accentHex: '#0284c7',
        accentSoftHex: 'rgba(14, 165, 233, 0.16)',
        accentBgClass: 'bg-blue-600 text-white',
        accentBgHoverClass: 'hover:bg-blue-500',
        accentTextClass: 'text-sky-300',
        accentSoftBgClass: 'bg-blue-500/15 text-sky-200 border-sky-400/30',
        accentBorderClass: 'border-sky-400/35',
        accentRingClass: 'ring-sky-400/50',
        tabActiveClass: 'bg-blue-600 text-white shadow-xs',
        badgeClass: 'bg-sky-500/15 text-sky-200 border border-sky-400/30',
        headerGradientClass: 'from-slate-900 via-slate-900 to-blue-950/70',
      };
    }
    return {
      gender: 'm',
      label: 'Azzurro Oceano',
      accentHex: '#0284c7',
      accentSoftHex: 'rgba(2, 132, 199, 0.14)',
      accentBgClass: 'bg-gradient-to-b from-sky-400 to-blue-600 text-white',
      accentBgHoverClass: 'hover:brightness-105',
      accentTextClass: 'text-sky-700',
      accentSoftBgClass: 'bg-sky-50 text-sky-800 border-sky-200',
      accentBorderClass: 'border-sky-300',
      accentRingClass: 'ring-sky-300',
      tabActiveClass: 'bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-sm',
      badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
      headerGradientClass: 'from-sky-500 via-blue-600 to-indigo-600',
    };
  }

  // Neutral ('n')
  if (isTeen) {
    return {
      gender: 'n',
      label: 'Sage Slate',
      accentHex: '#0d9488',
      accentSoftHex: 'rgba(20, 184, 166, 0.14)',
      accentBgClass: 'bg-teal-600 text-white',
      accentBgHoverClass: 'hover:bg-teal-500',
      accentTextClass: 'text-teal-300',
      accentSoftBgClass: 'bg-teal-500/12 text-teal-200 border-teal-400/25',
      accentBorderClass: 'border-teal-400/35',
      accentRingClass: 'ring-teal-400/50',
      tabActiveClass: 'bg-teal-600 text-white shadow-xs',
      badgeClass: 'bg-teal-500/15 text-teal-200 border border-teal-400/30',
      headerGradientClass: 'from-slate-900 via-slate-900 to-teal-950/60',
    };
  }
  if (isCampus) {
    return {
      gender: 'n',
      label: 'Emerald Slate',
      accentHex: '#059669',
      accentSoftHex: 'rgba(16, 185, 129, 0.16)',
      accentBgClass: 'bg-emerald-600 text-white',
      accentBgHoverClass: 'hover:bg-emerald-500',
      accentTextClass: 'text-emerald-300',
      accentSoftBgClass: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
      accentBorderClass: 'border-emerald-400/35',
      accentRingClass: 'ring-emerald-400/50',
      tabActiveClass: 'bg-emerald-600 text-white shadow-xs',
      badgeClass: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
      headerGradientClass: 'from-slate-900 via-slate-900 to-emerald-950/70',
    };
  }
  return {
    gender: 'n',
    label: 'Smeraldo Solare',
    accentHex: '#10b981',
    accentSoftHex: 'rgba(16, 185, 129, 0.14)',
    accentBgClass: 'bg-gradient-to-b from-emerald-400 to-teal-600 text-white',
    accentBgHoverClass: 'hover:brightness-105',
    accentTextClass: 'text-emerald-700',
    accentSoftBgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBorderClass: 'border-emerald-300',
    accentRingClass: 'ring-emerald-300',
    tabActiveClass: 'bg-gradient-to-b from-emerald-400 to-teal-600 text-white shadow-sm',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    headerGradientClass: 'from-emerald-500 via-teal-600 to-cyan-600',
  };
}

export interface AgeVisualTheme {
  stageId: AgeVisualStageId;
  stageBadge: string;
  stageSubtitle: string;
  isMatureTheme: boolean;
  isMinimalTheme: boolean;
  showAnimalMascotGuides: boolean;
  guideRolePrefix: string;
  fontHeadingClass: string;
  cardRadiusClass: string;
  bgOverlayClass: string;
  headerSurfaceClass: string;
  headerTitleColorClass: string;
  headerAccentColorClass: string;
  primaryCtaGradientClass: string;
  primaryCtaBorderClass: string;
  primaryCtaTextClass: string;
  genderPalette: GenderSystemPalette;
  secondaryCardClasses: {
    chest: string;
    svago: string;
    studio: string;
    zoo: string;
  };
  labels: {
    worldPrefix: string;
    playMainTitle: (level: number) => string;
    playMainSub: string;
    dailyMissionTitle: string;
    chestTitle: string;
    chestSub: string;
    svagoTitle: string;
    svagoSub: string;
    studioTitle: string;
    studioSub: string;
    zooTitle: string;
    zooSub: string;
  };
}

/**
 * Gradually evolves the app's visual graphic design, typography, palette, and terminology
 * as the user grows from 2 to 14 years old — moving from a warm fairytale world (2-5)
 * to a clean Explorer Academy (6-8), a sober STEM & Logic Campus (9-11), and an ultra-minimal
 * monochrome NextGen Studio (12-14), while respecting the user's gender for system accent colors.
 */
export function getAgeVisualTheme(
  ageYears: number,
  childName?: string,
  gender: ChildGender | undefined = 'n'
): AgeVisualTheme {
  const cleanName = childName?.trim() || '';

  // STAGE 4: 12-14 ANNI (Ultra-Minimal & Sober NextGen Studio + Gender System Accent)
  if (ageYears >= 12) {
    const genderPalette = getGenderSystemPalette(gender, 'teen_nextgen');
    return {
      stageId: 'teen_nextgen',
      stageBadge: 'Studio · 12–14 Anni',
      stageSubtitle: 'Logica, STEM & Problem Solving',
      isMatureTheme: true,
      isMinimalTheme: true,
      showAnimalMascotGuides: false,
      guideRolePrefix: 'Coach Didattico',
      fontHeadingClass: 'font-fun tracking-tight',
      cardRadiusClass: 'rounded-xl',
      bgOverlayClass:
        'bg-gradient-to-b from-slate-950/94 via-slate-950/92 to-slate-950/96',
      headerSurfaceClass:
        `bg-slate-900/95 border ${genderPalette.accentBorderClass} shadow-sm`,
      headerTitleColorClass: 'text-slate-100',
      headerAccentColorClass: genderPalette.accentTextClass,
      primaryCtaGradientClass: 'bg-slate-900',
      primaryCtaBorderClass: `border ${genderPalette.accentBorderClass}`,
      primaryCtaTextClass: 'text-white',
      genderPalette,
      secondaryCardClasses: {
        chest: 'bg-slate-900/95 border border-white/10 text-slate-100',
        svago: 'bg-slate-900/95 border border-white/10 text-slate-100',
        studio: 'bg-slate-900/95 border border-white/10 text-slate-100',
        zoo: 'bg-slate-900/95 border border-white/10 text-slate-100',
      },
      labels: {
        worldPrefix: cleanName ? `Workspace · ${cleanName}` : 'Learning Studio',
        playMainTitle: (lvl) => `Sessione #${lvl}`,
        playMainSub: 'Logica, STEM & Ragionamento',
        dailyMissionTitle: 'Target Giornaliero (5 Moduli)',
        chestTitle: 'Traguardi & Badge',
        chestSub: 'Progressi & Archivio',
        svagoTitle: 'Mind Games',
        svagoSub: 'Labirinto · Analisi · Strategia',
        studioTitle: 'Sketchpad',
        studioSub: 'Tavola Grafica Minimal',
        zooTitle: 'Bio-Acustica',
        zooSub: 'Etologia & Suoni Natura',
      },
    };
  }

  // STAGE 3: 9-11 ANNI (Sober & Clean Campus + Gender System Accent)
  if (ageYears >= 9) {
    const genderPalette = getGenderSystemPalette(gender, 'preteen_campus');
    return {
      stageId: 'preteen_campus',
      stageBadge: 'Campus · 9–11 Anni',
      stageSubtitle: 'Logica, Scienze & Lingue',
      isMatureTheme: true,
      isMinimalTheme: true,
      showAnimalMascotGuides: false,
      guideRolePrefix: 'Tutor del Campus',
      fontHeadingClass: 'font-fun tracking-tight',
      cardRadiusClass: 'rounded-2xl',
      bgOverlayClass:
        'bg-gradient-to-b from-slate-950/86 via-slate-900/82 to-slate-950/92',
      headerSurfaceClass:
        `bg-slate-900/94 border ${genderPalette.accentBorderClass} shadow-md`,
      headerTitleColorClass: 'text-white',
      headerAccentColorClass: genderPalette.accentTextClass,
      primaryCtaGradientClass: 'bg-slate-900',
      primaryCtaBorderClass: `border ${genderPalette.accentBorderClass}`,
      primaryCtaTextClass: 'text-white',
      genderPalette,
      secondaryCardClasses: {
        chest: 'bg-slate-900/92 border border-white/12 text-white',
        svago: 'bg-slate-900/92 border border-white/12 text-white',
        studio: 'bg-slate-900/92 border border-white/12 text-white',
        zoo: 'bg-slate-900/92 border border-white/12 text-white',
      },
      labels: {
        worldPrefix: cleanName ? `Campus di ${cleanName}` : 'Campus Educativo',
        playMainTitle: (lvl) => `Sfida #${lvl}`,
        playMainSub: 'Ragionamento, Calcolo & Inglese',
        dailyMissionTitle: 'Obiettivo del Giorno (5 Sfide)',
        chestTitle: 'Collezione & Premi',
        chestSub: 'Badge & Traguardi',
        svagoTitle: 'Brain Games',
        svagoSub: 'Labirinto · Differenze · Tris',
        studioTitle: 'Studio Creativo',
        studioSub: 'Disegno & Progetti',
        zooTitle: 'Atlante Natura',
        zooSub: 'Specie, Suoni & Habitat',
      },
    };
  }

  // STAGE 2: 6-8 ANNI (Clean Explorer Academy — Lighter, Structured & Gender-Tinted)
  if (ageYears >= 6) {
    const genderPalette = getGenderSystemPalette(gender, 'primary_explorer');
    return {
      stageId: 'primary_explorer',
      stageBadge: 'Accademia · 6–8 Anni',
      stageSubtitle: 'Scuola Primaria & Scoperta',
      isMatureTheme: false,
      isMinimalTheme: false,
      showAnimalMascotGuides: true,
      guideRolePrefix: 'Mentore Esploratore',
      fontHeadingClass: 'font-fun',
      cardRadiusClass: 'rounded-2xl',
      bgOverlayClass:
        'bg-gradient-to-b from-slate-950/30 via-slate-900/20 to-slate-950/55',
      headerSurfaceClass:
        `bg-white/95 border-2 ${genderPalette.accentBorderClass} shadow-md`,
      headerTitleColorClass: 'text-slate-900',
      headerAccentColorClass: genderPalette.accentTextClass,
      primaryCtaGradientClass: 'bg-white',
      primaryCtaBorderClass: `border-2 ${genderPalette.accentBorderClass}`,
      primaryCtaTextClass: 'text-slate-900',
      genderPalette,
      secondaryCardClasses: {
        chest: 'bg-white/95 border-2 border-amber-300 text-slate-900',
        svago: 'bg-white/95 border-2 border-emerald-300 text-slate-900',
        studio: `bg-white/95 border-2 ${genderPalette.accentBorderClass} text-slate-900`,
        zoo: 'bg-white/95 border-2 border-sky-300 text-slate-900',
      },
      labels: {
        worldPrefix: cleanName ? `Il Mondo di ${cleanName}` : 'Il Mio Mondo',
        playMainTitle: (lvl) => `Missione #${lvl}`,
        playMainSub: 'Logica · Numeri · Parole · Inglese',
        dailyMissionTitle: 'Missione Esploratore (5 Livelli)',
        chestTitle: 'Scrigno & Album',
        chestSub: 'Figurine & Tesori',
        svagoTitle: 'Giochi & Sfide',
        svagoSub: 'Labirinto · Differenze · Tris',
        studioTitle: 'Laboratorio Arte',
        studioSub: 'Disegna e Crea',
        zooTitle: 'Mondo Animale',
        zooSub: 'Suoni e Curiosità',
      },
    };
  }

  // STAGE 1: 2-5 ANNI (Warm Storybook World + Gender-Tinted System Accents)
  const genderPalette = getGenderSystemPalette(gender, 'early_childhood');
  return {
    stageId: 'early_childhood',
    stageBadge: 'Mondo Fiabesco · 2–5 Anni',
    stageSubtitle: 'Scoperta Guidata & Gioco',
    isMatureTheme: false,
    isMinimalTheme: false,
    showAnimalMascotGuides: true,
    guideRolePrefix: 'Amico Guida',
    fontHeadingClass: 'font-kids',
    cardRadiusClass: 'rounded-[22px] sm:rounded-[26px]',
    bgOverlayClass:
      'bg-gradient-to-b from-sky-950/20 via-transparent to-slate-950/45',
    headerSurfaceClass:
      `bg-white/95 border-2 ${genderPalette.accentBorderClass} shadow-md`,
    headerTitleColorClass: 'text-slate-900',
    headerAccentColorClass: genderPalette.accentTextClass,
    primaryCtaGradientClass:
      'bg-gradient-to-r from-amber-50 via-white to-rose-50',
    primaryCtaBorderClass: `border-[3px] ${genderPalette.accentBorderClass}`,
    primaryCtaTextClass: 'text-slate-900',
    genderPalette,
    secondaryCardClasses: {
      chest:
        'bg-gradient-to-b from-amber-50 to-orange-100/95 border-[3px] border-amber-300 text-slate-900',
      svago:
        'bg-gradient-to-b from-emerald-50 to-teal-100/95 border-[3px] border-emerald-300 text-emerald-950',
      studio:
        `bg-gradient-to-b from-white to-slate-50 border-[3px] ${genderPalette.accentBorderClass} text-slate-900`,
      zoo:
        'bg-gradient-to-b from-orange-50 to-amber-100/95 border-[3px] border-orange-300 text-amber-950',
    },
    labels: {
      worldPrefix: cleanName ? `Il Mondo di ${cleanName}` : 'Il Mio Mondo',
      playMainTitle: (lvl) => `Gioca Livello ${lvl}`,
      playMainSub: 'Logica · Numeri · Parole · Inglese',
      dailyMissionTitle: 'Missione del Giorno: 5 Livelli',
      chestTitle: 'Scrigno Magico',
      chestSub: 'Figurine & Suoni',
      svagoTitle: 'Giochi di Svago',
      svagoSub: 'Labirinto · Differenze · Tris',
      studioTitle: 'Colora & Disegna',
      studioSub: 'Pennelli & Adesivi',
      zooTitle: 'Zoo Parlante',
      zooSub: 'Tocca e Ascolta i Versi',
    },
  };
}


