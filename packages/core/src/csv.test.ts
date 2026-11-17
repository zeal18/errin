import { wordsToCsv, escapeCsvField, WORDS_CSV_COLUMNS, csvToWords } from './csv';
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

describe('csvToWords', () => {
  describe('round-trip', () => {
    it('parses output of wordsToCsv exactly', () => {
      const word = makeWord({
        id: 'w1',
        source: 'hello',
        target: 'hallo',
        sense: 'greeting',
        sourceLang: 'en',
        targetLang: 'de',
        createdAt: 1731628800000,
        dueAt: 1731715200000,
        interval: 3,
        ease: 2.5,
        reviews: 2,
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles Cyrillic text', () => {
      const word = makeWord({
        id: 'w1',
        source: 'дом',
        target: 'house',
        sourceLang: 'ru',
        targetLang: 'en',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles German umlauts', () => {
      const word = makeWord({
        id: 'w1',
        source: 'Größe',
        target: 'size',
        sourceLang: 'de',
        targetLang: 'en',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles quotes in fields', () => {
      const word = makeWord({
        id: 'w1',
        sense: 'say "hi"',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles commas in fields', () => {
      const word = makeWord({
        id: 'w1',
        source: 'a, b',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles newlines in fields', () => {
      const word = makeWord({
        id: 'w1',
        sense: 'line1\nline2',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles CRLF in fields', () => {
      const word = makeWord({
        id: 'w1',
        sense: 'line1\r\nline2',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles leading and trailing spaces', () => {
      const word = makeWord({
        id: 'w1',
        source: ' leading ',
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles fractional ease values', () => {
      const word = makeWord({
        id: 'w1',
        ease: 2.36,
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('handles interval 0', () => {
      const word = makeWord({
        id: 'w1',
        interval: 0,
      });

      const csv = wordsToCsv([word]);
      const parsed = csvToWords(csv);

      expect(parsed).toEqual([word]);
    });

    it('preserves order in round-trip', () => {
      const wordA = makeWord({ id: 'a', createdAt: 200 });
      const wordB = makeWord({ id: 'b', createdAt: 100 });
      const wordC = makeWord({ id: 'c', createdAt: 300 });

      const csv = wordsToCsv([wordA, wordB, wordC]);
      const parsed = csvToWords(csv);

      // wordsToCsv sorts, so we expect sorted order
      expect(parsed).toEqual([wordB, wordA, wordC]);
    });
  });

  describe('BOM and line ending handling', () => {
    it('handles files with BOM and CRLF', () => {
      const word = makeWord({ id: 'w1' });
      const csv = wordsToCsv([word]);

      // csv already has BOM and CRLF
      const parsed = csvToWords(csv);
      expect(parsed).toEqual([word]);
    });

    it('handles files without BOM', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,hello,hallo,greeting,en,de,1731628800000,1731715200000,3,2.5,2\r\n';

      const parsed = csvToWords(csv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('w1');
    });

    it('handles LF-only line endings', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\n' +
        'w1,hello,hallo,greeting,en,de,1731628800000,1731715200000,3,2.5,2\n';

      const parsed = csvToWords(csv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('w1');
    });

    it('handles mixed CRLF and LF', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,hello,hallo,greeting,en,de,1731628800000,1731715200000,3,2.5,2\n' +
        'w2,house,haus,building,en,de,1731628800001,1731715200001,4,2.5,3\r\n';

      const parsed = csvToWords(csv);
      expect(parsed).toHaveLength(2);
    });

    it('returns empty array for header-only file', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n';

      const parsed = csvToWords(csv);
      expect(parsed).toEqual([]);
    });
  });

  describe('errors', () => {
    it('throws on wrong header', () => {
      const csv = 'wrong,header\r\n';
      expect(() => csvToWords(csv)).toThrow(/Row 1/);
      expect(() => csvToWords(csv)).toThrow(/unexpected header/);
    });

    it('throws on wrong column count', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,a,b,c,d,e,f,g,h,i\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2: expected 11 columns, found 10/);
    });

    it('throws on non-numeric ease', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,a,b,c,d,e,1,1,1,abc,0\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2/);
      expect(() => csvToWords(csv)).toThrow(/ease is not a number/);
    });

    it('throws on empty reviews', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,a,b,c,d,e,1,1,1,2.5,\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2/);
      expect(() => csvToWords(csv)).toThrow(/reviews is not a number/);
    });

    it('throws on empty source', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,,b,c,d,e,1,1,1,2.5,0\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2: source is empty/);
    });

    it('throws on empty sourceLang', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,a,b,c,,e,1,1,1,2.5,0\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2: sourceLang is empty/);
    });

    it('throws on empty targetLang', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,a,b,c,d,,1,1,1,2.5,0\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2: targetLang is empty/);
    });

    it('throws on unterminated quoted field', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,"unclosed,a,b,c,d,e,1,1,1,2.5,0\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2: unterminated quoted field/);
    });

    it('throws on unexpected character after closing quote', () => {
      const csv = 'id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews\r\n' +
        'w1,"closed"x,a,b,c,d,e,1,1,1,2.5,0\r\n';

      expect(() => csvToWords(csv)).toThrow(/Row 2: unexpected character after closing quote/);
    });

    it('throws on missing header row', () => {
      expect(() => csvToWords('')).toThrow(/Missing header row/);
    });
  });
});
