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
