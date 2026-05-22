import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
  const { settings } = useAppStore();
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [side, setSide] = useState<CardSide>('front');
  const [showRating, setShowRating] = useState(false);

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
    // Move to next card or end session
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSide('front');
      setShowRating(false);
    } else {
      setShowRating(false);
    }
  }, [currentIndex, currentWord, dueWords.length]);

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
      ) : (
        <View className="flex-1 justify-center items-center w-full">
          <View className="flex-1 w-full items-center justify-center">
            {side === 'front' ? (
              <Pressable className="flex-1" onPress={handleReveal}>
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
