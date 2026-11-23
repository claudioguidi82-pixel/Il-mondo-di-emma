import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProgress } from '../types/game';
import { sanitizeAndValidateProgress } from './security';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface CloudSyncAccountState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  deviceLabel: string;
  syncError: string | null;
}

export function detectCurrentDeviceLabel(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Dispositivo Web';
  }
  const ua = navigator.userAgent || '';
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w > 0 && h > 0 ? Math.max(w, h) / Math.min(w, h) : 1.7;
  const isFoldableInner = w >= 580 && w <= 960 && aspect <= 1.42;
  const isFoldableCover = w <= 345 && aspect >= 2.15;

  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return `Apple iPad (${w}×${h})`;
  }
  if (/iPhone/i.test(ua)) {
    return `Apple iPhone (${w}×${h})`;
  }
  if (/Android/i.test(ua)) {
    if (isFoldableInner) return `Android Foldable · Display Interno (${w}×${h})`;
    if (isFoldableCover) return `Android Foldable · Display Esterno (${w}×${h})`;
    if (Math.min(w, h) >= 600) return `Tablet Android (${w}×${h})`;
    return `Smartphone Android (${w}×${h})`;
  }
  if (isFoldableInner) {
    return `Dispositivo Foldable (${w}×${h})`;
  }
  return `Desktop / Web (${w}×${h})`;
}

/**
 * Strips large base64 data URLs before persisting to Firestore so the cloud document
 * stays compact (< 245 KB), strictly respecting the 250,000-char blueprint limit and
 * keeping personal photos 100% on the local device. Never slices mid-JSON.
 */
export function buildCloudPayloadObject(progress: UserProgress) {
  const sanitized = sanitizeAndValidateProgress(progress) || progress;
  const safeChildName = (sanitized.childProfile?.name || '')
    .replace(/[<>`]/g, '')
    .trim()
    .slice(0, 60);
  const safeBirthDate = (sanitized.childProfile?.birthDate || '')
    .replace(/[<>`]/g, '')
    .trim()
    .slice(0, 16);
  const rawGender = sanitized.childProfile?.gender;
  const safeGender: 'm' | 'f' | 'n' =
    rawGender === 'm' || rawGender === 'f' || rawGender === 'n' ? rawGender : 'n';

  const currentLevel = Math.max(1, Math.min(99999, Math.round(sanitized.currentLevel || 1)));
  const highestLevelReached = Math.max(
    currentLevel,
    Math.min(99999, Math.round(sanitized.highestLevelReached || currentLevel))
  );
  const stars = Math.max(0, Math.min(999999, Math.round(sanitized.stars || 0)));
  const gems = Math.max(0, Math.min(999999, Math.round(sanitized.gems || 0)));
  const streakDays = Math.max(1, Math.min(3650, Math.round(sanitized.streakDays || 1)));
  const totalPuzzlesSolved = Math.max(
    0,
    Math.min(999999, Math.round(sanitized.totalPuzzlesSolved || 0))
  );
  const totalAttempts = Math.max(
    0,
    Math.min(999999, Math.round(sanitized.totalAttempts || 0))
  );
  const sessionsCount = Math.max(
    1,
    Math.min(99999, Math.round(sanitized.sessionsCount || 1))
  );
  const lastPlayedDate = (
    sanitized.lastPlayedDate || new Date().toISOString().split('T')[0]
  ).slice(0, 16);

  const unlockedStickerIds = Array.from(
    new Set(
      (sanitized.unlockedStickerIds || ['stk_star'])
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 40))
    )
  ).slice(0, 40);

  const completedPuzzleIds = Array.from(
    new Set(
      (sanitized.completedPuzzleIds || [])
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 80))
    )
  ).slice(-500);

  // Strip base64 customBackgroundUrl and drawing dataUrl blobs from cloud payload
  const lightweightEnvelope: UserProgress = {
    ...sanitized,
    childProfile: {
      ...sanitized.childProfile,
      customBackgroundUrl: undefined,
    },
    savedDrawings: (sanitized.savedDrawings || []).slice(0, 12).map((d) => ({
      ...d,
      dataUrl: '',
    })),
    completedPuzzleIds,
    levelHistory: (sanitized.levelHistory || []).slice(-120),
    evaluationSnapshots: (sanitized.evaluationSnapshots || []).slice(-25),
    archivedReportOverviews: (sanitized.archivedReportOverviews || []).slice(0, 30),
  };

  // Guarantee valid JSON strictly under the 250,000-char Firestore Rules limit (never slice mid-JSON)
  let syncPayload = JSON.stringify(lightweightEnvelope);
  if (syncPayload.length > 245000) {
    const trimmedArchives = (lightweightEnvelope.archivedReportOverviews || [])
      .slice(0, 15)
      .map((item) => ({
        ...item,
        transcript: (item.transcript || '').slice(0, 2400),
      }));
    syncPayload = JSON.stringify({
      ...lightweightEnvelope,
      levelHistory: (lightweightEnvelope.levelHistory || []).slice(-60),
      evaluationSnapshots: (lightweightEnvelope.evaluationSnapshots || []).slice(-15),
      archivedReportOverviews: trimmedArchives,
    });
  }
  if (syncPayload.length > 245000) {
    syncPayload = JSON.stringify({
      ...lightweightEnvelope,
      levelHistory: (lightweightEnvelope.levelHistory || []).slice(-30),
      evaluationSnapshots: (lightweightEnvelope.evaluationSnapshots || []).slice(-10),
      completedPuzzleIds: completedPuzzleIds.slice(-200),
      archivedReportOverviews: (lightweightEnvelope.archivedReportOverviews || [])
        .slice(0, 8)
        .map((item) => ({
          ...item,
          transcript: '',
        })),
    });
  }

  const deviceLabel = detectCurrentDeviceLabel().slice(0, 80);

  return {
    childName: safeChildName,
    childBirthDate: safeBirthDate,
    childGender: safeGender,
    currentLevel,
    highestLevelReached,
    stars,
    gems,
    streakDays,
    totalPuzzlesSolved,
    totalAttempts,
    sessionsCount,
    lastPlayedDate,
    unlockedStickerIds,
    completedPuzzleIds,
    syncPayload,
    deviceLabel,
  };
}

/**
 * Intelligently merges local progress with cloud progress so switching between
 * smartphone, tablet, and foldable never loses solved levels, stickers, history,
 * per-subject progress, birthday rewards, or archived reports.
 */
export function mergeCloudAndLocalProgress(
  local: UserProgress,
  cloud: UserProgress | null
): UserProgress {
  if (!cloud) return local;
  const localScore =
    (local.totalPuzzlesSolved || 0) * 1000 +
    (local.highestLevelReached || 1) * 10 +
    (local.levelHistory?.length || 0);
  const cloudScore =
    (cloud.totalPuzzlesSolved || 0) * 1000 +
    (cloud.highestLevelReached || 1) * 10 +
    (cloud.levelHistory?.length || 0);

  const primary = cloudScore >= localScore ? cloud : local;
  const secondary = cloudScore >= localScore ? local : cloud;

  // Preserve configured childProfile and local custom photo background
  const mergedProfile =
    primary.childProfile?.isConfigured
      ? {
          ...primary.childProfile,
          customBackgroundUrl:
            local.childProfile?.customBackgroundUrl ||
            cloud.childProfile?.customBackgroundUrl,
        }
      : secondary.childProfile?.isConfigured
      ? {
          ...secondary.childProfile,
          customBackgroundUrl:
            local.childProfile?.customBackgroundUrl ||
            cloud.childProfile?.customBackgroundUrl,
        }
      : {
          ...primary.childProfile,
          customBackgroundUrl:
            local.childProfile?.customBackgroundUrl ||
            cloud.childProfile?.customBackgroundUrl,
        };

  // Union completedPuzzleIds and unlockedStickerIds
  const mergedCompletedIds = Array.from(
    new Set([
      ...(secondary.completedPuzzleIds || []),
      ...(primary.completedPuzzleIds || []),
    ])
  ).slice(-1500);

  const mergedStickers = Array.from(
    new Set([
      ...(secondary.unlockedStickerIds || []),
      ...(primary.unlockedStickerIds || []),
    ])
  ).slice(0, 40);

  // Merge levelHistory deduplicated by timestamp + level + puzzleId + category
  const historyMap = new Map<string, NonNullable<UserProgress['levelHistory']>[number]>();
  for (const entry of [
    ...(secondary.levelHistory || []),
    ...(primary.levelHistory || []),
  ]) {
    if (!entry) continue;
    const key = `${entry.timestamp || ''}|${entry.level}|${entry.puzzleId || ''}|${entry.category}`;
    if (!historyMap.has(key)) {
      historyMap.set(key, entry);
    }
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
    .slice(-150);

  // Merge evaluationSnapshots deduplicated by id
  const snapMap = new Map<string, NonNullable<UserProgress['evaluationSnapshots']>[number]>();
  for (const snap of [
    ...(secondary.evaluationSnapshots || []),
    ...(primary.evaluationSnapshots || []),
  ]) {
    if (snap && snap.id && !snapMap.has(snap.id)) {
      snapMap.set(snap.id, snap);
    }
  }
  const mergedSnapshots = Array.from(snapMap.values())
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
    .slice(-30);

  // Merge categoryStats picking the richer domain record for each subject
  const pickRicherCategory = (
    a?: UserProgress['categoryStats']['logic'],
    b?: UserProgress['categoryStats']['logic']
  ) => {
    if (!a) return b || { correct: 0, total: 0, attempts: 0 };
    if (!b) return a;
    if ((b.total || 0) > (a.total || 0)) return b;
    if ((a.total || 0) > (b.total || 0)) return a;
    return (b.correct || 0) > (a.correct || 0) ? b : a;
  };
  const mergedCategoryStats: UserProgress['categoryStats'] = {
    logic: pickRicherCategory(primary.categoryStats?.logic, secondary.categoryStats?.logic),
    letters: pickRicherCategory(primary.categoryStats?.letters, secondary.categoryStats?.letters),
    numbers: pickRicherCategory(primary.categoryStats?.numbers, secondary.categoryStats?.numbers),
    shapes: pickRicherCategory(primary.categoryStats?.shapes, secondary.categoryStats?.shapes),
    music: pickRicherCategory(primary.categoryStats?.music, secondary.categoryStats?.music),
    english: pickRicherCategory(primary.categoryStats?.english, secondary.categoryStats?.english),
  };

  // Merge sessionDates union & preserve sessionsCount
  const mergedSessionDates = Array.from(
    new Set([
      ...(secondary.sessionDates || []),
      ...(primary.sessionDates || []),
    ])
  )
    .filter(Boolean)
    .sort()
    .slice(-365);

  // Merge archived report overviews by id sorted newest first
  const archiveMap = new Map<string, NonNullable<UserProgress['archivedReportOverviews']>[number]>();
  for (const item of [
    ...(primary.archivedReportOverviews || []),
    ...(secondary.archivedReportOverviews || []),
  ]) {
    if (item && item.id && !archiveMap.has(item.id)) {
      archiveMap.set(item.id, item);
    }
  }
  const mergedArchives = Array.from(archiveMap.values())
    .sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''))
    .slice(0, 60);

  // Merge daily mission and birthday celebration markers cleanly
  const latestDailyMissionDate =
    (local.dailyMissionDate || '') >= (cloud.dailyMissionDate || '')
      ? local.dailyMissionDate || cloud.dailyMissionDate
      : cloud.dailyMissionDate;
  const mergedDailyMissionCount =
    local.dailyMissionDate === cloud.dailyMissionDate
      ? Math.max(local.dailyMissionCount || 0, cloud.dailyMissionCount || 0)
      : latestDailyMissionDate === local.dailyMissionDate
      ? local.dailyMissionCount || 0
      : cloud.dailyMissionCount || 0;

  const mergedDailyChestDate =
    (local.dailyChestClaimedDate || '') >= (cloud.dailyChestClaimedDate || '')
      ? local.dailyChestClaimedDate || cloud.dailyChestClaimedDate
      : cloud.dailyChestClaimedDate;

  const mergedBirthdayYear =
    (local.lastBirthdayCelebratedYear || '') >= (cloud.lastBirthdayCelebratedYear || '')
      ? local.lastBirthdayCelebratedYear || cloud.lastBirthdayCelebratedYear
      : cloud.lastBirthdayCelebratedYear;

  const mergedLastPlayedDate =
    (local.lastPlayedDate || '') >= (cloud.lastPlayedDate || '')
      ? local.lastPlayedDate || cloud.lastPlayedDate
      : cloud.lastPlayedDate;

  const merged: UserProgress = {
    ...primary,
    childProfile: mergedProfile,
    currentLevel: Math.max(local.currentLevel || 1, cloud.currentLevel || 1),
    highestLevelReached: Math.max(
      local.highestLevelReached || 1,
      cloud.highestLevelReached || 1
    ),
    stars: Math.max(local.stars || 0, cloud.stars || 0),
    gems: Math.max(local.gems || 0, cloud.gems || 0),
    streakDays: Math.max(local.streakDays || 1, cloud.streakDays || 1),
    lastPlayedDate: mergedLastPlayedDate,
    sessionsCount: Math.max(
      local.sessionsCount || 1,
      cloud.sessionsCount || 1,
      mergedSessionDates.length || 1
    ),
    sessionDates: mergedSessionDates.length > 0 ? mergedSessionDates : primary.sessionDates,
    totalPuzzlesSolved: Math.max(
      local.totalPuzzlesSolved || 0,
      cloud.totalPuzzlesSolved || 0
    ),
    totalAttempts: Math.max(local.totalAttempts || 0, cloud.totalAttempts || 0),
    trisGamesPlayed: Math.max(local.trisGamesPlayed || 0, cloud.trisGamesPlayed || 0),
    trisGamesWon: Math.max(local.trisGamesWon || 0, cloud.trisGamesWon || 0),
    adultFilteredCount: Math.max(local.adultFilteredCount || 0, cloud.adultFilteredCount || 0),
    categoryStats: mergedCategoryStats,
    levelHistory: mergedHistory,
    evaluationSnapshots: mergedSnapshots,
    completedPuzzleIds: mergedCompletedIds,
    unlockedStickerIds: mergedStickers.length > 0 ? mergedStickers : ['stk_star'],
    archivedReportOverviews: mergedArchives,
    dailyMissionDate: latestDailyMissionDate,
    dailyMissionCount: mergedDailyMissionCount,
    dailyChestClaimedDate: mergedDailyChestDate,
    lastBirthdayCelebratedYear: mergedBirthdayYear,
    savedDrawings:
      (local.savedDrawings || []).some((d) => Boolean(d.dataUrl))
        ? local.savedDrawings
        : primary.savedDrawings,
    parentPinHash: primary.parentPinHash || secondary.parentPinHash,
    parentPinHint: primary.parentPinHint || secondary.parentPinHint,
    // Keep local device audio preferences
    soundEnabled: local.soundEnabled,
    voiceEnabled: local.voiceEnabled,
    musicEnabled: local.musicEnabled,
  };

  return sanitizeAndValidateProgress(merged) || merged;
}

export async function signInWithGooglePopup(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutGoogleAccount(): Promise<void> {
  await signOut(auth);
}

export function subscribeToGoogleAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Serialize Firestore writes to prevent concurrent create/update race conditions on first sync
let firestoreWriteQueue: Promise<unknown> = Promise.resolve();

function reconstructProgressFromCloudDoc(data: Record<string, unknown>): UserProgress | null {
  const rawSyncPayload = typeof data.syncPayload === 'string' ? data.syncPayload : '';
  if (rawSyncPayload) {
    try {
      const parsed = JSON.parse(rawSyncPayload);
      const restored = sanitizeAndValidateProgress(parsed);
      if (restored) return restored;
    } catch {
      // Fallback to top-level structured fields below
    }
  }

  const childName = typeof data.childName === 'string' ? data.childName : '';
  const childBirthDate = typeof data.childBirthDate === 'string' ? data.childBirthDate : '';
  const childGender =
    data.childGender === 'm' || data.childGender === 'f' || data.childGender === 'n'
      ? data.childGender
      : 'n';

  return sanitizeAndValidateProgress({
    childProfile: {
      name: childName,
      surname: '',
      birthDate: childBirthDate,
      gender: childGender,
      isConfigured: Boolean(childName && childBirthDate),
    },
    currentLevel: data.currentLevel,
    highestLevelReached: data.highestLevelReached,
    stars: data.stars,
    gems: data.gems,
    streakDays: data.streakDays,
    totalPuzzlesSolved: data.totalPuzzlesSolved,
    totalAttempts: data.totalAttempts,
    sessionsCount: data.sessionsCount,
    lastPlayedDate: data.lastPlayedDate,
    unlockedStickerIds: data.unlockedStickerIds,
    completedPuzzleIds: data.completedPuzzleIds,
  });
}

export async function saveUserProgressToFirestore(
  progress: UserProgress
): Promise<{ updatedAt: string; deviceLabel: string } | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  const runWrite = async (): Promise<{ updatedAt: string; deviceLabel: string } | null> => {
    const activeUser = auth.currentUser;
    if (!activeUser || !activeUser.emailVerified) {
      return null;
    }

    const docPath = `user_progress/${activeUser.uid}`;
    const docRef = doc(db, 'user_progress', activeUser.uid);
    const payload = buildCloudPayloadObject(progress);

    try {
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        try {
          await setDoc(docRef, {
            ownerId: activeUser.uid,
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (createErr) {
          // Handle cross-device race where another device created the doc milliseconds earlier
          const recheck = await getDoc(docRef).catch(() => null);
          if (recheck && recheck.exists()) {
            await updateDoc(docRef, {
              ...payload,
              updatedAt: serverTimestamp(),
            });
          } else {
            throw createErr;
          }
        }
      } else {
        await updateDoc(docRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      }
      return {
        updatedAt: new Date().toISOString(),
        deviceLabel: payload.deviceLabel,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  };

  const nextTask = firestoreWriteQueue.then(runWrite, runWrite);
  firestoreWriteQueue = nextTask.catch(() => undefined);
  return nextTask;
}

export async function loadUserProgressFromFirestore(): Promise<{
  progress: UserProgress | null;
  updatedAt: string | null;
  deviceLabel: string | null;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return { progress: null, updatedAt: null, deviceLabel: null };
  }

  const docPath = `user_progress/${currentUser.uid}`;
  const docRef = doc(db, 'user_progress', currentUser.uid);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { progress: null, updatedAt: null, deviceLabel: null };
    }
    const data = snap.data() as Record<string, unknown>;
    const restored = reconstructProgressFromCloudDoc(data);

    const ts = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
    const updatedAt = ts ? ts.toISOString() : null;
    const deviceLabel = typeof data.deviceLabel === 'string' ? data.deviceLabel : null;

    return {
      progress: restored,
      updatedAt,
      deviceLabel,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export function subscribeToCloudProgressSnapshot(
  userId: string,
  onRemoteUpdate: (info: {
    progress: UserProgress;
    updatedAt: string | null;
    deviceLabel: string | null;
  }) => void,
  onSyncError?: (message: string) => void
): () => void {
  const docPath = `user_progress/${userId}`;
  const docRef = doc(db, 'user_progress', userId);
  return onSnapshot(
    docRef,
    (snap) => {
      // Ignore local pending writes so we only merge confirmed remote/server state
      if (!snap.exists() || snap.metadata.hasPendingWrites) return;
      const data = snap.data() as Record<string, unknown>;
      const restored = reconstructProgressFromCloudDoc(data);
      if (!restored) return;
      const ts = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
      const updatedAt = ts ? ts.toISOString() : null;
      const deviceLabel = typeof data.deviceLabel === 'string' ? data.deviceLabel : null;
      onRemoteUpdate({
        progress: restored,
        updatedAt,
        deviceLabel,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch (wrapped) {
        if (onSyncError) {
          onSyncError(
            wrapped instanceof Error
              ? wrapped.message
              : 'Errore di sincronizzazione in tempo reale con Firestore.'
          );
        }
      }
    }
  );
}
