import '../global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StatusBar, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@react-navigation/native';
import { colorScheme, useColorScheme } from 'nativewind';
import { hydrateAppStore } from '../store';
import { closeAllDictionaryDatabases } from '../lib/dictionaryDb';
import { runDictionaryMaintenance } from '../lib/dictionaryMaintenance';
import { navigationTheme, useThemeColors } from '../lib/theme';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Set color scheme to follow system appearance
colorScheme.set('system');

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);
  const { colorScheme: currentScheme = 'light' } = useColorScheme();
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await runDictionaryMaintenance();
      } catch (error) {
        // Maintenance errors are logged but non-blocking
      }
      try {
        await hydrateAppStore();
      } catch {
        // Hydration failure leaves store at defaults (no dictionaries),
        // which routes the user to onboarding — the correct fallback.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
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
      <SafeAreaProvider>
        <StatusBar barStyle={currentScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950" accessible={true} accessibilityRole="text" accessibilityLabel="Loading app, please wait">
          <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={currentScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ThemeProvider value={navigationTheme(currentScheme)}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
