import React, { useState, useEffect } from 'react';
import { GameCategory, UserProgress, SavedDrawing } from './types/game';
import { loadUserProgress, saveUserProgress } from './data/gameData';
import { EmmaCharacter } from './components/EmmaCharacter';
import { PlayArena } from './components/PlayArena';
import { SvagoArena } from './components/SvagoArena';
import { StudioDisegno } from './components/StudioDisegno';
import { ParentModal } from './components/ParentModal';
import { soundManager } from './utils/audio';
import { confetti } from './utils/confetti';
import { getEmmaCurrentAge } from './utils/infiniteLevels';
import { 
  Play, 
  Star, 
  ShieldCheck, 
  Sparkles,
  Palette,
  Music,
  VolumeX
} from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(loadUserProgress);
  const [currentView, setCurrentView] = useState<'title' | 'play' | 'studio'>('title');
  const [isParentsOpen, setIsParentsOpen] = useState(false);

  // Sync sound and background music settings to sound manager
  useEffect(() => {
    soundManager.soundEnabled = progress.soundEnabled;
    soundManager.voiceEnabled = progress.voiceEnabled;
    soundManager.musicEnabled = progress.musicEnabled;
    if (progress.musicEnabled) {
      soundManager.startMusic();
    } else {
      soundManager.stopMusic();
    }
  }, [progress.soundEnabled, progress.voiceEnabled, progress.musicEnabled]);

  const updateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress(prev => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  };

  const ageInfo = getEmmaCurrentAge();

  const handleStartGame = () => {
    soundManager.playSuccess();
    confetti.burst();
    setCurrentView('play');
    // Let PlayArena deliver the warm welcome and instructions smoothly without audio collisions
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
      },
      trisGamesPlayed: 0,
      trisGamesWon: 0,
      soundEnabled: true,
      voiceEnabled: true,
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
          className={`w-full h-full object-cover object-[60%_35%] landscape:object-[72%_30%] transition-all duration-700 ease-out ${
            currentView === 'title'
              ? 'scale-100 brightness-100 contrast-100'
              : 'scale-105 brightness-[0.25] blur-xs'
          }`}
        />
        
        {/* Soft edge gradients ONLY at very top & bottom edges so Emma in the center is 100% visible */}
        {currentView === 'title' ? (
          <>
            <div className="absolute top-0 inset-x-0 h-24 sm:h-32 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-40 sm:h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#080212]/95 via-[#14062c]/90 to-[#070112]/95" />
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: HOME VIEW - RESPONSIVE FOR SMARTPHONE & TABLET (PORTRAIT & LANDSCAPE) */}
      {/* ========================================================================= */}
      {currentView === 'title' && (
        <div className="relative z-10 h-full w-full flex flex-col justify-between p-3 sm:p-5 landscape:flex-row landscape:items-center landscape:justify-between landscape:max-w-5xl landscape:p-4 sm:landscape:p-6 landscape:gap-6 max-w-lg mx-auto overflow-hidden">
          
          {/* FLOATING MUSIC TOGGLE BUTTON (ACCESSIBLE IN ALL SCREEN SIZES & ORIENTATIONS) */}
          <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playPop();
                const nextState = soundManager.toggleMusic();
                updateProgress(prev => ({ ...prev, musicEnabled: nextState }));
              }}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5 backdrop-blur-md ${
                progress.musicEnabled
                  ? 'bg-amber-400/90 hover:bg-amber-400 border-amber-200 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-300/40'
                  : 'bg-black/55 hover:bg-black/75 border-white/25 text-slate-300'
              }`}
              title={progress.musicEnabled ? 'Disattiva musica rilassante' : 'Attiva musica rilassante'}
            >
              {progress.musicEnabled ? (
                <>
                  <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 animate-bounce" />
                  <span className="text-[11px] sm:text-xs font-kids font-bold">Musica 🎵</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  <span className="text-[11px] sm:text-xs font-kids font-bold">Musica 🔇</span>
                </>
              )}
            </button>
          </div>

          {/* 1. TITLE & MILESTONE (LEFT COLUMN IN LANDSCAPE / TOP IN PORTRAIT) */}
          <div className="flex flex-col items-center landscape:items-start text-center landscape:text-left pt-2 sm:pt-4 landscape:pt-0 shrink-0 landscape:w-[46%]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl landscape:text-2xl lg:landscape:text-4xl font-kids font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              Il Mondo di <span className="text-yellow-300 drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]">Emma</span> 🌸
            </h1>
            
            <div className="mt-1.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white font-kids text-xs font-bold shadow-lg">
              <span className="text-pink-300">👑 Livello {progress.currentLevel}</span>
              <span className="text-white/40">·</span>
              <span className="text-yellow-200 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {progress.stars} Stelle
              </span>
            </div>

            {/* In Landscape on Smartphone & Tablet: Action Buttons sit directly under the title in this column! */}
            <div className="hidden landscape:flex flex-col w-full mt-3 sm:mt-4 space-y-2">
              <button
                onClick={handleStartGame}
                className="btn-3d-emerald btn-chunky w-full py-2.5 sm:py-3.5 px-4 sm:px-5 active:scale-95 text-slate-950 font-kids font-extrabold text-base sm:text-xl rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer tracking-wide shadow-xl"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 shrink-0 animate-pulse" />
                <span>INIZIA A GIOCARE! ➔</span>
              </button>

              <button
                onClick={handleOpenStudio}
                className="btn-3d-purple btn-chunky w-full py-2 sm:py-2.5 px-3.5 sm:px-4 active:scale-95 text-white font-kids font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Palette className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>🎨 STUDIO DISEGNO MAGICO ✨</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playPop();
                  setIsParentsOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 px-3 bg-black/55 hover:bg-black/75 backdrop-blur-md rounded-xl border border-white/25 text-xs font-fun font-bold text-slate-200 hover:text-white shadow-md cursor-pointer active:scale-98 transition-all"
                title="Area Genitori & Relazione Pedagogica"
              >
                <ShieldCheck className="w-4 h-4 text-pink-300" />
                <span>Area Genitori & Relazione 🛡️</span>
              </button>
            </div>
          </div>

          {/* 2. CENTER IN PORTRAIT / RIGHT IN LANDSCAPE: 100% UNOBSTRUCTED VIEW OF EMMA (TAP TO HEAR EMMA) */}
          <div 
            onClick={() => {
              soundManager.playTwinkle();
              soundManager.speakPraise('Evviva Emma! Benvenuta nel tuo mondo magico! Giochiamo insieme!');
            }}
            className="flex-1 w-full landscape:w-[50%] h-full flex items-center justify-center cursor-pointer my-auto"
            title="Tocca Emma per un saluto magico!"
          >
            {/* Open center / right area - Emma's photo is 100% visible and unblocked */}
          </div>

          {/* 3. BOTTOM ACTION CONTROLS IN PORTRAIT (Hidden in landscape since they are placed in the left column) */}
          <div className="w-full flex flex-col items-center shrink-0 space-y-2.5 landscape:hidden">
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

            {/* AREA GENITORI - SOSTITUISCE COMPLETAMENTE IL VECCHIO BANNER DEI RISULTATI */}
            <button
              onClick={() => {
                soundManager.playPop();
                setIsParentsOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black/55 hover:bg-black/75 backdrop-blur-md rounded-2xl border border-white/25 text-xs sm:text-sm font-fun font-bold text-slate-200 hover:text-white shadow-lg cursor-pointer active:scale-98 transition-all"
              title="Area Genitori & Relazione Pedagogica"
            >
              <ShieldCheck className="w-4 h-4 text-pink-300" />
              <span>Area Genitori & Relazione Pedagogica 🛡️</span>
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
      {/* PARENTS AREA MODAL (PEDAGOGICAL EVALUATION, CHARTS & DOWNLOAD REPORT)     */}
      {/* ========================================================================= */}
      {isParentsOpen && (
        <ParentModal
          progress={progress}
          onUpdateAudio={(sound, voice, music) => {
            updateProgress(prev => ({
              ...prev,
              soundEnabled: sound,
              voiceEnabled: voice,
              musicEnabled: music !== undefined ? music : prev.musicEnabled,
            }));
          }}
          onResetProgress={handleResetProgress}
          onClose={() => setIsParentsOpen(false)}
        />
      )}
    </div>
  );
}
