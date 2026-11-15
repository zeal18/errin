import { create } from 'zustand';
import { mockDatabase, resetMockDatabase } from '../__mocks__/expo-sqlite';
import type { SettingsRow } from '../db/schema';

// Mock devLog to be a no-op
jest.mock('../lib/devLog', () => ({
  devLog: jest.fn(),
}));

// Mock getDatabase to return our mock database
jest.mock('../db', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDatabase),
  DB_NAME: 'errin.db',
  SCHEMA_SQL: '',
}));

// Import after mocks are set up
import { createSettingsSlice, type SettingsSlice, parseThemePreference, DEFAULT_SETTINGS } from '../store/settingsSlice';

describe('parseThemePreference', () => {
  it('returns valid preferences as-is', () => {
    expect(parseThemePreference('system')).toBe('system');
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference('dark')).toBe('dark');
  });

  it('returns system for null/undefined/unknown values', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference(undefined)).toBe('system');
    expect(parseThemePreference('invalid')).toBe('system');
    expect(parseThemePreference('')).toBe('system');
    expect(parseThemePreference(123)).toBe('system');
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('should have themePreference defaulting to system', () => {
    expect(DEFAULT_SETTINGS.themePreference).toBe('system');
  });
});

describe('createSettingsSlice - themePreference', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  const createStore = () => {
    const store = create<SettingsSlice>()(createSettingsSlice);
    return store;
  };

  it('should have themePreference defaulting to system', () => {
    const store = createStore();
    expect(store.getState().settings.themePreference).toBe('system');
  });

  it('hydrateSettings should handle null row and return defaults', async () => {
    const store = createStore();
    (mockDatabase.getFirstAsync as jest.Mock).mockResolvedValueOnce(null);

    await store.getState().hydrateSettings();

    expect(store.getState().settings.themePreference).toBe('system');
    expect(store.getState().settingsLoaded).toBe(true);
    // Verify the SELECT includes theme_preference
    expect(mockDatabase.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('theme_preference')
    );
  });

  it('hydrateSettings should parse theme_preference from row', async () => {
    const store = createStore();
    const row: SettingsRow = {
      id: 1,
      daily_review_limit: 20,
      last_active_source_lang: null,
      last_active_target_lang: null,
      lookup_direction: 'studied_to_native',
      theme_preference: 'dark',
    };
    (mockDatabase.getFirstAsync as jest.Mock).mockResolvedValueOnce(row);

    await store.getState().hydrateSettings();

    expect(store.getState().settings.themePreference).toBe('dark');
    // Verify the SELECT includes theme_preference
    expect(mockDatabase.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('theme_preference')
    );
  });

  it('hydrateSettings should fallback to system for invalid theme_preference', async () => {
    const store = createStore();
    const row: SettingsRow = {
      id: 1,
      daily_review_limit: 20,
      last_active_source_lang: null,
      last_active_target_lang: null,
      lookup_direction: 'studied_to_native',
      theme_preference: 'invalid',
    };
    (mockDatabase.getFirstAsync as jest.Mock).mockResolvedValueOnce(row);

    await store.getState().hydrateSettings();

    expect(store.getState().settings.themePreference).toBe('system');
  });

  it('hydrateSettings should fallback to system for null theme_preference', async () => {
    const store = createStore();
    const row: SettingsRow = {
      id: 1,
      daily_review_limit: 20,
      last_active_source_lang: null,
      last_active_target_lang: null,
      lookup_direction: 'studied_to_native',
      theme_preference: null as unknown as string,
    };
    (mockDatabase.getFirstAsync as jest.Mock).mockResolvedValueOnce(row);

    await store.getState().hydrateSettings();

    expect(store.getState().settings.themePreference).toBe('system');
  });

  it('setThemePreference should update state and persist to database', async () => {
    const store = createStore();
    (mockDatabase.runAsync as jest.Mock).mockResolvedValue(undefined);

    await store.getState().setThemePreference('light');

    // Check state was updated
    expect(store.getState().settings.themePreference).toBe('light');
    // Check database was called with correct SQL
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      'UPDATE settings SET theme_preference = ? WHERE id = 1',
      ['light']
    );
  });

  it('setThemePreference should persist dark preference', async () => {
    const store = createStore();
    (mockDatabase.runAsync as jest.Mock).mockResolvedValue(undefined);

    await store.getState().setThemePreference('dark');

    expect(store.getState().settings.themePreference).toBe('dark');
    expect(mockDatabase.runAsync).toHaveBeenCalledWith(
      'UPDATE settings SET theme_preference = ? WHERE id = 1',
      ['dark']
    );
  });

  it('restart round-trip: persist then rehydrate', async () => {
    const store = createStore();
    (mockDatabase.runAsync as jest.Mock).mockResolvedValue(undefined);

    // Persist dark preference
    await store.getState().setThemePreference('dark');
    expect(store.getState().settings.themePreference).toBe('dark');

    // Simulate restart: create a fresh store and hydrate with the persisted value
    const freshStore = create<SettingsSlice>()(createSettingsSlice);
    resetMockDatabase();
    
    const persistedRow: SettingsRow = {
      id: 1,
      daily_review_limit: 20,
      last_active_source_lang: null,
      last_active_target_lang: null,
      lookup_direction: 'studied_to_native',
      theme_preference: 'dark',
    };
    (mockDatabase.getFirstAsync as jest.Mock).mockResolvedValueOnce(persistedRow);

    await freshStore.getState().hydrateSettings();

    expect(freshStore.getState().settings.themePreference).toBe('dark');
  });
});
