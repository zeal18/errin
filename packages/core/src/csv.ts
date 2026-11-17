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
 * Parse a CSV string into an array of Word objects.
 * 
 * - Strips a leading UTF-8 BOM if present
 * - Accepts CRLF or LF line endings (RFC 4180 compliant)
 * - Handles RFC 4180 quoting: quoted fields, doubled quotes, embedded newlines
 * - Requires exact header: id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews
 * - Converts createdAt, dueAt, interval, ease, reviews to numbers
 * - Returns words in file order (not sorted)
 * - Throws descriptive errors with row numbers on validation failures
 */
export function csvToWords(csv: string): Word[] {
  // Strip UTF-8 BOM if present
  let content = csv;
  if (content.startsWith('\uFEFF')) {
    content = content.slice(1);
  }

  // If empty after BOM stripping, no data
  if (content.length === 0) {
    throw new Error('Missing header row');
  }

  // Parse into records using a state machine
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let row = 0;
  let col = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        // Check next character
        if (i + 1 < content.length && content[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip the next quote
        } else {
          // Closing quote
          inQuotes = false;
          // Check what comes after the closing quote
          if (i + 1 < content.length) {
            const nextChar = content[i + 1];
            if (nextChar !== ',' && nextChar !== '\r' && nextChar !== '\n') {
              throw new Error(`Row ${row + 1}: unexpected character after closing quote`);
            }
          }
        }
      } else {
        // Any character inside quotes is kept as-is
        currentField += char;
      }
    } else {
      // Not in quotes
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // End of field
        currentRecord.push(currentField);
        currentField = '';
        col++;
      } else if (char === '\r') {
        // Check if followed by \n (CRLF)
        if (i + 1 < content.length && content[i + 1] === '\n') {
          i++; // Skip the \n
        }
        // End of record
        currentRecord.push(currentField);
        currentField = '';
        records.push(currentRecord);
        currentRecord = [];
        col = 0;
        row++;
      } else if (char === '\n') {
        // End of record (LF)
        currentRecord.push(currentField);
        currentField = '';
        records.push(currentRecord);
        currentRecord = [];
        col = 0;
        row++;
      } else {
        currentField += char;
      }
    }
  }

  // Handle EOF
  if (inQuotes) {
    throw new Error(`Row ${row + 1}: unterminated quoted field`);
  }

  // Push the last field and record if there's content
  if (currentField !== '' || currentRecord.length > 0 || records.length === 0) {
    currentRecord.push(currentField);
    records.push(currentRecord);
  }

  // Remove trailing empty record from trailing newline
  if (records.length > 0 && records[records.length - 1].length === 1 && records[records.length - 1][0] === '') {
    records.pop();
  }

  // Now validate and parse
  if (records.length === 0) {
    throw new Error('Missing header row');
  }

  // Check header (row 1 in 1-indexed terms)
  const header = records[0];
  const expectedHeader = WORDS_CSV_COLUMNS.join(',');
  if (header.join(',') !== expectedHeader) {
    throw new Error(`Row 1: unexpected header "${header.join(',')}"; expected "${expectedHeader}"`);
  }

  const words: Word[] = [];
  const expectedColCount = WORDS_CSV_COLUMNS.length;

  for (let i = 1; i < records.length; i++) {
    const rowIndex = i + 1; // 1-indexed row number
    const fields = records[i];

    // Check column count
    if (fields.length !== expectedColCount) {
      throw new Error(`Row ${rowIndex}: expected ${expectedColCount} columns, found ${fields.length}`);
    }

    // Helper to convert to number
    function toNumber(value: string, column: string): number {
      const trimmed = value.trim();
      if (trimmed === '') {
        throw new Error(`Row ${rowIndex}: ${column} is not a number ("${value}")`);
      }
      const num = Number(trimmed);
      if (!Number.isFinite(num)) {
        throw new Error(`Row ${rowIndex}: ${column} is not a number ("${value}")`);
      }
      return num;
    }

    // Validate and parse fields
    const [
      id,
      source,
      target,
      sense,
      sourceLang,
      targetLang,
      createdAtStr,
      dueAtStr,
      intervalStr,
      easeStr,
      reviewsStr,
    ] = fields;

    // Check non-empty required fields
    if (source.trim() === '') {
      throw new Error(`Row ${rowIndex}: source is empty`);
    }
    if (sourceLang.trim() === '') {
      throw new Error(`Row ${rowIndex}: sourceLang is empty`);
    }
    if (targetLang.trim() === '') {
      throw new Error(`Row ${rowIndex}: targetLang is empty`);
    }

    const word: Word = {
      id: id || '',
      source,
      target,
      sense,
      sourceLang,
      targetLang,
      createdAt: toNumber(createdAtStr, 'createdAt'),
      dueAt: toNumber(dueAtStr, 'dueAt'),
      interval: toNumber(intervalStr, 'interval'),
      ease: toNumber(easeStr, 'ease'),
      reviews: toNumber(reviewsStr, 'reviews'),
    };

    words.push(word);
  }

  return words;
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
