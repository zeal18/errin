import '../global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { hydrateAppStore } from '../store';
import { closeAllDictionaryDatabases } from '../lib/dictionaryDb';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hydrateAppStore()
      .catch(() => {
        // Hydration failure leaves store at defaults (no dictionaries),
        // which routes the user to onboarding — the correct fallback.
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      // Hide the splash screen once the app is hydrated
      SplashScreen.hideAsync();
    }
  }, [hydrated]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        closeAllDictionaryDatabases().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white" accessible={true} accessibilityRole="text" accessibilityLabel="Loading app, please wait">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
