import { colorScheme } from 'nativewind';
import type { ThemePreference } from '@errin/core';

export function applyThemePreference(pref: ThemePreference): void {
  colorScheme.set(pref);
}
