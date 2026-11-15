import type { StateCreator } from 'zustand';
import { getDatabase, type SettingsRow } from '../db';
import type { LanguagePair, LookupDirection, ThemePreference } from '@errin/core';

export interface SettingsSlice {
  settings: { dailyReviewLimit: number; lastActivePair: LanguagePair | null; lookupDirection: LookupDirection; themePreference: ThemePreference };
  settingsLoaded: boolean;
  hydrateSettings: () => Promise<void>;
  setDailyReviewLimit: (limit: number) => Promise<void>;
  setLastActivePair: (pair: LanguagePair | null) => Promise<void>;
  setLookupDirection: (direction: LookupDirection) => Promise<void>;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

export const DEFAULT_SETTINGS = {
  dailyReviewLimit: 20,
  lastActivePair: null as LanguagePair | null,
  lookupDirection: 'studied_to_native' as LookupDirection,
  themePreference: 'system' as ThemePreference,
};

export function parseThemePreference(v: unknown): ThemePreference {
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function rowToSettings(row: SettingsRow): typeof DEFAULT_SETTINGS {
  const sourceLang = row.last_active_source_lang;
  const targetLang = row.last_active_target_lang;
  const lastActivePair: LanguagePair | null =
    sourceLang && targetLang ? { sourceLang, targetLang } : null;
  return {
    dailyReviewLimit: row.daily_review_limit,
    lastActivePair,
    lookupDirection: (row.lookup_direction as LookupDirection) || 'studied_to_native',
    themePreference: parseThemePreference(row.theme_preference),
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
      'SELECT id, daily_review_limit, last_active_source_lang, last_active_target_lang, lookup_direction, theme_preference FROM settings WHERE id = 1'
    );
    set({
      settings: row ? rowToSettings(row) : DEFAULT_SETTINGS,
      settingsLoaded: true,
    });
  },

  setDailyReviewLimit: async (limit) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE settings SET daily_review_limit = ? WHERE id = 1', [limit]);
    set((state) => ({ settings: { ...state.settings, dailyReviewLimit: limit } }));
  },

  setLastActivePair: async (pair) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE settings SET last_active_source_lang = ?, last_active_target_lang = ? WHERE id = 1',
      [pair?.sourceLang ?? null, pair?.targetLang ?? null]
    );
    set((state) => ({ settings: { ...state.settings, lastActivePair: pair } }));
  },

  setLookupDirection: async (direction) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE settings SET lookup_direction = ? WHERE id = 1', [direction]);
    set((state) => ({ settings: { ...state.settings, lookupDirection: direction } }));
  },

  setThemePreference: async (pref) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE settings SET theme_preference = ? WHERE id = 1', [pref]);
    set((state) => ({ settings: { ...state.settings, themePreference: pref } }));
  },
});
