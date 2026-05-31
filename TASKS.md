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
## Phase 17
- [x] T17.1: Add `startPairDownload` helper to `apps/mobile/lib/dictionaryDownload.ts` — downloads both `{native}-{studied}` and `{studied}-{native}` sequentially, fires a unified progress callback with combined progress, and returns both `DictionaryDownloadResult`s; expose a matching cancel function that cancels whichever download is active [QRP-B-]
- [x] T17.2: Update `apps/mobile/app/onboarding.tsx` to use `startPairDownload` — replace the single-dict download with the pair download helper; call `addDictionary` twice on success (once per direction); show a single combined progress bar across both downloads [--P-B-!]
- [x] T17.3: Update `apps/mobile/components/AddLanguagePairModal.tsx` to use `startPairDownload` — same changes as T17.2; update the installed-pair check so a pair is only hidden from the "add" list when both directions are already installed
- [x] T17.4: Update `apps/mobile/store/activePairSlice.ts` — change `activePair` shape from `{ sourceLang, targetLang }` to `{ nativeLang: string, studiedLang: string }`; add `lookupDirection: 'studied-to-native' | 'native-to-studied'` field with a `setLookupDirection` action; update `setActivePair` to persist the new shape to Settings
- [x] T17.5: Update `apps/mobile/store/index.ts` hydration — restore `lookupDirection` from settings on startup; update `lastActivePair` validation to use the new `{ nativeLang, studiedLang }` shape and verify both dictionary files are present
- [x] T17.6: Update `apps/mobile/hooks/useLookup.ts` — derive the dictionary file to open from `activePair` + `lookupDirection` (direction `studied-to-native` → `{studied}-{native}.sqlite3`, direction `native-to-studied` → `{native}-{studied}.sqlite3`); close and reopen the DB connection when direction changes
- [x] T17.7: Update `apps/mobile/app/(tabs)/index.tsx` — add a swap button (⇄) that calls `setLookupDirection` toggling between the two values; add a persistent "Studying: {Language}" label; fix the word-save handler so that when `lookupDirection === 'native-to-studied'` the tapped **translation** (studied-language word) is saved as `source` with `sourceLang = studiedLang, targetLang = nativeLang` instead of the native word the user typed
- [x] T17.8: Update `apps/mobile/components/LanguagePairSelector.tsx` — always display the studied language prominently (e.g. bold label or "Studying: X" badge); keep the pair-switching dropdown behaviour unchanged for multi-pair installs

## Phase 18
- [x] T18.1: Add `removePair(nativeLang, studiedLang)` to `apps/mobile/store/dictionariesSlice.ts` — calls `removeDictionary` for both bilingual directions; if the active pair matches either direction, reset `activePair` to the next available pair or null
- [x] T18.2: Redesign the Languages section in `apps/mobile/app/(tabs)/settings.tsx` — derive unique `{nativeLang, studiedLang}` pairs from the installed dictionaries list; render one row per pair showing language names and download date; the Delete button calls `removePair` and shows a confirmation alert naming the full pair; remove the individual per-file delete button
- [ ] T18.3: Replace `apps/mobile/components/LanguagePairSelector.tsx` with a `DirectionSelector` component — renders a tappable button showing the active direction as `{InputLang} → {OutputLang}`; tapping opens a modal grouping all installed pairs by `{nativeLang, studiedLang}`; each group shows both directions (`studied→native` and `native→studied`); active direction is highlighted; selecting calls `setActivePair(pair, direction)` and closes the modal
- [ ] T18.4: Update `apps/mobile/app/(tabs)/index.tsx` — replace `LanguagePairSelector` with `DirectionSelector`; remove the standalone swap button and "Studying:" label; call `setQuery('')` when the active direction changes to clear stale results
- [ ] T18.5: Update `lookupRich` in `packages/core/src/dictionary.ts` — change from exact match to case-insensitive prefix search using `WHERE LOWER(written_rep) LIKE LOWER(?) || '%'`; select `importance` from `translation_grouped`; order results by `CASE WHEN LOWER(written_rep) = LOWER(?) THEN 0 ELSE 1 END ASC, importance DESC`; pass the query term twice as SQL params; add `importance` to the internal `TranslationGroupedRow` interface (not exposed in `LookupResult`)
