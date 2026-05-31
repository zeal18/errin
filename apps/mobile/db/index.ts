import * as SQLite from 'expo-sqlite';
import { DB_NAME, SCHEMA_SQL } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Add lookup_direction if upgrading from a schema that predates it
  try {
    await db.execAsync(
      `ALTER TABLE settings ADD COLUMN lookup_direction TEXT NOT NULL DEFAULT 'studied_to_native'`
    );
  } catch {
    // Column already exists — no-op
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA_SQL);
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
}

export * from './schema';
