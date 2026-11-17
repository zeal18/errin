import {
  findMissingDictionaryPairs,
  planWordsImport,
  generateImportId,
  formatMissingDictionariesMessage,
  formatImportSummary,
} from './wordsImport';
import type { Word, InstalledDictionary } from '@errin/core';

// Helper to create a word
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

// Helper to create an installed dictionary
function makeInstalledDict(overrides: Partial<InstalledDictionary> = {}): InstalledDictionary {
  return {
    sourceLang: 'en',
    targetLang: 'de',
    filePath: '/path/to/en-de.sqlite3',
    downloadedAt: 1700000000000,
    version: '2_2025-11',
    ...overrides,
  };
}

describe('findMissingDictionaryPairs', () => {
  it('returns empty array when all pairs are installed in both directions', () => {
    const words = [
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'de', targetLang: 'en' }),
      makeWord({ sourceLang: 'ru', targetLang: 'de' }),
    ];

    const installed = [
      makeInstalledDict({ sourceLang: 'en', targetLang: 'de' }),
      makeInstalledDict({ sourceLang: 'de', targetLang: 'en' }),
      makeInstalledDict({ sourceLang: 'ru', targetLang: 'de' }),
      makeInstalledDict({ sourceLang: 'de', targetLang: 'ru' }),
    ];

    const result = findMissingDictionaryPairs(words, installed);
    expect(result).toEqual([]);
  });

  it('detects missing pairs when only one direction is installed', () => {
    const words = [
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'de', targetLang: 'en' }),
    ];

    // Only en-de is installed, not de-en
    const installed = [
      makeInstalledDict({ sourceLang: 'en', targetLang: 'de' }),
    ];

    const result = findMissingDictionaryPairs(words, installed);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('English ↔ German');
    expect(result[0].wordCount).toBe(4);
  });

  it('detects completely missing pairs', () => {
    const words = [
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'ru', targetLang: 'de' }),
      makeWord({ sourceLang: 'ru', targetLang: 'de' }),
    ];

    const installed = [
      makeInstalledDict({ sourceLang: 'en', targetLang: 'de' }),
      makeInstalledDict({ sourceLang: 'de', targetLang: 'en' }),
    ];

    const result = findMissingDictionaryPairs(words, installed);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Russian ↔ German');
    expect(result[0].wordCount).toBe(2);
  });

  it('groups words by unordered pair', () => {
    const words = [
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'de', targetLang: 'en' }),
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
    ];

    const installed: InstalledDictionary[] = [];

    const result = findMissingDictionaryPairs(words, installed);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('English ↔ German');
    expect(result[0].wordCount).toBe(3);
  });

  it('ignores version differences', () => {
    const words = [
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
    ];

    const installed = [
      makeInstalledDict({ sourceLang: 'en', targetLang: 'de', version: '1_2024-01' }),
      makeInstalledDict({ sourceLang: 'de', targetLang: 'en', version: '2_2025-11' }),
    ];

    const result = findMissingDictionaryPairs(words, installed);
    expect(result).toEqual([]);
  });

  it('reports pairs in order of first appearance', () => {
    const words = [
      makeWord({ sourceLang: 'ru', targetLang: 'de' }),
      makeWord({ sourceLang: 'en', targetLang: 'de' }),
      makeWord({ sourceLang: 'ru', targetLang: 'de' }),
    ];

    const installed: InstalledDictionary[] = [];

    const result = findMissingDictionaryPairs(words, installed);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Russian ↔ German');
    expect(result[1].label).toBe('English ↔ German');
  });
});

describe('planWordsImport', () => {
  it('skips words that already exist with same source and sourceLang', () => {
    const fileWords = [
      makeWord({ id: 'w1', source: 'Haus', sourceLang: 'de' }),
      makeWord({ id: 'w2', source: 'Haus', sourceLang: 'de' }), // duplicate
      makeWord({ id: 'w3', source: 'Haus', sourceLang: 'en' }), // different lang, should import
    ];

    const existing = [
      { id: 'existing', source: 'Haus', sourceLang: 'de' },
    ];

    const plan = planWordsImport(fileWords, existing);

    expect(plan.toInsert).toHaveLength(1);
    expect(plan.skipped).toBe(2); // w1 exists, w2 is duplicate of w1
    expect(plan.toInsert[0].source).toBe('Haus');
    expect(plan.toInsert[0].sourceLang).toBe('en');
  });

  it('skips in-file duplicates', () => {
    const fileWords = [
      makeWord({ id: 'w1', source: 'Tag', sourceLang: 'de', target: 'day' }),
      makeWord({ id: 'w2', source: 'Tag', sourceLang: 'de', target: 'day' }), // duplicate
    ];

    const existing: Array<{ id: string; source: string; sourceLang: string }> = [];

    const plan = planWordsImport(fileWords, existing);

    expect(plan.toInsert).toHaveLength(1);
    expect(plan.skipped).toBe(1);
    expect(plan.toInsert[0].id).toBe('w1');
    expect(plan.toInsert[0].target).toBe('day');
  });

  it('generates new IDs for empty IDs', () => {
    const fileWords = [
      makeWord({ id: '', source: 'test' }),
    ];

    const existing: Array<{ id: string; source: string; sourceLang: string }> = [];

    const plan = planWordsImport(fileWords, existing);

    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toInsert[0].id).not.toBe('');
    expect(plan.toInsert[0].id).toContain('en-de-test');
  });

  it('generates new IDs for ID collisions', () => {
    const fileWords = [
      makeWord({ id: 'existing-id', source: 'test' }),
    ];

    const existing = [
      { id: 'existing-id', source: 'other', sourceLang: 'en' },
    ];

    const plan = planWordsImport(fileWords, existing);

    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toInsert[0].id).not.toBe('existing-id');
    expect(plan.toInsert[0].id).toContain('en-de-test');
  });

  it('handles multiple ID collision attempts', () => {
    const fileWords = [
      makeWord({ id: 'test-1', source: 'word1' }),
      makeWord({ id: 'test-1', source: 'word2' }), // Will collide with first if first gets test-1
    ];

    const existing = [
      { id: 'test-1', source: 'existing', sourceLang: 'en' },
    ];

    const plan = planWordsImport(fileWords, existing);

    expect(plan.toInsert).toHaveLength(2);
    // Both should have unique IDs
    expect(plan.toInsert[0].id).not.toBe(plan.toInsert[1].id);
    expect(plan.toInsert[0].id).not.toBe('test-1');
    expect(plan.toInsert[1].id).not.toBe('test-1');
  });

  it('preserves all SM-2 fields and createdAt', () => {
    const fileWords = [
      makeWord({
        id: 'w1',
        source: 'test',
        createdAt: 1234567890000,
        dueAt: 9876543210000,
        interval: 14,
        ease: 2.36,
        reviews: 5,
      }),
    ];

    const existing: Array<{ id: string; source: string; sourceLang: string }> = [];

    const plan = planWordsImport(fileWords, existing);

    expect(plan.toInsert).toHaveLength(1);
    const inserted = plan.toInsert[0];
    expect(inserted.createdAt).toBe(1234567890000);
    expect(inserted.dueAt).toBe(9876543210000);
    expect(inserted.interval).toBe(14);
    expect(inserted.ease).toBe(2.36);
    expect(inserted.reviews).toBe(5);
  });

  it('uses custom makeId function', () => {
    const fileWords = [
      makeWord({ id: '', source: 'test' }),
    ];

    const existing: Array<{ id: string; source: string; sourceLang: string }> = [];

    const customMakeId = jest.fn().mockReturnValue('custom-id');

    const plan = planWordsImport(fileWords, existing, customMakeId);

    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toInsert[0].id).toBe('custom-id');
    expect(customMakeId).toHaveBeenCalled();
  });
});

describe('generateImportId', () => {
  it('generates ID with correct format', () => {
    const word = makeWord({ sourceLang: 'de', targetLang: 'en', source: 'Haus' });
    const id = generateImportId(word, 0);

    expect(id).toContain('de-en-Haus');
    expect(id).toContain('-');
  });

  it('appends attempt number when > 0', () => {
    const word = makeWord({ sourceLang: 'de', targetLang: 'en', source: 'Haus' });
    const id = generateImportId(word, 2);

    expect(id).toMatch(/de-en-Haus-\d+-2$/);
  });
});

describe('formatMissingDictionariesMessage', () => {
  it('formats single pair with singular word count', () => {
    const pairs = [{ sourceLang: 'en', targetLang: 'de', label: 'English ↔ German', wordCount: 1 }];
    const message = formatMissingDictionariesMessage(pairs);

    expect(message).toBe('• English ↔ German (1 word)\n\nAdd these language pairs in Settings → Languages first, then import the file again.');
  });

  it('formats multiple pairs with plural word count', () => {
    const pairs = [
      { sourceLang: 'en', targetLang: 'de', label: 'English ↔ German', wordCount: 3 },
      { sourceLang: 'ru', targetLang: 'de', label: 'Russian ↔ German', wordCount: 5 },
    ];
    const message = formatMissingDictionariesMessage(pairs);

    expect(message).toBe(
      '• English ↔ German (3 words)\n' +
      '• Russian ↔ German (5 words)\n\n' +
      'Add these language pairs in Settings → Languages first, then import the file again.'
    );
  });
});

describe('formatImportSummary', () => {
  it('formats summary with correct counts', () => {
    const result = { kind: 'done' as const, total: 10, imported: 7, skipped: 3 };
    const message = formatImportSummary(result);

    expect(message).toBe('Words in file: 10\nImported: 7\nSkipped (already in your list): 3');
  });
});
