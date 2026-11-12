import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { Sparkles, Star, RotateCcw, Trophy, ArrowRight, Heart } from 'lucide-react';

interface MiniTrisGameProps {
  levelNumber: number;
  onComplete: () => void;
}

type BoardCell = 'X' | 'O' | null;

export const MiniTrisGame: React.FC<MiniTrisGameProps> = ({
  levelNumber,
  onComplete,
}) => {
  const [board, setBoard] = useState<BoardCell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // Friendly animal opponent
  const opponent = {
    name: 'Leo lo Scoiattolo',
    emoji: '🐿️',
    piece: '🫐',
  };
  const playerPiece = '🍓';

  // Greeting on mount
  useEffect(() => {
    soundManager.speak(`Livello ${levelNumber}: momento di svago! Giochiamo insieme a Tris! Fai tris di fragoline per vincere!`, 1.25);
  }, [levelNumber]);

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
    if (board[idx] || !isPlayerTurn || winner) return;

    soundManager.playPop();
    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      handleGameOver(result.winner as 'player' | 'ai' | 'draw', result.line);
      return;
    }

    setIsPlayerTurn(false);

    // AI move with a gentle, kid-friendly delay
    setTimeout(() => {
      makeAiMove(newBoard);
    }, 600);
  };

  const makeAiMove = (currentBoard: BoardCell[]) => {
    const available = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (available.length === 0) return;

    // Friendly preschool AI: chooses randomly or takes a simple open spot
    const chosenIdx = available[Math.floor(Math.random() * available.length)];
    const aiBoard = [...currentBoard];
    aiBoard[chosenIdx] = 'O';
    setBoard(aiBoard);
    soundManager.playTwinkle();

    const result = checkWinner(aiBoard);
    if (result) {
      handleGameOver(result.winner as 'player' | 'ai' | 'draw', result.line);
    } else {
      setIsPlayerTurn(true);
    }
  };

  const handleGameOver = (win: 'player' | 'ai' | 'draw', line: number[] | null) => {
    setWinner(win);
    setWinningLine(line);

    if (win === 'player') {
      soundManager.playFanfare();
      confetti.burst();
      soundManager.speak('Fantastico! Hai fatto tris! Che partita meravigliosa!', 1.25);
    } else if (win === 'draw') {
      soundManager.playSuccess();
      confetti.burst(undefined, undefined, 15);
      soundManager.speak('Pareggio! Siete bravissimi entrambi!', 1.25);
    } else {
      soundManager.playEncouragement();
      soundManager.speak('Bella giocata! Facciamo un\'altra partita oppure andiamo avanti!', 1.25);
    }
  };

  const resetGame = () => {
    soundManager.playPop();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine(null);
    soundManager.speak('Nuova partita! Tocca a te!', 1.25);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b-2 border-amber-400/30 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-2xl shadow-md border-2 border-white/40">
            🎲
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-kids text-xs font-bold uppercase tracking-wider">
              <span>Traguardo Livello {levelNumber}!</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-kids font-bold text-white leading-tight">
              Momento di Svago: Gioca a Tris!
            </h1>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-kids font-bold text-sm sm:text-base rounded-2xl border-b-4 border-emerald-700 shadow-lg flex items-center gap-2 cursor-pointer btn-chunky"
        >
          <span>Continua Enigmi ➔</span>
        </button>
      </div>

      {/* Main Stage */}
      <div className="flex-1 p-4 sm:p-6 max-w-xl mx-auto w-full flex flex-col items-center justify-center">
        {/* Opponent & Player Cards */}
        <div className="w-full flex items-center justify-around gap-3 p-3 bg-slate-900/80 rounded-3xl border-2 border-white/10 mb-4 shadow-xl">
          <div className={`flex items-center gap-2 p-2 px-3 rounded-2xl transition-all ${
            isPlayerTurn && !winner ? 'bg-pink-500/30 ring-2 ring-pink-400 scale-105' : 'opacity-80'
          }`}>
            <span className="text-3xl">{playerPiece}</span>
            <div className="text-left">
              <div className="font-kids font-bold text-sm sm:text-base text-pink-300">Tu</div>
              <div className="text-[11px] font-fun text-slate-300">{isPlayerTurn && !winner ? 'Tocca a te!' : 'In attesa...'}</div>
            </div>
          </div>

          <span className="font-kids font-bold text-xl text-yellow-300">VS</span>

          <div className={`flex items-center gap-2 p-2 px-3 rounded-2xl transition-all ${
            !isPlayerTurn && !winner ? 'bg-indigo-500/30 ring-2 ring-indigo-400 scale-105' : 'opacity-80'
          }`}>
            <span className="text-3xl">{opponent.emoji}</span>
            <div className="text-left">
              <div className="font-kids font-bold text-sm sm:text-base text-indigo-300">{opponent.name}</div>
              <div className="text-[11px] font-fun text-slate-300">{!isPlayerTurn && !winner ? 'Sta pensando...' : `Gioca con ${opponent.piece}`}</div>
            </div>
          </div>
        </div>

        {/* 3x3 Tic Tac Toe Board */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/80 rounded-4xl border-4 border-amber-400/50 shadow-2xl backdrop-blur-md max-w-sm sm:max-w-md w-full">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 aspect-square">
            {board.map((cell, idx) => {
              const isWinning = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={cell !== null || !isPlayerTurn || winner !== null}
                  className={`w-full h-full rounded-3xl border-4 border-b-6 flex items-center justify-center text-4xl sm:text-6xl transition-all select-none ${
                    isWinning
                      ? 'bg-emerald-500/40 border-emerald-400 animate-bounce ring-4 ring-emerald-300'
                      : cell === 'X'
                      ? 'bg-pink-950/60 border-pink-400 text-pink-300 shadow-inner'
                      : cell === 'O'
                      ? 'bg-indigo-950/60 border-indigo-400 text-indigo-300 shadow-inner'
                      : 'bg-slate-800/90 border-slate-700 hover:border-amber-400 hover:bg-slate-700 cursor-pointer btn-chunky active:scale-95'
                  }`}
                >
                  {cell === 'X' ? playerPiece : cell === 'O' ? opponent.piece : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status / Victory Bar */}
        <div className="w-full mt-4 flex flex-col items-center gap-3">
          {winner ? (
            <div className="w-full p-4 bg-slate-900/95 rounded-3xl border-3 border-yellow-300 text-center animate-fade-in shadow-2xl flex flex-col items-center">
              <div className="text-4xl mb-1">
                {winner === 'player' ? '👑🎉' : winner === 'draw' ? '🤝✨' : '👏🌟'}
              </div>
              <h3 className="font-kids font-bold text-xl sm:text-2xl text-yellow-300">
                {winner === 'player'
                  ? 'Hai Vinto! Bravissima!'
                  : winner === 'draw'
                  ? 'Bellissimo Pareggio!'
                  : 'Ottima Partita!'}
              </h3>
              <p className="text-xs sm:text-sm font-fun font-bold text-pink-200 mb-3">
                Un momento di pausa rilassante prima dei prossimi enigmi!
              </p>

              <div className="flex gap-2.5 w-full">
                <button
                  onClick={resetGame}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-yellow-300 font-kids text-sm rounded-2xl border-2 border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rigioca Tris</span>
                </button>

                <button
                  onClick={onComplete}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-kids font-bold text-sm rounded-2xl shadow-lg border-b-4 border-purple-800 flex items-center justify-center gap-1.5 cursor-pointer btn-chunky"
                >
                  <span>Prossimo Livello ➔</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-300 font-fun font-bold text-center">
              Tocca una casella vuota per mettere la tua fragolina {playerPiece}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
