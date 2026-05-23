import { create } from 'zustand';
import { createActivePairSlice, type ActivePairSlice } from './activePairSlice';
import {
  createDictionariesSlice,
  type DictionariesSlice,
} from './dictionariesSlice';
import { createSettingsSlice, type SettingsSlice } from './settingsSlice';

export type AppStore = DictionariesSlice & ActivePairSlice & SettingsSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createDictionariesSlice(...a),
  ...createSettingsSlice(...a),
  ...createActivePairSlice(...a),
}));

export async function hydrateAppStore(): Promise<void> {
  const { hydrateDictionaries, hydrateSettings } = useAppStore.getState();
  await Promise.all([hydrateDictionaries(), hydrateSettings()]);
  const { settings } = useAppStore.getState();
  useAppStore.setState({ activePair: settings.lastActivePair });
}

export type { InstalledDictionary, LanguagePair, Settings } from '@errin/core';
export type { DictionariesSlice } from './dictionariesSlice';
export type { ActivePairSlice } from './activePairSlice';
export type { SettingsSlice } from './settingsSlice';
