# Archived Tasks


## Phase 1: Foundation

- [x] T1.1: Initialize pnpm workspace with `apps/mobile` and `packages/core` [QRP-B-]
- [x] T1.2: Set up Expo managed project with TypeScript in `apps/mobile` [----B-]
- [x] T1.3: Configure NativeWind and Expo Router [QRP-B-]
- [x] T1.4: Set up expo-sqlite schema for `Word`, `InstalledDictionary`, and `Settings` [----B-]
- [x] T1.5: Set up Zustand store with slices for installed dictionaries, active language pair, and settings [QR--B-]

## Phase 2: Core Logic

- [x] T2.1: Define shared TypeScript types: `Word`, `InstalledDictionary`, `LookupResult`, `LearningStatus`, `Settings` in `packages/core/types.ts` [QR--B-]
- [x] T2.2: Implement WikDict bilingual SQLite lookup in `packages/core/dictionary.ts` (exact match via `simple_translation`, rich results via `translation_grouped`) [QR--B-]
- [x] T2.3: Implement SM-2 algorithm in `packages/core/srs.ts` [--P-B-]
- [x] T2.4: Implement `computeStatus(word: Word): LearningStatus` helper in `packages/core/srs.ts` [----B-]

## Phase 3: Onboarding

- [x] T3.1: Implement first-launch detection (redirect to onboarding when no dictionary is installed) [----B-]
- [x] T3.2: Build language selection step (native language + language to learn, from supported list) [----B-]
- [x] T3.3: Build dictionary download step with progress indicator; block navigation until download completes [----B-]
- [x] T3.4: Redirect to Lookup tab on completion and ensure onboarding never shown again [QRP-B-]

## Phase 4: Lookup Screen

- [x] T4.1: Build language pair selector — dropdown when multiple pairs installed, static label when only one [----B-]
- [x] T4.2: Build text input with lookup against the active dictionary [----B-]
- [x] T4.3: Build results list showing translations and sense for each result [--P-B-]
- [x] T4.4: Implement tap-to-save: persist word to DB with active pair stamped on it, show brief confirmation [----B-]

## Phase 5: Word List Screen

- [x] T5.1: Build scrollable word list with source word, translation, and learning status badge per entry [----B-]
- [x] T5.2: Compute and display learning status from SM-2 fields using `computeStatus` [--P-B-]
- [x] T5.3: Add "Start learning" button that navigates to the Review screen [----B-]
- [x] T5.4: Implement swipe-to-delete for word entries [QRP-B-]

## Phase 6: Review Screen

- [x] T6.1: Load due words from DB up to the daily review limit defined in Settings [----B-]
- [x] T6.2: Build flashcard UI: show source word → tap to reveal translation and sense [--P-B-]
- [x] T6.3: Build rating controls (Again / Hard / Good / Easy) and apply SM-2 update after each rating [----B-]
- [x] T6.4: Build session summary screen showing words reviewed and breakdown by rating [--P-B-]

## Phase 7: Settings Screen

- [x] T7.1: Display list of installed dictionaries [--P-B-]
- [x] T7.2: Implement "Add source language" flow: pick language, download pairs against all installed targets [----B-]
- [x] T7.3: Implement "Add target language" flow: pick language, download pairs against all installed sources [----B-]
- [x] T7.4: Add daily review limit control (numeric input, default 20) [----B-]

## Phase 8: Polish & Testing

- [x] T8.1: Write unit tests for SM-2 algorithm [--P-B-]
- [x] T8.2: Write unit tests for WikDict lookup parsing [Q-P-B-]
- [x] T8.3: Write unit tests for `computeStatus` [--P-B-]
- [x] T8.4: Add app icon and splash screen [----B-]

## Discovery Round 1

- [x] D1.1: Prevent same-language dictionary downloads in AddSourceLanguageModal and AddTargetLanguageModal - When adding a language, the modals attempt to download dictionaries for source=target pairs (e.g., de-de, en-en) which don't exist and will always fail. Add validation to skip pairs where sourceLang === targetLang. [--P-B-]
- [x] D1.2: Remove unused `showDelete` ref in WordListItem.tsx - The ref is set in panResponder handlers but never read anywhere. Clean up dead code. [----B-]
- [x] D1.3: Add user feedback when invalid daily review limit is entered in Settings - Screen silently reverts to previous value when user enters 0 or negative without any toast or inline error message. [----B-]

## Discovery Round 2

- [x] D2.1: Fix re-rating bug in Review screen - After rating a word and advancing via automatic navigation, user can use Prev button to return to the same word, tap to reveal, and rate it again, applying multiple SM-2 updates to the same word in a single session. Fix by updating the dueWords array with the rated word's new state after each rating, ensuring navigation shows current data and prevents duplicate ratings. [--P-B-]
- [x] D2.2: Add Search/Enter key handler to LookupInput - TextInput has returnKeyType="search" but no onSubmitEditing handler, so pressing the Enter/Search key on the keyboard does not trigger word lookup. The onSubmitEditing prop should call the same search logic as onChangeText but trigger immediately on submit. [--P-B-]
- [x] D2.3: Reset swipe animation immediately after delete in WordListItem - When a word is deleted via swipe-to-delete, the pan animation remains at -DELETE_BUTTON_WIDTH (showing the red delete button) until the parent component re-renders and refreshes the list. The handleDeletePress function should animate the pan back to 0 immediately when onDelete is called to avoid visual inconsistency during the async delete operation. [--P-B-]
- [x] D2.4: Add upper bound validation to daily review limit in Settings - The numeric input allows values up to 999 (maxLength=3) which is unrealistic for daily review. Add validation to cap the maximum value at a reasonable limit (e.g., 100 or 200) and show an error message if the user exceeds it. [--P-B-]
- [x] D2.5: Make WikDict download URL version configurable - The dictionary download URL in dictionaryDownload.ts hardcodes version "2_2025-11" which may become stale when WikDict releases new versions. Extract the version string to a constant that can be easily updated, or implement version detection/fallback logic. [--P-B-]
- [x] D2.6: Remove index from FlatList keyExtractors - ResultsList.tsx uses keyExtractor with writtenRep + index, and settings.tsx uses sourceLang-targetLang-index. Using array indices in React keys is an anti-pattern that can cause reconciliation issues. ResultsList should use a stable key based on writtenRep and other unique fields; settings should use sourceLang-targetLang which is already unique (primary key in DB). [--P-B-]

## Discovery Round 4

- [x] D4.1: Fix array index anti-pattern in ResultsList.tsx senseList rendering - The senseList.map uses key={i} which can cause reconciliation issues when the list order changes. Replace with key={sense} or key={\`${item.writtenRep}-${i}\`} to ensure stable keys. [--P-B-]
- [x] D4.2: Fix visual bug in WordListItem swipe animation - When user swipes left then drags right (dx >= 0), the pan value is not updated, causing the word to stay at the last negative position instead of following the finger back to 0. The onPanResponderMove should set pan to 0 when dx >= 0 to provide correct visual feedback during drag. [--P-B-]

## Discovery Round 5

- [x] D5.1: Fix Settings screen to show add buttons when no dictionaries are installed - When dictionaries.length === 0, the Settings screen shows only "No dictionaries installed" message without the "Add Source Language" and "Add Target Language" buttons. The buttons are in the FlatList's ListHeaderComponent which is not rendered when there are no dictionaries. Move add buttons outside the FlatList or use ListEmptyComponent to ensure users can always add dictionaries from Settings. [--P-B-]

## Discovery Round 6

- [x] D6.1: Fix Settings screen daily review limit input to properly handle all numeric input cases - The handleLimitChange function in apps/mobile/app/(tabs)/settings.tsx has two bugs: (1) For values > 200, it sets the error but does not call setLimitInput, causing the TextInput to not reflect the user's typing and creating confusing UX; (2) For empty string, parseInt returns NaN and NaN <= 200 is false, causing it to incorrectly show "Maximum 200" error instead of clearing the error. Fix by always updating limitInput for valid numeric input (regex /^\d*$/ matches empty and digits) and only setting error for values > 200, with special handling for empty string to clear the error. [--P-B-]

## Discovery Round 8

- [x] D8.1: Fix handleRef leak in onboarding.tsx on retry - In apps/mobile/app/onboarding.tsx, when a download fails and the user taps Retry, the onRetry function calls startDownload which creates a new download handle and assigns it to handleRef.current, but does not cancel the previous handle first. This can lead to multiple concurrent downloads for the same dictionary and wasted bandwidth. Fix by calling handleRef.current?.cancel() before starting a new download in onRetry. [--P-B-]
- [x] D8.2: Handle empty download list edge case in AddSourceLanguageModal and AddTargetLanguageModal - In AddSourceLanguageModal.tsx, validTargetLangs filters installed targets excluding the selected source; if installedTargetLangs is empty, validTargetLangs will be empty, resulting in downloadItems.length === 0 and the download step showing "Downloading 0 dictionary pairs" with no actionable items. Same issue exists in AddTargetLanguageModal.tsx with validSourceLangs. Fix by checking if validTargetLangs/validSourceLangs is empty and showing a helpful message with a back button. [Q-P-B-]
- [x] D8.3: Add cleanup for dictionaryDb cache to prevent memory leaks - The openCache Map in apps/mobile/lib/dictionaryDb.ts grows indefinitely as new dictionary files are opened. There is no mechanism to close and remove cached connections when dictionaries are removed or when connections are no longer needed. Fix by adding a closeDictionaryDatabase function that removes entries from openCache and closes the underlying SQLite connection, and call it when dictionaries are removed or the app is backgrounded. [--P-B-]
- [x] D8.4: Add accessibility support for swipe-to-delete in WordListItem - The swipe-to-delete gesture in apps/mobile/components/WordListItem.tsx is not accessible to screen reader users (VoiceOver/TalkBack). Screen readers cannot perform the swipe gesture or discover the delete action. Fix by adding accessibility props to the Animated.View (accessible={true}, accessibilityRole="button", accessibilityLabel="Delete {word.source}", onAccessibilityTap={handleDeletePress}) so users can delete items via accessibility services. [Q-P-B-]

## Discovery Round 9

- [x] D9.1: Fix handle leak in AddSourceLanguageModal and AddTargetLanguageModal onRetry - In both modal components, the onRetry function creates a new download handle without cancelling the previous one for the same pair. This can lead to multiple concurrent downloads and wasted bandwidth. Fix by calling cancel on the existing handle from downloadHandlesRef.current before starting a new download in onRetry. [--P-B-]
- [x] D9.2: Fix redundant disabled check in language selection buttons in AddSourceLanguageModal and AddTargetLanguageModal - The disabled prop on language Pressable uses disabled={!availableLanguages.some(l => l.code === lang.code)}. Since lang is already from availableLanguages, this always evaluates to false. Remove the disabled prop since availableLanguages already filters out installed languages. [--P-B-]
- [x] D9.3: Add accessibility to Retry buttons in download error state - The Retry Pressable in the error state of the download step in AddSourceLanguageModal.tsx and AddTargetLanguageModal.tsx is missing accessibilityRole="button", making it inaccessible to screen reader users. Add accessibilityRole="button" and accessibilityLabel="Retry downloading {pair}" to the Retry Pressable. [--P-B-]

## Discovery Round 10

- [x] D10.1: Add accessibility labels to remaining interactive elements - Multiple Pressables across the app are missing accessibilityRole and accessibilityLabel props, making them difficult or impossible to use with screen readers. Add accessibilityRole="button" and descriptive accessibilityLabel to: onboarding.tsx DownloadStep Retry button, review.tsx Done button, review.tsx card flip Pressable with accessibilityHint, review.tsx rating buttons (Again/Hard/Good/Easy), review.tsx Prev/Next buttons, words.tsx Start learning button, settings.tsx daily review limit TextInput, LanguagePairSelector.tsx menu items, and LookupInput.tsx TextInput. [--P-B-]

## Discovery Round 11

- [x] D11.1: Add missing accessibilityState for disabled Pressables in review.tsx - In apps/mobile/app/(tabs)/review.tsx, the Prev and Next buttons (lines 163, 172) have disabled props but are missing accessibilityState={{ disabled: true/false }} to properly communicate their disabled state to screen reader users. Add accessibilityState={{ disabled: currentIndex === 0 }} to Prev button and accessibilityState={{ disabled: currentIndex === dueWords.length - 1 }} to Next button. [--P-B-]
- [x] D11.2: Add missing accessibilityState for disabled Add buttons in AddSourceLanguageModal and AddTargetLanguageModal - In both modal components (line 265), the Add Pressable has disabled={!canAdd} but missing accessibilityState={{ disabled: !canAdd }} for screen reader accessibility. [--P-B-]
- [x] D11.3: Add accessibility props to modal backdrop Pressables - The backdrop Pressables in LanguagePairSelector.tsx (line 56), AddSourceLanguageModal.tsx (lines 210, 290, 332), and AddTargetLanguageModal.tsx (lines 210, 290, 332) are missing accessibilityRole="button" and accessibilityLabel props, making them undiscoverable and unusable by screen reader users who need to dismiss modals. [--P-B-]
- [x] D11.4: Add accessibility props to ResultsList TouchableOpacity - In apps/mobile/components/ResultsList.tsx, the TouchableOpacity result items (line 23) are missing accessibilityRole="button" and accessibilityLabel props, making the lookup results inaccessible to screen reader users who cannot tap to save words. [--P-B-]

## Discovery Round 12

- [x] D12.1: Add missing accessibilityLabel to buttons in onboarding.tsx - In apps/mobile/app/onboarding.tsx, the Continue button (line 132) has accessibilityRole="button" but is missing accessibilityLabel="Continue", and the language selection Pressables (line 168) have accessibilityRole="button" but are missing accessibilityLabel={"Select " + lang.name} to properly identify each language button for screen reader users. [--P-B-]
- [x] D12.2: Add missing accessibilityLabel to action buttons in AddSourceLanguageModal and AddTargetLanguageModal - In both modal components, the Cancel button (line 258), Add button (line 265), Back button in empty step (line 312), and Done/Close button in download step (line 420) have accessibilityRole="button" but are missing accessibilityLabel props (Cancel, Add, Back, Close/Done respectively) for screen reader users. [--P-B-]
- [x] D12.3: Add missing accessibilityRole and accessibilityLabel to inner modal content Pressables - In AddSourceLanguageModal.tsx (line 215), AddTargetLanguageModal.tsx (line 215), and LanguagePairSelector.tsx (line 61), the inner Pressable that wraps modal content and uses e.stopPropagation() is missing accessibilityRole="button" and accessibilityLabel describing the modal content, making these elements undiscoverable by screen readers. [--P-B-]
- [x] D12.4: Add missing accessibilityRole and accessibilityLabel to Delete button in WordListItem - In apps/mobile/components/WordListItem.tsx (line 121-124), the Delete Pressable inside the swipeable area has no accessibility props. While the swipeable Animated.View has accessibility support (D8.4), the Delete button itself needs accessibilityRole="button" and accessibilityLabel="Delete" for screen reader users to discover and activate it. [--P-B-]

## Discovery Round 13

- [x] D13.1: Fix dictionary connection memory leak in useLookup hook - In apps/mobile/hooks/useLookup.ts, the performLookup function calls openDictionaryDatabase which adds entries to the openCache Map, but there is no cleanup when the activeFilePath changes (e.g., user switches language pairs). This causes SQLite database connections to accumulate indefinitely. Fix by adding a useEffect that calls closeDictionaryDatabase for the old filePath when activeFilePath changes. [--P-B-]
- [x] D13.2: Add missing accessibility props to Modal components - The Modal components in LanguagePairSelector.tsx (line 49), AddSourceLanguageModal.tsx (lines 203, 290, 337), and AddTargetLanguageModal.tsx (lines 203, 290, 337) are missing accessible={true} prop to ensure screen readers can discover them. Additionally, the inner modal content Views (the white container Pressables) should have accessibilityViewIsModal={true} on iOS to properly announce modal context to VoiceOver users. [--P-B-]

## Discovery Round 14

- [x] D14.1: Add accessibility to Saved toast in LookupScreen - In apps/mobile/app/(tabs)/index.tsx, the Saved notification toast (lines 63-66) appears when a word is saved but has no accessibility props. Screen reader users will not be notified when a word is successfully saved. Fix by adding accessibilityLiveRegion="polite" to the container View or using an accessible announcement mechanism. [--P-B-]
- [x] D14.2: Fix dictionary file cleanup in removeDictionary to prevent storage bloat - In apps/mobile/store/dictionariesSlice.ts, the removeDictionary function (line 55-68) closes the database connection via closeDictionaryDatabase but does not delete the actual SQLite file from the filesystem. This causes dictionary files to remain on device storage even after removal. Fix by also calling deleteAsync from expo-file-system to remove the file after closing the database. [--P-B-]

## Discovery Round 15

- [x] D15.1: Clean up partial dictionary files when downloads are cancelled - In apps/mobile/lib/dictionaryDownload.ts, the cancel function in startDictionaryDownload only calls resumable.cancelAsync() but does not delete the partial file at destPath. This causes partial files to accumulate on disk when downloads are cancelled via modal close, screen navigation, or retry. Fix by adding await deleteAsync(destPath, { idempotent: true }) after resumable.cancelAsync() in the cancel function. [--P-B-]

## Discovery Round 16

- [x] D16.1: Fix onboarding.tsx onRetry to await handle cancellation before starting new download - In apps/mobile/app/onboarding.tsx line 78-81, the onRetry function calls handleRef.current?.cancel().catch(() => {}) but does not await it, then immediately calls startDownload(). This allows the old download to continue while a new one starts, causing concurrent downloads for the same dictionary and potential race conditions. Fix by making onRetry async and awaiting the cancel before starting the new download. [--P-B-]
- [x] D16.2: Add missing accessibilityState for disabled modal backdrop Pressables in download step - In apps/mobile/components/AddSourceLanguageModal.tsx (line 348) and AddTargetLanguageModal.tsx (line 348), the backdrop Pressable in the download step has onPress={allDownloadsComplete ? closeAndReset : undefined} but is missing accessibilityState={{ disabled: !allDownloadsComplete }} to communicate to screen reader users that the modal cannot be closed while downloads are in progress. [--P-B-]
- [x] D16.3: Add accessibility props to dictionary list items in SettingsScreen - In apps/mobile/app/(tabs)/settings.tsx (line 108-120), the FlatList renderItem returns a View with Text children for each dictionary, but has no accessibilityRole or accessibilityLabel props. Screen reader users cannot easily navigate or understand the list of installed dictionaries. Fix by adding appropriate accessibility props to the View or its children. [--P-B-]

## Discovery Round 17

- [x] D17.1: Add missing accessibilityLabel to language selection Pressables in AddSourceLanguageModal and AddTargetLanguageModal - In both modal components (around line 238), the language selection Pressables in the select step have accessibilityRole="button" and accessibilityState={{ selected: isSelected }} but are missing accessibilityLabel={lang.name}. This makes the language buttons (English, German, Russian, Spanish) undiscoverable and unusable by screen reader users. Fix by adding accessibilityLabel={lang.name} to match the pattern used in onboarding.tsx. [--P-B-]

## Discovery Round 18

- [x] D18.1: Fix cleanup useEffect in onboarding.tsx, AddSourceLanguageModal, and AddTargetLanguageModal to not cancel completed downloads - In apps/mobile/app/onboarding.tsx line 56-59 and apps/mobile/components/AddSourceLanguageModal.tsx line 173-180 and AddTargetLanguageModal.tsx line 173-180, the cleanup useEffect calls handle.cancel() on unmount. The cancel function in dictionaryDownload.ts always calls deleteAsync(destPath, { idempotent: true }) which deletes the dictionary file, even if the download completed successfully. When the user navigates away after a successful download, the component unmounts and the cleanup deletes the just-downloaded file. Fix by clearing the handle reference (handleRef.current = null or downloadHandlesRef.current.delete(pairKey)) after successful download completion in the .then() handler and after error in the .catch() handler, so the cleanup has nothing to cancel. [--P-B-]
- [x] D18.2: Add accessibility props to loading state in _layout.tsx - In apps/mobile/app/_layout.tsx line 48-50, the View containing the ActivityIndicator during app hydration has no accessibility props. Screen reader users will not be notified that the app is loading. Fix by adding accessible={true}, accessibilityRole="text", and accessibilityLabel="Loading app, please wait" to the View, and accessibilityLabel="Loading" to the ActivityIndicator. [--P-B-]
- [x] D18.3: Add accessibility labels to ActivityIndicator components throughout the app - Multiple ActivityIndicator components in onboarding.tsx (lines 227, 289), LookupInput.tsx (line 27), AddSourceLanguageModal.tsx (line 451), and AddTargetLanguageModal.tsx (line 451) lack accessibilityLabel props. While ActivityIndicator has built-in accessibility on iOS, explicit labels improve Android support. Add accessibilityLabel="Loading" or descriptive labels to all ActivityIndicator instances. [--P-B-]

## Discovery Round 20

- [x] D20.1: Fix race condition in onboarding.tsx where old download promise handlers clear handleRef after new download starts - In apps/mobile/app/onboarding.tsx, when onRetry cancels a failed download and starts a new one via startDownload, the old promise's .catch() handler (line 66) sets handleRef.current = null after startDownload (line 53) has set handleRef.current to the new handle. If the user navigates away after onRetry but before the new download completes, the cleanup useEffect (line 91) sees handleRef.current as null and fails to cancel the active download, causing it to continue in the background. Fix by removing handleRef.current = null from promise handlers in startDownload, adding a downloadState.kind === 'downloading' check in the cleanup useEffect, and clearing handleRef.current in onRetry before calling startDownload. [--P-B-]
- [x] D20.2: Fix async forEach in modal cleanup functions in AddSourceLanguageModal and AddTargetLanguageModal - In apps/mobile/components/AddSourceLanguageModal.tsx (lines 180-185, 189-194) and AddTargetLanguageModal.tsx (lines 180-185, 189-194), the cleanup useEffect and closeAndReset function use downloadHandlesRef.current.forEach(async (handle) => {...}) which fires off all cancel operations but does not await their completion before clearing the map and continuing. If the component remounts quickly, the old cleanup's cancels may still be in flight while the new component creates new handles, leading to potential race conditions. Fix by using Promise.all with Array.from(...).map to properly await all cancels before clearing the map. [--P-B-]

## Discovery Round 22

- [x] D22.1: Fix dictionaryDownload.ts cancel function to only delete partial files - In apps/mobile/lib/dictionaryDownload.ts, the cancel function (line 100-105) unconditionally calls deleteAsync(destPath, { idempotent: true }) which deletes the file even if the download completed successfully. This causes a race condition: if cleanup useEffect in modals runs between the .then()/.catch() handler starting and removing the handle from downloadHandlesRef.current, it captures the handle and calls cancel(), which deletes the completed dictionary file. Fix by tracking a completed flag and only deleting destPath if the download was actually cancelled before completion. [--P-B-]

## Discovery Round 23

- [x] D23.1: Fix dictionariesSlice.ts to use functional updates for addDictionary and removeDictionary - In apps/mobile/store/dictionariesSlice.ts, both addDictionary (line 45-52) and removeDictionary (line 54-68) use get().dictionaries to compute the new state, which can cause stale closure issues if the store is modified between the get() call and the set() call. Additionally, removeDictionary uses dict.targetLang instead of the targetLang parameter (line 66), which is confusing and relies on dict not being null. Fix by using functional update form (set((state) => ...)) for both functions and using the targetLang parameter directly in removeDictionary's filter. [--P-B-]

## Discovery Round 24

- [x] D24.1: Fix stale closure in settingsSlice.ts for setDailyReviewLimit and setLastActivePair - In apps/mobile/store/settingsSlice.ts, setDailyReviewLimit (line 52) uses set({ settings: { ...get().settings, dailyReviewLimit: limit } }) and setLastActivePair (line 61) uses set({ settings: { ...get().settings, lastActivePair: pair } }), both capturing get().settings which can be stale if the store is modified between the get() call and the set() call. Fix by using functional updates: set((state) => ({ settings: { ...state.settings, dailyReviewLimit: limit } })) and set((state) => ({ settings: { ...state.settings, lastActivePair: pair } })). [--P-B-]
- [x] D24.2: Fix stale closure in dictionariesSlice.ts removeDictionary to prevent orphaned files - In apps/mobile/store/dictionariesSlice.ts line 61, removeDictionary uses get().dictionaries.find(...) to look up the dict by sourceLang/targetLang, which can capture stale state if the dictionaries array is modified between the function call and the get() execution. If the dict is not found in state (due to stale closure), the filePath is undefined, causing closeDictionaryDatabase and deleteAsync to be skipped at lines 63-64 while the database row is still deleted at lines 67-69, leaving orphaned dictionary files on disk. Fix by looking up the filePath from the database before performing deletion, avoiding reliance on potentially stale state: query SELECT file_path FROM installed_dictionaries WHERE source_lang = ? AND target_lang = ? and use the result's file_path if found. [--P-B-]

## Discovery Round 26

- [x] D26.1: Add dictionary removal feature to Settings screen with proper activePair cleanup - The Settings screen in apps/mobile/app/(tabs)/settings.tsx displays installed dictionaries in a FlatList but provides no way to remove them. The removeDictionary function exists in dictionariesSlice.ts (with file cleanup fixes from D14.2, D23.1, D24.2) but is never invoked from the UI. Fix by adding a delete button (with accessibilityLabel) to each dictionary list item that shows a confirmation Alert before calling removeDictionary. Additionally, when the removed pair matches the current activePair, call setActivePair to update settings.lastActivePair to a remaining dictionary (or null if none remain), preventing stale references. [--P-B-]

## Discovery Round 27

- [x] D27.1: Fix type inconsistency in settings.tsx handleDeleteDictionary - In apps/mobile/app/(tabs)/settings.tsx line 93-94, when the active dictionary is deleted, the code sets newActivePair to remainingDictionaries[0] which is an InstalledDictionary object (containing filePath and downloadedAt fields) and passes it directly to setActivePair. However, setActivePair expects a LanguagePair | null (only sourceLang and targetLang). While TypeScript allows this due to structural typing, it causes activePair and lastActivePair in the store to contain extra fields, violating the type contract. Fix by creating a proper LanguagePair object: { sourceLang: remainingDictionaries[0].sourceLang, targetLang: remainingDictionaries[0].targetLang } before passing to setActivePair. [--P-B-]

## Discovery Round 28

- [x] D28.1: Fix invalid accessibilityLiveRegion prop in Saved toast - In apps/mobile/app/(tabs)/index.tsx line 63, the Saved notification toast uses `accessibilityLiveRegion="polite"` which is a web-only HTML attribute (ARIA live region) and is not a valid React Native prop. In React Native, this prop is silently ignored by the View component and does nothing to announce the toast to screen readers. Fix by using `AccessibilityInfo.announceForAccessibility("Saved")` from react-native when the toast is shown (in the useFocusEffect or when showSaved becomes true), and remove the invalid prop. [--P-B-]
- [x] D28.2: Add accessibility props to LanguagePairSelector single dictionary display - In apps/mobile/components/LanguagePairSelector.tsx, when dictionaries.length === 1 (lines 24-30), the component returns a View with a Text child showing the pairLabel, but neither element has accessibility props (accessible, accessibilityRole, accessibilityLabel). While Text elements are read by screen readers by default, adding explicit props ensures proper semantic structure. Fix by adding `accessible={true} accessibilityRole="text" accessibilityLabel={pairLabel(effectivePair)}` to the View element, matching the pattern used for the dictionary list items in settings.tsx (D16.3). [--P-B-]

## Discovery Round 31

- [x] D31.1: Add missing accessibility props to WordListItem status badge, ResultsList, and Review screen - In apps/mobile/components/WordListItem.tsx line 106-110, the learning status badge View and Text (showing Not started/In progress/Learned) have no accessibility props, making the learning state inaccessible to screen reader users. In apps/mobile/components/ResultsList.tsx line 26, the TouchableOpacity accessibilityLabel is missing senseList information - it only includes writtenRep and transList. In apps/mobile/app/(tabs)/review.tsx lines 104-120, the session complete View and rating breakdown Views have no accessibility props. In apps/mobile/app/(tabs)/review.tsx lines 130-133, the back side View showing source/target/sense has no accessibility props. Fix by adding appropriate accessible/accessibilityRole/accessibilityLabel props to all these elements. [--P-B-]

## Discovery Round 32

- [x] D32.1: Fix race condition in AddSourceLanguageModal and AddTargetLanguageModal onRetry where old handle's promise cleanup deletes new handle from downloadHandlesRef.current - In both modal components, when onRetry is called for a failed download, it gets the existing handle, cancels it, creates a new handle, and sets it in the map with the same pairKey. The old handle's promise then rejects (due to cancel) and its .catch() handler calls downloadHandlesRef.current.delete(pairKey), which deletes the NEW handle from the map since it has the same pairKey. This causes the new handle to be lost, preventing proper cleanup if the component unmounts. Fix by calling downloadHandlesRef.current.delete(pairKey) BEFORE setting the new handle in onRetry: first delete the old pairKey, then create and set the new handle. [--P-B-]
- [x] D32.2: Replace non-standard accessibilityRole="menuitem" with "button" in LanguagePairSelector.tsx menu items - In apps/mobile/components/LanguagePairSelector.tsx line 84, the Pressable for dictionary selection uses accessibilityRole="menuitem", which is not a standard React Native accessibility role. React Native supports: button, link, search, image, keyboardkey, text, adjustable, imagebutton, header, summary, switch, checkbox, radio, tab, list, none. On Android, "menuitem" is not recognized and defaults to "button" anyway, but for consistency and to avoid potential issues, change to accessibilityRole="button". [--P-B-]

## Discovery Round 33

- [x] D33.1: Race condition in AddSourceLanguageModal and AddTargetLanguageModal promise handlers causes new download handles to be untracked - In both modal components, the startDownloads and onRetry functions set up promise handlers (.then/.catch) that unconditionally call downloadHandlesRef.current.delete(pairKey) to remove completed handles from the map. When onRetry is called for a failed download: (1) it awaits cancellation of the existing handle, (2) deletes the pairKey from the map, (3) creates a new handle, and (4) sets it with the same pairKey. However, the old handle's promise .catch() runs asynchronously AFTER the new handle has been set, and unconditionally deletes the pairKey again, removing the NEW handle from downloadHandlesRef.current. This causes the new handle to be untracked, so if the component unmounts before the new download completes, the cleanup useEffect won't cancel it and the download will continue in the background. The D32.1 fix (deleting pairKey before setting new handle) does not address this because the old handle's cleanup still runs later. Fix by adding a guard in ALL promise handlers in startDownloads and onRetry: only delete if the handle in the map is still the same handle object: `if (downloadHandlesRef.current.get(pairKey) === handle) downloadHandlesRef.current.delete(pairKey);`. This check must be applied to 4 promise handlers in each modal file (2 in startDownloads, 2 in onRetry) for a total of 8 changes. [--P-B-]

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

## Discovery Round 67

- [x] D67.1: Fix stale activePair after dictionary deletion and app restart — In apps/mobile/store/index.ts, the hydrateAppStore function (lines 17-19) sets activePair to settings.lastActivePair without validating that the dictionary pair is still installed. If a user deletes a dictionary that was the active pair (e.g., en→de) and then restarts the app, activePair will be set to {sourceLang: 'en', targetLang: 'de'} even though that dictionary no longer exists. This causes lookups to silently fail because activeFilePath becomes undefined in useLookup.ts (line 34), while the LanguagePairSelector continues to display the non-existent pair as active. Fix by validating settings.lastActivePair against the hydrated dictionaries array in hydrateAppStore: check if the pair exists in dictionaries, and if not, fall back to the first installed dictionary or null if none exist. [--P-B-]

## Discovery Round 68

- [x] D68.1: Persist fallback activePair to database in hydrateAppStore — In apps/mobile/store/index.ts, the hydrateAppStore function validates settings.lastActivePair against installed dictionaries and falls back to the first dictionary when the stored pair doesn't exist. However, it uses useAppStore.setState({ activePair }) directly, which only updates the in-memory store but does not persist the fallback to the database via setLastActivePair. This leaves settings.lastActivePair in an inconsistent state: on subsequent app restarts, the same fallback logic runs again even though the database still contains the stale non-existent pair. Fix by using setActivePair (which persists to the database) instead of direct setState when setting activePair during hydration, ensuring the database is always in sync. [QRP-B-!]

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
- [x] D62.4: Fix AddLanguagePairModal target language disabled check when sourceLang is null — Line 284 in apps/mobile/components/AddLanguagePairModal.tsx computes isDisabled as "isSource || installedPairKeys.has(\`${sourceLang}-${lang.code}\`)" which evaluates to "null-en" when sourceLang is null, incorrectly disabling all target languages before source is selected. Fix by guarding the installedPairKeys check: isDisabled should be "isSource || (sourceLang !== null && installedPairKeys.has(\`${sourceLang}-${lang.code}\`))" [--P-B-]

## Discovery Round 64

- [x] D64.1: Clean up leftover development/test files from source tree — Remove apps/mobile/components/test.txt, apps/mobile/app/test_write.txt, apps/mobile/app/(tabs)/test_write.txt, and apps/mobile/app/(tabs)/review_new.tsx which are leftover files from development that should not be committed [--P-B-]
- [x] D64.2: Fix duplicate formatBytes function — The formatBytes utility function is defined identically in both apps/mobile/app/(tabs)/settings.tsx:20 and apps/mobile/app/onboarding.tsx:299. Extract this to a shared utility file (e.g., apps/mobile/lib/formatUtils.ts) and import from both locations to avoid duplication [--P-B-]

## Phase 15

- [x] T15.1: Add debug logging to core dictionary lookup functions — Add devLog calls to packages/core/src/dictionary.ts in lookupExact and lookupRich functions to log query input, results count, and errors; create a devLog utility in packages/core/src/devLog.ts that mirrors the mobile implementation, ensuring no personal data or file paths are logged; import and use this logger for all lookup operations to help debug words lookup errors [QRP-B-]
- [x] H15.2: Fix missing translation_grouped table error in dictionary lookup — Inspect the local SCHEMA.md file to identify the correct table names; update packages/core/src/dictionary.ts lookupRich function to use the actual table name (translation_grouped is a VIEW according to SCHEMA.md, not a TABLE); [QRP-B-]

## Phase 16

- [x] H16.1: ~~Superseded by Phase 17~~ — addressed as part of the broader multi-direction dictionary + translation swap feature [QR--B-]
