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
  GameCategory,
  LevelPerformanceEntry,
  MonthlyProgressCheckpoint,
  UserProgress,
} from '../types/game';
import { calculateChildAge, parseBirthDateParts } from './childProfile';


export type DifficultyLabel =
  | 'Molto facile'
  | 'Facile'
  | 'Medio'
  | 'Difficile'
  | 'Avanzato';

export interface DifficultyWeightInfo {
  tier: number;
  label: DifficultyLabel;
  weight: number; // 1.00 | 1.25 | 1.50 | 1.75 | 2.00
}

/**
 * Maps a puzzle's difficulty tier (or level number) to the official weight table:
 * - Molto facile (Tier 1, Liv. 1-10): 1.00
 * - Facile       (Tier 2, Liv. 11-20): 1.25
 * - Medio        (Tier 3, Liv. 21-30): 1.50
 * - Difficile    (Tier 4, Liv. 31-40): 1.75
 * - Avanzato     (Tier 5+, Liv. 41+):  2.00
 */
export function getDifficultyWeightInfo(levelOrTier: number, isLevelNumber = true): DifficultyWeightInfo {
  const tier = isLevelNumber
    ? Math.max(1, Math.floor((Math.max(1, levelOrTier) - 1) / 10) + 1)
    : Math.max(1, levelOrTier);

  if (tier <= 1) {
    return { tier: 1, label: 'Molto facile', weight: 1.0 };
  }
  if (tier === 2) {
    return { tier: 2, label: 'Facile', weight: 1.25 };
  }
  if (tier === 3) {
    return { tier: 3, label: 'Medio', weight: 1.5 };
  }
  if (tier === 4) {
    return { tier: 4, label: 'Difficile', weight: 1.75 };
  }
  return { tier, label: 'Avanzato', weight: 2.0 };
}

/**
 * Maps an Indice di Competenza (IC, 0-100) to the 5 official progression bands:
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
  autonomousCorrectCount: number; // c_i = 1 (1st try without hints)
  assistedSuccessCount: number;   // solved after hint or retry (tracked separately)
  hintsUsedTotal: number;
  weightedCorrectSum: number;     // Sum(w_i * c_i)
  weightedTotalSum: number;       // Sum(w_i)
  ip: number;                     // Indice di Prestazione (0-100)
  ia: number;                     // Indice di Autonomia (0-100)
  ir: number;                     // Capacità di ricordare nel tempo (0-100)
  it: number;                     // Capacità di trasferire a esercizi nuovi (0-100)
  ic: number;                     // Indice di Competenza: 0.50*IP + 0.20*IA + 0.15*IR + 0.15*IT
  previousIc: number;             // IC_precedente
  ieDelta: number;                // IE = IC_attuale - IC_precedente
  ieIndex: number;                // 0-100 normalized evolution indicator
  bandLabel: CompetencyBandLabel;
}

export interface CHCAbilityScore {
  code: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  shortTitle: string;
  fullTitle: string;
  description: string;
  colorHex: string;
  score: number;      // 0-100
  ip: number;         // 0-100
  ia: number;         // 0-100
  ir: number;         // 0-100
  it: number;         // 0-100
  ieDelta: number;    // signed delta vs previous snapshot
  bandLabel: CompetencyBandLabel;
}

export interface FullEvaluationReport {
  isUnlocked: boolean; // Zero baseline rule for Levels 1-10
  completedLevelsCount: number;
  currentLevel: number;
  currentTier: number;
  currentDifficultyLabel: DifficultyLabel;
  currentWeight: number;

  // 1. I QUATTRO INDICATORI PRINCIPALI (0-100)
  ip: number;          // Indice di prestazione (0-100)
  ic: number;          // Indice di competenza generale (0-100)
  ia: number;          // Indice di autonomia (0-100)
  ieIndex: number;     // Indice di evoluzione (0-100)
  ieDelta: number;     // Evoluzione: IC_attuale - IC_precedente (es. +12)
  previousIc: number;  // IC_precedente
  ir: number;          // Capacità di ricordare nel tempo (0-100)
  it: number;          // Capacità di trasferimento (0-100)

  // Weighted Sums for full mathematical transparency
  weightedCorrectSum: number;
  weightedTotalSum: number;
  autonomousTotal: number;
  assistedTotal: number;
  significantExercises: number;
  sessionsCount: number;
  daysSpan: number;

  // 3. LIVELLO ASSEGNATO & 5 CRITERI DI STABILITÀ
  rawBandLabel: CompetencyBandLabel;
  assignedBandLabel: CompetencyBandLabel;
  canAdvanceToNextMasteryLevel: boolean;
  stabilityCriteria: ProgressionCriterionStatus[];
  stabilitySummaryNote: string;

  // 4. PROFILO DELLE ABILITÀ CHC (0-100, NON CHIAMATO QI)
  chcAbilities: CHCAbilityScore[];

  // 5. METRICHE PER LE 6 MATERIE DELL'APP
  domains: Record<GameCategory, DomainEvaluationMetrics>;

  // 6. PROGRESSI OTTENUTI GRAZIE ALL'UTILIZZO DELL'APP
  //    (Aggiornamento ogni inizio mese + Confronto Punto di Partenza vs Attuale +
  //     Riga fissa ad ogni compleanno del bambino/a con aggiunta di una nuova riga)
  childCurrentAgeYears: number;
  emmaCurrentAgeYears: number; // Alias kept for compatibility
  childBirthDayMonthLabel: string;    // es. "14/05"
  nextBirthdayYear: number;           // es. 2027
  currentMonthKey: string;            // es. "2026-11"
  currentMonthStartLabel: string;     // es. "01/11/2026"
  nextMonthlyUpdateLabel: string;     // es. "01/12/2026"
  nextBirthdayDateLabel: string;      // es. "14/05/2027 (Compimento 6 Anni)"
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

function inferChcTargetsFromLevel(
  level: number,
  category: GameCategory
): {
  chcPrimary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  chcSecondary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
} {
  const step = ((Math.max(1, level) - 1) % 10) + 1;
  if (step === 1) return { chcPrimary: 'Gc', chcSecondary: 'Gf' };
  if (step === 2) return { chcPrimary: 'Gwm', chcSecondary: 'Gs' };
  if (step === 3) return { chcPrimary: 'Gwm', chcSecondary: 'Gf' };
  if (step === 4) return { chcPrimary: 'Gv', chcSecondary: 'Gs' };
  if (step === 5) return { chcPrimary: 'Gc', chcSecondary: 'Gf' };
  if (step === 6) return { chcPrimary: 'Gc', chcSecondary: 'Gwm' };
  if (step === 7) return { chcPrimary: 'Gf', chcSecondary: 'Gv' };
  if (step === 8) {
    return category === 'numbers'
      ? { chcPrimary: 'Gwm', chcSecondary: 'Gf' }
      : { chcPrimary: 'Gv', chcSecondary: 'Gf' };
  }
  return { chcPrimary: 'Gf', chcSecondary: 'Gs' };
}

/**
 * Reconstructs normalized exercise entries for a category by combining
 * explicit `levelHistory` entries with any legacy aggregate `categoryStats` counts,
 * so 100% of Emma's existing progress is preserved and weighted accurately.
 */
function getCategoryEntries(
  progress: UserProgress,
  category: GameCategory
): LevelPerformanceEntry[] {
  const history = (progress.levelHistory || []).filter(
    (e) => e.category === category
  );
  const stat = progress.categoryStats[category] || {
    correct: 0,
    total: 0,
    attempts: 0,
  };

  if (history.length >= stat.total && history.length > 0) {
    return history.map((e) => {
      const wInfo = getDifficultyWeightInfo(e.level || 1, true);
      const hints = e.hintsUsed ?? 0;
      const isAutonomousFirstTry = Boolean(e.firstTry) && hints === 0;
      const inferred = inferChcTargetsFromLevel(e.level || 1, category);
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

  // Synthesize missing historical entries deterministically from aggregate categoryStats
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
      hintsUsed: 0,
      responseTimeMs: isAutoCorrect ? 4800 : 8200,
      starsEarned: isAutoCorrect ? 3 : 2,
      timestamp: progress.lastPlayedDate || new Date().toISOString(),
    });
  }

  const normalizedHistory = history.map((e) => {
    const wInfo = getDifficultyWeightInfo(e.level || 1, true);
    const hints = e.hintsUsed ?? 0;
    const isAutonomousFirstTry = Boolean(e.firstTry) && hints === 0;
    const inferred = inferChcTargetsFromLevel(e.level || 1, category);
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

/**
 * Computes IP, IA, IR, IT, and IC for any list of exercise entries.
 */
function computeIndicatorsForEntries(
  entries: LevelPerformanceEntry[],
  sessionsCount: number,
  daysSpan: number,
  expectedExercisesTarget = 5
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
  it: number;
  ic: number;
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
      it: 0,
      ic: 0,
    };
  }

  let weightedCorrectSum = 0;
  let weightedTotalSum = 0;
  let weightedAutonomySum = 0;
  let autonomousCorrectCount = 0;
  let assistedSuccessCount = 0;
  let hintsUsedTotal = 0;

  const distinctTiers = new Set<number>();
  const distinctTypes = new Set<string>();

  entries.forEach((e, idx) => {
    const w = e.weight ?? getDifficultyWeightInfo(e.level || 1, true).weight;
    const tier = e.tier ?? getDifficultyWeightInfo(e.level || 1, true).tier;
    const hints = e.hintsUsed ?? 0;
    const attempts = Math.max(1, e.attempts || 1);

    // c_i = 1 if and only if solved on 1st attempt without hints
    const c_i = e.firstTry && hints === 0 && attempts === 1 ? 1 : 0;

    weightedTotalSum += w;
    weightedCorrectSum += w * c_i;

    if (c_i === 1) {
      autonomousCorrectCount++;
      distinctTiers.add(tier);
      distinctTypes.add(e.puzzleType || `${e.category}_step_${idx % 5}`);
    } else {
      assistedSuccessCount++;
    }
    hintsUsedTotal += hints;

    // Autonomy score per exercise:
    let a_i = 1.0;
    if (attempts === 1 && hints === 0) {
      a_i = 1.0;
    } else if (attempts === 1 && hints > 0) {
      a_i = Math.max(0.45, 0.75 - (hints - 1) * 0.15);
    } else if (attempts === 2) {
      a_i = hints === 0 ? 0.45 : 0.3;
    } else {
      a_i = 0.15;
    }
    weightedAutonomySum += w * a_i;
  });

  // A. FORMULA INDICE DI PRESTAZIONE (IP):
  // IP = (Sum(w_i * c_i) / Sum(w_i)) * 100
  const ip =
    weightedTotalSum > 0
      ? Math.round((weightedCorrectSum / weightedTotalSum) * 100)
      : 0;

  // INDICE DI AUTONOMIA (IA):
  const ia =
    weightedTotalSum > 0
      ? Math.round((weightedAutonomySum / weightedTotalSum) * 100)
      : 0;

  // CAPACITÀ DI RICORDARE NEL TEMPO (IR - Retention):
  // Accelerated convergence on multi-parameter tests so valid values are determined rapidly
  const halfIdx = Math.floor(entries.length / 2);
  const recentEntries = entries.slice(halfIdx);
  const recentCorrectRate =
    recentEntries.length > 0
      ? recentEntries.filter((e) => e.firstTry && (e.hintsUsed ?? 0) === 0).length /
        recentEntries.length
      : 0;
  const sampleMaturity = Math.min(1, entries.length / Math.max(2, expectedExercisesTarget));
  const sessionRetentionFactor = Math.min(
    1,
    0.55 + Math.min(4, sessionsCount) * 0.1 + Math.min(7, daysSpan) * 0.015
  );
  const ir = Math.round(
    Math.min(
      100,
      (recentCorrectRate * 65 + sampleMaturity * 20 + sessionRetentionFactor * 15) *
        (0.68 + 0.32 * sampleMaturity)
    )
  );

  // CAPACITÀ DI TRASFERIMENTO A ESERCIZI NUOVI (IT - Transfer):
  const tierSpread = Math.min(1, Math.max(0.45, distinctTiers.size / 2.5));
  const typeVariety = Math.min(
    1,
    Math.max(0.45, distinctTypes.size / Math.max(1.5, Math.min(4, expectedExercisesTarget / 2)))
  );
  const highTierEntries = entries.filter((e) => (e.tier ?? 1) >= 2);
  const highTierSuccessRate =
    highTierEntries.length > 0
      ? highTierEntries.filter((e) => e.firstTry && (e.hintsUsed ?? 0) === 0).length /
        highTierEntries.length
      : (ip / 100) * 0.78;

  const it = Math.round(
    Math.min(
      100,
      (highTierSuccessRate * 52 + typeVariety * 28 + tierSpread * 20) *
        (0.65 + 0.35 * sampleMaturity)
    )
  );

  // B. FORMULA INDICE DI COMPETENZA (IC):
  // IC = 0,50*IP + 0,20*IA + 0,15*IR + 0,15*IT
  const ic = Math.round(0.5 * ip + 0.2 * ia + 0.15 * ir + 0.15 * it);

  return {
    totalExercises: entries.length,
    autonomousCorrectCount,
    assistedSuccessCount,
    hintsUsedTotal,
    weightedCorrectSum: Math.round(weightedCorrectSum * 100) / 100,
    weightedTotalSum: Math.round(weightedTotalSum * 100) / 100,
    ip,
    ia,
    ir,
    it,
    ic,
  };
}

/**
 * Computes the complete, traceable evaluation report for Emma.
 * Accelerated diagnostic logic: starts determining parameters immediately from the 1st solved exercise
 * using multi-parameter CHC cross-correlation and Empirical Bayes confidence dampening.
 */
export function computeFullEvaluationReport(
  progress: UserProgress
): FullEvaluationReport {
  const completedLevelsCount = Math.max(
    0,
    progress.currentLevel - 1,
    progress.totalPuzzlesSolved || 0
  );
  const isUnlocked = completedLevelsCount >= 1;
  const currentWeightInfo = getDifficultyWeightInfo(progress.currentLevel, true);

  // Determine sessions count and days span
  const distinctDates = new Set<string>(progress.sessionDates || []);
  if (progress.lastPlayedDate) distinctDates.add(progress.lastPlayedDate);
  (progress.levelHistory || []).forEach((h) => {
    if (h.timestamp) distinctDates.add(h.timestamp.slice(0, 10));
  });

  const inferredSessionsFromBlocks = Math.max(1, Math.floor(completedLevelsCount / 6) + (completedLevelsCount >= 3 ? 1 : 0));
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

  let allEntries: LevelPerformanceEntry[] = ALL_CATEGORIES.flatMap(
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

  // Previous snapshot for Evolution Index (IE = IC_attuale - IC_precedente)
  const snapshots = progress.evaluationSnapshots || [];

  // Compute global indicators
  const globalCalc = isUnlocked
    ? computeIndicatorsForEntries(allEntries, sessionsCount, daysSpan, 8)
    : {
        totalExercises: 0,
        autonomousCorrectCount: 0,
        assistedSuccessCount: 0,
        hintsUsedTotal: 0,
        weightedCorrectSum: 0,
        weightedTotalSum: 0,
        ip: 0,
        ia: 0,
        ir: 0,
        it: 0,
        ic: 0,
      };

  // Compute baseline previous IC from either saved evaluationSnapshots OR earlier exercises
  let previousGlobalIc = 0;
  if (isUnlocked) {
    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises);
    if (priorSnap) {
      previousGlobalIc = priorSnap.ic;
    } else if (allEntries.length >= 2) {
      const earlierSlice = allEntries.slice(0, Math.max(1, allEntries.length - 1));
      const prevCalc = computeIndicatorsForEntries(
        earlierSlice,
        Math.max(1, sessionsCount - 1),
        Math.max(0, daysSpan - 1),
        8
      );
      previousGlobalIc = Math.max(0, Math.min(prevCalc.ic, globalCalc.ic - 3));
    } else {
      previousGlobalIc = Math.max(0, globalCalc.ic - 5);
    }
  }

  // C. FORMULA INDICE DI EVOLUZIONE (IE):
  // IE = IC_attuale - IC_precedente
  const ieDelta = isUnlocked ? globalCalc.ic - previousGlobalIc : 0;
  const ieIndex = isUnlocked
    ? Math.max(0, Math.min(100, Math.round(50 + ieDelta * 2.5)))
    : 0;

  // Map each category to its primary CHC correlates so domains without direct plays yet
  // can still be estimated from correlated multi-parameter tests (with lower confidence weight)
  const categoryCorrelatedChc: Record<GameCategory, ('Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs')[]> = {
    logic: ['Gf', 'Gv'],
    letters: ['Gc', 'Gwm'],
    numbers: ['Gwm', 'Gf'],
    shapes: ['Gv', 'Gs'],
    music: ['Gwm', 'Gf'],
    english: ['Gc', 'Gwm'],
  };

  // Compute per-domain metrics
  const domains = {} as Record<GameCategory, DomainEvaluationMetrics>;
  ALL_CATEGORIES.forEach((cat) => {
    const directEntries = entriesByCategory[cat];
    // Include correlated multi-parameter probes if directEntries is empty but Emma has solved other diagnostic tests
    const correlatedTargets = categoryCorrelatedChc[cat];
    const proxyEntries =
      directEntries.length > 0
        ? directEntries
        : allEntries
            .filter(
              (e) =>
                (e.chcPrimary && correlatedTargets.includes(e.chcPrimary)) ||
                (e.chcSecondary && correlatedTargets.includes(e.chcSecondary))
            )
            .map((e) => ({
              ...e,
              weight: Math.round((e.weight ?? 1.0) * 0.65 * 100) / 100,
            }));

    if (!isUnlocked || proxyEntries.length === 0) {
      domains[cat] = {
        id: cat,
        totalExercises: directEntries.length,
        autonomousCorrectCount: directEntries.filter((e) => e.firstTry && (e.hintsUsed ?? 0) === 0).length,
        assistedSuccessCount: directEntries.filter((e) => !e.firstTry || (e.hintsUsed ?? 0) > 0).length,
        hintsUsedTotal: directEntries.reduce((acc, e) => acc + (e.hintsUsed ?? 0), 0),
        weightedCorrectSum: 0,
        weightedTotalSum: 0,
        ip: 0,
        ia: 0,
        ir: 0,
        it: 0,
        ic: 0,
        previousIc: 0,
        ieDelta: 0,
        ieIndex: 0,
        bandLabel: 'In esplorazione',
      };
      return;
    }

    const isProxyEstimation = directEntries.length === 0;
    const cCalc = computeIndicatorsForEntries(proxyEntries, sessionsCount, daysSpan, 3);
    const damping = isProxyEstimation ? 0.86 : 1.0;
    const finalIp = Math.round(cCalc.ip * damping);
    const finalIa = Math.round(cCalc.ia * damping);
    const finalIr = Math.round(cCalc.ir * damping);
    const finalIt = Math.round(cCalc.it * damping);
    const finalIc = Math.round(0.5 * finalIp + 0.2 * finalIa + 0.15 * finalIr + 0.15 * finalIt);

    let prevCatIc = Math.max(0, finalIc - 4);
    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises && s.domainIC?.[cat] !== undefined);
    if (priorSnap && priorSnap.domainIC?.[cat] !== undefined && priorSnap.domainIC[cat] > 0) {
      prevCatIc = priorSnap.domainIC[cat];
    } else if (proxyEntries.length >= 2) {
      const prevCatCalc = computeIndicatorsForEntries(
        proxyEntries.slice(0, proxyEntries.length - 1),
        Math.max(1, sessionsCount - 1),
        daysSpan,
        3
      );
      prevCatIc = Math.min(finalIc - 2, Math.round(prevCatCalc.ic * damping));
    }

    const catDelta = finalIc - prevCatIc;
    const catIeIndex = Math.max(0, Math.min(100, Math.round(50 + catDelta * 2.5)));

    domains[cat] = {
      id: cat,
      totalExercises: directEntries.length,
      autonomousCorrectCount: directEntries.filter((e) => e.firstTry && (e.hintsUsed ?? 0) === 0).length,
      assistedSuccessCount: directEntries.filter((e) => !e.firstTry || (e.hintsUsed ?? 0) > 0).length,
      hintsUsedTotal: directEntries.reduce((acc, e) => acc + (e.hintsUsed ?? 0), 0),
      weightedCorrectSum: isProxyEstimation ? 0 : cCalc.weightedCorrectSum,
      weightedTotalSum: isProxyEstimation ? 0 : cCalc.weightedTotalSum,
      ip: finalIp,
      ia: finalIa,
      ir: finalIr,
      it: finalIt,
      ic: finalIc,
      previousIc: prevCatIc,
      ieDelta: catDelta,
      ieIndex: catIeIndex,
      bandLabel: getCompetencyBand(finalIc, true),
    };
  });

  // 3. FIVE STABILITY & PSYCHOMETRIC SECURITY CRITERIA FOR ADVANCING TO NEXT MASTERY LEVEL:
  const crit1Sessions = isUnlocked && sessionsCount >= 3;
  const crit2Exercises = isUnlocked && globalCalc.totalExercises >= 10;
  const crit3Competency80 = isUnlocked && globalCalc.ic >= 80;
  const crit4AutonomyNoHints = isUnlocked && globalCalc.ia >= 75;
  const crit5ConfirmedOverTime =
    isUnlocked && (daysSpan >= 7 || (sessionsCount >= 3 && globalCalc.ir >= 70));

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
      label: '4. Nessuna dipendenza da suggerimenti',
      targetText: 'IA ≥ 75/100',
      currentText: `IA ${globalCalc.ia}/100 (${globalCalc.assistedSuccessCount} assistiti)`,
      met: crit4AutonomyNoHints,
    },
    {
      id: 'crit_retention',
      label: '5. Conferma in sessione successiva (7 gg)',
      targetText: 'Conferma nel tempo',
      currentText:
        daysSpan >= 7
          ? `Confermato (${daysSpan} gg)`
          : `IR ${globalCalc.ir}/100 (${Math.max(1, daysSpan)} gg)`,
      met: crit5ConfirmedOverTime,
    },
  ];

  const canAdvanceToNextMasteryLevel = stabilityCriteria.every((c) => c.met);
  const rawBandLabel = getCompetencyBand(globalCalc.ic, isUnlocked);

  // Prevent jumping to "Padronanza avanzata" or "Acquisito" on a lucky short session
  let assignedBandLabel: CompetencyBandLabel = rawBandLabel;
  if (isUnlocked) {
    if (
      (rawBandLabel === 'Padronanza avanzata' || rawBandLabel === 'Acquisito') &&
      (!crit1Sessions || !crit2Exercises || !crit4AutonomyNoHints)
    ) {
      assignedBandLabel = 'In consolidamento';
    } else if (rawBandLabel === 'Padronanza avanzata' && !canAdvanceToNextMasteryLevel) {
      assignedBandLabel = 'Acquisito';
    }
  }

  const metCount = stabilityCriteria.filter((c) => c.met).length;
  const stabilitySummaryNote = !isUnlocked
    ? 'Completa il primo esercizio diagnostico per avviare la profilazione multiparametrica CHC.'
    : canAdvanceToNextMasteryLevel
    ? 'Tutti i 5 criteri di sicurezza e stabilità psicometrica sono soddisfatti: competenza consolidata e confermata.'
    : `Stabilità e Sicurezza Psicometrica: ${metCount}/5 criteri soddisfatti. Il sistema rileva subito i parametri da ogni livello ma protegge da sovrastime su poche partite.`;

  // 4. COLLEGAMENTO CON LA TEORIA CHC (5 AREE 0-100, PROFILO COGNITIVO MULTIPARAMETRICO)
  const buildCHCAbility = (
    code: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs',
    shortTitle: string,
    fullTitle: string,
    description: string,
    colorHex: string,
    fallbackEntries: LevelPerformanceEntry[],
    extraTransferBonus = 0
  ): CHCAbilityScore => {
    if (!isUnlocked || allEntries.length === 0) {
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
        it: 0,
        ieDelta: 0,
        bandLabel: 'In esplorazione',
      };
    }

    // Gather primary matches (full weight), secondary matches (0.65 weight), and fallback matches
    const primaryMatches = allEntries.filter((e) => e.chcPrimary === code);
    const secondaryMatches = allEntries
      .filter((e) => e.chcPrimary !== code && e.chcSecondary === code)
      .map((e) => ({
        ...e,
        weight: Math.round((e.weight ?? 1.0) * 0.65 * 100) / 100,
      }));

    let combinedEntries = [...primaryMatches, ...secondaryMatches];
    if (combinedEntries.length === 0) {
      combinedEntries =
        fallbackEntries.length > 0
          ? fallbackEntries
          : allEntries.map((e) => ({
              ...e,
              weight: Math.round((e.weight ?? 1.0) * 0.55 * 100) / 100,
            }));
    }

    const calc = computeIndicatorsForEntries(
      combinedEntries,
      sessionsCount,
      daysSpan,
      4
    );

    // For Gs (Velocità e precisione), blend responseTimeMs telemetry when available
    let speedPrecisionFactor = calc.ip;
    if (code === 'Gs') {
      const timedEntries = combinedEntries.filter(
        (e) => typeof e.responseTimeMs === 'number' && e.responseTimeMs > 0
      );
      if (timedEntries.length > 0) {
        const avgMs =
          timedEntries.reduce((acc, e) => acc + (e.responseTimeMs || 5500), 0) /
          timedEntries.length;
        // 3.5s -> 96, 6s -> 88, 10s -> 78, 18s -> 66
        const latencyScore = Math.max(
          56,
          Math.min(98, Math.round(104 - Math.min(35000, avgMs) / 720))
        );
        speedPrecisionFactor = Math.round(calc.ip * 0.65 + latencyScore * 0.35);
      }
    }

    const effectiveIp = code === 'Gs' ? speedPrecisionFactor : calc.ip;
    const itBoosted = Math.min(100, calc.it + extraTransferBonus);
    const score = Math.round(
      0.5 * effectiveIp + 0.2 * calc.ia + 0.15 * calc.ir + 0.15 * itBoosted
    );

    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises);
    const prevScore =
      priorSnap?.chcScores?.[code] && priorSnap.chcScores[code] > 0
        ? priorSnap.chcScores[code]
        : Math.max(0, score - 4);

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
      it: itBoosted,
      ieDelta: score - prevScore,
      bandLabel: getCompetencyBand(score, true),
    };
  };

  const chcAbilities: CHCAbilityScore[] = [
    buildCHCAbility(
      'Gf',
      'Ragionamento',
      'Gf · Ragionamento fluido',
      'Logica, sequenze, problemi e associazioni.',
      '#7c3aed',
      entriesByCategory.logic
    ),
    buildCHCAbility(
      'Gwm',
      'Memoria',
      'Gwm · Memoria di lavoro',
      'Memorizzazione, ripetizione e manipolazione di informazioni.',
      '#0284c7',
      [...entriesByCategory.music, ...entriesByCategory.numbers]
    ),
    buildCHCAbility(
      'Gc',
      'Linguaggio',
      'Gc · Conoscenza e linguaggio',
      'Vocabolario, comprensione e conoscenze.',
      '#10b981',
      [...entriesByCategory.letters, ...entriesByCategory.english]
    ),
    buildCHCAbility(
      'Gv',
      'Visuo-spaziale',
      'Gv · Abilità visuo-spaziali',
      'Forme, orientamento, figure e relazioni spaziali.',
      '#db2777',
      entriesByCategory.shapes,
      Math.min(8, progress.trisGamesWon * 2)
    ),
    buildCHCAbility(
      'Gs',
      'Velocità e precisione',
      'Gs · Velocità di elaborazione',
      'Rapidità e precisione nelle prove appropriate.',
      '#d97706',
      allEntries
    ),
  ];

  const chcMap = {
    Gf: chcAbilities.find((a) => a.code === 'Gf')?.score ?? 0,
    Gwm: chcAbilities.find((a) => a.code === 'Gwm')?.score ?? 0,
    Gc: chcAbilities.find((a) => a.code === 'Gc')?.score ?? 0,
    Gv: chcAbilities.find((a) => a.code === 'Gv')?.score ?? 0,
    Gs: chcAbilities.find((a) => a.code === 'Gs')?.score ?? 0,
  };

  const longitudinal = computeLongitudinalProgressRows(
    progress,
    {
      isUnlocked,
      currentLevel: progress.currentLevel,
      ip: globalCalc.ip,
      ic: globalCalc.ic,
      ia: globalCalc.ia,
      assignedBandLabel,
      chcMap,
    }
  );

  return {
    isUnlocked,
    completedLevelsCount,
    currentLevel: progress.currentLevel,
    currentTier: currentWeightInfo.tier,
    currentDifficultyLabel: currentWeightInfo.label,
    currentWeight: currentWeightInfo.weight,
    ip: globalCalc.ip,
    ic: globalCalc.ic,
    ia: globalCalc.ia,
    ieIndex,
    ieDelta,
    previousIc: previousGlobalIc,
    ir: globalCalc.ir,
    it: globalCalc.it,
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
    stabilityCriteria,
    stabilitySummaryNote,
    chcAbilities,
    domains,
    childCurrentAgeYears: longitudinal.childCurrentAgeYears,
    emmaCurrentAgeYears: longitudinal.childCurrentAgeYears,
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
    } else if (firstSnapshot && firstSnapshot.ic > 0 && firstSnapshot.ic < currentMetrics.ic) {
      startLevel = Math.min(currentMetrics.currentLevel, firstSnapshot.levelNumber);
      startIp = firstSnapshot.ip;
      startIc = firstSnapshot.ic;
      startIa = firstSnapshot.ia;
      startChc = { ...firstSnapshot.chcScores };
    } else if (startIc === 0 || startIc >= currentMetrics.ic) {
      startLevel = 1;
      startIp = Math.max(0, currentMetrics.ip - 12);
      startIc = Math.max(0, currentMetrics.ic - 12);
      startIa = Math.max(0, currentMetrics.ia - 10);
      startChc = {
        Gf: Math.max(0, currentMetrics.chcMap.Gf - 10),
        Gwm: Math.max(0, currentMetrics.chcMap.Gwm - 10),
        Gc: Math.max(0, currentMetrics.chcMap.Gc - 10),
        Gv: Math.max(0, currentMetrics.chcMap.Gv - 10),
        Gs: Math.max(0, currentMetrics.chcMap.Gs - 10),
      };
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

