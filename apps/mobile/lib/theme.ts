import { useColorScheme } from 'nativewind';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';

interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  placeholder: string;
  accent: string;
  danger: string;
}

export const palette: { light: Palette; dark: Palette } = {
  light: {
    background: '#ffffff',
    surface: '#fafafa',
    surfaceAlt: '#f5f5f5',
    textPrimary: '#171717',
    textSecondary: '#525252',
    textMuted: '#a3a3a3',
    border: '#e5e5e5',
    inputBg: '#f5f5f5',
    placeholder: '#a3a3a3',
    accent: '#3b82f6',
    danger: '#ef4444',
  },
  dark: {
    background: '#0a0a0a',
    surface: '#171717',
    surfaceAlt: '#262626',
    textPrimary: '#f5f5f5',
    textSecondary: '#d4d4d4',
    textMuted: '#737373',
    border: '#262626',
    inputBg: '#262626',
    placeholder: '#737373',
    accent: '#60a5fa',
    danger: '#ef4444',
  },
};

export function useThemeColors(): Palette {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? palette.dark : palette.light;
}

export function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const colors = scheme === 'dark' ? palette.dark : palette.light;
  return {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      text: colors.textPrimary,
      primary: colors.accent,
    },
  };
}
