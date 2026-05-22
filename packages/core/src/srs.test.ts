import { computeStatus, applyReview, INITIAL_EASE } from './srs';
import type { Word } from './types';

describe('computeStatus', () => {
  it('returns not_started when word.reviews === 0', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 0,
      ease: INITIAL_EASE,
      reviews: 0,
    };
    expect(computeStatus(word)).toBe('not_started');
  });

  it('returns in_progress when word.reviews > 0 AND word.interval < 21', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 10,
      ease: INITIAL_EASE,
      reviews: 5,
    };
    expect(computeStatus(word)).toBe('in_progress');
  });

  it('returns learned when word.interval >= 21', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 21,
      ease: INITIAL_EASE,
      reviews: 10,
    };
    expect(computeStatus(word)).toBe('learned');
  });

  it('returns in_progress when word.interval === 20 (boundary)', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 20,
      ease: INITIAL_EASE,
      reviews: 10,
    };
    expect(computeStatus(word)).toBe('in_progress');
  });
});

describe('applyReview', () => {
  const baseWord: Word = {
    id: 'w1',
    source: 'test',
    target: 'prueba',
    sense: 'test sense',
    sourceLang: 'en',
    targetLang: 'es',
    createdAt: 1000000,
    dueAt: 1000000,
    interval: 0,
    ease: INITIAL_EASE,
    reviews: 0,
  };

  const nowMs = 1000000;

  describe('again rating', () => {
    it('on new word (reviews=0): expect reviews=0, interval=0, dueAt=nowMs, ease changed from 2.5', () => {
      const result = applyReview(baseWord, 'again', { now: nowMs });
      expect(result.reviews).toBe(0);
      expect(result.interval).toBe(0);
      expect(result.dueAt).toBe(nowMs);
      expect(result.ease).not.toBe(INITIAL_EASE);
    });

    it('on reviewed word (reviews=5, interval=10): expect reviews=0, interval=0, dueAt=nowMs', () => {
      const word: Word = { ...baseWord, reviews: 5, interval: 10 };
      const result = applyReview(word, 'again', { now: nowMs });
      expect(result.reviews).toBe(0);
      expect(result.interval).toBe(0);
      expect(result.dueAt).toBe(nowMs);
    });
  });

  describe('hard rating', () => {
    it('on first review (reviews=0): expect reviews=1, interval=1, ease updated', () => {
      const result = applyReview(baseWord, 'hard', { now: nowMs });
      expect(result.reviews).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.ease).not.toBe(INITIAL_EASE);
    });

    it('on second review (reviews=1, interval=1): expect reviews=2, interval=1, ease updated', () => {
      const word: Word = { ...baseWord, reviews: 1, interval: 1 };
      const result = applyReview(word, 'hard', { now: nowMs });
      expect(result.reviews).toBe(2);
      expect(result.interval).toBe(1);
      expect(result.ease).not.toBe(INITIAL_EASE);
    });

    it('on third review (reviews=2, interval=6, ease=2.5): expect reviews=3, interval=7, ease updated', () => {
      const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
      const result = applyReview(word, 'hard', { now: nowMs });
      expect(result.reviews).toBe(3);
      expect(result.interval).toBe(7);
      expect(result.ease).not.toBe(2.5);
    });
  });

  describe('good rating', () => {
    it('on first review (reviews=0): expect reviews=1, interval=1, ease unchanged (good=quality 4 gives delta 0)', () => {
      const result = applyReview(baseWord, 'good', { now: nowMs });
      expect(result.reviews).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.ease).toBe(INITIAL_EASE);
    });

    it('on second review (reviews=1, interval=1): expect reviews=2, interval=6, ease unchanged', () => {
      const word: Word = { ...baseWord, reviews: 1, interval: 1 };
      const result = applyReview(word, 'good', { now: nowMs });
      expect(result.reviews).toBe(2);
      expect(result.interval).toBe(6);
      expect(result.ease).toBe(INITIAL_EASE);
    });

    it('on third review (reviews=2, interval=6, ease=2.5): expect reviews=3, interval=15, ease unchanged', () => {
      const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
      const result = applyReview(word, 'good', { now: nowMs });
      expect(result.reviews).toBe(3);
      expect(result.interval).toBe(15);
      expect(result.ease).toBe(2.5);
    });
  });

  describe('easy rating', () => {
    it('on first review (reviews=0): expect reviews=1, interval=1, ease updated', () => {
      const result = applyReview(baseWord, 'easy', { now: nowMs });
      expect(result.reviews).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.ease).not.toBe(INITIAL_EASE);
    });

    it('on second review (reviews=1, interval=1): expect reviews=2, interval=8, ease updated', () => {
      const word: Word = { ...baseWord, reviews: 1, interval: 1 };
      const result = applyReview(word, 'easy', { now: nowMs });
      expect(result.reviews).toBe(2);
      expect(result.interval).toBe(8);
      expect(result.ease).not.toBe(INITIAL_EASE);
    });

    it('on third review (reviews=2, interval=6, ease=2.5): expect reviews=3, interval=20, ease updated', () => {
      const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
      const result = applyReview(word, 'easy', { now: nowMs });
      expect(result.reviews).toBe(3);
      expect(result.interval).toBe(20);
      expect(result.ease).not.toBe(2.5);
    });
  });

  it('ease factor starts at 2.5 (INITIAL_EASE)', () => {
    expect(INITIAL_EASE).toBe(2.5);
  });

  it('ease factor clamping: applyReview with ease that would go below 1.3 results in ease=1.3', () => {
    // Create a word with very low ease to test clamping
    const word: Word = { ...baseWord, ease: 1.31, reviews: 1, interval: 1 };
    const result = applyReview(word, 'again', { now: nowMs });
    expect(result.ease).toBe(1.3);
  });

  it('ease factor increases with easy ratings', () => {
    const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
    const result = applyReview(word, 'easy', { now: nowMs });
    expect(result.ease).toBeGreaterThan(2.5);
  });

  it('ease factor decreases with again rating', () => {
    const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
    const result = applyReview(word, 'again', { now: nowMs });
    expect(result.ease).toBeLessThan(2.5);
  });

  it('now option: applyReview(word, good, { now: 2000000 }) results in dueAt = 2000000 + interval * 86400000', () => {
    const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
    const now = 2000000;
    const result = applyReview(word, 'good', { now });
    const expectedDueAt = now + 15 * 86400000; // interval=15 after good on 3rd review
    expect(result.dueAt).toBe(expectedDueAt);
  });

  it('preserves non-SM-2 fields: id, source, target, sense, sourceLang, targetLang, createdAt unchanged', () => {
    const word: Word = { ...baseWord, reviews: 2, interval: 6, ease: 2.5 };
    const result = applyReview(word, 'good', { now: nowMs });
    expect(result.id).toBe(baseWord.id);
    expect(result.source).toBe(baseWord.source);
    expect(result.target).toBe(baseWord.target);
    expect(result.sense).toBe(baseWord.sense);
    expect(result.sourceLang).toBe(baseWord.sourceLang);
    expect(result.targetLang).toBe(baseWord.targetLang);
    expect(result.createdAt).toBe(baseWord.createdAt);
  });
});
