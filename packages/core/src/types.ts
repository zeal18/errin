export interface Word {
  id: string;
  source: string;
  target: string;
  sense: string;
  sourceLang: string;
  targetLang: string;
  createdAt: number;
  dueAt: number;
  interval: number;
  ease: number;
  reviews: number;
}

export type LearningStatus = 'not_started' | 'in_progress' | 'learned';

export interface InstalledDictionary {
  sourceLang: string;
  targetLang: string;
  filePath: string;
  downloadedAt: number;
}

export interface LookupResult {
  writtenRep: string;
  transList: string[];
  senseList: string[];
  score: number;
}

export interface Settings {
  dailyReviewLimit: number;
  lastActivePair: { sourceLang: string; targetLang: string } | null;
}
