import type { CostRecord, UsageRecord } from './types';

const DB_NAME = 'copilot-report-cache';
const DB_VERSION = 2;
const STORE = 'uploaded-files';
const COST_STORE = 'uploaded-cost-files';

export interface UploadedFileEntry {
  id: string;
  name: string;
  addedAt: string;
  records: UsageRecord[];
}

export interface UploadedCostFileEntry {
  id: string;
  name: string;
  addedAt: string;
  records: CostRecord[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!req.result.objectStoreNames.contains(COST_STORE)) {
        req.result.createObjectStore(COST_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persists a parsed, user-supplied NDJSON file so it survives page reloads. */
export async function saveUploadedFile(entry: UploadedFileEntry): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadUploadedFiles(): Promise<UploadedFileEntry[]> {
  const db = await openDb();
  const result = await new Promise<UploadedFileEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as UploadedFileEntry[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function deleteUploadedFile(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Persists a parsed, user-supplied AI usage cost CSV so it survives page reloads. */
export async function saveUploadedCostFile(entry: UploadedCostFileEntry): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(COST_STORE, 'readwrite');
    tx.objectStore(COST_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadUploadedCostFiles(): Promise<UploadedCostFileEntry[]> {
  const db = await openDb();
  const result = await new Promise<UploadedCostFileEntry[]>((resolve, reject) => {
    const tx = db.transaction(COST_STORE, 'readonly');
    const req = tx.objectStore(COST_STORE).getAll();
    req.onsuccess = () => resolve(req.result as UploadedCostFileEntry[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function deleteUploadedCostFile(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(COST_STORE, 'readwrite');
    tx.objectStore(COST_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
