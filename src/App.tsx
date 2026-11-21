import React, { useState, useEffect, useMemo } from 'react';
import {
  ChildProfile,
  GameCategory,
  PuzzleType,
  UserProgress,
  SavedDrawing,
} from './types/game';
import { loadUserProgress, saveUserProgress } from './data/gameData';
import { PlayArena } from './components/PlayArena';
import { SvagoArena } from './components/SvagoArena';
import { StudioDisegno } from './components/StudioDisegno';
import { ParentModal } from './components/ParentModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { soundManager } from './utils/audio';
import { confetti } from './utils/confetti';
import {
  calculateChildAge,
  getDisplayChildName,
  getGenderedWord,
  getWorldTitle,
} from './utils/childProfile';
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
  FileDown,
  Camera,
  UserRoundCog,
} from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() =>
    syncAnnualAndMonthlyProgress(loadUserProgress())
  );
  const [currentView, setCurrentView] = useState<'title' | 'play' | 'studio'>('title');
  const [isParentsOpen, setIsParentsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const childProfile = progress.childProfile;
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const worldTitle = useMemo(() => getWorldTitle(childProfile), [childProfile]);
  const childName = useMemo(() => getDisplayChildName(childProfile), [childProfile]);
  const shouldShowProfileModal = !childProfile?.isConfigured || isProfileModalOpen;

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

  const handleSaveProfile = (nextProfile: ChildProfile) => {
    updateProgress((prev) => {
      const birthDateChanged = prev.childProfile?.birthDate !== nextProfile.birthDate;
      const updated: UserProgress = {
        ...prev,
        childProfile: {
          ...nextProfile,
          isConfigured: true,
        },
        annualProgressRows: birthDateChanged ? [] : prev.annualProgressRows,
      };
      return syncAnnualAndMonthlyProgress(updated);
    });
    setIsProfileModalOpen(false);
    soundManager.playFanfare();
    confetti.burst(undefined, undefined, 24);
    const welcomeWord = getGenderedWord(
      nextProfile.gender,
      'Benvenuta',
      'Benvenuto',
      'Benvenuto'
    );
    const display = getDisplayChildName(nextProfile);
    soundManager.speakPraise(
      `Evviva ${display}! ${welcomeWord} nel tuo mondo! Livelli e materie sono subito pronti per la tua età!`
    );
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
      childProfile: progress.childProfile,
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
  const hasCustomBackground = Boolean(childProfile?.customBackgroundUrl);

  return (
    <div className="fixed inset-0 z-0 h-[100dvh] max-h-[100dvh] w-screen overflow-hidden text-white font-sans select-none flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* FULL-SCREEN CUSTOMIZABLE BACKGROUND (CHILD PHOTO OR ILLUSTRATED SKY)      */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {hasCustomBackground ? (
          <img
            src={childProfile.customBackgroundUrl}
            alt={childName}
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              currentView === 'title'
                ? 'scale-100 brightness-100 contrast-100'
                : 'scale-105 brightness-[0.28] blur-xs'
            }`}
          />
        ) : (
          <div
            className={`w-full h-full relative transition-all duration-700 ease-out ${
              currentView === 'title'
                ? 'bg-gradient-to-b from-[#1e1b4b] via-[#312e81] via-45% to-[#0f172a]'
                : 'bg-gradient-to-b from-[#080212] via-[#14062c] to-[#070112]'
            }`}
          >
            {/* Joyful luminous sky aurora orbs for default generic backdrop */}
            <div className="absolute -top-24 -left-20 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full bg-sky-400/25 blur-3xl" />
            <div className="absolute top-1/4 -right-24 w-72 h-72 sm:w-[420px] sm:h-[420px] rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute bottom-16 left-1/4 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl" />
            {/* Subtle decorative stars */}
            <div className="absolute top-[16%] left-[12%] text-amber-200/50 text-lg animate-pulse">✦</div>
            <div className="absolute top-[22%] right-[16%] text-sky-200/50 text-xl animate-pulse">✦</div>
            <div className="absolute top-[42%] left-[8%] text-pink-200/40 text-sm">★</div>
            <div className="absolute top-[38%] right-[10%] text-amber-200/45 text-base">★</div>
          </div>
        )}
        
        {/* Subtle edge gradients at top & bottom edges so center photo / emblem stays 100% clear */}
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
      {/* VIEW 1: HOME VIEW - DYNAMIC TITLE, AGE-ADAPTED STATS & ACTION DOCK        */}
      {/* ========================================================================= */}
      {currentView === 'title' && (
        <div className="safe-viewport-pad app-shell-container relative z-10 h-full w-full flex flex-col justify-between px-3 sm:px-6 lg:px-10 py-3 sm:py-5 overflow-hidden">
          
          {/* 1. TOP MODERN FLOATING HEADER & METADATA STRIP */}
          <div className="landscape-header-compact flex flex-col items-center text-center pt-0.5 sm:pt-1 shrink-0">
            <div className="inline-flex flex-col items-center px-5 sm:px-7 py-2.5 sm:py-3 rounded-3xl bg-slate-950/50 backdrop-blur-xl border border-white/25 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.5)] max-w-full">
              <h1 className="text-2xl sm:text-4xl md:text-[42px] font-fun font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                {worldTitle.childName ? (
                  <>
                    {worldTitle.prefix}
                    <span className="text-amber-300">{worldTitle.childName}</span>
                  </>
                ) : (
                  <>
                    Il Mio <span className="text-amber-300">Mondo</span>
                  </>
                )}
              </h1>
              
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs sm:text-sm font-medium text-white/90 tabular-nums">
                <span className="font-semibold text-pink-200">Livello {progress.currentLevel}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{progress.stars} Stelline</span>
                </span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="text-slate-100">{ageInfo.shortAgeLabel}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="text-sky-200">{ageInfo.birthDateFormatted}</span>
                <span className="hidden sm:inline text-white/40" aria-hidden="true">·</span>
                <span className="hidden sm:inline text-emerald-200 font-semibold">
                  {ageInfo.ageBandTitle}
                </span>
              </div>
            </div>
          </div>

          {/* 2. CENTER: OPEN FOR UPLOADED PHOTO, OR JOYFUL ILLUSTRATED EMBLEM IF NO PHOTO YET */}
          <div
            onClick={() => {
              soundManager.playTwinkle();
              const welcomeWord = getGenderedWord(
                childProfile?.gender || 'n',
                'Benvenuta',
                'Benvenuto',
                'Benvenuto'
              );
              soundManager.speakPraise(
                `Evviva ${childName}! ${welcomeWord} nel tuo mondo magico! Giochiamo insieme!`
              );
            }}
            className="flex-1 w-full flex flex-col items-center justify-center cursor-pointer my-auto min-h-[80px] gap-3"
            title={`Tocca per un saluto a ${childName}!`}
          >
            {!hasCustomBackground && (
              <div className="flex flex-col items-center gap-2.5 animate-fade-in">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[30px] overflow-hidden border-2 border-white/40 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.7)] bg-slate-900/40 backdrop-blur-md">
                  <img
                    src="/pwa-512x512.png"
                    alt="Il Mio Mondo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playPop();
                    setIsProfileModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 text-xs sm:text-sm font-fun font-bold text-white shadow-lg cursor-pointer transition-all min-h-[40px]"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>Personalizza sfondo con una foto</span>
                </button>
              </div>
            )}
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

            {/* BOTTOM-MOST CONTROLS: AREA GENITORI + PROFILO & SFONDO */}
            <div className="w-full max-w-[380px] sm:max-w-[440px] mx-auto flex items-stretch gap-2">
              <button
                onClick={() => {
                  soundManager.playPop();
                  setIsParentsOpen(true);
                }}
                className="flex-1 min-w-0 flex items-center justify-between gap-2 py-2.5 px-3.5 bg-slate-950/65 hover:bg-slate-950/80 active:scale-98 backdrop-blur-xl rounded-2xl border border-white/25 text-xs font-semibold text-white shadow-xl cursor-pointer transition-all min-h-[44px]"
                title="Apri Area Genitori, Valutazione Competenze CHC e Scarica Report PDF"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="text-slate-100 truncate">Area Genitori · Report PDF</span>
                </span>
                <FileDown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              </button>

              <button
                onClick={() => {
                  soundManager.playPop();
                  setIsProfileModalOpen(true);
                }}
                className="shrink-0 flex items-center gap-1.5 py-2.5 px-3.5 bg-indigo-950/75 hover:bg-indigo-900/85 active:scale-98 backdrop-blur-xl rounded-2xl border border-indigo-300/35 text-xs font-semibold text-white shadow-xl cursor-pointer transition-all min-h-[44px]"
                title="Modifica nome, data di nascita e foto di sfondo"
              >
                <UserRoundCog className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="whitespace-nowrap">Profilo & Foto</span>
              </button>
            </div>
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
              childProfile={progress.childProfile}
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
      {/* VIEW 3: STUDIO DISEGNO (WHITE CANVAS & MAGIC BRUSHES)                     */}
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
          onOpenProfile={() => {
            setIsParentsOpen(false);
            setIsProfileModalOpen(true);
          }}
          onResetProgress={handleResetProgress}
          onClose={() => setIsParentsOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* CHILD PROFILE & CUSTOM BACKGROUND PHOTO SETUP MODAL                       */}
      {/* ========================================================================= */}
      {shouldShowProfileModal && (
        <ProfileSetupModal
          initialProfile={childProfile}
          isFirstSetup={!childProfile?.isConfigured}
          onSave={handleSaveProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </div>
  );
}
