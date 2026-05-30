import type { StateCreator } from 'zustand';
import type { SettingsSlice } from './settingsSlice';
import type { LanguagePair } from '@errin/core';
import { devLog } from '../lib/devLog';

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
    const pairStr = pair ? `${pair.sourceLang}-${pair.targetLang}` : 'null';
    devLog(`Active pair changing to: ${pairStr}`);
    set({ activePair: pair });
    await get().setLastActivePair(pair);
    devLog(`Active pair changed to: ${pairStr}`);
  },
});
