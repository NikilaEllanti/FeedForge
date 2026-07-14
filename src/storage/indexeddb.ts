// ============================================================
// FeedForge — IndexedDB Wrapper (Embeddings Cache)
// ============================================================

import { IDB_NAME, IDB_VERSION, IDB_STORES } from '../shared/constants';

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(IDB_STORES.EMBEDDINGS)) {
        database.createObjectStore(IDB_STORES.EMBEDDINGS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(IDB_STORES.POST_CACHE)) {
        database.createObjectStore(IDB_STORES.POST_CACHE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ─── Embeddings Store ────────────────────────────────────────

interface EmbeddingRecord {
  id: string;
  embedding: number[];
  text: string;
  createdAt: number;
}

export async function getEmbedding(id: string): Promise<number[] | null> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(IDB_STORES.EMBEDDINGS, 'readonly');
    const store = tx.objectStore(IDB_STORES.EMBEDDINGS);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result as EmbeddingRecord | undefined;
      resolve(record?.embedding ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveEmbedding(
  id: string,
  text: string,
  embedding: number[],
): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(IDB_STORES.EMBEDDINGS, 'readwrite');
    const store = tx.objectStore(IDB_STORES.EMBEDDINGS);
    const record: EmbeddingRecord = { id, embedding, text, createdAt: Date.now() };
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearEmbeddings(): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(IDB_STORES.EMBEDDINGS, 'readwrite');
    const store = tx.objectStore(IDB_STORES.EMBEDDINGS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── Post Cache Store ────────────────────────────────────────

interface PostCacheRecord {
  id: string;
  data: Record<string, unknown>;
  cachedAt: number;
}

export async function getCachedPost(id: string): Promise<Record<string, unknown> | null> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(IDB_STORES.POST_CACHE, 'readonly');
    const store = tx.objectStore(IDB_STORES.POST_CACHE);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result as PostCacheRecord | undefined;
      resolve(record?.data ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function cachePost(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(IDB_STORES.POST_CACHE, 'readwrite');
    const store = tx.objectStore(IDB_STORES.POST_CACHE);
    const record: PostCacheRecord = { id, data, cachedAt: Date.now() };
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
