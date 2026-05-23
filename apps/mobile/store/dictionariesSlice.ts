import type { StateCreator } from 'zustand';
import { getDatabase, type InstalledDictionaryRow } from '../db';
import { closeDictionaryDatabase } from '../lib/dictionaryDb';
import { deleteAsync } from 'expo-file-system/legacy';
import type { InstalledDictionary } from '@errin/core';

export interface DictionariesSlice {
  dictionaries: InstalledDictionary[];
  dictionariesLoaded: boolean;
  hydrateDictionaries: () => Promise<void>;
  addDictionary: (dict: InstalledDictionary) => Promise<void>;
  removeDictionary: (sourceLang: string, targetLang: string) => Promise<void>;
}

function rowToDictionary(row: InstalledDictionaryRow): InstalledDictionary {
  return {
    sourceLang: row.source_lang,
    targetLang: row.target_lang,
    filePath: row.file_path,
    downloadedAt: row.downloaded_at,
  };
}

export const createDictionariesSlice: StateCreator<
  DictionariesSlice,
  [],
  [],
  DictionariesSlice
> = (set, get) => ({
  dictionaries: [],
  dictionariesLoaded: false,

  hydrateDictionaries: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<InstalledDictionaryRow>(
      'SELECT source_lang, target_lang, file_path, downloaded_at FROM installed_dictionaries ORDER BY downloaded_at ASC'
    );
    set({
      dictionaries: rows.map(rowToDictionary),
      dictionariesLoaded: true,
    });
  },

  addDictionary: async (dict) => {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO installed_dictionaries (source_lang, target_lang, file_path, downloaded_at) VALUES (?, ?, ?, ?)',
      [dict.sourceLang, dict.targetLang, dict.filePath, dict.downloadedAt]
    );
    set((state) => ({
      dictionaries: [
        ...state.dictionaries.filter(
          (d) => !(d.sourceLang === dict.sourceLang && d.targetLang === dict.targetLang)
        ),
        dict,
      ],
    }));
  },

  removeDictionary: async (sourceLang, targetLang) => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ file_path: string }>(
      'SELECT file_path FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ?',
      [sourceLang, targetLang]
    );
    if (row?.file_path) {
      await closeDictionaryDatabase(row.file_path);
      await deleteAsync(row.file_path, { idempotent: true });
    }
    await db.runAsync(
      'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ?',
      [sourceLang, targetLang]
    );
    set((state) => ({
      dictionaries: state.dictionaries.filter(
        (d) => !(d.sourceLang === sourceLang && d.targetLang === targetLang)
      ),
    }));
  },
});
