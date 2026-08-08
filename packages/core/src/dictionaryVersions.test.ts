import {
  getPairDownloadSize,
  DICTIONARY_FILE_SIZES,
  CURRENT_DICTIONARY_VERSION,
  SUPPORTED_DICTIONARY_VERSIONS,
} from './dictionaryVersions';

describe('SUPPORTED_DICTIONARY_VERSIONS', () => {
  test('is a non-empty readonly array', () => {
    expect(Array.isArray(SUPPORTED_DICTIONARY_VERSIONS)).toBe(true);
    expect(SUPPORTED_DICTIONARY_VERSIONS.length).toBeGreaterThan(0);
  });

  test('every entry has an id string property', () => {
    expect(SUPPORTED_DICTIONARY_VERSIONS.every((v) => typeof v.id === 'string')).toBe(true);
  });

  test('all entries are DictionaryVersion objects with only id field', () => {
    SUPPORTED_DICTIONARY_VERSIONS.forEach((v) => {
      expect(Object.keys(v)).toEqual(['id']);
    });
  });
});

describe('CURRENT_DICTIONARY_VERSION', () => {
  test('is the last entry in SUPPORTED_DICTIONARY_VERSIONS', () => {
    expect(CURRENT_DICTIONARY_VERSION).toBe(SUPPORTED_DICTIONARY_VERSIONS[SUPPORTED_DICTIONARY_VERSIONS.length - 1]);
  });

  test('has an id property matching the last version', () => {
    expect(CURRENT_DICTIONARY_VERSION.id).toBe(SUPPORTED_DICTIONARY_VERSIONS[SUPPORTED_DICTIONARY_VERSIONS.length - 1].id);
  });

  test('is a DictionaryVersion object', () => {
    expect(CURRENT_DICTIONARY_VERSION).toHaveProperty('id');
    expect(Object.keys(CURRENT_DICTIONARY_VERSION)).toEqual(['id']);
  });
});

describe('DICTIONARY_FILE_SIZES', () => {
  test('has entries for all 20 supported language pairs from SPEC.md', () => {
    const expectedPairs = [
      'en-de', 'de-en',
      'en-ru', 'ru-en',
      'en-es', 'es-en',
      'de-ru', 'ru-de',
      'de-es', 'es-de',
      'ru-es', 'es-ru',
      'en-fi', 'fi-en',
      'de-fi', 'fi-de',
      'ru-fi', 'fi-ru',
      'es-fi', 'fi-es',
    ];
    expect(Object.keys(DICTIONARY_FILE_SIZES).sort()).toEqual(expectedPairs.sort());
  });

  test('all values are positive numbers', () => {
    expect(Object.values(DICTIONARY_FILE_SIZES).every((v) => typeof v === 'number' && v > 0)).toBe(true);
  });

  test('keys match expected format (lang-lang)', () => {
    expect(Object.keys(DICTIONARY_FILE_SIZES).every((k) => /^[a-z]{2}-[a-z]{2}$/.test(k))).toBe(true);
  });

  test('is a Record<string, number>', () => {
    expect(typeof DICTIONARY_FILE_SIZES).toBe('object');
    expect(DICTIONARY_FILE_SIZES).not.toBeNull();
  });
});

describe('getPairDownloadSize', () => {
  test('returns sum of forward and reverse dictionary sizes for en-de pair', () => {
    const result = getPairDownloadSize('en', 'de');
    expect(result).toBe(DICTIONARY_FILE_SIZES['en-de'] + DICTIONARY_FILE_SIZES['de-en']);
    expect(result).toBe(27367834 + 31981568);
    expect(result).toBe(59349402);
  });

  test('returns sum of forward and reverse dictionary sizes for de-ru pair', () => {
    const result = getPairDownloadSize('de', 'ru');
    expect(result).toBe(DICTIONARY_FILE_SIZES['de-ru'] + DICTIONARY_FILE_SIZES['ru-de']);
    expect(result).toBe(17825792 + 11324621);
    expect(result).toBe(29150413);
  });

  test('returns sum of forward and reverse dictionary sizes for ru-es pair', () => {
    const result = getPairDownloadSize('ru', 'es');
    expect(result).toBe(DICTIONARY_FILE_SIZES['ru-es'] + DICTIONARY_FILE_SIZES['es-ru']);
    expect(result).toBe(8912896 + 7759462);
    expect(result).toBe(16672358);
  });

  test('returns sum of forward and reverse dictionary sizes for en-fi pair', () => {
    const result = getPairDownloadSize('en', 'fi');
    expect(result).toBe(DICTIONARY_FILE_SIZES['en-fi'] + DICTIONARY_FILE_SIZES['fi-en']);
    expect(result).toBe(25690112 + 16567501);
    expect(result).toBe(42257613);
  });

  test('returns 0 when forward direction is missing', () => {
    const result = getPairDownloadSize('xx', 'en');
    expect(result).toBe(0);
  });

  test('returns 0 when reverse direction is missing', () => {
    const result = getPairDownloadSize('en', 'xx');
    expect(result).toBe(0);
  });

  test('returns 0 for completely unknown pair', () => {
    const result = getPairDownloadSize('xx', 'yy');
    expect(result).toBe(0);
  });

  test('same language pair (en-en) returns 0', () => {
    const result = getPairDownloadSize('en', 'en');
    expect(result).toBe(0);
  });

  test('reversed language order produces same result (commutative)', () => {
    const result1 = getPairDownloadSize('en', 'de');
    const result2 = getPairDownloadSize('de', 'en');
    expect(result1).toBe(result2);
  });

  test('all supported pairs return positive sum', () => {
    const pairs = [
      ['en', 'de'],
      ['en', 'ru'],
      ['en', 'es'],
      ['de', 'ru'],
      ['de', 'es'],
      ['ru', 'es'],
      ['en', 'fi'],
      ['de', 'fi'],
      ['ru', 'fi'],
      ['es', 'fi'],
    ];
    pairs.forEach(([a, b]) => {
      const result = getPairDownloadSize(a, b);
      expect(result).toBeGreaterThan(0);
    });
  });
});
