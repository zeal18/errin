import { useState, useCallback, useEffect } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { computeStatus, type LookupDirection, type Word } from '@errin/core';
import type { LookupResult, TranslationVariant } from '@errin/core';
import { getWordsBySource } from '../db/words';
import { useAppStore } from '../store';
import { GenderBadge } from './GenderBadge';

interface ResultsListProps {
  results: LookupResult[];
  onPress: (result: LookupResult, variant: TranslationVariant, synonym: string) => void;
  onReplace: (id: string, newTarget: string, newSense: string) => void;
  onReset: (id: string) => void;
}

interface ResultCardProps {
  result: LookupResult;
  selectedVariantIndex: number;
  selectedSynonymIndex: number;
  existingWord: Word | undefined;
  lookupDirection: LookupDirection;
  studiedLang: string;
  onVariantSelect: (writtenRep: string, index: number) => void;
  onSynonymSelect: (writtenRep: string, index: number) => void;
  onSave: (result: LookupResult, variant: TranslationVariant, synonym: string) => void;
  onReplace: (id: string, newTarget: string, newSense: string) => void;
  onReset: (id: string) => void;
}

function ResultCard({
  result,
  selectedVariantIndex,
  selectedSynonymIndex,
  existingWord,
  lookupDirection,
  studiedLang,
  onVariantSelect,
  onSynonymSelect,
  onSave,
  onReplace,
  onReset,
}: ResultCardProps) {
  const selectedVariant = result.variants[selectedVariantIndex];
  const selectedSynonym = selectedVariant?.transList[selectedSynonymIndex] ?? selectedVariant?.transList[0] ?? '';

  const status = existingWord ? computeStatus(existingWord) : null;

  // newNativeTranslation: the native-language word that will become the new target
  const newNativeTranslation =
    lookupDirection === 'native_to_studied' ? result.writtenRep : selectedSynonym;

  const isSameWord = existingWord && existingWord.target === newNativeTranslation;

  type ButtonKind = 'save' | 'save-disabled' | 'replace' | 'reset';
  let buttonKind: ButtonKind = 'save';
  if (status === 'learned') {
    buttonKind = 'reset';
  } else if (status === 'in_progress' || status === 'not_started') {
    buttonKind = isSameWord ? 'save-disabled' : 'replace';
  }

  const handleSave = useCallback(() => {
    if (!selectedVariant) return;
    onSave(result, selectedVariant, selectedSynonym);
  }, [result, selectedVariant, selectedSynonym, onSave]);

  const handleReplace = useCallback(() => {
    if (!existingWord || !selectedVariant) return;
    Alert.alert(
      'Replace word?',
      `You are currently studying "${existingWord.target}". Replace it with "${newNativeTranslation}" and reset progress?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => onReplace(existingWord.id, newNativeTranslation, selectedVariant.sense),
        },
      ]
    );
  }, [existingWord, selectedVariant, newNativeTranslation, onReplace]);

  const handleReset = useCallback(() => {
    if (!existingWord) return;
    onReset(existingWord.id);
  }, [existingWord, onReset]);

  const buttonConfig = {
    save: { label: 'Learn', onPress: handleSave, style: 'bg-blue-600', disabled: false },
    'save-disabled': { label: 'Learn', onPress: undefined, style: 'bg-neutral-300', disabled: true },
    replace: { label: 'Replace', onPress: handleReplace, style: 'bg-amber-500', disabled: false },
    reset: { label: 'Reset', onPress: handleReset, style: 'bg-neutral-500', disabled: false },
  }[buttonKind];

  return (
    <View className="px-4 py-3 border-b border-neutral-100">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-base font-bold text-neutral-900">{result.writtenRep}</Text>
          {lookupDirection === 'studied_to_native' && (
            <GenderBadge lang={studiedLang} word={result.writtenRep} />
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${buttonConfig.label} ${result.writtenRep}`}
          accessibilityState={{ disabled: buttonConfig.disabled }}
          disabled={buttonConfig.disabled}
          className={`px-3 py-1 rounded-full ${buttonConfig.style}`}
          onPress={buttonConfig.onPress}
        >
          <Text className="text-xs font-semibold text-white">{buttonConfig.label}</Text>
        </Pressable>
      </View>

      {result.variants.map((variant, vIndex) => {
        const isVariantSelected = vIndex === selectedVariantIndex;
        return (
          <Pressable
            key={vIndex}
            accessibilityRole="button"
            accessibilityState={{ selected: isVariantSelected }}
            accessibilityLabel={`${variant.transList.join(', ')}${variant.sense ? ': ' + variant.sense : ''}${isVariantSelected ? ', selected' : ''}`}
            className={`mt-1 px-3 py-2 rounded-lg border ${isVariantSelected ? 'border-blue-400 bg-blue-50' : 'border-neutral-200 bg-white'}`}
            onPress={() => onVariantSelect(result.writtenRep, vIndex)}
          >
            {/* Synonym chips — only shown for the selected variant */}
            {isVariantSelected ? (
              <View className="flex-row flex-wrap gap-1 mb-1">
                {variant.transList.map((synonym, sIndex) => {
                  const isSynonymSelected = sIndex === selectedSynonymIndex;
                  return (
                    <Pressable
                      key={sIndex}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSynonymSelected }}
                      accessibilityLabel={`${synonym}${isSynonymSelected ? ', selected' : ''}`}
                      className={`px-2 py-0.5 rounded-full border ${isSynonymSelected ? 'border-blue-500 bg-blue-100' : 'border-neutral-300 bg-white'}`}
                      onPress={() => onSynonymSelect(result.writtenRep, sIndex)}
                    >
                      <View className="flex-row items-center gap-1">
                        <Text className={`text-sm ${isSynonymSelected ? 'font-semibold text-blue-700' : 'text-neutral-700'}`}>
                          {synonym}
                        </Text>
                        {lookupDirection === 'native_to_studied' && (
                          <GenderBadge lang={studiedLang} word={synonym} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text className="text-sm font-medium text-neutral-500">
                {variant.transList.join(', ')}
              </Text>
            )}
            {variant.sense ? (
              <Text className="text-xs text-neutral-500 mt-0.5">{variant.sense}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function collectStudiedSources(results: LookupResult[], direction: LookupDirection): string[] {
  if (direction === 'studied_to_native') {
    return results.map((r) => r.writtenRep);
  }
  // native_to_studied: the studied words are the translation synonyms
  const seen = new Set<string>();
  for (const result of results) {
    for (const variant of result.variants) {
      for (const synonym of variant.transList) {
        seen.add(synonym);
      }
    }
  }
  return Array.from(seen);
}

export function ResultsList({ results, onPress, onReplace, onReset }: ResultsListProps) {
  const studiedLang = useAppStore((s) => s.activePair?.studiedLang ?? '');
  const lookupDirection = useAppStore((s) => s.activePair?.lookupDirection ?? 'studied_to_native');

  const [selectedVariants, setSelectedVariants] = useState<Map<string, number>>(new Map());
  const [selectedSynonyms, setSelectedSynonyms] = useState<Map<string, number>>(new Map());
  const [existingWords, setExistingWords] = useState<Map<string, Word>>(new Map());

  // Reset all selection state and reload word status when results change
  useEffect(() => {
    const initVariants = new Map<string, number>();
    const initSynonyms = new Map<string, number>();
    for (const result of results) {
      initVariants.set(result.writtenRep, 0);
      initSynonyms.set(result.writtenRep, 0);
    }
    setSelectedVariants(initVariants);
    setSelectedSynonyms(initSynonyms);

    if (results.length > 0 && studiedLang) {
      const sources = collectStudiedSources(results, lookupDirection);
      getWordsBySource(sources, studiedLang).then(setExistingWords).catch(() => {});
    } else {
      setExistingWords(new Map());
    }
  }, [results, studiedLang, lookupDirection]);

  const handleVariantSelect = useCallback((writtenRep: string, index: number) => {
    setSelectedVariants((prev) => new Map(prev).set(writtenRep, index));
    // Reset synonym to first when variant changes
    setSelectedSynonyms((prev) => new Map(prev).set(writtenRep, 0));
  }, []);

  const handleSynonymSelect = useCallback((writtenRep: string, index: number) => {
    setSelectedSynonyms((prev) => new Map(prev).set(writtenRep, index));
  }, []);

  // Refresh word status after any mutation (save/replace/reset)
  const refreshWords = useCallback(() => {
    if (results.length > 0 && studiedLang) {
      const sources = collectStudiedSources(results, lookupDirection);
      getWordsBySource(sources, studiedLang).then(setExistingWords).catch(() => {});
    }
  }, [results, studiedLang, lookupDirection]);

  const handleSave = useCallback(
    (result: LookupResult, variant: TranslationVariant, synonym: string) => {
      onPress(result, variant, synonym);
      setTimeout(refreshWords, 100);
    },
    [onPress, refreshWords]
  );

  const handleReplace = useCallback(
    (id: string, newTarget: string, newSense: string) => {
      onReplace(id, newTarget, newSense);
      setTimeout(refreshWords, 100);
    },
    [onReplace, refreshWords]
  );

  const handleReset = useCallback(
    (id: string) => {
      onReset(id);
      setTimeout(refreshWords, 100);
    },
    [onReset, refreshWords]
  );

  const extraData = { selectedVariants, selectedSynonyms, existingWords };

  if (results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-neutral-400 text-base">No results</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item, index) => item.writtenRep + index}
      extraData={extraData}
      renderItem={({ item }) => {
        const variantIdx = selectedVariants.get(item.writtenRep) ?? 0;
        const synonymIdx = selectedSynonyms.get(item.writtenRep) ?? 0;
        const selectedSynonym = item.variants[variantIdx]?.transList[synonymIdx] ?? '';
        const existingWord =
          lookupDirection === 'native_to_studied'
            ? existingWords.get(selectedSynonym)
            : existingWords.get(item.writtenRep);
        return (
        <ResultCard
          result={item}
          selectedVariantIndex={variantIdx}
          selectedSynonymIndex={synonymIdx}
          existingWord={existingWord}
          lookupDirection={lookupDirection}
          studiedLang={studiedLang}
          onVariantSelect={handleVariantSelect}
          onSynonymSelect={handleSynonymSelect}
          onSave={handleSave}
          onReplace={handleReplace}
          onReset={handleReset}
        />
        );
      }}
    />
  );
}
