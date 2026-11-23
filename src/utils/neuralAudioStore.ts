// Persistent IndexedDB LRU cache for realistic Gemini male voice WAV clips.
// Preserves the exact non-robotic Gemini male voice across page reloads and saves TTS quota.

const DB_NAME = 'il_mio_mondo_neural_voice_v1';
const STORE_NAME = 'clips';
const MAX_STORED_CLIPS = 250;

interface StoredAudioClip {
  key: string;
  blob: Blob;
  mimeType: string;
  lastUsedAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openVoiceDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export async function getPersistedNeuralClip(key: string): Promise<Blob | null> {
  const db = await openVoiceDb();
  if (!db) return null;

  return new Promise<Blob | null>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);

      getReq.onsuccess = () => {
        const record = getReq.result as StoredAudioClip | undefined;
        if (!record || !(record.blob instanceof Blob) || record.blob.size < 44) {
          resolve(null);
          return;
        }
        try {
          store.put({
            ...record,
            lastUsedAt: Date.now(),
          });
        } catch {
          // ignore LRU timestamp update failure
        }
        resolve(record.blob);
      };
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function savePersistedNeuralClip(
  key: string,
  blob: Blob,
  mimeType: string
): Promise<void> {
  if (!(blob instanceof Blob) || blob.size < 44) return;
  const db = await openVoiceDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredAudioClip = {
        key,
        blob,
        mimeType,
        lastUsedAt: Date.now(),
      };
      store.put(record);

      const countReq = store.count();
      countReq.onsuccess = () => {
        const total = countReq.result;
        if (total <= MAX_STORED_CLIPS) return;
        const toDelete = total - MAX_STORED_CLIPS;
        let deleted = 0;
        const idx = store.index('lastUsedAt');
        const cursorReq = idx.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && deleted < toDelete) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
