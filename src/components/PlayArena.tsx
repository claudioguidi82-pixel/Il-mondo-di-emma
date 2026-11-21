import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  Volume2,
  Sparkles,
  Check,
  Star,
  ChevronRight,
  Music,
  VolumeX,
  ShieldCheck,
  Hand,
  Lightbulb,
  Compass,
  Gift,
  Palette,
  Gem,
  Play,
  Crown,
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
import { getDisplayChildName, getGenderedWord } from '../utils/childProfile';
import {
  DAILY_MISSION_TARGET,
  getDailyMissionStatus,
  getMindfulBreakActivity,
  getPersonalizedBreakGreeting,
  pickNextLockedSticker,
} from '../utils/motivationEngine';
import {
  STORYBOOK_ASSETS,
  resolveOptionArtwork,
  resolveQuestionCameo,
} from '../utils/cardArtwork';

const {
  arenaMeadowBackdrop,
  treasureChest3d,
  trophyMedallion3d,
} = STORYBOOK_ASSETS;

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
  onOpenAlbum: () => void;
  onOpenStudio: () => void;
  onExitToTitle: () => void;
}

const SUBJECT_CHOICES: Array<{
  id: GameCategory | null;
  label: string;
  emoji: string;
}> = [
  { id: null, label: 'Sorpresa', emoji: '🎲' },
  { id: 'logic', label: 'Logica', emoji: '🧠' },
  { id: 'music', label: 'Musica', emoji: '🎵' },
  { id: 'shapes', label: 'Arte', emoji: '🎨' },
  { id: 'numbers', label: 'Numeri', emoji: '🔢' },
  { id: 'letters', label: 'Parole', emoji: '🔤' },
  { id: 'english', label: 'Inglese', emoji: '🇬🇧' },
];

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
    bgGradient: 'from-[#e0e7ff] via-[#f0f9ff] to-[#fef3c7]',
    badgeGradient: 'from-violet-600 to-indigo-600 border-violet-200/80',
    title: 'Logica & Ragionamento',
    emoji: '🧠',
  },
  letters: {
    bgGradient: 'from-[#fce7f3] via-[#f0f9ff] to-[#fef9c3]',
    badgeGradient: 'from-pink-500 to-rose-600 border-pink-200/80',
    title: 'Linguaggio & Lettere',
    emoji: '🔤',
  },
  numbers: {
    bgGradient: 'from-[#ccfbf1] via-[#f0f9ff] to-[#fef3c7]',
    badgeGradient: 'from-amber-500 to-orange-600 border-amber-200/80',
    title: 'Numeri & Calcolo',
    emoji: '🔢',
  },
  shapes: {
    bgGradient: 'from-[#e0f2fe] via-[#f0fdf4] to-[#dcfce7]',
    badgeGradient: 'from-emerald-500 to-teal-600 border-emerald-200/80',
    title: 'Spazio & Forme',
    emoji: '🔷',
  },
  music: {
    bgGradient: 'from-[#fae8ff] via-[#fdf2f8] to-[#fef3c7]',
    badgeGradient: 'from-fuchsia-500 to-purple-600 border-fuchsia-200/80',
    title: 'Musica & Ritmo',
    emoji: '🎵',
  },
  english: {
    bgGradient: 'from-[#e0f2fe] via-[#f8fafc] to-[#ffedd5]',
    badgeGradient: 'from-sky-500 to-blue-600 border-sky-200/80',
    title: 'Inglese Interattivo',
    emoji: '🇬🇧',
  },
};

const CANDY_CARD_THEMES = [
  {
    cardClass: 'toy-candy-pink',
    ribbonClass: 'from-[#ff5fa2] via-[#ec4899] to-[#db2777]',
    subtextClass: 'text-pink-50',
    playIconClass: 'text-[#db2777] fill-[#db2777]',
  },
  {
    cardClass: 'toy-candy-yellow',
    ribbonClass: 'from-[#fbbf24] via-[#f59e0b] to-[#d97706]',
    subtextClass: 'text-amber-950',
    playIconClass: 'text-[#d97706] fill-[#d97706]',
  },
  {
    cardClass: 'toy-candy-cyan',
    ribbonClass: 'from-[#38bdf8] via-[#0284c7] to-[#1d4ed8]',
    subtextClass: 'text-sky-50',
    playIconClass: 'text-[#1d4ed8] fill-[#1d4ed8]',
  },
  {
    cardClass: 'toy-candy-lime',
    ribbonClass: 'from-[#4ade80] via-[#16a34a] to-[#15803d]',
    subtextClass: 'text-emerald-50',
    playIconClass: 'text-[#15803d] fill-[#15803d]',
  },
];

const XYLO_BAR_COLORS = [
  'from-[#fb7185] via-[#f43f5e] to-[#be123c]',
  'from-[#fb923c] via-[#f97316] to-[#c2410c]',
  'from-[#fde047] via-[#facc15] to-[#ca8a04] text-amber-950',
  'from-[#4ade80] via-[#22c55e] to-[#15803d]',
  'from-[#38bdf8] via-[#0ea5e9] to-[#0369a1]',
  'from-[#818cf8] via-[#6366f1] to-[#4338ca]',
  'from-[#e879f9] via-[#c026d3] to-[#86198f]',
];

export const PlayArena: React.FC<PlayArenaProps> = ({
  progress,
  onSolveLevel,
  onOpenParents,
  onOpenAlbum,
  onOpenStudio,
  onExitToTitle,
}) => {
  const currentLevel = progress.currentLevel;
  const childProfile = progress.childProfile;
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const [preferredCategory, setPreferredCategory] = useState<GameCategory | null>(null);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState<boolean>(false);
  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generateProceduralPuzzle(currentLevel, childProfile, progress)
  );
  const [wrongOptionIds, setWrongOptionIds] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [magicHintMessage, setMagicHintMessage] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [tappedCountIndices, setTappedCountIndices] = useState<number[]>([]);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);

  const countFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFinishingCountRef = useRef<boolean>(false);
  const hasCommittedSolveRef = useRef<boolean>(false);
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
    hasCommittedSolveRef.current = false;
    levelStartMsRef.current = Date.now();
    solveElapsedMsRef.current = 4800;

    const nextPuzzle = generateProceduralPuzzle(
      currentLevel,
      childProfile,
      progress,
      preferredCategory || undefined
    );
    setPuzzle(nextPuzzle);
    setWrongOptionIds([]);
    setSelectedOptionId(null);
    setAttempts(0);
    setHintsUsed(0);
    setMagicHintMessage(null);
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
  }, [
    currentLevel,
    preferredCategory,
    childProfile?.birthDate,
    childProfile?.name,
    childProfile?.gender,
    clearReplayTimers,
  ]);

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
        const praise = getEncouragementPhrase(true, childProfile, true);
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
      const praise = getEncouragementPhrase(true, childProfile, true);
      soundManager.speakPraise(`${praise} ${puzzle.funExplanation}`);
    } else {
      soundManager.playEncouragement();
      setWrongOptionIds((prev) => [...prev, opt.id]);
      const retryPhrase = getEncouragementPhrase(false, childProfile, true);
      soundManager.speak(retryPhrase);
    }
  };

  const commitSolve = useCallback(() => {
    if (hasCommittedSolveRef.current) return;
    hasCommittedSolveRef.current = true;
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
  }, [attempts, hintsUsed, onSolveLevel, puzzle]);

  const handleNextLevel = (nextSubject?: GameCategory | null) => {
    soundManager.playSuccess();
    if (nextSubject !== undefined) {
      setPreferredCategory(nextSubject);
    }
    commitSolve();
  };

  const handleMagicHint = () => {
    if (isSolved || isCountingMode) return;
    const remainingWrong = (puzzle.options || []).filter(
      (o) => !o.isCorrect && !wrongOptionIds.includes(o.id)
    );
    if (remainingWrong.length < 2) return;

    const toEliminate = remainingWrong[0];
    setWrongOptionIds((prev) => [...prev, toEliminate.id]);
    setHintsUsed((prev) => prev + 1);
    soundManager.playTwinkle();
    const hintText = `Ecco un piccolo aiuto, ${childName}: ho tolto una carta che non serve. Guarda bene quelle rimaste!`;
    setMagicHintMessage('Ho tolto una carta sbagliata per aiutarti: osserva bene quelle rimaste!');
    soundManager.speak(hintText, { context: 'instruction' });
  };

  const theme = CATEGORY_THEMES[puzzle.category] || CATEGORY_THEMES.logic;
  const optionsList = puzzle.options || [];
  const isCountingMode =
    puzzle.type === 'count_interactive' && Boolean(puzzle.targetCount);
  const remainingWrongCount = optionsList.filter(
    (o) => !o.isCorrect && !wrongOptionIds.includes(o.id)
  ).length;
  const canUseMagicHint = !isSolved && !isCountingMode && remainingWrongCount >= 2;
  const dailyMission = getDailyMissionStatus(progress);
  const willCompleteMission =
    (dailyMission.completedToday + 1) % DAILY_MISSION_TARGET === 0;
  const missionBonusSticker = willCompleteMission
    ? pickNextLockedSticker(progress.unlockedStickerIds)
    : null;
  const mindfulBreak = getMindfulBreakActivity(
    dailyMission.cyclesCompletedToday + currentLevel
  );

  const questionCameo = resolveQuestionCameo(
    puzzle.prompt,
    puzzle.animalGuide.name,
    puzzle.animalGuide.emoji
  );

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-sky-300 select-none">
      {/* ===================================================================== */}
      {/* LUSH 3D PIXAR STORYBOOK SUNNY SKY & MEADOW WORLD BACKDROP             */}
      {/* ===================================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <img
          src={arenaMeadowBackdrop}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01]"
        />
        {/* Gentle radial vignette so cards and boards pop with vivid storybook contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(22, 101, 52, 0.14) 100%)',
          }}
        />
      </div>

      {/* ===================================================================== */}
      {/* GLOSSY 3D BUBBLE TOP NAVIGATION BAR (ZERO TRUNCATION ON ALL SCREENS)  */}
      {/* ===================================================================== */}
      <header className="landscape-header-compact app-shell-container relative z-10 flex items-center justify-between px-2 sm:px-5 lg:px-8 pt-2 sm:pt-3 pb-1 shrink-0 gap-1.5 sm:gap-2.5">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.stopRhythmSequence();
            soundManager.playPop();
            onExitToTitle();
          }}
          className="glossy-bubble-btn bg-gradient-to-b from-white to-slate-100 text-slate-900 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-white flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[38px] sm:min-h-[42px]"
        >
          <Home className="w-4 h-4 text-blue-700 fill-blue-700 shrink-0" />
          <span className="font-fun font-extrabold text-xs sm:text-sm text-slate-900 whitespace-nowrap">
            Home
          </span>
        </button>

        {/* Center Glossy 3D Purple Level Capsule — full subject text, never cut with "..." */}
        <div
          className={`glossy-bubble-btn bg-gradient-to-b ${theme.badgeGradient} px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-white/80 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial justify-center`}
        >
          <span className="text-base sm:text-xl shrink-0 drop-shadow-xs">{theme.emoji}</span>
          <div className="text-left leading-[1.12] min-w-0">
            <p className="text-[9.5px] sm:text-xs font-bold text-white/95 leading-tight break-words">
              {puzzle.subjectLabel || theme.title}
            </p>
            <p className="font-fun font-extrabold text-[11px] sm:text-sm text-white whitespace-nowrap tabular-nums flex items-center gap-1">
              <span>Livello {currentLevel}</span>
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 inline shrink-0" />
              <span>{progress.stars}</span>
              {puzzle.isMasteryUnlocked && (
                <span className="text-amber-200 font-bold text-[10px] hidden sm:inline">
                  · Merito
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Glossy 3D Jewel Action Bubbles */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => {
              soundManager.playPop();
              setIsSubjectPickerOpen((prev) => !prev);
            }}
            title="Scegli la materia che ti incuriosisce di più"
            className={`glossy-bubble-btn w-9 h-9 sm:w-auto sm:h-10 sm:px-3 rounded-full border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              isSubjectPickerOpen || preferredCategory
                ? 'bg-gradient-to-b from-emerald-400 to-green-600 text-white border-emerald-100'
                : 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-white/90'
            }`}
          >
            <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] shrink-0" />
            <span className="font-fun font-bold text-xs hidden lg:inline whitespace-nowrap">
              {preferredCategory
                ? SUBJECT_CHOICES.find((c) => c.id === preferredCategory)?.label || 'Materie'
                : 'Materie'}
            </span>
          </button>

          <button
            onClick={() => {
              const next = soundManager.toggleMusic();
              setMusicOn(next);
            }}
            title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            className={`glossy-bubble-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center cursor-pointer ${
              musicOn
                ? 'bg-gradient-to-b from-fuchsia-400 to-purple-600 text-white border-white/90'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border-white'
            }`}
          >
            {musicOn ? (
              <Music className="w-4 h-4 stroke-[2.6]" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[2.6]" />
            )}
          </button>

          <button
            onClick={handleReplayVoice}
            className="glossy-bubble-btn w-9 h-9 sm:w-auto sm:h-10 sm:px-3.5 rounded-full border-2 border-amber-100 bg-gradient-to-b from-amber-300 via-orange-400 to-orange-600 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Riascolta la domanda"
          >
            <Volume2 className="w-4 h-4 stroke-[2.6] shrink-0" />
            <span className="font-fun font-extrabold text-xs hidden sm:inline whitespace-nowrap">
              Ascolta
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              onOpenParents();
            }}
            className="glossy-bubble-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gradient-to-b from-white to-sky-100 text-blue-700 flex items-center justify-center cursor-pointer"
            title="Area Genitori & Profilo CHC"
          >
            <ShieldCheck className="w-4.5 h-4.5 text-blue-700 stroke-[2.4]" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN GAMEPLAY STAGE (MOBILE, TABLET & PC — PORTRAIT & LANDSCAPE)      */}
      {/* ===================================================================== */}
      <main className="arena-main-scroll app-shell-container relative z-10 flex-1 flex flex-col justify-start sm:justify-center px-2.5 sm:px-5 lg:px-8 py-1 sm:py-2 w-full min-h-0 gap-2 sm:gap-3 overflow-y-auto">
        {/* =================================================================== */}
        {/* CHILD AUTONOMY: CURIOSITY SUBJECT CHOOSER BAR                       */}
        {/* =================================================================== */}
        {isSubjectPickerOpen && (
          <section
            aria-label="Scegli materia"
            className="storybook-footer-pill rounded-2xl px-3 py-2.5 shrink-0 animate-pop-in"
          >
            <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
              <span className="font-fun font-extrabold text-xs sm:text-sm text-amber-950">
                🧭 Cosa vuoi esplorare adesso, {childName}?
              </span>
              <button
                type="button"
                onClick={() => setIsSubjectPickerOpen(false)}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 px-2.5 py-1 rounded-xl bg-amber-100 cursor-pointer"
              >
                Chiudi
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUBJECT_CHOICES.map((subj) => {
                const isActive = preferredCategory === subj.id;
                return (
                  <button
                    key={subj.id || 'surprise'}
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      setPreferredCategory(subj.id);
                      setIsSubjectPickerOpen(false);
                    }}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-fun font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all border-2 ${
                      isActive
                        ? 'bg-gradient-to-b from-violet-500 to-indigo-600 text-white border-white shadow-sm'
                        : 'bg-white text-slate-800 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>{subj.emoji}</span>
                    <span>{subj.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* (Zoo Parlante is now a standalone Svago activity outside the tests!) */}

        {/* =================================================================== */}
        {/* ADAPTIVE 3D STAGE: VERTICAL ON PORTRAIT, 2-COLUMN SPLIT ON LANDSCAPE*/}
        {/* =================================================================== */}
        <div className={`stage-3d-perspective ${optionsList.length > 0 ? 'arena-stage-grid' : 'w-full'}`}>
          {/* CARVED WOOD & CREAM PARCHMENT QUESTION BOARD */}
          <div className="storybook-parchment-board board-3d-tabletop rounded-[28px] px-3.5 py-3.5 sm:px-6 sm:py-5 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
            {/* Guide & Difficulty Kicker */}
            <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-1 text-xs sm:text-sm font-bold">
              <span className="inline-flex items-center gap-1 text-slate-900 font-extrabold">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <span>{puzzle.animalGuide.name}</span>
              </span>

              {puzzle.difficultyLabel && (
                <>
                  <span className="text-amber-700/40" aria-hidden="true">|</span>
                  <span
                    className={
                      puzzle.isMasteryUnlocked
                        ? 'text-amber-700 font-extrabold'
                        : 'text-emerald-700 font-extrabold'
                    }
                  >
                    {puzzle.isMasteryUnlocked ? `★ ${puzzle.difficultyLabel}` : puzzle.difficultyLabel}
                  </span>
                </>
              )}
            </div>

            {puzzle.iqParameterTag && (
              <p className="relative z-10 text-[11px] sm:text-xs font-extrabold text-indigo-700 mb-1.5 leading-snug">
                {puzzle.iqParameterTag}
              </p>
            )}

            {/* Main Question Text + Charming 3D Character Cameo on the Right */}
            <div className="relative z-10 flex items-center justify-center gap-2.5 sm:gap-4 w-full max-w-2xl">
              <h2 className="font-fun font-extrabold text-base sm:text-2xl lg:text-[26px] text-slate-900 leading-snug flex-1 text-center">
                {puzzle.prompt}
              </h2>

              {questionCameo.imageSrc && (
                <div className="flex w-13 h-13 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md shrink-0 bg-sky-100">
                  <img
                    src={questionCameo.imageSrc}
                    alt={questionCameo.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}
            </div>

            {/* GENTLE ANTI-FRUSTRATION HINT FEEDBACK & HELPER BUTTON */}
            {(canUseMagicHint || magicHintMessage) && (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                {magicHintMessage && (
                  <span className="text-xs sm:text-sm font-semibold text-indigo-700">
                    💡 {magicHintMessage}
                  </span>
                )}
                {canUseMagicHint && (
                  <button
                    type="button"
                    onClick={handleMagicHint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-fun font-bold text-xs cursor-pointer transition-colors min-h-[36px]"
                    title="Togli una risposta sbagliata per ragionare con calma"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Aiuto del Maestro</span>
                  </button>
                )}
              </div>
            )}

            {/* 1. INTERACTIVE FINGER COUNTING (`count_interactive`) — 3D STORYBOOK MEADOW TRAY */}
            {isCountingMode && puzzle.targetCount && (
              <div className="relative z-10 mt-3 sm:mt-4 flex flex-col items-center gap-2.5 sm:gap-3 w-full">
                {/* Carved Wood Live Counter Badge */}
                <div className="storybook-wood-sign inline-flex items-center gap-2 px-4 py-1 rounded-full text-[#422006] font-kids font-bold text-xs sm:text-sm tabular-nums">
                  <span>{puzzle.itemGender === 'm' ? 'Contati:' : 'Contate:'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-extrabold text-sm sm:text-base">
                    {tappedCountIndices.length} / {puzzle.targetCount}
                  </span>
                </div>

                <div className="storybook-tray-3d flex items-center justify-center gap-3 sm:gap-4 flex-wrap px-3.5 sm:px-5 py-4 rounded-3xl w-full">
                  {Array.from({ length: puzzle.targetCount }).map((_, idx) => {
                    const isTapped = tappedCountIndices.includes(idx);
                    const orderNumber = tappedCountIndices.indexOf(idx) + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTapCountObject(idx)}
                        className={`count-sphere-responsive relative w-18 h-18 sm:w-22 sm:h-22 lg:w-24 lg:h-24 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          isTapped
                            ? 'sphere-3d-counted scale-105'
                            : 'sphere-3d-counter animate-float-3d hover:scale-105'
                        }`}
                      >
                        <span className="text-4xl sm:text-5xl lg:text-6xl leading-none drop-shadow-[0_4px_4px_rgba(15,23,42,0.2)]">
                          {puzzle.itemEmoji || '🦋'}
                        </span>
                        {isTapped ? (
                          <span className="absolute -top-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 text-amber-950 font-kids font-bold text-sm sm:text-base border-2 border-white flex items-center justify-center shadow-md animate-pop-in tabular-nums">
                            {orderNumber}
                          </span>
                        ) : (
                          <span className="storybook-play-dot absolute -bottom-1 right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-pink-600 flex items-center justify-center">
                            <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Tocca ogni figura 3D per contarla ad alta voce
                </span>
              </div>
            )}

            {/* 2. VISUAL ADDITION (`visual_addition`) — CARVED WOOD & 3D CANDY TILES */}
            {puzzle.additionParts && (
              <div className="relative z-10 mt-3 storybook-tray-3d flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-3.5 sm:px-5 py-3 rounded-3xl">
                <div className="flex items-center gap-1.5 bg-gradient-to-b from-rose-50 to-pink-100 px-3 py-2 rounded-2xl border-2 border-pink-300 shadow-[0_3px_0_#ec4899] flex-wrap justify-center">
                  {Array.from({ length: puzzle.additionParts.countA }).map((_, i) => (
                    <span key={i} className="text-2xl sm:text-3xl lg:text-4xl animate-float-3d drop-shadow-xs">
                      {puzzle.additionParts!.emoji}
                    </span>
                  ))}
                </div>
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-rose-400 to-pink-600 border-2 border-white shadow-md flex items-center justify-center font-kids font-bold text-xl sm:text-2xl text-white">
                  +
                </span>
                <div className="flex items-center gap-1.5 bg-gradient-to-b from-sky-50 to-cyan-100 px-3 py-2 rounded-2xl border-2 border-sky-300 shadow-[0_3px_0_#0284c7] flex-wrap justify-center">
                  {Array.from({ length: puzzle.additionParts.countB }).map((_, i) => (
                    <span key={i} className="text-2xl sm:text-3xl lg:text-4xl animate-float-3d drop-shadow-xs">
                      {puzzle.additionParts!.emoji}
                    </span>
                  ))}
                </div>
                <span className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-white shadow-[0_3px_0_#b45309] font-kids font-bold text-lg sm:text-2xl text-amber-950">
                  = ?
                </span>
              </div>
            )}

            {/* 3. VISUAL SUBTRACTION (`visual_subtraction`) — 3D WOODEN ITEM TRAY */}
            {puzzle.subtractionParts && (
              <div className="relative z-10 mt-3 storybook-tray-3d flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap px-3.5 sm:px-5 py-3 rounded-3xl">
                {Array.from({ length: puzzle.subtractionParts.total }).map((_, idx) => {
                  const isRemoved =
                    idx >= puzzle.subtractionParts!.total - puzzle.subtractionParts!.minus;
                  return (
                    <div
                      key={idx}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 ${
                        isRemoved
                          ? 'bg-rose-100/80 border-rose-300 opacity-55 scale-92'
                          : 'bg-gradient-to-b from-white to-emerald-50 border-emerald-400 shadow-[0_4px_0_#16a34a] animate-float-3d'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl drop-shadow-xs">
                        {puzzle.subtractionParts!.emoji}
                      </span>
                      {isRemoved && (
                        <span className="absolute text-rose-600 font-black text-2xl drop-shadow-xs">✖</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. MUSIC & RHYTHM RAINBOW 3D WOODEN XYLOPHONE (`music_rhythm`) */}
            {puzzle.rhythmNotes && puzzle.rhythmNotes.length > 0 && (
              <div className="relative z-10 mt-3 flex flex-col items-center gap-2.5 w-full">
                <div className="storybook-wood-shelf flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap px-3 sm:px-4 py-2.5 sm:py-3 rounded-3xl">
                  {puzzle.rhythmNotes.map((note, idx) => {
                    const isPlaying = activeNoteIdx === idx;
                    const barColor = XYLO_BAR_COLORS[idx % XYLO_BAR_COLORS.length];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveNoteIdx(idx);
                          soundManager.playMusicalNote(note.freq, note.duration || 0.34);
                          setTimeout(() => setActiveNoteIdx(null), 340);
                        }}
                        className={`xylo-bar-3d bg-gradient-to-b ${barColor} px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-kids font-bold text-xs sm:text-sm text-white flex flex-col items-center gap-0.5 cursor-pointer ${
                          isPlaying ? 'scale-110 ring-4 ring-yellow-200 brightness-110' : 'hover:scale-105'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-white/80 shadow-inner mb-0.5" aria-hidden="true" />
                        <span className="text-xl sm:text-2xl drop-shadow-xs">{note.emoji}</span>
                        <span className="text-[11px] sm:text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                          {note.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleReplayRhythm}
                  className="home-lavender-outer rounded-2xl p-[3px] cursor-pointer"
                >
                  <span className="home-inner-purple rounded-[13px] px-4 py-1.5 font-kids font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-amber-200" />
                    <span>Risenti Melodia</span>
                  </span>
                </button>
              </div>
            )}

            {/* 5. ENGLISH WORD 3D STORYBOOK FLASHCARD (`english_words`) */}
            {puzzle.englishWord && (
              <div className="relative z-10 mt-3 storybook-tray-3d flex items-center gap-3 px-4 py-2.5 rounded-3xl">
                <div className="orb-3d-pedestal w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl animate-float-3d shrink-0">
                  {puzzle.englishWord.emoji}
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-700 block leading-tight">
                    🇬🇧 {puzzle.englishWord.categoryLabel}
                  </span>
                  <p className="font-kids font-bold text-lg sm:text-2xl text-slate-900 leading-tight">
                    "{puzzle.englishWord.en}"
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-amber-950/85">
                    Pronuncia: <strong className="text-slate-900">"{puzzle.englishWord.phoneticHint}"</strong> ({puzzle.englishWord.it})
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
                  className="glossy-bubble-btn p-2.5 sm:p-3 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 text-white border-2 border-white cursor-pointer shrink-0"
                >
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}

            {/* 6. PATTERN / MATRIX 3D WOODEN RAIL (`patternItems`) */}
            {puzzle.patternItems && puzzle.patternItems.length > 0 && (
              <div className="relative z-10 mt-3 storybook-wood-shelf flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-3xl">
                {puzzle.patternItems.map((item, idx) => {
                  const isMystery = item === '❓' || item === '?';
                  const isArrow = item === '➔' || item === '➡️';
                  if (isArrow) {
                    return (
                      <span key={idx} className="text-xl sm:text-2xl font-black text-amber-100 drop-shadow-xs">
                        ➔
                      </span>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className={`min-w-12 h-12 sm:min-w-14 sm:h-14 px-2.5 rounded-2xl flex items-center justify-center border-2 ${
                        isMystery
                          ? 'bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 border-white text-amber-950 font-kids font-bold text-xl sm:text-2xl shadow-[0_4px_0_#b45309] animate-gentle-bounce'
                          : 'orb-3d-pedestal text-2xl sm:text-3xl lg:text-4xl animate-float-3d'
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
          {/* VIBRANT PIXAR 3D ILLUSTRATED CHOICE CARDS                         */}
          {/* ================================================================= */}
          {optionsList.length > 0 && (
            <div
              className={`options-grid-responsive grid ${
                optionsList.length === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2'
              } gap-2.5 sm:gap-3.5 w-full shrink-0`}
            >
              {optionsList.map((option, idx) => {
                const isWrong = wrongOptionIds.includes(option.id);
                const isChosenCorrect =
                  isSolved && selectedOptionId === option.id && option.isCorrect;
                const cardTheme =
                  CANDY_CARD_THEMES[idx % CANDY_CARD_THEMES.length];
                const visualScene = resolveOptionArtwork(option, puzzle.category);
                const isLastOfThree = optionsList.length === 3 && idx === 2;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    disabled={isSolved || isWrong}
                    className={`toy-card-3d relative rounded-[26px] p-1.5 flex flex-col justify-between transition-all cursor-pointer ${
                      cardTheme.cardClass
                    } ${
                      isLastOfThree
                        ? 'option-last-of-three col-span-2 sm:col-span-1 w-[68%] sm:w-full mx-auto'
                        : 'w-full'
                    } ${
                      isWrong
                        ? 'opacity-45 grayscale scale-96 cursor-not-allowed'
                        : isChosenCorrect
                        ? 'ring-4 ring-emerald-300 scale-[1.02] shadow-xl'
                        : ''
                    }`}
                  >
                    {/* Upper Full-Bleed 3D Storybook Scene Window */}
                    <div
                      className={`relative w-full h-24 sm:h-32 rounded-t-[20px] rounded-b-[14px] overflow-hidden bg-gradient-to-b ${visualScene.skyGradient} flex items-center justify-center`}
                    >
                      {visualScene.imageSrc ? (
                        <img
                          src={visualScene.imageSrc}
                          alt={option.label}
                          referrerPolicy="no-referrer"
                          style={{ objectPosition: visualScene.imagePosition || 'center center' }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          {/* Layered Sunny Storybook Hill & Cloud Stage for non-animal subjects */}
                          <div className="pointer-events-none absolute top-2 left-3 w-10 h-4 rounded-full bg-white/75 blur-[1px]" />
                          <div className="pointer-events-none absolute top-4 right-4 w-8 h-3 rounded-full bg-white/65 blur-[1px]" />
                          <div
                            className={`pointer-events-none absolute -bottom-5 -left-6 w-[130%] h-12 rounded-[100%] bg-gradient-to-t ${visualScene.hillGradient} opacity-85`}
                          />
                          <div className="orb-3d-pedestal option-pedestal-responsive relative z-10 w-15 h-15 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0">
                            <span
                              className={`option-emoji-responsive text-4xl sm:text-5xl leading-none drop-shadow-[0_4px_4px_rgba(15,23,42,0.2)] ${
                                !isWrong ? 'animate-float-3d' : ''
                              }`}
                            >
                              {option.emoji || '⭐'}
                            </span>
                          </div>
                        </>
                      )}

                      {isChosenCorrect && (
                        <div className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md z-20">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Lower Curved Glossy Colored Banner — Full Readable Text, Zero Truncation */}
                    <div
                      className={`relative z-10 w-full -mt-2 rounded-b-[20px] rounded-t-[16px] bg-gradient-to-b ${cardTheme.ribbonClass} px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-left`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-kids font-bold text-sm sm:text-lg text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.32)] block leading-tight break-words">
                          {option.label}
                        </span>
                        {option.sublabel && (
                          <span
                            className={`font-semibold text-[10.5px] sm:text-xs ${cardTheme.subtextClass} block leading-tight mt-0.5 break-words`}
                          >
                            {option.sublabel}
                          </span>
                        )}
                      </div>

                      <span className="storybook-play-dot w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0">
                        <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 ${cardTheme.playIconClass}`} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* WARM CREAM PARCHMENT & GOLD-STAR FOOTER (FULL READABLE TEXT, ZERO TRUNCATION) */}
      <footer className="landscape-footer-compact app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 pb-2 sm:pb-3 w-full shrink-0">
        <div className="storybook-footer-pill rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-base sm:text-lg shrink-0" aria-hidden="true">🪄</span>
            <div className="leading-snug min-w-0">
              <p className="text-[11px] sm:text-xs font-fun font-extrabold text-slate-900 tabular-nums">
                Missione: {dailyMission.inCurrentCycle}/{DAILY_MISSION_TARGET}
                <span className="text-slate-400 mx-1">·</span>
                <span className="text-indigo-700 font-bold">
                  {puzzle.subjectLabel || theme.title}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex items-center gap-0.5" aria-label="Progresso mini-missione di oggi">
              {Array.from({ length: DAILY_MISSION_TARGET }).map((_, idx) => {
                const isLit = idx < dailyMission.inCurrentCycle;
                return (
                  <Star
                    key={idx}
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                      isLit
                        ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                        : 'text-amber-300/60 fill-amber-100/70'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                soundManager.playPop();
                onOpenAlbum();
              }}
              className="min-h-[34px] px-2.5 py-1 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border border-white font-fun font-extrabold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap tabular-nums"
              title="Apri l'Album dei Tesori e le Curiosità del giorno"
            >
              <Gift className="w-3.5 h-3.5 text-amber-900 shrink-0" />
              <span>
                {dailyMission.isDailyChestReady
                  ? 'Scrigno!'
                  : `💎 ${progress.gems}`}
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MODERN VICTORY & MINDFUL BRAIN-BREAK CELEBRATION OVERLAY              */}
      {/* ===================================================================== */}
      {isSolved && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="storybook-parchment-board relative w-full max-w-md my-auto rounded-[30px] p-5 sm:p-6 text-center animate-pop-in mt-10 sm:mt-auto">
            <div className="medallion-3d-frame mx-auto -mt-14 w-24 h-24 rounded-3xl overflow-hidden border-4 border-white bg-amber-50 flex items-center justify-center mb-3">
              <img
                src={willCompleteMission ? treasureChest3d : trophyMedallion3d}
                alt={willCompleteMission ? 'Scrigno della Missione 3D' : 'Trofeo Vittoria 3D'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {willCompleteMission ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Mini-Missione 5/5 Completata · Scrigno Aperto!
                </p>
                <h3 className="font-fun font-extrabold text-xl sm:text-2xl text-slate-900 mt-0.5 leading-tight">
                  {getPersonalizedBreakGreeting(childName, childGender)}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1.5 leading-relaxed">
                  {puzzle.funExplanation}
                </p>

                {/* Mission Bonus Reward Strip */}
                <div className="mt-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 p-3 flex items-center justify-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
                    {missionBonusSticker ? missionBonusSticker.emoji : '💎'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-fun font-extrabold text-sm text-amber-950 flex items-center gap-1.5 tabular-nums">
                      <Gem className="w-4 h-4 text-amber-600" />
                      <span>+5 Gemme Bonus!</span>
                    </p>
                    <p className="text-xs text-amber-900/90 leading-snug">
                      {missionBonusSticker
                        ? `Nuovo adesivo nell'Album: ${missionBonusSticker.name}!`
                        : 'Hai già tutti gli adesivi! Continua a brillare!'}
                    </p>
                  </div>
                </div>

                {/* Gentle Anti-Fatigue Mindful Brain-Break Tip */}
                <div className="mt-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-3.5 text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl leading-none shrink-0">{mindfulBreak.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Pausa Ricarica Mente · 15 Secondi
                      </p>
                      <p className="font-fun font-extrabold text-sm text-slate-900">
                        {mindfulBreak.title}
                      </p>
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                        {mindfulBreak.instruction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zero-Pressure Choices */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleNextLevel()}
                    className="toy-button-3d w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-fun font-extrabold text-sm sm:text-base border border-emerald-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continua al Livello {currentLevel + 1}</span>
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playPop();
                        commitSolve();
                        onOpenStudio();
                      }}
                      className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Palette className="w-4 h-4 shrink-0" />
                      <span>Pausa Disegno</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playPop();
                        commitSolve();
                        onOpenAlbum();
                      }}
                      className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Gift className="w-4 h-4 shrink-0" />
                      <span>Apri Album</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-fun font-extrabold text-2xl sm:text-3xl text-slate-900">
                  {getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico')} {childName}! 🎉
                </h3>
                <p className="text-sm sm:text-base font-medium text-slate-600 mt-1.5 leading-relaxed">
                  {puzzle.funExplanation}
                </p>

                <div className="flex items-center justify-center gap-3 my-3.5 bg-amber-50/70 py-2.5 px-4 rounded-2xl border border-amber-200/80">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce"
                      style={{ animationDelay: `${starIdx * 0.12}s` }}
                    />
                  ))}
                  <span className="text-xs font-fun font-bold text-amber-800 ml-1 tabular-nums">
                    Missione {dailyMission.inCurrentCycle + 1}/{DAILY_MISSION_TARGET}
                  </span>
                </div>

                {/* Quick Next-Subject Curiosity Selector */}
                <div className="mb-3.5 text-left">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-center">
                    Prossima Sfida · Scegli o Sorpresa
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {SUBJECT_CHOICES.map((subj) => {
                      const active = preferredCategory === subj.id;
                      return (
                        <button
                          key={subj.id || 'auto'}
                          type="button"
                          onClick={() => {
                            soundManager.playPop();
                            setPreferredCategory(subj.id);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-fun font-bold cursor-pointer transition-colors border min-h-[34px] ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                          }`}
                        >
                          {subj.emoji} {subj.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => handleNextLevel()}
                  className="toy-button-3d w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-fun font-extrabold text-base sm:text-lg border border-emerald-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continua al Livello {currentLevel + 1}</span>
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
