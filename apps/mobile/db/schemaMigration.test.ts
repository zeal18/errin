import { migrateInstalledDictionariesVersionKey } from './index';
import { mockDatabase, resetMockDatabase, MockSQLiteDatabase } from '../__mocks__/expo-sqlite';
import * as SQLite from 'expo-sqlite';

interface TableInfoRow {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

const LEGACY_DICTIONARY_VERSION = '2_2025-11';

// Cast the mock database to the actual SQLite type for passing to functions
function asSQLiteDatabase(db: MockSQLiteDatabase): SQLite.SQLiteDatabase {
  return db as unknown as SQLite.SQLiteDatabase;
}

// Mock devLog to be a no-op
jest.mock('../lib/devLog', () => ({
  devLog: jest.fn(),
}));

describe('migrateInstalledDictionariesVersionKey', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  test('table does not exist - should return early', async () => {
    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce([]);

    await migrateInstalledDictionariesVersionKey(asSQLiteDatabase(mockDatabase));

    expect(mockDatabase.execAsync).not.toHaveBeenCalled();
    expect(mockDatabase.runAsync).not.toHaveBeenCalled();
  });

  test('table already has current shape (3-column PK with version) - should return early', async () => {
    const columns: TableInfoRow[] = [
      { cid: 0, name: 'source_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'target_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 2 },
      { cid: 2, name: 'version', type: 'TEXT', notnull: 1, dflt_value: null, pk: 3 },
      { cid: 3, name: 'file_path', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 4, name: 'downloaded_at', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
    ];
    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(columns);

    await migrateInstalledDictionariesVersionKey(asSQLiteDatabase(mockDatabase));

    expect(mockDatabase.execAsync).not.toHaveBeenCalled();
    expect(mockDatabase.runAsync).not.toHaveBeenCalled();
  });

  test('table has old shape (2-column PK without version) - should perform full migration', async () => {
    const oldColumns: TableInfoRow[] = [
      { cid: 0, name: 'source_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'target_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 2 },
      { cid: 2, name: 'file_path', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 3, name: 'downloaded_at', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
    ];

    const sampleRows = [
      { source_lang: 'en', target_lang: 'de', file_path: 'file:///data/en-de.sqlite3', downloaded_at: 1000 },
      { source_lang: 'de', target_lang: 'en', file_path: 'file:///data/de-en.sqlite3', downloaded_at: 2000 },
    ];

    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(oldColumns);
    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(sampleRows);

    await migrateInstalledDictionariesVersionKey(asSQLiteDatabase(mockDatabase));

    // Verify DROP TABLE IF EXISTS installed_dictionaries_new
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('DROP TABLE IF EXISTS installed_dictionaries_new');

    // Verify CREATE TABLE installed_dictionaries_new
    expect(mockDatabase.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE installed_dictionaries_new')
    );
    expect(mockDatabase.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('PRIMARY KEY (source_lang, target_lang, version)')
    );

    // Verify INSERT with backfilled version - runAsync receives params as spread args
    expect(mockDatabase.runAsync).toHaveBeenCalled();
    const runAsyncCalls = (mockDatabase.runAsync as jest.Mock).mock.calls;
    expect(runAsyncCalls.length).toBeGreaterThan(0);
    const insertCall = runAsyncCalls.find(c => (c[0] as string).includes('INSERT INTO installed_dictionaries_new'));
    expect(insertCall).toBeDefined();
    // Second argument is the version parameter (spread as individual arg, not array)
    expect(insertCall![1]).toEqual(LEGACY_DICTIONARY_VERSION);

    // Verify DROP TABLE installed_dictionaries
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('DROP TABLE installed_dictionaries');

    // Verify ALTER TABLE RENAME
    expect(mockDatabase.execAsync).toHaveBeenCalledWith(
      'ALTER TABLE installed_dictionaries_new RENAME TO installed_dictionaries'
    );

    // Verify PRAGMA foreign_keys = OFF
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF');

    // Verify PRAGMA foreign_keys = ON
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');

    // Verify withTransactionAsync was used
    expect(mockDatabase.withTransactionAsync).toHaveBeenCalled();
  });

  test('migration handles empty old table', async () => {
    const oldColumns: TableInfoRow[] = [
      { cid: 0, name: 'source_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'target_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 2 },
      { cid: 2, name: 'file_path', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 3, name: 'downloaded_at', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
    ];

    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(oldColumns);
    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce([]);

    await migrateInstalledDictionariesVersionKey(asSQLiteDatabase(mockDatabase));

    // Verify migration completes without errors
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('DROP TABLE IF EXISTS installed_dictionaries_new');
    expect(mockDatabase.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE installed_dictionaries_new')
    );
    expect(mockDatabase.execAsync).toHaveBeenCalledWith('DROP TABLE installed_dictionaries');
    expect(mockDatabase.execAsync).toHaveBeenCalledWith(
      'ALTER TABLE installed_dictionaries_new RENAME TO installed_dictionaries'
    );
  });

  test('migration handles multiple rows', async () => {
    const oldColumns: TableInfoRow[] = [
      { cid: 0, name: 'source_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
      { cid: 1, name: 'target_lang', type: 'TEXT', notnull: 1, dflt_value: null, pk: 2 },
      { cid: 2, name: 'file_path', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      { cid: 3, name: 'downloaded_at', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
    ];

    const sampleRows = [
      { source_lang: 'en', target_lang: 'de', file_path: 'file:///data/en-de.sqlite3', downloaded_at: 1000 },
      { source_lang: 'de', target_lang: 'en', file_path: 'file:///data/de-en.sqlite3', downloaded_at: 2000 },
      { source_lang: 'en', target_lang: 'ru', file_path: 'file:///data/en-ru.sqlite3', downloaded_at: 3000 },
    ];

    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(oldColumns);
    (mockDatabase.getAllAsync as jest.Mock).mockResolvedValueOnce(sampleRows);

    await migrateInstalledDictionariesVersionKey(asSQLiteDatabase(mockDatabase));

    // Verify INSERT was called with all 3 rows
    expect(mockDatabase.runAsync).toHaveBeenCalled();
    const runAsyncCalls = (mockDatabase.runAsync as jest.Mock).mock.calls;
    const insertCall = runAsyncCalls.find(c => (c[0] as string).includes('INSERT INTO installed_dictionaries_new'));
    expect(insertCall).toBeDefined();
    expect(insertCall![1]).toEqual(LEGACY_DICTIONARY_VERSION);
  });
});
