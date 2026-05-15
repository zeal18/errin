import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-2xl font-bold mb-2">Welcome to Errin</Text>
      <Text className="text-sm text-neutral-500 text-center">
        Let&apos;s set up your first dictionary.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
