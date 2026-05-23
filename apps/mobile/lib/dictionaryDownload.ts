import {
  createDownloadResumable,
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  deleteAsync,
  type DownloadProgressData,
} from 'expo-file-system/legacy';

export const WIKDICT_VERSION = '2_2025-11';

const WIKDICT_BASE_URL = `https://download.wikdict.com/dictionaries/sqlite/${WIKDICT_VERSION}/`;
const DICT_SUBDIR = 'dictionaries';

export interface DictionaryDownloadResult {
  filePath: string;
  downloadedAt: number;
}

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  fraction: number;
}

export function getDictionaryFileName(sourceLang: string, targetLang: string): string {
  return `${sourceLang}-${targetLang}.sqlite3`;
}

export function getDictionaryUrl(sourceLang: string, targetLang: string): string {
  return `${WIKDICT_BASE_URL}${getDictionaryFileName(sourceLang, targetLang)}`;
}

function getDictionaryDir(): string {
  if (!documentDirectory) {
    throw new Error('Document directory unavailable on this platform');
  }
  return `${documentDirectory}${DICT_SUBDIR}/`;
}

export function getDictionaryFilePath(sourceLang: string, targetLang: string): string {
  return `${getDictionaryDir()}${getDictionaryFileName(sourceLang, targetLang)}`;
}

async function ensureDictionaryDir(): Promise<void> {
  const dir = getDictionaryDir();
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
}

export interface DownloadHandle {
  promise: Promise<DictionaryDownloadResult>;
  cancel: () => Promise<void>;
}

export function startDictionaryDownload(
  sourceLang: string,
  targetLang: string,
  onProgress: (progress: DownloadProgress) => void
): DownloadHandle {
  const url = getDictionaryUrl(sourceLang, targetLang);
  const destPath = getDictionaryFilePath(sourceLang, targetLang);

  const progressCallback = (data: DownloadProgressData) => {
    const total = data.totalBytesExpectedToWrite;
    const written = data.totalBytesWritten;
    onProgress({
      totalBytesWritten: written,
      totalBytesExpectedToWrite: total,
      fraction: total > 0 ? written / total : 0,
    });
  };

  const resumable = createDownloadResumable(url, destPath, {}, progressCallback);

  let completed = false;

  const promise: Promise<DictionaryDownloadResult> = (async () => {
    await ensureDictionaryDir();
    // Remove any partial file from a prior failed attempt to avoid append/rename issues.
    const existing = await getInfoAsync(destPath);
    if (existing.exists) {
      await deleteAsync(destPath, { idempotent: true });
    }
    const result = await resumable.downloadAsync();
    if (!result) {
      throw new Error('Download was cancelled');
    }
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Download failed with HTTP ${result.status}`);
    }
    completed = true;
    return {
      filePath: result.uri,
      downloadedAt: Date.now(),
    };
  })().catch((e) => {
    completed = true;
    throw e;
  });

  const cancel = async () => {
    await resumable.cancelAsync();
    if (!completed) {
      await deleteAsync(destPath, { idempotent: true });
    }
  };

  return { promise, cancel };
}
