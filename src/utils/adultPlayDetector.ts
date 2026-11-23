// Local Behavioral Touch & Interaction Telemetry Engine (100% On-Device, Zero Server Upload)
// Silently distinguishes genuine child interaction from adult/parent testing taps
// so that parent previews or accidental parent taps NEVER distort the child's CHC report
// or trigger false difficulty upgrades.

import type { LevelPerformanceEntry, UserProgress } from '../types/game';

export interface PointerTelemetrySnapshot {
  pointerType: string;       // 'touch' | 'mouse' | 'pen'
  touchAreaPx2: number;      // width * height of contact patch (mobile touch)
  centerOffsetRatio: number; // 0 = dead center of button, 1 = edge of button
  pressDurationMs: number;   // pointerdown -> pointerup duration
  pointerMovePx: number;     // drift during tap
}

export interface TrialTelemetryInput {
  ageYears: number;
  responseTimeMs: number;
  answeredBeforeAudioEnd: boolean;
  audioReplayCount: number;
  firstTry: boolean;
  hintsUsed: number;
  isCountingPuzzle: boolean;
  pointer?: PointerTelemetrySnapshot | null;
  recentHistory: LevelPerformanceEntry[];
  parentPreviewMode?: boolean;
}

export interface AdultDetectionResult {
  suspectedAdult: boolean;
  confidence: number; // 0..100
  reasons: string[];
  inputOrigin: 'child' | 'adult_detected' | 'parent_preview';
}

export interface AdultFilterSummary {
  totalRecorded: number;
  validChildCount: number;
  filteredAdultCount: number;
  parentPreviewCount: number;
  recentSuspectedCount: number;
  reasonCounts: Record<string, number>;
}

const REASON_LABELS_IT: Record<string, string> = {
  parent_preview_mode: 'Modalità Prova Genitore attiva',
  pre_audio_reading: 'Risposta esatta prima della fine della domanda vocale (lettura da adulto)',
  ultra_fast_reaction: 'Tempo di reazione troppo rapido per la fascia d’età',
  high_tap_precision: 'Tocco centrale e fermo tipico di mano adulta',
  adult_touch_contact: 'Area di contatto dito compatibile con tocco adulto',
  mechanical_streak: 'Serie meccanica rapida e uniforme (test/esplorazione adulta)',
};

export function getAdultReasonLabel(code: string): string {
  return REASON_LABELS_IT[code] || 'Schema di interazione compatibile con adulto';
}

/**
 * Evaluates a completed puzzle trial using age-calibrated local interaction telemetry.
 * Strictly conservative for older kids (8-14) so bright children are never falsely flagged,
 * and highly accurate for toddlers & non-readers (2-7) where adult reading & motor precision stand out.
 */
export function evaluateTrialPlayerOrigin(
  input: TrialTelemetryInput
): AdultDetectionResult {
  if (input.parentPreviewMode) {
    return {
      suspectedAdult: true,
      confidence: 100,
      reasons: ['parent_preview_mode'],
      inputOrigin: 'parent_preview',
    };
  }

  // If the child needed retries or hints, treat as authentic child exploration
  if (!input.firstTry || input.hintsUsed > 0) {
    return {
      suspectedAdult: false,
      confidence: 8,
      reasons: [],
      inputOrigin: 'child',
    };
  }

  let score = 0;
  const reasons: string[] = [];
  const age = Math.max(2, Math.min(14, input.ageYears));
  const rt = Math.max(300, input.responseTimeMs);

  // 1. Pre-audio reading anomaly (strongest signal for non-readers 2-7 years)
  if (!input.isCountingPuzzle && input.answeredBeforeAudioEnd) {
    if (age <= 4 && rt < 2600) {
      score += 52;
      reasons.push('pre_audio_reading');
    } else if (age <= 6 && rt < 2000) {
      score += 46;
      reasons.push('pre_audio_reading');
    } else if (age <= 7 && rt < 1500) {
      score += 36;
      reasons.push('pre_audio_reading');
    }
  }

  // 2. Age-calibrated reaction time floor (solving faster than developmental motor/comprehension floor)
  const fastThresholdMs =
    age <= 3
      ? 2300
      : age <= 5
      ? 1850
      : age <= 7
      ? 1450
      : age <= 9
      ? 1100
      : 900;

  if (!input.isCountingPuzzle && rt < fastThresholdMs) {
    const ratio = (fastThresholdMs - rt) / fastThresholdMs;
    score += Math.round(28 + ratio * 22);
    reasons.push('ultra_fast_reaction');
  } else if (input.isCountingPuzzle && age <= 4 && rt < 1500) {
    score += 34;
    reasons.push('ultra_fast_reaction');
  }

  // 3. Touch ergonomics & fine-motor precision telemetry (from PointerEvent)
  const ptr = input.pointer;
  if (ptr) {
    // Crisp, short, dead-center, zero-drift tap (characteristic of adult fine motor control)
    const isUltraSteadyCenter =
      ptr.centerOffsetRatio <= 0.24 &&
      ptr.pointerMovePx <= 3.5 &&
      ptr.pressDurationMs >= 25 &&
      ptr.pressDurationMs <= 135;

    if (isUltraSteadyCenter && age <= 6) {
      score += 22;
      reasons.push('high_tap_precision');
    } else if (isUltraSteadyCenter && age <= 8 && rt < fastThresholdMs * 1.25) {
      score += 14;
      reasons.push('high_tap_precision');
    }

    // Large adult finger contact patch on mobile touchscreen (when browser exposes contact geometry)
    if (ptr.pointerType === 'touch' && ptr.touchAreaPx2 >= 1350 && age <= 5) {
      score += 18;
      reasons.push('adult_touch_contact');
    }
  }

  // 4. Cross-trial mechanical rapid streak (e.g. parent tapping through 3+ levels in a row to inspect the app)
  const recentWindow = input.recentHistory.slice(-4);
  if (recentWindow.length >= 2) {
    const fastStreakCount = recentWindow.filter(
      (h) =>
        h.firstTry &&
        (h.hintsUsed || 0) === 0 &&
        typeof h.responseTimeMs === 'number' &&
        h.responseTimeMs < (age <= 5 ? 3100 : age <= 7 ? 2400 : 1750)
    ).length;

    if (fastStreakCount >= 2 && rt < (age <= 5 ? 3200 : age <= 7 ? 2500 : 1850)) {
      score += age <= 6 ? 26 : 18;
      reasons.push('mechanical_streak');
    }
  }

  // Replaying voice audio is a strong authentic child non-reader signal -> reduce adult probability
  if (input.audioReplayCount > 0) {
    score = Math.max(0, score - 25);
  }

  const confidence = Math.max(0, Math.min(100, Math.round(score)));
  const threshold = age <= 5 ? 62 : age <= 7 ? 68 : 78;
  const suspectedAdult = confidence >= threshold;

  return {
    suspectedAdult,
    confidence,
    reasons: suspectedAdult ? Array.from(new Set(reasons)) : [],
    inputOrigin: suspectedAdult ? 'adult_detected' : 'child',
  };
}

export function isValidChildEntry(entry: LevelPerformanceEntry): boolean {
  return !entry.suspectedAdult && entry.inputOrigin !== 'adult_detected' && entry.inputOrigin !== 'parent_preview';
}

export function summarizeAdultFilterStats(progress?: UserProgress): AdultFilterSummary {
  const history = progress?.levelHistory || [];
  let validChildCount = 0;
  let filteredAdultCount = 0;
  let parentPreviewCount = 0;
  const reasonCounts: Record<string, number> = {};

  for (const h of history) {
    if (h.inputOrigin === 'parent_preview') {
      parentPreviewCount++;
      filteredAdultCount++;
    } else if (h.suspectedAdult || h.inputOrigin === 'adult_detected') {
      filteredAdultCount++;
    } else {
      validChildCount++;
    }
    if (h.adultReasons) {
      for (const r of h.adultReasons) {
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      }
    }
  }

  const recentSuspectedCount = history
    .slice(-6)
    .filter((h) => !isValidChildEntry(h)).length;

  return {
    totalRecorded: history.length,
    validChildCount,
    filteredAdultCount: Math.max(filteredAdultCount, progress?.adultFilteredCount || 0),
    parentPreviewCount,
    recentSuspectedCount,
    reasonCounts,
  };
}
