- Phase 1: Foundation (5 tasks archived to TASKS-ARCHIVE.md)
- Phase 2: Core Logic (4 tasks archived to TASKS-ARCHIVE.md)
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
- [ ] T5.4: Implement swipe-to-delete for word entries [QRP-B-!]

## Phase 6: Review Screen
- [ ] T6.1: Load due words from DB up to the daily review limit defined in Settings
- [ ] T6.2: Build flashcard UI: show source word → tap to reveal translation and sense
- [ ] T6.3: Build rating controls (Again / Hard / Good / Easy) and apply SM-2 update after each rating
- [ ] T6.4: Build session summary screen showing words reviewed and breakdown by rating

## Phase 7: Settings Screen
- [ ] T7.1: Display list of installed dictionaries
- [ ] T7.2: Implement "Add source language" flow: pick language, download pairs against all installed targets
- [ ] T7.3: Implement "Add target language" flow: pick language, download pairs against all installed sources
- [ ] T7.4: Add daily review limit control (numeric input, default 20)

## Phase 8: Polish & Testing
- [ ] T8.1: Write unit tests for SM-2 algorithm
- [ ] T8.2: Write unit tests for WikDict lookup parsing
- [ ] T8.3: Write unit tests for `computeStatus`
- [ ] T8.4: Add app icon and splash screen
