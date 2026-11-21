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
import { getDisplayChildName, getGenderedWord } from '../utils/childProfile';

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

const CANDY_CARD_CLASSES = [
  'toy-candy-pink',
  'toy-candy-yellow',
  'toy-candy-cyan',
  'toy-candy-lime',
];

interface ZooTalkingAnimal {
  id: 'leone' | 'giraffa' | 'elefante';
  name: string;
  englishName: string;
  englishPhonetic: string;
  emoji: string;
  soundLabel: string;
  habitat: string;
  badgeClass: string;
  phrases: string[];
}

const ZOO_PARLANTE_ANIMALS: ZooTalkingAnimal[] = [
  {
    id: 'leone',
    name: 'Il Leone Leo',
    englishName: 'Lion',
    englishPhonetic: 'Làion',
    emoji: '🦁',
    soundLabel: 'ROAAAR!',
    habitat: 'Re della Savana',
    badgeClass: 'from-amber-500 to-orange-600 border-amber-200/90',
    phrases: [
      'Ciao {NAME}! Io sono il Leone Leo! Roaaar! Ho una grande criniera dorata e sono il re della savana! In inglese mi chiamo Làion!',
      'Roaaar! Sapevi {NAME} che il mio ruggito si sente fino a otto chilometri di distanza nella savana?',
      'Ciao {CHAMPION}! Io sono il Leone! Corro veloce sull’erba dorata e proteggo tutto il mio branco!',
    ],
  },
  {
    id: 'giraffa',
    name: 'La Giraffa Gina',
    englishName: 'Giraffe',
    englishPhonetic: 'Giràf',
    emoji: '🦒',
    soundLabel: 'GNAM GNAM!',
    habitat: 'Collo Lunghissimo',
    badgeClass: 'from-emerald-500 to-teal-600 border-emerald-200/90',
    phrases: [
      'Ciao {NAME}! Io sono la Giraffa Gina! Gnam gnam! Con il mio collo lunghissimo mangio le foglioline più tenere in cima agli alberi! In inglese mi chiamo Giràf!',
      'Gnam gnam! Sapevi {NAME} che la mia lingua è blu-viola ed è lunga quasi mezzo metro per raccogliere le foglie di acacia?',
      'Ciao {NAME}! Dall’alto del mio collo vedo tutto lo Zoo Parlante e persino le nuvole bianche!',
    ],
  },
  {
    id: 'elefante',
    name: 'L’Elefante Elio',
    englishName: 'Elephant',
    englishPhonetic: 'Èlefant',
    emoji: '🐘',
    soundLabel: 'PA-UUUH!',
    habitat: 'Super Proboscide',
    badgeClass: 'from-sky-500 to-indigo-600 border-sky-200/90',
    phrases: [
      'Ciao {NAME}! Io sono l’Elefante Elio! Pa-uuuh! Uso la mia lunga proboscide per bere e fare una doccia fresca! In inglese mi chiamo Èlefant!',
      'Pa-uuuh! Sapevi {NAME} che le mie grandi orecchie mi servono per farmi vento quando fa tanto caldo nella savana?',
      'Ciao {FRIEND}! Io sono l’Elefante! Ho una memoria straordinaria e non dimentico mai le nostre avventure!',
    ],
  },
];

export const PlayArena: React.FC<PlayArenaProps> = ({
  progress,
  onSolveLevel,
  onOpenParents,
  onExitToTitle,
}) => {
  const currentLevel = progress.currentLevel;
  const childProfile = progress.childProfile;
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generateProceduralPuzzle(currentLevel, childProfile)
  );
  const [wrongOptionIds, setWrongOptionIds] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [tappedCountIndices, setTappedCountIndices] = useState<number[]>([]);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);
  const [activeZooAnimal, setActiveZooAnimal] = useState<ZooTalkingAnimal | null>(null);
  const [zooPhraseIndex, setZooPhraseIndex] = useState<Record<string, number>>({});
  const [isZooExpanded, setIsZooExpanded] = useState<boolean>(true);

  const countFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zooSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (zooSpeechTimerRef.current) {
        clearTimeout(zooSpeechTimerRef.current);
        zooSpeechTimerRef.current = null;
      }
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
    if (zooSpeechTimerRef.current) {
      clearTimeout(zooSpeechTimerRef.current);
      zooSpeechTimerRef.current = null;
    }
    clearReplayTimers();
    soundManager.stopRhythmSequence();
    isFinishingCountRef.current = false;
    levelStartMsRef.current = Date.now();
    solveElapsedMsRef.current = 4800;

    const nextPuzzle = generateProceduralPuzzle(currentLevel, childProfile);
    setPuzzle(nextPuzzle);
    setWrongOptionIds([]);
    setSelectedOptionId(null);
    setAttempts(0);
    setHintsUsed(0);
    setIsSolved(false);
    setTappedCountIndices([]);
    setActiveNoteIdx(null);
    setActiveZooAnimal(null);

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
      if (zooSpeechTimerRef.current) {
        clearTimeout(zooSpeechTimerRef.current);
        zooSpeechTimerRef.current = null;
      }
    };
  }, [
    currentLevel,
    childProfile?.birthDate,
    childProfile?.name,
    childProfile?.gender,
    clearReplayTimers,
  ]);

  const handleTapZooAnimal = useCallback(
    (animal: ZooTalkingAnimal) => {
      setActiveZooAnimal(animal);
      const currentIdx = zooPhraseIndex[animal.id] ?? 0;
      const championWord = getGenderedWord(
        childGender,
        'campionessa',
        'campione',
        'campione'
      );
      const friendWord = getGenderedWord(
        childGender,
        'amica mia',
        'amico mio',
        'amico speciale'
      );
      const rawPhrase = animal.phrases[currentIdx % animal.phrases.length];
      const phrase = rawPhrase
        .replace(/\{NAME\}/g, childName)
        .replace(/\{CHAMPION\}/g, championWord)
        .replace(/\{FRIEND\}/g, friendWord);
      setZooPhraseIndex((prev) => ({
        ...prev,
        [animal.id]: currentIdx + 1,
      }));

      if (zooSpeechTimerRef.current) {
        clearTimeout(zooSpeechTimerRef.current);
      }

      // Play custom synthesized animal sound effect + expressive Italian speech
      soundManager.playZooAnimalSound(animal.id);
      zooSpeechTimerRef.current = setTimeout(() => {
        soundManager.speak(phrase, { context: 'instruction' });
        zooSpeechTimerRef.current = null;
      }, 280);
    },
    [zooPhraseIndex, childName, childGender]
  );

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
      {/* MODERN LUMINOUS AURORA & SOFT ATMOSPHERIC SCENERY                     */}
      {/* ===================================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Soft Sun Halo */}
        <div className="absolute -top-10 -right-10 w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-amber-200/80 via-yellow-300/60 to-orange-300/40 blur-xs border border-white/60 flex items-center justify-center animate-float-3d">
          <span className="text-4xl sm:text-5xl drop-shadow-sm">🌞</span>
        </div>

        {/* Subtle Luminous Rainbow Arc */}
        <svg
          viewBox="0 0 600 220"
          className="w-[115%] max-w-none -left-[7%] top-6 absolute opacity-35"
          fill="none"
        >
          <path d="M 20 210 Q 300 -30 580 210" stroke="#fb7185" strokeWidth="10" strokeLinecap="round" />
          <path d="M 32 215 Q 300 -12 568 215" stroke="#fbbf24" strokeWidth="10" strokeLinecap="round" />
          <path d="M 44 220 Q 300 6 556 220" stroke="#34d399" strokeWidth="10" strokeLinecap="round" />
          <path d="M 56 225 Q 300 24 544 225" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" />
          <path d="M 68 230 Q 300 42 532 230" stroke="#a78bfa" strokeWidth="10" strokeLinecap="round" />
        </svg>

        {/* Soft Drifting Glass Clouds */}
        <div className="absolute top-14 left-4 w-28 h-10 bg-white/75 backdrop-blur-xs rounded-full shadow-sm animate-cloud-drift" />
        <div
          className="absolute top-22 right-14 w-24 h-9 bg-white/70 backdrop-blur-xs rounded-full shadow-sm animate-cloud-drift"
          style={{ animationDelay: '1.4s' }}
        />

        {/* Soft Modern Meadow Horizon at bottom */}
        <div className="absolute -bottom-12 -left-16 w-[75%] h-26 rounded-[100%] bg-gradient-to-t from-emerald-500/35 via-teal-400/25 to-transparent" />
        <div className="absolute -bottom-14 -right-16 w-[75%] h-28 rounded-[100%] bg-gradient-to-t from-teal-500/35 via-emerald-400/25 to-transparent" />
      </div>

      {/* ===================================================================== */}
      {/* MODERN TOP NAVIGATION BAR                                             */}
      {/* ===================================================================== */}
      <header className="landscape-header-compact app-shell-container relative z-10 flex items-center justify-between px-2.5 sm:px-5 lg:px-8 pt-2.5 sm:pt-3.5 pb-1 shrink-0 gap-2">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.stopRhythmSequence();
            soundManager.playPop();
            onExitToTitle();
          }}
          className="toy-button-3d bg-white/90 hover:bg-white backdrop-blur-md text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-white/90 flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
          <span className="font-fun font-bold text-xs sm:text-sm whitespace-nowrap">Home</span>
        </button>

        {/* Center Modern Category & Level Status Pill */}
        <div
          className={`bg-gradient-to-r ${theme.badgeGradient} px-3.5 sm:px-5 py-1.5 rounded-2xl border shadow-md flex items-center gap-2 min-w-0`}
        >
          <span className="text-base sm:text-xl shrink-0">{theme.emoji}</span>
          <div className="text-left min-w-0 leading-tight">
            <p className="text-[10px] sm:text-[11px] font-semibold text-white/90 truncate">
              {theme.title}
            </p>
            <p className="font-fun font-extrabold text-xs sm:text-sm text-white whitespace-nowrap tabular-nums">
              Livello {currentLevel} <span className="opacity-60">·</span> ⭐ {progress.stars}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              soundManager.playPop();
              setIsZooExpanded((prev) => !prev);
            }}
            title="Apri o chiudi lo Zoo Parlante"
            className={`toy-button-3d px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border flex items-center gap-1.5 active:scale-95 cursor-pointer min-h-[40px] ${
              isZooExpanded
                ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-200/80'
                : 'bg-white/90 text-slate-800 border-white/90'
            }`}
          >
            <span className="text-sm sm:text-base leading-none">🦁</span>
            <span className="font-fun font-bold text-[11px] sm:text-xs hidden md:inline whitespace-nowrap">
              Zoo Parlante
            </span>
          </button>

          <button
            onClick={() => {
              const next = soundManager.toggleMusic();
              setMusicOn(next);
            }}
            title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            className={`toy-button-3d p-2 sm:px-2.5 sm:py-2 rounded-2xl border flex items-center gap-1 active:scale-95 cursor-pointer min-h-[40px] min-w-[40px] justify-center ${
              musicOn
                ? 'bg-gradient-to-b from-violet-500 to-purple-600 text-white border-violet-200/80'
                : 'bg-white/90 text-slate-600 border-white/90'
            }`}
          >
            {musicOn ? (
              <Music className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>

          <button
            onClick={handleReplayVoice}
            className="toy-button-3d bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 p-2 sm:px-3.5 sm:py-2 rounded-2xl border border-amber-200/90 flex items-center gap-1.5 active:scale-95 cursor-pointer min-h-[40px]"
            title="Riascolta la domanda"
          >
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
            <span className="font-fun font-bold text-xs hidden sm:inline whitespace-nowrap">Ascolta</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              onOpenParents();
            }}
            className="toy-button-3d bg-white/90 hover:bg-white text-slate-800 p-2 rounded-2xl border border-white/90 active:scale-95 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Area Genitori & Profilo CHC"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN GAMEPLAY STAGE (MOBILE, TABLET & PC — PORTRAIT & LANDSCAPE)      */}
      {/* ===================================================================== */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col justify-start sm:justify-center px-2.5 sm:px-5 lg:px-8 py-1.5 sm:py-2.5 w-full min-h-0 gap-2.5 sm:gap-3.5 overflow-y-auto">
        {/* =================================================================== */}
        {/* ZOO PARLANTE INTERACTIVE BENTO SECTION (LEONE, GIRAFFA, ELEFANTE)   */}
        {/* =================================================================== */}
        {isZooExpanded && (
          <section
            aria-label="Zoo Parlante"
            className="zoo-parlante-section bg-white/88 backdrop-blur-xl rounded-3xl p-2.5 sm:p-3.5 border border-white/95 shadow-[0_14px_30px_-10px_rgba(15,23,42,0.12)] shrink-0"
          >
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm">
                <span className="font-fun font-extrabold text-emerald-700 whitespace-nowrap">
                  🦁🦒🐘 Zoo Parlante
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
                <span className="text-xs font-medium text-slate-600 truncate hidden sm:inline">
                  Tocca un animale per sentire il suo nome, il verso e una curiosità
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZooExpanded(false)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                Nascondi
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ZOO_PARLANTE_ANIMALS.map((animal) => {
                const isSelected = activeZooAnimal?.id === animal.id;
                return (
                  <button
                    key={animal.id}
                    type="button"
                    onClick={() => handleTapZooAnimal(animal)}
                    className={`zoo-parlante-card toy-button-3d relative rounded-2xl p-2 sm:px-3.5 sm:py-2.5 border flex items-center gap-2 sm:gap-3 text-left transition-all cursor-pointer bg-gradient-to-br ${
                      animal.badgeClass
                    } ${
                      isSelected
                        ? 'ring-3 ring-slate-900/20 scale-[1.01] shadow-md'
                        : 'hover:scale-[1.01] active:scale-98'
                    }`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/95 border border-white shadow-xs flex items-center justify-center shrink-0">
                      <span
                        className={`text-2xl sm:text-3xl leading-none ${
                          isSelected ? 'animate-bounce' : 'animate-float-3d'
                        }`}
                      >
                        {animal.emoji}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/90">
                        {animal.soundLabel}
                      </span>
                      <p className="font-fun font-extrabold text-xs sm:text-sm text-white truncate">
                        {animal.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-white/90 truncate hidden sm:block">
                        🇬🇧 {animal.englishName} ({animal.englishPhonetic})
                      </p>
                    </div>
                    <Volume2 className="w-4 h-4 text-white/90 shrink-0 hidden md:block" />
                  </button>
                );
              })}
            </div>

            {activeZooAnimal && (
              <div className="mt-2 bg-slate-50/95 rounded-2xl px-3 py-2 border border-slate-200/80 flex items-center justify-between gap-2.5 animate-pop-in">
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                  <span className="font-fun font-bold text-slate-900 mr-1.5">
                    {activeZooAnimal.emoji} {activeZooAnimal.name} ({activeZooAnimal.soundLabel}):
                  </span>
                  {
                    activeZooAnimal.phrases[
                      Math.max(0, (zooPhraseIndex[activeZooAnimal.id] ?? 1) - 1) %
                        activeZooAnimal.phrases.length
                    ]
                  }
                </p>
                <button
                  type="button"
                  onClick={() => handleTapZooAnimal(activeZooAnimal)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Risenti</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* =================================================================== */}
        {/* ADAPTIVE STAGE: VERTICAL ON PORTRAIT, 2-COLUMN SPLIT ON LANDSCAPE   */}
        {/* =================================================================== */}
        <div className={optionsList.length > 0 ? 'arena-stage-grid' : 'w-full'}>
          {/* QUESTION & INTERACTIVE SHOWCASE BOARD */}
          <div className="board-3d-tabletop rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
            <div className="flex items-center justify-center gap-2 flex-wrap mb-2 text-xs sm:text-sm text-slate-600 font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-800 font-bold">
                <span className="text-base sm:text-lg">{puzzle.animalGuide.emoji}</span>
                <span>{puzzle.animalGuide.name}</span>
              </span>

              {puzzle.iqParameterTag && (
                <>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-indigo-600 font-semibold">
                    {puzzle.iqParameterTag}
                  </span>
                </>
              )}
            </div>

            <h2 className="font-fun font-extrabold text-lg sm:text-2xl lg:text-[26px] text-slate-900 leading-snug max-w-2xl">
              {puzzle.prompt}
            </h2>

            {/* 1. INTERACTIVE FINGER COUNTING (`count_interactive`) */}
            {isCountingMode && puzzle.targetCount && (
              <div className="mt-3 sm:mt-4 flex flex-col items-center gap-2.5 sm:gap-3 w-full">
                {/* Live Counter Status */}
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 text-white shadow-sm font-fun font-bold text-xs sm:text-sm tabular-nums">
                  <span>{puzzle.itemGender === 'm' ? 'Contati:' : 'Contate:'}</span>
                  <span className="text-amber-300 font-extrabold text-sm sm:text-base">
                    {tappedCountIndices.length} / {puzzle.targetCount}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap bg-slate-50/90 px-3 sm:px-5 py-3.5 sm:py-4 rounded-3xl border border-slate-200/90 w-full">
                  {Array.from({ length: puzzle.targetCount }).map((_, idx) => {
                    const isTapped = tappedCountIndices.includes(idx);
                    const orderNumber = tappedCountIndices.indexOf(idx) + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTapCountObject(idx)}
                        className={`relative w-18 h-18 sm:w-22 sm:h-22 lg:w-24 lg:h-24 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          isTapped
                            ? 'sphere-3d-counted scale-105'
                            : 'sphere-3d-counter animate-float-3d hover:scale-105'
                        }`}
                      >
                        <span className="text-4xl sm:text-5xl lg:text-6xl leading-none drop-shadow-xs">
                          {puzzle.itemEmoji || '🦋'}
                        </span>
                        {isTapped ? (
                          <span className="absolute -top-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white font-fun font-extrabold text-sm sm:text-base border-2 border-white flex items-center justify-center shadow-md animate-pop-in tabular-nums">
                            {orderNumber}
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-pink-600 border border-pink-200 flex items-center justify-center shadow-sm">
                            <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Tocca ogni figura per contarla ad alta voce
                </span>
              </div>
            )}

            {/* 2. VISUAL ADDITION (`visual_addition`) */}
            {puzzle.additionParts && (
              <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3 flex-wrap bg-slate-50/95 px-3.5 sm:px-5 py-3 rounded-2xl border border-slate-200/90">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs flex-wrap justify-center">
                  {Array.from({ length: puzzle.additionParts.countA }).map((_, i) => (
                    <span key={i} className="text-2xl sm:text-3xl lg:text-4xl animate-float-3d">
                      {puzzle.additionParts!.emoji}
                    </span>
                  ))}
                </div>
                <span className="font-fun font-extrabold text-2xl sm:text-3xl text-rose-500">+</span>
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-2xs flex-wrap justify-center">
                  {Array.from({ length: puzzle.additionParts.countB }).map((_, i) => (
                    <span key={i} className="text-2xl sm:text-3xl lg:text-4xl animate-float-3d">
                      {puzzle.additionParts!.emoji}
                    </span>
                  ))}
                </div>
                <span className="font-fun font-extrabold text-2xl sm:text-3xl text-slate-700">= ?</span>
              </div>
            )}

            {/* 3. VISUAL SUBTRACTION (`visual_subtraction`) */}
            {puzzle.subtractionParts && (
              <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap bg-slate-50/95 px-3.5 sm:px-5 py-3 rounded-2xl border border-slate-200/90">
                {Array.from({ length: puzzle.subtractionParts.total }).map((_, idx) => {
                  const isRemoved =
                    idx >= puzzle.subtractionParts!.total - puzzle.subtractionParts!.minus;
                  return (
                    <div
                      key={idx}
                      className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center border ${
                        isRemoved
                          ? 'bg-rose-50 border-rose-200 opacity-45 scale-90'
                          : 'bg-white border-emerald-200 shadow-2xs animate-float-3d'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">
                        {puzzle.subtractionParts!.emoji}
                      </span>
                      {isRemoved && (
                        <span className="absolute text-rose-600 font-black text-xl sm:text-2xl">✖</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. MUSIC & RHYTHM XYLOPHONE (`music_rhythm`) */}
            {puzzle.rhythmNotes && puzzle.rhythmNotes.length > 0 && (
              <div className="mt-3 flex flex-col items-center gap-2.5 w-full">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap bg-slate-50/95 px-3.5 py-2.5 rounded-2xl border border-slate-200/90">
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
                        className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border font-fun font-bold text-xs sm:text-sm transition-all flex flex-col items-center gap-0.5 cursor-pointer shadow-xs ${
                          isPlaying
                            ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white border-pink-200 scale-105 shadow-md'
                            : 'bg-gradient-to-b from-indigo-500 to-violet-600 text-white border-indigo-200 hover:scale-105'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl">{note.emoji}</span>
                        <span className="text-[11px] sm:text-xs">{note.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleReplayRhythm}
                  className="toy-button-3d px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-fun font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Music className="w-4 h-4 text-pink-400" />
                  <span>Risenti Melodia</span>
                </button>
              </div>
            )}

            {/* 5. ENGLISH WORD FLASHCARD (`english_words`) */}
            {puzzle.englishWord && (
              <div className="mt-3 flex items-center gap-3 bg-slate-50/95 px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-3xl sm:text-4xl animate-float-3d shrink-0">
                  {puzzle.englishWord.emoji}
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-700 block truncate">
                    🇬🇧 {puzzle.englishWord.categoryLabel}
                  </span>
                  <p className="font-fun font-extrabold text-lg sm:text-2xl text-slate-900 leading-tight">
                    "{puzzle.englishWord.en}"
                  </p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-600">
                    Pronuncia: <strong className="text-slate-800">"{puzzle.englishWord.phoneticHint}"</strong> ({puzzle.englishWord.it})
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
                  className="toy-button-3d p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 text-white border border-sky-200 shadow-xs cursor-pointer shrink-0"
                >
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}

            {/* 6. PATTERN / MATRIX STRIP (`patternItems`) */}
            {puzzle.patternItems && puzzle.patternItems.length > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap bg-slate-50/95 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200/90">
                {puzzle.patternItems.map((item, idx) => {
                  const isMystery = item === '❓' || item === '?';
                  const isArrow = item === '➔' || item === '➡️';
                  if (isArrow) {
                    return (
                      <span key={idx} className="text-xl sm:text-2xl font-bold text-slate-400">
                        ➔
                      </span>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className={`min-w-11 h-11 sm:min-w-14 sm:h-14 px-2.5 rounded-2xl flex items-center justify-center border shadow-2xs ${
                        isMystery
                          ? 'bg-gradient-to-b from-amber-300 to-amber-400 border-amber-200 text-slate-950 font-fun font-extrabold text-xl sm:text-2xl'
                          : 'bg-white border-slate-200 text-2xl sm:text-3xl lg:text-4xl animate-float-3d'
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
          {/* MODERN TACTILE CHOICE CARDS (ONLY WHEN OPTIONS EXIST)             */}
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
                const candyClass =
                  CANDY_CARD_CLASSES[idx % CANDY_CARD_CLASSES.length];
                const isLastOfThree = optionsList.length === 3 && idx === 2;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    disabled={isSolved || isWrong}
                    className={`toy-card-3d relative rounded-3xl px-3 sm:px-4 py-3 sm:py-4 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden cursor-pointer ${candyClass} ${
                      isLastOfThree
                        ? 'col-span-2 sm:col-span-1 w-[58%] sm:w-full mx-auto'
                        : 'w-full'
                    } ${
                      isWrong
                        ? 'opacity-40 grayscale scale-96 cursor-not-allowed'
                        : isChosenCorrect
                        ? 'ring-3 ring-emerald-400 scale-[1.02] shadow-xl'
                        : 'hover:scale-[1.015] active:scale-97'
                    }`}
                  >
                    {/* Modern Pedestal & Emoji */}
                    <div className="option-pedestal-responsive relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center shrink-0">
                      <span
                        className={`option-emoji-responsive text-4xl sm:text-5xl leading-none ${
                          !isWrong ? 'animate-float-3d' : ''
                        }`}
                      >
                        {option.emoji || '⭐'}
                      </span>
                    </div>

                    {/* Clean Typography Label */}
                    <div className="relative z-10 max-w-full text-center px-1">
                      <span className="font-fun font-extrabold text-base sm:text-lg lg:text-xl text-slate-900 tracking-tight block leading-snug">
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span className="font-medium text-[11px] sm:text-xs text-slate-600 block leading-tight mt-0.5">
                          {option.sublabel}
                        </span>
                      )}
                    </div>

                    {isChosenCorrect && (
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODERN BOTTOM STATUS BAR */}
      <footer className="landscape-footer-compact app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 pb-2.5 sm:pb-3.5 w-full shrink-0">
        <div className="bg-white/88 backdrop-blur-xl rounded-2xl px-3.5 sm:px-5 py-2 border border-white/95 shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
              {puzzle.diagnosticTarget
                ? `Parametri rilevati: ${puzzle.diagnosticTarget}`
                : isCountingMode
                ? `Tocca tutte e ${puzzle.targetCount} le figure per contarle`
                : 'Seleziona la risposta corretta per completare il livello'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className="w-4 h-4 text-amber-400 fill-amber-400"
              />
            ))}
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MODERN VICTORY MODAL OVERLAY                                          */}
      {/* ===================================================================== */}
      {isSolved && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-slate-100 p-6 text-center shadow-[0_24px_60px_-15px_rgba(15,23,42,0.35)] animate-pop-in">
            <div className="mx-auto -mt-12 w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <Trophy className="w-9 h-9 text-white" />
            </div>

            <h3 className="font-fun font-extrabold text-2xl sm:text-3xl text-slate-900">
              {getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico')} {childName}! 🎉
            </h3>
            <p className="text-sm sm:text-base font-medium text-slate-600 mt-1.5 leading-relaxed">
              {puzzle.funExplanation}
            </p>

            <div className="flex items-center justify-center gap-3 my-4 bg-amber-50/70 py-3 px-4 rounded-2xl border border-amber-200/80">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className="w-9 h-9 text-amber-400 fill-amber-400 animate-bounce"
                  style={{ animationDelay: `${starIdx * 0.12}s` }}
                />
              ))}
            </div>

            <button
              onClick={handleNextLevel}
              className="toy-button-3d w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-fun font-extrabold text-base sm:text-lg border border-emerald-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continua al Livello {currentLevel + 1}</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
