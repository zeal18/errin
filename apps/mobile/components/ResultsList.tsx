import { useState, useCallback, useEffect } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { LookupResult, TranslationVariant } from '@errin/core';

interface ResultsListProps {
  results: LookupResult[];
  onPress: (result: LookupResult, variant: TranslationVariant) => void;
}

interface ResultCardProps {
  result: LookupResult;
  selectedIndex: number;
  onVariantSelect: (writtenRep: string, index: number) => void;
  onSave: (result: LookupResult, variant: TranslationVariant) => void;
}

function ResultCard({ result, selectedIndex, onVariantSelect, onSave }: ResultCardProps) {
  const handleSave = useCallback(() => {
    const variant = result.variants[selectedIndex];
    if (variant) onSave(result, variant);
  }, [result, selectedIndex, onSave]);

  return (
    <View className="px-4 py-3 border-b border-neutral-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-bold text-neutral-900">{result.writtenRep}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Save ${result.writtenRep}`}
          className="px-3 py-1 rounded-full bg-blue-600"
          onPress={handleSave}
        >
          <Text className="text-xs font-semibold text-white">Save</Text>
        </Pressable>
      </View>

      {result.variants.map((variant, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${variant.transList.join(', ')}${variant.sense ? ': ' + variant.sense : ''}${isSelected ? ', selected' : ''}`}
            className={`mt-1 px-3 py-2 rounded-lg border ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-neutral-200 bg-white'}`}
            onPress={() => onVariantSelect(result.writtenRep, index)}
          >
            <Text className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-neutral-800'}`}>
              {variant.transList.join(', ')}
            </Text>
            {variant.sense ? (
              <Text className="text-xs text-neutral-500 mt-0.5">{variant.sense}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ResultsList({ results, onPress }: ResultsListProps) {
  const [selectedVariants, setSelectedVariants] = useState<Map<string, number>>(new Map());

  // Reset selection whenever the result set changes
  useEffect(() => {
    const initial = new Map<string, number>();
    for (const result of results) {
      initial.set(result.writtenRep, 0);
    }
    setSelectedVariants(initial);
  }, [results]);

  const handleVariantSelect = useCallback((writtenRep: string, index: number) => {
    setSelectedVariants((prev) => {
      const next = new Map(prev);
      next.set(writtenRep, index);
      return next;
    });
  }, []);

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
      extraData={selectedVariants}
      renderItem={({ item }) => (
        <ResultCard
          result={item}
          selectedIndex={selectedVariants.get(item.writtenRep) ?? 0}
          onVariantSelect={handleVariantSelect}
          onSave={onPress}
        />
      )}
    />
  );
}
