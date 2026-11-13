import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  Sparkles,
  Check,
  Trophy,
  Star,
  ChevronRight,
  Music,
  VolumeX,
  ShieldCheck,
  Hand,
} from 'lucide-react';
import { GameCategory, Puzzle, PuzzleOption, PuzzleType, UserProgress } from '../types/game';
import {
  generateProceduralPuzzle,
  getEncouragementPhrase,
  MATH_ITEM_CATALOG,
  formatQuantityItalian,
} from '../utils/infiniteLevels';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';

interface PlayArenaProps {
  progress: UserProgress;
  onSolveLevel: (
    stars: number,
    gems: number,
    category: GameCategory,
    isFirstTry: boolean,
    attemptsCount?: number,
    hintsUsed?: number,
    puzzleType?: PuzzleType,
    responseTimeMs?: number,
    chcPrimary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs',
    chcSecondary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs'
  ) => void;
  onOpenParents: () => void;
  onExitToTitle: () => void;
}

const CATEGORY_THEMES: Record<
  GameCategory,
  {
    bgGradient: string;
    badgeGradient: string;
    title: string;
    emoji: string;
  }
> = {
  logic: {
    bgGradient: 'from-[#38bdf8] via-[#93c5fd] to-[#fde68a]',
    badgeGradient: 'from-violet-500 to-purple-600 border-violet-200',
    title: 'Logica & Ragionamento',
    emoji: '🧠',
  },
  letters: {
    bgGradient: 'from-[#38bdf8] via-[#a5f3fc] to-[#fbcfe8]',
    badgeGradient: 'from-pink-500 to-rose-500 border-pink-200',
    title: 'Lettere 3D',
    emoji: '🔤',
  },
  numbers: {
    bgGradient: 'from-[#2dd4bf] via-[#99f6e4] to-[#fef08a]',
    badgeGradient: 'from-amber-400 to-orange-500 border-amber-100',
    title: 'Numeri 3D',
    emoji: '🔢',
  },
  shapes: {
    bgGradient: 'from-[#60a5fa] via-[#bae6fd] to-[#bbf7d0]',
    badgeGradient: 'from-emerald-500 to-teal-600 border-emerald-200',
    title: 'Forme & Colori',
    emoji: '🔷',
  },
  music: {
    bgGradient: 'from-[#f472b6] via-[#fbcfe8] to-[#fef08a]',
    badgeGradient: 'from-fuchsia-500 to-pink-600 border-pink-200',
    title: 'Musica & Ritmo',
    emoji: '🎵',
  },
  english: {
    bgGradient: 'from-[#38bdf8] via-[#bae6fd] to-[#fed7aa]',
    badgeGradient: 'from-cyan-500 to-blue-600 border-cyan-200',
    title: 'Inglese 3D',
    emoji: '🇬🇧',
  },
};

const CANDY_CARD_CLASSES = [
  'toy-candy-pink',
  'toy-candy-yellow',
  'toy-candy-cyan',
  'toy-candy-lime',
];

export const PlayArena: React.FC<PlayArenaProps> = ({
  progress,
  onSolveLevel,
  onOpenParents,
  onExitToTitle,
}) => {
  const currentLevel = progress.currentLevel;
  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generateProceduralPuzzle(currentLevel)
  );
  const [wrongOptionIds, setWrongOptionIds] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [tappedCountIndices, setTappedCountIndices] = useState<number[]>([]);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);

  const countFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFinishingCountRef = useRef<boolean>(false);
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const levelStartMsRef = useRef<number>(Date.now());
  const solveElapsedMsRef = useRef<number>(4800);

  const clearReplayTimers = useCallback(() => {
    replayTimersRef.current.forEach((t) => clearTimeout(t));
    replayTimersRef.current = [];
  }, []);

  useEffect(() => {
    soundManager.startBackgroundMusic();
    const unsub = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    return () => {
      unsub();
      clearReplayTimers();
      soundManager.stopRhythmSequence();
      soundManager.stopBackgroundMusic();
      soundManager.stopSpeech();
    };
  }, [clearReplayTimers]);

  useEffect(() => {
    if (countFinishTimerRef.current) {
      clearTimeout(countFinishTimerRef.current);
      countFinishTimerRef.current = null;
    }
    clearReplayTimers();
    soundManager.stopRhythmSequence();
    isFinishingCountRef.current = false;
    levelStartMsRef.current = Date.now();
    solveElapsedMsRef.current = 4800;

    const nextPuzzle = generateProceduralPuzzle(currentLevel);
    setPuzzle(nextPuzzle);
    setWrongOptionIds([]);
    setSelectedOptionId(null);
    setAttempts(0);
    setHintsUsed(0);
    setIsSolved(false);
    setTappedCountIndices([]);
    setActiveNoteIdx(null);

    let rhythmDelayTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setTimeout(() => {
      soundManager.speakInstruction(nextPuzzle.speechText);
      if (nextPuzzle.rhythmNotes && nextPuzzle.rhythmNotes.length > 0) {
        rhythmDelayTimer = setTimeout(() => {
          soundManager.playRhythmSequence(nextPuzzle.rhythmNotes!);
        }, 1200);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      if (rhythmDelayTimer) clearTimeout(rhythmDelayTimer);
      clearReplayTimers();
      soundManager.stopRhythmSequence();
      if (countFinishTimerRef.current) {
        clearTimeout(countFinishTimerRef.current);
        countFinishTimerRef.current = null;
      }
    };
  }, [currentLevel, clearReplayTimers]);

  const handleReplayRhythm = useCallback(() => {
    if (!puzzle.rhythmNotes || puzzle.rhythmNotes.length === 0) return;
    clearReplayTimers();
    puzzle.rhythmNotes.forEach((n, idx) => {
      const t = setTimeout(() => {
        setActiveNoteIdx(idx);
        soundManager.playMusicalNote(n.freq, n.duration || 0.34);
      }, idx * 420);
      replayTimersRef.current.push(t);
    });
    const endTimer = setTimeout(() => {
      setActiveNoteIdx(null);
    }, puzzle.rhythmNotes.length * 420 + 200);
    replayTimersRef.current.push(endTimer);
  }, [puzzle, clearReplayTimers]);

  const handleReplayVoice = useCallback(() => {
    soundManager.playPop();
    setHintsUsed((prev) => prev + 1);
    soundManager.speakInstruction(puzzle.speechText);
    if (puzzle.rhythmNotes && puzzle.rhythmNotes.length > 0) {
      setTimeout(() => handleReplayRhythm(), 1000);
    }
  }, [puzzle, handleReplayRhythm]);

  const handleTapCountObject = (idx: number) => {
    if (isSolved || isFinishingCountRef.current) return;
    if (tappedCountIndices.includes(idx)) return;

    const nextTapped = [...tappedCountIndices, idx];
    setTappedCountIndices(nextTapped);
    const currentNum = nextTapped.length;
    const target = puzzle.targetCount || 1;

    const scaleFreqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    soundManager.playMusicalNote(
      scaleFreqs[(currentNum - 1) % scaleFreqs.length],
      0.32
    );

    const itemCatalog =
      MATH_ITEM_CATALOG.find((m) => m.emoji === puzzle.itemEmoji) ||
      MATH_ITEM_CATALOG[0];
    const formatted = formatQuantityItalian(currentNum, itemCatalog);

    // Automatically complete count_interactive level once all items are tapped without cutting off the final count speech
    if (currentNum >= target) {
      isFinishingCountRef.current = true;
      solveElapsedMsRef.current = Math.max(800, Date.now() - levelStartMsRef.current);
      setAttempts(1);
      countFinishTimerRef.current = setTimeout(() => {
        setIsSolved(true);
        soundManager.playFanfare();
        confetti.burst();
        const praise = getEncouragementPhrase(true, true);
        soundManager.speakPraise(`${formatted.speech}! ${praise} ${puzzle.funExplanation}`);
      }, 420);
    } else {
      soundManager.speak(formatted.speech, { context: 'count' });
    }
  };

  const handleSelectOption = (opt: PuzzleOption) => {
    if (isSolved || wrongOptionIds.includes(opt.id)) return;

    const elapsed = Math.max(450, Date.now() - levelStartMsRef.current);
    // Security guard against accidental <320ms double-taps after an error
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSelectedOptionId(opt.id);

    if (opt.noteFreq) {
      soundManager.playMusicalNote(opt.noteFreq, 0.36);
    }

    if (opt.isCorrect) {
      solveElapsedMsRef.current = elapsed;
      setIsSolved(true);
      soundManager.playFanfare();
      confetti.burst();
      const praise = getEncouragementPhrase(true, true);
      soundManager.speakPraise(`${praise} ${puzzle.funExplanation}`);
    } else {
      soundManager.playEncouragement();
      setWrongOptionIds((prev) => [...prev, opt.id]);
      const retryPhrase = getEncouragementPhrase(false, true);
      soundManager.speak(retryPhrase);
    }
  };

  const handleNextLevel = () => {
    soundManager.playSuccess();
    const totalTries = Math.max(1, attempts);
    const earnedStars =
      totalTries <= 1 && hintsUsed === 0
        ? puzzle.rewardStars
        : Math.max(1, puzzle.rewardStars - 1);
    onSolveLevel(
      earnedStars,
      puzzle.rewardGems,
      puzzle.category,
      totalTries <= 1 && hintsUsed === 0,
      totalTries,
      hintsUsed,
      puzzle.type,
      solveElapsedMsRef.current,
      puzzle.chcPrimary,
      puzzle.chcSecondary
    );
  };

  const theme = CATEGORY_THEMES[puzzle.category] || CATEGORY_THEMES.logic;
  const optionsList = puzzle.options || [];
  const isCountingMode =
    puzzle.type === 'count_interactive' && Boolean(puzzle.targetCount);

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b ${theme.bgGradient} select-none`}
    >
      {/* ===================================================================== */}
      {/* SUNNY 3D CARTOON WONDERLAND SCENERY (SUN, RAINBOW, 3D CLOUDS, HILLS) */}
      {/* ===================================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Smiling 3D Sun */}
        <div className="absolute -top-6 -right-6 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 shadow-[0_0_55px_rgba(251,191,36,0.9),inset_0_-8px_16px_rgba(217,119,6,0.5)] border-4 border-yellow-100 flex items-center justify-center animate-float-3d">
          <span className="text-4xl sm:text-5xl drop-shadow">🌞</span>
        </div>

        {/* Enchanted Rainbow Arch */}
        <svg
          viewBox="0 0 600 220"
          className="w-[115%] max-w-none -left-[7%] top-8 absolute opacity-65"
          fill="none"
        >
          <path d="M 20 210 Q 300 -30 580 210" stroke="#fb7185" strokeWidth="14" strokeLinecap="round" />
          <path d="M 32 215 Q 300 -12 568 215" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" />
          <path d="M 44 220 Q 300 6 556 220" stroke="#34d399" strokeWidth="14" strokeLinecap="round" />
          <path d="M 56 225 Q 300 24 544 225" stroke="#38bdf8" strokeWidth="14" strokeLinecap="round" />
          <path d="M 68 230 Q 300 42 532 230" stroke="#c084fc" strokeWidth="12" strokeLinecap="round" />
        </svg>

        {/* Animated Fluffy 3D Clouds */}
        <div className="absolute top-14 left-3 w-28 h-11 bg-white/90 rounded-full shadow-[0_8px_16px_rgba(14,116,144,0.18),inset_0_-4px_6px_rgba(186,230,253,0.8)] animate-cloud-drift">
          <div className="absolute -top-4 left-4 w-11 h-11 bg-white/95 rounded-full" />
          <div className="absolute -top-5 right-4 w-13 h-13 bg-white/95 rounded-full" />
        </div>
        <div
          className="absolute top-22 right-12 w-24 h-10 bg-white/85 rounded-full shadow-md animate-cloud-drift"
          style={{ animationDelay: '1.4s' }}
        >
          <div className="absolute -top-3 left-3 w-10 h-10 bg-white/90 rounded-full" />
          <div className="absolute -top-4 right-3 w-11 h-11 bg-white/90 rounded-full" />
        </div>

        {/* 3D Rolling Green Fairytale Hills at bottom */}
        <div className="absolute -bottom-10 -left-16 w-[75%] h-28 rounded-[100%] bg-gradient-to-t from-emerald-500 via-emerald-400 to-lime-300 border-t-4 border-lime-100/80 shadow-[0_-8px_20px_rgba(16,185,129,0.25)]" />
        <div className="absolute -bottom-12 -right-16 w-[75%] h-32 rounded-[100%] bg-gradient-to-t from-green-500 via-emerald-400 to-teal-300 border-t-4 border-emerald-100/80 shadow-[0_-8px_20px_rgba(16,185,129,0.25)]" />
      </div>

      {/* ===================================================================== */}
      {/* TOP NAVIGATION BAR                                                    */}
      {/* ===================================================================== */}
      <header className="relative z-10 flex items-center justify-between px-2.5 sm:px-5 pt-2.5 pb-1 shrink-0 gap-1.5 w-full max-w-4xl mx-auto">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.stopRhythmSequence();
            soundManager.playPop();
            onExitToTitle();
          }}
          className="toy-button-3d bg-white/95 hover:bg-white text-slate-900 px-2.5 sm:px-3.5 py-2 rounded-2xl border-2 border-white flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 stroke-[3]" />
          <span className="font-kids font-extrabold text-xs sm:text-sm">Home</span>
        </button>

        {/* Center Compact Level Badge */}
        <div
          className={`bg-gradient-to-r ${theme.badgeGradient} px-3 sm:px-4 py-1.5 rounded-full border-2 shadow-[0_4px_0_rgba(0,0,0,0.18)] flex items-center gap-1.5 min-w-0`}
        >
          <span className="text-base sm:text-xl shrink-0">{theme.emoji}</span>
          <div className="text-left min-w-0 leading-none">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold text-white/90 truncate">
              {theme.title}
            </p>
            <p className="font-kids font-extrabold text-xs sm:text-sm text-white whitespace-nowrap">
              Liv. {currentLevel} · ⭐ {progress.stars}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              const next = soundManager.toggleMusic();
              setMusicOn(next);
            }}
            title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            className={`toy-button-3d p-2 sm:px-2.5 sm:py-2 rounded-2xl border-2 flex items-center gap-1 active:scale-95 cursor-pointer ${
              musicOn
                ? 'bg-gradient-to-b from-pink-400 to-fuchsia-600 text-white border-white'
                : 'bg-white/90 text-slate-600 border-white'
            }`}
          >
            {musicOn ? (
              <Music className="w-4 h-4 stroke-[2.8] animate-bounce" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[2.8]" />
            )}
          </button>

          <button
            onClick={handleReplayVoice}
            className="toy-button-3d bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 p-2 sm:px-3 sm:py-2 rounded-2xl border-2 border-white flex items-center gap-1 active:scale-95 cursor-pointer"
            title="Riascolta la domanda"
          >
            <Volume2 className="w-4 h-4 stroke-[2.8]" />
            <span className="font-kids font-extrabold text-xs hidden sm:inline">Ascolta</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              onOpenParents();
            }}
            className="toy-button-3d bg-white/95 hover:bg-white text-purple-900 p-2 rounded-2xl border-2 border-white active:scale-95 cursor-pointer"
            title="Area Genitori & Profilo CHC"
          >
            <ShieldCheck className="w-4 h-4 text-pink-600" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN 3D GAMEPLAY STAGE (RESPONSIVE ACROSS MOBILE, TABLET & DESKTOP)   */}
      {/* ===================================================================== */}
      <main className="landscape-compact-stage relative z-10 flex-1 flex flex-col justify-start sm:justify-center px-3 sm:px-5 py-2 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto w-full min-h-0 gap-3 sm:gap-4 overflow-y-auto">
        {/* QUESTION & 3D INTERACTIVE SHOWCASE BOARD */}
        <div className="board-3d-tabletop rounded-[28px] p-4 sm:p-5 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-pink-600 border-2 border-pink-300 font-kids font-extrabold text-xs sm:text-sm shadow-xs">
              <span className="text-lg sm:text-xl">{puzzle.animalGuide.emoji}</span>
              <span>{puzzle.animalGuide.name}</span>
            </span>

            {puzzle.iqParameterTag && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white border-2 border-white font-kids font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-xs">
                🧠 {puzzle.iqParameterTag}
              </span>
            )}
          </div>

          <h2 className="font-kids font-extrabold text-xl sm:text-2xl md:text-3xl text-slate-900 leading-snug max-w-2xl drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
            {puzzle.prompt}
          </h2>

          {/* 1. INTERACTIVE 3D FINGER COUNTING (`count_interactive` - BIG 3D SPHERES!) */}
          {isCountingMode && puzzle.targetCount && (
            <div className="mt-4 flex flex-col items-center gap-3 w-full">
              {/* Live Counter Pill with strict Masculine/Feminine grammar */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-2 border-white shadow-md font-kids font-extrabold text-sm sm:text-base">
                <span>{puzzle.itemGender === 'm' ? 'Contati:' : 'Contate:'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-300 text-slate-950 text-base sm:text-lg">
                  {tappedCountIndices.length} / {puzzle.targetCount}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap bg-white/90 px-4 py-4 rounded-3xl border-2 border-amber-300 shadow-inner w-full">
                {Array.from({ length: puzzle.targetCount }).map((_, idx) => {
                  const isTapped = tappedCountIndices.includes(idx);
                  const orderNumber = tappedCountIndices.indexOf(idx) + 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTapCountObject(idx)}
                      className={`relative w-22 h-22 sm:w-26 sm:h-26 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                        isTapped
                          ? 'sphere-3d-counted scale-105'
                          : 'sphere-3d-counter animate-float-3d hover:scale-105'
                      }`}
                    >
                      <span className="text-5xl sm:text-6xl leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)]">
                        {puzzle.itemEmoji || '🦋'}
                      </span>
                      {isTapped ? (
                        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-pink-600 text-white font-kids font-extrabold text-base border-2 border-white flex items-center justify-center shadow-lg animate-pop-in">
                          {orderNumber}
                        </span>
                      ) : (
                        <span className="absolute -bottom-1.5 right-1 w-7 h-7 rounded-full bg-white text-pink-600 border-2 border-pink-400 flex items-center justify-center shadow animate-bounce">
                          <Hand className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-fun font-extrabold text-amber-900">
                <Sparkles className="w-4 h-4 text-pink-600" />
                Tocca ogni figura 3D per contarla e superare il livello!
              </span>
            </div>
          )}

          {/* 2. VISUAL ADDITION 3D (`visual_addition`) */}
          {puzzle.additionParts && (
            <div className="mt-3 flex items-center justify-center gap-2.5 sm:gap-3.5 flex-wrap bg-white/95 px-4 py-3 rounded-2xl border-2 border-amber-300 shadow-inner">
              <div className="flex items-center gap-1.5 bg-pink-100 px-3 py-2 rounded-xl border-2 border-pink-300">
                {Array.from({ length: puzzle.additionParts.countA }).map((_, i) => (
                  <span key={i} className="text-3xl sm:text-4xl drop-shadow animate-float-3d">
                    {puzzle.additionParts!.emoji}
                  </span>
                ))}
              </div>
              <span className="font-kids font-extrabold text-3xl text-pink-600">+</span>
              <div className="flex items-center gap-1.5 bg-sky-100 px-3 py-2 rounded-xl border-2 border-sky-300">
                {Array.from({ length: puzzle.additionParts.countB }).map((_, i) => (
                  <span key={i} className="text-3xl sm:text-4xl drop-shadow animate-float-3d">
                    {puzzle.additionParts!.emoji}
                  </span>
                ))}
              </div>
              <span className="font-kids font-extrabold text-3xl text-amber-600">= ❓</span>
            </div>
          )}

          {/* 3. VISUAL SUBTRACTION 3D (`visual_subtraction`) */}
          {puzzle.subtractionParts && (
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap bg-white/95 px-4 py-3 rounded-2xl border-2 border-amber-300 shadow-inner">
              {Array.from({ length: puzzle.subtractionParts.total }).map((_, idx) => {
                const isRemoved =
                  idx >= puzzle.subtractionParts!.total - puzzle.subtractionParts!.minus;
                return (
                  <div
                    key={idx}
                    className={`relative w-14 h-14 rounded-xl flex items-center justify-center border-2 ${
                      isRemoved
                        ? 'bg-rose-100 border-rose-300 opacity-45 scale-90'
                        : 'bg-emerald-100 border-emerald-300 animate-float-3d'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl">
                      {puzzle.subtractionParts!.emoji}
                    </span>
                    {isRemoved && (
                      <span className="absolute text-rose-600 font-black text-2xl">✖</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. MUSIC & RHYTHM 3D XYLOPHONE (`music_rhythm`) */}
          {puzzle.rhythmNotes && puzzle.rhythmNotes.length > 0 && (
            <div className="mt-3 flex flex-col items-center gap-2 w-full">
              <div className="flex items-center justify-center gap-2 flex-wrap bg-white/95 px-3.5 py-2.5 rounded-2xl border-2 border-pink-300 shadow-inner">
                {puzzle.rhythmNotes.map((note, idx) => {
                  const isPlaying = activeNoteIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveNoteIdx(idx);
                        soundManager.playMusicalNote(note.freq, note.duration || 0.34);
                        setTimeout(() => setActiveNoteIdx(null), 340);
                      }}
                      className={`px-3.5 py-2 rounded-2xl border-2 font-kids font-extrabold text-xs sm:text-sm transition-all flex flex-col items-center gap-0.5 cursor-pointer shadow-md ${
                        isPlaying
                          ? 'bg-gradient-to-b from-pink-400 to-rose-500 text-white border-white scale-115 shadow-lg'
                          : 'bg-gradient-to-b from-sky-400 to-indigo-500 text-white border-sky-100 hover:scale-105'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">{note.emoji}</span>
                      <span className="text-xs">{note.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleReplayRhythm}
                className="toy-button-3d px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-2 border-white font-kids font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Music className="w-4 h-4" />
                Risenti Melodia 3D 🎶
              </button>
            </div>
          )}

          {/* 5. ENGLISH WORD 3D FLASHCARD (`english_words`) */}
          {puzzle.englishWord && (
            <div className="mt-3 flex items-center gap-3 bg-white/95 px-4 py-2.5 rounded-2xl border-2 border-cyan-300 shadow-md">
              <div className="w-15 h-15 rounded-2xl bg-gradient-to-b from-cyan-100 to-sky-200 border-2 border-white shadow flex items-center justify-center text-4xl animate-float-3d">
                {puzzle.englishWord.emoji}
              </div>
              <div className="text-left">
                <span className="text-[11px] font-kids font-extrabold uppercase tracking-wider text-cyan-700 block">
                  🇬🇧 {puzzle.englishWord.categoryLabel}
                </span>
                <p className="font-kids font-extrabold text-xl sm:text-2xl text-rose-600 leading-tight">
                  "{puzzle.englishWord.en}"
                </p>
                <p className="text-xs font-fun font-bold text-slate-600">
                  Si legge: "{puzzle.englishWord.phoneticHint}" = {puzzle.englishWord.it}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playTwinkle();
                  soundManager.speak(
                    `${puzzle.englishWord!.phoneticHint}. In inglese ${
                      puzzle.englishWord!.it
                    } si dice ${puzzle.englishWord!.phoneticHint}!`
                  );
                }}
                className="toy-button-3d p-3 rounded-2xl bg-gradient-to-b from-cyan-400 to-blue-500 text-white border-2 border-white shadow cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 6. PATTERN / IQ MATRIX STRIP (`patternItems`) */}
          {puzzle.patternItems && puzzle.patternItems.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3 flex-wrap bg-white/95 px-4 py-3 rounded-2xl border-2 border-purple-300 shadow-inner">
              {puzzle.patternItems.map((item, idx) => {
                const isMystery = item === '❓' || item === '?';
                const isArrow = item === '➔' || item === '➡️';
                if (isArrow) {
                  return (
                    <span key={idx} className="text-2xl font-black text-pink-500">
                      ➔
                    </span>
                  );
                }
                return (
                  <div
                    key={idx}
                    className={`min-w-13 h-13 sm:min-w-15 sm:h-15 px-2.5 rounded-2xl flex items-center justify-center border-2 shadow-sm ${
                      isMystery
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-500 border-white text-slate-950 font-kids font-extrabold text-2xl animate-bounce'
                        : 'bg-gradient-to-b from-purple-50 to-white border-purple-200 text-3xl sm:text-4xl animate-float-3d'
                    }`}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* COMPACT, CHUNKY 3D CANDY CHOICE BLOCKS (ONLY WHEN OPTIONS EXIST)  */}
        {/* ================================================================= */}
        {optionsList.length > 0 && (
          <div
            className={`options-grid-responsive grid ${
              optionsList.length === 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : optionsList.length >= 4
                ? 'grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-2'
            } gap-3 sm:gap-4 w-full shrink-0`}
          >
            {optionsList.map((option, idx) => {
              const isWrong = wrongOptionIds.includes(option.id);
              const isChosenCorrect =
                isSolved && selectedOptionId === option.id && option.isCorrect;
              const candyClass =
                CANDY_CARD_CLASSES[idx % CANDY_CARD_CLASSES.length];
              const isLastOfThree = optionsList.length === 3 && idx === 2;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option)}
                  disabled={isSolved || isWrong}
                  className={`toy-card-3d relative rounded-[26px] px-3 py-3.5 sm:py-4 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden cursor-pointer ${candyClass} ${
                    isLastOfThree
                      ? 'col-span-2 sm:col-span-1 w-[56%] sm:w-full mx-auto'
                      : 'w-full'
                  } ${
                    isWrong
                      ? 'opacity-40 grayscale scale-95 cursor-not-allowed'
                      : isChosenCorrect
                      ? 'ring-4 ring-white scale-[1.04] shadow-[0_0_35px_rgba(250,204,21,0.95)]'
                      : 'hover:scale-[1.03] active:scale-95'
                  }`}
                >
                  {/* Top 3D Specular Gloss */}
                  <div className="pointer-events-none absolute inset-x-4 top-1.5 h-3 rounded-full bg-gradient-to-b from-white/80 to-transparent" />

                  {/* Large 3D Toy Sphere Pedestal & Large Emoji */}
                  <div className="relative z-10 w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white/95 border-3 border-white shadow-[0_6px_14px_rgba(0,0,0,0.14),inset_0_-5px_8px_rgba(0,0,0,0.08)] flex items-center justify-center shrink-0">
                    <div className="absolute top-1.5 left-4 w-5 h-2.5 rounded-full bg-white -rotate-25" />
                    <span
                      className={`text-5xl sm:text-6xl leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)] ${
                        !isWrong ? 'animate-float-3d' : ''
                      }`}
                    >
                      {option.emoji || '⭐'}
                    </span>
                  </div>

                  {/* Large, High-Contrast Label Pill */}
                  <div className="relative z-10 bg-white/95 px-3.5 py-1.5 rounded-2xl border-2 border-white shadow-md max-w-full text-center">
                    <span className="font-kids font-extrabold text-lg sm:text-xl text-slate-900 tracking-wide block leading-tight">
                      {option.label}
                    </span>
                    {option.sublabel && (
                      <span className="font-fun font-bold text-xs sm:text-sm text-slate-600 block leading-tight mt-0.5">
                        {option.sublabel}
                      </span>
                    )}
                  </div>

                  {isChosenCorrect && (
                    <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
                      <Check className="w-5 h-5 text-white stroke-[3.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* BOTTOM HELPER BAR */}
      <footer className="relative z-10 px-3 pb-2.5 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto w-full shrink-0">
        <div className="bg-white/92 backdrop-blur-md rounded-2xl px-3.5 py-2 border-2 border-white shadow-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 shrink-0" />
            <span className="text-xs sm:text-sm font-fun font-extrabold text-slate-800 truncate">
              {puzzle.diagnosticTarget
                ? `Parametri rilevati: ${puzzle.diagnosticTarget}`
                : isCountingMode
                ? `Tocca tutte e ${puzzle.targetCount} le figure per contarle!`
                : 'Tocca la risposta giusta per vincere le stelline d’oro!'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 drop-shadow"
              />
            ))}
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* VICTORY MODAL OVERLAY                                                 */}
      {/* ===================================================================== */}
      {isSolved && (
        <div className="fixed inset-0 z-50 bg-sky-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-[34px] bg-gradient-to-b from-white via-pink-50 to-amber-50 border-4 border-white p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-pop-in">
            <div className="mx-auto -mt-12 w-20 h-20 rounded-3xl bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center mb-3">
              <Trophy className="w-10 h-10 text-white drop-shadow" />
            </div>

            <h3 className="font-kids font-extrabold text-2xl sm:text-3xl text-pink-600">
              Bravissima Emma! 🎉
            </h3>
            <p className="text-sm sm:text-base font-fun font-bold text-slate-700 mt-1.5 leading-relaxed">
              {puzzle.funExplanation}
            </p>

            <div className="flex items-center justify-center gap-3 my-4 bg-white py-3 px-4 rounded-2xl border-2 border-amber-200 shadow-inner">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className="w-10 h-10 text-amber-400 fill-amber-400 drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)] animate-bounce"
                  style={{ animationDelay: `${starIdx * 0.12}s` }}
                />
              ))}
            </div>

            <button
              onClick={handleNextLevel}
              className="toy-button-3d w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-emerald-400 via-green-500 to-teal-600 text-white font-kids font-extrabold text-lg border-2 border-white shadow-[0_6px_0_#15803d,0_12px_20px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Vai al Livello {currentLevel + 1}</span>
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
