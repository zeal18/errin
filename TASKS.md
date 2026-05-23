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
## Discovery Round 35
- [x] D35.1: Remove duplicate computeStatus.test.ts file from packages/core - In packages/core/src/, computeStatus.test.ts (191 lines) contains tests that are entirely duplicated in srs.test.ts (226 lines). Both files test the same computeStatus function exported from './srs'. This causes redundant test execution and maintenance overhead. Fix by deleting packages/core/src/computeStatus.test.ts. [--P-B-]
- [x] D35.2: Add tsconfig.json to packages/core for TypeScript test compilation - The packages/core directory lacks a tsconfig.json file, causing TypeScript compilation errors (TS2593: Cannot find name 'describe', 'it', 'expect') when running Jest tests. While @types/jest is in devDependencies, TypeScript needs a tsconfig.json with types: ["jest"] and esModuleInterop: true to properly resolve Jest globals. Fix by creating a tsconfig.json with appropriate compilerOptions. [QRP-B-]

## Phase 9: Bug Fixes & Code Quality
- [x] T9.1: Replace hardcoded `ease: 2.5` with imported `INITIAL_EASE` constant in LookupScreen word save [----B-]
- [x] T9.2: Replace `Math.random()`-based `generateId()` with `crypto.randomUUID()` in LookupScreen [----B-]
- [x] T9.3: Remove unnecessary `ratings` dependency from `handleRate` useCallback in ReviewScreen [----B-]
- [x] T9.4: Add `useEffect` keyed on `visible` to reset state in `AddSourceLanguageModal` and `AddTargetLanguageModal` when modal re-opens after being closed mid-download [----B-]
- [x] T9.5: Consolidate `InstalledDictionary` and `Settings` type definitions — remove duplicates from `apps/mobile/store/types.ts` and import from `@errin/core` instead [----B-]

## Discovery Round 38
- [x] D38.1: Restore missing computeStatus edge case tests after D35.1 — D35.1 deleted computeStatus.test.ts (11 tests) claiming they were duplicated in srs.test.ts, but srs.test.ts only had 4 computeStatus tests. Two unique edge cases lack explicit coverage: (1) reviews>0 with interval===0 should return 'in_progress' (validates interval 0 handling for reviewed words), and (2) reviews===0 with interval>=21 should return 'not_started' (validates reviews precedence over interval). Fix by adding these 2 edge case tests to srs.test.ts. [--P-B-]

## Discovery Round 39
No new tasks discovered.

## Discovery Round 40
- [x] D40.1: Fix ResultsList keyExtractor to use unique keys — In apps/mobile/components/ResultsList.tsx line 21, the FlatList keyExtractor uses item.writtenRep + item.score which may not be unique. The translation_grouped view groups by (lexentry, written_rep, trans_list) and returns max(score) per group, so multiple rows can share the same written_rep and score values (with different lexentry/trans_list). React requires unique keys for proper reconciliation. Fix by including the index: keyExtractor={(item, index) => item.writtenRep + item.score + index}. [--P-B-]

## Discovery Round 41
- [x] D41.1: Fix race condition in startDictionaryDownload — In apps/mobile/lib/dictionaryDownload.ts, the resumable variable is set asynchronously inside the promise (after ensureDictionaryDir, getInfoAsync, and deleteAsync complete), so if cancel() is called immediately after startDictionaryDownload() returns, before the promise has set resumable, the cancel won't work and the partial file won't be deleted. Fix by creating the resumable object synchronously before the async promise starts, so it is always available for cancellation. [--P-B-]

## Discovery Round 42
- [x] D42.1: Fix non-unique keys in ResultsList senseList rendering — In apps/mobile/components/ResultsList.tsx line 35, the senseList items use key={sense} which may produce duplicate keys if the same sense string appears multiple times in the parsed senseList array (e.g., from WikDict data like "noun | noun | verb"). React requires unique keys among siblings. Fix by changing to key={index} or key={`${item.writtenRep}-${index}`} to ensure uniqueness. [--P-B-]

## Discovery Round 48
- [x] D48.1: Fix incomplete D2.1 implementation — The Review screen still allows duplicate ratings of the same word in a single session. D2.1 added setDueWords update to reflect the rated word's new state, but this only shows updated data and does not prevent re-rating. After rating word N and auto-advancing to word N+1, the user can use Prev to return to word N, tap to reveal, and rate it again, applying a second SM-2 update to the same word. Fix by removing rated words from the dueWords array after each rating, or tracking rated word IDs in a Set and preventing re-rating of words already rated in the current session. [--P-B-]

## Discovery Round 49
- [x] D49.1: Fix ReviewScreen stale state when navigating back to tab — In apps/mobile/app/(tabs)/review.tsx, the Review screen does not reset its session state when the user navigates away and returns. Expo Router's Tabs navigator keeps tab screens mounted, so when a user completes a session (sessionComplete=true), switches to another tab, and returns to Review, the screen still displays the "Session Complete" summary instead of loading fresh due words. Fix by adding useFocusEffect from expo-router that resets sessionComplete, currentIndex, side, showRating, ratedWordIds, ratings to initial values and calls loadDueWords() when the screen is focused. [--P-B-]

## Discovery Round 50
No new tasks discovered.

## Discovery Round 52
- [x] D52.1: Fix race condition in ReviewScreen handleRate that allows duplicate SM-2 updates — In apps/mobile/app/(tabs)/review.tsx, the handleRate useCallback (line 70) calls setRatedWordIds after the async updateWord call (line 75). If the user taps a rating button twice quickly, both calls pass the ratedWordIds.has(currentWord.id) guard (line 72) because the Set is not updated until after updateWord completes, causing the word to receive duplicate SM-2 updates. Fix by moving setRatedWordIds((s) => new Set(s).add(currentWord.id)) (currently line 78) before await updateWord(updatedWord) (line 75). [--P-B-]
