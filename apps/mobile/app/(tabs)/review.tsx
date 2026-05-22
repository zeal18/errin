import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ReviewScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Review</Text>
      <StatusBar style="auto" />
    </View>
  );
}
