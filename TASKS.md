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
- [ ] D35.2: Add tsconfig.json to packages/core for TypeScript test compilation - The packages/core directory lacks a tsconfig.json file, causing TypeScript compilation errors (TS2593: Cannot find name 'describe', 'it', 'expect') when running Jest tests. While @types/jest is in devDependencies, TypeScript needs a tsconfig.json with types: ["jest"] and esModuleInterop: true to properly resolve Jest globals. Fix by creating a tsconfig.json with appropriate compilerOptions. [QRP-B-!]

## Phase 9: Bug Fixes & Code Quality
- [ ] T9.1: Replace hardcoded `ease: 2.5` with imported `INITIAL_EASE` constant in LookupScreen word save
- [ ] T9.2: Replace `Math.random()`-based `generateId()` with `crypto.randomUUID()` in LookupScreen
- [ ] T9.3: Remove unnecessary `ratings` dependency from `handleRate` useCallback in ReviewScreen
- [ ] T9.4: Add `useEffect` keyed on `visible` to reset state in `AddSourceLanguageModal` and `AddTargetLanguageModal` when modal re-opens after being closed mid-download
- [ ] T9.5: Consolidate `InstalledDictionary` and `Settings` type definitions — remove duplicates from `apps/mobile/store/types.ts` and import from `@errin/core` instead
