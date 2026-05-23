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

## Discovery Round 56
- [x] D56.1: Fix incomplete D52.1 race condition in ReviewScreen handleRate — D52.1 moved setRatedWordIds before await updateWord, but the guard if (ratedWordIds.has(currentWord.id)) uses a stale closure value of ratedWordIds. When a user taps a rating button twice quickly, both calls use the same callback with ratedWordIds not yet containing the word ID in its closure, so both pass the guard and proceed to updateWord, causing duplicate SM-2 updates. Fix by using a useRef to track ratedWordIds synchronously: maintain a ref (ratedWordIdsRef) alongside the state, check and add to the ref before the guard in handleRate, use functional updates for the state, and reset the ref in useFocusEffect. [--P-B-]
- [x] D56.2: Fix Settings screen daily review limit error message persisting after input reset — In apps/mobile/app/(tabs)/settings.tsx handleLimitBlur, when the input is invalid (>200 or <=0), it sets limitError, shows an Alert, and resets limitInput to the current settings value, but does not clear limitError. After reset, the TextInput shows a valid value while the error Text still displays the previous validation error (e.g., "Maximum 200" shown above input containing "20"). Fix by adding setLimitError('') in both invalid branches after setLimitInput(resetValue). [--P-B-]

## Discovery Round 57
- [x] D57.1: Fix race condition in onboarding.tsx onRetry that allows multiple concurrent downloads — In apps/mobile/app/onboarding.tsx, the onRetry function (lines 79-87) sets handleRef.current to null on line 82 and then awaits the old handle's cancellation before calling startDownload. Due to asynchronous state updates, the Retry button remains clickable during the await window: startDownload has not yet updated downloadState.kind to 'downloading', so the button is still visible and the user can click Retry again. The second click finds handleRef.current as null (line 81) and proceeds without cancelling the in-flight download, resulting in multiple concurrent downloads for the same dictionary file. Additionally, in dictionaryDownload.ts, both downloads will attempt to delete and re-download the same file (line 97-99), causing conflicts. Fix by removing the handleRef.current = null line (line 82) and moving startDownload(nativeLang, targetLang) before the await oldHandle?.cancel() so that downloadState.kind updates to 'downloading' immediately, hiding the Retry button. [--P-B-]

## Discovery Round 58
- [x] D58.1: Fix race condition in AddSourceLanguageModal and AddTargetLanguageModal onRetry that allows multiple concurrent downloads — In apps/mobile/components/AddSourceLanguageModal.tsx (lines 126-143) and AddTargetLanguageModal.tsx (lines 126-143), the onRetry functions await cancellation of the existing handle before starting the new download and updating the item status to 'downloading'. Due to asynchronous state updates, the Retry button remains visible (item.status is still 'error') during the await window, allowing the user to click Retry again. The second click captures the same existing handle (before the first click's await completes), both clicks delete the pairKey from the map, and both start new downloads, resulting in multiple concurrent downloads for the same dictionary pair. Additionally, the download state only updates to 'downloading' when the progress callback fires (after ensureDictionaryDir, getInfoAsync, and deleteAsync complete in dictionaryDownload.ts), leaving a window where the UI shows 'error' status while the download is starting. Fix by: (1) setting item status to 'downloading' immediately in onRetry before starting the download, (2) moving startDictionaryDownload before await existingHandle?.cancel(), (3) removing the premature delete from the map, and (4) cancelling the old handle after the new one is in place. [--P-B-]

## Discovery Round 60
- [x] D60.1: Fix memory leak in LookupScreen — The savedTimer ref in apps/mobile/app/(tabs)/index.tsx (line 25) stores a setTimeout ID that is never cleared when the component unmounts. If the user navigates away from the Lookup screen within 1500ms of saving a word, the timer will fire after unmount and call setShowSaved(false), triggering a React warning: "Can't perform a React state update on an unmounted component". Fix by adding a useEffect cleanup: useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []). [--P-B-]

## Discovery Round 61
No new tasks discovered.

## Discovery Round 67
- [x] D67.1: Fix stale activePair after dictionary deletion and app restart — In apps/mobile/store/index.ts, the hydrateAppStore function (lines 17-19) sets activePair to settings.lastActivePair without validating that the dictionary pair is still installed. If a user deletes a dictionary that was the active pair (e.g., en→de) and then restarts the app, activePair will be set to {sourceLang: 'en', targetLang: 'de'} even though that dictionary no longer exists. This causes lookups to silently fail because activeFilePath becomes undefined in useLookup.ts (line 34), while the LanguagePairSelector continues to display the non-existent pair as active. Fix by validating settings.lastActivePair against the hydrated dictionaries array in hydrateAppStore: check if the pair exists in dictionaries, and if not, fall back to the first installed dictionary or null if none exist. [--P-B-]

## Discovery Round 68
- [ ] D68.1: Persist fallback activePair to database in hydrateAppStore — In apps/mobile/store/index.ts, the hydrateAppStore function validates settings.lastActivePair against installed dictionaries and falls back to the first dictionary when the stored pair doesn't exist. However, it uses useAppStore.setState({ activePair }) directly, which only updates the in-memory store but does not persist the fallback to the database via setLastActivePair. This leaves settings.lastActivePair in an inconsistent state: on subsequent app restarts, the same fallback logic runs again even though the database still contains the stale non-existent pair. Fix by using setActivePair (which persists to the database) instead of direct setState when setting activePair during hydration, ensuring the database is always in sync. [--P-B-!]
