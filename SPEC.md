# Errin — Specification

An Android app for looking up words and phrases from locally stored dictionaries while building a personal vocabulary list with built-in spaced repetition review. Supports English, German, Russian, and Spanish in any direction. Built with Expo + React Native; business logic lives in a shared TypeScript package for future platform targets.

## Features

- **Offline lookup**: Look up words from locally stored dictionaries — no internet required after download
- **Guided onboarding**: Pick your native language and the language you're learning on first launch; the app downloads the required dictionary automatically
- **Add more languages**: In settings, add more language pairs at any time; new dictionaries are downloaded on demand
- **Smart language selector**: When multiple pairs are available, the translator lets you pick the active pair; when only one is downloaded, it shows the language names as a static label
- **Save automatically**: Every lookup is added to your word list, tagged with the language pair used at that moment
- **Word list is permanent**: Changing or adding languages never affects existing words — they keep the translation they were saved with
- **Review with SRS**: Flashcard review using the SM-2 spaced repetition algorithm
- **Fully local**: All data stored on device — no account required

## Language & Dictionary Model

A **language pair** is identified by `{ nativeLang, studiedLang }`. Adding a pair always downloads **both** bilingual directions: `{native}-{studied}` and `{studied}-{native}`. Both files are required before the pair is usable.

- Onboarding selects the native + studied language and downloads both dictionaries for that pair
- Settings let you add more language pairs; each addition downloads both directions
- The active pair is remembered per session and defaults to the most recently used
- Each active pair has a **lookup direction** — `studied→native` (default) or `native→studied` — that the user can toggle with a swap button in the Lookup screen
- Words are **always** saved with `sourceLang = studiedLang, targetLang = nativeLang` regardless of the current lookup direction, so the learning list is consistent

## Supported Language Pairs

Four languages in any direction: English, German, Russian, Spanish.

| File | Direction | Size |
|---|---|---|
| `en-de.sqlite3` | English → German | 25 MB |
| `de-en.sqlite3` | German → English | 30 MB |
| `en-ru.sqlite3` | English → Russian | 26 MB |
| `ru-en.sqlite3` | Russian → English | 19 MB |
| `en-es.sqlite3` | English → Spanish | 21 MB |
| `es-en.sqlite3` | Spanish → English | 13 MB |
| `de-ru.sqlite3` | German → Russian | 17 MB |
| `ru-de.sqlite3` | Russian → German | 11 MB |
| `de-es.sqlite3` | German → Spanish | 15 MB |
| `es-de.sqlite3` | Spanish → German | 8 MB |
| `ru-es.sqlite3` | Russian → Spanish | 8 MB |
| `es-ru.sqlite3` | Spanish → Russian | 7 MB |

Users download only the pairs they need. All twelve pairs total ~200 MB.

Both directions of a pair are always downloaded together (e.g. adding "English ↔ German" downloads both `en-de.sqlite3` and `de-en.sqlite3`).

## Dictionary Source

Dictionaries come from [WikDict](https://wikdict.com), downloaded as SQLite files from `https://download.wikdict.com/dictionaries/sqlite/2_2025-11/`. Each bilingual file contains two tables used for lookup:

For development purposes there are downloaded dictionaries and extracted data schemas in the ../wikdict/ directory.

- **`simple_translation`** — fast exact-match lookup keyed on `written_rep`
- **`translation_grouped`** — richer results with pipe-separated sense definitions and comma-separated translations; columns include `score` (translation quality) and `importance` (WikDict word-frequency/popularity signal used for result ranking)

Monolingual WikDict files (which provide POS, gender, and IPA) are not used — they are 256 MB–1.1 GB each and impractical for mobile.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed) + React Native |
| Language | TypeScript |
| Navigation | Expo Router |
| Styling | NativeWind (Tailwind for React Native) |
| State | Zustand |
| Local storage | expo-sqlite |
| Dictionary files | WikDict SQLite (downloaded to device) |
| Shared logic | `packages/core` |
| Testing | Jest + React Native Testing Library |

## Repository Structure

```
/
├── apps/
│   └── mobile/              # Expo app
│       ├── app/             # Expo Router screens (file-based routing)
│       │   ├── onboarding.tsx     # First-launch language picker + download
│       │   ├── (tabs)/
│       │   │   ├── index.tsx      # Lookup tab
│       │   │   ├── words.tsx      # Word list tab
│       │   │   └── review.tsx     # Review tab
│       │   └── settings.tsx
│       ├── components/      # UI components
│       ├── db/              # expo-sqlite: word storage schema and queries
│       ├── store/           # Zustand store
│       └── app.json
└── packages/
    └── core/                # Platform-agnostic TypeScript
        ├── srs.ts           # SM-2 algorithm
        ├── dictionary.ts    # WikDict lookup logic
        └── types.ts         # Shared types
```

The `packages/core` layer contains no React Native or browser dependencies — it can be reused as-is if a web or desktop version is built later.

## Data Model

```typescript
// A saved word — language pair is fixed at save time and never changes
interface Word {
  id: string
  source: string        // original word/phrase
  target: string        // translation saved at lookup time
  sense: string         // sense/definition shown at time of save
  sourceLang: string    // e.g. "en" — fixed at save time
  targetLang: string    // e.g. "de" — fixed at save time
  createdAt: number     // unix timestamp
  // SM-2 fields
  dueAt: number         // unix timestamp — initially equal to createdAt
  interval: number      // days until next review (0 = not yet reviewed)
  ease: number          // ease factor (starts at 2.5)
  reviews: number       // total review count (0 = not started)
}

// Derived learning status (not stored, computed from SM-2 fields)
type LearningStatus = 'not_started' | 'in_progress' | 'learned'
// not_started: reviews === 0
// in_progress: reviews > 0 && interval < 21
// learned:     interval >= 21

// Tracks which dictionaries are installed on the device
interface InstalledDictionary {
  sourceLang: string    // e.g. "en"
  targetLang: string    // e.g. "de"
  filePath: string      // absolute path to the .sqlite3 file on device
  downloadedAt: number  // unix timestamp
}

// One translation option for a looked-up word (one row from translation_grouped)
interface TranslationVariant {
  transList: string[]   // native-language translation words for this variant
  sense: string         // meaning description in the native language (empty string if unavailable)
  importance: number    // WikDict frequency signal; variants are sorted by this descending
}

// A dictionary lookup result from WikDict — one entry per unique looked-up word
interface LookupResult {
  writtenRep: string              // the looked-up word
  variants: TranslationVariant[]  // translation variants, sorted by importance desc; always non-empty
  score: number                   // max score across variants
}

// User preferences
interface Settings {
  dailyReviewLimit: number   // default: 20
  lastActivePair: { nativeLang: string; studiedLang: string } | null
  lookupDirection: 'studied-to-native' | 'native-to-studied'  // default: 'studied-to-native'
}
```

## Screens

### Onboarding (first launch only)
Shown when no dictionary is installed. Two steps:
1. **Language selection** — user picks their native language and the language they want to learn from the supported list
2. **Download** — **both** dictionaries for the selected pair are downloaded sequentially with a combined progress indicator; the user cannot proceed until both downloads complete

On completion the user is taken directly to the Lookup screen. Onboarding never appears again.

### Lookup
The main working screen. User types a word and gets results from the locally installed dictionary.

- At the top of the screen a **direction button** shows the active translation direction as `{InputLang} → {OutputLang}` (e.g. "German → English"). It is always tappable.
- Tapping the direction button opens a **direction picker dialog**. Options are grouped by installed `{ nativeLang, studiedLang }` pair. Each group lists both directions:
  - `{studiedLang} → {nativeLang}` — user types in the studied language; default direction
  - `{nativeLang} → {studiedLang}` — user types in the native language
- The currently active direction is highlighted. Selecting a direction closes the dialog, updates the active pair and lookup direction, and clears the current query.
- Direction semantics:
  - `studied→native`: the `{studied}-{native}` dictionary is queried; tapping a result saves the studied word
  - `native→studied`: the `{native}-{studied}` dictionary is queried; tapping a result saves the **studied-language translation** (not the native word typed)
- In both directions, saved words always use `sourceLang = studiedLang` so the word list is consistent
- **Search behavior**: lookup is case-insensitive and returns all words whose `written_rep` starts with the query (prefix search). Results are ordered as follows:
  1. Exact matches (case-insensitive full match) appear first
  2. All remaining prefix matches are sorted by `importance` descending — more common words rank higher
- Each result card shows the **looked-up word** with its **translation variants** listed below it:
  - Variants are sorted by `importance` descending; the first is **pre-selected**
  - Each variant shows its synonyms as selectable chips (individual items from `transList`) and a meaning description in the native language below them
  - Tapping a variant selects it; within the selected variant, tapping a synonym chip selects that synonym — the first is pre-selected
  - Only the selected synonym of the selected variant is used when saving
  - A **Learn button** on each result card changes state based on whether the studied word already exists in the learning list
  - The **studied word** used for deduplication is always the studied-language word — `writtenRep` in `studied→native` mode, or the selected synonym in `native→studied` mode — regardless of which direction was active when the word was originally saved

| Condition | Button |
|---|---|
| Studied word not in the learning list | **Learn** (enabled) |
| In list, status `in_progress` or `not_started`, **same** synonym selected | **Learn** (disabled) |
| In list, status `in_progress` or `not_started`, **different** synonym selected | **Replace** — confirmation dialog shows the synonym currently in progress; confirming replaces it and resets SM-2 progress to zero |
| In list, status `learned` | **Reset** — resets SM-2 progress to unstarted |

**Deduplication examples:**

- User studies German (native: English). They search "tief" (German→English) and learn it → "tief → deep" in the list.
- They switch to English→German and search "deep". The "tief" translation variant shows **Learn disabled** — "tief" is already in the list.
- Selecting a different synonym (e.g. "profound") → **Learn enabled**. Tapping it replaces "tief → deep" with "tief → profound" (same studied word, updated translation, progress reset).
- Later, the user adds Russian↔German (native: Russian, studied: German). They search "tief" (German→Russian) and see "глубокий". Because "tief" is already in the list (from the English pair), the button shows **Replace**.
- Confirming replaces "tief → profound" with "tief → глубокий". Progress resets.

The one-entry-per-studied-word rule applies globally across all installed language pairs and all search directions.

### Word List
A scrollable list of all saved words.

Each entry shows:
- Source word and its translation
- Learning status badge: **Not started** / **In progress** / **Learned**

Status is derived from SM-2 state:
- **Not started** — word has never been reviewed (`reviews = 0`)
- **In progress** — word has been reviewed at least once but is not yet stable (`interval < 21 days`)
- **Learned** — word is stable (`interval ≥ 21 days`)

A **Start learning** button at the top of the screen starts a review session for words that are due. Words can be deleted by swiping.

### Review
A flashcard session for words that are currently due.

1. Source word is shown
2. User taps to reveal the translation and sense
3. User rates their recall: **Again** / **Hard** / **Good** / **Easy**
4. SM-2 updates the word's interval and next due date
5. Session ends when all due words have been rated; a summary shows how many words were reviewed and the breakdown by rating

The number of words included in a session is capped by the **daily review limit** set in Settings (default: 20).

### Settings

**Languages**

Displays installed language pairs grouped by `{ nativeLang, studiedLang }` — one row per pair (e.g. "English ↔ German"), not one row per dictionary file. Each row shows the two language names and the date the pair was downloaded.

Deleting a pair removes **all** associated dictionary files (both bilingual directions) atomically. There is no way to delete a single direction in isolation — the pair is the minimum unit of deletion.

The **Add Language Pair** button is shown only when at least one installable pair remains (i.e. not all combinations of the supported languages are already installed).

**Daily review limit** — number of words per review session (default: 20)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo Go app on your Android device, or an Android emulator

```bash
pnpm install
cd apps/mobile
pnpm expo start
```

Scan the QR code with Expo Go to run on your device. On first launch, the onboarding flow will guide you through language selection and dictionary download before you can use the app.

## Debugging & Logging

Use `__DEV__` global for development-only logging. Create a utility helper:

```typescript
// utils/devLog.ts
export const devLog = (...args: any[]) => {
  if (__DEV__) console.log('[DEV]', ...args);
};
```

**Important:** No logs should contain personal data, device information, user input, or dictionary file paths. Use redaction for any sensitive values.

Log key events:
- Dictionary download start/complete/fail
- Database open/close operations  
- Lookup query execution and results count
- Active pair changes
- Store hydration
