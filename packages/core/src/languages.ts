export interface SupportedLanguage {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fi', name: 'Finnish' },
] as const;

export function getLanguageName(code: string): string | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name;
}
