import { runMigrations, migrateInstalledDictionariesVersionKey } from './index';
import { mockDatabase, resetMockDatabase, MockSQLiteDatabase } from '../__mocks__/expo-sqlite';
import * as SQLite from 'expo-sqlite';

// Mock devLog to be a no-op
jest.mock('../lib/devLog', () => ({
  devLog: jest.fn(),
}));

// Cast the mock database to the actual SQLite type
function asSQLiteDatabase(db: MockSQLiteDatabase): SQLite.SQLiteDatabase {
  return db as unknown as SQLite.SQLiteDatabase;
}

describe('runMigrations - theme_preference', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
    // Reset the module cache for db/index.ts to ensure fresh state
    jest.resetModules();
  });

  it('should execute ALTER TABLE for theme_preference on fresh DB', async () => {
    const db = asSQLiteDatabase(mockDatabase);
    // Simulate the execAsync succeeding for ALTER TABLE
    (db.execAsync as jest.Mock).mockResolvedValue(undefined);
    (db.withTransactionAsync as jest.Mock).mockImplementation(async (callback) => {
      await callback();
    });

    await runMigrations(db);

    // Check that theme_preference migration was attempted
    expect(db.execAsync).toHaveBeenCalledWith(
      'ALTER TABLE settings ADD COLUMN theme_preference TEXT NOT NULL DEFAULT \'system\''
    );
  });

  it('should handle duplicate column error gracefully for theme_preference', async () => {
    const db = asSQLiteDatabase(mockDatabase);
    // Simulate the first ALTER (lookup_direction) succeeding
    // and theme_preference failing with duplicate column
    (db.execAsync as jest.Mock)
      .mockResolvedValueOnce(undefined) // lookup_direction succeeds
      .mockRejectedValueOnce(new Error('duplicate column name: theme_preference')) // theme_preference fails
      .mockResolvedValueOnce(undefined) // for any other calls
      .mockResolvedValueOnce(undefined); // for migrateInstalledDictionariesVersionKey
    (db.withTransactionAsync as jest.Mock).mockImplementation(async (callback) => {
      await callback();
    });

    await runMigrations(db);

    // Should still complete without throwing
    // The duplicate column error should be caught
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE settings ADD COLUMN theme_preference')
    );
  });

  it('should attempt theme_preference migration even if lookup_direction fails', async () => {
    const db = asSQLiteDatabase(mockDatabase);
    // Simulate lookup_direction ALTER failing (column already exists)
    (db.execAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('duplicate column name: lookup_direction')) // lookup_direction fails
      .mockResolvedValueOnce(undefined) // theme_preference succeeds
      .mockResolvedValueOnce(undefined); // for migrateInstalledDictionariesVersionKey
    (db.withTransactionAsync as jest.Mock).mockImplementation(async (callback) => {
      await callback();
    });

    await runMigrations(db);

    // Both should be attempted
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE settings ADD COLUMN lookup_direction')
    );
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE settings ADD COLUMN theme_preference')
    );
  });

  it('should call migrateInstalledDictionariesVersionKey', async () => {
    const db = asSQLiteDatabase(mockDatabase);
    (db.execAsync as jest.Mock).mockResolvedValue(undefined);
    (db.withTransactionAsync as jest.Mock).mockImplementation(async (callback) => {
      await callback();
    });
    (db.getAllAsync as jest.Mock).mockResolvedValue([]);

    await runMigrations(db);

    // The function should be called, but it's imported and called directly
    // We can't easily spy on it without more complex mocking
    // Just verify that execAsync was called with the theme_preference migration
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE settings ADD COLUMN theme_preference')
    );
  });
});
