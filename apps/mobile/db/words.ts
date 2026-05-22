import { getDatabase } from './index';
import type { Word } from '@errin/core';
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
    [
      word.id,
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
    ]
  );
}

export async function deleteWord(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM words WHERE id = ?', [id]);
}
