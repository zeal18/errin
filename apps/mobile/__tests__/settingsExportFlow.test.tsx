import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('expo-router', () => {
  const R = require('react');
  return {
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void) => R.useEffect(cb, [cb]),
  };
});
jest.mock('expo-file-system/legacy', () => jest.requireActual('../__mocks__/expo-file-system'));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
const mockGetAllWords = jest.fn();
jest.mock('../db/words', () => ({ getAllWords: () => mockGetAllWords() }));
jest.mock('../components/AddLanguagePairModal', () => ({ AddLanguagePairModal: () => null }));
jest.mock('../components/DownloadConfirmationDialog', () => ({ DownloadConfirmationDialog: () => null }));
jest.mock('../lib/theme', () => ({ useThemeColors: () => ({ accent: '#000', placeholder: '#999' }) }));
jest.mock('../store', () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      dictionaries: [],
      settings: { dailyReviewLimit: 20, lastActivePair: null, lookupDirection: 'studied_to_native', themePreference: 'system' },
      setThemePreference: jest.fn(),
      setDailyReviewLimit: jest.fn(),
      removePair: jest.fn(),
      updatePair: jest.fn(),
      isPairBehindCurrentVersion: () => false,
    }),
}));

import * as Sharing from 'expo-sharing';
// @ts-expect-error mock helpers
import { writeAsStringAsync, readMockFile, resetMockFileSystem } from 'expo-file-system/legacy';
import SettingsScreen from '../app/(tabs)/settings';

const word = {
  id: 'a', source: 'Haus, groß', target: 'дом', sense: 'say "hi"', sourceLang: 'de', targetLang: 'ru',
  createdAt: 1700000000000, dueAt: 1700086400000, interval: 3, ease: 2.5, reviews: 2,
};

beforeEach(() => {
  resetMockFileSystem();
  (Sharing.shareAsync as jest.Mock).mockClear();
  mockGetAllWords.mockReset();
});

it('writes the CSV and shares the file URI', async () => {
  mockGetAllWords.mockResolvedValue([word]);
  const { getByTestId } = render(<SettingsScreen />);
  await waitFor(() => expect(getByTestId('export-words-button').props.accessibilityState.disabled).toBe(false));
  fireEvent.press(getByTestId('export-words-button'));
  await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
  const uri = (writeAsStringAsync as jest.Mock).mock.calls[0][0] as string;
  expect(uri).toMatch(/^file:\/\/\/mock\/cacheDirectory\/errin-words-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(readMockFile(uri)).toBe(
    '﻿id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
      'a,"Haus, groß",дом,"say ""hi""",de,ru,1700000000000,1700086400000,3,2.5,2\r\n',
  );
  expect(Sharing.shareAsync).toHaveBeenCalledWith(uri, expect.objectContaining({ mimeType: 'text/csv' }));
});

it('shows an alert when sharing fails', async () => {
  mockGetAllWords.mockResolvedValue([word]);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (Sharing.shareAsync as jest.Mock).mockRejectedValueOnce(new Error('boom'));
  const { getByTestId } = render(<SettingsScreen />);
  await waitFor(() => expect(getByTestId('export-words-button').props.accessibilityState.disabled).toBe(false));
  fireEvent.press(getByTestId('export-words-button'));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Export Failed', 'boom'));
});
