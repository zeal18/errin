import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useThemeColors } from '../lib/theme';

interface LookupInputProps {
  value: string;
  onChangeText: (text: string) => void;
  isLoading: boolean;
  onSubmit?: () => void;
}

export function LookupInput({ value, onChangeText, isLoading, onSubmit }: LookupInputProps) {
  const inputRef = useRef<TextInput>(null);
  const colors = useThemeColors();

  return (
    <View className="mx-4 my-3 flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4">
      <TextInput
        ref={inputRef}
        className="flex-1 text-base text-neutral-900 dark:text-neutral-100 py-3"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Type a word…"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search word"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => { onChangeText(''); inputRef.current?.focus(); }}
          hitSlop={8}
          className="ml-2"
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      )}
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} className="ml-2" accessibilityLabel="Searching" />
      ) : null}
    </View>
  );
}
