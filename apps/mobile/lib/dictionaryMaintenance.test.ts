// Import mocks first to ensure they're initialized before any module loads
import { mockDatabase, resetMockDatabase } from '../__mocks__/expo-sqlite';
import {
  getInfoAsync,
  readDirectoryAsync,
  deleteAsync,
  documentDirectory,
  resetMockFileSystem,
  seedFile,
} from '../__mocks__/expo-file-system';

// Now mock the actual modules
jest.mock('../db', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDatabase),
}));

jest.mock('./dictionaryDb', () => ({
  closeDictionaryDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./devLog', () => ({
  devLog: jest.fn(),
}));

import { runDictionaryMaintenance } from './dictionaryMaintenance';

const dictDir = documentDirectory + 'dictionaries/';

describe('runDictionaryMaintenance', () => {
  beforeEach(() => {
    resetMockDatabase();
    resetMockFileSystem();
    jest.clearAllMocks();
  });

  test('Case 1: Delete installed_dictionaries rows whose file_path no longer exists on disk', async () => {
    const rows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de.sqlite3', downloaded_at: 1000 },
      { source_lang: 'de', target_lang: 'en', version: '2_2025-11', file_path: 'file://' + dictDir + 'de-en.sqlite3', downloaded_at: 2000 },
    ];

    // Only en-de file exists on disk
    seedFile(dictDir + 'en-de.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(rows);
    (getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path === dictDir + 'en-de.sqlite3' || path === 'file://' + dictDir + 'en-de.sqlite3') {
        return { exists: true };
      }
      return { exists: false };
    });

    await runDictionaryMaintenance();

    // Expect: DELETE for de-en row (file missing)
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? AND version = ?',
      ['de', 'en', '2_2025-11']
    );

    // Expect: No deleteAsync calls (Case 1 only deletes DB rows, not files)
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  test('Case 1 variant: All files exist - no deletions', async () => {
    const rows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de.sqlite3', downloaded_at: 1000 },
      { source_lang: 'de', target_lang: 'en', version: '2_2025-11', file_path: 'file://' + dictDir + 'de-en.sqlite3', downloaded_at: 2000 },
    ];

    seedFile(dictDir + 'en-de.sqlite3');
    seedFile(dictDir + 'de-en.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(rows);
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await runDictionaryMaintenance();

    expect(mockDatabase.runAsync).not.toHaveBeenCalled();
  });

  test('Case 2: Delete older version when exactly 2 rows exist for same direction pair', async () => {
    const rows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-10', file_path: 'file://' + dictDir + 'en-de-v1.sqlite3', downloaded_at: 1000 },
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de-v2.sqlite3', downloaded_at: 2000 },
    ];

    seedFile(dictDir + 'en-de-v1.sqlite3');
    seedFile(dictDir + 'en-de-v2.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([]) // Case 1: no stale rows
      .mockResolvedValueOnce(rows); // Case 2: rows ordered by downloaded_at ASC

    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (readDirectoryAsync as jest.Mock).mockResolvedValue([]);

    const { closeDictionaryDatabase } = require('./dictionaryDb');

    await runDictionaryMaintenance();

    // Expect: closeDictionaryDatabase called with older row's file_path
    expect(closeDictionaryDatabase).toHaveBeenCalledWith('file://' + dictDir + 'en-de-v1.sqlite3');

    // Expect: deleteAsync called for older file_path with {idempotent: true}
    expect(deleteAsync).toHaveBeenCalledWith(dictDir + 'en-de-v1.sqlite3', { idempotent: true });

    // Expect: DELETE FROM installed_dictionaries for older row
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? AND version = ?',
      ['en', 'de', '2_2025-10']
    );
  });

  test('Case 2 variant: Only one row per pair - no deletions', async () => {
    const rows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de.sqlite3', downloaded_at: 1000 },
    ];

    seedFile(dictDir + 'en-de.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([]) // Case 1
      .mockResolvedValueOnce(rows); // Case 2

    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (readDirectoryAsync as jest.Mock).mockResolvedValue([]);

    const { closeDictionaryDatabase } = require('./dictionaryDb');

    await runDictionaryMaintenance();

    expect(closeDictionaryDatabase).not.toHaveBeenCalled();
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  test('Case 2 variant: Three rows for same pair - no action', async () => {
    const rows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-10', file_path: 'file://' + dictDir + 'en-de-v1.sqlite3', downloaded_at: 1000 },
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de-v2.sqlite3', downloaded_at: 2000 },
      { source_lang: 'en', target_lang: 'de', version: '2_2025-12', file_path: 'file://' + dictDir + 'en-de-v3.sqlite3', downloaded_at: 3000 },
    ];

    seedFile(dictDir + 'en-de-v1.sqlite3');
    seedFile(dictDir + 'en-de-v2.sqlite3');
    seedFile(dictDir + 'en-de-v3.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([]) // Case 1
      .mockResolvedValueOnce(rows); // Case 2

    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (readDirectoryAsync as jest.Mock).mockResolvedValue([]);

    const { closeDictionaryDatabase } = require('./dictionaryDb');

    await runDictionaryMaintenance();

    expect(closeDictionaryDatabase).not.toHaveBeenCalled();
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  test('Case 3: Delete orphaned files in dictionaries directory with no matching DB row', async () => {
    seedFile(dictDir + 'orphan1.sqlite3');
    seedFile(dictDir + 'orphan2.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([]) // Case 1
      .mockResolvedValueOnce([]) // Case 2
      .mockResolvedValueOnce([]); // Case 3: no matching rows

    (getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path === dictDir) {
        return { exists: true, isDirectory: true };
      }
      return { exists: false }; // Files not found in DB
    });

    (readDirectoryAsync as jest.Mock).mockResolvedValue(['orphan1.sqlite3', 'orphan2.sqlite3']);

    await runDictionaryMaintenance();

    // Expect: deleteAsync called for each orphaned .sqlite3 file with {idempotent: true}
    expect(deleteAsync).toHaveBeenCalledWith(dictDir + 'orphan1.sqlite3', { idempotent: true });
    expect(deleteAsync).toHaveBeenCalledWith(dictDir + 'orphan2.sqlite3', { idempotent: true });
  });

  test('Case 3 variant: All files have matching DB rows - no deletions', async () => {
    const rows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de.sqlite3', downloaded_at: 1000 },
    ];

    seedFile(dictDir + 'en-de.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce(rows) // Case 1
      .mockResolvedValueOnce(rows) // Case 2
      .mockResolvedValueOnce([{ count: 1 }]); // Case 3: matching row found

    (getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path === dictDir) {
        return { exists: true, isDirectory: true };
      }
      return { exists: true };
    });

    (readDirectoryAsync as jest.Mock).mockResolvedValue(['en-de.sqlite3']);

    await runDictionaryMaintenance();

    expect(deleteAsync).not.toHaveBeenCalled();
  });

  test('Case 3 variant: Non-sqlite3 files ignored', async () => {
    seedFile(dictDir + 'orphan.txt');
    seedFile(dictDir + 'orphan.tmp');
    seedFile(dictDir + 'orphan.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([]) // Case 1
      .mockResolvedValueOnce([]) // Case 2
      .mockResolvedValueOnce([]); // Case 3 matching

    (getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path === dictDir) {
        return { exists: true, isDirectory: true };
      }
      return { exists: false };
    });

    (readDirectoryAsync as jest.Mock).mockResolvedValue(['orphan.txt', 'orphan.tmp', 'orphan.sqlite3']);

    await runDictionaryMaintenance();

    // Only .sqlite3 files should be deleted
    expect(deleteAsync).toHaveBeenCalledTimes(1);
    expect(deleteAsync).toHaveBeenCalledWith(dictDir + 'orphan.sqlite3', { idempotent: true });
  });

  test('dictionaries directory does not exist', async () => {
    (mockDatabase.getAllAsync as jest.Mock)
      .mockResolvedValueOnce([]) // Case 1
      .mockResolvedValueOnce([]); // Case 2

    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    await runDictionaryMaintenance();

    // Case 3 should be skipped
    expect(readDirectoryAsync).not.toHaveBeenCalled();
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  test('Integration - all three cases together', async () => {
    const dbRows = [
      { source_lang: 'en', target_lang: 'de', version: '2_2025-10', file_path: 'file://' + dictDir + 'en-de-v1.sqlite3', downloaded_at: 1000 },
      { source_lang: 'en', target_lang: 'de', version: '2_2025-11', file_path: 'file://' + dictDir + 'en-de-v2.sqlite3', downloaded_at: 2000 },
      { source_lang: 'de', target_lang: 'en', version: '2_2025-11', file_path: 'file://' + dictDir + 'de-en-missing.sqlite3', downloaded_at: 3000 },
    ];

    seedFile(dictDir + 'en-de-v1.sqlite3');
    seedFile(dictDir + 'en-de-v2.sqlite3');
    seedFile(dictDir + 'orphan.sqlite3');

    (mockDatabase.getAllAsync as jest.Mock)
      .mockImplementation((sql: string, params?: any[]) => {
        if (sql.includes('SELECT source_lang, target_lang, version, file_path, downloaded_at FROM installed_dictionaries')) {
          return Promise.resolve(dbRows);
        }
        if (sql.includes('SELECT 1 FROM installed_dictionaries WHERE file_path = ?')) {
          const filePath = params?.[0];
          if (filePath === 'file://' + dictDir + 'en-de-v1.sqlite3' ||
              filePath === 'file://' + dictDir + 'en-de-v2.sqlite3') {
            return Promise.resolve([{ count: 1 }]);
          }
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

    (getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path === dictDir) {
        return { exists: true, isDirectory: true };
      }
      // de-en-missing.sqlite3 doesn't exist, others do
      if (path.includes('de-en-missing')) {
        return { exists: false };
      }
      return { exists: true };
    });

    (readDirectoryAsync as jest.Mock).mockResolvedValue(['en-de-v1.sqlite3', 'en-de-v2.sqlite3', 'orphan.sqlite3']);

    const { closeDictionaryDatabase } = require('./dictionaryDb');

    await runDictionaryMaintenance();

    // Case 1: de-en-missing row should be deleted (file doesn't exist)
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? AND version = ?',
      ['de', 'en', '2_2025-11']
    );

    // Case 2: older version en-de-v1 should be deleted (2 rows for en-de)
    expect(closeDictionaryDatabase).toHaveBeenCalledWith('file://' + dictDir + 'en-de-v1.sqlite3');
    expect(deleteAsync).toHaveBeenCalledWith(dictDir + 'en-de-v1.sqlite3', { idempotent: true });
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? AND version = ?',
      ['en', 'de', '2_2025-10']
    );

    // Case 3: orphan.sqlite3 should be deleted
    expect(deleteAsync).toHaveBeenCalledWith(dictDir + 'orphan.sqlite3', { idempotent: true });
  });

  test('Error handling - each case is independent', async () => {
    // Mock Case 1 to throw error
    (mockDatabase.getAllAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('Case 1 error'))
      .mockResolvedValueOnce([]); // Case 2

    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (readDirectoryAsync as jest.Mock).mockResolvedValue([]);

    const { closeDictionaryDatabase } = require('./dictionaryDb');

    await runDictionaryMaintenance();

    // Case 2 and 3 should still execute
    expect(mockDatabase.getAllAsync).toHaveBeenCalledTimes(2);
    expect(readDirectoryAsync).toHaveBeenCalled();
  });
});
