import { parseTransList, parseSenseList } from './dictionary';

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
