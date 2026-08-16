#!/usr/bin/env node
// Local release-prep step — not run by CI or `pnpm install`.
//
// Sets app.json's expo.version and expo.android.versionCode right before a
// release build, deriving both from git so a git tag (or the GitHub Release
// made from it) is the single source of truth for the app's version:
//
//   - version (versionName, user-facing)  <- the exact git tag at HEAD,
//     with a leading "v" stripped if present (v1.4.2 -> "1.4.2"). Fails if
//     HEAD isn't exactly on a tag — a release build should always come from
//     a tagged commit, not an arbitrary one.
//   - android.versionCode (must strictly increase on every Play Store
//     upload) <- minutes since the Unix epoch at build time. Chosen over
//     encoding the semver into an integer because it never collides (even
//     rebuilding the same tag twice produces a higher code) and doesn't
//     need minor/patch to stay under 100.
//
// This mutates the working tree's app.json — it's a build-time step, not
// meant to be committed. Run `git checkout app.json` afterward if you want
// to discard the change (expo prebuild will already have consumed it).
//
// Usage: node scripts/set-version-from-git.mjs

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appJsonPath = path.resolve(__dirname, '../app.json');

function getExactTagAtHead() {
  try {
    return execFileSync('git', ['describe', '--tags', '--exact-match'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const tag = getExactTagAtHead();
if (!tag) {
  console.error(
    'HEAD is not exactly on a git tag — release builds must be built from a tagged commit.\n' +
      'Create one first, e.g.: git tag v0.1.0 && node scripts/set-version-from-git.mjs'
  );
  process.exit(1);
}

const versionName = tag.startsWith('v') ? tag.slice(1) : tag;
const versionCode = Math.floor(Date.now() / 60000);

const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
appJson.expo.version = versionName;
appJson.expo.android = { ...appJson.expo.android, versionCode };
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`Set version=${versionName}, android.versionCode=${versionCode} (from tag ${tag})`);
