import type { Word } from './types';

export const WORDS_CSV_COLUMNS = [
  'id',
  'source',
  'target',
  'sense',
  'sourceLang',
  'targetLang',
  'createdAt',
  'dueAt',
  'interval',
  'ease',
  'reviews',
] as const;

const BOM = '\uFEFF';
const EOL = '\r\n'; // RFC 4180 line terminator

/**
 * Escape a CSV field according to RFC 4180.
 * Fields containing commas, double quotes, CR/LF or leading/trailing spaces
 * are wrapped in double quotes and inner quotes are doubled.
 */
export function escapeCsvField(value: string | number): string {
  const s = String(value);
  const hasSpecialChars = /[",\r\n]/.test(s);
  const hasLeadingOrTrailingSpace = s.startsWith(' ') || s.endsWith(' ');
  if (hasSpecialChars || hasLeadingOrTrailingSpace) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Serialize an array of Word objects to CSV format.
 * 
 * - Writes a header row with the column names from WORDS_CSV_COLUMNS
 * - One row per word, ordered by createdAt ascending (oldest first)
 * - Ties on createdAt are broken by id (lexicographic)
 * - Uses RFC 4180 quoting for fields that need it
 * - Output is UTF-8 with BOM for correct display of non-Latin text
 * - Uses CRLF line endings
 * - Numbers (timestamps, interval, ease, reviews) are written as raw strings
 * - An empty list produces only the header row
 */
export function wordsToCsv(words: Word[]): string {
  // Sort by createdAt ascending, then by id for deterministic tie-breaking
  const sorted = [...words].sort((a, b) => {
    const dateDiff = a.createdAt - b.createdAt;
    if (dateDiff !== 0) return dateDiff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const lines = [WORDS_CSV_COLUMNS.join(',')];
  for (const w of sorted) {
    const row = WORDS_CSV_COLUMNS.map((c) => {
      // TypeScript doesn't know c is a key of Word, but we know it is
      const val = (w as unknown as Record<string, string | number>)[c];
      return escapeCsvField(val);
    });
    lines.push(row.join(','));
  }

  return BOM + lines.join(EOL) + EOL;
}
