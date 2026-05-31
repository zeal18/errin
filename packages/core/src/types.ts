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

export interface LanguagePair {
  sourceLang: string;
  targetLang: string;
}

export type LookupDirection = 'native_to_studied' | 'studied_to_native';

export interface ActivePair {
  nativeLang: string;
  studiedLang: string;
  lookupDirection: LookupDirection;
}

export interface TranslationVariant {
  transList: string[];
  sense: string;
  importance: number;
}

export interface LookupResult {
  writtenRep: string;
  variants: TranslationVariant[];
  score: number;
}

export interface Settings {
  dailyReviewLimit: number;
  lastActivePair: LanguagePair | null;
}
