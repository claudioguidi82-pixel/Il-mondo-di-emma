import React, { useState, useEffect, useCallback } from 'react';
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

interface SvagoArenaProps {
  levelNumber: number;
  onComplete: () => void;
  onExitToTitle: () => void;
}

type SvagoGameMode = 'tris' | 'bubbles' | 'memory' | 'stars';
type CellValue = 'EMMA' | 'ORSETTO' | null;

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
  onComplete,
  onExitToTitle,
}) => {
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
  const [isEmmaTurn, setIsEmmaTurn] = useState(true);
  const [trisWinner, setTrisWinner] = useState<'EMMA' | 'ORSETTO' | 'DRAW' | null>(
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

  useEffect(() => {
    soundManager.startBackgroundMusic();
    const unsub = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    return () => {
      unsub();
      soundManager.stopBackgroundMusic();
    };
  }, []);

  const initBubblesGame = useCallback(() => {
    const generated: Bubble3DItem[] = Array.from({ length: BUBBLE_TARGET }).map(
      (_, idx) => ({
        id: idx,
        emoji: BUBBLE_EMOJIS[idx % BUBBLE_EMOJIS.length],
        color: BUBBLE_PALETTE[idx % BUBBLE_PALETTE.length],
        size: idx % 2 === 0 ? 78 : 70,
        left: 8 + (idx % 3) * 30 + ((idx * 7) % 9),
        top: 8 + Math.floor(idx / 3) * 23 + ((idx * 5) % 6),
        popped: false,
      })
    );
    setBubbles(generated);
    setBubblesPopped(0);
  }, []);

  const initMemoryGame = useCallback(() => {
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
  }, [levelNumber]);

  const initStarsGame = useCallback(() => {
    const generated: FallingStar3D[] = Array.from({ length: STARS_TARGET }).map(
      (_, idx) => ({
        id: idx,
        emoji: ['⭐', '🌟', '💖', '👑', '🦄', '🌈', '✨', '🎈'][idx % 8],
        left: 10 + (idx % 4) * 22 + ((idx * 3) % 6),
        top: 10 + Math.floor(idx / 4) * 42 + ((idx * 9) % 12),
        caught: false,
      })
    );
    setStarsList(generated);
    setStarsCaught(0);
  }, []);

  const resetTris = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsEmmaTurn(true);
    setTrisWinner(null);
    setWinningLine(null);
  }, []);

  useEffect(() => {
    soundManager.speakPraise(
      `Evviva Emma! Livello ${levelNumber}: sei nel Parco Giochi Arcobaleno 3D! Scegli il tuo gioco preferito!`
    );
    initBubblesGame();
    initMemoryGame();
    initStarsGame();
  }, [levelNumber, initBubblesGame, initMemoryGame, initStarsGame]);

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
    if (gameMode !== 'tris' || isEmmaTurn || trisWinner) return;

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
            'Ha vinto Orsetto! Riproviamo subito Emma, fai vedere chi è la campionessa!'
          );
        } else if (result.winner === 'DRAW') {
          soundManager.playSuccess();
          soundManager.speak('Pareggio! Giochiamo un altra partita!');
        }
      } else {
        setIsEmmaTurn(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [board, isEmmaTurn, trisWinner, checkTrisWinner, gameMode]);

  const handleTrisCellClick = (idx: number) => {
    if (!isEmmaTurn || board[idx] !== null || trisWinner) return;

    soundManager.playTwinkle();
    const nextBoard = [...board];
    nextBoard[idx] = 'EMMA';
    setBoard(nextBoard);

    const result = checkTrisWinner(nextBoard);
    if (result) {
      setTrisWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'EMMA') {
        soundManager.playFanfare();
        confetti.burst();
        soundManager.speakPraise(
          'Tris! Bravissima Emma! Hai vinto 3 stelline d oro!'
        );
      } else if (result.winner === 'DRAW') {
        soundManager.playSuccess();
        soundManager.speak('Pareggio! Riprova o passa al prossimo livello!');
      }
    } else {
      setIsEmmaTurn(false);
    }
  };

  const handlePopBubble = (id: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    soundManager.playTwinkle();
    const nextCount = bubblesPopped + 1;
    setBubblesPopped(nextCount);
    if (nextCount >= BUBBLE_TARGET) {
      soundManager.playFanfare();
      confetti.burst();
      soundManager.speakPraise(
        'Fantastico Emma! Hai scoppiato tutte le bolle magiche 3D!'
      );
    }
  };

  const handleMemoryCardClick = (index: number) => {
    if (
      flippedIndices.length >= 2 ||
      memoryCards[index].flipped ||
      memoryCards[index].matched
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
        setTimeout(() => {
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
                'Super Memoria Emma! Hai trovato tutte le coppie 3D!'
              );
            }
            return matchedCards;
          });
          setFlippedIndices([]);
        }, 350);
      } else {
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, flipped: false }
                : c
            )
          );
          setFlippedIndices([]);
        }, 750);
      }
    }
  };

  const handleCatchStar = (id: number) => {
    setStarsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, caught: true } : s))
    );
    soundManager.playTwinkle();
    const nextCaught = starsCaught + 1;
    setStarsCaught(nextCaught);
    if (nextCaught >= STARS_TARGET) {
      soundManager.playFanfare();
      confetti.burst();
      soundManager.speakPraise(
        'Bravissima Emma! Hai preso tutti i tesori magici 3D!'
      );
    }
  };

  const isCurrentGameWon =
    (gameMode === 'tris' && (trisWinner === 'EMMA' || trisWinner === 'DRAW')) ||
    (gameMode === 'bubbles' && bubblesPopped >= BUBBLE_TARGET) ||
    (gameMode === 'memory' && memoryComplete) ||
    (gameMode === 'stars' && starsCaught >= STARS_TARGET);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#38bdf8] via-[#a5f3fc] to-[#fde68a] select-none">
      {/* SUNNY 3D AMUSEMENT PARK SKY & HILLS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 shadow-[0_0_55px_rgba(251,191,36,0.9)] border-4 border-yellow-100 flex items-center justify-center animate-float-3d">
          <span className="text-4xl">🌞</span>
        </div>

        <svg
          viewBox="0 0 600 220"
          className="w-[115%] max-w-none -left-[7%] top-6 absolute opacity-65"
          fill="none"
        >
          <path
            d="M 20 210 Q 300 -30 580 210"
            stroke="#fb7185"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 32 215 Q 300 -12 568 215"
            stroke="#fbbf24"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 44 220 Q 300 6 556 220"
            stroke="#34d399"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 56 225 Q 300 24 544 225"
            stroke="#38bdf8"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute top-12 left-4 w-28 h-11 bg-white/90 rounded-full shadow-md animate-cloud-drift" />
        <div
          className="absolute top-20 right-14 w-24 h-10 bg-white/85 rounded-full shadow-md animate-cloud-drift"
          style={{ animationDelay: '1.3s' }}
        />

        <div className="absolute -bottom-10 -left-16 w-[75%] h-28 rounded-[100%] bg-gradient-to-t from-emerald-500 via-emerald-400 to-lime-300 border-t-4 border-lime-100/80" />
        <div className="absolute -bottom-12 -right-16 w-[75%] h-32 rounded-[100%] bg-gradient-to-t from-green-500 via-emerald-400 to-teal-300 border-t-4 border-emerald-100/80" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-10 flex items-center justify-between px-3 pt-2.5 pb-1 shrink-0 gap-1.5">
        <button
          onClick={() => {
            soundManager.playPop();
            onExitToTitle();
          }}
          className="toy-button-3d bg-white/95 text-slate-900 px-3 py-2 rounded-2xl border-2 border-white shadow-lg flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-pink-500 stroke-[3]" />
          <span className="font-kids font-extrabold text-xs">Home</span>
        </button>

        <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-500 px-3.5 py-1.5 rounded-full border-2 border-white shadow-lg flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-white" />
          <span className="font-kids font-extrabold text-xs sm:text-sm text-white uppercase tracking-wide drop-shadow">
            🎡 Premio Liv. {levelNumber} · Parco 3D
          </span>
        </div>

        <button
          onClick={() => {
            const nextState = soundManager.toggleMusic();
            setMusicOn(nextState);
          }}
          className={`toy-button-3d p-2 sm:px-3 sm:py-2 rounded-2xl border-2 shadow-lg flex items-center gap-1 active:scale-95 cursor-pointer ${
            musicOn
              ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 border-white'
              : 'bg-white/90 text-slate-600 border-white'
          }`}
        >
          {musicOn ? (
            <Music className="w-4 h-4 stroke-[2.8] animate-bounce" />
          ) : (
            <VolumeX className="w-4 h-4 stroke-[2.8]" />
          )}
          <span className="font-kids font-extrabold text-xs hidden sm:inline">
            Musica
          </span>
        </button>
      </header>

      {/* 4 MINI-GAME 3D SELECTOR TABS */}
      <div className="relative z-10 px-3 py-1 max-w-md mx-auto w-full shrink-0">
        <div className="grid grid-cols-4 gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border-2 border-white shadow-lg">
          {[
            { id: 'tris', label: 'Tris 3D', emoji: '👑' },
            { id: 'bubbles', label: 'Bolle 3D', emoji: '🫧' },
            { id: 'memory', label: 'Memory', emoji: '🃏' },
            { id: 'stars', label: 'Stelline', emoji: '🌟' },
          ].map((tab) => {
            const active = gameMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playPop();
                  setGameMode(tab.id as SvagoGameMode);
                }}
                className={`py-2 px-1 rounded-xl font-kids font-extrabold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-pink-400 via-fuchsia-500 to-purple-600 text-white shadow-md scale-[1.03] border-2 border-white'
                    : 'bg-sky-50 text-slate-700 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                <span className="text-xl leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN 3D ARENA CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-1.5 max-w-md mx-auto w-full min-h-0">
        {/* MODE 1: 3D TRIS */}
        {gameMode === 'tris' && (
          <>
            <div className="w-full board-3d-tabletop rounded-3xl p-2.5 flex items-center justify-between shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all ${
                  isEmmaTurn && !trisWinner
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-2 border-white scale-105 shadow-md'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-kids font-extrabold text-xs leading-tight">
                    Emma
                  </p>
                  <p className="text-[10px] font-bold opacity-90">Turno Tuo</p>
                </div>
              </div>

              <div className="text-center px-2">
                <span className="font-kids font-extrabold text-xs uppercase tracking-wider text-pink-600">
                  {trisWinner === 'EMMA'
                    ? '🎉 Vittoria!'
                    : trisWinner === 'ORSETTO'
                    ? '🧸 Orsetto!'
                    : trisWinner === 'DRAW'
                    ? '🤝 Pareggio!'
                    : isEmmaTurn
                    ? 'Tocca a Emma!'
                    : 'Pensa Orsetto...'}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all ${
                  !isEmmaTurn && !trisWinner
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

            <div className="w-full max-w-[310px] aspect-square grid grid-cols-3 gap-2.5 p-3.5 rounded-[32px] board-3d-tabletop my-auto">
              {board.map((cell, idx) => {
                const isWinningCell = winningLine?.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleTrisCellClick(idx)}
                    disabled={!!cell || !isEmmaTurn || !!trisWinner}
                    className={`tris-slot-3d rounded-2xl flex items-center justify-center transition-all p-1.5 cursor-pointer ${
                      isWinningCell
                        ? 'bg-gradient-to-b from-yellow-200 to-amber-400 border-white scale-105 shadow-[0_0_24px_rgba(250,204,21,0.9)]'
                        : cell === 'EMMA'
                        ? 'bg-gradient-to-b from-pink-100 to-rose-200 border-pink-300'
                        : cell === 'ORSETTO'
                        ? 'bg-gradient-to-b from-cyan-100 to-sky-200 border-cyan-300'
                        : 'hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    {cell === 'EMMA' && (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-b from-pink-400 to-rose-600 border-2 border-white shadow-md flex items-center justify-center text-3xl animate-pop-in">
                        👑
                      </div>
                    )}
                    {cell === 'ORSETTO' && (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 border-2 border-white shadow-md flex items-center justify-center text-3xl animate-pop-in">
                        🧸
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* MODE 2: BOLLE 3D */}
        {gameMode === 'bubbles' && (
          <div className="w-full flex-1 flex flex-col justify-between my-1 min-h-0">
            <div className="bg-white/95 rounded-2xl px-4 py-2 border-2 border-white flex items-center justify-between mb-2 shrink-0 shadow-md">
              <span className="font-kids font-extrabold text-xs sm:text-sm text-pink-600">
                🫧 Scoppia tutte le Bolle 3D!
              </span>
              <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-kids font-extrabold text-xs shadow">
                {bubblesPopped} / {BUBBLE_TARGET}
              </span>
            </div>

            <div className="relative flex-1 rounded-[32px] board-3d-tabletop overflow-hidden">
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
                    className={`absolute rounded-full bg-gradient-to-br ${b.color} border-3 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_6px_12px_rgba(255,255,255,0.85)] flex items-center justify-center animate-float-3d active:scale-125 transition-transform cursor-pointer`}
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
              <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-kids font-extrabold text-xs shadow">
                {starsCaught} / {STARS_TARGET}
              </span>
            </div>

            <div className="relative flex-1 rounded-[32px] board-3d-tabletop overflow-hidden">
              {starsList.map((st) =>
                st.caught ? null : (
                  <button
                    key={st.id}
                    onClick={() => handleCatchStar(st.id)}
                    style={{
                      left: `${st.left}%`,
                      top: `${st.top}%`,
                    }}
                    className="absolute w-16 h-16 rounded-full bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-400 border-3 border-white shadow-lg flex items-center justify-center text-3xl animate-float-3d active:scale-125 transition-transform cursor-pointer"
                  >
                    {st.emoji}
                  </button>
                )
              )}

              {starsCaught >= STARS_TARGET && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm p-4 text-center">
                  <span className="text-6xl mb-2 animate-bounce">👑</span>
                  <h3 className="font-kids font-extrabold text-2xl text-amber-600">
                    Super Campionessa! 🌟
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
                Bravissima Emma! +3 Stelline d'Oro vinte!
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
              className="toy-button-3d py-2.5 px-4 rounded-2xl bg-white hover:bg-sky-50 text-slate-900 font-kids font-extrabold text-xs sm:text-sm border-2 border-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-pink-500" />
              <span>Gioca Ancora</span>
            </button>

            <button
              onClick={() => {
                soundManager.playSuccess();
                onComplete();
              }}
              className="toy-button-3d py-2.5 px-4 rounded-2xl bg-gradient-to-b from-emerald-400 via-green-500 to-teal-600 text-white font-kids font-extrabold text-xs sm:text-sm border-2 border-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vai al Livello {levelNumber + 1}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
