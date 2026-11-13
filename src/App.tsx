import React, { useState, useEffect } from 'react';
import { GameCategory, UserProgress, SavedDrawing } from './types/game';
import { loadUserProgress, saveUserProgress } from './data/gameData';
import { PlayArena } from './components/PlayArena';
import { SvagoArena } from './components/SvagoArena';
import { StudioDisegno } from './components/StudioDisegno';
import { ParentModal } from './components/ParentModal';
import { soundManager } from './utils/audio';
import { confetti } from './utils/confetti';
import { 
  Play, 
  Star, 
  ShieldCheck, 
  Palette,
  FileDown
} from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(loadUserProgress);
  const [currentView, setCurrentView] = useState<'title' | 'play' | 'studio'>('title');
  const [isParentsOpen, setIsParentsOpen] = useState(false);

  // Sync sound settings to sound manager
  useEffect(() => {
    soundManager.soundEnabled = progress.soundEnabled;
    soundManager.voiceEnabled = progress.voiceEnabled;
  }, [progress.soundEnabled, progress.voiceEnabled]);

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
    isFirstTry: boolean
  ) => {
    updateProgress(prev => {
      const nextLevel = prev.currentLevel + 1;
      const highest = Math.max(prev.highestLevelReached, nextLevel);
      const prevCat = prev.categoryStats[category] || { correct: 0, total: 0 };

      return {
        ...prev,
        currentLevel: nextLevel,
        highestLevelReached: highest,
        stars: prev.stars + stars,
        gems: prev.gems + gems,
        totalPuzzlesSolved: prev.totalPuzzlesSolved + 1,
        totalAttempts: prev.totalAttempts + 1,
        categoryStats: {
          ...prev.categoryStats,
          [category]: {
            correct: prevCat.correct + (isFirstTry ? 1 : 0),
            total: prevCat.total + 1,
          },
        },
      };
    });
  };

  const handleTrisComplete = () => {
    updateProgress(prev => {
      const nextLevel = prev.currentLevel + 1;
      return {
        ...prev,
        currentLevel: nextLevel,
        highestLevelReached: Math.max(prev.highestLevelReached, nextLevel),
        stars: prev.stars + 3,
        gems: prev.gems + 5,
        trisGamesPlayed: prev.trisGamesPlayed + 1,
        trisGamesWon: prev.trisGamesWon + 1,
      };
    });
  };

  const handleResetProgress = () => {
    const fresh: UserProgress = {
      currentLevel: 1,
      highestLevelReached: 1,
      stars: 0,
      gems: 10,
      streakDays: 1,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      categoryStats: {
        logic: { correct: 0, total: 0 },
        letters: { correct: 0, total: 0 },
        numbers: { correct: 0, total: 0 },
        shapes: { correct: 0, total: 0 },
        music: { correct: 0, total: 0 },
        english: { correct: 0, total: 0 },
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
    };
    setProgress(fresh);
    saveUserProgress(fresh);
    soundManager.speak('Progressi azzerati! Si riparte dal primo livello con gioia!', 1.2);
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
            <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#080212]/90 via-[#14062c]/85 to-[#070112]/90" />
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: HOME VIEW - CLEAN TOP TITLE, UNIFIED TAB (LIVELLO STELLINE ANNI   */}
      {/* DATA), EMMA PHOTO 100% VISIBLE, AND BOTTOM PARENTS TAB                    */}
      {/* ========================================================================= */}
      {currentView === 'title' && (
        <div className="relative z-10 h-full w-full flex flex-col justify-between p-3 sm:p-5 max-w-lg mx-auto overflow-hidden">
          
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

          {/* 3. BOTTOM ACTION CONTROLS + TAB GENITORI AT THE VERY BOTTOM */}
          <div className="w-full flex flex-col items-center shrink-0 space-y-2.5">
            {/* PRIMARY BUTTON 1: VOLUMETRIC 3D TOY "INIZIA A GIOCARE!" */}
            <button
              onClick={handleStartGame}
              className="btn-3d-emerald btn-chunky w-full py-4 sm:py-4.5 px-6 active:scale-95 text-slate-950 font-kids font-extrabold text-xl sm:text-2xl rounded-3xl flex items-center justify-center gap-3 cursor-pointer tracking-wide shadow-2xl"
            >
              <Play className="w-7 h-7 fill-slate-950 shrink-0 animate-pulse" />
              <span>INIZIA A GIOCARE! ➔</span>
            </button>

            {/* PRIMARY BUTTON 2: VOLUMETRIC 3D TOY "STUDIO DISEGNO" */}
            <button
              onClick={handleOpenStudio}
              className="btn-3d-purple btn-chunky w-full py-3 sm:py-3.5 px-5 active:scale-95 text-white font-kids font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              <Palette className="w-5 h-5 text-yellow-300 shrink-0" />
              <span>🎨 STUDIO DISEGNO MAGICO ✨</span>
            </button>

            {/* BOTTOM-MOST TAB: TAB GENITORI (RELAZIONE PEDAGOGICA, QI & REPORT PDF) */}
            <button
              onClick={() => {
                soundManager.playPop();
                setIsParentsOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-black/65 hover:bg-black/80 active:scale-98 backdrop-blur-md rounded-2xl border border-pink-300/45 text-xs sm:text-sm font-kids font-bold text-white shadow-xl cursor-pointer transition-all"
              title="Apri Area Genitori, Valutazione QI e Scarica Report PDF"
            >
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="text-pink-100">AREA GENITORI · RELAZIONE, QI & REPORT PDF</span>
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
              onComplete={handleTrisComplete}
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
