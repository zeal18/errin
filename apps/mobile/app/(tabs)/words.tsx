import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WordListItem } from '../../components/WordListItem';
import { deleteWord, getAllWords } from '../../db/words';
import type { Word } from '@errin/core';

export default function WordsScreen() {
  const [words, setWords] = useState<Word[]>([]);
  const router = useRouter();

  const loadWords = useCallback(async () => {
    const loaded = await getAllWords();
    setWords(loaded);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteWord(id);
    await loadWords();
  }, [loadWords]);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords])
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <Pressable
          className="bg-blue-600 rounded-xl py-3 items-center active:opacity-75"
          onPress={() => router.push('/(tabs)/review')}
        >
          <Text className="text-white font-semibold text-base">Start learning</Text>
        </Pressable>
      </View>
      {words.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-400 text-base">No saved words yet</Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WordListItem word={item} onDelete={handleDelete} />
          )}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}
