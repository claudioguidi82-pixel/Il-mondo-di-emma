export type GameCategory = 
  | 'logic'    // Logica, Pattern, Indovinelli & Livelli Test QI
  | 'letters'  // Alfabeto, Lettera iniziale, Sillabe, Fonetica
  | 'numbers'  // Conteggio, Quantità, Addizioni visive, Sottrazioni
  | 'shapes'   // Forme, Spazio, Ombre, Colori
  | 'music'    // Musica, Note, Strumenti & Ritmo Sonoro
  | 'english'; // Prime Paroline in Inglese (Dog, Cat, Sun, Apple, Colori...)

export type PuzzleType = 
  // Logica & Misurazione QI
  | 'pattern_sequence'   // Completa la sequenza (es: 🔴 🟡 🔴 ?)
  | 'odd_one_out'        // Trova l'intruso
  | 'size_sorting'       // Dal più piccolo al più grande / grandezze
  | 'spatial_logic'      // Sopra/sotto, dentro/fuori, destra/sinistra
  | 'association_logic'  // Chi mangia cosa, chi vive dove
  | 'animal_sounds'      // Chi fa Miao, chi fa Bau, chi fa Muu
  | 'animal_food'        // Cosa mangia il coniglietto, la scimmietta
  | 'animal_habitat'     // Dove vive il pesciolino, l'uccellino
  | 'riddle'             // Indovinelli magici in rima per sviluppare il ragionamento
  | 'iq_matrix'          // Livelli Psicometrici QI: Matrici analogiche, serie logiche e deduzione
  // Lettere & Fonetica
  | 'find_letter'        // Trova la lettera dell'alfabeto
  | 'initial_letter'     // Con che lettera inizia la parola
  | 'spell_word'         // Componi la parola / lettera mancante
  | 'rhyme_guess'        // Riconoscimento rime
  | 'syllable_count'     // Quante sillabe ha la parola
  // Numeri & Calcolo
  | 'count_interactive'  // Conta gli oggetti toccandoli
  | 'compare_quantities' // Chi ne ha di più / di meno
  | 'visual_addition'    // 2 mele + 1 mela = ?
  | 'visual_subtraction' // 3 stelline - 1 stellina = ?
  | 'number_sequence'    // Quale numero manca nella sequenza
  // Forme, Colori & Spazio
  | 'match_shadow'       // Associa l'animale alla sua sagoma
  | 'match_shape'        // Trova il cerchio, quadrato, triangolo, stella
  | 'color_mix'          // Mescola i colori primari
  | 'find_color'         // Riconosci il colore
  | 'count_sides'        // Quanti lati ha la figura?
  // Musica & Ritmo
  | 'music_rhythm'       // Sequenze ritmiche, note musicali e strumenti sonori
  // Inglese Prescolare
  | 'english_words';     // Prime paroline in inglese con traduzione e pronuncia

export interface PuzzleOption {
  id: string;
  label: string;
  sublabel?: string;
  emoji?: string;
  color?: string;
  noteFreq?: number;     // Optional musical frequency played when option is tapped
  isCorrect: boolean;
}

export interface RhythmNote {
  freq: number;
  duration: number;
  label: string;
  emoji: string;
  color?: string;
}

export interface EnglishWordHighlight {
  en: string;
  it: string;
  phoneticHint: string;
  emoji: string;
  categoryLabel: string;
}

export interface Puzzle {
  id: string;
  levelNumber?: number;
  difficultyTier?: number; // 1 = 5yo base, 2 = 5.5yo, 3 = 6yo, etc.
  category: GameCategory;
  type: PuzzleType;
  title: string;
  prompt: string;
  speechText: string;
  animalGuide: {
    name: string;
    emoji: string;
    role: string;
    voicePitch: number;
  };
  options?: PuzzleOption[];
  patternItems?: string[];
  targetCount?: number;
  itemEmoji?: string;
  itemName?: string;
  itemGender?: 'f' | 'm';
  additionParts?: { countA: number; countB: number; emoji: string; singular?: string; plural?: string; gender?: 'f' | 'm' };
  subtractionParts?: { total: number; minus: number; emoji: string; singular?: string; plural?: string; gender?: 'f' | 'm' };
  rhythmNotes?: RhythmNote[];
  englishWord?: EnglishWordHighlight;
  iqParameterTag?: string;
  chcPrimary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  chcSecondary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  diagnosticTarget?: string;
  rewardStars: number;
  rewardGems: number;
  funExplanation: string;
}

export interface Trophy {
  id: string;
  title: string;
  category: GameCategory | 'art' | 'streak';
  description: string;
  icon: string;
  requiredPuzzlesCount: number;
  unlocked: boolean;
}

export type MemoryTheme = 'letters' | 'numbers' | 'mixed';

export interface MemoryCardData {
  uniqueId: string;
  pairKey: string;
  content: string;
  companion: string;
  emoji: string;
  color: string;
  pronounceText: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface SavedDrawing {
  id: string;
  title: string;
  date: string;
  dataUrl: string;
  starsEarned: number;
  stickersCount?: number;
  templateName?: string;
}

export interface CategoryPerformance {
  correct: number;
  total: number;
  attempts?: number;
  assistedSuccesses?: number;
  hintsUsed?: number;
  weightedCorrectSum?: number;
  weightedTotalSum?: number;
}

export interface LevelPerformanceEntry {
  level: number;
  tier?: number;
  weight?: number;
  category: GameCategory;
  puzzleType?: PuzzleType;
  chcPrimary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  chcSecondary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  firstTry: boolean;        // c_i = 1 if solved on 1st try without hints, 0 otherwise
  assistedSuccess?: boolean; // solved after hint or retry (tracked separately from autonomous c_i)
  attempts: number;
  hintsUsed?: number;
  responseTimeMs?: number;
  starsEarned: number;
  timestamp: string;
}

export type CompetencyBandLabel =
  | 'In esplorazione'
  | 'In apprendimento'
  | 'In consolidamento'
  | 'Acquisito'
  | 'Padronanza avanzata';

export interface EvaluationSnapshot {
  id: string;
  timestamp: string;
  date: string;
  levelNumber: number;
  sessionsCount: number;
  significantExercises: number;
  ip: number; // Indice di Prestazione (0-100)
  ic: number; // Indice di Competenza (0-100)
  ia: number; // Indice di Autonomia (0-100)
  ir: number; // Capacità di ricordare nel tempo (0-100)
  it: number; // Capacità di trasferimento (0-100)
  domainIC: Record<GameCategory, number>;
  chcScores: {
    Gf: number;
    Gwm: number;
    Gc: number;
    Gv: number;
    Gs: number;
  };
}

export interface MonthlyProgressCheckpoint {
  monthKey: string;       // YYYY-MM (updated at the start of each month: YYYY-MM-01)
  monthLabel: string;     // es. "1 Nov 2026"
  recordedAtDate: string; // YYYY-MM-DD
  levelReached: number;
  ip: number;             // 0-100
  ic: number;             // 0-100
  ia: number;             // 0-100
  ieDeltaFromStart: number; // IC_attuale - IC_partenza
  chcScores: {
    Gf: number;
    Gwm: number;
    Gc: number;
    Gv: number;
    Gs: number;
  };
}

export interface AnnualAgeProgressRow {
  id: string;                 // es. "age_4", "age_5", "age_6"
  ageYears: number;           // Età compiuta dalla bambina (es. 4, 5, 6...)
  ageLabel: string;           // es. "4 Anni", "5 Anni"
  periodLabel: string;        // es. "22/08/2025 – 21/08/2026"
  isLockedFixedRow: boolean;  // true = riga fissa consolidata al compimento dell'anno successivo; false = riga attiva dell'anno in corso
  lockedAtDate?: string;      // Data del compleanno in cui la riga è diventata fissa
  lastMonthlyUpdateKey: string;   // YYYY-MM dell'ultimo aggiornamento di inizio mese
  lastMonthlyUpdateLabel: string; // es. "01/11/2026 (Inizio Mese)"

  // PUNTO DI PARTENZA (Inizio utilizzo app / Inizio anno di età)
  startLevel: number;
  startDate: string;
  startIp: number;
  startIc: number;
  startIa: number;
  startBand: CompetencyBandLabel;
  startChc: {
    Gf: number;
    Gwm: number;
    Gc: number;
    Gv: number;
    Gs: number;
  };

  // VALORE ATTUALE (o Finale consolidato se riga fissa)
  currentLevel: number;
  currentDate: string;
  currentIp: number;
  currentIc: number;
  currentIa: number;
  currentBand: CompetencyBandLabel;
  currentChc: {
    Gf: number;
    Gwm: number;
    Gc: number;
    Gv: number;
    Gs: number;
  };

  // CONFRONTO & PROGRESSO OTTENUTO GRAZIE ALL'APP (Attuale - Punto di partenza)
  deltaLevels: number;
  deltaIp: number;
  deltaIc: number;
  deltaIa: number;
  monthlyCheckpoints: MonthlyProgressCheckpoint[];
}

export interface PedagogicalDomainReport {
  id: GameCategory;
  title: string;
  icon: string;
  ageMilestoneGoal: string;
  scorePercent: number;
  status: CompetencyBandLabel;
  summary: string;
  tipsForParents: string;
}

export interface UserProgress {
  currentLevel: number;        // Infinite level counter (starts at 1)
  highestLevelReached: number;
  stars: number;
  gems: number;
  streakDays: number;
  lastPlayedDate: string;
  categoryStats: {
    logic: CategoryPerformance;
    letters: CategoryPerformance;
    numbers: CategoryPerformance;
    shapes: CategoryPerformance;
    music?: CategoryPerformance;
    english?: CategoryPerformance;
  };
  trisGamesPlayed: number;
  trisGamesWon: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  musicEnabled: boolean;
  totalPuzzlesSolved: number;
  totalAttempts: number;

  // Diary, drawings and achievements support
  dailyRewardClaimed: boolean;
  savedDrawings: SavedDrawing[];
  completedPuzzleIds: string[];
  levelHistory?: LevelPerformanceEntry[];
  evaluationSnapshots?: EvaluationSnapshot[];
  sessionsCount?: number;
  sessionDates?: string[];
  annualProgressRows?: AnnualAgeProgressRow[];
  lastMonthlyUpdateKey?: string;
}


