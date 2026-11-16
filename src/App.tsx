import React, { useState, useEffect } from 'react';
import { GameCategory, PuzzleType, UserProgress, SavedDrawing } from './types/game';
import { loadUserProgress, saveUserProgress } from './data/gameData';
import { PlayArena } from './components/PlayArena';
import { SvagoArena } from './components/SvagoArena';
import { StudioDisegno } from './components/StudioDisegno';
import { ParentModal } from './components/ParentModal';
import { soundManager } from './utils/audio';
import { confetti } from './utils/confetti';
import {
  getDifficultyWeightInfo,
  createEvaluationSnapshot,
  syncAnnualAndMonthlyProgress,
} from './utils/evaluationEngine';
import { 
  Play, 
  Star, 
  ShieldCheck, 
  Palette,
  FileDown
} from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() =>
    syncAnnualAndMonthlyProgress(loadUserProgress())
  );
  const [currentView, setCurrentView] = useState<'title' | 'play' | 'studio'>('title');
  const [isParentsOpen, setIsParentsOpen] = useState(false);

  // Sync sound settings to sound manager
  useEffect(() => {
    soundManager.soundEnabled = progress.soundEnabled;
    soundManager.voiceEnabled = progress.voiceEnabled;
    soundManager.musicEnabled = progress.musicEnabled;
    if (!progress.soundEnabled || !progress.musicEnabled) {
      soundManager.stopBackgroundMusic();
    }
  }, [progress.soundEnabled, progress.voiceEnabled, progress.musicEnabled]);

  // Persist music toggle state when changed inside PlayArena or SvagoArena
  useEffect(() => {
    return soundManager.onMusicChange((enabled) => {
      setProgress((prev) => {
        if (prev.musicEnabled === enabled) return prev;
        const next = { ...prev, musicEnabled: enabled };
        saveUserProgress(next);
        return next;
      });
    });
  }, []);

  const updateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress(prev => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  };

  const handleStartGame = () => {
    soundManager.playSuccess();
    confetti.burst();
    setCurrentView('play');
  };

  const handleOpenStudio = () => {
    soundManager.playPop();
    confetti.burst(undefined, undefined, 12);
    setCurrentView('studio');
  };

  const handleSaveDrawing = (drawing: SavedDrawing) => {
    updateProgress(prev => ({
      ...prev,
      stars: prev.stars + drawing.starsEarned,
      gems: prev.gems + 3,
      savedDrawings: [drawing, ...(prev.savedDrawings || [])],
    }));
  };

  const handleSolveLevel = (
    stars: number,
    gems: number,
    category: GameCategory,
    isFirstTry: boolean,
    attemptsCount: number = 1,
    hintsUsed: number = 0,
    puzzleType?: PuzzleType,
    responseTimeMs: number = 4800,
    chcPrimary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs',
    chcSecondary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs'
  ) => {
    const cleanAttempts = Math.max(1, attemptsCount);
    const cleanHints = Math.max(0, hintsUsed);
    const cleanResponseMs = Math.max(450, Math.min(45000, Math.round(responseTimeMs || 4800)));
    updateProgress(prev => {
      const nextLevel = prev.currentLevel + 1;
      const highest = Math.max(prev.highestLevelReached, nextLevel);
      const wInfo = getDifficultyWeightInfo(prev.currentLevel, true);
      // c_i = 1 if solved on 1st try without hints; assisted successes tracked separately
      const isAutonomous = Boolean(isFirstTry) && cleanAttempts === 1 && cleanHints === 0;

      const prevCat = prev.categoryStats[category] || {
        correct: 0,
        total: 0,
        attempts: 0,
        assistedSuccesses: 0,
        hintsUsed: 0,
        weightedCorrectSum: 0,
        weightedTotalSum: 0,
      };
      const prevAttempts =
        prevCat.attempts ??
        prevCat.correct + Math.max(0, prevCat.total - prevCat.correct) * 2;

      const today = new Date().toISOString().split('T')[0];
      const existingDates = prev.sessionDates || (prev.lastPlayedDate ? [prev.lastPlayedDate] : []);
      const isNewDay = !existingDates.includes(today);
      const nextSessionDates = isNewDay ? [...existingDates, today] : existingDates;
      const nextSessionsCount = (prev.sessionsCount ?? 1) + (isNewDay ? 1 : 0);

      const nextHistory = [
        ...(prev.levelHistory || []),
        {
          level: prev.currentLevel,
          tier: wInfo.tier,
          weight: wInfo.weight,
          category,
          puzzleType,
          chcPrimary,
          chcSecondary,
          firstTry: isAutonomous,
          assistedSuccess: !isAutonomous,
          attempts: cleanAttempts,
          hintsUsed: cleanHints,
          responseTimeMs: cleanResponseMs,
          starsEarned: stars,
          timestamp: new Date().toISOString(),
        },
      ].slice(-150);

      const updatedProgress: UserProgress = {
        ...prev,
        currentLevel: nextLevel,
        highestLevelReached: highest,
        lastPlayedDate: today,
        sessionsCount: nextSessionsCount,
        sessionDates: nextSessionDates,
        stars: prev.stars + stars,
        gems: prev.gems + gems,
        totalPuzzlesSolved: prev.totalPuzzlesSolved + 1,
        totalAttempts: prev.totalAttempts + cleanAttempts,
        categoryStats: {
          ...prev.categoryStats,
          [category]: {
            correct: prevCat.correct + (isAutonomous ? 1 : 0),
            total: prevCat.total + 1,
            attempts: prevAttempts + cleanAttempts,
            assistedSuccesses: (prevCat.assistedSuccesses ?? 0) + (isAutonomous ? 0 : 1),
            hintsUsed: (prevCat.hintsUsed ?? 0) + cleanHints,
            weightedCorrectSum:
              (prevCat.weightedCorrectSum ?? 0) + (isAutonomous ? wInfo.weight : 0),
            weightedTotalSum: (prevCat.weightedTotalSum ?? 0) + wInfo.weight,
          },
        },
        levelHistory: nextHistory,
      };

      // Save an evaluation snapshot every 3 solved exercises so IE (Evolution) updates rapidly
      const completedCount = nextLevel - 1;
      if (completedCount >= 1 && (completedCount % 3 === 0 || isNewDay)) {
        const snap = createEvaluationSnapshot(updatedProgress);
        updatedProgress.evaluationSnapshots = [
          ...(prev.evaluationSnapshots || []),
          snap,
        ].slice(-30);
      }

      return syncAnnualAndMonthlyProgress(updatedProgress);
    });
  };

  const handleSvagoComplete = (
    mode: 'tris' | 'bubbles' | 'memory' | 'stars' = 'tris',
    wonTris: boolean = false
  ) => {
    updateProgress(prev => {
      const nextLevel = prev.currentLevel + 1;
      return {
        ...prev,
        currentLevel: nextLevel,
        highestLevelReached: Math.max(prev.highestLevelReached, nextLevel),
        stars: prev.stars + 3,
        gems: prev.gems + 5,
        trisGamesPlayed: prev.trisGamesPlayed + (mode === 'tris' ? 1 : 0),
        trisGamesWon: prev.trisGamesWon + (mode === 'tris' && wonTris ? 1 : 0),
      };
    });
  };

  const handleResetProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const fresh: UserProgress = {
      currentLevel: 1,
      highestLevelReached: 1,
      stars: 0,
      gems: 10,
      streakDays: 1,
      lastPlayedDate: today,
      categoryStats: {
        logic: { correct: 0, total: 0, attempts: 0, assistedSuccesses: 0, hintsUsed: 0 },
        letters: { correct: 0, total: 0, attempts: 0, assistedSuccesses: 0, hintsUsed: 0 },
        numbers: { correct: 0, total: 0, attempts: 0, assistedSuccesses: 0, hintsUsed: 0 },
        shapes: { correct: 0, total: 0, attempts: 0, assistedSuccesses: 0, hintsUsed: 0 },
        music: { correct: 0, total: 0, attempts: 0, assistedSuccesses: 0, hintsUsed: 0 },
        english: { correct: 0, total: 0, attempts: 0, assistedSuccesses: 0, hintsUsed: 0 },
      },
      trisGamesPlayed: 0,
      trisGamesWon: 0,
      soundEnabled: true,
      voiceEnabled: true,
      musicEnabled: true,
      totalPuzzlesSolved: 0,
      totalAttempts: 0,
      dailyRewardClaimed: false,
      savedDrawings: [],
      completedPuzzleIds: [],
      levelHistory: [],
      evaluationSnapshots: [],
      sessionsCount: 1,
      sessionDates: [today],
      annualProgressRows: [],
    };
    const syncedFresh = syncAnnualAndMonthlyProgress(fresh);
    setProgress(syncedFresh);
    saveUserProgress(syncedFresh);
    soundManager.speak('Progressi azzerati! Si riparte dal primo livello con gioia!');
  };

  // Every 10 levels (Level 10, 20, 30...) is a Svago Level (Tris, Bolle, Memory...)
  const isSvagoLevel = progress.currentLevel % 10 === 0;

  return (
    <div className="fixed inset-0 z-0 h-[100dvh] max-h-[100dvh] w-screen overflow-hidden text-white font-sans select-none flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* IMMERSIVE FULL-SCREEN BACKGROUND WITH AUTHENTIC EMMA PHOTO (100% VISIBLE) */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <img
          src="/assets/aistudio/file_00000000aaf47246b99b88d542f65591_02f69f18.png"
          alt="Emma"
          className={`w-full h-full object-cover object-[65%_48%] transition-all duration-700 ease-out ${
            currentView === 'title'
              ? 'scale-100 brightness-100 contrast-100'
              : 'scale-105 brightness-[0.28] blur-xs'
          }`}
        />
        
        {/* Subtle edge gradients ONLY at top & bottom edges so Emma in the center is 100% visible */}
        {currentView === 'title' ? (
          <>
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#080212]/90 via-[#14062c]/85 to-[#070112]/90" />
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: HOME VIEW - CLEAN TOP TITLE, UNIFIED TAB (LIVELLO STELLINE ANNI   */}
      {/* DATA), TWO COMPACT 3D CLOUDS UNITED BY A RAINBOW, AND BOTTOM PARENTS TAB  */}
      {/* ========================================================================= */}
      {currentView === 'title' && (
        <div className="safe-viewport-pad app-shell-container relative z-10 h-full w-full flex flex-col justify-between px-3 sm:px-6 lg:px-10 py-3 sm:py-5 overflow-hidden">
          
          {/* 1. TOP MODERN FLOATING HEADER & METADATA STRIP */}
          <div className="landscape-header-compact flex flex-col items-center text-center pt-0.5 sm:pt-1 shrink-0">
            <div className="inline-flex flex-col items-center px-5 sm:px-7 py-2.5 sm:py-3 rounded-3xl bg-slate-950/45 backdrop-blur-xl border border-white/25 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.5)]">
              <h1 className="text-2xl sm:text-4xl md:text-[42px] font-fun font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                Il Mondo di <span className="text-amber-300">Emma</span>
              </h1>
              
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-medium text-white/90 tabular-nums">
                <span className="font-semibold text-pink-200">Livello {progress.currentLevel}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{progress.stars} Stelline</span>
                </span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="text-slate-100">5 Anni</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="text-sky-200">22/08/2021</span>
              </div>
            </div>
          </div>

          {/* 2. CENTER: COMPLETELY OPEN TO SHOW EMMA (TAP TO HEAR EMMA) */}
          <div 
            onClick={() => {
              soundManager.playTwinkle();
              soundManager.speakPraise('Evviva Emma! Benvenuta nel tuo mondo magico! Giochiamo insieme!');
            }}
            className="flex-1 w-full flex items-center justify-center cursor-pointer my-auto min-h-[80px]"
            title="Tocca Emma per un saluto magico!"
          >
            {/* Open center area - Emma's photo is 100% visible and unblocked */}
          </div>

          {/* 3. BOTTOM DOCK: TWO MODERN NEO-GLASS ACTION CARDS UNITED BY A LUMINOUS RAINBOW + AREA GENITORI */}
          <div className="home-landscape-dock w-full flex flex-col items-center shrink-0 gap-2 sm:gap-2.5">
            
            {/* TWO MODERN TACTILE CARDS CONNECTED BY A LUMINOUS RAINBOW ARCH */}
            <div className="relative w-full max-w-[380px] sm:max-w-[440px] pt-5 sm:pt-6 pb-1 flex items-stretch justify-between gap-3 sm:gap-4 mx-auto">
              
              {/* Luminous Rainbow Arch connecting Left Card and Right Card */}
              <svg
                viewBox="0 0 280 95"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-16 sm:h-19 pointer-events-none z-0 animate-rainbow-glow"
                fill="none"
              >
                <path d="M 28 84 A 112 72 0 0 1 252 84" stroke="#fb7185" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 34 84 A 106 66 0 0 1 246 84" stroke="#fb923c" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 40 84 A 100 60 0 0 1 240 84" stroke="#facc15" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 46 84 A 94 54 0 0 1 234 84" stroke="#34d399" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 52 84 A 88 48 0 0 1 228 84" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 58 84 A 82 42 0 0 1 222 84" stroke="#a78bfa" strokeWidth="5.5" strokeLinecap="round" />
              </svg>

              {/* LEFT CARD: "INIZIA GIOCO" */}
              <button
                onClick={handleStartGame}
                className="cloud-3d-btn cloud-3d-play relative z-10 flex-1 py-2.5 sm:py-3 px-3.5 flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-left"
                title="Inizia a Giocare!"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 border border-white/80 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white ml-0.5" />
                </div>
                <div className="min-w-0">
                  <span className="block font-fun font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                    Inizia Gioco
                  </span>
                  <span className="block text-[11px] sm:text-xs font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                    Livello {progress.currentLevel}
                  </span>
                </div>
              </button>

              {/* RIGHT CARD: "STUDIO DISEGNO" */}
              <button
                onClick={handleOpenStudio}
                className="cloud-3d-btn cloud-3d-draw relative z-10 flex-1 py-2.5 sm:py-3 px-3.5 flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-left"
                title="Apri Studio Disegno!"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 border border-white/80 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="block font-fun font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                    Studio Disegno
                  </span>
                  <span className="block text-[11px] sm:text-xs font-semibold text-purple-700 whitespace-nowrap">
                    Colora & Crea
                  </span>
                </div>
              </button>
            </div>

            {/* BOTTOM-MOST BAR: AREA GENITORI (RELAZIONE PEDAGOGICA, PROFILO CHC & REPORT PDF) */}
            <button
              onClick={() => {
                soundManager.playPop();
                setIsParentsOpen(true);
              }}
              className="w-full max-w-[380px] sm:max-w-[440px] mx-auto flex items-center justify-between gap-2.5 py-2.5 px-4 bg-slate-950/65 hover:bg-slate-950/80 active:scale-98 backdrop-blur-xl rounded-2xl border border-white/25 text-xs font-semibold text-white shadow-xl cursor-pointer transition-all min-h-[42px]"
              title="Apri Area Genitori, Valutazione Competenze CHC e Scarica Report PDF"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="text-slate-100 truncate">Area Genitori · Profilo CHC & Report PDF</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 shrink-0">
                <span>Apri</span>
                <FileDown className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ACTIVE GAMEPLAY FLOW (PUZZLE ARENA OR SVAGO ARENA)              */}
      {/* ========================================================================= */}
      {currentView === 'play' && (
        <>
          {isSvagoLevel ? (
            <SvagoArena
              levelNumber={progress.currentLevel}
              onComplete={handleSvagoComplete}
              onExitToTitle={() => setCurrentView('title')}
            />
          ) : (
            <PlayArena
              progress={progress}
              onSolveLevel={handleSolveLevel}
              onOpenParents={() => setIsParentsOpen(true)}
              onExitToTitle={() => setCurrentView('title')}
            />
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: STUDIO DISEGNO (WHITE CANVAS & MAGIC BRUSHES FOR EMMA)            */}
      {/* ========================================================================= */}
      {currentView === 'studio' && (
        <StudioDisegno
          onSaveDrawing={handleSaveDrawing}
          onClose={() => setCurrentView('title')}
          progress={progress}
        />
      )}

      {/* ========================================================================= */}
      {/* PARENTS AREA MODAL (PEDAGOGICAL EVALUATION, CHARTS & DOWNLOAD PDF REPORT) */}
      {/* ========================================================================= */}
      {isParentsOpen && (
        <ParentModal
          progress={progress}
          onUpdateAudio={(sound, voice) => {
            updateProgress(prev => ({
              ...prev,
              soundEnabled: sound,
              voiceEnabled: voice,
            }));
          }}
          onResetProgress={handleResetProgress}
          onClose={() => setIsParentsOpen(false)}
        />
      )}
    </div>
  );
}
