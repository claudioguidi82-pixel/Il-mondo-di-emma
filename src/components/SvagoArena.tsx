import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Compass,
  Grid3X3,
  Cpu,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { confetti } from '../utils/confetti';
import { ChildProfile } from '../types/game';
import {
  calculateChildAge,
  getAgeVisualTheme,
  getDisplayChildName,
  getGenderedWord,
} from '../utils/childProfile';
import {
  SvagoGameMode,
  MazePuzzle,
  DiffPuzzle,
  TrisCellValue,
  generateMazePuzzle,
  canStepInMaze,
  findMazeShortestPath,
  generateDiffPuzzle,
  getAgeAdaptedDiffMeta,
  evaluateTrisBoard,
  chooseBestTrisMove,
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
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageYears, childProfile?.name, childGender),
    [ageYears, childProfile?.name, childGender]
  );
  const isMature = ageTheme.isMatureTheme;
  const isTeen = ageTheme.stageId === 'teen_nextgen';
  const isExplorer = ageTheme.stageId === 'primary_explorer';
  const gPalette = ageTheme.genderPalette;

  const bravoWord = getGenderedWord(childGender, 'Bravissima', 'Bravissimo', 'Ottimo lavoro');
  const championWord = getGenderedWord(childGender, 'campionessa', 'campione', 'campione');

  // Age-adapted Tris opponent profile (never calls a 9-14yo opponent "Orsetto"!)
  const trisProfile = useMemo(() => {
    if (isTeen) {
      return {
        playerSymbol: '✕',
        botSymbol: '◯',
        botName: 'AI Minimax',
        botSubtitle: 'Strategica',
        isGeometric: true,
        introPrompt: 'Sfida strategica a Tris contro l’intelligenza Minimax. Allinea tre simboli.',
        winPrompt: `Ottima mossa strategica, ${childName}! Hai battuto il motore Minimax.`,
        losePrompt: 'L’AI ha chiuso la linea. Riprova subito con una nuova apertura.',
      };
    }
    if (isMature) {
      return {
        playerSymbol: '✕',
        botSymbol: '◯',
        botName: 'Bot Campus',
        botSubtitle: 'Livello Medio',
        isGeometric: true,
        introPrompt: 'Partita di Tris tattico contro il Bot del Campus. Metti tre simboli in fila.',
        winPrompt: `Ottima strategia! Hai vinto la partita di Tris!`,
        losePrompt: 'Il Bot ha completato la fila! Prova una nuova tattica.',
      };
    }
    if (isExplorer) {
      return {
        playerSymbol: '⚡',
        botSymbol: '🦊',
        botName: 'Volpe Logica',
        botSubtitle: 'Sfidante',
        isGeometric: false,
        introPrompt: 'Sfida a Tris contro la Volpe Logica! Allinea tre fulmini!',
        winPrompt: `Tris! ${bravoWord}! Hai superato la Volpe Logica!`,
        losePrompt: `Ha vinto la Volpe Logica! Riprova e fai vedere chi è ${getGenderedWord(childGender, 'la', 'il', 'il')} ${championWord}!`,
      };
    }
    return {
      playerSymbol: '👑',
      botSymbol: '🧸',
      botName: 'Orsetto',
      botSubtitle: 'Amico',
      isGeometric: false,
      introPrompt: 'Giochiamo a Tris contro Orsetto! Metti tre corone in fila!',
      winPrompt: `Tris! ${bravoWord}! Hai vinto tre stelline d'oro!`,
      losePrompt: `Ha vinto Orsetto! Riproviamo subito, fai vedere chi è ${getGenderedWord(childGender, 'la', 'il', 'il')} ${championWord}!`,
    };
  }, [isTeen, isMature, isExplorer, childName, bravoWord, childGender, championWord]);

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
  const [mazeMoves, setMazeMoves] = useState<number>(0);
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
  const [diffMisses, setDiffMisses] = useState<number>(0);
  const [diffHintSpotId, setDiffHintSpotId] = useState<string | null>(null);
  const [missRipple, setMissRipple] = useState<{ x: number; y: number; key: number } | null>(
    null
  );
  const [lastFoundLabel, setLastFoundLabel] = useState<string | null>(null);
  const missTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adaptedDiffMeta = useMemo(
    () => getAgeAdaptedDiffMeta(diffPuzzle.scene, ageYears),
    [diffPuzzle.scene, ageYears]
  );

  // =========================================================================
  // 3. TRIS STATE + SCOREBOARD
  // =========================================================================
  const [board, setBoard] = useState<TrisCellValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [trisWinner, setTrisWinner] = useState<'PLAYER' | 'BOT' | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [trisScore, setTrisScore] = useState<{ wins: number; draws: number; losses: number }>({
    wins: 0,
    draws: 0,
    losses: 0,
  });

  // Regenerate age-calibrated puzzles if age changes
  useEffect(() => {
    const nextMaze = generateMazePuzzle(ageYears);
    setMazePuzzle(nextMaze);
    setMazePos(nextMaze.start);
    setMazeTrail([`${nextMaze.start.row},${nextMaze.start.col}`]);
    setMazeMoves(0);
    setMazeWon(false);
    setMazeHintCells([]);

    const nextDiff = generateDiffPuzzle(ageYears);
    setDiffPuzzle(nextDiff);
    setFoundSpotIds([]);
    setDiffMisses(0);
    setDiffHintSpotId(null);
    setLastFoundLabel(null);
  }, [ageYears]);

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
      setMazeMoves(0);
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
      setDiffMisses(0);
      setDiffHintSpotId(null);
      setMissRipple(null);
      setLastFoundLabel(null);
      if (speakPrompt) {
        soundManager.speak(getAgeAdaptedDiffMeta(next.scene, ageYears).voicePrompt);
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
        isMature
          ? `Sezione ${ageTheme.labels.svagoTitle}. Scegli tra Labirinto, Analisi Visiva o Strategia Tris.`
          : 'Benvenuto nei Giochi di Svago! Scegli tra Labirinto, Trova le differenze o Tris!'
      );
    } else {
      soundManager.speakPraise(
        isMature
          ? `Modulo pausa cognitiva · Livello ${levelNumber}. Scegli una sfida di logica.`
          : `Evviva ${childName}! Livello ${levelNumber}: è il momento dei Giochi di Svago!`
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
    mazeBumpTimerRef.current = setTimeout(() => setMazeBump(false), 220);
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
      setMazeMoves((m) => m + 1);
      setMazeHintCells([]);
      setMazeTrail((prev) => {
        const key = `${nr},${nc}`;
        return prev.includes(key) ? prev : [...prev, key];
      });

      if (nr === mazePuzzle.goal.row && nc === mazePuzzle.goal.col) {
        setMazeWon(true);
        soundManager.playFanfare();
        if (!isTeen) confetti.burst();
        soundManager.speakPraise(mazePuzzle.theme.voiceWin);
      }
    },
    [mazePos, mazePuzzle, mazeWon, triggerMazeBump, isTeen]
  );

  const handleMazeCellInteract = useCallback(
    (targetRow: number, targetCol: number, isDrag = false) => {
      if (mazeWon) return;
      if (targetRow === mazePos.row && targetCol === mazePos.col) return;

      const dr = targetRow - mazePos.row;
      const dc = targetCol - mazePos.col;

      if (Math.abs(dr) + Math.abs(dc) === 1) {
        stepMazeByDelta(dr, dc);
        return;
      }

      if (isDrag) return;

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
          setMazeMoves((m) => m + newKeys.length);
          setMazeHintCells([]);
          setMazeTrail((prev) => {
            const set = new Set(prev);
            newKeys.forEach((k) => set.add(k));
            return Array.from(set);
          });
          if (curR === mazePuzzle.goal.row && curC === mazePuzzle.goal.col) {
            setMazeWon(true);
            soundManager.playFanfare();
            if (!isTeen) confetti.burst();
            soundManager.speakPraise(mazePuzzle.theme.voiceWin);
          }
        }
      }
    },
    [mazePos, mazePuzzle, mazeWon, stepMazeByDelta, triggerMazeBump, isTeen]
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
  const diffAccuracyPct = useMemo(() => {
    const totalClicks = foundSpotIds.length + diffMisses;
    if (totalClicks === 0) return 100;
    return Math.round((foundSpotIds.length / totalClicks) * 100);
  }, [foundSpotIds.length, diffMisses]);

  const handleDiffTapPoint = (svgX: number, svgY: number) => {
    if (diffWon) return;

    const unfoundSpots = diffPuzzle.scene.spots.filter(
      (s) => diffPuzzle.activeSpotIds.includes(s.id) && !foundSpotIds.includes(s.id)
    );

    // Tighter hit radius for older ages (9+), generous touch cushion for young kids (2-8)
    const tolerance = isMature ? 2 : 6;
    let matchedSpot: (typeof unfoundSpots)[number] | null = null;
    let bestDist = Infinity;

    for (const spot of unfoundSpots) {
      const dist = Math.hypot(svgX - spot.cx, svgY - spot.cy);
      if (dist <= spot.r + tolerance && dist < bestDist) {
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
        if (!isTeen) confetti.burst();
        soundManager.speakPraise(
          isMature
            ? `Analisi completata! Tutte le ${totalDiffTarget} differenze individuate.`
            : `${bravoWord}! Hai trovato tutte le ${totalDiffTarget} differenze!`
        );
      } else {
        soundManager.playTwinkle();
      }
    } else {
      setDiffMisses((m) => m + 1);
      soundManager.playPop();
      setMissRipple({ x: svgX, y: svgY, key: Date.now() });
      if (missTimerRef.current) clearTimeout(missTimerRef.current);
      missTimerRef.current = setTimeout(() => setMissRipple(null), 400);
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
  // TRIS LOGIC (AGE-ADAPTIVE AI FROM PLAYFUL TO MINIMAX)
  // =========================================================================
  useEffect(() => {
    if (gameMode !== 'tris' || isPlayerTurn || trisWinner) return;

    const timer = setTimeout(() => {
      const chosenIdx = chooseBestTrisMove(board, ageYears);
      if (chosenIdx === null) return;

      const nextBoard = [...board];
      nextBoard[chosenIdx] = 'BOT';
      soundManager.playPop();
      setBoard(nextBoard);

      const result = evaluateTrisBoard(nextBoard);
      if (result) {
        setTrisWinner(result.winner);
        setWinningLine(result.line);
        if (result.winner === 'BOT') {
          setTrisScore((s) => ({ ...s, losses: s.losses + 1 }));
          soundManager.speak(trisProfile.losePrompt);
        } else if (result.winner === 'DRAW') {
          setTrisScore((s) => ({ ...s, draws: s.draws + 1 }));
          soundManager.playSuccess();
          soundManager.speak(
            isMature ? 'Partita patta. Prova una nuova apertura.' : "Pareggio! Giochiamo un'altra partita!"
          );
        }
      } else {
        setIsPlayerTurn(true);
      }
    }, isMature ? 420 : 540);

    return () => clearTimeout(timer);
  }, [board, isPlayerTurn, trisWinner, gameMode, ageYears, trisProfile.losePrompt, isMature]);

  const handleTrisCellClick = (idx: number) => {
    if (!isPlayerTurn || board[idx] !== null || trisWinner) return;

    soundManager.playTwinkle();
    const nextBoard = [...board];
    nextBoard[idx] = 'PLAYER';
    setBoard(nextBoard);

    const result = evaluateTrisBoard(nextBoard);
    if (result) {
      setTrisWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'PLAYER') {
        setTrisScore((s) => ({ ...s, wins: s.wins + 1 }));
        soundManager.playFanfare();
        if (!isTeen) confetti.burst();
        soundManager.speakPraise(trisProfile.winPrompt);
      } else if (result.winner === 'DRAW') {
        setTrisScore((s) => ({ ...s, draws: s.draws + 1 }));
        soundManager.playSuccess();
        soundManager.speak(
          isMature ? 'Pareggio! Buona difesa.' : 'Pareggio! Riprova o cambia gioco!'
        );
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
      soundManager.speak(adaptedDiffMeta.voicePrompt);
    } else {
      soundManager.speak(trisProfile.introPrompt);
    }
  };

  const tabItems: Array<{
    id: SvagoGameMode;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    emoji: string;
  }> = [
    {
      id: 'maze',
      label: isMature ? 'Labirinto' : 'Labirinto',
      shortLabel: 'Labirinto',
      icon: <Compass className="w-4 h-4 shrink-0" />,
      emoji: '🧭',
    },
    {
      id: 'differences',
      label: isTeen ? 'Analisi Visiva' : 'Differenze',
      shortLabel: isTeen ? 'Analisi' : 'Differenze',
      icon: <Search className="w-4 h-4 shrink-0" />,
      emoji: '🔍',
    },
    {
      id: 'tris',
      label: isMature ? 'Strategia Tris' : 'Tris',
      shortLabel: 'Tris',
      icon: isMature ? <Grid3X3 className="w-4 h-4 shrink-0" /> : <Cpu className="w-4 h-4 shrink-0" />,
      emoji: isExplorer ? '⚡' : '👑',
    },
  ];

  const mazeEfficiencyPct =
    mazeMoves > 0
      ? Math.min(100, Math.round((mazePuzzle.optimalSteps / mazeMoves) * 100))
      : 100;

  return (
    <div
      className={`safe-viewport-pad relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${
        isMature ? 'bg-[#0b0f17] text-slate-100' : 'bg-sky-200 text-slate-900'
      }`}
      onPointerUp={() => {
        isMazeDraggingRef.current = false;
      }}
      onPointerCancel={() => {
        isMazeDraggingRef.current = false;
      }}
    >
      {/* AGE-ADAPTIVE BACKDROP: Minimal Monochrome Studio (9-14) vs Clean/Warm Meadow (2-8) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {isMature ? (
          <div className="w-full h-full bg-gradient-to-b from-[#0b0f17] via-[#0f172a] to-[#090d16]" />
        ) : (
          <>
            <img
              src={arenaMeadowBackdrop}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover object-center scale-[1.01] ${
                isExplorer ? 'brightness-[0.95] saturate-[0.82]' : ''
              }`}
            />
            <div
              className="absolute inset-0"
              style={{
                background: isExplorer
                  ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(248, 250, 252, 0.35) 55%, rgba(15, 23, 42, 0.28) 100%)'
                  : 'linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(255, 255, 255, 0.05) 48%, rgba(22, 101, 52, 0.16) 100%)',
              }}
            />
          </>
        )}
      </div>

      {/* ALIGNED TOP BAR (3-COLUMN GRID — ZERO OVERLAP ON ANY WIDTH) */}
      <header className="landscape-header-compact app-shell-container relative z-10 px-3 sm:px-5 lg:px-8 pt-2 sm:pt-3 pb-1 shrink-0">
        <div className="ui-aligned-header max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => {
              soundManager.stopSpeech();
              soundManager.playPop();
              onExitToTitle();
            }}
            aria-label="Torna alla Home"
            className={`px-3 sm:px-4 h-10 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
              isMature
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-white/12'
                : 'glossy-bubble-btn bg-white text-slate-900 rounded-full border-2 border-white'
            }`}
          >
            <Home className={`w-4 h-4 shrink-0 ${isMature ? gPalette.accentTextClass : 'text-slate-700'}`} />
            <span className="hidden min-[360px]:inline font-fun font-bold text-xs sm:text-sm whitespace-nowrap">
              Home
            </span>
          </button>

          <div
            className={`h-10 px-3 sm:px-4 flex items-center justify-center gap-2 min-w-0 mx-auto max-w-full ${
              isMature
                ? `rounded-xl bg-slate-900/95 border ${gPalette.accentBorderClass} text-slate-100`
                : `rounded-full bg-gradient-to-r ${gPalette.headerGradientClass} border-2 border-white/85 text-white shadow-sm`
            }`}
          >
            <Gamepad2 className={`w-4 h-4 shrink-0 ${isMature ? gPalette.accentTextClass : 'text-white'}`} />
            <span className="font-kids font-bold text-xs sm:text-sm leading-tight truncate">
              {isFreePlay
                ? ageTheme.labels.svagoTitle
                : `${ageTheme.labels.svagoTitle} · Liv. ${levelNumber}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextState = soundManager.toggleMusic();
              setMusicOn(nextState);
            }}
            title={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            aria-label={musicOn ? 'Disattiva Musica' : 'Attiva Musica'}
            className={`w-10 h-10 sm:w-auto sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
              isMature
                ? musicOn
                  ? `${gPalette.accentBgClass} border border-white/10`
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/12'
                : `glossy-bubble-btn rounded-full border-2 ${
                    musicOn
                      ? `${gPalette.accentBgClass} border-white/90`
                      : 'bg-white text-slate-600 border-white'
                  }`
            }`}
          >
            {musicOn ? (
              <Music className="w-4 h-4 stroke-[2.4] shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[2.4] shrink-0" />
            )}
            <span className="font-fun font-bold text-xs hidden sm:inline whitespace-nowrap">
              Audio
            </span>
          </button>
        </div>
      </header>

      {/* ALIGNED 3-TAB NAVIGATION BAR (CLEAN SEGMENTED CONTROL ON MATURE, TACTILE ON EARLY) */}
      <nav className="app-shell-container relative z-10 px-3 sm:px-5 lg:px-8 py-1.5 w-full shrink-0">
        <div
          className={`ui-aligned-tabs grid-cols-3 max-w-2xl mx-auto p-1 ${
            isMature
              ? 'bg-slate-900/95 border border-white/10 rounded-xl'
              : isExplorer
              ? 'bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-sm'
              : 'storybook-wood-shelf rounded-2xl p-1.5'
          }`}
        >
          {tabItems.map((tab) => {
            const active = gameMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`px-2 sm:px-3 py-2 font-fun font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isMature
                    ? active
                      ? `${gPalette.tabActiveClass} rounded-lg`
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg'
                    : isExplorer
                    ? active
                      ? `${gPalette.tabActiveClass} rounded-xl`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl'
                    : active
                    ? `${gPalette.tabActiveClass} rounded-xl border-2 border-white`
                    : 'bg-amber-950/30 text-amber-50 hover:bg-amber-950/45 rounded-xl'
                }`}
              >
                {isMature ? (
                  tab.icon
                ) : (
                  <span className="text-sm sm:text-base leading-none shrink-0">{tab.emoji}</span>
                )}
                <span className="truncate hidden min-[380px]:inline">{tab.label}</span>
                <span className="truncate min-[380px]:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN ARENA CONTENT */}
      <main className="app-shell-container relative z-10 flex-1 flex flex-col items-center justify-between px-3 sm:px-5 lg:px-8 py-1 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto overflow-x-hidden">
        {/* ================================================================= */}
        {/* GAME 1: LABIRINTO (5x5 -> 10x10 + OPTIMAL PAR FOR 9-14Y)          */}
        {/* ================================================================= */}
        {gameMode === 'maze' && (
          <div className="w-full flex-1 flex flex-col items-center justify-between gap-2 my-1 min-h-0">
            {/* Compact Status Bar */}
            <div
              className={`w-full max-w-2xl px-3.5 py-2 flex items-center justify-between gap-2 shrink-0 ${
                isMature
                  ? 'rounded-xl bg-slate-900/95 border border-white/10 text-slate-100'
                  : 'storybook-footer-pill rounded-2xl text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg sm:text-xl shrink-0">{mazePuzzle.theme.heroEmoji}</span>
                <div className="min-w-0">
                  <p className="font-kids font-bold text-xs sm:text-sm truncate leading-tight">
                    {mazePuzzle.theme.title}
                  </p>
                  {isMature && (
                    <p className="text-[11px] font-medium text-slate-400 tabular-nums">
                      Griglia {mazePuzzle.rows}×{mazePuzzle.cols} · Mosse: {mazeMoves} · Ottimale: {mazePuzzle.optimalSteps}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleMazeHint}
                disabled={mazeWon}
                className={`px-3 py-1.5 font-fun font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-45 shrink-0 transition-colors ${
                  isMature
                    ? `rounded-lg ${gPalette.accentSoftBgClass} border hover:brightness-110`
                    : 'rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border-2 border-white shadow-xs'
                }`}
                title="Mostra i prossimi passi nel labirinto"
              >
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                <span>{isMature ? 'Percorso' : 'Aiuto'}</span>
              </button>
            </div>

            {/* Maze Grid + Directional Pad Split */}
            <div className="svago-landscape-split w-full flex-1 flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-5 my-auto min-h-0">
              {/* Interactive Maze Board */}
              <div
                className={`maze-board-responsive relative w-full max-w-[300px] sm:max-w-[360px] aspect-square p-2 sm:p-2.5 shrink-0 transition-transform ${
                  isMature
                    ? 'rounded-2xl bg-slate-900 border border-white/12 shadow-xl'
                    : 'rounded-[24px] board-3d-tabletop'
                } ${mazeBump ? 'scale-[0.985]' : ''}`}
              >
                <div
                  className="w-full h-full rounded-xl overflow-hidden grid touch-none"
                  style={{
                    backgroundColor: mazePuzzle.theme.floorBg,
                    gridTemplateColumns: `repeat(${mazePuzzle.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${mazePuzzle.rows}, minmax(0, 1fr))`,
                    border: `${mazePuzzle.cols >= 10 ? 2.5 : 3.5}px solid ${mazePuzzle.theme.wallColor}`,
                  }}
                >
                  {mazePuzzle.grid.map((rowArr, r) =>
                    rowArr.map((cell, c) => {
                      const isPlayer = mazePos.row === r && mazePos.col === c;
                      const isGoal = mazePuzzle.goal.row === r && mazePuzzle.goal.col === c;
                      const key = `${r},${c}`;
                      const isVisited = mazeTrail.includes(key);
                      const isHint = mazeHintCells.includes(key);
                      const wallWidth = mazePuzzle.cols >= 10 ? '2px' : '3px';
                      const wallStyle = `${wallWidth} solid ${mazePuzzle.theme.wallColor}`;
                      const openStyle = mazePuzzle.theme.isDarkTheme
                        ? '1px solid rgba(255,255,255,0.04)'
                        : '1px solid rgba(0,0,0,0.04)';

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
                              ? '#eab308'
                              : isPlayer
                              ? mazePuzzle.theme.isDarkTheme
                                ? gPalette.accentHex
                                : '#fef08a'
                              : isGoal
                              ? mazePuzzle.theme.isDarkTheme
                                ? 'rgba(16, 185, 129, 0.32)'
                                : '#dcfce7'
                              : mazePuzzle.theme.pathColor,
                            borderTop: cell.walls.top ? wallStyle : openStyle,
                            borderRight: cell.walls.right ? wallStyle : openStyle,
                            borderBottom: cell.walls.bottom ? wallStyle : openStyle,
                            borderLeft: cell.walls.left ? wallStyle : openStyle,
                          }}
                          className="relative flex items-center justify-center p-0 cursor-pointer focus:outline-none transition-colors"
                          aria-label={`Cella ${r + 1}, ${c + 1}`}
                        >
                          {isVisited && !isPlayer && !isGoal && (
                            <span
                              className={`${
                                mazePuzzle.cols >= 10 ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'
                              } rounded-full pointer-events-none`}
                              style={{ backgroundColor: mazePuzzle.theme.trailColor }}
                            />
                          )}
                          {isHint && !isPlayer && !isGoal && (
                            <span className="w-2 h-2 rounded-full bg-white pointer-events-none" />
                          )}
                          {isGoal && !isPlayer && (
                            <span
                              className={`leading-none pointer-events-none ${
                                mazePuzzle.cols >= 10
                                  ? 'text-xs sm:text-sm'
                                  : mazePuzzle.cols >= 8
                                  ? 'text-base sm:text-lg'
                                  : 'text-2xl sm:text-3xl'
                              }`}
                            >
                              {mazePuzzle.theme.goalEmoji}
                            </span>
                          )}
                          {isPlayer && (
                            <span
                              className={`leading-none pointer-events-none ${
                                mazePuzzle.cols >= 10
                                  ? 'text-xs sm:text-sm'
                                  : mazePuzzle.cols >= 8
                                  ? 'text-base sm:text-lg'
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
                  <div
                    className={`absolute inset-2 rounded-xl backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 animate-pop-in ${
                      isMature ? 'bg-slate-950/92 text-white border border-white/15' : 'bg-white/92 text-slate-900'
                    }`}
                  >
                    <span className="text-4xl sm:text-5xl mb-1.5">
                      {mazePuzzle.theme.goalEmoji}
                    </span>
                    <h3 className={`font-kids font-bold text-lg sm:text-xl ${isMature ? gPalette.accentTextClass : 'text-emerald-700'}`}>
                      {isMature ? 'Percorso Completato' : 'Traguardo Raggiunto!'}
                    </h3>
                    {isMature ? (
                      <p className="text-xs font-medium text-slate-300 mt-1 tabular-nums">
                        {mazeMoves} mosse (ottimale {mazePuzzle.optimalSteps}) · Efficienza {mazeEfficiencyPct}%
                      </p>
                    ) : (
                      <p className="text-xs font-fun font-bold text-slate-700 mt-1">
                        {mazePuzzle.theme.voiceWin}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tactile Directional Pad (Adapts from Candy 3D to Minimal Slate) */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-2.5 ${
                    isMature
                      ? 'rounded-2xl bg-slate-900/95 border border-white/10'
                      : 'rounded-3xl board-3d-tabletop'
                  }`}
                >
                  <div />
                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(-1, 0)}
                    disabled={mazeWon}
                    aria-label="Vai su"
                    className={`maze-dpad-btn w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-all ${
                      isMature
                        ? 'rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-white/10'
                        : 'rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 text-white border-2 border-white shadow-[0_3px_0_#1e3a8a] active:translate-y-0.5'
                    }`}
                  >
                    <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>
                  <div />

                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(0, -1)}
                    disabled={mazeWon}
                    aria-label="Vai a sinistra"
                    className={`maze-dpad-btn w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-all ${
                      isMature
                        ? 'rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-white/10'
                        : 'rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 text-white border-2 border-white shadow-[0_3px_0_#9a3412] active:translate-y-0.5'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>

                  <div
                    className={`maze-dpad-btn w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center text-xl ${
                      isMature
                        ? `rounded-xl bg-slate-950 border ${gPalette.accentBorderClass}`
                        : 'rounded-2xl bg-amber-100/80 border-2 border-amber-300'
                    }`}
                  >
                    {mazePuzzle.theme.heroEmoji}
                  </div>

                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(0, 1)}
                    disabled={mazeWon}
                    aria-label="Vai a destra"
                    className={`maze-dpad-btn w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-all ${
                      isMature
                        ? 'rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-white/10'
                        : 'rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 text-white border-2 border-white shadow-[0_3px_0_#14532d] active:translate-y-0.5'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>

                  <div />
                  <button
                    type="button"
                    onClick={() => stepMazeByDelta(1, 0)}
                    disabled={mazeWon}
                    aria-label="Vai giù"
                    className={`maze-dpad-btn w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-all ${
                      isMature
                        ? 'rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-white/10'
                        : 'rounded-2xl bg-gradient-to-b from-pink-400 to-rose-600 text-white border-2 border-white shadow-[0_3px_0_#9d174d] active:translate-y-0.5'
                    }`}
                  >
                    <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>
                  <div />
                </div>
                {isMature && (
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    Usa le frecce, WASD o tocca il corridoio
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 2: TROVA LE DIFFERENZE / ANALISI VISIVA (3 -> 6 SPOTS)       */}
        {/* ================================================================= */}
        {gameMode === 'differences' && (
          <div className="w-full flex-1 flex flex-col items-center justify-between gap-2 my-1 min-h-0">
            <div
              className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 shrink-0 ${
                isMature
                  ? 'rounded-xl bg-slate-900/95 border border-white/10 text-slate-100'
                  : 'storybook-footer-pill rounded-2xl text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">{diffPuzzle.scene.emoji}</span>
                <div className="min-w-0">
                  <p className="font-kids font-bold text-xs sm:text-sm truncate leading-tight">
                    {adaptedDiffMeta.title}
                  </p>
                  {lastFoundLabel && !diffWon ? (
                    <p className={`text-[11px] font-semibold truncate ${isMature ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      ✓ Trovato: {lastFoundLabel}
                    </p>
                  ) : isMature ? (
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      Precisione: {diffAccuracyPct}%
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 font-fun font-bold text-xs tabular-nums inline-flex items-center gap-1 ${
                    isMature
                      ? `rounded-lg ${gPalette.badgeClass}`
                      : `rounded-full ${gPalette.tabActiveClass}`
                  }`}
                >
                  <Search className="w-3 h-3 shrink-0" />
                  <span>
                    {foundSpotIds.length}/{totalDiffTarget}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleDiffHint}
                  disabled={diffWon}
                  className={`px-2.5 py-1.5 font-fun font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-45 ${
                    isMature
                      ? 'rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                      : 'rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border-2 border-white shadow-xs'
                  }`}
                  title="Evidenzia una differenza"
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>{isMature ? 'Indizio' : 'Aiuto'}</span>
                </button>
              </div>
            </div>

            <div className="diff-grid-responsive relative w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 items-center content-center my-auto min-h-0">
              <div
                className={`w-full max-w-[420px] mx-auto p-2 sm:p-2.5 ${
                  isMature
                    ? 'rounded-2xl bg-slate-900/95 border border-white/12'
                    : 'board-3d-tabletop rounded-[22px]'
                }`}
              >
                <div className="flex items-center justify-between px-1.5 pb-1">
                  <span className={`font-fun font-bold text-[11px] sm:text-xs ${isMature ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isMature ? 'Fotogramma A · Originale' : 'Immagine 1'}
                  </span>
                  <span className={`text-[10px] font-semibold ${isMature ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tocca i dettagli diversi
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

              <div
                className={`w-full max-w-[420px] mx-auto p-2 sm:p-2.5 ${
                  isMature
                    ? 'rounded-2xl bg-slate-900/95 border border-white/12'
                    : 'board-3d-tabletop rounded-[22px]'
                }`}
              >
                <div className="flex items-center justify-between px-1.5 pb-1">
                  <span className={`font-fun font-bold text-[11px] sm:text-xs ${isMature ? gPalette.accentTextClass : gPalette.accentTextClass}`}>
                    {isMature ? 'Fotogramma B · Variante' : 'Immagine 2'}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums ${isMature ? 'text-slate-400' : 'text-slate-600'}`}>
                    {totalDiffTarget - foundSpotIds.length > 0
                      ? `Mancano ${totalDiffTarget - foundSpotIds.length}`
                      : 'Completato'}
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
                  <div
                    className={`backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl text-center animate-pop-in ${
                      isMature
                        ? 'bg-slate-950/95 border border-emerald-400/50 text-white'
                        : 'bg-white/95 border-4 border-emerald-400 text-slate-900'
                    }`}
                  >
                    <h3 className={`font-kids font-bold text-lg sm:text-xl ${isMature ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {isMature ? 'Analisi Completata' : 'Occhio di Falco!'}
                    </h3>
                    <p className={`text-xs sm:text-sm font-medium mt-1 tabular-nums ${isMature ? 'text-slate-300' : 'text-slate-700'}`}>
                      {totalDiffTarget}/{totalDiffTarget} differenze trovate
                      {isMature ? ` · Precisione ${diffAccuracyPct}%` : '!'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 3: TRIS (AGE-ADAPTIVE: ORSETTO -> VOLPE -> BOT -> MINIMAX)   */}
        {/* ================================================================= */}
        {gameMode === 'tris' && (
          <div className="svago-landscape-split w-full flex-1 flex flex-col items-center justify-around gap-2.5 my-auto min-h-0">
            {/* Aligned Player vs Opponent HUD */}
            <div className="w-full max-w-md flex flex-col gap-2 shrink-0">
              <div
                className={`w-full p-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 ${
                  isMature
                    ? 'rounded-xl bg-slate-900/95 border border-white/10'
                    : 'board-3d-tabletop rounded-2xl'
                }`}
              >
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all min-w-0 ${
                    isPlayerTurn && !trisWinner
                      ? gPalette.tabActiveClass
                      : isMature
                      ? 'bg-slate-800/70 text-slate-300'
                      : 'bg-white/80 text-slate-700'
                  }`}
                >
                  <span className="text-lg sm:text-xl font-bold shrink-0">{trisProfile.playerSymbol}</span>
                  <div className="min-w-0">
                    <p className="font-fun font-bold text-xs leading-tight truncate">{childName}</p>
                    <p className="text-[10px] opacity-85 truncate">Tu</p>
                  </div>
                </div>

                <div className="text-center px-1 shrink-0">
                  <span className={`font-fun font-bold text-xs uppercase tracking-wide ${isMature ? gPalette.accentTextClass : gPalette.accentTextClass}`}>
                    {trisWinner === 'PLAYER'
                      ? 'Vittoria'
                      : trisWinner === 'BOT'
                      ? trisProfile.botName
                      : trisWinner === 'DRAW'
                      ? 'Pareggio'
                      : isPlayerTurn
                      ? 'Tocca a te'
                      : '...'}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-end gap-2 px-2.5 py-1.5 rounded-lg transition-all min-w-0 text-right ${
                    !isPlayerTurn && !trisWinner
                      ? isMature
                        ? 'bg-slate-700 text-white'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                      : isMature
                      ? 'bg-slate-800/70 text-slate-300'
                      : 'bg-white/80 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-fun font-bold text-xs leading-tight truncate">
                      {trisProfile.botName}
                    </p>
                    <p className="text-[10px] opacity-85 truncate">{trisProfile.botSubtitle}</p>
                  </div>
                  <span className="text-lg sm:text-xl font-bold shrink-0">{trisProfile.botSymbol}</span>
                </div>
              </div>

              {/* Clean Session Scoreboard for Explorer / Mature stages */}
              {(isMature || isExplorer) && (
                <div
                  className={`grid grid-cols-3 text-center py-1.5 px-2 text-xs font-fun font-semibold tabular-nums ${
                    isMature
                      ? 'rounded-xl bg-slate-900/80 border border-white/8 text-slate-300'
                      : 'rounded-xl bg-white/85 border border-slate-200 text-slate-700'
                  }`}
                >
                  <span>Vinte: {trisScore.wins}</span>
                  <span>Pareggi: {trisScore.draws}</span>
                  <span>{trisProfile.botName}: {trisScore.losses}</span>
                </div>
              )}
            </div>

            {/* 3x3 Grid */}
            <div
              className={`tris-board-responsive w-full max-w-[290px] sm:max-w-[320px] aspect-square grid grid-cols-3 gap-2 sm:gap-2.5 p-3 my-auto shrink-0 ${
                isMature
                  ? 'rounded-2xl bg-slate-900 border border-white/12 shadow-xl'
                  : 'rounded-[28px] board-3d-tabletop'
              }`}
            >
              {board.map((cell, idx) => {
                const isWinningCell = winningLine?.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTrisCellClick(idx)}
                    disabled={!!cell || !isPlayerTurn || !!trisWinner}
                    className={`rounded-xl flex items-center justify-center transition-all p-1.5 cursor-pointer ${
                      isMature
                        ? isWinningCell
                          ? `${gPalette.accentBgClass} border border-white/50 scale-[1.03]`
                          : cell
                          ? 'bg-slate-800/95 border border-white/12'
                          : 'bg-slate-950/80 hover:bg-slate-800/80 border border-white/8 active:scale-95'
                        : `tris-slot-3d rounded-2xl ${
                            isWinningCell
                              ? 'bg-gradient-to-b from-yellow-200 to-amber-400 border-white scale-105'
                              : cell === 'PLAYER'
                              ? 'bg-white border-slate-200'
                              : cell === 'BOT'
                              ? 'bg-slate-50 border-slate-200'
                              : 'hover:scale-[1.02] active:scale-95'
                          }`
                    }`}
                  >
                    {cell === 'PLAYER' && (
                      trisProfile.isGeometric ? (
                        <span className={`text-3xl sm:text-4xl font-extrabold animate-pop-in ${isWinningCell ? 'text-white' : gPalette.accentTextClass}`}>
                          {trisProfile.playerSymbol}
                        </span>
                      ) : (
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${gPalette.accentBgClass} border-2 border-white shadow-sm flex items-center justify-center text-2xl sm:text-3xl animate-pop-in`}>
                          {trisProfile.playerSymbol}
                        </div>
                      )
                    )}
                    {cell === 'BOT' && (
                      trisProfile.isGeometric ? (
                        <span className={`text-3xl sm:text-4xl font-extrabold animate-pop-in ${isWinningCell ? 'text-white' : 'text-slate-300'}`}>
                          {trisProfile.botSymbol}
                        </span>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 border-2 border-white shadow-sm flex items-center justify-center text-2xl sm:text-3xl animate-pop-in">
                          {trisProfile.botSymbol}
                        </div>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM ALIGNED ACTION BAR */}
        <div className="w-full max-w-2xl flex flex-col gap-2 shrink-0 mt-1.5 pb-1">
          {isCurrentGameWon && (
            <div
              className={`rounded-xl px-3.5 py-2 text-center flex items-center justify-center gap-2 ${
                isMature
                  ? 'bg-emerald-500/15 border border-emerald-400/35 text-emerald-200'
                  : 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 border-2 border-white text-slate-950 shadow-sm'
              }`}
            >
              <Trophy className={`w-4 h-4 shrink-0 ${isMature ? 'text-emerald-300' : 'text-amber-900'}`} />
              <span className="font-fun font-bold text-xs sm:text-sm">
                {isFreePlay
                  ? isMature
                    ? 'Sfida completata con successo.'
                    : `${bravoWord}! Partita completata alla grande!`
                  : `${bravoWord}! +3 Stelle acquisite`}
              </span>
              {!isMature && (
                <div className="flex items-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                  <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                  <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePlayAgain}
              className={`min-h-[44px] px-3 py-2 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                isMature
                  ? 'rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-white/12'
                  : 'home-wood-outer rounded-[16px] p-[3px]'
              }`}
            >
              {isMature ? (
                <>
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span className="truncate">Nuova Partita</span>
                </>
              ) : (
                <span className="home-inner-orange rounded-[13px] w-full h-full py-2 px-3 text-white flex items-center justify-center gap-1.5">
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span className="truncate">Nuova Partita</span>
                </span>
              )}
            </button>

            {isFreePlay ? (
              <button
                type="button"
                onClick={() => {
                  soundManager.stopSpeech();
                  soundManager.playPop();
                  onExitToTitle();
                }}
                className={`min-h-[44px] px-3 py-2 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isMature
                    ? `rounded-xl ${gPalette.accentBgClass} ${gPalette.accentBgHoverClass}`
                    : 'home-wood-outer rounded-[16px] p-[3px]'
                }`}
              >
                {isMature ? (
                  <>
                    <Home className="w-4 h-4 shrink-0" />
                    <span className="truncate">Torna alla Home</span>
                  </>
                ) : (
                  <span className="home-inner-green rounded-[13px] w-full h-full py-2 px-3 text-white flex items-center justify-center gap-1.5">
                    <Home className="w-4 h-4 shrink-0" />
                    <span className="truncate">Torna alla Home</span>
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundManager.playSuccess();
                  onComplete(gameMode, trisWinner === 'PLAYER');
                }}
                className={`min-h-[44px] px-3 py-2 font-fun font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isMature
                    ? `rounded-xl ${gPalette.accentBgClass} ${gPalette.accentBgHoverClass}`
                    : 'home-wood-outer rounded-[16px] p-[3px]'
                }`}
              >
                {isMature ? (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="truncate">Sessione #{levelNumber + 1}</span>
                  </>
                ) : (
                  <span className="home-inner-green rounded-[13px] w-full h-full py-2 px-3 text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="truncate">Livello {levelNumber + 1}</span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
