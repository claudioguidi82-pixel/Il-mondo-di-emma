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
 * stays compact (< 180 KB), strictly respecting the 250,000-char blueprint limit and
 * keeping personal photos 100% on the local device.
 */
function buildCloudPayloadObject(progress: UserProgress) {
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

  let syncPayload = JSON.stringify(lightweightEnvelope);
  if (syncPayload.length > 245000) {
    // Further trim history if very large
    syncPayload = JSON.stringify({
      ...lightweightEnvelope,
      levelHistory: (lightweightEnvelope.levelHistory || []).slice(-60),
      archivedReportOverviews: (lightweightEnvelope.archivedReportOverviews || []).slice(0, 15),
    }).slice(0, 249000);
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
 * Inteligently merges local progress with cloud progress so switching between
 * smartphone, tablet, and foldable never loses solved levels, stickers, or archived reports.
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
      : primary.childProfile;

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
    totalPuzzlesSolved: Math.max(
      local.totalPuzzlesSolved || 0,
      cloud.totalPuzzlesSolved || 0
    ),
    totalAttempts: Math.max(local.totalAttempts || 0, cloud.totalAttempts || 0),
    completedPuzzleIds: mergedCompletedIds,
    unlockedStickerIds: mergedStickers.length > 0 ? mergedStickers : ['stk_star'],
    archivedReportOverviews: mergedArchives,
    savedDrawings:
      (local.savedDrawings || []).some((d) => Boolean(d.dataUrl))
        ? local.savedDrawings
        : primary.savedDrawings,
    parentPinHash: primary.parentPinHash || secondary.parentPinHash,
    parentPinHint: primary.parentPinHint || secondary.parentPinHint,
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

export async function saveUserProgressToFirestore(
  progress: UserProgress
): Promise<{ updatedAt: string; deviceLabel: string } | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  const docPath = `user_progress/${currentUser.uid}`;
  const docRef = doc(db, 'user_progress', currentUser.uid);
  const payload = buildCloudPayloadObject(progress);

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        ownerId: currentUser.uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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
    const data = snap.data();
    const rawSyncPayload = typeof data.syncPayload === 'string' ? data.syncPayload : '';
    let restored: UserProgress | null = null;
    if (rawSyncPayload) {
      try {
        const parsed = JSON.parse(rawSyncPayload);
        restored = sanitizeAndValidateProgress(parsed);
      } catch {
        restored = null;
      }
    }

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
    syncedAtLabel: string | null;
    deviceLabel: string | null;
  }) => void
): () => void {
  const docPath = `user_progress/${userId}`;
  const docRef = doc(db, 'user_progress', userId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const rawSyncPayload = typeof data.syncPayload === 'string' ? data.syncPayload : '';
      if (!rawSyncPayload) return;
      try {
        const parsed = JSON.parse(rawSyncPayload);
        const restored = sanitizeAndValidateProgress(parsed);
        if (!restored) return;
        const ts = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
        const syncedAtLabel = ts
          ? ts.toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;
        const deviceLabel = typeof data.deviceLabel === 'string' ? data.deviceLabel : null;
        onRemoteUpdate({
          progress: restored,
          syncedAtLabel,
          deviceLabel,
        });
      } catch {
        // Ignore malformed snapshot
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}
