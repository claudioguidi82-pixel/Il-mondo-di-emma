import { AgeBandId, ChildGender, ChildProfile, UserProgress } from '../types/game';

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
      'Animali & Natura',
      'Artistica: Colori Primari & Forme',
      'Primi Numeri (1–5)',
      'Musica & Senso del Ritmo Base',
    ],
    coreFocus: 'Esplorazione sensoriale, ritmi battuti, colori primari e prime associazioni logiche.',
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

export function isValidIsoDate(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const currentYear = new Date().getFullYear();
  if (y < currentYear - 16 || y > currentYear) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const check = new Date(y, m - 1, d);
  return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
}

export function parseBirthDateParts(birthDate?: string): { year: number; month: number; day: number; iso: string } {
  const safeIso = isValidIsoDate(birthDate) ? birthDate!.trim() : DEFAULT_BIRTH_DATE;
  const [yStr, mStr, dStr] = safeIso.split('-');
  return {
    year: Number(yStr),
    month: Number(mStr),
    day: Number(dStr),
    iso: safeIso,
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
    ageBandTitle = '2–3 Anni · Prima Infanzia';
    developmentalStage =
      'Percorso 2–3 Anni (Animali & Versi, Artistica Colori Primari, Primi Numeri 1–5 & Senso del Ritmo)';
    curriculumSummary =
      'Colori primari e forme semplici, versi degli animali, conteggio guidato 1–5, grande/piccolo e giochi sonori sul senso del ritmo (con prime vocali ai livelli avanzati).';
    subjectsHighlight = [
      'Animali, Versi & Associazioni',
      'Artistica: Colori Primari & Forme',
      'Primi Numeri (1–5)',
      'Musica & Senso del Ritmo Base',
    ];
    newlyAddedSubjects = [
      'Versi & Associazioni',
      'Colori Primari',
      'Conteggio 1–5',
      'Senso del Ritmo',
    ];
    unlockedSubjectsCount = 4;
    difficultyBadge = 'Fascia 1/6 · Primi Passi (2–3 anni)';
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

export interface AdaptiveMasteryProfile {
  chronologicalBand: AgeBandId;
  effectiveBand: AgeBandId;
  boostLevel: 0 | 1 | 2 | 3; // 0 = Età standard, 1 = Sblocco graduale +1, 2 = Avanzamento +1 completo, 3 = Eccellenza +2
  boostLabel: string;
  earlyUnlockRatio: number; // 0..0.65 proportion of puzzles drawn from advanced/enrichment subjects
  unlockedBonusSubjects: string[];
  nextThresholdHint: string;
  progressPercentToNext: number;
  solvedCount: number;
  accuracyPercent: number;
  autonomyPercent: number;
}

const BONUS_SUBJECTS_BY_STEP: Record<AgeBandId, string[]> = {
  toddler_2_3: ['Educazione Emotiva & Empatia', 'Memoria Visiva', 'Artistica: Mescolanza Colori'],
  preschool_4_5: ['Ecologia & Ambiente', 'Orologio & Tempo', 'Artistica: Colori Caldi/Freddi', 'Prime Tabelline'],
  early_primary_6_7: ['Astronomia & Universo', 'Geografia del Mondo', 'Educazione Finanziaria', 'Tabelline & Divisioni'],
  upper_primary_8_9: ['Invenzioni & Tecnologia', 'Pensiero Critico & Filosofia', 'Pre-Algebra & Potenze', 'Coding & Probabilità'],
  preteen_10_12: ['Chimica & Leggi di Newton', 'Algebra & Radici Quadrate', 'Algoritmi & Logica Booleana', 'Inglese B1'],
  teen_13_14: ['Pensiero Critico & Filosofia', 'Astronomia Avanzata', 'Invenzioni & Codice Binario', 'Educazione Finanziaria'],
};

/**
 * Computes proportional early subject unlocking whenever the child's learning metrics
 * (first-try accuracy, autonomy, and completed volume) are consistently high.
 * Allows gradual opening of enrichment & next-age-band subjects even before reaching that age!
 */
export function computeAdaptiveMasteryProfile(progress?: UserProgress): AdaptiveMasteryProfile {
  const ageInfo = calculateChildAge(progress?.childProfile?.birthDate);
  const baseIdx = AGE_BAND_ORDER.indexOf(ageInfo.ageBand);
  const solvedCount = Math.max(
    progress?.totalPuzzlesSolved || 0,
    (progress?.levelHistory || []).length
  );

  // Measure real performance from recent history (up to last 20 exercises) using
  // difficulty + mild recency weighting (aligned with the CHC cognitive engine)
  const history = progress?.levelHistory || [];
  const recent = history.slice(-20);

  let accuracyPercent = 0;
  let autonomyPercent = 0;

  if (recent.length > 0) {
    let wTotal = 0;
    let wCorrect = 0;
    let wAutonomy = 0;
    const n = recent.length;

    recent.forEach((h, idx) => {
      const diffWeight = h.weight ?? (1 + Math.min(4, Math.floor((Math.max(1, h.level || 1) - 1) / 10)) * 0.25);
      const recency = Math.pow(0.95, n - 1 - idx);
      const effW = diffWeight * recency;
      const hints = h.hintsUsed || 0;
      const attempts = Math.max(1, h.attempts || 1);
      const isAutoCorrect = Boolean(h.firstTry) && hints === 0 && attempts === 1;

      wTotal += effW;
      if (isAutoCorrect) wCorrect += effW;
      const aScore =
        attempts === 1 && hints === 0
          ? 1
          : attempts === 1 && hints > 0
          ? 0.72
          : attempts === 2
          ? 0.45
          : 0.2;
      wAutonomy += effW * aScore;
    });

    // Mild Empirical Bayes smoothing on very small samples (< 5 items)
    const priorW = n < 5 ? 0.8 : 0;
    accuracyPercent = Math.round(((wCorrect + priorW * 0.6) / (wTotal + priorW)) * 100);
    autonomyPercent = Math.round(((wAutonomy + priorW * 0.65) / (wTotal + priorW)) * 100);
  } else if (progress?.categoryStats) {
    const cats = Object.values(progress.categoryStats).filter(Boolean);
    const total = cats.reduce((acc, c) => acc + (c?.total || 0), 0);
    const correct = cats.reduce((acc, c) => acc + (c?.correct || 0), 0);
    if (total > 0) {
      accuracyPercent = Math.round((correct / total) * 100);
      autonomyPercent = accuracyPercent;
    }
  }

  let boostLevel: 0 | 1 | 2 | 3 = 0;
  let boostLabel = 'Calibrazione Standard per Età';
  let earlyUnlockRatio = 0;
  let nextThresholdHint =
    'Completa almeno 6 sfide con accuratezza ≥ 78% per sbloccare in anticipo le prime materie avanzate!';
  let progressPercentToNext = Math.min(
    99,
    Math.round(((Math.min(solvedCount, 6) / 6) * 0.55 + (Math.min(accuracyPercent, 78) / 78) * 0.45) * 100)
  );

  if (solvedCount >= 22 && accuracyPercent >= 90 && autonomyPercent >= 84) {
    boostLevel = 3;
    boostLabel = 'Eccellenza · Sblocco Avanzato (+2 Fasce)';
    earlyUnlockRatio = 0.55;
    nextThresholdHint =
      'Massimo livello di sblocco attivo: tutte le materie avanzate e di ragionamento sono accessibili gradualmente!';
    progressPercentToNext = 100;
  } else if (solvedCount >= 12 && accuracyPercent >= 84 && autonomyPercent >= 78) {
    boostLevel = 2;
    boostLabel = 'Talento in Crescita · Materie +1 Fascia';
    earlyUnlockRatio = 0.4;
    nextThresholdHint =
      'Raggiungi 22 prove con accuratezza ≥ 90% per aprire anche il livello Eccellenza (+2 fasce)!';
    progressPercentToNext = Math.min(
      99,
      Math.round(((Math.min(solvedCount, 22) / 22) * 0.5 + (Math.min(accuracyPercent, 90) / 90) * 0.5) * 100)
    );
  } else if (solvedCount >= 6 && accuracyPercent >= 78) {
    boostLevel = 1;
    boostLabel = 'Esplorazione Anticipata (+1 Graduale)';
    earlyUnlockRatio = 0.25;
    nextThresholdHint =
      'Raggiungi 12 prove con accuratezza ≥ 84% per aprire ancora più materie della fascia successiva!';
    progressPercentToNext = Math.min(
      99,
      Math.round(((Math.min(solvedCount, 12) / 12) * 0.5 + (Math.min(accuracyPercent, 84) / 84) * 0.5) * 100)
    );
  }

  const bandShift = boostLevel === 3 ? 2 : boostLevel >= 1 ? 1 : 0;
  const effectiveIdx = Math.min(AGE_BAND_ORDER.length - 1, baseIdx + bandShift);
  const effectiveBand = AGE_BAND_ORDER[effectiveIdx];

  const baseBonus = BONUS_SUBJECTS_BY_STEP[ageInfo.ageBand] || [];
  const nextBandBonus =
    effectiveIdx > baseIdx ? BONUS_SUBJECTS_BY_STEP[effectiveBand] || [] : [];

  const unlockedBonusSubjects =
    boostLevel === 0
      ? []
      : boostLevel === 1
      ? baseBonus.slice(0, 2)
      : boostLevel === 2
      ? [...baseBonus]
      : Array.from(new Set([...baseBonus, ...nextBandBonus]));

  return {
    chronologicalBand: ageInfo.ageBand,
    effectiveBand,
    boostLevel,
    boostLabel,
    earlyUnlockRatio,
    unlockedBonusSubjects,
    nextThresholdHint,
    progressPercentToNext,
    solvedCount,
    accuracyPercent,
    autonomyPercent,
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
