# TASK-2.9: Randomise the bot line-up

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-009 (009.5, 009.6) · Branch: doit/TASK-2.9

## What was asked
Game Config's Opponents panel gets a "Randomise line-up" button. One press gives every bot seat a style drawn independently and uniformly from TAG, Calling station, Maniac and Rock. The styles show in the rows, Start game seats them, and the session's line-up is named Custom (or the preset's name if the draw equals the preset). Spec: doit/TASK-2.9/spec.md.

## Assumptions made without asking — please review
All four were logged under the unattended rule; Q-1 to Q-3 below were also auto-accepted (recommended option).
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A randomise sets an edit for every bot seat and replaces all earlier edits. Later row edits apply on top. A preset or players change still discards everything. Pressing again draws afresh. | yes | Fits the TASK-2.8 edits model; the draw covers every seat. | Keep earlier manual edits (contradicts "every bot seat") |
| A-2 | "Shows one of TAG, …" means the row's selected label; TAG's label is `Tight-aggressive`. | yes | TASK-2.8 Q-1 wording. | Rename option to "TAG" |
| A-3 | The 1,000 seeded draws use one `Xoshiro128(20261122)` stream at Mixed 6 players; each style count per seat is bounded 180–320 (expected 250). | yes | One stream is how the function is used; the bound catches a dropped or doubled style. | New seed per draw; only the ≥1 check |
| A-4 | The Custom line-up name is verified at model level (`configWithSeatStyles` + `configForGameType` + `seatSession`); the browser test checks rows and table styles. | yes | The name has no visible output in M1. | Add hidden markup carrying the name |

## Clarifications and decisions
- Q-1 (auto-accepted): each bot seat independently gets a uniform style via `word % 4`, words from `crypto.getRandomValues`, one 1-word call per seat, only when the button is pressed.
- Q-2 (auto-accepted): outline button "Randomise line-up" beside the Opponents heading, no confirmation, preset radio unchanged, rows update in place.
- Q-3 (auto-accepted, routine): insert 'Randomise line-up' after '← Home' in the button lists of four locked tests. Nothing else changed in them.
- Not done: per-seat "Random" option, showing "Custom" in the UI, remembering the line-up (TASK-2.10), undo.

## What was built
- `src/table/session.ts`: `randomBotStyles(config, nextWord)` returns a frozen seat→style map, one `BOT_STYLES[w % 4]` per bot in clockwise order; RangeError on a word outside 0..2^32-1. `configWithSeatStyles(config, preset, styles)` folds a map through `configWithSeatStyle`.
- `src/ui/config/GameConfigScreen.tsx`: the button in `.config-opponents-header`; press draws with `crypto.getRandomValues` and replaces all edits; `seated` uses `configWithSeatStyles`.
- `src/ui/styles.css`: header row (heading left, button right, wraps).
- Tests: `tests/table/randomise-lineup.test.ts`, `tests/table/randomise-lineup.acceptance.test.ts`, `tests/ui/game-config-randomise.acceptance.test.tsx`, `e2e/randomise-lineup.spec.ts`. Amended: `tests/ui/home.acceptance.test.tsx`, `tests/ui/game-config-game-type.acceptance.test.tsx`, `tests/ui/game-config-stake.acceptance.test.tsx`, `e2e/stake-choice.spec.ts`.
- No new dependencies; engine, bots and advice untouched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..06 | Button, 1,000-draw uniformity, Custom/preset naming, browser to table, edit replacement, render | unit, model acceptance, render acceptance, Playwright | Pass | gates/build-1.json, gates/fix-2.json |
| SPEC-07 | Word mapping, RangeErrors | unit | Pass | tests/table/randomise-lineup.test.ts |
| SPEC-08 | Earlier tests with Q-3 amendments only | npm test | Pass | gates/fix-2.json |
| SPEC-09 | Lint, typecheck, tests, coverage, boundary | gate | Pass | gates/fix-2.json |
| SPEC-10 | CI green, doc published | CI on branch; `backlog doc list` | Doc published here; CI not yet run at doc time | — |
| SPEC-11 | N/A DoD items | Judge | Judge: see doit/TASK-2.9/judge/ | — |

Gate runs: 2, both PASS (scope budget warn: 503 lines vs 500, fail above 1000). Judge: see doit/TASK-2.9/judge/.

## Review
Round 1: 0 blocking findings (code and security).

### Non-blocking review notes (deliberately not fixed)
- MINOR: the 9-player e2e test passes even if the button does nothing, because valid labels already show before the press. Wiring is covered by SPEC-04/05 at 6 players using a cycling 1-word stub. The file is locked.
- NIT: unit test cannot tell seat 3 from seat 4 (both Rock); SPEC-03 acceptance catches a swap.

## How to try it
`npm test`, `npm run lint`, `npx playwright test e2e/randomise-lineup.spec.ts`; or run the app, open Game Config and press "Randomise line-up".

## Run metrics
Questions 3 (auto-accepted) · assumptions 4 · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 503.

## Known limitations and follow-ups
None. The review notes above are not tracked.

## Lessons for the factory (proposals — not applied)
None; nothing went wrong or slow in this run.
