import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { getDueWords, updateWord } from '../../db/words';
import { useAppStore } from '../../store';
import { applyReview } from '@errin/core';
import type { Word, ReviewRating } from '@errin/core';

type CardSide = 'front' | 'back';

type Rating = ReviewRating;

const RATING_BUTTONS: { label: string; rating: Rating }[] = [
  { label: 'Again', rating: 'again' },
  { label: 'Hard', rating: 'hard' },
  { label: 'Good', rating: 'good' },
  { label: 'Easy', rating: 'easy' },
];

function getRatingColor(rating: Rating, pressed: boolean): string {
  const colors = {
    again: '#ef4444', // red-500
    hard: '#f97316', // orange-500
    good: '#22c55e', // green-500
    easy: '#3b82f6', // blue-500
  };
  const base = colors[rating];
  return pressed ? base : base;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { settings } = useAppStore();
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [side, setSide] = useState<CardSide>('front');
  const [showRating, setShowRating] = useState(false);
  const [ratings, setRatings] = useState<Record<Rating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);

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

  const handleRate = useCallback(async (rating: Rating) => {
    if (!currentWord) return;
    // Apply SM-2 update
    const updatedWord = applyReview(currentWord, rating);
    await updateWord(updatedWord);
    setRatings((r) => ({ ...r, [rating]: r[rating] + 1 }));
    setDueWords((words) => words.map((w, i) => (i === currentIndex ? updatedWord : w)));
    // Move to next card or end session
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSide('front');
      setShowRating(false);
    } else {
      setSessionComplete(true);
    }
  }, [currentIndex, currentWord, dueWords.length, ratings]);

  const handleSummaryDismiss = useCallback(() => {
    router.push('/(tabs)/words');
  }, [router]);

  const handleReveal = useCallback(() => {
    setSide('back');
    setShowRating(true);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, dueWords.length - 1));
    setSide('front');
    setShowRating(false);
  }, [dueWords.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setSide('front');
    setShowRating(false);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {loading ? (
        <Text className="text-xl text-neutral-500">Loading...</Text>
      ) : dueWords.length === 0 ? (
        <Text className="text-xl text-neutral-500">No words due for review</Text>
      ) : sessionComplete ? (
        <View className="flex-1 items-center justify-center bg-white p-4">
          <Text className="text-2xl font-bold text-neutral-900 mb-4">Session Complete</Text>
          <Text className="text-xl text-neutral-600 mb-6">You reviewed {dueWords.length} words</Text>
          <View className="w-full max-w-md mb-8">
            {RATING_BUTTONS.map(({ label, rating }) => (
              <View key={rating} className="flex-row justify-between py-2 border-b border-neutral-200">
                <Text className="text-neutral-700">{label}</Text>
                <Text className="text-neutral-900 font-medium">{ratings[rating]}</Text>
              </View>
            ))}
          </View>
          <Pressable className="bg-blue-600 rounded-xl px-8 py-3 active:opacity-75" onPress={handleSummaryDismiss} accessibilityRole="button" accessibilityLabel="Done">
            <Text className="text-white font-semibold text-base">Done</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center w-full">
          <View className="flex-1 w-full items-center justify-center">
            {side === 'front' ? (
              <Pressable className="flex-1" onPress={handleReveal} accessibilityRole="button" accessibilityLabel="Tap to reveal answer" accessibilityHint="Double tap to show the translation and sense">
                <View className="flex-1 bg-white rounded-2xl shadow-lg p-8 m-4 justify-center items-center w-full">
                  <Text className="text-3xl font-bold text-neutral-900">{currentWord.source}</Text>
                  <Text className="text-neutral-500 mt-2">Tap to reveal</Text>
                </View>
              </Pressable>
            ) : (
              <View className="flex-1 bg-white rounded-2xl shadow-lg p-8 m-4 justify-center items-center w-full">
                <Text className="text-xl font-semibold text-neutral-900">{currentWord.source}</Text>
                <Text className="text-blue-600 text-lg mt-2">{currentWord.target}</Text>
                <Text className="text-neutral-600 text-base mt-4">{currentWord.sense}</Text>
                {showRating && (
                  <View className="flex-row justify-between w-full mt-6">
                    {RATING_BUTTONS.map(({ label, rating }) => (
                      <Pressable
                        key={rating}
                        className="px-4 py-2 rounded-xl m-1 flex-1"
                        style={({ pressed }) => [
                          {
                            backgroundColor: pressed
                              ? getRatingColor(rating, true)
                              : getRatingColor(rating, false),
                          },
                        ]}
                        onPress={() => handleRate(rating)}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                      >
                        <Text className="text-center text-white font-semibold">{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
          <View className="flex-row justify-between w-full px-8 py-4">
            <Pressable
              className="px-6 py-2 bg-neutral-100 rounded-xl"
              onPress={handlePrev}
              disabled={currentIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous"
            >
              <Text className={currentIndex === 0 ? 'opacity-50' : ''}>← Prev</Text>
            </Pressable>
            <Pressable
              className="px-6 py-2 bg-neutral-100 rounded-xl"
              onPress={handleNext}
              disabled={currentIndex === dueWords.length - 1}
              accessibilityRole="button"
              accessibilityLabel="Next"
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
