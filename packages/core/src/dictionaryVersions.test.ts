import { getPairDownloadSize, DICTIONARY_FILE_SIZES } from './dictionaryVersions';

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
});
