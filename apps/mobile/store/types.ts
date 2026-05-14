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

export interface Settings {
  dailyReviewLimit: number;
  lastActivePair: LanguagePair | null;
}
