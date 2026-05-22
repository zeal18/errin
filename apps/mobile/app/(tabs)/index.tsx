import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function LookupScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Lookup</Text>
      <StatusBar style="auto" />
    </View>
  );
}
