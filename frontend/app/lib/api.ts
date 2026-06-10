const API_PROXY_URL = '/api/backend';
const DEFAULT_SERVER_API_URL = 'http://127.0.0.1:5000';

type AppWritableFileStream = {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
};

type AppFileHandle = {
  createWritable(): Promise<AppWritableFileStream>;
};

type AppDirectoryHandle = {
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<AppFileHandle>;
  queryPermission?: (options?: { mode?: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: 'readwrite' }) => Promise<PermissionState>;
};

type AppWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'readwrite' }) => Promise<AppDirectoryHandle>;
};

interface ApiFilePayload {
  files?: Array<{
    filename: string;
    contentType?: string;
    contentBase64: string;
    size?: number;
  }>;
  defaultOutputDir?: string;
}

export interface SaveSummary {
  count: number;
  target: string;
  filenames: string[];
  paths: string[];
}

const DEFAULT_OUTPUT_LABEL = 'Pasta padrao do navegador';
const OUTPUT_DIRECTORY_DB = 'pdf-tools-output-directory';
const OUTPUT_DIRECTORY_STORE = 'settings';
const OUTPUT_DIRECTORY_KEY = 'selected-output-directory';

type PersistedOutputDirectory = {
  id: string;
  name: string;
  handle: AppDirectoryHandle;
};

let selectedOutputDirectory: AppDirectoryHandle | null = null;
let selectedOutputDirectoryName = '';
let selectedOutputDirectoryLoaded = false;
let selectedOutputDirectoryLoadPromise: Promise<void> | null = null;

function dispatchOutputDirectoryChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('output-directory-change'));
  }
}

function canPersistOutputDirectory(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openOutputDirectoryDb(): Promise<IDBDatabase | null> {
  if (!canPersistOutputDirectory()) return Promise.resolve(null);

  return new Promise((resolve) => {
    let done = false;
    const finish = (db: IDBDatabase | null) => {
      if (done) {
        db?.close();
        return;
      }
      done = true;
      resolve(db);
    };

    const request = window.indexedDB.open(OUTPUT_DIRECTORY_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTPUT_DIRECTORY_STORE)) {
        db.createObjectStore(OUTPUT_DIRECTORY_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => finish(request.result);
    request.onerror = () => finish(null);
    request.onblocked = () => finish(null);
  });
}

async function getPersistedOutputDirectory(): Promise<PersistedOutputDirectory | null> {
  const db = await openOutputDirectoryDb();
  if (!db) return null;

  return new Promise((resolve) => {
    let done = false;
    const finish = (value: PersistedOutputDirectory | null) => {
      if (done) return;
      done = true;
      db.close();
      resolve(value);
    };

    try {
      const transaction = db.transaction(OUTPUT_DIRECTORY_STORE, 'readonly');
      const request = transaction.objectStore(OUTPUT_DIRECTORY_STORE).get(OUTPUT_DIRECTORY_KEY);

      request.onsuccess = () => {
        finish((request.result as PersistedOutputDirectory | undefined) || null);
      };
      request.onerror = () => finish(null);
      transaction.onerror = () => finish(null);
      transaction.onabort = () => finish(null);
    } catch {
      finish(null);
    }
  });
}

async function persistOutputDirectory(directory: AppDirectoryHandle): Promise<void> {
  const db = await openOutputDirectoryDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      db.close();
      resolve();
    };

    try {
      const transaction = db.transaction(OUTPUT_DIRECTORY_STORE, 'readwrite');
      transaction.objectStore(OUTPUT_DIRECTORY_STORE).put({
        id: OUTPUT_DIRECTORY_KEY,
        name: directory.name,
        handle: directory,
      });
      transaction.oncomplete = finish;
      transaction.onerror = finish;
      transaction.onabort = finish;
    } catch {
      finish();
    }
  });
}

async function forgetPersistedOutputDirectory(): Promise<void> {
  const db = await openOutputDirectoryDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      db.close();
      resolve();
    };

    try {
      const transaction = db.transaction(OUTPUT_DIRECTORY_STORE, 'readwrite');
      transaction.objectStore(OUTPUT_DIRECTORY_STORE).delete(OUTPUT_DIRECTORY_KEY);
      transaction.oncomplete = finish;
      transaction.onerror = finish;
      transaction.onabort = finish;
    } catch {
      finish();
    }
  });
}

export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return `${API_PROXY_URL}${path}`;
  }

  const env: Record<string, string | undefined> =
    typeof process !== 'undefined' ? process.env : {};
  const serverApiUrl =
    env.BACKEND_INTERNAL_URL ||
    env.NEXT_PUBLIC_API_URL ||
    DEFAULT_SERVER_API_URL;

  return `${serverApiUrl}${path}`;
}

export function supportsOutputDirectoryPicker(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as AppWindow).showDirectoryPicker === 'function';
}

export function getOutputDirectoryLabel(): string {
  return selectedOutputDirectoryName || DEFAULT_OUTPUT_LABEL;
}

export async function loadSavedOutputDirectory(): Promise<string> {
  if (selectedOutputDirectoryLoaded) return getOutputDirectoryLabel();

  if (!selectedOutputDirectoryLoadPromise) {
    selectedOutputDirectoryLoadPromise = (async () => {
      const persisted = await getPersistedOutputDirectory();
      if (persisted?.handle) {
        selectedOutputDirectory = persisted.handle;
        selectedOutputDirectoryName = persisted.name || persisted.handle.name;
      }
      selectedOutputDirectoryLoaded = true;
      dispatchOutputDirectoryChange();
    })();
  }

  await selectedOutputDirectoryLoadPromise.catch(() => {
    selectedOutputDirectoryLoaded = true;
  });

  return getOutputDirectoryLabel();
}

export async function selectOutputDirectory(): Promise<string> {
  const picker = (window as AppWindow).showDirectoryPicker;
  if (!picker) {
    selectedOutputDirectory = null;
    selectedOutputDirectoryName = '';
    selectedOutputDirectoryLoaded = true;
    void forgetPersistedOutputDirectory();
    return getOutputDirectoryLabel();
  }

  selectedOutputDirectory = await picker({ mode: 'readwrite' });
  selectedOutputDirectoryName = selectedOutputDirectory.name;
  selectedOutputDirectoryLoaded = true;
  await persistOutputDirectory(selectedOutputDirectory);
  dispatchOutputDirectoryChange();
  return selectedOutputDirectoryName;
}

export function clearOutputDirectory() {
  selectedOutputDirectory = null;
  selectedOutputDirectoryName = '';
  selectedOutputDirectoryLoaded = true;
  void forgetPersistedOutputDirectory();
  dispatchOutputDirectoryChange();
}

function safeFilename(filename: string): string {
  const safe = (filename || 'arquivo')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return safe || 'arquivo';
}

async function ensureDirectoryPermission(directory: AppDirectoryHandle): Promise<boolean> {
  if (!directory.queryPermission || !directory.requestPermission) return true;
  const query = await directory.queryPermission({ mode: 'readwrite' });
  if (query === 'granted') return true;
  const request = await directory.requestPermission({ mode: 'readwrite' });
  return request === 'granted';
}

async function saveBlobToSelectedDirectory(blob: Blob, filename: string): Promise<SaveSummary | null> {
  await loadSavedOutputDirectory();
  if (!selectedOutputDirectory) return null;
  const permitted = await ensureDirectoryPermission(selectedOutputDirectory);
  if (!permitted) return null;

  const outputName = safeFilename(filename);
  const fileHandle = await selectedOutputDirectory.getFileHandle(outputName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  return {
    count: 1,
    target: selectedOutputDirectory.name,
    filenames: [outputName],
    paths: [outputName],
  };
}

async function saveBlobToBrowserDefault(blob: Blob, filename: string): Promise<SaveSummary> {
  const outputName = safeFilename(filename);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = outputName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);

  return {
    count: 1,
    target: DEFAULT_OUTPUT_LABEL,
    filenames: [outputName],
    paths: [outputName],
  };
}

export async function downloadBlob(blob: Blob, filename: string): Promise<SaveSummary> {
  let selectedResult: SaveSummary | null = null;
  try {
    selectedResult = await saveBlobToSelectedDirectory(blob, filename);
  } catch {
    selectedResult = null;
  }
  const result = selectedResult || await saveBlobToBrowserDefault(blob, filename);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('output-saved', { detail: result }));
  }
  return result;
}

function filenameFromDisposition(response: Response, fallback: string): string {
  const disposition = response.headers.get('Content-Disposition') || '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded?.[1]) return decodeURIComponent(encoded[1].replace(/"/g, ''));
  const normal = disposition.match(/filename="?([^";]+)"?/i);
  return normal?.[1] || fallback;
}

function base64ToBlob(contentBase64: string, contentType = 'application/octet-stream'): Blob {
  const binary = atob(contentBase64);
  const chunks: BlobPart[] = [];
  for (let offset = 0; offset < binary.length; offset += 8192) {
    const slice = binary.slice(offset, offset + 8192);
    const bytes = new Uint8Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      bytes[i] = slice.charCodeAt(i);
    }
    chunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
  return new Blob(chunks, { type: contentType });
}

export async function saveResponseFiles(response: Response, fallbackFilename: string): Promise<SaveSummary> {
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json() as ApiFilePayload;
    if (Array.isArray(payload.files)) {
      const summaries: SaveSummary[] = [];
      for (const file of payload.files) {
        const blob = base64ToBlob(file.contentBase64, file.contentType);
        summaries.push(await downloadBlob(blob, file.filename));
      }
      return {
        count: summaries.reduce((total, item) => total + item.count, 0),
        target: summaries[0]?.target || payload.defaultOutputDir || getOutputDirectoryLabel(),
        filenames: summaries.flatMap((item) => item.filenames),
        paths: summaries.flatMap((item) => item.paths),
      };
    }
  }

  const blob = await response.blob();
  return downloadBlob(blob, filenameFromDisposition(response, fallbackFilename));
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export async function apiPost(path: string, formData: FormData): Promise<Response> {
  const url = getApiUrl(path);
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return response;
  } catch (error) {
    throw new Error(
      `Nao foi possivel conectar ao servidor da API em ${url}. Verifique se o backend esta rodando na porta 5000.`,
      { cause: error },
    );
  }
}

export async function apiPostJson(path: string, data: Record<string, unknown>): Promise<Response> {
  const url = getApiUrl(path);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    throw new Error(
      `Nao foi possivel conectar ao servidor da API em ${url}. Verifique se o backend esta rodando na porta 5000.`,
      { cause: error },
    );
  }
}
