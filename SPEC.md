# Errin — Specification

An Android app for looking up words and phrases from locally stored dictionaries while building a personal vocabulary list with built-in spaced repetition review. Supports English, German, Russian, and Spanish in any direction. Built with Expo + React Native; business logic lives in a shared TypeScript package for future platform targets.

## Features

- **Offline lookup**: Look up words from locally stored dictionaries — no internet required after download
- **Guided onboarding**: Pick your native language and the language you're learning on first launch; the app downloads the required dictionary automatically
- **Add more languages**: In settings, add more source or target languages at any time; new dictionaries are downloaded on demand
- **Smart language selector**: When multiple pairs are available, the translator lets you pick the active pair; when only one is downloaded, it shows the language names as a static label
- **Save automatically**: Every lookup is added to your word list, tagged with the language pair used at that moment
- **Word list is permanent**: Changing or adding languages never affects existing words — they keep the translation they were saved with
- **Review with SRS**: Flashcard review using the SM-2 spaced repetition algorithm
- **Fully local**: All data stored on device — no account required

## Language & Dictionary Model

The app tracks two independent sets: **source languages** (what you type) and **target languages** (what you learn). Any combination of the two forms an active language pair, with a corresponding dictionary file downloaded to the device.

- Onboarding selects the initial source + target and downloads one dictionary
- Settings let you add more source or target languages; each new combination triggers a download
- The translator's active pair is remembered per session and defaults to the most recently used
- Words store their `sourceLang` and `targetLang` at save time and are never retroactively changed

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

## Dictionary Source

Dictionaries come from [WikDict](https://wikdict.com), downloaded as SQLite files from `https://download.wikdict.com/dictionaries/sqlite/2_2025-11/`. Each bilingual file contains two tables used for lookup:

For development purposes there are downloaded dictionaries and extracted data schemas in the ../wikdict/ directory.

- **`simple_translation`** — fast exact-match lookup keyed on `written_rep`
- **`translation_grouped`** — richer results with pipe-separated sense definitions and comma-separated translations, sorted by score

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

// A dictionary lookup result from WikDict
interface LookupResult {
  writtenRep: string    // source word
  transList: string[]   // parsed from comma-separated trans_list
  senseList: string[]   // parsed from pipe-separated sense_list
  score: number         // max_score from simple_translation
}

// User preferences
interface Settings {
  dailyReviewLimit: number   // default: 20
  lastActivePair: { sourceLang: string; targetLang: string } | null
}
```

## Screens

### Onboarding (first launch only)
Shown when no dictionary is installed. Two steps:
1. **Language selection** — user picks their native language and the language they want to learn from the supported list
2. **Download** — the corresponding dictionary is downloaded with a progress indicator; the user cannot proceed until the download completes

On completion the user is taken directly to the Lookup screen. Onboarding never appears again.

### Lookup
The main working screen. User types a word and gets results from the locally installed dictionary.

- If only one language pair is installed, the pair is displayed as a static label (e.g. "English → German")
- If multiple pairs are installed, a selector lets the user switch the active pair
- Results show the source word, one or more translations, and a sense/definition for context
- Tapping a result saves it to the word list and shows a brief confirmation

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
- **Languages** — view installed dictionaries; add a new source or target language (triggers download of the required pairs)
- **Daily review limit** — number of words per review session (default: 20)

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
