# TASK-2.8: Change the style of one bot seat

Status: In review (judge pending) · Completed: 2026-11-22 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-009 · Branch: doit/TASK-2.8

## What was asked
Each bot row in Game Config's Opponents panel gets a style selector (Tight-aggressive, Calling station, Maniac, Rock). Changing one row changes only that bot. Start game passes the edited seats on, so the session's line-up name is Custom when any bot differs from the chosen preset, and the preset name when all match. Edited bots play their own style's policy. Spec: doit/TASK-2.8/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The AC's "seat 3" and "seats 1, 2, 4, 5" mean bot ROWS 1-5 of the Opponents list, not table seats. Row 3 = Cal at table seat 2 (Maniac -> Rock). | yes | Read as table seats the AC contradicts the code: table seat 3 is Dee (Rock) and seat 5 is the user. | Use table seats (impossible as written) |
| A-2 | Changing preset or players discards all per-seat edits; game type / stake changes keep them; Cancel discards them. | yes | TASK-2.5 locked "size or preset re-derives every row"; names move between seats on a size change. | Keep edits by name |
| A-3 | AC#4 tested with Tough at 6, row 2 (Ben); unit test also covers the Maniac row (Ava). | yes | Any seat satisfies it. | One seat only |
| A-4 | "Plays that style's own policy" is verified at model level through `handleAdviceRequest` (the worker's path), not by inferring style from browser actions. | yes | No DOM test environment; browser actions are flaky evidence. | Browser inference test |
| A-5 | The Custom / preset name is verified at model level via `configWithSeatStyle`; it is not shown in the UI. | yes | No visible output for the name in M1. | Hidden data attribute |

## Clarifications and decisions
- Q-1 (auto-accepted, unattended rule): each row ends with a visible label "Style" around a native select (accessible name "Style for <bot name>"); options Tight-aggressive, Calling station, Maniac, Rock; no "Random".
- Q-2 (auto-accepted, routine): seven locked earlier-story test edits (TASK-2.1 to 2.5) approved. Each only reads the third row cell from the selected option or scopes select counts to the Session panel; no expected value changed.
- D-1: native `<select>` per row, no `id`. D-2: `configWithSeatStyle` in `session.ts`; the screen folds edits over `configForLineUp`, so rows and Start game share one config. D-3: locked-test impact limited to the Q-2 edits.

## What was built
- `src/table/session.ts`: `BOT_STYLES` (frozen option order) and `configWithSeatStyle(config, preset, seat, style)`. It throws `RangeError` for an unknown style or a non-bot seat, and re-resolves the line-up name via the existing `lineUpSessionConfig` (Custom or preset).
- `src/ui/config/GameConfigScreen.tsx`: `edits` state, per-row style select (value checked with `isBotStyle`), edits cleared on preset or players change, Start game uses the edited config.
- `src/ui/styles.css`: `.config-style` label and select look (44 px, same as Session selects).
- New tests: `tests/table/seat-style.test.ts`, `tests/table/seat-style.acceptance.test.ts`, `tests/ui/game-config-seat-style.acceptance.test.tsx`, `e2e/seat-style.spec.ts`.
- Locked-test amendments (Q-2): `tests/ui/home`, `game-config-players`, `game-config-stake`, `game-config-lineup` acceptance tests; `e2e/game-type-choice`, `stake-choice`, `lineup-choice`.
- No engine, bots or advice changes; no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 07 | AC#1, AC#5 label | render acceptance (options, selected style, labels) | pass | gates/build-1.json |
| SPEC-02, 05, 08 | AC#2, AC#4 | model + unit tests | pass | gates/build-1.json |
| SPEC-04, 06 | AC#3, AC#5 | edited seat through `handleAdviceRequest` equals its style's policy and differs from TAG | pass | reviews/round-1/code.json |
| SPEC-03, 09, 10 | AC#1-4 | Playwright, Chromium + WebKit, axe, same-origin | pass (8 tests, both browsers) | build-log.md |
| SPEC-11 | earlier stories | `npm test`, `npm run e2e` | pass (156 passed / 12 skipped, twice) | build-log.md |
| SPEC-12 | lint/type/coverage | gate | pass (97.28% statements) | gates/fix-3.json |
| SPEC-13 | CI, doc | CI on branch; this doc | pending | n/a |
| SPEC-14 | N/A items | engine/bots/advice diff empty | pass per reviewer | reviews/round-1/code.json |

- Gate runs: build-1 PASS, fix-2 PASS, fix-3 FAIL. fix-3 fails only the test-integrity check "fewer assertions in e2e/seat-style.spec.ts (20 -> 19)", after the R1 fix replaced one-shot `expect` calls with `expect.poll` and added a test. It also warns the scope budget (653 vs 650 lines). Lint, typecheck, tests and coverage pass. The orchestrator needs to resolve this (re-snapshot or restore the count).
- Judge: see doit/TASK-2.8/judge/.

## Review
Round 1 (code + security): 0 blocking. Security: no findings (style value validated twice, no new storage, network or dependencies).
Both MINOR findings fixed in-story: a test for the players-change reset (mutation-checked: removing `setEdits({})` fails it in both browsers), and polling row reads in the e2e spec.

### Non-blocking review notes (deliberately not fixed)
- NIT: `useWorkerTimers` / `restorePausedTimers` / `axeWithPausedClock` copied from other e2e specs instead of living in `e2e/support` (existing project pattern). Not tracked.
- NIT: the SPEC-04 loop finishes the current hand before stopping on the first differing decision. Harmless.

## How to try it
`npm test`, `npm run e2e`, or `npm run build && npm run preview`, open http://localhost:4173, New game. Set Cal (Seat 2) to Rock and Start game: seat 2 shows Rock. Pick Tough, set Ben to Rock then Tight-aggressive, switch to Mixed and back (edits gone), Start game: seat 6 Maniac, others TAG.

## Run metrics
Questions 2 (auto-accepted) · assumptions 5 · review rounds 1 · judge rounds 0 so far · gate runs 3 (2 pass, 1 fail on assertion count) · escalations 0 · changed lines 653 (budget 650) across 14 files.

## Known limitations and follow-ups
- [trainer] The Custom line-up name is not visible anywhere in the UI (model level only). Check whether a statistics or session-history story shows it (TASK-11 / TASK-3.9) and add an AC there if not.
- [trainer] The storyboard's per-seat "Random" option is out of scope; TASK-2.9 randomises the whole line-up (owner: TASK-2.9).
- Not tracked (infra, below the value bar): copied axe/timer helpers in e2e specs (no failure caused).

## Lessons for the factory (proposals — not applied)
- The test-integrity gate counts `expect` calls, so converting `expect(...)` to `expect.poll(...)` or merging assertions during a review fix reads as "fewer assertions" and fails the gate (fix-3). Proposal: have the gate count `expect.poll` / `toPass` and treat the count as a floor on distinct locked assertions, or let a fix brief declare the expected new count.
- The 650-line scope budget was missed by 3 lines after a review fix; budget warnings after fixes could be tolerated within 10%.
