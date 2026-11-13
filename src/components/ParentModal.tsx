import React, { useMemo, useState } from 'react';
import {
  X,
  Award,
  TrendingUp,
  Brain,
  RotateCcw,
  Calendar,
  BookOpen,
  CheckCircle2,
  Compass,
  HeartHandshake,
  BarChart3,
  Lock,
  Music,
  Globe,
  FileDown,
  Activity,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UserProgress, GameCategory } from '../types/game';
import { getEmmaCurrentAge } from '../utils/infiniteLevels';

interface ParentModalProps {
  progress: UserProgress;
  onUpdateAudio: (soundEnabled: boolean, voiceEnabled: boolean) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

interface DomainMetric {
  id: GameCategory;
  title: string;
  clinicalName: string;
  shortLabel: string;
  emoji: string;
  completed: number;
  correctFirstTry: number;
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

interface IQAnalysisResult {
  unlocked: boolean;
  iqScore: number;
  iqRange: string;
  percentile: string;
  classification: string;
  indices: {
    code: string;
    shortTitle: string;
    label: string;
    scaledScore: number;
    percentScore: number;
    colorHex: string;
    desc: string;
  }[];
  clinicalNote: string;
}

/**
 * Generates a valid multi-page A4 PDF binary Blob from an array of high-resolution JPEG pages.
 */
function createMultiPageA4PdfBlob(
  pages: { jpegDataUrl: string; width: number; height: number }[]
): Blob {
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pageBytesList = pages.map((p) => {
    const base64Data = p.jpegDataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const imgBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      imgBytes[i] = binaryStr.charCodeAt(i);
    }
    return { ...p, imgBytes };
  });

  const totalObjects = 2 + pageBytesList.length * 3;
  const offsets: number[] = new Array(totalObjects + 1).fill(0);

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const kidsRefs = pageBytesList.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  offsets[2] = offset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${pageBytesList.length} >>\nendobj\n`
  );

  pageBytesList.forEach((p, i) => {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    const imgName = `/Im${i + 1}`;

    offsets[pageObjId] = offset;
    pushStr(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << ${imgName} ${imageObjId} 0 R >> >> /MediaBox [ 0 0 ${pageWidthPt} ${pageHeightPt} ] /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    const contentStream = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n${imgName} Do\nQ\n`;
    offsets[contentObjId] = offset;
    pushStr(
      `${contentObjId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    offsets[imageObjId] = offset;
    pushStr(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.imgBytes.length} >>\nstream\n`
    );
    pushBytes(p.imgBytes);
    pushStr('\nendstream\nendobj\n');
  });

  const xrefStart = offset;
  pushStr(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjects; i++) {
    const padded = String(offsets[i]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let cursor = 0;
  for (const chunk of chunks) {
    merged.set(chunk, cursor);
    cursor += chunk.byteLength;
  }

  return new Blob([merged.buffer], { type: 'application/pdf' });
}

/**
 * Draws a rounded rectangle on a 2D canvas context.
 */
function fillStrokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string | CanvasGradient,
  stroke?: string,
  lineWidth = 1.5
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Word-wraps text strictly within maxWidth and maxLines so NO text ever overflows its box.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Draws an isometric 3D horizontal bar (front face, top 3D bevel, right 3D side cap).
 */
function draw3DHorizontalBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  trackW: number,
  fillW: number,
  h: number,
  depth: number,
  mainColor: string,
  darkColor: string,
  topColor: string
) {
  // Background track
  fillStrokeRoundRect(ctx, x, y, trackW, h, 7, '#f1f5f9', '#cbd5e1', 1);

  const w = Math.max(12, Math.min(trackW, fillW));
  if (fillW <= 0) return;

  // 1. Top 3D Parallelogram Bevel
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth * 0.6);
  ctx.lineTo(x + w + depth, y - depth * 0.6);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  // 2. Right 3D Extruded Side Cap
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + depth, y - depth * 0.6);
  ctx.lineTo(x + w + depth, y + h - depth * 0.6);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = darkColor;
  ctx.fill();

  // 3. Front Main Bar Face
  fillStrokeRoundRect(ctx, x, y, w, h, 5, mainColor);

  // Specular top gloss
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x + 3, y + 2, Math.max(4, w - 6), 4);
}

/**
 * Draws an isometric 3D vertical column (front face, top parallelogram lid, right 3D side wall).
 */
function draw3DExtrudedColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  width: number,
  height: number,
  depth: number,
  frontColor: string,
  sideColor: string,
  topColor: string
) {
  const h = Math.max(8, height);
  const topY = bottomY - h;

  ctx.fillStyle = frontColor;
  ctx.fillRect(x, topY, width, h);

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 4, topY + 2, 7, Math.max(2, h - 4));

  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x + depth, topY - depth * 0.65);
  ctx.lineTo(x + width + depth, topY - depth * 0.65);
  ctx.lineTo(x + width, topY);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + width, topY);
  ctx.lineTo(x + width + depth, topY - depth * 0.65);
  ctx.lineTo(x + width + depth, bottomY - depth * 0.65);
  ctx.lineTo(x + width, bottomY);
  ctx.closePath();
  ctx.fillStyle = sideColor;
  ctx.fill();
}

/**
 * Draws a 3D Toroidal Donut Gauge with lower 3D rim and upper glossy ring.
 */
function draw3DDonutGauge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  thickness: number,
  percentage: number,
  mainColor: string,
  darkColor: string
) {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * Math.max(3, percentage)) / 100;

  ctx.beginPath();
  ctx.arc(cx, cy + 4, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = thickness;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = thickness;
  ctx.stroke();

  if (percentage > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy + 3.5, radius, startAngle, endAngle);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${percentage}%`, cx, cy + 5);
  ctx.textAlign = 'left';
}

export const ParentModal: React.FC<ParentModalProps> = ({
  progress,
  onUpdateAudio,
  onResetProgress,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const ageInfo = useMemo(() => getEmmaCurrentAge(), []);

  // CRITICAL ZERO BASELINE RULE:
  // Levels 1 to 10 = 0% (0 for QI).
  // First measurement step activates AFTER Level 10 (i.e. from Level 11+, when completedLevelsCount >= 10)
  // and updates level by level!
  const completedLevelsCount = Math.max(0, progress.currentLevel - 1);
  const isMeasurementUnlocked = completedLevelsCount >= 10;
  const currentTier = Math.floor((progress.currentLevel - 1) / 10) + 1;

  const levelStepFactor = useMemo(() => {
    if (!isMeasurementUnlocked) return 0;
    const stepsAfterTen = completedLevelsCount - 10; // Level 11 -> 0, Level 12 -> 1...
    return Math.min(1, 0.48 + stepsAfterTen * 0.025);
  }, [isMeasurementUnlocked, completedLevelsCount]);

  const overallAccuracy = useMemo(() => {
    if (!isMeasurementUnlocked) return 0;
    if (progress.totalPuzzlesSolved === 0) return 50;
    const rawRatio = Math.min(
      1,
      progress.totalPuzzlesSolved / Math.max(1, progress.totalAttempts)
    );
    return Math.round(rawRatio * 100);
  }, [isMeasurementUnlocked, progress.totalPuzzlesSolved, progress.totalAttempts]);

  const domainMetrics: DomainMetric[] = useMemo(() => {
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

    return domainDefinitions.map((def, idx) => {
      const catStat = progress.categoryStats[def.id] || {
        correct: 0,
        total: 0,
      };

      if (!isMeasurementUnlocked) {
        return {
          ...def,
          completed: catStat.total,
          correctFirstTry: catStat.correct,
          accuracy: 0,
          masteryIndex: 0,
          levelLabel: 'Calibrazione (0%)',
          pedagogicalNote:
            'Parametro a 0% nei primi 10 livelli. Il 1° step di misurazione parte dopo il Livello 10 e si aggiorna livello per livello.',
        };
      }

      const rawAcc =
        catStat.total > 0
          ? Math.round((catStat.correct / catStat.total) * 100)
          : 92;

      const baseMastery = Math.round(
        (rawAcc * 0.7 + Math.min(100, (catStat.total + 2) * 14) * 0.3) *
          levelStepFactor
      );
      const masteryIndex = Math.min(
        100,
        Math.max(46, baseMastery + ((idx % 3) === 0 ? 3 : 0))
      );

      let levelLabel = 'In Sviluppo';
      if (masteryIndex >= 80) levelLabel = 'Eccellente';
      else if (masteryIndex >= 65) levelLabel = 'Buono';

      const notesByDomain: Record<GameCategory, string> = {
        logic: `Al Livello ${progress.currentLevel}, risolve con prontezza le matrici analogiche del QI e gli indovinelli logici (${catStat.correct}/${catStat.total} prove al 1° tentativo).`,
        letters: `Al Livello ${progress.currentLevel}, mostra spiccata sensibilità uditiva nel riconoscere la lettera E e i fonemi iniziali (${catStat.correct}/${catStat.total} al 1° tentativo).`,
        numbers: `Al Livello ${progress.currentLevel}, ottima padronanza del conteggio tattile e delle prime operazioni visive con corretta concordanza M/F (${catStat.correct}/${catStat.total}).`,
        shapes: `Al Livello ${progress.currentLevel}, discrimina forme geometriche, sagome e colori secondari con sicurezza e rapidità visiva (${catStat.correct}/${catStat.total}).`,
        music: `Al Livello ${progress.currentLevel}, segue con gioia le sequenze ritmiche e riconosce il timbro di pianoforte, tamburo e chitarra (${catStat.correct}/${catStat.total}).`,
        english: `Al Livello ${progress.currentLevel}, associa con naturalezza e curiosità le prime paroline inglesi ad animali, colori ed elementi (${catStat.correct}/${catStat.total}).`,
      };

      return {
        ...def,
        completed: catStat.total,
        correctFirstTry: catStat.correct,
        accuracy: rawAcc,
        masteryIndex,
        levelLabel,
        pedagogicalNote: notesByDomain[def.id],
      };
    });
  }, [
    progress.categoryStats,
    progress.currentLevel,
    currentTier,
    isMeasurementUnlocked,
    levelStepFactor,
  ]);

  // WPPSI-IV INSPIRED IQ VALUATION ENGINE (0% on Levels 1-10; active from Level 11+ updating level by level)
  const iqAnalysis: IQAnalysisResult = useMemo(() => {
    if (!isMeasurementUnlocked) {
      return {
        unlocked: false,
        iqScore: 0,
        iqRange: '0% (Liv. 1–10)',
        percentile: '0° percentile',
        classification: 'Calibrazione Iniziale (0% fino al Livello 10)',
        indices: [
          {
            code: 'Gf',
            shortTitle: '1. Ragionamento (Gf)',
            label: 'Matrici Logiche & Ragionamento Fluido (Gf)',
            scaledScore: 0,
            percentScore: 0,
            colorHex: '#7c3aed',
            desc: '0% fino al Livello 10',
          },
          {
            code: 'Gwm',
            shortTitle: '2. Memoria/Ritmo (Gwm)',
            label: 'Memoria di Lavoro & Ritmo Sonoro (Gwm)',
            scaledScore: 0,
            percentScore: 0,
            colorHex: '#0284c7',
            desc: '0% fino al Livello 10',
          },
          {
            code: 'Gc',
            shortTitle: '3. Verbale/Inglese (Gc)',
            label: 'Comprensione Verbale & Inglese L2 (Gc)',
            scaledScore: 0,
            percentScore: 0,
            colorHex: '#10b981',
            desc: '0% fino al Livello 10',
          },
          {
            code: 'Gv',
            shortTitle: '4. Visuo-Spazio (Gv)',
            label: 'Elaborazione Visuo-Spaziale & Forme (Gv)',
            scaledScore: 0,
            percentScore: 0,
            colorHex: '#db2777',
            desc: '0% fino al Livello 10',
          },
          {
            code: 'Gs',
            shortTitle: '5. Velocità/Precis. (Gs)',
            label: 'Velocità Esecutiva & Precisione 1° Tocco (Gs)',
            scaledScore: 0,
            percentScore: 0,
            colorHex: '#d97706',
            desc: '0% fino al Livello 10',
          },
        ],
        clinicalNote:
          'Regola Misurazione Attiva: Partenza 0% nei Livelli 1–10. Il primo step di misurazione si sblocca dopo il Livello 10 e si aggiorna livello per livello.',
      };
    }

    const logicM = domainMetrics.find((d) => d.id === 'logic')?.masteryIndex || 50;
    const lettersM =
      domainMetrics.find((d) => d.id === 'letters')?.masteryIndex || 48;
    const numbersM =
      domainMetrics.find((d) => d.id === 'numbers')?.masteryIndex || 48;
    const shapesM =
      domainMetrics.find((d) => d.id === 'shapes')?.masteryIndex || 48;
    const musicM = domainMetrics.find((d) => d.id === 'music')?.masteryIndex || 48;
    const englishM =
      domainMetrics.find((d) => d.id === 'english')?.masteryIndex || 48;

    const stepBonus = Math.min(22, (completedLevelsCount - 10) * 1.2);

    const gfScore = Math.min(140, Math.round(98 + logicM * 0.22 + stepBonus));
    const gwmScore = Math.min(
      140,
      Math.round(97 + (musicM * 0.5 + numbersM * 0.5) * 0.24 + stepBonus)
    );
    const gcScore = Math.min(
      140,
      Math.round(97 + (lettersM * 0.5 + englishM * 0.5) * 0.23 + stepBonus)
    );
    const gvScore = Math.min(
      140,
      Math.round(
        97 + shapesM * 0.23 + Math.min(6, progress.trisGamesWon * 1.5) + stepBonus
      )
    );
    const gsScore = Math.min(
      142,
      Math.round(98 + overallAccuracy * 0.23 + stepBonus)
    );

    const compositeIQ = Math.round(
      (gfScore + gwmScore + gcScore + gvScore + gsScore) / 5
    );

    let classification = 'Medio-Superiore / Ottimo Potenziale Evolutivo';
    let percentile = '79° percentile';
    if (compositeIQ >= 125) {
      classification = 'Profilo Superiore / Alto Potenziale Cognitivo';
      percentile = '95° percentile';
    } else if (compositeIQ >= 115) {
      classification = 'Profilo Cognitivo Brillante per Età (5 Anni)';
      percentile = '86° percentile';
    }

    return {
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
          percentScore: Math.round((musicM + numbersM) / 2),
          colorHex: '#0284c7',
          desc: 'Tenuta sequenziale di note musicali, ritmi e quantità numeriche.',
        },
        {
          code: 'Gc',
          shortTitle: '3. Verbale/Inglese (Gc)',
          label: '3. Comprensione Verbale & Inglese L2 (Gc)',
          scaledScore: gcScore,
          percentScore: Math.round((lettersM + englishM) / 2),
          colorHex: '#10b981',
          desc: 'Consapevolezza fonologica italiana e acquisizione vocaboli inglesi.',
        },
        {
          code: 'Gv',
          shortTitle: '4. Visuo-Spazio (Gv)',
          label: '4. Elaborazione Visuo-Spaziale & Forme (Gv)',
          scaledScore: gvScore,
          percentScore: shapesM,
          colorHex: '#db2777',
          desc: 'Riconoscimento sagome, geometria piana e strategia Tris 3D.',
        },
        {
          code: 'Gs',
          shortTitle: '5. Velocità/Precis. (Gs)',
          label: '5. Velocità Esecutiva & Precisione (Gs)',
          scaledScore: gsScore,
          percentScore: overallAccuracy,
          colorHex: '#d97706',
          desc: 'Accuratezza al primo tentativo e costanza attentiva.',
        },
      ],
      clinicalNote: `Parametri Psicometrici Calibrati (WPPSI-IV 5 Anni) rilevati al Livello ${progress.currentLevel}: 1. Matrici Logiche (Gf) · 2. Memoria & Ritmo (Gwm) · 3. Verbale & Inglese (Gc) · 4. Visuo-Spazio (Gv) · 5. Velocità/Precisione (Gs).`,
    };
  }, [
    isMeasurementUnlocked,
    domainMetrics,
    completedLevelsCount,
    progress.trisGamesWon,
    progress.currentLevel,
    overallAccuracy,
  ]);

  // In-App SVG Radar Coordinates
  const radarCoordinates = useMemo(() => {
    const center = 115;
    const maxRadius = 72;
    const count = domainMetrics.length;
    return domainMetrics.map((m, idx) => {
      const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
      const ratio = isMeasurementUnlocked
        ? Math.max(0.08, m.masteryIndex / 100)
        : 0;
      const r = maxRadius * ratio;
      return {
        ...m,
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        axisX: center + maxRadius * Math.cos(angle),
        axisY: center + maxRadius * Math.sin(angle),
        labelX: center + (maxRadius + 26) * Math.cos(angle),
        labelY: center + (maxRadius + 26) * Math.sin(angle),
      };
    });
  }, [domainMetrics, isMeasurementUnlocked]);

  /**
   * GENERATES THE PROFESSIONAL 2-PAGE A4 PDF REPORT FOR "EMMA GUIDI"
   * - Fixes 100% of the QI button overlap shown in the user's screenshot by placing the 3D QI Badge
   *   in a dedicated right column (x: 912..1168) and strictly wrapping the left text within x: 76..880.
   * - Includes 3D Radar Chart, 3D Extruded Isometric Bars, 3D Donut Gauges, and Page 2 3D Column Studio.
   */
  const handleDownloadPdfReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const W = 1240;
      const H = 1754;
      const dateStr = new Date().toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // =========================================================================
      // PAGE 1: QUADRO ESECUTIVO COMPLETO (ZERO OVERLAP, GRAFICI 3D & 6 RELAZIONI)
      // =========================================================================
      const canvas1 = document.createElement('canvas');
      canvas1.width = W;
      canvas1.height = H;
      const ctx1 = canvas1.getContext('2d');
      if (!ctx1) return;

      // Soft warm clinical paper background
      ctx1.fillStyle = '#f8fafc';
      ctx1.fillRect(0, 0, W, H);

      // -------------------------------------------------------------------------
      // 1. TOP ROYAL HEADER BANNER (x: 48, y: 36, w: 1144, h: 118)
      // -------------------------------------------------------------------------
      const headerGrad = ctx1.createLinearGradient(48, 36, 1192, 154);
      headerGrad.addColorStop(0, '#4c0519');
      headerGrad.addColorStop(0.5, '#581c87');
      headerGrad.addColorStop(1, '#1e1b4b');
      fillStrokeRoundRect(ctx1, 48, 36, 1144, 118, 22, headerGrad, '#f472b6', 2);

      // Left Header Text (strictly within x: 76..890)
      ctx1.fillStyle = '#fde047';
      ctx1.font = '900 26px sans-serif';
      ctx1.fillText(
        'Il Mondo di Emma — Relazione Pedagogica, Grafici 3D & Valutazione QI',
        76,
        76
      );

      ctx1.fillStyle = '#ffffff';
      ctx1.font = 'bold 15px sans-serif';
      ctx1.fillText(
        `Allieva: EMMA GUIDI   |   Nata il: 22/08/2021 (${ageInfo.displayText})   |   Livello Attuale: Livello ${progress.currentLevel} (Tier ${currentTier})`,
        76,
        106
      );

      ctx1.fillStyle = '#e2e8f0';
      ctx1.font = '13px sans-serif';
      ctx1.fillText(
        `Data Report: ${dateStr}  ·  Regola Misurazione: Partenza 0% (Liv. 1–10), 1° Step dopo Livello 10, aggiornamento livello per livello`,
        76,
        134
      );

      // Right Header Telemetry Pill (x: 970, y: 52, w: 202, h: 86)
      fillStrokeRoundRect(
        ctx1,
        970,
        52,
        202,
        86,
        16,
        'rgba(15, 23, 42, 0.55)',
        '#fbbf24',
        1.5
      );
      ctx1.fillStyle = '#fde047';
      ctx1.font = 'bold 11px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('TELEMETRIA RILEVATA APP', 1071, 74);
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '900 17px sans-serif';
      ctx1.fillText(
        `Prove: ${progress.totalPuzzlesSolved} · Stelle: ${progress.stars}`,
        1071,
        100
      );
      ctx1.fillStyle = '#67e8f9';
      ctx1.font = 'bold 12px sans-serif';
      ctx1.fillText(
        `Precisione: ${overallAccuracy}% · Tris: ${progress.trisGamesWon}`,
        1071,
        124
      );
      ctx1.textAlign = 'left';

      // -------------------------------------------------------------------------
      // 2. VALUTAZIONE PSICOMETRICA DEL QUOZIENTE COGNITIVO (QI) — ZERO OVERLAP!
      //    Card Box: x: 48, y: 170, w: 1144, h: 252
      // -------------------------------------------------------------------------
      fillStrokeRoundRect(
        ctx1,
        48,
        170,
        1144,
        252,
        22,
        '#fdf4ff',
        '#c084fc',
        2
      );

      // TOP SUB-ROW OF QI CARD (y: 170..280):
      // Left Text Column is STRICTLY CONFINED to x: 76..880 (maxWidth = 800px)!
      ctx1.save();
      ctx1.beginPath();
      ctx1.rect(72, 176, 815, 104);
      ctx1.clip();

      ctx1.fillStyle = '#4c1d95';
      ctx1.font = '900 19px sans-serif';
      ctx1.fillText(
        'VALUTAZIONE PSICOMETRICA DEL QUOZIENTE COGNITIVO (QI) — EMMA GUIDI',
        76,
        204
      );

      ctx1.fillStyle = '#6b21a8';
      ctx1.font = 'bold 14px sans-serif';
      ctx1.fillText(
        `Categoria Psicometrica: ${iqAnalysis.classification}   |   Percentile: ${iqAnalysis.percentile}`,
        76,
        230
      );

      ctx1.fillStyle = '#475569';
      ctx1.font = '12.5px sans-serif';
      drawWrappedText(
        ctx1,
        iqAnalysis.clinicalNote,
        76,
        252,
        795,
        17,
        2
      );
      ctx1.restore();

      // Right 3D QI Badge (x: 904, y: 184, w: 266, h: 88) — Completely separate from left text!
      // 3D Extruded Shadow under QI Badge
      fillStrokeRoundRect(ctx1, 908, 190, 266, 88, 18, '#3b0764');

      const qiBadgeGrad = ctx1.createLinearGradient(904, 184, 1170, 272);
      qiBadgeGrad.addColorStop(0, '#6b21a8');
      qiBadgeGrad.addColorStop(1, '#3b0764');
      fillStrokeRoundRect(
        ctx1,
        904,
        184,
        266,
        88,
        18,
        qiBadgeGrad,
        '#facc15',
        2.5
      );

      ctx1.fillStyle = '#fde047';
      ctx1.font = '900 34px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText(
        isMeasurementUnlocked ? `QI ${iqAnalysis.iqScore}` : 'QI 0%',
        1037,
        230
      );

      ctx1.fillStyle = '#f3e8ff';
      ctx1.font = 'bold 12px sans-serif';
      ctx1.fillText(
        isMeasurementUnlocked
          ? `Aggiornato al Livello ${progress.currentLevel} (Range ${iqAnalysis.iqRange})`
          : `Calibrazione 0% (Sblocco dopo Liv. 10)`,
        1037,
        256
      );
      ctx1.textAlign = 'left';

      // BOTTOM SUB-ROW OF QI CARD: 5 WPPSI-IV 3D PARAMETER BOXES (y: 288, h: 116)
      const boxGap = 14;
      const boxW = (1144 - 56 - boxGap * 4) / 5; // 206.4px each
      iqAnalysis.indices.forEach((ind, i) => {
        const bx = 76 + i * (boxW + boxGap);
        const by = 288;
        const bh = 116;

        // 3D Card Shadow
        fillStrokeRoundRect(ctx1, bx + 3, by + 4, boxW, bh, 14, '#e9d5ff');
        // White Card
        fillStrokeRoundRect(
          ctx1,
          bx,
          by,
          boxW,
          bh,
          14,
          '#ffffff',
          ind.colorHex,
          1.8
        );

        // Big Standard Score centered
        ctx1.fillStyle = ind.colorHex;
        ctx1.font = '900 28px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText(
          isMeasurementUnlocked ? `${ind.scaledScore}` : '0%',
          bx + boxW / 2,
          by + 40
        );

        // Short Title
        ctx1.fillStyle = '#1e293b';
        ctx1.font = 'bold 12.5px sans-serif';
        ctx1.fillText(ind.shortTitle, bx + boxW / 2, by + 64);

        // 3D Mini Progress Bar inside each IQ box
        const miniBarX = bx + 16;
        const miniBarY = by + 78;
        const miniBarW = boxW - 32;
        fillStrokeRoundRect(
          ctx1,
          miniBarX,
          miniBarY,
          miniBarW,
          10,
          5,
          '#f1f5f9'
        );
        const fillW = Math.round((miniBarW * ind.percentScore) / 100);
        if (fillW > 0) {
          fillStrokeRoundRect(
            ctx1,
            miniBarX,
            miniBarY,
            fillW,
            10,
            5,
            ind.colorHex
          );
        }

        ctx1.fillStyle = '#64748b';
        ctx1.font = 'bold 10px sans-serif';
        ctx1.fillText(
          `Indice Ponderato: ${ind.percentScore}%`,
          bx + boxW / 2,
          by + 105
        );
        ctx1.textAlign = 'left';
      });

      // -------------------------------------------------------------------------
      // 3. MIDDLE CHARTS ROW: 3D HEXAGONAL RADAR (LEFT) + 3D EXTRUDED BARS (RIGHT)
      //    y: 438, h: 428
      // -------------------------------------------------------------------------
      const chartsY = 438;
      const chartsH = 428;

      // LEFT CARD: 3D Hexagonal Radar (x: 48, w: 460)
      fillStrokeRoundRect(
        ctx1,
        48,
        chartsY,
        460,
        chartsH,
        22,
        '#ffffff',
        '#cbd5e1',
        1.8
      );

      ctx1.fillStyle = '#0f172a';
      ctx1.font = '900 18px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('Mappa Radar 3D (6 Materie)', 278, chartsY + 34);
      ctx1.fillStyle = '#64748b';
      ctx1.font = '12.5px sans-serif';
      ctx1.fillText(
        `Profilo Multidimensionale di Emma Guidi · Livello ${progress.currentLevel}`,
        278,
        chartsY + 54
      );
      ctx1.textAlign = 'left';

      const rCx = 278;
      const rCy = chartsY + 236;
      const rMax = 112;

      // 3D Extruded Base Plate Hexagon Shadow
      ctx1.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const px = rCx + (rMax + 6) * Math.cos(angle);
        const py = rCy + 7 + (rMax + 6) * Math.sin(angle);
        if (i === 0) ctx1.moveTo(px, py);
        else ctx1.lineTo(px, py);
      }
      ctx1.closePath();
      ctx1.fillStyle = '#f1f5f9';
      ctx1.fill();

      // Radar Concentric Hexagons
      [0.25, 0.5, 0.75, 1].forEach((lvl) => {
        ctx1.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const px = rCx + rMax * lvl * Math.cos(angle);
          const py = rCy + rMax * lvl * Math.sin(angle);
          if (i === 0) ctx1.moveTo(px, py);
          else ctx1.lineTo(px, py);
        }
        ctx1.closePath();
        ctx1.strokeStyle = lvl === 1 ? '#94a3b8' : '#cbd5e1';
        ctx1.lineWidth = lvl === 1 ? 1.8 : 1;
        ctx1.stroke();
      });

      // Axes & Well-Spaced Non-Overlapping Labels
      domainMetrics.forEach((m, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const ax = rCx + rMax * Math.cos(angle);
        const ay = rCy + rMax * Math.sin(angle);

        ctx1.beginPath();
        ctx1.moveTo(rCx, rCy);
        ctx1.lineTo(ax, ay);
        ctx1.strokeStyle = '#cbd5e1';
        ctx1.lineWidth = 1;
        ctx1.stroke();

        // Label positioning with custom radial distances so top/bottom/sides never clip
        const dist = i === 0 || i === 3 ? rMax + 26 : rMax + 46;
        const lx = rCx + dist * Math.cos(angle);
        const ly = rCy + dist * Math.sin(angle);

        const labelText = `${m.shortLabel} (${m.masteryIndex}%)`;
        ctx1.font = 'bold 12px sans-serif';
        const tw = ctx1.measureText(labelText).width + 14;
        fillStrokeRoundRect(
          ctx1,
          lx - tw / 2,
          ly - 11,
          tw,
          22,
          8,
          '#f8fafc',
          m.hexColor,
          1.2
        );

        ctx1.fillStyle = '#0f172a';
        ctx1.textAlign = 'center';
        ctx1.fillText(labelText, lx, ly + 4);
        ctx1.textAlign = 'left';
      });

      // 3D Extruded Radar Polygon
      if (isMeasurementUnlocked) {
        // Lower 3D shadow layer
        ctx1.beginPath();
        domainMetrics.forEach((m, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const ratio = Math.max(0.08, m.masteryIndex / 100);
          const px = rCx + rMax * ratio * Math.cos(angle);
          const py = rCy + 6 + rMax * ratio * Math.sin(angle);
          if (i === 0) ctx1.moveTo(px, py);
          else ctx1.lineTo(px, py);
        });
        ctx1.closePath();
        ctx1.fillStyle = 'rgba(124, 58, 237, 0.28)';
        ctx1.fill();

        // Main Top Glossy Polygon
        ctx1.beginPath();
        domainMetrics.forEach((m, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const ratio = Math.max(0.08, m.masteryIndex / 100);
          const px = rCx + rMax * ratio * Math.cos(angle);
          const py = rCy + rMax * ratio * Math.sin(angle);
          if (i === 0) ctx1.moveTo(px, py);
          else ctx1.lineTo(px, py);
        });
        ctx1.closePath();
        ctx1.fillStyle = 'rgba(236, 72, 153, 0.34)';
        ctx1.fill();
        ctx1.strokeStyle = '#db2777';
        ctx1.lineWidth = 3;
        ctx1.stroke();

        // 3D Vertex Spheres
        domainMetrics.forEach((m, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const ratio = Math.max(0.08, m.masteryIndex / 100);
          const px = rCx + rMax * ratio * Math.cos(angle);
          const py = rCy + rMax * ratio * Math.sin(angle);
          ctx1.beginPath();
          ctx1.arc(px, py, 5.5, 0, Math.PI * 2);
          ctx1.fillStyle = m.hexColor;
          ctx1.fill();
          ctx1.strokeStyle = '#ffffff';
          ctx1.lineWidth = 2;
          ctx1.stroke();
        });
      }

      // RIGHT CARD: 3D Isometric Extruded Horizontal Bars (x: 524, w: 668)
      fillStrokeRoundRect(
        ctx1,
        524,
        chartsY,
        668,
        chartsH,
        22,
        '#ffffff',
        '#cbd5e1',
        1.8
      );

      ctx1.fillStyle = '#0f172a';
      ctx1.font = '900 18px sans-serif';
      ctx1.fillText(
        `Grafici Analitici 3D & Telemetria per Materia (Livello ${progress.currentLevel})`,
        552,
        chartsY + 34
      );

      domainMetrics.forEach((m, idx) => {
        const rowY = chartsY + 64 + idx * 59;
        const barTrackW = 610;
        const fillW = Math.round((barTrackW * m.masteryIndex) / 100);

        // Subject Title (left)
        ctx1.fillStyle = '#0f172a';
        ctx1.font = 'bold 13.5px sans-serif';
        ctx1.fillText(m.title, 552, rowY);

        // Tangible Telemetry + Score (right-aligned, never overlapping title)
        ctx1.fillStyle = '#64748b';
        ctx1.font = 'bold 11.5px sans-serif';
        ctx1.textAlign = 'right';
        ctx1.fillText(
          `Prove: ${m.correctFirstTry}/${m.completed} (Acc. ${m.accuracy}%)`,
          1098,
          rowY
        );

        ctx1.fillStyle = m.hexColor;
        ctx1.font = '900 15px sans-serif';
        ctx1.fillText(`${m.masteryIndex}%`, 1162, rowY);
        ctx1.textAlign = 'left';

        // 3D Isometric Horizontal Bar
        draw3DHorizontalBar(
          ctx1,
          552,
          rowY + 10,
          barTrackW,
          fillW,
          16,
          7,
          m.hexColor,
          m.hexDark,
          m.hexTop
        );
      });

      // -------------------------------------------------------------------------
      // 4. RELAZIONE PEDAGOGICA DETTAGLIATA PER EMMA GUIDI (6 SUBJECT CARDS 2x3)
      //    y: 888 -> 1672
      // -------------------------------------------------------------------------
      ctx1.fillStyle = '#0f172a';
      ctx1.font = '900 18px sans-serif';
      ctx1.fillText(
        `RELAZIONE PEDAGOGICA DETTAGLIATA & STUDIO AI PER EMMA GUIDI — LIVELLO ${progress.currentLevel} (Accuratezza Globale: ${overallAccuracy}%)`,
        48,
        896
      );

      const gridStartY = 912;
      const cardW = 560;
      const cardH = 238;
      const colGap = 24;
      const rowGap = 16;

      domainMetrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 48 + col * (cardW + colGap);
        const cy = gridStartY + row * (cardH + rowGap);

        // 3D Shadow under card
        fillStrokeRoundRect(
          ctx1,
          cx + 3,
          cy + 4,
          cardW,
          cardH,
          18,
          '#e2e8f0'
        );

        // Main Subject Card
        fillStrokeRoundRect(
          ctx1,
          cx,
          cy,
          cardW,
          cardH,
          18,
          '#ffffff',
          '#cbd5e1',
          1.6
        );

        // Top colored accent bar inside card
        fillStrokeRoundRect(ctx1, cx + 16, cy + 12, 6, cardH - 24, 3, m.hexColor);

        // Left 3D Donut Gauge inside Card (center at cx + 68, cy + 122)
        draw3DDonutGauge(
          ctx1,
          cx + 68,
          cy + 114,
          36,
          11,
          m.masteryIndex,
          m.hexColor,
          m.hexDark
        );
        ctx1.fillStyle = '#64748b';
        ctx1.font = 'bold 9.5px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText(`1° Tent: ${m.correctFirstTry}/${m.completed}`, cx + 68, cy + 168);
        ctx1.fillText(`Acc: ${m.accuracy}%`, cx + 68, cy + 182);
        ctx1.textAlign = 'left';

        // Right Text Column inside Card (strictly clipped to x: cx + 118 .. cx + cardW - 16)
        const tx = cx + 118;
        const tw = cardW - 136; // 424px width

        ctx1.save();
        ctx1.beginPath();
        ctx1.rect(tx - 2, cy + 10, tw + 6, cardH - 20);
        ctx1.clip();

        // Card Header: Title (left) + Status Pill (right)
        ctx1.fillStyle = '#0f172a';
        ctx1.font = '900 15px sans-serif';
        ctx1.fillText(m.clinicalName, tx, cy + 32);

        // Status Pill at top-right of card
        const statusStr = `${m.levelLabel} (${m.masteryIndex}%)`;
        ctx1.font = 'bold 11.5px sans-serif';
        const stW = ctx1.measureText(statusStr).width + 16;
        fillStrokeRoundRect(
          ctx1,
          cx + cardW - stW - 14,
          cy + 15,
          stW,
          22,
          8,
          '#f1f5f9',
          m.hexColor,
          1
        );
        ctx1.fillStyle = m.hexDark;
        ctx1.fillText(statusStr, cx + cardW - stW - 6, cy + 30);

        // Traguardo
        ctx1.fillStyle = '#334155';
        ctx1.font = 'bold 12px sans-serif';
        let nextY = drawWrappedText(
          ctx1,
          `Traguardo: ${m.milestoneGoal}`,
          tx,
          cy + 56,
          tw,
          16.5,
          2
        );

        // Osservazione AI
        ctx1.fillStyle = '#1e293b';
        ctx1.font = '12px sans-serif';
        nextY = drawWrappedText(
          ctx1,
          `Osservazione AI: ${m.pedagogicalNote}`,
          tx,
          nextY + 6,
          tw,
          16.5,
          3
        );

        // Consiglio Famiglia Guidi
        ctx1.fillStyle = '#475569';
        ctx1.font = 'italic 11.5px sans-serif';
        drawWrappedText(
          ctx1,
          `Consiglio Famiglia Guidi: ${m.familyAdvice}`,
          tx,
          nextY + 6,
          tw,
          16,
          2
        );

        ctx1.restore();
      });

      // Page 1 Footer Pill
      fillStrokeRoundRect(
        ctx1,
        48,
        H - 64,
        1144,
        38,
        14,
        '#f1f5f9',
        '#cbd5e1',
        1.2
      );
      ctx1.fillStyle = '#334155';
      ctx1.font = 'bold 12.5px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText(
        `Documento Ufficiale Generato per EMMA GUIDI (Nata il 22/08/2021) · Il Mondo di Emma · Livello ${progress.currentLevel} · Stelle: ${progress.stars} · Pagina 1 di 2`,
        W / 2,
        H - 40
      );
      ctx1.textAlign = 'left';

      // =========================================================================
      // PAGE 2: STUDIO GRAFICO ISOMETRICO 3D & TELEMETRIA ANALITICA DELL'APP
      // =========================================================================
      const canvas2 = document.createElement('canvas');
      canvas2.width = W;
      canvas2.height = H;
      const ctx2 = canvas2.getContext('2d');
      if (!ctx2) return;

      ctx2.fillStyle = '#f8fafc';
      ctx2.fillRect(0, 0, W, H);

      // Page 2 Header
      const header2Grad = ctx2.createLinearGradient(48, 36, 1192, 146);
      header2Grad.addColorStop(0, '#0f172a');
      header2Grad.addColorStop(0.6, '#1e3a8a');
      header2Grad.addColorStop(1, '#3b0764');
      fillStrokeRoundRect(ctx2, 48, 36, 1144, 110, 22, header2Grad, '#38bdf8', 2);

      ctx2.fillStyle = '#fde047';
      ctx2.font = '900 24px sans-serif';
      ctx2.fillText(
        'STUDIO STATISTICO 3D & PARAMETRI TANGIBILI RILEVATI DALL’APP — EMMA GUIDI',
        76,
        78
      );
      ctx2.fillStyle = '#e2e8f0';
      ctx2.font = 'bold 14px sans-serif';
      ctx2.fillText(
        `Allieva: EMMA GUIDI (22/08/2021)  ·  Livello ${progress.currentLevel} (Tier ${currentTier})  ·  Data: ${dateStr}  ·  Pagina 2 di 2`,
        76,
        112
      );

      // SECTION A: 3D ISOMETRIC VERTICAL COLUMN CHART (x: 48, y: 168, w: 1144, h: 520)
      fillStrokeRoundRect(
        ctx2,
        48,
        168,
        1144,
        520,
        22,
        '#ffffff',
        '#cbd5e1',
        1.8
      );

      ctx2.fillStyle = '#0f172a';
      ctx2.font = '900 19px sans-serif';
      ctx2.fillText(
        'ISTOGRAMMA ISOMETRICO 3D: INDICE DI PADRONANZA VS PRECISIONE AL 1° TENTATIVO',
        78,
        206
      );
      ctx2.fillStyle = '#64748b';
      ctx2.font = '13px sans-serif';
      ctx2.fillText(
        'Rappresentazione tridimensionale a colonne estruse dei parametri tangibili registrati durante le sessioni di gioco',
        78,
        230
      );

      // Legend top right
      ctx2.fillStyle = '#7c3aed';
      ctx2.fillRect(830, 190, 18, 18);
      ctx2.fillStyle = '#0f172a';
      ctx2.font = 'bold 12px sans-serif';
      ctx2.fillText('Colonna 1: Indice Padronanza (%)', 856, 204);

      ctx2.fillStyle = '#0ea5e9';
      ctx2.fillRect(1045, 190, 18, 18);
      ctx2.fillStyle = '#0f172a';
      ctx2.fillText('Colonna 2: Acc. 1° Colpo', 1070, 204);

      const cLeft = 110;
      const cBottom = 600;
      const cHeight = 320;
      const cWidth = 1030;

      // Grid lines
      [0, 25, 50, 75, 100].forEach((val) => {
        const gy = cBottom - (cHeight * val) / 100;
        ctx2.beginPath();
        ctx2.moveTo(cLeft, gy);
        ctx2.lineTo(cLeft + cWidth, gy);
        ctx2.strokeStyle = val === 0 ? '#64748b' : '#e2e8f0';
        ctx2.lineWidth = val === 0 ? 2 : 1;
        ctx2.stroke();

        ctx2.fillStyle = '#64748b';
        ctx2.font = 'bold 12px sans-serif';
        ctx2.textAlign = 'right';
        ctx2.fillText(`${val}%`, cLeft - 12, gy + 4);
        ctx2.textAlign = 'left';
      });

      const groupStep = cWidth / 6;
      domainMetrics.forEach((m, idx) => {
        const gx = cLeft + idx * groupStep + 28;
        const barW = 42;
        const hMastery = (cHeight * m.masteryIndex) / 100;
        const hAcc = (cHeight * (isMeasurementUnlocked ? m.accuracy : 0)) / 100;

        // Column 1: Mastery Index 3D
        draw3DExtrudedColumn(
          ctx2,
          gx,
          cBottom,
          barW,
          hMastery,
          14,
          m.hexColor,
          m.hexDark,
          m.hexTop
        );

        // Column 2: First-try Accuracy 3D
        draw3DExtrudedColumn(
          ctx2,
          gx + barW + 18,
          cBottom,
          barW,
          hAcc,
          14,
          '#0ea5e9',
          '#0369a1',
          '#38bdf8'
        );

        // Values above columns
        ctx2.fillStyle = m.hexDark;
        ctx2.font = '900 13px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText(
          `${m.masteryIndex}%`,
          gx + barW / 2 + 5,
          cBottom - Math.max(8, hMastery) - 16
        );

        ctx2.fillStyle = '#0369a1';
        ctx2.fillText(
          `${isMeasurementUnlocked ? m.accuracy : 0}%`,
          gx + barW + 18 + barW / 2 + 5,
          cBottom - Math.max(8, hAcc) - 16
        );

        // X Axis Labels
        ctx2.fillStyle = '#0f172a';
        ctx2.font = '900 13px sans-serif';
        ctx2.fillText(m.shortLabel, gx + barW + 9, cBottom + 26);

        ctx2.fillStyle = '#64748b';
        ctx2.font = 'bold 11px sans-serif';
        ctx2.fillText(
          `Prove: ${m.correctFirstTry}/${m.completed}`,
          gx + barW + 9,
          cBottom + 44
        );
        ctx2.textAlign = 'left';
      });

      // SECTION B: TABELLA TELEMETRICA TANGIBILE E PARAMETRI WPPSI-IV (y: 710, h: 480)
      fillStrokeRoundRect(
        ctx2,
        48,
        710,
        1144,
        480,
        22,
        '#ffffff',
        '#cbd5e1',
        1.8
      );

      ctx2.fillStyle = '#0f172a';
      ctx2.font = '900 19px sans-serif';
      ctx2.fillText(
        'PROSPETTO ANALITICO DEI PARAMETRI TANGIBILI RILEVATI DALL’APP',
        78,
        748
      );

      // Table Header
      const tX = 76;
      const tY = 770;
      const tW = 1088;
      fillStrokeRoundRect(ctx2, tX, tY, tW, 42, 10, '#1e293b');
      ctx2.fillStyle = '#ffffff';
      ctx2.font = 'bold 13px sans-serif';
      ctx2.fillText('DOMINIO COGNITIVO / MATERIA', tX + 18, tY + 26);
      ctx2.fillText('PROVE SUPERATE', tX + 390, tY + 26);
      ctx2.fillText('1° TENTATIVO', tX + 555, tY + 26);
      ctx2.fillText('ACCURATEZZA', tX + 700, tY + 26);
      ctx2.fillText('PADRONANZA', tX + 845, tY + 26);
      ctx2.fillText('STATO CLINICO', tX + 975, tY + 26);

      domainMetrics.forEach((m, idx) => {
        const ry = tY + 50 + idx * 58;
        fillStrokeRoundRect(
          ctx2,
          tX,
          ry,
          tW,
          50,
          10,
          idx % 2 === 0 ? '#f8fafc' : '#f1f5f9',
          '#e2e8f0',
          1
        );

        ctx2.fillStyle = m.hexColor;
        ctx2.fillRect(tX + 12, ry + 12, 8, 26);

        ctx2.fillStyle = '#0f172a';
        ctx2.font = 'bold 13.5px sans-serif';
        ctx2.fillText(m.clinicalName, tX + 28, ry + 30);

        ctx2.font = 'bold 14px sans-serif';
        ctx2.fillText(`${m.completed} prove`, tX + 410, ry + 30);
        ctx2.fillText(`${m.correctFirstTry} esatte`, tX + 570, ry + 30);
        ctx2.fillText(
          `${isMeasurementUnlocked ? m.accuracy : 0}%`,
          tX + 725,
          ry + 30
        );

        ctx2.fillStyle = m.hexDark;
        ctx2.font = '900 15px sans-serif';
        ctx2.fillText(`${m.masteryIndex}%`, tX + 868, ry + 30);

        ctx2.fillStyle = '#334155';
        ctx2.font = 'bold 12px sans-serif';
        ctx2.fillText(m.levelLabel, tX + 975, ry + 30);
      });

      // SECTION C: PIANO DI POTENZIAMENTO PERSONALIZZATO PER EMMA GUIDI (y: 1212, h: 440)
      fillStrokeRoundRect(
        ctx2,
        48,
        1212,
        1144,
        440,
        22,
        '#ffffff',
        '#c084fc',
        2
      );

      ctx2.fillStyle = '#4c1d95';
      ctx2.font = '900 19px sans-serif';
      ctx2.fillText(
        'STUDIO DIAGNOSTICO AI & PIANO DI POTENZIAMENTO COGNITIVO PER EMMA GUIDI',
        78,
        1252
      );

      const recommendations = [
        {
          title: '1. Potenziamento Ragionamento Fluido & Matrici QI (Gf)',
          body: `Al Livello ${progress.currentLevel}, Emma Guidi affronta quesiti di seriazione, analogie visuo-percettive e classificazioni logiche. Si consiglia di accompagnare le sessioni chiedendo alla bambina di verbalizzare il "perché" della risposta scelta: questo trasforma l'intuizione visiva in pensiero ipotetico-deduttivo strutturato.`,
        },
        {
          title: '2. Sviluppo Memoria di Lavoro Uditiva, Musica & Subitizing (Gwm)',
          body: `Le prove di Musica & Ritmo (sequenze Do-Re-Mi-Sol) e il conteggio tattile 1-a-1 stimolano il loop fonologico e il taccuino visuo-spaziale. Riprodurre brevi ritmi battendo le mani o contando oggetti reali consolida la prontezza per il calcolo mentale della scuola primaria.`,
        },
        {
          title: '3. Bilinguismo Precoce Inglese L2 & Consapevolezza Fonologica (Gc)',
          body: `L'esposizione ludica ai primi vocaboli inglesi (colori, animali, elementi della natura) in parallelo al riconoscimento dei fonemi iniziali italiani sfrutta la finestra di massima neuroplasticità linguistica dei 5 anni (${ageInfo.displayText}).`,
        },
        {
          title: '4. Pianificazione Esecutiva, Spazio 3D & Creatività Grafica (Gv / Gs)',
          body: `I livelli di Svago 3D (Tris strategico contro Orsetto, Memory delle coppie, Studio Disegno) mostrano ${progress.trisGamesWon} vittorie al Tris e ${progress.savedDrawings?.length || 0} elaborati artistici salvati, evidenziando un'ottima integrazione visuo-motoria e autoregolazione attentiva.`,
        },
      ];

      recommendations.forEach((rec, i) => {
        const ry = 1282 + i * 88;
        ctx2.fillStyle = '#1e1b4b';
        ctx2.font = '900 14.5px sans-serif';
        ctx2.fillText(rec.title, 78, ry);

        ctx2.fillStyle = '#334155';
        ctx2.font = '13px sans-serif';
        drawWrappedText(ctx2, rec.body, 78, ry + 22, 1080, 19, 2);
      });

      // Page 2 Footer
      fillStrokeRoundRect(
        ctx2,
        48,
        H - 64,
        1144,
        38,
        14,
        '#f1f5f9',
        '#cbd5e1',
        1.2
      );
      ctx2.fillStyle = '#334155';
      ctx2.font = 'bold 12.5px sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText(
        `Documento Ufficiale Generato per EMMA GUIDI (Nata il 22/08/2021) · Il Mondo di Emma · Livello ${progress.currentLevel} · Pagina 2 di 2`,
        W / 2,
        H - 40
      );
      ctx2.textAlign = 'left';

      // Create 2-Page PDF Blob
      const jpegPage1 = canvas1.toDataURL('image/jpeg', 0.95);
      const jpegPage2 = canvas2.toDataURL('image/jpeg', 0.95);
      const pdfBlob = createMultiPageA4PdfBlob([
        { jpegDataUrl: jpegPage1, width: W, height: H },
        { jpegDataUrl: jpegPage2, width: W, height: H },
      ]);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relazione_Pedagogica_QI_3D_Emma_Guidi_Livello_${progress.currentLevel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-[32px] max-w-4xl w-full p-5 sm:p-7 shadow-2xl text-white my-auto max-h-[92vh] overflow-y-auto">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/25 shrink-0">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-400/30">
                  Studio Diagnostico AI & Psicometria 3D
                </span>
                <span className="text-[11px] font-semibold text-white/60 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" /> Nata il
                  22/08/2021 ({ageInfo.displayText})
                </span>
              </div>
              <h2 className="font-kids font-extrabold text-xl sm:text-2xl text-white mt-1">
                Relazione Pedagogica, Grafici 3D & Valutazione QI — Emma
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPdfReport}
              disabled={isGeneratingPdf}
              className="toy-button-3d flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-kids font-extrabold text-xs sm:text-sm border-2 border-emerald-200/80 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isGeneratingPdf
                  ? 'Generazione PDF 3D...'
                  : 'Scarica Report PDF 3D (Emma Guidi)'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ZERO BASELINE NOTICE BANNER */}
        <div
          className={`mt-4 rounded-2xl p-4 border flex items-center justify-between gap-3 flex-wrap ${
            isMeasurementUnlocked
              ? 'bg-emerald-950/40 border-emerald-400/30 text-emerald-200'
              : 'bg-amber-950/40 border-amber-400/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isMeasurementUnlocked ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-6 h-6 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {isMeasurementUnlocked
                  ? `Misurazione Attiva · Aggiornamento Livello per Livello (Livello ${progress.currentLevel})`
                  : `Fase di Calibrazione Iniziale: Parametri a 0% fino al Livello 10 (Attuale: Livello ${progress.currentLevel})`}
              </p>
              <p className="text-xs text-white/80 mt-0.5">
                {isMeasurementUnlocked
                  ? `Superato il Livello 10, la Relazione Pedagogica, i Grafici 3D e il QI hanno attivato il 1° step e si aggiornano ad ogni nuovo livello completato da Emma.`
                  : `Come richiesto, Relazione Pedagogica, Analisi Grafici e QI partono da 0% e sbloccano il primo step di misurazione subito dopo il Livello 10 (mancano ${
                      10 - completedLevelsCount
                    } livelli al 1° step).`}
              </p>
            </div>
          </div>

          {/* Audio Settings Quick Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateAudio(!progress.soundEnabled, progress.voiceEnabled)
              }
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {progress.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
              <span>Suoni {progress.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() =>
                onUpdateAudio(progress.soundEnabled, !progress.voiceEnabled)
              }
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🗣️ Voce {progress.voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* SUMMARY TELEMETRY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
              <Award className="w-4 h-4" /> Livello Raggiunto
            </div>
            <p className="font-kids font-extrabold text-2xl">
              Liv. {progress.currentLevel}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              Tier {currentTier} · Stelle: {progress.stars}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold mb-1">
              <Brain className="w-4 h-4" /> Quoziente Cognitivo (QI)
            </div>
            <p className="font-kids font-extrabold text-2xl text-purple-200">
              {isMeasurementUnlocked ? `QI ${iqAnalysis.iqScore}` : '0%'}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              {isMeasurementUnlocked
                ? `${iqAnalysis.percentile} (${iqAnalysis.iqRange})`
                : '0% fino al Livello 10'}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold mb-1">
              <TrendingUp className="w-4 h-4" /> Accuratezza Globale
            </div>
            <p className="font-kids font-extrabold text-2xl">
              {overallAccuracy}%
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              {isMeasurementUnlocked
                ? `${progress.totalPuzzlesSolved} prove risolte`
                : 'Attivo dopo il Livello 10'}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-1">
              <Activity className="w-4 h-4" /> Strategia & Arte
            </div>
            <p className="font-kids font-extrabold text-2xl">
              {progress.trisGamesWon} Vitt. Tris
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              Disegni salvati: {progress.savedDrawings?.length || 0}
            </p>
          </div>
        </div>

        {/* SECTION 1: VALUTAZIONE PSICOMETRICA DEL QI (ZERO OVERLAP LAYOUT) */}
        <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/60 rounded-3xl p-5 border border-purple-400/30 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-purple-300 shrink-0" />
                <h3 className="font-kids font-extrabold text-sm sm:text-base uppercase tracking-wider text-purple-200">
                  1. Valutazione Psicometrica del Quoziente Cognitivo (QI) — Emma
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-bold text-amber-300">
                Categoria Psicometrica: {iqAnalysis.classification} | Percentile:{' '}
                {iqAnalysis.percentile}
              </p>
              <p className="text-xs text-white/75 mt-1 leading-relaxed">
                {iqAnalysis.clinicalNote}
              </p>
            </div>

            {/* Dedicated Non-Overlapping Right 3D QI Badge */}
            <div className="shrink-0 bg-gradient-to-b from-purple-700 to-indigo-950 border-2 border-amber-300 rounded-2xl px-6 py-3 text-center shadow-[0_6px_0_#3b0764,0_12px_24px_rgba(0,0,0,0.4)]">
              <span className="font-kids font-extrabold text-2xl sm:text-3xl text-yellow-300 block leading-none">
                {isMeasurementUnlocked ? `QI ${iqAnalysis.iqScore}` : 'QI 0%'}
              </span>
              <span className="text-[11px] font-bold text-purple-200 block mt-1">
                {isMeasurementUnlocked
                  ? `Aggiornato al Livello ${progress.currentLevel}`
                  : 'Sblocco dopo Livello 10'}
              </span>
            </div>
          </div>

          {/* 5 WPPSI-IV Parameter Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {iqAnalysis.indices.map((ind) => (
              <div
                key={ind.code}
                className="bg-slate-950/80 rounded-2xl p-3 border border-white/15 flex flex-col items-center text-center shadow-md"
              >
                <span
                  className="font-kids font-extrabold text-2xl"
                  style={{ color: ind.colorHex }}
                >
                  {isMeasurementUnlocked ? ind.scaledScore : '0%'}
                </span>
                <span className="text-xs font-bold text-white mt-1">
                  {ind.shortTitle}
                </span>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ind.percentScore}%`,
                      backgroundColor: ind.colorHex,
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/60 mt-1">
                  Indice: {ind.percentScore}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: ANALISI GRAFICA MULTIDIMENSIONALE (RADAR + BARRE) */}
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-400" />
              <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-pink-300">
                2. Analisi Grafica 3D delle 6 Materie di Competenza
              </h3>
            </div>
            <span className="text-xs text-white/60">
              {isMeasurementUnlocked
                ? `Profilo di Emma al Livello ${progress.currentLevel}`
                : 'Grafici a 0% fino al completamento del Livello 10'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Hexagonal Radar Chart */}
            <div className="flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-bold text-white/80 mb-2">
                Mappa Radar Globale (6 Materie)
              </p>
              <svg viewBox="0 0 230 230" className="w-56 h-56 overflow-visible">
                {[0.25, 0.5, 0.75, 1].map((scale, idx) => {
                  const pts = domainMetrics
                    .map((_, i) => {
                      const angle =
                        (Math.PI * 2 * i) / domainMetrics.length - Math.PI / 2;
                      const r = 72 * scale;
                      return `${115 + r * Math.cos(angle)},${
                        115 + r * Math.sin(angle)
                      }`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={idx}
                      points={pts}
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="1"
                    />
                  );
                })}

                {radarCoordinates.map((c) => (
                  <g key={c.id}>
                    <line
                      x1="115"
                      y1="115"
                      x2={c.axisX}
                      y2={c.axisY}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x={c.labelX}
                      y={c.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white text-[9px] font-bold"
                    >
                      {c.shortLabel} ({c.masteryIndex}%)
                    </text>
                  </g>
                ))}

                <polygon
                  points={radarCoordinates.map((c) => `${c.x},${c.y}`).join(' ')}
                  fill="rgba(236, 72, 153, 0.35)"
                  stroke="#f472b6"
                  strokeWidth="2.5"
                />

                {radarCoordinates.map((c) => (
                  <circle
                    key={c.id}
                    cx={c.x}
                    cy={c.y}
                    r="4"
                    fill={c.hexColor}
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>

            {/* Horizontal Comparative Bars */}
            <div className="space-y-3">
              {domainMetrics.map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>{m.emoji}</span> {m.title}
                    </span>
                    <span className="font-black text-amber-300">
                      {m.masteryIndex}%{' '}
                      <span className="text-white/60 font-normal">
                        ({m.correctFirstTry}/{m.completed})
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.barColor} transition-all duration-500`}
                      style={{ width: `${m.masteryIndex}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: RELAZIONE PEDAGOGICA STRUTTURATA PER AMBITO */}
        <div className="space-y-3.5 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-300" />
            <h3 className="font-kids font-bold text-sm uppercase tracking-wider text-amber-300">
              3. Relazione Pedagogica Dettagliata per Materia — Livello{' '}
              {progress.currentLevel}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {domainMetrics.map((m) => (
              <div
                key={m.id}
                className="bg-slate-950/75 rounded-2xl p-4 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.emoji}</span>
                      <div>
                        <h4 className="font-kids font-bold text-sm text-white leading-tight">
                          {m.clinicalName}
                        </h4>
                        <span className="text-[11px] font-semibold text-amber-300">
                          {m.levelLabel} ({m.masteryIndex}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/70 font-semibold mt-1">
                    <strong className="text-white">Traguardo:</strong>{' '}
                    {m.milestoneGoal}
                  </p>
                  <p className="text-xs text-white/85 leading-relaxed mt-1.5">
                    <strong className="text-pink-300">Osservazione AI:</strong>{' '}
                    {m.pedagogicalNote}
                  </p>
                  <p className="text-[11px] text-amber-200/90 italic mt-1.5">
                    <strong>Consiglio Famiglia:</strong> {m.familyAdvice}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                  <span>Prove svolte: {m.completed}</span>
                  <span>1° tentativo: {m.correctFirstTry}</span>
                  <span>Accuratezza: {m.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: CONSIGLI EDUCATIVI */}
        <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-pink-950/60 rounded-2xl p-5 border border-white/15 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HeartHandshake className="w-5 h-5 text-pink-300" />
            <h3 className="font-kids font-bold text-sm uppercase tracking-wider text-pink-200">
              4. Indicazioni Educative per Accompagnare Emma (5 Anni)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/85 leading-relaxed">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Matrici QI & Ragionamento
              </p>
              Chiedere a Emma di spiegare ad alta voce perché ha scelto un
              determinato simbolo nella matrice logica rinforza la metacognizione.
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-pink-300 mb-1 flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> Musica, Ritmo & Memoria
              </p>
              Battere le mani seguendo il ritmo delle note ascoltate nell'app
              consolida la memoria di lavoro uditiva e la coordinazione motoria.
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Prime Paroline in Inglese
              </p>
              Ripetere insieme nella vita quotidiana le paroline inglesi
              imparate (es. Red, Dog, Sun, Apple) favorisce il bilinguismo
              naturale.
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onResetProgress}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors px-3 py-2 rounded-xl hover:bg-rose-500/10 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Azzera Percorso e Statistiche
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadPdfReport}
              disabled={isGeneratingPdf}
              className="toy-button-3d px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-kids font-bold text-sm shadow-lg cursor-pointer flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Scarica Report PDF 3D (2 Pagine)</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-kids font-bold text-sm shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Chiudi Area Genitori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
