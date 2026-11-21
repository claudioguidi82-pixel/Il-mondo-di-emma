import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SavedDrawing, UserProgress } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { getDisplayChildName, getGenderedWord } from '../utils/childProfile';
import { 
  RotateCcw, 
  Trash2, 
  Download, 
  Save, 
  Home,
  Eraser,
  Wand2,
  Check
} from 'lucide-react';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';

interface StudioDisegnoProps {
  onSaveDrawing: (drawing: SavedDrawing) => void;
  onClose: () => void;
  progress?: UserProgress;
}

type BrushMode = 'rainbow' | 'glitter' | 'neon' | 'color' | 'eraser' | 'sticker';

const BRUSH_COLORS = [
  { name: 'Rosa Magico', hex: '#ff4d94', bg: 'bg-[#ff4d94]' },
  { name: 'Giallo Sole', hex: '#fbbf24', bg: 'bg-amber-400' },
  { name: 'Celeste Cielo', hex: '#38bdf8', bg: 'bg-sky-400' },
  { name: 'Verde Prato', hex: '#22c55e', bg: 'bg-green-500' },
  { name: 'Arancione Carota', hex: '#fb923c', bg: 'bg-orange-400' },
  { name: 'Viola Fata', hex: '#c084fc', bg: 'bg-purple-400' },
  { name: 'Rosso Fragola', hex: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Blu Notte', hex: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Nero Carbone', hex: '#1e293b', bg: 'bg-slate-800' },
];

const STICKERS_LIST = ['⭐', '💖', '🦄', '🌈', '🌸', '🦋', '👑', '🍓', '🐱', '🐬', '🎈', '🍭', '🐶', '🍦'];

export const StudioDisegno: React.FC<StudioDisegnoProps> = ({
  onSaveDrawing,
  onClose,
  progress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Brush settings
  const [brushMode, setBrushMode] = useState<BrushMode>('rainbow');
  const [selectedColor, setSelectedColor] = useState<string>('#ff4d94');
  const [brushSize, setBrushSize] = useState<number>(20); // 10 = small, 20 = medium, 36 = jumbo
  const [selectedSticker, setSelectedSticker] = useState<string>('⭐');
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Drawing state
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef<number>(0);
  const sparkleSoundThrottleRef = useRef<number>(0);

  // Undo stack
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  const childProfile = progress?.childProfile;
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const welcomeWord = getGenderedWord(childGender, 'Benvenuta', 'Benvenuto', 'Benvenuto');

  // Sound & Voice welcome
  useEffect(() => {
    soundManager.speakInstruction(
      `${welcomeWord} nello Studio di Disegno, ${childName}! Prendi i pennelli magici e crea un capolavoro!`
    );
    return () => {
      soundManager.stopSpeech();
    };
  }, [welcomeWord, childName]);

  // Initialize and resize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Match canvas internal resolution 1:1 with the rendered stage box (prevents pointer offset)
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(240, Math.round(rect.width || container.clientWidth));
    const height = Math.max(160, Math.round(rect.height || container.clientHeight));

    // Save previous drawing as offscreen canvas if canvas already has content
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

    // Fill pristine white canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (prevOffscreen) {
      try {
        ctx.drawImage(prevOffscreen, 0, 0, width, height);
      } catch {
        // ignore
      }
    }

    // Save initial state to undo stack
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
    setUndoStack(prev => [...prev.slice(-12), data]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const newStack = [...undoStack];
    newStack.pop(); // Remove current
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
    soundManager.speak(`Tela pulita, ${childName}! ${readyWord} per un nuovo disegno!`);
  };

  // Convert client coordinates to canvas internal coordinates
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

  // Stamp sticker at coordinate
  const stampSticker = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    soundManager.playTwinkle();
    confetti.burst(undefined, undefined, 8);

    ctx.save();
    ctx.font = `${brushSize * 2.5}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedSticker, x, y);
    ctx.restore();

    saveCanvasState();
  };

  // Stroke rendering
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
      // Clean white eraser
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 2;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (brushMode === 'rainbow') {
      // Dynamic rotating rainbow HSL
      hueRef.current = (hueRef.current + 5) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 100%, 55%)`;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Soft glow
      ctx.strokeStyle = `hsla(${hueRef.current}, 100%, 65%, 0.4)`;
      ctx.lineWidth = brushSize * 1.5;
      ctx.stroke();
    } else if (brushMode === 'glitter') {
      // Golden / Sparkling trail with star particles
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = brushSize * 0.9;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Sprinkle sparkling stars and glitter specks
      const sparkles = ['✨', '⭐', '💖', '🌟', '•'];
      const spark = sparkles[Math.floor(Math.random() * sparkles.length)];
      ctx.font = `${brushSize * 0.9}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const offsetX = (Math.random() - 0.5) * brushSize * 2.2;
      const offsetY = (Math.random() - 0.5) * brushSize * 2.2;
      ctx.fillText(spark, x + offsetX, y + offsetY);

      // Throttled sound effect for sparkles
      const now = Date.now();
      if (now - sparkleSoundThrottleRef.current > 180) {
        sparkleSoundThrottleRef.current = now;
        soundManager.playTwinkle();
      }
    } else if (brushMode === 'neon') {
      // Glowing fairy pastel line
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize * 1.2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = selectedColor;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Classic vibrant color brush
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

  // Pointer event handlers (touch + mouse seamless support)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore if unsupported
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

  // Save drawing into Emma's gallery (compressed JPEG to stay well within localStorage quota)
  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playFanfare();
    confetti.burst();
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
      title: `Disegno Magico #${(progress?.savedDrawings?.length || 0) + 1}`,
      date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
      dataUrl,
      starsEarned: 3,
      stickersCount: 1,
      templateName: 'Tela Bianca Creativa',
    };

    onSaveDrawing(newDrawing);
    soundManager.speakPraise(
      `Che capolavoro splendido, ${childName}! L'ho salvato nella tua bacheca!`
    );

    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  // Download image locally to device
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playSuccess();
    const safeFileName = childName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Bimbo';
    const link = document.createElement('a');
    link.download = `${safeFileName}_Capolavoro_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    soundManager.speakPraise(`Disegno scaricato sul tuo dispositivo, ${childName}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden h-[100dvh] max-h-[100dvh] text-slate-900">
      {/* SUNNY PIXAR 3D MEADOW BACKDROP */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src={arenaMeadowBackdrop}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center brightness-[1.03] saturate-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/25 via-white/15 to-amber-100/45" />
      </div>

      {/* ============================================================== */}
      {/* 1. STORYBOOK 3D TOP BAR: HOME, WOODEN BADGE & ACTIONS          */}
      {/* ============================================================== */}
      <div className="relative z-20 flex flex-wrap items-center justify-between px-2.5 sm:px-5 pt-2.5 pb-1.5 shrink-0 gap-2">
        {/* Back Home 3D Bubble */}
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.playPop();
            onClose();
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-amber-50 active:translate-y-0.5 text-amber-950 font-fun font-extrabold text-xs sm:text-sm rounded-full border-2 border-amber-200 shadow-[0_4px_0_#d97706,0_8px_16px_rgba(120,53,15,0.2)] flex items-center gap-1.5 cursor-pointer transition-all shrink-0 whitespace-nowrap"
        >
          <Home className="w-4 h-4 text-orange-500" />
          <span>Home</span>
        </button>

        {/* Carved Wood Studio Title Plaque */}
        <div className="home-wood-outer rounded-2xl p-[3px] shrink-0 hidden xs:inline-flex sm:inline-flex">
          <div className="home-inner-purple rounded-[13px] px-3 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1.5 text-white">
            <span className="text-base sm:text-lg leading-none" aria-hidden="true">🎨</span>
            <h2 className="relative z-10 font-kids font-bold text-xs sm:text-base text-white whitespace-nowrap drop-shadow-xs">
              Studio Disegno
            </h2>
          </div>
        </div>

        {/* Top Action Buttons: Undo, Clear, Download, Save */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            title="Annulla"
            className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-amber-50 disabled:opacity-45 active:translate-y-0.5 text-amber-950 font-fun font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-amber-200 shadow-[0_3px_0_#d97706] flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Annulla</span>
          </button>

          <button
            onClick={handleClear}
            title="Pulisci Tela"
            className="p-2 sm:px-3 sm:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 active:translate-y-0.5 font-fun font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-rose-200 shadow-[0_3px_0_#fb7185] flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="hidden md:inline">Pulisci</span>
          </button>

          <button
            onClick={handleDownload}
            title="Scarica Disegno"
            className="p-2 sm:px-3 sm:py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 active:translate-y-0.5 font-fun font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-sky-200 shadow-[0_3px_0_#38bdf8] flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span className="hidden md:inline">Scarica</span>
          </button>

          <button
            onClick={handleSaveDrawing}
            className="home-wood-outer rounded-2xl p-[3px] cursor-pointer active:translate-y-0.5 transition-transform"
          >
            <span className="home-inner-green rounded-[12px] px-3 py-1.5 sm:px-4 sm:py-1.5 text-white font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap">
              <Save className="relative z-10 w-4 h-4" />
              <span className="relative z-10">Salva</span>
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CENTER STAGE: CARVED WOODEN EASEL & PURE WHITE CANVAS       */}
      {/* ============================================================== */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-2.5 sm:px-5 py-1.5 sm:py-2.5 overflow-hidden"
      >
        <div className="home-wood-outer relative w-full h-full max-w-5xl rounded-[26px] sm:rounded-[30px] p-[6px] sm:p-[8px] shadow-[0_20px_48px_rgba(92,40,6,0.38)] flex items-center justify-center">
          <div className="relative w-full h-full rounded-[20px] sm:rounded-[22px] overflow-hidden bg-white border-2 border-amber-100">
            {/* Framed White Canvas with 1:1 pointer-accurate sizing */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              style={{ touchAction: 'none' }}
              className="w-full h-full bg-white cursor-crosshair select-none block"
            />

            {/* Quick Brush Mode Indicator Floater in Corner */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-amber-50/95 backdrop-blur-xs rounded-full border-2 border-amber-200 text-xs font-fun font-bold text-amber-900 pointer-events-none flex items-center gap-1.5 shadow-sm">
              <span className="text-amber-700/80">Pennello:</span>
              <span className="text-amber-950 font-extrabold">
                {brushMode === 'rainbow' && '🌈 Arcobaleno'}
                {brushMode === 'glitter' && '✨ Glitter'}
                {brushMode === 'neon' && '🌟 Bagliore'}
                {brushMode === 'eraser' && '🧽 Gomma'}
                {brushMode === 'sticker' && `${selectedSticker} Adesivo`}
                {brushMode === 'color' && '🎨 Colore'}
              </span>
            </div>

            {/* Save Success Banner */}
            {saveSuccess && (
              <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-30 animate-pop-in">
                <div className="home-wood-outer rounded-[28px] p-[5px] max-w-sm w-full">
                  <div className="bg-gradient-to-b from-[#fffef8] to-[#fef3d8] rounded-[23px] p-5 text-center border border-amber-200">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white flex items-center justify-center text-3xl mb-3 shadow-[0_5px_0_#15803d]">
                      🌟
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-kids font-bold text-amber-950">
                      Capolavoro Salvato!
                    </h3>
                    <p className="text-sm sm:text-base font-fun font-bold text-amber-700 mt-1">
                      +3 Stelline per {childName} ⭐⭐⭐
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM CARVED WOOD & PARCHMENT ARTIST PALETTE DOCK          */}
      {/* ============================================================== */}
      <div className="studio-toolbar-dock relative z-20 px-2.5 sm:px-5 pb-2.5 pt-1 shrink-0">
        <div className="home-wood-outer max-w-5xl mx-auto rounded-[24px] p-[4px]">
          <div className="bg-gradient-to-b from-[#fffef7] via-[#fff7e2] to-[#fdecc8] rounded-[20px] px-2.5 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-2 border border-amber-200/80">
            
            {/* Row 1: Brush Modes & Sizes */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
              {/* Magic Brushes Segment */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 1. Rainbow Brush */}
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushMode('rainbow');
                    setIsStickerDrawerOpen(false);
                  }}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-fun font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                    brushMode === 'rainbow'
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white border-white shadow-[0_3px_0_#7e22ce]'
                      : 'bg-white text-amber-950 border-amber-200 hover:bg-amber-50 shadow-[0_2px_0_#e5c38b]'
                  }`}
                >
                  <span className="text-base leading-none">🌈</span>
                  <span className="whitespace-nowrap">Arcobaleno</span>
                </button>

                {/* 2. Glitter & Stars Brush */}
                <button
                  onClick={() => {
                    soundManager.playTwinkle();
                    setBrushMode('glitter');
                    setIsStickerDrawerOpen(false);
                  }}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-fun font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                    brushMode === 'glitter'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border-white shadow-[0_3px_0_#d97706]'
                      : 'bg-white text-amber-950 border-amber-200 hover:bg-amber-50 shadow-[0_2px_0_#e5c38b]'
                  }`}
                >
                  <span className="text-base leading-none">✨</span>
                  <span className="whitespace-nowrap">Glitter</span>
                </button>

                {/* 3. Neon Glow Brush */}
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushMode('neon');
                    setIsStickerDrawerOpen(false);
                  }}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-fun font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                    brushMode === 'neon'
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-white shadow-[0_3px_0_#4338ca]'
                      : 'bg-white text-amber-950 border-amber-200 hover:bg-amber-50 shadow-[0_2px_0_#e5c38b]'
                  }`}
                >
                  <Wand2 className={`w-4 h-4 ${brushMode === 'neon' ? 'text-cyan-200' : 'text-violet-500'}`} />
                  <span className="whitespace-nowrap">Bagliore</span>
                </button>

                {/* 4. Eraser */}
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushMode('eraser');
                    setIsStickerDrawerOpen(false);
                  }}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-fun font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                    brushMode === 'eraser'
                      ? 'bg-rose-500 text-white border-white shadow-[0_3px_0_#be123c]'
                      : 'bg-white text-amber-950 border-amber-200 hover:bg-amber-50 shadow-[0_2px_0_#e5c38b]'
                  }`}
                >
                  <Eraser className={`w-4 h-4 ${brushMode === 'eraser' ? 'text-white' : 'text-pink-500'}`} />
                  <span className="whitespace-nowrap">Gomma</span>
                </button>

                {/* 5. Stickers / Timbri */}
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushMode('sticker');
                    setIsStickerDrawerOpen(prev => !prev);
                  }}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-fun font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                    brushMode === 'sticker'
                      ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white border-white shadow-[0_3px_0_#a21caf]'
                      : 'bg-white text-amber-950 border-amber-200 hover:bg-amber-50 shadow-[0_2px_0_#e5c38b]'
                  }`}
                >
                  <span className="text-base leading-none">{selectedSticker}</span>
                  <span className="whitespace-nowrap">Adesivi</span>
                </button>
              </div>

              {/* Brush Size Controls */}
              <div className="flex items-center gap-1 bg-amber-100/90 p-1 rounded-2xl border-2 border-amber-200 shrink-0">
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushSize(12);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                    brushSize === 12
                      ? 'bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309]'
                      : 'text-amber-800/70 hover:bg-white/60'
                  }`}
                  title="Tratto Sottile"
                >
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                </button>
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushSize(22);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                    brushSize === 22
                      ? 'bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309]'
                      : 'text-amber-800/70 hover:bg-white/60'
                  }`}
                  title="Tratto Medio"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-current"></div>
                </button>
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setBrushSize(38);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                    brushSize === 38
                      ? 'bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309]'
                      : 'text-amber-800/70 hover:bg-white/60'
                  }`}
                  title="Tratto Grande"
                >
                  <div className="w-5 h-5 rounded-full bg-current"></div>
                </button>
              </div>
            </div>

            {/* Row 2: Either Stickers Selector OR Palette Colors */}
            {brushMode === 'sticker' || isStickerDrawerOpen ? (
              /* Stickers Carousel */
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1.5 bg-amber-100/70 rounded-2xl border border-amber-200/90">
                <span className="text-xs font-kids font-bold text-amber-900 whitespace-nowrap pl-1.5 shrink-0">
                  Tocca e timbra:
                </span>
                {STICKERS_LIST.map((stk, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playPop();
                      setSelectedSticker(stk);
                      setBrushMode('sticker');
                    }}
                    className={`w-10 h-10 shrink-0 rounded-xl text-xl sm:text-2xl flex items-center justify-center cursor-pointer transition-transform border-2 ${
                      selectedSticker === stk && brushMode === 'sticker'
                        ? 'bg-amber-300 border-white scale-110 shadow-[0_3px_0_#d97706]'
                        : 'bg-white border-amber-200 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {stk}
                  </button>
                ))}
              </div>
            ) : (
              /* Color Palette Buttons */
              <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-1">
                <span className="text-xs font-kids font-bold text-amber-900 whitespace-nowrap hidden sm:inline pl-1 shrink-0">
                  Colori:
                </span>
                {BRUSH_COLORS.map(c => {
                  const isCurrent = (brushMode === 'color' || brushMode === 'neon') && selectedColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        soundManager.playPop();
                        setSelectedColor(c.hex);
                        if (brushMode !== 'color' && brushMode !== 'neon') {
                          setBrushMode('color');
                        }
                      }}
                      className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full ${c.bg} cursor-pointer transition-all duration-150 flex items-center justify-center border-2 shadow-[0_3px_0_rgba(120,53,15,0.28)] ${
                        isCurrent
                          ? 'border-white scale-115 ring-3 ring-amber-400 shadow-[0_4px_10px_rgba(217,119,6,0.45)]'
                          : 'border-white/90 hover:scale-110 active:scale-95'
                      }`}
                      title={c.name}
                    >
                      {isCurrent && <Check className={`w-4 h-4 ${c.hex === '#1e293b' ? 'text-white' : 'text-slate-900'}`} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
