import { useState, useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { LookupResult, TranslationVariant } from '@errin/core';

interface ResultsListProps {
  results: LookupResult[];
  onPress: (result: LookupResult, variant: TranslationVariant) => void;
}

interface ResultCardProps {
  result: LookupResult;
  onPress: (result: LookupResult, variant: TranslationVariant) => void;
}

function ResultCard({ result, onPress }: ResultCardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleVariantPress = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleSave = useCallback(() => {
    const variant = result.variants[selectedIndex];
    if (variant) onPress(result, variant);
  }, [result, selectedIndex, onPress]);

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
            onPress={() => handleVariantPress(index)}
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
      renderItem={({ item }) => (
        <ResultCard result={item} onPress={onPress} />
      )}
    />
  );
}
