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
  category: GameCategory,
  puzzleType?: string
): {
  chcPrimary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
  chcSecondary: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs';
} {
  const tier = Math.max(1, Math.floor((Math.max(1, level) - 1) / 10) + 1);

  // Category- and puzzleType-first CHC attribution so Curiosity Subject Chooser plays
  // always credit the exact underlying Cattell-Horn-Carroll cognitive factor.
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
  // Logic & Science/Nature reasoning
  if (puzzleType === 'pattern_complete' || puzzleType === 'sequence_logic') {
    return { chcPrimary: 'Gf', chcSecondary: 'Gv' };
  }
  if (puzzleType === 'odd_one_out' || puzzleType === 'animal_riddle') {
    return { chcPrimary: 'Gc', chcSecondary: 'Gf' };
  }
  return { chcPrimary: 'Gf', chcSecondary: 'Gs' };
}

/**
 * Reconstructs normalized exercise entries for a category by combining
 * explicit `levelHistory` entries with any legacy aggregate `categoryStats` counts,
 * preserving full historical progress with category-accurate CHC tags.
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
      hintsUsed: 0,
      responseTimeMs: isAutoCorrect ? 5200 : 8400,
      starsEarned: isAutoCorrect ? 3 : 2,
      timestamp: progress.lastPlayedDate || new Date().toISOString(),
    });
  }

  const normalizedHistory = history.map((e) => {
    const wInfo = getDifficultyWeightInfo(e.level || 1, true);
    const hints = e.hintsUsed ?? 0;
    const isAutonomousFirstTry = Boolean(e.firstTry) && hints === 0;
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

/**
 * Computes age-calibrated target median latency (ms) for accurate responses across ages 2-14.
 */
function getAgeCalibratedTargetLatencyMs(ageYears: number): number {
  if (ageYears <= 3) return 9500;
  if (ageYears <= 5) return 7500;
  if (ageYears <= 7) return 6400;
  if (ageYears <= 9) return 5600;
  if (ageYears <= 12) return 5000;
  return 4600;
}

/**
 * Outlier-resistant robust central latency (20%-trimmed mean when >= 5 samples, exact median otherwise)
 * so a single bathroom/distraction pause (e.g. 40s) never distorts Processing Speed (Gs).
 */
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

/**
 * Computes IP, IA, IR, IT, and IC for any chronologically ordered list of exercise entries.
 * Incorporates:
 * - Difficulty tier weighting (w_i in 1.00..2.00)
 * - Mild exponential recency decay (r_i = 0.95^age) so recent learning progress shines through
 * - Empirical Bayes small-sample shrinkage (priorWeight = 1.6) preventing 1-item 0/100 volatility
 * - Exact competency synthesis: IC = 0.50*IP + 0.20*IA + 0.15*IR + 0.15*IT
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
  let recencyWeightedCorrectSum = 0;
  let recencyWeightedTotalSum = 0;
  let recencyWeightedAutonomySum = 0;
  let autonomousCorrectCount = 0;
  let assistedSuccessCount = 0;
  let hintsUsedTotal = 0;

  const distinctTiers = new Set<number>();
  const distinctTypes = new Set<string>();
  const distinctCategories = new Set<GameCategory>();
  const totalN = entries.length;

  entries.forEach((e, idx) => {
    const w = e.weight ?? getDifficultyWeightInfo(e.level || 1, true).weight;
    const tier = e.tier ?? getDifficultyWeightInfo(e.level || 1, true).tier;
    const hints = e.hintsUsed ?? 0;
    const attempts = Math.max(1, e.attempts || 1);

    // Mild exponential recency factor: newest = 1.0, older items decay gently down to floor 0.32
    const ageSteps = Math.min(22, totalN - 1 - idx);
    const recency = Math.pow(0.95, ageSteps);
    const effW = w * recency;

    // c_i = 1 if and only if solved on 1st attempt without hints
    const c_i = e.firstTry && hints === 0 && attempts === 1 ? 1 : 0;

    weightedTotalSum += w;
    weightedCorrectSum += w * c_i;
    recencyWeightedTotalSum += effW;
    recencyWeightedCorrectSum += effW * c_i;

    if (c_i === 1) {
      autonomousCorrectCount++;
      distinctTiers.add(tier);
      distinctTypes.add(e.puzzleType || `${e.category}_tier_${tier}`);
      distinctCategories.add(e.category);
    } else {
      assistedSuccessCount++;
    }
    hintsUsedTotal += hints;

    // Graduated Autonomy score per exercise:
    let a_i = 1.0;
    if (attempts === 1 && hints === 0) {
      a_i = 1.0;
    } else if (attempts === 1 && hints > 0) {
      a_i = Math.max(0.45, 0.76 - (hints - 1) * 0.15);
    } else if (attempts === 2) {
      a_i = hints === 0 ? 0.48 : 0.32;
    } else {
      a_i = 0.18;
    }
    recencyWeightedAutonomySum += effW * a_i;
  });

  // Empirical Bayes small-sample stabilization:
  // Avoids volatile 0% or 100% spikes on 1-2 exercises while converging to exact weighted ratio as evidence grows.
  const priorWeight = 1.6;
  const ipPriorMean = 0.56;
  const iaPriorMean = 0.6;

  // A. INDICE DI PRESTAZIONE (IP) with Empirical Bayes shrinkage & recency sensitivity
  const ip =
    recencyWeightedTotalSum > 0
      ? Math.round(
          ((recencyWeightedCorrectSum + priorWeight * ipPriorMean) /
            (recencyWeightedTotalSum + priorWeight)) *
            100
        )
      : 0;

  // INDICE DI AUTONOMIA (IA)
  const ia =
    recencyWeightedTotalSum > 0
      ? Math.round(
          ((recencyWeightedAutonomySum + priorWeight * iaPriorMean) /
            (recencyWeightedTotalSum + priorWeight)) *
            100
        )
      : 0;

  // CAPACITÀ DI RICORDARE NEL TEMPO (IR - Retention):
  // Combines recency-half consistency, session/day persistence, and smooth asymptotic maturity.
  const halfIdx = Math.floor(totalN / 2);
  const recentEntries = entries.slice(halfIdx);
  const recentAutoCount = recentEntries.filter(
    (e) => e.firstTry && (e.hintsUsed ?? 0) === 0 && Math.max(1, e.attempts || 1) === 1
  ).length;
  // Bayesian smoothed recent retention accuracy
  const recentRetentionRate =
    (recentAutoCount + 1.0 * 0.55) / (recentEntries.length + 1.0);
  const asymptoticMaturity =
    totalN / (totalN + Math.max(2.0, expectedExercisesTarget * 0.55));
  const sessionRetentionFactor = Math.min(
    1,
    0.48 + Math.min(4, sessionsCount) * 0.11 + Math.min(7, daysSpan) * 0.015
  );
  const ir = Math.round(
    Math.min(
      100,
      (recentRetentionRate * 66 + asymptoticMaturity * 19 + sessionRetentionFactor * 15) *
        (0.72 + 0.28 * asymptoticMaturity)
    )
  );

  // CAPACITÀ DI TRASFERIMENTO A ESERCIZI NUOVI (IT - Transfer):
  // Rewards mastering higher tiers and distinct puzzle types/domains autonomously.
  const tierSpread = Math.min(1, distinctTiers.size / 2.5);
  const typeVariety = Math.min(
    1,
    (distinctTypes.size + Math.max(0, distinctCategories.size - 1) * 0.5) /
      Math.max(2, Math.min(5, expectedExercisesTarget * 0.65))
  );
  const highTierEntries = entries.filter((e) => (e.tier ?? 1) >= 2);
  const highTierAutoCount = highTierEntries.filter(
    (e) => e.firstTry && (e.hintsUsed ?? 0) === 0 && Math.max(1, e.attempts || 1) === 1
  ).length;
  const highTierSuccessRate =
    highTierEntries.length > 0
      ? (highTierAutoCount + 1.0 * (ip / 100)) / (highTierEntries.length + 1.0)
      : (ip / 100) * 0.82;

  const it = Math.round(
    Math.min(
      100,
      (highTierSuccessRate * 54 + typeVariety * 28 + tierSpread * 18) *
        (0.7 + 0.3 * asymptoticMaturity)
    )
  );

  // B. FORMULA INDICE DI COMPETENZA (IC):
  // IC = 0,50*IP + 0,20*IA + 0,15*IR + 0,15*IT
  const ic = Math.round(0.5 * ip + 0.2 * ia + 0.15 * ir + 0.15 * it);

  return {
    totalExercises: totalN,
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

  // Order allEntries chronologically so recency weighting and early-vs-recent IE windows are accurate
  allEntries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return (a.level || 0) - (b.level || 0);
  });

  const childAgeYears = calculateChildAge(progress.childProfile?.birthDate).years;

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

  // Compute honest baseline previous IC from saved snapshots OR real earlier chronological window
  // (never fabricating artificial positive offsets on brand-new 1-3 exercise profiles)
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
        8
      );
      previousGlobalIc = prevCalc.ic;
    } else {
      previousGlobalIc = globalCalc.ic;
    }
  }

  // C. FORMULA INDICE DI EVOLUZIONE (IE):
  // IE = IC_attuale - IC_precedente
  const ieDelta = isUnlocked ? globalCalc.ic - previousGlobalIc : 0;
  const ieIndex = isUnlocked
    ? Math.max(0, Math.min(100, Math.round(50 + ieDelta * 2.5)))
    : 0;

  // Map each category to its primary CHC correlates so domains without direct plays yet
  // can still be estimated conservatively from correlated multi-parameter tests
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
              weight: Math.round((e.weight ?? 1.0) * 0.6 * 100) / 100,
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
    const damping = isProxyEstimation ? 0.84 : 1.0;
    const finalIp = Math.round(cCalc.ip * damping);
    const finalIa = Math.round(cCalc.ia * damping);
    const finalIr = Math.round(cCalc.ir * damping);
    const finalIt = Math.round(cCalc.it * damping);
    const finalIc = Math.round(0.5 * finalIp + 0.2 * finalIa + 0.15 * finalIr + 0.15 * finalIt);

    let prevCatIc = finalIc;
    const priorSnap = [...snapshots]
      .reverse()
      .find((s) => s.significantExercises < globalCalc.totalExercises && s.domainIC?.[cat] !== undefined);
    if (priorSnap && priorSnap.domainIC?.[cat] !== undefined && priorSnap.domainIC[cat] > 0) {
      prevCatIc = priorSnap.domainIC[cat];
    } else if (proxyEntries.length >= 4) {
      const splitIdx = Math.max(2, Math.floor(proxyEntries.length * 0.6));
      const prevCatCalc = computeIndicatorsForEntries(
        proxyEntries.slice(0, splitIdx),
        Math.max(1, sessionsCount - 1),
        daysSpan,
        3
      );
      prevCatIc = Math.round(prevCatCalc.ic * damping);
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

    // For Gs (Velocità e precisione):
    // 1. Age-calibrated target latency (2-14 years) + tier complexity scaling
    // 2. Outlier-resistant Winsorized/median response time (immune to 40s distraction pauses)
    // 3. Speed-Accuracy Tradeoff (SAT) guard so fast wrong guessing never inflates Gs
    let speedPrecisionFactor = calc.ip;
    if (code === 'Gs') {
      const validTimed = combinedEntries.filter(
        (e) => typeof e.responseTimeMs === 'number' && e.responseTimeMs >= 500
      );
      if (validTimed.length > 0) {
        const autonomousTimed = validTimed.filter(
          (e) => e.firstTry && (e.hintsUsed ?? 0) === 0 && Math.max(1, e.attempts || 1) === 1
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

        // Smooth monotonic curve: ratio 0.6 -> ~92, 1.0 -> 86, 1.6 -> 79, 2.5 -> 71
        const rawLatencyScore = Math.max(
          48,
          Math.min(98, Math.round(112 - 26 * Math.sqrt(latencyRatio)))
        );

        // Speed-Accuracy Tradeoff (SAT) guard: speed only scores highly when paired with accuracy
        const accuracyRatio = calc.ip / 100;
        const satGatedLatency = Math.round(rawLatencyScore * (0.35 + 0.65 * accuracyRatio));
        speedPrecisionFactor = Math.round(calc.ip * 0.62 + satGatedLatency * 0.38);
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
    let prevScore = score;
    if (priorSnap?.chcScores?.[code] && priorSnap.chcScores[code] > 0) {
      prevScore = priorSnap.chcScores[code];
    } else if (combinedEntries.length >= 4) {
      const splitIdx = Math.max(2, Math.floor(combinedEntries.length * 0.6));
      const prevChcCalc = computeIndicatorsForEntries(
        combinedEntries.slice(0, splitIdx),
        Math.max(1, sessionsCount - 1),
        daysSpan,
        4
      );
      prevScore = Math.round(
        0.5 * prevChcCalc.ip +
          0.2 * prevChcCalc.ia +
          0.15 * prevChcCalc.ir +
          0.15 * Math.min(100, prevChcCalc.it + extraTransferBonus)
      );
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

