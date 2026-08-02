import type { StateCreator } from 'zustand';
import { getDatabase, type InstalledDictionaryRow } from '../db';
import { closeDictionaryDatabase } from '../lib/dictionaryDb';
import { deleteAsync } from 'expo-file-system/legacy';
import type { InstalledDictionary } from '@errin/core';
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
});
