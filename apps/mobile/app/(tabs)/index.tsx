import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DirectionSelector } from '../../components/DirectionSelector';
import { LookupInput } from '../../components/LookupInput';
import { ResultsList } from '../../components/ResultsList';
import { useLookup } from '../../hooks/useLookup';
import { useAppStore } from '../../store';
import { saveWord } from '../../db/words';
import { INITIAL_EASE } from '@errin/core';
import type { LookupResult } from '@errin/core';

export default function LookupScreen() {
  const { query, setQuery, results, isLoading, submit } = useLookup();
  const activePair = useAppStore((s) => s.activePair);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const handlePress = useCallback(async (result: LookupResult) => {
    if (!activePair) return;
    const now = Date.now();
    if (activePair.lookupDirection === 'native_to_studied') {
      await saveWord({
        id: `${activePair.studiedLang}-${activePair.nativeLang}-${result.transList[0]}-${now}`,
        source: result.transList[0] ?? '',
        target: result.writtenRep,
        sense: result.senseList[0] ?? '',
        sourceLang: activePair.studiedLang,
        targetLang: activePair.nativeLang,
        createdAt: now,
        dueAt: now,
        interval: 0,
        ease: INITIAL_EASE,
        reviews: 0,
      });
    } else {
      await saveWord({
        id: `${activePair.studiedLang}-${activePair.nativeLang}-${result.writtenRep}-${now}`,
        source: result.writtenRep,
        target: result.transList[0] ?? '',
        sense: result.senseList[0] ?? '',
        sourceLang: activePair.studiedLang,
        targetLang: activePair.nativeLang,
        createdAt: now,
        dueAt: now,
        interval: 0,
        ease: INITIAL_EASE,
        reviews: 0,
      });
    }
    setShowSaved(true);
    AccessibilityInfo.announceForAccessibility("Saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setShowSaved(false), 1500);
  }, [activePair]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <DirectionSelector onDirectionChange={() => setQuery('')} />
      <LookupInput value={query} onChangeText={setQuery} isLoading={isLoading} onSubmit={submit} />
      <ResultsList results={results} onPress={handlePress} />
      {showSaved && (
        <View className="absolute bottom-6 left-0 right-0 items-center pointer-events-none">
          <View className="bg-neutral-800 px-4 py-2 rounded-full">
            <Text className="text-white text-sm font-medium">Saved</Text>
          </View>
        </View>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
