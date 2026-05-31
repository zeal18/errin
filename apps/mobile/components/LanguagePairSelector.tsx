import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { getLanguageName, type ActivePair, type LanguagePair } from '@errin/core';
import { useAppStore } from '../store';

function getPairKey(pair: LanguagePair): string {
  return `${pair.sourceLang}-${pair.targetLang}`;
}

function pairLabel(pair: LanguagePair): string {
  const src = getLanguageName(pair.sourceLang) ?? pair.sourceLang;
  const tgt = getLanguageName(pair.targetLang) ?? pair.targetLang;
  return `${src} -> ${tgt}`;
}

function activePairToLanguagePair(activePair: ActivePair): LanguagePair {
  return {
    sourceLang: activePair.nativeLang,
    targetLang: activePair.studiedLang,
  };
}

export function LanguagePairSelector() {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const activePair = useAppStore((s) => s.activePair);
  const setActivePair = useAppStore((s) => s.setActivePair);
  const [open, setOpen] = useState(false);

  if (dictionaries.length === 0) return null;

  const effectivePair: LanguagePair | null = activePair 
    ? activePairToLanguagePair(activePair)
    : dictionaries.length > 0
      ? { sourceLang: dictionaries[0].sourceLang, targetLang: dictionaries[0].targetLang }
      : null;

  const effectiveActivePair: ActivePair | null = activePair ?? null;

  const studiedLanguageName = effectiveActivePair 
    ? getLanguageName(effectiveActivePair.studiedLang) ?? effectiveActivePair.studiedLang
    : effectivePair 
      ? getLanguageName(effectivePair.targetLang) ?? effectivePair.targetLang
      : '';

  if (dictionaries.length === 1) {
    return (
      <View className="items-center py-3" accessible={true} accessibilityRole="text" accessibilityLabel={`Studying: ${studiedLanguageName}`}>
        <Text className="text-base font-medium text-neutral-700">
          Studying: <Text className="font-bold">{studiedLanguageName}</Text>
        </Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Active language pair: ${effectivePair ? pairLabel(effectivePair) : 'none'}. Tap to change.`}
        className="items-center py-3"
        onPress={() => setOpen(true)}
      >
        <Text className="text-base font-medium text-blue-600">
          Studying: <Text className="font-bold">{studiedLanguageName}</Text> 
          ({effectivePair ? pairLabel(effectivePair) : 'none'}) {'<->'}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        accessible={true}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close language pair selector"
        >
          <Pressable
            className="bg-white rounded-xl w-72 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            accessibilityRole="button"
            accessibilityLabel="Select language pair modal content"
            accessibilityViewIsModal={true}
          >
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Select language pair
              </Text>
            </View>
            {dictionaries.map((dict) => {
              const langPair: LanguagePair = { sourceLang: dict.sourceLang, targetLang: dict.targetLang };
              const isActive =
                !!effectivePair &&
                effectivePair.sourceLang === dict.sourceLang &&
                effectivePair.targetLang === dict.targetLang;
              const studiedLang = activePair?.studiedLang ?? dict.targetLang;
              const studiedName = getLanguageName(studiedLang) ?? studiedLang;
              return (
                <Pressable
                  key={getPairKey(langPair)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={"Select " + pairLabel(langPair)}
                  className={`px-4 py-4 border-b border-neutral-100 ${isActive ? 'bg-blue-50' : 'bg-white'}`}
                  onPress={async () => {
                    await setActivePair({ sourceLang: dict.sourceLang, targetLang: dict.targetLang });
                    setOpen(false);
                  }}
                >
                  <Text
                    className={`text-base ${isActive ? 'font-semibold text-blue-600' : 'text-neutral-900'}`}
                  >
                    <Text className="font-bold">{studiedName}</Text> {pairLabel(langPair)}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
