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
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  UserRoundCog,
} from 'lucide-react';
import {
  UserProgress,
  GameCategory,
  CompetencyBandLabel,
} from '../types/game';
import {
  calculateChildAge,
  getDisplayChildName,
  getFullChildName,
  getGenderedWord,
  getWorldTitle,
} from '../utils/childProfile';
import {
  computeFullEvaluationReport,
  getDifficultyWeightInfo,
} from '../utils/evaluationEngine';
import { getSecurityComplianceReport } from '../utils/security';

interface ParentModalProps {
  progress: UserProgress;
  onUpdateAudio: (soundEnabled: boolean, voiceEnabled: boolean) => void;
  onOpenProfile?: () => void;
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
  assistedCount: number;
  ip: number;          // Indice di Prestazione (0-100)
  ia: number;          // Indice di Autonomia (0-100)
  ir: number;          // Ritenzione nel tempo (0-100)
  it: number;          // Trasferimento (0-100)
  ic: number;          // Indice di Competenza (0-100)
  ieDelta: number;     // Evoluzione rispetto alla rilevazione precedente
  levelLabel: CompetencyBandLabel;
  barColor: string;
  hexColor: string;
  hexDark: string;
  hexTop: string;
  milestoneGoal: string;
  pedagogicalNote: string;
  familyAdvice: string;
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
 * Draws single-line text strictly within maxWidth, truncating cleanly with ellipsis if ever needed.
 */
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let trimmed = text;
  while (trimmed.length > 3 && ctx.measureText(trimmed + '…').width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  ctx.fillText(trimmed.trimEnd() + '…', x, y);
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
  fillStrokeRoundRect(ctx, x, y, trackW, h, 7, '#f1f5f9', '#cbd5e1', 1);

  const w = Math.max(12, Math.min(trackW, fillW));
  if (fillW <= 0) return;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth * 0.6);
  ctx.lineTo(x + w + depth, y - depth * 0.6);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + depth, y - depth * 0.6);
  ctx.lineTo(x + w + depth, y + h - depth * 0.6);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = darkColor;
  ctx.fill();

  fillStrokeRoundRect(ctx, x, y, w, h, 5, mainColor);

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
  score: number,
  mainColor: string,
  darkColor: string
) {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * Math.max(3, score)) / 100;

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

  if (score > 0) {
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
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${score}/100`, cx, cy + 5);
  ctx.textAlign = 'left';
}

export const ParentModal: React.FC<ParentModalProps> = ({
  progress,
  onUpdateAudio,
  onOpenProfile,
  onResetProgress,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showResetGate, setShowResetGate] = useState(false);
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);
  const childProfile = progress.childProfile;
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const childName = useMemo(() => getDisplayChildName(childProfile), [childProfile]);
  const fullChildName = useMemo(() => getFullChildName(childProfile), [childProfile]);
  const fullChildNameUpper = fullChildName.toUpperCase();
  const worldTitleFull = useMemo(() => getWorldTitle(childProfile).full, [childProfile]);
  const childGender = childProfile?.gender || 'n';
  const studentRoleLabel = getGenderedWord(childGender, 'Allieva', 'Allievo', 'Allievo/a');
  const bornLabel = getGenderedWord(childGender, 'Nata il', 'Nato il', 'Data di nascita');
  const childInitialLetter = (childName[0] || 'A').toUpperCase();

  // Complete Mathematical & CHC Evaluation Report (0-100) + Monthly/Annual Progress Rows
  const evalReport = useMemo(
    () => computeFullEvaluationReport(progress),
    [progress]
  );

  // Updated Security & Child-Privacy Compliance Report
  const securityCriteria = useMemo(
    () => getSecurityComplianceReport(progress),
    [progress]
  );

  const isMeasurementUnlocked = evalReport.isUnlocked;
  const completedLevelsCount = evalReport.completedLevelsCount;
  const currentTier = evalReport.currentTier;

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
        title: '1. Logica, Sequenze & Associazioni (Gf)',
        clinicalName: 'Ragionamento Fluido, Sequenze & Logica (Gf)',
        shortLabel: 'Logica (Gf)',
        emoji: '🧠',
        barColor: 'from-violet-500 to-purple-500',
        hexColor: '#7c3aed',
        hexDark: '#4c1d95',
        hexTop: '#a78bfa',
        milestoneGoal: `Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso ${evalReport.currentWeight}): Sequenze logiche, analogie figurate, intrusi e indovinelli.`,
        familyAdvice:
          'Proponete giochi di analogia quotidiana: "Il pesciolino sta nel mare come l\'uccellino sta nel...?"',
      },
      {
        id: 'letters',
        title: '2. Linguaggio, Fonetica & Lettere (Gc)',
        clinicalName: 'Linguaggio, Fonetica & Lettere Familiari (Gc)',
        shortLabel: 'Lettere (Gc)',
        emoji: '🔤',
        barColor: 'from-emerald-500 to-teal-500',
        hexColor: '#10b981',
        hexDark: '#047857',
        hexTop: '#34d399',
        milestoneGoal: `Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso ${evalReport.currentWeight}): Riconoscimento suoni iniziali, lettera ${childInitialLetter} di ${childName} e rime/ortografia per fascia ${ageInfo.ageBandTitle}.`,
        familyAdvice:
          `Enfatizzate il suono iniziale delle parole quotidiane: "Mmm-Mela!", "Sss-Sole!", "${childInitialLetter}-${childInitialLetter}-${childName}!".`,
      },
      {
        id: 'numbers',
        title: '3. Senso del Numero & Calcolo Visivo (Gwm)',
        clinicalName: 'Senso del Numero, Quantità & Calcolo Visivo (Gwm)',
        shortLabel: 'Numeri',
        emoji: '🔢',
        barColor: 'from-sky-500 to-blue-600',
        hexColor: '#0284c7',
        hexDark: '#0369a1',
        hexTop: '#38bdf8',
        milestoneGoal: `Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso ${evalReport.currentWeight}): Conteggio, calcoli e problemi calibrati su ${ageInfo.ageBandTitle}.`,
        familyAdvice:
          `Coinvolgete ${childName} nella vita quotidiana: "Prendi una mela rossa e due mele gialle, quante mele sono?"`,
      },
      {
        id: 'shapes',
        title: '4. Abilità Visuo-Spaziali & Forme (Gv)',
        clinicalName: 'Abilità Visuo-Spaziali, Forme & Colori (Gv)',
        shortLabel: 'Spazio (Gv)',
        emoji: '🔷',
        barColor: 'from-pink-500 to-rose-500',
        hexColor: '#db2777',
        hexDark: '#9d174d',
        hexTop: '#f472b6',
        milestoneGoal: `Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso ${evalReport.currentWeight}): Figure geometriche, orientamento spaziale e mescolanze cromatiche.`,
        familyAdvice:
          'Cercate insieme le forme negli oggetti di casa: "Il piatto è un cerchio, il fazzoletto è un quadrato!"',
      },
      {
        id: 'music',
        title: '5. Memoria Uditiva, Musica & Ritmo (Gwm)',
        clinicalName: 'Memoria di Lavoro Uditiva, Note & Ritmo (Gwm)',
        shortLabel: 'Musica',
        emoji: '🎵',
        barColor: 'from-amber-400 to-orange-500',
        hexColor: '#d97706',
        hexDark: '#92400e',
        hexTop: '#fbbf24',
        milestoneGoal: `Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso ${evalReport.currentWeight}): Percezione melodica (Do-Re-Mi), pattern ritmici e timbro degli strumenti.`,
        familyAdvice:
          `Battete le mani a ritmo (Bum-Clap-Bum-Clap) chiedendo a ${childName} di continuare la sequenza sonora.`,
      },
      {
        id: 'english',
        title: '6. Inglese Prescolare & Vocabolario (Gc)',
        clinicalName: 'Inglese Prescolare & Prime Paroline (Gc)',
        shortLabel: 'Inglese',
        emoji: '🇬🇧',
        barColor: 'from-cyan-500 to-indigo-500',
        hexColor: '#0891b2',
        hexDark: '#155e75',
        hexTop: '#22d3ee',
        milestoneGoal: `Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso ${evalReport.currentWeight}): Prime paroline in inglese (Dog, Cat, Sun, Apple, Star, Red, Blue, Heart).`,
        familyAdvice:
          'Salutate al mattino con "Good morning!" e indicate i colori dicendo: "Guarda, Red come la fragola!"',
      },
    ];

    return domainDefinitions.map((def) => {
      const dm = evalReport.domains[def.id];

      if (!isMeasurementUnlocked) {
        return {
          ...def,
          completed: dm.totalExercises,
          correctFirstTry: dm.autonomousCorrectCount,
          assistedCount: dm.assistedSuccessCount,
          ip: 0,
          ia: 0,
          ir: 0,
          it: 0,
          ic: 0,
          ieDelta: 0,
          levelLabel: 'In esplorazione',
          pedagogicalNote:
            'In attesa del primo livello completato: ogni esercizio sonda simultaneamente più parametri CHC (primario, secondario e latenza di risposta) per determinare subito i valori.',
        };
      }

      if (dm.totalExercises === 0) {
        return {
          ...def,
          completed: 0,
          correctFirstTry: 0,
          assistedCount: 0,
          ip: 0,
          ia: 0,
          ir: 0,
          it: 0,
          ic: 0,
          ieDelta: 0,
          levelLabel: 'In esplorazione',
          pedagogicalNote: `Nessun esercizio ancora registrato in questo ambito al Livello ${progress.currentLevel}.`,
        };
      }

      const deltaStr = dm.ieDelta >= 0 ? `+${dm.ieDelta}` : `${dm.ieDelta}`;
      const pedagogicalNote = `Competenza IC ${dm.ic}/100 (${dm.bandLabel}, Evoluzione ${deltaStr}). Prestazione ponderata IP ${dm.ip}/100 (${dm.autonomousCorrectCount}/${dm.totalExercises} autonomi al 1° tentativo, ${dm.assistedSuccessCount} con supporto), Autonomia IA ${dm.ia}/100, Ritenzione IR ${dm.ir}/100, Trasferimento IT ${dm.it}/100.`;

      return {
        ...def,
        completed: dm.totalExercises,
        correctFirstTry: dm.autonomousCorrectCount,
        assistedCount: dm.assistedSuccessCount,
        ip: dm.ip,
        ia: dm.ia,
        ir: dm.ir,
        it: dm.it,
        ic: dm.ic,
        ieDelta: dm.ieDelta,
        levelLabel: dm.bandLabel,
        pedagogicalNote,
      };
    });
  }, [evalReport, progress.currentLevel, isMeasurementUnlocked]);

  // In-App SVG Radar Coordinates
  const radarCoordinates = useMemo(() => {
    const center = 115;
    const maxRadius = 72;
    const count = domainMetrics.length;
    return domainMetrics.map((m, idx) => {
      const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
      const ratio = isMeasurementUnlocked ? Math.max(0.08, m.ic / 100) : 0;
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
   * Implements:
   * - Four Core Indicators (0-100): IP, IC, IA, IE
   * - CHC 5-Domain Cognitive Profile (0-100, never called QI)
   * - Annual & Monthly App Progress Table (Confronto Punto di Partenza vs Attuale + Righe Fisse per Età)
   * - 3D Hexagonal Radar, 3D Extruded Bars, 3D Isometric Columns, and 5 Stability Criteria
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
      // PAGE 1: PROFILO DELLE ABILITÀ CHC (0-100), 4 INDICATORI & GRAFICI 3D
      // =========================================================================
      const canvas1 = document.createElement('canvas');
      canvas1.width = W;
      canvas1.height = H;
      const ctx1 = canvas1.getContext('2d');
      if (!ctx1) return;

      ctx1.fillStyle = '#f8fafc';
      ctx1.fillRect(0, 0, W, H);

      // 1. TOP HEADER BANNER (x: 48, y: 36, w: 1144, h: 118)
      const headerGrad = ctx1.createLinearGradient(48, 36, 1192, 154);
      headerGrad.addColorStop(0, '#4c0519');
      headerGrad.addColorStop(0.5, '#581c87');
      headerGrad.addColorStop(1, '#1e1b4b');
      fillStrokeRoundRect(ctx1, 48, 36, 1144, 118, 22, headerGrad, '#f472b6', 2);

      ctx1.fillStyle = '#fde047';
      ctx1.font = '900 23px sans-serif';
      drawFittedText(
        ctx1,
        `${worldTitleFull} — Profilo Cognitivo CHC (0–100) & Relazione Competenze`,
        76,
        74,
        874
      );

      ctx1.fillStyle = '#ffffff';
      ctx1.font = 'bold 14px sans-serif';
      drawFittedText(
        ctx1,
        `${studentRoleLabel}: ${fullChildNameUpper}   |   ${bornLabel}: ${ageInfo.birthDateFormatted} (${ageInfo.displayText})   |   Livello: ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, peso w=${evalReport.currentWeight})`,
        76,
        104,
        874
      );

      ctx1.fillStyle = '#e2e8f0';
      ctx1.font = '12px sans-serif';
      drawFittedText(
        ctx1,
        `Data: ${dateStr}  ·  Aggiornamento Mensile: ${evalReport.currentMonthStartLabel}  ·  IP = Σ(wᵢ·cᵢ)/Σwᵢ×100  |  IC = 0,50·IP + 0,20·IA + 0,15·IR + 0,15·IT`,
        76,
        132,
        874
      );

      // Right Header Telemetry Pill
      fillStrokeRoundRect(
        ctx1,
        966,
        50,
        206,
        90,
        16,
        'rgba(15, 23, 42, 0.58)',
        '#fbbf24',
        1.5
      );
      ctx1.fillStyle = '#fde047';
      ctx1.font = 'bold 11px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('DATI TRACCIATI NELL’APP', 1069, 72);
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '900 16px sans-serif';
      ctx1.fillText(
        `Esercizi: ${evalReport.significantExercises} · Sessioni: ${evalReport.sessionsCount}`,
        1069,
        97
      );
      ctx1.fillStyle = '#67e8f9';
      ctx1.font = 'bold 11.5px sans-serif';
      ctx1.fillText(
        `Autonomi: ${evalReport.autonomousTotal} · Assistiti: ${evalReport.assistedTotal}`,
        1069,
        121
      );
      ctx1.textAlign = 'left';

      // 2. QUADRO SINTETICO DI VALUTAZIONE: COMPETENZA GENERALE, EVOLUZIONE, 4 INDICATORI & PROFILO CHC
      //    Card Box: x: 48, y: 168, w: 1144, h: 258
      fillStrokeRoundRect(
        ctx1,
        48,
        168,
        1144,
        258,
        22,
        '#fdf4ff',
        '#c084fc',
        2
      );

      // Left column strictly constrained to width 640px (x: 74 .. 714) before Badges (x: 734)
      ctx1.fillStyle = '#4c1d95';
      ctx1.font = '900 17px sans-serif';
      drawFittedText(
        ctx1,
        `PROFILO COGNITIVO CHC (0–100) & 4 INDICATORI — ${fullChildNameUpper}`,
        74,
        198,
        642
      );

      ctx1.fillStyle = '#6b21a8';
      ctx1.font = 'bold 12.5px sans-serif';
      drawFittedText(
        ctx1,
        `Prestazione IP: ${evalReport.ip}/100  ·  Competenza IC: ${evalReport.ic}/100  ·  Autonomia IA: ${evalReport.ia}/100  ·  IR: ${evalReport.ir}  ·  IT: ${evalReport.it}`,
        74,
        222,
        642
      );

      ctx1.fillStyle = '#475569';
      ctx1.font = '11.5px sans-serif';
      drawWrappedText(
        ctx1,
        `Confronto Inizio Mese (${evalReport.activeAgeRow.ageLabel}): Partenza IC ${evalReport.activeAgeRow.startIc}/100 (Liv. ${evalReport.activeAgeRow.startLevel}) → Attuale IC ${evalReport.activeAgeRow.currentIc}/100 (Liv. ${evalReport.activeAgeRow.currentLevel}, Δ +${evalReport.activeAgeRow.deltaIc} pt). Profilo cognitivo interno CHC (non è un test di QI standardizzato).`,
        74,
        243,
        642,
        15.5,
        2
      );

      // Badge 1: COMPETENZA GENERALE (x: 734, y: 182, w: 224, h: 88)
      fillStrokeRoundRect(ctx1, 738, 188, 224, 88, 18, '#3b0764');
      const compBadgeGrad = ctx1.createLinearGradient(734, 182, 958, 270);
      compBadgeGrad.addColorStop(0, '#6b21a8');
      compBadgeGrad.addColorStop(1, '#3b0764');
      fillStrokeRoundRect(
        ctx1,
        734,
        182,
        224,
        88,
        18,
        compBadgeGrad,
        '#facc15',
        2.2
      );

      ctx1.fillStyle = '#e9d5ff';
      ctx1.font = 'bold 11px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('COMPETENZA GENERALE', 846, 204);
      ctx1.fillStyle = '#fde047';
      ctx1.font = '900 30px sans-serif';
      ctx1.fillText(`${evalReport.ic}/100`, 846, 236);
      ctx1.fillStyle = '#ffffff';
      ctx1.font = 'bold 12px sans-serif';
      ctx1.fillText(evalReport.assignedBandLabel, 846, 258);

      // Badge 2: EVOLUZIONE (x: 972, y: 182, w: 198, h: 88)
      fillStrokeRoundRect(ctx1, 976, 188, 198, 88, 18, '#064e3b');
      const evoBadgeGrad = ctx1.createLinearGradient(972, 182, 1170, 270);
      evoBadgeGrad.addColorStop(0, '#059669');
      evoBadgeGrad.addColorStop(1, '#065f46');
      fillStrokeRoundRect(
        ctx1,
        972,
        182,
        198,
        88,
        18,
        evoBadgeGrad,
        '#6ee7b7',
        2.2
      );

      ctx1.fillStyle = '#d1fae5';
      ctx1.font = 'bold 11px sans-serif';
      ctx1.fillText('EVOLUZIONE (IE)', 1071, 204);
      ctx1.fillStyle = '#fde047';
      ctx1.font = '900 30px sans-serif';
      const ieSign = evalReport.ieDelta >= 0 ? '+' : '';
      ctx1.fillText(`${ieSign}${evalReport.ieDelta}`, 1071, 236);
      ctx1.fillStyle = '#ffffff';
      ctx1.font = 'bold 11px sans-serif';
      ctx1.fillText(
        `Da ${evalReport.previousIc}/100 a ${evalReport.ic}/100`,
        1071,
        258
      );
      ctx1.textAlign = 'left';

      // BOTTOM SUB-ROW: 5 CHC ABILITY BOXES (0-100) (y: 286, h: 124)
      const chcShortDesc: Record<string, string> = {
        Gf: 'Logica, sequenze e analogie',
        Gwm: 'Memoria visiva e uditiva',
        Gc: 'Linguaggio, fonetica e lessico',
        Gv: 'Forme, colori e spazio',
        Gs: 'Rapidità e precisione visiva',
      };
      const boxGap = 14;
      const boxW = (1144 - 56 - boxGap * 4) / 5;
      evalReport.chcAbilities.forEach((ab, i) => {
        const bx = 76 + i * (boxW + boxGap);
        const by = 286;
        const bh = 124;

        fillStrokeRoundRect(ctx1, bx + 3, by + 4, boxW, bh, 14, '#e9d5ff');
        fillStrokeRoundRect(
          ctx1,
          bx,
          by,
          boxW,
          bh,
          14,
          '#ffffff',
          ab.colorHex,
          1.8
        );

        ctx1.fillStyle = ab.colorHex;
        ctx1.font = '900 25px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText(`${ab.score}/100`, bx + boxW / 2, by + 34);

        ctx1.fillStyle = '#0f172a';
        ctx1.font = 'bold 12.5px sans-serif';
        drawFittedText(
          ctx1,
          `${ab.shortTitle} (${ab.code})`,
          bx + boxW / 2,
          by + 56,
          boxW - 14
        );

        const miniBarX = bx + 16;
        const miniBarY = by + 68;
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
        const fillW = Math.round((miniBarW * ab.score) / 100);
        if (fillW > 0) {
          fillStrokeRoundRect(
            ctx1,
            miniBarX,
            miniBarY,
            fillW,
            10,
            5,
            ab.colorHex
          );
        }

        ctx1.fillStyle = '#475569';
        ctx1.font = 'bold 10px sans-serif';
        drawFittedText(
          ctx1,
          `${ab.bandLabel} · IP ${ab.ip} · IA ${ab.ia}`,
          bx + boxW / 2,
          by + 96,
          boxW - 12
        );

        ctx1.fillStyle = '#64748b';
        ctx1.font = '10px sans-serif';
        drawFittedText(
          ctx1,
          chcShortDesc[ab.code] || ab.description,
          bx + boxW / 2,
          by + 113,
          boxW - 12
        );
        ctx1.textAlign = 'left';
      });

      // 3. MIDDLE CHARTS ROW: 3D HEXAGONAL RADAR (LEFT) + 3D EXTRUDED BARS (RIGHT)
      const chartsY = 438;
      const chartsH = 428;

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
      ctx1.fillText('Mappa Radar 3D delle Competenze (0–100)', 278, chartsY + 34);
      ctx1.fillStyle = '#64748b';
      ctx1.font = '12.5px sans-serif';
      ctx1.fillText(
        `Indice di Competenza (IC) per Materia · Livello ${progress.currentLevel}`,
        278,
        chartsY + 54
      );
      ctx1.textAlign = 'left';

      const rCx = 278;
      const rCy = chartsY + 236;
      const rMax = 112;

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

        const dist = i === 0 || i === 3 ? rMax + 26 : rMax + 46;
        const lx = rCx + dist * Math.cos(angle);
        const ly = rCy + dist * Math.sin(angle);

        const labelText = `${m.shortLabel} (${m.ic}/100)`;
        ctx1.font = 'bold 11.5px sans-serif';
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

      if (isMeasurementUnlocked) {
        ctx1.beginPath();
        domainMetrics.forEach((m, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const ratio = Math.max(0.08, m.ic / 100);
          const px = rCx + rMax * ratio * Math.cos(angle);
          const py = rCy + 6 + rMax * ratio * Math.sin(angle);
          if (i === 0) ctx1.moveTo(px, py);
          else ctx1.lineTo(px, py);
        });
        ctx1.closePath();
        ctx1.fillStyle = 'rgba(124, 58, 237, 0.28)';
        ctx1.fill();

        ctx1.beginPath();
        domainMetrics.forEach((m, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const ratio = Math.max(0.08, m.ic / 100);
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

        domainMetrics.forEach((m, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const ratio = Math.max(0.08, m.ic / 100);
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
        `Indice di Competenza (IC) & Prestazione (IP) per Materia (Liv. ${progress.currentLevel})`,
        552,
        chartsY + 34
      );

      domainMetrics.forEach((m, idx) => {
        const rowY = chartsY + 66 + idx * 59;
        const barTrackW = 610;
        const fillW = Math.round((barTrackW * m.ic) / 100);

        ctx1.fillStyle = '#0f172a';
        ctx1.font = 'bold 13px sans-serif';
        drawFittedText(ctx1, m.title, 552, rowY, 315);

        ctx1.fillStyle = '#64748b';
        ctx1.font = 'bold 11px sans-serif';
        ctx1.textAlign = 'right';
        ctx1.fillText(
          `IP ${m.ip} · IA ${m.ia} · Auton. ${m.correctFirstTry}/${m.completed}`,
          1098,
          rowY
        );

        ctx1.fillStyle = m.hexColor;
        ctx1.font = '900 14.5px sans-serif';
        ctx1.fillText(`${m.ic}/100`, 1166, rowY);
        ctx1.textAlign = 'left';

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

      // 4. RELAZIONE PEDAGOGICA DETTAGLIATA (6 SUBJECT CARDS 2x3)
      ctx1.fillStyle = '#0f172a';
      ctx1.font = '900 17.5px sans-serif';
      drawFittedText(
        ctx1,
        `RELAZIONE PEDAGOGICA DETTAGLIATA PER MATERIA — ${fullChildNameUpper} (Competenza Generale: ${evalReport.ic}/100 · ${evalReport.assignedBandLabel})`,
        48,
        894,
        1144
      );

      const gridStartY = 910;
      const cardW = 560;
      const cardH = 242;
      const colGap = 24;
      const rowGap = 14;

      domainMetrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 48 + col * (cardW + colGap);
        const cy = gridStartY + row * (cardH + rowGap);

        fillStrokeRoundRect(
          ctx1,
          cx + 3,
          cy + 4,
          cardW,
          cardH,
          18,
          '#e2e8f0'
        );

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

        // Left colored bar
        fillStrokeRoundRect(ctx1, cx + 14, cy + 14, 6, cardH - 28, 3, m.hexColor);

        // Left Donut Column (cx + 24 .. cx + 114, centered at cx + 68)
        draw3DDonutGauge(
          ctx1,
          cx + 68,
          cy + 88,
          34,
          10.5,
          m.ic,
          m.hexColor,
          m.hexDark
        );
        ctx1.fillStyle = '#334155';
        ctx1.font = 'bold 10px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText(`IP ${m.ip} · IA ${m.ia}`, cx + 68, cy + 142);
        ctx1.fillStyle = '#64748b';
        ctx1.font = 'bold 9.5px sans-serif';
        ctx1.fillText(`IR ${m.ir} · IT ${m.it}`, cx + 68, cy + 157);
        ctx1.fillText(`Auton. ${m.correctFirstTry}/${m.completed}`, cx + 68, cy + 172);
        ctx1.fillText(`Assist. ${m.assistedCount}`, cx + 68, cy + 187);
        ctx1.textAlign = 'left';

        // Subtle vertical column divider between donut gauge and text column
        ctx1.strokeStyle = '#e2e8f0';
        ctx1.lineWidth = 1.2;
        ctx1.beginPath();
        ctx1.moveTo(cx + 118, cy + 18);
        ctx1.lineTo(cx + 118, cy + cardH - 18);
        ctx1.stroke();

        // Right Text Column (tx: cx + 130 .. cx + cardW - 14 => tw: 416px)
        const tx = cx + 130;
        const tw = cardW - 144;

        ctx1.fillStyle = '#0f172a';
        ctx1.font = '900 13.5px sans-serif';
        drawFittedText(ctx1, m.clinicalName, tx, cy + 29, tw);

        // Clean dedicated badge sub-row so title NEVER collides with status pill
        const dStr = m.ieDelta >= 0 ? `+${m.ieDelta}` : `${m.ieDelta}`;
        const statusStr = `${m.levelLabel} · IC ${m.ic}/100 (${dStr})`;
        ctx1.font = 'bold 10.5px sans-serif';
        const stW = Math.min(tw, ctx1.measureText(statusStr).width + 18);
        fillStrokeRoundRect(
          ctx1,
          tx,
          cy + 38,
          stW,
          20,
          7,
          '#f8fafc',
          m.hexColor,
          1
        );
        ctx1.fillStyle = m.hexDark;
        drawFittedText(ctx1, statusStr, tx + 9, cy + 52, stW - 16);

        ctx1.fillStyle = '#334155';
        ctx1.font = 'bold 11.5px sans-serif';
        let nextY = drawWrappedText(
          ctx1,
          `Traguardo: ${m.milestoneGoal}`,
          tx,
          cy + 75,
          tw,
          15.5,
          2
        );

        ctx1.fillStyle = '#1e293b';
        ctx1.font = '11.5px sans-serif';
        nextY = drawWrappedText(
          ctx1,
          `Analisi: ${m.pedagogicalNote}`,
          tx,
          nextY + 5,
          tw,
          15.5,
          4
        );

        const remainingAdviceLines = Math.max(
          2,
          Math.min(3, Math.floor((cy + cardH - 12 - (nextY + 5)) / 15))
        );
        ctx1.fillStyle = '#475569';
        ctx1.font = 'italic 11px sans-serif';
        drawWrappedText(
          ctx1,
          `Consiglio: ${m.familyAdvice}`,
          tx,
          nextY + 5,
          tw,
          15,
          remainingAdviceLines
        );
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
        `Documento Ufficiale Generato per ${fullChildNameUpper} (${bornLabel} ${ageInfo.birthDateFormatted}) · ${worldTitleFull} · Livello ${progress.currentLevel} · Stelle: ${progress.stars} · Pagina 1 di 2`,
        W / 2,
        H - 40
      );
      ctx1.textAlign = 'left';

      // =========================================================================
      // PAGE 2: PROGRESSI OTTENUTI GRAZIE ALL'APP (INIZIO MESE & STORICO ANNUALE),
      //         ISTOGRAMMA 3D & PROSPETTO DEI 4 INDICATORI + 5 CRITERI
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
      ctx2.font = '900 22px sans-serif';
      drawFittedText(
        ctx2,
        `PROGRESSI OTTENUTI GRAZIE ALL’APP (MENSILE & ANNUALE PER ETÀ) & STUDIO 3D — ${fullChildNameUpper}`,
        76,
        78,
        1088
      );
      ctx2.fillStyle = '#e2e8f0';
      ctx2.font = 'bold 13.5px sans-serif';
      drawFittedText(
        ctx2,
        `${studentRoleLabel}: ${fullChildNameUpper} (${ageInfo.birthDateFormatted})  ·  Aggiornamento Inizio Mese: ${evalReport.currentMonthStartLabel}  ·  Prossimo Compleanno Riga Fissa: ${evalReport.nextBirthdayDateLabel}  ·  Pag. 2/2`,
        76,
        112,
        1088
      );

      // SECTION A: TABELLA PROGRESSI OTTENUTI GRAZIE ALL'UTILIZZO DELL'APP
      //            (Confronto Punto di Partenza vs Attuale + Righe Fisse ad ogni compleanno)
      const visibleAnnualRows = evalReport.annualProgressRows.slice(-3);
      const secAHeight = 166 + visibleAnnualRows.length * 60 + 52;
      fillStrokeRoundRect(
        ctx2,
        48,
        164,
        1144,
        secAHeight,
        22,
        '#ffffff',
        '#10b981',
        2
      );

      ctx2.fillStyle = '#065f46';
      ctx2.font = '900 17.5px sans-serif';
      drawFittedText(
        ctx2,
        'REGISTRO DEI PROGRESSI OTTENUTI GRAZIE ALL’UTILIZZO DELL’APP (CONFRONTO PARTENZA VS ATTUALE)',
        76,
        196,
        1088
      );
      ctx2.fillStyle = '#475569';
      ctx2.font = '12px sans-serif';
      drawFittedText(
        ctx2,
        `Si aggiorna ogni inizio mese (${evalReport.currentMonthStartLabel}, prossimo: ${evalReport.nextMonthlyUpdateLabel}). Ogni anno compiuto da ${childName} (${evalReport.childBirthDayMonthLabel}) diventa una riga fissa e se ne aggiunge una nuova.`,
        76,
        218,
        1088
      );

      // Annual Table Header — clean fixed column geometry (total width 1088)
      const atX = 76;
      const atY = 234;
      const atW = 1088;
      const col1X = atX + 12;  // w: 238
      const col2X = atX + 264; // w: 186
      const col3X = atX + 462; // w: 212
      const col4X = atX + 686; // w: 212
      const col5X = atX + 910; // w: 168

      fillStrokeRoundRect(ctx2, atX, atY, atW, 36, 10, '#064e3b');
      ctx2.fillStyle = '#ffffff';
      ctx2.font = 'bold 11.5px sans-serif';
      ctx2.fillText('ETÀ & PERIODO', col1X, atY + 23);
      ctx2.fillText('STATO RIGA', col2X, atY + 23);
      ctx2.fillText('PUNTO DI PARTENZA', col3X, atY + 23);
      ctx2.fillText('VALORE ATTUALE / FINALE', col4X, atY + 23);
      ctx2.fillText('PROGRESSO APP (Δ)', col5X, atY + 23);

      visibleAnnualRows.forEach((row, idx) => {
        const ry = atY + 44 + idx * 60;
        fillStrokeRoundRect(
          ctx2,
          atX,
          ry,
          atW,
          52,
          10,
          row.isLockedFixedRow ? '#f8fafc' : '#ecfdf5',
          row.isLockedFixedRow ? '#cbd5e1' : '#10b981',
          1.4
        );

        ctx2.fillStyle = '#0f172a';
        ctx2.font = '900 12.5px sans-serif';
        drawFittedText(
          ctx2,
          `${row.ageLabel} (${row.periodLabel})`,
          col1X,
          ry + 22,
          240
        );
        ctx2.fillStyle = '#64748b';
        ctx2.font = 'bold 10.5px sans-serif';
        drawFittedText(
          ctx2,
          `Agg. Mese: ${row.lastMonthlyUpdateLabel}`,
          col1X,
          ry + 40,
          240
        );

        // Status badge
        ctx2.fillStyle = row.isLockedFixedRow ? '#475569' : '#047857';
        ctx2.font = '900 11.5px sans-serif';
        drawFittedText(
          ctx2,
          row.isLockedFixedRow
            ? 'RIGA FISSA CONSOLIDATA'
            : 'RIGA ATTIVA (IN CORSO)',
          col2X,
          ry + 22,
          186
        );
        ctx2.fillStyle = '#64748b';
        ctx2.font = '10.5px sans-serif';
        drawFittedText(
          ctx2,
          row.isLockedFixedRow
            ? `Fissata il ${row.lockedAtDate}`
            : 'Si aggiorna ogni 1° del mese',
          col2X,
          ry + 40,
          186
        );

        // Punto di partenza
        ctx2.fillStyle = '#334155';
        ctx2.font = 'bold 12px sans-serif';
        drawFittedText(
          ctx2,
          `IC ${row.startIc}/100 · IP ${row.startIp} · IA ${row.startIa}`,
          col3X,
          ry + 22,
          214
        );
        ctx2.fillStyle = '#64748b';
        ctx2.font = '10.5px sans-serif';
        drawFittedText(
          ctx2,
          `Liv. ${row.startLevel} (${row.startBand})`,
          col3X,
          ry + 40,
          214
        );

        // Valore attuale / finale
        ctx2.fillStyle = '#0f172a';
        ctx2.font = '900 12px sans-serif';
        drawFittedText(
          ctx2,
          `IC ${row.currentIc}/100 · IP ${row.currentIp} · IA ${row.currentIa}`,
          col4X,
          ry + 22,
          214
        );
        ctx2.fillStyle = '#047857';
        ctx2.font = 'bold 10.5px sans-serif';
        drawFittedText(
          ctx2,
          `Liv. ${row.currentLevel} (${row.currentBand})`,
          col4X,
          ry + 40,
          214
        );

        // Progresso ottenuto grazie all'App (Delta)
        const dIcSign = row.deltaIc >= 0 ? '+' : '';
        const dIpSign = row.deltaIp >= 0 ? '+' : '';
        ctx2.fillStyle = '#047857';
        ctx2.font = '900 12.5px sans-serif';
        drawFittedText(
          ctx2,
          `ΔIC ${dIcSign}${row.deltaIc} pt · ΔIP ${dIpSign}${row.deltaIp} pt`,
          col5X,
          ry + 22,
          168
        );
        ctx2.fillStyle = '#0f172a';
        ctx2.font = 'bold 10.5px sans-serif';
        drawFittedText(
          ctx2,
          `+${row.deltaLevels} Livelli superati`,
          col5X,
          ry + 40,
          168
        );
      });

      // Next Birthday Future Row Preview inside Section A
      const nextPreviewY = atY + 44 + visibleAnnualRows.length * 60;
      fillStrokeRoundRect(
        ctx2,
        atX,
        nextPreviewY,
        atW,
        42,
        10,
        '#f8fafc',
        '#94a3b8',
        1.2
      );
      ctx2.fillStyle = '#475569';
      ctx2.font = 'bold 11.5px sans-serif';
      drawFittedText(
        ctx2,
        `PROSSIMA NUOVA RIGA AUTOMATICA (${evalReport.childCurrentAgeYears + 1} Anni): Al compleanno del ${evalReport.nextBirthdayDateLabel}, la riga "${evalReport.childCurrentAgeYears} Anni" diventerà fissa e si aggiungerà la nuova riga.`,
        atX + 14,
        nextPreviewY + 26,
        atW - 28
      );

      // SECTION B: 3D ISOMETRIC VERTICAL COLUMN CHART
      const secBY = 164 + secAHeight + 18;
      const secBH = 970 - secBY;
      fillStrokeRoundRect(
        ctx2,
        48,
        secBY,
        1144,
        secBH,
        22,
        '#ffffff',
        '#cbd5e1',
        1.8
      );

      ctx2.fillStyle = '#0f172a';
      ctx2.font = '900 17px sans-serif';
      drawFittedText(
        ctx2,
        'ISTOGRAMMA ISOMETRICO 3D: COMPETENZA (IC) VS PRESTAZIONE (IP)',
        76,
        secBY + 34,
        640
      );

      // Clean non-overlapping Legend right-aligned on header row
      ctx2.fillStyle = '#7c3aed';
      ctx2.fillRect(748, secBY + 20, 15, 15);
      ctx2.fillStyle = '#0f172a';
      ctx2.font = 'bold 11.5px sans-serif';
      ctx2.fillText('Colonna 1: Competenza IC (0–100)', 770, secBY + 32);

      ctx2.fillStyle = '#0ea5e9';
      ctx2.fillRect(990, secBY + 20, 15, 15);
      ctx2.fillStyle = '#0f172a';
      ctx2.fillText('Colonna 2: Prestazione IP', 1012, secBY + 32);

      ctx2.fillStyle = '#64748b';
      ctx2.font = '11.5px sans-serif';
      ctx2.fillText(
        'Confronto per ciascuna materia tra competenza acquisita nel tempo (IC) e accuratezza ponderata al primo tentativo (IP).',
        76,
        secBY + 55
      );

      const cLeft = 110;
      const cBottom = secBY + secBH - 66;
      const cHeight = Math.max(195, secBH - 154);
      const cWidth = 1030;

      [0, 25, 50, 75, 100].forEach((val) => {
        const gy = cBottom - (cHeight * val) / 100;
        ctx2.beginPath();
        ctx2.moveTo(cLeft, gy);
        ctx2.lineTo(cLeft + cWidth, gy);
        ctx2.strokeStyle = val === 0 ? '#64748b' : '#e2e8f0';
        ctx2.lineWidth = val === 0 ? 2 : 1;
        ctx2.stroke();

        ctx2.fillStyle = '#64748b';
        ctx2.font = 'bold 11.5px sans-serif';
        ctx2.textAlign = 'right';
        ctx2.fillText(`${val}/100`, cLeft - 12, gy + 4);
        ctx2.textAlign = 'left';
      });

      const groupStep = cWidth / 6;
      domainMetrics.forEach((m, idx) => {
        const gx = cLeft + idx * groupStep + 28;
        const barW = 42;
        const hIc = (cHeight * m.ic) / 100;
        const hIp = (cHeight * m.ip) / 100;

        draw3DExtrudedColumn(
          ctx2,
          gx,
          cBottom,
          barW,
          hIc,
          13,
          m.hexColor,
          m.hexDark,
          m.hexTop
        );

        draw3DExtrudedColumn(
          ctx2,
          gx + barW + 18,
          cBottom,
          barW,
          hIp,
          13,
          '#0ea5e9',
          '#0369a1',
          '#38bdf8'
        );

        ctx2.fillStyle = m.hexDark;
        ctx2.font = '900 12.5px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText(
          `${m.ic}`,
          gx + barW / 2 + 5,
          cBottom - Math.max(8, hIc) - 14
        );

        ctx2.fillStyle = '#0369a1';
        ctx2.fillText(
          `${m.ip}`,
          gx + barW + 18 + barW / 2 + 5,
          cBottom - Math.max(8, hIp) - 14
        );

        ctx2.fillStyle = '#0f172a';
        ctx2.font = '900 12.5px sans-serif';
        ctx2.fillText(m.shortLabel, gx + barW + 9, cBottom + 24);

        ctx2.fillStyle = '#64748b';
        ctx2.font = 'bold 10.5px sans-serif';
        ctx2.fillText(
          `Auton.: ${m.correctFirstTry}/${m.completed}`,
          gx + barW + 9,
          cBottom + 42
        );
        ctx2.textAlign = 'left';
      });

      // SECTION C: PROSPETTO ANALITICO DEI 4 INDICATORI & 5 CRITERI DI STABILITÀ (y: 982, h: 688)
      fillStrokeRoundRect(
        ctx2,
        48,
        982,
        1144,
        688,
        22,
        '#ffffff',
        '#cbd5e1',
        1.8
      );

      ctx2.fillStyle = '#0f172a';
      ctx2.font = '900 18px sans-serif';
      ctx2.fillText(
        'PROSPETTO ANALITICO TRACCIABILE PER MATERIA (IP, IC, IA, IR, IT, EVOLUZIONE IE)',
        78,
        1016
      );

      const tX = 76;
      const tY = 1032;
      const tW = 1088;
      const tCol1 = tX + 26;
      const tCol2 = tX + 372;
      const tCol3 = tX + 518;
      const tCol4 = tX + 626;
      const tCol5 = tX + 732;
      const tCol6 = tX + 826;
      const tCol7 = tX + 948;

      fillStrokeRoundRect(ctx2, tX, tY, tW, 38, 10, '#1e293b');
      ctx2.fillStyle = '#ffffff';
      ctx2.font = 'bold 11.5px sans-serif';
      ctx2.fillText('MATERIA / AREA COGNITIVA', tX + 16, tY + 24);
      ctx2.fillText('AUTONOMI / ASSIST.', tCol2, tY + 24);
      ctx2.fillText('PREST. (IP)', tCol3, tY + 24);
      ctx2.fillText('AUTON. (IA)', tCol4, tY + 24);
      ctx2.fillText('IR / IT', tCol5, tY + 24);
      ctx2.fillText('COMPET. (IC)', tCol6, tY + 24);
      ctx2.fillText('LIVELLO ASSEGNATO', tCol7, tY + 24);

      domainMetrics.forEach((m, idx) => {
        const ry = tY + 46 + idx * 50;
        fillStrokeRoundRect(
          ctx2,
          tX,
          ry,
          tW,
          44,
          10,
          idx % 2 === 0 ? '#f8fafc' : '#f1f5f9',
          '#e2e8f0',
          1
        );

        ctx2.fillStyle = m.hexColor;
        ctx2.fillRect(tX + 12, ry + 10, 8, 24);

        ctx2.fillStyle = '#0f172a';
        ctx2.font = 'bold 12.5px sans-serif';
        drawFittedText(ctx2, m.clinicalName, tCol1, ry + 27, 336);

        ctx2.font = 'bold 12px sans-serif';
        ctx2.fillText(
          `${m.correctFirstTry} aut. · ${m.assistedCount} ass.`,
          tCol2,
          ry + 27
        );
        ctx2.fillText(`${m.ip}/100`, tCol3 + 6, ry + 27);
        ctx2.fillText(`${m.ia}/100`, tCol4 + 6, ry + 27);
        ctx2.fillText(`${m.ir} / ${m.it}`, tCol5, ry + 27);

        ctx2.fillStyle = m.hexDark;
        ctx2.font = '900 13.5px sans-serif';
        const dStr = m.ieDelta >= 0 ? `+${m.ieDelta}` : `${m.ieDelta}`;
        ctx2.fillText(`${m.ic}/100 (${dStr})`, tCol6, ry + 27);

        ctx2.fillStyle = '#334155';
        ctx2.font = 'bold 11px sans-serif';
        drawFittedText(ctx2, m.levelLabel, tCol7, ry + 27, 132);
      });

      // 5 STABILITY CRITERIA BOX AT BOTTOM OF PAGE 2
      const critBoxY = 1390;
      fillStrokeRoundRect(
        ctx2,
        76,
        critBoxY,
        1088,
        256,
        16,
        '#fdf4ff',
        '#c084fc',
        1.6
      );

      ctx2.fillStyle = '#4c1d95';
      ctx2.font = '900 15.5px sans-serif';
      drawFittedText(
        ctx2,
        'VERIFICA DEI 5 CRITERI DI STABILITÀ PER IL PASSAGGIO AL LIVELLO DI PADRONANZA SUCCESSIVO',
        96,
        critBoxY + 30,
        1048
      );
      ctx2.fillStyle = '#6b21a8';
      ctx2.font = 'bold 12px sans-serif';
      drawFittedText(ctx2, evalReport.stabilitySummaryNote, 96, critBoxY + 52, 1048);

      evalReport.stabilityCriteria.forEach((crit, i) => {
        const cy = critBoxY + 80 + i * 33;
        ctx2.fillStyle = crit.met ? '#059669' : '#d97706';
        ctx2.font = '900 12.5px sans-serif';
        ctx2.fillText(crit.met ? '✓ SODDISFATTO' : '• IN CORSO', 96, cy);

        ctx2.fillStyle = '#0f172a';
        ctx2.font = 'bold 12.5px sans-serif';
        drawFittedText(ctx2, crit.label, 232, cy, 380);

        ctx2.fillStyle = '#475569';
        ctx2.font = '12px sans-serif';
        drawFittedText(
          ctx2,
          `Obiettivo: ${crit.targetText}   |   Rilevato: ${crit.currentText}`,
          628,
          cy,
          518
        );
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
        `Documento Ufficiale Generato per ${fullChildNameUpper} (${bornLabel} ${ageInfo.birthDateFormatted}) · ${worldTitleFull} · Livello ${progress.currentLevel} · Pagina 2 di 2`,
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

      const safeFileName = fullChildName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Bimbo';
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relazione_Competenze_CHC_Progressi_${safeFileName}_Livello_${progress.currentLevel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const weightTiers = useMemo(
    () => [1, 2, 3, 4, 5].map((t) => getDifficultyWeightInfo(t, false)),
    []
  );

  return (
    <div className="safe-viewport-pad fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto">
      <div className="bg-slate-900/95 border border-white/12 rounded-3xl max-w-5xl xl:max-w-6xl w-full p-4 sm:p-6 lg:p-8 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] text-white my-auto max-h-[94dvh] overflow-y-auto">
        {/* MODERN TOP HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 sm:pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md border border-white/20 shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
                <span className="font-semibold text-indigo-300">
                  Valutazione Cognitiva CHC (0–100) · {ageInfo.ageBandTitle}
                </span>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="font-medium text-slate-300 inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" /> {bornLabel}{' '}
                  {ageInfo.birthDateFormatted} ({ageInfo.displayText})
                </span>
              </div>
              <h2 className="font-fun font-extrabold text-lg sm:text-2xl text-white mt-0.5 leading-snug">
                {worldTitleFull} — Dashboard Competenze & Progressi
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 font-fun font-bold text-xs sm:text-sm border border-indigo-300/35 cursor-pointer transition-colors whitespace-nowrap"
              >
                <UserRoundCog className="w-4 h-4 text-amber-300" />
                <span>Modifica Profilo & Foto</span>
              </button>
            )}

            <button
              onClick={handleDownloadPdfReport}
              disabled={isGeneratingPdf}
              className="toy-button-3d flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-fun font-bold text-xs sm:text-sm border border-emerald-300/60 shadow-md cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 stroke-[2.2]" />
              <span>
                {isGeneratingPdf
                  ? 'Generazione PDF...'
                  : `Scarica Report PDF (${fullChildName})`}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ZERO BASELINE NOTICE BANNER + AUDIO SETTINGS */}
        <div
          className={`mt-4 rounded-2xl p-4 border flex items-center justify-between gap-3 flex-wrap ${
            isMeasurementUnlocked
              ? 'bg-emerald-950/35 border-emerald-400/25 text-emerald-100'
              : 'bg-amber-950/35 border-amber-400/30 text-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {isMeasurementUnlocked ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {isMeasurementUnlocked
                  ? `Motore Diagnostico Multi-Parametro Attivo · Livello ${progress.currentLevel} (${evalReport.currentDifficultyLabel}, Peso w=${evalReport.currentWeight})`
                  : `Pronto alla Rilevazione Multi-Parametro (Completa il 1° esercizio per calcolare tutti gli indici)`}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {isMeasurementUnlocked
                  ? `Ogni esercizio completato (${completedLevelsCount} prove analizzate) misura simultaneamente abilità CHC primaria, secondaria e tempo di risposta (Gs), aggiornando in tempo reale IP, IC, IA, IE e lo storico mensile/annuale.`
                  : `I livelli includono test diagnostici multi-parametro che determinano fin dalla prima prova i 4 indicatori (IP, IC, IA, IE) e le 5 aree CHC.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateAudio(!progress.soundEnabled, progress.voiceEnabled)
              }
              className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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
              className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>🗣️ Voce {progress.voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* HERO REPORT PREVIEW: COMPETENZA GENERALE (XX/100) & EVOLUZIONE (+X)   */}
        {/* ===================================================================== */}
        <div className="my-5 bg-slate-950/60 rounded-2xl p-5 border border-white/10 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold text-indigo-300 block">
                Quadro Sintetico della Valutazione
              </span>
              <h3 className="font-fun font-extrabold text-lg sm:text-xl text-white mt-0.5">
                Profilo delle Competenze e delle Abilità (Scala 0–100)
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Valutazione interna tracciabile basata sulle risposte autonome al
                primo tentativo (<code className="text-pink-300">cᵢ = 1</code>)
                e separate dai successi ottenuti dopo un suggerimento (
                <code className="text-amber-300">
                  {evalReport.assistedTotal} assistiti
                </code>
                ). Non è un test di QI standardizzato.
              </p>
            </div>

            <div className="flex flex-wrap items-stretch gap-3 shrink-0 tabular-nums">
              {/* Competenza Generale Card */}
              <div className="bg-slate-900 border border-indigo-400/40 rounded-2xl px-5 py-3 text-center min-w-[155px]">
                <span className="text-[11px] font-semibold text-indigo-200 block">
                  Competenza generale
                </span>
                <span className="font-fun font-extrabold text-3xl text-white block leading-tight mt-0.5">
                  {evalReport.ic}<span className="text-lg text-slate-400">/100</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-300 block mt-1">
                  {evalReport.assignedBandLabel}
                </span>
              </div>

              {/* Evoluzione Card */}
              <div className="bg-slate-900 border border-emerald-400/40 rounded-2xl px-5 py-3 text-center min-w-[155px]">
                <span className="text-[11px] font-semibold text-emerald-200 block">
                  Evoluzione (IE)
                </span>
                <span className="font-fun font-extrabold text-3xl text-emerald-300 block leading-tight mt-0.5">
                  {evalReport.ieDelta >= 0
                    ? `+${evalReport.ieDelta}`
                    : evalReport.ieDelta}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block mt-1">
                  Rilevazione prec.: {evalReport.previousIc}/100
                </span>
              </div>
            </div>
          </div>

          {/* 1. I QUATTRO INDICATORI PRINCIPALI (0-100) */}
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-200 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" /> 1. I Quattro
              Indicatori Principali (0–100) & Formule Matematiche
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* IP: Indice di Prestazione */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-violet-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-violet-300">
                    Indice di prestazione (IP)
                  </span>
                  <span className="font-kids font-extrabold text-xl text-white">
                    {evalReport.ip}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${evalReport.ip}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/75 leading-snug">
                  Misura quanto correttamente {childName} risponde al 1° tentativo.
                </p>
                <p className="text-[10px] font-mono text-violet-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg">
                  IP = Σ(wᵢ·cᵢ)/Σwᵢ×100 = {evalReport.weightedCorrectSum}/
                  {evalReport.weightedTotalSum}
                </p>
              </div>

              {/* IC: Indice di Competenza */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-pink-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-pink-300">
                    Indice di competenza (IC)
                  </span>
                  <span className="font-kids font-extrabold text-xl text-white">
                    {evalReport.ic}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: `${evalReport.ic}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/75 leading-snug">
                  Misura quanto ha realmente acquisito l'abilità nel tempo.
                </p>
                <p className="text-[10px] font-mono text-pink-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg">
                  0,50·IP + 0,20·IA + 0,15·IR({evalReport.ir}) + 0,15·IT(
                  {evalReport.it})
                </p>
              </div>

              {/* IA: Indice di Autonomia */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-cyan-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-300">
                    Indice di autonomia (IA)
                  </span>
                  <span className="font-kids font-extrabold text-xl text-white">
                    {evalReport.ia}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${evalReport.ia}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/75 leading-snug">
                  Risoluzione senza aiuti o suggerimenti vocali.
                </p>
                <p className="text-[10px] font-mono text-cyan-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg">
                  Autonomi: {evalReport.autonomousTotal} · Assistiti:{' '}
                  {evalReport.assistedTotal}
                </p>
              </div>

              {/* IE: Indice di Evoluzione */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-emerald-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-300">
                    Indice di evoluzione (IE)
                  </span>
                  <span className="font-kids font-extrabold text-xl text-amber-300">
                    {evalReport.ieDelta >= 0
                      ? `+${evalReport.ieDelta}`
                      : evalReport.ieDelta}{' '}
                    <span className="text-xs text-white/70 font-normal">
                      ({evalReport.ieIndex}/100)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${evalReport.ieIndex}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/75 leading-snug">
                  Miglioramenti reali rispetto alle sessioni precedenti.
                </p>
                <p className="text-[10px] font-mono text-emerald-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg">
                  IE = IC_att({evalReport.ic}) - IC_prec({evalReport.previousIc})
                </p>
              </div>
            </div>
          </div>

          {/* PROFILO DELLE ABILITÀ (TEORIA CHC 0-100) */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-pink-400" /> Profilo delle
                Abilità Cognitive (Modello CHC 0–100)
              </p>
              <span className="text-[11px] text-white/60">
                5 aree cognitive valutate da 0 a 100 dalle attività pertinenti
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {evalReport.chcAbilities.map((ab) => (
                <div
                  key={ab.code}
                  className="bg-slate-950/90 rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white/10 text-white">
                        {ab.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-300">
                        {ab.ieDelta >= 0 ? `+${ab.ieDelta}` : ab.ieDelta} pt
                      </span>
                    </div>
                    <h4 className="font-kids font-bold text-sm text-white mt-2">
                      {ab.shortTitle}
                    </h4>
                    <p
                      className="font-kids font-extrabold text-2xl mt-0.5"
                      style={{ color: ab.colorHex }}
                    >
                      {ab.score}/100
                    </p>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${ab.score}%`,
                          backgroundColor: ab.colorHex,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-white/70 leading-snug">
                      {ab.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60">
                    <span>IP {ab.ip}/100</span>
                    <span>IA {ab.ia}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* FUNZIONE PROGRESSI OTTENUTI GRAZIE ALL'UTILIZZO DELL'APP              */}
        {/* - Aggiornamento ogni inizio mese (1° del mese)                        */}
        {/* - Confronto sempre visibile Punto di Partenza vs Stato Attuale        */}
        {/* - Ogni anno che compie la bambina (22/08) il dato diventa riga fissa  */}
        {/*   e se ne aggiunge una nuova di riga                                  */}
        {/* ===================================================================== */}
        <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/60 rounded-3xl p-5 border border-emerald-400/35 mb-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="font-kids font-extrabold text-sm sm:text-base uppercase tracking-wider text-emerald-300">
                  Progressi Ottenuti Grazie all’Utilizzo dell’App (Mensile &
                  Storico Annuale per Età)
                </h3>
              </div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                La funzione progressi si aggiorna automaticamente{' '}
                <strong className="text-amber-300">ogni inizio mese</strong> (
                {evalReport.currentMonthStartLabel}, prossimo aggiornamento:{' '}
                <strong className="text-cyan-300">
                  {evalReport.nextMonthlyUpdateLabel}
                </strong>
                ), mantiene sempre il confronto tra{' '}
                <strong className="text-white">Punto di Partenza</strong> e{' '}
                <strong className="text-emerald-300">Stato Attuale</strong>, e ad{' '}
                <strong className="text-pink-300">
                  ogni compleanno di {childName} ({evalReport.childBirthDayMonthLabel})
                </strong>{' '}
                consolida l’anno concluso in una{' '}
                <strong className="text-amber-300">riga fissa</strong>{' '}
                aggiungendo una{' '}
                <strong className="text-emerald-300">nuova riga</strong> per il
                nuovo anno d’età.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-emerald-400/30 shrink-0">
              <Clock className="w-4 h-4 text-amber-300" />
              <div className="text-[11px]">
                <span className="text-white/60 block">
                  Prossima Riga Fissa Compleanno:
                </span>
                <span className="font-bold text-amber-300">
                  {evalReport.nextBirthdayDateLabel}
                </span>
              </div>
            </div>
          </div>

          {/* CONFRONTO DIRETTO PUNTO DI PARTENZA VS ATTUALE (ANNO IN CORSO) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
            {/* Punto di Partenza */}
            <div className="bg-slate-950/75 rounded-2xl p-4 border border-white/15">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60 block">
                1. Punto di Partenza ({evalReport.activeAgeRow.ageLabel} ·{' '}
                {evalReport.activeAgeRow.startDate})
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-kids font-extrabold text-2xl text-white">
                  IC {evalReport.activeAgeRow.startIc}/100
                </span>
                <span className="text-xs font-bold text-white/70">
                  Livello {evalReport.activeAgeRow.startLevel}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-semibold mt-1">
                Fascia iniziale: {evalReport.activeAgeRow.startBand}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/65">
                <span>Prestazione IP: {evalReport.activeAgeRow.startIp}/100</span>
                <span>Autonomia IA: {evalReport.activeAgeRow.startIa}/100</span>
              </div>
            </div>

            {/* Stato Attuale (Inizio Mese Corrente) */}
            <div className="bg-slate-950/75 rounded-2xl p-4 border border-emerald-400/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                2. Valore Attuale ({evalReport.currentMonthStartLabel})
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-kids font-extrabold text-2xl text-emerald-300">
                  IC {evalReport.activeAgeRow.currentIc}/100
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Livello {evalReport.activeAgeRow.currentLevel}
                </span>
              </div>
              <p className="text-[11px] text-white font-semibold mt-1">
                Fascia attuale: {evalReport.activeAgeRow.currentBand}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/75">
                <span>
                  Prestazione IP: {evalReport.activeAgeRow.currentIp}/100
                </span>
                <span>
                  Autonomia IA: {evalReport.activeAgeRow.currentIa}/100
                </span>
              </div>
            </div>

            {/* Progresso Ottenuto Grazie all'App */}
            <div className="bg-gradient-to-br from-emerald-900/60 to-teal-950/80 rounded-2xl p-4 border-2 border-emerald-400/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">
                3. Progresso Ottenuto Grazie all’App (Δ Attuale vs Partenza)
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-kids font-extrabold text-2xl text-yellow-300">
                  {evalReport.activeAgeRow.deltaIc >= 0
                    ? `+${evalReport.activeAgeRow.deltaIc}`
                    : evalReport.activeAgeRow.deltaIc}{' '}
                  pt IC
                </span>
                <span className="text-xs font-black text-emerald-200">
                  +{evalReport.activeAgeRow.deltaLevels} Livelli
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-semibold mt-1">
                Crescita misurata nell'anno dei{' '}
                {evalReport.activeAgeRow.ageLabel}
              </p>
              <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100">
                <span>
                  Δ Prestazione:{' '}
                  {evalReport.activeAgeRow.deltaIp >= 0
                    ? `+${evalReport.activeAgeRow.deltaIp}`
                    : evalReport.activeAgeRow.deltaIp}{' '}
                  pt
                </span>
                <span>
                  Δ Autonomia:{' '}
                  {evalReport.activeAgeRow.deltaIa >= 0
                    ? `+${evalReport.activeAgeRow.deltaIa}`
                    : evalReport.activeAgeRow.deltaIa}{' '}
                  pt
                </span>
              </div>
            </div>
          </div>

          {/* TABELLA STORICA ANNUALE PER ETÀ (RIGHE FISSE + RIGA ATTIVA + PROSSIMO COMPLEANNO) */}
          <div className="overflow-x-auto rounded-2xl border border-white/15 bg-slate-950/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-950/90 text-emerald-200 border-b border-white/15 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 font-extrabold">
                    Anno d’Età di {childName}
                  </th>
                  <th className="py-3 px-3 font-extrabold">Stato Riga</th>
                  <th className="py-3 px-3 font-extrabold">
                    Punto di Partenza
                  </th>
                  <th className="py-3 px-3 font-extrabold">
                    Valore Attuale / Consolidato
                  </th>
                  <th className="py-3 px-3.5 font-extrabold">
                    Progresso Grazie all’App (Δ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {evalReport.annualProgressRows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.isLockedFixedRow
                        ? 'bg-slate-900/70 text-white/85'
                        : 'bg-emerald-950/35 text-white font-semibold'
                    }
                  >
                    <td className="py-3 px-3.5">
                      <div className="font-kids font-extrabold text-sm text-white flex items-center gap-1.5">
                        <span>{row.ageLabel}</span>
                        <span className="text-[11px] font-sans font-normal text-white/60">
                          ({row.periodLabel})
                        </span>
                      </div>
                      <div className="text-[10px] text-white/60 mt-0.5">
                        Ultimo agg. inizio mese: {row.lastMonthlyUpdateLabel}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {row.isLockedFixedRow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[11px] font-bold text-amber-200">
                          <Lock className="w-3 h-3 text-amber-300" /> Riga Fissa
                          Consolidata ({row.lockedAtDate})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-extrabold text-emerald-300">
                          <Sparkles className="w-3 h-3 text-yellow-300" /> Riga
                          Attiva (Agg. Inizio Mese)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-white">
                        IC {row.startIc}/100 · IP {row.startIp}/100 · IA{' '}
                        {row.startIa}/100
                      </div>
                      <div className="text-[11px] text-white/60">
                        Liv. {row.startLevel} ({row.startBand}) · {row.startDate}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-emerald-300">
                        IC {row.currentIc}/100 · IP {row.currentIp}/100 · IA{' '}
                        {row.currentIa}/100
                      </div>
                      <div className="text-[11px] text-white/75">
                        Liv. {row.currentLevel} ({row.currentBand}) ·{' '}
                        {row.currentDate}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-kids font-extrabold text-sm text-yellow-300">
                        ΔIC {row.deltaIc >= 0 ? `+${row.deltaIc}` : row.deltaIc}{' '}
                        pt · ΔIP{' '}
                        {row.deltaIp >= 0 ? `+${row.deltaIp}` : row.deltaIp} pt
                      </div>
                      <div className="text-[11px] text-emerald-200">
                        +{row.deltaLevels} livelli · ΔIA{' '}
                        {row.deltaIa >= 0 ? `+${row.deltaIa}` : row.deltaIa} pt
                      </div>
                    </td>
                  </tr>
                ))}

                {/* PREVIEW OF NEXT AUTOMATIC BIRTHDAY ROW */}
                <tr className="bg-slate-950/60 text-white/55 italic">
                  <td className="py-2.5 px-3.5 font-bold text-amber-200/80">
                    {evalReport.childCurrentAgeYears + 1} Anni (Dal{' '}
                    {evalReport.childBirthDayMonthLabel}/{evalReport.nextBirthdayYear})
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                      Nuova Riga Automatica al Compleanno
                    </span>
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-[11px]">
                    Al compimento dei {evalReport.childCurrentAgeYears + 1} anni (
                    {evalReport.nextBirthdayDateLabel}), la riga dei{' '}
                    {evalReport.childCurrentAgeYears} Anni diventerà una{' '}
                    <strong className="text-white/80">riga fissa</strong> e si
                    aggiungerà automaticamente questa nuova riga.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RILEVAZIONI DI INIZIO MESE DELL'ANNO IN CORSO */}
          {evalReport.activeAgeRow.monthlyCheckpoints.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-2">
                Storico Rilevazioni di Inizio Mese (Anno in Corso —{' '}
                {evalReport.activeAgeRow.ageLabel}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {evalReport.activeAgeRow.monthlyCheckpoints.map((cp) => (
                  <div
                    key={cp.monthKey}
                    className="bg-slate-950/75 rounded-xl px-3 py-2 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-300 block">
                        🗓️ {cp.monthLabel}
                      </span>
                      <span className="text-[10px] text-white/60">
                        Livello {cp.levelReached} · IP {cp.ip}/100 · IA {cp.ia}
                        /100
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-kids font-extrabold text-sm text-white block">
                        IC {cp.ic}/100
                      </span>
                      <span className="text-[10px] font-bold text-emerald-300">
                        {cp.ieDeltaFromStart >= 0
                          ? `+${cp.ieDeltaFromStart}`
                          : cp.ieDeltaFromStart}{' '}
                        pt da inizio anno
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* CRITERI DI ASSEGNAZIONE DEI LIVELLI & PESI DI DIFFICOLTÀ              */}
        {/* ===================================================================== */}
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
            <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-amber-300">
              3. Criteri di Stabilità per il Passaggio di Livello & Pesi di
              Difficoltà
            </h3>
          </div>

          <p className="text-xs text-white/80 mb-4">{evalReport.stabilitySummaryNote}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 5 Stability Criteria Checklist */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-white/10 space-y-2.5">
              <p className="text-xs font-extrabold text-pink-300 uppercase tracking-wider">
                Regole di Stabilità per Passare al Livello Successivo:
              </p>
              {evalReport.stabilityCriteria.map((crit) => (
                <div
                  key={crit.id}
                  className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-white/5 last:border-none"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                        crit.met
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {crit.met ? '✓' : '•'}
                    </span>
                    <span className="font-semibold text-white/90">
                      {crit.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-200 shrink-0">
                    {crit.currentText}
                  </span>
                </div>
              ))}
            </div>

            {/* Difficulty Weights & Competency Bands Table */}
            <div className="space-y-3">
              <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-white/10">
                <p className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Pesi degli Esercizi in
                  Funzione della Difficoltà (wᵢ)
                </p>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                  {weightTiers.map((wt) => (
                    <div
                      key={wt.tier}
                      className={`rounded-xl p-2 border ${
                        wt.tier === currentTier
                          ? 'bg-purple-900/60 border-amber-300 text-white'
                          : 'bg-white/5 border-white/10 text-white/75'
                      }`}
                    >
                      <span className="font-bold block truncate">
                        {wt.label}
                      </span>
                      <span className="font-kids font-extrabold text-sm text-amber-300">
                        w = {wt.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-white/10">
                <p className="text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2">
                  Fasce dell’Indice di Competenza (IC 0–100)
                </p>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                  {[
                    { range: '0–39', label: 'In esplorazione' },
                    { range: '40–59', label: 'In apprendimento' },
                    { range: '60–74', label: 'In consolidamento' },
                    { range: '75–89', label: 'Acquisito' },
                    { range: '90–100', label: 'Padronanza avanz.' },
                  ].map((b) => (
                    <div
                      key={b.range}
                      className="rounded-xl p-1.5 bg-white/5 border border-white/10"
                    >
                      <span className="font-extrabold text-amber-300 block">
                        {b.range}
                      </span>
                      <span className="text-white/80 block leading-tight mt-0.5">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 4: ANALISI GRAFICA MULTIDIMENSIONALE (RADAR + BARRE 0-100)    */}
        {/* ===================================================================== */}
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-400" />
              <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-pink-300">
                4. Analisi Grafica 3D delle 6 Materie (Indice di Competenza
                0–100)
              </h3>
            </div>
            <span className="text-xs text-white/60">
              {isMeasurementUnlocked
                ? `Profilo Multi-Parametro di ${childName} al Livello ${progress.currentLevel}`
                : 'Completa il 1° livello per visualizzare la mappa radar multi-parametro'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Hexagonal Radar Chart */}
            <div className="flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-bold text-white/80 mb-2">
                Mappa Radar Globale (Indice IC 0–100)
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
                      {c.shortLabel} ({c.ic}/100)
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
                      {m.ic}/100{' '}
                      <span className="text-white/60 font-normal">
                        (IP {m.ip} · IA {m.ia})
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.barColor} transition-all duration-500`}
                      style={{ width: `${m.ic}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 5: RELAZIONE PEDAGOGICA STRUTTURATA PER AMBITO                */}
        {/* ===================================================================== */}
        <div className="space-y-3.5 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-300" />
            <h3 className="font-kids font-bold text-sm uppercase tracking-wider text-amber-300">
              5. Relazione Pedagogica Dettagliata per Materia — Livello{' '}
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
                          {m.levelLabel} · Competenza IC {m.ic}/100 (Evoluzione{' '}
                          {m.ieDelta >= 0 ? `+${m.ieDelta}` : m.ieDelta})
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/70 font-semibold mt-1">
                    <strong className="text-white">Traguardo:</strong>{' '}
                    {m.milestoneGoal}
                  </p>
                  <p className="text-xs text-white/85 leading-relaxed mt-1.5">
                    <strong className="text-pink-300">
                      Analisi Tracciabile:
                    </strong>{' '}
                    {m.pedagogicalNote}
                  </p>
                  <p className="text-[11px] text-amber-200/90 italic mt-1.5">
                    <strong>Consiglio Famiglia:</strong> {m.familyAdvice}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                  <span>
                    Autonomi: {m.correctFirstTry}/{m.completed}
                  </span>
                  <span>Assistiti: {m.assistedCount}</span>
                  <span>
                    IP {m.ip}/100 · IA {m.ia}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: CONSIGLI EDUCATIVI */}
        <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-pink-950/60 rounded-2xl p-5 border border-white/15 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HeartHandshake className="w-5 h-5 text-pink-300" />
            <h3 className="font-kids font-bold text-sm uppercase tracking-wider text-pink-200">
              6. Indicazioni Educative per Accompagnare {childName} ({ageInfo.shortAgeLabel})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/85 leading-relaxed">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Ragionamento Fluido (Gf)
              </p>
              Chiedere a {childName} di spiegare ad alta voce perché ha scelto un
              determinato simbolo nella sequenza logica rinforza la
              metacognizione e il trasferimento (IT).
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-pink-300 mb-1 flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> Memoria di Lavoro (Gwm)
              </p>
              Battere le mani seguendo il ritmo delle note ascoltate nell'app
              consolida la memoria di lavoro uditiva e la ritenzione nel tempo
              (IR).
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Linguaggio & Inglese (Gc)
              </p>
              Ripetere insieme nella vita quotidiana le paroline inglesi
              imparate (es. Red, Dog, Sun, Apple) favorisce l'autonomia (IA)
              senza bisogno di suggerimenti.
            </div>
          </div>
        </div>

        {/* SECTION 7: CRITERI DI SICUREZZA, PRIVACY MINORI & INTEGRITÀ DATI */}
        <div className="bg-slate-950/85 rounded-3xl p-5 border border-emerald-400/35 mb-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-emerald-300">
                7. Criteri di Sicurezza, Privacy Minori (GDPR-K) & Integrità
                Psicometrica
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-extrabold text-emerald-300">
              ✓ 6/6 Criteri Verificati · Hash {securityCriteria.integrityHash}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {securityCriteria.criteria.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {item.code}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      ✓ {item.statusLabel}
                    </span>
                  </div>
                  <h4 className="font-kids font-bold text-xs sm:text-sm text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-white/75 leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PARENTAL SECURITY GATE FOR RESETTING PROGRESS */}
        {showResetGate && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-400/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-rose-100">
              <p className="font-kids font-bold text-sm text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-300" /> Filtro di Sicurezza
                Genitori (Anti-Cancellazione Accidentale)
              </p>
              <p className="mt-0.5 text-rose-200">
                Per confermare l’azzeramento dei progressi, scrivi il risultato
                di <strong className="text-yellow-300">7 + 5</strong>:
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <input
                type="number"
                inputMode="numeric"
                value={gateInput}
                onChange={(e) => {
                  setGateInput(e.target.value);
                  setGateError(false);
                }}
                placeholder="7 + 5 = ?"
                className={`w-24 px-3 py-2 rounded-xl bg-slate-950 text-white font-bold text-sm border ${
                  gateError ? 'border-rose-400' : 'border-white/25'
                } focus:outline-none`}
              />
              <button
                onClick={() => {
                  if (gateInput.trim() === '12') {
                    setShowResetGate(false);
                    setGateInput('');
                    setGateError(false);
                    onResetProgress();
                  } else {
                    setGateError(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Conferma Reset
              </button>
              <button
                onClick={() => {
                  setShowResetGate(false);
                  setGateInput('');
                  setGateError(false);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowResetGate(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors px-3 py-2 rounded-xl hover:bg-rose-500/10 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Azzera Percorso e Statistiche
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
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
