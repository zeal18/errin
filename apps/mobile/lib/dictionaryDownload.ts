import {
  createDownloadResumable,
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  deleteAsync,
  type DownloadProgressData,
} from 'expo-file-system/legacy';
import { devLog } from './devLog';
import { CURRENT_DICTIONARY_VERSION } from '@errin/core';

const WIKDICT_BASE_URL = 'https://download.wikdict.com/dictionaries/sqlite/';
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

export interface PairDownloadProgress {
  fraction: number;
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}

export interface PairDownloadHandle {
  promise: Promise<{ first: DictionaryDownloadResult; second: DictionaryDownloadResult }>;
  cancel: () => Promise<void>;
}

export function getDictionaryFileName(
  sourceLang: string,
  targetLang: string,
  version: string = CURRENT_DICTIONARY_VERSION.id
): string {
  return `${sourceLang}-${targetLang}-${version}.sqlite3`;
}

// WikDict's remote files are not version-suffixed — the version is the directory segment.
function getRemoteDictionaryFileName(sourceLang: string, targetLang: string): string {
  return `${sourceLang}-${targetLang}.sqlite3`;
}

export function getDictionaryUrl(
  sourceLang: string,
  targetLang: string,
  version: string = CURRENT_DICTIONARY_VERSION.id
): string {
  return `${WIKDICT_BASE_URL}${version}/${getRemoteDictionaryFileName(sourceLang, targetLang)}`;
}

function getDictionaryDir(): string {
  if (!documentDirectory) {
    throw new Error('Document directory unavailable on this platform');
  }
  return `${documentDirectory}${DICT_SUBDIR}/`;
}

export function getDictionaryFilePath(
  sourceLang: string,
  targetLang: string,
  version: string = CURRENT_DICTIONARY_VERSION.id
): string {
  return `${getDictionaryDir()}${getDictionaryFileName(sourceLang, targetLang, version)}`;
}

async function ensureDictionaryDir(): Promise<void> {
  const dir = getDictionaryDir();
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
}

export function startPairDownload(
  nativeLang: string,
  studiedLang: string,
  onProgress: (progress: PairDownloadProgress) => void
): PairDownloadHandle {
  const firstPair = `${nativeLang}-${studiedLang}`;
  const secondPair = `${studiedLang}-${nativeLang}`;

  devLog(`Pair download started: ${firstPair} + ${secondPair}`);

  let firstHandle: DownloadHandle | null = null;
  let secondHandle: DownloadHandle | null = null;
  let completed = false;
  let firstTotalExpected = 0;

  const promise: Promise<{ first: DictionaryDownloadResult; second: DictionaryDownloadResult }> =
    (async () => {
      firstHandle = startDictionaryDownload(nativeLang, studiedLang, (progress) => {
        firstTotalExpected = progress.totalBytesExpectedToWrite;
        onProgress({
          fraction: progress.fraction * 0.5,
          totalBytesWritten: progress.totalBytesWritten,
          totalBytesExpectedToWrite: progress.totalBytesExpectedToWrite,
        });
      });

      const firstResult = await firstHandle.promise;

      secondHandle = startDictionaryDownload(studiedLang, nativeLang, (progress) => {
        onProgress({
          fraction: 0.5 + progress.fraction * 0.5,
          totalBytesWritten: firstTotalExpected + progress.totalBytesWritten,
          totalBytesExpectedToWrite: firstTotalExpected + progress.totalBytesExpectedToWrite,
        });
      });

      const secondResult = await secondHandle.promise;
      completed = true;
      devLog(`Pair download completed: ${firstPair} + ${secondPair}`);
      return { first: firstResult, second: secondResult };
    })().catch((e) => {
      completed = true;
      devLog(`Pair download failed: ${firstPair} + ${secondPair}, error: ${e}`);
      throw e;
    });

  const cancel = async () => {
    await firstHandle?.cancel().catch(() => {});
    await secondHandle?.cancel().catch(() => {});
    if (!completed) {
      try {
        const firstPath = getDictionaryFilePath(nativeLang, studiedLang);
        await deleteAsync(firstPath, { idempotent: true });
      } catch {}
      try {
        const secondPath = getDictionaryFilePath(studiedLang, nativeLang);
        await deleteAsync(secondPath, { idempotent: true });
      } catch {}
    }
  };

  return { promise, cancel };
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
  const langPair = `${sourceLang}-${targetLang}`;
  const url = getDictionaryUrl(sourceLang, targetLang);
  const destPath = getDictionaryFilePath(sourceLang, targetLang);

  devLog(`Download started: ${langPair}`);

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
    devLog(`Download completed: ${langPair}`);
    return {
      filePath: result.uri,
      downloadedAt: Date.now(),
    };
  })().catch((e) => {
    completed = true;
    devLog(`Download failed: ${langPair}, error: ${e}`);
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
