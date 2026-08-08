import { getGender, type Gender } from './gender';
import genderDe from './data/gender-de.json';
import genderRu from './data/gender-ru.json';
import genderEs from './data/gender-es.json';

const VALID_GENDERS: Gender[] = ['masculine', 'feminine', 'neuter'];

describe('getGender', () => {
  test('resolves a known single-gender German noun', () => {
    expect(getGender('de', 'Tisch')).toEqual(['masculine']);
  });

  test('resolves a known German homograph to multiple genders', () => {
    const result = getGender('de', 'See');
    expect(result).toContain('masculine');
    expect(result).toContain('feminine');
  });

  test('returns undefined for an unknown word in a supported language', () => {
    expect(getGender('de', 'zzznotarealword')).toBeUndefined();
  });

  test('returns undefined for a language with no gender data (en)', () => {
    expect(getGender('en', 'table')).toBeUndefined();
  });

  test('returns undefined for an unknown language code and does not throw', () => {
    expect(() => getGender('xx', 'Tisch')).not.toThrow();
    expect(getGender('xx', 'Tisch')).toBeUndefined();
  });
});

describe('bundled gender data tables', () => {
  const tables: Record<string, Record<string, string[]>> = {
    de: genderDe,
    ru: genderRu,
    es: genderEs,
  };

  test.each(Object.entries(tables))('%s table is non-trivially sized', (_lang, table) => {
    expect(Object.keys(table).length).toBeGreaterThan(1000);
  });

  test.each(Object.entries(tables))('%s table values are non-empty arrays of valid gender codes', (_lang, table) => {
    const validCodes = new Set(['m', 'f', 'n']);
    for (const codes of Object.values(table)) {
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
      for (const code of codes) {
        expect(validCodes.has(code)).toBe(true);
      }
    }
  });

  test.each(Object.keys(tables))('every code in the %s table resolves via getGender to a valid Gender', (lang) => {
    const table = tables[lang];
    const sampleWords = Object.keys(table).slice(0, 200);
    for (const word of sampleWords) {
      const genders = getGender(lang, word);
      expect(genders).toBeDefined();
      genders?.forEach((g) => expect(VALID_GENDERS).toContain(g));
    }
  });
});
