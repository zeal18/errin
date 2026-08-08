import genderDe from './data/gender-de.json';
import genderRu from './data/gender-ru.json';
import genderEs from './data/gender-es.json';

export type Gender = 'masculine' | 'feminine' | 'neuter';

const CODE_TO_GENDER: Record<string, Gender> = {
  m: 'masculine',
  f: 'feminine',
  n: 'neuter',
};

// Bundled at build time from WikDict monolingual `entry` tables (noun rows
// only), via packages/core/scripts/extract-gender-data.mjs. This is a static
// app asset, decoupled from a device's installed dictionary version — see
// that script's header for the regeneration story.
const GENDER_TABLES: Record<string, Record<string, string[]>> = {
  de: genderDe,
  ru: genderRu,
  es: genderEs,
};

/**
 * Grammatical gender(s) of a noun, keyed by exact written_rep match (same
 * surface form/casing as WikDict's bilingual `written_rep`). Returns
 * undefined when the language has no gender data (e.g. "en") or the word
 * isn't a known noun. Most words resolve to one gender; a small number of
 * genuine homographs (e.g. German "der See" vs "die See") resolve to more
 * than one — callers should treat the result as a set, not assume length 1.
 */
export function getGender(lang: string, word: string): Gender[] | undefined {
  const codes = GENDER_TABLES[lang]?.[word];
  if (!codes || codes.length === 0) return undefined;
  return codes.map((c) => CODE_TO_GENDER[c]);
}
