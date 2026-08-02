interface MockSQLiteDatabase {
  getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
  runAsync(sql: string, params?: any[]): Promise<void>;
  execAsync(sql: string): Promise<void>;
  withTransactionAsync(callback: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

const mockDatabase: MockSQLiteDatabase = {
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

// Mock type for TypeScript
interface SQLiteBindParams extends Array<any> {}

const SQLite = {
  openDatabaseAsync,
  SQLiteBindParams,
};

export = SQLite;
export { mockDatabase, resetMockDatabase, MockSQLiteDatabase, SQLiteBindParams };
