import { useCallback, useEffect, useRef, useState } from 'react';
import { lookupRich } from '@errin/core';
import type { LookupResult, LookupDirection, ActivePair } from '@errin/core';
import { useAppStore } from '../store';
import { openDictionaryDatabase, closeDictionaryDatabase } from '../lib/dictionaryDb';
import { devLog } from '../lib/devLog';
import { getDictionaryFilePath } from '../lib/dictionaryDownload';

const DEBOUNCE_MS = 300;

function getDictionaryPathForPair(activePair: ActivePair | null): string | null {
  if (!activePair) return null;
  
  if (activePair.lookupDirection === 'studied_to_native') {
    return getDictionaryFilePath(activePair.studiedLang, activePair.nativeLang);
  } else {
    return getDictionaryFilePath(activePair.nativeLang, activePair.studiedLang);
  }
}

async function performLookup(activeFilePath: string, trimmed: string): Promise<LookupResult[]> {
  try {
    const db = await openDictionaryDatabase(activeFilePath);
    const rows = await lookupRich(db, trimmed);
    devLog(`Lookup results: ${rows.length} for "${trimmed}"`);
    return rows;
  } catch (error) {
    devLog(`Lookup error for "${trimmed}"`);
    throw error;
  }
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

  const activeFilePath = getDictionaryPathForPair(activePair);

  const prevFilePathRef = useRef<string | null>(null);

  useEffect(() => {
    const prevFilePath = prevFilePathRef.current;
    if (prevFilePath !== null && prevFilePath !== activeFilePath) {
      closeDictionaryDatabase(prevFilePath).catch(() => {});
    }
    prevFilePathRef.current = activeFilePath ?? null;

    return () => {
      if (activeFilePath) {
        closeDictionaryDatabase(activeFilePath).catch(() => {});
      }
    };
  }, [activeFilePath]);

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
