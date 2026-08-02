- Phase 1: Foundation (5 tasks archived to TASKS-ARCHIVE.md)
- Phase 2: Core Logic (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 3: Onboarding (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 4: Lookup Screen (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 5: Word List Screen (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 6: Review Screen (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 7: Settings Screen (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 8: Polish & Testing (4 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 1 (3 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 2 (6 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 4 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 5 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 6 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 8 (4 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 9 (3 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 10 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 11 (4 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 12 (4 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 13 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 14 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 15 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 16 (3 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 17 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 18 (3 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 20 (2 tasks archived to TASKS-ARCHIVE.md)
## Discovery Round 21
No new tasks discovered.
- Discovery Round 22 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 23 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 24 (2 tasks archived to TASKS-ARCHIVE.md)
## Discovery Round 25
No new tasks discovered.
- Discovery Round 26 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 27 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 28 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 31 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 32 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 33 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 35 (2 tasks archived to TASKS-ARCHIVE.md)
- Phase 9: Bug Fixes & Code Quality (5 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 38 (1 tasks archived to TASKS-ARCHIVE.md)
## Discovery Round 39
No new tasks discovered.

- Discovery Round 40 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 41 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 42 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 48 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 49 (1 tasks archived to TASKS-ARCHIVE.md)
## Discovery Round 50
No new tasks discovered.

- Discovery Round 52 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 56 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 57 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 58 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 60 (1 tasks archived to TASKS-ARCHIVE.md)
## Discovery Round 61
No new tasks discovered.

- Discovery Round 67 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 68 (1 tasks archived to TASKS-ARCHIVE.md)
- Phase 10 (1 tasks archived to TASKS-ARCHIVE.md)
- Phase 11 (1 tasks archived to TASKS-ARCHIVE.md)
- Phase 12 (1 tasks archived to TASKS-ARCHIVE.md)
- Phase 13 (1 tasks archived to TASKS-ARCHIVE.md)
- Phase 14 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 62 (4 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 64 (2 tasks archived to TASKS-ARCHIVE.md)
- Phase 15 (2 tasks archived to TASKS-ARCHIVE.md)
- Phase 16 (1 tasks archived to TASKS-ARCHIVE.md)
- Phase 17 (2 archived, 6 retained) (6 tasks archived to TASKS-ARCHIVE.md)
- Phase 21: Dictionary Version Registry & Schema (6 tasks archived to TASKS-ARCHIVE.md)
## Phase 22: Download Confirmation Dialog & Network Detection
- [x] T22.1: Add the `expo-network` dependency to `apps/mobile/package.json`; add `apps/mobile/lib/networkStatus.ts` exporting `isOnWifi(): Promise<boolean>` wrapping `Network.getNetworkStateAsync()` (true only when `type === Network.NetworkStateType.WIFI`) [--P-B-]
- [x] T22.2: Add `apps/mobile/components/DownloadConfirmationDialog.tsx` — props `{ visible: boolean; sizeBytes: number; onAccept: () => void; onCancel: () => void }`; shows the human-formatted size, calls `isOnWifi()` when it opens and shows a warning banner ("Not connected to Wi-Fi — this will use mobile data" or similar) when false; Accept/Cancel buttons [QRP-B-]
- [x] T22.3: Update `apps/mobile/app/onboarding.tsx` — insert `DownloadConfirmationDialog` between language selection and download, sized via `getPairDownloadSize`; download only starts after Accept [----B-]
- [x] T22.4: Update `apps/mobile/components/AddLanguagePairModal.tsx` — same change as T22.3: insert `DownloadConfirmationDialog` between pair selection and download [Q---B-]

## Phase 23: Dictionary Update Flow
- [x] T23.1: Add `isPairBehindCurrentVersion(nativeLang, studiedLang): boolean` (e.g. in `apps/mobile/store/dictionariesSlice.ts`) — true when either installed direction's `version` is not `CURRENT_DICTIONARY_VERSION.id` [--P-B-]
- [x] T23.2: Add `updatePair(nativeLang, studiedLang, onProgress)` to `apps/mobile/store/dictionariesSlice.ts` implementing the "Dictionary Update Flow" from `SPEC.md`: first delete any leftover file at the new-version target paths with no matching DB row (defensive retry cleanup); download both new-version direction files (reusing the `startPairDownload`-style flow) to their version-qualified paths, leaving the existing files untouched; on success, insert two new `installed_dictionaries` rows at the new version; only then call `closeDictionaryDatabase` on the old file paths and delete the old files, then delete the old rows [--P-B-]
- [x] T23.3: Add `apps/mobile/lib/dictionaryMaintenance.ts` — `runDictionaryMaintenance(): Promise<void>` implementing the three cleanup cases from `SPEC.md`'s "Recovering from an interrupted update" table: (1) delete `installed_dictionaries` rows whose `file_path` no longer exists on disk; (2) for direction pairs with two rows, delete the older-version row's file (closing its DB connection first) then delete that row; (3) delete any file in the dictionaries directory that has no matching `installed_dictionaries` row [--P-B-]
- [x] T23.4: Wire `runDictionaryMaintenance()` into `apps/mobile/app/_layout.tsx` — run once as part of the existing startup sequence (alongside/inside `hydrateAppStore()`), before the splash screen hides and before any download can start [--P-B-]

## Phase 24: Update Flow UI Integration & Tests
- [ ] T24.1: Update `apps/mobile/components/DirectionSelector.tsx` — show an **Update** button on each pair group when `isPairBehindCurrentVersion` is true; tapping closes the modal, navigates to the Settings tab, and opens `DownloadConfirmationDialog` for that pair, wired to call `updatePair` on accept [--P-B-!]
- [ ] T24.2: Add the non-interactive "update available" indicator beneath the direction button in `apps/mobile/app/(tabs)/index.tsx`, shown when the active pair is behind the current version; tapping it has no handler
- [ ] T24.3: Update `apps/mobile/app/(tabs)/settings.tsx` — add an **Update** button to each pair row when `isPairBehindCurrentVersion` is true, opening `DownloadConfirmationDialog` directly and calling `updatePair` on accept
- [ ] T24.4: Add tests for `dictionaryVersions.ts` (`getPairDownloadSize`), the `installed_dictionaries` schema migration (old two-column PK → new PK with backfilled `version`), and `runDictionaryMaintenance()`'s three cleanup cases
