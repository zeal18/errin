import { getDatabase } from './index';
import { INITIAL_EASE, type Word } from '@errin/core';
import type { WordRow } from './schema';

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    sense: row.sense,
    sourceLang: row.source_lang,
    targetLang: row.target_lang,
    createdAt: row.created_at,
    dueAt: row.due_at,
    interval: row.interval,
    ease: row.ease,
    reviews: row.reviews,
  };
}

/**
 * Helper to extract word parameters in the correct order for SQL queries.
 */
function wordParams(w: Word): [string, string, string, string, string, string, number, number, number, number, number] {
  return [
    w.id,
    w.source,
    w.target,
    w.sense,
    w.sourceLang,
    w.targetLang,
    w.createdAt,
    w.dueAt,
    w.interval,
    w.ease,
    w.reviews,
  ];
}

export async function getAllWords(): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words ORDER BY created_at DESC'
  );
  return rows.map(rowToWord);
}

export async function saveWord(word: Word): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO words
      (id, source, target, sense, source_lang, target_lang, created_at, due_at, interval, ease, reviews)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wordParams(word)
  );
}

export async function deleteWord(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM words WHERE id = ?', [id]);
}

export async function getDueWords(limit: number): Promise<Word[]> {
  const db = await getDatabase();
  const now = Date.now();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT * FROM words 
     WHERE due_at <= ? 
     ORDER BY due_at ASC, created_at ASC 
     LIMIT ?`,
    [now, limit]
  );
  return rows.map(rowToWord);
}

export async function getWordsBySource(
  sources: string[],
  sourceLang: string
): Promise<Map<string, Word>> {
  if (sources.length === 0) return new Map();
  const db = await getDatabase();
  const placeholders = sources.map(() => '?').join(', ');
  const rows = await db.getAllAsync<WordRow>(
    `SELECT * FROM words WHERE source IN (${placeholders}) AND source_lang = ? ORDER BY created_at DESC`,
    [...sources, sourceLang]
  );
  const map = new Map<string, Word>();
  for (const row of rows) {
    if (!map.has(row.source)) {
      map.set(row.source, rowToWord(row));
    }
  }
  return map;
}

export async function replaceWord(
  id: string,
  newTarget: string,
  newSense: string
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE words SET target = ?, sense = ?, reviews = 0, interval = 0, ease = ?, due_at = ? WHERE id = ?`,
    [newTarget, newSense, INITIAL_EASE, now, id]
  );
}

export async function resetWordProgress(id: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE words SET reviews = 0, interval = 0, ease = ?, due_at = ? WHERE id = ?`,
    [INITIAL_EASE, now, id]
  );
}

export async function updateWord(word: Word): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE words 
     SET source = ?, target = ?, sense = ?, source_lang = ?, target_lang = ?,
         created_at = ?, due_at = ?, interval = ?, ease = ?, reviews = ?
     WHERE id = ?`,
    [
      word.source,
      word.target,
      word.sense,
      word.sourceLang,
      word.targetLang,
      word.createdAt,
      word.dueAt,
      word.interval,
      word.ease,
      word.reviews,
      word.id,
    ]
  );
}

/**
 * Get only the id, source, and sourceLang for all words.
 * Used for duplicate checking during import without loading full Word objects.
 */
export async function getWordKeys(): Promise<{ id: string; source: string; sourceLang: string }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; source: string; source_lang: string }>(
    'SELECT id, source, source_lang FROM words'
  );
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    sourceLang: row.source_lang,
  }));
}

/**
 * Insert multiple words in a single transaction.
 * Uses plain INSERT (not OR IGNORE) so that ID collisions cause an error.
 * This ensures atomicity - either all words are inserted or none are.
 */
export async function insertWords(words: Word[]): Promise<void> {
  if (words.length === 0) {
    return;
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const w of words) {
      await db.runAsync(
        `INSERT INTO words 
          (id, source, target, sense, source_lang, target_lang, created_at, due_at, interval, ease, reviews)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        wordParams(w)
      );
    }
  });
}
