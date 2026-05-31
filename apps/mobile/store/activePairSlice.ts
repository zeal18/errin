import type { StateCreator } from 'zustand';
import type { SettingsSlice } from './settingsSlice';
import type { ActivePair, LanguagePair, LookupDirection } from '@errin/core';
import { devLog } from '../lib/devLog';

function languagePairToActivePair(
  pair: LanguagePair,
  lookupDirection: LookupDirection
): ActivePair {
  return lookupDirection === 'native_to_studied'
    ? { nativeLang: pair.sourceLang, studiedLang: pair.targetLang, lookupDirection }
    : { nativeLang: pair.targetLang, studiedLang: pair.sourceLang, lookupDirection };
}

function activePairToLanguagePair(activePair: ActivePair): LanguagePair {
  return {
    sourceLang: activePair.nativeLang,
    targetLang: activePair.studiedLang,
  };
}

export interface ActivePairSlice {
  activePair: ActivePair | null;
  setActivePair: (pair: LanguagePair | null, lookupDirection?: LookupDirection) => Promise<void>;
  swapLookupDirection: () => Promise<void>;
}

export const createActivePairSlice: StateCreator<
  ActivePairSlice & SettingsSlice,
  [],
  [],
  ActivePairSlice
> = (set, get) => ({
  activePair: null,

  setActivePair: async (pair, lookupDirection) => {
    const pairStr = pair ? `${pair.sourceLang}-${pair.targetLang}` : 'null';
    devLog(`Active pair changing to: ${pairStr}`);

    const direction = lookupDirection ?? get().settings.lookupDirection;
    await get().setLookupDirection(direction);

    const activePair = pair ? languagePairToActivePair(pair, direction) : null;
    set({ activePair });
    await get().setLastActivePair(pair);
    devLog(`Active pair changed to: ${pairStr}, direction: ${direction}`);
  },

  swapLookupDirection: async () => {
    const current = get().activePair;
    if (!current) return;

    const newDirection: LookupDirection =
      current.lookupDirection === 'native_to_studied'
        ? 'studied_to_native'
        : 'native_to_studied';

    await get().setLookupDirection(newDirection);

    set({
      activePair: {
        nativeLang: current.studiedLang,
        studiedLang: current.nativeLang,
        lookupDirection: newDirection,
      },
    });

    await get().setLastActivePair(activePairToLanguagePair(current));

    devLog(`Lookup direction swapped to: ${newDirection}`);
  },
});
