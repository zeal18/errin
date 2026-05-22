import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WordListItem } from '../../components/WordListItem';
import { getAllWords } from '../../db/words';
import type { Word } from '@errin/core';

export default function WordsScreen() {
  const [words, setWords] = useState<Word[]>([]);

  const loadWords = useCallback(async () => {
    const loaded = await getAllWords();
    setWords(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords])
  );

  return (
    <View className="flex-1 bg-white">
      {words.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-400 text-base">No saved words yet</Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WordListItem word={item} />}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}
