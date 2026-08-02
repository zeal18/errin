import { getDatabase, type InstalledDictionaryRow } from '../db';
import { closeDictionaryDatabase } from './dictionaryDb';
import { deleteAsync, getInfoAsync, readDirectoryAsync, documentDirectory } from 'expo-file-system/legacy';
import { devLog } from './devLog';

// expo-sqlite needs a plain absolute path; expo-file-system returns file:// URIs
export function uriToPath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

export async function runDictionaryMaintenance(): Promise<void> {
  const db = await getDatabase();
  const dictDir = documentDirectory + 'dictionaries/';

  // Case 1 - Delete installed_dictionaries rows whose file_path no longer exists on disk
  try {
    const rows = await db.getAllAsync<InstalledDictionaryRow>(
      'SELECT source_lang, target_lang, version, file_path, downloaded_at FROM installed_dictionaries'
    );
    for (const row of rows) {
      const plainPath = uriToPath(row.file_path);
      const info = await getInfoAsync(plainPath);
      if (!info.exists) {
        await db.runAsync(
          'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? AND version = ?',
          [row.source_lang, row.target_lang, row.version]
        );
        devLog('Deleted stale DB row for missing file: ' + row.file_path);
      }
    }
  } catch (error) {
    devLog('Maintenance case 1 failed: ' + error);
  }

  // Case 2 - For direction pairs with two rows, delete the older-version row's file (closing its DB connection first) then delete that row
  try {
    const rows = await db.getAllAsync<InstalledDictionaryRow>(
      'SELECT source_lang, target_lang, version, file_path, downloaded_at FROM installed_dictionaries ORDER BY source_lang, target_lang, downloaded_at ASC'
    );
    const groups = new Map<string, InstalledDictionaryRow[]>();
    for (const row of rows) {
      const key = `${row.source_lang}-${row.target_lang}`;
      const group = groups.get(key) ?? [];
      group.push(row);
      groups.set(key, group);
    }
    for (const [key, group] of groups) {
      if (group.length === 2) {
        const olderRow = group[0];
        const newerRow = group[1];
        await closeDictionaryDatabase(olderRow.file_path);
        const plainPath = uriToPath(olderRow.file_path);
        await deleteAsync(plainPath, { idempotent: true });
        await db.runAsync(
          'DELETE FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? AND version = ?',
          [olderRow.source_lang, olderRow.target_lang, olderRow.version]
        );
        devLog('Deleted old version file and row: ' + olderRow.file_path);
      }
    }
  } catch (error) {
    devLog('Maintenance case 2 failed: ' + error);
  }

  // Case 3 - Delete any file in the dictionaries directory that has no matching installed_dictionaries row
  try {
    const dirInfo = await getInfoAsync(dictDir);
    if (dirInfo.exists) {
      const files = await readDirectoryAsync(dictDir);
      const sqliteFiles = files.filter(f => f.endsWith('.sqlite3'));
      for (const file of sqliteFiles) {
        const absolutePath = dictDir + file;
        const fileUri = 'file://' + absolutePath;
        const match = await db.getAllAsync<{ count: number }>(
          'SELECT 1 FROM installed_dictionaries WHERE file_path = ?',
          [fileUri]
        );
        if (match.length === 0) {
          await deleteAsync(absolutePath, { idempotent: true });
          devLog('Deleted orphaned dictionary file: ' + absolutePath);
        }
      }
    }
  } catch (error) {
    devLog('Maintenance case 3 failed: ' + error);
  }
}
