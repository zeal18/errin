import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getDueWords } from '../../db/words';
import { useAppStore } from '../../store';
import type { Word } from '@errin/core';

export default function ReviewScreen() {
  const { settings } = useAppStore();
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDueWords = useCallback(async () => {
    setLoading(true);
    try {
      const words = await getDueWords(settings.dailyReviewLimit);
      setDueWords(words);
    } finally {
      setLoading(false);
    }
  }, [settings.dailyReviewLimit]);

  useEffect(() => {
    loadDueWords();
  }, [loadDueWords]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {loading ? (
        <Text className="text-xl text-neutral-500">Loading...</Text>
      ) : dueWords.length === 0 ? (
        <Text className="text-xl text-neutral-500">No words due for review</Text>
      ) : (
        <Text className="text-xl">
          {dueWords.length} word{dueWords.length !== 1 ? 's' : ''} due for review
        </Text>
      )}
      <StatusBar style="auto" />
    </View>
  );
}
