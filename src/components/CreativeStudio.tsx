import React, { useRef, useState, useEffect } from 'react';
import { COLORING_TEMPLATES, STICKERS } from '../data/gameData';
import { SavedDrawing } from '../types/game';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { 
  Palette, 
  Sparkles, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  BookmarkCheck, 
  Download, 
  Smile, 
  Wand2, 
  Brush,
  ChevronLeft
} from 'lucide-react';

interface CreativeStudioProps {
  onSaveDrawing: (drawing: SavedDrawing) => void;
  onClose: () => void;
}

type BrushMode = 'normal' | 'rainbow' | 'glitter' | 'pastel' | 'eraser' | 'sticker';

const PALETTE_COLORS = [
  '#ec4899', // Emma Pink
  '#c084fc', // Lilac
  '#3b82f6', // Bright Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#fbbf24', // Sun Yellow
  '#f97316', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ffffff', // White
  '#1e293b', // Slate Dark
];

export const CreativeStudio: React.FC<CreativeStudioProps> = ({
  onSaveDrawing,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>('rainbow');
  const [selectedColor, setSelectedColor] = useState<string>('#ec4899');
  const [brushSize, setBrushSize] = useState<number>(18);
  const [selectedSticker, setSelectedSticker] = useState<string>('⭐');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [showStickerPicker, setShowStickerPicker] = useState<boolean>(false);
  const [drawingTitle, setDrawingTitle] = useState<string>('La mia opera magica');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  // Rainbow hue tracker
  const hueRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state to undo stack
    setUndoStack([ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    // Play greeting
    soundManager.speak('Benvenuta nel tuo studio di disegno, Emma! Prendi i colori e crea qualcosa di meraviglioso!', 1.25);
  }, []);

  // Redraw template outline if selected
  const applyTemplate = (templateId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setSelectedTemplate(templateId);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (templateId === 'blank') {
      saveState();
      return;
    }

    // Draw kid coloring page outlines with friendly thick lines
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (templateId === 'emma_portal') {
      // Draw rainbow arch
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.85;
      const radii = [280, 240, 200, 160];
      radii.forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0);
        ctx.stroke();
      });

      // Draw cute child frame silhouette in center
      ctx.beginPath();
      // Head
      ctx.arc(cx, cy - 140, 45, 0, Math.PI * 2);
      ctx.stroke();
      // Beanie pom-poms
      ctx.beginPath();
      ctx.arc(cx - 35, cy - 180, 20, 0, Math.PI * 2);
      ctx.arc(cx + 35, cy - 180, 20, 0, Math.PI * 2);
      ctx.stroke();
      // Body jacket
      ctx.strokeRect(cx - 45, cy - 90, 90, 80);
      // Legs
      ctx.strokeRect(cx - 35, cy - 10, 25, 45);
      ctx.strokeRect(cx + 10, cy - 10, 25, 45);
    } else if (templateId === 'leo_squirrel') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      // Big fluffy tail
      ctx.beginPath();
      ctx.arc(cx + 90, cy - 30, 80, 0, Math.PI * 2);
      ctx.stroke();
      // Body
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 50, 70, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Head & ears
      ctx.beginPath();
      ctx.arc(cx - 20, cy - 70, 45, 0, Math.PI * 2);
      ctx.stroke();
      // Acorn in hands
      ctx.beginPath();
      ctx.arc(cx - 10, cy + 15, 25, 0, Math.PI * 2);
      ctx.stroke();
    } else if (templateId === 'brio_dolphin') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      // Waves
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(100 + i * 200, cy + 120, 60, Math.PI, 0);
        ctx.stroke();
      }
      // Dolphin arch
      ctx.beginPath();
      ctx.ellipse(cx, cy - 20, 110, 50, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
      // Fin
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 50);
      ctx.lineTo(cx + 10, cy - 90);
      ctx.lineTo(cx + 35, cy - 40);
      ctx.closePath();
      ctx.stroke();
    } else if (templateId === 'magic_castle') {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.75;
      // Clouds at base
      ctx.beginPath();
      ctx.arc(cx - 150, cy, 70, 0, Math.PI * 2);
      ctx.arc(cx, cy - 20, 90, 0, Math.PI * 2);
      ctx.arc(cx + 150, cy, 70, 0, Math.PI * 2);
      ctx.stroke();
      // Castle towers
      ctx.strokeRect(cx - 100, cy - 160, 50, 120);
      ctx.strokeRect(cx + 50, cy - 160, 50, 120);
      ctx.strokeRect(cx - 40, cy - 200, 80, 160);
      // Roof cones
      ctx.beginPath();
      ctx.moveTo(cx - 110, cy - 160);
      ctx.lineTo(cx - 75, cy - 220);
      ctx.lineTo(cx - 40, cy - 160);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 40, cy - 160);
      ctx.lineTo(cx + 75, cy - 220);
      ctx.lineTo(cx + 110, cy - 160);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    saveState();
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev.slice(-15), data]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStack = [...undoStack];
    newStack.pop(); // remove current
    const previous = newStack[newStack.length - 1];
    ctx.putImageData(previous, 0, 0);
    setUndoStack(newStack);
  };

  const handleClear = () => {
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  // Coordinates from mouse or touch event
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    lastPosRef.current = coords;

    if (brushMode === 'sticker') {
      applyStickerAt(coords.x, coords.y);
      setIsDrawing(false);
      return;
    }

    drawStroke(coords.x, coords.y, true);
  };

  const applyStickerAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    soundManager.playTwinkle();
    ctx.save();
    ctx.font = `${brushSize * 2.5}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedSticker, x, y);
    ctx.restore();
    saveState();
  };

  const drawStroke = (x: number, y: number, isStarting = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prev = lastPosRef.current || { x, y };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (brushMode === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 1.8;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (brushMode === 'rainbow') {
      hueRef.current = (hueRef.current + 4) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 90%, 60%)`;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (brushMode === 'glitter') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize * 0.8;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Sprinkle sparkling stars and glitter dots
      const sparkles = ['✨', '⭐', '💖', '•'];
      const spark = sparkles[Math.floor(Math.random() * sparkles.length)];
      ctx.font = `${brushSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const offsetX = (Math.random() - 0.5) * brushSize * 1.5;
      const offsetY = (Math.random() - 0.5) * brushSize * 1.5;
      ctx.fillText(spark, x + offsetX, y + offsetY);
    } else if (brushMode === 'pastel') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize * 1.4;
      ctx.globalAlpha = 0.35;
      ctx.shadowBlur = 12;
      ctx.shadowColor = selectedColor;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Normal brush
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

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || brushMode === 'sticker') return;
    const coords = getCoordinates(e);
    if (!coords) return;
    drawStroke(coords.x, coords.y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPosRef.current = null;
      saveState();
    }
  };

  // Save drawing into Emma's Digital Diary
  const handleSaveToDiary = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const newDrawing: SavedDrawing = {
      id: 'draw_' + Date.now(),
      title: drawingTitle.trim() || 'Disegno Magico di Emma',
      dataUrl,
      date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
      starsEarned: 1,
      stickersCount: 1,
      templateName: selectedTemplate
    };

    soundManager.playFanfare();
    confetti.burst();
    onSaveDrawing(newDrawing);
    setSaveSuccess(true);
    soundManager.speak(`Bravissima Emma! Ho custodito il tuo disegno nel Diario Magico! Hai guadagnato una stellina d'oro!`, 1.25);

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3500);
  };

  // Download directly to device
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundManager.playPop();
    const link = document.createElement('a');
    link.download = `Emma_Disegno_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-pink-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 rounded-2xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 font-fun text-sm"
          >
            <ChevronLeft className="w-5 h-5 text-pink-400" />
            <span className="hidden sm:inline">Torna</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl animate-gentle-bounce">🎨</span>
            <div>
              <h1 className="font-fun font-bold text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 leading-tight">
                La Bottega d’Arte di Emma
              </h1>
              <span className="text-xs text-slate-400 font-fun hidden sm:inline">
                Disegna, colora e timbra con magia!
              </span>
            </div>
          </div>
        </div>

        {/* Save & Download Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            title="Scarica disegno"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-300" />
          </button>

          <button
            onClick={handleSaveToDiary}
            className={`px-5 py-3 font-kids font-bold text-base sm:text-lg rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer btn-chunky border-b-4 ${
              saveSuccess
                ? 'bg-emerald-500 border-emerald-700 text-white animate-bounce'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white border-purple-800'
            }`}
          >
            <BookmarkCheck className="w-5 h-5" />
            <span>{saveSuccess ? 'SALVATO NEL DIARIO! ★' : 'SALVA NEL DIARIO ⭐'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 sm:p-4 gap-3">
        {/* Left Toolbar: Brushes, Eraser, Undo, Templates */}
        <div className="w-full md:w-72 bg-slate-900/90 rounded-3xl p-3 border-2 border-pink-500/30 flex flex-row md:flex-col justify-between gap-3 overflow-x-auto md:overflow-y-auto shrink-0 shadow-xl">
          {/* Brush Tools */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <span className="hidden md:block text-sm font-kids text-yellow-300 uppercase tracking-wider mb-1 font-bold">
              Pennelli Magici
            </span>

            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('rainbow');
              }}
              className={`p-3 rounded-2xl font-kids text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-b-4 btn-chunky ${
                brushMode === 'rainbow'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white border-purple-800 shadow-md scale-102 ring-2 ring-yellow-300'
                  : 'bg-slate-800 text-slate-200 border-slate-950 hover:bg-slate-700'
              }`}
            >
              <Wand2 className="w-5 h-5 text-yellow-300" />
              <span className="hidden md:inline">Arcobaleno Magico</span>
            </button>

            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('glitter');
              }}
              className={`p-3 rounded-2xl font-kids text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-b-4 btn-chunky ${
                brushMode === 'glitter'
                  ? 'bg-pink-600 text-white border-pink-800 shadow-md scale-102 ring-2 ring-yellow-300'
                  : 'bg-slate-800 text-slate-200 border-slate-950 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="hidden md:inline">Brillantini & Stelle</span>
            </button>

            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('normal');
              }}
              className={`p-3 rounded-2xl font-kids text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-b-4 btn-chunky ${
                brushMode === 'normal'
                  ? 'bg-pink-600 text-white border-pink-800 shadow-md scale-102 ring-2 ring-yellow-300'
                  : 'bg-slate-800 text-slate-200 border-slate-950 hover:bg-slate-700'
              }`}
            >
              <Brush className="w-5 h-5 text-pink-300" />
              <span className="hidden md:inline">Matita Morbida</span>
            </button>

            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('sticker');
                setShowStickerPicker(true);
              }}
              className={`p-3 rounded-2xl font-kids text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-b-4 btn-chunky ${
                brushMode === 'sticker'
                  ? 'bg-amber-500 text-slate-950 border-amber-700 shadow-md scale-102 ring-2 ring-yellow-300'
                  : 'bg-slate-800 text-slate-200 border-slate-950 hover:bg-slate-700'
              }`}
            >
              <Smile className="w-5 h-5 text-yellow-300" />
              <span className="hidden md:inline">Timbri ({selectedSticker})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playPop();
                setBrushMode('eraser');
              }}
              className={`p-3 rounded-2xl font-kids text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-b-4 btn-chunky ${
                brushMode === 'eraser'
                  ? 'bg-slate-700 text-white border-slate-900 shadow-md ring-2 ring-pink-300 scale-102'
                  : 'bg-slate-800 text-slate-200 border-slate-950 hover:bg-slate-700'
              }`}
            >
              <Eraser className="w-5 h-5 text-slate-300" />
              <span className="hidden md:inline">Gomma</span>
            </button>
          </div>

          {/* Brush Thickness selector */}
          <div className="hidden md:flex flex-col gap-2 pt-2 border-t-2 border-slate-800">
            <span className="text-xs font-kids text-slate-300">Spessore:</span>
            <div className="flex items-center gap-2">
              {[8, 16, 28, 42].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    soundManager.playPop();
                    setBrushSize(size);
                  }}
                  className={`flex-1 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    brushSize === size ? 'bg-pink-600 text-white ring-2 ring-pink-300' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div 
                    className="rounded-full bg-current" 
                    style={{ width: `${Math.min(size / 2 + 4, 18)}px`, height: `${Math.min(size / 2 + 4, 18)}px` }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Templates Selector */}
          <div className="hidden md:flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <span className="text-xs font-fun text-slate-400 font-bold uppercase tracking-wider">
              Disegni da Colorare
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {COLORING_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    soundManager.playPop();
                    applyTemplate(tmpl.id);
                  }}
                  className={`p-1.5 text-xs font-fun rounded-xl border text-left truncate flex items-center gap-1.5 cursor-pointer ${
                    selectedTemplate === tmpl.id
                      ? 'bg-pink-600/30 border-pink-400 text-pink-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tmpl.emoji}</span>
                  <span className="truncate">{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Undo and Clear */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleUndo}
              title="Annulla ultimo tratto"
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-fun text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>
            <button
              onClick={handleClear}
              title="Pulisci tutto"
              className="p-2 bg-slate-800 hover:bg-red-900/50 text-red-300 rounded-xl cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Interactive Drawing Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
          <div className="relative w-full h-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-pink-300 flex items-center justify-center touch-none">
            <canvas
              ref={canvasRef}
              width={900}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={handleDrawMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={handleDrawMove}
              onTouchEnd={stopDrawing}
              className="w-full h-full object-contain cursor-crosshair bg-white"
            />
          </div>

          {/* Sticker Modal Picker */}
          {showStickerPicker && (
            <div className="absolute inset-x-4 bottom-4 z-40 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border-2 border-amber-400/50 shadow-2xl animate-fade-in max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-fun font-bold text-amber-300 flex items-center gap-1.5">
                  <Smile className="w-4 h-4" />
                  Scegli il Timbro Magico per Emma
                </span>
                <button
                  onClick={() => setShowStickerPicker(false)}
                  className="text-xs font-fun text-slate-400 hover:text-white"
                >
                  Chiudi ✕
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto py-1">
                {STICKERS.map(stk => (
                  <button
                    key={stk.id}
                    onClick={() => {
                      soundManager.playPop();
                      setSelectedSticker(stk.emoji);
                      setBrushMode('sticker');
                      setShowStickerPicker(false);
                    }}
                    className={`p-2 rounded-xl text-2xl hover:scale-110 active:scale-95 transition-all text-center cursor-pointer ${
                      selectedSticker === stk.emoji ? 'bg-amber-500/30 ring-2 ring-amber-400' : 'bg-slate-800'
                    }`}
                  >
                    {stk.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right / Bottom: Vibrant Color Palette */}
        <div className="w-full md:w-20 bg-slate-900/90 rounded-3xl p-3 border border-pink-500/20 flex flex-row md:flex-col items-center justify-center gap-2 overflow-x-auto shrink-0 shadow-xl">
          <Palette className="w-5 h-5 text-pink-400 hidden md:block mb-1" />
          {PALETTE_COLORS.map(color => (
            <button
              key={color}
              onClick={() => {
                soundManager.playPop();
                setSelectedColor(color);
                if (brushMode === 'eraser' || brushMode === 'rainbow' || brushMode === 'sticker') {
                  setBrushMode('normal');
                }
              }}
              style={{ backgroundColor: color }}
              className={`w-8 h-8 rounded-full transition-all shrink-0 cursor-pointer shadow-sm ${
                selectedColor === color && brushMode !== 'rainbow' && brushMode !== 'eraser'
                  ? 'ring-4 ring-pink-400 scale-115'
                  : 'hover:scale-105 opacity-90'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
