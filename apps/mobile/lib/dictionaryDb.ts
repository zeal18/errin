import * as SQLite from 'expo-sqlite';
import type { SQLiteBindParams } from 'expo-sqlite';
import type { DictionaryDatabase } from '@errin/core';

// expo-sqlite needs a plain absolute path; expo-file-system returns file:// URIs
function uriToPath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

// Adapt expo-sqlite's getAllAsync (required params) to DictionaryDatabase (optional params)
function toDictionaryDatabase(db: SQLite.SQLiteDatabase): DictionaryDatabase {
  return {
    getAllAsync: (sql, params) => db.getAllAsync(sql, (params ?? []) as SQLiteBindParams),
  };
}

// Cache open connections by filePath to avoid re-opening on every keystroke
const openCache = new Map<string, Promise<DictionaryDatabase>>();

export function openDictionaryDatabase(filePath: string): Promise<DictionaryDatabase> {
  const cached = openCache.get(filePath);
  if (cached) return cached;

  const path = uriToPath(filePath);
  const promise = SQLite.openDatabaseAsync(path).then(toDictionaryDatabase);
  openCache.set(filePath, promise);
  return promise;
}
