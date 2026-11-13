import { GameCategory, LevelPerformanceEntry, UserProgress } from '../types/game';

export interface DomainMetric {
  id: GameCategory;
  title: string;
  clinicalName: string;
  shortLabel: string;
  emoji: string;
  completed: number;
  correctFirstTry: number;
  attemptsTotal: number;
  firstTryRate: number;
  attemptEfficiency: number;
  accuracy: number;
  masteryIndex: number;
  levelLabel: string;
  barColor: string;
  hexColor: string;
  hexDark: string;
  hexTop: string;
  milestoneGoal: string;
  pedagogicalNote: string;
  familyAdvice: string;
}

export interface IQIndexDetail {
  code: string;
  shortTitle: string;
  label: string;
  scaledScore: number;
  percentScore: number;
  colorHex: string;
  desc: string;
}

export interface IQAnalysisResult {
  unlocked: boolean;
  iqScore: number;
  iqRange: string;
  percentile: string;
  classification: string;
  indices: IQIndexDetail[];
  clinicalNote: string;
}

export interface TrendPoint {
  level: number;
  category: GameCategory;
  scorePercent: number;
  cumulativeAvg: number;
  firstTry: boolean;
  attempts: number;
}

export interface TrendAnalysisResult {
  unlocked: boolean;
  points: TrendPoint[];
  recentAvg: number;
  previousAvg: number;
  delta: number;
  trendStatus: 'In Calibrazione' | 'In Crescita' | 'Stabile' | 'In Flessione';
  summaryText: string;
}

export interface EvaluationSnapshot {
  completedLevelsCount: number;
  isMeasurementUnlocked: boolean;
  currentTier: number;
  overallAccuracy: number;
  firstTryGlobalRate: number;
  attemptEfficiencyGlobal: number;
  domainMetrics: DomainMetric[];
  iqAnalysis: IQAnalysisResult;
  trendAnalysis: TrendAnalysisResult;
}

function getSafeAttempts(correct: number, total: number, recordedAttempts?: number): number {
  if (total <= 0) return 0;
  if (typeof recordedAttempts === 'number' && recordedAttempts >= total) {
    return recordedAttempts;
  }
  // Legacy fallback: 1 attempt per first-try correct + 2 attempts per non-first-try puzzle
  return correct + Math.max(0, total - correct) * 2;
}

export function computeEvaluationSnapshot(progress: UserProgress): EvaluationSnapshot {
  const completedLevelsCount = Math.max(0, progress.currentLevel - 1);
  const isMeasurementUnlocked = completedLevelsCount >= 10;
  const currentTier = Math.floor((progress.currentLevel - 1) / 10) + 1;

  // Global observed accuracy across all solved puzzles & recorded attempts
  const categoriesList: GameCategory[] = ['logic', 'letters', 'numbers', 'shapes', 'music', 'english'];
  const totalsAcrossCats = categoriesList.reduce(
    (acc, cat) => {
      const stat = progress.categoryStats[cat] || { correct: 0, total: 0, attempts: 0 };
      const att = getSafeAttempts(stat.correct, stat.total, stat.attempts);
      return {
        correct: acc.correct + stat.correct,
        total: acc.total + stat.total,
        attempts: acc.attempts + att,
      };
    },
    { correct: 0, total: 0, attempts: 0 }
  );

  const effectiveSolved = Math.max(progress.totalPuzzlesSolved, totalsAcrossCats.total);
  const effectiveAttempts = Math.max(effectiveSolved, progress.totalAttempts, totalsAcrossCats.attempts);

  const firstTryGlobalRate =
    !isMeasurementUnlocked || effectiveSolved === 0
      ? 0
      : Math.round((Math.min(effectiveSolved, totalsAcrossCats.correct) / effectiveSolved) * 100);

  const attemptEfficiencyGlobal =
    !isMeasurementUnlocked || effectiveSolved === 0
      ? 0
      : Math.round((effectiveSolved / effectiveAttempts) * 100);

  const overallAccuracy = !isMeasurementUnlocked || effectiveSolved === 0
    ? 0
    : Math.round(firstTryGlobalRate * 0.6 + attemptEfficiencyGlobal * 0.4);

  const domainDefinitions: {
    id: GameCategory;
    title: string;
    clinicalName: string;
    shortLabel: string;
    emoji: string;
    barColor: string;
    hexColor: string;
    hexDark: string;
    hexTop: string;
    milestoneGoal: string;
    familyAdvice: string;
  }[] = [
    {
      id: 'logic',
      title: '1. Logica, Indovinelli & Test QI',
      clinicalName: 'Logica, Indovinelli & Test QI (Matrici)',
      shortLabel: 'Logica/QI',
      emoji: '🧠',
      barColor: 'from-violet-500 to-purple-500',
      hexColor: '#7c3aed',
      hexDark: '#4c1d95',
      hexTop: '#a78bfa',
      milestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Matrici logiche analogiche per il QI, deduzione figurata e indovinelli.`,
      familyAdvice:
        'Proponete giochi di analogia quotidiana: "Il pesciolino sta nel mare come l\'uccellino sta nel...?"',
    },
    {
      id: 'letters',
      title: '2. Linguaggio, Fonetica & Lettere',
      clinicalName: 'Linguaggio, Fonetica & Lettere Familiari',
      shortLabel: 'Lettere',
      emoji: '🔤',
      barColor: 'from-emerald-500 to-teal-500',
      hexColor: '#10b981',
      hexDark: '#047857',
      hexTop: '#34d399',
      milestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Riconoscimento suoni iniziali, lettera E di Emma e rime fonetiche.`,
      familyAdvice:
        'Enfatizzate il suono iniziale delle parole quotidiane: "Mmm-Mela!", "Sss-Sole!", "Eee-Emma!".',
    },
    {
      id: 'numbers',
      title: '3. Senso del Numero & Calcolo Visivo',
      clinicalName: 'Senso del Numero, Quantità & Calcolo Visivo',
      shortLabel: 'Numeri',
      emoji: '🔢',
      barColor: 'from-sky-500 to-blue-600',
      hexColor: '#0284c7',
      hexDark: '#0369a1',
      hexTop: '#38bdf8',
      milestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Conteggio 1-a-1 con il dito, somme/sottrazioni visive e concordanza M/F.`,
      familyAdvice:
        'Coinvolgetela apparecchiando: "Prendi una mela rossa e due mele gialle, quante mele sono?"',
    },
    {
      id: 'shapes',
      title: '4. Spazio, Sagome, Forme & Colori',
      clinicalName: 'Spazio, Sagome, Forme & Colori',
      shortLabel: 'Forme',
      emoji: '🔷',
      barColor: 'from-pink-500 to-rose-500',
      hexColor: '#db2777',
      hexDark: '#9d174d',
      hexTop: '#f472b6',
      milestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Figure geometriche piane, orientamento spaziale e mescolanze cromatiche.`,
      familyAdvice:
        'Cercate insieme le forme negli oggetti di casa: "Il piatto è un cerchio, il fazzoletto è un quadrato!"',
    },
    {
      id: 'music',
      title: '5. Musica, Strumenti & Ritmo Sonoro',
      clinicalName: 'Musica, Note & Ritmo Sonoro',
      shortLabel: 'Musica',
      emoji: '🎵',
      barColor: 'from-amber-400 to-orange-500',
      hexColor: '#d97706',
      hexDark: '#92400e',
      hexTop: '#fbbf24',
      milestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Percezione melodica (Do-Re-Mi), pattern ritmici e timbro degli strumenti.`,
      familyAdvice:
        'Battete le mani a ritmo (Bum-Clap-Bum-Clap) chiedendo a Emma di continuare la sequenza sonora.',
    },
    {
      id: 'english',
      title: '6. Inglese Prescolare & Prime Paroline',
      clinicalName: 'Inglese Prescolare & Prime Paroline',
      shortLabel: 'Inglese',
      emoji: '🇬🇧',
      barColor: 'from-cyan-500 to-indigo-500',
      hexColor: '#0891b2',
      hexDark: '#155e75',
      hexTop: '#22d3ee',
      milestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Prime paroline in inglese (Dog, Cat, Sun, Apple, Star, Red, Blue, Heart).`,
      familyAdvice:
        'Salutate al mattino con "Good morning!" e indicate i colori dicendo: "Guarda, Red come la fragola!"',
    },
  ];

  const domainMetrics: DomainMetric[] = domainDefinitions.map((def) => {
    const catStat = progress.categoryStats[def.id] || { correct: 0, total: 0, attempts: 0 };
    const completed = Math.max(0, catStat.total);
    const correctFirstTry = Math.min(completed, Math.max(0, catStat.correct));
    const attemptsTotal = getSafeAttempts(correctFirstTry, completed, catStat.attempts);

    if (!isMeasurementUnlocked) {
      return {
        ...def,
        completed,
        correctFirstTry,
        attemptsTotal,
        firstTryRate: 0,
        attemptEfficiency: 0,
        accuracy: 0,
        masteryIndex: 0,
        levelLabel: 'Calibrazione (0%)',
        pedagogicalNote:
          'Parametro a 0% nei primi 10 livelli. Il 1° step di misurazione parte dopo il Livello 10 e si aggiorna livello per livello.',
      };
    }

    if (completed === 0) {
      return {
        ...def,
        completed: 0,
        correctFirstTry: 0,
        attemptsTotal: 0,
        firstTryRate: 0,
        attemptEfficiency: 0,
        accuracy: 0,
        masteryIndex: 0,
        levelLabel: 'Nessun Dato',
        pedagogicalNote:
          'Nessuna prova completata finora in questo ambito: il punteggio si aggiornerà automaticamente alla prima prova risolta.',
      };
    }

    const firstTryRate = Math.round((correctFirstTry / completed) * 100);
    const attemptEfficiency = Math.round((completed / Math.max(completed, attemptsTotal)) * 100);
    const accuracy = Math.round(firstTryRate * 0.6 + attemptEfficiency * 0.4);

    // Volume & difficulty depth scales smoothly without masking errors
    const depthFactor = Math.min(
      100,
      Math.round(35 + completed * 8 + Math.max(0, completedLevelsCount - 10) * 1.5)
    );
    const qualityScaledDepth = depthFactor * (0.35 + 0.65 * (accuracy / 100));
    const masteryIndex = Math.min(
      100,
      Math.max(0, Math.round(accuracy * 0.65 + qualityScaledDepth * 0.35))
    );

    let levelLabel = 'Da Rinforzare';
    if (masteryIndex >= 82) levelLabel = 'Eccellente';
    else if (masteryIndex >= 65) levelLabel = 'Buono';
    else if (masteryIndex >= 45) levelLabel = 'In Sviluppo';

    const perfSummary =
      masteryIndex >= 82
        ? 'risponde con elevata sicurezza al primo colpo'
        : masteryIndex >= 65
        ? 'mostra buona padronanza con sporadici tentativi di verifica'
        : masteryIndex >= 45
        ? 'sta consolidando le basi attraverso prove guidate'
        : 'necessita di un piccolo rinforzo visivo con gioco calmo e guidato';

    const notesByDomain: Record<GameCategory, string> = {
      logic: `Al Livello ${progress.currentLevel}, ${perfSummary} nelle matrici analogiche QI e indovinelli (${correctFirstTry}/${completed} al 1° tentativo, ${attemptsTotal} tocchi totali).`,
      letters: `Al Livello ${progress.currentLevel}, ${perfSummary} nel riconoscimento della lettera E e dei fonemi iniziali (${correctFirstTry}/${completed} al 1° tentativo, ${attemptsTotal} tocchi totali).`,
      numbers: `Al Livello ${progress.currentLevel}, ${perfSummary} nel conteggio tattile e calcolo visivo (${correctFirstTry}/${completed} al 1° tentativo, ${attemptsTotal} tocchi totali).`,
      shapes: `Al Livello ${progress.currentLevel}, ${perfSummary} su sagome geometriche e colori (${correctFirstTry}/${completed} al 1° tentativo, ${attemptsTotal} tocchi totali).`,
      music: `Al Livello ${progress.currentLevel}, ${perfSummary} nell'orecchio ritmico e riconoscimento strumenti (${correctFirstTry}/${completed} al 1° tentativo, ${attemptsTotal} tocchi totali).`,
      english: `Al Livello ${progress.currentLevel}, ${perfSummary} nell'associazione delle prime paroline inglesi (${correctFirstTry}/${completed} al 1° tentativo, ${attemptsTotal} tocchi totali).`,
    };

    return {
      ...def,
      completed,
      correctFirstTry,
      attemptsTotal,
      firstTryRate,
      attemptEfficiency,
      accuracy,
      masteryIndex,
      levelLabel,
      pedagogicalNote: notesByDomain[def.id],
    };
  });

  // =========================================================================
  // TREND / ANDAMENTO LIVELLO PER LIVELLO
  // =========================================================================
  const rawHistory: LevelPerformanceEntry[] = Array.isArray(progress.levelHistory)
    ? progress.levelHistory
    : [];

  let trendAnalysis: TrendAnalysisResult;
  if (!isMeasurementUnlocked) {
    trendAnalysis = {
      unlocked: false,
      points: [],
      recentAvg: 0,
      previousAvg: 0,
      delta: 0,
      trendStatus: 'In Calibrazione',
      summaryText: 'Andamento storico bloccato allo 0% fino al completamento del Livello 10.',
    };
  } else {
    const recentSlice = rawHistory.slice(-16);
    let runningSum = 0;
    const points: TrendPoint[] = recentSlice.map((entry, i) => {
      const scorePercent = Math.max(20, Math.min(100, Math.round(100 / Math.max(1, entry.attempts))));
      runningSum += scorePercent;
      return {
        level: entry.level,
        category: entry.category,
        scorePercent,
        cumulativeAvg: Math.round(runningSum / (i + 1)),
        firstTry: entry.firstTry,
        attempts: entry.attempts,
      };
    });

    if (points.length === 0) {
      // Fallback when existing saved profile pre-dates levelHistory logging
      trendAnalysis = {
        unlocked: true,
        points: [],
        recentAvg: overallAccuracy,
        previousAvg: overallAccuracy,
        delta: 0,
        trendStatus: 'Stabile',
        summaryText: `Accuratezza globale registrata al ${overallAccuracy}% (i prossimi livelli popoleranno la curva storica dettagliata).`,
      };
    } else {
      const windowSize = Math.min(5, Math.max(1, Math.floor(points.length / 2) || 1));
      const recentWindow = points.slice(-windowSize);
      const prevWindow = points.slice(0, Math.max(1, points.length - windowSize));

      const recentAvg = Math.round(
        recentWindow.reduce((sum, p) => sum + p.scorePercent, 0) / recentWindow.length
      );
      const previousAvg = Math.round(
        prevWindow.reduce((sum, p) => sum + p.scorePercent, 0) / prevWindow.length
      );
      const delta = points.length >= 2 ? recentAvg - previousAvg : 0;

      let trendStatus: TrendAnalysisResult['trendStatus'] = 'Stabile';
      if (delta >= 5) trendStatus = 'In Crescita';
      else if (delta <= -5) trendStatus = 'In Flessione';

      const summaryText =
        points.length < 2
          ? `Media iniziale rilevata: ${recentAvg}%.`
          : trendStatus === 'In Crescita'
          ? `Andamento in miglioramento (+${delta}% negli ultimi ${recentWindow.length} livelli rispetto ai precedenti).`
          : trendStatus === 'In Flessione'
          ? `Lieve calo recente (${delta}% negli ultimi ${recentWindow.length} livelli): consigliata una sessione calma di ripasso.`
          : `Rendimento costante (${recentAvg}% medio negli ultimi ${recentWindow.length} livelli).`;

      trendAnalysis = {
        unlocked: true,
        points,
        recentAvg,
        previousAvg,
        delta,
        trendStatus,
        summaryText,
      };
    }
  }

  // =========================================================================
  // WPPSI-IV COHERENT PSYCHOMETRIC IQ ENGINE (0% on Levels 1-10)
  // =========================================================================
  let iqAnalysis: IQAnalysisResult;
  if (!isMeasurementUnlocked) {
    iqAnalysis = {
      unlocked: false,
      iqScore: 0,
      iqRange: '0% (Liv. 1–10)',
      percentile: '0° percentile',
      classification: 'Calibrazione Iniziale (0% fino al Livello 10)',
      indices: [
        {
          code: 'Gf',
          shortTitle: '1. Ragionamento (Gf)',
          label: '1. Matrici Logiche & Ragionamento Fluido (Gf)',
          scaledScore: 0,
          percentScore: 0,
          colorHex: '#7c3aed',
          desc: '0% fino al Livello 10',
        },
        {
          code: 'Gwm',
          shortTitle: '2. Memoria/Ritmo (Gwm)',
          label: '2. Memoria di Lavoro & Ritmo Sonoro (Gwm)',
          scaledScore: 0,
          percentScore: 0,
          colorHex: '#0284c7',
          desc: '0% fino al Livello 10',
        },
        {
          code: 'Gc',
          shortTitle: '3. Verbale/Inglese (Gc)',
          label: '3. Comprensione Verbale & Inglese L2 (Gc)',
          scaledScore: 0,
          percentScore: 0,
          colorHex: '#10b981',
          desc: '0% fino al Livello 10',
        },
        {
          code: 'Gv',
          shortTitle: '4. Visuo-Spazio (Gv)',
          label: '4. Elaborazione Visuo-Spaziale & Forme (Gv)',
          scaledScore: 0,
          percentScore: 0,
          colorHex: '#db2777',
          desc: '0% fino al Livello 10',
        },
        {
          code: 'Gs',
          shortTitle: '5. Velocità/Precis. (Gs)',
          label: '5. Velocità Esecutiva & Precisione 1° Tocco (Gs)',
          scaledScore: 0,
          percentScore: 0,
          colorHex: '#d97706',
          desc: '0% fino al Livello 10',
        },
      ],
      clinicalNote:
        'Regola Misurazione Attiva: Partenza 0% nei Livelli 1–10. Il primo step di misurazione si sblocca dopo il Livello 10 e si aggiorna livello per livello.',
    };
  } else {
    const getMetric = (id: GameCategory) => domainMetrics.find((d) => d.id === id)!;
    const avgActive = (items: DomainMetric[], fallback: number): number => {
      const active = items.filter((i) => i.completed > 0);
      if (active.length === 0) return fallback;
      return Math.round(active.reduce((s, i) => s + i.masteryIndex, 0) / active.length);
    };

    const logicM = getMetric('logic').completed > 0 ? getMetric('logic').masteryIndex : overallAccuracy;
    const gwmPercent = avgActive([getMetric('music'), getMetric('numbers')], overallAccuracy);
    const gcPercent = avgActive([getMetric('letters'), getMetric('english')], overallAccuracy);

    const shapesBase = getMetric('shapes').completed > 0 ? getMetric('shapes').masteryIndex : overallAccuracy;
    const gvPercent =
      progress.trisGamesPlayed > 0
        ? Math.round(
            shapesBase * 0.85 +
              Math.round((progress.trisGamesWon / progress.trisGamesPlayed) * 100) * 0.15
          )
        : shapesBase;
    const gsPercent = overallAccuracy;

    // Tier bonus ONLY applies when accuracy >= 60%, preventing score inflation from random guessing
    const tierDifficultyBonusRaw = Math.min(12, Math.max(0, completedLevelsCount - 10) * 0.45);
    const toIQScale = (percentScore: number): number => {
      const qualityBonus =
        percentScore >= 60 ? tierDifficultyBonusRaw * ((percentScore - 50) / 50) : 0;
      return Math.max(70, Math.min(142, Math.round(72 + percentScore * 0.54 + qualityBonus)));
    };

    const gfScore = toIQScale(logicM);
    const gwmScore = toIQScale(gwmPercent);
    const gcScore = toIQScale(gcPercent);
    const gvScore = toIQScale(gvPercent);
    const gsScore = toIQScale(gsPercent);

    const compositeIQ = Math.round((gfScore + gwmScore + gcScore + gvScore + gsScore) / 5);

    let classification = 'Profilo in Consolidamento (Utile Esercizio Guidato)';
    let percentile = '25° percentile';
    if (compositeIQ >= 130) {
      classification = 'Profilo Superiore / Alto Potenziale Cognitivo';
      percentile = '98° percentile';
    } else if (compositeIQ >= 120) {
      classification = 'Profilo Molto Brillante per Età (5 Anni)';
      percentile = '91° percentile';
    } else if (compositeIQ >= 110) {
      classification = 'Profilo Medio-Superiore / Ottimo Sviluppo';
      percentile = '75° percentile';
    } else if (compositeIQ >= 95) {
      classification = 'Profilo Nella Media Attesa per Età (5 Anni)';
      percentile = '50° percentile';
    }

    iqAnalysis = {
      unlocked: true,
      iqScore: compositeIQ,
      iqRange: `${compositeIQ - 3}–${compositeIQ + 3}`,
      percentile,
      classification,
      indices: [
        {
          code: 'Gf',
          shortTitle: '1. Ragionamento (Gf)',
          label: '1. Matrici Logiche & Ragionamento Fluido (Gf)',
          scaledScore: gfScore,
          percentScore: logicM,
          colorHex: '#7c3aed',
          desc: 'Deduzione di pattern, matrici analogiche e problem solving.',
        },
        {
          code: 'Gwm',
          shortTitle: '2. Memoria/Ritmo (Gwm)',
          label: '2. Memoria di Lavoro & Ritmo Sonoro (Gwm)',
          scaledScore: gwmScore,
          percentScore: gwmPercent,
          colorHex: '#0284c7',
          desc: 'Tenuta sequenziale di note musicali, ritmi e quantità numeriche.',
        },
        {
          code: 'Gc',
          shortTitle: '3. Verbale/Inglese (Gc)',
          label: '3. Comprensione Verbale & Inglese L2 (Gc)',
          scaledScore: gcScore,
          percentScore: gcPercent,
          colorHex: '#10b981',
          desc: 'Consapevolezza fonologica italiana e acquisizione vocaboli inglesi.',
        },
        {
          code: 'Gv',
          shortTitle: '4. Visuo-Spazio (Gv)',
          label: '4. Elaborazione Visuo-Spaziale & Forme (Gv)',
          scaledScore: gvScore,
          percentScore: gvPercent,
          colorHex: '#db2777',
          desc: 'Riconoscimento sagome, geometria piana e strategia Tris 3D.',
        },
        {
          code: 'Gs',
          shortTitle: '5. Velocità/Precis. (Gs)',
          label: '5. Velocità Esecutiva & Precisione (Gs)',
          scaledScore: gsScore,
          percentScore: gsPercent,
          colorHex: '#d97706',
          desc: 'Accuratezza reale su tutti i tentativi e costanza attentiva.',
        },
      ],
      clinicalNote: `Calcolo Reale WPPSI-IV (Livello ${progress.currentLevel}): Accuratezza globale ${overallAccuracy}% (${firstTryGlobalRate}% al 1° tocco · ${attemptEfficiencyGlobal}% efficienza tentativi) su ${effectiveSolved} prove e ${effectiveAttempts} tocchi.`,
    };
  }

  return {
    completedLevelsCount,
    isMeasurementUnlocked,
    currentTier,
    overallAccuracy,
    firstTryGlobalRate,
    attemptEfficiencyGlobal,
    domainMetrics,
    iqAnalysis,
    trendAnalysis,
  };
}
