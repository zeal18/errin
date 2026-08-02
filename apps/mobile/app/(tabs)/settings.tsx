import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { getLanguageName, SUPPORTED_LANGUAGES, getPairDownloadSize } from '@errin/core';
import { useAppStore } from '../../store';
import { AddLanguagePairModal } from '../../components/AddLanguagePairModal';
import { DownloadConfirmationDialog } from '../../components/DownloadConfirmationDialog';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface InstalledPair {
  nativeLang: string;
  studiedLang: string;
  downloadedAt: number;
}

export default function SettingsScreen() {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const settings = useAppStore((s) => s.settings);
  const setDailyReviewLimit = useAppStore((s) => s.setDailyReviewLimit);
  const removePair = useAppStore((s) => s.removePair);
  const updatePair = useAppStore((s) => s.updatePair);
  const isPairBehindCurrentVersion = useAppStore((s) => s.isPairBehindCurrentVersion);
  const [showAddPairModal, setShowAddPairModal] = useState(false);
  const [limitInput, setLimitInput] = useState(String(settings.dailyReviewLimit));
  const [limitError, setLimitError] = useState('');
  const [updateTarget, setUpdateTarget] = useState<{nativeLang: string; studiedLang: string} | null>(null);
  const params = useLocalSearchParams<{ updatePair?: string }>();
  const MAX_DAILY_REVIEW_LIMIT = 200;

  useEffect(() => {
    if (params.updatePair) {
      const [nativeLang, studiedLang] = params.updatePair.split('-');
      setUpdateTarget({ nativeLang, studiedLang });
    }
  }, [params.updatePair]);

  const uniquePairs = useMemo<InstalledPair[]>(() => {
    const seen = new Set<string>();
    const pairs: InstalledPair[] = [];
    for (const dict of dictionaries) {
      const key = [dict.sourceLang, dict.targetLang].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({
          nativeLang: dict.sourceLang,
          studiedLang: dict.targetLang,
          downloadedAt: dict.downloadedAt,
        });
      }
    }
    return pairs;
  }, [dictionaries]);

  const installedPairKeys = useMemo(
    () => new Set(dictionaries.map((d) => `${d.sourceLang}-${d.targetLang}`)),
    [dictionaries]
  );

  const canAddPair = SUPPORTED_LANGUAGES.some((a) =>
    SUPPORTED_LANGUAGES.some(
      (b) =>
        a.code !== b.code &&
        !installedPairKeys.has(`${a.code}-${b.code}`) &&
        !installedPairKeys.has(`${b.code}-${a.code}`)
    )
  );

  const handleLimitChange = (text: string) => {
    if (/^\d*$/.test(text)) {
      setLimitInput(text);
      if (text === '') {
        setLimitError('');
      } else {
        const num = parseInt(text, 10);
        setLimitError(num > MAX_DAILY_REVIEW_LIMIT ? 'Maximum 200' : '');
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
      Alert.alert('Invalid Value', 'Daily review limit cannot exceed 200');
      setLimitInput(String(settings.dailyReviewLimit));
      setLimitError('');
    } else if (num > 0) {
      setDailyReviewLimit(num);
      setLimitError('');
    } else {
      Alert.alert('Invalid Value', 'Daily review limit must be greater than 0');
      setLimitInput(String(settings.dailyReviewLimit));
      setLimitError('');
    }
  };

  const handleDeletePair = (pair: InstalledPair) => {
    const nativeName = getLanguageName(pair.nativeLang) ?? pair.nativeLang;
    const studiedName = getLanguageName(pair.studiedLang) ?? pair.studiedLang;
    Alert.alert(
      'Remove Language Pair',
      `Remove ${nativeName} ↔ ${studiedName}? Both dictionary files will be deleted from your device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removePair(pair.nativeLang, pair.studiedLang),
        },
      ]
    );
  };

  const handleUpdateAccept = () => {
    if (updateTarget === null) return;
    updatePair(updateTarget.nativeLang, updateTarget.studiedLang, () => {});
    setUpdateTarget(null);
  };

  const handleUpdateCancel = () => {
    setUpdateTarget(null);
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
        data={uniquePairs}
        keyExtractor={(pair) => `${pair.nativeLang}-${pair.studiedLang}`}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-lg text-neutral-600">No language pairs installed</Text>
          </View>
        }
        renderItem={({ item: pair }) => {
          const nativeName = getLanguageName(pair.nativeLang) ?? pair.nativeLang;
          const studiedName = getLanguageName(pair.studiedLang) ?? pair.studiedLang;
          return (
            <View className="px-4 py-3 border-b border-neutral-200 flex-row items-center">
              <View
                className="flex-1"
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`${nativeName} and ${studiedName}, downloaded ${formatDate(pair.downloadedAt)}`}
              >
                <Text className="text-lg font-medium">
                  {nativeName}{' ↔ '}{studiedName}
                </Text>
                <Text className="text-sm text-neutral-500">
                  Downloaded: {formatDate(pair.downloadedAt)}
                </Text>
              </View>
              <Pressable
                className="ml-4"
                accessibilityRole="button"
                accessibilityLabel={`Delete ${nativeName} and ${studiedName} language pair`}
                onPress={() => handleDeletePair(pair)}
              >
                <Text className="text-red-600 font-semibold text-base">Delete</Text>
              </Pressable>
              {isPairBehindCurrentVersion(pair.nativeLang, pair.studiedLang) && (
                <Pressable
                  className="ml-4 px-3 py-1 rounded-lg bg-blue-600 items-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Update ${nativeName} and ${studiedName} dictionaries`}
                  onPress={() => setUpdateTarget({nativeLang: pair.nativeLang, studiedLang: pair.studiedLang})}
                >
                  <Text className="text-white font-semibold text-sm">Update</Text>
                </Pressable>
              )}
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

      <DownloadConfirmationDialog
        visible={updateTarget !== null}
        sizeBytes={updateTarget ? getPairDownloadSize(updateTarget.nativeLang, updateTarget.studiedLang) : 0}
        onAccept={handleUpdateAccept}
        onCancel={handleUpdateCancel}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
