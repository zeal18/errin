import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getDueWords } from '../../db/words';
import { useAppStore } from '../../store';
import type { Word } from '@errin/core';

type CardSide = 'front' | 'back';

export default function ReviewScreen() {
  const { settings } = useAppStore();
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [side, setSide] = useState<CardSide>('front');

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

  const currentWord = dueWords[currentIndex];

  const handleCardPress = useCallback(() => {
    setSide((s) => (s === 'front' ? 'back' : 'front'));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, dueWords.length - 1));
    setSide('front');
  }, [dueWords.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setSide('front');
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {loading ? (
        <Text className="text-xl text-neutral-500">Loading...</Text>
      ) : dueWords.length === 0 ? (
        <Text className="text-xl text-neutral-500">No words due for review</Text>
      ) : (
        <View className="flex-1 justify-center items-center w-full">
          <Pressable className="flex-1" onPress={handleCardPress}>
            <View className="flex-1 bg-white rounded-2xl shadow-lg p-8 m-4 justify-center items-center">
              {side === 'front' ? (
                <>
                  <Text className="text-3xl font-bold text-neutral-900">{currentWord.source}</Text>
                  <Text className="text-neutral-500 mt-2">Tap to reveal</Text>
                </>
              ) : (
                <>
                  <Text className="text-xl font-semibold text-neutral-900">{currentWord.source}</Text>
                  <Text className="text-blue-600 text-lg mt-2">{currentWord.target}</Text>
                  <Text className="text-neutral-600 text-base mt-4">{currentWord.sense}</Text>
                </>
              )}
            </View>
          </Pressable>
          <View className="flex-row justify-between w-full px-8 py-4">
            <Pressable
              className="px-6 py-2 bg-neutral-100 rounded-xl"
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <Text className={currentIndex === 0 ? 'opacity-50' : ''}>← Prev</Text>
            </Pressable>
            <Pressable
              className="px-6 py-2 bg-neutral-100 rounded-xl"
              onPress={handleNext}
              disabled={currentIndex === dueWords.length - 1}
            >
              <Text className={currentIndex === dueWords.length - 1 ? 'opacity-50' : ''}>Next →</Text>
            </Pressable>
          </View>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}
