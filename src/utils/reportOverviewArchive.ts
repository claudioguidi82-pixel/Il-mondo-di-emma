/**
 * Local IndexedDB storage for archived Audio Overview WAV blobs.
 * Keeps large WAV files out of localStorage (which has a 5 MB limit)
 * while allowing parents to replay or download archived daily reports by date.
 */

const DB_NAME = 'il_mio_mondo_overview_audio_v1';
const STORE_NAME = 'audio_blobs';
const DB_VERSION = 1;

interface StoredAudioRecord {
  id: string;
  base64Audio: string;
  mimeType: string;
  savedAt: string;
}

function openAudioDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveOverviewAudioToIndexedDb(
  id: string,
  base64Audio: string,
  mimeType = 'audio/wav'
): Promise<boolean> {
  if (!id || !base64Audio) return false;
  const db = await openAudioDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredAudioRecord = {
        id,
        base64Audio,
        mimeType,
        savedAt: new Date().toISOString(),
      };
      store.put(record);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function loadOverviewAudioFromIndexedDb(
  id: string
): Promise<{ base64Audio: string; mimeType: string } | null> {
  if (!id) return null;
  const db = await openAudioDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        db.close();
        const res = req.result as StoredAudioRecord | undefined;
        if (res && res.base64Audio) {
          resolve({ base64Audio: res.base64Audio, mimeType: res.mimeType || 'audio/wav' });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function deleteOverviewAudioFromIndexedDb(id: string): Promise<void> {
  if (!id) return;
  const db = await openAudioDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
