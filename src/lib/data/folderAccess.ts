const DB_NAME = 'copilot-report-handles';
const DB_VERSION = 1;
const STORE = 'handles';
const KEY = 'usage-dir';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await openDb();
  const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
}

async function ensureReadWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' } as const;
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if ((await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

/**
 * Gets a handle to the project's `data/usage/` directory, prompting the user
 * to pick it (once) via the File System Access API. The handle is cached in
 * IndexedDB so future calls don't need to re-prompt.
 */
export async function getUsageDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('This browser does not support saving directly to a folder.');
  }
  const cached = await loadHandle();
  if (cached && (await ensureReadWritePermission(cached))) {
    return cached;
  }
  const picked = await window.showDirectoryPicker({ id: 'copilot-report-usage-dir', mode: 'readwrite' });
  if (!(await ensureReadWritePermission(picked))) {
    throw new Error('Permission to write to the selected folder was not granted.');
  }
  await saveHandle(picked);
  return picked;
}

export async function writeFileToDirectory(dirHandle: FileSystemDirectoryHandle, filename: string, contents: string): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}
