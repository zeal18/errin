import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LanguagePairSelector } from '../../components/LanguagePairSelector';

export default function LookupScreen() {
  return (
    <View className="flex-1 bg-white">
      <LanguagePairSelector />
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold">Lookup</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
