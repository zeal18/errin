import { Redirect } from 'expo-router';
import { useAppStore } from '../store';

export default function HomeScreen() {
  const dictionaries = useAppStore((s) => s.dictionaries);

  if (dictionaries.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/" />;
}
