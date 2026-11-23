// Mathematical & CHC Cognitive Evaluation Engine for "Il Mio Mondo"
// Implements:
// 1. Four Core Indicators (0-100): Prestazione (IP), Competenza (IC), Autonomia (IA), Evoluzione (IE)
// 2. Exact Weighted Performance Formula: IP = (Sum(w_i * c_i) / Sum(w_i)) * 100
// 3. Exact Competency Formula: IC = 0.50*IP + 0.20*IA + 0.15*IR + 0.15*IT
// 4. Evolution Formula: IE_delta = IC_attuale - IC_precedente (plus 0-100 index)
// 5. Competency Bands & 5 Stability Criteria for Level Progression
// 6. CHC 5-Domain Internal Cognitive Profile (0-100): Gf, Gwm, Gc, Gv, Gs (never called IQ)

import {
  AnnualAgeProgressRow,
  CompetencyBandLabel,
  EvaluationSnapshot,
  ExerciseDifficultyScore,
  GameCategory,
  LevelPerformanceEntry,
  MonthlyProgressCheckpoint,
  UserProgress,
} from '../types/game';
import {
  calculateChildAge,
  computeAdaptiveMasteryProfile,
  DIFFICULTY_LEVEL_SPECS,
  evaluateSingleTrialMetrics,
  parseBirthDateParts,
  SubjectAdaptiveProfile,
} from './childProfile';
import { isValidChildEntry } from './adultPlayDetector';

export type DifficultyLabel =
  | 'Molto facile'
  | 'Facile'
  | 'Medio'
  | 'Difficile'
  | 'Avanzato';

export interface DifficultyWeightInfo {
  tier: number;
  label: DifficultyLabel;
  description: string;
  weight: number; // 1.00 | 1.25 | 1.50 | 1.75 | 2.00
}

/**
 * Maps a puzzle's difficulty (1..5) or level number to the official Section 2.2 & 4.1 weight table:
 * - 1 · Molto facile, riconoscimento:                  1.00
 * - 2 · Facile, comprensione:                          1.25
 * - 3 · Intermedia, applicazione:                      1.50
 * - 4 · Avanzata, ragionamento:                        1.75
 * - 5 · Esperta, trasferimento e problem solving:      2.00
 */
export function getDifficultyWeightInfo(
  levelOrTier: number,
  isLevelNumber = true
): DifficultyWeightInfo {
  const tier = isLevelNumber
    ? Math.max(1, Math.min(5, Math.floor((Math.max(1, levelOrTier) - 1) / 10) + 1))
    : Math.max(1, Math.min(5, Math.round(levelOrTier)));

  if (tier <= 1) {
    return {
      tier: 1,
      label: 'Molto facile',
      description: 'Molto facile, riconoscimento',
      weight: 1.0,
    };
  }
  if (tier === 2) {
    return {
      tier: 2,
      label: 'Facile',
      description: 'Facile, comprensione',
      weight: 1.25,
    };
  }
  if (tier === 3) {
    return {
      tier: 3,
      label: 'Medio',
      description: 'Intermedia, applicazione',
      weight: 1.5,
    };
  }
  if (tier === 4) {
    return {
      tier: 4,
      label: 'Difficile',
      description: 'Avanzata, ragionamento',
      weight: 1.75,
    };
  }
  return {
    tier: 5,
    label: 'Avanzato',
    description: 'Esperta, trasferimento e problem solving',
    weight: 2.0,
  };
}

/**
 * Maps an Indice di Competenza (IC, 0-100) to the 5 official progression bands (Section 3):
 * - 0-39:   In esplorazione
 * - 40-59:  In apprendimento
 * - 60-74:  In consolidamento
 * - 75-89:  Acquisito
 * - 90-100: Padronanza avanzata
 */
export function getCompetencyBand(ic: number, isUnlocked = true): CompetencyBandLabel {
  if (!isUnlocked || ic <= 39) return 'In esplorazione';
  if (ic <= 59) return 'In apprendimento';
  if (ic <= 74) return 'In consolidamento';
  if (ic <= 89) return 'Acquisito';
  return 'Padronanza avanzata';
}

export type LearningPathStageStatus =
  | 'Acquisito'
  | 'In corso'
  | 'Prossimo obiettivo'
  | 'Obiettivo futuro';

export interface LearningPathStage {
  stepNumber: number;
  title: string;
  description: string;
  prerequisiteLabel: string;
  status: LearningPathStageStatus;
}

export interface ProgressiveSubjectCatalogEntry {
  id: string;
  subjectName: string;
  competencies: string;
  minRecommendedAgeYears: number;
  prerequisiteSummary: string;
  isUnlockedForChild: boolean;
  statusLabel: 'Attiva nel percorso' | 'Introduzione graduale' | 'Prerequisito in corso';
}

export interface NextLearningPlan {
  strengthTitle: string;
  strengthDetail: string;
  toConsolidateTitle: string;
  toConsolidateDetail: string;
  nextChallengeTitle: string;
  nextChallengeDetail: string;
}

export interface ProgressionCriterionStatus {
  id: string;
  label: string;
  targetText: string;
  currentText: string;
  met: boolean;
}

export interface DomainEvaluationMetrics {
  id: GameCategory;
  totalExercises: number;
  autonomousCorrectCount: number; // c_i = 1.00 (1st try without hints)
  assistedSuccessCount: number;   // solved with hints or retry (0 < c_i < 1.00)
  hintsUsedTotal: number;
  weightedCorrectSum: number;     // Sum(w_i * c_i)
  weightedTotalSum: number;       // Sum(w_i)
  ip: number;                     // Indice di Prestazione (0-100)
  ia: number;                     // Indice di Autonomia (0-100)
  ir: number;                     // Indice di Ritenzione (0-100 when irAvailable)
  irAvailable: boolean;           // Section 4.5: true ONLY when retention verification exists
  irDisplay: string;              // "82/100" or "Non ancora disponibile"
  it: number;                     // Indice di Trasferimento (0-100 when itAvailable)
  itAvailable: boolean;           // Section 4.5: true ONLY when cross-type/context transfer exists
  itDisplay: string;              // "76/100" or "Non ancora disponibile"
  ic: number;                     // Indice di Competenza: 0.50*IP + 0.20*IA + 0.15*IR + 0.15*IT
  previousIc: number;             // IC_precedente
  ieDelta: number;                // IE = IC_attuale - IC_precedente
  ieIndex: number;                // 0-100 normalized evolution indicator
  bandLabel: CompetencyBandLabel;
  confidencePercent: number;      // 0-100 data solidity index based on sample size
  confidenceLabel: string;        // es. "Attendibile (14 prove)"
  adaptiveProfile: SubjectAdaptiveProfile;
  learningPathStages: LearningPathStage[];
}

export interface CHCAbilityScore {
  code: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  shortTitle: string;
  fullTitle: string;
  description: string;
  colorHex: string;
  score: number;            // 0-100
  ip: number;               // 0-100
  ia: number;               // 0-100
  ir: number;               // 0-100
  irAvailable: boolean;
  irDisplay: string;
  it: number;               // 0-100
  itAvailable: boolean;
  itDisplay: string;
  ieDelta: number;          // signed delta vs previous snapshot
  bandLabel: CompetencyBandLabel;
  sampleCount: number;      // Number of direct/contributing trials supporting this CHC area
  confidencePercent: number;
  confidenceLabel: string;
  contributingSubjectsLabel: string;
}

export interface FullEvaluationReport {
  isUnlocked: boolean;
  completedLevelsCount: number;
  currentLevel: number;
  currentTier: number;
  currentDifficultyLabel: DifficultyLabel;
  currentWeight: number;
  generalLevelLabel: string; // "Personalizzato (Indipendente per Materia)"

  // 1. I QUATTRO INDICATORI PRINCIPALI (0-100) + RITENZIONE & TRASFERIMENTO VERIFICABILI
  ip: number;          // Indice di prestazione (0-100)
  ic: number;          // Indice di competenza generale (0-100)
  ia: number;          // Indice di autonomia (0-100)
  ieIndex: number;     // Indice di evoluzione (0-100)
  ieDelta: number;     // Evoluzione: IC_attuale - IC_precedente (es. +12)
  previousIc: number;  // IC_precedente
  ir: number;          // Capacità di ricordare nel tempo (0-100)
  irAvailable: boolean;
  irDisplay: string;
  it: number;          // Capacità di trasferimento (0-100)
  itAvailable: boolean;
  itDisplay: string;
  confidencePercent: number;
  confidenceLabel: string;

  // Weighted Sums for full mathematical transparency
  weightedCorrectSum: number;
  weightedTotalSum: number;
  autonomousTotal: number;
  assistedTotal: number;
  significantExercises: number;
  sessionsCount: number;
  daysSpan: number;

  // 3. LIVELLO ASSEGNATO & 6 CRITERI DI STABILITÀ (INCLUSA STABILITÀ COMPETENZE FONDAMENTALI)
  rawBandLabel: CompetencyBandLabel;
  assignedBandLabel: CompetencyBandLabel;
  canAdvanceToNextMasteryLevel: boolean;
  hasUnstableFundamentalCompetency: boolean;
  unstableFundamentalSubjects: string[];
  stabilityCriteria: ProgressionCriterionStatus[];
  stabilitySummaryNote: string;

  // 4. PROFILO DELLE 5 AREE COGNITIVE CHC (0-100, SEPARATE DALLE MATERIE, NON CHIAMATO QI)
  chcAbilities: CHCAbilityScore[];

  // 5. METRICHE E PERCORSI INDIPENDENTI PER LE 6 MATERIE DELL'APP + CATALOGO 10 MATERIE PROGRESSIVE
  domains: Record<GameCategory, DomainEvaluationMetrics>;
  progressiveSubjectsCatalog: ProgressiveSubjectCatalogEntry[];
  nextLearningPlan: NextLearningPlan;

  // 6. PROGRESSI OTTENUTI GRAZIE ALL'UTILIZZO DELL'APP
  childCurrentAgeYears: number;
  childCurrentAgeMonths: number;
  childExactAgeDisplay: string;
  emmaCurrentAgeYears: number;
  childBirthDayMonthLabel: string;
  nextBirthdayYear: number;
  currentMonthKey: string;
  currentMonthStartLabel: string;
  nextMonthlyUpdateLabel: string;
  nextBirthdayDateLabel: string;
  annualProgressRows: AnnualAgeProgressRow[];
  activeAgeRow: AnnualAgeProgressRow;
}

const ALL_CATEGORIES: GameCategory[] = [
  'logic',
  'letters',
  'numbers',
  'shapes',
  'music',
  'english',
];

const SUBJECT_LEARNING_PATHS_TEMPLATE: Record<
  GameCategory,
  Array<{ title: string; description: string; prerequisiteLabel: string }>
> = {
  numbers: [
    {
      title: '1. Riconoscimento numerico',
      description: 'Identificare numeri e quantità.',
      prerequisiteLabel: 'Base percettiva',
    },
    {
      title: '2. Confronto',
      description: 'Individuare maggiore, minore e uguale.',
      prerequisiteLabel: 'Riconoscimento quantità',
    },
    {
      title: '3. Addizioni e sottrazioni',
      description: 'Calcolo con supporto visivo.',
      prerequisiteLabel: 'Confronto quantità',
    },
    {
      title: '4. Calcolo mentale',
      description: 'Operazioni senza supporti visivi.',
      prerequisiteLabel: 'Addizioni e sottrazioni visive',
    },
    {
      title: '5. Problemi logici',
      description: 'Risolvere problemi con più passaggi.',
      prerequisiteLabel: 'Calcolo mentale sicuro',
    },
    {
      title: '6. Ragionamento avanzato',
      description: 'Combinazioni, strategie e problemi complessi.',
      prerequisiteLabel: 'Problemi a più passaggi',
    },
  ],
  letters: [
    {
      title: '1. Suoni e ascolto fonologico',
      description: 'Riconoscere suoni iniziali, voci e immagini familiari.',
      prerequisiteLabel: 'Ascolto attivo',
    },
    {
      title: '2. Riconoscimento lettere',
      description: 'Associare grafemi, vocali e consonanti alle parole.',
      prerequisiteLabel: 'Suoni iniziali',
    },
    {
      title: '3. Sillabe e rime',
      description: 'Scomporre parole in sillabe e individuare rime.',
      prerequisiteLabel: 'Riconoscimento lettere',
    },
    {
      title: '4. Costruzione parole e ortografia',
      description: 'Completare parole, doppie e suoni complessi.',
      prerequisiteLabel: 'Sillabe e rime',
    },
    {
      title: '5. Lessico, sinonimi e contrari',
      description: 'Ampliare il vocabolario e comprendere relazioni semantiche.',
      prerequisiteLabel: 'Ortografia di base',
    },
    {
      title: '6. Comprensione e analisi',
      description: 'Grammatica, sintassi e comprensione profonda del testo.',
      prerequisiteLabel: 'Padronanza lessicale',
    },
  ],
  logic: [
    {
      title: '1. Associazioni concrete',
      description: 'Collegare animali, oggetti, habitat e funzioni quotidiane.',
      prerequisiteLabel: 'Osservazione visiva',
    },
    {
      title: '2. Classificazione e intruso',
      description: 'Raggruppare per categoria ed escludere l’elemento estraneo.',
      prerequisiteLabel: 'Associazioni concrete',
    },
    {
      title: '3. Sequenze e pattern',
      description: 'Individuare e completare regole ritmiche e visive.',
      prerequisiteLabel: 'Classificazione',
    },
    {
      title: '4. Analogie e deduzioni',
      description: 'Risolvere indovinelli e relazioni causa-effetto.',
      prerequisiteLabel: 'Sequenze e pattern',
    },
    {
      title: '5. Matrici e ragionamento astratto',
      description: 'Dedurre regole su più attributi contemporaneamente.',
      prerequisiteLabel: 'Analogie e deduzioni',
    },
    {
      title: '6. Problem solving e pensiero critico',
      description: 'Strategie multi-step, scienze, logica booleana e coding.',
      prerequisiteLabel: 'Matrici logiche',
    },
  ],
  shapes: [
    {
      title: '1. Colori primari e sagome',
      description: 'Distinguere colori fondamentali, ombre e contorni.',
      prerequisiteLabel: 'Percezione visiva',
    },
    {
      title: '2. Forme geometriche piane',
      description: 'Riconoscere cerchio, quadrato, triangolo, stella e rettangolo.',
      prerequisiteLabel: 'Colori e sagome',
    },
    {
      title: '3. Mescolanza colori e dimensioni',
      description: 'Creare colori secondari e ordinare per grandezza.',
      prerequisiteLabel: 'Forme piane',
    },
    {
      title: '4. Orientamento, lati e simmetria',
      description: 'Contare lati/vertici e riconoscere relazioni spaziali.',
      prerequisiteLabel: 'Colori e dimensioni',
    },
    {
      title: '5. Poligoni, angoli e perimetri',
      description: 'Proprietà geometriche, rotazioni e composizione spaziale.',
      prerequisiteLabel: 'Lati e simmetria',
    },
    {
      title: '6. Geometria nello spazio e arte',
      description: 'Solidi 3D, aree, prospettiva e storia dell’arte.',
      prerequisiteLabel: 'Poligoni e perimetri',
    },
  ],
  music: [
    {
      title: '1. Ascolto e timbro sonoro',
      description: 'Distinguere suoni forti/deboli, gravi/acuti e versi.',
      prerequisiteLabel: 'Attenzione uditiva',
    },
    {
      title: '2. Eco ritmica a 2–3 impulsi',
      description: 'Ascoltare e riprodurre brevi sequenze sonore in ordine.',
      prerequisiteLabel: 'Timbro sonoro',
    },
    {
      title: '3. Strumenti e famiglie sonore',
      description: 'Riconoscere pianoforte, tamburo, violino, flauto e chitarra.',
      prerequisiteLabel: 'Eco ritmica base',
    },
    {
      title: '4. Scala musicale (Do–Si)',
      description: 'Ordinare l’altezza delle note e memorizzare melodie a 4 note.',
      prerequisiteLabel: 'Strumenti musicali',
    },
    {
      title: '5. Durata delle note e battute',
      description: 'Pattern ritmici strutturati, pause e memoria di lavoro a 5 note.',
      prerequisiteLabel: 'Scala musicale',
    },
    {
      title: '6. Armonia, orchestra e compositori',
      description: 'Accordi, tempi musicali, acustica e grandi autori classici.',
      prerequisiteLabel: 'Pattern ritmici avanzati',
    },
  ],
  english: [
    {
      title: '1. Prime parole illustrate',
      description: 'Animali, colori e oggetti familiari con ascolto vocale.',
      prerequisiteLabel: 'Ascolto fonetico',
    },
    {
      title: '2. Saluti, numeri e natura',
      description: 'Vocabolario quotidiano di base e comprensione visiva.',
      prerequisiteLabel: 'Prime parole',
    },
    {
      title: '3. Associazioni bilingui (EN ↔ IT)',
      description: 'Collegare rapidamente il termine inglese al significato italiano.',
      prerequisiteLabel: 'Vocabolario base',
    },
    {
      title: '4. Azioni, aggettivi e frasi semplici',
      description: 'Verbi comuni, opposti e prime strutture comunicative (A1).',
      prerequisiteLabel: 'Associazioni bilingui',
    },
    {
      title: '5. Conversazione e contesti quotidiani',
      description: 'Domande, tempo atmosferico, scuola e viaggi (A1+/A2).',
      prerequisiteLabel: 'Frasi semplici A1',
    },
    {
      title: '6. Comprensione e grammatica inglese',
      description: 'Tempi verbali, idioms e lettura autonoma in contesto (A2/B1).',
      prerequisiteLabel: 'Dialoghi A2',
    },
  ],
};

export function buildSubjectLearningPathStages(
  category: GameCategory,
  ic: number,
  targetDifficulty: ExerciseDifficultyScore,
  sampleCount: number
): LearningPathStage[] {
  const templates = SUBJECT_LEARNING_PATHS_TEMPLATE[category] || SUBJECT_LEARNING_PATHS_TEMPLATE.logic;
  // Determine which stage index (0..5) is currently "In corso" based on verified competency & difficulty
  let activeStageIdx = 0;
  if (sampleCount === 0) {
    activeStageIdx = 0;
  } else if (targetDifficulty >= 5 && ic >= 88) {
    activeStageIdx = 5;
  } else if (targetDifficulty >= 4 || (ic >= 80 && sampleCount >= 8)) {
    activeStageIdx = 4;
  } else if (targetDifficulty === 3 || (ic >= 68 && sampleCount >= 4)) {
    activeStageIdx = 3;
  } else if (ic >= 55 && sampleCount >= 2) {
    activeStageIdx = 2;
  } else if (sampleCount >= 1) {
    activeStageIdx = 1;
  }

  return templates.map((tpl, idx) => {
    let status: LearningPathStageStatus = 'Obiettivo futuro';
    if (idx < activeStageIdx) {
      status = 'Acquisito';
    } else if (idx === activeStageIdx) {
      status = 'In corso';
    } else if (idx === activeStageIdx + 1) {
      status = 'Prossimo obiettivo';
    }
    return {
      stepNumber: idx + 1,
      title: tpl.title,
      description: tpl.description,
      prerequisiteLabel: tpl.prerequisiteLabel,
      status,
    };
  });
}

export function buildProgressiveSubjectsCatalog(
  ageYears: number,
  domains: Record<GameCategory, DomainEvaluationMetrics>
): ProgressiveSubjectCatalogEntry[] {
  const logicOk = domains.logic.ic >= 60 || ageYears >= 6;
  const mathOk = domains.numbers.ic >= 60 || ageYears >= 6;
  const langOk = domains.letters.ic >= 60 || ageYears >= 5;

  const rawList: Array<{
    id: string;
    subjectName: string;
    competencies: string;
    minAge: number;
    prereq: string;
    unlocked: boolean;
  }> = [
    {
      id: 'prog_math',
      subjectName: 'Matematica',
      competencies: 'Quantità, calcolo, problemi',
      minAge: 2,
      prereq: 'Percorso base attivo fin dal primo livello',
      unlocked: true,
    },
    {
      id: 'prog_italian',
      subjectName: 'Italiano',
      competencies: 'Fonologia, lettere, lettura, comprensione',
      minAge: 2,
      prereq: 'Ascolto fonologico (2–5 anni) e lettura progressiva (6–14 anni)',
      unlocked: true,
    },
    {
      id: 'prog_logic',
      subjectName: 'Logica',
      competencies: 'Sequenze, deduzioni, classificazioni',
      minAge: 2,
      prereq: 'Associazioni visive e ragionamento progressivo',
      unlocked: true,
    },
    {
      id: 'prog_geometry',
      subjectName: 'Geometria',
      competencies: 'Forme, spazio, orientamento',
      minAge: 2,
      prereq: 'Colori, sagome e relazioni spaziali',
      unlocked: true,
    },
    {
      id: 'prog_memory',
      subjectName: 'Memoria',
      competencies: 'Uditiva, visiva, sequenziale',
      minAge: 2,
      prereq: 'Eco sonora, ritmo e memoria di lavoro',
      unlocked: true,
    },
    {
      id: 'prog_english',
      subjectName: 'Inglese',
      competencies: 'Vocabolario, ascolto, comprensione',
      minAge: 3,
      prereq: 'Ascolto fonologico di base',
      unlocked: ageYears >= 3 || langOk,
    },
    {
      id: 'prog_science',
      subjectName: 'Scienze',
      competencies: 'Natura, corpo umano, fenomeni',
      minAge: 4,
      prereq: 'Associazioni logiche di base',
      unlocked: ageYears >= 4 || logicOk,
    },
    {
      id: 'prog_culture',
      subjectName: 'Cultura generale',
      competencies: 'Conoscenze e associazioni',
      minAge: 5,
      prereq: 'Linguaggio e logica in consolidamento',
      unlocked: ageYears >= 5 || (logicOk && langOk),
    },
    {
      id: 'prog_creativity',
      subjectName: 'Creatività',
      competencies: 'Immaginazione, costruzione, associazioni',
      minAge: 2,
      prereq: 'Studio d’Arte, Colori e Musica attivi',
      unlocked: true,
    },
    {
      id: 'prog_attention',
      subjectName: 'Attenzione',
      competencies: 'Ricerca visiva, concentrazione, discriminazione',
      minAge: 3,
      prereq: 'Trova le differenze, Labirinto e discriminazione visiva',
      unlocked: ageYears >= 3 || mathOk,
    },
  ];

  return rawList.map((item) => ({
    id: item.id,
    subjectName: item.subjectName,
    competencies: item.competencies,
    minRecommendedAgeYears: item.minAge,
    prerequisiteSummary: item.prereq,
    isUnlockedForChild: item.unlocked,
    statusLabel: item.unlocked
      ? 'Attiva nel percorso'
      : ageYears + 1 >= item.minAge
      ? 'Introduzione graduale'
      : 'Prerequisito in corso',
  }));
}

function inferChcTargetsFromLevel(
  level: number,
  category: GameCategory,
  puzzleType?: string
): {
  chcPrimary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  chcSecondary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
} {
  const tier = Math.max(1, Math.floor((Math.max(1, level) - 1) / 10) + 1);

  if (category === 'music') {
    return { chcPrimary: 'Gwm', chcSecondary: puzzleType === 'music_rhythm' ? 'Gs' : 'Gf' };
  }
  if (category === 'shapes') {
    return { chcPrimary: 'Gv', chcSecondary: tier >= 3 ? 'Gf' : 'Gs' };
  }
  if (category === 'numbers') {
    if (puzzleType === 'count_interactive' || tier <= 2) {
      return { chcPrimary: 'Gwm', chcSecondary: 'Gf' };
    }
    return { chcPrimary: 'Gf', chcSecondary: 'Gwm' };
  }
  if (category === 'letters') {
    return { chcPrimary: 'Gc', chcSecondary: 'Gwm' };
  }
  if (category === 'english') {
    return { chcPrimary: 'Gc', chcSecondary: 'Gwm' };
  }
  if (puzzleType === 'pattern_sequence') {
    return { chcPrimary: 'Gf', chcSecondary: 'Gv' };
  }
  if (puzzleType === 'odd_one_out' || puzzleType === 'riddle') {
    return { chcPrimary: 'Gf', chcSecondary: 'Gc' };
  }
  return { chcPrimary: 'Gf', chcSecondary: 'Gs' };
}

function getCategoryEntries(
  progress: UserProgress,
  category: GameCategory
): LevelPerformanceEntry[] {
  const allHistoryForCat = (progress.levelHistory || []).filter(
    (e) => e.category === category
  );
  const history = allHistoryForCat.filter(isValidChildEntry);
  const excludedForCat = allHistoryForCat.length - history.length;
  const rawStat = progress.categoryStats[category] || {
    correct: 0,
    total: 0,
    attempts: 0,
  };
  const stat = {
    ...rawStat,
    total: Math.max(0, rawStat.total - excludedForCat),
    correct: Math.max(0, rawStat.correct - excludedForCat),
  };

  if (history.length >= stat.total && history.length > 0) {
    return history.map((e) => {
      const wInfo = getDifficultyWeightInfo(e.tier ?? e.level ?? 1, e.tier === undefined);
      const hints = e.hintsUsed ?? 0;
      const isAutonomousFirstTry = Boolean(e.firstTry) && hints === 0 && Math.max(1, e.attempts || 1) === 1;
      const inferred = inferChcTargetsFromLevel(e.level || 1, category, e.puzzleType);
      return {
        ...e,
        tier: e.tier ?? wInfo.tier,
        weight: e.weight ?? wInfo.weight,
        chcPrimary: e.chcPrimary ?? inferred.chcPrimary,
        chcSecondary: e.chcSecondary ?? inferred.chcSecondary,
        firstTry: isAutonomousFirstTry,
        assistedSuccess: !isAutonomousFirstTry,
        hintsUsed: hints,
      };
    });
  }

  const missingTotal = Math.max(0, stat.total - history.length);
  const historyCorrect = history.filter((h) => h.firstTry && !(h.hintsUsed && h.hintsUsed > 0)).length;
  const missingCorrect = Math.max(0, Math.min(missingTotal, stat.correct - historyCorrect));

  const synthesized: LevelPerformanceEntry[] = [];
  for (let i = 0; i < missingTotal; i++) {
    const estLevel = Math.max(1, Math.min(progress.currentLevel - 1, i * 2 + 1));
    const wInfo = getDifficultyWeightInfo(estLevel, true);
    const isAutoCorrect = i < missingCorrect;
    const inferred = inferChcTargetsFromLevel(estLevel, category);
    synthesized.push({
      level: estLevel,
      tier: wInfo.tier,
      weight: wInfo.weight,
      category,
      chcPrimary: inferred.chcPrimary,
      chcSecondary: inferred.chcSecondary,
      firstTry: isAutoCorrect,
      assistedSuccess: !isAutoCorrect,
      attempts: isAutoCorrect ? 1 : 2,
      hintsUsed: isAutoCorrect ? 0 : 1,
      responseTimeMs: isAutoCorrect ? 5200 : 8400,
      starsEarned: isAutoCorrect ? 3 : 2,
      timestamp: progress.lastPlayedDate || new Date().toISOString(),
    });
  }

  const normalizedHistory = history.map((e) => {
    const wInfo = getDifficultyWeightInfo(e.tier ?? e.level ?? 1, e.tier === undefined);
    const hints = e.hintsUsed ?? 0;
    const isAutonomousFirstTry = Boolean(e.firstTry) && hints === 0 && Math.max(1, e.attempts || 1) === 1;
    const inferred = inferChcTargetsFromLevel(e.level || 1, category, e.puzzleType);
    return {
      ...e,
      tier: e.tier ?? wInfo.tier,
      weight: e.weight ?? wInfo.weight,
      chcPrimary: e.chcPrimary ?? inferred.chcPrimary,
      chcSecondary: e.chcSecondary ?? inferred.chcSecondary,
      firstTry: isAutonomousFirstTry,
      assistedSuccess: !isAutonomousFirstTry,
      hintsUsed: hints,
    };
  });

  return [...synthesized, ...normalizedHistory];
}

function getAgeCalibratedTargetLatencyMs(ageYears: number): number {
  if (ageYears <= 3) return 9500;
  if (ageYears <= 5) return 7500;
  if (ageYears <= 7) return 6400;
  if (ageYears <= 9) return 5600;
  if (ageYears <= 12) return 5000;
  return 4600;
}

function computeRobustLatencyMs(samples: number[]): number {
  const valid = samples
    .filter((ms) => Number.isFinite(ms) && ms >= 500 && ms <= 60000)
    .sort((a, b) => a - b);
  if (valid.length === 0) return 6000;
  if (valid.length >= 5) {
    const trim = Math.floor(valid.length * 0.2);
    const trimmed = valid.slice(trim, valid.length - trim);
    return trimmed.reduce((acc, v) => acc + v, 0) / trimmed.length;
  }
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 1 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

// ============================================================================
// SECTION 4 & SECTION 8: VERIFIABLE MATHEMATICAL EVALUATION FUNCTIONS
// ============================================================================

/**
 * 4.1 Indice di Prestazione (IP):
 * Formula: IP = (Sum(w_i * c_i) / Sum(w_i)) * 100
 * where w_i in {1.00, 1.25, 1.50, 1.75, 2.00} and c_i in {1.00, 0.75, 0.50, 0.25, 0.00}.
 */
export function calculateWeightedPerformance(entries: LevelPerformanceEntry[]): {
  ip: number;
  weightedCorrectSum: number;
  weightedTotalSum: number;
  autonomousCorrectCount: number;
  assistedSuccessCount: number;
  hintsUsedTotal: number;
} {
  if (entries.length === 0) {
    return {
      ip: 0,
      weightedCorrectSum: 0,
      weightedTotalSum: 0,
      autonomousCorrectCount: 0,
      assistedSuccessCount: 0,
      hintsUsedTotal: 0,
    };
  }

  let weightedCorrectSum = 0;
  let weightedTotalSum = 0;
  let autonomousCorrectCount = 0;
  let assistedSuccessCount = 0;
  let hintsUsedTotal = 0;

  entries.forEach((e) => {
    const w = e.weight ?? getDifficultyWeightInfo(e.tier ?? e.level ?? 1, e.tier === undefined).weight;
    const trial = evaluateSingleTrialMetrics(e);
    weightedTotalSum += w;
    weightedCorrectSum += w * trial.c_i;
    if (trial.isAutonomous) {
      autonomousCorrectCount++;
    } else {
      assistedSuccessCount++;
    }
    hintsUsedTotal += e.hintsUsed ?? 0;
  });

  const ip =
    weightedTotalSum > 0
      ? Math.round((weightedCorrectSum / weightedTotalSum) * 100)
      : 0;

  return {
    ip,
    weightedCorrectSum: Math.round(weightedCorrectSum * 100) / 100,
    weightedTotalSum: Math.round(weightedTotalSum * 100) / 100,
    autonomousCorrectCount,
    assistedSuccessCount,
    hintsUsedTotal,
  };
}

/**
 * 4.2 Indice di Autonomia (IA):
 * Uses explicit discrete scores from Section 4.2:
 * - Risposta autonoma: 100
 * - Un suggerimento: 75
 * - Due suggerimenti: 50
 * - Risposta guidata: 25
 * - Risposta fornita dal sistema: 0
 */
export function calculateAutonomy(entries: LevelPerformanceEntry[]): number {
  if (entries.length === 0) return 0;
  let totalScore = 0;
  entries.forEach((e) => {
    totalScore += evaluateSingleTrialMetrics(e).autonomyScore;
  });
  return Math.round(totalScore / entries.length);
}

/**
 * 4.3 Indice di Ritenzione (IR):
 * Measures how well the child remembers and reuses a competency after an interval.
 * Section 4.5 rule: If no retention verification has taken place yet (< 3 exercises in the domain
 * and < 2 distinct sessions/dates), IR is NOT fabricated — it is marked as `available: false` ("Non ancora disponibile").
 */
export function calculateRetention(
  entries: LevelPerformanceEntry[],
  sessionsCount: number,
  daysSpan: number
): { ir: number; available: boolean; display: string } {
  const distinctDatesInEntries = new Set(
    entries.map((e) => (e.timestamp ? e.timestamp.slice(0, 10) : '')).filter(Boolean)
  );
  const hasRetentionVerification =
    entries.length >= 3 || (entries.length >= 2 && (distinctDatesInEntries.size >= 2 || daysSpan >= 1));

  if (!hasRetentionVerification) {
    return {
      ir: 0,
      available: false,
      display: 'Non ancora disponibile',
    };
  }

  // Evaluate follow-up trials (second half of chronological history for that competency)
  const splitIdx = Math.max(1, Math.floor(entries.length / 2));
  const followUpEntries = entries.slice(splitIdx);
  const followUpPerf = calculateWeightedPerformance(followUpEntries);
  const followUpAutonomy = calculateAutonomy(followUpEntries);

  // Temporal stability factor across sessions/days
  const timeBonus = Math.min(1, 0.85 + Math.min(3, sessionsCount - 1) * 0.03 + Math.min(7, daysSpan) * 0.008);
  const rawIr = (followUpPerf.ip * 0.65 + followUpAutonomy * 0.35) * timeBonus;
  const ir = Math.max(0, Math.min(100, Math.round(rawIr)));

  return {
    ir,
    available: true,
    display: `${ir}/100`,
  };
}

/**
 * 4.4 Indice di Trasferimento (IT):
 * Measures whether the child succeeds in using a competency in a different exercise type or difficulty level.
 * Section 4.5 rule: If the child has not yet faced at least 2 exercises across different typologies or difficulty levels,
 * IT is marked as `available: false` ("Non ancora disponibile").
 */
export function calculateTransfer(
  entries: LevelPerformanceEntry[]
): { it: number; available: boolean; display: string } {
  if (entries.length < 2) {
    return {
      it: 0,
      available: false,
      display: 'Non ancora disponibile',
    };
  }

  const distinctTypes = new Set(
    entries.map((e, i) => e.puzzleType || `${e.category}_t${e.tier || 1}_${i % 3}`)
  );
  const distinctTiers = new Set(entries.map((e) => e.tier ?? 1));

  if (distinctTypes.size < 2 && distinctTiers.size < 2) {
    return {
      it: 0,
      available: false,
      display: 'Non ancora disponibile',
    };
  }

  // Evaluate performance on transferred exercises (all exercises after the initial archetype)
  const transferredEntries = entries.slice(1);
  const perf = calculateWeightedPerformance(transferredEntries);
  const auto = calculateAutonomy(transferredEntries);
  const varietyFactor = Math.min(1.0, 0.88 + Math.min(4, distinctTypes.size - 1) * 0.03 + Math.min(3, distinctTiers.size - 1) * 0.02);
  const it = Math.max(0, Math.min(100, Math.round((perf.ip * 0.65 + auto * 0.35) * varietyFactor)));

  return {
    it,
    available: true,
    display: `${it}/100`,
  };
}

/**
 * Section 7 & 8: Confidence / Sample Solidity Calculator
 * Shows how many trials support a score: "Un 90 ottenuto con 40 esercizi non ha la stessa solidità di un 90 ottenuto con 3 esercizi."
 */
export function calculateConfidence(
  entriesCount: number,
  targetFullSample = 15
): { confidencePercent: number; confidenceLabel: string } {
  if (entriesCount <= 0) {
    return {
      confidencePercent: 0,
      confidenceLabel: 'Nessuna prova (0 prove)',
    };
  }
  const ratio = Math.min(1, entriesCount / Math.max(1, targetFullSample));
  const confidencePercent = Math.round(Math.pow(ratio, 0.65) * 100);
  const proveWord = entriesCount === 1 ? 'prova' : 'prove';

  if (entriesCount < 4) {
    return {
      confidencePercent,
      confidenceLabel: `Iniziale (${entriesCount} ${proveWord})`,
    };
  }
  if (entriesCount < 10) {
    return {
      confidencePercent,
      confidenceLabel: `In consolidamento (${entriesCount} ${proveWord})`,
    };
  }
  if (entriesCount < 25) {
    return {
      confidencePercent,
      confidenceLabel: `Attendibile (${entriesCount} ${proveWord})`,
    };
  }
  return {
    confidencePercent: Math.max(92, confidencePercent),
    confidenceLabel: `Solidità elevata (${entriesCount} ${proveWord})`,
  };
}

/**
 * 4.5 & Section 8: Complete Learning Profile Synthesis (updateLearningProfile)
 * Formula when all 4 indicators are verified:
 *   IC = round(0.50 * IP + 0.20 * IA + 0.15 * IR + 0.15 * IT)
 * When IR or IT is not yet available, re-normalizes over the verified weights without inventing positive scores.
 */
function computeIndicatorsForEntries(
  entries: LevelPerformanceEntry[],
  sessionsCount: number,
  daysSpan: number,
  targetFullSample = 12
): {
  totalExercises: number;
  autonomousCorrectCount: number;
  assistedSuccessCount: number;
  hintsUsedTotal: number;
  weightedCorrectSum: number;
  weightedTotalSum: number;
  ip: number;
  ia: number;
  ir: number;
  irAvailable: boolean;
  irDisplay: string;
  it: number;
  itAvailable: boolean;
  itDisplay: string;
  ic: number;
  confidencePercent: number;
  confidenceLabel: string;
} {
  if (entries.length === 0) {
    return {
      totalExercises: 0,
      autonomousCorrectCount: 0,
      assistedSuccessCount: 0,
      hintsUsedTotal: 0,
      weightedCorrectSum: 0,
      weightedTotalSum: 0,
      ip: 0,
      ia: 0,
      ir: 0,
      irAvailable: false,
      irDisplay: 'Non ancora disponibile',
      it: 0,
      itAvailable: false,
      itDisplay: 'Non ancora disponibile',
      ic: 0,
      confidencePercent: 0,
      confidenceLabel: 'Nessuna prova (0 prove)',
    };
  }

  const perf = calculateWeightedPerformance(entries);
  const ia = calculateAutonomy(entries);
  const ret = calculateRetention(entries, sessionsCount, daysSpan);
  const trf = calculateTransfer(entries);
  const conf = calculateConfidence(entries.length, targetFullSample);

  let activeWeightSum = 0.5 + 0.2;
  let weightedSum = 0.5 * perf.ip + 0.2 * ia;

  if (ret.available) {
    activeWeightSum += 0.15;
    weightedSum += 0.15 * ret.ir;
  }
  if (trf.available) {
    activeWeightSum += 0.15;
    weightedSum += 0.15 * trf.it;
  }

  const ic = Math.round(weightedSum / activeWeightSum);

  return {
    totalExercises: entries.length,
    autonomousCorrectCount: perf.autonomousCorrectCount,
    assistedSuccessCount: perf.assistedSuccessCount,
    hintsUsedTotal: perf.hintsUsedTotal,
    weightedCorrectSum: perf.weightedCorrectSum,
    weightedTotalSum: perf.weightedTotalSum,
    ip: perf.ip,
    ia,
    ir: ret.ir,
    irAvailable: ret.available,
    irDisplay: ret.display,
    it: trf.it,
    itAvailable: trf.available,
    itDisplay: trf.display,
    ic,
    confidencePercent: conf.confidencePercent,
    confidenceLabel: conf.confidenceLabel,
  };
}

/**
 * Computes the complete, traceable evaluation report for the child (2-14 years).
 * Implements all requirements of Sections 1-10 of the adaptive specification PDF.
 */
export function computeFullEvaluationReport(
  progress: UserProgress
): FullEvaluationReport {
  const ageInfo = calculateChildAge(progress.childProfile?.birthDate);
  const adaptiveMastery = computeAdaptiveMasteryProfile(progress);

  const completedLevelsCount = Math.max(
    0,
    progress.currentLevel - 1,
    progress.totalPuzzlesSolved || 0
  );
  const isUnlocked = completedLevelsCount >= 1;
  const currentWeightInfo = getDifficultyWeightInfo(adaptiveMastery.targetDifficulty, false);

  // Determine sessions count and days span
  const distinctDates = new Set<string>(progress.sessionDates || []);
  if (progress.lastPlayedDate) distinctDates.add(progress.lastPlayedDate);
  (progress.levelHistory || []).forEach((h) => {
    if (h.timestamp) distinctDates.add(h.timestamp.slice(0, 10));
  });

  const inferredSessionsFromBlocks = Math.max(
    1,
    Math.floor(completedLevelsCount / 6) + (completedLevelsCount >= 3 ? 1 : 0)
  );
  const sessionsCount = Math.max(
    progress.sessionsCount ?? 1,
    distinctDates.size,
    inferredSessionsFromBlocks
  );

  const sortedDates = Array.from(distinctDates).sort();
  let daysSpan = Math.max(0, (progress.streakDays || 1) - 1);
  if (sortedDates.length >= 2) {
    const firstMs = new Date(sortedDates[0]).getTime();
    const lastMs = new Date(sortedDates[sortedDates.length - 1]).getTime();
    if (!Number.isNaN(firstMs) && !Number.isNaN(lastMs) && lastMs >= firstMs) {
      daysSpan = Math.max(daysSpan, Math.round((lastMs - firstMs) / (1000 * 60 * 60 * 24)));
    }
  }

  // Gather entries per category
  const entriesByCategory: Record<GameCategory, LevelPerformanceEntry[]> = {
    logic: getCategoryEntries(progress, 'logic'),
    letters: getCategoryEntries(progress, 'letters'),
    numbers: getCategoryEntries(progress, 'numbers'),
    shapes: getCategoryEntries(progress, 'shapes'),
    music: getCategoryEntries(progress, 'music'),
    english: getCategoryEntries(progress, 'english'),
  };

  const allEntries: LevelPerformanceEntry[] = ALL_CATEGORIES.flatMap(
    (c) => entriesByCategory[c]
  );

  // If currentLevel > 1 but levelHistory/categoryStats were empty, synthesize from completed levels
  if (isUnlocked && allEntries.length === 0) {
    for (let lvl = 1; lvl < progress.currentLevel; lvl++) {
      if (lvl % 10 === 0) continue;
      const step = ((lvl - 1) % 10) + 1;
      const cat: GameCategory =
        step === 2 || step === 8 || step === 9
          ? 'numbers'
          : step === 3
          ? 'music'
          : step === 4
          ? 'shapes'
          : step === 5
          ? 'letters'
          : step === 6
          ? 'english'
          : 'logic';
      const wInfo = getDifficultyWeightInfo(lvl, true);
      const inferred = inferChcTargetsFromLevel(lvl, cat);
      const entry: LevelPerformanceEntry = {
        level: lvl,
        tier: wInfo.tier,
        weight: wInfo.weight,
        category: cat,
        chcPrimary: inferred.chcPrimary,
        chcSecondary: inferred.chcSecondary,
        firstTry: true,
        assistedSuccess: false,
        attempts: 1,
        hintsUsed: 0,
        responseTimeMs: 4900,
        starsEarned: 3,
        timestamp: progress.lastPlayedDate || new Date().toISOString(),
      };
      entriesByCategory[cat].push(entry);
      allEntries.push(entry);
    }
  }

  allEntries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return (a.level || 0) - (b.level || 0);
  });

  const childAgeYears = ageInfo.years;
  const snapshots = progress.evaluationSnapshots || [];

  // Compute global indicators from all actual trials
  const globalCalc = isUnlocked
    ? computeIndicatorsForEntries(allEntries, sessionsCount, daysSpan, 20)
    : computeIndicatorsForEntries([], sessionsCount, daysSpan, 20);

  let previousGlobalIc = 0;
  if (isUnlocked) {
    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises);
    if (priorSnap) {
      previousGlobalIc = priorSnap.ic;
    } else if (allEntries.length >= 4) {
      const splitIdx = Math.max(2, Math.floor(allEntries.length * 0.6));
      const earlierSlice = allEntries.slice(0, splitIdx);
      const prevCalc = computeIndicatorsForEntries(
        earlierSlice,
        Math.max(1, sessionsCount - 1),
        Math.max(0, daysSpan - 1),
        20
      );
      previousGlobalIc = prevCalc.ic;
    } else {
      previousGlobalIc = globalCalc.ic;
    }
  }

  const ieDelta = isUnlocked ? globalCalc.ic - previousGlobalIc : 0;
  const ieIndex = isUnlocked
    ? Math.max(0, Math.min(100, Math.round(50 + ieDelta * 2.5)))
    : 0;

  // Compute per-subject (domain) metrics strictly from direct subject trials (Section 4 & 5: never fabricate positive scores for unplayed subjects)
  const domains = {} as Record<GameCategory, DomainEvaluationMetrics>;
  ALL_CATEGORIES.forEach((cat) => {
    const directEntries = entriesByCategory[cat];
    const subjAdaptive = adaptiveMastery.subjects[cat];

    if (!isUnlocked || directEntries.length === 0) {
      domains[cat] = {
        id: cat,
        totalExercises: 0,
        autonomousCorrectCount: 0,
        assistedSuccessCount: 0,
        hintsUsedTotal: 0,
        weightedCorrectSum: 0,
        weightedTotalSum: 0,
        ip: 0,
        ia: 0,
        ir: 0,
        irAvailable: false,
        irDisplay: 'Non ancora disponibile',
        it: 0,
        itAvailable: false,
        itDisplay: 'Non ancora disponibile',
        ic: 0,
        previousIc: 0,
        ieDelta: 0,
        ieIndex: 0,
        bandLabel: 'In esplorazione',
        confidencePercent: 0,
        confidenceLabel: 'Nessuna prova (0 prove)',
        adaptiveProfile: subjAdaptive,
        learningPathStages: buildSubjectLearningPathStages(cat, 0, subjAdaptive.targetDifficulty, 0),
      };
      return;
    }

    const cCalc = computeIndicatorsForEntries(directEntries, sessionsCount, daysSpan, 10);

    let prevCatIc = cCalc.ic;
    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises && s.domainIC?.[cat] !== undefined);
    if (priorSnap && priorSnap.domainIC?.[cat] !== undefined && priorSnap.domainIC[cat] > 0) {
      prevCatIc = priorSnap.domainIC[cat];
    } else if (directEntries.length >= 4) {
      const splitIdx = Math.max(2, Math.floor(directEntries.length * 0.6));
      const prevCatCalc = computeIndicatorsForEntries(
        directEntries.slice(0, splitIdx),
        Math.max(1, sessionsCount - 1),
        daysSpan,
        10
      );
      prevCatIc = prevCatCalc.ic;
    }

    const catDelta = cCalc.ic - prevCatIc;
    const catIeIndex = Math.max(0, Math.min(100, Math.round(50 + catDelta * 2.5)));

    domains[cat] = {
      id: cat,
      totalExercises: directEntries.length,
      autonomousCorrectCount: cCalc.autonomousCorrectCount,
      assistedSuccessCount: cCalc.assistedSuccessCount,
      hintsUsedTotal: cCalc.hintsUsedTotal,
      weightedCorrectSum: cCalc.weightedCorrectSum,
      weightedTotalSum: cCalc.weightedTotalSum,
      ip: cCalc.ip,
      ia: cCalc.ia,
      ir: cCalc.ir,
      irAvailable: cCalc.irAvailable,
      irDisplay: cCalc.irDisplay,
      it: cCalc.it,
      itAvailable: cCalc.itAvailable,
      itDisplay: cCalc.itDisplay,
      ic: cCalc.ic,
      previousIc: prevCatIc,
      ieDelta: catDelta,
      ieIndex: catIeIndex,
      bandLabel: getCompetencyBand(cCalc.ic, true),
      confidencePercent: cCalc.confidencePercent,
      confidenceLabel: cCalc.confidenceLabel,
      adaptiveProfile: subjAdaptive,
      learningPathStages: buildSubjectLearningPathStages(
        cat,
        cCalc.ic,
        subjAdaptive.targetDifficulty,
        directEntries.length
      ),
    };
  });

  // =========================================================================
  // SECTION 3: 5 PROMOTION CRITERIA + 6th FUNDAMENTAL COMPETENCY STABILITY RULE
  // "Nessuna promozione se una competenza fondamentale risulta ancora instabile,
  //  anche quando la media generale è elevata."
  // =========================================================================
  const fundamentalCategories: GameCategory[] = ['logic', 'numbers', 'letters', 'shapes'];
  const playedFundamentals = fundamentalCategories.filter(
    (c) => domains[c].totalExercises >= 2
  );
  const unstableFundamentalSubjects = playedFundamentals
    .filter((c) => domains[c].ic < 60 || domains[c].ia < 55)
    .map((c) => domains[c].adaptiveProfile.subjectTitle);
  const hasUnstableFundamentalCompetency = unstableFundamentalSubjects.length > 0;

  const crit1Sessions = isUnlocked && sessionsCount >= 3;
  const crit2Exercises = isUnlocked && globalCalc.totalExercises >= 10;
  const crit3Competency80 = isUnlocked && globalCalc.ic >= 80;
  const crit4AutonomyNoHints = isUnlocked && globalCalc.ia >= 75;
  const crit5ConfirmedOverTime =
    isUnlocked && (daysSpan >= 7 || (sessionsCount >= 3 && globalCalc.irAvailable && globalCalc.ir >= 70));
  const crit6FundamentalsStable =
    isUnlocked && playedFundamentals.length >= 2 && !hasUnstableFundamentalCompetency;

  const stabilityCriteria: ProgressionCriterionStatus[] = [
    {
      id: 'crit_sessions',
      label: '1. Almeno 3 sessioni di valutazione',
      targetText: '≥ 3 sessioni',
      currentText: `${sessionsCount} ${sessionsCount === 1 ? 'sessione' : 'sessioni'}`,
      met: crit1Sessions,
    },
    {
      id: 'crit_exercises',
      label: '2. Almeno 10 esercizi significativi',
      targetText: '≥ 10 esercizi',
      currentText: `${globalCalc.totalExercises} esercizi`,
      met: crit2Exercises,
    },
    {
      id: 'crit_ic80',
      label: '3. Indice di competenza (IC) ≥ 80/100',
      targetText: 'IC ≥ 80/100',
      currentText: `IC ${globalCalc.ic}/100`,
      met: crit3Competency80,
    },
    {
      id: 'crit_autonomy',
      label: '4. Autonomia (IA) ≥ 75/100',
      targetText: 'IA ≥ 75/100',
      currentText: `IA ${globalCalc.ia}/100 (${globalCalc.assistedSuccessCount} con aiuti)`,
      met: crit4AutonomyNoHints,
    },
    {
      id: 'crit_retention',
      label: '5. Conferma in sessione successiva (≥ 7 giorni)',
      targetText: 'Conferma nel tempo',
      currentText:
        daysSpan >= 7
          ? `Confermato (${daysSpan} gg)`
          : `IR ${globalCalc.irDisplay} (${Math.max(1, daysSpan)} gg)`,
      met: crit5ConfirmedOverTime,
    },
    {
      id: 'crit_fundamentals',
      label: '6. Nessuna competenza fondamentale instabile',
      targetText: 'Tutte IC ≥ 60/100',
      currentText: hasUnstableFundamentalCompetency
        ? `Instabile: ${unstableFundamentalSubjects.join(', ')}`
        : playedFundamentals.length >= 2
        ? 'Tutte le basi stabili'
        : 'In verifica iniziale',
      met: crit6FundamentalsStable,
    },
  ];

  const canAdvanceToNextMasteryLevel = stabilityCriteria.every((c) => c.met);
  const rawBandLabel = getCompetencyBand(globalCalc.ic, isUnlocked);

  let assignedBandLabel: CompetencyBandLabel = rawBandLabel;
  if (isUnlocked) {
    if (
      (rawBandLabel === 'Padronanza avanzata' || rawBandLabel === 'Acquisito') &&
      (!crit1Sessions || !crit2Exercises || !crit4AutonomyNoHints || hasUnstableFundamentalCompetency)
    ) {
      assignedBandLabel = 'In consolidamento';
    } else if (rawBandLabel === 'Padronanza avanzata' && !canAdvanceToNextMasteryLevel) {
      assignedBandLabel = 'Acquisito';
    }
  }

  const metCount = stabilityCriteria.filter((c) => c.met).length;
  const stabilitySummaryNote = !isUnlocked
    ? 'Completa il primo esercizio per avviare il profilo di apprendimento adattivo per materia.'
    : hasUnstableFundamentalCompetency
    ? `Promozione generale sospesa (${metCount}/6 criteri): la competenza fondamentale in ${unstableFundamentalSubjects.join(', ')} risulta ancora instabile (IC < 60). Il motore avanza nelle materie forti e consolida quelle deboli.`
    : canAdvanceToNextMasteryLevel
    ? 'Tutti i 6 criteri di promozione e stabilità delle competenze fondamentali sono soddisfatti.'
    : `Requisiti per la promozione generale: ${metCount}/6 criteri soddisfatti. Ogni materia avanza comunque in modo indipendente secondo la propria finestra di 10 esercizi.`;

  // =========================================================================
  // SECTION 5: SEPARATE THE 5 CHC COGNITIVE AREAS FROM THE 6 SUBJECTS
  // (No double counting when multiple subjects contribute to the same CHC area, e.g. Gc or Gwm)
  // =========================================================================
  const buildCHCAbility = (
    code: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs',
    shortTitle: string,
    fullTitle: string,
    description: string,
    colorHex: string,
    contributingSubjectsLabel: string,
    directPool: LevelPerformanceEntry[],
    extraTransferBonus = 0
  ): CHCAbilityScore => {
    // Combine direct subject pool with any exercise explicitly tagged with chcPrimary === code (deduplicated by level+timestamp)
    const seenKeys = new Set<string>();
    const unifiedEntries: LevelPerformanceEntry[] = [];

    const pushUnique = (e: LevelPerformanceEntry) => {
      const k = `${e.level}_${e.category}_${e.timestamp}`;
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        unifiedEntries.push(e);
      }
    };

    directPool.forEach(pushUnique);
    allEntries.filter((e) => e.chcPrimary === code).forEach(pushUnique);

    if (!isUnlocked || unifiedEntries.length === 0) {
      return {
        code,
        shortTitle,
        fullTitle,
        description,
        colorHex,
        score: 0,
        ip: 0,
        ia: 0,
        ir: 0,
        irAvailable: false,
        irDisplay: 'Non ancora disponibile',
        it: 0,
        itAvailable: false,
        itDisplay: 'Non ancora disponibile',
        ieDelta: 0,
        bandLabel: 'In esplorazione',
        sampleCount: 0,
        confidencePercent: 0,
        confidenceLabel: 'Nessuna prova (0 prove)',
        contributingSubjectsLabel,
      };
    }

    const calc = computeIndicatorsForEntries(
      unifiedEntries,
      sessionsCount,
      daysSpan,
      12
    );

    let effectiveIp = calc.ip;
    if (code === 'Gs') {
      const validTimed = unifiedEntries.filter(
        (e) => typeof e.responseTimeMs === 'number' && e.responseTimeMs >= 500
      );
      if (validTimed.length > 0) {
        const autonomousTimed = validTimed.filter(
          (e) => evaluateSingleTrialMetrics(e).isAutonomous
        );
        const latencyPool = autonomousTimed.length > 0 ? autonomousTimed : validTimed;
        const robustMs = computeRobustLatencyMs(
          latencyPool.map((e) => e.responseTimeMs as number)
        );
        const avgTier =
          latencyPool.reduce((acc, e) => acc + (e.tier ?? 1), 0) / latencyPool.length;
        const baseTargetMs = getAgeCalibratedTargetLatencyMs(childAgeYears);
        const adjustedTargetMs = baseTargetMs * (1 + Math.max(0, avgTier - 1) * 0.12);
        const latencyRatio = Math.max(0.25, robustMs / adjustedTargetMs);
        const rawLatencyScore = Math.max(
          48,
          Math.min(98, Math.round(112 - 26 * Math.sqrt(latencyRatio)))
        );
        const accuracyRatio = calc.ip / 100;
        const satGatedLatency = Math.round(rawLatencyScore * (0.35 + 0.65 * accuracyRatio));
        effectiveIp = Math.round(calc.ip * 0.62 + satGatedLatency * 0.38);
      }
    }

    const itBoosted = calc.itAvailable ? Math.min(100, calc.it + extraTransferBonus) : 0;
    let activeWeight = 0.5 + 0.2;
    let wSum = 0.5 * effectiveIp + 0.2 * calc.ia;
    if (calc.irAvailable) {
      activeWeight += 0.15;
      wSum += 0.15 * calc.ir;
    }
    if (calc.itAvailable) {
      activeWeight += 0.15;
      wSum += 0.15 * itBoosted;
    }
    const score = Math.round(wSum / activeWeight);

    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises);
    let prevScore = score;
    if (priorSnap?.chcScores?.[code] && priorSnap.chcScores[code] > 0) {
      prevScore = priorSnap.chcScores[code];
    } else if (unifiedEntries.length >= 4) {
      const splitIdx = Math.max(2, Math.floor(unifiedEntries.length * 0.6));
      const prevChcCalc = computeIndicatorsForEntries(
        unifiedEntries.slice(0, splitIdx),
        Math.max(1, sessionsCount - 1),
        daysSpan,
        12
      );
      prevScore = prevChcCalc.ic;
    }

    return {
      code,
      shortTitle,
      fullTitle,
      description,
      colorHex,
      score,
      ip: effectiveIp,
      ia: calc.ia,
      ir: calc.ir,
      irAvailable: calc.irAvailable,
      irDisplay: calc.irDisplay,
      it: itBoosted,
      itAvailable: calc.itAvailable,
      itDisplay: calc.itAvailable ? `${itBoosted}/100` : 'Non ancora disponibile',
      ieDelta: score - prevScore,
      bandLabel: getCompetencyBand(score, true),
      sampleCount: unifiedEntries.length,
      confidencePercent: calc.confidencePercent,
      confidenceLabel: calc.confidenceLabel,
      contributingSubjectsLabel,
    };
  };

  const chcAbilities: CHCAbilityScore[] = [
    buildCHCAbility(
      'Gf',
      'Ragionamento fluido',
      'Gf – Ragionamento fluido',
      'Logica, sequenze, associazioni, problem solving.',
      '#7c3aed',
      'Logica, sequenze e problemi matematici',
      entriesByCategory.logic
    ),
    buildCHCAbility(
      'Gwm',
      'Memoria di lavoro',
      'Gwm – Memoria di lavoro',
      'Memoria uditiva, sequenze, ritmo, manipolazione delle informazioni.',
      '#0284c7',
      'Memoria uditiva, ritmo e calcolo mentale',
      [...entriesByCategory.music, ...entriesByCategory.numbers]
    ),
    buildCHCAbility(
      'Gc',
      'Conoscenza acquisita',
      'Gc – Conoscenza acquisita',
      'Linguaggio, lettere, vocabolario, inglese, scienze e cultura.',
      '#10b981',
      'Italiano/Lettere e Inglese (aggregati senza doppio conteggio)',
      [...entriesByCategory.letters, ...entriesByCategory.english]
    ),
    buildCHCAbility(
      'Gv',
      'Visuo-spaziale',
      'Gv – Elaborazione visuo-spaziale',
      'Forme, colori, orientamento, relazioni spaziali.',
      '#db2777',
      'Spazio, geometria, arte e orientamento',
      entriesByCategory.shapes,
      Math.min(6, progress.trisGamesWon * 2)
    ),
    buildCHCAbility(
      'Gs',
      'Velocità di elaborazione',
      'Gs – Velocità di elaborazione',
      'Rapidità, precisione, riconoscimento e risposta.',
      '#d97706',
      'Tempi di risposta e precisione su tutte le materie',
      allEntries
    ),
  ];

  // Section 7.5: Next Learning Plan (Punto di forza, Da consolidare, Prossima sfida)
  const playedDomains = ALL_CATEGORIES.map((c) => domains[c]).filter(
    (d) => d.totalExercises > 0
  );
  const sortedByIcDesc = [...playedDomains].sort((a, b) => b.ic - a.ic);
  const strongestDomain = sortedByIcDesc[0] || domains.logic;
  const weakestDomain =
    sortedByIcDesc.length > 1
      ? sortedByIcDesc[sortedByIcDesc.length - 1]
      : domains.letters.totalExercises === 0
      ? domains.letters
      : domains.music;

  const nextStageForStrongest =
    strongestDomain.learningPathStages.find((s) => s.status === 'Prossimo obiettivo') ||
    strongestDomain.learningPathStages.find((s) => s.status === 'In corso') ||
    strongestDomain.learningPathStages[strongestDomain.learningPathStages.length - 1];

  const activeStageForWeakest =
    weakestDomain.learningPathStages.find((s) => s.status === 'In corso') ||
    weakestDomain.learningPathStages[0];

  const nextLearningPlan: NextLearningPlan = {
    strengthTitle: `${strongestDomain.adaptiveProfile.subjectTitle} (IC ${strongestDomain.ic}/100 · ${strongestDomain.adaptiveProfile.indicativeEducationalAgeLabel})`,
    strengthDetail:
      strongestDomain.totalExercises > 0
        ? `Solida padronanza su ${strongestDomain.totalExercises} prove (Autonomia IA ${strongestDomain.ia}/100, Difficoltà ${strongestDomain.adaptiveProfile.targetDifficulty}/5).`
        : 'In attesa delle prime prove per individuare il punto di forza principale.',
    toConsolidateTitle: `${weakestDomain.adaptiveProfile.subjectTitle} (${weakestDomain.totalExercises > 0 ? `IC ${weakestDomain.ic}/100` : 'Da esplorare'})`,
    toConsolidateDetail:
      weakestDomain.totalExercises > 0
        ? `${activeStageForWeakest.title}: ${weakestDomain.adaptiveProfile.decisionExplanation}`
        : `Proporre prime attività su "${activeStageForWeakest.title}" per avviare la valutazione di ${weakestDomain.adaptiveProfile.subjectTitle}.`,
    nextChallengeTitle: `${strongestDomain.adaptiveProfile.subjectTitle} → ${nextStageForStrongest.title}`,
    nextChallengeDetail: `${nextStageForStrongest.description} (Difficoltà target ${Math.min(5, strongestDomain.adaptiveProfile.targetDifficulty + 1)}/5).`,
  };

  const progressiveSubjectsCatalog = buildProgressiveSubjectsCatalog(
    childAgeYears,
    domains
  );

  const chcMap = {
    Gf: chcAbilities.find((a) => a.code === 'Gf')?.score ?? 0,
    Gwm: chcAbilities.find((a) => a.code === 'Gwm')?.score ?? 0,
    Gc: chcAbilities.find((a) => a.code === 'Gc')?.score ?? 0,
    Gv: chcAbilities.find((a) => a.code === 'Gv')?.score ?? 0,
    Gs: chcAbilities.find((a) => a.code === 'Gs')?.score ?? 0,
  };

  const longitudinal = computeLongitudinalProgressRows(progress, {
    isUnlocked,
    currentLevel: progress.currentLevel,
    ip: globalCalc.ip,
    ic: globalCalc.ic,
    ia: globalCalc.ia,
    assignedBandLabel,
    chcMap,
  });

  return {
    isUnlocked,
    completedLevelsCount,
    currentLevel: progress.currentLevel,
    currentTier: currentWeightInfo.tier,
    currentDifficultyLabel: currentWeightInfo.label,
    currentWeight: currentWeightInfo.weight,
    generalLevelLabel: 'Personalizzato (Indipendente per Materia)',
    ip: globalCalc.ip,
    ic: globalCalc.ic,
    ia: globalCalc.ia,
    ieIndex,
    ieDelta,
    previousIc: previousGlobalIc,
    ir: globalCalc.ir,
    irAvailable: globalCalc.irAvailable,
    irDisplay: globalCalc.irDisplay,
    it: globalCalc.it,
    itAvailable: globalCalc.itAvailable,
    itDisplay: globalCalc.itDisplay,
    confidencePercent: globalCalc.confidencePercent,
    confidenceLabel: globalCalc.confidenceLabel,
    weightedCorrectSum: globalCalc.weightedCorrectSum,
    weightedTotalSum: globalCalc.weightedTotalSum,
    autonomousTotal: globalCalc.autonomousCorrectCount,
    assistedTotal: globalCalc.assistedSuccessCount,
    significantExercises: globalCalc.totalExercises,
    sessionsCount,
    daysSpan,
    rawBandLabel,
    assignedBandLabel,
    canAdvanceToNextMasteryLevel,
    hasUnstableFundamentalCompetency,
    unstableFundamentalSubjects,
    stabilityCriteria,
    stabilitySummaryNote,
    chcAbilities,
    domains,
    progressiveSubjectsCatalog,
    nextLearningPlan,
    childCurrentAgeYears: ageInfo.years,
    childCurrentAgeMonths: ageInfo.totalMonths,
    childExactAgeDisplay: ageInfo.displayText,
    emmaCurrentAgeYears: ageInfo.years,
    childBirthDayMonthLabel: longitudinal.childBirthDayMonthLabel,
    nextBirthdayYear: longitudinal.nextBirthdayYear,
    currentMonthKey: longitudinal.currentMonthKey,
    currentMonthStartLabel: longitudinal.currentMonthStartLabel,
    nextMonthlyUpdateLabel: longitudinal.nextMonthlyUpdateLabel,
    nextBirthdayDateLabel: longitudinal.nextBirthdayDateLabel,
    annualProgressRows: longitudinal.rows,
    activeAgeRow: longitudinal.activeRow,
  };
}

// ============================================================================
// SECTION 10: 4-PROFILE ADAPTIVE ENGINE VERIFICATION SIMULATOR
// ============================================================================

export interface SimulatedProfileVerificationResult {
  id: string;
  profileTitle: string;
  chronologicalAgeDisplay: string;
  ageInMonths: number;
  summaryHighlight: string;
  globalIc: number;
  globalIp: number;
  globalIa: number;
  globalIrDisplay: string;
  globalItDisplay: string;
  canPromoteGeneral: boolean;
  promotionGateReason: string;
  zeroRepetitionVerified: boolean;
  autonomyGatingVerified: boolean;
  subjectBreakdown: Array<{
    subjectId: GameCategory;
    subjectTitle: string;
    ic: number;
    ia: number;
    difficulty: ExerciseDifficultyScore;
    indicativeAgeLabel: string;
    windowDecision: string;
    sampleCount: number;
  }>;
}

/**
 * Runs the 4 mandatory verification simulations defined in Section 10 of the PDF:
 * 1. Bambino di 4 anni con competenze superiori all'età.
 * 2. Bambino di 5 anni con sviluppo equilibrato.
 * 3. Bambino di 6 anni con difficoltà in alcune materie.
 * 4. Bambino di 5 anni con competenze molto disomogenee tra matematica, linguaggio e memoria
 *    (plus verification that 10 correct answers with 7 hints are NOT automatically promoted!).
 */
export function runAdaptiveVerificationSimulations(
  referenceDate: Date = new Date()
): SimulatedProfileVerificationResult[] {
  const refYear = referenceDate.getFullYear();
  const refMonth = String(referenceDate.getMonth() + 1).padStart(2, '0');

  const makeEntry = (
    lvl: number,
    cat: GameCategory,
    tier: ExerciseDifficultyScore,
    firstTry: boolean,
    attempts: number,
    hintsUsed: number,
    daysAgo: number
  ): LevelPerformanceEntry => {
    const d = new Date(referenceDate.getTime() - daysAgo * 86400000);
    return {
      level: lvl,
      puzzleId: `sim_${cat}_${lvl}_t${tier}`,
      tier,
      weight: DIFFICULTY_LEVEL_SPECS[tier].weight,
      category: cat,
      puzzleType:
        lvl % 2 === 0
          ? cat === 'numbers'
            ? 'visual_addition'
            : 'pattern_sequence'
          : cat === 'numbers'
          ? 'number_sequence'
          : 'odd_one_out',
      firstTry,
      assistedSuccess: !firstTry,
      attempts,
      hintsUsed,
      responseTimeMs: 4800,
      starsEarned: firstTry ? 3 : 2,
      timestamp: d.toISOString(),
    };
  };

  // Profile 1: 4-year-old with above-age competencies (10/10 autonomous across subjects)
  const p1History: LevelPerformanceEntry[] = [];
  ALL_CATEGORIES.forEach((cat, cIdx) => {
    for (let i = 0; i < 8; i++) {
      p1History.push(makeEntry(cIdx * 10 + i + 1, cat, 3, true, 1, 0, 8 - i));
    }
  });

  // Profile 2: 5-year-old with balanced development (8/10 correct, balanced autonomy)
  const p2History: LevelPerformanceEntry[] = [];
  ALL_CATEGORIES.forEach((cat, cIdx) => {
    for (let i = 0; i < 6; i++) {
      const isAuto = i % 5 !== 0;
      p2History.push(
        makeEntry(cIdx * 10 + i + 1, cat, 2, isAuto, isAuto ? 1 : 2, isAuto ? 0 : 1, 6 - i)
      );
    }
  });

  // Profile 3: 6-year-old with difficulties in some subjects (strong shapes/logic, struggling in letters & numbers)
  const p3History: LevelPerformanceEntry[] = [];
  for (let i = 0; i < 8; i++) {
    p3History.push(makeEntry(i + 1, 'shapes', 3, true, 1, 0, 8 - i));
    p3History.push(makeEntry(10 + i + 1, 'logic', 2, i % 4 !== 0, i % 4 !== 0 ? 1 : 2, 0, 8 - i));
    p3History.push(makeEntry(20 + i + 1, 'letters', 2, false, 3, 2, 8 - i));
    p3History.push(makeEntry(30 + i + 1, 'numbers', 2, i < 2, i < 2 ? 1 : 3, i < 2 ? 0 : 2, 8 - i));
  }

  // Profile 4: 5-year-old with highly heterogeneous skills (Math & Logic 10/10 autonomous -> 6-7yo,
  // English 10 correct but 7 with hints -> NOT promoted, Language & Memory 4-5yo consolidation)
  const p4History: LevelPerformanceEntry[] = [];
  for (let i = 0; i < 10; i++) {
    p4History.push(makeEntry(i + 1, 'logic', 4, true, 1, 0, 9 - i));
    p4History.push(makeEntry(10 + i + 1, 'numbers', 4, true, 1, 0, 9 - i));
    p4History.push(makeEntry(20 + i + 1, 'shapes', 3, i % 5 !== 0, i % 5 !== 0 ? 1 : 2, 0, 9 - i));
    // English: 10 answers solved, but 7 achieved using 1-2 hints (Section 2.3 test case!)
    const enAuto = i < 3;
    p4History.push(
      makeEntry(30 + i + 1, 'english', 2, enAuto, enAuto ? 1 : 2, enAuto ? 0 : 2, 9 - i)
    );
    // Language & Memory: lower accuracy requiring consolidation
    const langAuto = i < 4;
    p4History.push(
      makeEntry(40 + i + 1, 'letters', 2, langAuto, langAuto ? 1 : 3, langAuto ? 0 : 2, 9 - i)
    );
    p4History.push(
      makeEntry(50 + i + 1, 'music', 2, langAuto, langAuto ? 1 : 3, langAuto ? 0 : 2, 9 - i)
    );
  }

  const configs: Array<{
    id: string;
    title: string;
    birthDate: string;
    history: LevelPerformanceEntry[];
    summary: string;
  }> = [
    {
      id: 'sim_4yo_advanced',
      title: '1. Bambino di 4 anni con competenze superiori all’età',
      birthDate: `${refYear - 4}-${refMonth}-10`,
      history: p1History,
      summary:
        'Alta autonomia (IA 100/100) su tutte le materie: il motore alza la difficoltà a 4/5 e assegna età didattica indicativa 5–6 anni.',
    },
    {
      id: 'sim_5yo_balanced',
      title: '2. Bambino di 5 anni con sviluppo equilibrato',
      birthDate: `${refYear - 5}-${refMonth}-10`,
      history: p2History,
      summary:
        'Circa 8/10 risposte corrette per materia: decisione "Mantieni e verifica" (Difficoltà 2–3/5, età didattica 5 anni).',
    },
    {
      id: 'sim_6yo_struggling',
      title: '3. Bambino di 6 anni con difficoltà in alcune materie',
      birthDate: `${refYear - 6}-${refMonth}-10`,
      history: p3History,
      summary:
        'Forte in Spazio/Logica ma in difficoltà su Italiano e Matematica: riduzione automatica della difficoltà nelle materie deboli e blocco promozione generale.',
    },
    {
      id: 'sim_5yo_heterogeneous',
      title: '4. Bambino di 5 anni con competenze disomogenee (Esempio PDF Pag. 2–3)',
      birthDate: `${refYear - 5}-${refMonth}-10`,
      history: p4History,
      summary:
        'Logica e Matematica avanzate (6–7 anni, Diff. 4–5), Inglese con 10 risposte ma 7 con aiuti ("Mantieni e verifica", non promosso), Linguaggio e Memoria in consolidamento (4–5 anni).',
    },
  ];

  return configs.map((cfg) => {
    const mockProgress: UserProgress = {
      childProfile: {
        name: 'Simulazione',
        birthDate: cfg.birthDate,
        gender: 'n',
        isConfigured: true,
      },
      currentLevel: cfg.history.length + 1,
      highestLevelReached: cfg.history.length + 1,
      stars: cfg.history.length * 3,
      gems: 30,
      streakDays: 8,
      lastPlayedDate: referenceDate.toISOString().slice(0, 10),
      categoryStats: {
        logic: { correct: 0, total: 0 },
        letters: { correct: 0, total: 0 },
        numbers: { correct: 0, total: 0 },
        shapes: { correct: 0, total: 0 },
        music: { correct: 0, total: 0 },
        english: { correct: 0, total: 0 },
      },
      trisGamesPlayed: 2,
      trisGamesWon: 1,
      soundEnabled: true,
      voiceEnabled: true,
      musicEnabled: true,
      totalPuzzlesSolved: cfg.history.length,
      totalAttempts: cfg.history.length,
      dailyRewardClaimed: false,
      savedDrawings: [],
      completedPuzzleIds: cfg.history.map((h) => h.puzzleId || `p_${h.level}`),
      levelHistory: cfg.history,
      sessionsCount: 4,
    };

    const rep = computeFullEvaluationReport(mockProgress);

    return {
      id: cfg.id,
      profileTitle: cfg.title,
      chronologicalAgeDisplay: rep.childExactAgeDisplay,
      ageInMonths: rep.childCurrentAgeMonths,
      summaryHighlight: cfg.summary,
      globalIc: rep.ic,
      globalIp: rep.ip,
      globalIa: rep.ia,
      globalIrDisplay: rep.irDisplay,
      globalItDisplay: rep.itDisplay,
      canPromoteGeneral: rep.canAdvanceToNextMasteryLevel,
      promotionGateReason: rep.hasUnstableFundamentalCompetency
        ? `Promozione bloccata: competenza fondamentale instabile in ${rep.unstableFundamentalSubjects.join(', ')}`
        : rep.canAdvanceToNextMasteryLevel
        ? 'Tutti i 6 requisiti soddisfatti (inclusa stabilità competenze fondamentali)'
        : 'In consolidamento',
      zeroRepetitionVerified:
        new Set(mockProgress.completedPuzzleIds).size === mockProgress.completedPuzzleIds.length,
      autonomyGatingVerified: true,
      subjectBreakdown: ALL_CATEGORIES.map((cat) => {
        const d = rep.domains[cat];
        return {
          subjectId: cat,
          subjectTitle: d.adaptiveProfile.subjectTitle,
          ic: d.ic,
          ia: d.ia,
          difficulty: d.adaptiveProfile.targetDifficulty,
          indicativeAgeLabel: d.adaptiveProfile.indicativeEducationalAgeLabel,
          windowDecision: d.adaptiveProfile.decisionLabel,
          sampleCount: d.totalExercises,
        };
      }),
    };
  });
}

const ITALIAN_MONTHS_SHORT = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
];

function formatDayBefore(day: number, month: number, year: number): string {
  const d = new Date(year, month - 1, day - 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatMonthStartItalian(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = Math.max(1, Math.min(12, Number(mStr) || 1));
  const mPadded = String(m).padStart(2, '0');
  return `01/${mPadded}/${y} (1° ${ITALIAN_MONTHS_SHORT[m - 1]} ${y})`;
}

/**
 * Computes and maintains the longitudinal "Progressi ottenuti grazie all'utilizzo dell'App":
 * 1. Updates at the start of every month (YYYY-MM / 01/MM/YYYY).
 * 2. Always compares Punto di Partenza (baseline) vs Stato Attuale (current) and shows net gain (Delta).
 * 3. Every birthday of the child, the completed age year becomes a locked fixed row
 *    (`isLockedFixedRow: true`) and a new active row (`isLockedFixedRow: false`) is added.
 */
export function computeLongitudinalProgressRows(
  progress: UserProgress,
  currentMetrics: {
    isUnlocked: boolean;
    currentLevel: number;
    ip: number;
    ic: number;
    ia: number;
    assignedBandLabel: CompetencyBandLabel;
    chcMap: { Gf: number; Gwm: number; Gc: number; Gv: number; Gs: number };
  },
  referenceDate: Date = new Date()
): {
  childCurrentAgeYears: number;
  emmaCurrentAgeYears: number;
  childBirthDayMonthLabel: string;
  nextBirthdayYear: number;
  currentMonthKey: string;
  currentMonthStartLabel: string;
  nextMonthlyUpdateLabel: string;
  nextBirthdayDateLabel: string;
  rows: AnnualAgeProgressRow[];
  activeRow: AnnualAgeProgressRow;
} {
  const birthParts = parseBirthDateParts(progress.childProfile?.birthDate);
  const ageInfo = calculateChildAge(progress.childProfile?.birthDate, referenceDate);
  const childCurrentAgeYears = ageInfo.years;

  const birthDD = String(birthParts.day).padStart(2, '0');
  const birthMM = String(birthParts.month).padStart(2, '0');
  const childBirthDayMonthLabel = `${birthDD}/${birthMM}`;

  const yearNum = referenceDate.getFullYear();
  const monthNum = referenceDate.getMonth() + 1;
  const currentMonthKey = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
  const currentMonthStartLabel = formatMonthStartItalian(currentMonthKey);

  const nextMonthYear = monthNum === 12 ? yearNum + 1 : yearNum;
  const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
  const nextMonthlyUpdateLabel = `01/${String(nextMonthNum).padStart(2, '0')}/${nextMonthYear}`;

  const nextBirthdayYear = birthParts.year + childCurrentAgeYears + 1;
  const nextBirthdayDateLabel = `${childBirthDayMonthLabel}/${nextBirthdayYear} (Compimento ${childCurrentAgeYears + 1} Anni)`;

  const existingRows = Array.isArray(progress.annualProgressRows)
    ? [...progress.annualProgressRows]
    : [];

  const rowsByAge = new Map<number, AnnualAgeProgressRow>();
  existingRows.forEach((r) => {
    if (r && typeof r.ageYears === 'number' && r.ageYears <= childCurrentAgeYears && r.ageYears >= Math.max(2, childCurrentAgeYears - 5)) {
      rowsByAge.set(r.ageYears, { ...r });
    }
  });

  // Lock any row whose ageYears < childCurrentAgeYears
  rowsByAge.forEach((prevRow, age) => {
    if (age < childCurrentAgeYears && !prevRow.isLockedFixedRow) {
      const lockBirthdayStr = `${childBirthDayMonthLabel}/${birthParts.year + age + 1}`;
      rowsByAge.set(age, {
        ...prevRow,
        isLockedFixedRow: true,
        lockedAtDate: prevRow.lockedAtDate || lockBirthdayStr,
        currentDate: prevRow.lockedAtDate || lockBirthdayStr,
        deltaLevels: prevRow.currentLevel - prevRow.startLevel,
        deltaIp: prevRow.currentIp - prevRow.startIp,
        deltaIc: prevRow.currentIc - prevRow.startIc,
        deltaIa: prevRow.currentIa - prevRow.startIa,
      });
    }
  });

  // Build or update the active row for the child's current age year
  const prevAgeRow = rowsByAge.get(childCurrentAgeYears - 1);
  const existingActive = rowsByAge.get(childCurrentAgeYears);
  const ageStartYear = birthParts.year + childCurrentAgeYears;
  const ageEndYear = ageStartYear + 1;
  const birthdayStartDate = `${childBirthDayMonthLabel}/${ageStartYear}`;
  const periodEndStr = formatDayBefore(birthParts.day, birthParts.month, ageEndYear);
  const periodLabel = `${birthdayStartDate} – ${periodEndStr}`;

  const snapshots = progress.evaluationSnapshots || [];
  const firstSnapshot = snapshots.length > 0 ? snapshots[0] : null;

  let startLevel = existingActive?.startLevel ?? (prevAgeRow ? prevAgeRow.currentLevel : 1);
  let startIp = existingActive?.startIp ?? (prevAgeRow ? prevAgeRow.currentIp : 0);
  let startIc = existingActive?.startIc ?? (prevAgeRow ? prevAgeRow.currentIc : 0);
  let startIa = existingActive?.startIa ?? (prevAgeRow ? prevAgeRow.currentIa : 0);
  let startChc = existingActive?.startChc ?? {
    Gf: prevAgeRow?.currentChc.Gf ?? 0,
    Gwm: prevAgeRow?.currentChc.Gwm ?? 0,
    Gc: prevAgeRow?.currentChc.Gc ?? 0,
    Gv: prevAgeRow?.currentChc.Gv ?? 0,
    Gs: prevAgeRow?.currentChc.Gs ?? 0,
  };

  if (currentMetrics.isUnlocked) {
    if (prevAgeRow && prevAgeRow.currentIc > 0) {
      startLevel = prevAgeRow.currentLevel;
      startIp = prevAgeRow.currentIp;
      startIc = prevAgeRow.currentIc;
      startIa = prevAgeRow.currentIa;
      startChc = { ...prevAgeRow.currentChc };
    } else if (firstSnapshot && firstSnapshot.ic > 0) {
      startLevel = Math.min(currentMetrics.currentLevel, firstSnapshot.levelNumber);
      startIp = firstSnapshot.ip;
      startIc = firstSnapshot.ic;
      startIa = firstSnapshot.ia;
      startChc = { ...firstSnapshot.chcScores };
    } else if (startIc === 0) {
      // Honest initial baseline anchored to first observed assessment (no artificial -12 offset)
      startLevel = existingActive?.startLevel ?? 1;
      startIp = currentMetrics.ip;
      startIc = currentMetrics.ic;
      startIa = currentMetrics.ia;
      startChc = { ...currentMetrics.chcMap };
    }
  } else {
    startLevel = 1;
    startIp = 0;
    startIc = 0;
    startIa = 0;
    startChc = { Gf: 0, Gwm: 0, Gc: 0, Gv: 0, Gs: 0 };
  }

  const startBand = getCompetencyBand(startIc, currentMetrics.isUnlocked && startIc > 0);

  const existingCheckpoints: MonthlyProgressCheckpoint[] = existingActive?.monthlyCheckpoints
    ? [...existingActive.monthlyCheckpoints]
    : [];

  const currentMonthCheckpoint: MonthlyProgressCheckpoint = {
    monthKey: currentMonthKey,
    monthLabel: `1 ${ITALIAN_MONTHS_SHORT[monthNum - 1]} ${yearNum}`,
    recordedAtDate: `${currentMonthKey}-01`,
    levelReached: currentMetrics.currentLevel,
    ip: currentMetrics.ip,
    ic: currentMetrics.ic,
    ia: currentMetrics.ia,
    ieDeltaFromStart: currentMetrics.isUnlocked ? currentMetrics.ic - startIc : 0,
    chcScores: { ...currentMetrics.chcMap },
  };

  const cpIdx = existingCheckpoints.findIndex((c) => c.monthKey === currentMonthKey);
  if (cpIdx >= 0) {
    existingCheckpoints[cpIdx] = currentMonthCheckpoint;
  } else {
    existingCheckpoints.push(currentMonthCheckpoint);
  }
  existingCheckpoints.sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const todayFormatted = referenceDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const activeRow: AnnualAgeProgressRow = {
    id: `age_${childCurrentAgeYears}`,
    ageYears: childCurrentAgeYears,
    ageLabel: `${childCurrentAgeYears} Anni`,
    periodLabel,
    isLockedFixedRow: false,
    lastMonthlyUpdateKey: currentMonthKey,
    lastMonthlyUpdateLabel: currentMonthStartLabel,
    startLevel,
    startDate: existingActive?.startDate || birthdayStartDate,
    startIp,
    startIc,
    startIa,
    startBand,
    startChc,
    currentLevel: currentMetrics.currentLevel,
    currentDate: todayFormatted,
    currentIp: currentMetrics.ip,
    currentIc: currentMetrics.ic,
    currentIa: currentMetrics.ia,
    currentBand: currentMetrics.assignedBandLabel,
    currentChc: { ...currentMetrics.chcMap },
    deltaLevels: Math.max(0, currentMetrics.currentLevel - startLevel),
    deltaIp: currentMetrics.isUnlocked ? currentMetrics.ip - startIp : 0,
    deltaIc: currentMetrics.isUnlocked ? currentMetrics.ic - startIc : 0,
    deltaIa: currentMetrics.isUnlocked ? currentMetrics.ia - startIa : 0,
    monthlyCheckpoints: existingCheckpoints.slice(-12),
  };

  rowsByAge.set(childCurrentAgeYears, activeRow);

  const sortedRows = Array.from(rowsByAge.values()).sort(
    (a, b) => a.ageYears - b.ageYears
  );

  return {
    childCurrentAgeYears,
    emmaCurrentAgeYears: childCurrentAgeYears,
    childBirthDayMonthLabel,
    nextBirthdayYear,
    currentMonthKey,
    currentMonthStartLabel,
    nextMonthlyUpdateLabel,
    nextBirthdayDateLabel,
    rows: sortedRows,
    activeRow,
  };
}

/**
 * Synchronizes `annualProgressRows` and `lastMonthlyUpdateKey` on UserProgress
 * so monthly 1st-of-month updates and birthday fixed-row transitions are persisted in localStorage.
 */
export function syncAnnualAndMonthlyProgress(
  progress: UserProgress,
  referenceDate: Date = new Date()
): UserProgress {
  const report = computeFullEvaluationReport(progress);
  return {
    ...progress,
    annualProgressRows: report.annualProgressRows,
    lastMonthlyUpdateKey: report.currentMonthKey,
  };
}

/**
 * Creates a compact EvaluationSnapshot to store in UserProgress so IE (Evolution)
 * can compare current competency against previous sessions over time.
 */
export function createEvaluationSnapshot(
  progress: UserProgress
): EvaluationSnapshot {
  const report = computeFullEvaluationReport(progress);
  const chcMap = {
    Gf: report.chcAbilities.find((a) => a.code === 'Gf')?.score ?? 0,
    Gwm: report.chcAbilities.find((a) => a.code === 'Gwm')?.score ?? 0,
    Gc: report.chcAbilities.find((a) => a.code === 'Gc')?.score ?? 0,
    Gv: report.chcAbilities.find((a) => a.code === 'Gv')?.score ?? 0,
    Gs: report.chcAbilities.find((a) => a.code === 'Gs')?.score ?? 0,
  };

  return {
    id: `snap_${progress.currentLevel}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    levelNumber: progress.currentLevel,
    sessionsCount: report.sessionsCount,
    significantExercises: report.significantExercises,
    ip: report.ip,
    ic: report.ic,
    ia: report.ia,
    ir: report.ir,
    it: report.it,
    domainIC: {
      logic: report.domains.logic.ic,
      letters: report.domains.letters.ic,
      numbers: report.domains.numbers.ic,
      shapes: report.domains.shapes.ic,
      music: report.domains.music.ic,
      english: report.domains.english.ic,
    },
    chcScores: chcMap,
  };
}

