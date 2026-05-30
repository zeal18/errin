import { create } from 'zustand';
import { createActivePairSlice, type ActivePairSlice } from './activePairSlice';
import {
  createDictionariesSlice,
  type DictionariesSlice,
} from './dictionariesSlice';
import { createSettingsSlice, type SettingsSlice } from './settingsSlice';
import type { LanguagePair } from '@errin/core';
import { devLog } from '../lib/devLog';

export type AppStore = DictionariesSlice & ActivePairSlice & SettingsSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createDictionariesSlice(...a),
  ...createSettingsSlice(...a),
  ...createActivePairSlice(...a),
}));

export async function hydrateAppStore(): Promise<void> {
  try {
    devLog('Store hydration started');
    const { hydrateDictionaries, hydrateSettings } = useAppStore.getState();
    await Promise.all([hydrateDictionaries(), hydrateSettings()]);
    devLog('Dictionaries and settings hydrated');
    const { settings, dictionaries } = useAppStore.getState();
    
    // Validate settings.lastActivePair against installed dictionaries
    let activePair: LanguagePair | null = null;
    
    if (settings.lastActivePair && dictionaries.length > 0) {
      // Check if the last active pair still exists in dictionaries
      const pairExists = dictionaries.some(
        (d) => d.sourceLang === settings.lastActivePair!.sourceLang && 
               d.targetLang === settings.lastActivePair!.targetLang
      );
      if (pairExists) {
        activePair = settings.lastActivePair;
      } else {
        // Fall back to the first dictionary's pair
        activePair = {
          sourceLang: dictionaries[0].sourceLang,
          targetLang: dictionaries[0].targetLang,
        };
      }
    } else if (dictionaries.length > 0) {
      // No lastActivePair but dictionaries exist, use first one
      activePair = {
        sourceLang: dictionaries[0].sourceLang,
        targetLang: dictionaries[0].targetLang,
      };
    }
    // If no dictionaries, activePair remains null
    
    devLog(`Computed activePair: ${activePair ? `${activePair.sourceLang}-${activePair.targetLang}` : 'null'}`);
    await useAppStore.getState().setActivePair(activePair);
    devLog('Store hydration complete');
  } catch (error) {
    devLog(`Store hydration failed: ${error}`);
    throw error;
  }
}

export type { InstalledDictionary, LanguagePair, Settings } from '@errin/core';
export type { DictionariesSlice } from './dictionariesSlice';
export type { ActivePairSlice } from './activePairSlice';
export type { SettingsSlice } from './settingsSlice';
