import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getLanguageName, SUPPORTED_LANGUAGES } from '@errin/core';
import { useAppStore } from '../../store';
import { AddSourceLanguageModal } from '../../components/AddSourceLanguageModal';
import { AddTargetLanguageModal } from '../../components/AddTargetLanguageModal';

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
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);

  // Get already installed source and target languages
  const installedSourceLangs = new Set(dictionaries.map((d) => d.sourceLang));
  const installedTargetLangs = new Set(dictionaries.map((d) => d.targetLang));
  
  // Check if there are available languages to add as source or target
  const canAddSourceLanguage = SUPPORTED_LANGUAGES.some(
    (l) => !installedSourceLangs.has(l.code)
  );
  const canAddTargetLanguage = SUPPORTED_LANGUAGES.some(
    (l) => !installedTargetLangs.has(l.code)
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-neutral-200">
        <Text className="text-lg font-semibold text-neutral-900">Languages</Text>
      </View>

      {dictionaries.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-neutral-600">No dictionaries installed</Text>
        </View>
      ) : (
        <FlatList
          data={dictionaries}
          keyExtractor={(dict, index) => `${dict.sourceLang}-${dict.targetLang}-${index}`}
          ListHeaderComponent={
            canAddSourceLanguage || canAddTargetLanguage ? (
              <View className="px-4 py-3 gap-3">
                {canAddSourceLanguage && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add source language"
                    className="w-full rounded-lg py-3 items-center bg-blue-600"
                    onPress={() => setShowAddSourceModal(true)}
                  >
                    <Text className="text-white font-semibold text-base">Add Source Language</Text>
                  </Pressable>
                )}
                {canAddTargetLanguage && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add target language"
                    className="w-full rounded-lg py-3 items-center bg-blue-600"
                    onPress={() => setShowAddTargetModal(true)}
                  >
                    <Text className="text-white font-semibold text-base">Add Target Language</Text>
                  </Pressable>
                )}
              </View>
            ) : null
          }
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

      <AddSourceLanguageModal
        visible={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
      />

      <AddTargetLanguageModal
        visible={showAddTargetModal}
        onClose={() => setShowAddTargetModal(false)}
      />

      <StatusBar style="auto" />
    </View>
  );
}
