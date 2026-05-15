import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store';

export default function HomeScreen() {
  const dictionaries = useAppStore((s) => s.dictionaries);

  if (dictionaries.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-2xl font-bold mb-2">Errin</Text>
      <Text className="text-sm text-neutral-500">Offline dictionary lookup with SRS</Text>
      <StatusBar style="auto" />
    </View>
  );
}
