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
import { useThemeColors } from '../lib/theme';

const STATUS_LABEL: Record<LearningStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  learned: 'Learned',
};

const STATUS_STYLE: Record<LearningStatus, string> = {
  not_started: 'bg-neutral-100 dark:bg-neutral-800',
  in_progress: 'bg-yellow-100 dark:bg-yellow-950',
  learned: 'bg-green-100 dark:bg-green-950',
};

const STATUS_TEXT_STYLE: Record<LearningStatus, string> = {
  not_started: 'text-neutral-500 dark:text-neutral-400',
  in_progress: 'text-yellow-700 dark:text-yellow-300',
  learned: 'text-green-700 dark:text-green-300',
};

const SWIPE_THRESHOLD = -50;
const DELETE_BUTTON_WIDTH = 80;
const SWIPE_ACTIVATION_DISTANCE = 10;

interface WordListItemProps {
  word: Word;
  onDelete?: (id: string) => void;
}

export function WordListItem({ word, onDelete }: WordListItemProps) {
  const status = computeStatus(word);
  const pan = useRef(new Animated.Value(0)).current;
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;
  const colors = useThemeColors();

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > SWIPE_ACTIVATION_DISTANCE &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        if (dx < 0) {
          pan.setValue(dx);
        } else {
          pan.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD && onDeleteRef.current) {
          Animated.timing(pan, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: true,
          }).start();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: resetPosition,
    })
  ).current;

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
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
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
            <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {word.source}
            </Text>
            <GenderBadge lang={word.sourceLang} word={word.source} />
          </View>
          <Text className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">{word.target}</Text>
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
            backgroundColor: colors.danger,
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
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
  },
});
