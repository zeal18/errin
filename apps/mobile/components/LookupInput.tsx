import { ActivityIndicator, TextInput, View } from 'react-native';

interface LookupInputProps {
  value: string;
  onChangeText: (text: string) => void;
  isLoading: boolean;
}

export function LookupInput({ value, onChangeText, isLoading }: LookupInputProps) {
  return (
    <View className="mx-4 my-3 flex-row items-center bg-neutral-100 rounded-xl px-4">
      <TextInput
        className="flex-1 text-base text-neutral-900 py-3"
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a word…"
        placeholderTextColor="#a3a3a3"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {isLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" className="ml-2" />
      ) : null}
    </View>
  );
}
