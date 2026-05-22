import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
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
  const settings = useAppStore((s) => s.settings);
  const setDailyReviewLimit = useAppStore((s) => s.setDailyReviewLimit);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);
  const [limitInput, setLimitInput] = useState(String(settings.dailyReviewLimit));
  const [limitError, setLimitError] = useState('');
  const MAX_DAILY_REVIEW_LIMIT = 200;

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

  const handleLimitChange = (text: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(text)) {
      setLimitInput(text);
      if (text === '') {
        setLimitError('');
      } else {
        const num = parseInt(text, 10);
        if (num > MAX_DAILY_REVIEW_LIMIT) {
          setLimitError('Maximum 200');
        } else {
          setLimitError('');
        }
      }
    }
  };

  const handleLimitBlur = () => {
    if (limitInput === '') {
      setLimitInput(String(settings.dailyReviewLimit));
      return;
    }
    const num = parseInt(limitInput, 10);
    if (num > MAX_DAILY_REVIEW_LIMIT) {
      setLimitError('Maximum 200');
      Alert.alert('Invalid Value', 'Daily review limit cannot exceed 200');
      setLimitInput(String(settings.dailyReviewLimit));
    } else if (num > 0) {
      setDailyReviewLimit(num);
      setLimitError('');
    } else {
      setLimitError('Must be a positive number');
      Alert.alert('Invalid Value', 'Daily review limit must be greater than 0');
      setLimitInput(String(settings.dailyReviewLimit));
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-neutral-200">
        <Text className="text-lg font-semibold text-neutral-900">Languages</Text>
      </View>

      {(canAddSourceLanguage || canAddTargetLanguage) && (
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
      )}

      <FlatList
        data={dictionaries}
        keyExtractor={(dict) => `${dict.sourceLang}-${dict.targetLang}`}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-lg text-neutral-600">No dictionaries installed</Text>
          </View>
        }
        renderItem={({ item: dict }) => {
          const sourceName = getLanguageName(dict.sourceLang) ?? dict.sourceLang;
          const targetName = getLanguageName(dict.targetLang) ?? dict.targetLang;
          return (
            <View className="px-4 py-3 border-b border-neutral-200" accessible={true} accessibilityRole="text" accessibilityLabel={`${sourceName} to ${targetName}, downloaded ${formatDate(dict.downloadedAt)}`}>
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

      <View className="px-4 py-3 border-b border-neutral-200">
        <Text className="text-lg font-semibold text-neutral-900">Daily Review Limit</Text>
      </View>
      <View className="px-4 py-3 border-b border-neutral-200">
        <View className="flex-row items-center gap-4">
          <Text className="text-base text-neutral-700 flex-1">Words per session</Text>
          <TextInput
            className="w-20 h-10 text-center border border-neutral-300 rounded-lg px-2"
            keyboardType="numeric"
            value={limitInput}
            onChangeText={handleLimitChange}
            onBlur={handleLimitBlur}
            onSubmitEditing={handleLimitBlur}
            maxLength={3}
            accessibilityLabel="Words per session, daily review limit"
          />
        </View>
        {limitError ? <Text className="text-sm text-red-600 mt-1">{limitError}</Text> : null}
      </View>

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
