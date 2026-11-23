import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Crown,
} from 'lucide-react';
import { GameCategory, Puzzle, PuzzleOption, PuzzleType, UserProgress } from '../types/game';
import {
  generateProceduralPuzzle,
  getEncouragementPhrase,
  MATH_ITEM_CATALOG,
  formatQuantityItalian,
  shouldCallChildByName,
} from '../utils/infiniteLevels';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import {
  calculateChildAge,
  getDisplayChildName,
  getGenderedWord,
  getAgeVisualTheme,
} from '../utils/childProfile';
import type { PointerTelemetrySnapshot } from '../utils/adultPlayDetector';
import {
  DAILY_MISSION_TARGET,
  getDailyMissionStatus,
  getMindfulBreakActivity,
  getPersonalizedBreakGreeting,
  pickNextLockedSticker,
} from '../utils/motivationEngine';
import {
  CardBackdropKind,
  STORYBOOK_ASSETS,
  resolveOptionArtwork,
} from '../utils/cardArtwork';

const {
  arenaMeadowBackdrop,
  treasureChest3d,
  trophyMedallion3d,
} = STORYBOOK_ASSETS;

const CardHabitatBackdrop: React.FC<{
  kind: CardBackdropKind;
  hillGradient: string;
  swatchHex?: string;
}> = ({ kind, hillGradient, swatchHex }) => {
  if (kind === 'sea') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Warm sun shimmer in sky */}
        <circle cx="204" cy="30" r="18" fill="#fef08a" opacity="0.85" />
        {/* Soft coastal clouds */}
        <ellipse cx="48" cy="28" rx="26" ry="10" fill="#ffffff" opacity="0.72" />
        <ellipse cx="64" cy="24" rx="18" ry="8" fill="#ffffff" opacity="0.78" />
        {/* Deep horizon ocean wave */}
        <path
          d="M0 96 Q35 84 70 96 T140 96 T210 96 T240 92 L240 180 L0 180 Z"
          fill="#0284c7"
          opacity="0.78"
        />
        {/* Mid turquoise wave */}
        <path
          d="M0 118 Q40 104 80 118 T160 118 T240 114 L240 180 L0 180 Z"
          fill="#0369a1"
          opacity="0.88"
        />
        {/* Sparkling wave crests */}
        <path
          d="M14 114 Q36 107 58 114 M110 124 Q138 116 164 124 M178 106 Q204 100 226 106"
          stroke="#bae6fd"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
      </svg>
    );
  }

  if (kind === 'sky') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Radiant corner sun */}
        <circle cx="206" cy="32" r="24" fill="#fde047" opacity="0.88" />
        <circle cx="206" cy="32" r="34" fill="#fef08a" opacity="0.32" />
        {/* Fluffy sunlit clouds */}
        <g fill="#ffffff" opacity="0.86">
          <circle cx="38" cy="40" r="16" />
          <circle cx="56" cy="34" r="20" />
          <circle cx="76" cy="42" r="14" />
          <rect x="34" y="40" width="44" height="16" rx="8" />
        </g>
        <g fill="#ffffff" opacity="0.76">
          <circle cx="164" cy="126" r="18" />
          <circle cx="188" cy="118" r="24" />
          <circle cx="212" cy="128" r="16" />
          <rect x="160" y="126" width="56" height="18" rx="9" />
        </g>
        <g fill="#ffffff" opacity="0.58">
          <circle cx="26" cy="136" r="15" />
          <circle cx="48" cy="130" r="19" />
          <rect x="20" y="136" width="38" height="16" rx="8" />
        </g>
      </svg>
    );
  }

  if (kind === 'space') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <circle cx="54" cy="42" r="46" fill="#6366f1" opacity="0.22" />
        <circle cx="196" cy="128" r="52" fill="#a855f7" opacity="0.24" />
        {/* Crescent moon */}
        <circle cx="202" cy="34" r="14" fill="#fde68a" opacity="0.88" />
        <circle cx="208" cy="30" r="12" fill="#1e1b4b" />
        {/* Twinkling stars */}
        {[
          [24, 24, 2.2],
          [52, 18, 1.5],
          [88, 32, 2.4],
          [138, 22, 1.8],
          [166, 44, 2.1],
          [32, 86, 1.9],
          [214, 82, 2.2],
          [42, 134, 2.0],
          [184, 138, 1.6],
          [116, 146, 1.8],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#fef9c3" opacity="0.9" />
        ))}
      </svg>
    );
  }

  if (kind === 'road') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <ellipse cx="52" cy="28" rx="26" ry="10" fill="#ffffff" opacity="0.82" />
        <ellipse cx="182" cy="34" rx="22" ry="9" fill="#ffffff" opacity="0.72" />
        {/* Roadside green grass */}
        <path d="M0 98 Q120 84 240 98 L240 180 L0 180 Z" fill="#22c55e" opacity="0.85" />
        {/* Paved asphalt road */}
        <path d="M0 116 L240 116 L240 180 L0 180 Z" fill="#475569" />
        <line x1="0" y1="118" x2="240" y2="118" stroke="#cbd5e1" strokeWidth="3" />
        {/* White dashed center lane */}
        <line
          x1="12"
          y1="146"
          x2="228"
          y2="146"
          stroke="#fde047"
          strokeWidth="5"
          strokeDasharray="20 14"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === 'ice') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Arctic snowy mountain peaks */}
        <polygon points="0,145 55,68 118,145" fill="#bae6fd" opacity="0.85" />
        <polygon points="55,68 38,94 72,94" fill="#ffffff" opacity="0.95" />
        <polygon points="96,150 176,56 240,145" fill="#7dd3fc" opacity="0.75" />
        <polygon points="176,56 154,88 198,88" fill="#ffffff" opacity="0.95" />
        <path d="M0 124 Q120 110 240 124 L240 180 L0 180 Z" fill="#f0f9ff" opacity="0.92" />
        {/* Falling snowflakes */}
        {[
          [32, 34],
          [94, 26],
          [148, 38],
          [208, 30],
          [66, 62],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill="#ffffff" opacity="0.9" />
        ))}
      </svg>
    );
  }

  if (kind === 'savanna') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <circle cx="196" cy="36" r="24" fill="#fef08a" opacity="0.88" />
        <path d="M0 112 Q80 94 150 112 T240 106 L240 180 L0 180 Z" fill="#f59e0b" opacity="0.65" />
        <path d="M0 132 Q100 116 240 134 L240 180 L0 180 Z" fill="#d97706" opacity="0.75" />
      </svg>
    );
  }

  if (kind === 'meadow') {
    return (
      <>
        <div className="pointer-events-none absolute top-2.5 right-3 w-11 h-11 rounded-full bg-yellow-200/85 blur-[1px]" />
        <div className="pointer-events-none absolute top-3 left-3 w-14 h-5 rounded-full bg-white/80 blur-[1px]" />
        <div className="pointer-events-none absolute top-6 left-12 w-10 h-4 rounded-full bg-white/70 blur-[1px]" />
        <div
          className={`pointer-events-none absolute -bottom-6 -left-8 w-[140%] h-20 rounded-[100%] bg-gradient-to-t ${hillGradient} opacity-90`}
        />
      </>
    );
  }

  if (kind === 'kitchen') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <circle cx="120" cy="84" r="68" fill="#ffffff" opacity="0.58" />
        <rect x="0" y="128" width="240" height="52" fill="#fed7aa" opacity="0.75" />
        <line x1="0" y1="128" x2="240" y2="128" stroke="#fb923c" strokeWidth="3" opacity="0.5" />
      </svg>
    );
  }

  if (kind === 'music') {
    return (
      <svg
        viewBox="0 0 240 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <polygon points="30,0 90,0 135,180 0,180" fill="#fde047" opacity="0.14" />
        <polygon points="150,0 210,0 240,180 105,180" fill="#f472b6" opacity="0.18" />
        <circle cx="120" cy="82" r="56" fill="#ffffff" opacity="0.16" />
        <path
          d="M12 122 Q60 102 120 122 T228 118"
          stroke="#fde047"
          strokeWidth="3"
          fill="none"
          opacity="0.5"
        />
      </svg>
    );
  }

  if (kind === 'color' && swatchHex) {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(255,255,255,0.65) 0%, ${swatchHex}44 62%, ${swatchHex}88 100%)`,
        }}
      />
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/50 blur-md" />
      <div className="pointer-events-none absolute -bottom-8 -left-6 w-32 h-20 rounded-full bg-white/40 blur-md" />
    </>
  );
};

export interface SolveTelemetryPayload {
  pointer?: PointerTelemetrySnapshot | null;
  answeredBeforeAudioEnd: boolean;
  audioReplayCount: number;
  isCountingPuzzle: boolean;
  puzzleId?: string;
  difficultyTier?: number;
}

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
    chcSecondary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs',
    telemetry?: SolveTelemetryPayload
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
    playIconClass: 'text-[#db2777]',
  },
  {
    cardClass: 'toy-candy-yellow',
    ribbonClass: 'from-[#fbbf24] via-[#f59e0b] to-[#d97706]',
    subtextClass: 'text-amber-950',
    playIconClass: 'text-[#b45309]',
  },
  {
    cardClass: 'toy-candy-cyan',
    ribbonClass: 'from-[#38bdf8] via-[#0284c7] to-[#1d4ed8]',
    subtextClass: 'text-sky-50',
    playIconClass: 'text-[#1d4ed8]',
  },
  {
    cardClass: 'toy-candy-lime',
    ribbonClass: 'from-[#4ade80] via-[#16a34a] to-[#15803d]',
    subtextClass: 'text-emerald-50',
    playIconClass: 'text-[#15803d]',
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
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageInfo.years, childProfile?.name, childGender),
    [ageInfo.years, childProfile?.name, childGender]
  );
  // Limit calling child by name strictly to milestone levels (Level 1, 10, 20, 30...)
  const allowNameThisLevel = shouldCallChildByName(currentLevel);

  const availableSubjects = useMemo(() => {
    return SUBJECT_CHOICES.filter((subj) => {
      if (ageInfo.years <= 3 && (subj.id === 'letters' || subj.id === 'english')) {
        return false;
      }
      return true;
    }).map((subj) => {
      if (subj.id === 'numbers' && ageInfo.years <= 2) {
        return { ...subj, label: 'Conta 1–3' };
      }
      if (subj.id === 'numbers' && ageInfo.years === 3) {
        return { ...subj, label: 'Conta 1–5' };
      }
      return subj;
    });
  }, [ageInfo.years]);

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
  const [isAnimalPlaying, setIsAnimalPlaying] = useState<boolean>(
    soundManager.isAnimalSoundPlaying
  );

  const countFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFinishingCountRef = useRef<boolean>(false);
  const hasCommittedSolveRef = useRef<boolean>(false);
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const levelStartMsRef = useRef<number>(Date.now());
  const solveElapsedMsRef = useRef<number>(4800);

  // Silent 100% local interaction telemetry refs (never shown on child UI)
  const questionAudioFinishedRef = useRef<boolean>(false);
  const answeredBeforeAudioEndRef = useRef<boolean>(false);
  const audioReplayCountRef = useRef<number>(0);
  const pointerDownMetaRef = useRef<{
    downMs: number;
    downX: number;
    downY: number;
    pointerType: string;
    touchAreaPx2: number;
    centerOffsetRatio: number;
  } | null>(null);
  const lastPointerSnapshotRef = useRef<PointerTelemetrySnapshot | null>(null);

  const clearReplayTimers = useCallback(() => {
    replayTimersRef.current.forEach((t) => clearTimeout(t));
    replayTimersRef.current = [];
  }, []);

  useEffect(() => {
    soundManager.startBackgroundMusic();
    const unsubMusic = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    const unsubAnimal = soundManager.onAnimalSoundChange((playing) =>
      setIsAnimalPlaying(playing)
    );
    return () => {
      unsubMusic();
      unsubAnimal();
      clearReplayTimers();
      soundManager.stopAnimalSound();
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
    soundManager.stopAnimalSound();
    soundManager.stopRhythmSequence();
    isFinishingCountRef.current = false;
    hasCommittedSolveRef.current = false;
    levelStartMsRef.current = Date.now();
    solveElapsedMsRef.current = 4800;
    questionAudioFinishedRef.current = !soundManager.voiceEnabled;
    answeredBeforeAudioEndRef.current = false;
    audioReplayCountRef.current = 0;
    pointerDownMetaRef.current = null;
    lastPointerSnapshotRef.current = null;

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

    if (nextPuzzle.animalSoundId) {
      soundManager.prewarmAnimalSound(nextPuzzle.animalSoundId);
    }

    let cancelled = false;
    let rhythmDelayTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (nextPuzzle.animalSoundId) {
        soundManager.playAnimalSound(nextPuzzle.animalSoundId, {
          includeVocalImitation: false,
          stopSpeechFirst: true,
          onEnd: () => {
            if (cancelled) return;
            soundManager.speakInstruction(nextPuzzle.speechText, () => {
              questionAudioFinishedRef.current = true;
            });
          },
        });
      } else {
        soundManager.speakInstruction(nextPuzzle.speechText, () => {
          questionAudioFinishedRef.current = true;
        });
      }
      if (nextPuzzle.rhythmNotes && nextPuzzle.rhythmNotes.length > 0) {
        rhythmDelayTimer = setTimeout(() => {
          if (!cancelled) {
            soundManager.playRhythmSequence(nextPuzzle.rhythmNotes!);
          }
        }, 1200);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (rhythmDelayTimer) clearTimeout(rhythmDelayTimer);
      clearReplayTimers();
      soundManager.stopAnimalSound();
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
    soundManager.voiceEnabled = true;
    soundManager.unlockAudio();
    soundManager.playPop();
    // Never penalize non-readers in hintsUsed for re-listening to the spoken question!
    audioReplayCountRef.current += 1;
    if (puzzle.animalSoundId) {
      soundManager.playAnimalSound(puzzle.animalSoundId, {
        includeVocalImitation: false,
        stopSpeechFirst: true,
        onEnd: () => {
          soundManager.speakInstruction(puzzle.speechText, () => {
            questionAudioFinishedRef.current = true;
          });
        },
      });
    } else {
      soundManager.speakInstruction(puzzle.speechText, () => {
        questionAudioFinishedRef.current = true;
      });
    }
    if (puzzle.rhythmNotes && puzzle.rhythmNotes.length > 0) {
      setTimeout(() => handleReplayRhythm(), 1000);
    }
  }, [puzzle, handleReplayRhythm]);

  const handleSpeakOptionCard = useCallback(
    (e: React.MouseEvent, option: PuzzleOption) => {
      e.stopPropagation();
      soundManager.voiceEnabled = true;
      soundManager.unlockAudio();
      audioReplayCountRef.current += 1;
      if (option.noteFreq) {
        soundManager.playMusicalNote(option.noteFreq, 0.36);
      } else {
        soundManager.playPop();
      }
      const cleanLabel = option.label
        .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanLabel) {
        // Keep the single consistent male voice (never fall back to preferInstant female voice)
        soundManager.speak(cleanLabel, { context: 'general' });
      }
    },
    []
  );

  const handleOptionPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const maxRadius = Math.max(1, Math.hypot(rect.width / 2, rect.height / 2));
      const centerOffsetRatio = Math.min(1, Math.hypot(dx, dy) / maxRadius);
      const touchW = typeof e.width === 'number' && e.width > 0 ? e.width : 0;
      const touchH = typeof e.height === 'number' && e.height > 0 ? e.height : 0;
      pointerDownMetaRef.current = {
        downMs: Date.now(),
        downX: e.clientX,
        downY: e.clientY,
        pointerType: e.pointerType || 'touch',
        touchAreaPx2: Math.round(touchW * touchH),
        centerOffsetRatio,
      };
    },
    []
  );

  const handleOptionPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const meta = pointerDownMetaRef.current;
      if (!meta) return;
      const pressDurationMs = Math.max(10, Date.now() - meta.downMs);
      const pointerMovePx = Math.hypot(
        e.clientX - meta.downX,
        e.clientY - meta.downY
      );
      lastPointerSnapshotRef.current = {
        pointerType: meta.pointerType,
        touchAreaPx2: meta.touchAreaPx2,
        centerOffsetRatio: meta.centerOffsetRatio,
        pressDurationMs,
        pointerMovePx,
      };
      pointerDownMetaRef.current = null;
    },
    []
  );

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
      answeredBeforeAudioEndRef.current = !questionAudioFinishedRef.current;
      setAttempts(1);
      countFinishTimerRef.current = setTimeout(() => {
        setIsSolved(true);
        soundManager.playFanfare();
        confetti.burst();
        const praise = getEncouragementPhrase(true, childProfile, allowNameThisLevel);
        soundManager.speakPraise(`${formatted.speech}! ${praise} ${puzzle.funExplanation}`);
      }, 420);
    } else {
      soundManager.speak(formatted.speech, { context: 'count' });
    }
  };

  const handleSelectOption = (opt: PuzzleOption) => {
    if (isSolved || wrongOptionIds.includes(opt.id)) return;

    const elapsed = Math.max(450, Date.now() - levelStartMsRef.current);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSelectedOptionId(opt.id);

    if (opt.noteFreq) {
      soundManager.playMusicalNote(opt.noteFreq, 0.36);
    }

    if (opt.isCorrect) {
      solveElapsedMsRef.current = elapsed;
      answeredBeforeAudioEndRef.current = !questionAudioFinishedRef.current;
      setIsSolved(true);
      soundManager.stopAnimalSound();
      soundManager.playFanfare();
      confetti.burst();
      const praise = getEncouragementPhrase(true, childProfile, allowNameThisLevel);
      soundManager.speakPraise(`${praise} ${puzzle.funExplanation}`);
    } else {
      soundManager.playEncouragement();
      setWrongOptionIds((prev) => [...prev, opt.id]);
      const retryPhrase = getEncouragementPhrase(false, childProfile, allowNameThisLevel);
      if (puzzle.animalSoundId) {
        const animalIdToReplay = puzzle.animalSoundId;
        soundManager.speak(retryPhrase, {
          context: 'instruction',
          onEnd: () => {
            soundManager.playAnimalSound(animalIdToReplay, {
              includeVocalImitation: false,
              stopSpeechFirst: false,
            });
          },
        });
      } else {
        soundManager.speak(retryPhrase, { context: 'instruction' });
      }
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
    const isCountPuzzle =
      puzzle.type === 'count_interactive' && Boolean(puzzle.targetCount);
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
      puzzle.chcSecondary,
      {
        puzzleId: puzzle.id,
        difficultyTier: puzzle.difficultyTier,
        pointer: lastPointerSnapshotRef.current,
        answeredBeforeAudioEnd: answeredBeforeAudioEndRef.current,
        audioReplayCount: audioReplayCountRef.current,
        isCountingPuzzle: isCountPuzzle,
      }
    );
  }, [attempts, hintsUsed, onSolveLevel, puzzle]);

  const handleNextLevel = (nextSubject?: GameCategory | null) => {
    soundManager.stopAnimalSound();
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
    const hintText = allowNameThisLevel
      ? `Ecco un piccolo aiuto, ${childName}: ho tolto una carta che non serve. Guarda bene quelle rimaste!`
      : 'Ecco un piccolo aiuto: ho tolto una carta che non serve. Guarda bene quelle rimaste!';
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

  return (
    <div
      className={`safe-viewport-pad relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${
        ageTheme.isMatureTheme ? 'bg-slate-950 text-slate-100' : 'bg-sky-300'
      }`}
    >
      {/* ===================================================================== */}
      {/* AGE-ADAPTIVE WORLD BACKDROP (STORYBOOK 2-8, SOBER MINIMAL 9-14)       */}
      {/* ===================================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {!ageTheme.isMatureTheme ? (
          <>
            <img
              src={arenaMeadowBackdrop}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01] transition-all duration-500"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  ageTheme.stageId === 'primary_explorer'
                    ? 'linear-gradient(180deg, rgba(248, 250, 252, 0.28) 0%, rgba(255, 255, 255, 0.14) 50%, rgba(15, 23, 42, 0.22) 100%)'
                    : 'linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(22, 101, 52, 0.14) 100%)',
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  ageTheme.stageId === 'teen_nextgen'
                    ? 'linear-gradient(180deg, #090d16 0%, #0d1320 55%, #090d16 100%)'
                    : 'linear-gradient(180deg, #0f172a 0%, #172033 55%, #0f172a 100%)',
              }}
            />
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[min(780px,95vw)] h-[240px] rounded-full blur-3xl opacity-20"
              style={{ background: ageTheme.genderPalette.accentHex }}
            />
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ALIGNED TOP NAVIGATION BAR (ZERO OVERLAP ON ALL SCREENS)              */}
      {/* ===================================================================== */}
      <header className="landscape-header-compact ui-aligned-header app-shell-container relative z-10 flex items-center justify-between px-2.5 sm:px-5 lg:px-8 pt-1.5 sm:pt-3 pb-1 shrink-0 gap-1.5 sm:gap-2.5">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.stopRhythmSequence();
            soundManager.playPop();
            onExitToTitle();
          }}
          aria-label="Torna alla Home"
          className={`glossy-bubble-btn px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 min-w-[38px] min-h-[38px] sm:min-h-[42px] ${
            ageTheme.isMatureTheme
              ? 'bg-slate-900/90 text-slate-100 border-white/15 hover:bg-slate-800'
              : 'bg-gradient-to-b from-white to-slate-100 text-slate-900 border-2 border-white'
          }`}
        >
          <Home
            className={`w-4 h-4 shrink-0 ${ageTheme.genderPalette.accentTextClass}`}
          />
          <span
            className={`hidden min-[370px]:inline font-fun font-extrabold text-xs sm:text-sm whitespace-nowrap ${
              ageTheme.isMatureTheme ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Home
          </span>
        </button>

        {/* Center Glossy 3D Level Capsule — crisp & never clips stars on narrow Android/iOS/Foldable screens */}
        <div
          className={`glossy-bubble-btn bg-gradient-to-b ${theme.badgeGradient} px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-white/80 flex items-center gap-1 sm:gap-2 min-w-0 flex-1 sm:flex-initial justify-center overflow-hidden`}
        >
          <span className="text-sm sm:text-xl shrink-0 drop-shadow-xs hidden min-[340px]:inline">{theme.emoji}</span>
          <div className="text-left leading-[1.12] min-w-0 flex-1 sm:flex-initial">
            <p className="text-[9.5px] sm:text-xs font-bold text-white/95 leading-tight truncate">
              {puzzle.subjectLabel || theme.title}
            </p>
            <p className="font-fun font-extrabold text-[10.5px] min-[390px]:text-[11px] sm:text-sm text-white whitespace-nowrap tabular-nums flex items-center gap-0.5 sm:gap-1">
              <span className="min-[400px]:hidden">Liv. {currentLevel}</span>
              <span className="hidden min-[400px]:inline">Livello {currentLevel}</span>
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300 inline shrink-0" />
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
            className={`glossy-bubble-btn w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-auto sm:h-10 sm:px-3 rounded-full border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              isSubjectPickerOpen || preferredCategory
                ? 'bg-gradient-to-b from-emerald-400 to-green-600 text-white border-emerald-100'
                : 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-white/90'
            }`}
          >
            <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] shrink-0" />
            <span className="font-fun font-bold text-xs hidden lg:inline whitespace-nowrap">
              {preferredCategory
                ? availableSubjects.find((c) => c.id === preferredCategory)?.label || 'Materie'
                : 'Materie'}
            </span>
          </button>

          <button
            onClick={() => {
              const next = soundManager.toggleMusic();
              setMusicOn(next);
            }}
            title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            className={`glossy-bubble-btn w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center cursor-pointer ${
              musicOn
                ? 'bg-gradient-to-b from-fuchsia-400 to-purple-600 text-white border-white/90'
                : 'bg-gradient-to-b from-white to-slate-100 text-slate-600 border-white'
            }`}
          >
            {musicOn ? (
              <Music className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 stroke-[2.6]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 stroke-[2.6]" />
            )}
          </button>

          <button
            onClick={handleReplayVoice}
            className="glossy-bubble-btn w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-auto sm:h-10 sm:px-3.5 rounded-full border-2 border-amber-100 bg-gradient-to-b from-amber-300 via-orange-400 to-orange-600 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Riascolta la domanda"
          >
            <Volume2 className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 stroke-[2.6] shrink-0" />
            <span className="font-fun font-extrabold text-xs hidden sm:inline whitespace-nowrap">
              Ascolta
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              onOpenParents();
            }}
            className="glossy-bubble-btn w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gradient-to-b from-white to-sky-100 text-blue-700 flex items-center justify-center cursor-pointer"
            title="Area Genitori & Profilo CHC"
          >
            <ShieldCheck className="w-4 h-4 min-[380px]:w-4.5 min-[380px]:h-4.5 text-blue-700 stroke-[2.4]" />
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
                {allowNameThisLevel
                  ? `🧭 Cosa vuoi esplorare adesso, ${childName}?`
                  : '🧭 Cosa vuoi esplorare adesso?'}
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
              {availableSubjects.map((subj) => {
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
                <span>
                  {ageTheme.showAnimalMascotGuides
                    ? puzzle.animalGuide.name
                    : `${ageTheme.guideRolePrefix} · ${ageTheme.stageBadge}`}
                </span>
              </span>

              {puzzle.difficultyLabel && (
                <>
                  <span className="text-amber-700/40" aria-hidden="true">|</span>
                  <span
                    className={
                      puzzle.adaptiveStatus === 'downgrade'
                        ? 'text-sky-700 font-extrabold'
                        : puzzle.isMasteryUnlocked
                        ? 'text-amber-700 font-extrabold'
                        : 'text-emerald-700 font-extrabold'
                    }
                  >
                    {puzzle.adaptiveStatus === 'downgrade'
                      ? `🤝 ${puzzle.difficultyLabel}`
                      : puzzle.isMasteryUnlocked
                      ? `★ ${puzzle.difficultyLabel}`
                      : puzzle.difficultyLabel}
                  </span>
                </>
              )}
            </div>

            {puzzle.iqParameterTag && (
              <p className="relative z-10 text-[11px] sm:text-xs font-extrabold text-indigo-700 mb-1.5 leading-snug">
                {puzzle.iqParameterTag}
              </p>
            )}

            {/* Main Question Text */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2 w-full max-w-2xl">
              <h2 className="font-fun font-extrabold text-base sm:text-2xl lg:text-[26px] text-slate-900 leading-snug w-full text-center">
                {puzzle.prompt}
              </h2>

              {puzzle.animalSoundId && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.unlockAudio();
                    audioReplayCountRef.current += 1;
                    soundManager.playAnimalSound(puzzle.animalSoundId!, {
                      includeVocalImitation: true,
                      stopSpeechFirst: true,
                    });
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 text-amber-950 border-2 border-white shadow-[0_4px_0_#b45309] active:translate-y-0.5 font-kids font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                    isAnimalPlaying ? 'ring-4 ring-emerald-300 scale-105 brightness-105' : ''
                  }`}
                >
                  <Volume2
                    className={`w-4 h-4 stroke-[2.6] shrink-0 ${
                      isAnimalPlaying ? 'animate-bounce' : ''
                    }`}
                  />
                  <span>{isAnimalPlaying ? 'Ascolta il Verso...' : 'Ascolta il Verso!'}</span>
                </button>
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
                      className={`min-w-10 h-10 sm:min-w-14 sm:h-14 px-2 sm:px-2.5 rounded-2xl flex items-center justify-center border-2 ${
                        isMystery
                          ? 'bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 border-white text-amber-950 font-kids font-bold text-lg sm:text-2xl shadow-[0_4px_0_#b45309] animate-gentle-bounce'
                          : 'orb-3d-pedestal text-slate-900 font-kids font-extrabold text-xl sm:text-3xl lg:text-4xl animate-float-3d'
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
          {/* FULL-BLEED HABITAT & GIANT ICON CHOICE BUTTONS FOR NON-READERS    */}
          {/* ================================================================= */}
          {optionsList.length > 0 && (
            <div
              className={`options-grid-responsive grid items-stretch ${
                optionsList.length === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2'
              } gap-2.5 sm:gap-3.5 w-full shrink-0`}
            >
              {optionsList.map((option, idx) => {
                const isWrong = wrongOptionIds.includes(option.id);
                const isChosenCorrect =
                  isSolved && selectedOptionId === option.id && option.isCorrect;
                const showSublabel = Boolean(
                  option.sublabel && (isWrong || isChosenCorrect || isSolved)
                );
                const cardTheme =
                  CANDY_CARD_THEMES[idx % CANDY_CARD_THEMES.length];
                const visualScene = resolveOptionArtwork(option, puzzle.category);
                const isLastOfThree = optionsList.length === 3 && idx === 2;
                const emojiText = (option.emoji || '⭐').trim();
                const isPlainSymbolTile = /^[A-Za-z0-9√πφ×÷±=+\-?!]{1,3}$/.test(
                  emojiText
                );
                // Detect multi-symbol / repeated-emoji groups (e.g. "🍎🍎🍎🍎") so they scale cleanly without clipping
                const emojiGlyphCount = Array.from(emojiText.replace(/\uFE0F|\u200D/g, '')).length;
                const isMultiEmojiGroup = !isPlainSymbolTile && emojiGlyphCount > 2;

                const isFinalRemainingOption =
                  !isSolved &&
                  !isWrong &&
                  wrongOptionIds.length > 0 &&
                  optionsList.length - wrongOptionIds.length === 1;

                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={isSolved || isWrong ? -1 : 0}
                    aria-disabled={isSolved || isWrong}
                    onPointerDown={handleOptionPointerDown}
                    onPointerUp={handleOptionPointerUp}
                    onClick={() => {
                      if (!isSolved && !isWrong) handleSelectOption(option);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isSolved && !isWrong) {
                        e.preventDefault();
                        handleSelectOption(option);
                      }
                    }}
                    className={`toy-card-3d group relative rounded-[26px] p-1.5 flex flex-col transition-all cursor-pointer ${
                      cardTheme.cardClass
                    } ${
                      isLastOfThree
                        ? 'option-last-of-three col-span-2 sm:col-span-1 w-[72%] sm:w-full mx-auto'
                        : 'w-full'
                    } ${
                      isWrong
                        ? 'opacity-45 grayscale scale-96 cursor-not-allowed pointer-events-none'
                        : isChosenCorrect
                        ? 'ring-4 ring-emerald-300 scale-[1.02] shadow-xl'
                        : isFinalRemainingOption
                        ? 'ring-4 ring-amber-300/85 scale-[1.015] shadow-lg'
                        : 'hover:scale-[1.015] active:scale-[0.985]'
                    }`}
                  >
                    {/* FULL-BUTTON SCENIC HABITAT STAGE + OVERSIZED VISUAL ICON */}
                    <div
                      className={`option-card-stage relative w-full min-h-[146px] sm:min-h-[190px] lg:min-h-[208px] flex-1 rounded-[20px] overflow-hidden bg-gradient-to-b ${visualScene.skyGradient} flex flex-col items-center justify-center`}
                    >
                      {visualScene.imageSrc ? (
                        <img
                          src={visualScene.imageSrc}
                          alt={option.label}
                          referrerPolicy="no-referrer"
                          style={{ objectPosition: visualScene.imagePosition || 'center center' }}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <CardHabitatBackdrop
                            kind={visualScene.backdropKind}
                            hillGradient={visualScene.hillGradient}
                            swatchHex={visualScene.swatchHex}
                          />

                          {/* Giant Full-Button Icon (occupies the full visual button area for instant recognition by non-readers) */}
                          <div className="relative z-10 w-full flex-1 flex items-center justify-center px-2 pt-2 pb-9 sm:pb-11">
                            <span
                              className={`leading-none text-center select-none ${
                                isPlainSymbolTile
                                  ? `font-kids font-black text-[54px] sm:text-[78px] lg:text-[88px] ${
                                      visualScene.isDarkBackdrop
                                        ? 'text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
                                        : 'text-indigo-950 drop-shadow-[0_4px_0_rgba(255,255,255,0.85)]'
                                    }`
                                  : isMultiEmojiGroup
                                  ? 'text-[32px] sm:text-[44px] lg:text-[50px] tracking-tight break-words max-w-full drop-shadow-[0_6px_8px_rgba(15,23,42,0.28)]'
                                  : 'option-emoji-giant text-[72px] sm:text-[94px] lg:text-[106px] drop-shadow-[0_8px_10px_rgba(15,23,42,0.32)]'
                              } ${!isWrong ? 'animate-float-3d' : ''}`}
                            >
                              {emojiText}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Top-Right Tappable Audio Read-Aloud Speaker for Non-Readers */}
                      <button
                        type="button"
                        onClick={(e) => handleSpeakOptionCard(e, option)}
                        aria-label={`Ascolta opzione: ${option.label}`}
                        title="Tocca per ascoltare questa risposta"
                        className="absolute top-2 right-2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/92 hover:bg-white border-2 border-white shadow-[0_3px_10px_rgba(15,23,42,0.28)] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                      >
                        <Volume2 className={`w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.6] ${cardTheme.playIconClass}`} />
                      </button>

                      {/* Correct Selection Checkmark */}
                      {isChosenCorrect && (
                        <div className="absolute top-2 left-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg z-20 animate-pop-in">
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        </div>
                      )}

                      {/* Compact High-Contrast Bottom Scrim Caption (never steals space from the full-bleed icon) */}
                      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/65 to-transparent px-2.5 sm:px-3 pt-5 pb-2 sm:pb-2.5 text-center">
                        <span className="font-kids font-bold text-[13.5px] sm:text-[17px] text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.65)] block leading-tight break-words">
                          {option.label}
                        </span>
                        {showSublabel && (
                          <span className="font-semibold text-[10.5px] sm:text-xs text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] block leading-tight mt-0.5 break-words animate-pop-in">
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
        <div className="safe-modal-overlay fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start sm:items-center justify-center overflow-y-auto">
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
                  {allowNameThisLevel
                    ? `${getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico')} ${childName}! 🎉`
                    : `${getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico')}! 🎉`}
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
                    {availableSubjects.map((subj) => {
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
