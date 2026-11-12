import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SavedDrawing, UserProgress } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Download, 
  Save, 
  ChevronLeft,
  Eraser,
  Wand2,
  Sticker,
  Check,
  Heart,
  Music,
  VolumeX
} from 'lucide-react';

interface StudioDisegnoProps {
  onSaveDrawing: (drawing: SavedDrawing) => void;
  onClose: () => void;
  progress?: UserProgress;
}

type BrushMode = 'rainbow' | 'glitter' | 'neon' | 'color' | 'eraser' | 'sticker';

const BRUSH_COLORS = [
  { name: 'Rosa Emma', hex: '#ff4d94', bg: 'bg-[#ff4d94]' },
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
  const [musicPlaying, setMusicPlaying] = useState<boolean>(soundManager.musicEnabled);

  useEffect(() => {
    return soundManager.onMusicChange((enabled) => {
      setMusicPlaying(enabled);
    });
  }, []);

  // Drawing state
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef<number>(0);
  const sparkleSoundThrottleRef = useRef<number>(0);

  // Undo stack
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  // Sound & Voice welcome
  useEffect(() => {
    soundManager.speakInstruction(
      'Benvenuta nello Studio di Disegno, Emma! Prendi i pennelli magici e crea un capolavoro!'
    );
  }, []);

  // Initialize and resize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Available space inside container
    const width = Math.min(1200, Math.max(300, container.clientWidth));
    const height = Math.min(900, Math.max(250, container.clientHeight));

    // Save previous drawing if canvas already has content
    let prevData: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        // ignore
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Fill pristine white canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (prevData) {
      // Restore scaled
      try {
        ctx.putImageData(prevData, 0, 0);
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
    const handleResize = () => {
      // Debounced re-init or preserve
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    soundManager.speak('Tela pulita! Pronta per un nuovo disegno!', 1.25);
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

  // Save drawing into Emma's gallery
  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playFanfare();
    confetti.burst();
    setSaveSuccess(true);

    const dataUrl = canvas.toDataURL('image/png');
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
    soundManager.speakPraise('Che capolavoro splendido, Emma! L\'ho salvato nella tua bacheca!');

    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  // Download image locally to device
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playSuccess();
    const link = document.createElement('a');
    link.download = `Emma_Capolavoro_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    soundManager.speakPraise('Disegno scaricato sul tuo tablet!');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#1b0b38]/95 via-[#281353]/90 to-[#0e0622]/95 backdrop-blur-xs text-white select-none overflow-hidden h-[100dvh] max-h-[100dvh]">
      
      {/* ============================================================== */}
      {/* 1. TOP BAR: TITLE & ESSENTIAL ACTIONS (COMPACT, NON-OVERFLOWING) */}
      {/* ============================================================== */}
      <div className="relative z-20 flex items-center justify-between px-2.5 sm:px-4 py-2 bg-slate-950/80 border-b border-white/10 backdrop-blur-md shrink-0 gap-2">
        {/* Back Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-fun font-bold text-xs sm:text-sm rounded-2xl border border-white/20 flex items-center gap-1.5 cursor-pointer shadow transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-pink-300" />
          <span>Esci</span>
        </button>

        {/* Studio Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-xl sm:text-2xl animate-bounce shrink-0">🎨</span>
          <h2 className="font-kids font-bold text-sm sm:text-lg text-yellow-300 truncate tracking-wide">
            Studio di Disegno di Emma ✨
          </h2>
        </div>

        {/* Top Action Buttons: Undo, Clear, Download, Save */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            title="Annulla"
            className="p-2 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 active:scale-95 text-white font-fun font-bold text-xs sm:text-sm rounded-2xl border border-white/15 flex items-center gap-1 cursor-pointer transition-all shadow"
          >
            <RotateCcw className="w-4 h-4 text-amber-300" />
            <span className="hidden md:inline">Annulla</span>
          </button>

          <button
            onClick={handleClear}
            title="Pulisci Tela"
            className="p-2 sm:px-3 sm:py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 active:scale-95 font-fun font-bold text-xs sm:text-sm rounded-2xl border border-rose-400/30 flex items-center gap-1 cursor-pointer transition-all shadow"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">Pulisci</span>
          </button>

          <button
            onClick={handleDownload}
            title="Scarica Disegno"
            className="p-2 sm:px-3 sm:py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 active:scale-95 font-fun font-bold text-xs sm:text-sm rounded-2xl border border-sky-400/30 flex items-center gap-1 cursor-pointer transition-all shadow"
          >
            <Download className="w-4 h-4 text-sky-300" />
            <span className="hidden md:inline">Scarica</span>
          </button>

          <button
            onClick={handleSaveDrawing}
            className="px-3.5 py-1.5 sm:px-5 sm:py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-kids font-bold text-xs sm:text-sm rounded-2xl border-b-4 border-emerald-700 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/30"
          >
            <Save className="w-4 h-4 fill-slate-950" />
            <span>Salva ✨</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CENTER STAGE: THE PURE WHITE CANVAS (FITS SCREEN DYNAMICALLY) */}
      {/* ============================================================== */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-3 overflow-hidden"
      >
        <div className="relative w-full h-full max-w-5xl max-h-[80vh] flex items-center justify-center">
          {/* Framed White Canvas with soft outer shadow */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            style={{ touchAction: 'none' }}
            className="w-full h-full object-contain bg-white rounded-3xl sm:rounded-4xl border-4 sm:border-6 border-amber-300 shadow-[0_10px_40px_rgba(0,0,0,0.5)] cursor-crosshair select-none"
          />

          {/* Quick Brush Mode Indicator Floater in Corner */}
          <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/20 text-xs font-fun font-bold text-yellow-300 pointer-events-none flex items-center gap-1.5 shadow-md">
            <span>Pennello:</span>
            <span className="text-white capitalize">
              {brushMode === 'rainbow' && '🌈 Arcobaleno Magico'}
              {brushMode === 'glitter' && '✨ Glitter & Stelline'}
              {brushMode === 'neon' && '🌟 Bagliore Fatato'}
              {brushMode === 'eraser' && '🧽 Gomma'}
              {brushMode === 'sticker' && `🦄 Timbro ${selectedSticker}`}
              {brushMode === 'color' && '🎨 Colore Classico'}
            </span>
          </div>

          {/* Save Success Banner */}
          {saveSuccess && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs rounded-3xl sm:rounded-4xl flex flex-col items-center justify-center p-4 z-30 animate-fade-in">
              <div className="w-18 h-18 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-4xl mb-3 shadow-2xl animate-bounce">
                🌟
              </div>
              <h3 className="text-2xl sm:text-3xl font-kids font-bold text-yellow-300">
                Capolavoro Salvato!
              </h3>
              <p className="text-sm sm:text-base font-fun text-white mt-1">
                +3 Stelle per Emma! ⭐⭐⭐
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM CONTROL DOCK: MAGIC BRUSHES, PALETTE, SIZES, STICKERS */}
      {/* ============================================================== */}
      <div className="relative z-20 bg-slate-950/90 border-t border-white/10 px-2 sm:px-4 py-2 shrink-0 flex flex-col gap-1.5">
        
        {/* Row 1: Brush Modes & Sizes */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Magic Brushes Segment */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* 1. Rainbow Brush */}
            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('rainbow');
                setIsStickerDrawerOpen(false);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                brushMode === 'rainbow'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white border-yellow-300 shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
              }`}
            >
              <span className="text-base sm:text-lg">🌈</span>
              <span className="whitespace-nowrap">Arcobaleno</span>
            </button>

            {/* 2. Glitter & Stars Brush */}
            <button
              onClick={() => {
                soundManager.playTwinkle();
                setBrushMode('glitter');
                setIsStickerDrawerOpen(false);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                brushMode === 'glitter'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border-white shadow-lg scale-105 animate-pulse'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
              }`}
            >
              <span className="text-base sm:text-lg">✨</span>
              <span className="whitespace-nowrap">Glitter</span>
            </button>

            {/* 3. Neon Glow Brush */}
            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('neon');
                setIsStickerDrawerOpen(false);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                brushMode === 'neon'
                  ? 'bg-purple-600 text-white border-pink-400 shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
              }`}
            >
              <Wand2 className="w-4 h-4 text-cyan-300" />
              <span className="whitespace-nowrap">Bagliore</span>
            </button>

            {/* 4. Eraser */}
            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('eraser');
                setIsStickerDrawerOpen(false);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                brushMode === 'eraser'
                  ? 'bg-white text-slate-950 border-amber-400 shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
              }`}
            >
              <Eraser className="w-4 h-4 text-pink-500" />
              <span className="whitespace-nowrap">Gomma</span>
            </button>

            {/* 5. Stickers / Timbri */}
            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('sticker');
                setIsStickerDrawerOpen(prev => !prev);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-kids font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                brushMode === 'sticker'
                  ? 'bg-pink-600 text-white border-yellow-300 shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
              }`}
            >
              <span className="text-base sm:text-lg">{selectedSticker}</span>
              <span className="whitespace-nowrap">Adesivi</span>
            </button>
          </div>

          {/* Brush Size Controls */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/15 shrink-0">
            <button
              onClick={() => {
                soundManager.playPop();
                setBrushSize(12);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center cursor-pointer ${
                brushSize === 12 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
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
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center cursor-pointer ${
                brushSize === 22 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
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
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center cursor-pointer ${
                brushSize === 38 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
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
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-xs font-kids font-bold text-pink-300 whitespace-nowrap pl-2">
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
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xl sm:text-2xl flex items-center justify-center cursor-pointer transition-transform ${
                  selectedSticker === stk && brushMode === 'sticker'
                    ? 'bg-amber-400 scale-120 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 active:scale-95'
                }`}
              >
                {stk}
              </button>
            ))}
          </div>
        ) : (
          /* Color Palette Buttons */
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-1">
            <span className="text-xs font-kids font-bold text-yellow-300 whitespace-nowrap hidden sm:inline pl-1">
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
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${c.bg} cursor-pointer transition-all duration-150 flex items-center justify-center border-2 ${
                    isCurrent ? 'border-white scale-120 shadow-lg shadow-pink-500/40 ring-2 ring-yellow-400' : 'border-white/40 hover:scale-110 active:scale-95'
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
  );
};
