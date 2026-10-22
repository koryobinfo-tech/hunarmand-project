const DB_NAME = "hunarmand-db";
const STORE = "catalog";
const KEY = "snapshot";
export const MAX_STORE_BYTES = 20 * 1024 * 1024;

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadLocalCatalog<T>(): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveLocalCatalog(data: unknown) {
  if (typeof indexedDB === "undefined") return;
  const raw = JSON.stringify(data);
  if (raw.length > MAX_STORE_BYTES) {
    throw new Error("Ҳаҷми файлҳо аз 20 МБ зиёд шуд. Суратро хурдтар кунед.");
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(data, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function mergeById<T extends { id: string }>(server: T[], local: T[] | null | undefined): T[] {
  const map = new Map<string, T>();
  for (const item of server || []) map.set(item.id, item);
  for (const item of local || []) map.set(item.id, item);
  return [...map.values()];
}
