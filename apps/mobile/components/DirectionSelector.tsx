import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getLanguageName } from '@errin/core';
import { useAppStore } from '../store';

interface PairGroup {
  langA: string;
  langB: string;
}

function directionLabel(inputLang: string, outputLang: string): string {
  const inName = getLanguageName(inputLang) ?? inputLang;
  const outName = getLanguageName(outputLang) ?? outputLang;
  return `${inName} → ${outName}`;
}

export function DirectionSelector({ onDirectionChange }: { onDirectionChange?: () => void }) {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const activePair = useAppStore((s) => s.activePair);
  const setActivePair = useAppStore((s) => s.setActivePair);
  const isPairBehindCurrentVersion = useAppStore((s) => s.isPairBehindCurrentVersion);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const groups = useMemo<PairGroup[]>(() => {
    const seen = new Set<string>();
    const result: PairGroup[] = [];
    for (const dict of dictionaries) {
      const key = [dict.sourceLang, dict.targetLang].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ langA: dict.sourceLang, langB: dict.targetLang });
      }
    }
    return result;
  }, [dictionaries]);

  if (!activePair) return null;

  const inputLang =
    activePair.lookupDirection === 'studied_to_native'
      ? activePair.studiedLang
      : activePair.nativeLang;
  const outputLang =
    activePair.lookupDirection === 'studied_to_native'
      ? activePair.nativeLang
      : activePair.studiedLang;

  const handleSelect = async (newInputLang: string, newOutputLang: string) => {
    // group.langA = nativeLang (native→studied dict is always added first)
    const group = groups.find(
      (g) =>
        (g.langA === newInputLang || g.langB === newInputLang) &&
        (g.langA === newOutputLang || g.langB === newOutputLang)
    );
    if (!group) return;
    const direction = newInputLang === group.langA ? 'native_to_studied' : 'studied_to_native';
    await setActivePair({ sourceLang: group.langA, targetLang: group.langB }, direction);
    setOpen(false);
    onDirectionChange?.();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Translation direction: ${directionLabel(inputLang, outputLang)}. Tap to change.`}
        className="items-center py-3 px-4"
        onPress={() => setOpen(true)}
      >
        <Text className="text-base font-semibold text-blue-600">
          {directionLabel(inputLang, outputLang)}{' ▾'}
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
          accessibilityLabel="Close direction picker"
        >
          <Pressable
            className="bg-white rounded-xl w-72 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            accessibilityRole="button"
            accessibilityLabel="Select translation direction"
            accessibilityViewIsModal={true}
          >
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Translation Direction
              </Text>
            </View>

            {groups.map((group) => {
              const nameA = getLanguageName(group.langA) ?? group.langA;
              const nameB = getLanguageName(group.langB) ?? group.langB;
              const directions: Array<{ from: string; to: string }> = [
                { from: group.langB, to: group.langA },  // studied→native (default)
                { from: group.langA, to: group.langB },  // native→studied
              ];
              return (
                <View key={`${group.langA}-${group.langB}`}>
                  <View className="px-4 py-2 bg-neutral-50 border-b border-neutral-100">
                    <Text className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {nameA}{' ↔ '}{nameB}
                    </Text>
                  </View>
                  {directions.map((dir) => {
                    const isActive = inputLang === dir.from && outputLang === dir.to;
                    return (
                      <Pressable
                        key={`${dir.from}-${dir.to}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={`${directionLabel(dir.from, dir.to)}${isActive ? ', selected' : ''}`}
                        className={`px-4 py-4 border-b border-neutral-100 ${isActive ? 'bg-blue-50' : 'bg-white'}`}
                        onPress={() => handleSelect(dir.from, dir.to)}
                      >
                        <Text className={`text-base ${isActive ? 'font-semibold text-blue-600' : 'text-neutral-900'}`}>
                          {directionLabel(dir.from, dir.to)}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {isPairBehindCurrentVersion(group.langA, group.langB) && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Update ${nameA} and ${nameB} dictionaries`}
                      className="px-4 py-2 mx-4 my-2 rounded-lg bg-blue-600 items-center"
                      onPress={() => {
                        setOpen(false);
                        const pairKey = [group.langA, group.langB].sort().join('-');
                        router.push(`/(tabs)/settings?updatePair=${pairKey}`);
                      }}
                    >
                      <Text className="text-white font-semibold text-sm">Update</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
