import { Text, View } from 'react-native';
import type { Word, LearningStatus } from '@errin/core';
import { computeStatus } from '@errin/core';

const STATUS_LABEL: Record<LearningStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  learned: 'Learned',
};

const STATUS_STYLE: Record<LearningStatus, string> = {
  not_started: 'bg-neutral-100',
  in_progress: 'bg-yellow-100',
  learned: 'bg-green-100',
};

const STATUS_TEXT_STYLE: Record<LearningStatus, string> = {
  not_started: 'text-neutral-500',
  in_progress: 'text-yellow-700',
  learned: 'text-green-700',
};

interface WordListItemProps {
  word: Word;
}

export function WordListItem({ word }: WordListItemProps) {
  const status = computeStatus(word);
  return (
    <View className="px-4 py-3 border-b border-neutral-100 flex-row items-center">
      <View className="flex-1 mr-3">
        <Text className="text-base font-bold text-neutral-900">{word.source}</Text>
        <Text className="text-sm text-blue-600 mt-0.5">{word.target}</Text>
      </View>
      <View className={`px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
        <Text className={`text-xs font-medium ${STATUS_TEXT_STYLE[status]}`}>
          {STATUS_LABEL[status]}
        </Text>
      </View>
    </View>
  );
}
