import type { StateCreator } from 'zustand';
import { getDatabase, type SettingsRow } from '../db';
import type { LanguagePair, Settings } from './types';

export interface SettingsSlice {
  settings: Settings;
  settingsLoaded: boolean;
  hydrateSettings: () => Promise<void>;
  setDailyReviewLimit: (limit: number) => Promise<void>;
  setLastActivePair: (pair: LanguagePair | null) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  dailyReviewLimit: 20,
  lastActivePair: null,
};

function rowToSettings(row: SettingsRow): Settings {
  const sourceLang = row.last_active_source_lang;
  const targetLang = row.last_active_target_lang;
  const lastActivePair: LanguagePair | null =
    sourceLang && targetLang ? { sourceLang, targetLang } : null;
  return {
    dailyReviewLimit: row.daily_review_limit,
    lastActivePair,
  };
}

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  settings: DEFAULT_SETTINGS,
  settingsLoaded: false,

  hydrateSettings: async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SettingsRow>(
      'SELECT id, daily_review_limit, last_active_source_lang, last_active_target_lang FROM settings WHERE id = 1'
    );
    set({
      settings: row ? rowToSettings(row) : DEFAULT_SETTINGS,
      settingsLoaded: true,
    });
  },

  setDailyReviewLimit: async (limit) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE settings SET daily_review_limit = ? WHERE id = 1', [limit]);
    set({ settings: { ...get().settings, dailyReviewLimit: limit } });
  },

  setLastActivePair: async (pair) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE settings SET last_active_source_lang = ?, last_active_target_lang = ? WHERE id = 1',
      [pair?.sourceLang ?? null, pair?.targetLang ?? null]
    );
    set({ settings: { ...get().settings, lastActivePair: pair } });
  },
});
