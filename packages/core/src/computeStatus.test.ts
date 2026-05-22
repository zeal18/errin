import { computeStatus } from './srs';
import type { Word } from './types';

describe('computeStatus', () => {
  it('returns not_started when reviews === 0', () => {
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
      ease: 2.5,
      reviews: 0,
    };
    expect(computeStatus(word)).toBe('not_started');
  });

  it('returns not_started when reviews === 0 and interval > 0', () => {
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
      ease: 2.5,
      reviews: 0,
    };
    expect(computeStatus(word)).toBe('not_started');
  });

  it('returns not_started when reviews === 0 and interval === 0', () => {
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
      ease: 2.5,
      reviews: 0,
    };
    expect(computeStatus(word)).toBe('not_started');
  });

  it('returns in_progress when reviews > 0 and interval === 0', () => {
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
      ease: 2.5,
      reviews: 5,
    };
    expect(computeStatus(word)).toBe('in_progress');
  });

  it('returns in_progress when reviews > 0 and interval < 21', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 1,
      ease: 2.5,
      reviews: 3,
    };
    expect(computeStatus(word)).toBe('in_progress');
  });

  it('returns in_progress when reviews > 0 and interval === 1', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 1,
      ease: 2.5,
      reviews: 1,
    };
    expect(computeStatus(word)).toBe('in_progress');
  });

  it('returns in_progress when reviews > 0 and interval === 20', () => {
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
      ease: 2.5,
      reviews: 10,
    };
    expect(computeStatus(word)).toBe('in_progress');
  });

  it('returns learned when interval === 21', () => {
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
      ease: 2.5,
      reviews: 10,
    };
    expect(computeStatus(word)).toBe('learned');
  });

  it('returns learned when interval > 21', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 30,
      ease: 2.5,
      reviews: 15,
    };
    expect(computeStatus(word)).toBe('learned');
  });

  it('returns learned when interval === 100', () => {
    const word: Word = {
      id: 'w1',
      source: 'test',
      target: 'prueba',
      sense: 'test sense',
      sourceLang: 'en',
      targetLang: 'es',
      createdAt: 1000000,
      dueAt: 1000000,
      interval: 100,
      ease: 2.5,
      reviews: 20,
    };
    expect(computeStatus(word)).toBe('learned');
  });

  it('returns not_started when reviews === 0 even if interval >= 21', () => {
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
      ease: 2.5,
      reviews: 0,
    };
    expect(computeStatus(word)).toBe('not_started');
  });
});
