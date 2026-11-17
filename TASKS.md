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

## Discovery Round 65
- [x] T67.1: [RP.BR] vertical scroll doesn't work on the "Words" tab
- [x] T68.1: [RP.B-] add dark theme support that follows the system appearance automatically: configure NativeWind for class-based dark mode (darkMode in apps/mobile/tailwind.config.js) and drive it from React Native's useColorScheme / NativeWind's colorScheme at the root layout (apps/mobile/app/_layout.tsx); define a consistent light/dark palette (background, surface/card, text primary/secondary, borders, input fields, chips, buttons, dialogs/modals) and apply dark: variants to every screen and shared component (onboarding, Lookup tab including result cards, synonym chips, direction picker dialog and update indicator, Words tab including status badges and swipe-to-delete, Review tab including flashcards, gender badges and rating buttons, Settings including Add Language Pair modal and Download Confirmation dialog); also theme the Expo Router tab bar and headers (pass DarkTheme/DefaultTheme to the navigation ThemeProvider), the StatusBar style, and hard-coded colors such as placeholderTextColor, ActivityIndicator and icon colors; keep app.json userInterfaceStyle set to automatic; verify by switching the Android system theme while the app runs and confirming every screen re-renders with readable contrast and no light-only leftovers, and add a Jest/RNTL test that renders a screen under a mocked dark color scheme
- [x] T68.2: [RP.BR] add an Appearance setting that lets the user override the automatic theme: add a themePreference field ('system' | 'light' | 'dark', default 'system') to the Settings type, persist it in the settings table in apps/mobile/db (using the existing ad-hoc ALTER TABLE ADD COLUMN migration pattern) and expose it via apps/mobile/store/settingsSlice.ts; add an Appearance section to the Settings screen with a three-option selector (System default, Light, Dark) whose current choice is highlighted; apply the preference at the root layout so 'system' follows useColorScheme while 'light'/'dark' force the theme via NativeWind's colorScheme.set, and make sure the stored preference is applied during store hydration before the first screen renders to avoid a theme flash; update SPEC.md (Settings data model and Settings screen section) to describe the option; verify that choosing Dark or Light changes the whole app immediately regardless of system theme, survives an app restart, and that System default again tracks the OS setting, with unit tests for the settings slice persistence and the Settings screen selector
- [x] T69.1: [RP.BR] add a Backup section to the Settings tab (apps/mobile/app/(tabs)/settings.tsx) with an Export words to CSV button that backs up every saved word together with its learning progress: add a pure serializer wordsToCsv(words: Word[]): string in packages/core (new file csv.ts, exported from index.ts) that writes a header row id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews followed by one row per word, with RFC 4180 quoting (fields containing commas, double quotes, CR/LF or leading/trailing spaces are wrapped in double quotes and inner quotes doubled), UTF-8 output with a BOM so spreadsheet apps show Cyrillic and umlauts correctly, timestamps written as raw unix numbers so the file round-trips exactly, and words ordered by createdAt ascending; in the app, load all words via apps/mobile/db/words.ts, write the CSV to the cache directory with expo-file-system as errin-words-YYYY-MM-DD.csv, then open the Android share sheet with expo-sharing (add the dependency via npx expo install expo-sharing) using mimeType text/csv so the user can save it to Files/Drive or send it; show a loading state on the button while exporting, disable it and show a hint when the word list is empty, and show an error alert if writing or sharing fails; update SPEC.md (Settings screen section) to describe the export and the CSV column layout; verify with Jest unit tests for wordsToCsv (header, field order, quoting of commas/quotes/newlines, non-Latin text, empty list producing only the header) and an RNTL test for the Settings screen that mocks expo-file-system and expo-sharing and asserts the file content written and that shareAsync is called with the file URI, plus a manual check on Android that the exported file opens in a spreadsheet app with one row per saved word and correct progress values
- [x] T70.1: [RP.BR] fix Lookup result grouping so different words and parts of speech that share a spelling are no longer merged into one result card (e.g. German "Arm" noun vs "arm" adjective, "Reihen" noun vs "reihen" verb): the cause is lookupRich in packages/core/src/dictionary.ts, which groups translation_grouped rows by written_rep.toLowerCase(), so case-differing homographs collapse into one LookupResult whose header and gender article (e.g. "der Arm") come from the first row and the other word's senses become hard-to-pick variants under it; change the query to also select the lexentry column (present in the translation_grouped view, see ../wikdict/2_2025-11/de-en.schema) and group rows by lexentry when it is available, falling back to the exact case-sensitive written_rep when it is null or the column is missing, so each lexical entry (word + part of speech + homograph number) becomes its own result card while senses of the same entry still stay together as variants; parse the part of speech out of the lexentry id (inspect real ids in the ../wikdict sqlite files to confirm the format) into a new optional partOfSpeech field on LookupResult (normalized to noun, verb, adjective, adverb, etc., undefined if unparseable) and show it as a small label next to the word on each result card in the Lookup screen, and make sure the gender article is only shown on noun cards (looked up by that card's exact written_rep) so the adjective "arm" never gets "der"; keep the existing ordering rules (exact case-insensitive matches first, then importance descending) with cards ordered by their best row, and keep variant pre-selection, synonym selection, Learn button state and saving working per card so choosing the verb "reihen" saves "reihen" with its own sense; update SPEC.md (LookupResult in the data model and the Lookup screen result card section) to say results are one card per dictionary entry with its part of speech shown; verify with Jest unit tests for lookupRich using a fake DictionaryDatabase returning rows for Arm/arm and Reihen/reihen with distinct lexentry values (separate results with correct partOfSpeech and variants, same-entry rows still merged, fallback grouping when lexentry is absent) and an RNTL test for the Lookup screen asserting two cards with POS labels where only the noun card shows the article, plus a manual check on Android that searching "arm" and "reihen" in German → English shows separate noun/adjective and noun/verb cards and that the verb can be saved
- [x] T71.1: [RP.BR] after fixing grouping of the lookup results, some results, for example for the "reihen" search, are not grouped for the same part of speach
- [x] T72.1: [RP.BR] add an Import words from CSV button to the Backup section of the Settings tab (apps/mobile/app/(tabs)/settings.tsx), next to the existing Export button, that restores words and their learning progress from a file produced by the T69.1 export: add a pure parser csvToWords(csv: string) in packages/core/src/csv.ts (exported from index.ts) that strips the UTF-8 BOM, accepts CRLF or LF line endings, handles RFC 4180 quoting (quoted commas, doubled quotes, embedded newlines), requires the exact header id,source,target,sense,sourceLang,targetLang,createdAt,dueAt,interval,ease,reviews, converts createdAt, dueAt, interval, ease and reviews to numbers, and returns the parsed words or throws a descriptive error (with the row number) on a wrong header, wrong column count, empty source/sourceLang/targetLang or non-numeric fields, so that csvToWords(wordsToCsv(words)) round-trips exactly; in the app, let the user pick a file with expo-document-picker (add it via npx expo install expo-document-picker, types text/csv, text/comma-separated-values and */* as a fallback since Android providers often report CSV files wrongly), read it with expo-file-system, and parse it; if parsing fails show an error alert saying the file is not a valid Errin export; before writing anything, run the dictionary check: collect the distinct language pairs used by the imported words (studied = sourceLang, native = targetLang) and check against installed_dictionaries that both directions (sourceLang-targetLang and targetLang-sourceLang, any version) are installed for each; if any pair is missing, import nothing and show an error dialog titled Missing dictionaries that lists every missing pair by language name (e.g. English ↔ German) with how many words in the file need it, and tells the user to add these language pairs in Settings → Languages first; if all dictionaries are present, insert the words through apps/mobile/db/words.ts in one transaction, keeping their SM-2 fields (dueAt, interval, ease, reviews) and createdAt, generating a new id when the file id already exists in the database, and skipping any word whose studied word already exists in the list for the same learning language, using the same matching rule as the existing one-entry-per-studied-word deduplication (same source and sourceLang), and also skipping duplicates within the file itself (keep the first); never overwrite or change existing words; after the import show a summary dialog with the number of words in the file, the number imported and the number skipped because they already existed, then refresh the words store so the Words tab and due counts show the new words without restarting; show a spinner on the Import button while it runs and disable both Backup buttons during import or export, and treat a cancelled file picker as a no-op; update SPEC.md (project structure, Settings → Backup section) to describe the import flow, the dictionary check, the skip rule and the summary dialog; verify with Jest unit tests for csvToWords (round trip with wordsToCsv including Cyrillic, umlauts, quotes, commas and newlines; BOM and LF handling; errors for wrong header, wrong column count and non-numeric values) and for the import logic (missing-pair detection that reports each missing pair once with word counts, skipping existing words for the same sourceLang while still importing the same spelling for a different sourceLang, skipping in-file duplicates, id-collision handling, preserved progress values), an RNTL test for the Settings screen that mocks expo-document-picker and expo-file-system and asserts the Missing dictionaries dialog lists the missing languages and writes nothing, and that a successful import shows the summary with the correct imported and skipped counts, plus a manual check on Android that exporting, deleting some words and importing the file restores them with their progress while the remaining words are reported as skipped
