# TASK-10.6 — Questions and answers (autopilot, 2026-11-24)

## Q-1 — Data shape (persisted format) and one locked test
Options: (a) one list — 16 preflop entries appended after the 15 postflop entries in src/stats/leak-categories.json, ids `<group>-<action>` (e.g. `early-fold`), stored in the existing leakCounts, no format/version/DB change; the locked TASK-10.5 AC#2 exact-15-ids check runs over `street !== 'preflop'` [Recommended]; (b) separate preflop JSON + loader; (c) `preflop-` id prefix.
**Answer: auto-accepted (recommended)** — (a). tests/stats/leaks.acceptance.test.ts unlocked under TASK-10.5; the 15-id check is kept on the postflop subset (not dropped) and the builder should add an equal check that the 16 preflop ids are present.

## Q-2 — The 16 preflop titles, evidence names and one-sentence fixes (user-visible text)
Options: spec §5 table with justifications [Recommended]; "folds from the blinds" style evidence names; seat-naming titles.
**Answer: auto-accepted (recommended)** — spec §5 text. Listed for user review.
