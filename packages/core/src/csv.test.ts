import { wordsToCsv, escapeCsvField, WORDS_CSV_COLUMNS } from './csv';
import type { Word } from './types';

// Helper to create a Word with defaults
function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'test-id',
    source: 'test-source',
    target: 'test-target',
    sense: 'test-sense',
    sourceLang: 'en',
    targetLang: 'de',
    createdAt: 1700000000000,
    dueAt: 1700000000000,
    interval: 0,
    ease: 2.5,
    reviews: 0,
    ...overrides,
  };
}

describe('wordsToCsv', () => {
  describe('empty list', () => {
    it('returns BOM + header + CRLF only', () => {
      const result = wordsToCsv([]);
      const expectedHeader = WORDS_CSV_COLUMNS.join(',');
      expect(result).toBe('\uFEFF' + expectedHeader + '\r\n');
    });

    it('starts with BOM', () => {
      const result = wordsToCsv([]);
      expect(result.charCodeAt(0)).toBe(0xFEFF);
    });
  });

  describe('header', () => {
    it('has the correct column names in order', () => {
      const result = wordsToCsv([]);
      // Skip BOM
      const header = result.slice(1).split('\r\n')[0];
      expect(header).toBe(WORDS_CSV_COLUMNS.join(','));
    });
  });

  describe('field order', () => {
    it('writes fields in the correct order', () => {
      const word = makeWord({
        id: 'w1',
        source: 'hello',
        target: 'hallo',
        sense: 'greeting',
        sourceLang: 'en',
        targetLang: 'de',
        createdAt: 1731628800000,
        dueAt: 1731628800000,
        interval: 1,
        ease: 2.5,
        reviews: 3,
      });

      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const dataRow = lines[1]; // Skip header
      const fields = dataRow.split(',');

      expect(fields).toHaveLength(WORDS_CSV_COLUMNS.length);
      expect(fields[0]).toBe('w1');
      expect(fields[1]).toBe('hello');
      expect(fields[2]).toBe('hallo');
      expect(fields[3]).toBe('greeting');
      expect(fields[4]).toBe('en');
      expect(fields[5]).toBe('de');
      expect(fields[6]).toBe('1731628800000');
      expect(fields[7]).toBe('1731628800000');
      expect(fields[8]).toBe('1');
      expect(fields[9]).toBe('2.5');
      expect(fields[10]).toBe('3');
    });
  });

  describe('raw numbers', () => {
    it('keeps timestamps as raw numbers', () => {
      const word = makeWord({
        createdAt: 1731628800000,
        dueAt: 1731715200000,
        interval: 42,
        ease: 2.5,
        reviews: 10,
      });

      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[6]).toBe('1731628800000');
      expect(fields[7]).toBe('1731715200000');
      expect(fields[8]).toBe('42');
      expect(fields[9]).toBe('2.5');
      expect(fields[10]).toBe('10');
    });
  });

  describe('RFC 4180 quoting', () => {
    it('quotes fields containing commas', () => {
      const word = makeWord({
        source: 'a,b',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const dataRow = lines[1];

      // The source field should be quoted in the output
      expect(dataRow).toContain('"a,b"');
    });

    it('quotes fields containing double quotes and doubles them', () => {
      const word = makeWord({
        sense: 'say "hi"',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      // The sense field (index 3) should be quoted with doubled quotes
      expect(fields[3]).toBe('"say ""hi"""');
    });

    it('quotes fields containing newlines', () => {
      const word = makeWord({
        sense: 'line1\nline2',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[3]).toBe('"line1\nline2"');
    });

    it('quotes fields containing CRLF', () => {
      const word = makeWord({
        sense: 'line1\r\nline2',
      });
      const result = wordsToCsv([word]);

      // The field with CRLF should be quoted
      expect(result).toContain('"line1\r\nline2"');
    });

    it('quotes fields with leading spaces', () => {
      const word = makeWord({
        source: ' leading',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[1]).toBe('" leading"');
    });

    it('quotes fields with trailing spaces', () => {
      const word = makeWord({
        source: 'trailing ',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[1]).toBe('"trailing "');
    });

    it('does not quote plain text', () => {
      const word = makeWord({
        source: 'plain',
        target: 'text',
        sense: 'no special chars',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[1]).toBe('plain');
      expect(fields[2]).toBe('text');
      expect(fields[3]).toBe('no special chars');
    });
  });

  describe('non-Latin text', () => {
    it('handles Cyrillic text without quoting', () => {
      const word = makeWord({
        source: 'собака',
        target: 'dog',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[1]).toBe('собака');
      expect(fields[2]).toBe('dog');
    });

    it('handles German umlauts without quoting', () => {
      const word = makeWord({
        source: 'Übermäßig',
        target: 'excessive',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[1]).toBe('Übermäßig');
      expect(fields[2]).toBe('excessive');
    });

    it('handles German sharp s without quoting', () => {
      const word = makeWord({
        source: 'Straße',
        target: 'street',
      });
      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      expect(fields[1]).toBe('Straße');
      expect(fields[2]).toBe('street');
    });
  });

  describe('ordering', () => {
    it('orders words by createdAt ascending', () => {
      const wordA = makeWord({ id: 'a', createdAt: 100 });
      const wordB = makeWord({ id: 'b', createdAt: 200 });
      const wordC = makeWord({ id: 'c', createdAt: 300 });

      const result = wordsToCsv([wordC, wordA, wordB]);
      const lines = result.split('\r\n');

      // Skip header, check data rows
      expect(lines[1]).toContain('a');
      expect(lines[2]).toContain('b');
      expect(lines[3]).toContain('c');
    });

    it('breaks ties by id', () => {
      const wordA = makeWord({ id: 'a', createdAt: 100 });
      const wordB = makeWord({ id: 'b', createdAt: 100 });
      const wordC = makeWord({ id: 'c', createdAt: 100 });

      const result = wordsToCsv([wordC, wordA, wordB]);
      const lines = result.split('\r\n');

      expect(lines[1]).toContain('a');
      expect(lines[2]).toContain('b');
      expect(lines[3]).toContain('c');
    });

    it('does not mutate the input array', () => {
      const wordA = makeWord({ id: 'a', createdAt: 300 });
      const wordB = makeWord({ id: 'b', createdAt: 100 });
      const wordC = makeWord({ id: 'c', createdAt: 200 });
      const input = [wordA, wordB, wordC];

      wordsToCsv(input);

      // Input should be unchanged
      expect(input[0].id).toBe('a');
      expect(input[1].id).toBe('b');
      expect(input[2].id).toBe('c');
    });
  });

  describe('round-trip verification', () => {
    it('preserves numeric values exactly', () => {
      const word = makeWord({
        id: 'test',
        createdAt: 1731628800000,
        dueAt: 1731715200000,
        interval: 14,
        ease: 2.5,
        reviews: 7,
      });

      const result = wordsToCsv([word]);
      const lines = result.split('\r\n');
      const fields = lines[1].split(',');

      // Parse back and verify
      expect(Number(fields[6])).toBe(1731628800000);
      expect(Number(fields[7])).toBe(1731715200000);
      expect(Number(fields[8])).toBe(14);
      expect(Number(fields[9])).toBe(2.5);
      expect(Number(fields[10])).toBe(7);
    });
  });
});

describe('escapeCsvField', () => {
  it('returns string values as-is when no escaping needed', () => {
    expect(escapeCsvField('plain')).toBe('plain');
    expect(escapeCsvField('')).toBe('');
    expect(escapeCsvField('hello world')).toBe('hello world');
  });

  it('converts numbers to strings', () => {
    expect(escapeCsvField(42)).toBe('42');
    expect(escapeCsvField(2.5)).toBe('2.5');
    expect(escapeCsvField(0)).toBe('0');
  });

  it('quotes and escapes commas', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('a,b,c')).toBe('"a,b,c"');
  });

  it('quotes and doubles inner quotes', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField('"quoted"')).toBe('"""quoted"""');
  });

  it('quotes newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('quotes leading spaces', () => {
    expect(escapeCsvField(' leading')).toBe('" leading"');
  });

  it('quotes trailing spaces', () => {
    expect(escapeCsvField('trailing ')).toBe('"trailing "');
  });

  it('quotes both leading and trailing spaces', () => {
    expect(escapeCsvField(' both ')).toBe('" both "');
  });
});
