import { useCallback, useEffect, useState } from 'react';
import { lookupRich } from '@errin/core';
import type { LookupResult } from '@errin/core';
import { useAppStore } from '../store';
import { openDictionaryDatabase } from '../lib/dictionaryDb';

const DEBOUNCE_MS = 300;

async function performLookup(activeFilePath: string, trimmed: string): Promise<LookupResult[]> {
  const db = await openDictionaryDatabase(activeFilePath);
  return lookupRich(db, trimmed);
}

export interface UseLookupResult {
  query: string;
  setQuery: (q: string) => void;
  results: LookupResult[];
  isLoading: boolean;
  submit: () => void;
}

export function useLookup(): UseLookupResult {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const activePair = useAppStore((s) => s.activePair);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const effectivePair = activePair ?? (dictionaries.length > 0
    ? { sourceLang: dictionaries[0].sourceLang, targetLang: dictionaries[0].targetLang }
    : null);

  const activeDict = effectivePair
    ? dictionaries.find(
        (d) => d.sourceLang === effectivePair.sourceLang && d.targetLang === effectivePair.targetLang
      )
    : undefined;

  const activeFilePath = activeDict?.filePath;

  const submit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0 || !activeFilePath) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    performLookup(activeFilePath, trimmed)
      .then((rows) => {
        setResults(rows);
        setIsLoading(false);
      })
      .catch(() => {
        setResults([]);
        setIsLoading(false);
      });
  }, [query, activeFilePath]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0 || !activeFilePath) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const rows = await performLookup(activeFilePath, trimmed);
        if (!cancelled) {
          setResults(rows);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, activeFilePath]);

  return { query, setQuery, results, isLoading, submit };
}
