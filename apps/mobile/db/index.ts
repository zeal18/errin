import * as SQLite from 'expo-sqlite';
import { DB_NAME, SCHEMA_SQL } from './schema';
import { devLog } from '../lib/devLog';

interface TableInfoRow {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

// The only dictionary version that existed before per-version installs; every row in a
// pre-version installed_dictionaries table was downloaded at this version. Pinned literal —
// must not become CURRENT_DICTIONARY_VERSION.id, which moves with future app releases.
const LEGACY_DICTIONARY_VERSION = '2_2025-11';

// Pinned snapshot of the installed_dictionaries schema as of this migration. Intentionally
// duplicated from schema.ts so future schema changes do not retroactively alter this migration.
const INSTALLED_DICTIONARIES_V2_SQL = `
CREATE TABLE installed_dictionaries_new (
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  version TEXT NOT NULL,
  file_path TEXT NOT NULL,
  downloaded_at INTEGER NOT NULL,
  PRIMARY KEY (source_lang, target_lang, version)
);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function migrateInstalledDictionariesVersionKey(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const columns = await db.getAllAsync<TableInfoRow>(
    'PRAGMA table_info(installed_dictionaries)'
  );
  if (columns.length === 0) {
    // Table does not exist — SCHEMA_SQL creates it in the current shape
    return;
  }

  const hasVersionColumn = columns.some((c) => c.name === 'version');
  const pkColumns = columns
    .filter((c) => c.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((c) => c.name)
    .join(',');

  const isCurrentShape =
    hasVersionColumn && pkColumns === 'source_lang,target_lang,version';
  if (isCurrentShape) {
    return;
  }

  devLog(
    `Migrating installed_dictionaries: pk=(${pkColumns}) hasVersion=${hasVersionColumn}`
  );

  // Must be toggled outside a transaction — PRAGMA foreign_keys is a no-op inside one
  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    await db.withTransactionAsync(async () => {
      // Clean up a scratch table left behind by a run that was killed mid-migration
      await db.execAsync('DROP TABLE IF EXISTS installed_dictionaries_new');
      await db.execAsync(INSTALLED_DICTIONARIES_V2_SQL);
      // The old PK guaranteed (source_lang, target_lang) uniqueness, so one constant
      // version value cannot conflict on the new 3-column PK. file_path is copied
      // verbatim — no files are renamed or moved.
      await db.runAsync(
        `INSERT INTO installed_dictionaries_new (source_lang, target_lang, version, file_path, downloaded_at)
         SELECT source_lang, target_lang, ?, file_path, downloaded_at FROM installed_dictionaries`,
        LEGACY_DICTIONARY_VERSION
      );
      await db.execAsync('DROP TABLE installed_dictionaries');
      await db.execAsync(
        'ALTER TABLE installed_dictionaries_new RENAME TO installed_dictionaries'
      );
    });
    devLog(
      'installed_dictionaries migrated to (source_lang, target_lang, version) primary key'
    );
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Add lookup_direction if upgrading from a schema that predates it
  try {
    await db.execAsync(
      `ALTER TABLE settings ADD COLUMN lookup_direction TEXT NOT NULL DEFAULT 'studied_to_native'`
    );
  } catch {
    // Column already exists — no-op
  }

  // installed_dictionaries gained a `version` column and a (source_lang, target_lang, version)
  // primary key; a PK change needs a full table rebuild, not ALTER TABLE ADD COLUMN.
  await migrateInstalledDictionariesVersionKey(db);
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
