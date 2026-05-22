import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LanguagePairSelector } from '../../components/LanguagePairSelector';
import { LookupInput } from '../../components/LookupInput';
import { ResultsList } from '../../components/ResultsList';
import { useLookup } from '../../hooks/useLookup';

export default function LookupScreen() {
  const { query, setQuery, results, isLoading } = useLookup();

  return (
    <View className="flex-1 bg-white">
      <LanguagePairSelector />
      <LookupInput value={query} onChangeText={setQuery} isLoading={isLoading} />
      <ResultsList results={results} />
      <StatusBar style="auto" />
    </View>
  );
}
