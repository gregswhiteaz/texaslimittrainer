---
id: doc-175
title: >-
  TASK-6.27: Close the remaining bot import gaps (type-position imports, advice
  path)
type: other
created_date: '2026-11-26T23:06:00Z'
updated_date: '2026-11-26T23:06:00Z'
---
# TASK-6.27: Close the remaining bot import gaps (type-position imports, advice path)

Status: Done · Completed: 2026-11-26 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-025.1 (context REQ-026.1) · Branch: doit/TASK-6.27

## What was asked
Close two holes in the TASK-6.21 bot import boundary. AC#1: a type-position import such as `import('../engine/hand').HandState` in `src/bots` must fail lint with the REQ-025.1 message. AC#2: decide how to treat the bots -> `src/advice` -> engine path. AC#3 was added mid-run (Q-2). Spec: doit/TASK-6.27/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | To reverse |
|---|---|---|---|
| A-1 | Type-position imports follow the `import type` allow-list. Any `engine/player-view` type passes. From `engine/hand` only `.Action`, `.SeatNumber` and `.Street` pass. Other engine modules and non-normalized specifiers fail. | yes | Edit the selectors |
| A-2 | Failures reuse `BOT_BOUNDARY_MESSAGE`. | yes | Add a dedicated message |
| A-3 | One new test file with a single sandbox `npm run lint`, plus in-process ESLint checks. The locked TASK-6.21 test is untouched. | yes | Extend the locked file after an unlock |
| A-4 | The AC#2 decision is recorded in the spec, a code comment, decision-3 and the final summary. The requirements doc is not edited. | yes | Add a note under REQ-025 |
| A-5 | The advice message `ADVICE_BOUNDARY_MESSAGE` is developer-facing only. | yes | Reword |

state.json logs 0 assumptions. The five above are in the spec's table.

## Clarifications and decisions
- **Q-1 (user: option a).** Bots may keep importing `src/advice`, with a lint guard. The alternatives were (b) bar bots from advice, which means rewriting all five styles, and (c) allow with no check.
- **D-3 (decision-3, accepted).** Bots may import `src/advice`. A lint block (`adviceHiddenStateConfig`) stops every advice file except `golden.ts` from importing engine hand state, and bots may not import `advice/golden`. Rationale: every bot builds on the advice engine (TAG plays it exactly, REQ-026.1). The path is safe today, because reachable advice takes only a `PlayerView` plus pure helpers, and only `golden.ts` touches hand state. A per-file guard against drift keeps REQ-025.1 mechanical without a rewrite.
- **Q-2 (user-approved scope change).** Review r1 found the rules only watched `engine/` paths, so bots and advice could still reach `table/session`, `storage/hand-store` and `playtest/runner`. The user chose to fix this here. Both import boundaries became allow-lists, and AC#3 was added.

## What was built
- `tools/lint/headless-boundary.js`:
  - `BOT_TYPE_IMPORT_SYNTAX` adds `TSImportType` selectors to the bot config.
  - `adviceHiddenStateConfig`, with `ADVICE_BOUNDARY_*` constants, allow-lists advice imports.
  - Bots are barred from `advice/golden`, including `.js`/`.ts` extensions, normalized paths and type-position forms.
  - Bot allow-list covers storage, table/session, table/hint and playtest.
  - FIX r2: `import.meta` is banned (covers `import.meta.glob`). Computed `globalThis[...]` access is banned. `no-eval`, `no-implied-eval` and `no-new-func` are on for bot code.
- `eslint.config.js` registers `adviceHiddenStateConfig`.
- `tests/toolchain/bot-import-gaps.acceptance.test.ts` (new) holds the acceptance tests.
- Nothing under `src/` changed. No new dependencies.

## How it was verified
| SPEC | Covers | Result |
|---|---|---|
| 01, 02 | Type-position imports fail with REQ-025.1 message; allowed PlayerView types pass | PASS |
| 03, 05 | Advice hidden-state guard; real `src/advice` and `src/bots` lint clean | PASS |
| 04 | Bots barred from `advice/golden` (variants) | PASS |
| 06, 08 | D-3 comment in code; decision-3 recorded | PASS |
| 07 | No `src/` change, locked test unchanged, lint and typecheck clean | PASS |
| AC#3 | Allow-list holdout probes (stats, ui, packages, table/session mixes) | PASS |

Full suite: 1497 tests passed (334 files), lint and typecheck exit 0. Judge round 1 PASS, with about 75 holdout bypass probes. Three gate runs. Acceptance test file: 17 asserts, 0 skips.

## Review
- r1: four MAJORs. Golden bypasses (`.js` extension, advice re-export), plus advice and bots reaching table/storage/playtest. Fixed through Q-2.
- r2: one MAJOR (`import.meta.glob`) plus MINORs. Fixed.
- r3: nothing blocking.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `Function` constructor via `.constructor` or `globalThis.Function` is not caught (also judge J-1-01).
- NIT: the type-position golden match is case-sensitive (judge J-1-03). Typecheck catches a miscased path.
- NIT: side-effect imports that bind nothing are unchecked in advice code.
- NIT: `SESSION_TYPE_NAMES` is repeated in a selector.
- Judge J-1-02 (LOW): the Node `global` alias is not restricted. The base behaves the same way.

## How to try it
`npx vitest run tests/toolchain/bot-import-gaps.acceptance.test.ts`, `npm run lint`, `npm test`.

## Run metrics
Questions 2 · assumptions logged 0 (5 in spec) · review rounds 3 · judge rounds 1 · gate runs 3 · escalations 1 · changed lines about 425 added and 4 removed in 3 files.

## Known limitations and follow-ups
- [trainer] Ban `.constructor` member access and `globalThis.Function` in bot and advice code (J-1-01).
- [trainer] Restrict the Node `global` alias like `globalThis` in headless and bot code (J-1-02).
- [trainer] Optional: make the type-position golden check case-insensitive, and flag side-effect imports in advice code.
- Existing task owner: none known; the orchestrator should file them against TASK-6.

## Lessons for the factory (proposals — not applied)
- Boundary specs should say up front whether a rule is an allow-list or a deny-list, and list non-`engine/` hidden-state modules (table, storage, playtest). That would have avoided the r1 escalation and the Q-2 scope change.
