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
## Phase 10
- [x] T10.1: Replace separate AddSourceLanguageModal and AddTargetLanguageModal buttons with single AddLanguagePairModal in Settings screen — Currently there are two separate buttons for adding source or target language, which leads to bad UX when no dictionaries are installed. Replace with a single button that opens a modal to select both source and target languages at once, downloading the required dictionary pair. [QRP-B-]

## Phase 11
- [x] T11.1: Add extensive dev-mode logging throughout the app — Create a devLog utility using __DEV__ global and add logging to key operations: dictionary download (start/complete/fail with sizes), database open/close in dictionaryDb.ts, lookup query execution in useLookup.ts (query, activeFilePath, results count), active pair changes in store, and store hydration in index.ts. Ensure no logs contain personal data, device information, or file paths. [--P-B-]

## Phase 12
- [x] T12.1: Display dictionary file sizes in Settings language list — In apps/mobile/app/(tabs)/settings.tsx, add file size display next to each installed dictionary in the Languages section. Use expo-file-system/getInfoAsync to get file size and format it in human-readable form (KB/MB). Show size alongside the language pair name (e.g., "English → German • 25 MB"). [--P-B-]

## Phase 13
- [x] T13.1: Fix app header overlapping with system top bar — The app header does not respect the system status bar and overlaps with it on Android. Add proper safe area insets or padding to the root View in LookupScreen (and other screens) to prevent content from being obscured by the system UI. Use SafeAreaView from react-native-safe-area-context or add StatusBar padding. [--P-B-]

## Phase 14
- [x] T14.1: Add icons to bottom tab bar — In apps/mobile/app/(tabs)/_layout.tsx, add icons to each tab using system symbols or commonly available icons. Use icon libraries like @expo/vector-icons or react-native-vector-icons with appropriate icons for Lookup (search), Words (list), Review (book/flashcards), and Settings (gear/cog). [--P-B-]

## Discovery Round 62
- [x] D62.1: Fix invisible character encoding issues in review.tsx navigation buttons — Lines 184 and 194 in apps/mobile/app/(tabs)/review.tsx contain invisible/special characters before "Prev" and after "Next" that appear as artifact characters in the UI. Clean up these lines to only contain the text "Prev" and "Next" without any hidden characters. [--P-B-]
- [x] D62.2: Fix separator character in settings.tsx dictionary list to use Unicode bullet — Line 176 in apps/mobile/app/(tabs)/settings.tsx uses hyphen "-" as separator between language pair and file size ("{sourceName} -> {targetName} - {formatBytes(size)}"), but T12.1 specification requires Unicode bullet character "•" ("{source} -> {target} • {size}"). Replace hyphen with bullet character. [--P-B-]
- [x] D62.3: Fix code duplication of getLangPairFromPath function — The getLangPairFromPath helper function is defined identically in both apps/mobile/lib/dictionaryDb.ts:11 and apps/mobile/hooks/useLookup.ts:10. Extract this function to a shared utility file (e.g., apps/mobile/lib/pathUtils.ts) and import it from both locations to avoid duplication and ensure consistency. [--P-B-]
- [ ] D62.4: Fix AddLanguagePairModal target language disabled check when sourceLang is null — Line 284 in apps/mobile/components/AddLanguagePairModal.tsx computes isDisabled as "isSource || installedPairKeys.has(\`${sourceLang}-${lang.code}\`)" which evaluates to "null-en" when sourceLang is null, incorrectly disabling all target languages before source is selected. Fix by guarding the installedPairKeys check: isDisabled should be "isSource || (sourceLang !== null && installedPairKeys.has(\`${sourceLang}-${lang.code}\`))"
