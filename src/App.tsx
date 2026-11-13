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
        <div className="safe-viewport-pad relative z-10 h-full w-full flex flex-col justify-between p-3 sm:p-5 max-w-md sm:max-w-xl md:max-w-2xl mx-auto overflow-hidden">
          
          {/* 1. TOP FLOATING TITLE & UNIFIED MILESTONE TAB (LIVELLO · STELLINE · ANNI · DATA) */}
          <div className="flex flex-col items-center text-center pt-1 shrink-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-kids font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              Il Mondo di <span className="text-yellow-300 drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]">Emma</span> 🌸
            </h1>
            
            <div className="mt-1.5 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/35 text-white font-kids text-xs sm:text-sm font-bold shadow-lg">
              <span className="text-pink-300">👑 Livello {progress.currentLevel}</span>
              <span className="text-white/40">·</span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                <span>{progress.stars}</span>
              </span>
              <span className="text-white/40">·</span>
              <span className="text-yellow-200">5 Anni</span>
              <span className="text-white/40">·</span>
              <span className="text-cyan-200">22/08/2021</span>
            </div>
          </div>

          {/* 2. CENTER: COMPLETELY OPEN TO SHOW EMMA (TAP TO HEAR EMMA) */}
          <div 
            onClick={() => {
              soundManager.playTwinkle();
              soundManager.speakPraise('Evviva Emma! Benvenuta nel tuo mondo magico! Giochiamo insieme!');
            }}
            className="flex-1 w-full flex items-center justify-center cursor-pointer my-auto"
            title="Tocca Emma per un saluto magico!"
          >
            {/* Open center area - Emma's photo is 100% visible and unblocked */}
          </div>

          {/* 3. BOTTOM DOCK: TWO COMPACT 3D CLOUDS UNITED BY A RAINBOW + TAB GENITORI */}
          <div className="w-full flex flex-col items-center shrink-0 space-y-2.5">
            
            {/* TWO 3D FLUFFY CLOUDS UNITED BY AN ENCHANTED 3D RAINBOW BRIDGE */}
            <div className="relative w-full max-w-[360px] pt-6 pb-1 flex items-center justify-between gap-4">
              
              {/* 3D SVG Rainbow Arch connecting Cloud 1 and Cloud 2 */}
              <svg
                viewBox="0 0 280 95"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[82%] h-20 pointer-events-none z-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)] animate-rainbow-glow"
                fill="none"
              >
                {/* 6 Vivid Rainbow Bands Arching from Left Cloud to Right Cloud */}
                <path d="M 28 84 A 112 72 0 0 1 252 84" stroke="#ef4444" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 34 84 A 106 66 0 0 1 246 84" stroke="#f97316" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 40 84 A 100 60 0 0 1 240 84" stroke="#facc15" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 46 84 A 94 54 0 0 1 234 84" stroke="#22c55e" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 52 84 A 88 48 0 0 1 228 84" stroke="#38bdf8" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 58 84 A 82 42 0 0 1 222 84" stroke="#a855f7" strokeWidth="6.5" strokeLinecap="round" />
                {/* Little Golden Sparkles on the Rainbow Bridge */}
                <circle cx="140" cy="14" r="3.5" fill="#fef08a" />
                <circle cx="90" cy="26" r="2.5" fill="#ffffff" />
                <circle cx="190" cy="26" r="2.5" fill="#ffffff" />
              </svg>

              {/* LEFT 3D CLOUD: "INIZIA A GIOCARE" */}
              <button
                onClick={handleStartGame}
                className="cloud-3d-btn cloud-3d-play relative z-10 flex-1 py-2.5 px-3 flex flex-col items-center justify-center cursor-pointer group"
                title="Inizia a Giocare!"
              >
                {/* Sculpted Fluffy Cloud Puffs on Top */}
                <span className="absolute -top-3 left-4 w-8 h-6 rounded-full bg-white border-t-2 border-white shadow-inner pointer-events-none" />
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-11 h-8 rounded-full bg-white border-t-2 border-white shadow-inner pointer-events-none" />
                <span className="absolute -top-2.5 right-4 w-7 h-5 rounded-full bg-white border-t-2 border-white pointer-events-none" />

                <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 border-2 border-white shadow-md flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </div>
                <span className="relative z-10 font-kids font-extrabold text-xs sm:text-sm text-emerald-950 tracking-tight leading-tight drop-shadow-xs">
                  Inizia Gioco
                </span>
                <span className="relative z-10 text-[10px] font-fun font-bold text-emerald-800">
                  Livello {progress.currentLevel} ✨
                </span>
              </button>

              {/* RIGHT 3D CLOUD: "STUDIO DISEGNO" */}
              <button
                onClick={handleOpenStudio}
                className="cloud-3d-btn cloud-3d-draw relative z-10 flex-1 py-2.5 px-3 flex flex-col items-center justify-center cursor-pointer group"
                title="Apri Studio Disegno!"
              >
                {/* Sculpted Fluffy Cloud Puffs on Top */}
                <span className="absolute -top-2.5 left-4 w-7 h-5 rounded-full bg-white border-t-2 border-white pointer-events-none" />
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-11 h-8 rounded-full bg-white border-t-2 border-white shadow-inner pointer-events-none" />
                <span className="absolute -top-3 right-4 w-8 h-6 rounded-full bg-white border-t-2 border-white shadow-inner pointer-events-none" />

                <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-b from-purple-400 to-fuchsia-600 border-2 border-white shadow-md flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                  <Palette className="w-5 h-5 text-yellow-200" />
                </div>
                <span className="relative z-10 font-kids font-extrabold text-xs sm:text-sm text-purple-950 tracking-tight leading-tight drop-shadow-xs">
                  Studio Disegno
                </span>
                <span className="relative z-10 text-[10px] font-fun font-bold text-purple-800">
                  Colora & Crea 🎨
                </span>
              </button>
            </div>

            {/* BOTTOM-MOST TAB: TAB GENITORI (RELAZIONE PEDAGOGICA, PROFILO CHC & REPORT PDF) */}
            <button
              onClick={() => {
                soundManager.playPop();
                setIsParentsOpen(true);
              }}
              className="w-full max-w-[360px] flex items-center justify-center gap-2 py-2 px-4 bg-black/65 hover:bg-black/80 active:scale-98 backdrop-blur-md rounded-full border border-pink-300/45 text-[11px] sm:text-xs font-kids font-bold text-white shadow-xl cursor-pointer transition-all"
              title="Apri Area Genitori, Valutazione Competenze CHC e Scarica Report PDF"
            >
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="text-pink-100 truncate">AREA GENITORI · RELAZIONE, PROFILO CHC & REPORT PDF</span>
              <FileDown className="w-4 h-4 text-yellow-300 shrink-0" />
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
