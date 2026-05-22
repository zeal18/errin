import { FlatList, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getLanguageName } from '@errin/core';
import { useAppStore } from '../../store';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SettingsScreen() {
  const dictionaries = useAppStore((s) => s.dictionaries);

  return (
    <View className="flex-1 bg-white">
      {dictionaries.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-neutral-600">No dictionaries installed</Text>
        </View>
      ) : (
        <FlatList
          data={dictionaries}
          keyExtractor={(dict, index) => `${dict.sourceLang}-${dict.targetLang}-${index}`}
          renderItem={({ item: dict }) => {
            const sourceName = getLanguageName(dict.sourceLang) ?? dict.sourceLang;
            const targetName = getLanguageName(dict.targetLang) ?? dict.targetLang;
            return (
              <View className="px-4 py-3 border-b border-neutral-200">
                <Text className="text-lg font-medium">
                  {sourceName} → {targetName}
                </Text>
                <Text className="text-sm text-neutral-500">
                  Downloaded: {formatDate(dict.downloadedAt)}
                </Text>
              </View>
            );
          }}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}
