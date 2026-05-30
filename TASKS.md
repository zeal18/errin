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
## Phase 15
- [x] T15.1: Add debug logging to core dictionary lookup functions — Add devLog calls to packages/core/src/dictionary.ts in lookupExact and lookupRich functions to log query input, results count, and errors; create a devLog utility in packages/core/src/devLog.ts that mirrors the mobile implementation, ensuring no personal data or file paths are logged; import and use this logger for all lookup operations to help debug words lookup errors [QRP-B-]
- [ ] H15.2: Fix missing translation_grouped table error in dictionary lookup — Inspect the actual schema of WikDict dictionaries in ../wikdict directory to identify the correct table names; update packages/core/src/dictionary.ts lookupRich function to use the actual table name (likely the tables are named differently in current WikDict releases); add dynamic table detection by querying PRAGMA table_list or SQLite master table to determine available tables at runtime; implement fallback logic to try multiple table name variations (translation_grouped, grouped_translation, translations, etc.) for maximum compatibility with different WikDict dictionary versions; add debug logging to report which tables were found and which is being used for lookup [QRP-B-!]
