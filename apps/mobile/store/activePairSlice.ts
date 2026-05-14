import type { StateCreator } from 'zustand';
import type { SettingsSlice } from './settingsSlice';
import type { LanguagePair } from './types';

export interface ActivePairSlice {
  activePair: LanguagePair | null;
  setActivePair: (pair: LanguagePair | null) => Promise<void>;
}

export const createActivePairSlice: StateCreator<
  ActivePairSlice & SettingsSlice,
  [],
  [],
  ActivePairSlice
> = (set, get) => ({
  activePair: null,

  setActivePair: async (pair) => {
    set({ activePair: pair });
    await get().setLastActivePair(pair);
  },
});
