import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  RotateCcw,
  Sparkles,
  Trophy,
  Gamepad2,
  Star,
  Music,
  VolumeX,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Search,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { ChildProfile } from '../types/game';
import {
  calculateChildAge,
  getDisplayChildName,
  getGenderedWord,
} from '../utils/childProfile';
import {
  SvagoGameMode,
  MazePuzzle,
  DiffPuzzle,
  generateMazePuzzle,
  canStepInMaze,
  findMazeShortestPath,
  generateDiffPuzzle,
} from '../utils/svagoGames';
import { DiffSceneArtwork } from './DiffSceneArtwork';
import arenaMeadowBackdrop from '../assets/images/arena_meadow_backdrop_1795268326885.jpg';

interface SvagoArenaProps {
  levelNumber: number;
  childProfile?: ChildProfile;
  /** When true (launched from Home), plays freely without advancing the curriculum level */
  isFreePlay?: boolean;
  onComplete: (mode: SvagoGameMode, wonTris: boolean) => void;
  onExitToTitle: () => void;
}

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

export const SvagoArena: React.FC<SvagoArenaProps> = ({
  levelNumber,
  childProfile,
  isFreePlay = false,
  onComplete,
  onExitToTitle,
}) => {
  const childName = getDisplayChildName(childProfile);
  const childGender = childProfile?.gender || 'n';
  const ageYears = calculateChildAge(childProfile?.birthDate).years;
  const bravoWord = getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Fantastico');
  const championWord = getGenderedWord(childGender, 'campionessa', 'campione', 'campione');

  const initialMode: SvagoGameMode = isFreePlay
    ? 'maze'
    : levelNumber % 30 === 0
    ? 'tris'
    : levelNumber % 20 === 0
    ? 'differences'
    : 'maze';

  const [gameMode, setGameMode] = useState<SvagoGameMode>(initialMode);
  const [musicOn, setMusicOn] = useState<boolean>(soundManager.musicEnabled);

  // =========================================================================
  // 1. LABIRINTO STATE
  // =========================================================================
  const [mazePuzzle, setMazePuzzle] = useState<MazePuzzle>(() =>
    generateMazePuzzle(ageYears)
  );
  const [mazePos, setMazePos] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [mazeTrail, setMazeTrail] = useState<string[]>(['0,0']);
  const [mazeWon, setMazeWon] = useState(false);
  const [mazeBump, setMazeBump] = useState(false);
  const [mazeHintCells, setMazeHintCells] = useState<string[]>([]);
  const isMazeDraggingRef = useRef(false);
  const mazeBumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // =========================================================================
  // 2. TROVA LE DIFFERENZE STATE
  // =========================================================================
  const [diffPuzzle, setDiffPuzzle] = useState<DiffPuzzle>(() =>
    generateDiffPuzzle(ageYears)
  );
  const [foundSpotIds, setFoundSpotIds] = useState<string[]>([]);
  const [diffHintSpotId, setDiffHintSpotId] = useState<string | null>(null);
  const [missRipple, setMissRipple] = useState<{ x: number; y: number; key: number } | null>(
    null
  );
  const [lastFoundLabel, setLastFoundLabel] = useState<string | null>(null);
  const missTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // =========================================================================
  // 3. TRIS 3D STATE
  // =========================================================================
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [trisWinner, setTrisWinner] = useState<'PLAYER' | 'ORSETTO' | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  useEffect(() => {
    soundManager.startBackgroundMusic();
    const unsub = soundManager.onMusicChange((enabled) => setMusicOn(enabled));
    return () => {
      unsub();
      if (mazeBumpTimerRef.current) clearTimeout(mazeBumpTimerRef.current);
      if (missTimerRef.current) clearTimeout(missTimerRef.current);
      soundManager.stopBackgroundMusic();
      soundManager.stopSpeech();
    };
  }, []);

  // Init / Reset helpers
  const initMazeGame = useCallback(
    (speakPrompt = false) => {
      const next = generateMazePuzzle(ageYears, mazePuzzle.theme.id);
      setMazePuzzle(next);
      setMazePos(next.start);
      setMazeTrail([`${next.start.row},${next.start.col}`]);
      setMazeWon(false);
      setMazeHintCells([]);
      setMazeBump(false);
      if (speakPrompt) {
        soundManager.speak(next.theme.voicePrompt);
      }
    },
    [ageYears, mazePuzzle.theme.id]
  );

  const initDiffGame = useCallback(
    (speakPrompt = false) => {
      const next = generateDiffPuzzle(ageYears, diffPuzzle.scene.id);
      setDiffPuzzle(next);
      setFoundSpotIds([]);
      setDiffHintSpotId(null);
      setMissRipple(null);
      setLastFoundLabel(null);
      if (speakPrompt) {
        soundManager.speak(next.scene.voicePrompt);
      }
    },
    [ageYears, diffPuzzle.scene.id]
  );

  const resetTris = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setTrisWinner(null);
    setWinningLine(null);
  }, []);

  // Welcome greeting on mount (once)
  useEffect(() => {
    if (isFreePlay) {
      soundManager.speak(
        'Benvenuto nei Giochi di Svago! Scegli tra Labirinto, Trova le differenze o Tris!'
      );
    } else {
      soundManager.speakPraise(
        `Evviva ${childName}! Livello ${levelNumber}: è il momento dei Giochi di Svago!`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelNumber, isFreePlay]);

  // =========================================================================
  // LABIRINTO MOVEMENT LOGIC
  // =========================================================================
  const triggerMazeBump = useCallback(() => {
    setMazeBump(true);
    soundManager.playPop();
    if (mazeBumpTimerRef.current) clearTimeout(mazeBumpTimerRef.current);
    mazeBumpTimerRef.current = setTimeout(() => setMazeBump(false), 260);
  }, []);

  const stepMazeByDelta = useCallback(
    (dr: number, dc: number) => {
      if (mazeWon) return;
      const nr = mazePos.row + dr;
      const nc = mazePos.col + dc;
      if (!canStepInMaze(mazePuzzle.grid, mazePos.row, mazePos.col, nr, nc)) {
        triggerMazeBump();
        return;
      }

      soundManager.playPop();
      const nextPos = { row: nr, col: nc };
      setMazePos(nextPos);
      setMazeHintCells([]);
      setMazeTrail((prev) => {
        const key = `${nr},${nc}`;
        return prev.includes(key) ? prev : [...prev, key];
      });

      if (nr === mazePuzzle.goal.row && nc === mazePuzzle.goal.col) {
        setMazeWon(true);
        soundManager.playFanfare();
        confetti.burst();
        soundManager.speakPraise(mazePuzzle.theme.voiceWin);
      }
    },
    [mazePos, mazePuzzle, mazeWon, triggerMazeBump]
  );

  /**
   * Smart cell click/drag:
   * - Adjacent open cell -> moves 1 step immediately
   * - Cell in the same row/col with an unobstructed straight corridor -> walks cleanly there
   */
  const handleMazeCellInteract = useCallback(
    (targetRow: number, targetCol: number, isDrag = false) => {
      if (mazeWon) return;
      if (targetRow === mazePos.row && targetCol === mazePos.col) return;

      const dr = targetRow - mazePos.row;
      const dc = targetCol - mazePos.col;

      // Single adjacent step
      if (Math.abs(dr) + Math.abs(dc) === 1) {
        stepMazeByDelta(dr, dc);
        return;
      }

      if (isDrag) return;

      // Straight-line corridor tap (e.g., tapping 2-3 cells ahead along an open hallway)
      if (dr === 0 || dc === 0) {
        const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
        const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
        const steps = Math.max(Math.abs(dr), Math.abs(dc));
        let curR = mazePos.row;
        let curC = mazePos.col;
        const newKeys: string[] = [];

        for (let i = 0; i < steps; i++) {
          const nextR = curR + stepR;
          const nextC = curC + stepC;
          if (!canStepInMaze(mazePuzzle.grid, curR, curC, nextR, nextC)) {
            if (i === 0) triggerMazeBump();
            break;
          }
          curR = nextR;
          curC = nextC;
          newKeys.push(`${curR},${curC}`);
        }

        if (newKeys.length > 0) {
          soundManager.playPop();
          setMazePos({ row: curR, col: curC });
          setMazeHintCells([]);
          setMazeTrail((prev) => {
            const set = new Set(prev);
            newKeys.forEach((k) => set.add(k));
            return Array.from(set);
          });
          if (curR === mazePuzzle.goal.row && curC === mazePuzzle.goal.col) {
            setMazeWon(true);
            soundManager.playFanfare();
            confetti.burst();
            soundManager.speakPraise(mazePuzzle.theme.voiceWin);
          }
        }
      }
    },
    [mazePos, mazePuzzle, mazeWon, stepMazeByDelta, triggerMazeBump]
  );

  // Keyboard arrow / WASD support for Maze
  useEffect(() => {
    if (gameMode !== 'maze') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        stepMazeByDelta(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stepMazeByDelta(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        stepMazeByDelta(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        stepMazeByDelta(0, 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameMode, stepMazeByDelta]);

  const handleMazeHint = () => {
    if (mazeWon) return;
    const path = findMazeShortestPath(mazePuzzle.grid, mazePos, mazePuzzle.goal);
    const nextSteps = path.slice(1, 3).map((p) => `${p.row},${p.col}`);
    setMazeHintCells(nextSteps);
    soundManager.playTwinkle();
  };

  // =========================================================================
  // TROVA LE DIFFERENZE LOGIC
  // =========================================================================
  const totalDiffTarget = diffPuzzle.activeSpotIds.length;
  const diffWon = foundSpotIds.length >= totalDiffTarget && totalDiffTarget > 0;

  const handleDiffTapPoint = (svgX: number, svgY: number) => {
    if (diffWon) return;

    // Find closest unfound active spot within generous hit radius
    const unfoundSpots = diffPuzzle.scene.spots.filter(
      (s) => diffPuzzle.activeSpotIds.includes(s.id) && !foundSpotIds.includes(s.id)
    );

    let matchedSpot: (typeof unfoundSpots)[number] | null = null;
    let bestDist = Infinity;

    for (const spot of unfoundSpots) {
      const dist = Math.hypot(svgX - spot.cx, svgY - spot.cy);
      // Generous tolerance (+6 SVG units) so toddler taps feel effortless
      if (dist <= spot.r + 6 && dist < bestDist) {
        bestDist = dist;
        matchedSpot = spot;
      }
    }

    if (matchedSpot) {
      const nextFound = [...foundSpotIds, matchedSpot.id];
      setFoundSpotIds(nextFound);
      setDiffHintSpotId(null);
      setMissRipple(null);
      setLastFoundLabel(matchedSpot.label);

      if (nextFound.length >= totalDiffTarget) {
        soundManager.playFanfare();
        confetti.burst();
        soundManager.speakPraise(
          `${bravoWord}! Hai trovato tutte le ${totalDiffTarget} differenze!`
        );
      } else {
        soundManager.playTwinkle();
      }
    } else {
      soundManager.playPop();
      setMissRipple({ x: svgX, y: svgY, key: Date.now() });
      if (missTimerRef.current) clearTimeout(missTimerRef.current);
      missTimerRef.current = setTimeout(() => setMissRipple(null), 420);
    }
  };

  const handleDiffHint = () => {
    if (diffWon) return;
    const firstUnfound = diffPuzzle.activeSpotIds.find((id) => !foundSpotIds.includes(id));
    if (!firstUnfound) return;
    setDiffHintSpotId(firstUnfound);
    soundManager.playTwinkle();
  };

  // =========================================================================
  // TRIS LOGIC (AGE-ADAPTIVE FRIENDLY ORSETTO AI)
  // =========================================================================
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

  useEffect(() => {
    if (gameMode !== 'tris' || isPlayerTurn || trisWinner) return;

    const timer = setTimeout(() => {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return;

      let chosenIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

      // For kids 6+, Orsetto plays a bit smarter (blocks or takes wins ~65% of the time)
      if (ageYears >= 6 && Math.random() < 0.65) {
        const findLineMove = (who: 'ORSETTO' | 'PLAYER') => {
          for (const [a, b, c] of WINNING_LINES) {
            const vals = [board[a], board[b], board[c]];
            if (vals.filter((v) => v === who).length === 2 && vals.includes(null)) {
              return [a, b, c][vals.indexOf(null)];
            }
          }
          return null;
        };
        const smartMove = findLineMove('ORSETTO') ?? findLineMove('PLAYER');
        if (smartMove !== null) {
          chosenIdx = smartMove;
        }
      }

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
            `Ha vinto Orsetto! Riproviamo subito, fai vedere chi è ${getGenderedWord(
              childGender,
              'la',
              'il',
              'il'
            )} ${championWord}!`
          );
        } else if (result.winner === 'DRAW') {
          soundManager.playSuccess();
          soundManager.speak("Pareggio! Giochiamo un'altra partita!");
        }
      } else {
        setIsPlayerTurn(true);
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [board, isPlayerTurn, trisWinner, checkTrisWinner, gameMode, ageYears, childGender, championWord]);

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
        soundManager.speakPraise(`Tris! ${bravoWord}! Hai vinto tre stelline d'oro!`);
      } else if (result.winner === 'DRAW') {
        soundManager.playSuccess();
        soundManager.speak('Pareggio! Riprova o cambia gioco!');
      }
    } else {
      setIsPlayerTurn(false);
    }
  };

  const isCurrentGameWon =
    (gameMode === 'maze' && mazeWon) ||
    (gameMode === 'differences' && diffWon) ||
    (gameMode === 'tris' && (trisWinner === 'PLAYER' || trisWinner === 'DRAW'));

  const handlePlayAgain = () => {
    soundManager.playPop();
    if (gameMode === 'maze') initMazeGame(false);
    if (gameMode === 'differences') initDiffGame(false);
    if (gameMode === 'tris') resetTris();
  };

  const handleSelectTab = (nextMode: SvagoGameMode) => {
    if (nextMode === gameMode) return;
    soundManager.playPop();
    soundManager.stopSpeech();
    setGameMode(nextMode);
    if (nextMode === 'maze') {
      soundManager.speak(mazePuzzle.theme.voicePrompt);
    } else if (nextMode === 'differences') {
      soundManager.speak(diffPuzzle.scene.voicePrompt);
    } else {
      soundManager.speak('Giochiamo a Tris contro Orsetto! Metti tre corone in fila!');
    }
  };

  return (
    <div
      className="safe-viewport-pad relative w-full h-full flex flex-col justify-between overflow-hidden bg-sky-300 select-none"
      onPointerUp={() => {
        isMazeDraggingRef.current = false;
      }}
      onPointerCancel={() => {
        isMazeDraggingRef.current = false;
      }}
    >
      {/* FULL-BLEED PIXAR 3D STORYBOOK SUNNY MEADOW BACKDROP */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <img
          src={arenaMeadowBackdrop}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(255, 255, 255, 0.04) 48%, rgba(22, 101, 52, 0.16) 100%)',
          }}
        />
      </div>

      {/* GLOSSY 3D BUBBLE TOP BAR */}
      <header className="landscape-header-compact app-shell-container relative z-10 flex items-center justify-between px-2.5 sm:px-5 lg:px-8 pt-2 sm:pt-3 pb-1 shrink-0 gap-2">
        <button
          onClick={() => {
            soundManager.stopSpeech();
            soundManager.playPop();
            onExitToTitle();
          }}
          aria-label="Torna alla Home"
          className="glossy-bubble-btn bg-gradient-to-b from-white to-slate-100 text-slate-900 px-2.5 min-[360px]:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-white flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[38px] sm:min-h-[42px]"
        >
          <Home className="w-4 h-4 text-blue-700 fill-blue-700 shrink-0" />
          <span className="hidden min-[360px]:inline font-fun font-extrabold text-xs sm:text-sm whitespace-nowrap">Home</span>
        </button>

        <div className="glossy-bubble-btn bg-gradient-to-b from-violet-500 via-purple-600 to-indigo-700 px-3.5 sm:px-5 py-1.5 rounded-full border-2 border-white/85 flex items-center gap-1.5 sm:gap-2 min-w-0 justify-center">
          <Gamepad2 className="w-4 h-4 text-amber-200 shrink-0" />
          <span className="font-kids font-bold text-xs sm:text-sm text-white leading-tight text-center truncate">
            {isFreePlay ? 'Giochi di Svago' : `Giochi di Svago · Livello ${levelNumber}`}
          </span>
        </div>

        <button
          onClick={() => {
            const nextState = soundManager.toggleMusic();
            setMusicOn(nextState);
          }}
          title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
          className={`glossy-bubble-btn w-9 h-9 sm:w-auto sm:h-10 sm:px-3.5 rounded-full border-2 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
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
          <span className="font-fun font-bold text-xs hidden sm:inline whitespace-nowrap">
            Musica
          </span>
        </button>
      </header>

      {/* CARVED WOODEN SHELF WITH THE 3 LEISURE GAMES: LABIRINTO · DIFFERENZE · TRIS */}
      <div className="app-shell-container relative z-10 px-2.5 sm:px-5 lg:px-8 py-1.5 w-full shrink-0">
        <div className="storybook-wood-shelf grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-2xl max-w-2xl mx-auto">
          {(
            [
              {
                id: 'maze',
                label: 'Labirinto',
                emoji: '🧭',
                activeGrad: 'from-emerald-400 via-green-500 to-teal-600 text-white',
              },
              {
                id: 'differences',
                label: 'Differenze',
                emoji: '🔍',
                activeGrad: 'from-amber-300 via-yellow-400 to-orange-500 text-amber-950',
              },
              {
                id: 'tris',
                label: 'Tris',
                emoji: '👑',
                activeGrad: 'from-pink-400 via-rose-500 to-pink-600 text-white',
              },
            ] as Array<{
              id: SvagoGameMode;
              label: string;
              emoji: string;
              activeGrad: string;
            }>
          ).map((tab) => {
            const active = gameMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`min-w-0 py-2 px-1.5 sm:px-3 rounded-xl font-kids font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all cursor-pointer ${
                  active
                    ? `bg-gradient-to-b ${tab.activeGrad} border-2 border-white shadow-md scale-[1.02]`
                    : 'bg-amber-950/30 text-amber-50 hover:bg-amber-950/45 border border-amber-200/20'
                }`}
              >
                <span className="text-base sm:text-lg leading-none drop-shadow-xs shrink-0">
                  {tab.emoji}
                </span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN 3D ARENA CONTENT */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col items-center justify-between px-2.5 sm:px-5 lg:px-8 py-1 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto overflow-x-hidden">
        {/* ================================================================= */}
        {/* GAME 1: LABIRINTO (TOUCH-DRAG, TAP CORRIDOR & 3D D-PAD)           */}
        {/* ================================================================= */}
        {gameMode === 'maze' && (
          <div className="w-full flex-1 flex flex-col items-center justify-between gap-2 my-1 min-h-0">
            {/* Compact Status Bar */}
            <div className="w-full max-w-2xl storybook-footer-pill rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">{mazePuzzle.theme.heroEmoji}</span>
                <span className="font-kids font-bold text-xs sm:text-sm text-amber-950 truncate">
                  {mazePuzzle.theme.title}
                </span>
                <span className="text-base sm:text-lg shrink-0">→ {mazePuzzle.theme.goalEmoji}</span>
              </div>

              <button
                type="button"
                onClick={handleMazeHint}
                disabled={mazeWon}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border-2 border-white font-kids font-bold text-xs flex items-center gap-1 shadow cursor-pointer disabled:opacity-50 shrink-0"
                title="Mostra i prossimi passi nel labirinto"
              >
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                <span>Aiuto</span>
              </button>
            </div>

            {/* Maze Grid + Tactile D-Pad Split */}
            <div className="svago-landscape-split w-full flex-1 flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-5 my-auto min-h-0">
              {/* Interactive Maze Board */}
              <div
                className={`maze-board-responsive relative w-full max-w-[300px] sm:max-w-[350px] aspect-square p-2.5 sm:p-3 rounded-[26px] board-3d-tabletop shrink-0 transition-transform ${
                  mazeBump ? 'scale-[0.985]' : ''
                }`}
              >
                <div
                  className="w-full h-full rounded-2xl overflow-hidden grid touch-none"
                  style={{
                    backgroundColor: mazePuzzle.theme.floorBg,
                    gridTemplateColumns: `repeat(${mazePuzzle.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${mazePuzzle.rows}, minmax(0, 1fr))`,
                    border: `4px solid ${mazePuzzle.theme.wallColor}`,
                  }}
                >
                  {mazePuzzle.grid.map((rowArr, r) =>
                    rowArr.map((cell, c) => {
                      const isPlayer = mazePos.row === r && mazePos.col === c;
                      const isGoal = mazePuzzle.goal.row === r && mazePuzzle.goal.col === c;
                      const key = `${r},${c}`;
                      const isVisited = mazeTrail.includes(key);
                      const isHint = mazeHintCells.includes(key);
                      const wallStyle = `3.5px solid ${mazePuzzle.theme.wallColor}`;

                      return (
                        <button
                          key={key}
                          type="button"
                          onPointerDown={() => {
                            isMazeDraggingRef.current = true;
                            handleMazeCellInteract(r, c, false);
                          }}
                          onPointerEnter={() => {
                            if (isMazeDraggingRef.current) {
                              handleMazeCellInteract(r, c, true);
                            }
                          }}
                          style={{
                            backgroundColor: isHint
                              ? '#fde047'
                              : isPlayer
                              ? '#fef08a'
                              : isGoal
                              ? '#dcfce7'
                              : mazePuzzle.theme.pathColor,
                            borderTop: cell.walls.top ? wallStyle : '1px solid rgba(0,0,0,0.03)',
                            borderRight: cell.walls.right ? wallStyle : '1px solid rgba(0,0,0,0.03)',
                            borderBottom: cell.walls.bottom ? wallStyle : '1px solid rgba(0,0,0,0.03)',
                            borderLeft: cell.walls.left ? wallStyle : '1px solid rgba(0,0,0,0.03)',
                          }}
                          className="relative flex items-center justify-center p-0 cursor-pointer focus:outline-none transition-colors"
                          aria-label={`Cella ${r + 1}, ${c + 1}`}
                        >
                          {isVisited && !isPlayer && !isGoal && (
                            <span
                              className="w-2.5 h-2.5 rounded-full pointer-events-none"
                              style={{ backgroundColor: mazePuzzle.theme.trailColor }}
                            />
                          )}
                          {isHint && !isPlayer && !isGoal && (
                            <span className="text-xs sm:text-sm animate-pulse pointer-events-none">
                              ✨
                            </span>
                          )}
                          {isGoal && !isPlayer && (
                            <span
                              className={`leading-none animate-gentle-bounce pointer-events-none ${
                                mazePuzzle.cols >= 8
                                  ? 'text-lg sm:text-xl'
                                  : 'text-2xl sm:text-3xl'
                              }`}
                            >
                              {mazePuzzle.theme.goalEmoji}
                            </span>
                          )}
                          {isPlayer && (
                            <span
                              className={`leading-none drop-shadow-sm animate-pop-in pointer-events-none ${
                                mazePuzzle.cols >= 8
                                  ? 'text-xl sm:text-2xl'
                                  : 'text-2xl sm:text-3xl'
                              }`}
                            >
                              {mazeWon ? '🏆' : mazePuzzle.theme.heroEmoji}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {mazeWon && (
                  <div className="absolute inset-2.5 rounded-2xl bg-white/88 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 animate-pop-in">
                    <span className="text-5xl sm:text-6xl mb-1 animate-bounce">
                      {mazePuzzle.theme.goalEmoji}
                    </span>
                    <h3 className="font-kids font-extrabold text-xl sm:text-2xl text-emerald-700">
                      Traguardo Raggiunto!
                    </h3>
                    <p className="text-xs font-fun font-bold text-slate-700 mt-1">
                      {mazePuzzle.theme.heroEmoji} {mazePuzzle.theme.voiceWin}
                    </p>
                  </div>
                )}
              </div>

              {/* Big 3D Tactile Directional Pad (Works great for 2-14y fingers!) */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-3xl board-3d-tabletop">
                  <div />
                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(-1, 0)}
                    disabled={mazeWon}
                    aria-label="Vai su"
                    className="maze-dpad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 text-white border-2 border-white shadow-[0_4px_0_#1e3a8a] active:translate-y-1 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  </button>
                  <div />

                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(0, -1)}
                    disabled={mazeWon}
                    aria-label="Vai a sinistra"
                    className="maze-dpad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 text-white border-2 border-white shadow-[0_4px_0_#9a3412] active:translate-y-1 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  </button>

                  <div className="maze-dpad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100/80 border-2 border-amber-300 flex items-center justify-center text-2xl">
                    {mazePuzzle.theme.heroEmoji}
                  </div>

                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(0, 1)}
                    disabled={mazeWon}
                    aria-label="Vai a destra"
                    className="maze-dpad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 text-white border-2 border-white shadow-[0_4px_0_#14532d] active:translate-y-1 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  </button>

                  <div />
                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(1, 0)}
                    disabled={mazeWon}
                    aria-label="Vai giù"
                    className="maze-dpad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-pink-400 to-rose-600 text-white border-2 border-white shadow-[0_4px_0_#9d174d] active:translate-y-1 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  </button>
                  <div />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 2: TROVA LE DIFFERENZE (DUAL ILLUSTRATED STORYBOOK SCENES)   */}
        {/* ================================================================= */}
        {gameMode === 'differences' && (
          <div className="w-full flex-1 flex flex-col items-center justify-between gap-2 my-1 min-h-0">
            {/* Compact Status Bar */}
            <div className="w-full storybook-footer-pill rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{diffPuzzle.scene.emoji}</span>
                <div className="min-w-0">
                  <p className="font-kids font-bold text-xs sm:text-sm text-amber-950 truncate leading-tight">
                    {diffPuzzle.scene.title}
                  </p>
                  {lastFoundLabel && !diffWon && (
                    <p className="text-[11px] font-fun font-bold text-emerald-700 truncate">
                      ✓ Trovato: {lastFoundLabel}!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-b from-pink-400 to-rose-600 text-white border border-white font-kids font-bold text-xs shadow tabular-nums inline-flex items-center gap-1">
                  <Search className="w-3 h-3 shrink-0" />
                  <span>
                    {foundSpotIds.length} / {totalDiffTarget}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleDiffHint}
                  disabled={diffWon}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border-2 border-white font-kids font-bold text-xs flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
                  title="Illumina una differenza da trovare"
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>Aiuto</span>
                </button>
              </div>
            </div>

            {/* Dual Pictures: Stacked on Portrait Phone, Side-by-Side on Foldable Inner / Tablet / Desktop / Landscape */}
            <div className="diff-grid-responsive relative w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 items-center content-center my-auto min-h-0">
              <div className="w-full max-w-[420px] mx-auto board-3d-tabletop rounded-[22px] sm:rounded-[26px] p-2 sm:p-2.5">
                <div className="flex items-center justify-between px-1.5 pb-1">
                  <span className="font-kids font-bold text-[11px] sm:text-xs text-amber-900">
                    🖼️ Immagine 1
                  </span>
                  <span className="text-[10px] font-fun font-bold text-amber-800/80">
                    Tocca le differenze!
                  </span>
                </div>
                <DiffSceneArtwork
                  scene={diffPuzzle.scene}
                  isVariant={false}
                  activeSpotIds={diffPuzzle.activeSpotIds}
                  foundSpotIds={foundSpotIds}
                  hintSpotId={diffHintSpotId}
                  missRipple={missRipple}
                  onTapPoint={handleDiffTapPoint}
                />
              </div>

              <div className="w-full max-w-[420px] mx-auto board-3d-tabletop rounded-[22px] sm:rounded-[26px] p-2 sm:p-2.5">
                <div className="flex items-center justify-between px-1.5 pb-1">
                  <span className="font-kids font-bold text-[11px] sm:text-xs text-pink-700">
                    ✨ Immagine 2
                  </span>
                  <span className="text-[10px] font-fun font-bold text-pink-700/85 tabular-nums">
                    {totalDiffTarget - foundSpotIds.length > 0
                      ? `Mancano ${totalDiffTarget - foundSpotIds.length}`
                      : 'Completato!'}
                  </span>
                </div>
                <DiffSceneArtwork
                  scene={diffPuzzle.scene}
                  isVariant={true}
                  activeSpotIds={diffPuzzle.activeSpotIds}
                  foundSpotIds={foundSpotIds}
                  hintSpotId={diffHintSpotId}
                  missRipple={missRipple}
                  onTapPoint={handleDiffTapPoint}
                />
              </div>

              {diffWon && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md border-4 border-emerald-400 rounded-3xl px-6 py-4 shadow-2xl text-center animate-pop-in">
                    <span className="text-5xl block mb-1 animate-bounce">🔎</span>
                    <h3 className="font-kids font-extrabold text-xl sm:text-2xl text-emerald-700">
                      Occhio di Falco!
                    </h3>
                    <p className="text-xs sm:text-sm font-fun font-bold text-slate-700 mt-1">
                      Hai scoperto tutte le {totalDiffTarget} differenze!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 3: 3D TRIS CONTRO ORSETTO                                    */}
        {/* ================================================================= */}
        {gameMode === 'tris' && (
          <div className="svago-landscape-split w-full flex-1 flex flex-col items-center justify-around gap-2 my-auto min-h-0">
            <div className="w-full max-w-md board-3d-tabletop rounded-3xl p-2.5 flex items-center justify-between gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl transition-all min-w-0 ${
                  isPlayerTurn && !trisWinner
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-2 border-white scale-105 shadow-md'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                <span className="text-2xl shrink-0">👑</span>
                <div className="min-w-0">
                  <p className="font-kids font-extrabold text-xs leading-tight truncate">
                    {childName}
                  </p>
                  <p className="text-[10px] font-bold opacity-90">Turno Tuo</p>
                </div>
              </div>

              <div className="text-center px-1 shrink-0">
                <span className="font-kids font-extrabold text-xs uppercase tracking-wider text-pink-600">
                  {trisWinner === 'PLAYER'
                    ? '🎉 Vittoria!'
                    : trisWinner === 'ORSETTO'
                    ? '🧸 Orsetto!'
                    : trisWinner === 'DRAW'
                    ? '🤝 Pareggio!'
                    : isPlayerTurn
                    ? 'Tocca a te!'
                    : 'Orsetto...'}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl transition-all min-w-0 ${
                  !isPlayerTurn && !trisWinner
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-2 border-white scale-105 shadow-md'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                <span className="text-2xl shrink-0">🧸</span>
                <div className="min-w-0">
                  <p className="font-kids font-extrabold text-xs leading-tight truncate">
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
                    type="button"
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

        {/* BOTTOM ACTION CONTROLS */}
        <div className="w-full flex flex-col gap-2 shrink-0 mt-1.5">
          {isCurrentGameWon && (
            <div className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 border-2 border-white rounded-2xl p-2 text-center shadow-lg flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-900 shrink-0" />
              <span className="font-kids font-extrabold text-xs sm:text-sm text-slate-950">
                {isFreePlay
                  ? `${bravoWord}! Partita completata alla grande!`
                  : `${bravoWord}! +3 Stelline d'Oro vinte!`}
              </span>
              <div className="flex items-center shrink-0">
                <Star className="w-4 h-4 text-amber-700 fill-amber-700" />
                <Star className="w-4 h-4 text-amber-700 fill-amber-700" />
                <Star className="w-4 h-4 text-amber-700 fill-amber-700" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pb-1">
            <button
              type="button"
              onClick={handlePlayAgain}
              className="home-wood-outer rounded-[18px] p-[3.5px] cursor-pointer"
            >
              <span className="home-inner-orange rounded-[14px] min-h-[42px] py-2 px-3 text-white font-kids font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap">
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Nuova Partita</span>
              </span>
            </button>

            {isFreePlay ? (
              <button
                type="button"
                onClick={() => {
                  soundManager.stopSpeech();
                  soundManager.playPop();
                  onExitToTitle();
                }}
                className="home-wood-outer rounded-[18px] p-[3.5px] cursor-pointer"
              >
                <span className="home-inner-green rounded-[14px] min-h-[42px] py-2 px-3 text-white font-kids font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <Home className="w-4 h-4 shrink-0" />
                  <span>Torna alla Home</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundManager.playSuccess();
                  onComplete(gameMode, trisWinner === 'PLAYER');
                }}
                className="home-wood-outer rounded-[18px] p-[3.5px] cursor-pointer"
              >
                <span className="home-inner-green rounded-[14px] min-h-[42px] py-2 px-3 text-white font-kids font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Livello {levelNumber + 1}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
