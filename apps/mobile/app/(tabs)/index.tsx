import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DirectionSelector } from '../../components/DirectionSelector';
import { LookupInput } from '../../components/LookupInput';
import { ResultsList } from '../../components/ResultsList';
import { useLookup } from '../../hooks/useLookup';
import { useAppStore } from '../../store';
import { saveWord, replaceWord, resetWordProgress } from '../../db/words';
import { INITIAL_EASE } from '@errin/core';
import type { LookupResult, TranslationVariant } from '@errin/core';

export default function LookupScreen() {
  const { query, setQuery, results, isLoading, submit } = useLookup();
  const activePair = useAppStore((s) => s.activePair);
  const isPairBehindCurrentVersion = useAppStore((s) => s.isPairBehindCurrentVersion);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const showSavedToast = useCallback(() => {
    setShowSaved(true);
    AccessibilityInfo.announceForAccessibility("Saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setShowSaved(false), 1500);
  }, []);

  const handlePress = useCallback(async (result: LookupResult, variant: TranslationVariant, synonym: string) => {
    if (!activePair) return;
    const now = Date.now();
    if (activePair.lookupDirection === 'native_to_studied') {
      await saveWord({
        id: `${activePair.studiedLang}-${activePair.nativeLang}-${synonym}-${now}`,
        source: synonym,
        target: result.writtenRep,
        sense: variant.sense,
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
        target: synonym,
        sense: variant.sense,
        sourceLang: activePair.studiedLang,
        targetLang: activePair.nativeLang,
        createdAt: now,
        dueAt: now,
        interval: 0,
        ease: INITIAL_EASE,
        reviews: 0,
      });
    }
    showSavedToast();
  }, [activePair, showSavedToast]);

  const handleReplace = useCallback(async (id: string, newTarget: string, newSense: string) => {
    await replaceWord(id, newTarget, newSense);
    showSavedToast();
  }, [showSavedToast]);

  const handleReset = useCallback(async (id: string) => {
    await resetWordProgress(id);
    showSavedToast();
  }, [showSavedToast]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <DirectionSelector onDirectionChange={() => setQuery('')} />
      {activePair && isPairBehindCurrentVersion(activePair.nativeLang, activePair.studiedLang) && (
        <View className="items-center pb-1">
          <Text className="text-xs text-blue-600">Update available</Text>
        </View>
      )}
      <LookupInput value={query} onChangeText={setQuery} isLoading={isLoading} onSubmit={submit} />
      <ResultsList
        results={results}
        onPress={handlePress}
        onReplace={handleReplace}
        onReset={handleReset}
      />
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
