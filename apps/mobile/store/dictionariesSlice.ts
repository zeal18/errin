import type { StateCreator } from 'zustand';
import { getDatabase, type InstalledDictionaryRow } from '../db';
import { closeDictionaryDatabase } from '../lib/dictionaryDb';
import { deleteAsync } from 'expo-file-system/legacy';
import type { InstalledDictionary } from '@errin/core';
import { CURRENT_DICTIONARY_VERSION } from '@errin/core';
import { getDictionaryFilePath, startPairDownload, type PairDownloadProgress } from '../lib/dictionaryDownload';
import type { ActivePairSlice } from './activePairSlice';
import type { SettingsSlice } from './settingsSlice';

export interface DictionariesSlice {
  dictionaries: InstalledDictionary[];
  dictionariesLoaded: boolean;
  hydrateDictionaries: () => Promise<void>;
  addDictionary: (dict: InstalledDictionary) => Promise<void>;
  // version omitted = remove every installed version of this direction
  removeDictionary: (sourceLang: string, targetLang: string, version?: string) => Promise<void>;
  removePair: (nativeLang: string, studiedLang: string) => Promise<void>;
  isPairBehindCurrentVersion: (nativeLang: string, studiedLang: string) => boolean;
  updatePair: (nativeLang: string, studiedLang: string, onProgress: (progress: PairDownloadProgress) => void) => Promise<void>;
}

function rowToDictionary(row: InstalledDictionaryRow): InstalledDictionary {
  return {
    sourceLang: row.source_lang,
    targetLang: row.target_lang,
    filePath: row.file_path,
    downloadedAt: row.downloaded_at,
    version: row.version,
  };
}

export const createDictionariesSlice: StateCreator<
  DictionariesSlice & ActivePairSlice & SettingsSlice,
  [],
  [],
  DictionariesSlice
> = (set, get) => ({
  dictionaries: [],
  dictionariesLoaded: false,

  hydrateDictionaries: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<InstalledDictionaryRow>(
      'SELECT source_lang, target_lang, version, file_path, downloaded_at FROM installed_dictionaries ORDER BY downloaded_at ASC'
    );
    set({
      dictionaries: rows.map(rowToDictionary),
      dictionariesLoaded: true,
    });
  },

  addDictionary: async (dict) => {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO installed_dictionaries (source_lang, target_lang, version, file_path, downloaded_at) VALUES (?, ?, ?, ?, ?)',
      [dict.sourceLang, dict.targetLang, dict.version, dict.filePath, dict.downloadedAt]
    );
    // Mirrors the (source_lang, target_lang, version) primary key: a different version of
    // the same direction is kept, since both coexist while an update is in flight.
    set((state) => ({
      dictionaries: [
        ...state.dictionaries.filter(
          (d) =>
            !(
              d.sourceLang === dict.sourceLang &&
              d.targetLang === dict.targetLang &&
              d.version === dict.version
            )
        ),
        dict,
      ],
    }));
  },

  removeDictionary: async (sourceLang, targetLang, version) => {
    const db = await getDatabase();
    // Without a version, every installed version of this direction is removed; mid-update
    // a direction can have two rows (old and new version).
    const versionClause = version === undefined ? '' : ' AND version = ?';
    const params =
      version === undefined ? [sourceLang, targetLang] : [sourceLang, targetLang, version];

    const rows = await db.getAllAsync<{ file_path: string }>(
      `SELECT file_path FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ?${versionClause}`,
      params
    );
    for (const row of rows) {
      if (!row.file_path) continue;
      await closeDictionaryDatabase(row.file_path);
      await deleteAsync(row.file_path, { idempotent: true });
    }

    await db.runAsync(
      `DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ?${versionClause}`,
      params
    );

    set((state) => ({
      dictionaries: state.dictionaries.filter(
        (d) =>
          !(
            d.sourceLang === sourceLang &&
            d.targetLang === targetLang &&
            (version === undefined || d.version === version)
          )
      ),
    }));
  },

  removePair: async (nativeLang, studiedLang) => {
    const { dictionaries, activePair, setActivePair, removeDictionary } = get();

    const isActivePair =
      activePair &&
      ((activePair.nativeLang === nativeLang && activePair.studiedLang === studiedLang) ||
        (activePair.nativeLang === studiedLang && activePair.studiedLang === nativeLang));

    await removeDictionary(nativeLang, studiedLang);
    await removeDictionary(studiedLang, nativeLang);

    if (isActivePair) {
      const remaining = dictionaries.filter(
        (d) =>
          !(d.sourceLang === nativeLang && d.targetLang === studiedLang) &&
          !(d.sourceLang === studiedLang && d.targetLang === nativeLang)
      );
      const nextPair =
        remaining.length > 0
          ? { sourceLang: remaining[0].sourceLang, targetLang: remaining[0].targetLang }
          : null;
      await setActivePair(nextPair);
    }
  },

  isPairBehindCurrentVersion: (nativeLang: string, studiedLang: string): boolean => {
    const { dictionaries } = get();
    const forward = dictionaries.find(
      (d) => d.sourceLang === nativeLang && d.targetLang === studiedLang
    );
    const reverse = dictionaries.find(
      (d) => d.sourceLang === studiedLang && d.targetLang === nativeLang
    );
    if (!forward || !reverse) {
      return false;
    }
    return (
      forward.version !== CURRENT_DICTIONARY_VERSION.id ||
      reverse.version !== CURRENT_DICTIONARY_VERSION.id
    );
  },

  updatePair: async (nativeLang: string, studiedLang: string, onProgress: (progress: PairDownloadProgress) => void): Promise<void> => {
    const newVersion = CURRENT_DICTIONARY_VERSION.id;
    const newForwardPath = getDictionaryFilePath(nativeLang, studiedLang, newVersion);
    const newReversePath = getDictionaryFilePath(studiedLang, nativeLang, newVersion);

    // Defensive retry cleanup: delete any leftover file at new-version target paths with no matching DB row
    for (const path of [newForwardPath, newReversePath]) {
      const db = await getDatabase();
      const rows = await db.getAllAsync(
        'SELECT 1 FROM installed_dictionaries WHERE file_path = ?',
        [path]
      );
      if (rows.length === 0) {
        await deleteAsync(path, { idempotent: true });
      }
    }

    // Download both new-version direction files
    const { promise } = startPairDownload(nativeLang, studiedLang, onProgress);
    await promise;

    // Insert two new installed_dictionaries rows at the new version
    const { addDictionary } = get();
    await addDictionary({ sourceLang: nativeLang, targetLang: studiedLang, filePath: newForwardPath, downloadedAt: Date.now(), version: newVersion });
    await addDictionary({ sourceLang: studiedLang, targetLang: nativeLang, filePath: newReversePath, downloadedAt: Date.now(), version: newVersion });

    // Get old dictionary entries
    const { dictionaries } = get();
    const oldForward = dictionaries.find(d => d.sourceLang === nativeLang && d.targetLang === studiedLang && d.version !== newVersion);
    const oldReverse = dictionaries.find(d => d.sourceLang === studiedLang && d.targetLang === nativeLang && d.version !== newVersion);

    // Remove old entries (closes DB connection, deletes old files, removes old rows)
    const { removeDictionary } = get();
    if (oldForward) {
      await removeDictionary(oldForward.sourceLang, oldForward.targetLang, oldForward.version);
    }
    if (oldReverse) {
      await removeDictionary(oldReverse.sourceLang, oldReverse.targetLang, oldReverse.version);
    }
  },
});
