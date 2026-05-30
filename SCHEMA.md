# WikDict SQLite Schema Reference

## Overview

676 SQLite databases, falling into two functional categories (bilingual translation and monolingual dictionary) with two individual outliers.

| Group | Count | Example files |
|-------|------:|---------------|
| Bilingual translation (standard) | 649 | `de-en`, `fr-es`, `zh-da`, … |
| Monolingual dictionary (standard) | 25 | `en`, `de`, `ja`, `pl`, … |
| Bilingual translation (stat ordering anomaly) | 1 | `bg-ca` |
| Monolingual dictionary (extra gender table) | 1 | `sv` |

---

## Group 1 — Bilingual Translation Databases (649 files)

These databases hold word-level translation data between two languages. The filename encodes the language pair (source-target in ISO 639-1 codes).

```sql
CREATE TABLE sqlite_stat1(tbl, idx, stat);

CREATE TABLE translation(
  lexentry,          -- source lexicon entry URI
  sense_num,         -- sense index within the entry
  sense,             -- gloss/definition text for this sense
  written_rep TEXT,  -- source written form
  trans_list,        -- comma-separated target written forms
  score,             -- translation quality score
  is_good,           -- boolean flag for high-confidence translations
  importance         -- frequency/importance weight of the source word
);

CREATE VIEW translation_grouped AS
    SELECT lexentry, written_rep, min(sense_num) AS min_sense_num,
        group_concat(sense, ' | ') AS sense_list,
        trans_list, max(score) AS score, max(importance) AS importance
    FROM (
        -- force order in group_concat
        SELECT *
        FROM translation
        ORDER BY lexentry, written_rep, trans_list, sense_num, score DESC
    )
    GROUP BY lexentry, written_rep, trans_list;

CREATE TABLE simple_translation(
  written_rep TEXT,  -- source written form
  trans_list,        -- comma-separated target written forms
  max_score,         -- best score among all senses for this pair
  rel_importance     -- importance relative to other entries in this DB
);
```

### Table roles

- **`translation`** — the full granular table, one row per (lexentry, sense, translation) triple. Multiple rows exist for a single source word when it has multiple senses or multiple target translations.
- **`translation_grouped`** — a view that collapses all senses for the same (lexentry, written_rep, trans_list) combination into a single row, concatenating senses with ` | `. Used for display.
- **`simple_translation`** — a flat, deduplicated lookup table keyed on `written_rep`. Suitable for fast exact-match lookups without joining on lexentry.
- **`sqlite_stat1`** — populated by `ANALYZE`; stores row-count and index statistics used by the query planner.

---

## Group 2 — Monolingual Dictionary Databases (25 files)

These databases describe the morphology and importance of words in a single language. The filename is a single ISO 639-1 code (`en`, `de`, `ja`, etc.).

```sql
CREATE TABLE sqlite_stat1(tbl, idx, stat);

CREATE TABLE entry(
  lexentry TEXT,       -- lexicon entry URI (primary key)
  vocable TEXT,        -- canonical lemma form
  written_rep TEXT,    -- written representation (may differ from vocable)
  part_of_speech TEXT, -- e.g. "noun", "verb", "adjective"
  gender,              -- grammatical gender (NULL where not applicable)
  pronun_list          -- semicolon-separated pronunciation strings (IPA etc.)
);
CREATE UNIQUE INDEX entry_pkey ON entry(lexentry);

CREATE TABLE inflection_table(
  pos,          -- part of speech this table applies to
  rank,         -- display order of this cell in the paradigm table
  number,       -- grammatical number label (e.g. "singular", "plural")
  mood,         -- verb mood label
  person,       -- grammatical person label
  tense,        -- tense label
  voice,        -- voice label (active/passive)
  tense_name,   -- human-readable tense name for display
  "case",       -- grammatical case label
  definiteness  -- definiteness label (e.g. for Scandinavian/Slavic languages)
);

CREATE TABLE form(
  lexentry TEXT,        -- foreign key → entry.lexentry
  other_written_full,   -- full uninflected form (for compounds etc.)
  pos TEXT,             -- part of speech
  rank,                 -- position in inflection_table
  number TEXT,
  mood TEXT,
  person TEXT,
  tense TEXT,
  voice TEXT,
  "case" TEXT,
  definiteness TEXT,
  inflection TEXT,      -- the actual inflected surface form
  other_written         -- alternative written form for this inflection
);
CREATE INDEX form_lexentry_idx ON form(lexentry);

CREATE TABLE importance(
  vocable TEXT,          -- canonical lemma
  score,                 -- absolute frequency/importance score
  written_rep_guess      -- best guess at the written form for this vocable
);
CREATE UNIQUE INDEX imp_unique_vocable ON importance(vocable);
CREATE UNIQUE INDEX imp_unique_rep    ON importance(written_rep_guess);

CREATE TABLE rel_importance(
  vocable TEXT,          -- canonical lemma
  score,                 -- absolute score (same as importance.score)
  rel_score,             -- score relative to the most important word in this DB
  written_rep_guess      -- best guess at the written form
);
CREATE UNIQUE INDEX rel_imp_unique_rep ON rel_importance(written_rep_guess);
```

### Table roles

- **`entry`** — one row per lexeme. The authoritative list of all words in this language DB, with their POS and pronunciation.
- **`inflection_table`** — metadata describing which grammatical dimensions exist for each POS (e.g. a noun may have case × number; a verb may have tense × mood × person). Used to render a paradigm grid in the UI.
- **`form`** — the actual inflected forms. Each row is one cell in a paradigm table, linked to its lexentry. The `inflection` column holds the surface form to display.
- **`importance` / `rel_importance`** — frequency-based ranking data. `importance` stores raw scores; `rel_importance` adds a `rel_score` normalised within this language (1.0 = most important word). Used for sorting search results.

---

## Outlier 1 — `bg-ca.sqlite3` (Bulgarian → Catalan)

**Difference:** `sqlite_stat1` is declared last instead of first.

```sql
-- bg-ca order:
CREATE TABLE translation(...);
CREATE VIEW translation_grouped AS ...;
CREATE TABLE simple_translation(...);
CREATE TABLE sqlite_stat1(tbl, idx, stat);  -- ← at the end

-- standard order:
CREATE TABLE sqlite_stat1(tbl, idx, stat);  -- ← at the start
CREATE TABLE translation(...);
...
```

This is a declaration-order difference only. The schema is otherwise identical to Group 1. It indicates that `ANALYZE` was run on this database before the stat table was explicitly created via DDL (or the DB was assembled in a different order in the build pipeline). There is no functional impact.

---

## Outlier 2 — `sv.sqlite3` (Swedish)

**Difference:** Contains one extra table not present in any other monolingual DB.

```sql
CREATE TABLE gender(
  lexentry TEXT,  -- foreign key → entry.lexentry
  gender TEXT     -- grammatical gender value
);
```

All other columns in the standard schema are present and identical. The `gender` column already exists on the `entry` table in all monolingual DBs, but Swedish alone has this separate `gender` table — likely a remnant of an earlier schema version or a Swedish-specific data enrichment step where gender data was imported from a separate source before being merged into `entry`.
