#!/usr/bin/env node
// Dev-time only — not run by CI or `pnpm install`.
//
// Regenerates packages/core/src/data/gender-{de,ru,es}.json from WikDict's
// monolingual `entry` tables (see SCHEMA.md). This data is intentionally
// decoupled from the app's dictionary-file versioning (packages/core/src/
// dictionaryVersions.ts) — it ships as a static bundled asset, not a
// per-device download, so re-running this script and committing the
// regenerated JSON is the entire update story. Re-run whenever you want to
// refresh gender coverage against a newer local wikdict checkout.
//
// Requires the `sqlite3` CLI on PATH (supports `-json`, e.g. 3.33+).
//
// Usage: node packages/core/scripts/extract-gender-data.mjs <pathToWikdictVersionDir>
//   e.g. node packages/core/scripts/extract-gender-data.mjs ../wikdict/2_2026-06

import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['de', 'ru', 'es'];
const SQL = `
  SELECT written_rep, group_concat(DISTINCT substr(gender,1,1)) AS g
  FROM entry
  WHERE part_of_speech = 'noun' AND gender IS NOT NULL AND gender != ''
  GROUP BY written_rep;
`;

const versionDir = process.argv[2];
if (!versionDir) {
  console.error(
    'Usage: node packages/core/scripts/extract-gender-data.mjs <pathToWikdictVersionDir>\n' +
      '  e.g. node packages/core/scripts/extract-gender-data.mjs ../wikdict/2_2026-06'
  );
  process.exit(1);
}

for (const lang of LANGS) {
  const dbPath = path.resolve(versionDir, `${lang}.sqlite3`);
  if (!existsSync(dbPath)) {
    console.error(`Missing monolingual dictionary: ${dbPath}`);
    process.exit(1);
  }

  const raw = execFileSync('sqlite3', ['-json', dbPath, SQL], {
    maxBuffer: 1024 * 1024 * 64,
  }).toString();
  const rows = JSON.parse(raw); // [{ written_rep, g: "m" | "m,f" | ... }]

  const map = {};
  for (const { written_rep, g } of rows) {
    map[written_rep] = g.split(',');
  }

  const outPath = path.resolve(__dirname, `../src/data/gender-${lang}.json`);
  writeFileSync(outPath, JSON.stringify(map));
  console.log(`${lang}: ${Object.keys(map).length} entries -> ${outPath}`);
}
