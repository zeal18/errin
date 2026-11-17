import { parseTransList, parseSenseList, parseLexentryPartOfSpeech, lookupRich, type DictionaryDatabase } from './dictionary';
import type { LookupResult } from './types';

// Helper to create a fake dictionary database for testing
function fakeDb(
  rows: any[],
  options: { lexentryColumn?: boolean; throwNoSuchColumn?: boolean } = {}
): DictionaryDatabase {
  const { lexentryColumn = true, throwNoSuchColumn = false } = options;
  return {
    getAllAsync: jest.fn().mockImplementation((sql: string, params?: any[]) => {
      // Check if it's a sqlite_master query
      if (sql.includes('sqlite_master')) {
        return Promise.resolve([{ name: 'translation_grouped' }]);
      }
      // If lexentryColumn is false and the query includes lexentry, throw error
      if (!lexentryColumn && sql.includes('lexentry') && throwNoSuchColumn) {
        return Promise.reject(new Error('no such column: lexentry'));
      }
      return Promise.resolve(rows);
    }),
  };
}

describe('parseTransList', () => {
  test('empty string returns empty array', () => {
    expect(parseTransList('')).toEqual([]);
  });

  test('null returns empty array', () => {
    expect(parseTransList(null)).toEqual([]);
  });

  test('undefined returns empty array', () => {
    expect(parseTransList(undefined)).toEqual([]);
  });

  test('single value returns array with one element', () => {
    expect(parseTransList('hello')).toEqual(['hello']);
  });

  test('multiple pipe-separated values returns trimmed array', () => {
    expect(parseTransList('hello | world | foo')).toEqual(['hello', 'world', 'foo']);
  });

  test('extra whitespace around separators is handled', () => {
    expect(parseTransList('hello |  world  | foo')).toEqual(['hello', 'world', 'foo']);
  });

  test('empty strings in list are filtered out', () => {
    expect(parseTransList('hello |  | world')).toEqual(['hello', 'world']);
  });

  test('only whitespace entries are filtered out', () => {
    expect(parseTransList('hello |   | world')).toEqual(['hello', 'world']);
  });

  test('trailing separator is handled', () => {
    expect(parseTransList('hello | world | ')).toEqual(['hello', 'world']);
  });

  test('leading separator is handled', () => {
    expect(parseTransList(' | hello | world')).toEqual(['hello', 'world']);
  });

  test('real WikDict format', () => {
    expect(parseTransList('dog | hound | scoundrel')).toEqual(['dog', 'hound', 'scoundrel']);
  });
});

describe('parseSenseList', () => {
  test('empty string returns empty array', () => {
    expect(parseSenseList('')).toEqual([]);
  });

  test('null returns empty array', () => {
    expect(parseSenseList(null)).toEqual([]);
  });

  test('undefined returns empty array', () => {
    expect(parseSenseList(undefined)).toEqual([]);
  });

  test('single value returns array with one element', () => {
    expect(parseSenseList('hello')).toEqual(['hello']);
  });

  test('multiple pipe-separated values returns trimmed array', () => {
    expect(parseSenseList('hello | world | foo')).toEqual(['hello', 'world', 'foo']);
  });

  test('extra whitespace around pipe separator is handled', () => {
    expect(parseSenseList('hello | world | foo')).toEqual(['hello', 'world', 'foo']);
  });

  test('empty strings in list are filtered out', () => {
    expect(parseSenseList('hello |  | world')).toEqual(['hello', 'world']);
  });

  test('only whitespace entries are filtered out', () => {
    expect(parseSenseList('hello |   | world')).toEqual(['hello', 'world']);
  });

  test('trailing separator is handled', () => {
    expect(parseSenseList('hello | world | ')).toEqual(['hello', 'world']);
  });

  test('leading separator is handled', () => {
    expect(parseSenseList(' | hello | world')).toEqual(['hello', 'world']);
  });
});

describe('parseLexentryPartOfSpeech', () => {
  test('returns undefined for null', () => {
    expect(parseLexentryPartOfSpeech(null)).toBeUndefined();
  });

  test('returns undefined for undefined', () => {
    expect(parseLexentryPartOfSpeech(undefined)).toBeUndefined();
  });

  test('returns undefined for empty string', () => {
    expect(parseLexentryPartOfSpeech('')).toBeUndefined();
  });

  test('parses German Substantiv as noun', () => {
    expect(parseLexentryPartOfSpeech('deu/Arm__Substantiv__1')).toBe('noun');
  });

  test('parses German Adjektiv as adjective', () => {
    expect(parseLexentryPartOfSpeech('deu/arm__Adjektiv__1')).toBe('adjective');
  });

  test('parses German Verb as verb', () => {
    expect(parseLexentryPartOfSpeech('deu/reihen__Verb__1')).toBe('verb');
    expect(parseLexentryPartOfSpeech('deu/reihen__Verb__2')).toBe('verb');
  });

  test('parses English Conjunction as conjunction', () => {
    expect(parseLexentryPartOfSpeech('eng/&__Conjunction__1')).toBe('conjunction');
  });

  test('parses Spanish sustantivo_masculino as noun', () => {
    expect(parseLexentryPartOfSpeech('spa/x__sustantivo_masculino__1')).toBe('noun');
  });

  test('parses Spanish sustantivo_propio as proper noun', () => {
    expect(parseLexentryPartOfSpeech('spa/x__sustantivo_propio__1')).toBe('proper noun');
  });

  test('parses Russian прил as adjective', () => {
    expect(parseLexentryPartOfSpeech('rus/x__прил__1')).toBe('adjective');
  });

  test('parses German Lokaladverb as adverb', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Lokaladverb__1')).toBe('adverb');
  });

  test('parses Russian гл as verb', () => {
    expect(parseLexentryPartOfSpeech('rus/x__гл__1')).toBe('verb');
  });

  test('parses Finnish Substantiivi as noun', () => {
    expect(parseLexentryPartOfSpeech('fin/x__Substantiivi__1')).toBe('noun');
  });

  test('parses Spanish adverbio as adverb', () => {
    expect(parseLexentryPartOfSpeech('spa/x__adverbio__1')).toBe('adverb');
  });

  test('parses German Eigenname as proper noun', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Eigenname__1')).toBe('proper noun');
  });

  test('parses English Article as article', () => {
    expect(parseLexentryPartOfSpeech('eng/x__Article__1')).toBe('article');
  });

  test('parses German Präposition as preposition', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Präposition__1')).toBe('preposition');
  });

  test('parses German Konjunktion as conjunction', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Konjunktion__1')).toBe('conjunction');
  });

  test('parses German Interjektion as interjection', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Interjektion__1')).toBe('interjection');
  });

  test('parses German Numerale as numeral', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Numerale__1')).toBe('numeral');
  });

  test('parses German Pronomen as pronoun', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Pronomen__1')).toBe('pronoun');
  });

  test('parses German Partikel as particle', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Partikel__1')).toBe('particle');
  });

  test('parses German Redewendung as phrase', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Redewendung__1')).toBe('phrase');
  });

  test('parses German Präfix as prefix', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Präfix__1')).toBe('prefix');
  });

  test('parses German Suffix as suffix', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Suffix__1')).toBe('suffix');
  });

  test('returns undefined for unknown POS token', () => {
    expect(parseLexentryPartOfSpeech('deu/x__Foo__1')).toBeUndefined();
  });

  test('returns undefined for garbage string', () => {
    expect(parseLexentryPartOfSpeech('garbage')).toBeUndefined();
  });

  test('returns undefined for malformed lexentry without __', () => {
    expect(parseLexentryPartOfSpeech('deu/Arm')).toBeUndefined();
  });

  test('returns undefined for malformed lexentry without number', () => {
    expect(parseLexentryPartOfSpeech('deu/Arm__Substantiv__')).toBeUndefined();
  });

  test('handles lexentry with word containing __', () => {
    // If the word itself contains __, the POS is still the second-to-last part
    expect(parseLexentryPartOfSpeech('deu/foo__bar__Verb__1')).toBe('verb');
  });
});

describe('lookupRich', () => {
  test('groups Arm/arm into separate results by lexentry', async () => {
    const rows = [
      { written_rep: 'Arm', sense_list: 'limb', trans_list: 'arm', score: 100, importance: 10, lexentry: 'deu/Arm__Substantiv__1' },
      { written_rep: 'Arm', sense_list: 'branch', trans_list: 'branch', score: 90, importance: 9, lexentry: 'deu/Arm__Substantiv__1' },
      { written_rep: 'arm', sense_list: 'poor', trans_list: 'poor', score: 80, importance: 8, lexentry: 'deu/arm__Adjektiv__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'arm');

    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('Arm');
    expect(results[0].partOfSpeech).toBe('noun');
    expect(results[0].variants.length).toBe(2);
    expect(results[0].score).toBe(100);

    expect(results[1].writtenRep).toBe('arm');
    expect(results[1].partOfSpeech).toBe('adjective');
    expect(results[1].variants.length).toBe(1);
    expect(results[1].score).toBe(80);
  });

  test('groups Reihen/reihen into separate results', async () => {
    const rows = [
      { written_rep: 'Reihen', sense_list: 'rows', trans_list: 'rows', score: 100, importance: 10, lexentry: 'deu/Reihen__Substantiv__1' },
      { written_rep: 'reihen', sense_list: 'to string together', trans_list: 'to string', score: 90, importance: 9, lexentry: 'deu/reihen__Verb__1' },
      { written_rep: 'reihen', sense_list: 'to arrange', trans_list: 'to arrange', score: 85, importance: 8, lexentry: 'deu/reihen__Verb__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'reihen');

    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('Reihen');
    expect(results[0].partOfSpeech).toBe('noun');
    expect(results[0].variants.length).toBe(1);

    expect(results[1].writtenRep).toBe('reihen');
    expect(results[1].partOfSpeech).toBe('verb');
    expect(results[1].variants.length).toBe(2);
    // Verify the verb senses are preserved
    expect(results[1].variants[0].sense).toBe('to string together');
    expect(results[1].variants[1].sense).toBe('to arrange');
  });

  test('preserves row order for card ordering', async () => {
    const rows = [
      { written_rep: 'Arm', sense_list: 'limb', trans_list: 'arm', score: 100, importance: 10, lexentry: 'deu/Arm__Substantiv__1' },
      { written_rep: 'arm', sense_list: 'poor', trans_list: 'poor', score: 80, importance: 8, lexentry: 'deu/arm__Adjektiv__1' },
      { written_rep: 'Arm', sense_list: 'branch', trans_list: 'branch', score: 90, importance: 9, lexentry: 'deu/Arm__Substantiv__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'arm');

    // First card should be Arm (noun) because its first row appears first
    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('Arm');
    expect(results[1].writtenRep).toBe('arm');
  });

  test('merges null-lexentry rows into same-spelling entry', async () => {
    const rows = [
      { written_rep: 'Reihen', sense_list: 'rows', trans_list: 'rows', score: 100, importance: 10, lexentry: 'deu/Reihen__Substantiv__1' },
      { written_rep: 'Reihen', sense_list: 'series', trans_list: 'series', score: 95, importance: 9, lexentry: null },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'reihen');

    expect(results.length).toBe(1);
    expect(results[0].writtenRep).toBe('Reihen');
    expect(results[0].partOfSpeech).toBe('noun');
    expect(results[0].variants.length).toBe(2);
  });

  test('null-lexentry rows with no matching spelling become their own card', async () => {
    const rows = [
      { written_rep: 'Reihen', sense_list: 'rows', trans_list: 'rows', score: 100, importance: 10, lexentry: null },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'reihen');

    expect(results.length).toBe(1);
    expect(results[0].writtenRep).toBe('Reihen');
    expect(results[0].partOfSpeech).toBeUndefined();
  });

  test('fallback to exact spelling when lexentry column is missing', async () => {
    const rows = [
      { written_rep: 'Arm', sense_list: 'limb', trans_list: 'arm', score: 100, importance: 10 },
      { written_rep: 'Arm', sense_list: 'branch', trans_list: 'branch', score: 90, importance: 9 },
      { written_rep: 'arm', sense_list: 'poor', trans_list: 'poor', score: 80, importance: 8 },
    ];
    const db = fakeDb(rows, { lexentryColumn: false, throwNoSuchColumn: true });
    const results = await lookupRich(db, 'arm');

    // Should have 2 cards by exact spelling
    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('Arm');
    expect(results[0].partOfSpeech).toBeUndefined();
    expect(results[0].variants.length).toBe(2);
    expect(results[1].writtenRep).toBe('arm');
    expect(results[1].partOfSpeech).toBeUndefined();
    expect(results[1].variants.length).toBe(1);
  });

  test('same-entry rows still merged by lexentry', async () => {
    const rows = [
      { written_rep: 'Arm', sense_list: 'limb', trans_list: 'arm', score: 100, importance: 10, lexentry: 'deu/Arm__Substantiv__1' },
      { written_rep: 'Arm', sense_list: 'branch', trans_list: 'branch', score: 90, importance: 9, lexentry: 'deu/Arm__Substantiv__1' },
      { written_rep: 'Arm', sense_list: 'limb', trans_list: 'arm', score: 85, importance: 8, lexentry: 'deu/Arm__Substantiv__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'arm');

    expect(results.length).toBe(1);
    expect(results[0].variants.length).toBe(3);
    expect(results[0].score).toBe(100);
  });

  test('rethrows unexpected errors', async () => {
    const db = {
      getAllAsync: jest.fn().mockImplementation((sql: string) => {
        // Handle sqlite_master query
        if (sql.includes('sqlite_master')) {
          return Promise.resolve([{ name: 'translation_grouped' }]);
        }
        // For the actual lookup query, throw an unexpected error
        return Promise.reject(new Error('some other error'));
      }),
    };
    await expect(lookupRich(db, 'test')).rejects.toThrow('some other error');
  });

  test('merges same-spelling same-POS homographs (reihen Verb__1 + Verb__2) into one card', async () => {
    const rows = [
      { written_rep: 'Reihen', sense_list: 'rows', trans_list: 'rows', score: 100, importance: 10, lexentry: 'deu/Reihen__Substantiv__1' },
      { written_rep: 'reihen', sense_list: 'to string together', trans_list: 'to string', score: 90, importance: 9, lexentry: 'deu/reihen__Verb__1' },
      { written_rep: 'reihen', sense_list: 'to line up', trans_list: 'to line', score: 95, importance: 8, lexentry: 'deu/reihen__Verb__2' },
      { written_rep: 'reihen', sense_list: 'to arrange', trans_list: 'to arrange', score: 85, importance: 7, lexentry: 'deu/reihen__Verb__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'reihen');

    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('Reihen');
    expect(results[0].partOfSpeech).toBe('noun');
    expect(results[0].variants.length).toBe(1);

    expect(results[1].writtenRep).toBe('reihen');
    expect(results[1].partOfSpeech).toBe('verb');
    expect(results[1].variants.length).toBe(3);
    expect(results[1].variants[0].sense).toBe('to string together');
    expect(results[1].variants[1].sense).toBe('to line up');
    expect(results[1].variants[2].sense).toBe('to arrange');
    expect(results[1].score).toBe(95);
  });

  test('keeps same-spelling different-POS entries separate', async () => {
    const rows = [
      { written_rep: 'essen', sense_list: 'to eat', trans_list: 'to eat', score: 100, importance: 10, lexentry: 'deu/essen__Verb__1' },
      { written_rep: 'essen', sense_list: 'meal', trans_list: 'meal', score: 90, importance: 9, lexentry: 'deu/essen__Substantiv__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'essen');

    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('essen');
    expect(results[0].partOfSpeech).toBe('verb');
    expect(results[0].variants.length).toBe(1);

    expect(results[1].writtenRep).toBe('essen');
    expect(results[1].partOfSpeech).toBe('noun');
    expect(results[1].variants.length).toBe(1);
  });

  test('merges POS tokens that normalize to the same part of speech', async () => {
    const rows = [
      { written_rep: 'haben', sense_list: 'to have', trans_list: 'to have', score: 100, importance: 10, lexentry: 'deu/haben__Verb__1' },
      { written_rep: 'haben', sense_list: 'auxiliary', trans_list: 'aux', score: 95, importance: 9, lexentry: 'deu/haben__Hilfsverb__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'haben');

    expect(results.length).toBe(1);
    expect(results[0].writtenRep).toBe('haben');
    expect(results[0].partOfSpeech).toBe('verb');
    expect(results[0].variants.length).toBe(2);
    expect(results[0].score).toBe(100);
  });

  test('unknown POS token: homographs merge, but stay separate from other entries', async () => {
    const rows = [
      { written_rep: 'foo', sense_list: 'xyz1', trans_list: 'xyz1', score: 100, importance: 10, lexentry: 'deu/foo__Xyz__1' },
      { written_rep: 'foo', sense_list: 'xyz2', trans_list: 'xyz2', score: 95, importance: 9, lexentry: 'deu/foo__Xyz__2' },
      { written_rep: 'foo', sense_list: 'verb', trans_list: 'verb', score: 90, importance: 8, lexentry: 'deu/foo__Verb__1' },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'foo');

    expect(results.length).toBe(2);
    expect(results[0].writtenRep).toBe('foo');
    expect(results[0].partOfSpeech).toBeUndefined();
    expect(results[0].variants.length).toBe(2);

    expect(results[1].writtenRep).toBe('foo');
    expect(results[1].partOfSpeech).toBe('verb');
    expect(results[1].variants.length).toBe(1);
  });

  test('null-lexentry row joins the merged homograph card', async () => {
    const rows = [
      { written_rep: 'reihen', sense_list: 'to string together', trans_list: 'to string', score: 90, importance: 9, lexentry: 'deu/reihen__Verb__1' },
      { written_rep: 'reihen', sense_list: 'to line up', trans_list: 'to line', score: 95, importance: 8, lexentry: 'deu/reihen__Verb__2' },
      { written_rep: 'reihen', sense_list: 'to align', trans_list: 'to align', score: 85, importance: 7, lexentry: null },
    ];
    const db = fakeDb(rows, { lexentryColumn: true });
    const results = await lookupRich(db, 'reihen');

    expect(results.length).toBe(1);
    expect(results[0].writtenRep).toBe('reihen');
    expect(results[0].partOfSpeech).toBe('verb');
    expect(results[0].variants.length).toBe(3);
    expect(results[0].variants[0].sense).toBe('to string together');
    expect(results[0].variants[1].sense).toBe('to line up');
    expect(results[0].variants[2].sense).toBe('to align');
  });
});
