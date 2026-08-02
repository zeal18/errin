import { type SQLiteBindParams as SQLiteBindParamsType } from 'expo-sqlite';

interface MockSQLiteDatabase {
  getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
  runAsync(sql: string, params?: any[]): Promise<void>;
  execAsync(sql: string): Promise<void>;
  withTransactionAsync(callback: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

const mockDatabase: MockSQLiteDatabase & {
  getAllAsync: jest.Mock & MockSQLiteDatabase['getAllAsync'];
  runAsync: jest.Mock & MockSQLiteDatabase['runAsync'];
  execAsync: jest.Mock & MockSQLiteDatabase['execAsync'];
  withTransactionAsync: jest.Mock & MockSQLiteDatabase['withTransactionAsync'];
  closeAsync: jest.Mock & MockSQLiteDatabase['closeAsync'];
} = {
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue(undefined),
  execAsync: jest.fn().mockResolvedValue(undefined),
  withTransactionAsync: jest.fn().mockImplementation(async (callback) => {
    await callback();
  }),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

const openDatabaseAsync = jest.fn().mockResolvedValue(mockDatabase);

const resetMockDatabase = (): void => {
  mockDatabase.getAllAsync.mockClear();
  mockDatabase.runAsync.mockClear();
  mockDatabase.execAsync.mockClear();
  mockDatabase.withTransactionAsync.mockClear();
  mockDatabase.closeAsync.mockClear();
  openDatabaseAsync.mockClear();
};

const SQLite = {
  openDatabaseAsync,
  SQLiteBindParams: Array as any,
  getAllAsync: mockDatabase.getAllAsync,
  runAsync: mockDatabase.runAsync,
  execAsync: mockDatabase.execAsync,
  withTransactionAsync: mockDatabase.withTransactionAsync,
  closeAsync: mockDatabase.closeAsync,
};

// Export both default (for import * as SQLite from 'expo-sqlite') and named exports
export default SQLite;
export { mockDatabase, resetMockDatabase, MockSQLiteDatabase };
