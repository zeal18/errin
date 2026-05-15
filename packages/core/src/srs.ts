import type { LearningStatus, Word } from './types';

const LEARNED_INTERVAL_DAYS = 21;

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewOptions {
  now?: number;
}

const MS_PER_DAY = 86_400_000;
const MIN_EASE = 1.3;
const INITIAL_EASE = 2.5;
const FIRST_INTERVAL_DAYS = 1;
const SECOND_INTERVAL_DAYS = 6;
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_INTERVAL_BONUS = 1.3;

const QUALITY: Record<ReviewRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export { INITIAL_EASE };

function clampEase(ease: number): number {
  if (ease < MIN_EASE) return MIN_EASE;
  return ease;
}

function updateEase(prevEase: number, quality: number): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const next = prevEase + delta;
  return clampEase(next);
}

function nextIntervalDays(
  prevInterval: number,
  prevReviews: number,
  ease: number,
  rating: ReviewRating
): number {
  if (prevReviews === 0) {
    return FIRST_INTERVAL_DAYS;
  }
  if (prevReviews === 1) {
    if (rating === 'good') return SECOND_INTERVAL_DAYS;
    if (rating === 'hard') {
      return Math.max(
        FIRST_INTERVAL_DAYS,
        Math.round(FIRST_INTERVAL_DAYS * HARD_INTERVAL_MULTIPLIER)
      );
    }
    if (rating === 'easy') {
      return Math.round(SECOND_INTERVAL_DAYS * EASY_INTERVAL_BONUS);
    }
  }
  if (prevReviews >= 2) {
    if (rating === 'hard') {
      return Math.max(prevInterval + 1, Math.round(prevInterval * HARD_INTERVAL_MULTIPLIER));
    }
    if (rating === 'good') {
      return Math.max(prevInterval + 1, Math.round(prevInterval * ease));
    }
    if (rating === 'easy') {
      return Math.max(prevInterval + 1, Math.round(prevInterval * ease * EASY_INTERVAL_BONUS));
    }
  }
  return prevInterval + 1;
}

export function computeStatus(word: Word): LearningStatus {
  if (word.reviews === 0) return 'not_started';
  if (word.interval >= LEARNED_INTERVAL_DAYS) return 'learned';
  return 'in_progress';
}

export function applyReview(word: Word, rating: ReviewRating, options?: ReviewOptions): Word {
  const nowMs = options?.now ?? Date.now();
  const quality = QUALITY[rating];
  const nextEase = updateEase(word.ease, quality);

  let nextInterval: number;
  let nextReviews: number;
  let nextDueAt: number;

  if (rating === 'again') {
    nextReviews = 0;
    nextInterval = 0;
    nextDueAt = nowMs;
  } else {
    nextInterval = nextIntervalDays(word.interval, word.reviews, nextEase, rating);
    nextReviews = word.reviews + 1;
    nextDueAt = nowMs + nextInterval * MS_PER_DAY;
  }

  return {
    ...word,
    ease: nextEase,
    interval: nextInterval,
    reviews: nextReviews,
    dueAt: nextDueAt,
  };
}
