- Phase 1: Foundation (5 tasks archived to TASKS-ARCHIVE.md)
- Phase 2: Core Logic (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 3: Onboarding (4 tasks archived to TASKS-ARCHIVE.md)
- Phase 4: Lookup Screen (4 tasks archived to TASKS-ARCHIVE.md)
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
