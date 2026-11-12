import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { 
  Sparkles, 
  Star, 
  RotateCcw, 
  Trophy, 
  ArrowRight, 
  Heart,
  Gamepad2,
  Volume2,
  CheckCircle2,
  Gift
} from 'lucide-react';

interface SvagoArenaProps {
  levelNumber: number;
  onComplete: () => void;
}

type BoardCell = 'X' | 'O' | null;

export const SvagoArena: React.FC<SvagoArenaProps> = ({
  levelNumber,
  onComplete,
}) => {
  // Determine svago game type based on level
  // 10 -> Tris Classico
  // 20 -> Scoppia le Bolle Magiche
  // 30 -> Memory Express degli Animaletti
  // 40 -> Tris della Volpina Furba (IA Strategica)
  // 50 -> Acchiappa le Stelline Cadenti
  // 60+ -> Ciclo con difficoltà aumentata
  const cycle = Math.floor(levelNumber / 10);
  const gameTypeIndex = ((cycle - 1) % 5); // 0, 1, 2, 3, 4

  const isTrisEasy = gameTypeIndex === 0;       // Lv 10, 60, 110...
  const isBubblePop = gameTypeIndex === 1;      // Lv 20, 70, 120...
  const isMemoryExpress = gameTypeIndex === 2;  // Lv 30, 80, 130...
  const isTrisSmart = gameTypeIndex === 3;      // Lv 40, 90, 140...
  const isStarCatch = gameTypeIndex === 4;      // Lv 50, 100, 150...

  // ==========================================
  // 1. TRIS STATE (USED FOR TYPE 0 & 3)
  // ==========================================
  const [board, setBoard] = useState<BoardCell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [trisWinner, setTrisWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const trisConfig = isTrisSmart
    ? {
        title: 'Tris della Volpina Furba 🦊',
        subtitle: 'Fiamma la Volpina gioca con astuzia! Riesci a fare tris?',
        opponentName: 'Fiamma la Volpina',
        opponentEmoji: '🦊',
        opponentPiece: '🍩',
        playerPiece: '🧁',
        speech: `Livello ${levelNumber}: momento di svago speciale! Sfida Fiamma la Volpina a Tris! Fai tris di dolcetti per vincere!`,
      }
    : {
        title: 'Tris delle Fragoline 🍓',
        subtitle: 'Fai tris con le tue fragoline dolci contro Leo lo Scoiattolo!',
        opponentName: 'Leo lo Scoiattolo',
        opponentEmoji: '🐿️',
        opponentPiece: '🫐',
        playerPiece: '🍓',
        speech: `Livello ${levelNumber}: momento di svago! Giochiamo insieme a Tris con Leo lo Scoiattolo! Fai tris di fragoline!`,
      };

  // ==========================================
  // 2. BUBBLE POP STATE (USED FOR TYPE 1)
  // ==========================================
  interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
    emoji: string;
    color: string;
    speed: number;
  }
  const [poppedCount, setPoppedCount] = useState<number>(0);
  const targetBubbles = 10 + Math.min(10, Math.floor(cycle / 2));
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  // ==========================================
  // 3. MEMORY EXPRESS STATE (USED FOR TYPE 2)
  // ==========================================
  interface MemoryCard {
    id: number;
    pairId: number;
    emoji: string;
    label: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<number[]>([]);
  const [memoryMatches, setMemoryMatches] = useState<number>(0);
  const totalPairs = cycle >= 8 ? 4 : 3;

  // ==========================================
  // 4. STAR CATCH STATE (USED FOR TYPE 4)
  // ==========================================
  interface FallingItem {
    id: number;
    x: number;
    y: number;
    emoji: string;
    points: number;
    speed: number;
  }
  const [starsCaught, setStarsCaught] = useState<number>(0);
  const targetStars = 12 + Math.min(8, cycle);
  const [fallingStars, setFallingStars] = useState<FallingItem[]>([]);

  // Victory common state
  const [isVictoryCelebration, setIsVictoryCelebration] = useState<boolean>(false);

  // Initialize selected svago game
  useEffect(() => {
    setIsVictoryCelebration(false);

    if (isTrisEasy || isTrisSmart) {
      setBoard(Array(9).fill(null));
      setIsPlayerTurn(true);
      setTrisWinner(null);
      setWinningLine(null);
      soundManager.speakInstruction(trisConfig.speech);
    } else if (isBubblePop) {
      setPoppedCount(0);
      soundManager.speakInstruction(
        `Livello ${levelNumber}: momento di svago! Scoppia le bolle magiche toccandole prima che volino via!`
      );
      // Spawn initial bubbles
      spawnInitialBubbles();
    } else if (isMemoryExpress) {
      initMemoryCards();
      soundManager.speakInstruction(
        `Livello ${levelNumber}: momento di svago! Trova le coppie di animaletti magici!`
      );
    } else if (isStarCatch) {
      setStarsCaught(0);
      soundManager.speakInstruction(
        `Livello ${levelNumber}: momento di svago! Pioggia di stelline! Tocca le stelline che cadono dal cielo!`
      );
      spawnInitialStars();
    }
  }, [levelNumber]);

  // ==========================================
  // BUBBLE POP LOGIC
  // ==========================================
  const spawnInitialBubbles = () => {
    const emojis = ['⭐', '💖', '🎈', '🍓', '🦄', '💎', '🌸', '🍭'];
    const colors = [
      'from-pink-400 to-rose-500',
      'from-cyan-400 to-blue-500',
      'from-amber-400 to-yellow-500',
      'from-purple-400 to-indigo-500',
      'from-emerald-400 to-teal-500',
    ];

    const initial: Bubble[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 75,
      y: 20 + Math.random() * 60,
      size: 70 + Math.random() * 30,
      emoji: emojis[i % emojis.length],
      color: colors[i % colors.length],
      speed: 1 + Math.random() * 1.5,
    }));
    setBubbles(initial);
  };

  const handlePopBubble = (bubbleId: number) => {
    if (isVictoryCelebration) return;
    soundManager.playPop();
    confetti.burst(undefined, undefined, 12);

    setPoppedCount(prev => {
      const next = prev + 1;
      if (next >= targetBubbles) {
        handleGameWin('Fantastico! Hai scoppiato tutte le bolle magiche!');
      }
      return next;
    });

    // Replace popped bubble with a new one
    setBubbles(prev => {
      const remaining = prev.filter(b => b.id !== bubbleId);
      const emojis = ['⭐', '💖', '🎈', '🍓', '🦄', '💎', '🌸', '🍭', '🦋'];
      const colors = [
        'from-pink-400 to-rose-500',
        'from-cyan-400 to-blue-500',
        'from-amber-400 to-yellow-500',
        'from-purple-400 to-indigo-500',
        'from-emerald-400 to-teal-500',
      ];
      const newBubble: Bubble = {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 75,
        y: 15 + Math.random() * 65,
        size: 70 + Math.random() * 30,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 1 + Math.random() * 1.5,
      };
      return [...remaining, newBubble];
    });
  };

  // ==========================================
  // MEMORY EXPRESS LOGIC
  // ==========================================
  const initMemoryCards = () => {
    const animalPool = [
      { emoji: '🐿️', label: 'Leo' },
      { emoji: '🕊️', label: 'Piuma' },
      { emoji: '🐬', label: 'Brio' },
      { emoji: '🦊', label: 'Fiamma' },
      { emoji: '🧸', label: 'Miele' },
      { emoji: '🦉', label: 'Barnaba' },
    ];
    const selected = animalPool.slice(0, totalPairs);
    const deck: MemoryCard[] = [];

    selected.forEach((item, idx) => {
      deck.push({
        id: idx * 2,
        pairId: idx,
        emoji: item.emoji,
        label: item.label,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: idx * 2 + 1,
        pairId: idx,
        emoji: item.emoji,
        label: item.label,
        isFlipped: false,
        isMatched: false,
      });
    });

    setMemoryCards(deck.sort(() => Math.random() - 0.5));
    setFlippedCardIds([]);
    setMemoryMatches(0);
  };

  const handleMemoryCardTap = (cardId: number) => {
    if (flippedCardIds.length >= 2) return;
    const clicked = memoryCards.find(c => c.id === cardId);
    if (!clicked || clicked.isFlipped || clicked.isMatched) return;

    soundManager.playPop();

    const newFlipped = [...flippedCardIds, cardId];
    setFlippedCardIds(newFlipped);
    setMemoryCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      const cardA = memoryCards.find(c => c.id === newFlipped[0]);
      const cardB = clicked;

      if (cardA && cardA.pairId === cardB.pairId) {
        // Match!
        soundManager.playSuccess();
        confetti.burst();
        soundManager.speak(`Coppia di ${cardA.label}!`, 1.3);

        setTimeout(() => {
          setMemoryCards(prev =>
            prev.map(c =>
              c.pairId === cardA.pairId ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCardIds([]);
          setMemoryMatches(m => {
            const next = m + 1;
            if (next >= totalPairs) {
              handleGameWin(`Che memoria formidabile! Hai trovato tutti gli animaletti!`);
            }
            return next;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setMemoryCards(prev =>
            prev.map(c =>
              newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCardIds([]);
        }, 900);
      }
    }
  };

  // ==========================================
  // STAR CATCH LOGIC
  // ==========================================
  const spawnInitialStars = () => {
    const starEmojis = ['⭐', '🌟', '✨', '💖', '💎', '🌈'];
    const initial: FallingItem[] = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 75,
      y: 10 + Math.random() * 50,
      emoji: starEmojis[i % starEmojis.length],
      points: 1,
      speed: 1,
    }));
    setFallingStars(initial);
  };

  const handleCatchStar = (starId: number) => {
    if (isVictoryCelebration) return;
    soundManager.playSuccess();
    confetti.burst(undefined, undefined, 10);

    setStarsCaught(prev => {
      const next = prev + 1;
      if (next >= targetStars) {
        handleGameWin('Meraviglioso! Il tuo cestino è pieno di stelline magiche!');
      }
      return next;
    });

    setFallingStars(prev => {
      const remaining = prev.filter(s => s.id !== starId);
      const starEmojis = ['⭐', '🌟', '✨', '💖', '💎', '🌈', '🍭'];
      const newStar: FallingItem = {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 60,
        emoji: starEmojis[Math.floor(Math.random() * starEmojis.length)],
        points: 1,
        speed: 1,
      };
      return [...remaining, newStar];
    });
  };

  // ==========================================
  // TRIS LOGIC (WITH EASY VS SMART AI)
  // ==========================================
  const checkWinner = (squares: BoardCell[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          winner: squares[a] === 'X' ? 'player' : 'ai',
          line: [a, b, c],
        };
      }
    }

    if (squares.every(s => s !== null)) {
      return { winner: 'draw', line: null };
    }

    return null;
  };

  const handleCellClick = (idx: number) => {
    if (board[idx] !== null || !isPlayerTurn || trisWinner !== null) return;

    soundManager.playPop();
    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);

    const outcome = checkWinner(newBoard);
    if (outcome) {
      handleTrisGameEnd(outcome.winner as any, outcome.line);
      return;
    }

    setIsPlayerTurn(false);

    // AI Turn delay
    setTimeout(() => {
      makeAiMove(newBoard);
    }, 700);
  };

  const makeAiMove = (currentBoard: BoardCell[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return;

    let chosenIdx: number;

    if (isTrisSmart) {
      // Smart AI:
      // 1. Check if AI can win in 1 move
      let winningMove: number | null = null;
      for (const idx of emptyIndices) {
        const test = [...currentBoard];
        test[idx] = 'O';
        const res = checkWinner(test);
        if (res && res.winner === 'ai') {
          winningMove = idx;
          break;
        }
      }

      // 2. Check if need to block player from winning
      let blockingMove: number | null = null;
      if (winningMove === null) {
        for (const idx of emptyIndices) {
          const test = [...currentBoard];
          test[idx] = 'X';
          const res = checkWinner(test);
          if (res && res.winner === 'player') {
            blockingMove = idx;
            break;
          }
        }
      }

      if (winningMove !== null) {
        chosenIdx = winningMove;
      } else if (blockingMove !== null) {
        chosenIdx = blockingMove;
      } else if (currentBoard[4] === null) {
        chosenIdx = 4; // Center
      } else {
        chosenIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    } else {
      // Easy / Gentle Preschool AI: picks friendly random or non-blocking
      chosenIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    const updated = [...currentBoard];
    updated[chosenIdx] = 'O';
    setBoard(updated);
    soundManager.playPop();

    const outcome = checkWinner(updated);
    if (outcome) {
      handleTrisGameEnd(outcome.winner as any, outcome.line);
    } else {
      setIsPlayerTurn(true);
    }
  };

  const handleTrisGameEnd = (result: 'player' | 'ai' | 'draw', line: number[] | null) => {
    setTrisWinner(result);
    setWinningLine(line);

    if (result === 'player') {
      handleGameWin(`TRIS! Bravissima! Tre in fila perfetto!`);
    } else if (result === 'draw') {
      soundManager.playEncouragement();
      soundManager.speak(`Pareggio tra veri campioni! Ottima partita!`, 1.25);
    } else {
      soundManager.playEncouragement();
      soundManager.speak(`${trisConfig.opponentName} ha fatto tris! Bella sfida, riproviamo!`, 1.2);
    }
  };

  const resetTris = () => {
    soundManager.playPop();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setTrisWinner(null);
    setWinningLine(null);
  };

  // Common win handler
  const handleGameWin = (speechPhrase: string) => {
    soundManager.playFanfare();
    confetti.burst();
    setIsVictoryCelebration(true);
    soundManager.speakPraise(speechPhrase);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between bg-gradient-to-b from-[#1c0f3d]/90 via-[#2a1359]/85 to-[#110726]/90 backdrop-blur-xs text-white select-none overflow-hidden h-[100dvh] max-h-[100dvh] w-screen">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 bg-slate-950/80 border-b border-white/10 backdrop-blur-md shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl animate-bounce">🎈</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400 font-kids text-[10px] sm:text-xs font-bold">
                Livello {levelNumber} · Svago
              </span>
              <span className="text-xs text-amber-300 font-fun font-bold hidden sm:inline">
                +3 ⭐ & +5 💎
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-kids font-bold text-white truncate">
              {isTrisEasy && 'Tris delle Fragoline 🍓'}
              {isBubblePop && 'Scoppia le Bolle Magiche 🫧'}
              {isMemoryExpress && 'Memory degli Animaletti 🎴'}
              {isTrisSmart && 'Tris della Volpina Furba 🦊'}
              {isStarCatch && 'Pioggia di Stelline Cadenti ✨'}
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playSuccess();
            onComplete();
          }}
          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-kids font-bold text-xs sm:text-sm rounded-2xl shadow-md border-b-3 border-emerald-700 active:translate-y-1 transition-all flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>Continua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 max-w-3xl mx-auto w-full relative overflow-hidden">
        
        {/* ==================================================== */}
        {/* GAME TYPE 1 & 4: TRIS (CLASSIC OR SMART FOX) */}
        {/* ==================================================== */}
        {(isTrisEasy || isTrisSmart) && (
          <div className="w-full flex flex-col items-center">
            {/* Opponent & Player Header */}
            <div className="flex items-center justify-between w-full max-w-md bg-slate-900/90 rounded-3xl p-3 sm:p-4 border-2 border-pink-400/40 mb-4 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center text-3xl">
                  {trisConfig.playerPiece}
                </div>
                <div>
                  <span className="text-sm font-kids font-bold text-pink-300 block">Tu (Emma)</span>
                  <span className="text-xs text-slate-300 font-fun">
                    {isPlayerTurn && trisWinner === null ? '👉 Tocca a te!' : 'In attesa'}
                  </span>
                </div>
              </div>

              <span className="font-kids text-xl font-bold text-amber-300">VS</span>

              <div className="flex items-center gap-2.5 text-right">
                <div>
                  <span className="text-sm font-kids font-bold text-cyan-300 block">{trisConfig.opponentName}</span>
                  <span className="text-xs text-slate-300 font-fun">
                    {!isPlayerTurn && trisWinner === null ? 'Pensa... 🤔' : 'In attesa'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl">
                  {trisConfig.opponentPiece}
                </div>
              </div>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2.5 sm:p-4 bg-slate-900/95 rounded-3xl border-3 border-pink-500/40 shadow-xl max-w-[270px] sm:max-w-[340px] w-full aspect-square">
              {board.map((cell, idx) => {
                const isWinningCell = winningLine?.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    disabled={cell !== null || !isPlayerTurn || trisWinner !== null}
                    className={`rounded-3xl border-4 transition-all duration-200 flex items-center justify-center text-5xl sm:text-6xl cursor-pointer select-none shadow-md ${
                      isWinningCell
                        ? 'bg-amber-400 border-yellow-200 animate-bounce scale-105'
                        : cell === 'X'
                        ? 'bg-pink-600/30 border-pink-400'
                        : cell === 'O'
                        ? 'bg-cyan-600/30 border-cyan-400'
                        : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 active:scale-95'
                    }`}
                  >
                    {cell === 'X' ? trisConfig.playerPiece : cell === 'O' ? trisConfig.opponentPiece : ''}
                  </button>
                );
              })}
            </div>

            {/* Controls when draw or opponent won */}
            {trisWinner !== null && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={resetTris}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-fun font-bold border-2 border-slate-600 flex items-center gap-2 cursor-pointer shadow active:scale-95"
                >
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span>Gioca Ancora</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playSuccess();
                    onComplete();
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-kids font-bold border-b-4 border-emerald-700 shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Prossimo Livello</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* GAME TYPE 2: BUBBLE POP */}
        {/* ==================================================== */}
        {isBubblePop && (
          <div className="w-full h-full flex flex-col items-center justify-between">
            {/* Counter */}
            <div className="bg-slate-900/90 px-6 py-2 rounded-full border-2 border-cyan-400 text-base sm:text-lg font-kids font-bold flex items-center gap-3 shadow-xl mb-4">
              <span>Bolle Scoppiate:</span>
              <span className="text-amber-400 text-xl font-bold">{poppedCount} / {targetBubbles}</span>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>

            {/* Interactive Bubble Pond */}
            <div className="relative w-full max-w-lg h-[46vh] max-h-[340px] min-h-[220px] bg-slate-950/60 rounded-3xl border-3 border-cyan-500/30 overflow-hidden shadow-xl backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/40 to-transparent pointer-events-none"></div>

              {bubbles.map(bubble => (
                <button
                  key={bubble.id}
                  onClick={() => handlePopBubble(bubble.id)}
                  style={{
                    left: `${bubble.x}%`,
                    top: `${bubble.y}%`,
                    width: `${bubble.size}px`,
                    height: `${bubble.size}px`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr ${bubble.color} p-1 shadow-2xl border-2 border-white/60 flex items-center justify-center text-3xl sm:text-4xl cursor-pointer hover:scale-115 active:scale-90 transition-transform animate-gentle-bounce`}
                >
                  <span className="drop-shadow">{bubble.emoji}</span>
                  {/* Bubble reflection highlight */}
                  <span className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/70"></span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs sm:text-sm font-fun text-cyan-200">
              Tocca le bolle colorate con il dito per farle scoppiare tutte!
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* GAME TYPE 3: MEMORY EXPRESS */}
        {/* ==================================================== */}
        {isMemoryExpress && (
          <div className="w-full flex flex-col items-center">
            {/* Matches counter */}
            <div className="bg-slate-900/90 px-6 py-2 rounded-full border-2 border-purple-400 text-base sm:text-lg font-kids font-bold flex items-center gap-3 shadow-xl mb-4">
              <span>Coppie Trovate:</span>
              <span className="text-yellow-300 text-xl font-bold">{memoryMatches} / {totalPairs}</span>
              <Heart className="w-5 h-5 text-pink-400 fill-current animate-pulse" />
            </div>

            {/* Memory Card Grid */}
            <div className={`grid gap-3 sm:gap-4 p-4 bg-slate-900/90 rounded-4xl border-4 border-purple-500/40 shadow-2xl max-w-xl w-full ${
              totalPairs === 4 ? 'grid-cols-4' : 'grid-cols-3'
            }`}>
              {memoryCards.map(card => {
                const isOpen = card.isFlipped || card.isMatched;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleMemoryCardTap(card.id)}
                    disabled={isOpen}
                    className={`aspect-square rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-lg select-none ${
                      card.isMatched
                        ? 'bg-emerald-600/40 border-emerald-400 scale-95 opacity-80'
                        : isOpen
                        ? 'bg-purple-600/60 border-yellow-300 scale-102 ring-4 ring-yellow-400/50'
                        : 'bg-gradient-to-tr from-purple-800 to-indigo-900 hover:from-purple-700 hover:to-indigo-800 border-purple-400 active:scale-95'
                    }`}
                  >
                    {isOpen ? (
                      <div className="flex flex-col items-center animate-fade-in">
                        <span className="text-4xl sm:text-5xl drop-shadow">{card.emoji}</span>
                        <span className="text-xs font-kids font-bold text-yellow-200 mt-1">{card.label}</span>
                      </div>
                    ) : (
                      <span className="text-3xl text-purple-300 animate-pulse">❓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs sm:text-sm font-fun text-purple-200">
              Gira le carte e trova gli amici animali uguali!
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* GAME TYPE 5: STAR CATCH */}
        {/* ==================================================== */}
        {isStarCatch && (
          <div className="w-full h-full flex flex-col items-center justify-between">
            {/* Counter */}
            <div className="bg-slate-900/90 px-6 py-2 rounded-full border-2 border-amber-400 text-base sm:text-lg font-kids font-bold flex items-center gap-3 shadow-xl mb-4">
              <span>Stelline Raccolte:</span>
              <span className="text-yellow-300 text-xl font-bold">{starsCaught} / {targetStars}</span>
              <Star className="w-5 h-5 text-amber-400 fill-current animate-bounce" />
            </div>

            {/* Falling sky playground */}
            <div className="relative w-full max-w-lg h-[46vh] max-h-[340px] min-h-[220px] bg-slate-950/70 rounded-3xl border-3 border-amber-500/30 overflow-hidden shadow-xl backdrop-blur-md">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent pointer-events-none"></div>

              {fallingStars.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleCatchStar(item.id)}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-2 shadow-2xl border-4 border-white flex items-center justify-center text-4xl sm:text-5xl cursor-pointer hover:scale-120 active:scale-90 transition-transform animate-bounce"
                >
                  <span className="drop-shadow">{item.emoji}</span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs sm:text-sm font-fun text-amber-200">
              Tocca le stelline d'oro per raccoglierle nel tuo sacchetto magico!
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* VICTORY CELEBRATION MODAL OVERLAY */}
        {/* ==================================================== */}
        {isVictoryCelebration && (
          <div className="absolute inset-0 bg-slate-950/90 rounded-4xl backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50 animate-fade-in border-4 border-yellow-400/60 shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-6xl shadow-2xl border-4 border-white mb-4 animate-bounce">
              🏆
            </div>

            <h2 className="text-2xl sm:text-3xl font-kids font-bold text-yellow-300 mb-2">
              Bravissima Emma! Sfida Vinta!
            </h2>

            <p className="text-base sm:text-lg text-slate-200 font-fun max-w-md mb-6">
              Hai completato il livello di svago con successo! Hai guadagnato 3 stelle splendenti e 5 gemme luccicanti!
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/30 rounded-2xl border-2 border-amber-400 text-amber-300 font-kids text-lg">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>+3 Stelle</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-pink-500/30 rounded-2xl border-2 border-pink-400 text-pink-300 font-kids text-lg">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <span>+5 Gemme</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playSuccess();
                onComplete();
              }}
              className="px-8 py-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-kids font-bold text-xl shadow-2xl border-b-6 border-emerald-800 active:translate-y-1 transition-all cursor-pointer flex items-center gap-3 animate-pulse"
            >
              <span>VAI AL PROSSIMO LIVELLO ➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
