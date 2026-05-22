import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import type { LookupResult } from '@errin/core';

interface ResultsListProps {
  results: LookupResult[];
  onPress: (result: LookupResult) => void;
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
        <TouchableOpacity
          onPress={() => onPress(item)}
          activeOpacity={0.6}
          className="px-4 py-3 border-b border-neutral-100"
        >
          <Text className="text-base font-bold text-neutral-900 mb-1">{item.writtenRep}</Text>
          {item.transList.length > 0 && (
            <Text className="text-sm text-blue-600 mb-1">{item.transList.join(', ')}</Text>
          )}
          {item.senseList.map((sense, i) => (
            <Text key={i} className="text-sm text-neutral-500">{sense}</Text>
          ))}
        </TouchableOpacity>
      )}
    />
  );
}
