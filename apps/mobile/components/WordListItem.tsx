import { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Word, LearningStatus } from '@errin/core';
import { computeStatus } from '@errin/core';
import { GenderBadge } from './GenderBadge';

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

const SWIPE_THRESHOLD = -50;
const DELETE_BUTTON_WIDTH = 80;

interface WordListItemProps {
  word: Word;
  onDelete?: (id: string) => void;
}

export function WordListItem({ word, onDelete }: WordListItemProps) {
  const status = computeStatus(word);
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const dx = gestureState.dx;
      if (dx < 0) {
        pan.setValue(dx);
      } else {
        pan.setValue(0);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < SWIPE_THRESHOLD && onDelete) {
        Animated.timing(pan, {
          toValue: -DELETE_BUTTON_WIDTH,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 10,
        }).start();
      }
    },
  });

  const handleDeletePress = () => {
    if (onDelete) {
      onDelete(word.id);
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const deleteButtonTranslate = pan.interpolate({
    inputRange: [-DELETE_BUTTON_WIDTH, 0],
    outputRange: [0, DELETE_BUTTON_WIDTH],
    extrapolate: 'clamp',
  });

  return (
    <View className="overflow-hidden">
      <Animated.View
        style={[
          styles.row,
          {
            transform: [{ translateX: pan }],
          },
        ]}
        {...panResponder.panHandlers}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={"Delete " + word.source}
        onAccessibilityTap={handleDeletePress}
      >
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-bold text-neutral-900">
              {word.source}
            </Text>
            <GenderBadge lang={word.sourceLang} word={word.source} />
          </View>
          <Text className="text-sm text-blue-600 mt-0.5">{word.target}</Text>
        </View>
        <View className={`px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`} accessible={true} accessibilityRole="text" accessibilityLabel={STATUS_LABEL[status]}>
          <Text
            className={`text-xs font-medium ${STATUS_TEXT_STYLE[status]}`}
          >
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[
          styles.deleteButton,
          {
            transform: [{ translateX: deleteButtonTranslate }],
          },
        ]}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Text className="text-white font-semibold text-base">Delete</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
  },
});
