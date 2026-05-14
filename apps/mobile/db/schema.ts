export const DB_NAME = 'errin.db';

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  sense TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  due_at INTEGER NOT NULL,
  interval INTEGER NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  reviews INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_words_due_at ON words(due_at);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);

CREATE TABLE IF NOT EXISTS installed_dictionaries (
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  file_path TEXT NOT NULL,
  downloaded_at INTEGER NOT NULL,
  PRIMARY KEY (source_lang, target_lang)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_review_limit INTEGER NOT NULL DEFAULT 20,
  last_active_source_lang TEXT,
  last_active_target_lang TEXT
);

INSERT OR IGNORE INTO settings (id, daily_review_limit) VALUES (1, 20);
`;

export interface WordRow {
  id: string;
  source: string;
  target: string;
  sense: string;
  source_lang: string;
  target_lang: string;
  created_at: number;
  due_at: number;
  interval: number;
  ease: number;
  reviews: number;
}

export interface InstalledDictionaryRow {
  source_lang: string;
  target_lang: string;
  file_path: string;
  downloaded_at: number;
}

export interface SettingsRow {
  id: 1;
  daily_review_limit: number;
  last_active_source_lang: string | null;
  last_active_target_lang: string | null;
}
