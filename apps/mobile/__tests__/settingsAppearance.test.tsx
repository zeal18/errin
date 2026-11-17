import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockSet = jest.fn();
let mockPref = 'system';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));
jest.mock('../components/AddLanguagePairModal', () => ({ AddLanguagePairModal: () => null }));
jest.mock('../components/DownloadConfirmationDialog', () => ({ DownloadConfirmationDialog: () => null }));
jest.mock('../lib/theme', () => ({ useThemeColors: () => ({ accent: '#000', placeholder: '#999' }) }));
jest.mock('../store', () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      dictionaries: [],
      settings: { dailyReviewLimit: 20, lastActivePair: null, lookupDirection: 'studied_to_native', themePreference: mockPref },
      setThemePreference: mockSet,
      setDailyReviewLimit: jest.fn(),
      removePair: jest.fn(),
      updatePair: jest.fn(),
      isPairBehindCurrentVersion: () => false,
    }),
}));
jest.mock('../db/words', () => ({
  getAllWords: jest.fn().mockResolvedValue([]),
  getWordKeys: jest.fn(),
  insertWords: jest.fn(),
}));
// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

import SettingsScreen from '../app/(tabs)/settings';

describe('Settings Appearance selector', () => {
  beforeEach(() => {
    mockSet.mockClear();
    mockPref = 'system';
  });

  it('renders header and three options', () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);
    expect(getByText('Appearance')).toBeTruthy();
    expect(getByTestId('theme-option-system')).toBeTruthy();
    expect(getByTestId('theme-option-light')).toBeTruthy();
    expect(getByTestId('theme-option-dark')).toBeTruthy();
  });

  it.each(['system', 'light', 'dark'])('highlights only the current choice (%s)', (pref) => {
    mockPref = pref;
    const { getByTestId } = render(<SettingsScreen />);
    for (const v of ['system', 'light', 'dark']) {
      expect(getByTestId(`theme-option-${v}`).props.accessibilityState.checked).toBe(v === pref);
    }
  });

  it('calls setThemePreference on press', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('theme-option-light'));
    expect(mockSet).toHaveBeenCalledWith('light');
  });
});
