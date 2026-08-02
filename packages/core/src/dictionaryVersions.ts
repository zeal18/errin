export interface DictionaryVersion {
  id: string;
}

export const SUPPORTED_DICTIONARY_VERSIONS: readonly DictionaryVersion[] = [
  { id: '2_2025-11' },
] as const;

export const CURRENT_DICTIONARY_VERSION: DictionaryVersion =
  SUPPORTED_DICTIONARY_VERSIONS[SUPPORTED_DICTIONARY_VERSIONS.length - 1];

// Byte sizes of each direction file for CURRENT_DICTIONARY_VERSION, from SPEC.md's
// "Supported Language Pairs" table (MB x 1024 x 1024, rounded).
export const DICTIONARY_FILE_SIZES: Record<string, number> = {
  'en-de': 27367834,
  'de-en': 31981568,
  'en-ru': 27682406,
  'ru-en': 20447232,
  'en-es': 22649242,
  'es-en': 13736346,
  'de-ru': 17825792,
  'ru-de': 11324621,
  'de-es': 15833498,
  'es-de': 8598323,
  'ru-es': 8912896,
  'es-ru': 7759462,
};

export function getPairDownloadSize(nativeLang: string, studiedLang: string): number {
  const forward = DICTIONARY_FILE_SIZES[`${nativeLang}-${studiedLang}`] ?? 0;
  const reverse = DICTIONARY_FILE_SIZES[`${studiedLang}-${nativeLang}`] ?? 0;
  return forward + reverse;
}
