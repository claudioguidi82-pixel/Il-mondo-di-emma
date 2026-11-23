import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChildProfile,
  GameCategory,
  PuzzleType,
  UserProgress,
  SavedDrawing,
  ExerciseDifficultyScore,
  ArchivedReportOverview,
} from './types/game';
import { loadUserProgress, saveUserProgress } from './data/gameData';
import { PlayArena, SolveTelemetryPayload } from './components/PlayArena';
import { SvagoArena } from './components/SvagoArena';
import { SvagoGameMode } from './utils/svagoGames';
import { StudioDisegno } from './components/StudioDisegno';
import { ZooParlanteStudio } from './components/ZooParlanteStudio';
import { evaluateTrialPlayerOrigin, isValidChildEntry } from './utils/adultPlayDetector';
import { ParentModal } from './components/ParentModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { TreasureAlbumModal } from './components/TreasureAlbumModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { BirthdayCelebrationModal } from './components/BirthdayCelebrationModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { soundManager } from './utils/audio';
import { confetti } from './utils/confetti';
import {
  calculateChildAge,
  getDisplayChildName,
  getGenderedWord,
  getWorldTitle,
  DIFFICULTY_LEVEL_SPECS,
  evaluateSingleTrialMetrics,
  getBirthdayStatus,
  getAgeVisualTheme,
} from './utils/childProfile';
import {
  getDifficultyWeightInfo,
  createEvaluationSnapshot,
  syncAnnualAndMonthlyProgress,
} from './utils/evaluationEngine';
import { deleteOverviewAudioFromIndexedDb } from './utils/reportOverviewArchive';
import {
  CloudSyncAccountState,
  signInWithGooglePopup,
  signOutGoogleAccount,
  subscribeToGoogleAuth,
  saveUserProgressToFirestore,
  loadUserProgressFromFirestore,
  mergeCloudAndLocalProgress,
  detectCurrentDeviceLabel,
} from './utils/firebaseSync';
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
  Gamepad2,
  Cloud,
  RefreshCw,
  LogOut,
  Cake,
  Sparkles,
} from 'lucide-react';
import homeWorldDiorama from './assets/images/home_world_diorama_1795267242665.jpg';
import treasureChest3d from './assets/images/treasure_chest_3d_1795267243685.jpg';
import zooLion3d from './assets/images/zoo_lion_3d_1795268326883.jpg';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() =>
    syncAnnualAndMonthlyProgress(loadUserProgress())
  );
  const [currentView, setCurrentView] = useState<'title' | 'play' | 'studio' | 'zoo' | 'svago'>('title');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParentsOpen, setIsParentsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);

  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncAccountState>({
    uid: null,
    email: null,
    displayName: null,
    photoURL: null,
    emailVerified: false,
    isSyncing: false,
    lastSyncedAt: null,
    deviceLabel: detectCurrentDeviceLabel(),
    syncError: null,
  });

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const hasAutoOpenedBirthdayRef = useRef(false);

  const childProfile = progress.childProfile;
  const ageInfo = useMemo(
    () => calculateChildAge(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const birthdayStatus = useMemo(
    () => getBirthdayStatus(childProfile?.birthDate),
    [childProfile?.birthDate]
  );
  const ageTheme = useMemo(
    () => getAgeVisualTheme(ageInfo.years, childProfile?.name),
    [ageInfo.years, childProfile?.name]
  );
  const worldTitle = useMemo(() => getWorldTitle(childProfile), [childProfile]);
  const childName = useMemo(() => getDisplayChildName(childProfile), [childProfile]);
  const dailyMission = useMemo(() => getDailyMissionStatus(progress), [progress]);
  const shouldShowProfileModal = !childProfile?.isConfigured || isProfileModalOpen;
  const isBirthdayGiftClaimedThisYear =
    progress.lastBirthdayCelebratedYear === birthdayStatus.todayBirthdayYearKey;

  // Automatically celebrate the child's birthday when today matches their birth day & month
  useEffect(() => {
    if (
      childProfile?.isConfigured &&
      birthdayStatus.isBirthdayToday &&
      !hasAutoOpenedBirthdayRef.current
    ) {
      hasAutoOpenedBirthdayRef.current = true;
      setIsBirthdayModalOpen(true);
    }
  }, [childProfile?.isConfigured, birthdayStatus.isBirthdayToday]);

  // Subscribe to Firebase Google Auth and automatically sync/merge cloud & local progress across devices
  useEffect(() => {
    const unsubscribe = subscribeToGoogleAuth(async (user) => {
      if (!user) {
        setCloudSyncState((prev) => ({
          ...prev,
          uid: null,
          email: null,
          displayName: null,
          photoURL: null,
          emailVerified: false,
          isSyncing: false,
        }));
        return;
      }

      setCloudSyncState((prev) => ({
        ...prev,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        isSyncing: true,
        syncError: null,
      }));

      try {
        const cloudResult = await loadUserProgressFromFirestore();
        const merged = syncAnnualAndMonthlyProgress(
          mergeCloudAndLocalProgress(progressRef.current, cloudResult?.progress || null)
        );
        setProgress(merged);
        saveUserProgress(merged);
        const savedInfo = await saveUserProgressToFirestore(merged);
        setCloudSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: savedInfo?.updatedAt || cloudResult?.updatedAt || new Date().toISOString(),
          deviceLabel: savedInfo?.deviceLabel || detectCurrentDeviceLabel(),
          syncError: null,
        }));
      } catch (err) {
        setCloudSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncError:
            err instanceof Error
              ? err.message
              : 'Sincronizzazione cloud temporaneamente non disponibile.',
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Automatically debounce-sync progress to Firestore whenever progress changes while signed in
  useEffect(() => {
    if (!cloudSyncState.uid || !cloudSyncState.emailVerified) return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await saveUserProgressToFirestore(progressRef.current);
        if (res) {
          setCloudSyncState((prev) => ({
            ...prev,
            lastSyncedAt: res.updatedAt,
            deviceLabel: res.deviceLabel,
            syncError: null,
          }));
        }
      } catch {
        // Non-blocking background sync; local progress is always preserved
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [
    cloudSyncState.uid,
    cloudSyncState.emailVerified,
    progress.currentLevel,
    progress.stars,
    progress.gems,
    progress.totalPuzzlesSolved,
    progress.childProfile?.name,
    progress.childProfile?.birthDate,
    progress.archivedReportOverviews?.length,
  ]);

  const handleGoogleSignIn = async () => {
    soundManager.playPop();
    setCloudSyncState((prev) => ({ ...prev, isSyncing: true, syncError: null }));
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setCloudSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError:
          err instanceof Error
            ? err.message
            : 'Accesso Google annullato o bloccato dal browser.',
      }));
    }
  };

  const handleGoogleSignOut = async () => {
    soundManager.playPop();
    await signOutGoogleAccount();
    setCloudSyncState((prev) => ({
      ...prev,
      uid: null,
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
      isSyncing: false,
      syncError: null,
    }));
  };

  const handleManualCloudSave = async () => {
    if (!cloudSyncState.uid) return;
    soundManager.playPop();
    setCloudSyncState((prev) => ({ ...prev, isSyncing: true, syncError: null }));
    try {
      const res = await saveUserProgressToFirestore(progressRef.current);
      setCloudSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: res?.updatedAt || new Date().toISOString(),
        deviceLabel: res?.deviceLabel || detectCurrentDeviceLabel(),
        syncError: null,
      }));
      soundManager.playSuccess();
    } catch (err) {
      setCloudSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError:
          err instanceof Error ? err.message : 'Errore nel salvataggio cloud.',
      }));
    }
  };

  const handleManualCloudRestore = async () => {
    if (!cloudSyncState.uid) return;
    soundManager.playPop();
    setCloudSyncState((prev) => ({ ...prev, isSyncing: true, syncError: null }));
    try {
      const cloudResult = await loadUserProgressFromFirestore();
      const merged = syncAnnualAndMonthlyProgress(
        mergeCloudAndLocalProgress(progressRef.current, cloudResult?.progress || null)
      );
      setProgress(merged);
      saveUserProgress(merged);
      const saved = await saveUserProgressToFirestore(merged);
      setCloudSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: saved?.updatedAt || cloudResult?.updatedAt || new Date().toISOString(),
        deviceLabel: saved?.deviceLabel || detectCurrentDeviceLabel(),
        syncError: null,
      }));
      soundManager.playFanfare();
      confetti.burst(undefined, undefined, 24);
    } catch (err) {
      setCloudSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError:
          err instanceof Error ? err.message : 'Errore nel recupero progressi dal cloud.',
      }));
    }
  };

  const handleClaimBirthdayGift = () => {
    updateProgress((prev) => {
      if (prev.lastBirthdayCelebratedYear === birthdayStatus.todayBirthdayYearKey) {
        return prev;
      }
      return {
        ...prev,
        gems: prev.gems + 50,
        stars: prev.stars + 25,
        lastBirthdayCelebratedYear: birthdayStatus.todayBirthdayYearKey,
      };
    });
  };

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

  const handleOpenSvago = () => {
    soundManager.playPop();
    confetti.burst(undefined, undefined, 14);
    setCurrentView('svago');
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
    chcSecondary?: 'Gf' | 'Gwm' | 'Gc' | 'Gv' | 'Gs',
    telemetry?: SolveTelemetryPayload
  ) => {
    const cleanAttempts = Math.max(1, attemptsCount);
    const cleanHints = Math.max(0, hintsUsed);
    const cleanResponseMs = Math.max(450, Math.min(45000, Math.round(responseTimeMs || 4800)));
    updateProgress(prev => {
      const nextLevel = prev.currentLevel + 1;
      const highest = Math.max(prev.highestLevelReached, nextLevel);
      const fallbackW = getDifficultyWeightInfo(prev.currentLevel, true);
      const resolvedTier = (
        telemetry?.difficultyTier &&
        telemetry.difficultyTier >= 1 &&
        telemetry.difficultyTier <= 5
          ? Math.round(telemetry.difficultyTier)
          : fallbackW.tier
      ) as ExerciseDifficultyScore;
      const resolvedWeight = DIFFICULTY_LEVEL_SPECS[resolvedTier]?.weight ?? fallbackW.weight;

      // c_i = 1 if solved on 1st try without hints; assisted successes tracked separately
      const isAutonomous = Boolean(isFirstTry) && cleanAttempts === 1 && cleanHints === 0;
      const trialMetrics = evaluateSingleTrialMetrics({
        firstTry: isAutonomous,
        attempts: cleanAttempts,
        hintsUsed: cleanHints,
      });

      // Silent 100% on-device behavioral telemetry to detect parent/adult testing vs genuine child play
      const currentChildAge = calculateChildAge(prev.childProfile?.birthDate).years;
      const originDetection = evaluateTrialPlayerOrigin({
        ageYears: currentChildAge,
        responseTimeMs: cleanResponseMs,
        answeredBeforeAudioEnd: Boolean(telemetry?.answeredBeforeAudioEnd),
        audioReplayCount: telemetry?.audioReplayCount || 0,
        firstTry: isAutonomous,
        hintsUsed: cleanHints,
        isCountingPuzzle: Boolean(telemetry?.isCountingPuzzle),
        pointer: telemetry?.pointer || null,
        recentHistory: prev.levelHistory || [],
        parentPreviewMode: Boolean(prev.parentPreviewMode),
      });
      const isFilteredAdult = originDetection.suspectedAdult;

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

      const solvedPuzzleId = telemetry?.puzzleId?.trim();
      const existingCompletedIds = prev.completedPuzzleIds || [];
      const nextCompletedPuzzleIds =
        solvedPuzzleId && !isFilteredAdult
          ? Array.from(new Set([...existingCompletedIds, solvedPuzzleId])).slice(-1500)
          : existingCompletedIds;

      const nextHistory = [
        ...(prev.levelHistory || []),
        {
          level: prev.currentLevel,
          puzzleId: solvedPuzzleId,
          tier: resolvedTier,
          weight: resolvedWeight,
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
          suspectedAdult: isFilteredAdult,
          adultConfidence: originDetection.confidence,
          adultReasons: originDetection.reasons,
          inputOrigin: originDetection.inputOrigin,
        },
      ].slice(-150);

      // If adult/parent testing is detected (or Parent Preview Mode is ON), keep categoryStats pure!
      const nextCategoryStats = isFilteredAdult
        ? prev.categoryStats
        : {
            ...prev.categoryStats,
            [category]: {
              correct: prevCat.correct + (isAutonomous ? 1 : 0),
              total: prevCat.total + 1,
              attempts: prevAttempts + cleanAttempts,
              assistedSuccesses: (prevCat.assistedSuccesses ?? 0) + (isAutonomous ? 0 : 1),
              hintsUsed: (prevCat.hintsUsed ?? 0) + cleanHints,
              weightedCorrectSum:
                (prevCat.weightedCorrectSum ?? 0) + resolvedWeight * trialMetrics.c_i,
              weightedTotalSum: (prevCat.weightedTotalSum ?? 0) + resolvedWeight,
            },
          };

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
        totalPuzzlesSolved: prev.totalPuzzlesSolved + (isFilteredAdult ? 0 : 1),
        totalAttempts: prev.totalAttempts + (isFilteredAdult ? 0 : cleanAttempts),
        adultFilteredCount: (prev.adultFilteredCount || 0) + (isFilteredAdult ? 1 : 0),
        dailyMissionDate: today,
        dailyMissionCount: nextDailyCount,
        unlockedStickerIds: nextUnlockedStickers,
        completedPuzzleIds: nextCompletedPuzzleIds,
        categoryStats: nextCategoryStats,
        levelHistory: nextHistory,
      };

      // Save an evaluation snapshot every 3 genuine child trials (skip during adult/parent testing)
      if (!isFilteredAdult) {
        const validCount = nextHistory.filter(isValidChildEntry).length;
        if (validCount >= 1 && (validCount % 3 === 0 || isNewDay)) {
          const snap = createEvaluationSnapshot(updatedProgress);
          updatedProgress.evaluationSnapshots = [
            ...(prev.evaluationSnapshots || []),
            snap,
          ].slice(-30);
        }
      }

      return syncAnnualAndMonthlyProgress(updatedProgress);
    });
  };

  const handleSaveArchivedOverview = (entry: ArchivedReportOverview) => {
    updateProgress((prev) => {
      const existing = prev.archivedReportOverviews || [];
      const filtered = existing.filter((item) => item.id !== entry.id);
      return {
        ...prev,
        archivedReportOverviews: [entry, ...filtered].slice(0, 60),
      };
    });
  };

  const handleDeleteArchivedOverview = (id: string) => {
    void deleteOverviewAudioFromIndexedDb(id);
    updateProgress((prev) => ({
      ...prev,
      archivedReportOverviews: (prev.archivedReportOverviews || []).filter(
        (item) => item.id !== id
      ),
    }));
  };

  const handleToggleParentPreviewMode = () => {
    updateProgress((prev) => ({
      ...prev,
      parentPreviewMode: !prev.parentPreviewMode,
    }));
  };

  const handleClearAdultFilteredTrials = () => {
    updateProgress((prev) => {
      const cleanedHistory = (prev.levelHistory || []).filter(isValidChildEntry);
      return syncAnnualAndMonthlyProgress({
        ...prev,
        levelHistory: cleanedHistory,
        adultFilteredCount: 0,
      });
    });
  };

  const handleSvagoComplete = (
    mode: SvagoGameMode = 'maze',
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
      parentPreviewMode: false,
      adultFilteredCount: 0,
    };
    const syncedFresh = syncAnnualAndMonthlyProgress(fresh);
    setProgress(syncedFresh);
    saveUserProgress(syncedFresh);
    soundManager.speak(
      `Progressi azzerati, ${childName}! Si riparte dal primo livello con gioia!`
    );
  };

  // Every 10 levels (Level 10, 20, 30...) is a Svago Level (Labirinto, Trova le differenze, Tris)
  const isSvagoLevel = progress.currentLevel % 10 === 0;
  const hasCustomBackground = Boolean(childProfile?.customBackgroundUrl);

  return (
    <div
      className={`age-theme-${ageTheme.stageId} fixed inset-0 z-0 h-[100dvh] max-h-[100dvh] w-full overflow-hidden text-white font-sans select-none flex flex-col justify-between`}
    >
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
                  ? ageTheme.stageId === 'teen_nextgen'
                    ? 'scale-100 brightness-[0.65] contrast-[1.15] saturate-[1.1]'
                    : ageTheme.stageId === 'preteen_campus'
                    ? 'scale-100 brightness-[0.82] contrast-[1.08]'
                    : 'scale-100 brightness-100 contrast-[1.03]'
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
        <div className="safe-viewport-pad home-scroll-safe app-shell-container relative z-10 h-full w-full flex flex-col justify-between px-3 sm:px-6 lg:px-10 py-2.5 sm:py-5 overflow-hidden">
          
          {/* 1. TOP TITLE PLAQUE (EVOLVES WITH CHILD'S AGE 2-14) + CENTERED SETTINGS GEAR */}
          <div className="landscape-header-compact flex flex-col items-center text-center pt-1 sm:pt-1.5 px-2 sm:px-4 shrink-0">
            <div className="home-wood-plaque inline-flex flex-col items-center px-3 sm:px-7 pt-2 sm:pt-3 pb-1.5 sm:pb-2.5 max-w-full">
              {!ageTheme.isMatureTheme && (
                <>
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
                    <path
                      d="M12 2 L14.4 7.2 L20 8 L15.9 11.9 L16.9 17.5 L12 14.8 L7.1 17.5 L8.1 11.9 L4 8 L9.6 7.2 Z"
                      fill="url(#homeStarR)"
                      stroke="#9a3412"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M34 4 L39.2 14.8 L51 16.4 L42.4 24.7 L44.5 36.4 L34 30.8 L23.5 36.4 L25.6 24.7 L17 16.4 L28.8 14.8 Z"
                      fill="url(#homeStarR)"
                      stroke="#9a3412"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M47 30 L49 34.2 L53.6 34.8 L50.2 38 L51 42.5 L47 40.3 L43 42.5 L43.8 38 L40.4 34.8 L45 34.2 Z"
                      fill="url(#homeStarR)"
                      stroke="#9a3412"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}

              {/* Main Carved / Evolved Title */}
              <h1 className="home-title-text text-[22px] sm:text-4xl font-kids font-bold tracking-tight leading-none px-1.5 sm:px-2">
                {ageTheme.stageId === 'teen_nextgen' ? (
                  <>
                    <span className="home-title-white-3d">NextGen · </span>
                    <span className="home-title-gold-3d">{worldTitle.childName || 'Lab'}</span>
                  </>
                ) : ageTheme.stageId === 'preteen_campus' ? (
                  <>
                    <span className="home-title-white-3d">Campus di </span>
                    <span className="home-title-gold-3d">{worldTitle.childName || 'Studio'}</span>
                  </>
                ) : worldTitle.childName ? (
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

              {/* Clean Compact Stat Line + Visual Evolution Badge */}
              <div className="home-stat-line mt-1.5 sm:mt-2 home-wood-stat-inset inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-0.5 rounded-full text-[11px] sm:text-xs font-fun font-extrabold text-white tabular-nums">
                <span>Liv. {progress.currentLevel}</span>
                <span className="opacity-45" aria-hidden="true">·</span>
                <span>⭐ {progress.stars}</span>
                <span className="opacity-45" aria-hidden="true">·</span>
                <span>💎 {progress.gems}</span>
                <span className="opacity-45" aria-hidden="true">·</span>
                <span>{ageInfo.shortAgeLabel}</span>
                {cloudSyncState.uid && (
                  <>
                    <span className="opacity-45" aria-hidden="true">·</span>
                    <span className="text-emerald-300 inline-flex items-center gap-1" title="Progressi sincronizzati con Google Cloud">
                      <Cloud className="w-3 h-3" /> Cloud
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* CENTERED COMPACT CIRCULAR SETTINGS GEAR + BIRTHDAY CELEBRATION TRIGGER */}
            <div className="mt-2 sm:mt-2.5 relative z-20 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setIsSettingsOpen(true);
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#f4ba6d] via-[#d98c3a] to-[#a95c1a] border-2 border-[#fde4ad] shadow-[0_4px_0_#6b3309,0_10px_20px_rgba(15,10,4,0.45),inset_0_2px_3px_rgba(255,248,225,0.85)] flex items-center justify-center cursor-pointer active:translate-y-0.5 hover:brightness-105 transition-all group"
                aria-label="Impostazioni: Area Genitori, Cloud Google, Profilo e Audio"
                title="Impostazioni (Area Genitori, Cloud Google & Profilo)"
              >
                <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white drop-shadow-[0_2px_2px_rgba(107,51,9,0.75)] group-hover:rotate-45 transition-transform duration-300" />
              </button>

              {(birthdayStatus.isBirthdayToday || birthdayStatus.isBirthdayCountdownSoon) && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playFanfare();
                    setIsBirthdayModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-fun font-extrabold text-xs border-2 border-amber-100 shadow-lg flex items-center gap-1.5 cursor-pointer hover:brightness-105 active:translate-y-0.5 transition-all animate-bounce"
                  title="Apri la Festa di Compleanno interattiva!"
                >
                  <Cake className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>
                    {birthdayStatus.isBirthdayToday
                      ? `🎂 Buon Compleanno ${childName}! (${birthdayStatus.turningAgeYears} Anni)`
                      : `🎂 Compleanno tra ${birthdayStatus.daysUntilBirthday}g (${birthdayStatus.nextBirthdayFormatted})`}
                  </span>
                </button>
              )}
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
                ageTheme.isMatureTheme
                  ? `Ciao ${childName}! ${welcomeWord} nel tuo ${ageTheme.stageBadge}! Scegli una sfida o esplora le tue attività!`
                  : `Evviva ${childName}! ${welcomeWord} nel tuo mondo magico! Giochiamo insieme!`
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

          {/* 3. BOTTOM ACTION DOCK (ADAPTS AUTOMATICALLY FROM STORYBOOK TO NEXTGEN STUDIO) */}
          <div className="home-landscape-dock w-full flex flex-col items-center shrink-0 gap-2.5 sm:gap-3 pb-1">
            
            {/* ROW 1: INIZIA GIOCO / SFIDA + STUDIO DISEGNO / ATELIER */}
            <div className="home-landscape-cards home-dock-row relative w-full max-w-[400px] sm:max-w-[460px] pt-4 sm:pt-5 flex items-stretch justify-between gap-2.5 sm:gap-3.5 mx-auto">
              
              {/* Glossy 3D Rainbow Arch for Early Childhood & Primary Explorer */}
              {!ageTheme.isMatureTheme && (
                <svg
                  viewBox="0 0 180 78"
                  className="home-rainbow-arch absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 w-[124px] sm:w-[144px] h-[54px] sm:h-[62px] pointer-events-none z-20 drop-shadow-[0_4px_6px_rgba(15,23,42,0.35)]"
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
                  <path d="M 32 62 A 58 48 0 0 1 148 62" stroke="#ff4d6d" strokeWidth="7" strokeLinecap="round" />
                  <path d="M 38 62 A 52 42 0 0 1 142 62" stroke="#ff9f1c" strokeWidth="6.5" strokeLinecap="round" />
                  <path d="M 44 62 A 46 36 0 0 1 136 62" stroke="#ffe033" strokeWidth="6.5" strokeLinecap="round" />
                  <path d="M 50 62 A 40 30 0 0 1 130 62" stroke="#34d399" strokeWidth="6.5" strokeLinecap="round" />
                  <path d="M 56 62 A 34 24 0 0 1 124 62" stroke="#38bdf8" strokeWidth="6.5" strokeLinecap="round" />
                  <path d="M 44 38 A 54 44 0 0 1 136 38" stroke="rgba(255,255,255,0.45)" strokeWidth="2.4" strokeLinecap="round" />
                  <path
                    d="M27 29 L30.2 35.8 L37.6 36.8 L32.2 42 L33.5 49.4 L27 45.8 L20.5 49.4 L21.8 42 L16.4 36.8 L23.8 35.8 Z"
                    fill="url(#rbStar)"
                    stroke="#9a3412"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M45 48 L47 52.2 L51.6 52.8 L48.2 56 L49 60.5 L45 58.3 L41 60.5 L41.8 56 L38.4 52.8 L43 52.2 Z"
                    fill="url(#rbStar)"
                    stroke="#9a3412"
                    strokeWidth="1.1"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M150 28 L153.2 34.8 L160.6 35.8 L155.2 41 L156.5 48.4 L150 44.8 L143.5 48.4 L144.8 41 L139.4 35.8 L146.8 34.8 Z"
                    fill="url(#rbStar)"
                    stroke="#9a3412"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* LEFT BUTTON: PLAY / CHALLENGE */}
              <button
                onClick={handleStartGame}
                className="home-wood-outer relative z-10 flex-1 min-w-0 rounded-[22px] p-[4px] cursor-pointer group text-left"
                title={ageTheme.labels.playMainTitle(progress.currentLevel)}
              >
                <div className="home-inner-green home-action-inner rounded-[18px] px-2.5 sm:px-3.5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 h-full">
                  {!ageTheme.isMatureTheme && (
                    <>
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
                    </>
                  )}
                  <div className="home-action-icon relative z-10 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-0.5 drop-shadow-[0_3px_4px_rgba(6,78,59,0.55)]" />
                  </div>

                  <div className="relative z-10 min-w-0 leading-tight">
                    <span className="home-action-title block font-kids font-bold text-[14px] sm:text-[17px] text-white drop-shadow-[0_2px_2px_rgba(6,78,59,0.55)] truncate">
                      {ageTheme.labels.playMainTitle(progress.currentLevel)}
                    </span>
                    <span className="home-action-sub block text-[11px] sm:text-xs font-fun font-bold text-emerald-50/95 tabular-nums mt-0.5 truncate">
                      {ageTheme.labels.playMainSub}
                    </span>
                  </div>
                </div>
              </button>

              {/* RIGHT BUTTON: STUDIO DISEGNO / ATELIER */}
              <button
                onClick={handleOpenStudio}
                className="home-lavender-outer relative z-10 flex-1 min-w-0 rounded-[22px] p-[4px] cursor-pointer group text-left"
                title={ageTheme.labels.studioTitle}
              >
                <div className="home-inner-purple home-action-inner rounded-[18px] px-2.5 sm:px-3.5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 h-full">
                  <svg
                    viewBox="0 0 48 48"
                    className="home-action-icon relative z-10 w-10 h-10 sm:w-11 sm:h-11 shrink-0 drop-shadow-[0_3px_4px_rgba(59,7,100,0.5)] group-hover:scale-108 transition-transform"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="palWood" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fde0a6" />
                        <stop offset="60%" stopColor="#e5a95c" />
                        <stop offset="100%" stopColor="#b87328" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M23 7 C12 7 5 14.5 5 24 C5 33.5 12.5 40 21.5 40 C24.5 40 26.5 38.2 26.5 35.8 C26.5 34.4 25.8 33.2 25.8 32 C25.8 30.2 27.2 29 29.5 29 L33.5 29 C39.5 29 43 25.2 43 20.5 C43 12.8 34.5 7 23 7 Z"
                      fill="url(#palWood)"
                      stroke="#78350f"
                      strokeWidth="1.6"
                    />
                    <circle cx="17" cy="31.5" r="3" fill="#9333ea" stroke="#78350f" strokeWidth="1" />
                    <circle cx="14" cy="19" r="3.2" fill="#ef4444" />
                    <circle cx="21.5" cy="13.5" r="3.1" fill="#facc15" />
                    <circle cx="30" cy="14.5" r="3.1" fill="#3b82f6" />
                    <circle cx="35.5" cy="21" r="2.9" fill="#22c55e" />
                    <path d="M27 33 L41 11" stroke="#92400e" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M25.5 35.5 C23 36.5 22 39 24.5 39.5 C27 40 29 38 28.5 35.5 Z" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.9" />
                  </svg>

                  <div className="relative z-10 min-w-0 leading-tight">
                    <span className="home-action-title block font-kids font-bold text-[14px] sm:text-[17px] text-white drop-shadow-[0_2px_2px_rgba(59,7,100,0.55)] truncate">
                      {ageTheme.labels.studioTitle}
                    </span>
                    <span className="home-action-sub block text-[11px] sm:text-xs font-fun font-bold text-fuchsia-100/95 mt-0.5 truncate">
                      {ageTheme.labels.studioSub}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* SECONDARY ROWS: ZOO/BIO-ACUSTICA + SVAGO/LOGICA + SCRIGNO/ COLLEZIONE */}
            <div className="home-landscape-secondary w-full flex flex-col gap-2.5 sm:gap-3">
              {/* ROW 2: SIDE-BY-SIDE ZOO + GIOCHI DI SVAGO */}
              <div className="home-dock-row grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-[400px] sm:max-w-[460px] mx-auto">
                <button
                  type="button"
                  onClick={handleOpenZoo}
                  className="home-wood-outer min-w-0 rounded-[20px] p-[4px] cursor-pointer group text-left"
                  title={ageTheme.labels.zooTitle}
                >
                  <div className="home-inner-orange home-action-inner rounded-[16px] flex items-center justify-between gap-2 py-1.5 sm:py-2 px-2 sm:px-3 text-white min-h-[54px] h-full">
                    <span className="relative z-10 inline-flex items-center gap-2 min-w-0">
                      <span className="home-action-icon w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-amber-100 shadow-sm bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <img
                          src={zooLion3d}
                          alt="Natura e Animali"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="home-action-title block font-kids font-bold text-[13px] sm:text-[15px] text-white drop-shadow-[0_2px_2px_rgba(124,45,18,0.55)] truncate">
                          {ageTheme.labels.zooTitle}
                        </span>
                        <span className="home-action-sub block text-[10px] sm:text-[11px] font-fun font-bold text-amber-50/95 mt-0.5 truncate">
                          {ageTheme.labels.zooSub}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="relative z-10 w-4 h-4 text-white/90 shrink-0 hidden sm:block group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenSvago}
                  className="home-wood-outer min-w-0 rounded-[20px] p-[4px] cursor-pointer group text-left"
                  title={ageTheme.labels.svagoTitle}
                >
                  <div className="home-inner-teal home-action-inner rounded-[16px] flex items-center justify-between gap-2 py-1.5 sm:py-2 px-2 sm:px-3 text-white min-h-[54px] h-full">
                    <span className="relative z-10 inline-flex items-center gap-2 min-w-0">
                      <span className="home-action-icon w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-cyan-100/80 shadow-sm bg-cyan-950/35 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200" />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="home-action-title block font-kids font-bold text-[13px] sm:text-[15px] text-white drop-shadow-[0_2px_2px_rgba(4,47,69,0.55)] truncate">
                          {ageTheme.labels.svagoTitle}
                        </span>
                        <span className="home-action-sub block text-[10px] sm:text-[11px] font-fun font-bold text-cyan-50/95 mt-0.5 truncate">
                          {ageTheme.labels.svagoSub}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="relative z-10 w-4 h-4 text-white/90 shrink-0 hidden sm:block group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* ROW 3: TREASURE CHEST / TRAGUARDI & COLLEZIONE BAR */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setIsAlbumOpen(true);
                }}
                className="home-wood-outer home-dock-row w-full max-w-[400px] sm:max-w-[460px] mx-auto rounded-[20px] p-[4px] cursor-pointer"
                title={ageTheme.labels.chestTitle}
              >
                <div className="home-inner-gold rounded-[16px] flex items-center justify-between gap-2 py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-[#422006] min-h-[48px]">
                  <span className="relative z-10 inline-flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <span className="home-action-icon w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-amber-100 shadow-sm bg-amber-100 flex items-center justify-center shrink-0">
                      <img
                        src={treasureChest3d}
                        alt="Scrigno e Traguardi"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </span>
                    <span className="font-kids font-bold text-[12px] sm:text-[15px] leading-tight text-left text-[#422006] min-w-0 break-words">
                      {dailyMission.isDailyChestReady
                        ? `${ageTheme.labels.chestTitle} Pronto · Apri (+3 💎)`
                        : `${ageTheme.labels.chestTitle} · Missione ${dailyMission.inCurrentCycle}/${DAILY_MISSION_TARGET}`}
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
      {/* VIEW 5: GIOCHI DI SVAGO LIBERO (LABIRINTO, TROVA LE DIFFERENZE, TRIS)     */}
      {/* ========================================================================= */}
      {currentView === 'svago' && (
        <SvagoArena
          levelNumber={progress.currentLevel}
          childProfile={progress.childProfile}
          isFreePlay
          onComplete={() => setCurrentView('title')}
          onExitToTitle={() => setCurrentView('title')}
        />
      )}

      {/* ========================================================================= */}
      {/* SETTINGS MODAL (AREA GENITORI, CLOUD GOOGLE, COMPLEANNO, PROFILO, AUDIO)  */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div
          className="safe-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm animate-pop-in overflow-y-auto"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="home-wood-outer w-full max-w-[445px] rounded-[28px] p-[5px] shadow-[0_24px_60px_rgba(15,23,42,0.55)] max-h-[92dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-[#fffef8] via-[#fff9eb] to-[#fef3d8] rounded-[23px] p-4 sm:p-5 text-slate-800 border border-amber-200/80 overflow-y-auto">
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
                      Genitori, Cloud Google Multi-Device e Audio
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

              {/* Clean Orderly Settings Actions */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setIsSettingsOpen(false);
                    setIsParentsOpen(true);
                  }}
                  className="w-full rounded-2xl px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-between gap-3 transition cursor-pointer text-left group shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/35 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-indigo-300" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-fun font-extrabold text-[15px] text-white leading-tight">
                        Area Genitori · Accesso PIN
                      </span>
                      <span className="block font-fun font-medium text-xs text-slate-300 leading-snug mt-0.5">
                        {progress.parentPinHash
                          ? 'Report, Audio Overview, PDF, Certificati e Cloud'
                          : 'Imposta il PIN al primo accesso per report e PDF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FileText className="w-4 h-4 text-amber-300" />
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* GOOGLE CLOUD SYNC MULTI-DEVICE CARD */}
                <div className="w-full rounded-2xl p-3.5 bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 border border-sky-400/40 text-white shadow-sm">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                        <Cloud className="w-4.5 h-4.5 text-sky-300" />
                      </span>
                      <div className="min-w-0">
                        <span className="block font-fun font-extrabold text-sm text-white leading-tight">
                          Accesso Google · Progressi Multi-Dispositivo
                        </span>
                        <span className="block font-fun font-medium text-[11px] text-sky-200/90 leading-snug mt-0.5">
                          {cloudSyncState.uid
                            ? `Connesso: ${cloudSyncState.email || cloudSyncState.displayName}`
                            : 'Continua su Smartphone, Tablet e Foldable senza perdere i progressi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {cloudSyncState.syncError && (
                    <p className="mt-2 text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-400/40 rounded-xl px-2.5 py-1.5">
                      {cloudSyncState.syncError}
                    </p>
                  )}

                  {cloudSyncState.uid ? (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="text-[10.5px] text-slate-300">
                        <span className="text-emerald-300 font-bold">✓ Sincronizzato</span>
                        {cloudSyncState.lastSyncedAt && (
                          <span>
                            {' · '}
                            {new Date(cloudSyncState.lastSyncedAt).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleManualCloudRestore}
                          disabled={cloudSyncState.isSyncing}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-300/40 text-sky-100 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                          title="Sincronizza e unisci i progressi tra dispositivi"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncState.isSyncing ? 'animate-spin' : ''}`} />
                          <span>Sincronizza Ora</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleGoogleSignOut}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Disconnetti account Google"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Esci</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={cloudSyncState.isSyncing}
                      className="mt-2.5 w-full py-2 px-3 rounded-xl bg-white hover:bg-sky-50 text-slate-900 font-fun font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                    >
                      <Cloud className="w-4 h-4 text-sky-600" />
                      <span>
                        {cloudSyncState.isSyncing
                          ? 'Connessione a Google in corso...'
                          : 'Accedi con Google e Salva Progressi in Cloud'}
                      </span>
                    </button>
                  )}
                </div>

                {/* AGE-ADAPTIVE GRAPHICS EVOLUTION + BIRTHDAY CELEBRATION BUTTON */}
                <div className="w-full rounded-2xl px-3.5 py-2.5 bg-amber-50/90 border border-amber-300/80 text-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 font-fun font-extrabold text-xs text-amber-950">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Grafica Evolutiva: {ageTheme.stageBadge}</span>
                    </span>
                    <span className="block text-[11px] font-medium text-amber-900/85 mt-0.5">
                      {birthdayStatus.isBirthdayToday
                        ? `🎂 Oggi è il compleanno di ${childName}!`
                        : `🎂 Compleanno: ${birthdayStatus.nextBirthdayFormatted} (-${birthdayStatus.daysUntilBirthday} giorni)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playFanfare();
                      setIsSettingsOpen(false);
                      setIsBirthdayModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-fun font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Cake className="w-3.5 h-3.5" />
                    <span>Festeggia</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setIsSettingsOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full rounded-2xl px-4 py-3 bg-white hover:bg-amber-50/90 border border-amber-200/90 text-slate-800 flex items-center justify-between gap-3 transition cursor-pointer text-left group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <span className="inline-flex items-center">
                        <UserRound className="w-4.5 h-4.5" />
                        <Camera className="w-3 h-3 text-indigo-500 -ml-1 mt-2.5" />
                      </span>
                    </span>
                    <div className="min-w-0">
                      <span className="block font-fun font-extrabold text-[15px] text-slate-900 leading-tight">
                        Profilo &amp; Foto Sfondo
                      </span>
                      <span className="block font-fun font-medium text-xs text-slate-600 leading-snug mt-0.5">
                        {childName} · {ageInfo.shortAgeLabel} · Personalizza Home
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <PWAInstallButton />

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setIsSettingsOpen(false);
                    setIsPrivacyOpen(true);
                  }}
                  className="w-full rounded-2xl px-4 py-2.5 bg-white hover:bg-emerald-50/70 border border-amber-200/80 text-slate-800 flex items-center justify-between gap-3 transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-fun font-bold text-sm text-slate-900 leading-tight">
                        Privacy Policy &amp; Certificati 2026
                      </span>
                      <span className="block font-fun font-medium text-[11.5px] text-slate-500 leading-snug">
                        Foto 100% locali · Cloud Sync Google protetto
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
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
          cloudSyncState={cloudSyncState}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onManualCloudSave={handleManualCloudSave}
          onManualCloudRestore={handleManualCloudRestore}
          onOpenBirthdayCelebration={() => {
            setIsParentsOpen(false);
            setIsBirthdayModalOpen(true);
          }}
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
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onUpdateParentPin={(pinHash, pinHint) => {
            updateProgress(prev => ({
              ...prev,
              parentPinHash: pinHash,
              parentPinHint: pinHint,
            }));
          }}
          onToggleParentPreviewMode={handleToggleParentPreviewMode}
          onClearAdultFilteredTrials={handleClearAdultFilteredTrials}
          onSaveArchivedOverview={handleSaveArchivedOverview}
          onDeleteArchivedOverview={handleDeleteArchivedOverview}
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
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE BIRTHDAY REMINDER & CELEBRATION MODAL                         */}
      {/* ========================================================================= */}
      {isBirthdayModalOpen && (
        <BirthdayCelebrationModal
          childName={childName}
          childGender={childProfile?.gender}
          ageYears={birthdayStatus.isBirthdayToday ? birthdayStatus.turningAgeYears : ageInfo.years}
          isActualBirthdayToday={birthdayStatus.isBirthdayToday}
          alreadyClaimedGiftThisYear={isBirthdayGiftClaimedThisYear}
          onClaimBirthdayGift={handleClaimBirthdayGift}
          onClose={() => setIsBirthdayModalOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* GDPR PRIVACY POLICY MODAL (100% LOCAL DEVICE STORAGE)                     */}
      {/* ========================================================================= */}
      {isPrivacyOpen && (
        <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} />
      )}
    </div>
  );
}

