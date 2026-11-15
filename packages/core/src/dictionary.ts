import type { LookupResult, TranslationVariant, PartOfSpeech } from './types';
import { devLog } from './devLog';

export interface DictionaryDatabase {
  getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;
}

/**
 * Parse part of speech from a WikDict lexentry id.
 * Lexentry format: <lang3>/<word>__<POS>__<homograph_number>
 * e.g. "deu/Arm__Substantiv__1", "eng/&__Conjunction__1", "spa/x__sustantivo_masculino__1"
 * Returns undefined if the value is falsy, doesn't match the format, or the POS token is unknown.
 */
export function parseLexentryPartOfSpeech(lexentry: string | null | undefined): PartOfSpeech | undefined {
  if (!lexentry) return undefined;

  // Drop everything up to and including the first '/'
  const afterSlash = lexentry.split('/').slice(1).join('/');
  if (!afterSlash) return undefined;

  // Split by '__' to get parts
  const parts = afterSlash.split('__');
  if (parts.length < 2) return undefined;

  // The POS token is the second-to-last part (to handle words containing '__')
  const posToken = parts[parts.length - 2].toLowerCase();

  // The last part should be a number
  const homographNum = parts[parts.length - 1];
  if (!/^\d+$/.test(homographNum)) return undefined;

  // Match against ordered rules - first match wins
  const posRules: Array<[RegExp, PartOfSpeech]> = [
    // Proper noun must come before noun
    [/^(proper_noun|eigenname|vorname|nachname|toponym|sustantivo_propio|nombre_propio|erisnimi)$/, 'proper noun'],
    // Noun (includes all noun variants across languages)
    [/^(substantiv|noun|sustantivo|сущ|substantiivi|sustantivo_masculino|sustantivo_femenino|sustantivo_ambiguo)$/, 'noun'],
    // Verb
    [/^(verb|verbo|hilfsverb|гл|verbi|verbo_auxiliar|verbo_impersonal|verbo_intransitivo|verbo_pronominal|verbo_transitivo)$/, 'verb'],
    // Adjective
    [/^(adjektiv|adjective|adjetivo|прил|adjektiivi|adjetivo_cardinal|adjetivo_demostrativo|adjetivo_indefinido|adjetivo_interrogativo|adjetivo_ordinal|adjetivo_posesivo)$/, 'adjective'],
    // Adverb (includes compound adverbs)
    [/^(adverb|adverbio|adv|нареч|adverbi|localadverb|lokaladverb|modaladverb|temporaladverb|interrogativadverb|pronominadverb|adverbio_comparativo|adverbio_de_afirmación|adverbio_de_cantidad|adverbio_de_duda|adverbio_de_lugar|adverbio_de_modo|adverbio_de_negación|adverbio_de_tiempo|adverbio_interrogativo|adverbio_relativo)$/i, 'adverb'],
    // Pronoun
    [/^(pronomen|pronoun|pronombre|мест|pronomini|demonstrativpronomen|indefinitpronomen|interrogativpronomen|personalpronomen|possessivpronomen|reflexivpronomen|relativpronomen|reziprokpronomen|pronombre_demostrativo|pronombre_indefinido|pronombre_interrogativo|pronombre_personal|pronombre_posesivo|pronombre_relativo)$/i, 'pronoun'],
    // Preposition
    [/^(präposition|preposition|preposición|предл|prepositio|postpositio)$/, 'preposition'],
    // Conjunction
    [/^(konjunktion|subjunktion|conjunction|conjunción|союз|konjunktio|conjunción_adversativa|conjunción_ilativa)$/, 'conjunction'],
    // Interjection
    [/^(interjektion|interjection|interjección|межд|interjektio|onomatopeya|onomatopoetikum)$/, 'interjection'],
    // Numeral
    [/^(numerale|numeral|number|numeral_cardinal|числ|numeraali|adjetivo_numeral|numeral_ordinal)$/, 'numeral'],
    // Article
    [/^(artikel|article|artículo|determiner|artikkeli|artículo_determinado|artículo_indeterminado)$/, 'article'],
    // Particle
    [/^(partikel|particle|част|partikkeli|antwortpartikel|fokuspartikel|gradpartikel|modalpartikel|vergleichspartikel|particle)$/, 'particle'],
    // Phrase
    [/^(redewendung|wortverbindung|phrase|idiom|locución|sprichwort|proverb|sanonta|fraasi|expresión|geflügeltes_wort|merkspruch|formel|kontraktion|wortverbindung|locución_adjetiva|locución_adverbial|locución_conjuntiva|locución_interjectiva|locución_prepositiva|locución_pronominal|locución_sustantiva|locución_verbal)$/i, 'phrase'],
    // Prefix
    [/^(präfix|prefix|prefijo|etuliite|prefixoid|präfixoid)$/, 'prefix'],
    // Suffix
    [/^(suffix|sufijo|jälkiliite|suffixoid|suffixoide)$/, 'suffix'],
  ];

  for (const [regex, pos] of posRules) {
    if (regex.test(posToken)) {
      return pos;
    }
  }

  return undefined;
}

export interface RichLookupOptions {
  limit?: number;
}

const DEFAULT_RICH_LIMIT = 20;

interface TableInfo {
  name: string;
}

interface SimpleTranslationRow {
  written_rep: string | null;
  trans_list: string | null;
  max_score: number | null;
}

interface TranslationGroupedRow {
  written_rep: string | null;
  sense_list: string | null;
  trans_list: string | null;
  score: number | null;
  importance: number | null;
  lexentry: string | null;
}

const SIMPLE_TRANSLATION_TABLES = [
  'simple_translation',
  'translation',
  'translations',
  'simple_trans',
] as const;

const GROUPED_TRANSLATION_TABLES = [
  'translation_grouped',
  'grouped_translation',
  'grouped_trans',
  'translations_grouped',
] as const;

async function getAvailableTables(db: DictionaryDatabase): Promise<string[]> {
  try {
    const rows = await db.getAllAsync<TableInfo>(
      'SELECT name FROM sqlite_master WHERE type IN ("table", "view")',
      []
    );
    const tableNames = rows.map((row) => row.name);
    devLog('getAvailableTables: found tables=', tableNames);
    return tableNames;
  } catch (error: any) {
    devLog('getAvailableTables: error=', error.message);
    return [];
  }
}

function findMatchingTable(
  availableTables: string[],
  candidates: readonly string[]
): string | null {
  for (const candidate of candidates) {
    if (availableTables.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function resolveTableName(
  db: DictionaryDatabase,
  candidates: readonly string[],
  tableType: string
): Promise<string> {
  const availableTables = await getAvailableTables(db);
  const matchedName = findMatchingTable(availableTables, candidates);

  if (matchedName) {
    devLog('resolveTableName:', tableType, 'using table=', matchedName);
    return matchedName;
  }

  devLog('resolveTableName:', tableType, 'no matching table found, available=', availableTables);
  throw new Error(
    `No ${tableType} table found. Available tables: ${availableTables.join(', ')}`
  );
}

export function parseTransList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(' | ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseSenseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(' | ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function lookupExact(
  db: DictionaryDatabase,
  word: string
): Promise<LookupResult | null> {
  const term = word.trim();
  if (term.length === 0) return null;

  devLog('lookupExact: started, queryLength=', term.length);

  try {
    const tableName = await resolveTableName(
      db,
      SIMPLE_TRANSLATION_TABLES,
      'simple_translation'
    );
    const rows = await db.getAllAsync<SimpleTranslationRow>(
      `SELECT written_rep, trans_list, max_score FROM ${tableName} WHERE written_rep = ? LIMIT 1`,
      [term]
    );

    devLog('lookupExact: success, results=', rows.length, 'table=', tableName);

    if (rows.length === 0) return null;

    const row = rows[0];
    const variant: TranslationVariant = {
      transList: parseTransList(row.trans_list),
      sense: '',
      importance: 0,
    };
    return {
      writtenRep: row.written_rep ?? term,
      variants: [variant],
      score: row.max_score ?? 0,
    };
  } catch (error: any) {
    devLog('lookupExact: error, message=', error.message);
    throw error;
  }
}

/**
 * Build the SQL query for lookupRich, optionally including the lexentry column.
 */
function buildRichSql(tableName: string, withLexentry: boolean): string {
  const lexentrySelect = withLexentry ? 'lexentry,' : '';
  return `SELECT written_rep, sense_list, trans_list, score, importance, ${lexentrySelect}
        CASE WHEN LOWER(written_rep) = LOWER(?) THEN 0 ELSE 1 END AS exact_match
       FROM ${tableName}
       WHERE LOWER(written_rep) LIKE LOWER(?) || '%'
       ORDER BY exact_match ASC, importance DESC
       LIMIT ?`;
}

export async function lookupRich(
  db: DictionaryDatabase,
  word: string,
  options: RichLookupOptions = {}
): Promise<LookupResult[]> {
  const term = word.trim();
  if (term.length === 0) return [];

  const limit = options.limit ?? DEFAULT_RICH_LIMIT;
  devLog('lookupRich: started, queryLength=', term.length, 'limit=', limit);

  try {
    const tableName = await resolveTableName(
      db,
      GROUPED_TRANSLATION_TABLES,
      'translation_grouped'
    );

    // Try with lexentry column first
    let withLexentry = true;
    let rows: TranslationGroupedRow[];
    try {
      const sql = buildRichSql(tableName, true);
      rows = await db.getAllAsync<TranslationGroupedRow>(sql, [term, term, limit]);
    } catch (error: any) {
      if (/no such column: lexentry/i.test(error.message)) {
        devLog('lookupRich: lexentry column not available, falling back to query without it');
        withLexentry = false;
        const sql = buildRichSql(tableName, false);
        rows = await db.getAllAsync<TranslationGroupedRow>(sql, [term, term, limit]);
      } else {
        throw error;
      }
    }

    devLog('lookupRich: success, results=', rows.length, 'table=', tableName, 'withLexentry=', withLexentry);

    // Group rows by dictionary entry (lexentry when available, else exact written_rep).
    // Pass A: for rows with lexentry, record the first lexentry per exact spelling.
    // This allows null-lexentry rows to be attached to their spelling's entry.
    const firstEntryForRep = new Map<string, string>();
    for (const row of rows) {
      if (row.lexentry && row.written_rep && !firstEntryForRep.has(row.written_rep)) {
        firstEntryForRep.set(row.written_rep, row.lexentry);
      }
    }

    // Pass B: group rows by their resolved key
    // - If row has lexentry: key = 'e:' + lexentry (one card per dictionary entry)
    // - If row has no lexentry but spelling has an entry: key = 'e:' + that entry
    // - Otherwise: key = 'w:' + exact written_rep (fallback for no-lexentry rows)
    const grouped = new Map<string, LookupResult>();
    for (const row of rows) {
      const writtenRep = row.written_rep ?? term;
      let key: string;
      let groupLexentry: string | null = null;

      if (row.lexentry) {
        key = 'e:' + row.lexentry;
        groupLexentry = row.lexentry;
      } else if (firstEntryForRep.has(writtenRep)) {
        key = 'e:' + firstEntryForRep.get(writtenRep);
        groupLexentry = firstEntryForRep.get(writtenRep) ?? null;
      } else {
        key = 'w:' + writtenRep;
        groupLexentry = null;
      }

      const variant: TranslationVariant = {
        transList: parseTransList(row.trans_list),
        sense: parseSenseList(row.sense_list)[0] ?? '',
        importance: row.importance ?? 0,
      };

      const existing = grouped.get(key);
      const partOfSpeech = groupLexentry ? parseLexentryPartOfSpeech(groupLexentry) : undefined;

      if (!existing) {
        grouped.set(key, {
          writtenRep,
          variants: [variant],
          score: row.score ?? 0,
          partOfSpeech,
        });
      } else {
        existing.variants.push(variant);
        if ((row.score ?? 0) > existing.score) {
          existing.score = row.score ?? 0;
        }
        // partOfSpeech is already set from the first row's groupLexentry
      }
    }

    return Array.from(grouped.values());
  } catch (error: any) {
    devLog('lookupRich: error, message=', error.message);
    throw error;
  }
}
