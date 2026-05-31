import { useState, useCallback, useEffect } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { computeStatus, type Word } from '@errin/core';
import type { LookupResult, TranslationVariant } from '@errin/core';
import { getWordsBySource } from '../db/words';
import { useAppStore } from '../store';

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
  onVariantSelect,
  onSynonymSelect,
  onSave,
  onReplace,
  onReset,
}: ResultCardProps) {
  const selectedVariant = result.variants[selectedVariantIndex];
  const selectedSynonym = selectedVariant?.transList[selectedSynonymIndex] ?? selectedVariant?.transList[0] ?? '';

  const status = existingWord ? computeStatus(existingWord) : null;

  const isSameWord = existingWord && existingWord.target === selectedSynonym;

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
      `You are currently studying "${existingWord.target}". Replace it with "${selectedSynonym}" and reset progress?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => onReplace(existingWord.id, selectedSynonym, selectedVariant.sense),
        },
      ]
    );
  }, [existingWord, selectedVariant, selectedSynonym, onReplace]);

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
        <Text className="text-base font-bold text-neutral-900">{result.writtenRep}</Text>
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
                      <Text className={`text-sm ${isSynonymSelected ? 'font-semibold text-blue-700' : 'text-neutral-700'}`}>
                        {synonym}
                      </Text>
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

export function ResultsList({ results, onPress, onReplace, onReset }: ResultsListProps) {
  const studiedLang = useAppStore((s) => s.activePair?.studiedLang ?? '');

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
      const sources = results.map((r) => r.writtenRep);
      getWordsBySource(sources, studiedLang).then(setExistingWords).catch(() => {});
    } else {
      setExistingWords(new Map());
    }
  }, [results, studiedLang]);

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
      const sources = results.map((r) => r.writtenRep);
      getWordsBySource(sources, studiedLang).then(setExistingWords).catch(() => {});
    }
  }, [results, studiedLang]);

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
      renderItem={({ item }) => (
        <ResultCard
          result={item}
          selectedVariantIndex={selectedVariants.get(item.writtenRep) ?? 0}
          selectedSynonymIndex={selectedSynonyms.get(item.writtenRep) ?? 0}
          existingWord={existingWords.get(item.writtenRep)}
          onVariantSelect={handleVariantSelect}
          onSynonymSelect={handleSynonymSelect}
          onSave={handleSave}
          onReplace={handleReplace}
          onReset={handleReset}
        />
      )}
    />
  );
}
