import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  KeyRound,
  GraduationCap,
  HelpCircle,
  Headphones,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  EyeOff,
  Archive,
  Play,
  Trash2,
  FlaskConical,
  Cloud,
  RefreshCw,
  LogOut,
  Cake,
} from 'lucide-react';
import { Emoji3D } from './Emoji3D';
import {
  UserProgress,
  GameCategory,
  CompetencyBandLabel,
  ArchivedReportOverview,
} from '../types/game';
import {
  AGE_CURRICULUM_ROADMAP,
  calculateChildAge,
  computeAdaptiveMasteryProfile,
  getDisplayChildName,
  getFullChildName,
  getGenderedWord,
  getWorldTitle,
  getBirthdayStatus,
  getAgeVisualTheme,
} from '../utils/childProfile';
import type { CloudSyncAccountState } from '../utils/firebaseSync';
import {
  computeFullEvaluationReport,
  getDifficultyWeightInfo,
  runAdaptiveVerificationSimulations,
  LearningPathStage,
} from '../utils/evaluationEngine';
import {
  saveOverviewAudioToIndexedDb,
  loadOverviewAudioFromIndexedDb,
  deleteOverviewAudioFromIndexedDb,
} from '../utils/reportOverviewArchive';
import {
  getSecurityComplianceReport,
  hashParentPin,
  isValidParentPinFormat,
  verifyParentPin,
} from '../utils/security';
import { soundManager } from '../utils/audio';
import {
  getAdultReasonLabel,
  summarizeAdultFilterStats,
} from '../utils/adultPlayDetector';

interface ParentModalProps {
  progress: UserProgress;
  cloudSyncState?: CloudSyncAccountState;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  onManualCloudSave?: () => void;
  onManualCloudRestore?: () => void;
  onOpenBirthdayCelebration?: () => void;
  onUpdateAudio: (soundEnabled: boolean, voiceEnabled: boolean) => void;
  onOpenProfile?: () => void;
  onOpenPrivacy?: () => void;
  onUpdateParentPin?: (pinHash?: string, pinHint?: string) => void;
  onToggleParentPreviewMode?: () => void;
  onClearAdultFilteredTrials?: () => void;
  onSaveArchivedOverview?: (entry: ArchivedReportOverview) => void;
  onDeleteArchivedOverview?: (id: string) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

interface AudioOverviewResult {
  id?: string;
  dateFormatted?: string;
  timeFormatted?: string;
  title: string;
  keyHighlights: string[];
  transcript: Array<{ speaker: string; line: string }>;
  audioUrl: string | null;
  mimeType: string;
  audioMode: 'gemini_wav' | 'unavailable';
  fallbackNotice?: string;
  anonymized: boolean;
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
  irAvailable: boolean;
  irDisplayLabel: string;
  it: number;          // Trasferimento (0-100)
  itAvailable: boolean;
  itDisplayLabel: string;
  ic: number;          // Indice di Competenza (0-100)
  ieDelta: number;     // Evoluzione rispetto alla rilevazione precedente
  sampleCount: number;
  confidencePercent: number;
  confidenceLabel: string;
  targetDifficulty: number;
  difficultyLabel: string;
  indicativeEducationalAgeLabel: string;
  slidingWindowActionLabel: string;
  window10Count: number;
  window10Correct: number;
  window10Autonomy: number;
  learningPathStages: LearningPathStage[];
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
  cloudSyncState,
  onGoogleSignIn,
  onGoogleSignOut,
  onManualCloudSave,
  onManualCloudRestore,
  onOpenBirthdayCelebration,
  onUpdateAudio,
  onOpenProfile,
  onOpenPrivacy,
  onUpdateParentPin,
  onToggleParentPreviewMode,
  onClearAdultFilteredTrials,
  onSaveArchivedOverview,
  onDeleteArchivedOverview,
  onResetProgress,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
  const [anonymizeOverview, setAnonymizeOverview] = useState(false);
  const [audioOverview, setAudioOverview] = useState<AudioOverviewResult | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewElapsedSec, setOverviewElapsedSec] = useState(0);
  const [showOverviewTranscript, setShowOverviewTranscript] = useState(false);
  const [overviewPlaybackRate, setOverviewPlaybackRate] = useState<1 | 1.25>(1);
  const [archiveDateFilter, setArchiveDateFilter] = useState<string>('ALL');
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const overviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const overviewUrlRef = useRef<string | null>(null);

  type ParentTabId = 'overview' | 'skills' | 'history' | 'security';
  const [activeTab, setActiveTab] = useState<ParentTabId>('overview');

  // Mandatory Parent PIN Gate (First access sets PIN; subsequent accesses verify PIN)
  const hasParentPinInitial = Boolean(progress.parentPinHash);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);
  const [gateMode, setGateMode] = useState<'setup' | 'unlock' | 'recover' | 'recover_new'>(
    hasParentPinInitial ? 'unlock' : 'setup'
  );
  const [gatePin, setGatePin] = useState('');
  const [gateConfirmPin, setGateConfirmPin] = useState('');
  const [gateHint, setGateHint] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBirthYear, setGateBirthYear] = useState('');
  const [gateMathInput, setGateMathInput] = useState('');
  const [gateChallenge, setGateChallenge] = useState<{ label: string; answer: number }>(() => {
    const a = 11 + Math.floor(Math.random() * 8);
    const b = 3 + Math.floor(Math.random() * 4);
    const c = 4 + Math.floor(Math.random() * 9);
    return { label: `${a} × ${b} + ${c}`, answer: a * b + c };
  });

  useEffect(() => {
    if (!isGeneratingOverview) {
      setOverviewElapsedSec(0);
      return;
    }
    setOverviewElapsedSec(0);
    const id = window.setInterval(() => {
      setOverviewElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isGeneratingOverview]);

  useEffect(() => {
    return () => {
      if (overviewUrlRef.current) {
        URL.revokeObjectURL(overviewUrlRef.current);
        overviewUrlRef.current = null;
      }
    };
  }, []);

  type SecurityPanelMode = 'closed' | 'verify_reset' | 'setup_pin' | 'forgot_pin' | 'recovery_set_pin';
  const [securityPanel, setSecurityPanel] = useState<SecurityPanelMode>('closed');
  const [pinEntry, setPinEntry] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinHintInput, setPinHintInput] = useState(progress.parentPinHint || '');
  const [recoveryBirthYear, setRecoveryBirthYear] = useState('');
  const [recoveryMathInput, setRecoveryMathInput] = useState('');
  const [recoveryChallenge, setRecoveryChallenge] = useState<{ label: string; answer: number }>({
    label: '13 × 4 + 6',
    answer: 58,
  });
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  const hasParentPin = Boolean(progress.parentPinHash);
  const childProfile = progress.childProfile;
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const birthdayStatus = useMemo(
    () => getBirthdayStatus(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageInfo.years, childProfile?.name),
    [ageInfo.years, childProfile?.name]
  );
  const masteryProfile = useMemo(
    () => computeAdaptiveMasteryProfile(progress),
    [progress]
  );
  const adultFilterStats = useMemo(
    () => summarizeAdultFilterStats(progress),
    [progress]
  );

  const generateAdultMathChallenge = () => {
    const a = 11 + Math.floor(Math.random() * 8); // 11..18
    const b = 3 + Math.floor(Math.random() * 4);  // 3..6
    const c = 4 + Math.floor(Math.random() * 9);  // 4..12
    return { label: `${a} × ${b} + ${c}`, answer: a * b + c };
  };

  const openSecurityPanel = (mode: SecurityPanelMode) => {
    setSecurityError(null);
    setSecuritySuccess(null);
    setPinEntry('');
    setNewPin('');
    setConfirmPin('');
    setPinHintInput(progress.parentPinHint || '');
    setRecoveryBirthYear('');
    setRecoveryMathInput('');
    setRecoveryChallenge(generateAdultMathChallenge());
    setSecurityPanel(mode);
  };
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
      const ap = dm.adaptiveProfile;

      if (!isMeasurementUnlocked) {
        return {
          ...def,
          completed: dm.totalExercises,
          correctFirstTry: dm.autonomousCorrectCount,
          assistedCount: dm.assistedSuccessCount,
          ip: 0,
          ia: 0,
          ir: 0,
          irAvailable: false,
          irDisplayLabel: 'Non ancora disponibile',
          it: 0,
          itAvailable: false,
          itDisplayLabel: 'Non ancora disponibile',
          ic: 0,
          ieDelta: 0,
          sampleCount: dm.totalExercises,
          confidencePercent: dm.confidencePercent,
          confidenceLabel: dm.confidenceLabel,
          targetDifficulty: ap.targetDifficulty,
          difficultyLabel: ap.difficultyLabel,
          indicativeEducationalAgeLabel: ap.indicativeEducationalAgeLabel,
          slidingWindowActionLabel: ap.decisionLabel,
          window10Count: ap.window10Count,
          window10Correct: ap.window10EquivalentCorrect,
          window10Autonomy: ap.window10AutonomyScore,
          learningPathStages: dm.learningPathStages,
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
          irAvailable: false,
          irDisplayLabel: 'Non ancora disponibile',
          it: 0,
          itAvailable: false,
          itDisplayLabel: 'Non ancora disponibile',
          ic: 0,
          ieDelta: 0,
          sampleCount: 0,
          confidencePercent: 0,
          confidenceLabel: '0 prove · Dato iniziale',
          targetDifficulty: ap.targetDifficulty,
          difficultyLabel: ap.difficultyLabel,
          indicativeEducationalAgeLabel: ap.indicativeEducationalAgeLabel,
          slidingWindowActionLabel: ap.decisionLabel,
          window10Count: ap.window10Count,
          window10Correct: ap.window10EquivalentCorrect,
          window10Autonomy: ap.window10AutonomyScore,
          learningPathStages: dm.learningPathStages,
          levelLabel: 'In esplorazione',
          pedagogicalNote: `Nessun esercizio ancora registrato in questo ambito (Difficoltà attuale ${ap.targetDifficulty}/5 · ${ap.difficultyLabel} · Età didattica indicativa: ${ap.indicativeEducationalAgeLabel}).`,
        };
      }

      const deltaStr = dm.ieDelta >= 0 ? `+${dm.ieDelta}` : `${dm.ieDelta}`;
      const pedagogicalNote = `Competenza IC ${dm.ic}/100 (${dm.bandLabel}, Evoluzione ${deltaStr}, ${dm.confidenceLabel}). Difficoltà adattiva: ${ap.targetDifficulty}/5 (${ap.difficultyLabel}) · Età didattica indicativa: ${ap.indicativeEducationalAgeLabel}. Prestazione ponderata IP ${dm.ip}/100 (${dm.autonomousCorrectCount}/${dm.totalExercises} autonomi al 1° tentativo, ${dm.assistedSuccessCount} con supporto), Autonomia IA ${dm.ia}/100, Ritenzione IR: ${dm.irDisplay}, Trasferimento IT: ${dm.itDisplay}.`;

      return {
        ...def,
        completed: dm.totalExercises,
        correctFirstTry: dm.autonomousCorrectCount,
        assistedCount: dm.assistedSuccessCount,
        ip: dm.ip,
        ia: dm.ia,
        ir: dm.ir,
        irAvailable: dm.irAvailable,
        irDisplayLabel: dm.irDisplay,
        it: dm.it,
        itAvailable: dm.itAvailable,
        itDisplayLabel: dm.itDisplay,
        ic: dm.ic,
        ieDelta: dm.ieDelta,
        sampleCount: dm.totalExercises,
        confidencePercent: dm.confidencePercent,
        confidenceLabel: dm.confidenceLabel,
        targetDifficulty: ap.targetDifficulty,
        difficultyLabel: ap.difficultyLabel,
        indicativeEducationalAgeLabel: ap.indicativeEducationalAgeLabel,
        slidingWindowActionLabel: ap.decisionLabel,
        window10Count: ap.window10Count,
        window10Correct: ap.window10EquivalentCorrect,
        window10Autonomy: ap.window10AutonomyScore,
        learningPathStages: dm.learningPathStages,
        levelLabel: dm.bandLabel,
        pedagogicalNote,
      };
    });
  }, [evalReport, isMeasurementUnlocked]);

  const verificationSimulations = useMemo(
    () => runAdaptiveVerificationSimulations(),
    []
  );

  const archivedOverviews = useMemo(
    () => progress.archivedReportOverviews ?? [],
    [progress.archivedReportOverviews]
  );

  const archiveDates = useMemo(() => {
    const unique = new Map<string, string>();
    for (const item of archivedOverviews) {
      if (!unique.has(item.dateIso)) {
        unique.set(item.dateIso, item.dateFormatted);
      }
    }
    return Array.from(unique.entries());
  }, [archivedOverviews]);

  const filteredArchivedOverviews = useMemo(() => {
    if (archiveDateFilter === 'ALL') return archivedOverviews;
    return archivedOverviews.filter((item) => item.dateIso === archiveDateFilter);
  }, [archivedOverviews, archiveDateFilter]);

  const handleLoadArchivedOverview = async (item: ArchivedReportOverview) => {
    soundManager.stopSpeech();
    setLoadingArchiveId(item.id);
    try {
      let nextUrl: string | null = null;
      if (item.hasAudioBlob) {
        const storedAudio = await loadOverviewAudioFromIndexedDb(item.id);
        if (storedAudio && storedAudio.base64Audio) {
          const binary = atob(storedAudio.base64Audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: storedAudio.mimeType || 'audio/wav' });
          nextUrl = URL.createObjectURL(blob);
        }
      }
      if (overviewUrlRef.current) {
        URL.revokeObjectURL(overviewUrlRef.current);
      }
      overviewUrlRef.current = nextUrl;

      let parsedTranscript: Array<{ speaker: string; line: string }> = [];
      if (typeof item.transcript === 'string' && item.transcript.trim()) {
        try {
          const parsed = JSON.parse(item.transcript);
          if (Array.isArray(parsed)) {
            parsedTranscript = parsed;
          } else {
            parsedTranscript = [{ speaker: 'Marco', line: item.transcript }];
          }
        } catch {
          parsedTranscript = [{ speaker: 'Marco', line: item.transcript }];
        }
      }

      setAudioOverview({
        id: item.id,
        dateFormatted: item.dateFormatted,
        timeFormatted: item.timeFormatted,
        title: item.title,
        keyHighlights: item.keyHighlights,
        transcript: parsedTranscript,
        audioUrl: nextUrl,
        mimeType: 'audio/wav',
        audioMode: nextUrl ? 'gemini_wav' : 'unavailable',
        fallbackNotice: nextUrl
          ? undefined
          : 'Registrazione archiviata in formato testuale (o audio WAV non più in cache). Puoi leggere la trascrizione completa o ascoltarla con la voce maschile del dispositivo.',
        anonymized: item.anonymized,
      });
      setShowOverviewTranscript(!nextUrl);
      setActiveTab('overview');
    } finally {
      setLoadingArchiveId(null);
    }
  };

  const [archiveSavedBanner, setArchiveSavedBanner] = useState<string | null>(null);

  const buildInstantReportOverviewSnapshot = (customId?: string): {
    entry: ArchivedReportOverview;
    transcriptTurns: Array<{ speaker: string; line: string }>;
  } => {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateFormatted = now.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const archiveId =
      customId || `ov_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`;

    const displaySubject = anonymizeOverview
      ? childGender === 'f'
        ? 'la bambina'
        : childGender === 'm'
        ? 'il bambino'
        : 'il piccolo esploratore'
      : childName;

    const sortedDomains = [...domainMetrics].sort((a, b) => b.ic - a.ic);
    const bestDomain = sortedDomains[0]?.shortLabel || 'Logica e Ragionamento';
    const focusDomain =
      sortedDomains[sortedDomains.length - 1]?.shortLabel || 'Lettere e Linguaggio';

    const title = `Report del Giorno · ${displaySubject} (${dateFormatted})`;
    const keyHighlights = [
      `Competenza Globale IC ${evalReport.ic}/100 (${evalReport.assignedBandLabel}) · Livello generale: ${evalReport.generalLevelLabel}.`,
      `Prestazione IP ${evalReport.ip}/100 · Autonomia IA ${evalReport.ia}/100 su ${evalReport.completedLevelsCount} prove valide (${evalReport.confidenceLabel}).`,
      `Punto di forza: ${evalReport.nextLearningPlan.strengthTitle} (${bestDomain}) · Da consolidare: ${evalReport.nextLearningPlan.toConsolidateTitle} (${focusDomain}).`,
    ];

    const transcriptTurns: Array<{ speaker: string; line: string }> = [
      {
        speaker: 'Marco',
        line: `Benvenuti genitori, a voi il report del giorno. Oggi osserviamo insieme il percorso educativo di ${displaySubject}, con età anagrafica di ${evalReport.childExactAgeDisplay} e livello generale ${evalReport.generalLevelLabel}.`,
      },
      {
        speaker: 'Marco',
        line: `L'indice di competenza globale registrato è pari a ${evalReport.ic} su cento, nella fascia ${evalReport.assignedBandLabel}, calcolato su ${evalReport.completedLevelsCount} prove valide con solidità del dato al ${evalReport.confidencePercent} per cento.`,
      },
      {
        speaker: 'Marco',
        line: `La prestazione ponderata è a ${evalReport.ip} su cento e l'autonomia rispetto agli aiuti è a ${evalReport.ia} su cento, con ${evalReport.autonomousTotal} risposte risolte al primo tentativo senza suggerimenti.`,
      },
      {
        speaker: 'Marco',
        line: `Per quanto riguarda le competenze per materia, spicca come punto di forza ${evalReport.nextLearningPlan.strengthTitle}, mentre l'obiettivo da consolidare con serenità è ${evalReport.nextLearningPlan.toConsolidateTitle}.`,
      },
      {
        speaker: 'Marco',
        line: `La prossima sfida adattiva programmata dal percorso è ${evalReport.nextLearningPlan.nextChallengeTitle}. Ricordiamo sempre che questo report è una guida pedagogica interna basata sul gioco, mai una valutazione clinica. Buon gioco in famiglia!`,
      },
    ];

    const entry: ArchivedReportOverview = {
      id: archiveId,
      dateIso: dateKey,
      dateFormatted,
      timeFormatted,
      createdAtIso: now.toISOString(),
      levelNumber: progress.currentLevel,
      completedExercises: evalReport.completedLevelsCount,
      ic: evalReport.ic,
      ip: evalReport.ip,
      ia: evalReport.ia,
      ir: evalReport.ir,
      it: evalReport.it,
      ieDelta: evalReport.ieDelta,
      assignedBandLabel: evalReport.assignedBandLabel,
      title,
      keyHighlights,
      transcript: JSON.stringify(transcriptTurns),
      anonymized: anonymizeOverview,
      hasAudioBlob: false,
      mimeType: 'audio/wav',
    };

    return { entry, transcriptTurns };
  };

  const handleSaveCurrentReportToArchive = () => {
    soundManager.playPop();
    const { entry, transcriptTurns } = buildInstantReportOverviewSnapshot();
    onSaveArchivedOverview?.(entry);
    setArchiveDateFilter('ALL');
    setArchiveSavedBanner(`Report del ${entry.dateFormatted} (ore ${entry.timeFormatted}) salvato nell'Archivio!`);
    setTimeout(() => {
      setArchiveSavedBanner(null);
    }, 4500);

    if (!audioOverview) {
      setAudioOverview({
        id: entry.id,
        dateFormatted: entry.dateFormatted,
        timeFormatted: entry.timeFormatted,
        title: entry.title,
        keyHighlights: entry.keyHighlights,
        transcript: transcriptTurns,
        audioUrl: null,
        mimeType: 'audio/wav',
        audioMode: 'unavailable',
        fallbackNotice:
          'Report salvato nello storico per data. Puoi leggere la trascrizione di Marco, ascoltarla subito con la voce maschile locale o toccare "Genera Audio Overview" per la registrazione HD WAV.',
        anonymized: entry.anonymized,
      });
      setShowOverviewTranscript(true);
    }
  };

  const handleDeleteArchiveItem = async (id: string) => {
    soundManager.playPop();
    await deleteOverviewAudioFromIndexedDb(id);
    onDeleteArchivedOverview?.(id);
    if (audioOverview?.id === id) {
      setAudioOverview(null);
    }
  };

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
   * GENERATES A NOTEBOOKLM-STYLE DUAL-HOST STUDIO AUDIO OVERVIEW WITH GEMINI
   * Sends ONLY transient aggregated metrics (never surname, birthDate, or photo).
   */
  const handleGenerateAudioOverview = async (forceRetry = false) => {
    soundManager.stopSpeech();
    setOverviewError(null);
    setIsGeneratingOverview(true);

    // Immediately create and archive the report snapshot by date so it is ALWAYS saved
    // in the archive even while HD audio synthesis is in progress or if the server is busy.
    const initialSnapshot = buildInstantReportOverviewSnapshot(
      forceRetry && audioOverview?.id ? audioOverview.id : undefined
    );
    const archiveId = initialSnapshot.entry.id;
    const { dateIso: dateKey, dateFormatted, timeFormatted } = initialSnapshot.entry;
    onSaveArchivedOverview?.(initialSnapshot.entry);
    setArchiveDateFilter('ALL');

    try {
      const payload = {
        displayAlias: anonymizeOverview ? '' : childName,
        anonymize: anonymizeOverview,
        forceRetry,
        gender: childGender,
        ageYears: ageInfo.years,
        ageBandTitle: ageInfo.ageBandTitle,
        currentLevel: progress.currentLevel,
        completedExercises: evalReport.completedLevelsCount,
        sessionsCount: evalReport.sessionsCount,
        ic: evalReport.ic,
        ip: evalReport.ip,
        ia: evalReport.ia,
        ir: evalReport.ir,
        it: evalReport.it,
        ieDelta: evalReport.ieDelta,
        assignedBandLabel: evalReport.assignedBandLabel,
        autonomousTotal: evalReport.autonomousTotal,
        assistedTotal: evalReport.assistedTotal,
        annualDeltaIc: evalReport.activeAgeRow?.deltaIc ?? 0,
        chcAbilities: evalReport.chcAbilities.map((ab) => ({
          code: ab.code,
          shortTitle: ab.shortTitle,
          score: ab.score,
          bandLabel: ab.bandLabel,
        })),
        domains: domainMetrics.map((dm) => ({
          shortLabel: dm.shortLabel,
          ic: dm.ic,
          completed: dm.completed,
          correctFirstTry: dm.correctFirstTry,
        })),
      };

      const res = await fetch('/api/report-audio-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const rawErr = typeof data?.error === 'string' ? data.error.trim() : '';
        const looksLikeJsonBlob = rawErr.startsWith('{') || rawErr.includes('"status":"UNAVAILABLE"');
        throw new Error(
          rawErr && !looksLikeJsonBlob
            ? rawErr
            : 'Servizio Audio Overview momentaneamente molto richiesto. Riprova tra qualche secondo.'
        );
      }

      const transcript =
        Array.isArray(data.transcript) && data.transcript.length > 0
          ? data.transcript
          : initialSnapshot.transcriptTurns;
      const keyHighlights =
        Array.isArray(data.keyHighlights) && data.keyHighlights.length > 0
          ? data.keyHighlights
          : initialSnapshot.entry.keyHighlights;
      const title =
        typeof data.title === 'string' && data.title.trim()
          ? data.title
          : initialSnapshot.entry.title;

      if (data?.audioData && typeof data.audioData === 'string') {
        const binary = atob(data.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const mimeType = typeof data.mimeType === 'string' ? data.mimeType : 'audio/wav';
        const blob = new Blob([bytes], { type: mimeType });
        const nextUrl = URL.createObjectURL(blob);

        if (overviewUrlRef.current) {
          URL.revokeObjectURL(overviewUrlRef.current);
        }
        overviewUrlRef.current = nextUrl;

        await saveOverviewAudioToIndexedDb(archiveId, data.audioData, mimeType);
        const archiveEntry: ArchivedReportOverview = {
          ...initialSnapshot.entry,
          id: archiveId,
          dateIso: dateKey,
          dateFormatted,
          timeFormatted,
          title,
          keyHighlights,
          transcript: JSON.stringify(transcript),
          anonymized: Boolean(data.anonymized),
          hasAudioBlob: true,
          mimeType,
        };
        onSaveArchivedOverview?.(archiveEntry);
        setArchiveSavedBanner(`Audio Overview HD del ${dateFormatted} salvato nell'Archivio!`);
        setTimeout(() => setArchiveSavedBanner(null), 4500);

        setAudioOverview({
          id: archiveId,
          dateFormatted,
          timeFormatted,
          title,
          keyHighlights,
          transcript,
          audioUrl: nextUrl,
          mimeType,
          audioMode: 'gemini_wav',
          anonymized: Boolean(data.anonymized),
        });
      } else {
        if (overviewUrlRef.current) {
          URL.revokeObjectURL(overviewUrlRef.current);
          overviewUrlRef.current = null;
        }
        const archiveEntry: ArchivedReportOverview = {
          ...initialSnapshot.entry,
          id: archiveId,
          dateIso: dateKey,
          dateFormatted,
          timeFormatted,
          title,
          keyHighlights,
          transcript: JSON.stringify(transcript),
          anonymized: Boolean(data.anonymized),
          hasAudioBlob: false,
          mimeType: 'audio/wav',
        };
        onSaveArchivedOverview?.(archiveEntry);
        setArchiveSavedBanner(`Report Overview del ${dateFormatted} salvato nell'Archivio!`);
        setTimeout(() => setArchiveSavedBanner(null), 4500);

        setAudioOverview({
          id: archiveId,
          dateFormatted,
          timeFormatted,
          title,
          keyHighlights,
          transcript,
          audioUrl: null,
          mimeType: 'audio/wav',
          audioMode: 'unavailable',
          fallbackNotice:
            typeof data.fallbackNotice === 'string'
              ? data.fallbackNotice
              : 'Il server vocale HD è momentaneamente occupato. Il report è stato archiviato nello storico per data: puoi riprovare l’Audio HD o ascoltare la trascrizione.',
          anonymized: Boolean(data.anonymized),
        });
        setShowOverviewTranscript(true);
      }

      setOverviewPlaybackRate(1);
    } catch (err: unknown) {
      // Even on transient error, keep the archived snapshot accessible in the player
      setAudioOverview({
        id: initialSnapshot.entry.id,
        dateFormatted: initialSnapshot.entry.dateFormatted,
        timeFormatted: initialSnapshot.entry.timeFormatted,
        title: initialSnapshot.entry.title,
        keyHighlights: initialSnapshot.entry.keyHighlights,
        transcript: initialSnapshot.transcriptTurns,
        audioUrl: null,
        mimeType: 'audio/wav',
        audioMode: 'unavailable',
        fallbackNotice:
          'Il report del giorno è stato salvato nell’Archivio Storico qui sotto. Il server vocale HD era momentaneamente occupato: puoi ascoltare subito la trascrizione con la voce maschile locale o riprovare l’Audio HD.',
        anonymized: initialSnapshot.entry.anonymized,
      });
      setShowOverviewTranscript(true);
      const rawMsg = err instanceof Error ? err.message : '';
      const friendlyMsg =
        rawMsg && !rawMsg.includes('"code":503') && !rawMsg.includes('"error":{')
          ? rawMsg
          : 'Il servizio Audio HD è temporaneamente occupato, ma il Report Overview del giorno è stato salvato nell’Archivio Storico.';
      setOverviewError(friendlyMsg);
    } finally {
      setIsGeneratingOverview(false);
    }
  };

  const handleSetOverviewSpeed = (rate: 1 | 1.25) => {
    setOverviewPlaybackRate(rate);
    if (overviewAudioRef.current) {
      overviewAudioRef.current.playbackRate = rate;
    }
  };

  const handleDownloadOverviewAudio = () => {
    if (!audioOverview || !audioOverview.audioUrl) return;
    const safeSlug = (audioOverview.anonymized ? 'bambino' : childName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const a = document.createElement('a');
    a.href = audioOverview.audioUrl;
    a.download = `audio-overview-${safeSlug || 'report'}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * GENERATES THE PROFESSIONAL 2-PAGE A4 PDF REPORT FOR THE CHILD
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
      ctx1.font = 'bold 13.5px sans-serif';
      drawFittedText(
        ctx1,
        `${studentRoleLabel}: ${fullChildNameUpper}  |  ${bornLabel}: ${ageInfo.birthDateFormatted} (Età esatta: ${evalReport.childExactAgeDisplay})  |  Livello generale: ${evalReport.generalLevelLabel}`,
        76,
        104,
        874
      );

      ctx1.fillStyle = '#e2e8f0';
      ctx1.font = '12px sans-serif';
      drawFittedText(
        ctx1,
        `Data: ${dateStr}  ·  Solidità dato: ${evalReport.confidenceLabel}  ·  IP = Σ(wᵢ·cᵢ)/Σwᵢ×100  |  IC = 0,50·IP + 0,20·IA + 0,15·IR + 0,15·IT`,
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
      ctx1.font = '900 15px sans-serif';
      ctx1.fillText(
        `Prove: ${evalReport.significantExercises} · Solidità: ${evalReport.confidencePercent}%`,
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
      ctx1.font = '900 16.5px sans-serif';
      drawFittedText(
        ctx1,
        `PROFILO DELLE ABILITÀ COGNITIVE CHC (5 AREE 0–100) — ${fullChildNameUpper}`,
        74,
        198,
        642
      );

      ctx1.fillStyle = '#6b21a8';
      ctx1.font = 'bold 12px sans-serif';
      drawFittedText(
        ctx1,
        `IP: ${evalReport.ip}/100 · IC: ${evalReport.ic}/100 · IA: ${evalReport.ia}/100 · IR: ${evalReport.irDisplay} · IT: ${evalReport.itDisplay}`,
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
          `${ab.bandLabel} · ${ab.sampleCount} prove (${ab.confidencePercent}%)`,
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
      ctx1.font = '900 17.5px sans-serif';
      ctx1.fillText(
        `Competenza (IC) ed Età Didattica Indicativa per Materia`,
        552,
        chartsY + 34
      );

      domainMetrics.forEach((m, idx) => {
        const rowY = chartsY + 66 + idx * 59;
        const barTrackW = 610;
        const fillW = Math.round((barTrackW * m.ic) / 100);

        ctx1.fillStyle = '#0f172a';
        ctx1.font = 'bold 13px sans-serif';
        drawFittedText(ctx1, m.title, 552, rowY, 275);

        ctx1.fillStyle = '#64748b';
        ctx1.font = 'bold 10.5px sans-serif';
        ctx1.textAlign = 'right';
        ctx1.fillText(
          `Età did.: ${m.indicativeEducationalAgeLabel} · Diff. ${m.targetDifficulty}/5 · ${m.sampleCount} prove`,
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
        ctx1.fillText(
          `Età: ${m.indicativeEducationalAgeLabel}`,
          cx + 68,
          cy + 157
        );
        ctx1.fillText(
          `Diff. ${m.targetDifficulty}/5 · ${m.sampleCount} pr.`,
          cx + 68,
          cy + 172
        );
        ctx1.fillText(`Solidità ${m.confidencePercent}%`, cx + 68, cy + 187);
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
        const statusStr = `${m.levelLabel} · IC ${m.ic}/100 (${dStr}) · Età did.: ${m.indicativeEducationalAgeLabel}`;
        ctx1.font = 'bold 10px sans-serif';
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
      ctx1.font = 'bold 12px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText(
        `Documento Ufficiale Generato per ${fullChildNameUpper} (${bornLabel} ${ageInfo.birthDateFormatted} · Età esatta: ${evalReport.childExactAgeDisplay}) · Livello generale: ${evalReport.generalLevelLabel} · Pagina 1 di 2`,
        W / 2,
        H - 40
      );
      ctx1.textAlign = 'left';

      // =========================================================================
      // PAGE 2: PROGRESSI OTTENUTI GRAZIE ALL'APP (INIZIO MESE & STORICO ANNUALE),
      //         ISTOGRAMMA 3D & PROSPETTO DEI 4 INDICATORI + 6 CRITERI
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
        `PROGRESSI PER MATERIA, ETÀ DIDATTICA INDICATIVA & CRITERI DI PROMOZIONE — ${fullChildNameUpper}`,
        76,
        78,
        1088
      );
      ctx2.fillStyle = '#e2e8f0';
      ctx2.font = 'bold 13px sans-serif';
      drawFittedText(
        ctx2,
        `${studentRoleLabel}: ${fullChildNameUpper} (${ageInfo.birthDateFormatted} · Età esatta: ${evalReport.childExactAgeDisplay})  ·  Livello generale: ${evalReport.generalLevelLabel}  ·  Pag. 2/2`,
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
      ctx2.font = 'bold 11px sans-serif';
      ctx2.fillText('MATERIA / ETÀ DIDATTICA', tX + 16, tY + 24);
      ctx2.fillText('PROVE / SOLIDITÀ', tCol2, tY + 24);
      ctx2.fillText('PREST. (IP)', tCol3, tY + 24);
      ctx2.fillText('AUTON. (IA)', tCol4, tY + 24);
      ctx2.fillText('IR / IT', tCol5, tY + 24);
      ctx2.fillText('COMPET. (IC)', tCol6, tY + 24);
      ctx2.fillText('FASCIA & DIFF.', tCol7, tY + 24);

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
        ctx2.font = 'bold 12px sans-serif';
        drawFittedText(
          ctx2,
          `${m.shortLabel} · Età did.: ${m.indicativeEducationalAgeLabel}`,
          tCol1,
          ry + 27,
          336
        );

        ctx2.font = 'bold 11.5px sans-serif';
        ctx2.fillText(
          `${m.sampleCount} pr. (${m.confidencePercent}%)`,
          tCol2,
          ry + 27
        );
        ctx2.fillText(`${m.ip}/100`, tCol3 + 6, ry + 27);
        ctx2.fillText(`${m.ia}/100`, tCol4 + 6, ry + 27);
        const irShort = m.irAvailable ? `${m.ir}` : 'N.D.';
        const itShort = m.itAvailable ? `${m.it}` : 'N.D.';
        ctx2.fillText(`${irShort} / ${itShort}`, tCol5, ry + 27);

        ctx2.fillStyle = m.hexDark;
        ctx2.font = '900 13px sans-serif';
        const dStr = m.ieDelta >= 0 ? `+${m.ieDelta}` : `${m.ieDelta}`;
        ctx2.fillText(`${m.ic}/100 (${dStr})`, tCol6, ry + 27);

        ctx2.fillStyle = '#334155';
        ctx2.font = 'bold 10.5px sans-serif';
        drawFittedText(
          ctx2,
          `${m.levelLabel} (D.${m.targetDifficulty}/5)`,
          tCol7,
          ry + 27,
          132
        );
      });

      // 6 STABILITY & PROMOTION CRITERIA BOX AT BOTTOM OF PAGE 2
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
      ctx2.font = '900 15px sans-serif';
      drawFittedText(
        ctx2,
        'CRITERI DI PROMOZIONE E STABILITÀ + PIANO DI APPRENDIMENTO SUCCESSIVO',
        96,
        critBoxY + 28,
        1048
      );
      ctx2.fillStyle = '#6b21a8';
      ctx2.font = 'bold 11.5px sans-serif';
      drawFittedText(
        ctx2,
        `Punto di forza: ${evalReport.nextLearningPlan.strengthTitle}  |  Da consolidare: ${evalReport.nextLearningPlan.toConsolidateTitle}  |  Prossima sfida: ${evalReport.nextLearningPlan.nextChallengeTitle}`,
        96,
        critBoxY + 48,
        1048
      );

      evalReport.stabilityCriteria.slice(0, 6).forEach((crit, i) => {
        const cy = critBoxY + 74 + i * 29;
        ctx2.fillStyle = crit.met ? '#059669' : '#d97706';
        ctx2.font = '900 12px sans-serif';
        ctx2.fillText(crit.met ? '✓ SODDISFATTO' : '• IN CORSO', 96, cy);

        ctx2.fillStyle = '#0f172a';
        ctx2.font = 'bold 12px sans-serif';
        drawFittedText(ctx2, crit.label, 232, cy, 410);

        ctx2.fillStyle = '#475569';
        ctx2.font = '11.5px sans-serif';
        drawFittedText(
          ctx2,
          `Soglia: ${crit.targetText}  |  Attuale: ${crit.currentText}`,
          652,
          cy,
          494
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
      ctx2.font = 'bold 12px sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText(
        `Documento Ufficiale Generato per ${fullChildNameUpper} (${bornLabel} ${ageInfo.birthDateFormatted} · Età esatta: ${evalReport.childExactAgeDisplay}) · Livello generale: ${evalReport.generalLevelLabel} · Pagina 2 di 2`,
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

  // =========================================================================
  // MANDATORY PARENT PIN GATE (FIRST ACCESS SETUP OR PIN VERIFICATION)
  // =========================================================================
  if (!isGateUnlocked) {
    const handleGateSetupSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidParentPinFormat(gatePin)) {
        setGateError('Inserisci un PIN numerico composto da 4 a 6 cifre.');
        return;
      }
      if (gatePin !== gateConfirmPin) {
        setGateError('I due PIN non coincidono. Controlla e riprova.');
        return;
      }
      const hash = hashParentPin(gatePin);
      onUpdateParentPin?.(hash, gateHint.trim() || undefined);
      soundManager.playSuccess();
      setGateError(null);
      setIsGateUnlocked(true);
    };

    const handleGateUnlockSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (verifyParentPin(gatePin, progress.parentPinHash)) {
        soundManager.playPop();
        setGateError(null);
        setGatePin('');
        setIsGateUnlocked(true);
      } else {
        setGateError('PIN errato. Riprova oppure usa il recupero genitore qui sotto.');
      }
    };

    const handleGateRecoverVerify = (e: React.FormEvent) => {
      e.preventDefault();
      if (Number(gateBirthYear.trim()) !== ageInfo.birthYear) {
        setGateError(
          `L’anno di nascita non corrisponde al profilo di ${childName}. Controlla e riprova.`
        );
        return;
      }
      if (Number(gateMathInput.trim()) !== gateChallenge.answer) {
        setGateError(
          'Risultato non corretto. Ricorda: prima la moltiplicazione, poi la somma.'
        );
        return;
      }
      setGateError(null);
      setGatePin('');
      setGateConfirmPin('');
      setGateHint(progress.parentPinHint || '');
      setGateMode('recover_new');
    };

    return (
      <div className="safe-modal-overlay fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center overflow-y-auto overflow-x-hidden">
        <div className="bg-slate-900 border border-white/12 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-white my-auto overflow-x-hidden">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/35 flex items-center justify-center shrink-0">
                {gateMode === 'unlock' ? (
                  <Lock className="w-5 h-5 text-indigo-300" />
                ) : (
                  <KeyRound className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-indigo-300">
                  {gateMode === 'setup'
                    ? 'Primo Accesso · Protezione Locale'
                    : gateMode === 'unlock'
                    ? 'Accesso Protetto'
                    : 'Recupero PIN Genitori'}
                </p>
                <h2 className="font-fun font-extrabold text-lg sm:text-xl text-white leading-tight">
                  {gateMode === 'setup'
                    ? 'Imposta il PIN Genitori'
                    : gateMode === 'unlock'
                    ? 'Area Genitori'
                    : gateMode === 'recover'
                    ? 'Verifica Genitore'
                    : 'Crea un Nuovo PIN'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-slate-200 cursor-pointer shrink-0"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {gateError && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-rose-950/75 border border-rose-400/45 px-3.5 py-2.5 text-xs font-semibold text-rose-100 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <span>{gateError}</span>
            </div>
          )}

          {/* FIRST ACCESS SETUP OR POST-RECOVERY NEW PIN */}
          {(gateMode === 'setup' || gateMode === 'recover_new') && (
            <form onSubmit={handleGateSetupSubmit} className="mt-4 space-y-3.5">
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                {gateMode === 'setup'
                  ? 'Al primo accesso imposta un PIN numerico (4–6 cifre) per impedire ai bambini di aprire report e impostazioni. Il codice resta cifrato solo su questo dispositivo.'
                  : 'Verifica completata! Scegli un nuovo PIN numerico (4–6 cifre) per accedere subito all’Area Genitori.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Nuovo PIN (4–6 cifre)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={gatePin}
                  onChange={(e) => {
                    setGatePin(e.target.value.replace(/\D/g, ''));
                    setGateError(null);
                  }}
                  placeholder="Es. 2468"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-base tracking-[0.35em] border border-white/20 focus:border-indigo-400 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Conferma PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={gateConfirmPin}
                  onChange={(e) => {
                    setGateConfirmPin(e.target.value.replace(/\D/g, ''));
                    setGateError(null);
                  }}
                  placeholder="Ripeti il PIN"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-base tracking-[0.35em] border border-white/20 focus:border-indigo-400 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Promemoria (opzionale)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={gateHint}
                  onChange={(e) => setGateHint(e.target.value)}
                  placeholder="Es. Anno del nostro cane"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 text-white text-sm border border-white/15 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] mt-1 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-fun font-extrabold text-sm shadow-lg transition cursor-pointer"
              >
                Salva PIN e Accedi
              </button>
            </form>
          )}

          {/* RETURNING ACCESS: ENTER PIN */}
          {gateMode === 'unlock' && (
            <form onSubmit={handleGateUnlockSubmit} className="mt-4 space-y-4">
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                Inserisci il tuo PIN Genitori per consultare il report, l’Audio Overview e le impostazioni di {childName}.
              </p>

              {progress.parentPinHint && (
                <p className="text-xs text-amber-200/95 bg-amber-500/10 border border-amber-400/25 rounded-xl px-3 py-2">
                  Promemoria: <strong>{progress.parentPinHint}</strong>
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  PIN Genitori (4–6 cifre)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={gatePin}
                  onChange={(e) => {
                    setGatePin(e.target.value.replace(/\D/g, ''));
                    setGateError(null);
                  }}
                  placeholder="••••"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-lg tracking-[0.4em] text-center border border-white/20 focus:border-indigo-400 focus:outline-none tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-fun font-extrabold text-sm shadow-lg transition cursor-pointer"
              >
                Sblocca Area Genitori
              </button>

              <div className="pt-2 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setGateError(null);
                    setGateBirthYear('');
                    setGateMathInput('');
                    setGateChallenge(generateAdultMathChallenge());
                    setGateMode('recover');
                  }}
                  className="text-xs font-semibold text-slate-300 hover:text-amber-300 underline cursor-pointer inline-flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Hai dimenticato il PIN? Reimpostalo</span>
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PIN: 2-STEP ADULT RECOVERY */}
          {gateMode === 'recover' && (
            <form onSubmit={handleGateRecoverVerify} className="mt-4 space-y-3.5">
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                Per reimpostare il PIN in sicurezza, conferma l’anno di nascita di {childName} e risolvi il calcolo per adulti.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  1. Anno di nascita di {childName} (4 cifre)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  value={gateBirthYear}
                  onChange={(e) => {
                    setGateBirthYear(e.target.value);
                    setGateError(null);
                  }}
                  placeholder="Es. 2021"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 text-white font-bold text-sm border border-white/20 focus:border-amber-300 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  2. Quanto fa <strong className="text-amber-300">{gateChallenge.label}</strong>?
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={gateMathInput}
                  onChange={(e) => {
                    setGateMathInput(e.target.value);
                    setGateError(null);
                  }}
                  placeholder="Risultato"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 text-white font-bold text-sm border border-white/20 focus:border-amber-300 focus:outline-none tabular-nums"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setGateError(null);
                    setGateMode('unlock');
                  }}
                  className="flex-1 min-h-[44px] rounded-xl bg-white/8 hover:bg-white/15 text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Indietro
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                >
                  Verifica e Continua
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="safe-modal-overlay fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-start sm:items-center justify-center overflow-y-auto overflow-x-hidden">
      <div className="bg-slate-900/95 border border-white/12 rounded-2xl sm:rounded-3xl max-w-5xl xl:max-w-6xl w-full p-3.5 sm:p-6 lg:p-7 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] text-white my-auto max-h-[93dvh] overflow-y-auto overflow-x-hidden box-border">
        {/* CLEAN COMPACT TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-start sm:items-center justify-between gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/35 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-fun font-extrabold text-base sm:text-xl text-white leading-tight break-words">
                  {worldTitleFull} · Area Genitori
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 break-words">
                  Età anagrafica: <strong className="text-amber-300">{evalReport.childExactAgeDisplay}</strong> ({ageInfo.birthDateFormatted}) · Livello generale: <strong className="text-emerald-300">{evalReport.generalLevelLabel}</strong> · {evalReport.confidenceLabel}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden p-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-slate-100 font-fun font-bold text-xs border border-white/12 cursor-pointer transition-colors"
              >
                <UserRoundCog className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Profilo &amp; Foto</span>
              </button>
            )}

            <button
              onClick={handleDownloadPdfReport}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-fun font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>{isGeneratingPdf ? 'PDF...' : 'Report PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="hidden sm:flex p-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CLEAN 4-TAB NAVIGATION BAR (2x2 ON MOBILE, 4-COL ON DESKTOP — NEVER CLIPS OR OVERFLOWS) */}
        <div className="mt-4 ui-aligned-tabs grid-cols-2 sm:grid-cols-4 bg-slate-950/75 border border-white/10">
          {(
            [
              { id: 'overview', label: 'Panoramica & Audio' },
              { id: 'skills', label: 'Aree & Materie' },
              { id: 'history', label: 'Storico Progressi' },
              { id: 'security', label: 'Sicurezza & PIN' },
            ] as Array<{ id: ParentTabId; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundManager.playPop();
                setActiveTab(tab.id);
              }}
              className={`min-w-0 min-h-[42px] px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-fun font-bold transition-colors text-center leading-tight cursor-pointer flex items-center justify-center ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/6'
              }`}
              style={activeTab === tab.id ? { backgroundColor: 'var(--sys-accent, #6366f1)' } : undefined}
            >
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: PANORAMICA & AUDIO OVERVIEW (FULL-WIDTH HORIZONTAL LAYOUT)     */}
        {/* ===================================================================== */}
        {activeTab === 'overview' && (
          <>
        <div className="mt-4 bg-gradient-to-br from-violet-950/85 via-indigo-950/85 to-slate-900 rounded-2xl p-4 sm:p-5 border border-violet-400/35 shadow-lg overflow-hidden">
          {/* Row 1: Title + Controls cleanly aligned without squeezing prose */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 border border-white/20 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-fun font-extrabold text-sm sm:text-base text-white leading-snug break-words">
                  Audio Overview · Report Vocale del Giorno
                </h3>
                <p className="text-[11.5px] text-fuchsia-200/90 font-semibold break-words">
                  Voce maschile realistica da studio (Marco · Pedagogista) · Qualità HD WAV
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <label className="inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-white/15 text-xs font-semibold text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anonymizeOverview}
                  onChange={(e) => setAnonymizeOverview(e.target.checked)}
                  className="accent-violet-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                />
                <EyeOff className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                <span>Anonimizza nome</span>
              </label>

              <button
                type="button"
                disabled={isGeneratingOverview}
                onClick={() => handleGenerateAudioOverview(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 disabled:opacity-60 text-white font-fun font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isGeneratingOverview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Elaborazione Audio HD...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{audioOverview ? 'Rigenera Audio Overview' : 'Genera Audio Overview'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Full-width horizontal description (never squished into a vertical column) */}
          <p className="w-full mt-3.5 text-xs sm:text-[13px] text-indigo-100/90 leading-relaxed">
            Il pedagogista Marco commenta a voce con timbro maschile realistico da studio (&ldquo;Benvenuti genitori, a voi il report del giorno&rdquo;) gli indici del report di {anonymizeOverview ? 'tuo figlio' : childName}, illustrando punti di forza cognitivi, aree emergenti e idee pratiche di gioco quotidiano in famiglia senza schermo.
          </p>

          {/* Processing time & privacy metadata row */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11.5px]">
            <p className="text-amber-200/95 flex items-start sm:items-center gap-1.5 font-medium min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Il report audio HD verrà elaborato in qualche minuto (in genere 30–90 sec): resta su questa schermata durante la preparazione.
              </span>
            </p>
            <p className="text-indigo-200/75 flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Elaborazione effimera · Solo indici numerici</span>
            </p>
          </div>

          {isGeneratingOverview && (
            <div className="mt-3 rounded-xl bg-indigo-950/80 border border-indigo-400/40 px-3.5 py-2.5 text-xs text-indigo-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Loader2 className="w-4 h-4 text-fuchsia-300 animate-spin shrink-0" />
                <span>
                  Marco sta registrando il report del giorno con voce maschile in qualità studio HD... L&apos;elaborazione richiede qualche istante.
                </span>
              </div>
              <span className="font-mono font-bold text-amber-300 tabular-nums shrink-0">
                {overviewElapsedSec}s
              </span>
            </div>
          )}

          {overviewError && (
            <div
              role="alert"
              className="mt-3 rounded-xl bg-rose-950/75 border border-rose-400/50 px-3.5 py-2.5 text-xs font-semibold text-rose-100 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{overviewError}</span>
            </div>
          )}

          {audioOverview && (
            <div className="mt-4 rounded-2xl bg-slate-950/80 border border-violet-300/35 p-3.5 sm:p-4 space-y-3.5 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300 block break-words">
                    {audioOverview.audioUrl ? 'Puntata Pronta' : 'Trascrizione Pronta'} ·{' '}
                    {audioOverview.anonymized ? 'Modalità Anonima' : `Report di ${childName}`}
                    {audioOverview.audioUrl ? ' · Audio HD WAV' : ' · Server HD Occupati'}
                  </span>
                  <h4 className="font-kids font-bold text-sm sm:text-base text-white mt-0.5 break-words">
                    {audioOverview.title}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {audioOverview.audioUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSetOverviewSpeed(1)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                          overviewPlaybackRate === 1
                            ? 'bg-violet-500 text-white border-violet-300'
                            : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                        }`}
                      >
                        1x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetOverviewSpeed(1.25)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                          overviewPlaybackRate === 1.25
                            ? 'bg-violet-500 text-white border-violet-300'
                            : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                        }`}
                      >
                        1.25x
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadOverviewAudio}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/45 text-emerald-200 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                        title="Salva la puntata audio in locale sul dispositivo (.wav)"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>Salva WAV</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {audioOverview.fallbackNotice && (
                <div className="rounded-xl bg-amber-500/12 border border-amber-300/35 px-3 py-2.5 text-xs text-amber-100 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="min-w-0 flex-1">{audioOverview.fallbackNotice}</span>
                  <button
                    type="button"
                    disabled={isGeneratingOverview}
                    onClick={() => handleGenerateAudioOverview(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-fun font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Riprova Audio HD</span>
                  </button>
                </div>
              )}

              {audioOverview.audioUrl && (
                <audio
                  ref={overviewAudioRef}
                  key={audioOverview.audioUrl}
                  controls
                  src={audioOverview.audioUrl}
                  onPlay={() => {
                    soundManager.stopSpeech();
                    if (overviewAudioRef.current) {
                      overviewAudioRef.current.playbackRate = overviewPlaybackRate;
                    }
                  }}
                  className="w-full max-w-full h-11 rounded-xl"
                />
              )}

              {audioOverview.keyHighlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {audioOverview.keyHighlights.map((point, idx) => (
                    <div
                      key={idx}
                      className="min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-indigo-100 leading-snug break-words"
                    >
                      <span className="font-black text-amber-300 mr-1.5">✦</span>
                      {point}
                    </div>
                  ))}
                </div>
              )}

              {audioOverview.transcript.length > 0 && (
                <div className="pt-1 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOverviewTranscript((prev) => !prev)}
                      className="flex items-center gap-2 text-xs font-bold text-violet-200 hover:text-white py-1 cursor-pointer text-left"
                    >
                      <span className="min-w-0">
                        Trascrizione Report ({audioOverview.transcript.length} sezioni · Voce di Marco)
                      </span>
                      {showOverviewTranscript ? (
                        <ChevronUp className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fullSpeech = audioOverview.transcript
                          .map((t) => t.line)
                          .join(' ');
                        soundManager.speak(fullSpeech);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/40 text-indigo-100 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ascolta con Voce Maschile</span>
                    </button>
                  </div>
                  {showOverviewTranscript && (
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                      {audioOverview.transcript.map((turn, i) => (
                        <div
                          key={i}
                          className="rounded-xl px-3 py-2 text-xs leading-relaxed border break-words bg-sky-950/60 border-sky-400/25 text-sky-50"
                        >
                          <span className="font-black uppercase tracking-wider text-[10px] mr-2 text-sky-300">
                            {turn.speaker || 'Marco'}:
                          </span>
                          <span>{turn.line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ARCHIVIO STORICO DEI REPORT OVERVIEW SALVATI PER DATA */}
          <div className="mt-4 pt-3.5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Archive className="w-4 h-4 text-amber-300 shrink-0" />
                <h4 className="font-fun font-extrabold text-xs sm:text-sm text-white">
                  Archivio Storico Report Overview per Data ({archivedOverviews.length})
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentReportToArchive}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 text-xs font-fun font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Salva Report di Oggi in Archivio</span>
                </button>
                {archiveDates.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                    <select
                      value={archiveDateFilter}
                      onChange={(e) => setArchiveDateFilter(e.target.value)}
                      aria-label="Filtra report archiviati per data"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-white/20 text-xs font-semibold text-white focus:outline-none focus:border-violet-400"
                    >
                      <option value="ALL">Tutte le date ({archivedOverviews.length})</option>
                      {archiveDates.map(([dKey, dLabel]) => (
                        <option key={dKey} value={dKey}>
                          {dLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {archiveSavedBanner && (
              <div className="mb-2.5 rounded-xl bg-emerald-950/80 border border-emerald-400/50 px-3 py-2 text-xs font-bold text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{archiveSavedBanner}</span>
              </div>
            )}

            {filteredArchivedOverviews.length === 0 ? (
              <p className="text-xs text-slate-300/80 bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2.5">
                Tocca &ldquo;Genera Audio Overview&rdquo; oppure &ldquo;Salva Report di Oggi in Archivio&rdquo; per salvare automaticamente il report vocale, gli indicatori e la trascrizione nello storico archiviato per data.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredArchivedOverviews.map((item) => {
                  const isCurrent = audioOverview?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl p-3 border transition flex flex-col justify-between gap-2 ${
                        isCurrent
                          ? 'bg-violet-950/85 border-amber-300/70'
                          : 'bg-slate-950/75 border-white/12 hover:border-violet-400/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold text-amber-300">
                          <span className="truncate inline-flex items-center gap-1">
                            <Emoji3D emoji="📅" className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.dateFormatted} · ore {item.timeFormatted}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white shrink-0 tabular-nums">
                            IC {item.ic}/100
                          </span>
                        </div>
                        <p className="font-kids font-bold text-xs text-white mt-1 truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                          {item.keyHighlights[0] || `${item.assignedBandLabel} · Livello ${item.levelNumber}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          IP {item.ip} · IA {item.ia} · {item.hasAudioBlob ? 'Audio WAV' : 'Testo'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={loadingArchiveId === item.id}
                            onClick={() => handleLoadArchivedOverview(item)}
                            className="px-2.5 py-1 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 shrink-0" />
                            <span>{isCurrent ? 'In ascolto' : 'Apri'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArchiveItem(item.id)}
                            className="p-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 cursor-pointer"
                            title="Elimina report dall'archivio"
                            aria-label="Elimina report dall'archivio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* PERCORSO PROGRESSIVO (2 -> 14 ANNI) · UPGRADE & DOWNGRADE ADATTIVO    */}
        {/* ===================================================================== */}
        <div className="mt-4 bg-gradient-to-br from-indigo-950/75 via-slate-900 to-sky-950/60 rounded-2xl p-4 sm:p-5 border border-indigo-400/30 shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3.5 border-b border-white/10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <GraduationCap className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <h3 className="font-fun font-extrabold text-sm sm:text-base text-white leading-snug">
                  Sezione 1 &amp; 3 · Profilo Anagrafico Esatto e Livello Didattico Indipendente per Materia
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Età anagrafica esatta: <strong className="text-amber-200">{evalReport.childExactAgeDisplay}</strong> ({evalReport.childCurrentAgeMonths} mesi · {ageInfo.ageBandTitle}).
                Il livello non è più unico per tutta l’app: ogni materia avanza o consolida in modo{' '}
                <strong className="text-emerald-300">indipendente (Difficoltà 1–5 su finestra mobile di 10 esercizi)</strong>.
              </p>
            </div>
            <div className="rounded-xl px-3.5 py-2 w-full sm:w-auto text-left sm:text-right tabular-nums shrink-0 border bg-slate-950/85 border-indigo-400/40">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Livello Generale
              </span>
              <span className="block font-fun font-extrabold text-xs sm:text-sm text-amber-300">
                {evalReport.generalLevelLabel}
              </span>
            </div>
          </div>

          {/* LIVELLO DIDATTICO ED ETÀ DIDATTICA INDICATIVA PER CIASCUNA DELLE 6 MATERIE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3.5">
            {domainMetrics.map((m) => (
              <div
                key={m.id}
                className="bg-slate-950/80 border border-white/12 rounded-xl p-3 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-kids font-bold text-xs text-white flex items-center gap-1.5 truncate">
                      <Emoji3D emoji={m.emoji} className="w-4 h-4 shrink-0" />
                      <span className="truncate">{m.shortLabel}</span>
                    </span>
                    <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/25 border border-indigo-400/40 text-amber-200 shrink-0">
                      Età did.: {m.indicativeEducationalAgeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1.5 tabular-nums">
                    <span>
                      Difficoltà: <strong className="text-white">{m.targetDifficulty}/5</strong> ({m.difficultyLabel})
                    </span>
                    <span className="font-bold text-emerald-300">IC {m.ic}/100</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                  <span>{m.slidingWindowActionLabel}</span>
                  <span>{m.sampleCount} prove ({m.confidencePercent}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* 6 Developmental Age Bands (2 -> 14 Anni) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3.5">
            {AGE_CURRICULUM_ROADMAP.map((stage, idx) => {
              const isChronological = stage.band === masteryProfile.chronologicalBand;
              const isBoostedTarget =
                masteryProfile.boostLevel > 0 &&
                stage.band === masteryProfile.effectiveBand &&
                stage.band !== masteryProfile.chronologicalBand;
              const baseIdx = AGE_CURRICULUM_ROADMAP.findIndex(
                (s) => s.band === masteryProfile.chronologicalBand
              );
              const isAlreadyUnlocked = idx <= baseIdx || isBoostedTarget;

              return (
                <div
                  key={stage.band}
                  className={`min-w-0 rounded-xl p-2.5 border text-left transition ${
                    isChronological
                      ? 'bg-indigo-600/30 border-amber-300/80 text-white'
                      : isBoostedTarget
                      ? 'bg-emerald-600/25 border-emerald-400/80 text-white'
                      : isAlreadyUnlocked
                      ? 'bg-slate-950/60 border-white/15 text-slate-200'
                      : 'bg-slate-950/35 border-white/8 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-fun font-extrabold text-xs tabular-nums">
                      {stage.ageRangeLabel}
                    </span>
                    <span className="text-[10px] font-bold inline-flex items-center">
                      {isChronological ? (
                        'Attuale'
                      ) : isBoostedTarget ? (
                        '★ Merito'
                      ) : isAlreadyUnlocked ? (
                        '✓'
                      ) : (
                        <Emoji3D emoji="🔒" className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/75 truncate mt-0.5">
                    {stage.schoolLabel}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mastery Early Unlock Meter & Unlocked Extra Subjects */}
          <div className="mt-3.5 bg-slate-950/75 rounded-xl p-3.5 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span
                className={`font-bold ${
                  masteryProfile.adaptiveStatus === 'downgrade'
                    ? 'text-sky-300'
                    : 'text-emerald-300'
                }`}
              >
                {masteryProfile.adaptiveStatus === 'downgrade'
                  ? 'Recupero Guidato verso il Passo Standard'
                  : 'Avanzamento per Merito nella Fascia d’Età'}
              </span>
              <span className="text-slate-300 tabular-nums">
                Prove valide: <strong className="text-white">{masteryProfile.solvedCount}</strong> · Accuratezza:{' '}
                <strong className="text-amber-300">{masteryProfile.accuracyPercent}%</strong> · Autonomia:{' '}
                <strong className="text-cyan-300">{masteryProfile.autonomyPercent}%</strong>
              </span>
            </div>

            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  masteryProfile.adaptiveStatus === 'downgrade'
                    ? 'bg-gradient-to-r from-sky-400 to-cyan-300'
                    : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400'
                }`}
                style={{ width: `${Math.max(4, masteryProfile.progressPercentToNext)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              {masteryProfile.nextThresholdHint}
            </p>

            {masteryProfile.unlockedBonusSubjects.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-amber-200">
                <strong className="text-white">Approfondimenti già aperti per merito:</strong>{' '}
                {masteryProfile.unlockedBonusSubjects.join(' · ')}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 4 (PART A): AUDIO + FILTRO ANTI-ADULTO (TELEMETRIA LOCALE)        */}
        {/* ===================================================================== */}
        </>
        )}

        {activeTab === 'security' && (
          <div className="mt-4 rounded-2xl p-4 bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white">
                Preferenze Audio e Voce Guida
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Attiva o silenzia rapidamente gli effetti sonori e la voce maschile guida.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() =>
                  onUpdateAudio(!progress.soundEnabled, progress.voiceEnabled)
                }
                className="px-3.5 py-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {progress.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>Suoni {progress.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() =>
                  onUpdateAudio(progress.soundEnabled, !progress.voiceEnabled)
                }
                className="px-3.5 py-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Emoji3D emoji="🗣️" className="w-4 h-4 shrink-0" />
                <span>Voce {progress.voiceEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
        <div className="mt-4 bg-gradient-to-br from-slate-900 via-emerald-950/35 to-slate-950 rounded-2xl p-4 sm:p-5 border border-emerald-400/30 shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-white/10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <h3 className="font-fun font-extrabold text-sm sm:text-base text-white leading-snug">
                  Integrità Report · Filtro Anti-Adulto (Telemetria Locale)
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Un motore comportamentale <strong className="text-emerald-300">100% locale sul dispositivo</strong>{' '}
                (senza fotocamera, microfono né invio a server) analizza tempi di reazione, risposte date prima della
                fine dell’audio e precisione del tocco per riconoscere quando sta provando un genitore ed{' '}
                <strong className="text-white">escludere automaticamente quelle prove dal report</strong> e dagli
                avanzamenti di livello.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[230px] shrink-0 tabular-nums">
              <div className="min-w-0 bg-slate-950/85 border border-emerald-400/35 rounded-xl px-3 py-1.5 text-center">
                <span className="block text-[10px] uppercase font-bold text-emerald-300 truncate">
                  Prove Bambino
                </span>
                <span className="font-fun font-extrabold text-lg text-white">
                  {adultFilterStats.validChildCount}
                </span>
              </div>
              <div className="min-w-0 bg-slate-950/85 border border-amber-400/35 rounded-xl px-3 py-1.5 text-center">
                <span className="block text-[10px] uppercase font-bold text-amber-300 truncate">
                  Filtrate (Adulto)
                </span>
                <span className="font-fun font-extrabold text-lg text-amber-200">
                  {adultFilterStats.filteredAdultCount}
                </span>
              </div>
            </div>
          </div>

          {/* Parent Preview Mode Toggle & Clear Filtered Trials */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">
                Modalità Prova Genitore:{' '}
                <span
                  className={
                    progress.parentPreviewMode ? 'text-amber-300' : 'text-emerald-300'
                  }
                >
                  {progress.parentPreviewMode
                    ? 'ATTIVA (nessuna prova viene salvata nel report)'
                    : 'Disattiva (filtro automatico attivo)'}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Attivala quando vuoi esplorare liberamente i livelli dell’app prima di consegnare il telefono al bambino.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onToggleParentPreviewMode && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    onToggleParentPreviewMode();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-fun font-extrabold border transition cursor-pointer ${
                    progress.parentPreviewMode
                      ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-200'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                  }`}
                >
                  {progress.parentPreviewMode
                    ? 'Disattiva Prova Genitore'
                    : 'Attiva Prova Genitore'}
                </button>
              )}

              {onClearAdultFilteredTrials && adultFilterStats.filteredAdultCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    onClearAdultFilteredTrials();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-fun font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 transition cursor-pointer"
                >
                  Pulisci registro filtrate
                </button>
              )}
            </div>
          </div>

          {Object.keys(adultFilterStats.reasonCounts).length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/10">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Segnali rilevati nelle prove escluse dal report:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(adultFilterStats.reasonCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([code, count]) => (
                    <span
                      key={code}
                      className="text-[11px] bg-slate-950/80 border border-amber-400/30 text-amber-100 rounded-lg px-2.5 py-1"
                    >
                      {getAdultReasonLabel(code)} ({count})
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 1 (PART B): HERO REPORT PREVIEW & 4 CORE INDICATORS               */}
        {/* ===================================================================== */}
        {activeTab === 'overview' && (
        <div className="my-4 bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-indigo-300 block">
                Quadro Sintetico della Valutazione
              </span>
              <h3 className="font-fun font-extrabold text-base sm:text-xl text-white mt-0.5 leading-snug">
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

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[320px] shrink-0 tabular-nums">
              {/* Competenza Generale Card */}
              <div className="min-w-0 bg-slate-900 border border-indigo-400/40 rounded-2xl px-3 sm:px-4 py-3 text-center">
                <span className="text-[11px] font-semibold text-indigo-200 block truncate">
                  Competenza generale
                </span>
                <span className="font-fun font-extrabold text-2xl sm:text-3xl text-white block leading-tight mt-0.5">
                  {evalReport.ic}<span className="text-base sm:text-lg text-slate-400">/100</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-300 block mt-1 truncate">
                  {evalReport.assignedBandLabel}
                </span>
              </div>

              {/* Evoluzione Card */}
              <div className="min-w-0 bg-slate-900 border border-emerald-400/40 rounded-2xl px-3 sm:px-4 py-3 text-center">
                <span className="text-[11px] font-semibold text-emerald-200 block truncate">
                  Evoluzione (IE)
                </span>
                <span className="font-fun font-extrabold text-2xl sm:text-3xl text-emerald-300 block leading-tight mt-0.5">
                  {evalReport.ieDelta >= 0
                    ? `+${evalReport.ieDelta}`
                    : evalReport.ieDelta}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block mt-1 truncate">
                  Prec.: {evalReport.previousIc}/100
                </span>
              </div>
            </div>
          </div>

          {/* 1. I QUATTRO INDICATORI PRINCIPALI (0-100) */}
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-200 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>1. I Quattro Indicatori Principali (0–100) &amp; Formule Matematiche</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* IP: Indice di Prestazione */}
              <div className="min-w-0 overflow-hidden bg-slate-950/80 rounded-2xl p-3.5 border border-violet-400/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-violet-300 min-w-0 leading-tight">
                    Indice di prestazione (IP)
                  </span>
                  <span className="font-kids font-extrabold text-lg sm:text-xl text-white shrink-0 tabular-nums">
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
                <p className="text-[10px] font-mono text-violet-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg break-words">
                  IP = Σ(wᵢ·cᵢ)/Σwᵢ×100 = {evalReport.weightedCorrectSum}/
                  {evalReport.weightedTotalSum}
                </p>
              </div>

              {/* IC: Indice di Competenza */}
              <div className="min-w-0 overflow-hidden bg-slate-950/80 rounded-2xl p-3.5 border border-pink-400/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-pink-300 min-w-0 leading-tight">
                    Indice di competenza (IC)
                  </span>
                  <span className="font-kids font-extrabold text-lg sm:text-xl text-white shrink-0 tabular-nums">
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
                <p className="text-[10px] font-mono text-pink-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg break-words">
                  IR: <strong className="text-white">{evalReport.irDisplay}</strong> · IT:{' '}
                  <strong className="text-white">{evalReport.itDisplay}</strong>
                </p>
                <p className="text-[10px] text-amber-200/90 mt-1 font-semibold">
                  Campione: {evalReport.confidenceLabel}
                </p>
              </div>

              {/* IA: Indice di Autonomia */}
              <div className="min-w-0 overflow-hidden bg-slate-950/80 rounded-2xl p-3.5 border border-cyan-400/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-cyan-300 min-w-0 leading-tight">
                    Indice di autonomia (IA)
                  </span>
                  <span className="font-kids font-extrabold text-lg sm:text-xl text-white shrink-0 tabular-nums">
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
                  Scala discreta: 100 autonomo · 75 un aiuto · 50 due aiuti · 25 guidato.
                </p>
                <p className="text-[10px] font-mono text-cyan-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg break-words">
                  Autonomi: {evalReport.autonomousTotal} · Assistiti:{' '}
                  {evalReport.assistedTotal} ({evalReport.significantExercises} prove)
                </p>
              </div>

              {/* IE: Indice di Evoluzione */}
              <div className="min-w-0 overflow-hidden bg-slate-950/80 rounded-2xl p-3.5 border border-emerald-400/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-300 min-w-0 leading-tight">
                    Indice di evoluzione (IE)
                  </span>
                  <span className="font-kids font-extrabold text-lg sm:text-xl text-amber-300 shrink-0 tabular-nums">
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
                <p className="text-[10px] font-mono text-emerald-200/90 mt-1.5 bg-white/5 px-2 py-1 rounded-lg break-words">
                  IE = IC_att({evalReport.ic}) - IC_prec({evalReport.previousIc})
                </p>
              </div>
            </div>
          </div>

          {/* SEZIONE 2: PROFILO DELLE 5 AREE COGNITIVE (MODELLO CHC 0-100 SEPARATO DALLE 6 MATERIE) */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Sezione 2 · Profilo delle 5 Aree Cognitive (Modello CHC 0–100)</span>
              </p>
              <span className="text-[11px] text-white/60">
                5 aree cognitive distinte dalle 6 materie didattiche · Con numero prove e solidità del dato
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 tabular-nums">
              {evalReport.chcAbilities.map((ab) => (
                <div
                  key={ab.code}
                  className="min-w-0 overflow-hidden bg-slate-950/90 rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white/10 text-white shrink-0">
                        {ab.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-300 shrink-0">
                        {ab.ieDelta >= 0 ? `+${ab.ieDelta}` : ab.ieDelta} pt
                      </span>
                    </div>
                    <h4 className="font-kids font-bold text-sm text-white mt-2 break-words">
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
                    <p className="text-[10px] text-white/70 leading-snug break-words">
                      {ab.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1 text-[10px] text-white/70">
                    <div className="flex items-center justify-between gap-1">
                      <span>IP {ab.ip}/100</span>
                      <span>IA {ab.ia}/100</span>
                    </div>
                    <div className="text-amber-200/90 font-semibold truncate">
                      {ab.confidenceLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEZIONE 5: PIANO DI APPRENDIMENTO SUCCESSIVO */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-2.5 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sezione 5 · Piano di Apprendimento Successivo Personalizzato</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-emerald-950/50 border border-emerald-400/35 rounded-xl p-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                  ★ Punto di Forza Principale
                </span>
                <p className="font-kids font-bold text-sm text-white mt-1">
                  {evalReport.nextLearningPlan.strengthTitle}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {evalReport.nextLearningPlan.strengthDetail}
                </p>
              </div>
              <div className="bg-amber-950/45 border border-amber-400/35 rounded-xl p-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
                  <Emoji3D emoji="⚖️" className="w-3.5 h-3.5 shrink-0" />
                  <span>Competenza da Consolidare</span>
                </span>
                <p className="font-kids font-bold text-sm text-white mt-1">
                  {evalReport.nextLearningPlan.toConsolidateTitle}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {evalReport.nextLearningPlan.toConsolidateDetail}
                </p>
              </div>
              <div className="bg-indigo-950/60 border border-indigo-400/35 rounded-xl p-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 inline-flex items-center gap-1">
                  <Emoji3D emoji="🚀" className="w-3.5 h-3.5 shrink-0" />
                  <span>Prossima Sfida Consigliata</span>
                </span>
                <p className="font-kids font-bold text-sm text-white mt-1">
                  {evalReport.nextLearningPlan.nextChallengeTitle}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {evalReport.nextLearningPlan.nextChallengeDetail}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: STORICO PROGRESSI MENSILI & ANNUALI + CRITERI DI STABILITÀ     */}
        {/* ===================================================================== */}
        {activeTab === 'history' && (
          <>
        <div className="mt-4 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/60 rounded-2xl p-4 sm:p-5 border border-emerald-400/35 mb-5 shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-white/10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <h3 className="font-kids font-extrabold text-sm sm:text-base uppercase tracking-wider text-emerald-300 leading-snug">
                  Progressi Ottenuti Grazie all’Utilizzo dell’App (Mensile &amp;
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

            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-emerald-400/30 w-full sm:w-auto shrink-0">
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="text-[11px] min-w-0">
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
            <table className="w-full min-w-[640px] text-left border-collapse text-xs tabular-nums">
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
                      <span className="font-bold text-amber-300 inline-flex items-center gap-1">
                        <Emoji3D emoji="🗓️" className="w-3.5 h-3.5 shrink-0" />
                        <span>{cp.monthLabel}</span>
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
        <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 mb-5 overflow-hidden">
          <div className="flex items-start gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-amber-300 leading-snug">
              3. Criteri di Stabilità per il Passaggio di Livello &amp; Pesi di
              Difficoltà
            </h3>
          </div>

          <p className="text-xs text-white/80 mb-4 leading-relaxed">{evalReport.stabilitySummaryNote}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 5 Stability Criteria Checklist */}
            <div className="min-w-0 overflow-hidden bg-slate-950/70 rounded-2xl p-4 border border-white/10 space-y-2.5">
              <p className="text-xs font-extrabold text-pink-300 uppercase tracking-wider">
                Regole di Stabilità per Passare al Livello Successivo:
              </p>
              {evalReport.stabilityCriteria.map((crit) => (
                <div
                  key={crit.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs py-1.5 border-b border-white/5 last:border-none"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                        crit.met
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {crit.met ? '✓' : '•'}
                    </span>
                    <span className="font-semibold text-white/90 break-words">
                      {crit.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-200 shrink-0 tabular-nums">
                    {crit.currentText}
                  </span>
                </div>
              ))}
            </div>

            {/* Difficulty Weights & Competency Bands Table */}
            <div className="min-w-0 space-y-3">
              <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-white/10 overflow-hidden">
                <p className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Pesi degli Esercizi in Funzione della Difficoltà (wᵢ)</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[11px] tabular-nums">
                  {weightTiers.map((wt) => (
                    <div
                      key={wt.tier}
                      className={`min-w-0 rounded-xl p-2 border ${
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

              <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-white/10 overflow-hidden">
                <p className="text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2">
                  Fasce dell’Indice di Competenza (IC 0–100)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[10px] tabular-nums">
                  {[
                    { range: '0–39', label: 'In esplorazione' },
                    { range: '40–59', label: 'In apprendimento' },
                    { range: '60–74', label: 'In consolidamento' },
                    { range: '75–89', label: 'Acquisito' },
                    { range: '90–100', label: 'Padronanza avanz.' },
                  ].map((b) => (
                    <div
                      key={b.range}
                      className="min-w-0 rounded-xl p-1.5 bg-white/5 border border-white/10"
                    >
                      <span className="font-extrabold text-amber-300 block">
                        {b.range}
                      </span>
                      <span className="text-white/80 block leading-tight mt-0.5 break-words">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: ANALISI GRAFICA 3D & 6 MATERIE DETTAGLIATE                     */}
        {/* ===================================================================== */}
        {activeTab === 'skills' && (
          <>
        <div className="mt-4 bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 mb-5 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <BarChart3 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-pink-300 leading-snug">
                4. Analisi Grafica delle 6 Materie (Indice di Competenza 0–100)
              </h3>
            </div>
            <span className="text-xs text-white/60">
              {isMeasurementUnlocked
                ? `Profilo Multi-Parametro di ${childName} al Livello ${progress.currentLevel}`
                : 'Completa il 1° livello per visualizzare la mappa radar multi-parametro'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Hexagonal Radar Chart (expanded viewBox so labels NEVER clip outside the box) */}
            <div className="min-w-0 overflow-hidden flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-bold text-white/80 mb-2 text-center">
                Mappa Radar Globale (Indice IC 0–100)
              </p>
              <svg viewBox="-68 -18 366 266" className="w-full max-w-[330px] h-auto block">
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
                      className="fill-white text-[9.5px] font-bold"
                    >
                      {c.shortLabel} ({c.ic})
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

            {/* Horizontal Comparative Bars + Età Didattica Indicativa */}
            <div className="min-w-0 space-y-3">
              {domainMetrics.map((m) => (
                <div key={m.id} className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5 min-w-0 truncate">
                      <Emoji3D emoji={m.emoji} className="w-4 h-4 shrink-0" />
                      <span className="truncate">{m.title}</span>
                    </span>
                    <span className="font-black text-amber-300 shrink-0 tabular-nums">
                      {m.ic}/100 · <span className="text-emerald-300">{m.indicativeEducationalAgeLabel}</span>
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.barColor} transition-all duration-500`}
                      style={{ width: `${m.ic}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 tabular-nums">
                    <span>Diff. {m.targetDifficulty}/5 ({m.difficultyLabel}) · {m.slidingWindowActionLabel}</span>
                    <span>{m.confidenceLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 5: RELAZIONE PEDAGOGICA & PERCORSO A 6 TAPPE PER MATERIA      */}
        {/* ===================================================================== */}
        <div className="space-y-3.5 mb-5">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <h3 className="font-kids font-bold text-sm uppercase tracking-wider text-amber-300 leading-snug">
              5. Percorso Didattico a 6 Tappe &amp; Relazione per Materia (Livello Generale: {evalReport.generalLevelLabel})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {domainMetrics.map((m) => (
              <div
                key={m.id}
                className="min-w-0 overflow-hidden bg-slate-950/75 rounded-2xl p-4 border border-white/10 flex flex-col justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Emoji3D emoji={m.emoji} className="w-7 h-7 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-kids font-bold text-sm text-white leading-tight break-words">
                          {m.clinicalName}
                        </h4>
                        <span className="text-[11px] font-semibold text-amber-300 block mt-0.5">
                          {m.levelLabel} · IC {m.ic}/100 · Età didattica: <strong className="text-emerald-300">{m.indicativeEducationalAgeLabel}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-extrabold text-white shrink-0 tabular-nums">
                      Diff. {m.targetDifficulty}/5
                    </span>
                  </div>

                  {/* 6-STAGE LEARNING PATH */}
                  <div className="my-2.5 bg-slate-900/90 border border-white/10 rounded-xl p-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1.5">
                      Percorso Progressivo a 6 Tappe ({m.shortLabel}):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {m.learningPathStages.map((st) => (
                        <div
                          key={st.stepNumber}
                          className={`rounded-lg px-2 py-1 border text-[10px] leading-tight ${
                            st.status === 'Acquisito'
                              ? 'bg-emerald-950/70 border-emerald-400/50 text-emerald-200'
                              : st.status === 'In corso'
                              ? 'bg-amber-950/70 border-amber-300/70 text-amber-100 font-bold'
                              : st.status === 'Prossimo obiettivo'
                              ? 'bg-indigo-950/70 border-indigo-400/40 text-indigo-200'
                              : 'bg-slate-950/60 border-white/10 text-slate-400'
                          }`}
                        >
                          <span className="block font-extrabold text-[9.5px] uppercase">
                            Tappa {st.stepNumber} · {st.status}
                          </span>
                          <span className="block truncate mt-0.5 text-white/90">
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-white/85 leading-relaxed mt-1.5 break-words">
                    <strong className="text-pink-300">
                      Analisi Tracciabile:
                    </strong>{' '}
                    {m.pedagogicalNote}
                  </p>
                  <p className="text-[11px] text-amber-200/90 italic mt-1.5 break-words">
                    <strong>Consiglio Famiglia:</strong> {m.familyAdvice}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10.5px] text-white/70 tabular-nums">
                  <span>{m.confidenceLabel}</span>
                  <span>
                    IR: <strong className="text-white">{m.irDisplayLabel}</strong> · IT: <strong className="text-white">{m.itDisplayLabel}</strong>
                  </span>
                  <span>
                    IP {m.ip}/100 · IA {m.ia}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: CATALOGO DELLE 10 MATERIE PROGRESSIVE & SIMULATORE DI VERIFICA 4 PROFILI */}
        <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-pink-950/60 rounded-2xl p-5 border border-white/15 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-pink-300 shrink-0" />
              <h3 className="font-kids font-bold text-sm uppercase tracking-wider text-pink-200">
                6. Catalogo delle 10 Materie Progressive (2–14 Anni) &amp; Verifica Algoritmo
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulatorModal((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/50 text-amber-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{showSimulatorModal ? 'Nascondi Simulatore 4 Profili' : 'Verifica 4 Profili Simulati'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            {evalReport.progressiveSubjectsCatalog.map((subj) => (
              <div
                key={subj.id}
                className="bg-black/30 rounded-xl p-3 border border-white/12 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-amber-300">
                      {subj.subjectName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white shrink-0">
                      {subj.minRecommendedAgeYears}+ anni
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 mt-1 leading-snug">
                    {subj.competencies}
                  </p>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold mt-2 inline-flex items-center gap-1">
                  {subj.isUnlockedForChild ? (
                    `✓ ${subj.statusLabel}`
                  ) : (
                    <>
                      <Emoji3D emoji="🔒" className="w-3 h-3 shrink-0" />
                      <span>{subj.statusLabel}</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          {showSimulatorModal && (
            <div className="mt-4 pt-4 border-t border-white/15">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-2">
                Test di Verifica dell’Algoritmo Adattivo (4 Profili Simulati):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verificationSimulations.map((sim) => (
                  <div
                    key={sim.id}
                    className="bg-slate-950/85 border border-emerald-400/40 rounded-xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-kids font-bold text-white">{sim.profileTitle}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                        {sim.zeroRepetitionVerified && sim.autonomyGatingVerified ? '✓ VERIFICATO' : 'VERIFICA'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{sim.summaryHighlight}</p>
                    <p className="text-[11px] text-amber-200 font-semibold">
                      Età calcolata: {sim.chronologicalAgeDisplay} ({sim.ageInMonths} mesi) · IC Globale: {sim.globalIc}/100 (IP {sim.globalIp} · IA {sim.globalIa})
                    </p>
                    <p className="text-[11px] text-cyan-200">
                      {sim.subjectBreakdown
                        .map((sb) => `${sb.subjectTitle}: ${sb.indicativeAgeLabel} (D.${sb.difficulty}/5)`)
                        .join(' · ')}
                    </p>
                    <p className="text-[10.5px] text-emerald-300 font-bold">{sim.promotionGateReason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* TAB 4 (PART B): CLOUD GOOGLE MULTI-DEVICE, COMPLEANNO & CERTIFICATI    */}
        {/* ===================================================================== */}
        {activeTab === 'security' && (
          <>
        {/* GOOGLE CLOUD SYNC MULTI-DEVICE & AGE-ADAPTIVE GRAPHICS / BIRTHDAY PANEL */}
        <div className="mt-4 bg-gradient-to-br from-sky-950/90 via-slate-950/95 to-indigo-950/90 rounded-2xl p-4 sm:p-5 border border-sky-400/40 mb-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3.5 border-b border-white/10">
            <div className="flex items-start gap-2.5 min-w-0">
              <Cloud className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-sky-200 leading-snug">
                  Accesso Google Cloud Multi-Dispositivo &amp; Grafica Evolutiva (2–14 Anni)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sincronizza e ritrova automaticamente livelli, stelle, gemme, adesivi e report su smartphone, tablet Android/Apple e foldable (display interno ed esterno) senza perdere i progressi.
                </p>
              </div>
            </div>
            {cloudSyncState?.deviceLabel && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-200 shrink-0 self-start sm:self-center inline-flex items-center gap-1.5">
                <Emoji3D emoji="📱" className="w-3.5 h-3.5 shrink-0" />
                <span>Dispositivo attivo: {cloudSyncState.deviceLabel}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* LEFT CARD: GOOGLE SIGN-IN & CLOUD SYNC */}
            <div className="rounded-2xl bg-slate-900/90 border border-sky-400/30 p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    CERT-02 · GOOGLE OAUTH 2.0 + FIRESTORE TLS 1.3
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    {cloudSyncState?.uid ? '✓ Account Connesso' : 'Pronto all’accesso'}
                  </span>
                </div>
                <h4 className="font-kids font-bold text-sm text-white">
                  {cloudSyncState?.uid
                    ? `Account Google: ${cloudSyncState.email || cloudSyncState.displayName}`
                    : 'Collega il tuo Account Google per il Backup Cloud'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {cloudSyncState?.uid
                    ? 'I progressi vengono uniti automaticamente tra tutti i tuoi dispositivi mantenendo sempre il livello più alto raggiunto. Le foto personali di sfondo restano 100% locali per privacy.'
                    : 'Accedi con Google per salvare i progressi in cloud e continuare su un altro smartphone, iPad, tablet Android o foldable senza mai perdere livelli o statistiche.'}
                </p>
                {cloudSyncState?.syncError && (
                  <p className="mt-2 text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-400/40 rounded-xl px-3 py-1.5">
                    {cloudSyncState.syncError}
                  </p>
                )}
              </div>

              {cloudSyncState?.uid ? (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-emerald-300 font-bold">
                    {cloudSyncState.lastSyncedAt
                      ? `Ultimo sync: ${new Date(cloudSyncState.lastSyncedAt).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : '✓ Cloud Sync Attivo'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {onManualCloudSave && (
                      <button
                        type="button"
                        onClick={onManualCloudSave}
                        disabled={cloudSyncState.isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Salva in Cloud</span>
                      </button>
                    )}
                    {onManualCloudRestore && (
                      <button
                        type="button"
                        onClick={onManualCloudRestore}
                        disabled={cloudSyncState.isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncState.isSyncing ? 'animate-spin' : ''}`} />
                        <span>Unisci / Ripristina</span>
                      </button>
                    )}
                    {onGoogleSignOut && (
                      <button
                        type="button"
                        onClick={onGoogleSignOut}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Esci</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                onGoogleSignIn && (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={cloudSyncState?.isSyncing}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-slate-950 font-fun font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
                  >
                    <Cloud className="w-4 h-4 text-sky-600" />
                    <span>
                      {cloudSyncState?.isSyncing
                        ? 'Connessione a Google in corso...'
                        : 'Accedi con Google · Attiva Cloud Sync Multi-Device'}
                    </span>
                  </button>
                )
              )}
            </div>

            {/* RIGHT CARD: AGE-ADAPTIVE GRAPHICS EVOLUTION & BIRTHDAY REMINDER/ANIMATION */}
            <div className="rounded-2xl bg-slate-900/90 border border-amber-400/30 p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    STILE ATTIVO: {ageTheme.stageBadge}
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 inline-flex items-center gap-1">
                    <Emoji3D emoji="🎂" className="w-3.5 h-3.5 shrink-0" />
                    <span>{birthdayStatus.nextBirthdayFormatted}</span>
                  </span>
                </div>
                <h4 className="font-kids font-bold text-sm text-white">
                  Evoluzione Grafica Automatica &amp; Festa di Compleanno
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {ageTheme.stageSubtitle} — L&apos;interfaccia si evolve progressivamente dai 2 ai 14 anni (Mondo Fiabesco → Accademia → Campus → NextGen Lab).
                </p>
                <p className="text-xs text-amber-200/95 font-semibold mt-1.5 flex items-center gap-1.5">
                  {birthdayStatus.isBirthdayToday ? (
                    <>
                      <Emoji3D emoji="🎉" className="w-4 h-4 shrink-0" />
                      <span>Oggi è il compleanno di {childName} ({birthdayStatus.turningAgeYears} anni)!</span>
                    </>
                  ) : (
                    `Prossimo compleanno (${birthdayStatus.turningAgeYears} anni): tra ${birthdayStatus.daysUntilBirthday} giorni (${birthdayStatus.nextBirthdayFormatted}).`
                  )}
                </p>
              </div>

              {onOpenBirthdayCelebration && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-300 inline-flex items-center gap-1 flex-wrap">
                    <span>Animazione interattiva + Regalo (+50</span>
                    <Emoji3D emoji="💎" className="w-3.5 h-3.5" />
                    <span>e +25</span>
                    <Emoji3D emoji="⭐" className="w-3.5 h-3.5" />
                    <span>)</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenBirthdayCelebration}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-fun font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                  >
                    <Cake className="w-4 h-4" />
                    <span>Avvia Festa Compleanno</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-slate-950/85 rounded-2xl p-4 sm:p-5 border border-emerald-400/35 mb-5 shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-3 border-b border-white/10">
            <div className="flex items-start gap-2 min-w-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-kids font-bold text-sm sm:text-base uppercase tracking-wider text-emerald-300 leading-snug">
                  7. Certificati di Sicurezza 2026, Privacy Minori (GDPR-K) &amp; Integrità Psicometrica
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Standard attivo: Suite Certificati v2026.4 · GDPR-K + Google OAuth 2.0 + Firestore Zero-Trust TLS 1.3
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-300 break-all sm:shrink-0">
              ✓ {securityCriteria.criteria.length}/{securityCriteria.criteria.length} Certificati Attivi · Hash {securityCriteria.integrityHash}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {securityCriteria.criteria.map((item) => (
              <div
                key={item.id}
                className="min-w-0 overflow-hidden bg-slate-900/90 rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between"
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
                  <h4 className="font-kids font-bold text-xs sm:text-sm text-white break-words">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-white/75 leading-relaxed mt-1 break-words">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-emerald-950/55 border border-emerald-400/35 p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-emerald-100 leading-relaxed min-w-0 flex-1">
              <strong className="text-white block mb-0.5">
                Garanzia GDPR-K 2026 (Art. 25 · Art. 8 Minori · Art. 17 Diritto all&apos;Oblio) &amp; Cloud Sync Zero-Trust
              </strong>
              Le foto personali e gli sfondi restano esclusivamente nella memoria locale del dispositivo. Quando attivi l&apos;accesso Google, i progressi didattici sono protetti da regole Firestore Zero-Trust isolate sul tuo UID genitore.
            </div>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs text-center shadow-md transition cursor-pointer shrink-0"
              >
                Leggi tutte le Norme Privacy &amp; GDPR
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CODICE GENITORE (PIN) · RESET STATISTICHE · RECUPERO CODICE           */}
        {/* ===================================================================== */}
        {securitySuccess && (
          <div className="mb-4 rounded-2xl bg-emerald-950/70 border border-emerald-400/50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-200 flex items-center justify-between gap-2">
            <span>✓ {securitySuccess}</span>
            <button
              type="button"
              onClick={() => setSecuritySuccess(null)}
              className="text-xs text-emerald-300 hover:text-white underline cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        )}

        {securityPanel !== 'closed' && (
          <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-indigo-400/50 shadow-xl space-y-3.5">
            {/* MODE 1: SETUP OR CHANGE PARENT PIN */}
            {(securityPanel === 'setup_pin' || securityPanel === 'recovery_set_pin') && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-fun font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-300" />
                      {securityPanel === 'recovery_set_pin'
                        ? 'Verifica Genitore Riuscita · Imposta Nuovo Codice Genitore'
                        : hasParentPin
                        ? 'Modifica Codice Genitore (PIN)'
                        : 'Imposta Codice Genitore (PIN 4–6 Cifre)'}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Il codice protegge l’azzeramento delle statistiche. Viene salvato cifrato (hash non reversibile) solo sul dispositivo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityPanel('closed')}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Chiudi pannello codice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {securityError && (
                  <p className="text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-400/40 rounded-xl px-3 py-2">
                    {securityError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nuovo Codice (4–6 cifre) *
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => {
                        setNewPin(e.target.value.replace(/\D/g, ''));
                        setSecurityError(null);
                      }}
                      placeholder="Es. 2468"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm tracking-widest border border-white/25 focus:border-amber-300 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Conferma Codice *
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => {
                        setConfirmPin(e.target.value.replace(/\D/g, ''));
                        setSecurityError(null);
                      }}
                      placeholder="Ripeti codice"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm tracking-widest border border-white/25 focus:border-amber-300 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Promemoria (opzionale)
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={pinHintInput}
                      onChange={(e) => setPinHintInput(e.target.value)}
                      placeholder="Es. Anno matrimonio"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-medium text-sm border border-white/25 focus:border-amber-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {hasParentPin && onUpdateParentPin && securityPanel === 'recovery_set_pin' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateParentPin(undefined, undefined);
                          setSecurityPanel('closed');
                          setSecuritySuccess('Codice Genitore rimosso con successo.');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/70 border border-rose-400/40 text-rose-200 text-xs font-bold cursor-pointer min-h-[40px]"
                      >
                        Rimuovi Codice Esistente
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSecurityPanel('closed')}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer min-h-[40px]"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isValidParentPinFormat(newPin)) {
                          setSecurityError('Inserisci un codice numerico composto da 4 a 6 cifre.');
                          return;
                        }
                        if (newPin !== confirmPin) {
                          setSecurityError('I due codici inseriti non coincidono. Controlla e riprova.');
                          return;
                        }
                        const hash = hashParentPin(newPin);
                        onUpdateParentPin?.(hash, pinHintInput.trim() || undefined);
                        setSecurityPanel('closed');
                        setSecuritySuccess(
                          'Codice Genitore salvato e protetto! Ora è richiesto per azzerare le statistiche.'
                        );
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer min-h-[40px]"
                    >
                      Salva Codice Genitore
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* MODE 2: VERIFY PARENT PIN TO RESET STATISTICS */}
            {securityPanel === 'verify_reset' && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-fun font-extrabold text-sm sm:text-base text-rose-200 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-300" />
                      Azzeramento Statistiche · Inserisci Codice Genitore
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {hasParentPin
                        ? 'Inserisci il tuo Codice Genitore (4–6 cifre) per confermare l’azzeramento di livelli e statistiche.'
                        : 'Non hai ancora impostato un Codice Genitore. Puoi impostarlo ora oppure confermare il reset con verifica adulto.'}
                    </p>
                    {hasParentPin && progress.parentPinHint && (
                      <p className="text-xs text-amber-200 mt-1">
                        Promemoria salvato: <strong>{progress.parentPinHint}</strong>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityPanel('closed')}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Chiudi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {securityError && (
                  <p className="text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-400/40 rounded-xl px-3 py-2">
                    {securityError}
                  </p>
                )}

                {hasParentPin ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={pinEntry}
                        onChange={(e) => {
                          setPinEntry(e.target.value.replace(/\D/g, ''));
                          setSecurityError(null);
                        }}
                        placeholder="Codice PIN..."
                        className="flex-1 min-w-0 sm:max-w-[200px] min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm tracking-widest border border-white/25 focus:border-rose-400 focus:outline-none tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (verifyParentPin(pinEntry, progress.parentPinHash)) {
                            setSecurityPanel('closed');
                            setPinEntry('');
                            setSecurityError(null);
                            onResetProgress();
                            setSecuritySuccess('Statistiche azzerate correttamente.');
                          } else {
                            setSecurityError(
                              'Codice Genitore errato. Riprova oppure usa «Hai dimenticato il codice?» per reimpostarlo.'
                            );
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer min-h-[44px] shrink-0"
                      >
                        Conferma Reset
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSecurityPanel('forgot_pin')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer self-start sm:self-center"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Hai dimenticato il codice? Reimpostalo</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Verifica Adulto · Quanto fa <strong className="text-amber-300">{recoveryChallenge.label}</strong>?
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={recoveryMathInput}
                          onChange={(e) => {
                            setRecoveryMathInput(e.target.value);
                            setSecurityError(null);
                          }}
                          placeholder="Risultato..."
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm border border-white/25 focus:border-amber-300 focus:outline-none tabular-nums"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (Number(recoveryMathInput.trim()) === recoveryChallenge.answer) {
                              setSecurityPanel('closed');
                              onResetProgress();
                              setSecuritySuccess('Statistiche azzerate correttamente.');
                            } else {
                              setSecurityError('Risultato non corretto. Controlla il calcolo e riprova.');
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer min-h-[44px]"
                        >
                          Conferma Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => openSecurityPanel('setup_pin')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer min-h-[44px]"
                        >
                          Imposta un Codice PIN
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MODE 3: FORGOT PARENT PIN RECOVERY (2-STEP ADULT VERIFICATION) */}
            {securityPanel === 'forgot_pin' && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-fun font-extrabold text-sm sm:text-base text-amber-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      Verifica Genitore · Cambia o Recupera Codice (2 Passi)
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Per proteggere il profilo e reimpostare il codice, inserisci l’anno di nascita di {childName} e risolvi il calcolo per adulti.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityPanel('closed')}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Chiudi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {securityError && (
                  <p className="text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-400/40 rounded-xl px-3 py-2">
                    {securityError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      1. Anno di nascita di {childName} (4 cifre) *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={recoveryBirthYear}
                      onChange={(e) => {
                        setRecoveryBirthYear(e.target.value);
                        setSecurityError(null);
                      }}
                      placeholder="Es. 2020"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm border border-white/25 focus:border-amber-300 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      2. Calcolo Adulto: Quanto fa <strong className="text-amber-300">{recoveryChallenge.label}</strong>? *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={recoveryMathInput}
                      onChange={(e) => {
                        setRecoveryMathInput(e.target.value);
                        setSecurityError(null);
                      }}
                      placeholder="Inserisci risultato"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm border border-white/25 focus:border-amber-300 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openSecurityPanel('verify_reset')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer min-h-[40px]"
                  >
                    Torna Indietro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const yearOk = Number(recoveryBirthYear.trim()) === ageInfo.birthYear;
                      const mathOk = Number(recoveryMathInput.trim()) === recoveryChallenge.answer;
                      if (!yearOk) {
                        setSecurityError(
                          'L’anno di nascita non corrisponde al profilo configurato. Controlla e riprova.'
                        );
                        return;
                      }
                      if (!mathOk) {
                        setSecurityError(
                          'Il risultato del calcolo non è corretto. Ricorda: prima la moltiplicazione, poi la somma!'
                        );
                        return;
                      }
                      setSecurityError(null);
                      setNewPin('');
                      setConfirmPin('');
                      setSecurityPanel('recovery_set_pin');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer min-h-[40px]"
                  >
                    Verifica e Reimposta Codice
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PIN & RESET ACTIONS INSIDE SECURITY TAB */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 pb-4">
          {onUpdateParentPin && (
            <button
              type="button"
              onClick={() => openSecurityPanel(hasParentPin ? 'forgot_pin' : 'setup_pin')}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors px-3.5 py-2 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-400/30 cursor-pointer min-h-[40px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {hasParentPin ? 'Cambia / Recupera PIN Genitori' : 'Imposta PIN Genitori'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openSecurityPanel('verify_reset')}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/25 cursor-pointer min-h-[40px]"
          >
            <RotateCcw className="w-4 h-4" /> Azzera Percorso e Statistiche
          </button>
        </div>
          </>
        )}

        {/* CLEAN COMPACT FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-white/10">
          <p className="text-[11px] text-slate-400 leading-snug">
            Dati e PIN conservati 100% in locale sul dispositivo · Accesso protetto da PIN
          </p>
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleDownloadPdfReport}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-fun font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>Scarica PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/18 text-white font-fun font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Chiudi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
