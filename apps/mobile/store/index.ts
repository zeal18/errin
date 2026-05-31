import { create } from 'zustand';
import { createActivePairSlice, type ActivePairSlice } from './activePairSlice';
import {
  createDictionariesSlice,
  type DictionariesSlice,
} from './dictionariesSlice';
import { createSettingsSlice, type SettingsSlice } from './settingsSlice';
import type { ActivePair, LanguagePair, LookupDirection } from '@errin/core';
import { getDictionaryFilePath } from '../lib/dictionaryDownload';
import { getInfoAsync } from 'expo-file-system/legacy';
import { devLog } from '../lib/devLog';

export type AppStore = DictionariesSlice & ActivePairSlice & SettingsSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createDictionariesSlice(...a),
  ...createSettingsSlice(...a),
  ...createActivePairSlice(...a),
}));

async function bothDictionariesExist(nativeLang: string, studiedLang: string): Promise<boolean> {
  try {
    const path1 = getDictionaryFilePath(nativeLang, studiedLang);
    const path2 = getDictionaryFilePath(studiedLang, nativeLang);
    const [info1, info2] = await Promise.all([
      getInfoAsync(path1),
      getInfoAsync(path2),
    ]);
    return info1.exists && info2.exists;
  } catch {
    return false;
  }
}

function pairToActivePair(pair: LanguagePair, lookupDirection: LookupDirection): ActivePair {
  return { nativeLang: pair.sourceLang, studiedLang: pair.targetLang, lookupDirection };
}

export async function hydrateAppStore(): Promise<void> {
  try {
    devLog('Store hydration started');
    const { hydrateDictionaries, hydrateSettings } = useAppStore.getState();
    await Promise.all([hydrateDictionaries(), hydrateSettings()]);
    devLog('Dictionaries and settings hydrated');
    const { settings, dictionaries } = useAppStore.getState();

    let activePair: ActivePair | null = null;

    if (settings.lastActivePair && dictionaries.length > 0) {
      const pairExists = dictionaries.some(
        (d) => d.sourceLang === settings.lastActivePair!.sourceLang && 
               d.targetLang === settings.lastActivePair!.targetLang
      );
      if (pairExists) {
        const bothExist = await bothDictionariesExist(
          settings.lastActivePair.sourceLang,
          settings.lastActivePair.targetLang
        );
        if (bothExist) {
          activePair = pairToActivePair(settings.lastActivePair, settings.lookupDirection);
        } else {
          if (dictionaries.length > 0) {
            activePair = pairToActivePair(
              { sourceLang: dictionaries[0].sourceLang, targetLang: dictionaries[0].targetLang },
              settings.lookupDirection
            );
          }
        }
      } else {
        if (dictionaries.length > 0) {
          activePair = pairToActivePair(
            { sourceLang: dictionaries[0].sourceLang, targetLang: dictionaries[0].targetLang },
            settings.lookupDirection
          );
        }
      }
    } else if (dictionaries.length > 0) {
      activePair = pairToActivePair(
        { sourceLang: dictionaries[0].sourceLang, targetLang: dictionaries[0].targetLang },
        settings.lookupDirection
      );
    }

    devLog(`Computed activePair: ${activePair ? `${activePair.nativeLang}-${activePair.studiedLang}` : 'null'}`);
    await useAppStore.getState().setActivePair(
      activePair ? { sourceLang: activePair.nativeLang, targetLang: activePair.studiedLang } : null,
      activePair?.lookupDirection
    );
    devLog('Store hydration complete');
  } catch (error) {
    devLog(`Store hydration failed: ${error}`);
    throw error;
  }
}

export type { InstalledDictionary, Settings } from '@errin/core';
export type { DictionariesSlice } from './dictionariesSlice';
export type { ActivePairSlice } from './activePairSlice';
export type { SettingsSlice } from './settingsSlice';
