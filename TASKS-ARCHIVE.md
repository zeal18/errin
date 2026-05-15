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
