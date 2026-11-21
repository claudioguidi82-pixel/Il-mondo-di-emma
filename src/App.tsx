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
import { ZooParlanteStudio } from './components/ZooParlanteStudio';
import { ParentModal } from './components/ParentModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { TreasureAlbumModal } from './components/TreasureAlbumModal';
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
  CollectibleSticker,
  DAILY_MISSION_TARGET,
  getDailyMissionStatus,
  getTodayIsoDate,
  pickNextLockedSticker,
} from './utils/motivationEngine';
import {
  Play,
  ShieldCheck,
  FileText,
  Camera,
  UserRound,
  Gift,
  Settings,
  X,
  Volume2,
  VolumeX,
  Music,
  ChevronRight,
} from 'lucide-react';
import homeWorldDiorama from './assets/images/home_world_diorama_1795267242665.jpg';
import treasureChest3d from './assets/images/treasure_chest_3d_1795267243685.jpg';
import zooLion3d from './assets/images/zoo_lion_3d_1795268326883.jpg';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() =>
    syncAnnualAndMonthlyProgress(loadUserProgress())
  );
  const [currentView, setCurrentView] = useState<'title' | 'play' | 'studio' | 'zoo'>('title');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParentsOpen, setIsParentsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);

  const childProfile = progress.childProfile;
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const worldTitle = useMemo(() => getWorldTitle(childProfile), [childProfile]);
  const childName = useMemo(() => getDisplayChildName(childProfile), [childProfile]);
  const dailyMission = useMemo(() => getDailyMissionStatus(progress), [progress]);
  const shouldShowProfileModal = !childProfile?.isConfigured || isProfileModalOpen;

  // Sync sound settings and child grammatical/age context to sound manager
  useEffect(() => {
    soundManager.soundEnabled = progress.soundEnabled;
    soundManager.voiceEnabled = progress.voiceEnabled;
    soundManager.musicEnabled = progress.musicEnabled;
    soundManager.setChildContext(childProfile?.gender, childName, ageInfo.years);
    if (!progress.soundEnabled || !progress.musicEnabled) {
      soundManager.stopBackgroundMusic();
    }
  }, [
    progress.soundEnabled,
    progress.voiceEnabled,
    progress.musicEnabled,
    childProfile?.gender,
    childName,
    ageInfo.years,
  ]);

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

  const handleOpenZoo = () => {
    soundManager.playZooAnimalSound('lion');
    confetti.burst(undefined, undefined, 14);
    setCurrentView('zoo');
  };

  const handleSaveDrawing = (drawing: SavedDrawing) => {
    updateProgress(prev => ({
      ...prev,
      stars: prev.stars + drawing.starsEarned,
      gems: prev.gems + 3,
      savedDrawings: [drawing, ...(prev.savedDrawings || [])],
    }));
  };

  const handleClaimDailyChest = () => {
    const today = getTodayIsoDate();
    updateProgress(prev => {
      if (prev.dailyChestClaimedDate === today) return prev;
      return {
        ...prev,
        dailyChestClaimedDate: today,
        dailyRewardClaimed: true,
        gems: prev.gems + 3,
      };
    });
  };

  const handleUnlockSticker = (sticker: CollectibleSticker) => {
    updateProgress(prev => {
      const current = prev.unlockedStickerIds && prev.unlockedStickerIds.length > 0
        ? prev.unlockedStickerIds
        : ['stk_star'];
      if (current.includes(sticker.id) || prev.gems < sticker.gemCost) {
        return prev;
      }
      return {
        ...prev,
        gems: prev.gems - sticker.gemCost,
        unlockedStickerIds: [...current, sticker.id],
      };
    });
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

      const today = getTodayIsoDate();
      const existingDates = prev.sessionDates || (prev.lastPlayedDate ? [prev.lastPlayedDate] : []);
      const isNewDay = !existingDates.includes(today);
      const nextSessionDates = isNewDay ? [...existingDates, today] : existingDates;
      const nextSessionsCount = (prev.sessionsCount ?? 1) + (isNewDay ? 1 : 0);

      // Update gentle consecutive-day streak
      let nextStreakDays = Math.max(1, prev.streakDays || 1);
      if (prev.lastPlayedDate && prev.lastPlayedDate !== today) {
        const prevMs = new Date(`${prev.lastPlayedDate}T00:00:00Z`).getTime();
        const todayMs = new Date(`${today}T00:00:00Z`).getTime();
        const diffDays = Math.round((todayMs - prevMs) / 86_400_000);
        nextStreakDays = diffDays === 1 ? nextStreakDays + 1 : 1;
      }

      // 5-step gentle daily mini-mission progression & automatic Scrigno bonus
      const prevDailyCount =
        prev.dailyMissionDate === today ? Math.max(0, prev.dailyMissionCount || 0) : 0;
      const nextDailyCount = prevDailyCount + 1;
      const completedMissionCycle = nextDailyCount % DAILY_MISSION_TARGET === 0;
      const missionBonusGems = completedMissionCycle ? 5 : 0;
      const currentStickers =
        prev.unlockedStickerIds && prev.unlockedStickerIds.length > 0
          ? prev.unlockedStickerIds
          : ['stk_star'];
      const autoSticker = completedMissionCycle
        ? pickNextLockedSticker(currentStickers)
        : null;
      const nextUnlockedStickers = autoSticker
        ? [...currentStickers, autoSticker.id]
        : currentStickers;

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
        streakDays: nextStreakDays,
        lastPlayedDate: today,
        sessionsCount: nextSessionsCount,
        sessionDates: nextSessionDates,
        stars: prev.stars + stars,
        gems: prev.gems + gems + missionBonusGems,
        totalPuzzlesSolved: prev.totalPuzzlesSolved + 1,
        totalAttempts: prev.totalAttempts + cleanAttempts,
        dailyMissionDate: today,
        dailyMissionCount: nextDailyCount,
        unlockedStickerIds: nextUnlockedStickers,
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
      parentPinHash: progress.parentPinHash,
      parentPinHint: progress.parentPinHint,
      unlockedStickerIds: ['stk_star'],
      dailyMissionDate: today,
      dailyMissionCount: 0,
      dailyChestClaimedDate: undefined,
    };
    const syncedFresh = syncAnnualAndMonthlyProgress(fresh);
    setProgress(syncedFresh);
    saveUserProgress(syncedFresh);
    soundManager.speak(
      `Progressi azzerati, ${childName}! Si riparte dal primo livello con gioia!`
    );
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
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              currentView === 'title'
                ? 'scale-100 brightness-100 contrast-100'
                : 'scale-105 brightness-[0.28] blur-xs'
            }`}
          />
        ) : (
          <div className="w-full h-full relative bg-gradient-to-b from-[#0ea5e9] via-[#38bdf8] to-[#064e3b]">
            <img
              src={homeWorldDiorama}
              alt="Il Mio Mondo · Isola 3D delle Meraviglie"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
                currentView === 'title'
                  ? 'scale-100 brightness-100 contrast-[1.03]'
                  : 'scale-105 brightness-[0.3] blur-xs'
              }`}
            />
          </div>
        )}
        
        {/* Light edge vignettes so the child's photo / 3D island remains bright and completely unobstructed */}
        {currentView === 'title' ? (
          <>
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950/35 via-slate-950/12 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-slate-950/75 via-slate-950/30 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#080212]/90 via-[#14062c]/85 to-[#070112]/90" />
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: HOME VIEW - CARVED WOODEN TITLE PLAQUE & GLOSSY 3D STORYBOOK DOCK */}
      {/* ========================================================================= */}
      {currentView === 'title' && (
        <div className="safe-viewport-pad app-shell-container relative z-10 h-full w-full flex flex-col justify-between px-3 sm:px-6 lg:px-10 py-2.5 sm:py-5 overflow-hidden">
          
          {/* TOP-RIGHT COMPACT CIRCULAR SETTINGS GEAR (AREA GENITORI + PROFILO & FOTO) */}
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              setIsSettingsOpen(true);
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-6 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#f4ba6d] via-[#d98c3a] to-[#a95c1a] border-2 border-[#fde4ad] shadow-[0_4px_0_#6b3309,0_10px_20px_rgba(15,10,4,0.45),inset_0_2px_3px_rgba(255,248,225,0.85)] flex items-center justify-center cursor-pointer active:translate-y-0.5 hover:brightness-105 transition-all group"
            aria-label="Impostazioni: Area Genitori, Profilo e Audio"
            title="Impostazioni (Area Genitori & Profilo)"
          >
            <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white drop-shadow-[0_2px_2px_rgba(107,51,9,0.75)] group-hover:rotate-45 transition-transform duration-300" />
          </button>

          {/* 1. TOP CARVED HONEY-OAK WOODEN TITLE PLAQUE WITH 3D GOLDEN STARS */}
          <div className="landscape-header-compact flex flex-col items-center text-center pt-1 sm:pt-1.5 pr-11 pl-1 sm:px-14 shrink-0">
            <div className="home-wood-plaque inline-flex flex-col items-center px-3 sm:px-7 pt-2 sm:pt-3 pb-1.5 sm:pb-2.5 max-w-full">
              {/* Left 3D Golden Star Cluster */}
              <svg
                viewBox="0 0 40 40"
                className="w-6 h-6 sm:w-8 sm:h-8 absolute -left-3 top-2.5 drop-shadow-[0_3px_4px_rgba(92,40,6,0.55)] pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="homeStarL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff7a8" />
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <path
                  d="M20 3 L24.8 13.2 L36 14.7 L27.8 22.5 L29.8 33.6 L20 28.2 L10.2 33.6 L12.2 22.5 L4 14.7 L15.2 13.2 Z"
                  fill="url(#homeStarL)"
                  stroke="#9a3412"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                aria-hidden="true"
                className="absolute left-1.5 bottom-3.5 text-[9px] sm:text-[10px] text-amber-200 drop-shadow-xs pointer-events-none"
              >
                ★
              </span>

              {/* Right 3D Golden Star Cluster */}
              <svg
                viewBox="0 0 56 48"
                className="w-9 h-8 sm:w-13 sm:h-11 absolute -right-3 -top-3 drop-shadow-[0_3px_5px_rgba(92,40,6,0.55)] pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="homeStarR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff7a8" />
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                {/* Small top star */}
                <path
                  d="M12 2 L14.4 7.2 L20 8 L15.9 11.9 L16.9 17.5 L12 14.8 L7.1 17.5 L8.1 11.9 L4 8 L9.6 7.2 Z"
                  fill="url(#homeStarR)"
                  stroke="#9a3412"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Main big star */}
                <path
                  d="M34 4 L39.2 14.8 L51 16.4 L42.4 24.7 L44.5 36.4 L34 30.8 L23.5 36.4 L25.6 24.7 L17 16.4 L28.8 14.8 Z"
                  fill="url(#homeStarR)"
                  stroke="#9a3412"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                {/* Lower accent star */}
                <path
                  d="M47 30 L49 34.2 L53.6 34.8 L50.2 38 L51 42.5 L47 40.3 L43 42.5 L43.8 38 L40.4 34.8 L45 34.2 Z"
                  fill="url(#homeStarR)"
                  stroke="#9a3412"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Main Carved Storybook Title */}
              <h1 className="text-[22px] sm:text-4xl font-kids font-bold tracking-tight leading-none px-1.5 sm:px-2">
                {worldTitle.childName ? (
                  <>
                    <span className="home-title-white-3d">{worldTitle.prefix}</span>
                    <span className="home-title-gold-3d">{worldTitle.childName}</span>
                  </>
                ) : (
                  <>
                    <span className="home-title-white-3d">Il Mio </span>
                    <span className="home-title-gold-3d">Mondo</span>
                  </>
                )}
              </h1>

              {/* 4 Recessed Dark-Wood Stat Capsules */}
              <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center justify-center gap-1 sm:gap-2 tabular-nums">
                <span className="home-wood-stat-inset inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-fun font-extrabold text-white whitespace-nowrap">
                  <span aria-hidden="true">🚩</span>
                  <span>Livello {progress.currentLevel}</span>
                </span>
                <span className="home-wood-stat-inset inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-fun font-extrabold text-white whitespace-nowrap">
                  <span aria-hidden="true">⭐</span>
                  <span>{progress.stars}</span>
                </span>
                <span className="home-wood-stat-inset inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-fun font-extrabold text-white whitespace-nowrap">
                  <span aria-hidden="true">💎</span>
                  <span>{progress.gems}</span>
                </span>
                <span className="home-wood-stat-inset inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-fun font-extrabold text-white whitespace-nowrap">
                  <span aria-hidden="true">🎂</span>
                  <span>{ageInfo.shortAgeLabel}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. CENTER: 100% UNOBSTRUCTED CHILD PHOTO OR 3D ISLAND */}
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
            className="flex-1 w-full flex flex-col items-center justify-end pb-2 cursor-pointer my-auto min-h-[64px]"
            title={`Tocca per un saluto a ${childName}!`}
          >
            {!hasCustomBackground && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playPop();
                  setIsProfileModalOpen(true);
                }}
                className="home-wood-outer rounded-2xl p-[3px] cursor-pointer"
              >
                <span className="home-inner-indigo rounded-[13px] px-3.5 py-1.5 inline-flex items-center gap-2 text-xs sm:text-sm font-fun font-bold text-white">
                  <Camera className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="whitespace-nowrap">Personalizza sfondo con una foto</span>
                </span>
              </button>
            )}
          </div>

          {/* 3. BOTTOM STORYBOOK 3D WOOD & CANDY ACTION DOCK */}
          <div className="home-landscape-dock w-full flex flex-col items-center shrink-0 gap-2.5 sm:gap-3 pb-1">
            
            {/* ROW 1: INIZIA GIOCO + STUDIO DISEGNO BRIDGED BY A 3D RAINBOW & GOLDEN STARS */}
            <div className="home-landscape-cards relative w-full max-w-[400px] sm:max-w-[460px] pt-4 sm:pt-5 flex items-stretch justify-between gap-2.5 sm:gap-3.5 mx-auto">
              
              {/* Glossy 3D Rainbow Arch + Golden Stars Overlapping Inner Corners */}
              <svg
                viewBox="0 0 180 78"
                className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 w-[124px] sm:w-[144px] h-[54px] sm:h-[62px] pointer-events-none z-20 drop-shadow-[0_4px_6px_rgba(15,23,42,0.35)]"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="rbStar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff9b3" />
                    <stop offset="55%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                {/* Rainbow Arcs */}
                <path d="M 32 62 A 58 48 0 0 1 148 62" stroke="#ff4d6d" strokeWidth="7" strokeLinecap="round" />
                <path d="M 38 62 A 52 42 0 0 1 142 62" stroke="#ff9f1c" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 44 62 A 46 36 0 0 1 136 62" stroke="#ffe033" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 50 62 A 40 30 0 0 1 130 62" stroke="#34d399" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M 56 62 A 34 24 0 0 1 124 62" stroke="#38bdf8" strokeWidth="6.5" strokeLinecap="round" />
                {/* Specular gloss highlight */}
                <path d="M 44 38 A 54 44 0 0 1 136 38" stroke="rgba(255,255,255,0.45)" strokeWidth="2.4" strokeLinecap="round" />
                {/* Left golden star */}
                <path
                  d="M27 29 L30.2 35.8 L37.6 36.8 L32.2 42 L33.5 49.4 L27 45.8 L20.5 49.4 L21.8 42 L16.4 36.8 L23.8 35.8 Z"
                  fill="url(#rbStar)"
                  stroke="#9a3412"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                {/* Tiny lower-left star */}
                <path
                  d="M45 48 L47 52.2 L51.6 52.8 L48.2 56 L49 60.5 L45 58.3 L41 60.5 L41.8 56 L38.4 52.8 L43 52.2 Z"
                  fill="url(#rbStar)"
                  stroke="#9a3412"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                {/* Right golden star */}
                <path
                  d="M150 28 L153.2 34.8 L160.6 35.8 L155.2 41 L156.5 48.4 L150 44.8 L143.5 48.4 L144.8 41 L139.4 35.8 L146.8 34.8 Z"
                  fill="url(#rbStar)"
                  stroke="#9a3412"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>

              {/* LEFT BUTTON: CARVED WOOD + GLOSSY EMERALD "INIZIA GIOCO" */}
              <button
                onClick={handleStartGame}
                className="home-wood-outer relative z-10 flex-1 min-w-0 rounded-[22px] p-[4px] cursor-pointer group text-left"
                title="Inizia a Giocare!"
              >
                <div className="home-inner-green rounded-[18px] px-2.5 sm:px-3.5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 h-full">
                  {/* Subtle decorative grass tufts & sparkles */}
                  <svg
                    viewBox="0 0 36 22"
                    className="absolute bottom-0 left-1 w-7 h-4 text-emerald-700/45 pointer-events-none"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M4 22 Q6 10 1 3 Q9 9 11 22 Z M12 22 Q16 8 22 2 Q18 12 19 22 Z M20 22 Q24 12 31 7 Q26 15 27 22 Z" />
                  </svg>
                  <svg
                    viewBox="0 0 36 22"
                    className="absolute bottom-0 right-1 w-7 h-4 text-emerald-700/45 pointer-events-none scale-x-[-1]"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M4 22 Q6 10 1 3 Q9 9 11 22 Z M12 22 Q16 8 22 2 Q18 12 19 22 Z M20 22 Q24 12 31 7 Q26 15 27 22 Z" />
                  </svg>
                  <span aria-hidden="true" className="absolute top-1.5 left-2 text-[9px] text-yellow-200/90 pointer-events-none">✦</span>

                  {/* Crisp Glowing White 3D Play Icon */}
                  <div className="relative z-10 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-0.5 drop-shadow-[0_3px_4px_rgba(6,78,59,0.55)]" />
                  </div>

                  <div className="relative z-10 min-w-0 leading-tight">
                    <span className="block font-kids font-bold text-[14px] sm:text-[17px] text-white drop-shadow-[0_2px_2px_rgba(6,78,59,0.55)]">
                      Inizia Gioco
                    </span>
                    <span className="block text-[11px] sm:text-xs font-fun font-bold text-emerald-50/95 tabular-nums mt-0.5">
                      Livello {progress.currentLevel}
                    </span>
                  </div>
                </div>
              </button>

              {/* RIGHT BUTTON: LAVENDER BEVEL + GLOSSY VIOLET "STUDIO DISEGNO" */}
              <button
                onClick={handleOpenStudio}
                className="home-lavender-outer relative z-10 flex-1 min-w-0 rounded-[22px] p-[4px] cursor-pointer group text-left"
                title="Apri Studio Disegno!"
              >
                <div className="home-inner-purple rounded-[18px] px-2.5 sm:px-3.5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 h-full">
                  <span aria-hidden="true" className="absolute top-1.5 right-2.5 text-[10px] text-pink-100/90 pointer-events-none">✦</span>
                  <span aria-hidden="true" className="absolute bottom-1.5 right-3 text-[11px] text-fuchsia-200/80 pointer-events-none">✦</span>

                  {/* Custom 3D Wooden Artist Palette & Paintbrush SVG */}
                  <svg
                    viewBox="0 0 48 48"
                    className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 shrink-0 drop-shadow-[0_3px_4px_rgba(59,7,100,0.5)] group-hover:scale-108 transition-transform"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="palWood" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fde0a6" />
                        <stop offset="60%" stopColor="#e5a95c" />
                        <stop offset="100%" stopColor="#b87328" />
                      </linearGradient>
                    </defs>
                    {/* Palette body */}
                    <path
                      d="M23 7 C12 7 5 14.5 5 24 C5 33.5 12.5 40 21.5 40 C24.5 40 26.5 38.2 26.5 35.8 C26.5 34.4 25.8 33.2 25.8 32 C25.8 30.2 27.2 29 29.5 29 L33.5 29 C39.5 29 43 25.2 43 20.5 C43 12.8 34.5 7 23 7 Z"
                      fill="url(#palWood)"
                      stroke="#78350f"
                      strokeWidth="1.6"
                    />
                    {/* Thumb hole */}
                    <circle cx="17" cy="31.5" r="3" fill="#9333ea" stroke="#78350f" strokeWidth="1" />
                    {/* Colorful paint blobs */}
                    <circle cx="14" cy="19" r="3.2" fill="#ef4444" />
                    <circle cx="21.5" cy="13.5" r="3.1" fill="#facc15" />
                    <circle cx="30" cy="14.5" r="3.1" fill="#3b82f6" />
                    <circle cx="35.5" cy="21" r="2.9" fill="#22c55e" />
                    {/* Diagonal paintbrush */}
                    <path d="M27 33 L41 11" stroke="#92400e" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M25.5 35.5 C23 36.5 22 39 24.5 39.5 C27 40 29 38 28.5 35.5 Z" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.9" />
                  </svg>

                  <div className="relative z-10 min-w-0 leading-tight">
                    <span className="block font-kids font-bold text-[14px] sm:text-[17px] text-white drop-shadow-[0_2px_2px_rgba(59,7,100,0.55)]">
                      Studio Disegno
                    </span>
                    <span className="block text-[11px] sm:text-xs font-fun font-bold text-fuchsia-100/95 mt-0.5">
                      Colora & Crea
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* ROW 2: EXTERNAL RECREATION ACTIVITY - ZOO PARLANTE 3D */}
            <button
              type="button"
              onClick={handleOpenZoo}
              className="home-wood-outer w-full max-w-[400px] sm:max-w-[460px] mx-auto rounded-[20px] p-[4px] cursor-pointer group text-left"
              title="Apri lo Zoo Parlante 3D: ascolta i versi degli animali, scopri curiosità e gioca a Indovina il Verso!"
            >
              <div className="home-inner-orange rounded-[16px] flex items-center justify-between gap-2.5 py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-white min-h-[50px]">
                <span className="relative z-10 inline-flex items-center gap-2.5 min-w-0">
                  <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 border-amber-100 shadow-sm bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={zooLion3d}
                      alt="Leone Leo dello Zoo Parlante"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block font-kids font-bold text-[14px] sm:text-[16px] text-white drop-shadow-[0_2px_2px_rgba(124,45,18,0.55)]">
                      Zoo Parlante
                    </span>
                    <span className="block text-[11px] sm:text-xs font-fun font-bold text-amber-50/95 mt-0.5">
                      Versi, Storie &amp; Indovina l&apos;Animale
                    </span>
                  </span>
                </span>
                <span className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/95 border border-orange-200 text-[11px] sm:text-xs font-fun font-extrabold text-orange-700 whitespace-nowrap shrink-0 shadow-2xs">
                  <Play className="w-3 h-3 fill-orange-500 text-orange-500 shrink-0" />
                  <span>Svago</span>
                </span>
              </div>
            </button>

            {/* ROW 3: CARVED WOOD + SHIMMERING GOLDEN TREASURE CHEST BAR */}
            <button
              type="button"
              onClick={() => {
                soundManager.playPop();
                setIsAlbumOpen(true);
              }}
              className="home-wood-outer w-full max-w-[400px] sm:max-w-[460px] mx-auto rounded-[20px] p-[4px] cursor-pointer"
              title="Apri lo Scrigno del Giorno, l'Album degli Adesivi Musicali e i Trofei"
            >
              <div className="home-inner-gold rounded-[16px] flex items-center justify-between gap-2 py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-[#422006] min-h-[48px]">
                <span className="relative z-10 inline-flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-amber-100 shadow-sm bg-amber-100 flex items-center justify-center shrink-0">
                    <img
                      src={treasureChest3d}
                      alt="Scrigno 3D"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <span className="font-kids font-bold text-[12px] sm:text-[15px] leading-tight text-left text-[#422006]">
                    {dailyMission.isDailyChestReady
                      ? 'Scrigno del Giorno Pronto · Apri (+3 💎)'
                      : `Album dei Tesori · Missione ${dailyMission.inCurrentCycle}/${DAILY_MISSION_TARGET}`}
                  </span>
                </span>
                <span className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50/92 border border-amber-200 text-xs sm:text-sm font-fun font-extrabold text-amber-950 whitespace-nowrap shrink-0 tabular-nums shadow-2xs">
                  <Gift className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>{(progress.unlockedStickerIds || ['stk_star']).length}/18</span>
                </span>
              </div>
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
              childProfile={progress.childProfile}
              onComplete={handleSvagoComplete}
              onExitToTitle={() => setCurrentView('title')}
            />
          ) : (
            <PlayArena
              progress={progress}
              onSolveLevel={handleSolveLevel}
              onOpenParents={() => setIsParentsOpen(true)}
              onOpenAlbum={() => setIsAlbumOpen(true)}
              onOpenStudio={handleOpenStudio}
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
      {/* VIEW 4: ZOO PARLANTE 3D (EXTERNAL RECREATION ACTIVITY)                    */}
      {/* ========================================================================= */}
      {currentView === 'zoo' && (
        <ZooParlanteStudio
          childProfile={childProfile}
          onClose={() => setCurrentView('title')}
        />
      )}

      {/* ========================================================================= */}
      {/* SETTINGS MODAL (AREA GENITORI, PROFILO & FOTO, AUDIO CONTROLS)            */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-sm animate-pop-in"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="home-wood-outer w-full max-w-[430px] rounded-[28px] p-[5px] shadow-[0_24px_60px_rgba(15,23,42,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-[#fffef8] via-[#fff9eb] to-[#fef3d8] rounded-[23px] p-4 sm:p-5 text-slate-800 border border-amber-200/80">
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-amber-200/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-amber-200 flex items-center justify-center shadow-[0_4px_0_#312e81] shrink-0">
                    <Settings className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-kids font-bold text-xl sm:text-2xl text-amber-950 leading-tight">
                      Impostazioni
                    </h2>
                    <p className="font-fun font-semibold text-xs text-amber-800/85 leading-snug">
                      Gestione genitori, profilo e audio
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setIsSettingsOpen(false);
                  }}
                  className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center justify-center border border-amber-300 transition-colors cursor-pointer shrink-0"
                  aria-label="Chiudi impostazioni"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Management Actions: Area Genitori + Profilo & Foto */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setIsSettingsOpen(false);
                    setIsParentsOpen(true);
                  }}
                  className="home-wood-outer w-full rounded-[20px] p-[3.5px] cursor-pointer text-left group"
                >
                  <div className="home-inner-teal rounded-[16px] px-3.5 py-3 flex items-center justify-between gap-2.5 text-white">
                    <div className="relative z-10 flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-white/18 border border-white/30 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-amber-300" />
                      </span>
                      <div className="min-w-0">
                        <span className="block font-kids font-bold text-[15px] sm:text-base text-white leading-tight">
                          Area Genitori · Report PDF
                        </span>
                        <span className="block font-fun font-semibold text-[11.5px] sm:text-xs text-cyan-50/95 leading-snug mt-0.5">
                          Valutazione CHC, statistiche, PIN e stampa PDF
                        </span>
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-1 shrink-0">
                      <FileText className="w-4 h-4 text-amber-300" />
                      <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setIsSettingsOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="home-wood-outer w-full rounded-[20px] p-[3.5px] cursor-pointer text-left group"
                >
                  <div className="home-inner-indigo rounded-[16px] px-3.5 py-3 flex items-center justify-between gap-2.5 text-white">
                    <div className="relative z-10 flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-white/18 border border-white/30 flex items-center justify-center shrink-0">
                        <span className="inline-flex items-center">
                          <UserRound className="w-4.5 h-4.5 text-white fill-white/85" />
                          <Camera className="w-3 h-3 text-amber-200 -ml-1 mt-2.5" />
                        </span>
                      </span>
                      <div className="min-w-0">
                        <span className="block font-kids font-bold text-[15px] sm:text-base text-white leading-tight">
                          Profilo &amp; Foto Sfondo
                        </span>
                        <span className="block font-fun font-semibold text-[11.5px] sm:text-xs text-indigo-100/95 leading-snug mt-0.5">
                          {childName} · {ageInfo.shortAgeLabel} · Personalizza Home
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="relative z-10 w-4 h-4 text-white/90 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Quick Audio / Voice / Music Toggles */}
              <div className="mt-4 pt-3.5 border-t border-amber-200/80">
                <p className="font-fun font-extrabold text-[11px] uppercase tracking-wider text-amber-900/75 mb-2 px-0.5">
                  Audio &amp; Atmosfera
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !progress.soundEnabled;
                      updateProgress(prev => ({ ...prev, soundEnabled: next }));
                      if (next) soundManager.playPop();
                    }}
                    className={`rounded-2xl px-2.5 py-2.5 border-2 flex flex-col items-center justify-center gap-1 font-fun font-extrabold text-xs transition-all cursor-pointer ${
                      progress.soundEnabled
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[0_3px_0_#34d399]'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}
                  >
                    {progress.soundEnabled ? (
                      <Volume2 className="w-4.5 h-4.5 text-emerald-600" />
                    ) : (
                      <VolumeX className="w-4.5 h-4.5 text-slate-400" />
                    )}
                    <span>Effetti {progress.soundEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !progress.voiceEnabled;
                      updateProgress(prev => ({ ...prev, voiceEnabled: next }));
                      if (next) {
                        soundManager.playPop();
                        soundManager.speak('Voce guida attivata!');
                      }
                    }}
                    className={`rounded-2xl px-2.5 py-2.5 border-2 flex flex-col items-center justify-center gap-1 font-fun font-extrabold text-xs transition-all cursor-pointer ${
                      progress.voiceEnabled
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-[0_3px_0_#f59e0b]'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden="true">🗣️</span>
                    <span>Voce {progress.voiceEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !progress.musicEnabled;
                      updateProgress(prev => ({ ...prev, musicEnabled: next }));
                      if (next) soundManager.playPop();
                    }}
                    className={`rounded-2xl px-2.5 py-2.5 border-2 flex flex-col items-center justify-center gap-1 font-fun font-extrabold text-xs transition-all cursor-pointer ${
                      progress.musicEnabled
                        ? 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-900 shadow-[0_3px_0_#e879f9]'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}
                  >
                    <Music className={`w-4.5 h-4.5 ${progress.musicEnabled ? 'text-fuchsia-600' : 'text-slate-400'}`} />
                    <span>Musica {progress.musicEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TREASURE ALBUM, DAILY CURIOSITY CHEST & MUSICAL STICKERS MODAL            */}
      {/* ========================================================================= */}
      {isAlbumOpen && (
        <TreasureAlbumModal
          progress={progress}
          onClaimDailyChest={handleClaimDailyChest}
          onUnlockSticker={handleUnlockSticker}
          onOpenStudio={() => {
            setIsAlbumOpen(false);
            handleOpenStudio();
          }}
          onClose={() => setIsAlbumOpen(false)}
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
          onUpdateParentPin={(pinHash, pinHint) => {
            updateProgress(prev => ({
              ...prev,
              parentPinHash: pinHash,
              parentPinHint: pinHint,
            }));
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
