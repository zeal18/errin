import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
jest.mock('expo-router', () => {
  const R = require('react');
  return {
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: () => void) => R.useEffect(cb, [cb]),
  };
});

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => jest.requireActual('../__mocks__/expo-file-system'));

// Mock expo-document-picker
const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}));

// Mock wordsExport
jest.mock('../lib/wordsExport', () => ({
  exportFileName: jest.fn(() => 'errin-words-2026-11-15.csv'),
  exportWordsCsv: jest.fn().mockResolvedValue('file:///mock/cacheDirectory/errin-words-2026-11-15.csv'),
}));

// Mock components
jest.mock('../components/AddLanguagePairModal', () => ({ AddLanguagePairModal: () => null }));
jest.mock('../components/DownloadConfirmationDialog', () => ({ DownloadConfirmationDialog: () => null }));

// Mock theme
jest.mock('../lib/theme', () => ({ useThemeColors: () => ({ accent: '#000', placeholder: '#999' }) }));

// Mock db/words
const mockGetAllWords = jest.fn();
const mockGetWordKeys = jest.fn();
const mockInsertWords = jest.fn();
jest.mock('../db/words', () => ({
  getAllWords: () => mockGetAllWords(),
  getWordKeys: () => mockGetWordKeys(),
  insertWords: (...args: unknown[]) => mockInsertWords(...args),
}));

// Mock store with mutable dictionaries
let mockDictionaries: Array<{ sourceLang: string; targetLang: string; version: string; filePath: string; downloadedAt: number }> = [];
const mockSetDailyReviewLimit = jest.fn();
const mockSetThemePreference = jest.fn();

jest.mock('../store', () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      dictionaries: mockDictionaries,
      settings: {
        dailyReviewLimit: 20,
        lastActivePair: null,
        lookupDirection: 'studied_to_native',
        themePreference: 'system',
      },
      setThemePreference: mockSetThemePreference,
      setDailyReviewLimit: mockSetDailyReviewLimit,
      removePair: jest.fn(),
      updatePair: jest.fn(),
      isPairBehindCurrentVersion: () => false,
    }),
}));

// Mock wordsImport
const mockImportWords = jest.fn();
jest.mock('../lib/wordsImport', () => ({
  importWords: (...args: unknown[]) => mockImportWords(...args),
  formatMissingDictionariesMessage: jest.fn((pairs) => {
    const lines = pairs.map((p: { label: string; wordCount: number }) => 
      `• ${p.label} (${p.wordCount} word${p.wordCount === 1 ? '' : 's'})`
    );
    return lines.join('\n') + '\n\nAdd these language pairs in Settings → Languages first, then import the file again.';
  }),
  formatImportSummary: jest.fn((result: { total: number; imported: number; skipped: number }) =>
    `Words in file: ${result.total}\nImported: ${result.imported}\nSkipped (already in your list): ${result.skipped}`
  ),
}));

// @ts-expect-error mock helpers
import { seedFile, resetMockFileSystem, readAsStringAsync } from 'expo-file-system/legacy';
import SettingsScreen from '../app/(tabs)/settings';
import { wordsToCsv, csvToWords } from '@errin/core';
import type { Word } from '@errin/core';

// Helper to create a word
function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'test-id',
    source: 'test-source',
    target: 'test-target',
    sense: 'test-sense',
    sourceLang: 'en',
    targetLang: 'de',
    createdAt: 1700000000000,
    dueAt: 1700000000000,
    interval: 0,
    ease: 2.5,
    reviews: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetMockFileSystem();
  mockDictionaries = [];
  mockGetAllWords.mockResolvedValue([]);
  mockGetWordKeys.mockResolvedValue([]);
  mockInsertWords.mockResolvedValue(undefined);
  mockImportWords.mockResolvedValue({ kind: 'done', total: 0, imported: 0, skipped: 0 });
  mockGetDocumentAsync.mockResolvedValue({ canceled: false, assets: null });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Settings Import', () => {
  describe('Missing dictionaries', () => {
    it('shows Missing dictionaries dialog and does not insert words', async () => {
      const words = [
        makeWord({ sourceLang: 'en', targetLang: 'de' }),
        makeWord({ sourceLang: 'en', targetLang: 'de' }),
        makeWord({ sourceLang: 'ru', targetLang: 'de' }),
      ];

      mockDictionaries = []; // No dictionaries installed
      
      // Mock the import to return missing pairs
      mockImportWords.mockResolvedValue({
        kind: 'missing',
        pairs: [
          { sourceLang: 'en', targetLang: 'de', label: 'English ↔ German', wordCount: 2 },
          { sourceLang: 'ru', targetLang: 'de', label: 'Russian ↔ German', wordCount: 1 },
        ],
      });

      // Setup file picker to return a file
      const uri = 'file:///mock/cacheDirectory/in.csv';
      mockGetDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri, name: 'in.csv' }],
      });

      // Seed the file with valid CSV
      seedFile(uri, false, wordsToCsv(words));

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      const { getByTestId } = render(<SettingsScreen />);

      // Wait for word count to load
      await waitFor(() => expect(mockGetAllWords).toHaveBeenCalled());

      // Press import button
      fireEvent.press(getByTestId('import-words-button'));

      // Wait for the document picker and import to complete
      await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalled());
      await waitFor(() => expect(mockImportWords).toHaveBeenCalled());

      // Check that Alert.alert was called with Missing dictionaries
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Missing dictionaries',
          expect.stringContaining('English ↔ German')
        );
      });

      // Check that insertWords was NOT called
      expect(mockInsertWords).not.toHaveBeenCalled();
    });
  });

  describe('Successful import', () => {
    it('shows Import complete dialog with correct counts', async () => {
      const words = [
        makeWord({ id: 'w1', source: 'word1', sourceLang: 'en', targetLang: 'de' }),
        makeWord({ id: 'w2', source: 'word2', sourceLang: 'en', targetLang: 'de' }),
        makeWord({ id: 'w3', source: 'word3', sourceLang: 'en', targetLang: 'de' }),
      ];

      // Install required dictionaries
      mockDictionaries = [
        { sourceLang: 'en', targetLang: 'de', version: '2_2025-11', filePath: '/path/en-de', downloadedAt: 1700000000000 },
        { sourceLang: 'de', targetLang: 'en', version: '2_2025-11', filePath: '/path/de-en', downloadedAt: 1700000000000 },
      ];

      // One word already exists
      mockGetWordKeys.mockResolvedValue([
        { id: 'w1', source: 'word1', sourceLang: 'en' },
      ]);

      // Mock successful import - this will call the real importWords which calls insertWords
      // But we're mocking importWords itself, so we need to make it call insertWords
      // Actually, let's just verify the alert and not check insertWords directly
      mockImportWords.mockResolvedValue({
        kind: 'done',
        total: 3,
        imported: 2,
        skipped: 1,
      });

      // Setup file picker
      const uri = 'file:///mock/cacheDirectory/in.csv';
      mockGetDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri, name: 'in.csv' }],
      });

      seedFile(uri, false, wordsToCsv(words));

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      const { getByTestId } = render(<SettingsScreen />);

      await waitFor(() => expect(mockGetAllWords).toHaveBeenCalled());

      fireEvent.press(getByTestId('import-words-button'));

      await waitFor(() => expect(mockImportWords).toHaveBeenCalled());

      // Check that Alert.alert was called with Import complete
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Import complete',
          expect.stringContaining('Imported: 2')
        );
      });
    });
  });

  describe('Cancelled picker', () => {
    it('does nothing when picker is cancelled', async () => {
      mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

      const { getByTestId } = render(<SettingsScreen />);

      await waitFor(() => expect(mockGetAllWords).toHaveBeenCalled());

      fireEvent.press(getByTestId('import-words-button'));

      await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalled());

      // Should not have called any other functions
      expect(mockImportWords).not.toHaveBeenCalled();
      expect(mockInsertWords).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('does nothing when no assets returned', async () => {
      mockGetDocumentAsync.mockResolvedValue({ canceled: false, assets: [] });

      const { getByTestId } = render(<SettingsScreen />);

      await waitFor(() => expect(mockGetAllWords).toHaveBeenCalled());

      fireEvent.press(getByTestId('import-words-button'));

      await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalled());

      expect(mockImportWords).not.toHaveBeenCalled();
      expect(mockInsertWords).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Invalid file', () => {
    it('shows Import Failed alert for invalid CSV', async () => {
      // Setup file picker to return a file
      const uri = 'file:///mock/cacheDirectory/invalid.csv';
      mockGetDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri, name: 'invalid.csv' }],
      });

      // Seed with invalid content
      seedFile(uri, false, 'foo,bar\n1,2');

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      const { getByTestId } = render(<SettingsScreen />);

      await waitFor(() => expect(mockGetAllWords).toHaveBeenCalled());

      fireEvent.press(getByTestId('import-words-button'));

      await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalled());

      // Should show Import Failed alert
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Import Failed',
          expect.stringContaining('not a valid Errin export')
        );
      });

      // Should not have called insert
      expect(mockInsertWords).not.toHaveBeenCalled();
    });
  });

  describe('Button states', () => {
    it('disables both buttons while importing', async () => {
      const words = [makeWord()];

      mockDictionaries = [
        { sourceLang: 'en', targetLang: 'de', version: '2_2025-11', filePath: '/path/en-de', downloadedAt: 1700000000000 },
        { sourceLang: 'de', targetLang: 'en', version: '2_2025-11', filePath: '/path/de-en', downloadedAt: 1700000000000 },
      ];

      // Create a deferred promise to keep importWords pending
      let resolveImport: (value: { kind: 'done'; total: number; imported: number; skipped: number }) => void;
      const importPromise = new Promise<{ kind: 'done'; total: number; imported: number; skipped: number }>(
        (resolve) => { resolveImport = resolve; }
      );
      mockImportWords.mockReturnValue(importPromise);

      const uri = 'file:///mock/cacheDirectory/in.csv';
      mockGetDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri, name: 'in.csv' }],
      });

      seedFile(uri, false, wordsToCsv(words));

      const { getByTestId } = render(<SettingsScreen />);

      await waitFor(() => expect(mockGetAllWords).toHaveBeenCalled());

      // Press import button
      fireEvent.press(getByTestId('import-words-button'));

      // Wait for import to start but not complete
      await waitFor(() => expect(mockImportWords).toHaveBeenCalled());

      // Check that both buttons are disabled
      expect(getByTestId('import-words-button').props.accessibilityState.disabled).toBe(true);
      expect(getByTestId('export-words-button').props.accessibilityState.disabled).toBe(true);

      // Complete the import - resolveImport is always defined by the Promise constructor
      resolveImport!({ kind: 'done', total: 1, imported: 1, skipped: 0 });
      
      // Wait for the state to update
      await waitFor(() => {
        // After import completes, buttons should be enabled again
        expect(getByTestId('import-words-button').props.accessibilityState.disabled).toBe(false);
      });
    });
  });
});
