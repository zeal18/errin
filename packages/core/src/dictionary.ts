import type { LookupResult, TranslationVariant } from './types';
import { devLog } from './devLog';

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

interface TableInfo {
  name: string;
}

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
  importance: number | null;
}

const SIMPLE_TRANSLATION_TABLES = [
  'simple_translation',
  'translation',
  'translations',
  'simple_trans',
] as const;

const GROUPED_TRANSLATION_TABLES = [
  'translation_grouped',
  'grouped_translation',
  'grouped_trans',
  'translations_grouped',
] as const;

async function getAvailableTables(db: DictionaryDatabase): Promise<string[]> {
  try {
    const rows = await db.getAllAsync<TableInfo>(
      'SELECT name FROM sqlite_master WHERE type IN ("table", "view")',
      []
    );
    const tableNames = rows.map((row) => row.name);
    devLog('getAvailableTables: found tables=', tableNames);
    return tableNames;
  } catch (error: any) {
    devLog('getAvailableTables: error=', error.message);
    return [];
  }
}

function findMatchingTable(
  availableTables: string[],
  candidates: readonly string[]
): string | null {
  for (const candidate of candidates) {
    if (availableTables.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function resolveTableName(
  db: DictionaryDatabase,
  candidates: readonly string[],
  tableType: string
): Promise<string> {
  const availableTables = await getAvailableTables(db);
  const matchedName = findMatchingTable(availableTables, candidates);

  if (matchedName) {
    devLog('resolveTableName:', tableType, 'using table=', matchedName);
    return matchedName;
  }

  devLog('resolveTableName:', tableType, 'no matching table found, available=', availableTables);
  throw new Error(
    `No ${tableType} table found. Available tables: ${availableTables.join(', ')}`
  );
}

export function parseTransList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(' | ')
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

  devLog('lookupExact: started, queryLength=', term.length);

  try {
    const tableName = await resolveTableName(
      db,
      SIMPLE_TRANSLATION_TABLES,
      'simple_translation'
    );
    const rows = await db.getAllAsync<SimpleTranslationRow>(
      `SELECT written_rep, trans_list, max_score FROM ${tableName} WHERE written_rep = ? LIMIT 1`,
      [term]
    );

    devLog('lookupExact: success, results=', rows.length, 'table=', tableName);

    if (rows.length === 0) return null;

    const row = rows[0];
    const variant: TranslationVariant = {
      transList: parseTransList(row.trans_list),
      sense: '',
      importance: 0,
    };
    return {
      writtenRep: row.written_rep ?? term,
      variants: [variant],
      score: row.max_score ?? 0,
    };
  } catch (error: any) {
    devLog('lookupExact: error, message=', error.message);
    throw error;
  }
}

export async function lookupRich(
  db: DictionaryDatabase,
  word: string,
  options: RichLookupOptions = {}
): Promise<LookupResult[]> {
  const term = word.trim();
  if (term.length === 0) return [];

  const limit = options.limit ?? DEFAULT_RICH_LIMIT;
  devLog('lookupRich: started, queryLength=', term.length, 'limit=', limit);

  try {
    const tableName = await resolveTableName(
      db,
      GROUPED_TRANSLATION_TABLES,
      'translation_grouped'
    );
    const rows = await db.getAllAsync<TranslationGroupedRow>(
      `SELECT written_rep, sense_list, trans_list, score, importance,
        CASE WHEN LOWER(written_rep) = LOWER(?) THEN 0 ELSE 1 END AS exact_match
       FROM ${tableName}
       WHERE LOWER(written_rep) LIKE LOWER(?) || '%'
       ORDER BY exact_match ASC, importance DESC
       LIMIT ?`,
      [term, term, limit]
    );

    devLog('lookupRich: success, results=', rows.length, 'table=', tableName);

    // Group rows by writtenRep; each row becomes one TranslationVariant.
    // Row order is preserved, so variants within each word stay importance-sorted.
    const grouped = new Map<string, LookupResult>();
    for (const row of rows) {
      const writtenRep = row.written_rep ?? term;
      const key = writtenRep.toLowerCase();
      const variant: TranslationVariant = {
        transList: parseTransList(row.trans_list),
        sense: parseSenseList(row.sense_list)[0] ?? '',
        importance: row.importance ?? 0,
      };
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          writtenRep,
          variants: [variant],
          score: row.score ?? 0,
        });
      } else {
        existing.variants.push(variant);
        if ((row.score ?? 0) > existing.score) {
          existing.score = row.score ?? 0;
        }
      }
    }

    return Array.from(grouped.values());
  } catch (error: any) {
    devLog('lookupRich: error, message=', error.message);
    throw error;
  }
}
