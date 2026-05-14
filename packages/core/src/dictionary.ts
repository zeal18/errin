import type { LookupResult } from './types';

export interface DictionaryDatabase {
  getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;
}

export interface RichLookupOptions {
  limit?: number;
}

const DEFAULT_RICH_LIMIT = 20;

interface SimpleTranslationRow {
  written_rep: string | null;
  trans_list: string | null;
  max_score: number | null;
}

interface TranslationGroupedRow {
  written_rep: string | null;
  sense_list: string | null;
  trans_list: string | null;
  score: number | null;
}

export function parseTransList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseSenseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(' | ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function lookupExact(
  db: DictionaryDatabase,
  word: string
): Promise<LookupResult | null> {
  const term = word.trim();
  if (term.length === 0) return null;

  const rows = await db.getAllAsync<SimpleTranslationRow>(
    'SELECT written_rep, trans_list, max_score FROM simple_translation WHERE written_rep = ? LIMIT 1',
    [term]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    writtenRep: row.written_rep ?? term,
    transList: parseTransList(row.trans_list),
    senseList: [],
    score: row.max_score ?? 0,
  };
}

export async function lookupRich(
  db: DictionaryDatabase,
  word: string,
  options: RichLookupOptions = {}
): Promise<LookupResult[]> {
  const term = word.trim();
  if (term.length === 0) return [];

  const limit = options.limit ?? DEFAULT_RICH_LIMIT;
  const rows = await db.getAllAsync<TranslationGroupedRow>(
    'SELECT written_rep, sense_list, trans_list, score FROM translation_grouped WHERE written_rep = ? ORDER BY score DESC LIMIT ?',
    [term, limit]
  );

  return rows.map((row) => ({
    writtenRep: row.written_rep ?? term,
    transList: parseTransList(row.trans_list),
    senseList: parseSenseList(row.sense_list),
    score: row.score ?? 0,
  }));
}
