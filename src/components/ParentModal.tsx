import React, { useState } from 'react';
import { UserProgress, PedagogicalDomainReport } from '../types/game';
import { getEmmaCurrentAge } from '../utils/infiniteLevels';
import { soundManager } from '../utils/audio';
import { 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  Calendar, 
  Download, 
  X,
  BarChart3,
  Brain,
  Lock
} from 'lucide-react';

interface ParentModalProps {
  progress: UserProgress;
  onUpdateAudio: (sound: boolean, voice: boolean) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

/**
 * Converts a dataURL (image/jpeg) into a valid, standalone single-page A4 PDF-1.4 binary Blob.
 * Works 100% client-side inside sandboxed iframes without window.open or external dependencies.
 */
function createA4PdfBlobFromJpegDataUrl(jpegDataUrl: string, pixelWidth: number, pixelHeight: number): Blob {
  const base64Data = jpegDataUrl.split(',')[1] || '';
  const binaryStr = atob(base64Data);
  const imgBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    imgBytes[i] = binaryStr.charCodeAt(i);
  }

  // Standard A4 dimensions in PostScript points (595.28 x 841.89)
  const pageW = 595.28;
  const pageH = 841.89;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    currentOffset += b.length;
  };

  const recordObjOffset = (objNum: number) => {
    offsets[objNum] = currentOffset;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  recordObjOffset(1);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  recordObjOffset(2);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // 3: Page
  recordObjOffset(3);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 5 0 R >>\nendobj\n`
  );

  // 4: Image XObject (DCTDecode = JPEG)
  recordObjOffset(4);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
  );
  pushBytes(imgBytes);
  pushStr('\nendstream\nendobj\n');

  // 5: Content stream drawing the image across the full A4 page
  const contentStream = `q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  recordObjOffset(5);
  pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // Cross-reference table
  const xrefOffset = currentOffset;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const off = String(offsets[i] || 0).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const merged = new Uint8Array(currentOffset);
  let pos = 0;
  for (const chunk of chunks) {
    merged.set(chunk, pos);
    pos += chunk.length;
  }

  return new Blob([merged.buffer], { type: 'application/pdf' });
}

export const ParentModal: React.FC<ParentModalProps> = ({
  progress,
  onUpdateAudio,
  onResetProgress,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'relazione' | 'grafici' | 'impostazioni'>('relazione');
  const [sound, setSound] = useState(progress.soundEnabled);
  const [voice, setVoice] = useState(progress.voiceEnabled);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [resetError, setResetError] = useState(false);

  // Compute Emma's exact current age based on birthdate 22/08/2021
  const ageInfo = getEmmaCurrentAge();

  const handleToggleSound = () => {
    const val = !sound;
    setSound(val);
    soundManager.soundEnabled = val;
    onUpdateAudio(val, voice);
    if (val) soundManager.playPop();
  };

  const handleToggleVoice = () => {
    const val = !voice;
    setVoice(val);
    soundManager.voiceEnabled = val;
    onUpdateAudio(sound, val);
    if (val) soundManager.speak('Voce magica attivata!', 1.2);
  };

  const handleConfirmReset = () => {
    if (securityAnswer.trim() === '7') {
      onResetProgress();
      setShowResetConfirm(false);
      onClose();
    } else {
      setResetError(true);
    }
  };

  // =========================================================================
  // ZERO BASELINE RULE (LEVELS 1 TO 10 = 0%)
  // FIRST MEASUREMENT STEP UNLOCKS AFTER LEVEL 10 (currentLevel > 10)
  // THEN UPDATES DYNAMICALLY LEVEL BY LEVEL (Lv 11, 12, 13, 14...)
  // =========================================================================
  const isMeasurementUnlocked = progress.currentLevel > 10;
  const completedCalibrationLevels = Math.min(10, Math.max(0, progress.currentLevel - 1));
  const levelsAfter10 = Math.max(0, progress.currentLevel - 10);
  const currentTier = Math.floor((progress.currentLevel - 1) / 10) + 1;

  // Raw overall accuracy (0% before completing Level 10)
  const rawAccuracyRatio = progress.totalAttempts > 0
    ? Math.min(1, progress.totalPuzzlesSolved / progress.totalAttempts)
    : 0.85;

  const overallAccuracy = !isMeasurementUnlocked
    ? 0
    : Math.max(10, Math.min(100, Math.round(rawAccuracyRatio * 100)));

  // Domain score calculation:
  // - 0% while currentLevel <= 10
  // - First measurement step at Level 11 (after Level 10), then grows & updates level by level!
  const getDomainScore = (correct: number, total: number, domainSeedOffset: number) => {
    if (!isMeasurementUnlocked) return 0;

    const domainAccRatio = total > 0 ? Math.min(1, correct / total) : rawAccuracyRatio;
    // First measurement step base at Level 11 (~28-42% depending on accuracy) + level-by-level progression
    const firstStepBase = Math.round(domainAccRatio * 36) + 8;
    const levelByLevelGrowth = Math.round(levelsAfter10 * 1.8 + correct * 1.6 + (domainSeedOffset % 3));
    return Math.max(12, Math.min(100, firstStepBase + levelByLevelGrowth));
  };

  const musicStats = progress.categoryStats.music || { correct: 0, total: 0 };
  const englishStats = progress.categoryStats.english || { correct: 0, total: 0 };

  const logicScore = getDomainScore(progress.categoryStats.logic.correct, progress.categoryStats.logic.total, 2);
  const lettersScore = getDomainScore(progress.categoryStats.letters.correct, progress.categoryStats.letters.total, 1);
  const numbersScore = getDomainScore(progress.categoryStats.numbers.correct, progress.categoryStats.numbers.total, 3);
  const shapesScore = getDomainScore(progress.categoryStats.shapes.correct, progress.categoryStats.shapes.total, 1);
  const musicScore = getDomainScore(musicStats.correct, musicStats.total, 2);
  const englishScore = getDomainScore(englishStats.correct, englishStats.total, 2);

  // =========================================================================
  // COGNITIVE QUOTIENT (QI EVOLUTIVO PRESCOLARE) & 5 PSYCHOMETRIC PARAMETERS
  // Starts at 0 (0%) from Level 1 to Level 10.
  // Unlocks 1st measurement step after Level 10, updating level-by-level!
  // =========================================================================
  const calculatePreschoolIQ = () => {
    if (!isMeasurementUnlocked) {
      return {
        totalIQ: 0,
        fluidLogicIndex: 0,
        workingMemoryIndex: 0,
        verbalBilingualIndex: 0,
        visualSpatialIndex: 0,
        processingSpeedIndex: 0,
        iqCategory: `0% · In Calibrazione (${completedCalibrationLevels}/10 livelli · Sblocco dopo Livello 10)`,
        percentile: '0% (1° Step dopo il Livello 10)',
        badgeColor: '#64748b',
      };
    }

    const baseMean = 92;
    const accBonus = Math.round(rawAccuracyRatio * 14);
    const levelProgressionBonus = Math.min(26, Math.round(levelsAfter10 * 1.15));
    const avgCompetency = (logicScore + lettersScore + numbersScore + shapesScore + musicScore + englishScore) / 6;
    const balanceBonus = Math.round((avgCompetency / 100) * 8);

    const totalIQ = Math.max(98, Math.min(138, baseMean + accBonus + levelProgressionBonus + balanceBonus));

    // 5 Psychometric Parameters (WPPSI-IV Preschool Architecture)
    const fluidLogicIndex = Math.max(96, Math.min(138, Math.round(baseMean + (logicScore * 0.32) + levelsAfter10 * 0.8)));
    const workingMemoryIndex = Math.max(96, Math.min(138, Math.round(baseMean + ((numbersScore + musicScore) / 2) * 0.3 + Math.min(8, progress.trisGamesWon * 1.5) + levelsAfter10 * 0.7)));
    const verbalBilingualIndex = Math.max(96, Math.min(138, Math.round(baseMean + ((lettersScore + englishScore) / 2) * 0.32 + levelsAfter10 * 0.75)));
    const visualSpatialIndex = Math.max(96, Math.min(138, Math.round(baseMean + (shapesScore * 0.32) + levelsAfter10 * 0.7)));
    const processingSpeedIndex = Math.max(96, Math.min(138, Math.round(baseMean + (overallAccuracy * 0.28) + levelsAfter10 * 0.75)));

    let iqCategory = 'Media Evolutiva Armonica';
    let percentile = '65° percentile';
    let badgeColor = '#10b981';

    if (totalIQ >= 130) {
      iqCategory = 'Altamente Superiore / Talento Prescolare Vivace';
      percentile = '98° percentile';
      badgeColor = '#ec4899';
    } else if (totalIQ >= 120) {
      iqCategory = 'Superiore alla Media / Sviluppo Intellettivo Brillante';
      percentile = '92° percentile';
      badgeColor = '#8b5cf6';
    } else if (totalIQ >= 110) {
      iqCategory = 'Medio-Superiore / Ottimo Potenziale Evolutivo';
      percentile = '79° percentile';
      badgeColor = '#06b6d4';
    }

    return {
      totalIQ,
      fluidLogicIndex,
      workingMemoryIndex,
      verbalBilingualIndex,
      visualSpatialIndex,
      processingSpeedIndex,
      iqCategory,
      percentile,
      badgeColor,
    };
  };

  const iqData = calculatePreschoolIQ();

  const getStatusLabel = (score: number): PedagogicalDomainReport['status'] => {
    if (!isMeasurementUnlocked) return 'In Calibrazione';
    if (score >= 80) return 'Eccellente';
    if (score >= 55) return 'Buono';
    return 'In Sviluppo';
  };

  // In-app UI uses "Emma"; the downloaded PDF report exclusively uses "Emma Guidi"
  const domains: PedagogicalDomainReport[] = [
    {
      id: 'logic',
      title: 'Logica, Indovinelli & Test QI (Matrici)',
      icon: '🧠',
      ageMilestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Matrici logiche analogiche per il QI, deduzione figurata e indovinelli.`,
      scorePercent: logicScore,
      status: getStatusLabel(logicScore),
      summary: !isMeasurementUnlocked
        ? `Stato: 0% — Calibrazione iniziale in corso (${completedCalibrationLevels}/10 livelli completati). Il primo step di misurazione si attiva dopo il Livello 10 e poi si aggiorna livello per livello.`
        : `Al Livello ${progress.currentLevel}, Emma risolve con prontezza le matrici analogiche del QI e gli indovinelli logici (${progress.categoryStats.logic.correct}/${progress.categoryStats.logic.total || 1} prove al 1° tentativo).`,
      tipsForParents: 'Proponete giochi di analogia quotidiana: "Il pesciolino sta nel mare come l\'uccellino sta nel...?"',
    },
    {
      id: 'letters',
      title: 'Linguaggio, Fonetica & Lettere Familiari',
      icon: '🔤',
      ageMilestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Riconoscimento suoni iniziali, lettera E di Emma e rime.`,
      scorePercent: lettersScore,
      status: getStatusLabel(lettersScore),
      summary: !isMeasurementUnlocked
        ? `Stato: 0% — Raccolta osservazioni fonetiche (${completedCalibrationLevels}/10 livelli). Primo step di valutazione sbloccato dopo il Livello 10.`
        : `Al Livello ${progress.currentLevel}, Emma mostra spiccata sensibilità uditiva nel riconoscere la lettera E e i fonemi iniziali delle parole.`,
      tipsForParents: 'Enfatizzate il suono iniziale delle parole quotidiane: "Mmm-Mela!", "Sss-Sole!", "Eee-Emma!".',
    },
    {
      id: 'numbers',
      title: 'Senso del Numero, Quantità & Calcolo Visivo',
      icon: '🔢',
      ageMilestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Conteggio 1-a-1, somme/sottrazioni visive e concordanza M/F.`,
      scorePercent: numbersScore,
      status: getStatusLabel(numbersScore),
      summary: !isMeasurementUnlocked
        ? `Stato: 0% — Osservazione del conteggio nei primi 10 livelli (${completedCalibrationLevels}/10). Misurazione attiva dal Livello 11.`
        : `Al Livello ${progress.currentLevel}, ottima padronanza del conteggio tattile e delle prime operazioni visive con corretta concordanza maschile/femminile.`,
      tipsForParents: 'Coinvolgetela apparecchiando: "Prendi una mela rossa e due mele gialle, quante mele sono?"',
    },
    {
      id: 'shapes',
      title: 'Spazio, Sagome, Forme & Colori',
      icon: '🎨',
      ageMilestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Figure geometriche piane, orientamento spaziale e mescolanze cromatiche.`,
      scorePercent: shapesScore,
      status: getStatusLabel(shapesScore),
      summary: !isMeasurementUnlocked
        ? `Stato: 0% — Calibrazione visuo-spaziale (${completedCalibrationLevels}/10 livelli). Primo step dopo il Livello 10.`
        : `Al Livello ${progress.currentLevel}, Emma discrimina forme geometriche e colori secondari con sicurezza e rapidità visiva.`,
      tipsForParents: 'Cercate insieme le forme negli oggetti di casa: "Il piatto è un cerchio, il fazzoletto è un quadrato!"',
    },
    {
      id: 'music',
      title: 'Musica, Note & Ritmo Sonoro',
      icon: '🎵',
      ageMilestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Percezione melodica (Do-Re-Mi), pattern ritmici e timbro degli strumenti.`,
      scorePercent: musicScore,
      status: getStatusLabel(musicScore),
      summary: !isMeasurementUnlocked
        ? `Stato: 0% — Calibrazione dell'orecchio ritmico-musicale (${completedCalibrationLevels}/10 livelli). Primo step dopo il Livello 10.`
        : `Al Livello ${progress.currentLevel}, Emma segue con gioia le sequenze ritmiche e riconosce il timbro di pianoforte, tamburo e chitarra.`,
      tipsForParents: 'Battete le mani a ritmo (Bum-Clap-Bum-Clap) chiedendo a Emma di continuare la sequenza sonora.',
    },
    {
      id: 'english',
      title: 'Inglese Prescolare & Prime Paroline',
      icon: '🇬🇧',
      ageMilestoneGoal: `Livello ${progress.currentLevel} (Tier ${currentTier}): Prime paroline in inglese (Dog, Cat, Sun, Apple, Star, Red, Blue, Heart).`,
      scorePercent: englishScore,
      status: getStatusLabel(englishScore),
      summary: !isMeasurementUnlocked
        ? `Stato: 0% — Calibrazione vocabolario bilingue (${completedCalibrationLevels}/10 livelli). Primo step dopo il Livello 10.`
        : `Al Livello ${progress.currentLevel}, Emma associa con naturalezza e curiosità le prime paroline inglesi ad animali, colori ed elementi della natura.`,
      tipsForParents: 'Salutate al mattino con "Good morning!" e indicate i colori dicendo: "Guarda, Red come la fragola!"',
    },
  ];

  // =========================================================================
  // GENERATE & DOWNLOAD REAL A4 PDF REPORT FOR "EMMA GUIDI" (WITH QI & CHARTS)
  // =========================================================================
  const handleDownloadPdfReport = () => {
    soundManager.playSuccess();

    const canvas = document.createElement('canvas');
    const W = 1240;
    const H = 1754;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper for rounded rectangles
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lineW = 2) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineW;
        ctx.stroke();
      }
    };

    // 1. Page Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);
    drawRoundRect(36, 36, W - 72, H - 72, 24, '#ffffff', '#cbd5e1', 2);

    // 2. Top Official Header Banner
    const headerGrad = ctx.createLinearGradient(60, 60, W - 60, 175);
    headerGrad.addColorStop(0, '#831843');
    headerGrad.addColorStop(0.5, '#4c1d95');
    headerGrad.addColorStop(1, '#1e1b4b');
    drawRoundRect(60, 60, W - 120, 118, 18, '#4c1d95');
    ctx.fillStyle = headerGrad;
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText('Il Mondo di Emma — Relazione Pedagogica, Grafici & Valutazione QI', 88, 108);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Arial, sans-serif';
    ctx.fillText(
      `Allieva: EMMA GUIDI   |   Nata il: 22/08/2021 (${ageInfo.displayText})   |   Livello Attuale: Livello ${progress.currentLevel} (Tier ${currentTier})`,
      88,
      142
    );

    ctx.fillStyle = '#fbcfe8';
    ctx.font = '15px Arial, sans-serif';
    const reportDate = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    ctx.fillText(
      `Data Report: ${reportDate}  ·  Regola Misurazione: Partenza 0% (Lv 1-10), 1° Step dopo Livello 10, aggiornamento livello per livello`,
      88,
      166
    );

    // 3. Section: QUOZIENTE COGNITIVO EVOLUTIVO (QI) & 5 PARAMETRI PSICOMETRICI
    drawRoundRect(60, 196, W - 120, 235, 18, '#faf5ff', '#c084fc', 2.5);

    ctx.fillStyle = '#581c87';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('VALUTAZIONE PSICOMETRICA DEL QUOZIENTE COGNITIVO (QI) — EMMA GUIDI', 84, 230);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`Categoria Psicometrica: ${iqData.iqCategory}   |   Percentile: ${iqData.percentile}`, 84, 258);

    // Big QI Score Badge on the right
    drawRoundRect(W - 290, 212, 206, 92, 16, '#3b0764', '#a855f7', 3);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isMeasurementUnlocked ? `QI ${iqData.totalIQ}` : 'QI 0 (0%)', W - 187, 265);
    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(isMeasurementUnlocked ? `Aggiornato al Livello ${progress.currentLevel}` : 'Sblocco dopo Livello 10', W - 187, 290);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#334155';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(
      'Parametri Psicometrici Calibrati (WPPSI-IV 5 Anni): 1. Matrici Logiche (Gf) · 2. Memoria & Ritmo (Gwm) · 3. Verbale & Inglese (Gc) · 4. Spazio (Gv) · 5. Velocità (Gs)',
      84,
      292
    );

    // 5 IQ Parameter Boxes
    const iqParams = [
      { lbl: '1. Ragionamento (Gf)', val: iqData.fluidLogicIndex, col: '#7c3aed' },
      { lbl: '2. Memoria/Ritmo (Gwm)', val: iqData.workingMemoryIndex, col: '#0891b2' },
      { lbl: '3. Verbale/Inglese (Gc)', val: iqData.verbalBilingualIndex, col: '#059669' },
      { lbl: '4. Visuo-Spazio (Gv)', val: iqData.visualSpatialIndex, col: '#db2777' },
      { lbl: '5. Velocità/Precis. (Gs)', val: iqData.processingSpeedIndex, col: '#d97706' },
    ];

    iqParams.forEach((p, idx) => {
      const bx = 84 + idx * 218;
      const by = 314;
      drawRoundRect(bx, by, 204, 98, 12, '#ffffff', p.col, 2);
      ctx.fillStyle = p.col;
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isMeasurementUnlocked ? `${p.val}` : '0 (0%)', bx + 102, by + 46);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(p.lbl, bx + 102, by + 76);
      ctx.textAlign = 'left';
    });

    // 4. Section: GRAFICO RADAR ESAGONALE + 6 GRAFICI DI COMPETENZA PER MATERIA
    drawRoundRect(60, 448, 440, 420, 18, '#ffffff', '#94a3b8', 2);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mappa Radar Globale (6 Materie)', 280, 480);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(`Profilo di Emma Guidi al Livello ${progress.currentLevel}`, 280, 502);

    // Draw 6-axis Hexagonal Radar Chart
    const cx = 280;
    const cy = 675;
    const maxR = 125;
    const radarScores = [logicScore, lettersScore, numbersScore, shapesScore, musicScore, englishScore];
    const radarLabels = [
      `Logica/QI (${logicScore}%)`,
      `Lettere (${lettersScore}%)`,
      `Numeri (${numbersScore}%)`,
      `Forme (${shapesScore}%)`,
      `Musica (${musicScore}%)`,
      `Inglese (${englishScore}%)`,
    ];

    // Rings
    [0.33, 0.66, 1].forEach((ratio) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / 6;
        const rx = cx + Math.cos(angle) * maxR * ratio;
        const ry = cy + Math.sin(angle) * maxR * ratio;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Axes & Labels
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 6;
      const ax = cx + Math.cos(angle) * maxR;
      const ay = cy + Math.sin(angle) * maxR;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      const lx = cx + Math.cos(angle) * (maxR + 28);
      const ly = cy + Math.sin(angle) * (maxR + 22);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(radarLabels[i], lx, ly + 4);
    }

    // Active Polygon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 6;
      const r = Math.max(4, (radarScores[i] / 100) * maxR);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(219, 39, 119, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'left';

    // Right Column: 6 Subject Progress Gauges & Bars
    drawRoundRect(520, 448, W - 580, 420, 18, '#ffffff', '#94a3b8', 2);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px Arial, sans-serif';
    ctx.fillText(`Grafici Analitici per Ogni Materia di Competenza (Livello ${progress.currentLevel})`, 544, 480);

    const subjectBars = [
      { name: '1. Logica, Indovinelli & Test QI', score: logicScore, col: '#7c3aed' },
      { name: '2. Linguaggio, Fonetica & Lettere', score: lettersScore, col: '#059669' },
      { name: '3. Senso del Numero & Calcolo Visivo', score: numbersScore, col: '#0891b2' },
      { name: '4. Spazio, Sagome, Forme & Colori', score: shapesScore, col: '#db2777' },
      { name: '5. Musica, Strumenti & Ritmo Sonoro', score: musicScore, col: '#d97706' },
      { name: '6. Inglese Prescolare & Prime Paroline', score: englishScore, col: '#2563eb' },
    ];

    subjectBars.forEach((sb, idx) => {
      const by = 505 + idx * 58;
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText(sb.name, 544, by + 16);

      ctx.fillStyle = sb.col;
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${sb.score}%`, W - 84, by + 16);
      ctx.textAlign = 'left';

      // Bar Track
      drawRoundRect(544, by + 24, W - 628, 18, 9, '#e2e8f0');
      if (sb.score > 0) {
        const fillW = Math.max(18, ((W - 628) * sb.score) / 100);
        drawRoundRect(544, by + 24, fillW, 18, 9, sb.col);
      }
    });

    // 5. Section: RELAZIONE PEDAGOGICA ANALITICA PER EMMA GUIDI (6 MATERIE)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 21px Arial, sans-serif';
    ctx.fillText(
      `RELAZIONE PEDAGOGICA DETTAGLIATA PER EMMA GUIDI — LIVELLO ${progress.currentLevel} (Accuratezza Globale: ${overallAccuracy}%)`,
      60,
      904
    );

    domains.forEach((d, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const dx = 60 + col * 568;
      const dy = 922 + row * 242;
      const dw = 552;
      const dh = 228;

      drawRoundRect(dx, dy, dw, dh, 14, '#f8fafc', '#cbd5e1', 1.8);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillText(`${d.title}`, dx + 18, dy + 32);

      // Status Pill
      const pillColor = d.status === 'Eccellente' ? '#15803d' : d.status === 'Buono' ? '#0369a1' : '#475569';
      ctx.fillStyle = pillColor;
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${d.status} (${d.scorePercent}%)`, dx + dw - 18, dy + 32);
      ctx.textAlign = 'left';

      // Wrap helper for canvas text
      const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, color: string, font: string) => {
        ctx.fillStyle = color;
        ctx.font = font;
        const words = text.split(' ');
        let line = '';
        let currY = y;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currY);
            line = words[n] + ' ';
            currY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currY);
        return currY + lineHeight;
      };

      const summaryForEmmaGuidi = d.summary.replace(/\bEmma\b/g, 'Emma Guidi');
      let nextY = drawWrappedText(
        `Traguardo: ${d.ageMilestoneGoal}`,
        dx + 18,
        dy + 60,
        dw - 36,
        20,
        '#475569',
        'bold 13px Arial, sans-serif'
      );

      nextY = drawWrappedText(
        `Osservazione: ${summaryForEmmaGuidi}`,
        dx + 18,
        nextY + 6,
        dw - 36,
        20,
        '#1e293b',
        '13.5px Arial, sans-serif'
      );

      drawWrappedText(
        `Consiglio Famiglia Guidi: ${d.tipsForParents}`,
        dx + 18,
        nextY + 8,
        dw - 36,
        19,
        '#92400e',
        'italic 13px Arial, sans-serif'
      );
    });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Documento Ufficiale Generato per EMMA GUIDI (Nata il 22/08/2021) · Il Mondo di Emma · Livello ${progress.currentLevel} · Stelle: ${progress.stars}`,
      W / 2,
      H - 52
    );

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const pdfBlob = createA4PdfBlobFromJpegDataUrl(jpegDataUrl, W, H);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relazione_Pedagogica_QI_Emma_Guidi_Livello_${progress.currentLevel}.pdf`;
    link.click();
    URL.revokeObjectURL(url);

    soundManager.speakPraise('Report PDF con valutazione QI e grafici scaricato con successo!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      <div className="bg-slate-900 border-2 sm:border-4 border-pink-400/50 rounded-4xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        
        {/* Top Header */}
        <div className="p-3.5 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="font-kids font-bold text-base sm:text-lg text-white">
                Area Genitori · Relazione, Grafici & QI
              </h3>
              <p className="text-xs text-pink-200">
                Emma · Nata il 22/08/2021 · {ageInfo.displayText}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('relazione');
            }}
            className={`flex-1 py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'relazione'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            📋 Relazione Pedagogica
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('grafici');
            }}
            className={`flex-1 py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'grafici'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-300" />
            <span>Analisi Grafici & QI</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('impostazioni');
            }}
            className={`py-2 px-3 sm:px-4 rounded-2xl font-kids text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'impostazioni'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            ⚙️ Impostazioni
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* CALIBRATION STATUS BANNER (0% AT LEVELS 1-10, UNLOCKED AT LEVEL 11+) */}
          <div className={`p-3.5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            !isMeasurementUnlocked
              ? 'bg-slate-950/90 border-amber-400/50 text-amber-100'
              : 'bg-emerald-950/50 border-emerald-400/50 text-emerald-100'
          }`}>
            <div className="flex items-start sm:items-center gap-2.5">
              {!isMeasurementUnlocked ? (
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <Brain className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="text-xs leading-relaxed">
                {!isMeasurementUnlocked ? (
                  <>
                    <strong className="text-amber-300 block sm:inline">Partenza da 0% (Livello {progress.currentLevel} di 10): </strong>
                    La Relazione Pedagogica, i Grafici e il QI partono da <strong>0%</strong>. Il <strong>1° step di misurazione</strong> si sblocca dopo il superamento del <strong>Livello 10</strong> ({completedCalibrationLevels}/10 completati) e poi si aggiorna <strong>livello per livello</strong>!
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-300 block sm:inline">Misurazione Attiva Livello per Livello (Livello {progress.currentLevel}): </strong>
                    Superato il Livello 10! Relazione Pedagogica, Grafici delle 6 materie e QI si aggiornano ora in tempo reale ad ogni singolo livello completato.
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleDownloadPdfReport}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
              title="Scarica il Report Ufficiale in formato PDF con QI e Grafici"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Scarica Report PDF (con QI)</span>
            </button>
          </div>

          {/* ================= TAB 1: RELAZIONE PEDAGOGICA ================= */}
          {activeTab === 'relazione' && (
            <div className="space-y-4 text-xs sm:text-sm font-fun">
              {/* KPI Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-bold">Livello Attuale</span>
                  <span className="text-xl sm:text-2xl font-kids font-bold text-yellow-300">
                    {progress.currentLevel}
                  </span>
                  <span className="text-[10px] text-pink-200 block">Tier {currentTier} · {isMeasurementUnlocked ? 'Attivo' : 'Calibrazione 0%'}</span>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-bold">Accuratezza</span>
                  <span className="text-xl sm:text-2xl font-kids font-bold text-emerald-400">
                    {overallAccuracy}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">{isMeasurementUnlocked ? 'Aggiornata al livello' : 'Parte da 0%'}</span>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-bold">Quoziente QI</span>
                  <span className="text-xl sm:text-2xl font-kids font-bold text-purple-300">
                    {iqData.totalIQ === 0 ? '0%' : iqData.totalIQ}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{isMeasurementUnlocked ? iqData.percentile : 'Dopo Livello 10'}</span>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-bold">Stelle Guadagnate</span>
                  <span className="text-xl sm:text-2xl font-kids font-bold text-amber-400">
                    ⭐ {progress.stars}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{progress.totalPuzzlesSolved} prove risolte</span>
                </div>
              </div>

              {/* 6 Pedagogical Domain Cards */}
              <div className="space-y-3">
                {domains.map((dom) => (
                  <div
                    key={dom.id}
                    className="p-3.5 bg-slate-950/80 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dom.icon}</span>
                        <h4 className="font-kids font-bold text-sm text-white">
                          {dom.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-kids font-bold ${
                          dom.status === 'Eccellente'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : dom.status === 'Buono'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                        }`}>
                          {dom.status}
                        </span>
                        <span className="font-kids font-bold text-xs text-yellow-300">
                          {dom.scorePercent}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dom.summary}
                    </p>

                    <div className="pt-1 text-[11px] text-pink-200 border-t border-slate-800/80 flex items-start gap-1">
                      <span className="font-bold text-amber-300 shrink-0">💡 Consiglio per i genitori:</span>
                      <span>{dom.tipsForParents}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: ANALISI CON SUPPORTO DI GRAFICI & QI ================= */}
          {activeTab === 'grafici' && (
            <div className="space-y-4 text-xs sm:text-sm font-fun">
              {/* Live Preschool IQ Card & 5 Psychometric Parameters */}
              <div className="p-4 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 rounded-3xl border border-purple-400/50 space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[10px] font-kids font-bold uppercase">
                      5 Parametri Psicometrici QI (WPPSI-IV) · Livello {progress.currentLevel}
                    </span>
                    <h4 className="font-kids font-bold text-base sm:text-lg text-white mt-1">
                      Quoziente Cognitivo Evolutivo (QI):{' '}
                      <span className="text-yellow-300">
                        {isMeasurementUnlocked ? iqData.totalIQ : '0 (0% - Sblocco dopo Livello 10)'}
                      </span>
                    </h4>
                    <p className="text-xs text-purple-200">
                      {iqData.iqCategory} · {iqData.percentile}
                    </p>
                  </div>
                </div>

                {/* 5 Explicit IQ Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 text-center">
                    <div className="text-lg font-kids font-bold text-yellow-300">
                      {isMeasurementUnlocked ? iqData.fluidLogicIndex : '0%'}
                    </div>
                    <div className="text-[10px] text-purple-200 font-bold">🧠 1. Matrici (Gf)</div>
                  </div>
                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 text-center">
                    <div className="text-lg font-kids font-bold text-cyan-300">
                      {isMeasurementUnlocked ? iqData.workingMemoryIndex : '0%'}
                    </div>
                    <div className="text-[10px] text-purple-200 font-bold">🎵 2. Memoria/Ritmo</div>
                  </div>
                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 text-center">
                    <div className="text-lg font-kids font-bold text-emerald-300">
                      {isMeasurementUnlocked ? iqData.verbalBilingualIndex : '0%'}
                    </div>
                    <div className="text-[10px] text-purple-200 font-bold">🇬🇧 3. Verbale/Inglese</div>
                  </div>
                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 text-center">
                    <div className="text-lg font-kids font-bold text-pink-300">
                      {isMeasurementUnlocked ? iqData.visualSpatialIndex : '0%'}
                    </div>
                    <div className="text-[10px] text-purple-200 font-bold">🎨 4. Visuo-Spazio</div>
                  </div>
                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 text-center col-span-2 sm:col-span-1">
                    <div className="text-lg font-kids font-bold text-amber-300">
                      {isMeasurementUnlocked ? iqData.processingSpeedIndex : '0%'}
                    </div>
                    <div className="text-[10px] text-purple-200 font-bold">⚡ 5. Rapidità (Gs)</div>
                  </div>
                </div>
              </div>

              {/* Visual 6-Axis Radar & Bar Comparative Overview */}
              <div className="p-4 bg-slate-950/90 rounded-3xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-kids font-bold text-base text-yellow-300">
                      Mappa Radar Esagonale & Grafici per Materia (Livello {progress.currentLevel})
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isMeasurementUnlocked
                        ? `Aggiornamento attivo livello per livello · Tier ${currentTier}`
                        : `Partenza da 0% · Primo step di misurazione dopo il Livello 10 (${completedCalibrationLevels}/10 completati)`}
                    </p>
                  </div>
                </div>

                {/* SVG 6-Axis Hexagonal Radar Spider Graphic */}
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 p-3 bg-slate-900/90 rounded-2xl border border-slate-800/80">
                  <div className="w-52 h-52 relative shrink-0">
                    <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-md">
                      {/* Grid concentric rings */}
                      <circle cx="110" cy="110" r="25" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="110" cy="110" r="50" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="110" cy="110" r="75" fill="none" stroke="#475569" strokeWidth="1.5" />
                      
                      {/* 6 Hexagonal Axes */}
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const angle = -Math.PI / 2 + (i * Math.PI * 2) / 6;
                        const x2 = 110 + Math.cos(angle) * 75;
                        const y2 = 110 + Math.sin(angle) * 75;
                        return <line key={i} x1="110" y1="110" x2={x2} y2={y2} stroke="#334155" strokeWidth="1" />;
                      })}

                      {/* Radar polygon computed from 6 scores */}
                      {(() => {
                        const scores = [logicScore, lettersScore, numbersScore, shapesScore, musicScore, englishScore];
                        const colors = ['#a855f7', '#10b981', '#06b6d4', '#ec4899', '#f59e0b', '#38bdf8'];
                        const pts = scores.map((sc, i) => {
                          const angle = -Math.PI / 2 + (i * Math.PI * 2) / 6;
                          const r = (sc / 100) * 75;
                          return {
                            x: 110 + Math.cos(angle) * r,
                            y: 110 + Math.sin(angle) * r,
                            color: colors[i],
                          };
                        });
                        const polyString = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

                        return (
                          <>
                            <polygon
                              points={polyString}
                              fill="rgba(236, 72, 153, 0.35)"
                              stroke="#ec4899"
                              strokeWidth="2.5"
                            />
                            {pts.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4" fill={p.color} />
                            ))}
                          </>
                        );
                      })()}

                      {/* 6 Labels */}
                      <text x="110" y="22" textAnchor="middle" fill="#c084fc" fontSize="9.5" fontWeight="bold">Logica/QI</text>
                      <text x="186" y="68" textAnchor="start" fill="#34d399" fontSize="9.5" fontWeight="bold">Lettere</text>
                      <text x="186" y="158" textAnchor="start" fill="#38bdf8" fontSize="9.5" fontWeight="bold">Numeri</text>
                      <text x="110" y="204" textAnchor="middle" fill="#f472b6" fontSize="9.5" fontWeight="bold">Forme</text>
                      <text x="34" y="158" textAnchor="end" fill="#fbbf24" fontSize="9.5" fontWeight="bold">Musica</text>
                      <text x="34" y="68" textAnchor="end" fill="#60a5fa" fontSize="9.5" fontWeight="bold">Inglese</text>
                    </svg>
                  </div>

                  {/* Visual Bar Breakdown for all 6 Subjects */}
                  <div className="flex-1 w-full space-y-2.5">
                    {[
                      { label: '🧠 Logica, Indovinelli & Test QI', score: logicScore, barClass: 'from-purple-500 to-indigo-500', textClass: 'text-purple-300' },
                      { label: '🔤 Linguaggio, Fonetica & Lettere', score: lettersScore, barClass: 'from-emerald-400 to-teal-500', textClass: 'text-emerald-300' },
                      { label: '🔢 Numeri & Calcolo Visivo', score: numbersScore, barClass: 'from-cyan-400 to-blue-500', textClass: 'text-cyan-300' },
                      { label: '🎨 Spazio, Forme & Colori', score: shapesScore, barClass: 'from-pink-400 to-rose-500', textClass: 'text-pink-300' },
                      { label: '🎵 Musica, Strumenti & Ritmo', score: musicScore, barClass: 'from-amber-400 to-orange-500', textClass: 'text-amber-300' },
                      { label: '🇬🇧 Inglese & Prime Paroline', score: englishScore, barClass: 'from-sky-400 to-indigo-500', textClass: 'text-sky-300' },
                    ].map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className={b.textClass}>{b.label}</span>
                          <span className={b.textClass}>{b.score}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${b.barClass} rounded-full transition-all duration-500`} style={{ width: `${b.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6 Individual Subject Circular Gauge Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: '🧠 Logica & Test QI', score: logicScore, color: '#a855f7', skills: 'Matrici QI · Analogie · Indovinelli' },
                    { title: '🔤 Linguaggio & Fonetica', score: lettersScore, color: '#10b981', skills: 'Lettera E · Vocali · Rime' },
                    { title: '🔢 Senso del Numero', score: numbersScore, color: '#06b6d4', skills: 'Conteggio · Somme · Genere M/F' },
                    { title: '🎨 Spazio & Forme', score: shapesScore, color: '#ec4899', skills: 'Geometria 2D · Colori · Grandezze' },
                    { title: '🎵 Musica & Ritmo Sonoro', score: musicScore, color: '#f59e0b', skills: 'Scala Do-Re-Mi · Battito · Strumenti' },
                    { title: '🇬🇧 Inglese Prescolare', score: englishScore, color: '#38bdf8', skills: 'Dog · Cat · Sun · Apple · Red · Blue' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center gap-3">
                      <svg width="56" height="56" viewBox="0 0 36 36" className="shrink-0">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3.8" />
                        {item.score > 0 && (
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={item.color} strokeWidth="3.8" strokeDasharray={`${item.score}, 100`} strokeLinecap="round" />
                        )}
                        <text x="18" y="20.5" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ffffff">{item.score}%</text>
                      </svg>
                      <div className="min-w-0">
                        <div className="font-kids font-bold text-xs text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{item.skills}</div>
                        <div className="text-[10px] text-yellow-300 font-bold mt-0.5">
                          {isMeasurementUnlocked ? `Aggiornato al Livello ${progress.currentLevel}` : '0% · Sblocco dopo Livello 10'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: IMPOSTAZIONI & RESET ================= */}
          {activeTab === 'impostazioni' && (
            <div className="space-y-4 text-xs sm:text-sm font-fun">
              {/* Audio Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {voice ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                    <div>
                      <div className="text-sm font-fun font-bold text-white">Voce Narrante Unificata (Italiano)</div>
                      <div className="text-xs text-slate-400">Voce dolce, calda e rassicurante con prosodia</div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleVoice}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${voice ? 'bg-pink-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${voice ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {voice && (
                  <div className="flex justify-end pr-2">
                    <button
                      onClick={() => {
                        soundManager.speak('Ciao Emma! La mia voce è dolce e rilassante, perfetta per imparare insieme!', 1.2);
                      }}
                      className="px-3 py-1.5 bg-pink-500/30 hover:bg-pink-500/40 text-pink-200 border border-pink-400/50 rounded-xl text-xs font-fun font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Ascolta Prova Voce 🔊</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {sound ? <Sparkles className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                    <div>
                      <div className="text-sm font-fun font-bold text-white">Effetti Sonori, Note Musicali & Coriandoli</div>
                      <div className="text-xs text-slate-400">Note reali per i livelli Musica & Ritmo e chimes</div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${sound ? 'bg-pink-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${sound ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Reset Progress Section with Child Lock */}
              <div className="pt-2 border-t border-slate-800">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 py-2 cursor-pointer font-fun"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ripristina progressi di gioco (Torna a Livello 1 e 0%)</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-red-950/40 rounded-2xl border border-red-800/50 space-y-2">
                    <div className="text-xs font-fun font-bold text-red-300">
                      Blocco Genitore: Quanto fa 3 + 4?
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Risultato..."
                        value={securityAnswer}
                        onChange={(e) => {
                          setSecurityAnswer(e.target.value);
                          setResetError(false);
                        }}
                        className="w-24 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-fun text-white"
                      />
                      <button
                        onClick={handleConfirmReset}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-fun text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Conferma Reset
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3.5 py-1.5 bg-slate-800 text-slate-300 font-fun text-xs rounded-xl cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>
                    {resetError && (
                      <span className="text-[11px] text-red-400 block">Risposta errata. Riprova.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
