import { getDatabase } from './index';
import type { Word } from '@errin/core';

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
