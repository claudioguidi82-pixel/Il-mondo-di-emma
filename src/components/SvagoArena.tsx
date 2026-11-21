import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Gamepad2,
  Star,
  Music,
  VolumeX,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { ChildProfile } from '../types/game';
import { getDisplayChildName, getGenderedWord } from '../utils/childProfile';

interface SvagoArenaProps {
  levelNumber: number;
  childProfile?: ChildProfile;
  onComplete: (mode: 'tris' | 'bubbles' | 'memory' | 'stars', wonTris: boolean) => void;
  onExitToTitle: () => void;
}

type SvagoGameMode = 'tris' | 'bubbles' | 'memory' | 'stars';
type CellValue = 'PLAYER' | 'ORSETTO' | null;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

interface Bubble3DItem {
  id: number;
  emoji: string;
  color: string;
  size: number;
  left: number;
  top: number;
  popped: boolean;
}

interface MemoryCard3D {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

interface FallingStar3D {
  id: number;
  emoji: string;
  left: number;
  top: number;
  caught: boolean;
}

const BUBBLE_PALETTE = [
  'from-pink-300/95 via-rose-400/85 to-fuchsia-600/90 border-white',
  'from-cyan-200/95 via-sky-400/85 to-blue-600/90 border-white',
  'from-amber-200/95 via-yellow-400/85 to-orange-500/90 border-white',
  'from-emerald-200/95 via-teal-400/85 to-green-600/90 border-white',
  'from-violet-200/95 via-purple-400/85 to-indigo-600/90 border-white',
];

const BUBBLE_EMOJIS = ['🦄', '🦋', '🍓', '👑', '🌈', '🐬', '🍭', '⭐', '🎀', '🐶'];
const MEMORY_EMOJIS = ['🦄', '🍓', '👑', '🦋'];

export const SvagoArena: React.FC<SvagoArenaProps> = ({
  levelNumber,
  childProfile,
  onComplete,
  onExitToTitle,
}) => {
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const bravoWord = getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico');
  const championWord = getGenderedWord(childGender, 'campionessa', 'campione', 'campione');
  const championTitle = getGenderedWord(
    childGender,
    'Super Campionessa!',
    'Super Campione!',
    'Super Stella!'
  );

  const initialMode: SvagoGameMode =
    levelNumber % 40 === 0
      ? 'stars'
      : levelNumber % 30 === 0
      ? 'memory'
      : levelNumber % 20 === 0
      ? 'bubbles'
      : 'tris';

  const [gameMode, setGameMode] = useState<SvagoGameMode>(initialMode);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);

  // --- TRIS 3D STATE ---
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [trisWinner, setTrisWinner] = useState<'PLAYER' | 'ORSETTO' | 'DRAW' | null>(
    null
  );
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // --- BUBBLES 3D STATE ---
  const [bubbles, setBubbles] = useState<Bubble3DItem[]>([]);
  const [bubblesPopped, setBubblesPopped] = useState(0);
  const BUBBLE_TARGET = 10;

  // --- MEMORY 3D STATE ---
  const [memoryCards, setMemoryCards] = useState<MemoryCard3D[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryComplete, setMemoryComplete] = useState(false);

  // --- FALLING STARS 3D STATE ---
  const [starsList, setStarsList] = useState<FallingStar3D[]>([]);
  const [starsCaught, setStarsCaught] = useState(0);
  const STARS_TARGET = 8;

  const poppedIdsRef = useRef<Set<number>>(new Set());
  const caughtIdsRef = useRef<Set<number>>(new Set());
  const memoryTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearMemoryTimers = useCallback(() => {
    memoryTimersRef.current.forEach((t) => clearTimeout(t));
    memoryTimersRef.current = [];
  }, []);

  useEffect(() => {
    soundManager.startBackgroundMusic();
    const unsub = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    return () => {
      unsub();
      clearMemoryTimers();
      soundManager.stopBackgroundMusic();
      soundManager.stopSpeech();
    };
  }, [clearMemoryTimers]);

  const initBubblesGame = useCallback(() => {
    poppedIdsRef.current.clear();
    const generated: Bubble3DItem[] = Array.from({ length: BUBBLE_TARGET }).map(
      (_, idx) => ({
        id: idx,
        emoji: BUBBLE_EMOJIS[idx % BUBBLE_EMOJIS.length],
        color: BUBBLE_PALETTE[idx % BUBBLE_PALETTE.length],
        size: idx % 2 === 0 ? 68 : 62,
        left: 18 + (idx % 3) * 30 + ((idx * 5) % 7) - 3,
        top: 18 + Math.floor(idx / 3) * 21 + ((idx * 3) % 5) - 2,
        popped: false,
      })
    );
    setBubbles(generated);
    setBubblesPopped(0);
  }, []);

  const initMemoryGame = useCallback(() => {
    clearMemoryTimers();
    const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
    const shuffled = pairs
      .map((emoji, idx) => ({
        id: idx,
        emoji,
        sortKey: ((idx * 37 + levelNumber * 13) % 100) + Math.random(),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item, index) => ({
        id: index,
        emoji: item.emoji,
        flipped: false,
        matched: false,
      }));
    setMemoryCards(shuffled);
    setFlippedIndices([]);
    setMemoryComplete(false);
  }, [levelNumber, clearMemoryTimers]);

  const initStarsGame = useCallback(() => {
    caughtIdsRef.current.clear();
    const generated: FallingStar3D[] = Array.from({ length: STARS_TARGET }).map(
      (_, idx) => ({
        id: idx,
        emoji: ['⭐', '🌟', '💖', '👑', '🦄', '🌈', '✨', '🎈'][idx % 8],
        left: 16 + (idx % 4) * 22 + ((idx * 3) % 5) - 2,
        top: 26 + Math.floor(idx / 4) * 44 + ((idx * 5) % 8) - 4,
        caught: false,
      })
    );
    setStarsList(generated);
    setStarsCaught(0);
  }, []);

  const resetTris = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setTrisWinner(null);
    setWinningLine(null);
  }, []);

  useEffect(() => {
    soundManager.speakPraise(
      `Evviva ${childName}! Livello ${levelNumber}: sei nel Parco Giochi Arcobaleno! Scegli il tuo gioco preferito!`
    );
    initBubblesGame();
    initMemoryGame();
    initStarsGame();
  }, [levelNumber, childName, initBubblesGame, initMemoryGame, initStarsGame]);

  const checkTrisWinner = useCallback((currentBoard: CellValue[]) => {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return { winner: currentBoard[a], line };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'DRAW' as const, line: null };
    }
    return null;
  }, []);

  // Friendly Orsetto AI move
  useEffect(() => {
    if (gameMode !== 'tris' || isPlayerTurn || trisWinner) return;

    const timer = setTimeout(() => {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return;

      const chosenIdx =
        emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

      const nextBoard = [...board];
      nextBoard[chosenIdx] = 'ORSETTO';
      soundManager.playPop();
      setBoard(nextBoard);

      const result = checkTrisWinner(nextBoard);
      if (result) {
        setTrisWinner(result.winner);
        setWinningLine(result.line);
        if (result.winner === 'ORSETTO') {
          soundManager.speak(
            `Ha vinto Orsetto! Riproviamo subito ${childName}, fai vedere chi è ${getGenderedWord(childGender, 'la', 'il', 'il')} ${championWord}!`
          );
        } else if (result.winner === 'DRAW') {
          soundManager.playSuccess();
          soundManager.speak("Pareggio! Giochiamo un'altra partita!");
        }
      } else {
        setIsPlayerTurn(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [board, isPlayerTurn, trisWinner, checkTrisWinner, gameMode, childName, childGender, championWord]);

  const handleTrisCellClick = (idx: number) => {
    if (!isPlayerTurn || board[idx] !== null || trisWinner) return;

    soundManager.playTwinkle();
    const nextBoard = [...board];
    nextBoard[idx] = 'PLAYER';
    setBoard(nextBoard);

    const result = checkTrisWinner(nextBoard);
    if (result) {
      setTrisWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'PLAYER') {
        soundManager.playFanfare();
        confetti.burst();
        soundManager.speakPraise(
          `Tris! ${bravoWord} ${childName}! Hai vinto tre stelline d'oro!`
        );
      } else if (result.winner === 'DRAW') {
        soundManager.playSuccess();
        soundManager.speak('Pareggio! Riprova o passa al prossimo livello!');
      }
    } else {
      setIsPlayerTurn(false);
    }
  };

  const handlePopBubble = (id: number) => {
    if (poppedIdsRef.current.has(id)) return;
    poppedIdsRef.current.add(id);

    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    soundManager.playTwinkle();
    const nextCount = poppedIdsRef.current.size;
    setBubblesPopped(nextCount);
    if (nextCount >= BUBBLE_TARGET) {
      soundManager.playFanfare();
      confetti.burst();
      soundManager.speakPraise(
        `Fantastico ${childName}! Hai scoppiato tutte le bolle magiche!`
      );
    }
  };

  const handleMemoryCardClick = (index: number) => {
    if (
      flippedIndices.length >= 2 ||
      memoryCards[index]?.flipped ||
      memoryCards[index]?.matched
    ) {
      return;
    }

    soundManager.playPop();
    const updated = memoryCards.map((c, idx) =>
      idx === index ? { ...c, flipped: true } : c
    );
    setMemoryCards(updated);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstIdx, secondIdx] = nextFlipped;
      if (updated[firstIdx].emoji === updated[secondIdx].emoji) {
        const matchTimer = setTimeout(() => {
          soundManager.playTwinkle();
          setMemoryCards((prev) => {
            const matchedCards = prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, matched: true }
                : c
            );
            if (matchedCards.every((c) => c.matched)) {
              setMemoryComplete(true);
              soundManager.playFanfare();
              confetti.burst();
              soundManager.speakPraise(
                `Super Memoria ${childName}! Hai trovato tutte le coppie 3D!`
              );
            }
            return matchedCards;
          });
          setFlippedIndices([]);
        }, 350);
        memoryTimersRef.current.push(matchTimer);
      } else {
        const flipBackTimer = setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, flipped: false }
                : c
            )
          );
          setFlippedIndices([]);
        }, 750);
        memoryTimersRef.current.push(flipBackTimer);
      }
    }
  };

  const handleCatchStar = (id: number) => {
    if (caughtIdsRef.current.has(id)) return;
    caughtIdsRef.current.add(id);

    setStarsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, caught: true } : s))
    );
    soundManager.playTwinkle();
    const nextCaught = caughtIdsRef.current.size;
    setStarsCaught(nextCaught);
    if (nextCaught >= STARS_TARGET) {
      soundManager.playFanfare();
      confetti.burst();
      soundManager.speakPraise(
        `${bravoWord} ${childName}! Hai preso tutti i tesori magici 3D!`
      );
    }
  };

  const isCurrentGameWon =
    (gameMode === 'tris' && (trisWinner === 'PLAYER' || trisWinner === 'DRAW')) ||
    (gameMode === 'bubbles' && bubblesPopped >= BUBBLE_TARGET) ||
    (gameMode === 'memory' && memoryComplete) ||
    (gameMode === 'stars' && starsCaught >= STARS_TARGET);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#e0e7ff] via-[#f0f9ff] to-[#fef3c7] select-none">
      {/* MODERN LUMINOUS PARK BACKDROP */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-amber-200/80 via-yellow-300/60 to-orange-300/40 blur-xs border border-white/60 flex items-center justify-center animate-float-3d">
          <span className="text-4xl">🌞</span>
        </div>

        <svg
          viewBox="0 0 600 220"
          className="w-[115%] max-w-none -left-[7%] top-6 absolute opacity-35"
          fill="none"
        >
          <path
            d="M 20 210 Q 300 -30 580 210"
            stroke="#fb7185"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 32 215 Q 300 -12 568 215"
            stroke="#fbbf24"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 44 220 Q 300 6 556 220"
            stroke="#34d399"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 56 225 Q 300 24 544 225"
            stroke="#38bdf8"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute top-12 left-4 w-28 h-10 bg-white/75 backdrop-blur-xs rounded-full shadow-sm animate-cloud-drift" />
        <div
          className="absolute top-20 right-14 w-24 h-9 bg-white/70 backdrop-blur-xs rounded-full shadow-sm animate-cloud-drift"
          style={{ animationDelay: '1.3s' }}
        />

        <div className="absolute -bottom-12 -left-16 w-[75%] h-26 rounded-[100%] bg-gradient-to-t from-emerald-500/35 via-teal-400/25 to-transparent" />
        <div className="absolute -bottom-14 -right-16 w-[75%] h-28 rounded-[100%] bg-gradient-to-t from-teal-500/35 via-emerald-400/25 to-transparent" />
      </div>

      {/* MODERN TOP BAR */}
      <header className="landscape-header-compact app-shell-container relative z-10 flex items-center justify-between px-2.5 sm:px-5 lg:px-8 pt-2.5 sm:pt-3.5 pb-1 shrink-0 gap-2">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.playPop();
            onExitToTitle();
          }}
          className="toy-button-3d bg-white/90 hover:bg-white text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-white/90 flex items-center gap-1.5 active:scale-95 cursor-pointer min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
          <span className="font-fun font-bold text-xs sm:text-sm whitespace-nowrap">Home</span>
        </button>

        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-1.5 rounded-2xl border border-indigo-200/80 shadow-md flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-white shrink-0" />
          <span className="font-fun font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
            Premio Livello {levelNumber} · Parco Giochi
          </span>
        </div>

        <button
          onClick={() => {
            const nextState = soundManager.toggleMusic();
            setMusicOn(nextState);
          }}
          className={`toy-button-3d p-2 sm:px-3.5 sm:py-2 rounded-2xl border flex items-center gap-1.5 active:scale-95 cursor-pointer min-h-[40px] ${
            musicOn
              ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 border-amber-200'
              : 'bg-white/90 text-slate-600 border-white/90'
          }`}
        >
          {musicOn ? (
            <Music className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <VolumeX className="w-4 h-4 stroke-[2.5]" />
          )}
          <span className="font-fun font-bold text-xs hidden sm:inline whitespace-nowrap">
            Musica
          </span>
        </button>
      </header>

      {/* MODERN 4 MINI-GAME SEGMENTED TABS */}
      <div className="app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 py-1.5 w-full shrink-0">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-white/85 backdrop-blur-xl p-1.5 rounded-2xl border border-white/95 shadow-sm max-w-3xl mx-auto">
          {[
            { id: 'tris', label: 'Tris', emoji: '👑' },
            { id: 'bubbles', label: 'Bolle', emoji: '🫧' },
            { id: 'memory', label: 'Memory', emoji: '🃏' },
            { id: 'stars', label: 'Tesori', emoji: '🌟' },
          ].map((tab) => {
            const active = gameMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playPop();
                  setGameMode(tab.id as SvagoGameMode);
                }}
                className={`py-2 px-2 rounded-xl font-fun font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span className="text-base sm:text-lg leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN 3D ARENA CONTENT */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col items-center justify-between px-2.5 sm:px-5 lg:px-8 py-1.5 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto">
        {/* MODE 1: 3D TRIS */}
        {gameMode === 'tris' && (
          <div className="svago-landscape-split w-full flex-1 flex flex-col items-center justify-around gap-2 my-auto min-h-0">
            <div className="w-full max-w-md board-3d-tabletop rounded-3xl p-2.5 flex items-center justify-between shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all ${
                  isPlayerTurn && !trisWinner
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-2 border-white scale-105 shadow-md'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-kids font-extrabold text-xs leading-tight">
                    {childName}
                  </p>
                  <p className="text-[10px] font-bold opacity-90">Turno Tuo</p>
                </div>
              </div>

              <div className="text-center px-2">
                <span className="font-kids font-extrabold text-xs uppercase tracking-wider text-pink-600">
                  {trisWinner === 'PLAYER'
                    ? '🎉 Vittoria!'
                    : trisWinner === 'ORSETTO'
                    ? '🧸 Orsetto!'
                    : trisWinner === 'DRAW'
                    ? '🤝 Pareggio!'
                    : isPlayerTurn
                    ? `Tocca a ${childName}!`
                    : 'Pensa Orsetto...'}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all ${
                  !isPlayerTurn && !trisWinner
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-2 border-white scale-105 shadow-md'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                <span className="text-2xl">🧸</span>
                <div>
                  <p className="font-kids font-extrabold text-xs leading-tight">
                    Orsetto
                  </p>
                  <p className="text-[10px] font-bold opacity-90">Amico 3D</p>
                </div>
              </div>
            </div>

            <div className="tris-board-responsive w-full max-w-[300px] sm:max-w-[330px] aspect-square grid grid-cols-3 gap-2 sm:gap-2.5 p-3 rounded-[28px] sm:rounded-[32px] board-3d-tabletop my-auto shrink-0">
              {board.map((cell, idx) => {
                const isWinningCell = winningLine?.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleTrisCellClick(idx)}
                    disabled={!!cell || !isPlayerTurn || !!trisWinner}
                    className={`tris-slot-3d rounded-2xl flex items-center justify-center transition-all p-1.5 cursor-pointer ${
                      isWinningCell
                        ? 'bg-gradient-to-b from-yellow-200 to-amber-400 border-white scale-105 shadow-[0_0_24px_rgba(250,204,21,0.9)]'
                        : cell === 'PLAYER'
                        ? 'bg-gradient-to-b from-pink-100 to-rose-200 border-pink-300'
                        : cell === 'ORSETTO'
                        ? 'bg-gradient-to-b from-cyan-100 to-sky-200 border-cyan-300'
                        : 'hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    {cell === 'PLAYER' && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-pink-400 to-rose-600 border-2 border-white shadow-md flex items-center justify-center text-2xl sm:text-3xl animate-pop-in">
                        👑
                      </div>
                    )}
                    {cell === 'ORSETTO' && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 border-2 border-white shadow-md flex items-center justify-center text-2xl sm:text-3xl animate-pop-in">
                        🧸
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: BOLLE 3D */}
        {gameMode === 'bubbles' && (
          <div className="w-full flex-1 flex flex-col justify-between my-1 min-h-0">
            <div className="bg-white/95 rounded-2xl px-4 py-2 border-2 border-white flex items-center justify-between mb-2 shrink-0 shadow-md">
              <span className="font-kids font-extrabold text-xs sm:text-sm text-pink-600">
                🫧 Scoppia tutte le Bolle 3D!
              </span>
              <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-kids font-extrabold text-xs shadow tabular-nums">
                {bubblesPopped} / {BUBBLE_TARGET}
              </span>
            </div>

            <div className="relative flex-1 min-h-[220px] sm:min-h-[260px] rounded-[28px] sm:rounded-[32px] board-3d-tabletop overflow-hidden">
              {bubbles.map((b) =>
                b.popped ? null : (
                  <button
                    key={b.id}
                    onClick={() => handlePopBubble(b.id)}
                    style={{
                      width: `${b.size}px`,
                      height: `${b.size}px`,
                      left: `${b.left}%`,
                      top: `${b.top}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${b.color} border-3 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_6px_12px_rgba(255,255,255,0.85)] flex items-center justify-center animate-float-3d active:scale-125 transition-transform cursor-pointer`}
                  >
                    <div className="absolute top-2 left-3 w-4 h-2.5 rounded-full bg-white/90 -rotate-25" />
                    <span className="text-3xl drop-shadow-md select-none">
                      {b.emoji}
                    </span>
                  </button>
                )
              )}

              {bubblesPopped >= BUBBLE_TARGET && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm p-4 text-center">
                  <span className="text-6xl mb-2 animate-bounce">🏆</span>
                  <h3 className="font-kids font-extrabold text-2xl text-pink-600">
                    Tutte Scoppiate! 🎉
                  </h3>
                  <p className="text-xs font-fun font-extrabold text-slate-700 mt-1">
                    Hai guadagnato +3 Stelline Magiche!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 3: MEMORY 3D */}
        {gameMode === 'memory' && (
          <div className="w-full flex-1 flex flex-col justify-between my-1 min-h-0">
            <div className="bg-white/95 rounded-2xl px-4 py-2 border-2 border-white flex items-center justify-between mb-2 shrink-0 shadow-md">
              <span className="font-kids font-extrabold text-xs sm:text-sm text-violet-700">
                🃏 Trova le Coppie Magiche 3D!
              </span>
              <button
                onClick={initMemoryGame}
                className="px-2.5 py-1 rounded-xl bg-pink-500 text-white font-kids font-extrabold text-[11px] flex items-center gap-1 shadow cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Mescola
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 my-auto p-3.5 rounded-[30px] board-3d-tabletop">
              {memoryCards.map((card, index) => {
                const isRevealed = card.flipped || card.matched;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleMemoryCardClick(index)}
                    className={`aspect-square rounded-2xl border-3 transition-all flex items-center justify-center p-1.5 cursor-pointer ${
                      card.matched
                        ? 'bg-gradient-to-b from-emerald-300 to-teal-500 border-white shadow-[0_5px_0_#0f766e] scale-105'
                        : isRevealed
                        ? 'bg-white border-amber-300 shadow-[0_5px_0_#d97706]'
                        : 'toy-candy-pink hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isRevealed ? (
                      <span className="text-3xl sm:text-4xl animate-pop-in">
                        {card.emoji}
                      </span>
                    ) : (
                      <span className="text-2xl sm:text-3xl drop-shadow">
                        🌟
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 4: STELLINE 3D */}
        {gameMode === 'stars' && (
          <div className="w-full flex-1 flex flex-col justify-between my-1 min-h-0">
            <div className="bg-white/95 rounded-2xl px-4 py-2 border-2 border-white flex items-center justify-between mb-2 shrink-0 shadow-md">
              <span className="font-kids font-extrabold text-xs sm:text-sm text-amber-600">
                🌟 Acchiappa i Tesori 3D!
              </span>
              <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-kids font-extrabold text-xs shadow tabular-nums">
                {starsCaught} / {STARS_TARGET}
              </span>
            </div>

            <div className="relative flex-1 min-h-[220px] sm:min-h-[260px] rounded-[28px] sm:rounded-[32px] board-3d-tabletop overflow-hidden">
              {starsList.map((st) =>
                st.caught ? null : (
                  <button
                    key={st.id}
                    onClick={() => handleCatchStar(st.id)}
                    style={{
                      left: `${st.left}%`,
                      top: `${st.top}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-400 border-3 border-white shadow-lg flex items-center justify-center text-3xl animate-float-3d active:scale-125 transition-transform cursor-pointer"
                  >
                    {st.emoji}
                  </button>
                )
              )}

              {starsCaught >= STARS_TARGET && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm p-4 text-center">
                  <span className="text-6xl mb-2 animate-bounce">👑</span>
                  <h3 className="font-kids font-extrabold text-2xl text-amber-600">
                    {championTitle} 🌟
                  </h3>
                  <p className="text-xs font-fun font-extrabold text-slate-700 mt-1">
                    Hai raccolto tutti i tesori magici 3D!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION CONTROLS */}
        <div className="w-full flex flex-col gap-2 shrink-0 mt-2">
          {isCurrentGameWon && (
            <div className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 border-2 border-white rounded-2xl p-2 text-center shadow-lg flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-900 shrink-0" />
              <span className="font-kids font-extrabold text-xs sm:text-sm text-slate-950">
                {bravoWord} {childName}! +3 Stelline d'Oro vinte!
              </span>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-amber-700 fill-amber-700" />
                <Star className="w-4 h-4 text-amber-700 fill-amber-700" />
                <Star className="w-4 h-4 text-amber-700 fill-amber-700" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundManager.playPop();
                if (gameMode === 'tris') resetTris();
                if (gameMode === 'bubbles') initBubblesGame();
                if (gameMode === 'memory') initMemoryGame();
                if (gameMode === 'stars') initStarsGame();
              }}
              className="toy-button-3d min-h-[44px] py-2.5 px-4 rounded-2xl bg-white hover:bg-sky-50 text-slate-900 font-kids font-extrabold text-xs sm:text-sm border-2 border-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 text-pink-500 shrink-0" />
              <span>Gioca Ancora</span>
            </button>

            <button
              onClick={() => {
                soundManager.playSuccess();
                onComplete(gameMode, trisWinner === 'PLAYER');
              }}
              className="toy-button-3d min-h-[44px] py-2.5 px-4 rounded-2xl bg-gradient-to-b from-emerald-400 via-green-500 to-teal-600 text-white font-kids font-extrabold text-xs sm:text-sm border-2 border-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Vai al Livello {levelNumber + 1}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
