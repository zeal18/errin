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
No new tasks discovered.
- Discovery Round 22 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 23 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 24 (2 tasks archived to TASKS-ARCHIVE.md)
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
No new tasks discovered.

- Discovery Round 40 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 41 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 42 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 48 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 49 (1 tasks archived to TASKS-ARCHIVE.md)
No new tasks discovered.

- Discovery Round 52 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 56 (2 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 57 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 58 (1 tasks archived to TASKS-ARCHIVE.md)
- Discovery Round 60 (1 tasks archived to TASKS-ARCHIVE.md)
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

## Discovery Round 62
- [x] D62.1: `apps/mobile/app/(tabs)/settings.tsx` does not handle the `updatePair` URL parameter from `DirectionSelector` navigation — when a user taps Update in the direction picker, it navigates to Settings with `?updatePair={pairKey}` but settings.tsx never reads this parameter to automatically open the DownloadConfirmationDialog for that pair [--P-B-]
- [x] D62.2: `apps/mobile/store/dictionariesSlice.ts` `updatePair` function uses plain paths (`getDictionaryFilePath`) instead of URIs from the download result when inserting new `installed_dictionaries` rows — it calls `startPairDownload` but discards the result, then uses `newForwardPath`/`newReversePath` (plain paths) and `Date.now()` instead of `result.first.filePath`/`result.second.filePath` and their `downloadedAt` timestamps, creating inconsistency with onboarding.tsx and AddLanguagePairModal.tsx which store URIs [--P-B-]

## Discovery Round 63
- [x] D63.1: `apps/mobile/store/dictionariesSlice.ts` `updatePair` defensive cleanup queries database with plain paths but DB stores URIs — lines 159-168 use `getDictionaryFilePath(nativeLang, studiedLang, newVersion)` (plain paths) in `SELECT 1 FROM installed_dictionaries WHERE file_path = ?`, but the database stores URIs from `result.first.filePath`/`result.second.filePath`; query never matches so cleanup always deletes target files even when valid DB rows exist, causing potential data loss on update retry [--P-B-]
- [x] D63.2: Inconsistent file path formats across `useLookup.ts`, `dictionariesSlice.ts`, and `dictionaryDb.ts` — `useLookup.ts` calls `openDictionaryDatabase` with plain paths from `getDictionaryFilePath`, while `dictionariesSlice.removeDictionary` and `dictionaryMaintenance.ts` call `closeDictionaryDatabase` with URIs from database; cache in `dictionaryDb.ts` (keyed by filePath param) creates separate entries for same file, preventing proper cleanup and causing memory leaks [--P-B-]

## Discovery Round 65
- [x] D65.1: `apps/mobile/store/dictionariesSlice.ts` `removeDictionary` passes URI to `deleteAsync` which expects plain path — at line 91, `await deleteAsync(row.file_path, { idempotent: true })` receives `row.file_path` (a URI from the database like `file:///path/to/dict/en-de-v1.sqlite3`), but test expectations in `dictionaryMaintenance.test.ts` line 106 expect plain paths for `deleteAsync`, and `dictionaryMaintenance.ts` line 52-53 explicitly converts URIs to plain paths via `uriToPath` before calling `deleteAsync`; this inconsistency causes old dictionary files to not be deleted during pair removal or update, wasting storage space [--P-B-]
- [x] T66.1: [-P.B-] add a clear button to the input textbox on the lookup tab
- [ ] T67.1: vertical scroll doesn't work on the "Words" tab
- [ ] T68.1: add dark theme support that follows the system appearance automatically: configure NativeWind for class-based dark mode (darkMode in apps/mobile/tailwind.config.js) and drive it from React Native's useColorScheme / NativeWind's colorScheme at the root layout (apps/mobile/app/_layout.tsx); define a consistent light/dark palette (background, surface/card, text primary/secondary, borders, input fields, chips, buttons, dialogs/modals) and apply dark: variants to every screen and shared component (onboarding, Lookup tab including result cards, synonym chips, direction picker dialog and update indicator, Words tab including status badges and swipe-to-delete, Review tab including flashcards, gender badges and rating buttons, Settings including Add Language Pair modal and Download Confirmation dialog); also theme the Expo Router tab bar and headers (pass DarkTheme/DefaultTheme to the navigation ThemeProvider), the StatusBar style, and hard-coded colors such as placeholderTextColor, ActivityIndicator and icon colors; keep app.json userInterfaceStyle set to automatic; verify by switching the Android system theme while the app runs and confirming every screen re-renders with readable contrast and no light-only leftovers, and add a Jest/RNTL test that renders a screen under a mocked dark color scheme
- [ ] T68.2: add an Appearance setting that lets the user override the automatic theme: add a themePreference field ('system' | 'light' | 'dark', default 'system') to the Settings type, persist it in the settings table in apps/mobile/db (using the existing ad-hoc ALTER TABLE ADD COLUMN migration pattern) and expose it via apps/mobile/store/settingsSlice.ts; add an Appearance section to the Settings screen with a three-option selector (System default, Light, Dark) whose current choice is highlighted; apply the preference at the root layout so 'system' follows useColorScheme while 'light'/'dark' force the theme via NativeWind's colorScheme.set, and make sure the stored preference is applied during store hydration before the first screen renders to avoid a theme flash; update SPEC.md (Settings data model and Settings screen section) to describe the option; verify that choosing Dark or Light changes the whole app immediately regardless of system theme, survives an app restart, and that System default again tracks the OS setting, with unit tests for the settings slice persistence and the Settings screen selector
- [ ] T69.1: add a Backup section to the Settings tab (apps/mobile/app/(tabs)/settings.tsx) with an Export words to CSV button that backs up every saved word together with its learning progress: add a pure serializer wordsToCsv(words: Word[]): string in packages/core (new file csv.ts, exported from index.ts) that writes a header row id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews followed by one row per word, with RFC 4180 quoting (fields containing commas, double quotes, CR/LF or leading/trailing spaces are wrapped in double quotes and inner quotes doubled), UTF-8 output with a BOM so spreadsheet apps show Cyrillic and umlauts correctly, timestamps written as raw unix numbers so the file round-trips exactly, and words ordered by createdAt ascending; in the app, load all words via apps/mobile/db/words.ts, write the CSV to the cache directory with expo-file-system as errin-words-YYYY-MM-DD.csv, then open the Android share sheet with expo-sharing (add the dependency via npx expo install expo-sharing) using mimeType text/csv so the user can save it to Files/Drive or send it; show a loading state on the button while exporting, disable it and show a hint when the word list is empty, and show an error alert if writing or sharing fails; update SPEC.md (Settings screen section) to describe the export and the CSV column layout; verify with Jest unit tests for wordsToCsv (header, field order, quoting of commas/quotes/newlines, non-Latin text, empty list producing only the header) and an RNTL test for the Settings screen that mocks expo-file-system and expo-sharing and asserts the file content written and that shareAsync is called with the file URI, plus a manual check on Android that the exported file opens in a spreadsheet app with one row per saved word and correct progress values
