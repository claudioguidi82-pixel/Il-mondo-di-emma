import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { SavedDrawing, UserProgress } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import {
  calculateChildAge,
  getAgeVisualTheme,
  getDisplayChildName,
  getGenderedWord,
} from '../utils/childProfile';
import {
  RotateCcw,
  Trash2,
  Download,
  Save,
  Home,
  Eraser,
  Wand2,
  Check,
  PenTool,
  Sparkles,
  Shapes,
} from 'lucide-react';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';

interface StudioDisegnoProps {
  onSaveDrawing: (drawing: SavedDrawing) => void;
  onClose: () => void;
  progress?: UserProgress;
}

type BrushMode = 'rainbow' | 'glitter' | 'neon' | 'color' | 'eraser' | 'sticker';

const BRUSH_COLORS = [
  { name: 'Nero Grafite', hex: '#0f172a', bg: 'bg-slate-900' },
  { name: 'Blu Cobalto', hex: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Celeste Cielo', hex: '#38bdf8', bg: 'bg-sky-400' },
  { name: 'Verde Smeraldo', hex: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Giallo Ocra', hex: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Arancione Corallo', hex: '#f97316', bg: 'bg-orange-500' },
  { name: 'Rosso Cremisi', hex: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Rosa Vivo', hex: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Viola Indaco', hex: '#7c3aed', bg: 'bg-violet-600' },
];

const KIDS_STICKERS = ['⭐', '💖', '🦄', '🌈', '🌸', '🦋', '👑', '🍓', '🐱', '🐬', '🎈', '🐶'];
const MATURE_STICKERS = ['✦', '◈', '▲', '●', '⚡', '🧭', '🛰️', '🔬', '📐', '🎵', '🌍', '★'];

export const StudioDisegno: React.FC<StudioDisegnoProps> = ({
  onSaveDrawing,
  onClose,
  progress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const childProfile = progress?.childProfile;
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const ageYears = calculateChildAge(childProfile?.birthDate).years;
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageYears, childProfile?.name, childGender),
    [ageYears, childProfile?.name, childGender]
  );
  const isMature = ageTheme.isMatureTheme;
  const isTeen = ageTheme.stageId === 'teen_nextgen';
  const isExplorer = ageTheme.stageId === 'primary_explorer';
  const gPalette = ageTheme.genderPalette;
  const welcomeWord = getGenderedWord(childGender, 'Benvenuta', 'Benvenuto', 'Benvenuto');

  const sizePresets = useMemo(
    () => (isMature ? [4, 10, 20] : [10, 20, 36]),
    [isMature]
  );
  const activeStickers = isMature ? MATURE_STICKERS : KIDS_STICKERS;

  const [brushMode, setBrushMode] = useState<BrushMode>(() => (isMature ? 'color' : 'rainbow'));
  const [selectedColor, setSelectedColor] = useState<string>(() => gPalette.accentHex || '#2563eb');
  const [brushSize, setBrushSize] = useState<number>(() => (isMature ? 10 : 20));
  const [selectedSticker, setSelectedSticker] = useState<string>(() =>
    isMature ? '✦' : '⭐'
  );
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef<number>(0);
  const sparkleSoundThrottleRef = useRef<number>(0);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  useEffect(() => {
    soundManager.speakInstruction(
      isMature
        ? `${ageTheme.labels.studioTitle} pronto. Usa penna, evidenziatore neon o timbri geometrici.`
        : `${welcomeWord} nello Studio di Disegno, ${childName}! Prendi i pennelli e crea un capolavoro!`
    );
    return () => {
      soundManager.stopSpeech();
    };
  }, [welcomeWord, childName, isMature, ageTheme.labels.studioTitle]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(240, Math.round(rect.width || container.clientWidth));
    const height = Math.max(160, Math.round(rect.height || container.clientHeight));

    let prevOffscreen: HTMLCanvasElement | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        prevOffscreen = document.createElement('canvas');
        prevOffscreen.width = canvas.width;
        prevOffscreen.height = canvas.height;
        const offCtx = prevOffscreen.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(canvas, 0, 0);
        }
      } catch {
        prevOffscreen = null;
      }
    }

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (prevOffscreen) {
      try {
        ctx.drawImage(prevOffscreen, 0, 0, width, height);
      } catch {
        // ignore
      }
    }

    const initialSnap = ctx.getImageData(0, 0, width, height);
    setUndoStack([initialSnap]);
  }, []);

  useEffect(() => {
    initCanvas();
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initCanvas();
      }, 180);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [initCanvas]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-12), data]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const newStack = [...undoStack];
    newStack.pop();
    const previous = newStack[newStack.length - 1];
    ctx.putImageData(previous, 0, 0);
    setUndoStack(newStack);
  };

  const handleClear = () => {
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
    const readyWord = getGenderedWord(childGender, 'Pronta', 'Pronto', 'Pronto');
    soundManager.speak(
      isMature ? 'Tavola ripulita.' : `Tela pulita, ${childName}! ${readyWord} per un nuovo disegno!`
    );
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const stampSticker = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    soundManager.playTwinkle();
    if (!isMature) confetti.burst(undefined, undefined, 8);

    ctx.save();
    ctx.fillStyle = selectedColor;
    ctx.font = `${Math.max(24, brushSize * 2.5)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedSticker, x, y);
    ctx.restore();

    saveCanvasState();
  };

  const drawLine = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const prev = lastPosRef.current || { x, y };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (brushMode === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 2;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (brushMode === 'rainbow') {
      hueRef.current = (hueRef.current + 5) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 95%, 52%)`;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.strokeStyle = `hsla(${hueRef.current}, 95%, 62%, 0.35)`;
      ctx.lineWidth = brushSize * 1.45;
      ctx.stroke();
    } else if (brushMode === 'glitter') {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = brushSize * 0.9;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      const sparkles = ['✨', '⭐', '•'];
      const spark = sparkles[Math.floor(Math.random() * sparkles.length)];
      ctx.font = `${brushSize * 0.9}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const offsetX = (Math.random() - 0.5) * brushSize * 2.1;
      const offsetY = (Math.random() - 0.5) * brushSize * 2.1;
      ctx.fillText(spark, x + offsetX, y + offsetY);

      const now = Date.now();
      if (now - sparkleSoundThrottleRef.current > 200) {
        sparkleSoundThrottleRef.current = now;
        soundManager.playTwinkle();
      }
    } else if (brushMode === 'neon') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize * 1.15;
      ctx.shadowBlur = 16;
      ctx.shadowColor = selectedColor;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.restore();
    lastPosRef.current = { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (brushMode === 'sticker') {
      stampSticker(coords.x, coords.y);
      return;
    }

    isDrawingRef.current = true;
    lastPosRef.current = coords;
    drawLine(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || brushMode === 'sticker') return;
    e.preventDefault();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    drawLine(coords.x, coords.y);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      e.preventDefault();
      isDrawingRef.current = false;
      lastPosRef.current = null;
      saveCanvasState();
    }
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playFanfare();
    if (!isTeen) confetti.burst();
    setSaveSuccess(true);

    let dataUrl = '';
    try {
      const maxThumbW = 640;
      const scale = Math.min(1, maxThumbW / canvas.width);
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = Math.max(1, Math.round(canvas.width * scale));
      thumbCanvas.height = Math.max(1, Math.round(canvas.height * scale));
      const tCtx = thumbCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
        tCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.78);
      } else {
        dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      }
    } catch {
      dataUrl = canvas.toDataURL('image/png');
    }

    const newDrawing: SavedDrawing = {
      id: `drawing_${Date.now()}`,
      title: isMature
        ? `Progetto #${(progress?.savedDrawings?.length || 0) + 1}`
        : `Disegno #${(progress?.savedDrawings?.length || 0) + 1}`,
      date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
      dataUrl,
      starsEarned: 3,
      stickersCount: 1,
      templateName: isMature ? 'Digital Sketchpad' : 'Tela Bianca Creativa',
    };

    onSaveDrawing(newDrawing);
    soundManager.speakPraise(
      isMature
        ? 'Elaborato salvato nella galleria.'
        : `Che capolavoro splendido, ${childName}! L'ho salvato nella tua bacheca!`
    );

    setTimeout(() => {
      setSaveSuccess(false);
    }, 2200);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playSuccess();
    const safeFileName = childName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Sketch';
    const link = document.createElement('a');
    link.download = `${safeFileName}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    soundManager.speakPraise(
      isMature ? 'Immagine esportata sul dispositivo.' : `Disegno scaricato sul tuo dispositivo, ${childName}!`
    );
  };

  return (
    <div
      className={`safe-viewport-pad fixed inset-0 z-50 flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh] ${
        isMature ? 'bg-[#0b0f17] text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* AGE-ADAPTIVE BACKDROP */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {isMature ? (
          <div className="w-full h-full bg-gradient-to-b from-[#0b0f17] via-[#0f172a] to-[#090d16]" />
        ) : (
          <>
            <img
              src={arenaMeadowBackdrop}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center ${
                isExplorer ? 'brightness-[0.95] saturate-[0.82]' : 'brightness-[1.02]'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-sky-200/25 via-white/15 to-amber-100/40" />
          </>
        )}
      </div>

      {/* 1. ALIGNED TOP BAR (ZERO OVERLAP) */}
      <header className="relative z-20 px-3 sm:px-5 pt-2 pb-1.5 shrink-0">
        <div className="ui-aligned-header max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => {
              soundManager.stopSpeech();
              soundManager.playPop();
              onClose();
            }}
            aria-label="Torna alla Home"
            className={`px-3 sm:px-4 h-10 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
              isMature
                ? 'rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-white/12'
                : 'rounded-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-white shadow-sm'
            }`}
          >
            <Home className={`w-4 h-4 shrink-0 ${isMature ? gPalette.accentTextClass : 'text-slate-700'}`} />
            <span className="hidden min-[370px]:inline font-fun font-bold text-xs sm:text-sm whitespace-nowrap">
              Home
            </span>
          </button>

          <div
            className={`h-10 px-3 sm:px-4 hidden sm:inline-flex items-center justify-center gap-2 mx-auto min-w-0 ${
              isMature
                ? `rounded-xl bg-slate-900/95 border ${gPalette.accentBorderClass} text-slate-100`
                : `rounded-full bg-gradient-to-r ${gPalette.headerGradientClass} border-2 border-white/85 text-white shadow-sm`
            }`}
          >
            <PenTool className={`w-4 h-4 shrink-0 ${isMature ? gPalette.accentTextClass : 'text-white'}`} />
            <h2 className="font-kids font-bold text-xs sm:text-sm whitespace-nowrap truncate">
              {ageTheme.labels.studioTitle}
            </h2>
          </div>

          <div className="flex items-center justify-end gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              title="Annulla"
              aria-label="Annulla"
              className={`h-10 px-2.5 sm:px-3 font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors ${
                isMature
                  ? 'rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/12'
                  : 'rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs'
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Annulla</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              title="Pulisci Tela"
              aria-label="Pulisci Tela"
              className={`h-10 px-2.5 sm:px-3 font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                isMature
                  ? 'rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-white/12'
                  : 'rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs'
              }`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Pulisci</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Scarica"
              aria-label="Scarica"
              className={`h-10 px-2.5 sm:px-3 font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                isMature
                  ? 'rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/12'
                  : 'rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 shadow-xs'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Esporta</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDrawing}
              className={`h-10 px-3 sm:px-4 font-fun font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors ${
                isMature
                  ? `rounded-xl ${gPalette.accentBgClass} ${gPalette.accentBgHoverClass}`
                  : `rounded-xl ${gPalette.tabActiveClass} border border-white/80 shadow-sm`
              }`}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>Salva</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CENTER CANVAS STAGE */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-3 sm:px-5 py-1.5 overflow-hidden"
      >
        <div
          className={`relative w-full h-full max-w-5xl flex items-center justify-center overflow-hidden ${
            isMature
              ? 'rounded-2xl border border-white/15 bg-white shadow-2xl'
              : 'home-wood-outer rounded-[24px] p-[5px]'
          }`}
        >
          <div className="relative w-full h-full rounded-[18px] overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              style={{ touchAction: 'none' }}
              className="w-full h-full bg-white cursor-crosshair select-none block"
            />

            {/* Subtle Active Tool Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/85 text-white rounded-lg text-[11px] font-fun font-semibold pointer-events-none flex items-center gap-1.5 shadow-xs">
              <span>
                {brushMode === 'color' && 'Penna'}
                {brushMode === 'rainbow' && 'Arcobaleno'}
                {brushMode === 'glitter' && 'Glitter'}
                {brushMode === 'neon' && 'Neon'}
                {brushMode === 'eraser' && 'Gomma'}
                {brushMode === 'sticker' && `Timbro ${selectedSticker}`}
              </span>
              <span className="opacity-60 tabular-nums">· {brushSize}px</span>
            </div>

            {saveSuccess && (
              <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-30 animate-pop-in">
                <div
                  className={`rounded-2xl p-5 text-center max-w-xs w-full shadow-2xl ${
                    isMature
                      ? 'bg-slate-900 border border-white/15 text-white'
                      : 'bg-white border-2 border-emerald-400 text-slate-900'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2.5">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-kids font-bold">
                    {isMature ? 'Progetto Salvato' : 'Capolavoro Salvato!'}
                  </h3>
                  <p className={`text-xs sm:text-sm font-medium mt-1 ${isMature ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isMature
                      ? 'Disponibile nella tua collezione.'
                      : `+3 Stelline per ${childName}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. ALIGNED BOTTOM PALETTE & TOOL DOCK */}
      <div className="studio-toolbar-dock relative z-20 px-3 sm:px-5 pb-2.5 pt-1 shrink-0">
        <div
          className={`max-w-5xl mx-auto px-3 py-2.5 flex flex-col gap-2 ${
            isMature
              ? 'rounded-2xl bg-slate-900/95 border border-white/12'
              : 'rounded-[22px] bg-white/95 backdrop-blur-md border-2 border-white shadow-lg'
          }`}
        >
          {/* Row 1: Tool Modes & Stroke Sizes */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setBrushMode('color');
                  setIsStickerDrawerOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  brushMode === 'color'
                    ? gPalette.tabActiveClass
                    : isMature
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 shrink-0" />
                <span>Penna</span>
              </button>

              {!isTeen && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setBrushMode('rainbow');
                    setIsStickerDrawerOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    brushMode === 'rainbow'
                      ? gPalette.tabActiveClass
                      : isMature
                      ? 'bg-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Arcobaleno</span>
                </button>
              )}

              {!isMature && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTwinkle();
                    setBrushMode('glitter');
                    setIsStickerDrawerOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    brushMode === 'glitter'
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>✨</span>
                  <span>Glitter</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setBrushMode('neon');
                  setIsStickerDrawerOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  brushMode === 'neon'
                    ? gPalette.tabActiveClass
                    : isMature
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 shrink-0" />
                <span>Neon</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setBrushMode('eraser');
                  setIsStickerDrawerOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  brushMode === 'eraser'
                    ? 'bg-rose-600 text-white'
                    : isMature
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Eraser className="w-3.5 h-3.5 shrink-0" />
                <span>Gomma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setBrushMode('sticker');
                  setIsStickerDrawerOpen((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-xl font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  brushMode === 'sticker'
                    ? gPalette.tabActiveClass
                    : isMature
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Shapes className="w-3.5 h-3.5 shrink-0" />
                <span>{isMature ? 'Simboli' : 'Adesivi'}</span>
              </button>
            </div>

            {/* Stroke Width Selector */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl shrink-0 ${
                isMature ? 'bg-slate-950 border border-white/10' : 'bg-slate-100 border border-slate-200'
              }`}
            >
              {sizePresets.map((sz, idx) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setBrushSize(sz);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    brushSize === sz
                      ? gPalette.tabActiveClass
                      : isMature
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                  title={`Tratto ${sz}px`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{ width: `${6 + idx * 5}px`, height: `${6 + idx * 5}px` }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Stickers/Symbols OR Swatches */}
          {brushMode === 'sticker' || isStickerDrawerOpen ? (
            <div
              className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1.5 rounded-xl ${
                isMature ? 'bg-slate-950/70 border border-white/8' : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <span className={`text-xs font-fun font-bold whitespace-nowrap pl-1 shrink-0 ${isMature ? 'text-slate-400' : 'text-slate-600'}`}>
                {isMature ? 'Simboli:' : 'Timbra:'}
              </span>
              {activeStickers.map((stk, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedSticker(stk);
                    setBrushMode('sticker');
                  }}
                  className={`w-9 h-9 shrink-0 rounded-lg text-lg flex items-center justify-center cursor-pointer transition-all ${
                    selectedSticker === stk && brushMode === 'sticker'
                      ? `${gPalette.tabActiveClass} scale-105`
                      : isMature
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {stk}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1">
              <span className={`text-xs font-fun font-bold whitespace-nowrap hidden sm:inline shrink-0 ${isMature ? 'text-slate-400' : 'text-slate-600'}`}>
                Colori:
              </span>
              {BRUSH_COLORS.map((c) => {
                const isCurrent =
                  (brushMode === 'color' || brushMode === 'neon') && selectedColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      setSelectedColor(c.hex);
                      if (brushMode !== 'color' && brushMode !== 'neon') {
                        setBrushMode('color');
                      }
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full ${c.bg} cursor-pointer transition-transform flex items-center justify-center border-2 ${
                      isCurrent
                        ? 'border-white scale-110 ring-2 ring-slate-400'
                        : 'border-white/75 hover:scale-105'
                    }`}
                    title={c.name}
                  >
                    {isCurrent && (
                      <Check className="w-4 h-4 text-white drop-shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
