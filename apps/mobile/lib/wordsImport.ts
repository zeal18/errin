import type { Word, InstalledDictionary } from '@errin/core';
import { getLanguageName } from '@errin/core';
import { csvToWords } from '@errin/core';
import { getWordKeys, insertWords } from '../db/words';

export interface MissingPair {
  sourceLang: string;
  targetLang: string;
  label: string;
  wordCount: number;
}

/**
 * Find dictionary pairs that are missing from the installed dictionaries.
 * Groups words by unordered language pair (en-de and de-en are the same pair).
 * Returns pairs that are missing both directions, with word counts.
 */
export function findMissingDictionaryPairs(
  words: Word[],
  installed: InstalledDictionary[]
): MissingPair[] {
  // Create a set of installed direction keys
  const installedKeys = new Set(
    installed.map((d) => `${d.sourceLang}-${d.targetLang}`)
  );

  // Group words by unordered pair
  const pairGroups = new Map<string, { sourceLang: string; targetLang: string; count: number }>();

  for (const word of words) {
    // Create unordered pair key
    const pairKey = [word.sourceLang, word.targetLang].sort().join('|');
    
    if (!pairGroups.has(pairKey)) {
      // Use the first word's orientation as the representative
      pairGroups.set(pairKey, {
        sourceLang: word.sourceLang,
        targetLang: word.targetLang,
        count: 0,
      });
    }
    
    const group = pairGroups.get(pairKey)!;
    group.count++;
  }

  // Check which pairs are missing
  const missing: MissingPair[] = [];
  const seenPairKeys = new Set<string>();

  for (const word of words) {
    const pairKey = [word.sourceLang, word.targetLang].sort().join('|');
    
    // Skip if we've already processed this pair
    if (seenPairKeys.has(pairKey)) continue;
    seenPairKeys.add(pairKey);

    const group = pairGroups.get(pairKey)!;
    const { sourceLang, targetLang } = group;

    // Check if both directions are installed
    const hasForward = installedKeys.has(`${sourceLang}-${targetLang}`);
    const hasReverse = installedKeys.has(`${targetLang}-${sourceLang}`);

    if (!hasForward || !hasReverse) {
      const label = `${getLanguageName(sourceLang) ?? sourceLang} ↔ ${getLanguageName(targetLang) ?? targetLang}`;
      missing.push({
        sourceLang,
        targetLang,
        label,
        wordCount: group.count,
      });
    }
  }

  return missing;
}

/**
 * Generate a new ID for an imported word.
 * Format: {sourceLang}-{targetLang}-{source}-{timestamp}[-{attempt}]
 */
export function generateImportId(w: Word, attempt: number = 0): string {
  const base = `${w.sourceLang}-${w.targetLang}-${w.source}-${Date.now()}`;
  if (attempt > 0) {
    return `${base}-${attempt}`;
  }
  return base;
}

export interface ImportPlan {
  toInsert: Word[];
  skipped: number;
}

/**
 * Plan which words to import, handling deduplication and ID collisions.
 * 
 * Rules:
 * - Skip words that already exist in the database (same source + sourceLang)
 * - Skip duplicate words within the file itself (keep first occurrence)
 * - Generate new IDs for words with empty or colliding IDs
 * - Preserve all SM-2 fields and createdAt
 */
export function planWordsImport(
  fileWords: Word[],
  existing: { id: string; source: string; sourceLang: string }[],
  makeId: (w: Word, attempt: number) => string = generateImportId
): ImportPlan {
  const seenKeys = new Set<string>();
  const usedIds = new Set(existing.map((e) => e.id));

  // Add existing words' keys to seenKeys
  for (const e of existing) {
    seenKeys.add(`${e.sourceLang}\u0000${e.source}`);
  }

  const toInsert: Word[] = [];
  let skipped = 0;

  for (const w of fileWords) {
    const key = `${w.sourceLang}\u0000${w.source}`;

    // Skip if this word (source + sourceLang) already exists in DB or was seen earlier in file
    if (seenKeys.has(key)) {
      skipped++;
      continue;
    }

    // Generate ID
    let id = w.id;
    let attempt = 0;

    // If ID is empty or already in use, generate a new one
    if (!id || usedIds.has(id)) {
      do {
        attempt++;
        id = makeId(w, attempt);
      } while (usedIds.has(id));
    }

    // Create the word to insert with the resolved ID
    const wordToInsert: Word = {
      ...w,
      id,
    };

    toInsert.push(wordToInsert);
    seenKeys.add(key);
    usedIds.add(id);
  }

  return { toInsert, skipped };
}

export type ImportResult =
  | { kind: 'missing'; pairs: MissingPair[] }
  | { kind: 'done'; total: number; imported: number; skipped: number };

/**
 * Orchestrate the import of words from a CSV file.
 * 
 * Steps:
 * 1. Parse the CSV file
 * 2. Check for missing dictionary pairs
 * 3. If any pairs are missing, return 'missing' without writing anything
 * 4. Otherwise, plan the import and insert words in a transaction
 * 5. Return the result with counts
 */
export async function importWords(
  fileWords: Word[],
  installed: InstalledDictionary[]
): Promise<ImportResult> {
  // Check for missing dictionary pairs
  const missingPairs = findMissingDictionaryPairs(fileWords, installed);

  if (missingPairs.length > 0) {
    return { kind: 'missing', pairs: missingPairs };
  }

  // Get existing words to check for duplicates
  const existing = await getWordKeys();

  // Plan the import
  const plan = planWordsImport(fileWords, existing);

  // Insert words in a transaction
  if (plan.toInsert.length > 0) {
    await insertWords(plan.toInsert);
  }

  return {
    kind: 'done',
    total: fileWords.length,
    imported: plan.toInsert.length,
    skipped: plan.skipped,
  };
}

/**
 * Format a message for the Missing dictionaries dialog.
 */
export function formatMissingDictionariesMessage(pairs: MissingPair[]): string {
  const lines = pairs.map((p) => {
    const countLabel = p.wordCount === 1 ? '1 word' : `${p.wordCount} words`;
    return `• ${p.label} (${countLabel})`;
  });

  return lines.join('\n') + '\n\nAdd these language pairs in Settings → Languages first, then import the file again.';
}

/**
 * Format a message for the import summary dialog.
 */
export function formatImportSummary(result: Extract<ImportResult, { kind: 'done' }>): string {
  return `Words in file: ${result.total}\nImported: ${result.imported}\nSkipped (already in your list): ${result.skipped}`;
}
