import * as SQLite from 'expo-sqlite';
import type { SQLiteBindParams } from 'expo-sqlite';
import type { DictionaryDatabase } from '@errin/core';
import { devLog } from './devLog';
import { getLangPairFromPath } from './pathUtils';

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
const openCache = new Map<string, { rawDb: Promise<SQLite.SQLiteDatabase>; dictDb: Promise<DictionaryDatabase> }>();

export function openDictionaryDatabase(filePath: string): Promise<DictionaryDatabase> {
  const langPair = getLangPairFromPath(filePath);
  const cached = openCache.get(filePath);
  if (cached) return cached.dictDb;

  devLog(`Opening database: ${langPair}`);

  const path = uriToPath(filePath);
  const rawDb = SQLite.openDatabaseAsync(path);
  const dictDb = rawDb.then(toDictionaryDatabase);
  openCache.set(filePath, { rawDb, dictDb });

  dictDb.then(() => {
    devLog(`Database opened: ${langPair}`);
  }).catch(() => {
    devLog(`Database open failed: ${langPair}`);
  });

  return dictDb;
}

export async function closeDictionaryDatabase(filePath: string): Promise<void> {
  const langPair = getLangPairFromPath(filePath);
  const cached = openCache.get(filePath);
  if (cached === undefined) return;

  devLog(`Closing database: ${langPair}`);

  openCache.delete(filePath);

  try {
    const rawDb = await cached.rawDb;
    await rawDb.closeAsync();
  } catch {
    // Ignore errors during close
  }
}

export function closeAllDictionaryDatabases(): Promise<void> {
  const closePromises = Array.from(openCache.keys()).map((fp) =>
    closeDictionaryDatabase(fp).catch(() => {})
  );
  return Promise.all(closePromises).then(() => openCache.clear());
}
