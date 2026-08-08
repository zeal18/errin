import { getDatabase, type InstalledDictionaryRow } from '../db';
import { closeDictionaryDatabase } from './dictionaryDb';
import { deleteAsync, getInfoAsync, readDirectoryAsync, documentDirectory } from 'expo-file-system/legacy';
import { devLog } from './devLog';

export async function runDictionaryMaintenance(): Promise<void> {
  const db = await getDatabase();
  const dictDir = documentDirectory + 'dictionaries/';

  // Case 1 - Delete installed_dictionaries rows whose file_path no longer exists on disk
  try {
    const rows = await db.getAllAsync<InstalledDictionaryRow>(
      'SELECT source_lang, target_lang, version, file_path, downloaded_at FROM installed_dictionaries'
    );
    for (const row of rows) {
      // getInfoAsync is an expo-file-system call — it needs the file:// URI form
      // already stored in file_path, not a stripped plain path (a schemeless path
      // makes it fall into the content/asset/null-scheme branch, which always
      // reports exists:false for a real on-disk file).
      const info = await getInfoAsync(row.file_path);
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
        // deleteAsync is an expo-file-system call — same URI requirement as getInfoAsync above.
        await deleteAsync(olderRow.file_path, { idempotent: true });
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
        // dictDir already carries documentDirectory's own file:// scheme, so this is
        // already the same URI form stored in installed_dictionaries.file_path.
        const absolutePath = dictDir + file;
        const match = await db.getAllAsync<{ count: number }>(
          'SELECT 1 FROM installed_dictionaries WHERE file_path = ?',
          [absolutePath]
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
