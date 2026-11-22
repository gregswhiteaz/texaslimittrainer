# TASK-2.2: Choose how many players sit at the table

Status: In review (judge pending) · Completed: 2026-11-22 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-005, REQ-015 · Branch: doit/TASK-2.2

## What was asked
Game Config's read-only "Players at the table" row becomes a choice of 2 to 10 players (user included), labelled
`2 (heads-up)`, `6 (6-max)`, `10 (full ring)`. For 3, 4, 5, 7 and 8 players the screen says advice is approximate and
names the reference size. Start game seats the user plus `size − 1` bots. Heads-up seat labels match the engine's
blinds. Position names at every size and review grading at 2 and 10 players get tests. Spec: doit/TASK-2.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Screen keeps the chosen size in local state (starts at `config.players`). While equal to `config.players` it shows and starts `config` as given; otherwise it uses `configForPlayers`. 6 → 2 → 6 restores default seating exactly. | yes | Keeps a future pre-filled config (TASK-2.10) and the locked default-flow tests intact. | Always rebuild via `configForPlayers` |
| A-2 | `configForPlayers` keeps `gameType`, `stake`, `speed`, `lineUp`; sets `players`, `seats`, `userSeat`, `button`. `lineUp` stays `'Custom'` for the default config. | yes | Line-up names belong to TASK-2.5. | Reset `lineUp` to a preset |
| A-3 | Note is `<p id="config-players-note">` after the select; select has `aria-describedby` only while the note shows. No live region. | yes | Read as the select's description; a live region is noisy for 9 options. | `role="status"` region |
| A-4 | AC#9 (review grading) proven at model level (vitest) at 2 and 10 players; browser review flow stays at 6. | yes | `gradeView` is pure; 10-seat layout belongs to TASK-3.16. | Playwright review at 2 and 10 |
| A-5 | `configForPlayers` throws `RangeError('Table size must be a whole number from 2 to 10')` for other sizes. | yes | Matches `seatLineUp`. | Clamp |

## Clarifications and decisions
Q-1 to Q-4 were auto-accepted (recommended option taken, no user answer):
- Q-1 Players control: native `<select>`, label "Players at the table", options 2 (heads-up), 3..5, 6 (6-max), 7..9, 10 (full ring), default 6.
- Q-2 Note wording: "Advice will be approximate (based on 6-max)." for 3/4/5/7; "(based on full ring)." for 8; none at 2/6/9/10.
- Q-3 Heads-up labels: button seat `Small blind`, other seat `Big blind`; the dealer disc still marks the button.
- Q-4 Seating for sizes other than 6 until TASK-2.5: user at seat min(5, n), bots ascending in `BOT_NAMES` order, **all TAG**, button = seat after the user. n = 6 is identical to today's defaults.

Q-5 (user-approved): amend five locked tests, dropdown counts/selection only: `tests/ui/home.acceptance.test.tsx` (2.1), `tests/ui/game-config-stake.acceptance.test.tsx` and `e2e/stake-choice.spec.ts` (2.3), `tests/ui/game-config-game-type.acceptance.test.tsx` and `e2e/game-type-choice.spec.ts` (2.4). Review confirmed the edits stay within that.

## What was built
- `src/table/session.ts` — `TABLE_SIZES` (frozen 2..10) and pure `configForPlayers(config, players)`.
- `src/table/table-view.ts` — `positionName`: heads-up button = `Small blind`, other = `Big blind`.
- `src/ui/config/GameConfigScreen.tsx` — `<select id="config-players">`, approximate note (via `referenceSizeOf` and `TABLE_SIZE_NAMES`), Opponents list and Start game follow the chosen size.
- `src/ui/styles.css` — `.config-note`.
- Tests: `tests/ui/game-config-players.acceptance.test.tsx`, `tests/table/table-size.acceptance.test.ts`, `e2e/players-choice.spec.ts`, plus unit edits in `session-config.test.ts` and `table-view.test.ts`, and the five Q-5 edits.
- No engine, bot or advice changes. Nothing is stored (TASK-2.10 owns remembering the size).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04 | Options, notes, Opponents list | SSR acceptance test | pass | game-config-players.acceptance.test.tsx |
| SPEC-05..09 | Seating, header, blinds/labels, positions 2..10, review at 2 and 10, size + type + stake | vitest acceptance | pass | table-size.acceptance.test.ts |
| SPEC-10/11 | Every size in the browser, heads-up blinds, axe | Playwright (Chromium + WebKit) | pass | players-choice.spec.ts |
| SPEC-12 | Bad sizes rejected, settings kept | unit | pass | session-config.test.ts |
| SPEC-13 | Earlier tests, default flow unchanged | full suites | pass | gates/fix-2.json |
| SPEC-14 | Lint, typecheck, tests, coverage | gate | pass | 676 tests passed, coverage 97.51% |
| SPEC-15 | Playtest at 2, 6, 10 | 10,000 hands, seed 42 | 0 invariant violations | build-log.md |
| SPEC-16/17 | CI, doc, N/A items | manual / judge | Judge: see doit/TASK-2.2/judge/ | |

- `npm test`: 187 files passed / 2 skipped; 676 tests passed / 14 skipped. `npm run e2e` ×2: 146 passed / 12 skipped.
- Gates: build #1 PASS (scope lines warn: 629 vs budget 560, mostly new test files), fix #2 PASS.

## Review
Round 1: no blocking findings (code and security reviewers). Security: tampered select values cannot leave 2..10; `configForPlayers` fails closed.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `e2e/players-choice.spec.ts` carries a 5th byte-identical copy of the `axeWithPausedClock` worker-timer helper (also in review, next-hand, table-display, action-bar specs).
- NIT: `REFERENCE_SIZE_TABLE` (GameConfigScreen.tsx:48) maps reference size to exact player count; name reads like a table of sizes. Suggested `REFERENCE_SIZE_PLAYERS`.
- NIT: hard-coded `[2, 6, 9, 10]` no-note list (line 56) does not explain why 9 has no note; suggested a comment naming the requirement.

## How to try it
`npm run dev`, open Game Config, pick a size under "Players at the table", Start game. Tests: `npm test`, `npm run e2e`, `npm run playtest -- --hands 10000 --seed 42 --size 10`.

## Run metrics
Questions 5 (4 auto-accepted) · assumptions 5 · review rounds 1 · judge rounds: pending · gate runs 2 · escalations 0 · changed lines 629 (14 files vs budget 15).

## Known limitations and follow-ups
- 10 seats may look crowded until the 10-seat layout (TASK-3.16).
- All bots are TAG at sizes other than 6 until line-up presets (TASK-2.5).
- Follow-up [trainer]: check TASK-2.5 owns line-up presets at any table size (2..10), replacing the interim all-TAG seating (Q-4).
- Follow-up [trainer]: check TASK-3.16 owns a usable 10-seat table layout.
- Not tracked (infra, below the value bar): move the copied `axeWithPausedClock` helper into `e2e/support`. It has not caused a failure.

## Lessons for the factory (proposals — not applied)
- Build exceeded the scope-lines budget (629 vs 560) because the spec budget did not count the three new test files and the copied helper; budget test lines separately when estimating.
