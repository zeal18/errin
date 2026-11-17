import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));

// Mock db/words
const mockGetAllWords = jest.fn() as jest.MockedFunction<() => Promise<Array<{
  id: string;
  source: string;
  target: string;
  sense: string;
  sourceLang: string;
  targetLang: string;
  createdAt: number;
  dueAt: number;
  interval: number;
  ease: number;
  reviews: number;
}>>>;

const mockGetWordKeys = jest.fn();
const mockInsertWords = jest.fn();

jest.mock('../db/words', () => ({
  getAllWords: () => mockGetAllWords(),
  getWordKeys: () => mockGetWordKeys(),
  insertWords: (...args: unknown[]) => mockInsertWords(...args),
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock components and store
jest.mock('../components/AddLanguagePairModal', () => ({ AddLanguagePairModal: () => null }));
jest.mock('../components/DownloadConfirmationDialog', () => ({ DownloadConfirmationDialog: () => null }));
jest.mock('../lib/theme', () => ({ useThemeColors: () => ({ accent: '#000', placeholder: '#999' }) }));

const mockSetThemePreference = jest.fn();
const mockSetDailyReviewLimit = jest.fn();

jest.mock('../store', () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      dictionaries: [],
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

// Mock wordsExport
let mockExportWordsCsv = jest.fn().mockResolvedValue('file:///mock/cacheDirectory/errin-words-2026-11-15.csv');

jest.mock('../lib/wordsExport', () => ({
  exportFileName: jest.fn(() => 'errin-words-2026-11-15.csv'),
  exportWordsCsv: (...args: unknown[]) => mockExportWordsCsv(...args),
}));

// Import after mocks
import SettingsScreen from '../app/(tabs)/settings';
import { wordsToCsv } from '@errin/core';

// Helper to create a word
function makeWord(overrides: Record<string, unknown> = {}) {
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
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 15, 12, 0, 0));
  mockGetAllWords.mockResolvedValue([]);
  mockExportWordsCsv.mockResolvedValue('file:///mock/cacheDirectory/errin-words-2026-11-15.csv');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Settings Export', () => {
  describe('Empty list', () => {
    it('shows empty state hint and disables button', () => {
      mockGetAllWords.mockResolvedValue([]);

      const { getByTestId, getByText } = render(<SettingsScreen />);

      const button = getByTestId('export-words-button');
      expect(button.props.accessibilityState.disabled).toBe(true);

      expect(getByText('No saved words to export yet')).toBeTruthy();
    });

    it('does not call exportWordsCsv when pressing disabled button', async () => {
      mockGetAllWords.mockResolvedValue([]);

      const { getByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByTestId('export-words-button'));

      // Button is disabled (wordCount is null initially), so handleExport should return early
      expect(mockExportWordsCsv).not.toHaveBeenCalled();
    });
  });

  describe('CSV serialization', () => {
    it('CSV content has correct header', () => {
      const csv = wordsToCsv([]);
      expect(csv).toContain('id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews');
    });

    it('CSV starts with BOM', () => {
      const csv = wordsToCsv([]);
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
    });

    it('CSV uses CRLF line endings', () => {
      const word = makeWord();
      const csv = wordsToCsv([word]);
      expect(csv).toContain('\r\n');
    });

    it('CSV quotes fields containing commas', () => {
      const word = makeWord({
        source: 'a,b',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('"a,b"');
    });

    it('CSV quotes and doubles inner quotes', () => {
      const word = makeWord({
        sense: 'say "hi"',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('"say ""hi"""');
    });

    it('CSV quotes fields containing newlines', () => {
      const word = makeWord({
        sense: 'line1\nline2',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('"line1\nline2"');
    });

    it('CSV quotes fields with leading spaces', () => {
      const word = makeWord({
        source: ' leading',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('" leading"');
    });

    it('CSV quotes fields with trailing spaces', () => {
      const word = makeWord({
        source: 'trailing ',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('"trailing "');
    });

    it('CSV handles Cyrillic text correctly', () => {
      const word = makeWord({
        id: 'cyrillic-test',
        source: 'собака',
        target: 'dog',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('собака');
      expect(csv).toContain('dog');
    });

    it('CSV handles German umlauts correctly', () => {
      const word = makeWord({
        source: 'Übermäßig',
        target: 'excessive',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('Übermäßig');
      expect(csv).toContain('excessive');
    });

    it('CSV handles German sharp s correctly', () => {
      const word = makeWord({
        source: 'Straße',
        target: 'street',
      });
      const csv = wordsToCsv([word]);
      expect(csv).toContain('Straße');
      expect(csv).toContain('street');
    });

    it('CSV orders words by createdAt ascending', () => {
      const wordA = makeWord({ id: 'a', createdAt: 100 });
      const wordB = makeWord({ id: 'b', createdAt: 200 });
      const wordC = makeWord({ id: 'c', createdAt: 300 });

      const csv = wordsToCsv([wordC, wordA, wordB]);
      const lines = csv.split('\r\n');

      expect(lines[1]).toContain('a');
      expect(lines[2]).toContain('b');
      expect(lines[3]).toContain('c');
    });

    it('CSV breaks ties by id', () => {
      const wordA = makeWord({ id: 'a', createdAt: 100 });
      const wordB = makeWord({ id: 'b', createdAt: 100 });
      const wordC = makeWord({ id: 'c', createdAt: 100 });

      const csv = wordsToCsv([wordC, wordA, wordB]);
      const lines = csv.split('\r\n');

      expect(lines[1]).toContain('a');
      expect(lines[2]).toContain('b');
      expect(lines[3]).toContain('c');
    });

    it('CSV preserves numeric values exactly', () => {
      const word = makeWord({
        createdAt: 1731628800000,
        dueAt: 1731715200000,
        interval: 14,
        ease: 2.5,
        reviews: 7,
      });

      const csv = wordsToCsv([word]);
      const lines = csv.split('\r\n');
      const fields = lines[1].split(',');

      expect(Number(fields[6])).toBe(1731628800000);
      expect(Number(fields[7])).toBe(1731715200000);
      expect(Number(fields[8])).toBe(14);
      expect(Number(fields[9])).toBe(2.5);
      expect(Number(fields[10])).toBe(7);
    });

    it('empty list produces only header and CRLF', () => {
      const csv = wordsToCsv([]);
      expect(csv).toBe('\uFEFFid,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n');
    });

    it('does not mutate input array', () => {
      const wordA = makeWord({ id: 'a', createdAt: 300 });
      const wordB = makeWord({ id: 'b', createdAt: 100 });
      const wordC = makeWord({ id: 'c', createdAt: 200 });
      const input = [wordA, wordB, wordC];

      wordsToCsv(input);

      expect(input[0].id).toBe('a');
      expect(input[1].id).toBe('b');
      expect(input[2].id).toBe('c');
    });
  });
});
