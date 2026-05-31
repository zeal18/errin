import { useState, useEffect } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getInfoAsync } from 'expo-file-system/legacy';
import { getLanguageName, SUPPORTED_LANGUAGES, type ActivePair, type InstalledDictionary, type LanguagePair } from '@errin/core';
import { useAppStore } from '../../store';
import { AddLanguagePairModal } from '../../components/AddLanguagePairModal';
import { formatBytes } from '../../lib/formatUtils';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function activePairToLanguagePair(activePair: ActivePair): LanguagePair {
  return {
    sourceLang: activePair.nativeLang,
    targetLang: activePair.studiedLang,
  };
}

export default function SettingsScreen() {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const settings = useAppStore((s) => s.settings);
  const setDailyReviewLimit = useAppStore((s) => s.setDailyReviewLimit);
  const activePair = useAppStore((s) => s.activePair);
  const setActivePair = useAppStore((s) => s.setActivePair);
  const removeDictionary = useAppStore((s) => s.removeDictionary);
  const [showAddPairModal, setShowAddPairModal] = useState(false);
  const [limitInput, setLimitInput] = useState(String(settings.dailyReviewLimit));
  const [limitError, setLimitError] = useState('');
  const [fileSizes, setFileSizes] = useState<Map<string, number>>(new Map());
  const MAX_DAILY_REVIEW_LIMIT = 200;

  useEffect(() => {
    const loadFileSizes = async () => {
      const sizesMap = new Map<string, number>();
      for (const dict of dictionaries) {
        try {
          const info = await getInfoAsync(dict.filePath);
          if (info.exists) {
            sizesMap.set(`${dict.sourceLang}-${dict.targetLang}`, info.size);
          }
        } catch {
          // ignore error
        }
      }
      setFileSizes(sizesMap);
    };
    loadFileSizes();
  }, [dictionaries]);

  const installedPairKeys = new Set(dictionaries.map((d) => `${d.sourceLang}-${d.targetLang}`));

  const canAddPair = SUPPORTED_LANGUAGES.some((sourceLang) =>
    SUPPORTED_LANGUAGES.some(
      (targetLang) =>
        sourceLang.code !== targetLang.code &&
        !installedPairKeys.has(`${sourceLang.code}-${targetLang.code}`)
    )
  );

  const handleLimitChange = (text: string) => {
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
      setLimitError('');
    } else if (num > 0) {
      setDailyReviewLimit(num);
      setLimitError('');
    } else {
      setLimitError('Must be a positive number');
      Alert.alert('Invalid Value', 'Daily review limit must be greater than 0');
      setLimitInput(String(settings.dailyReviewLimit));
      setLimitError('');
    }
  };

  const handleDeleteDictionary = (dict: InstalledDictionary) => {
    const sourceName = getLanguageName(dict.sourceLang) ?? dict.sourceLang;
    const targetName = getLanguageName(dict.targetLang) ?? dict.targetLang;
    Alert.alert(
      'Remove Dictionary',
      `Are you sure you want to remove ${sourceName} -> ${targetName}? This will delete the dictionary file from your device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const activePairAsLP = activePair ? activePairToLanguagePair(activePair) : null;
            const isActive = activePairAsLP && dict.sourceLang === activePairAsLP.sourceLang && dict.targetLang === activePairAsLP.targetLang;
            const remainingDictionaries = dictionaries.filter(
              (d) => !(d.sourceLang === dict.sourceLang && d.targetLang === dict.targetLang)
            );
            if (isActive) {
              const newActivePair = remainingDictionaries.length > 0 
                ? { sourceLang: remainingDictionaries[0].sourceLang, targetLang: remainingDictionaries[0].targetLang }
                : null;
              await setActivePair(newActivePair);
            }
            await removeDictionary(dict.sourceLang, dict.targetLang);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-neutral-200">
        <Text className="text-lg font-semibold text-neutral-900">Languages</Text>
      </View>

      {canAddPair && (
        <View className="px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add language pair"
            className="w-full rounded-lg py-3 items-center bg-blue-600"
            onPress={() => setShowAddPairModal(true)}
          >
            <Text className="text-white font-semibold text-base">Add Language Pair</Text>
          </Pressable>
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
          const size = fileSizes.get(`${dict.sourceLang}-${dict.targetLang}`) || 0;
          return (
            <View className="px-4 py-3 border-b border-neutral-200 flex-row items-center">
              <View className="flex-1" accessible={true} accessibilityRole="text" accessibilityLabel={`${sourceName} to ${targetName}, ${formatBytes(size)}, downloaded ${formatDate(dict.downloadedAt)}`}>
                <Text className="text-lg font-medium">
                  {sourceName} -> {targetName} • {formatBytes(size)}
                </Text>
                <Text className="text-sm text-neutral-500">
                  Downloaded: {formatDate(dict.downloadedAt)}
                </Text>
              </View>
              <Pressable
                className="ml-4"
                accessibilityRole="button"
                accessibilityLabel={`Delete ${sourceName} to ${targetName} dictionary`}
                onPress={() => handleDeleteDictionary(dict)}
              >
                <Text className="text-red-600 font-semibold text-base">Delete</Text>
              </Pressable>
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

      <AddLanguagePairModal
        visible={showAddPairModal}
        onClose={() => setShowAddPairModal(false)}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
